//! Durable agent-runtime domain contracts.
//!
//! These types deliberately contain no database or scheduler behavior. Stores
//! apply their invariants atomically, while this module supplies the closed
//! state machine, lease validation, and canonical receipt hashing shared by the
//! in-memory and Postgres backends.

use std::collections::BTreeSet;

use serde::{Deserialize, Serialize};

/// Milliseconds since the Unix epoch in UTC.
///
/// Callers supply the clock so state and lease tests remain deterministic.
pub type UnixMillis = i64;

/// Closed lifecycle shared by durable tasks and stage runs.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RuntimeState {
    /// Created but not yet classified.
    Draft,
    /// Intake has established a bounded task shape.
    Triaged,
    /// A plan and scope are available.
    Planned,
    /// Work is waiting for admission.
    Queued,
    /// An exact stage lease has been issued.
    Leased,
    /// The bounded stage is executing locally.
    Running,
    /// An independent checker is inspecting the result.
    Checking,
    /// Policy gates have been evaluated.
    Guarded,
    /// An exact approval is required before continuing.
    WaitingApproval,
    /// A ticketed action is in progress.
    Executing,
    /// Read-back or independent evidence is being evaluated.
    Verifying,
    /// The append-only receipt has been committed.
    Receipted,
    /// The stage completed with durable evidence.
    Succeeded,
    /// The stage failed deterministically.
    Failed,
    /// A required prerequisite is unavailable.
    Blocked,
    /// The operator or coordinator canceled the stage.
    Canceled,
    /// Input failed a trust or policy boundary.
    Quarantined,
    /// More bounded operator input is required.
    InputRequired,
    /// Authentication or an action-specific approval is required.
    AuthRequired,
    /// An external effect cannot be proved and must never be retried blindly.
    EffectUnknown,
    /// Retry policy is exhausted.
    DeadLetter,
}

impl RuntimeState {
    /// Returns whether no further transition is permitted.
    pub fn is_terminal(self) -> bool {
        matches!(
            self,
            Self::Succeeded
                | Self::Failed
                | Self::Blocked
                | Self::Canceled
                | Self::Quarantined
                | Self::EffectUnknown
                | Self::DeadLetter
        )
    }

    /// Returns whether the ordered runtime contract permits `next`.
    pub fn can_transition_to(self, next: Self) -> bool {
        if self.is_terminal() || self == next {
            return false;
        }

        if matches!(
            next,
            Self::Failed
                | Self::Blocked
                | Self::Canceled
                | Self::Quarantined
                | Self::InputRequired
                | Self::AuthRequired
                | Self::DeadLetter
        ) {
            return true;
        }

        matches!(
            (self, next),
            (Self::Draft, Self::Triaged)
                | (Self::Triaged, Self::Planned)
                | (Self::Planned, Self::Queued)
                | (Self::Queued, Self::Leased)
                | (Self::Leased, Self::Running)
                | (
                    Self::Running,
                    Self::Checking | Self::Guarded | Self::Verifying
                )
                | (Self::Checking, Self::Guarded | Self::Verifying)
                | (
                    Self::Guarded,
                    Self::WaitingApproval | Self::Executing | Self::Verifying
                )
                | (Self::WaitingApproval, Self::Executing)
                | (Self::Executing, Self::Verifying | Self::EffectUnknown)
                | (Self::Verifying, Self::Receipted | Self::EffectUnknown)
                | (Self::Receipted, Self::Succeeded)
                | (Self::InputRequired, Self::Triaged)
                | (Self::AuthRequired, Self::Guarded | Self::WaitingApproval)
        )
    }
}

/// Coarse action class recorded on a task stage.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ActionClass {
    /// Read-only observation or analysis.
    A,
    /// Bounded local planning, coordination, fixture, or exact-lease work.
    B,
    /// Higher-risk local work requiring maker/checker separation.
    C,
    /// External or material mutation requiring an exact ticket.
    D,
    /// Prohibited or unknown work.
    X,
}

/// Durable lease lifecycle.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum LeaseState {
    /// The holder may use the exact paths and resources until expiry.
    Active,
    /// The deadline passed without a valid heartbeat.
    Expired,
    /// Authority revoked the lease.
    Revoked,
    /// The holder released the lease normally.
    Released,
}

/// Closed receipt verdict vocabulary.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ReceiptResult {
    /// Required checks passed.
    Pass,
    /// Required checks failed.
    Fail,
    /// Work could not proceed.
    Blocked,
    /// Evidence was insufficient.
    Unverified,
    /// Work was canceled before completion.
    Canceled,
    /// An external effect cannot be reconciled automatically.
    EffectUnknown,
}

impl ReceiptResult {
    const fn canonical_name(self) -> &'static str {
        match self {
            Self::Pass => "PASS",
            Self::Fail => "FAIL",
            Self::Blocked => "BLOCKED",
            Self::Unverified => "UNVERIFIED",
            Self::Canceled => "CANCELED",
            Self::EffectUnknown => "EFFECT_UNKNOWN",
        }
    }
}

/// Domain validation error returned before durable state is changed.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum AgentRuntimeError {
    /// A required string contains no usable value.
    #[error("{field} must not be empty")]
    EmptyField { field: &'static str },
    /// A bounded field exceeds its persistence contract.
    #[error("{field} exceeds {max_chars} characters")]
    FieldTooLong {
        field: &'static str,
        max_chars: usize,
    },
    /// A prefixed identifier does not follow the closed schema vocabulary.
    #[error("{field} has an invalid identifier")]
    InvalidIdentifier { field: &'static str },
    /// A role is outside the canonical 1 through 47 range.
    #[error("role id {0} is outside 1..=47")]
    InvalidRoleId(u16),
    /// Only L4 maker roles may hold source-mutating leases.
    #[error("role id {0} cannot hold a source-write lease")]
    SourceWriteRoleNotAllowed(u16),
    /// A persisted version must start at one.
    #[error("version must be at least one")]
    InvalidVersion,
    /// Compare-and-swap observed a different durable version.
    #[error("version conflict: expected {expected}, actual {actual}")]
    VersionConflict { expected: u64, actual: u64 },
    /// Incrementing a durable version would overflow.
    #[error("durable version overflow")]
    VersionOverflow,
    /// A transition skipped or reversed the ordered state machine.
    #[error("invalid runtime transition from {from:?} to {to:?}")]
    InvalidTransition {
        from: RuntimeState,
        to: RuntimeState,
    },
    /// Transition metadata omitted the reason required by a waiting/error state.
    #[error("state {0:?} requires a bounded blocker")]
    MissingBlocker(RuntimeState),
    /// A supplied timestamp is negative or moves durable time backwards.
    #[error("invalid timestamp order")]
    InvalidTimestampOrder,
    /// A lease path is broad, traverses upward, or is not normalized.
    #[error("lease path is not exact and normalized")]
    InvalidLeasePath,
    /// A lease repeats a path or resource.
    #[error("lease contains duplicate paths or resources")]
    DuplicateLeaseTarget,
    /// A field that is semantically a set contains the same value twice.
    #[error("{field} contains a duplicate value")]
    DuplicateValue { field: &'static str },
    /// Lease timing does not leave a valid heartbeat window.
    #[error("lease timing is invalid")]
    InvalidLeaseTiming,
    /// The requested operation requires an active lease.
    #[error("lease is not active")]
    LeaseNotActive,
    /// The lease expired before the requested operation.
    #[error("lease expired")]
    LeaseExpired,
    /// A digest is not lowercase hexadecimal with the required length.
    #[error("{field} is not a valid lowercase hexadecimal digest")]
    InvalidDigest { field: &'static str },
    /// A task envelope does not match the complete closed schema.
    #[error("task envelope is invalid")]
    InvalidEnvelope,
    /// A copied task-envelope identity differs from its durable row identity.
    #[error("task envelope field {field} does not match the durable task")]
    EnvelopeIdentityMismatch { field: &'static str },
    /// A receipted or successful run has no immutable receipt binding.
    #[error("state {0:?} requires a result receipt binding")]
    MissingReceiptBinding(RuntimeState),
    /// A pre-receipt run claims a result receipt binding.
    #[error("state {0:?} cannot carry a result receipt binding")]
    UnexpectedReceiptBinding(RuntimeState),
}

const MAX_ENVELOPE_LIST_ITEMS: usize = 256;
const MAX_ENVELOPE_TEXT_CHARS: usize = 2_048;
const MAX_ACTIONS: usize = 256;
const MAX_BUDGET_STEPS: u64 = 1_000_000;
const MAX_BUDGET_RUNTIME_SECONDS: u64 = 31_536_000;
const MAX_BUDGET_OUTPUT_BYTES: u64 = 1_099_511_627_776;
const MAX_BUDGET_EXTERNAL_CALLS: u64 = 1_000_000;
const MAX_BUDGET_COST_USD: f64 = 1_000_000_000.0;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct TaskEnvelopeV1 {
    schema_version: String,
    task_id: String,
    created_at: String,
    goal: String,
    constraints: Vec<String>,
    non_goals: Vec<String>,
    requested_by: TaskRequestedBy,
    data_class: TaskDataClass,
    repository: TaskRepository,
    #[serde(default)]
    plan_hash: Option<String>,
    #[serde(default)]
    scope_hash: Option<String>,
    requested_role_ids: Vec<u16>,
    action_manifest: Vec<TaskAction>,
    budgets: TaskBudgets,
    stop_conditions: Vec<String>,
    idempotency_key: String,
    #[serde(default)]
    approval_ticket_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct TaskRequestedBy {
    principal_id: String,
    assertion_ref: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
enum TaskDataClass {
    Public,
    Internal,
    Confidential,
    Restricted,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct TaskRepository {
    path: String,
    commit_sha: String,
    worktree_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct TaskAction {
    action: String,
    class: ActionClass,
    target: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct TaskBudgets {
    max_steps: u64,
    max_runtime_seconds: u64,
    max_output_bytes: u64,
    max_external_calls: u64,
    max_cost_usd: f64,
}

impl TaskEnvelopeV1 {
    fn validate(&self) -> Result<(), AgentRuntimeError> {
        if self.schema_version != "1.0" {
            return Err(AgentRuntimeError::InvalidEnvelope);
        }
        validate_prefixed_id(&self.task_id, "TASK-", "envelope.task_id")?;
        validate_rfc3339_shape(&self.created_at)?;
        validate_bounded_nonempty(&self.goal, "envelope.goal", 4_096)?;
        validate_string_list(
            &self.constraints,
            "envelope.constraints",
            false,
            MAX_ENVELOPE_LIST_ITEMS,
        )?;
        validate_string_list(
            &self.non_goals,
            "envelope.non_goals",
            false,
            MAX_ENVELOPE_LIST_ITEMS,
        )?;
        validate_bounded_nonempty(
            &self.requested_by.principal_id,
            "envelope.requested_by.principal_id",
            256,
        )?;
        validate_bounded_nonempty(
            &self.requested_by.assertion_ref,
            "envelope.requested_by.assertion_ref",
            MAX_ENVELOPE_TEXT_CHARS,
        )?;
        let _ = &self.data_class;
        validate_bounded_nonempty(
            &self.repository.path,
            "envelope.repository.path",
            MAX_ENVELOPE_TEXT_CHARS,
        )?;
        validate_hex(
            &self.repository.commit_sha,
            40,
            "envelope.repository.commit_sha",
        )?;
        validate_bounded_nonempty(
            &self.repository.worktree_id,
            "envelope.repository.worktree_id",
            256,
        )?;
        match (&self.plan_hash, &self.scope_hash) {
            (Some(plan_hash), Some(scope_hash)) => {
                validate_hex(plan_hash, 64, "envelope.plan_hash")?;
                validate_hex(scope_hash, 64, "envelope.scope_hash")?;
            }
            (None, None) => {}
            _ => return Err(AgentRuntimeError::InvalidEnvelope),
        }
        if self.requested_role_ids.is_empty()
            || self.requested_role_ids.len() > MAX_ENVELOPE_LIST_ITEMS
        {
            return Err(AgentRuntimeError::InvalidEnvelope);
        }
        let mut roles = BTreeSet::new();
        for role_id in &self.requested_role_ids {
            validate_role_id(*role_id)?;
            if !roles.insert(role_id) {
                return Err(AgentRuntimeError::DuplicateValue {
                    field: "envelope.requested_role_ids",
                });
            }
        }
        if self.action_manifest.len() > MAX_ACTIONS {
            return Err(AgentRuntimeError::InvalidEnvelope);
        }
        for action in &self.action_manifest {
            validate_bounded_nonempty(&action.action, "envelope.action", 256)?;
            validate_bounded_nonempty(
                &action.target,
                "envelope.action.target",
                MAX_ENVELOPE_TEXT_CHARS,
            )?;
            let _ = action.class;
        }
        if self.budgets.max_steps == 0
            || self.budgets.max_steps > MAX_BUDGET_STEPS
            || self.budgets.max_runtime_seconds == 0
            || self.budgets.max_runtime_seconds > MAX_BUDGET_RUNTIME_SECONDS
            || self.budgets.max_output_bytes == 0
            || self.budgets.max_output_bytes > MAX_BUDGET_OUTPUT_BYTES
            || self.budgets.max_external_calls > MAX_BUDGET_EXTERNAL_CALLS
            || !self.budgets.max_cost_usd.is_finite()
            || self.budgets.max_cost_usd < 0.0
            || self.budgets.max_cost_usd > MAX_BUDGET_COST_USD
        {
            return Err(AgentRuntimeError::InvalidEnvelope);
        }
        validate_string_list(
            &self.stop_conditions,
            "envelope.stop_conditions",
            true,
            MAX_ENVELOPE_LIST_ITEMS,
        )?;
        let key_len = self.idempotency_key.chars().count();
        if !(16..=256).contains(&key_len) || self.idempotency_key.trim().is_empty() {
            return Err(AgentRuntimeError::InvalidIdentifier {
                field: "envelope.idempotency_key",
            });
        }
        if self.approval_ticket_ids.len() > MAX_ENVELOPE_LIST_ITEMS {
            return Err(AgentRuntimeError::InvalidEnvelope);
        }
        let mut tickets = BTreeSet::new();
        for ticket_id in &self.approval_ticket_ids {
            validate_prefixed_id(ticket_id, "TKT-", "envelope.approval_ticket_id")?;
            if !tickets.insert(ticket_id) {
                return Err(AgentRuntimeError::DuplicateValue {
                    field: "envelope.approval_ticket_ids",
                });
            }
        }
        Ok(())
    }
}

/// Version-bound request to move a task or run to its next state.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StateTransition {
    /// Durable version the caller observed.
    pub expected_version: u64,
    /// Requested next state.
    pub next_state: RuntimeState,
    /// Deterministic caller-supplied UTC Unix timestamp.
    pub at_unix_ms: UnixMillis,
    /// Bounded reason for a wait, failure, quarantine, or unknown effect.
    pub blocker: Option<String>,
    /// Auth-layer-bound principal claim requesting the durable transition.
    ///
    /// This domain type validates and binds the claim; it does not authenticate
    /// the caller.
    pub actor_principal_id: String,
}

impl StateTransition {
    /// Validates CAS metadata independently of the current state.
    pub fn validate(&self) -> Result<(), AgentRuntimeError> {
        if self.expected_version == 0 {
            return Err(AgentRuntimeError::InvalidVersion);
        }
        if self.at_unix_ms < 0 {
            return Err(AgentRuntimeError::InvalidTimestampOrder);
        }
        validate_bounded_nonempty(&self.actor_principal_id, "actor_principal_id", 256)?;
        if let Some(blocker) = &self.blocker {
            validate_bounded_nonempty(blocker, "blocker", 1_024)?;
        }
        if state_requires_blocker(self.next_state)
            && self
                .blocker
                .as_deref()
                .is_none_or(|value| value.trim().is_empty())
        {
            return Err(AgentRuntimeError::MissingBlocker(self.next_state));
        }
        Ok(())
    }
}

/// Durable task plus its canonical task-envelope payload.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentTask {
    /// Stable `TASK-...` identifier.
    pub task_id: String,
    /// Fully validated `TaskEnvelopeV1` JSON.
    pub envelope: serde_json::Value,
    /// Caller-supplied deduplication key.
    pub idempotency_key: String,
    /// Current lifecycle state.
    pub state: RuntimeState,
    /// One-based compare-and-swap version.
    pub version: u64,
    /// Creation timestamp.
    pub created_at_unix_ms: UnixMillis,
    /// Last transition timestamp.
    pub updated_at_unix_ms: UnixMillis,
}

impl AgentTask {
    /// Creates a version-one draft after validating the complete envelope.
    pub fn new(
        task_id: impl Into<String>,
        idempotency_key: impl Into<String>,
        envelope: serde_json::Value,
        created_at_unix_ms: UnixMillis,
    ) -> Result<Self, AgentRuntimeError> {
        let task = Self {
            task_id: task_id.into(),
            envelope,
            idempotency_key: idempotency_key.into(),
            state: RuntimeState::Draft,
            version: 1,
            created_at_unix_ms,
            updated_at_unix_ms: created_at_unix_ms,
        };
        task.validate()?;
        Ok(task)
    }

    /// Rechecks the complete persisted envelope, identity bindings, version,
    /// and timestamps.
    pub fn validate(&self) -> Result<(), AgentRuntimeError> {
        validate_prefixed_id(&self.task_id, "TASK-", "task_id")?;
        let key_len = self.idempotency_key.chars().count();
        if !(16..=256).contains(&key_len) {
            return Err(AgentRuntimeError::InvalidIdentifier {
                field: "idempotency_key",
            });
        }
        if !self.envelope.is_object() {
            return Err(AgentRuntimeError::InvalidEnvelope);
        }
        let envelope: TaskEnvelopeV1 = serde_json::from_value(self.envelope.clone())
            .map_err(|_| AgentRuntimeError::InvalidEnvelope)?;
        envelope.validate()?;
        if envelope.task_id != self.task_id {
            return Err(AgentRuntimeError::EnvelopeIdentityMismatch { field: "taskId" });
        }
        if envelope.idempotency_key != self.idempotency_key {
            return Err(AgentRuntimeError::EnvelopeIdentityMismatch {
                field: "idempotencyKey",
            });
        }
        validate_version_and_time(
            self.version,
            self.created_at_unix_ms,
            self.updated_at_unix_ms,
        )
    }

    /// Applies a validated transition in memory after checking its CAS version.
    ///
    /// Durable stores still execute their own atomic compare-and-swap before
    /// committing the returned state.
    pub fn apply_transition(
        &mut self,
        transition: &StateTransition,
    ) -> Result<(), AgentRuntimeError> {
        apply_state_transition(
            &mut self.state,
            &mut self.version,
            &mut self.updated_at_unix_ms,
            transition,
        )
    }
}

/// One role/principal attempt within a durable task.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentRun {
    /// Stable `RUN-...` identifier.
    pub run_id: String,
    /// Owning task identifier.
    pub task_id: String,
    /// Plan-defined stage identifier.
    pub stage_id: String,
    /// Canonical Ronin role ID.
    pub role_id: u16,
    /// Observed runtime principal selected for this attempt.
    pub principal_id: String,
    /// Action class fixed before dispatch.
    pub action_class: ActionClass,
    /// Current lifecycle state.
    pub state: RuntimeState,
    /// One-based attempt number for the stage.
    pub attempt: u32,
    /// One-based compare-and-swap version.
    pub version: u64,
    /// Bounded reason for a wait or failure.
    pub blocker: Option<String>,
    /// Receipt that finalized the run, when present.
    pub result_receipt_id: Option<String>,
    /// Creation timestamp.
    pub created_at_unix_ms: UnixMillis,
    /// Last transition timestamp.
    pub updated_at_unix_ms: UnixMillis,
}

impl AgentRun {
    /// Creates a version-one draft run.
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        run_id: impl Into<String>,
        task_id: impl Into<String>,
        stage_id: impl Into<String>,
        role_id: u16,
        principal_id: impl Into<String>,
        action_class: ActionClass,
        attempt: u32,
        created_at_unix_ms: UnixMillis,
    ) -> Result<Self, AgentRuntimeError> {
        let run = Self {
            run_id: run_id.into(),
            task_id: task_id.into(),
            stage_id: stage_id.into(),
            role_id,
            principal_id: principal_id.into(),
            action_class,
            state: RuntimeState::Draft,
            attempt,
            version: 1,
            blocker: None,
            result_receipt_id: None,
            created_at_unix_ms,
            updated_at_unix_ms: created_at_unix_ms,
        };
        run.validate()?;
        Ok(run)
    }

    /// Validates the complete persisted shape.
    pub fn validate(&self) -> Result<(), AgentRuntimeError> {
        validate_prefixed_id(&self.run_id, "RUN-", "run_id")?;
        validate_prefixed_id(&self.task_id, "TASK-", "task_id")?;
        validate_bounded_nonempty(&self.stage_id, "stage_id", 160)?;
        validate_bounded_nonempty(&self.principal_id, "principal_id", 256)?;
        validate_role_id(self.role_id)?;
        if self.attempt == 0 {
            return Err(AgentRuntimeError::InvalidIdentifier { field: "attempt" });
        }
        if let Some(receipt_id) = &self.result_receipt_id {
            validate_prefixed_id(receipt_id, "RECEIPT-", "result_receipt_id")?;
        }
        if let Some(blocker) = &self.blocker {
            validate_bounded_nonempty(blocker, "blocker", 1_024)?;
        }
        if state_requires_blocker(self.state)
            && self
                .blocker
                .as_deref()
                .is_none_or(|value| value.trim().is_empty())
        {
            return Err(AgentRuntimeError::MissingBlocker(self.state));
        }
        match (self.state, self.result_receipt_id.is_some()) {
            (RuntimeState::Receipted | RuntimeState::Succeeded, false) => {
                return Err(AgentRuntimeError::MissingReceiptBinding(self.state));
            }
            (RuntimeState::Receipted | RuntimeState::Succeeded, true) | (_, false) => {}
            (_, true) => return Err(AgentRuntimeError::UnexpectedReceiptBinding(self.state)),
        }
        validate_version_and_time(
            self.version,
            self.created_at_unix_ms,
            self.updated_at_unix_ms,
        )
    }

    /// Applies a validated transition in memory after checking its CAS version.
    pub fn apply_transition(
        &mut self,
        transition: &StateTransition,
    ) -> Result<(), AgentRuntimeError> {
        apply_state_transition(
            &mut self.state,
            &mut self.version,
            &mut self.updated_at_unix_ms,
            transition,
        )?;
        self.blocker = transition
            .blocker
            .as_deref()
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned);
        self.validate()
    }
}

/// Exact path/resource lease for one stage run.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StageLease {
    /// Stable `LEASE-...` identifier.
    pub lease_id: String,
    /// Owning task.
    pub task_id: String,
    /// Owning run.
    pub run_id: String,
    /// Canonical role ID.
    pub role_id: u16,
    /// Runtime principal holding the lease.
    pub principal_id: String,
    /// Exact repository root.
    pub repository_path: String,
    /// Exact worktree identity.
    pub worktree_id: String,
    /// Normalized exact paths; parent/child overlap is treated as a conflict.
    pub paths: Vec<String>,
    /// Exact non-path resources; equality is treated as a global conflict.
    pub resources: Vec<String>,
    /// Whether this lease may mutate source under the repository/worktree.
    pub source_write: bool,
    /// SHA-256 of the unpredictable task-bound nonce; raw nonce is never durable.
    pub nonce_digest: String,
    /// Issue timestamp.
    pub issued_at_unix_ms: UnixMillis,
    /// Hard expiry timestamp.
    pub expires_at_unix_ms: UnixMillis,
    /// Expected heartbeat deadline.
    pub heartbeat_due_at_unix_ms: UnixMillis,
    /// One-based compare-and-swap version.
    pub version: u64,
    /// Current lease state.
    pub state: LeaseState,
}

impl StageLease {
    /// Validates identity, exact targets, digest, version, and timing for any
    /// persisted lease state.
    pub fn validate_persisted(&self) -> Result<(), AgentRuntimeError> {
        validate_prefixed_id(&self.lease_id, "LEASE-", "lease_id")?;
        validate_prefixed_id(&self.task_id, "TASK-", "task_id")?;
        validate_prefixed_id(&self.run_id, "RUN-", "run_id")?;
        validate_role_id(self.role_id)?;
        if self.source_write && !(37..=41).contains(&self.role_id) {
            return Err(AgentRuntimeError::SourceWriteRoleNotAllowed(self.role_id));
        }
        validate_bounded_nonempty(&self.principal_id, "principal_id", 256)?;
        validate_repository_path(&self.repository_path)?;
        validate_bounded_nonempty(&self.worktree_id, "worktree_id", 256)?;
        if self.version == 0 {
            return Err(AgentRuntimeError::InvalidVersion);
        }
        validate_hex(&self.nonce_digest, 64, "nonce_digest")?;
        if self.paths.is_empty() {
            return Err(AgentRuntimeError::EmptyField { field: "paths" });
        }

        let mut paths = BTreeSet::new();
        for path in &self.paths {
            validate_lease_path(path)?;
            if !paths.insert(path) {
                return Err(AgentRuntimeError::DuplicateLeaseTarget);
            }
        }
        let mut resources = BTreeSet::new();
        for resource in &self.resources {
            validate_bounded_nonempty(resource, "resource", 2_048)?;
            if !resources.insert(resource) {
                return Err(AgentRuntimeError::DuplicateLeaseTarget);
            }
        }
        if self.issued_at_unix_ms < 0
            || self.heartbeat_due_at_unix_ms <= self.issued_at_unix_ms
            || self.expires_at_unix_ms < self.heartbeat_due_at_unix_ms
        {
            return Err(AgentRuntimeError::InvalidLeaseTiming);
        }
        Ok(())
    }

    /// Validates a newly issued active lease.
    pub fn validate_for_acquire(&self) -> Result<(), AgentRuntimeError> {
        self.validate_persisted()?;
        if self.version != 1 {
            return Err(AgentRuntimeError::InvalidVersion);
        }
        if self.state != LeaseState::Active {
            return Err(AgentRuntimeError::LeaseNotActive);
        }
        Ok(())
    }

    /// Returns whether this lease is active at the supplied deterministic time.
    pub fn is_active_at(&self, now_unix_ms: UnixMillis) -> bool {
        self.state == LeaseState::Active
            && now_unix_ms <= self.heartbeat_due_at_unix_ms
            && now_unix_ms <= self.expires_at_unix_ms
    }

    /// Returns whether exact path or resource ownership overlaps another lease.
    pub fn conflicts_with(&self, other: &Self) -> bool {
        let path_conflict = self.repository_path == other.repository_path
            && self.worktree_id == other.worktree_id
            && self
                .paths
                .iter()
                .any(|left| other.paths.iter().any(|right| paths_overlap(left, right)));
        let resource_conflict = self
            .resources
            .iter()
            .any(|left| other.resources.iter().any(|right| left == right));
        let writer_conflict = self.source_write
            && other.source_write
            && self.repository_path == other.repository_path
            && self.worktree_id == other.worktree_id;
        let run_conflict = self.run_id == other.run_id;
        path_conflict || resource_conflict || writer_conflict || run_conflict
    }

    /// Extends an active lease using compare-and-swap semantics.
    pub fn heartbeat(
        &mut self,
        expected_version: u64,
        now_unix_ms: UnixMillis,
        heartbeat_due_at_unix_ms: UnixMillis,
        expires_at_unix_ms: UnixMillis,
    ) -> Result<(), AgentRuntimeError> {
        self.require_mutable(expected_version, now_unix_ms)?;
        if heartbeat_due_at_unix_ms <= now_unix_ms
            || expires_at_unix_ms < heartbeat_due_at_unix_ms
            || expires_at_unix_ms < self.expires_at_unix_ms
        {
            return Err(AgentRuntimeError::InvalidLeaseTiming);
        }
        self.heartbeat_due_at_unix_ms = heartbeat_due_at_unix_ms;
        self.expires_at_unix_ms = expires_at_unix_ms;
        self.version = self
            .version
            .checked_add(1)
            .ok_or(AgentRuntimeError::VersionOverflow)?;
        Ok(())
    }

    /// Releases an unexpired active lease using compare-and-swap semantics.
    pub fn release(
        &mut self,
        expected_version: u64,
        now_unix_ms: UnixMillis,
    ) -> Result<(), AgentRuntimeError> {
        self.require_mutable(expected_version, now_unix_ms)?;
        self.state = LeaseState::Released;
        self.version = self
            .version
            .checked_add(1)
            .ok_or(AgentRuntimeError::VersionOverflow)?;
        Ok(())
    }

    fn require_mutable(
        &self,
        expected_version: u64,
        now_unix_ms: UnixMillis,
    ) -> Result<(), AgentRuntimeError> {
        if self.version != expected_version {
            return Err(AgentRuntimeError::VersionConflict {
                expected: expected_version,
                actual: self.version,
            });
        }
        if self.state != LeaseState::Active {
            return Err(AgentRuntimeError::LeaseNotActive);
        }
        if now_unix_ms < self.issued_at_unix_ms {
            return Err(AgentRuntimeError::InvalidTimestampOrder);
        }
        if now_unix_ms > self.heartbeat_due_at_unix_ms || now_unix_ms > self.expires_at_unix_ms {
            return Err(AgentRuntimeError::LeaseExpired);
        }
        Ok(())
    }
}

/// Caller-supplied receipt data before the store binds it to a hash chain.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunReceiptDraft {
    /// Stable `RECEIPT-...` identifier.
    pub receipt_id: String,
    /// Owning task.
    pub task_id: String,
    /// Finalized run.
    pub run_id: String,
    /// Canonical role ID.
    pub role_id: u16,
    /// Runtime principal that produced the bounded result.
    pub principal_id: String,
    /// Exact repository commit.
    pub commit_sha: String,
    /// Immutable plan digest.
    pub plan_hash: String,
    /// Immutable scope digest.
    pub scope_hash: String,
    /// Immutable action digest.
    pub action_digest: String,
    /// Closed result verdict.
    pub result: ReceiptResult,
    /// Digests of bounded result artifacts.
    pub artifact_digests: Vec<String>,
    /// Independent verification receipt, when applicable.
    pub verification_receipt_id: Option<String>,
    /// Stage start timestamp.
    pub started_at_unix_ms: UnixMillis,
    /// Stage end timestamp.
    pub ended_at_unix_ms: UnixMillis,
}

impl RunReceiptDraft {
    /// Validates all caller-controlled receipt fields.
    pub fn validate(&self) -> Result<(), AgentRuntimeError> {
        validate_prefixed_id(&self.receipt_id, "RECEIPT-", "receipt_id")?;
        validate_prefixed_id(&self.task_id, "TASK-", "task_id")?;
        validate_prefixed_id(&self.run_id, "RUN-", "run_id")?;
        validate_role_id(self.role_id)?;
        validate_bounded_nonempty(&self.principal_id, "principal_id", 256)?;
        validate_hex(&self.commit_sha, 40, "commit_sha")?;
        validate_hex(&self.plan_hash, 64, "plan_hash")?;
        validate_hex(&self.scope_hash, 64, "scope_hash")?;
        validate_hex(&self.action_digest, 64, "action_digest")?;
        if let Some(receipt_id) = &self.verification_receipt_id {
            validate_prefixed_id(receipt_id, "RECEIPT-", "verification_receipt_id")?;
        }
        let mut digests = BTreeSet::new();
        for digest in &self.artifact_digests {
            validate_hex(digest, 64, "artifact_digest")?;
            if !digests.insert(digest) {
                return Err(AgentRuntimeError::DuplicateValue {
                    field: "artifact_digests",
                });
            }
        }
        if self.started_at_unix_ms < 0 || self.ended_at_unix_ms < self.started_at_unix_ms {
            return Err(AgentRuntimeError::InvalidTimestampOrder);
        }
        Ok(())
    }
}

/// Store-produced append-only receipt with a canonical predecessor and hash.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunReceipt {
    /// Hash of the previous receipt for the task, or `None` for the chain head.
    pub previous_receipt_hash: Option<String>,
    /// Caller-supplied bounded receipt fields.
    #[serde(flatten)]
    pub draft: RunReceiptDraft,
    /// Canonical SHA-256 over the predecessor plus every draft field.
    pub receipt_hash: String,
}

impl RunReceipt {
    /// Validates the persisted shape without trusting the hash contents.
    ///
    /// `AgentRuntimeStore` implementations additionally recompute the canonical
    /// hash before returning a receipt.
    pub fn validate(&self) -> Result<(), AgentRuntimeError> {
        self.draft.validate()?;
        if let Some(previous) = &self.previous_receipt_hash {
            validate_hex(previous, 64, "previous_receipt_hash")?;
        }
        validate_hex(&self.receipt_hash, 64, "receipt_hash")
    }
}

fn state_requires_blocker(state: RuntimeState) -> bool {
    matches!(
        state,
        RuntimeState::Failed
            | RuntimeState::Blocked
            | RuntimeState::Quarantined
            | RuntimeState::InputRequired
            | RuntimeState::AuthRequired
            | RuntimeState::EffectUnknown
            | RuntimeState::DeadLetter
    )
}

fn apply_state_transition(
    state: &mut RuntimeState,
    version: &mut u64,
    updated_at_unix_ms: &mut UnixMillis,
    transition: &StateTransition,
) -> Result<(), AgentRuntimeError> {
    transition.validate()?;
    if *version != transition.expected_version {
        return Err(AgentRuntimeError::VersionConflict {
            expected: transition.expected_version,
            actual: *version,
        });
    }
    if transition.at_unix_ms < *updated_at_unix_ms {
        return Err(AgentRuntimeError::InvalidTimestampOrder);
    }
    if !state.can_transition_to(transition.next_state) {
        return Err(AgentRuntimeError::InvalidTransition {
            from: *state,
            to: transition.next_state,
        });
    }
    *state = transition.next_state;
    *version = version
        .checked_add(1)
        .ok_or(AgentRuntimeError::VersionOverflow)?;
    *updated_at_unix_ms = transition.at_unix_ms;
    Ok(())
}

fn validate_version_and_time(
    version: u64,
    created_at_unix_ms: UnixMillis,
    updated_at_unix_ms: UnixMillis,
) -> Result<(), AgentRuntimeError> {
    if version == 0 {
        return Err(AgentRuntimeError::InvalidVersion);
    }
    if created_at_unix_ms < 0 || updated_at_unix_ms < created_at_unix_ms {
        return Err(AgentRuntimeError::InvalidTimestampOrder);
    }
    Ok(())
}

fn validate_nonempty(value: &str, field: &'static str) -> Result<(), AgentRuntimeError> {
    if value.trim().is_empty() {
        Err(AgentRuntimeError::EmptyField { field })
    } else {
        Ok(())
    }
}

fn validate_bounded_nonempty(
    value: &str,
    field: &'static str,
    max_chars: usize,
) -> Result<(), AgentRuntimeError> {
    validate_nonempty(value, field)?;
    if value.chars().count() > max_chars {
        Err(AgentRuntimeError::FieldTooLong { field, max_chars })
    } else {
        Ok(())
    }
}

fn validate_string_list(
    values: &[String],
    field: &'static str,
    require_nonempty: bool,
    max_items: usize,
) -> Result<(), AgentRuntimeError> {
    if (require_nonempty && values.is_empty()) || values.len() > max_items {
        return Err(AgentRuntimeError::InvalidEnvelope);
    }
    for value in values {
        validate_bounded_nonempty(value, field, MAX_ENVELOPE_TEXT_CHARS)?;
    }
    Ok(())
}

fn validate_rfc3339_shape(value: &str) -> Result<(), AgentRuntimeError> {
    let bytes = value.as_bytes();
    if !(20..=35).contains(&bytes.len())
        || !bytes.is_ascii()
        || bytes.get(4) != Some(&b'-')
        || bytes.get(7) != Some(&b'-')
        || bytes.get(10) != Some(&b'T')
        || bytes.get(13) != Some(&b':')
        || bytes.get(16) != Some(&b':')
    {
        return Err(AgentRuntimeError::InvalidEnvelope);
    }
    let number = |start: usize, end: usize| -> Option<u32> {
        let digits = bytes.get(start..end)?;
        digits.iter().all(u8::is_ascii_digit).then(|| {
            digits
                .iter()
                .fold(0, |value, digit| value * 10 + u32::from(*digit - b'0'))
        })
    };
    let year = number(0, 4).ok_or(AgentRuntimeError::InvalidEnvelope)?;
    let month = number(5, 7).ok_or(AgentRuntimeError::InvalidEnvelope)?;
    let day = number(8, 10).ok_or(AgentRuntimeError::InvalidEnvelope)?;
    let hour = number(11, 13).ok_or(AgentRuntimeError::InvalidEnvelope)?;
    let minute = number(14, 16).ok_or(AgentRuntimeError::InvalidEnvelope)?;
    let second = number(17, 19).ok_or(AgentRuntimeError::InvalidEnvelope)?;
    let leap_year = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    let days_in_month = match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 if leap_year => 29,
        2 => 28,
        _ => return Err(AgentRuntimeError::InvalidEnvelope),
    };
    if day == 0 || day > days_in_month || hour > 23 || minute > 59 || second > 60 {
        return Err(AgentRuntimeError::InvalidEnvelope);
    }

    let mut timezone_start = 19;
    if bytes.get(timezone_start) == Some(&b'.') {
        timezone_start += 1;
        let fraction_start = timezone_start;
        while bytes.get(timezone_start).is_some_and(u8::is_ascii_digit) {
            timezone_start += 1;
        }
        if timezone_start == fraction_start || timezone_start - fraction_start > 9 {
            return Err(AgentRuntimeError::InvalidEnvelope);
        }
    }
    match bytes.get(timezone_start..) {
        Some(b"Z") => Ok(()),
        Some(offset)
            if offset.len() == 6
                && matches!(offset[0], b'+' | b'-')
                && offset[3] == b':'
                && offset[1..3].iter().all(u8::is_ascii_digit)
                && offset[4..6].iter().all(u8::is_ascii_digit) =>
        {
            let offset_hour = u32::from(offset[1] - b'0') * 10 + u32::from(offset[2] - b'0');
            let offset_minute = u32::from(offset[4] - b'0') * 10 + u32::from(offset[5] - b'0');
            if offset_hour <= 23 && offset_minute <= 59 {
                Ok(())
            } else {
                Err(AgentRuntimeError::InvalidEnvelope)
            }
        }
        _ => Err(AgentRuntimeError::InvalidEnvelope),
    }
}

fn validate_role_id(role_id: u16) -> Result<(), AgentRuntimeError> {
    if (1..=47).contains(&role_id) {
        Ok(())
    } else {
        Err(AgentRuntimeError::InvalidRoleId(role_id))
    }
}

fn validate_prefixed_id(
    value: &str,
    prefix: &str,
    field: &'static str,
) -> Result<(), AgentRuntimeError> {
    if value.chars().count() > 160 {
        return Err(AgentRuntimeError::FieldTooLong {
            field,
            max_chars: 160,
        });
    }
    let Some(suffix) = value.strip_prefix(prefix) else {
        return Err(AgentRuntimeError::InvalidIdentifier { field });
    };
    if suffix.is_empty()
        || !suffix
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-'))
    {
        return Err(AgentRuntimeError::InvalidIdentifier { field });
    }
    Ok(())
}

fn validate_lease_path(path: &str) -> Result<(), AgentRuntimeError> {
    if path.chars().count() > 2_048
        || path.is_empty()
        || path == "/"
        || path.ends_with('/')
        || path.contains('\0')
        || path
            .split('/')
            .any(|segment| segment.is_empty() || matches!(segment, "." | ".."))
    {
        return Err(AgentRuntimeError::InvalidLeasePath);
    }
    Ok(())
}

fn validate_repository_path(path: &str) -> Result<(), AgentRuntimeError> {
    if path.chars().count() > 2_048
        || !path.starts_with('/')
        || path == "/"
        || path.ends_with('/')
        || path.contains('\0')
        || path[1..]
            .split('/')
            .any(|segment| segment.is_empty() || matches!(segment, "." | ".."))
    {
        return Err(AgentRuntimeError::InvalidLeasePath);
    }
    Ok(())
}

fn paths_overlap(left: &str, right: &str) -> bool {
    left == right
        || left
            .strip_prefix(right)
            .is_some_and(|suffix| suffix.starts_with('/'))
        || right
            .strip_prefix(left)
            .is_some_and(|suffix| suffix.starts_with('/'))
}

fn validate_hex(
    value: &str,
    expected_len: usize,
    field: &'static str,
) -> Result<(), AgentRuntimeError> {
    if value.len() != expected_len
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
    {
        return Err(AgentRuntimeError::InvalidDigest { field });
    }
    Ok(())
}

/// Returns the deterministic, length-framed bytes stores must hash for a receipt.
///
/// Artifact digests are sorted because the schema treats them as a unique set.
/// A store derives `previous_receipt_hash` atomically and then hashes the
/// returned bytes with SHA-256; callers never provide a final receipt hash.
pub fn canonical_receipt_bytes(
    draft: &RunReceiptDraft,
    previous_receipt_hash: Option<&str>,
) -> Result<Vec<u8>, AgentRuntimeError> {
    draft.validate()?;
    if let Some(previous) = previous_receipt_hash {
        validate_hex(previous, 64, "previous_receipt_hash")?;
    }
    let mut canonical = Vec::with_capacity(1024);
    push_field(&mut canonical, "schemaVersion", b"1.0");
    push_optional_field(
        &mut canonical,
        "previousReceiptHash",
        previous_receipt_hash.map(str::as_bytes),
    );
    push_field(&mut canonical, "receiptId", draft.receipt_id.as_bytes());
    push_field(&mut canonical, "taskId", draft.task_id.as_bytes());
    push_field(&mut canonical, "runId", draft.run_id.as_bytes());
    push_field(&mut canonical, "roleId", &draft.role_id.to_be_bytes());
    push_field(&mut canonical, "principalId", draft.principal_id.as_bytes());
    push_field(&mut canonical, "commitSha", draft.commit_sha.as_bytes());
    push_field(&mut canonical, "planHash", draft.plan_hash.as_bytes());
    push_field(&mut canonical, "scopeHash", draft.scope_hash.as_bytes());
    push_field(
        &mut canonical,
        "actionDigest",
        draft.action_digest.as_bytes(),
    );
    push_field(
        &mut canonical,
        "result",
        draft.result.canonical_name().as_bytes(),
    );
    let mut artifact_digests: Vec<_> = draft.artifact_digests.iter().collect();
    artifact_digests.sort_unstable();
    push_field(
        &mut canonical,
        "artifactDigestCount",
        &(artifact_digests.len() as u64).to_be_bytes(),
    );
    for digest in artifact_digests {
        push_field(&mut canonical, "artifactDigest", digest.as_bytes());
    }
    push_optional_field(
        &mut canonical,
        "verificationReceiptId",
        draft.verification_receipt_id.as_deref().map(str::as_bytes),
    );
    push_field(
        &mut canonical,
        "startedAtUnixMs",
        &draft.started_at_unix_ms.to_be_bytes(),
    );
    push_field(
        &mut canonical,
        "endedAtUnixMs",
        &draft.ended_at_unix_ms.to_be_bytes(),
    );
    Ok(canonical)
}

fn push_field(target: &mut Vec<u8>, name: &str, value: &[u8]) {
    target.extend_from_slice(&(name.len() as u32).to_be_bytes());
    target.extend_from_slice(name.as_bytes());
    target.extend_from_slice(&(value.len() as u64).to_be_bytes());
    target.extend_from_slice(value);
}

fn push_optional_field(target: &mut Vec<u8>, name: &str, value: Option<&[u8]>) {
    match value {
        Some(value) => {
            target.push(1);
            push_field(target, name, value);
        }
        None => {
            target.push(0);
            push_field(target, name, &[]);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn digest(character: char, len: usize) -> String {
        std::iter::repeat_n(character, len).collect()
    }

    fn task_envelope() -> serde_json::Value {
        serde_json::json!({
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
                "commitSha": digest('a', 40),
                "worktreeId": "worktree-a"
            },
            "planHash": digest('b', 64),
            "scopeHash": digest('c', 64),
            "requestedRoleIds": [37, 42],
            "actionManifest": [{
                "action": "edit",
                "class": "B",
                "target": "crates/sirinx-core/src/agent_runtime.rs"
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
        })
    }

    fn receipt_draft(receipt_id: &str, result: ReceiptResult) -> RunReceiptDraft {
        RunReceiptDraft {
            receipt_id: receipt_id.into(),
            task_id: "TASK-runtime-001".into(),
            run_id: "RUN-runtime-001".into(),
            role_id: 37,
            principal_id: "codex".into(),
            commit_sha: digest('a', 40),
            plan_hash: digest('b', 64),
            scope_hash: digest('c', 64),
            action_digest: digest('d', 64),
            result,
            artifact_digests: vec![digest('e', 64)],
            verification_receipt_id: None,
            started_at_unix_ms: 1_000,
            ended_at_unix_ms: 2_000,
        }
    }

    #[test]
    fn effect_unknown_is_terminal_and_cannot_transition() {
        assert!(RuntimeState::EffectUnknown.is_terminal());
        assert!(!RuntimeState::EffectUnknown.can_transition_to(RuntimeState::Queued));
    }

    #[test]
    fn effect_unknown_requires_an_executing_or_verifying_predecessor() {
        assert!(RuntimeState::Executing.can_transition_to(RuntimeState::EffectUnknown));
        assert!(!RuntimeState::Running.can_transition_to(RuntimeState::EffectUnknown));
    }

    #[test]
    fn task_transition_rejects_a_stale_version() {
        let mut task = AgentTask::new(
            "TASK-runtime-001",
            "idempotency-key-0001",
            task_envelope(),
            1_000,
        )
        .unwrap();
        let error = task
            .apply_transition(&StateTransition {
                expected_version: 2,
                next_state: RuntimeState::Triaged,
                at_unix_ms: 2_000,
                blocker: None,
                actor_principal_id: "test-actor".into(),
            })
            .unwrap_err();

        assert_eq!(
            error,
            AgentRuntimeError::VersionConflict {
                expected: 2,
                actual: 1,
            }
        );
    }

    #[test]
    fn task_rejects_an_incomplete_envelope() {
        let mut envelope = task_envelope();
        envelope.as_object_mut().unwrap().remove("budgets");

        assert_eq!(
            AgentTask::new("TASK-runtime-001", "idempotency-key-0001", envelope, 1_000,)
                .unwrap_err(),
            AgentRuntimeError::InvalidEnvelope
        );
    }

    #[test]
    fn task_rejects_unknown_top_level_and_nested_fields() {
        let mut top_level = task_envelope();
        top_level
            .as_object_mut()
            .unwrap()
            .insert("unexpected".into(), serde_json::json!(true));
        assert_eq!(
            AgentTask::new("TASK-runtime-001", "idempotency-key-0001", top_level, 1_000,)
                .unwrap_err(),
            AgentRuntimeError::InvalidEnvelope
        );

        let mut nested = task_envelope();
        nested["repository"]
            .as_object_mut()
            .unwrap()
            .insert("unexpected".into(), serde_json::json!(true));
        assert_eq!(
            AgentTask::new("TASK-runtime-001", "idempotency-key-0001", nested, 1_000,).unwrap_err(),
            AgentRuntimeError::InvalidEnvelope
        );
    }

    #[test]
    fn leases_conflict_on_parent_and_child_paths() {
        let base = StageLease {
            lease_id: "LEASE-one-00000001".into(),
            task_id: "TASK-runtime-001".into(),
            run_id: "RUN-runtime-001".into(),
            role_id: 37,
            principal_id: "codex".into(),
            repository_path: "/repo".into(),
            worktree_id: "worktree-a".into(),
            paths: vec!["crates/sirinx-core".into()],
            resources: Vec::new(),
            source_write: true,
            nonce_digest: digest('1', 64),
            issued_at_unix_ms: 1_000,
            expires_at_unix_ms: 10_000,
            heartbeat_due_at_unix_ms: 5_000,
            version: 1,
            state: LeaseState::Active,
        };
        let mut nested = base.clone();
        nested.lease_id = "LEASE-two-00000002".into();
        nested.paths = vec!["crates/sirinx-core/src/lib.rs".into()];

        assert!(base.conflicts_with(&nested));
    }

    #[test]
    fn heartbeat_rejects_an_expired_lease() {
        let mut lease = StageLease {
            lease_id: "LEASE-one-00000001".into(),
            task_id: "TASK-runtime-001".into(),
            run_id: "RUN-runtime-001".into(),
            role_id: 37,
            principal_id: "codex".into(),
            repository_path: "/repo".into(),
            worktree_id: "worktree-a".into(),
            paths: vec!["crates/sirinx-core".into()],
            resources: Vec::new(),
            source_write: true,
            nonce_digest: digest('1', 64),
            issued_at_unix_ms: 1_000,
            expires_at_unix_ms: 10_000,
            heartbeat_due_at_unix_ms: 5_000,
            version: 1,
            state: LeaseState::Active,
        };

        let error = lease.heartbeat(1, 10_001, 15_000, 20_000).unwrap_err();
        assert_eq!(error, AgentRuntimeError::LeaseExpired);
    }

    #[test]
    fn persisted_lease_rejects_a_tampered_nonce_digest() {
        let lease = StageLease {
            lease_id: "LEASE-one-00000001".into(),
            task_id: "TASK-runtime-001".into(),
            run_id: "RUN-runtime-001".into(),
            role_id: 37,
            principal_id: "codex".into(),
            repository_path: "/repo".into(),
            worktree_id: "worktree-a".into(),
            paths: vec!["crates/sirinx-core".into()],
            resources: Vec::new(),
            source_write: true,
            nonce_digest: "not-a-digest".into(),
            issued_at_unix_ms: 1_000,
            expires_at_unix_ms: 10_000,
            heartbeat_due_at_unix_ms: 5_000,
            version: 2,
            state: LeaseState::Released,
        };

        assert!(matches!(
            lease.validate_persisted(),
            Err(AgentRuntimeError::InvalidDigest {
                field: "nonce_digest"
            })
        ));
    }

    #[test]
    fn source_write_lease_rejects_checker_role() {
        let lease = StageLease {
            lease_id: "LEASE-checker-00000001".into(),
            task_id: "TASK-runtime-001".into(),
            run_id: "RUN-runtime-checker".into(),
            role_id: 42,
            principal_id: "checker-principal".into(),
            repository_path: "/repo".into(),
            worktree_id: "worktree-a".into(),
            paths: vec!["crates/sirinx-core".into()],
            resources: Vec::new(),
            source_write: true,
            nonce_digest: digest('1', 64),
            issued_at_unix_ms: 1_000,
            expires_at_unix_ms: 10_000,
            heartbeat_due_at_unix_ms: 5_000,
            version: 1,
            state: LeaseState::Active,
        };

        assert_eq!(
            lease.validate_for_acquire().unwrap_err(),
            AgentRuntimeError::SourceWriteRoleNotAllowed(42)
        );
    }

    #[test]
    fn receipt_hash_is_canonical_across_artifact_order() {
        let mut left = receipt_draft("RECEIPT-runtime-001", ReceiptResult::Pass);
        left.artifact_digests = vec![digest('e', 64), digest('f', 64)];
        let mut right = left.clone();
        right.artifact_digests.reverse();

        let left = canonical_receipt_bytes(&left, None).unwrap();
        let right = canonical_receipt_bytes(&right, None).unwrap();
        assert_eq!(left, right);
    }
}
