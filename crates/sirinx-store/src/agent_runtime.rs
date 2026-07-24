//! Durable task, run, lease, and receipt persistence.
//!
//! The [`AgentRuntimeStore`] seam is intentionally separate from the web
//! funnel [`crate::Store`]. Runtime state has stricter compare-and-swap and
//! append-only invariants and must never inherit permissive compatibility
//! defaults intended for older store implementations.

use std::collections::BTreeMap;
use std::sync::{RwLock, RwLockReadGuard, RwLockWriteGuard};

use async_trait::async_trait;
use serde::de::DeserializeOwned;
use serde::Serialize;
use sha2::{Digest, Sha256};
use sqlx::postgres::PgRow;
use sqlx::{Postgres, Row, Transaction};

use sirinx_core::{
    canonical_receipt_bytes, ActionClass, AgentRun, AgentRuntimeError, AgentTask, LeaseState,
    ReceiptResult, RunReceipt, RunReceiptDraft, RuntimeState, StageLease, StateTransition,
    UnixMillis,
};

use crate::{AgentRuntimePostgresStore, MemoryStore};

/// Failure returned by the isolated agent-runtime persistence seam.
#[derive(Debug, thiserror::Error)]
pub enum AgentRuntimeStoreError {
    /// A requested durable record does not exist.
    #[error("{entity} {id} was not found")]
    NotFound { entity: &'static str, id: String },
    /// A stable identifier or idempotency key already belongs to another row.
    #[error("{entity} {id} already exists")]
    AlreadyExists { entity: &'static str, id: String },
    /// A compare-and-swap request observed stale state.
    #[error("{entity} {id} version conflict: expected {expected}, actual {actual}")]
    VersionConflict {
        entity: &'static str,
        id: String,
        expected: u64,
        actual: u64,
    },
    /// Another active writer owns an overlapping path or resource.
    #[error("lease {requested_lease_id} conflicts with active lease {active_lease_id}")]
    LeaseConflict {
        requested_lease_id: String,
        active_lease_id: String,
    },
    /// Receipt linkage or a stored canonical hash is invalid.
    #[error("receipt chain for task {task_id} is invalid")]
    ReceiptChainInvalid { task_id: String },
    /// Success finalization made the task receipt chain immutable.
    #[error("receipt chain for task {task_id} is finalized in state {state:?}")]
    ReceiptChainFinalized {
        task_id: String,
        state: RuntimeState,
    },
    /// A receipt does not describe the run selected by its stable IDs.
    #[error("receipt {receipt_id} does not match its durable run")]
    ReceiptRunMismatch { receipt_id: String },
    /// A state change is missing the durable evidence it promises.
    #[error("{entity} {id} is missing required evidence: {evidence}")]
    MissingEvidence {
        entity: &'static str,
        id: String,
        evidence: &'static str,
    },
    /// A durable row is not in the state required by this operation.
    #[error("{entity} {id} must be {expected:?}, found {actual:?}")]
    StateMismatch {
        entity: &'static str,
        id: String,
        expected: RuntimeState,
        actual: RuntimeState,
    },
    /// A create call attempted to import non-initial state.
    #[error("{entity} must be created in DRAFT state at version one")]
    InvalidInitialState { entity: &'static str },
    /// A run action class cannot authorize a source-mutating lease.
    #[error("run {run_id} action class {action_class:?} cannot authorize source write")]
    SourceWriteActionNotAllowed {
        run_id: String,
        action_class: ActionClass,
    },
    /// Domain validation rejected the mutation before persistence.
    #[error(transparent)]
    Domain(#[from] AgentRuntimeError),
    /// The concrete backend failed closed.
    #[error("agent-runtime backend error: {0}")]
    Backend(String),
}

/// Immutable evidence for one accepted task or run state transition.
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentRuntimeEvent {
    /// Owning task.
    pub task_id: String,
    /// Run being changed, or `None` for a task transition.
    pub run_id: Option<String>,
    /// One-based sequence serialized under the task row lock.
    pub event_sequence: u64,
    /// State observed before the mutation.
    pub from_state: RuntimeState,
    /// State committed by the mutation.
    pub to_state: RuntimeState,
    /// CAS version committed on the changed entity.
    pub entity_version: u64,
    /// Caller principal claim bound by the authentication layer and copied by
    /// the store; the ledger does not itself prove authentication.
    pub actor_principal_id: String,
    /// Bounded blocker copied from the transition, when present.
    pub blocker: Option<String>,
    /// Caller-supplied UTC timestamp committed with the transition.
    pub occurred_at_unix_ms: UnixMillis,
}

/// Separate durable authority for agent-runtime state.
#[async_trait]
pub trait AgentRuntimeStore: Send + Sync {
    /// Inserts a version-one draft task and rejects duplicate idempotency keys.
    async fn create_task(&self, task: &AgentTask) -> Result<AgentTask, AgentRuntimeStoreError>;

    /// Loads one task by stable `TASK-...` identifier.
    async fn get_task(&self, task_id: &str) -> Result<Option<AgentTask>, AgentRuntimeStoreError>;

    /// Atomically applies an ordered task transition when the version matches.
    async fn transition_task(
        &self,
        task_id: &str,
        transition: &StateTransition,
    ) -> Result<AgentTask, AgentRuntimeStoreError>;

    /// Inserts a version-one draft run under an existing task.
    async fn create_run(&self, run: &AgentRun) -> Result<AgentRun, AgentRuntimeStoreError>;

    /// Loads one run by stable `RUN-...` identifier.
    async fn get_run(&self, run_id: &str) -> Result<Option<AgentRun>, AgentRuntimeStoreError>;

    /// Atomically applies an ordered run transition when the version matches.
    async fn transition_run(
        &self,
        run_id: &str,
        transition: &StateTransition,
    ) -> Result<AgentRun, AgentRuntimeStoreError>;

    /// Acquires exact paths/resources after expiring missed-heartbeat leases.
    async fn acquire_lease(
        &self,
        lease: &StageLease,
        now_unix_ms: UnixMillis,
    ) -> Result<StageLease, AgentRuntimeStoreError>;

    /// Loads one lease without implicitly extending it.
    async fn get_lease(&self, lease_id: &str)
        -> Result<Option<StageLease>, AgentRuntimeStoreError>;

    /// Extends an unexpired lease using its one-based CAS version.
    async fn heartbeat_lease(
        &self,
        lease_id: &str,
        expected_version: u64,
        now_unix_ms: UnixMillis,
        heartbeat_due_at_unix_ms: UnixMillis,
        expires_at_unix_ms: UnixMillis,
    ) -> Result<StageLease, AgentRuntimeStoreError>;

    /// Releases an active, unexpired lease using its CAS version.
    async fn release_lease(
        &self,
        lease_id: &str,
        expected_version: u64,
        now_unix_ms: UnixMillis,
    ) -> Result<StageLease, AgentRuntimeStoreError>;

    /// Appends a receipt after deriving its predecessor and SHA-256 hash.
    async fn append_receipt(
        &self,
        draft: &RunReceiptDraft,
    ) -> Result<RunReceipt, AgentRuntimeStoreError>;

    /// Returns an ordered receipt chain only after verifying every link/hash.
    async fn receipts_for_task(
        &self,
        task_id: &str,
    ) -> Result<Vec<RunReceipt>, AgentRuntimeStoreError>;

    /// Returns the immutable transition ledger in per-task sequence order.
    async fn events_for_task(
        &self,
        task_id: &str,
    ) -> Result<Vec<AgentRuntimeEvent>, AgentRuntimeStoreError>;
}

#[derive(Default)]
pub(crate) struct AgentRuntimeMemory {
    inner: RwLock<MemoryState>,
}

#[derive(Default)]
struct MemoryState {
    tasks: BTreeMap<String, AgentTask>,
    task_idempotency: BTreeMap<String, String>,
    runs: BTreeMap<String, AgentRun>,
    leases: BTreeMap<String, StageLease>,
    receipts: Vec<RunReceipt>,
    events: Vec<AgentRuntimeEvent>,
    event_sequences: BTreeMap<String, u64>,
}

impl AgentRuntimeMemory {
    fn read(&self) -> Result<RwLockReadGuard<'_, MemoryState>, AgentRuntimeStoreError> {
        self.inner
            .read()
            .map_err(|_| AgentRuntimeStoreError::Backend("memory lock poisoned".into()))
    }

    fn write(&self) -> Result<RwLockWriteGuard<'_, MemoryState>, AgentRuntimeStoreError> {
        self.inner
            .write()
            .map_err(|_| AgentRuntimeStoreError::Backend("memory lock poisoned".into()))
    }
}

#[async_trait]
impl AgentRuntimeStore for MemoryStore {
    async fn create_task(&self, task: &AgentTask) -> Result<AgentTask, AgentRuntimeStoreError> {
        task.validate()?;
        require_initial_state("task", task.state, task.version)?;
        let mut state = self.agent_runtime.write()?;
        if state.tasks.contains_key(&task.task_id) {
            return Err(already_exists("task", &task.task_id));
        }
        if state.task_idempotency.contains_key(&task.idempotency_key) {
            return Err(already_exists(
                "task idempotency key",
                &task.idempotency_key,
            ));
        }
        state
            .task_idempotency
            .insert(task.idempotency_key.clone(), task.task_id.clone());
        state.tasks.insert(task.task_id.clone(), task.clone());
        Ok(task.clone())
    }

    async fn get_task(&self, task_id: &str) -> Result<Option<AgentTask>, AgentRuntimeStoreError> {
        Ok(self.agent_runtime.read()?.tasks.get(task_id).cloned())
    }

    async fn transition_task(
        &self,
        task_id: &str,
        transition: &StateTransition,
    ) -> Result<AgentTask, AgentRuntimeStoreError> {
        transition.validate()?;
        let mut state = self.agent_runtime.write()?;
        if !state.tasks.contains_key(task_id) {
            return Err(not_found("task", task_id));
        }
        if transition.next_state == RuntimeState::Leased
            && !state
                .leases
                .values()
                .any(|lease| lease.task_id == task_id && lease.is_active_at(transition.at_unix_ms))
        {
            return Err(missing_evidence("task", task_id, "active stage lease"));
        }
        if matches!(
            transition.next_state,
            RuntimeState::Receipted | RuntimeState::Succeeded
        ) {
            let leases = state.leases.values().cloned().collect::<Vec<_>>();
            require_verified_task_pass(task_id, &state.receipts, &leases)?;
        }
        let (from_state, task) = {
            let task = state
                .tasks
                .get_mut(task_id)
                .ok_or_else(|| not_found("task", task_id))?;
            require_version("task", task_id, transition.expected_version, task.version)?;
            let from_state = task.state;
            task.apply_transition(transition)
                .map_err(map_domain_error)?;
            (from_state, task.clone())
        };
        record_memory_event(
            &mut state,
            task_id,
            None,
            from_state,
            task.version,
            transition,
        )?;
        Ok(task)
    }

    async fn create_run(&self, run: &AgentRun) -> Result<AgentRun, AgentRuntimeStoreError> {
        run.validate()?;
        require_initial_state("run", run.state, run.version)?;
        let mut state = self.agent_runtime.write()?;
        if !state.tasks.contains_key(&run.task_id) {
            return Err(not_found("task", &run.task_id));
        }
        if state.runs.contains_key(&run.run_id) {
            return Err(already_exists("run", &run.run_id));
        }
        state.runs.insert(run.run_id.clone(), run.clone());
        Ok(run.clone())
    }

    async fn get_run(&self, run_id: &str) -> Result<Option<AgentRun>, AgentRuntimeStoreError> {
        Ok(self.agent_runtime.read()?.runs.get(run_id).cloned())
    }

    async fn transition_run(
        &self,
        run_id: &str,
        transition: &StateTransition,
    ) -> Result<AgentRun, AgentRuntimeStoreError> {
        transition.validate()?;
        let mut state = self.agent_runtime.write()?;
        let snapshot = state
            .runs
            .get(run_id)
            .cloned()
            .ok_or_else(|| not_found("run", run_id))?;
        require_version("run", run_id, transition.expected_version, snapshot.version)?;
        let receipt_id = match transition.next_state {
            RuntimeState::Leased => {
                let has_active_lease = state.leases.values().any(|lease| {
                    lease.run_id == run_id && lease.is_active_at(transition.at_unix_ms)
                });
                if !has_active_lease {
                    return Err(missing_evidence("run", run_id, "active stage lease"));
                }
                None
            }
            RuntimeState::Receipted => Some(require_verified_run_pass(
                &snapshot.task_id,
                run_id,
                &state.receipts,
                &state.leases.values().cloned().collect::<Vec<_>>(),
            )?),
            RuntimeState::Succeeded => {
                let receipt_id = snapshot
                    .result_receipt_id
                    .as_deref()
                    .ok_or_else(|| missing_evidence("run", run_id, "bound PASS receipt"))?;
                let verified = require_verified_run_pass(
                    &snapshot.task_id,
                    run_id,
                    &state.receipts,
                    &state.leases.values().cloned().collect::<Vec<_>>(),
                )?;
                if verified != receipt_id {
                    return Err(missing_evidence("run", run_id, "bound PASS receipt"));
                }
                None
            }
            _ => None,
        };
        let mut run = snapshot;
        let from_state = run.state;
        if let Some(receipt_id) = receipt_id {
            run.result_receipt_id = Some(receipt_id);
        }
        run.apply_transition(transition).map_err(map_domain_error)?;
        state.runs.insert(run_id.into(), run.clone());
        record_memory_event(
            &mut state,
            &run.task_id,
            Some(run_id),
            from_state,
            run.version,
            transition,
        )?;
        Ok(run)
    }

    async fn acquire_lease(
        &self,
        lease: &StageLease,
        now_unix_ms: UnixMillis,
    ) -> Result<StageLease, AgentRuntimeStoreError> {
        lease.validate_for_acquire()?;
        if now_unix_ms < lease.issued_at_unix_ms {
            return Err(AgentRuntimeError::InvalidTimestampOrder.into());
        }
        if !lease.is_active_at(now_unix_ms) {
            return Err(AgentRuntimeError::LeaseExpired.into());
        }

        let mut state = self.agent_runtime.write()?;
        expire_memory_leases(&mut state, now_unix_ms)?;
        let run = state
            .runs
            .get(&lease.run_id)
            .ok_or_else(|| not_found("run", &lease.run_id))?;
        if run.state != RuntimeState::Queued {
            return Err(AgentRuntimeStoreError::StateMismatch {
                entity: "run",
                id: run.run_id.clone(),
                expected: RuntimeState::Queued,
                actual: run.state,
            });
        }
        if run.task_id != lease.task_id
            || run.role_id != lease.role_id
            || run.principal_id != lease.principal_id
        {
            return Err(AgentRuntimeStoreError::Backend(
                "lease identity does not match run".into(),
            ));
        }
        if lease.source_write && !matches!(run.action_class, ActionClass::B | ActionClass::C) {
            return Err(AgentRuntimeStoreError::SourceWriteActionNotAllowed {
                run_id: run.run_id.clone(),
                action_class: run.action_class,
            });
        }
        if state.leases.contains_key(&lease.lease_id) {
            return Err(already_exists("lease", &lease.lease_id));
        }
        if state
            .leases
            .values()
            .any(|existing| existing.nonce_digest == lease.nonce_digest)
        {
            return Err(already_exists("lease nonce digest", &lease.nonce_digest));
        }
        if let Some(existing) = state
            .leases
            .values()
            .find(|existing| existing.is_active_at(now_unix_ms) && existing.conflicts_with(lease))
        {
            return Err(AgentRuntimeStoreError::LeaseConflict {
                requested_lease_id: lease.lease_id.clone(),
                active_lease_id: existing.lease_id.clone(),
            });
        }
        state.leases.insert(lease.lease_id.clone(), lease.clone());
        Ok(lease.clone())
    }

    async fn get_lease(
        &self,
        lease_id: &str,
    ) -> Result<Option<StageLease>, AgentRuntimeStoreError> {
        Ok(self.agent_runtime.read()?.leases.get(lease_id).cloned())
    }

    async fn heartbeat_lease(
        &self,
        lease_id: &str,
        expected_version: u64,
        now_unix_ms: UnixMillis,
        heartbeat_due_at_unix_ms: UnixMillis,
        expires_at_unix_ms: UnixMillis,
    ) -> Result<StageLease, AgentRuntimeStoreError> {
        let mut state = self.agent_runtime.write()?;
        let lease = state
            .leases
            .get_mut(lease_id)
            .ok_or_else(|| not_found("lease", lease_id))?;
        require_version("lease", lease_id, expected_version, lease.version)?;
        lease
            .heartbeat(
                expected_version,
                now_unix_ms,
                heartbeat_due_at_unix_ms,
                expires_at_unix_ms,
            )
            .map_err(map_domain_error)?;
        Ok(lease.clone())
    }

    async fn release_lease(
        &self,
        lease_id: &str,
        expected_version: u64,
        now_unix_ms: UnixMillis,
    ) -> Result<StageLease, AgentRuntimeStoreError> {
        let mut state = self.agent_runtime.write()?;
        let lease = state
            .leases
            .get_mut(lease_id)
            .ok_or_else(|| not_found("lease", lease_id))?;
        require_version("lease", lease_id, expected_version, lease.version)?;
        lease
            .release(expected_version, now_unix_ms)
            .map_err(map_domain_error)?;
        Ok(lease.clone())
    }

    async fn append_receipt(
        &self,
        draft: &RunReceiptDraft,
    ) -> Result<RunReceipt, AgentRuntimeStoreError> {
        draft.validate()?;
        let mut state = self.agent_runtime.write()?;
        let task = state
            .tasks
            .get(&draft.task_id)
            .ok_or_else(|| not_found("task", &draft.task_id))?;
        if matches!(
            task.state,
            RuntimeState::Receipted | RuntimeState::Succeeded
        ) {
            return Err(AgentRuntimeStoreError::ReceiptChainFinalized {
                task_id: draft.task_id.clone(),
                state: task.state,
            });
        }
        let run = state
            .runs
            .get(&draft.run_id)
            .ok_or_else(|| not_found("run", &draft.run_id))?;
        if run.task_id != draft.task_id
            || run.role_id != draft.role_id
            || run.principal_id != draft.principal_id
            || !receipt_result_allowed(run.state, draft.result)
        {
            return Err(AgentRuntimeStoreError::ReceiptRunMismatch {
                receipt_id: draft.receipt_id.clone(),
            });
        }
        if state.receipts.iter().any(|receipt| {
            receipt.draft.receipt_id == draft.receipt_id || receipt.draft.run_id == draft.run_id
        }) {
            return Err(already_exists("receipt", &draft.receipt_id));
        }
        verify_task_receipt_chain(&draft.task_id, &state.receipts)?;
        let checker = require_independent_pass(draft, &state.receipts)?;
        let leases = state.leases.values().cloned().collect::<Vec<_>>();
        require_pass_lease_evidence(draft, checker, &leases)?;
        let previous = state
            .receipts
            .iter()
            .rev()
            .find(|receipt| receipt.draft.task_id == draft.task_id)
            .map(|receipt| receipt.receipt_hash.clone());
        let receipt = build_receipt(draft.clone(), previous)?;
        state.receipts.push(receipt.clone());
        Ok(receipt)
    }

    async fn receipts_for_task(
        &self,
        task_id: &str,
    ) -> Result<Vec<RunReceipt>, AgentRuntimeStoreError> {
        let state = self.agent_runtime.read()?;
        verify_task_receipt_chain(task_id, &state.receipts)?;
        Ok(state
            .receipts
            .iter()
            .filter(|receipt| receipt.draft.task_id == task_id)
            .cloned()
            .collect())
    }

    async fn events_for_task(
        &self,
        task_id: &str,
    ) -> Result<Vec<AgentRuntimeEvent>, AgentRuntimeStoreError> {
        Ok(self
            .agent_runtime
            .read()?
            .events
            .iter()
            .filter(|event| event.task_id == task_id)
            .cloned()
            .collect())
    }
}

fn require_initial_state(
    entity: &'static str,
    state: RuntimeState,
    version: u64,
) -> Result<(), AgentRuntimeStoreError> {
    if state == RuntimeState::Draft && version == 1 {
        Ok(())
    } else {
        Err(AgentRuntimeStoreError::InvalidInitialState { entity })
    }
}

fn require_version(
    entity: &'static str,
    id: &str,
    expected: u64,
    actual: u64,
) -> Result<(), AgentRuntimeStoreError> {
    if expected == actual {
        Ok(())
    } else {
        Err(AgentRuntimeStoreError::VersionConflict {
            entity,
            id: id.into(),
            expected,
            actual,
        })
    }
}

fn expire_memory_leases(
    state: &mut MemoryState,
    now_unix_ms: UnixMillis,
) -> Result<(), AgentRuntimeStoreError> {
    let expired: Vec<_> = state
        .leases
        .iter()
        .filter(|(_, lease)| lease.state == LeaseState::Active && !lease.is_active_at(now_unix_ms))
        .map(|(lease_id, lease)| (lease_id.clone(), lease.version))
        .collect();
    if expired.iter().any(|(_, version)| *version == u64::MAX) {
        return Err(AgentRuntimeError::VersionOverflow.into());
    }
    for (lease_id, version) in expired {
        if let Some(lease) = state.leases.get_mut(&lease_id) {
            lease.state = LeaseState::Expired;
            lease.version = version + 1;
        }
    }
    Ok(())
}

fn build_receipt(
    draft: RunReceiptDraft,
    previous_receipt_hash: Option<String>,
) -> Result<RunReceipt, AgentRuntimeStoreError> {
    let bytes = canonical_receipt_bytes(&draft, previous_receipt_hash.as_deref())?;
    let receipt_hash = format!("{:x}", Sha256::digest(bytes));
    let receipt = RunReceipt {
        previous_receipt_hash,
        draft,
        receipt_hash,
    };
    receipt.validate()?;
    if !verify_receipt_hash(&receipt)? {
        return Err(AgentRuntimeStoreError::ReceiptChainInvalid {
            task_id: receipt.draft.task_id.clone(),
        });
    }
    Ok(receipt)
}

/// Recomputes a stored receipt's canonical SHA-256.
pub fn verify_receipt_hash(receipt: &RunReceipt) -> Result<bool, AgentRuntimeStoreError> {
    receipt.validate()?;
    let bytes = canonical_receipt_bytes(&receipt.draft, receipt.previous_receipt_hash.as_deref())?;
    Ok(receipt.receipt_hash == format!("{:x}", Sha256::digest(bytes)))
}

fn verify_task_receipt_chain(
    task_id: &str,
    receipts: &[RunReceipt],
) -> Result<(), AgentRuntimeStoreError> {
    let mut previous: Option<&str> = None;
    for receipt in receipts
        .iter()
        .filter(|receipt| receipt.draft.task_id == task_id)
    {
        if receipt.previous_receipt_hash.as_deref() != previous || !verify_receipt_hash(receipt)? {
            return Err(AgentRuntimeStoreError::ReceiptChainInvalid {
                task_id: task_id.into(),
            });
        }
        previous = Some(&receipt.receipt_hash);
    }
    Ok(())
}

fn receipt_result_allowed(state: RuntimeState, result: ReceiptResult) -> bool {
    match result {
        ReceiptResult::Pass => state == RuntimeState::Verifying,
        ReceiptResult::Fail => matches!(state, RuntimeState::Verifying | RuntimeState::Failed),
        ReceiptResult::Blocked => state == RuntimeState::Blocked,
        ReceiptResult::Unverified => {
            matches!(state, RuntimeState::Checking | RuntimeState::Verifying)
        }
        ReceiptResult::Canceled => state == RuntimeState::Canceled,
        ReceiptResult::EffectUnknown => state == RuntimeState::EffectUnknown,
    }
}

fn require_verified_task_pass(
    task_id: &str,
    receipts: &[RunReceipt],
    leases: &[StageLease],
) -> Result<(), AgentRuntimeStoreError> {
    verify_task_receipt_chain(task_id, receipts)?;
    let receipt = receipts
        .iter()
        .rev()
        .find(|receipt| receipt.draft.task_id == task_id)
        .filter(|receipt| receipt.draft.result == ReceiptResult::Pass)
        .ok_or_else(|| missing_evidence("task", task_id, "verified PASS receipt"))?;
    if receipt.draft.role_id == 42 {
        return Err(missing_evidence(
            "task",
            task_id,
            "independently verified maker PASS receipt",
        ));
    }
    let position = receipts
        .iter()
        .position(|candidate| candidate.draft.receipt_id == receipt.draft.receipt_id)
        .ok_or_else(|| missing_evidence("task", task_id, "verified PASS receipt"))?;
    let checker = require_independent_pass(&receipt.draft, &receipts[..position])?;
    require_pass_lease_evidence(&receipt.draft, checker, leases)
}

fn require_verified_run_pass(
    task_id: &str,
    run_id: &str,
    receipts: &[RunReceipt],
    leases: &[StageLease],
) -> Result<String, AgentRuntimeStoreError> {
    verify_task_receipt_chain(task_id, receipts)?;
    let (position, receipt) = receipts
        .iter()
        .enumerate()
        .find(|receipt| {
            receipt.1.draft.task_id == task_id
                && receipt.1.draft.run_id == run_id
                && receipt.1.draft.result == ReceiptResult::Pass
        })
        .ok_or_else(|| missing_evidence("run", run_id, "verified PASS receipt"))?;
    let checker = require_independent_pass(&receipt.draft, &receipts[..position])?;
    require_pass_lease_evidence(&receipt.draft, checker, leases)?;
    Ok(receipt.draft.receipt_id.clone())
}

fn require_independent_pass<'a>(
    draft: &RunReceiptDraft,
    prior_receipts: &'a [RunReceipt],
) -> Result<Option<&'a RunReceipt>, AgentRuntimeStoreError> {
    if draft.result != ReceiptResult::Pass {
        return Ok(None);
    }
    match draft.role_id {
        42 if draft.verification_receipt_id.is_none() => return Ok(None),
        42 => {
            return Err(AgentRuntimeStoreError::ReceiptRunMismatch {
                receipt_id: draft.receipt_id.clone(),
            });
        }
        37..=41 => {}
        _ => {
            return Err(AgentRuntimeStoreError::ReceiptRunMismatch {
                receipt_id: draft.receipt_id.clone(),
            });
        }
    }
    let verification_receipt_id = draft.verification_receipt_id.as_deref().ok_or_else(|| {
        missing_evidence(
            "receipt",
            &draft.receipt_id,
            "prior independent checker PASS receipt",
        )
    })?;
    let checker = prior_receipts
        .iter()
        .find(|receipt| receipt.draft.receipt_id == verification_receipt_id)
        .ok_or_else(|| {
            missing_evidence(
                "receipt",
                &draft.receipt_id,
                "prior independent checker PASS receipt",
            )
        })?;
    if checker.draft.result != ReceiptResult::Pass
        || checker.draft.role_id != 42
        || checker.draft.task_id != draft.task_id
        || checker.draft.run_id == draft.run_id
        || checker.draft.principal_id == draft.principal_id
        || checker.draft.commit_sha != draft.commit_sha
        || checker.draft.plan_hash != draft.plan_hash
        || checker.draft.scope_hash != draft.scope_hash
        || checker.draft.action_digest != draft.action_digest
        || !verify_receipt_hash(checker)?
    {
        return Err(missing_evidence(
            "receipt",
            &draft.receipt_id,
            "prior independent checker PASS receipt",
        ));
    }
    Ok(Some(checker))
}

fn require_pass_lease_evidence(
    draft: &RunReceiptDraft,
    checker: Option<&RunReceipt>,
    leases: &[StageLease],
) -> Result<(), AgentRuntimeStoreError> {
    if draft.result != ReceiptResult::Pass {
        return Ok(());
    }
    let maker_lease = leases.iter().find(|lease| {
        lease.task_id == draft.task_id
            && lease.run_id == draft.run_id
            && lease.role_id == draft.role_id
            && lease.principal_id == draft.principal_id
    });
    let maker_lease = maker_lease
        .ok_or_else(|| missing_evidence("run", &draft.run_id, "distinct persisted stage lease"))?;
    if let Some(checker) = checker {
        let checker_lease = leases
            .iter()
            .find(|lease| {
                lease.task_id == checker.draft.task_id
                    && lease.run_id == checker.draft.run_id
                    && lease.role_id == checker.draft.role_id
                    && lease.principal_id == checker.draft.principal_id
            })
            .ok_or_else(|| {
                missing_evidence(
                    "run",
                    &checker.draft.run_id,
                    "distinct persisted stage lease",
                )
            })?;
        if checker_lease.lease_id == maker_lease.lease_id {
            return Err(missing_evidence(
                "receipt",
                &draft.receipt_id,
                "distinct maker and checker stage leases",
            ));
        }
    }
    Ok(())
}

fn record_memory_event(
    state: &mut MemoryState,
    task_id: &str,
    run_id: Option<&str>,
    from_state: RuntimeState,
    entity_version: u64,
    transition: &StateTransition,
) -> Result<(), AgentRuntimeStoreError> {
    let sequence = state.event_sequences.entry(task_id.into()).or_default();
    *sequence = sequence
        .checked_add(1)
        .ok_or(AgentRuntimeError::VersionOverflow)?;
    state.events.push(AgentRuntimeEvent {
        task_id: task_id.into(),
        run_id: run_id.map(Into::into),
        event_sequence: *sequence,
        from_state,
        to_state: transition.next_state,
        entity_version,
        actor_principal_id: transition.actor_principal_id.clone(),
        blocker: transition.blocker.clone(),
        occurred_at_unix_ms: transition.at_unix_ms,
    });
    Ok(())
}

fn map_domain_error(error: AgentRuntimeError) -> AgentRuntimeStoreError {
    match error {
        AgentRuntimeError::VersionConflict { expected, actual } => AgentRuntimeStoreError::Backend(
            format!("domain CAS escaped store check: expected {expected}, actual {actual}"),
        ),
        other => AgentRuntimeStoreError::Domain(other),
    }
}

fn not_found(entity: &'static str, id: &str) -> AgentRuntimeStoreError {
    AgentRuntimeStoreError::NotFound {
        entity,
        id: id.into(),
    }
}

fn already_exists(entity: &'static str, id: &str) -> AgentRuntimeStoreError {
    AgentRuntimeStoreError::AlreadyExists {
        entity,
        id: id.into(),
    }
}

fn missing_evidence(
    entity: &'static str,
    id: &str,
    evidence: &'static str,
) -> AgentRuntimeStoreError {
    AgentRuntimeStoreError::MissingEvidence {
        entity,
        id: id.into(),
        evidence,
    }
}

fn backend(error: impl ToString) -> AgentRuntimeStoreError {
    AgentRuntimeStoreError::Backend(error.to_string())
}

fn insert_error(entity: &'static str, id: &str, error: sqlx::Error) -> AgentRuntimeStoreError {
    if error
        .as_database_error()
        .and_then(|database_error| database_error.code())
        .is_some_and(|code| code == "23505")
    {
        already_exists(entity, id)
    } else {
        backend(error)
    }
}

fn to_db_i64(field: &'static str, value: u64) -> Result<i64, AgentRuntimeStoreError> {
    i64::try_from(value).map_err(|_| backend(format!("{field} exceeds Postgres bigint")))
}

fn from_db_u64(field: &'static str, value: i64) -> Result<u64, AgentRuntimeStoreError> {
    u64::try_from(value).map_err(|_| backend(format!("invalid negative {field}")))
}

fn enum_text<T: Serialize>(value: &T) -> Result<String, AgentRuntimeStoreError> {
    match serde_json::to_value(value).map_err(backend)? {
        serde_json::Value::String(value) => Ok(value),
        other => Err(backend(format!(
            "expected a string-serialized runtime enum, got {other}"
        ))),
    }
}

fn enum_value<T: DeserializeOwned>(value: String) -> Result<T, AgentRuntimeStoreError> {
    serde_json::from_value(serde_json::Value::String(value)).map_err(backend)
}

fn row_to_task(row: &PgRow) -> Result<AgentTask, AgentRuntimeStoreError> {
    let task = AgentTask {
        task_id: row.try_get("task_id").map_err(backend)?,
        envelope: row.try_get("envelope").map_err(backend)?,
        idempotency_key: row.try_get("idempotency_key").map_err(backend)?,
        state: enum_value(row.try_get("state").map_err(backend)?)?,
        version: from_db_u64("task version", row.try_get("version").map_err(backend)?)?,
        created_at_unix_ms: row.try_get("created_at_unix_ms").map_err(backend)?,
        updated_at_unix_ms: row.try_get("updated_at_unix_ms").map_err(backend)?,
    };
    task.validate()?;
    Ok(task)
}

fn row_to_run(row: &PgRow) -> Result<AgentRun, AgentRuntimeStoreError> {
    let attempt = row.try_get::<i32, _>("attempt").map_err(backend)?;
    let role_id = row.try_get::<i16, _>("role_id").map_err(backend)?;
    let run = AgentRun {
        run_id: row.try_get("run_id").map_err(backend)?,
        task_id: row.try_get("task_id").map_err(backend)?,
        stage_id: row.try_get("stage_id").map_err(backend)?,
        role_id: u16::try_from(role_id).map_err(|_| backend("invalid role_id"))?,
        principal_id: row.try_get("principal_id").map_err(backend)?,
        action_class: enum_value(row.try_get("action_class").map_err(backend)?)?,
        state: enum_value(row.try_get("state").map_err(backend)?)?,
        attempt: u32::try_from(attempt).map_err(|_| backend("invalid run attempt"))?,
        version: from_db_u64("run version", row.try_get("version").map_err(backend)?)?,
        blocker: row.try_get("blocker").map_err(backend)?,
        result_receipt_id: row.try_get("result_receipt_id").map_err(backend)?,
        created_at_unix_ms: row.try_get("created_at_unix_ms").map_err(backend)?,
        updated_at_unix_ms: row.try_get("updated_at_unix_ms").map_err(backend)?,
    };
    run.validate()?;
    Ok(run)
}

fn row_to_lease(row: &PgRow) -> Result<StageLease, AgentRuntimeStoreError> {
    let role_id = row.try_get::<i16, _>("role_id").map_err(backend)?;
    let lease = StageLease {
        lease_id: row.try_get("lease_id").map_err(backend)?,
        task_id: row.try_get("task_id").map_err(backend)?,
        run_id: row.try_get("run_id").map_err(backend)?,
        role_id: u16::try_from(role_id).map_err(|_| backend("invalid role_id"))?,
        principal_id: row.try_get("principal_id").map_err(backend)?,
        repository_path: row.try_get("repository_path").map_err(backend)?,
        worktree_id: row.try_get("worktree_id").map_err(backend)?,
        paths: row.try_get("paths").map_err(backend)?,
        resources: row.try_get("resources").map_err(backend)?,
        source_write: row.try_get("source_write").map_err(backend)?,
        nonce_digest: row.try_get("nonce_digest").map_err(backend)?,
        issued_at_unix_ms: row.try_get("issued_at_unix_ms").map_err(backend)?,
        expires_at_unix_ms: row.try_get("expires_at_unix_ms").map_err(backend)?,
        heartbeat_due_at_unix_ms: row.try_get("heartbeat_due_at_unix_ms").map_err(backend)?,
        version: from_db_u64("lease version", row.try_get("version").map_err(backend)?)?,
        state: enum_value(row.try_get("state").map_err(backend)?)?,
    };
    lease.validate_persisted()?;
    Ok(lease)
}

fn row_to_receipt(row: &PgRow) -> Result<RunReceipt, AgentRuntimeStoreError> {
    let role_id = row.try_get::<i16, _>("role_id").map_err(backend)?;
    let receipt = RunReceipt {
        previous_receipt_hash: row.try_get("previous_receipt_hash").map_err(backend)?,
        draft: RunReceiptDraft {
            receipt_id: row.try_get("receipt_id").map_err(backend)?,
            task_id: row.try_get("task_id").map_err(backend)?,
            run_id: row.try_get("run_id").map_err(backend)?,
            role_id: u16::try_from(role_id).map_err(|_| backend("invalid role_id"))?,
            principal_id: row.try_get("principal_id").map_err(backend)?,
            commit_sha: row.try_get("commit_sha").map_err(backend)?,
            plan_hash: row.try_get("plan_hash").map_err(backend)?,
            scope_hash: row.try_get("scope_hash").map_err(backend)?,
            action_digest: row.try_get("action_digest").map_err(backend)?,
            result: enum_value(row.try_get("result").map_err(backend)?)?,
            artifact_digests: row.try_get("artifact_digests").map_err(backend)?,
            verification_receipt_id: row.try_get("verification_receipt_id").map_err(backend)?,
            started_at_unix_ms: row.try_get("started_at_unix_ms").map_err(backend)?,
            ended_at_unix_ms: row.try_get("ended_at_unix_ms").map_err(backend)?,
        },
        receipt_hash: row.try_get("receipt_hash").map_err(backend)?,
    };
    receipt.validate()?;
    Ok(receipt)
}

fn row_to_event(row: &PgRow) -> Result<AgentRuntimeEvent, AgentRuntimeStoreError> {
    Ok(AgentRuntimeEvent {
        task_id: row.try_get("task_id").map_err(backend)?,
        run_id: row.try_get("run_id").map_err(backend)?,
        event_sequence: from_db_u64(
            "event sequence",
            row.try_get("event_sequence").map_err(backend)?,
        )?,
        from_state: enum_value(row.try_get("from_state").map_err(backend)?)?,
        to_state: enum_value(row.try_get("to_state").map_err(backend)?)?,
        entity_version: from_db_u64(
            "event entity version",
            row.try_get("entity_version").map_err(backend)?,
        )?,
        actor_principal_id: row.try_get("actor_principal_id").map_err(backend)?,
        blocker: row.try_get("blocker").map_err(backend)?,
        occurred_at_unix_ms: row.try_get("occurred_at_unix_ms").map_err(backend)?,
    })
}

async fn postgres_receipts_for_task(
    transaction: &mut Transaction<'_, Postgres>,
    task_id: &str,
) -> Result<Vec<RunReceipt>, AgentRuntimeStoreError> {
    let rows = sqlx::query(
        r#"select receipt_id, task_id, run_id, role_id, principal_id,
                  commit_sha, plan_hash, scope_hash, action_digest, result,
                  artifact_digests, verification_receipt_id,
                  (extract(epoch from started_at) * 1000)::bigint as started_at_unix_ms,
                  (extract(epoch from ended_at) * 1000)::bigint as ended_at_unix_ms,
                  previous_receipt_hash, receipt_hash
           from public.agent_runtime_receipts
           where task_id = $1
           order by chain_sequence"#,
    )
    .bind(task_id)
    .fetch_all(&mut **transaction)
    .await
    .map_err(backend)?;
    let receipts = rows
        .iter()
        .map(row_to_receipt)
        .collect::<Result<Vec<_>, _>>()?;
    verify_task_receipt_chain(task_id, &receipts)?;
    Ok(receipts)
}

async fn postgres_leases_for_task(
    transaction: &mut Transaction<'_, Postgres>,
    task_id: &str,
) -> Result<Vec<StageLease>, AgentRuntimeStoreError> {
    let rows = sqlx::query(
        r#"select lease_id, task_id, run_id, role_id, principal_id,
                  repository_path, worktree_id, paths, resources, source_write,
                  nonce_digest, state,
                  (extract(epoch from issued_at) * 1000)::bigint as issued_at_unix_ms,
                  (extract(epoch from expires_at) * 1000)::bigint as expires_at_unix_ms,
                  (extract(epoch from heartbeat_due_at) * 1000)::bigint as heartbeat_due_at_unix_ms,
                  version
           from public.agent_runtime_stage_leases
           where task_id = $1"#,
    )
    .bind(task_id)
    .fetch_all(&mut **transaction)
    .await
    .map_err(backend)?;
    rows.iter().map(row_to_lease).collect()
}

async fn insert_postgres_event(
    transaction: &mut Transaction<'_, Postgres>,
    task_id: &str,
    run_id: Option<&str>,
    from_state: RuntimeState,
    entity_version: u64,
    transition: &StateTransition,
) -> Result<(), AgentRuntimeStoreError> {
    let row = sqlx::query(
        r#"select coalesce(max(event_sequence), 0)::bigint + 1 as next_sequence
           from public.agent_runtime_task_events where task_id = $1"#,
    )
    .bind(task_id)
    .fetch_one(&mut **transaction)
    .await
    .map_err(backend)?;
    let event_sequence: i64 = row.try_get("next_sequence").map_err(backend)?;
    sqlx::query(
        r#"insert into public.agent_runtime_task_events
           (task_id, run_id, event_sequence, from_state, to_state,
            entity_version, actor_principal_id, blocker, occurred_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8,
                   to_timestamp($9::double precision / 1000.0))"#,
    )
    .bind(task_id)
    .bind(run_id)
    .bind(event_sequence)
    .bind(enum_text(&from_state)?)
    .bind(enum_text(&transition.next_state)?)
    .bind(to_db_i64("event entity version", entity_version)?)
    .bind(&transition.actor_principal_id)
    .bind(&transition.blocker)
    .bind(transition.at_unix_ms)
    .execute(&mut **transaction)
    .await
    .map_err(backend)?;
    Ok(())
}

async fn postgres_clock_unix_ms(
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<UnixMillis, AgentRuntimeStoreError> {
    let row =
        sqlx::query("select (extract(epoch from clock_timestamp()) * 1000)::bigint as now_unix_ms")
            .fetch_one(&mut **transaction)
            .await
            .map_err(backend)?;
    row.try_get("now_unix_ms").map_err(backend)
}

// The Postgres implementation lives below the memory implementation so both
// backends share all validation and canonical receipt helpers.
#[async_trait]
impl AgentRuntimeStore for AgentRuntimePostgresStore {
    async fn create_task(&self, task: &AgentTask) -> Result<AgentTask, AgentRuntimeStoreError> {
        task.validate()?;
        require_initial_state("task", task.state, task.version)?;
        sqlx::query(
            r#"insert into public.agent_runtime_tasks
               (task_id, envelope, idempotency_key, state, version, created_at, updated_at)
               values ($1, $2, $3, $4, $5,
                       to_timestamp($6::double precision / 1000.0),
                       to_timestamp($7::double precision / 1000.0))"#,
        )
        .bind(&task.task_id)
        .bind(&task.envelope)
        .bind(&task.idempotency_key)
        .bind(enum_text(&task.state)?)
        .bind(to_db_i64("task version", task.version)?)
        .bind(task.created_at_unix_ms)
        .bind(task.updated_at_unix_ms)
        .execute(self.pool())
        .await
        .map_err(|error| insert_error("task", &task.task_id, error))?;
        Ok(task.clone())
    }

    async fn events_for_task(
        &self,
        task_id: &str,
    ) -> Result<Vec<AgentRuntimeEvent>, AgentRuntimeStoreError> {
        let rows = sqlx::query(
            r#"select task_id, run_id, event_sequence, from_state, to_state,
                      entity_version, actor_principal_id, blocker,
                      (extract(epoch from occurred_at) * 1000)::bigint as occurred_at_unix_ms
               from public.agent_runtime_task_events
               where task_id = $1 order by event_sequence"#,
        )
        .bind(task_id)
        .fetch_all(self.pool())
        .await
        .map_err(backend)?;
        rows.iter().map(row_to_event).collect()
    }

    async fn get_task(&self, task_id: &str) -> Result<Option<AgentTask>, AgentRuntimeStoreError> {
        let row = sqlx::query(
            r#"select task_id, envelope, idempotency_key, state, version,
                      (extract(epoch from created_at) * 1000)::bigint as created_at_unix_ms,
                      (extract(epoch from updated_at) * 1000)::bigint as updated_at_unix_ms
               from public.agent_runtime_tasks where task_id = $1"#,
        )
        .bind(task_id)
        .fetch_optional(self.pool())
        .await
        .map_err(backend)?;
        row.as_ref().map(row_to_task).transpose()
    }

    async fn transition_task(
        &self,
        task_id: &str,
        transition: &StateTransition,
    ) -> Result<AgentTask, AgentRuntimeStoreError> {
        transition.validate()?;
        let mut transaction = self.pool().begin().await.map_err(backend)?;
        let row = sqlx::query(
            r#"select task_id, envelope, idempotency_key, state, version,
                      (extract(epoch from created_at) * 1000)::bigint as created_at_unix_ms,
                      (extract(epoch from updated_at) * 1000)::bigint as updated_at_unix_ms
               from public.agent_runtime_tasks where task_id = $1 for update"#,
        )
        .bind(task_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?
        .ok_or_else(|| not_found("task", task_id))?;
        let mut task = row_to_task(&row)?;
        require_version("task", task_id, transition.expected_version, task.version)?;
        if transition.next_state == RuntimeState::Leased {
            let row = sqlx::query(
                r#"select exists (
                       select 1 from public.agent_runtime_stage_leases
                       where task_id = $1 and state = 'ACTIVE'
                         and heartbeat_due_at >= clock_timestamp()
                         and expires_at >= clock_timestamp()
                   ) as present"#,
            )
            .bind(task_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(backend)?;
            if !row.try_get::<bool, _>("present").map_err(backend)? {
                return Err(missing_evidence("task", task_id, "active stage lease"));
            }
        }
        if matches!(
            transition.next_state,
            RuntimeState::Receipted | RuntimeState::Succeeded
        ) {
            let receipts = postgres_receipts_for_task(&mut transaction, task_id).await?;
            let leases = postgres_leases_for_task(&mut transaction, task_id).await?;
            require_verified_task_pass(task_id, &receipts, &leases)?;
        }
        let from_state = task.state;
        task.apply_transition(transition)
            .map_err(map_domain_error)?;
        let result = sqlx::query(
            r#"update public.agent_runtime_tasks
               set state = $3, version = $4,
                   updated_at = to_timestamp($5::double precision / 1000.0)
               where task_id = $1 and version = $2"#,
        )
        .bind(task_id)
        .bind(to_db_i64(
            "expected task version",
            transition.expected_version,
        )?)
        .bind(enum_text(&task.state)?)
        .bind(to_db_i64("task version", task.version)?)
        .bind(task.updated_at_unix_ms)
        .execute(&mut *transaction)
        .await
        .map_err(backend)?;
        if result.rows_affected() != 1 {
            return Err(AgentRuntimeStoreError::VersionConflict {
                entity: "task",
                id: task_id.into(),
                expected: transition.expected_version,
                actual: task.version.saturating_sub(1),
            });
        }
        insert_postgres_event(
            &mut transaction,
            task_id,
            None,
            from_state,
            task.version,
            transition,
        )
        .await?;
        transaction.commit().await.map_err(backend)?;
        Ok(task)
    }

    async fn create_run(&self, run: &AgentRun) -> Result<AgentRun, AgentRuntimeStoreError> {
        run.validate()?;
        require_initial_state("run", run.state, run.version)?;
        let task_exists =
            sqlx::query("select 1 from public.agent_runtime_tasks where task_id = $1")
                .bind(&run.task_id)
                .fetch_optional(self.pool())
                .await
                .map_err(backend)?
                .is_some();
        if !task_exists {
            return Err(not_found("task", &run.task_id));
        }
        sqlx::query(
            r#"insert into public.agent_runtime_runs
               (run_id, task_id, stage_id, role_id, principal_id, action_class,
                state, attempt, version, blocker, result_receipt_id, created_at, updated_at)
               values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                       to_timestamp($12::double precision / 1000.0),
                       to_timestamp($13::double precision / 1000.0))"#,
        )
        .bind(&run.run_id)
        .bind(&run.task_id)
        .bind(&run.stage_id)
        .bind(i16::try_from(run.role_id).map_err(|_| backend("invalid role_id"))?)
        .bind(&run.principal_id)
        .bind(enum_text(&run.action_class)?)
        .bind(enum_text(&run.state)?)
        .bind(i32::try_from(run.attempt).map_err(|_| backend("run attempt exceeds integer"))?)
        .bind(to_db_i64("run version", run.version)?)
        .bind(&run.blocker)
        .bind(&run.result_receipt_id)
        .bind(run.created_at_unix_ms)
        .bind(run.updated_at_unix_ms)
        .execute(self.pool())
        .await
        .map_err(|error| insert_error("run", &run.run_id, error))?;
        Ok(run.clone())
    }

    async fn get_run(&self, run_id: &str) -> Result<Option<AgentRun>, AgentRuntimeStoreError> {
        let row = sqlx::query(
            r#"select run_id, task_id, stage_id, role_id, principal_id, action_class,
                      state, attempt, version, blocker, result_receipt_id,
                      (extract(epoch from created_at) * 1000)::bigint as created_at_unix_ms,
                      (extract(epoch from updated_at) * 1000)::bigint as updated_at_unix_ms
               from public.agent_runtime_runs where run_id = $1"#,
        )
        .bind(run_id)
        .fetch_optional(self.pool())
        .await
        .map_err(backend)?;
        row.as_ref().map(row_to_run).transpose()
    }

    async fn transition_run(
        &self,
        run_id: &str,
        transition: &StateTransition,
    ) -> Result<AgentRun, AgentRuntimeStoreError> {
        transition.validate()?;
        let mut transaction = self.pool().begin().await.map_err(backend)?;
        let task_id_row =
            sqlx::query("select task_id from public.agent_runtime_runs where run_id = $1")
                .bind(run_id)
                .fetch_optional(&mut *transaction)
                .await
                .map_err(backend)?
                .ok_or_else(|| not_found("run", run_id))?;
        let task_id: String = task_id_row.try_get("task_id").map_err(backend)?;
        sqlx::query("select task_id from public.agent_runtime_tasks where task_id = $1 for update")
            .bind(&task_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(backend)?;
        let row = sqlx::query(
            r#"select run_id, task_id, stage_id, role_id, principal_id, action_class,
                      state, attempt, version, blocker, result_receipt_id,
                      (extract(epoch from created_at) * 1000)::bigint as created_at_unix_ms,
                      (extract(epoch from updated_at) * 1000)::bigint as updated_at_unix_ms
               from public.agent_runtime_runs where run_id = $1 for update"#,
        )
        .bind(run_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?
        .ok_or_else(|| not_found("run", run_id))?;
        let mut run = row_to_run(&row)?;
        if run.task_id != task_id {
            return Err(backend("run task identity changed during transition"));
        }
        require_version("run", run_id, transition.expected_version, run.version)?;
        let receipt_id = match transition.next_state {
            RuntimeState::Leased => {
                let row = sqlx::query(
                    r#"select exists (
                           select 1 from public.agent_runtime_stage_leases
                           where run_id = $1 and state = 'ACTIVE'
                             and heartbeat_due_at >= clock_timestamp()
                             and expires_at >= clock_timestamp()
                       ) as present"#,
                )
                .bind(run_id)
                .fetch_one(&mut *transaction)
                .await
                .map_err(backend)?;
                if !row.try_get::<bool, _>("present").map_err(backend)? {
                    return Err(missing_evidence("run", run_id, "active stage lease"));
                }
                None
            }
            RuntimeState::Receipted => {
                let receipts = postgres_receipts_for_task(&mut transaction, &run.task_id).await?;
                let leases = postgres_leases_for_task(&mut transaction, &run.task_id).await?;
                Some(require_verified_run_pass(
                    &run.task_id,
                    run_id,
                    &receipts,
                    &leases,
                )?)
            }
            RuntimeState::Succeeded => {
                let bound = run
                    .result_receipt_id
                    .as_deref()
                    .ok_or_else(|| missing_evidence("run", run_id, "bound PASS receipt"))?;
                let receipts = postgres_receipts_for_task(&mut transaction, &run.task_id).await?;
                let leases = postgres_leases_for_task(&mut transaction, &run.task_id).await?;
                let verified = require_verified_run_pass(&run.task_id, run_id, &receipts, &leases)?;
                if verified != bound {
                    return Err(missing_evidence("run", run_id, "bound PASS receipt"));
                }
                None
            }
            _ => None,
        };
        let from_state = run.state;
        if let Some(receipt_id) = receipt_id {
            run.result_receipt_id = Some(receipt_id);
        }
        run.apply_transition(transition).map_err(map_domain_error)?;
        let result = sqlx::query(
            r#"update public.agent_runtime_runs
               set state = $3, version = $4, blocker = $5, result_receipt_id = $6,
                   updated_at = to_timestamp($7::double precision / 1000.0)
               where run_id = $1 and version = $2"#,
        )
        .bind(run_id)
        .bind(to_db_i64(
            "expected run version",
            transition.expected_version,
        )?)
        .bind(enum_text(&run.state)?)
        .bind(to_db_i64("run version", run.version)?)
        .bind(&run.blocker)
        .bind(&run.result_receipt_id)
        .bind(run.updated_at_unix_ms)
        .execute(&mut *transaction)
        .await
        .map_err(backend)?;
        if result.rows_affected() != 1 {
            return Err(AgentRuntimeStoreError::VersionConflict {
                entity: "run",
                id: run_id.into(),
                expected: transition.expected_version,
                actual: run.version.saturating_sub(1),
            });
        }
        insert_postgres_event(
            &mut transaction,
            &run.task_id,
            Some(run_id),
            from_state,
            run.version,
            transition,
        )
        .await?;
        transaction.commit().await.map_err(backend)?;
        Ok(run)
    }

    async fn acquire_lease(
        &self,
        lease: &StageLease,
        _now_unix_ms: UnixMillis,
    ) -> Result<StageLease, AgentRuntimeStoreError> {
        lease.validate_for_acquire()?;
        let mut transaction = self.pool().begin().await.map_err(backend)?;
        let task_exists = sqlx::query(
            "select task_id from public.agent_runtime_tasks where task_id = $1 for update",
        )
        .bind(&lease.task_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?
        .is_some();
        if !task_exists {
            return Err(not_found("task", &lease.task_id));
        }
        let database_now_unix_ms = postgres_clock_unix_ms(&mut transaction).await?;
        if database_now_unix_ms < lease.issued_at_unix_ms {
            return Err(AgentRuntimeError::InvalidTimestampOrder.into());
        }
        if !lease.is_active_at(database_now_unix_ms) {
            return Err(AgentRuntimeError::LeaseExpired.into());
        }
        sqlx::query("select pg_advisory_xact_lock(723004002)")
            .fetch_one(&mut *transaction)
            .await
            .map_err(backend)?;
        sqlx::query(
            r#"update public.agent_runtime_stage_leases
               set state = 'EXPIRED', version = version + 1
               where state = 'ACTIVE'
                 and (heartbeat_due_at < clock_timestamp()
                      or expires_at < clock_timestamp())"#,
        )
        .execute(&mut *transaction)
        .await
        .map_err(backend)?;
        let row = sqlx::query(
            r#"select run_id, task_id, stage_id, role_id, principal_id, action_class,
                      state, attempt, version, blocker, result_receipt_id,
                      (extract(epoch from created_at) * 1000)::bigint as created_at_unix_ms,
                      (extract(epoch from updated_at) * 1000)::bigint as updated_at_unix_ms
               from public.agent_runtime_runs where run_id = $1 for update"#,
        )
        .bind(&lease.run_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?
        .ok_or_else(|| not_found("run", &lease.run_id))?;
        let run = row_to_run(&row)?;
        if run.state != RuntimeState::Queued {
            return Err(AgentRuntimeStoreError::StateMismatch {
                entity: "run",
                id: run.run_id,
                expected: RuntimeState::Queued,
                actual: run.state,
            });
        }
        if run.task_id != lease.task_id
            || run.role_id != lease.role_id
            || run.principal_id != lease.principal_id
        {
            return Err(backend("lease identity does not match run"));
        }
        if lease.source_write && !matches!(run.action_class, ActionClass::B | ActionClass::C) {
            return Err(AgentRuntimeStoreError::SourceWriteActionNotAllowed {
                run_id: run.run_id,
                action_class: run.action_class,
            });
        }
        let rows = sqlx::query(
            r#"select lease_id, task_id, run_id, role_id, principal_id,
                      repository_path, worktree_id, paths, resources, source_write,
                      nonce_digest, state, version,
                      (extract(epoch from issued_at) * 1000)::bigint as issued_at_unix_ms,
                      (extract(epoch from expires_at) * 1000)::bigint as expires_at_unix_ms,
                      (extract(epoch from heartbeat_due_at) * 1000)::bigint as heartbeat_due_at_unix_ms
               from public.agent_runtime_stage_leases where state = 'ACTIVE'"#,
        )
        .fetch_all(&mut *transaction)
        .await
        .map_err(backend)?;
        for row in &rows {
            let existing = row_to_lease(row)?;
            if existing.conflicts_with(lease) {
                return Err(AgentRuntimeStoreError::LeaseConflict {
                    requested_lease_id: lease.lease_id.clone(),
                    active_lease_id: existing.lease_id,
                });
            }
        }
        sqlx::query(
            r#"insert into public.agent_runtime_stage_leases
               (lease_id, task_id, run_id, role_id, principal_id,
                repository_path, worktree_id, paths, resources, source_write,
                nonce_digest, state, issued_at, heartbeat_due_at, expires_at, version)
               values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                       to_timestamp($13::double precision / 1000.0),
                       to_timestamp($14::double precision / 1000.0),
                       to_timestamp($15::double precision / 1000.0), $16)"#,
        )
        .bind(&lease.lease_id)
        .bind(&lease.task_id)
        .bind(&lease.run_id)
        .bind(i16::try_from(lease.role_id).map_err(|_| backend("invalid role_id"))?)
        .bind(&lease.principal_id)
        .bind(&lease.repository_path)
        .bind(&lease.worktree_id)
        .bind(&lease.paths)
        .bind(&lease.resources)
        .bind(lease.source_write)
        .bind(&lease.nonce_digest)
        .bind(enum_text(&lease.state)?)
        .bind(lease.issued_at_unix_ms)
        .bind(lease.heartbeat_due_at_unix_ms)
        .bind(lease.expires_at_unix_ms)
        .bind(to_db_i64("lease version", lease.version)?)
        .execute(&mut *transaction)
        .await
        .map_err(|error| insert_error("lease", &lease.lease_id, error))?;
        transaction.commit().await.map_err(backend)?;
        Ok(lease.clone())
    }

    async fn get_lease(
        &self,
        lease_id: &str,
    ) -> Result<Option<StageLease>, AgentRuntimeStoreError> {
        let row = sqlx::query(
            r#"select lease_id, task_id, run_id, role_id, principal_id,
                      repository_path, worktree_id, paths, resources, source_write,
                      nonce_digest, state, version,
                      (extract(epoch from issued_at) * 1000)::bigint as issued_at_unix_ms,
                      (extract(epoch from expires_at) * 1000)::bigint as expires_at_unix_ms,
                      (extract(epoch from heartbeat_due_at) * 1000)::bigint as heartbeat_due_at_unix_ms
               from public.agent_runtime_stage_leases where lease_id = $1"#,
        )
        .bind(lease_id)
        .fetch_optional(self.pool())
        .await
        .map_err(backend)?;
        row.as_ref().map(row_to_lease).transpose()
    }

    async fn heartbeat_lease(
        &self,
        lease_id: &str,
        expected_version: u64,
        _now_unix_ms: UnixMillis,
        heartbeat_due_at_unix_ms: UnixMillis,
        expires_at_unix_ms: UnixMillis,
    ) -> Result<StageLease, AgentRuntimeStoreError> {
        let mut transaction = self.pool().begin().await.map_err(backend)?;
        let task_id_row = sqlx::query(
            "select task_id from public.agent_runtime_stage_leases where lease_id = $1",
        )
        .bind(lease_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?
        .ok_or_else(|| not_found("lease", lease_id))?;
        let task_id: String = task_id_row.try_get("task_id").map_err(backend)?;
        sqlx::query("select task_id from public.agent_runtime_tasks where task_id = $1 for update")
            .bind(&task_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(backend)?;
        let row = sqlx::query(
            r#"select lease_id, task_id, run_id, role_id, principal_id,
                      repository_path, worktree_id, paths, resources, source_write,
                      nonce_digest, state, version,
                      (extract(epoch from issued_at) * 1000)::bigint as issued_at_unix_ms,
                      (extract(epoch from expires_at) * 1000)::bigint as expires_at_unix_ms,
                      (extract(epoch from heartbeat_due_at) * 1000)::bigint as heartbeat_due_at_unix_ms
               from public.agent_runtime_stage_leases where lease_id = $1 for update"#,
        )
        .bind(lease_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?
        .ok_or_else(|| not_found("lease", lease_id))?;
        let mut lease = row_to_lease(&row)?;
        if lease.task_id != task_id {
            return Err(backend("lease task identity changed during heartbeat"));
        }
        let database_now_unix_ms = postgres_clock_unix_ms(&mut transaction).await?;
        require_version("lease", lease_id, expected_version, lease.version)?;
        lease
            .heartbeat(
                expected_version,
                database_now_unix_ms,
                heartbeat_due_at_unix_ms,
                expires_at_unix_ms,
            )
            .map_err(map_domain_error)?;
        let result = sqlx::query(
            r#"update public.agent_runtime_stage_leases
               set heartbeat_due_at = to_timestamp($3::double precision / 1000.0),
                   expires_at = to_timestamp($4::double precision / 1000.0),
                   version = $5
               where lease_id = $1 and version = $2"#,
        )
        .bind(lease_id)
        .bind(to_db_i64("expected lease version", expected_version)?)
        .bind(heartbeat_due_at_unix_ms)
        .bind(expires_at_unix_ms)
        .bind(to_db_i64("lease version", lease.version)?)
        .execute(&mut *transaction)
        .await
        .map_err(backend)?;
        if result.rows_affected() != 1 {
            return Err(AgentRuntimeStoreError::VersionConflict {
                entity: "lease",
                id: lease_id.into(),
                expected: expected_version,
                actual: lease.version.saturating_sub(1),
            });
        }
        transaction.commit().await.map_err(backend)?;
        Ok(lease)
    }

    async fn release_lease(
        &self,
        lease_id: &str,
        expected_version: u64,
        _now_unix_ms: UnixMillis,
    ) -> Result<StageLease, AgentRuntimeStoreError> {
        let mut transaction = self.pool().begin().await.map_err(backend)?;
        let task_id_row = sqlx::query(
            "select task_id from public.agent_runtime_stage_leases where lease_id = $1",
        )
        .bind(lease_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?
        .ok_or_else(|| not_found("lease", lease_id))?;
        let task_id: String = task_id_row.try_get("task_id").map_err(backend)?;
        sqlx::query("select task_id from public.agent_runtime_tasks where task_id = $1 for update")
            .bind(&task_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(backend)?;
        let row = sqlx::query(
            r#"select lease_id, task_id, run_id, role_id, principal_id,
                      repository_path, worktree_id, paths, resources, source_write,
                      nonce_digest, state, version,
                      (extract(epoch from issued_at) * 1000)::bigint as issued_at_unix_ms,
                      (extract(epoch from expires_at) * 1000)::bigint as expires_at_unix_ms,
                      (extract(epoch from heartbeat_due_at) * 1000)::bigint as heartbeat_due_at_unix_ms
               from public.agent_runtime_stage_leases where lease_id = $1 for update"#,
        )
        .bind(lease_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?
        .ok_or_else(|| not_found("lease", lease_id))?;
        let mut lease = row_to_lease(&row)?;
        if lease.task_id != task_id {
            return Err(backend("lease task identity changed during release"));
        }
        let database_now_unix_ms = postgres_clock_unix_ms(&mut transaction).await?;
        require_version("lease", lease_id, expected_version, lease.version)?;
        lease
            .release(expected_version, database_now_unix_ms)
            .map_err(map_domain_error)?;
        let result = sqlx::query(
            r#"update public.agent_runtime_stage_leases
               set state = $3, version = $4
               where lease_id = $1 and version = $2"#,
        )
        .bind(lease_id)
        .bind(to_db_i64("expected lease version", expected_version)?)
        .bind(enum_text(&lease.state)?)
        .bind(to_db_i64("lease version", lease.version)?)
        .execute(&mut *transaction)
        .await
        .map_err(backend)?;
        if result.rows_affected() != 1 {
            return Err(AgentRuntimeStoreError::VersionConflict {
                entity: "lease",
                id: lease_id.into(),
                expected: expected_version,
                actual: lease.version.saturating_sub(1),
            });
        }
        transaction.commit().await.map_err(backend)?;
        Ok(lease)
    }

    async fn append_receipt(
        &self,
        draft: &RunReceiptDraft,
    ) -> Result<RunReceipt, AgentRuntimeStoreError> {
        draft.validate()?;
        let mut transaction = self.pool().begin().await.map_err(backend)?;
        let task_row = sqlx::query(
            "select state from public.agent_runtime_tasks where task_id = $1 for update",
        )
        .bind(&draft.task_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?
        .ok_or_else(|| not_found("task", &draft.task_id))?;
        let task_state: RuntimeState = enum_value(task_row.try_get("state").map_err(backend)?)?;
        if matches!(
            task_state,
            RuntimeState::Receipted | RuntimeState::Succeeded
        ) {
            return Err(AgentRuntimeStoreError::ReceiptChainFinalized {
                task_id: draft.task_id.clone(),
                state: task_state,
            });
        }
        sqlx::query("select pg_advisory_xact_lock(hashtextextended($1, 0))")
            .bind(&draft.task_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(backend)?;
        let row = sqlx::query(
            r#"select run_id, task_id, stage_id, role_id, principal_id, action_class,
                      state, attempt, version, blocker, result_receipt_id,
                      (extract(epoch from created_at) * 1000)::bigint as created_at_unix_ms,
                      (extract(epoch from updated_at) * 1000)::bigint as updated_at_unix_ms
               from public.agent_runtime_runs where run_id = $1 for update"#,
        )
        .bind(&draft.run_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?
        .ok_or_else(|| not_found("run", &draft.run_id))?;
        let run = row_to_run(&row)?;
        if run.task_id != draft.task_id
            || run.role_id != draft.role_id
            || run.principal_id != draft.principal_id
            || !receipt_result_allowed(run.state, draft.result)
        {
            return Err(AgentRuntimeStoreError::ReceiptRunMismatch {
                receipt_id: draft.receipt_id.clone(),
            });
        }
        let duplicate = sqlx::query(
            "select receipt_id from public.agent_runtime_receipts where receipt_id = $1 or run_id = $2",
        )
        .bind(&draft.receipt_id)
        .bind(&draft.run_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(backend)?;
        if duplicate.is_some() {
            return Err(already_exists("receipt", &draft.receipt_id));
        }
        let receipts = postgres_receipts_for_task(&mut transaction, &draft.task_id).await?;
        let checker = require_independent_pass(draft, &receipts)?;
        let leases = postgres_leases_for_task(&mut transaction, &draft.task_id).await?;
        require_pass_lease_evidence(draft, checker, &leases)?;
        let previous = receipts.last().map(|receipt| receipt.receipt_hash.clone());
        let receipt = build_receipt(draft.clone(), previous)?;
        let chain_sequence = receipts
            .len()
            .checked_add(1)
            .and_then(|value| i64::try_from(value).ok())
            .ok_or_else(|| backend("receipt chain sequence overflow"))?;
        sqlx::query(
            r#"insert into public.agent_runtime_receipts
               (receipt_id, task_id, run_id, role_id, principal_id, commit_sha,
                plan_hash, scope_hash, action_digest, result, artifact_digests,
                verification_receipt_id, started_at, ended_at, chain_sequence,
                previous_receipt_hash, receipt_hash)
               values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                       to_timestamp($13::double precision / 1000.0),
                       to_timestamp($14::double precision / 1000.0), $15, $16, $17)"#,
        )
        .bind(&receipt.draft.receipt_id)
        .bind(&receipt.draft.task_id)
        .bind(&receipt.draft.run_id)
        .bind(i16::try_from(receipt.draft.role_id).map_err(|_| backend("invalid role_id"))?)
        .bind(&receipt.draft.principal_id)
        .bind(&receipt.draft.commit_sha)
        .bind(&receipt.draft.plan_hash)
        .bind(&receipt.draft.scope_hash)
        .bind(&receipt.draft.action_digest)
        .bind(enum_text(&receipt.draft.result)?)
        .bind(&receipt.draft.artifact_digests)
        .bind(&receipt.draft.verification_receipt_id)
        .bind(receipt.draft.started_at_unix_ms)
        .bind(receipt.draft.ended_at_unix_ms)
        .bind(chain_sequence)
        .bind(&receipt.previous_receipt_hash)
        .bind(&receipt.receipt_hash)
        .execute(&mut *transaction)
        .await
        .map_err(|error| insert_error("receipt", &draft.receipt_id, error))?;
        transaction.commit().await.map_err(backend)?;
        Ok(receipt)
    }

    async fn receipts_for_task(
        &self,
        task_id: &str,
    ) -> Result<Vec<RunReceipt>, AgentRuntimeStoreError> {
        let rows = sqlx::query(
            r#"select receipt_id, task_id, run_id, role_id, principal_id,
                      commit_sha, plan_hash, scope_hash, action_digest, result,
                      artifact_digests, verification_receipt_id,
                      (extract(epoch from started_at) * 1000)::bigint as started_at_unix_ms,
                      (extract(epoch from ended_at) * 1000)::bigint as ended_at_unix_ms,
                      previous_receipt_hash, receipt_hash
               from public.agent_runtime_receipts
               where task_id = $1
               order by chain_sequence"#,
        )
        .bind(task_id)
        .fetch_all(self.pool())
        .await
        .map_err(backend)?;
        let receipts = rows
            .iter()
            .map(row_to_receipt)
            .collect::<Result<Vec<_>, _>>()?;
        verify_task_receipt_chain(task_id, &receipts)?;
        Ok(receipts)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn task() -> AgentTask {
        AgentTask::new(
            "TASK-runtime-001",
            "idempotency-key-0001",
            json!({
                "schemaVersion": "1.0",
                "taskId": "TASK-runtime-001",
                "createdAt": "2026-07-20T12:34:56Z",
                "goal": "Persist a bounded runtime task",
                "constraints": ["Static validation only"],
                "nonGoals": ["No deployment"],
                "requestedBy": {
                    "principalId": "operator-001",
                    "assertionRef": "ASSERTION-runtime-001"
                },
                "dataClass": "INTERNAL",
                "repository": {
                    "path": "/repo",
                    "commitSha": "a".repeat(40),
                    "worktreeId": "worktree-a"
                },
                "planHash": "b".repeat(64),
                "scopeHash": "c".repeat(64),
                "requestedRoleIds": [37, 42],
                "actionManifest": [{
                    "action": "edit",
                    "class": "B",
                    "target": "crates/sirinx-store/src/agent_runtime.rs"
                }],
                "budgets": {
                    "maxSteps": 50,
                    "maxRuntimeSeconds": 900,
                    "maxOutputBytes": 1048576,
                    "maxExternalCalls": 0,
                    "maxCostUsd": 0
                },
                "stopConditions": ["Stop on schema mismatch"],
                "idempotencyKey": "idempotency-key-0001",
                "approvalTicketIds": ["TKT-runtime-001"]
            }),
            1_000,
        )
        .unwrap()
    }

    fn run() -> AgentRun {
        run_named("RUN-runtime-001", "stage-maker", 1)
    }

    fn run_named(run_id: &str, stage_id: &str, attempt: u32) -> AgentRun {
        run_as(run_id, stage_id, 37, "codex", attempt)
    }

    fn run_as(
        run_id: &str,
        stage_id: &str,
        role_id: u16,
        principal_id: &str,
        attempt: u32,
    ) -> AgentRun {
        run_as_with_action(
            run_id,
            stage_id,
            role_id,
            principal_id,
            ActionClass::B,
            attempt,
        )
    }

    fn run_as_with_action(
        run_id: &str,
        stage_id: &str,
        role_id: u16,
        principal_id: &str,
        action_class: ActionClass,
        attempt: u32,
    ) -> AgentRun {
        AgentRun::new(
            run_id,
            "TASK-runtime-001",
            stage_id,
            role_id,
            principal_id,
            action_class,
            attempt,
            1_000,
        )
        .unwrap()
    }

    fn lease(lease_id: &str, path: &str) -> StageLease {
        lease_for(lease_id, "RUN-runtime-001", path, true, '1')
    }

    fn lease_for(
        lease_id: &str,
        run_id: &str,
        path: &str,
        source_write: bool,
        nonce_character: char,
    ) -> StageLease {
        lease_for_identity(
            lease_id,
            run_id,
            37,
            "codex",
            path,
            source_write,
            nonce_character,
        )
    }

    #[allow(clippy::too_many_arguments)]
    fn lease_for_identity(
        lease_id: &str,
        run_id: &str,
        role_id: u16,
        principal_id: &str,
        path: &str,
        source_write: bool,
        nonce_character: char,
    ) -> StageLease {
        StageLease {
            lease_id: lease_id.into(),
            task_id: "TASK-runtime-001".into(),
            run_id: run_id.into(),
            role_id,
            principal_id: principal_id.into(),
            repository_path: "/repo".into(),
            worktree_id: "worktree-a".into(),
            paths: vec![path.into()],
            resources: Vec::new(),
            source_write,
            nonce_digest: nonce_character.to_string().repeat(64),
            issued_at_unix_ms: 1_000,
            expires_at_unix_ms: 10_000,
            heartbeat_due_at_unix_ms: 5_000,
            version: 1,
            state: LeaseState::Active,
        }
    }

    fn receipt(receipt_id: &str, result: ReceiptResult) -> RunReceiptDraft {
        receipt_for(receipt_id, "RUN-runtime-001", result)
    }

    fn receipt_for(receipt_id: &str, run_id: &str, result: ReceiptResult) -> RunReceiptDraft {
        receipt_for_identity(receipt_id, run_id, 37, "codex", result)
    }

    fn receipt_for_identity(
        receipt_id: &str,
        run_id: &str,
        role_id: u16,
        principal_id: &str,
        result: ReceiptResult,
    ) -> RunReceiptDraft {
        RunReceiptDraft {
            receipt_id: receipt_id.into(),
            task_id: "TASK-runtime-001".into(),
            run_id: run_id.into(),
            role_id,
            principal_id: principal_id.into(),
            commit_sha: "a".repeat(40),
            plan_hash: "b".repeat(64),
            scope_hash: "c".repeat(64),
            action_digest: "d".repeat(64),
            result,
            artifact_digests: vec!["e".repeat(64)],
            verification_receipt_id: None,
            started_at_unix_ms: 1_000,
            ended_at_unix_ms: 2_000,
        }
    }

    fn transition(
        expected_version: u64,
        next_state: RuntimeState,
        at_unix_ms: UnixMillis,
    ) -> StateTransition {
        StateTransition {
            expected_version,
            next_state,
            at_unix_ms,
            blocker: None,
            actor_principal_id: "test-actor".into(),
        }
    }

    async fn advance_run_to_queued(store: &MemoryStore, run_id: &str) {
        for (expected_version, next_state, at_unix_ms) in [
            (1, RuntimeState::Triaged, 1_100),
            (2, RuntimeState::Planned, 1_200),
            (3, RuntimeState::Queued, 1_300),
        ] {
            store
                .transition_run(
                    run_id,
                    &transition(expected_version, next_state, at_unix_ms),
                )
                .await
                .unwrap();
        }
    }

    async fn advance_run_to_verifying(
        store: &MemoryStore,
        run_id: &str,
        lease_id: &str,
        path: &str,
        nonce_character: char,
    ) {
        advance_run_to_verifying_as(store, run_id, 37, "codex", lease_id, path, nonce_character)
            .await;
    }

    #[allow(clippy::too_many_arguments)]
    async fn advance_run_to_verifying_as(
        store: &MemoryStore,
        run_id: &str,
        role_id: u16,
        principal_id: &str,
        lease_id: &str,
        path: &str,
        nonce_character: char,
    ) {
        advance_run_to_queued(store, run_id).await;
        store
            .acquire_lease(
                &lease_for_identity(
                    lease_id,
                    run_id,
                    role_id,
                    principal_id,
                    path,
                    false,
                    nonce_character,
                ),
                1_400,
            )
            .await
            .unwrap();
        for (expected_version, next_state, at_unix_ms) in [
            (4, RuntimeState::Leased, 1_500),
            (5, RuntimeState::Running, 1_600),
            (6, RuntimeState::Verifying, 1_700),
        ] {
            store
                .transition_run(
                    run_id,
                    &transition(expected_version, next_state, at_unix_ms),
                )
                .await
                .unwrap();
        }
    }

    async fn advance_task_to_verifying(store: &MemoryStore) {
        for (expected_version, next_state, at_unix_ms) in [
            (1, RuntimeState::Triaged, 2_100),
            (2, RuntimeState::Planned, 2_200),
            (3, RuntimeState::Queued, 2_300),
            (4, RuntimeState::Leased, 2_400),
            (5, RuntimeState::Running, 2_500),
            (6, RuntimeState::Verifying, 2_600),
        ] {
            store
                .transition_task(
                    "TASK-runtime-001",
                    &transition(expected_version, next_state, at_unix_ms),
                )
                .await
                .unwrap();
        }
    }

    #[tokio::test]
    async fn task_cas_rejects_a_stale_version() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        let error = store
            .transition_task(
                "TASK-runtime-001",
                &StateTransition {
                    expected_version: 2,
                    next_state: RuntimeState::Triaged,
                    at_unix_ms: 2_000,
                    blocker: None,
                    actor_principal_id: "test-actor".into(),
                },
            )
            .await
            .unwrap_err();

        assert!(matches!(
            error,
            AgentRuntimeStoreError::VersionConflict {
                expected: 2,
                actual: 1,
                ..
            }
        ));
    }

    #[tokio::test]
    async fn accepted_transition_appends_actor_bound_event() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store
            .transition_task(
                "TASK-runtime-001",
                &transition(1, RuntimeState::Triaged, 1_100),
            )
            .await
            .unwrap();

        let events = store.events_for_task("TASK-runtime-001").await.unwrap();
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].event_sequence, 1);
        assert_eq!(events[0].actor_principal_id, "test-actor");
        assert_eq!(events[0].from_state, RuntimeState::Draft);
        assert_eq!(events[0].to_state, RuntimeState::Triaged);
    }

    #[tokio::test]
    async fn draft_run_cannot_acquire_a_lease() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store.create_run(&run()).await.unwrap();

        let error = store
            .acquire_lease(&lease("LEASE-runtime-0001", "crates/sirinx-core"), 2_000)
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::StateMismatch {
                expected: RuntimeState::Queued,
                actual: RuntimeState::Draft,
                ..
            }
        ));
    }

    #[tokio::test]
    async fn memory_store_rejects_checker_source_write_lease() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store
            .create_run(&run_as(
                "RUN-runtime-checker",
                "stage-checker",
                42,
                "checker-principal",
                1,
            ))
            .await
            .unwrap();
        advance_run_to_queued(&store, "RUN-runtime-checker").await;

        let error = store
            .acquire_lease(
                &lease_for_identity(
                    "LEASE-runtime-checker",
                    "RUN-runtime-checker",
                    42,
                    "checker-principal",
                    "crates/sirinx-store",
                    true,
                    '2',
                ),
                1_400,
            )
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::Domain(AgentRuntimeError::SourceWriteRoleNotAllowed(42))
        ));
    }

    #[tokio::test]
    async fn memory_store_rejects_source_write_for_read_only_action_class() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store
            .create_run(&run_as_with_action(
                "RUN-runtime-reader",
                "stage-reader",
                37,
                "reader-principal",
                ActionClass::A,
                1,
            ))
            .await
            .unwrap();
        advance_run_to_queued(&store, "RUN-runtime-reader").await;

        let error = store
            .acquire_lease(
                &lease_for_identity(
                    "LEASE-runtime-reader",
                    "RUN-runtime-reader",
                    37,
                    "reader-principal",
                    "crates/sirinx-core",
                    true,
                    '3',
                ),
                1_400,
            )
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::SourceWriteActionNotAllowed {
                action_class: ActionClass::A,
                ..
            }
        ));
    }

    #[tokio::test]
    async fn task_cannot_claim_leased_without_active_stage_lease() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        for (expected_version, next_state, at_unix_ms) in [
            (1, RuntimeState::Triaged, 1_100),
            (2, RuntimeState::Planned, 1_200),
            (3, RuntimeState::Queued, 1_300),
        ] {
            store
                .transition_task(
                    "TASK-runtime-001",
                    &transition(expected_version, next_state, at_unix_ms),
                )
                .await
                .unwrap();
        }

        let error = store
            .transition_task(
                "TASK-runtime-001",
                &transition(4, RuntimeState::Leased, 1_400),
            )
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::MissingEvidence { .. }
        ));
    }

    #[tokio::test]
    async fn overlapping_paths_conflict_independently_of_writer_mode() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store.create_run(&run()).await.unwrap();
        store
            .create_run(&run_named("RUN-runtime-002", "stage-checker", 1))
            .await
            .unwrap();
        advance_run_to_queued(&store, "RUN-runtime-001").await;
        advance_run_to_queued(&store, "RUN-runtime-002").await;
        store
            .acquire_lease(
                &lease_for(
                    "LEASE-runtime-0001",
                    "RUN-runtime-001",
                    "crates/sirinx-core",
                    false,
                    '1',
                ),
                2_000,
            )
            .await
            .unwrap();

        let error = store
            .acquire_lease(
                &lease_for(
                    "LEASE-runtime-0002",
                    "RUN-runtime-002",
                    "crates/sirinx-core/src/agent_runtime.rs",
                    false,
                    '2',
                ),
                2_000,
            )
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::LeaseConflict { .. }
        ));
    }

    #[tokio::test]
    async fn one_source_writer_blocks_disjoint_writer_but_allows_disjoint_reader() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        for run in [
            run_named("RUN-runtime-001", "stage-maker", 1),
            run_named("RUN-runtime-002", "stage-writer", 1),
            run_named("RUN-runtime-003", "stage-checker", 1),
        ] {
            store.create_run(&run).await.unwrap();
            advance_run_to_queued(&store, &run.run_id).await;
        }
        store
            .acquire_lease(
                &lease_for(
                    "LEASE-runtime-0001",
                    "RUN-runtime-001",
                    "crates/sirinx-core",
                    true,
                    '1',
                ),
                2_000,
            )
            .await
            .unwrap();

        let writer_error = store
            .acquire_lease(
                &lease_for(
                    "LEASE-runtime-0002",
                    "RUN-runtime-002",
                    "crates/sirinx-store",
                    true,
                    '2',
                ),
                2_000,
            )
            .await
            .unwrap_err();
        assert!(matches!(
            writer_error,
            AgentRuntimeStoreError::LeaseConflict { .. }
        ));

        store
            .acquire_lease(
                &lease_for(
                    "LEASE-runtime-0003",
                    "RUN-runtime-003",
                    "docs/agent-runtime",
                    false,
                    '3',
                ),
                2_000,
            )
            .await
            .unwrap();
    }

    #[tokio::test]
    async fn missed_heartbeat_expires_before_a_new_writer_is_admitted() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store.create_run(&run()).await.unwrap();
        advance_run_to_queued(&store, "RUN-runtime-001").await;
        store
            .acquire_lease(&lease("LEASE-runtime-0001", "crates/sirinx-core"), 2_000)
            .await
            .unwrap();
        let mut replacement = lease("LEASE-runtime-0002", "crates/sirinx-core");
        replacement.issued_at_unix_ms = 6_000;
        replacement.heartbeat_due_at_unix_ms = 8_000;
        replacement.expires_at_unix_ms = 12_000;
        replacement.nonce_digest = "2".repeat(64);

        store.acquire_lease(&replacement, 6_000).await.unwrap();
        let expired = store
            .get_lease("LEASE-runtime-0001")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(expired.state, LeaseState::Expired);
    }

    #[tokio::test]
    async fn effect_unknown_receipt_requires_terminal_effect_unknown_run() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store.create_run(&run()).await.unwrap();

        let error = store
            .append_receipt(&receipt(
                "RECEIPT-runtime-001",
                ReceiptResult::EffectUnknown,
            ))
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::ReceiptRunMismatch { .. }
        ));
    }

    #[tokio::test]
    async fn pass_receipt_is_rejected_for_a_draft_run() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store.create_run(&run()).await.unwrap();

        let error = store
            .append_receipt(&receipt("RECEIPT-runtime-001", ReceiptResult::Pass))
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::ReceiptRunMismatch { .. }
        ));
    }

    #[tokio::test]
    async fn maker_self_pass_is_rejected_without_an_independent_checker() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store.create_run(&run()).await.unwrap();
        advance_run_to_verifying(
            &store,
            "RUN-runtime-001",
            "LEASE-runtime-0001",
            "crates/sirinx-core",
            '1',
        )
        .await;

        let error = store
            .append_receipt(&receipt("RECEIPT-runtime-001", ReceiptResult::Pass))
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::MissingEvidence {
                evidence: "prior independent checker PASS receipt",
                ..
            }
        ));
    }

    #[tokio::test]
    async fn checker_only_pass_cannot_finalize_the_task() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store
            .create_run(&run_as(
                "RUN-runtime-002",
                "stage-checker",
                42,
                "checker-principal",
                1,
            ))
            .await
            .unwrap();
        advance_run_to_verifying_as(
            &store,
            "RUN-runtime-002",
            42,
            "checker-principal",
            "LEASE-runtime-0002",
            "crates/sirinx-store",
            '2',
        )
        .await;
        store
            .append_receipt(&receipt_for_identity(
                "RECEIPT-runtime-checker",
                "RUN-runtime-002",
                42,
                "checker-principal",
                ReceiptResult::Pass,
            ))
            .await
            .unwrap();
        advance_task_to_verifying(&store).await;

        let error = store
            .transition_task(
                "TASK-runtime-001",
                &transition(7, RuntimeState::Receipted, 2_700),
            )
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::MissingEvidence {
                evidence: "independently verified maker PASS receipt",
                ..
            }
        ));
    }

    #[tokio::test]
    async fn pass_authority_rejects_non_maker_and_linked_checker_roles() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store
            .create_run(&run_as(
                "RUN-runtime-004",
                "stage-coordinator",
                36,
                "coordinator-principal",
                1,
            ))
            .await
            .unwrap();
        advance_run_to_verifying_as(
            &store,
            "RUN-runtime-004",
            36,
            "coordinator-principal",
            "LEASE-runtime-0004",
            "crates/sirinx-core",
            '4',
        )
        .await;
        let error = store
            .append_receipt(&receipt_for_identity(
                "RECEIPT-runtime-coordinator",
                "RUN-runtime-004",
                36,
                "coordinator-principal",
                ReceiptResult::Pass,
            ))
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::ReceiptRunMismatch { .. }
        ));

        store
            .create_run(&run_as(
                "RUN-runtime-002",
                "stage-checker",
                42,
                "checker-principal",
                1,
            ))
            .await
            .unwrap();
        advance_run_to_verifying_as(
            &store,
            "RUN-runtime-002",
            42,
            "checker-principal",
            "LEASE-runtime-0002",
            "crates/sirinx-store",
            '2',
        )
        .await;
        let mut checker = receipt_for_identity(
            "RECEIPT-runtime-checker",
            "RUN-runtime-002",
            42,
            "checker-principal",
            ReceiptResult::Pass,
        );
        checker.verification_receipt_id = Some("RECEIPT-runtime-other".into());
        let error = store.append_receipt(&checker).await.unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::ReceiptRunMismatch { .. }
        ));
    }

    #[tokio::test]
    async fn run_cannot_claim_receipted_without_a_verified_pass_receipt() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store.create_run(&run()).await.unwrap();
        advance_run_to_verifying(
            &store,
            "RUN-runtime-001",
            "LEASE-runtime-0001",
            "crates/sirinx-core",
            '1',
        )
        .await;

        let error = store
            .transition_run(
                "RUN-runtime-001",
                &transition(7, RuntimeState::Receipted, 2_100),
            )
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::MissingEvidence { .. }
        ));
    }

    #[tokio::test]
    async fn verified_pass_receipt_binds_receipted_then_succeeded_run() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store.create_run(&run()).await.unwrap();
        store
            .create_run(&run_as(
                "RUN-runtime-002",
                "stage-checker",
                42,
                "checker-principal",
                1,
            ))
            .await
            .unwrap();
        advance_run_to_verifying(
            &store,
            "RUN-runtime-001",
            "LEASE-runtime-0001",
            "crates/sirinx-core",
            '1',
        )
        .await;
        advance_run_to_verifying_as(
            &store,
            "RUN-runtime-002",
            42,
            "checker-principal",
            "LEASE-runtime-0002",
            "crates/sirinx-store",
            '2',
        )
        .await;
        store
            .append_receipt(&receipt_for_identity(
                "RECEIPT-runtime-checker",
                "RUN-runtime-002",
                42,
                "checker-principal",
                ReceiptResult::Pass,
            ))
            .await
            .unwrap();
        let mut maker_receipt = receipt("RECEIPT-runtime-001", ReceiptResult::Pass);
        maker_receipt.verification_receipt_id = Some("RECEIPT-runtime-checker".into());
        store.append_receipt(&maker_receipt).await.unwrap();

        let receipted = store
            .transition_run(
                "RUN-runtime-001",
                &transition(7, RuntimeState::Receipted, 2_100),
            )
            .await
            .unwrap();
        assert_eq!(
            receipted.result_receipt_id.as_deref(),
            Some("RECEIPT-runtime-001")
        );
        let succeeded = store
            .transition_run(
                "RUN-runtime-001",
                &transition(8, RuntimeState::Succeeded, 2_200),
            )
            .await
            .unwrap();
        assert_eq!(succeeded.state, RuntimeState::Succeeded);
        assert_eq!(
            succeeded.result_receipt_id.as_deref(),
            Some("RECEIPT-runtime-001")
        );
    }

    #[tokio::test]
    async fn receipt_append_is_rejected_after_task_success() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        for run in [
            run(),
            run_as(
                "RUN-runtime-002",
                "stage-checker",
                42,
                "checker-principal",
                1,
            ),
            run_named("RUN-runtime-003", "stage-late-evidence", 1),
        ] {
            store.create_run(&run).await.unwrap();
        }
        advance_run_to_verifying(
            &store,
            "RUN-runtime-001",
            "LEASE-runtime-0001",
            "crates/sirinx-core",
            '1',
        )
        .await;
        advance_run_to_verifying_as(
            &store,
            "RUN-runtime-002",
            42,
            "checker-principal",
            "LEASE-runtime-0002",
            "crates/sirinx-store",
            '2',
        )
        .await;
        advance_run_to_verifying(
            &store,
            "RUN-runtime-003",
            "LEASE-runtime-0003",
            "docs/agent-runtime",
            '3',
        )
        .await;
        store
            .append_receipt(&receipt_for_identity(
                "RECEIPT-runtime-checker",
                "RUN-runtime-002",
                42,
                "checker-principal",
                ReceiptResult::Pass,
            ))
            .await
            .unwrap();
        let mut maker_receipt = receipt("RECEIPT-runtime-001", ReceiptResult::Pass);
        maker_receipt.verification_receipt_id = Some("RECEIPT-runtime-checker".into());
        store.append_receipt(&maker_receipt).await.unwrap();
        advance_task_to_verifying(&store).await;
        store
            .transition_task(
                "TASK-runtime-001",
                &transition(7, RuntimeState::Receipted, 2_700),
            )
            .await
            .unwrap();
        store
            .transition_task(
                "TASK-runtime-001",
                &transition(8, RuntimeState::Succeeded, 2_800),
            )
            .await
            .unwrap();

        let error = store
            .append_receipt(&receipt_for(
                "RECEIPT-runtime-late",
                "RUN-runtime-003",
                ReceiptResult::Fail,
            ))
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::ReceiptChainFinalized {
                state: RuntimeState::Succeeded,
                ..
            }
        ));
    }

    #[tokio::test]
    async fn later_fail_receipt_prevents_task_success_projection() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store.create_run(&run()).await.unwrap();
        store
            .create_run(&run_named("RUN-runtime-002", "stage-checker", 1))
            .await
            .unwrap();
        store
            .create_run(&run_as(
                "RUN-runtime-003",
                "stage-independent-checker",
                42,
                "checker-principal",
                1,
            ))
            .await
            .unwrap();
        advance_run_to_verifying(
            &store,
            "RUN-runtime-001",
            "LEASE-runtime-0001",
            "crates/sirinx-core",
            '1',
        )
        .await;
        advance_run_to_verifying(
            &store,
            "RUN-runtime-002",
            "LEASE-runtime-0002",
            "crates/sirinx-store",
            '2',
        )
        .await;
        advance_run_to_verifying_as(
            &store,
            "RUN-runtime-003",
            42,
            "checker-principal",
            "LEASE-runtime-0003",
            "docs/agent-runtime",
            '3',
        )
        .await;
        store
            .append_receipt(&receipt_for_identity(
                "RECEIPT-runtime-checker",
                "RUN-runtime-003",
                42,
                "checker-principal",
                ReceiptResult::Pass,
            ))
            .await
            .unwrap();
        let mut maker_receipt = receipt("RECEIPT-runtime-001", ReceiptResult::Pass);
        maker_receipt.verification_receipt_id = Some("RECEIPT-runtime-checker".into());
        store.append_receipt(&maker_receipt).await.unwrap();
        store
            .append_receipt(&receipt_for(
                "RECEIPT-runtime-002",
                "RUN-runtime-002",
                ReceiptResult::Fail,
            ))
            .await
            .unwrap();
        advance_task_to_verifying(&store).await;

        let error = store
            .transition_task(
                "TASK-runtime-001",
                &transition(7, RuntimeState::Receipted, 2_700),
            )
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            AgentRuntimeStoreError::MissingEvidence { .. }
        ));
    }

    #[tokio::test]
    async fn receipt_chain_is_store_hashed_and_verified() {
        let store = MemoryStore::default();
        store.create_task(&task()).await.unwrap();
        store.create_run(&run()).await.unwrap();
        let checker = run_as(
            "RUN-runtime-002",
            "stage-checker",
            42,
            "checker-principal",
            1,
        );
        store.create_run(&checker).await.unwrap();
        advance_run_to_verifying(
            &store,
            "RUN-runtime-001",
            "LEASE-runtime-0001",
            "crates/sirinx-core",
            '1',
        )
        .await;
        advance_run_to_verifying_as(
            &store,
            "RUN-runtime-002",
            42,
            "checker-principal",
            "LEASE-runtime-0002",
            "crates/sirinx-store",
            '2',
        )
        .await;
        let first = store
            .append_receipt(&receipt_for_identity(
                "RECEIPT-runtime-checker",
                "RUN-runtime-002",
                42,
                "checker-principal",
                ReceiptResult::Pass,
            ))
            .await
            .unwrap();
        let mut maker_receipt = receipt("RECEIPT-runtime-001", ReceiptResult::Pass);
        maker_receipt.verification_receipt_id = Some("RECEIPT-runtime-checker".into());
        let second = store.append_receipt(&maker_receipt).await.unwrap();

        assert_eq!(
            second.previous_receipt_hash.as_deref(),
            Some(first.receipt_hash.as_str())
        );
        assert!(verify_receipt_hash(&second).unwrap());
    }

    #[test]
    fn migrations_have_fail_closed_agent_runtime_contract() {
        let foundation = include_str!("../migrations/0005_agent_runtime_core.sql");
        let runtime_access = include_str!("../migrations/0006_agent_runtime_runtime_access.sql");
        let tables = [
            "tasks",
            "task_events",
            "runs",
            "stage_leases",
            "action_tickets",
            "approval_grants",
            "outbox",
            "inbox_dedupe",
            "verification_runs",
            "receipts",
            "model_catalog",
            "a2a_peers",
            "artifacts",
        ];
        assert_eq!(
            foundation
                .lines()
                .filter(|line| line.starts_with("create table public.agent_runtime_"))
                .count(),
            tables.len()
        );
        for table in tables {
            let qualified = format!("public.agent_runtime_{table}");
            assert!(foundation.contains(&format!("create table {qualified}")));
            assert!(foundation.contains(&format!(
                "alter table {qualified} enable row level security;"
            )));
            assert!(foundation.contains(&format!(
                "alter table {qualified} force row level security;"
            )));
            assert!(runtime_access.contains(&format!(
                "revoke all privileges on table {qualified} from public;"
            )));
            assert!(runtime_access.contains(&format!(
                "alter table {qualified} owner to sirinx_agent_runtime_owner;"
            )));
        }
        let foundation_lowercase = foundation.to_ascii_lowercase();
        let access_lowercase = runtime_access.to_ascii_lowercase();
        assert!(!foundation_lowercase.contains("create policy"));
        assert_eq!(access_lowercase.matches("create policy ").count(), 13);
        assert!(!foundation_lowercase.contains("drop table"));
        assert!(!foundation_lowercase.contains("alter table public.web_"));
        assert!(!access_lowercase.contains("create role"));
        assert!(!access_lowercase.contains("password"));
        assert!(!access_lowercase.contains("disable row level security"));
        for table in ["task_events", "receipts", "inbox_dedupe", "artifacts"] {
            assert!(foundation.contains(&format!("agent_runtime_{table}_append_only_rows")));
            assert!(foundation.contains(&format!("agent_runtime_{table}_append_only_truncate")));
        }
        assert!(foundation.contains("agent_runtime_stage_leases_active_run_key"));
        assert!(foundation.contains("agent_runtime_stage_leases_active_writer_key"));
        assert!(foundation.contains("where state = 'ACTIVE' and source_write"));
        assert!(foundation.contains("nonce_digest varchar(64)"));
        assert!(!foundation
            .lines()
            .any(|line| line.trim_start().starts_with("nonce ")));
        assert!(foundation.contains("agent_runtime_receipts_task_root_key"));
        assert!(foundation.contains("agent_runtime_receipts_task_successor_key"));
        assert!(foundation.contains("agent_runtime_receipts_task_predecessor_fk"));

        for table in ["tasks", "task_events", "runs", "stage_leases", "receipts"] {
            assert!(
                runtime_access.contains(&format!("create policy agent_runtime_{table}_app_select"))
            );
            assert!(
                runtime_access.contains(&format!("create policy agent_runtime_{table}_app_insert"))
            );
        }
        for table in ["tasks", "runs", "stage_leases"] {
            assert!(
                runtime_access.contains(&format!("create policy agent_runtime_{table}_app_update"))
            );
        }
        for table in [
            "action_tickets",
            "approval_grants",
            "outbox",
            "inbox_dedupe",
            "verification_runs",
            "model_catalog",
            "a2a_peers",
            "artifacts",
        ] {
            let marker = format!("on table public.agent_runtime_{table} to");
            assert!(!runtime_access.contains(&marker));
        }
        assert!(runtime_access.contains(
            "alter function public.reject_agent_runtime_append_only_mutation()\n    set search_path = pg_catalog;"
        ));
        assert!(runtime_access.contains(
            "revoke all privileges on function public.reject_agent_runtime_append_only_mutation()\n    from public;"
        ));
        for sequence in [
            "agent_runtime_task_events_event_id_seq",
            "agent_runtime_outbox_outbox_id_seq",
            "agent_runtime_model_catalog_catalog_id_seq",
        ] {
            assert!(runtime_access.contains(&format!(
                "alter sequence public.{sequence}\n    owner to sirinx_agent_runtime_owner;"
            )));
        }
        for external_role in ["anon", "authenticated", "service_role"] {
            assert!(runtime_access.contains(external_role));
        }
    }
}
