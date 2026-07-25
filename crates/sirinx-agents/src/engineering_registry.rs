//! Pure engineering-agent catalog and run-plan validation.
//!
//! This module records which adapters may be considered for a bounded
//! engineering run. Validation never admits an agent, issues or consumes a
//! lease, starts a process, calls a provider, or mutates memory.

use std::collections::{HashMap, HashSet};
use std::path::{Component, Path, PathBuf};

/// Maximum number of catalog entries, including unbound future slots.
pub const REGISTERED_AGENT_CATALOG_LIMIT: usize = 16;
/// Maximum number of active worker instances in one engineering run.
pub const MAX_PARALLEL_ACTIVE_AGENTS: usize = 11;
/// Maximum number of source-write lease holders in one engineering run.
pub const MAX_PARALLEL_WRITERS: usize = 2;
/// Required number of independent verifiers for a source-writing run.
pub const INDEPENDENT_REVIEWERS: usize = 1;
/// Maximum validity window for one source-write lease.
pub const MAX_WRITE_LEASE_DURATION_SECONDS: u64 = 3_600;

/// Stable identity of a known engineering adapter.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum KnownAdapter {
    ClaudeCode,
    Codex,
    OpenCode,
    Kiro,
    Cline,
    AgyAntigravity,
    GitHubCopilot,
    Kimi,
    ZCode,
    Gemini,
    Qwen,
}

/// Stable identity of an unbound future-adapter slot.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FutureAdapterSlot {
    F01,
    F02,
    F03,
    F04,
    F05,
}

/// Catalog slot addressed by an engineering run request.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum EngineeringAdapterSlot {
    Known(KnownAdapter),
    Future(FutureAdapterSlot),
}

/// Inventory class of an adapter slot.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AdapterClass {
    Primary,
    NamedReserve,
    AdditionalReserve,
    Future,
}

/// Default runtime state of every registered adapter.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AdapterRuntimeState {
    DormantUnverified,
}

/// Structural prerequisite before a slot may be considered for a run.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AdapterAdmissionPolicy {
    EligibleLeaseRequired,
    IdentityBindingRequired,
}

/// Default authentication state of every registered adapter.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AdapterAuthentication {
    Unbound,
}

/// Provider access encoded by this catalog.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AdapterProviderAccess {
    Denied,
}

/// Memory authority available to worker agents.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AdapterMemoryAccess {
    ReadAllWriteProposalOnly,
}

/// Immutable metadata for one engineering-adapter catalog slot.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct EngineeringAgentCatalogEntry {
    pub slot: EngineeringAdapterSlot,
    pub class: AdapterClass,
    pub runtime_state: AdapterRuntimeState,
    pub admission_policy: AdapterAdmissionPolicy,
    pub authentication: AdapterAuthentication,
    pub provider_access: AdapterProviderAccess,
    pub memory_access: AdapterMemoryAccess,
}

impl EngineeringAgentCatalogEntry {
    const fn known(adapter: KnownAdapter, class: AdapterClass) -> Self {
        Self {
            slot: EngineeringAdapterSlot::Known(adapter),
            class,
            runtime_state: AdapterRuntimeState::DormantUnverified,
            admission_policy: AdapterAdmissionPolicy::EligibleLeaseRequired,
            authentication: AdapterAuthentication::Unbound,
            provider_access: AdapterProviderAccess::Denied,
            memory_access: AdapterMemoryAccess::ReadAllWriteProposalOnly,
        }
    }

    const fn future(slot: FutureAdapterSlot) -> Self {
        Self {
            slot: EngineeringAdapterSlot::Future(slot),
            class: AdapterClass::Future,
            runtime_state: AdapterRuntimeState::DormantUnverified,
            admission_policy: AdapterAdmissionPolicy::IdentityBindingRequired,
            authentication: AdapterAuthentication::Unbound,
            provider_access: AdapterProviderAccess::Denied,
            memory_access: AdapterMemoryAccess::ReadAllWriteProposalOnly,
        }
    }
}

const ENGINEERING_AGENT_CATALOG: [EngineeringAgentCatalogEntry; REGISTERED_AGENT_CATALOG_LIMIT] = [
    EngineeringAgentCatalogEntry::known(KnownAdapter::ClaudeCode, AdapterClass::Primary),
    EngineeringAgentCatalogEntry::known(KnownAdapter::Codex, AdapterClass::Primary),
    EngineeringAgentCatalogEntry::known(KnownAdapter::OpenCode, AdapterClass::Primary),
    EngineeringAgentCatalogEntry::known(KnownAdapter::Kiro, AdapterClass::NamedReserve),
    EngineeringAgentCatalogEntry::known(KnownAdapter::Cline, AdapterClass::NamedReserve),
    EngineeringAgentCatalogEntry::known(KnownAdapter::AgyAntigravity, AdapterClass::NamedReserve),
    EngineeringAgentCatalogEntry::known(KnownAdapter::GitHubCopilot, AdapterClass::NamedReserve),
    EngineeringAgentCatalogEntry::known(KnownAdapter::Kimi, AdapterClass::NamedReserve),
    EngineeringAgentCatalogEntry::known(KnownAdapter::ZCode, AdapterClass::AdditionalReserve),
    EngineeringAgentCatalogEntry::known(KnownAdapter::Gemini, AdapterClass::AdditionalReserve),
    EngineeringAgentCatalogEntry::known(KnownAdapter::Qwen, AdapterClass::AdditionalReserve),
    EngineeringAgentCatalogEntry::future(FutureAdapterSlot::F01),
    EngineeringAgentCatalogEntry::future(FutureAdapterSlot::F02),
    EngineeringAgentCatalogEntry::future(FutureAdapterSlot::F03),
    EngineeringAgentCatalogEntry::future(FutureAdapterSlot::F04),
    EngineeringAgentCatalogEntry::future(FutureAdapterSlot::F05),
];

/// Returns the immutable 16-slot engineering-agent catalog.
pub fn engineering_agent_catalog(
) -> &'static [EngineeringAgentCatalogEntry; REGISTERED_AGENT_CATALOG_LIMIT] {
    &ENGINEERING_AGENT_CATALOG
}

/// A principal named in a proposed engineering run.
///
/// Hermes is represented explicitly so validation can reject attempts to
/// admit the manager as a worker.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EngineeringPrincipal {
    Adapter(EngineeringAdapterSlot),
    HermesManager,
}

/// Execution role requested for one worker instance.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EngineeringRunRole {
    SourceWriter,
    IndependentVerifier,
    ReadOnlyContributor,
}

/// Whether a proposed run is allowed to contain source-writing work.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EngineeringRunMode {
    ReadOnly,
    SourceWriting,
}

/// Immutable identity binding required for an unassigned future slot.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FutureAdapterIdentityBinding {
    pub canonical_name: String,
    pub binary_name: String,
    pub version: String,
    pub immutable_source_sha256: String,
}

/// Proposed source-write lease carried by a run plan.
///
/// This is input for validation only. The registry cannot issue, activate,
/// consume, renew, or revoke a lease.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EngineeringWriteLease {
    pub lease_id: String,
    pub nonce: String,
    pub issued_at_unix_seconds: u64,
    pub expires_at_unix_seconds: u64,
    pub owned_path_prefixes: Vec<String>,
}

/// One requested worker instance in an engineering run plan.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EngineeringWorkerRequest {
    pub principal: EngineeringPrincipal,
    pub instance_id: String,
    pub role: EngineeringRunRole,
    pub base_sha: String,
    pub worktree: PathBuf,
    pub future_identity: Option<FutureAdapterIdentityBinding>,
    pub write_lease: Option<EngineeringWriteLease>,
}

/// Structurally bounded engineering run submitted for pure validation.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EngineeringRunPlan {
    pub mode: EngineeringRunMode,
    pub repository_root: PathBuf,
    pub worktree_root: PathBuf,
    pub base_sha: String,
    pub evaluated_at_unix_seconds: u64,
    pub workers: Vec<EngineeringWorkerRequest>,
}

/// Fail-closed structural validation errors for engineering run plans.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum EngineeringRunPlanError {
    #[error("an engineering run must contain at least one worker")]
    EmptyRun,
    #[error("active agent count {found} exceeds maximum {max}")]
    TooManyActiveAgents { found: usize, max: usize },
    #[error("repository root is not a normalized absolute path: {0:?}")]
    InvalidRepositoryRoot(PathBuf),
    #[error("worktree root is not a normalized absolute path: {0:?}")]
    InvalidWorktreeRoot(PathBuf),
    #[error("filesystem root cannot be used as a repository or worktree root: {0:?}")]
    FilesystemRootForbidden(PathBuf),
    #[error("repository and worktree roots overlap: {repository_root:?} and {worktree_root:?}")]
    OverlappingRepositoryAndWorktreeRoots {
        repository_root: PathBuf,
        worktree_root: PathBuf,
    },
    #[error("base SHA must contain exactly 40 hexadecimal characters: {0}")]
    InvalidBaseSha(String),
    #[error("worker instance id is empty or has surrounding whitespace")]
    InvalidInstanceId,
    #[error("worker instance id is duplicated: {0}")]
    DuplicateInstanceId(String),
    #[error("known adapter identity is duplicated in one run: {0:?}")]
    DuplicateKnownAdapter(KnownAdapter),
    #[error("future adapter identity is duplicated in one run: {0:?}")]
    DuplicateFutureAdapter(FutureAdapterSlot),
    #[error("Hermes is engineering manager only and cannot be admitted as a worker")]
    HermesCannotBeWorker,
    #[error("future adapter slot requires an immutable identity binding: {0:?}")]
    FutureIdentityBindingRequired(FutureAdapterSlot),
    #[error("known adapter must not carry a future-slot identity binding: {0:?}")]
    UnexpectedFutureIdentityBinding(KnownAdapter),
    #[error("future adapter identity binding is incomplete or invalid: {0:?}")]
    InvalidFutureIdentityBinding(FutureAdapterSlot),
    #[error("future adapter slot has conflicting identity bindings: {0:?}")]
    ConflictingFutureIdentityBinding(FutureAdapterSlot),
    #[error("immutable source digest is bound to multiple future slots: {first:?} and {second:?}")]
    FutureSourceDigestReused {
        first: FutureAdapterSlot,
        second: FutureAdapterSlot,
    },
    #[error("worker {instance_id} does not use the run base SHA")]
    BaseShaMismatch { instance_id: String },
    #[error("worker worktree is not a normalized absolute path: {0:?}")]
    InvalidWorktree(PathBuf),
    #[error("worker worktree is not a strict descendant of the worktree root: {0:?}")]
    WorktreeOutsideRoot(PathBuf),
    #[error("worker worktree overlaps the repository root: {0:?}")]
    WorktreeOverlapsRepositoryRoot(PathBuf),
    #[error("worker worktree is duplicated: {0:?}")]
    DuplicateWorktree(PathBuf),
    #[error("worker worktrees overlap: {first:?} and {second:?}")]
    OverlappingWorktrees { first: PathBuf, second: PathBuf },
    #[error("source writer {instance_id} has no write lease")]
    SourceWriterMissingLease { instance_id: String },
    #[error("non-writer {instance_id} must not hold a write lease")]
    NonWriterHasLease { instance_id: String },
    #[error("read-only run must not contain a source writer: {0}")]
    SourceWriterInReadOnlyRun(String),
    #[error("source-writing run must contain at least one source writer")]
    SourceWritingRunHasNoWriter,
    #[error("writer count {found} exceeds maximum {max}")]
    TooManyWriters { found: usize, max: usize },
    #[error("source-writing run requires exactly {required} independent verifier; found {found}")]
    IndependentVerifierCount { found: usize, required: usize },
    #[error("write lease id is empty or has surrounding whitespace")]
    InvalidLeaseId,
    #[error("write lease id is duplicated: {0}")]
    DuplicateLeaseId(String),
    #[error("write lease nonce is empty or has surrounding whitespace")]
    InvalidLeaseNonce,
    #[error("write lease nonce is duplicated: {0}")]
    DuplicateLeaseNonce(String),
    #[error("write lease {lease_id} must expire after its issue time")]
    InvalidLeaseExpiry { lease_id: String },
    #[error("write lease {lease_id} was issued after the plan evaluation time")]
    LeaseIssuedInFuture { lease_id: String },
    #[error("write lease {lease_id} is expired at the plan evaluation time")]
    LeaseExpired { lease_id: String },
    #[error("write lease {lease_id} exceeds the maximum duration of {max_seconds} seconds")]
    LeaseDurationTooLong { lease_id: String, max_seconds: u64 },
    #[error("write lease {lease_id} must own at least one path prefix")]
    EmptyOwnedPathPrefixes { lease_id: String },
    #[error("owned path prefix is not normalized and relative: {0}")]
    InvalidOwnedPathPrefix(String),
    #[error("owned path prefixes overlap: {first} and {second}")]
    OverlappingOwnedPathPrefixes { first: String, second: String },
}

/// Validates an engineering run plan without producing runtime authority.
///
/// A successful result means only that the proposal is structurally eligible
/// for a separate admission gate. It does not admit a worker or grant a lease.
///
/// # Errors
///
/// Returns [`EngineeringRunPlanError`] when a catalog, identity, concurrency,
/// independence, worktree, base-SHA, lease, or path-ownership invariant fails.
pub fn validate_engineering_run_plan(
    plan: &EngineeringRunPlan,
) -> Result<(), EngineeringRunPlanError> {
    if plan.workers.is_empty() {
        return Err(EngineeringRunPlanError::EmptyRun);
    }
    if plan.workers.len() > MAX_PARALLEL_ACTIVE_AGENTS {
        return Err(EngineeringRunPlanError::TooManyActiveAgents {
            found: plan.workers.len(),
            max: MAX_PARALLEL_ACTIVE_AGENTS,
        });
    }
    if !is_normalized_absolute_path(&plan.repository_root) {
        return Err(EngineeringRunPlanError::InvalidRepositoryRoot(
            plan.repository_root.clone(),
        ));
    }
    if is_filesystem_root(&plan.repository_root) {
        return Err(EngineeringRunPlanError::FilesystemRootForbidden(
            plan.repository_root.clone(),
        ));
    }
    if !is_normalized_absolute_path(&plan.worktree_root) {
        return Err(EngineeringRunPlanError::InvalidWorktreeRoot(
            plan.worktree_root.clone(),
        ));
    }
    if is_filesystem_root(&plan.worktree_root) {
        return Err(EngineeringRunPlanError::FilesystemRootForbidden(
            plan.worktree_root.clone(),
        ));
    }
    if absolute_paths_overlap(&plan.repository_root, &plan.worktree_root) {
        return Err(
            EngineeringRunPlanError::OverlappingRepositoryAndWorktreeRoots {
                repository_root: plan.repository_root.clone(),
                worktree_root: plan.worktree_root.clone(),
            },
        );
    }
    validate_base_sha(&plan.base_sha)?;

    let mut instance_ids = HashSet::new();
    let mut known_adapters = HashSet::new();
    let mut future_adapters = HashSet::new();
    let mut worktrees = Vec::with_capacity(plan.workers.len());
    let mut future_slot_bindings = HashMap::new();
    let mut future_source_digests = HashMap::new();
    let mut lease_ids = HashSet::new();
    let mut lease_nonces = HashSet::new();
    let mut owned_path_prefixes = Vec::new();
    let mut writer_count = 0;
    let mut independent_verifier_count = 0;

    for worker in &plan.workers {
        validate_normalized_identifier(&worker.instance_id)
            .map_err(|()| EngineeringRunPlanError::InvalidInstanceId)?;
        if !instance_ids.insert(worker.instance_id.as_str()) {
            return Err(EngineeringRunPlanError::DuplicateInstanceId(
                worker.instance_id.clone(),
            ));
        }
        if let EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Known(adapter)) =
            worker.principal
        {
            if !known_adapters.insert(adapter) {
                return Err(EngineeringRunPlanError::DuplicateKnownAdapter(adapter));
            }
        }
        if let EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(slot)) =
            worker.principal
        {
            if !future_adapters.insert(slot) {
                return Err(EngineeringRunPlanError::DuplicateFutureAdapter(slot));
            }
        }

        validate_principal_binding(
            worker,
            &mut future_slot_bindings,
            &mut future_source_digests,
        )?;
        validate_base_sha(&worker.base_sha)?;
        if !worker.base_sha.eq_ignore_ascii_case(&plan.base_sha) {
            return Err(EngineeringRunPlanError::BaseShaMismatch {
                instance_id: worker.instance_id.clone(),
            });
        }

        validate_worktree(plan, worker, &worktrees)?;
        worktrees.push(worker.worktree.as_path());

        match worker.role {
            EngineeringRunRole::SourceWriter => {
                if plan.mode == EngineeringRunMode::ReadOnly {
                    return Err(EngineeringRunPlanError::SourceWriterInReadOnlyRun(
                        worker.instance_id.clone(),
                    ));
                }
                let lease = worker.write_lease.as_ref().ok_or_else(|| {
                    EngineeringRunPlanError::SourceWriterMissingLease {
                        instance_id: worker.instance_id.clone(),
                    }
                })?;
                writer_count += 1;
                validate_write_lease(
                    lease,
                    plan.evaluated_at_unix_seconds,
                    &mut lease_ids,
                    &mut lease_nonces,
                    &mut owned_path_prefixes,
                )?;
            }
            EngineeringRunRole::IndependentVerifier => {
                independent_verifier_count += 1;
                if worker.write_lease.is_some() {
                    return Err(EngineeringRunPlanError::NonWriterHasLease {
                        instance_id: worker.instance_id.clone(),
                    });
                }
            }
            EngineeringRunRole::ReadOnlyContributor => {
                if worker.write_lease.is_some() {
                    return Err(EngineeringRunPlanError::NonWriterHasLease {
                        instance_id: worker.instance_id.clone(),
                    });
                }
            }
        }
    }

    if writer_count > MAX_PARALLEL_WRITERS {
        return Err(EngineeringRunPlanError::TooManyWriters {
            found: writer_count,
            max: MAX_PARALLEL_WRITERS,
        });
    }
    if plan.mode == EngineeringRunMode::SourceWriting {
        if writer_count == 0 {
            return Err(EngineeringRunPlanError::SourceWritingRunHasNoWriter);
        }
        if independent_verifier_count != INDEPENDENT_REVIEWERS {
            return Err(EngineeringRunPlanError::IndependentVerifierCount {
                found: independent_verifier_count,
                required: INDEPENDENT_REVIEWERS,
            });
        }
    }

    Ok(())
}

fn validate_principal_binding(
    worker: &EngineeringWorkerRequest,
    future_slot_bindings: &mut HashMap<FutureAdapterSlot, FutureAdapterIdentityBinding>,
    future_source_digests: &mut HashMap<String, FutureAdapterSlot>,
) -> Result<(), EngineeringRunPlanError> {
    match worker.principal {
        EngineeringPrincipal::HermesManager => Err(EngineeringRunPlanError::HermesCannotBeWorker),
        EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Known(adapter)) => {
            if worker.future_identity.is_some() {
                Err(EngineeringRunPlanError::UnexpectedFutureIdentityBinding(
                    adapter,
                ))
            } else {
                Ok(())
            }
        }
        EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(slot)) => {
            let binding = worker
                .future_identity
                .as_ref()
                .ok_or(EngineeringRunPlanError::FutureIdentityBindingRequired(slot))?;
            if is_normalized_nonempty(&binding.canonical_name)
                && is_normalized_nonempty(&binding.binary_name)
                && is_normalized_nonempty(&binding.version)
                && is_lower_hex_digest(&binding.immutable_source_sha256, 64)
            {
                if let Some(existing) = future_slot_bindings.get(&slot) {
                    if existing != binding {
                        return Err(EngineeringRunPlanError::ConflictingFutureIdentityBinding(
                            slot,
                        ));
                    }
                } else {
                    future_slot_bindings.insert(slot, binding.clone());
                }

                if let Some(existing_slot) =
                    future_source_digests.get(&binding.immutable_source_sha256)
                {
                    if *existing_slot != slot {
                        return Err(EngineeringRunPlanError::FutureSourceDigestReused {
                            first: *existing_slot,
                            second: slot,
                        });
                    }
                } else {
                    future_source_digests.insert(binding.immutable_source_sha256.clone(), slot);
                }

                Ok(())
            } else {
                Err(EngineeringRunPlanError::InvalidFutureIdentityBinding(slot))
            }
        }
    }
}

fn validate_worktree<'a>(
    plan: &EngineeringRunPlan,
    worker: &'a EngineeringWorkerRequest,
    existing_worktrees: &[&'a Path],
) -> Result<(), EngineeringRunPlanError> {
    if !is_normalized_absolute_path(&worker.worktree) {
        return Err(EngineeringRunPlanError::InvalidWorktree(
            worker.worktree.clone(),
        ));
    }
    if absolute_paths_overlap(&worker.worktree, &plan.repository_root) {
        return Err(EngineeringRunPlanError::WorktreeOverlapsRepositoryRoot(
            worker.worktree.clone(),
        ));
    }
    if worker.worktree == plan.worktree_root || !worker.worktree.starts_with(&plan.worktree_root) {
        return Err(EngineeringRunPlanError::WorktreeOutsideRoot(
            worker.worktree.clone(),
        ));
    }
    for existing in existing_worktrees {
        if worker.worktree == *existing {
            return Err(EngineeringRunPlanError::DuplicateWorktree(
                worker.worktree.clone(),
            ));
        }
        if worker.worktree.starts_with(existing) || existing.starts_with(&worker.worktree) {
            return Err(EngineeringRunPlanError::OverlappingWorktrees {
                first: (*existing).to_path_buf(),
                second: worker.worktree.clone(),
            });
        }
    }
    Ok(())
}

fn validate_write_lease<'a>(
    lease: &'a EngineeringWriteLease,
    evaluated_at_unix_seconds: u64,
    lease_ids: &mut HashSet<&'a str>,
    lease_nonces: &mut HashSet<&'a str>,
    all_owned_path_prefixes: &mut Vec<&'a str>,
) -> Result<(), EngineeringRunPlanError> {
    validate_normalized_identifier(&lease.lease_id)
        .map_err(|()| EngineeringRunPlanError::InvalidLeaseId)?;
    if !lease_ids.insert(lease.lease_id.as_str()) {
        return Err(EngineeringRunPlanError::DuplicateLeaseId(
            lease.lease_id.clone(),
        ));
    }
    validate_normalized_identifier(&lease.nonce)
        .map_err(|()| EngineeringRunPlanError::InvalidLeaseNonce)?;
    if !lease_nonces.insert(lease.nonce.as_str()) {
        return Err(EngineeringRunPlanError::DuplicateLeaseNonce(
            lease.nonce.clone(),
        ));
    }
    if lease.expires_at_unix_seconds <= lease.issued_at_unix_seconds {
        return Err(EngineeringRunPlanError::InvalidLeaseExpiry {
            lease_id: lease.lease_id.clone(),
        });
    }
    if lease.issued_at_unix_seconds > evaluated_at_unix_seconds {
        return Err(EngineeringRunPlanError::LeaseIssuedInFuture {
            lease_id: lease.lease_id.clone(),
        });
    }
    if evaluated_at_unix_seconds >= lease.expires_at_unix_seconds {
        return Err(EngineeringRunPlanError::LeaseExpired {
            lease_id: lease.lease_id.clone(),
        });
    }
    if lease.expires_at_unix_seconds - lease.issued_at_unix_seconds
        > MAX_WRITE_LEASE_DURATION_SECONDS
    {
        return Err(EngineeringRunPlanError::LeaseDurationTooLong {
            lease_id: lease.lease_id.clone(),
            max_seconds: MAX_WRITE_LEASE_DURATION_SECONDS,
        });
    }
    if lease.owned_path_prefixes.is_empty() {
        return Err(EngineeringRunPlanError::EmptyOwnedPathPrefixes {
            lease_id: lease.lease_id.clone(),
        });
    }
    for prefix in &lease.owned_path_prefixes {
        if !is_normalized_relative_path_prefix(prefix) {
            return Err(EngineeringRunPlanError::InvalidOwnedPathPrefix(
                prefix.clone(),
            ));
        }
        for existing in all_owned_path_prefixes.iter().copied() {
            if relative_path_prefixes_overlap(existing, prefix) {
                return Err(EngineeringRunPlanError::OverlappingOwnedPathPrefixes {
                    first: existing.to_owned(),
                    second: prefix.clone(),
                });
            }
        }
        all_owned_path_prefixes.push(prefix);
    }
    Ok(())
}

fn validate_base_sha(value: &str) -> Result<(), EngineeringRunPlanError> {
    if is_hex_digest(value, 40) {
        Ok(())
    } else {
        Err(EngineeringRunPlanError::InvalidBaseSha(value.to_owned()))
    }
}

fn is_hex_digest(value: &str, expected_length: usize) -> bool {
    value.len() == expected_length && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

fn is_lower_hex_digest(value: &str, expected_length: usize) -> bool {
    value.len() == expected_length
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || matches!(byte, b'a'..=b'f'))
}

fn validate_normalized_identifier(value: &str) -> Result<(), ()> {
    if is_normalized_nonempty(value) {
        Ok(())
    } else {
        Err(())
    }
}

fn is_normalized_nonempty(value: &str) -> bool {
    !value.is_empty() && value.trim() == value
}

fn is_normalized_absolute_path(path: &Path) -> bool {
    if !path.is_absolute() {
        return false;
    }
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            Component::Prefix(prefix) => normalized.push(prefix.as_os_str()),
            Component::RootDir => normalized.push(component.as_os_str()),
            Component::Normal(segment) => normalized.push(segment),
            Component::CurDir | Component::ParentDir => return false,
        }
    }
    normalized.as_os_str() == path.as_os_str()
}

fn is_filesystem_root(path: &Path) -> bool {
    path.parent().is_none()
}

fn absolute_paths_overlap(first: &Path, second: &Path) -> bool {
    first == second || first.starts_with(second) || second.starts_with(first)
}

fn is_normalized_relative_path_prefix(value: &str) -> bool {
    if value.is_empty()
        || value.starts_with('/')
        || value.ends_with('/')
        || value.contains("//")
        || value.contains('\\')
    {
        return false;
    }
    value
        .split('/')
        .all(|segment| !segment.is_empty() && segment != "." && segment != "..")
}

fn relative_path_prefixes_overlap(first: &str, second: &str) -> bool {
    path_prefix_contains(first, second) || path_prefix_contains(second, first)
}

fn path_prefix_contains(parent: &str, candidate: &str) -> bool {
    candidate == parent
        || candidate
            .strip_prefix(parent)
            .is_some_and(|suffix| suffix.starts_with('/'))
}

#[cfg(test)]
mod tests {
    use super::*;

    const BASE_SHA: &str = "1f05814c3e9d173e525234d69b3ce7f2d1b01a57";

    fn lease(id: &str, nonce: &str, prefix: &str) -> EngineeringWriteLease {
        EngineeringWriteLease {
            lease_id: id.to_owned(),
            nonce: nonce.to_owned(),
            issued_at_unix_seconds: 100,
            expires_at_unix_seconds: 200,
            owned_path_prefixes: vec![prefix.to_owned()],
        }
    }

    fn worker(
        adapter: KnownAdapter,
        instance_id: &str,
        role: EngineeringRunRole,
        worktree: &str,
        write_lease: Option<EngineeringWriteLease>,
    ) -> EngineeringWorkerRequest {
        EngineeringWorkerRequest {
            principal: EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Known(adapter)),
            instance_id: instance_id.to_owned(),
            role,
            base_sha: BASE_SHA.to_owned(),
            worktree: PathBuf::from(worktree),
            future_identity: None,
            write_lease,
        }
    }

    fn future_binding(name: &str, digest_byte: char) -> FutureAdapterIdentityBinding {
        FutureAdapterIdentityBinding {
            canonical_name: name.to_owned(),
            binary_name: format!("{name}-cli"),
            version: "1.0.0".to_owned(),
            immutable_source_sha256: digest_byte.to_string().repeat(64),
        }
    }

    fn valid_source_writing_plan() -> EngineeringRunPlan {
        EngineeringRunPlan {
            mode: EngineeringRunMode::SourceWriting,
            repository_root: PathBuf::from("/workspace/sirinx-co"),
            worktree_root: PathBuf::from("/workspace/worktrees"),
            base_sha: BASE_SHA.to_owned(),
            evaluated_at_unix_seconds: 150,
            workers: vec![
                worker(
                    KnownAdapter::ClaudeCode,
                    "claude-maker",
                    EngineeringRunRole::SourceWriter,
                    "/workspace/worktrees/claude-maker",
                    Some(lease("lease-claude", "nonce-claude", "apps/public-web")),
                ),
                worker(
                    KnownAdapter::Codex,
                    "codex-maker",
                    EngineeringRunRole::SourceWriter,
                    "/workspace/worktrees/codex-maker",
                    Some(lease("lease-codex", "nonce-codex", "crates/sirinx-web")),
                ),
                worker(
                    KnownAdapter::OpenCode,
                    "opencode-verifier",
                    EngineeringRunRole::IndependentVerifier,
                    "/workspace/worktrees/opencode-verifier",
                    None,
                ),
            ],
        }
    }

    fn all_known_read_only_plan() -> EngineeringRunPlan {
        let adapters = [
            (KnownAdapter::ClaudeCode, "claude"),
            (KnownAdapter::Codex, "codex"),
            (KnownAdapter::OpenCode, "opencode"),
            (KnownAdapter::Kiro, "kiro"),
            (KnownAdapter::Cline, "cline"),
            (KnownAdapter::AgyAntigravity, "agy"),
            (KnownAdapter::GitHubCopilot, "copilot"),
            (KnownAdapter::Kimi, "kimi"),
            (KnownAdapter::ZCode, "zcode"),
            (KnownAdapter::Gemini, "gemini"),
            (KnownAdapter::Qwen, "qwen"),
        ];
        EngineeringRunPlan {
            mode: EngineeringRunMode::ReadOnly,
            repository_root: PathBuf::from("/workspace/sirinx-co"),
            worktree_root: PathBuf::from("/workspace/worktrees"),
            base_sha: BASE_SHA.to_owned(),
            evaluated_at_unix_seconds: 150,
            workers: adapters
                .into_iter()
                .map(|(adapter, name)| {
                    worker(
                        adapter,
                        &format!("{name}-reader"),
                        EngineeringRunRole::ReadOnlyContributor,
                        &format!("/workspace/worktrees/{name}-reader"),
                        None,
                    )
                })
                .collect(),
        }
    }

    #[test]
    fn catalog_should_have_eleven_known_and_five_future_slots() {
        let known_count = engineering_agent_catalog()
            .iter()
            .filter(|entry| matches!(entry.slot, EngineeringAdapterSlot::Known(_)))
            .count();
        let future_count = engineering_agent_catalog()
            .iter()
            .filter(|entry| matches!(entry.slot, EngineeringAdapterSlot::Future(_)))
            .count();

        assert_eq!(
            (known_count, future_count),
            (11, 5),
            "catalog composition must remain 11 known plus 5 future slots"
        );
        assert_eq!(
            MAX_PARALLEL_ACTIVE_AGENTS, known_count,
            "active-agent ceiling must equal the named adapter inventory"
        );
    }

    #[test]
    fn catalog_should_default_every_slot_to_dormant_provider_denied_proposal_only() {
        for entry in engineering_agent_catalog() {
            assert_eq!(
                (
                    entry.runtime_state,
                    entry.authentication,
                    entry.provider_access,
                    entry.memory_access,
                ),
                (
                    AdapterRuntimeState::DormantUnverified,
                    AdapterAuthentication::Unbound,
                    AdapterProviderAccess::Denied,
                    AdapterMemoryAccess::ReadAllWriteProposalOnly,
                )
            );
        }
    }

    #[test]
    fn catalog_should_require_leases_for_known_and_binding_for_future_slots() {
        for entry in engineering_agent_catalog() {
            let expected = match entry.slot {
                EngineeringAdapterSlot::Known(_) => AdapterAdmissionPolicy::EligibleLeaseRequired,
                EngineeringAdapterSlot::Future(_) => {
                    AdapterAdmissionPolicy::IdentityBindingRequired
                }
            };
            assert_eq!(entry.admission_policy, expected);
        }
    }

    #[test]
    fn source_writing_plan_should_pass_with_two_makers_and_one_verifier() {
        assert_eq!(
            validate_engineering_run_plan(&valid_source_writing_plan()),
            Ok(())
        );
    }

    #[test]
    fn all_eleven_named_adapters_should_be_structurally_eligible_read_only() {
        assert_eq!(
            validate_engineering_run_plan(&all_known_read_only_plan()),
            Ok(())
        );
    }

    #[test]
    fn empty_run_should_fail() {
        let mut plan = valid_source_writing_plan();
        plan.workers.clear();

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::EmptyRun)
        );
    }

    #[test]
    fn twelfth_active_agent_should_fail() {
        let mut plan = all_known_read_only_plan();
        plan.workers.push(worker(
            KnownAdapter::ClaudeCode,
            "twelfth-reader",
            EngineeringRunRole::ReadOnlyContributor,
            "/workspace/worktrees/twelfth-reader",
            None,
        ));

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::TooManyActiveAgents { found: 12, max: 11 })
        );
    }

    #[test]
    fn hermes_should_never_be_admitted_as_a_worker() {
        let mut plan = valid_source_writing_plan();
        plan.workers[0].principal = EngineeringPrincipal::HermesManager;

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::HermesCannotBeWorker)
        );
    }

    #[test]
    fn future_slot_should_require_complete_immutable_identity_binding() {
        let mut plan = valid_source_writing_plan();
        plan.workers[0].principal =
            EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(FutureAdapterSlot::F01));

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::FutureIdentityBindingRequired(
                FutureAdapterSlot::F01
            ))
        );

        plan.workers[0].future_identity = Some(future_binding("future-adapter", 'a'));
        assert_eq!(validate_engineering_run_plan(&plan), Ok(()));
    }

    #[test]
    fn repeated_future_slot_with_conflicting_binding_should_fail_as_duplicate_principal() {
        let mut plan = valid_source_writing_plan();
        plan.workers[0].principal =
            EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(FutureAdapterSlot::F01));
        plan.workers[0].future_identity = Some(future_binding("future-a", 'a'));
        plan.workers[1].principal =
            EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(FutureAdapterSlot::F01));
        plan.workers[1].future_identity = Some(future_binding("future-b", 'b'));

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::DuplicateFutureAdapter(
                FutureAdapterSlot::F01
            ))
        );
    }

    #[test]
    fn repeated_future_slot_with_same_binding_should_fail_independence() {
        let binding = future_binding("future-a", 'a');
        let mut plan = valid_source_writing_plan();
        plan.workers[0].principal =
            EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(FutureAdapterSlot::F01));
        plan.workers[0].future_identity = Some(binding.clone());
        plan.workers[1].principal =
            EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(FutureAdapterSlot::F01));
        plan.workers[1].future_identity = Some(binding);

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::DuplicateFutureAdapter(
                FutureAdapterSlot::F01
            ))
        );
    }

    #[test]
    fn future_slot_cannot_be_both_writer_and_independent_verifier() {
        let binding = future_binding("future-a", 'a');
        let mut plan = valid_source_writing_plan();
        plan.workers[0].principal =
            EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(FutureAdapterSlot::F01));
        plan.workers[0].future_identity = Some(binding.clone());
        plan.workers[2].principal =
            EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(FutureAdapterSlot::F01));
        plan.workers[2].future_identity = Some(binding);

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::DuplicateFutureAdapter(
                FutureAdapterSlot::F01
            ))
        );
    }

    #[test]
    fn immutable_source_digest_should_not_bind_multiple_future_slots() {
        let mut plan = valid_source_writing_plan();
        plan.workers[0].principal =
            EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(FutureAdapterSlot::F01));
        plan.workers[0].future_identity = Some(future_binding("future-a", 'a'));
        plan.workers[1].principal =
            EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(FutureAdapterSlot::F02));
        plan.workers[1].future_identity = Some(future_binding("future-b", 'a'));

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::FutureSourceDigestReused {
                first: FutureAdapterSlot::F01,
                second: FutureAdapterSlot::F02,
            })
        );
    }

    #[test]
    fn known_adapter_should_reject_future_identity_binding() {
        let mut plan = valid_source_writing_plan();
        plan.workers[0].future_identity = Some(future_binding("alias", 'a'));

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::UnexpectedFutureIdentityBinding(
                KnownAdapter::ClaudeCode
            ))
        );
    }

    #[test]
    fn malformed_or_mismatched_base_sha_should_fail() {
        let mut malformed = valid_source_writing_plan();
        malformed.base_sha = "not-a-sha".to_owned();
        assert_eq!(
            validate_engineering_run_plan(&malformed),
            Err(EngineeringRunPlanError::InvalidBaseSha(
                "not-a-sha".to_owned()
            ))
        );

        let mut mismatched = valid_source_writing_plan();
        mismatched.workers[0].base_sha = "a".repeat(40);
        assert_eq!(
            validate_engineering_run_plan(&mismatched),
            Err(EngineeringRunPlanError::BaseShaMismatch {
                instance_id: "claude-maker".to_owned()
            })
        );
    }

    #[test]
    fn duplicate_instance_should_fail() {
        let mut plan = valid_source_writing_plan();
        plan.workers[1].instance_id = plan.workers[0].instance_id.clone();

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::DuplicateInstanceId(
                "claude-maker".to_owned()
            ))
        );
    }

    #[test]
    fn duplicate_known_adapter_identity_should_fail() {
        let mut plan = valid_source_writing_plan();
        plan.workers[1].principal =
            EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Known(KnownAdapter::ClaudeCode));

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::DuplicateKnownAdapter(
                KnownAdapter::ClaudeCode
            ))
        );
    }

    #[test]
    fn relative_or_repository_overlapping_worktree_should_fail() {
        let mut relative = valid_source_writing_plan();
        relative.workers[0].worktree = PathBuf::from("worktrees/claude");
        assert_eq!(
            validate_engineering_run_plan(&relative),
            Err(EngineeringRunPlanError::InvalidWorktree(PathBuf::from(
                "worktrees/claude"
            )))
        );

        let mut reused = valid_source_writing_plan();
        reused.workers[0].worktree = reused.repository_root.clone();
        assert_eq!(
            validate_engineering_run_plan(&reused),
            Err(EngineeringRunPlanError::WorktreeOverlapsRepositoryRoot(
                PathBuf::from("/workspace/sirinx-co")
            ))
        );
    }

    #[test]
    fn filesystem_root_should_be_rejected_for_repository_or_worktree_root() {
        let mut repository_root = valid_source_writing_plan();
        repository_root.repository_root = PathBuf::from("/");
        assert_eq!(
            validate_engineering_run_plan(&repository_root),
            Err(EngineeringRunPlanError::FilesystemRootForbidden(
                PathBuf::from("/")
            ))
        );

        let mut worktree_root = valid_source_writing_plan();
        worktree_root.worktree_root = PathBuf::from("/");
        assert_eq!(
            validate_engineering_run_plan(&worktree_root),
            Err(EngineeringRunPlanError::FilesystemRootForbidden(
                PathBuf::from("/")
            ))
        );
    }

    #[test]
    fn repository_and_worktree_roots_should_not_overlap() {
        for worktree_root in [
            "/workspace/sirinx-co",
            "/workspace/sirinx-co/worktrees",
            "/workspace",
        ] {
            let mut plan = valid_source_writing_plan();
            plan.worktree_root = PathBuf::from(worktree_root);
            assert_eq!(
                validate_engineering_run_plan(&plan),
                Err(
                    EngineeringRunPlanError::OverlappingRepositoryAndWorktreeRoots {
                        repository_root: PathBuf::from("/workspace/sirinx-co"),
                        worktree_root: PathBuf::from(worktree_root),
                    }
                )
            );
        }
    }

    #[test]
    fn worktree_should_be_a_strict_descendant_of_worktree_root() {
        for invalid in ["/workspace/worktrees", "/workspace/other/worker"] {
            let mut plan = valid_source_writing_plan();
            plan.workers[0].worktree = PathBuf::from(invalid);
            assert_eq!(
                validate_engineering_run_plan(&plan),
                Err(EngineeringRunPlanError::WorktreeOutsideRoot(PathBuf::from(
                    invalid
                )))
            );
        }
    }

    #[test]
    fn overlapping_worktrees_should_fail() {
        let mut plan = valid_source_writing_plan();
        plan.workers[1].worktree = PathBuf::from("/workspace/worktrees/claude-maker/nested");

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::OverlappingWorktrees {
                first: PathBuf::from("/workspace/worktrees/claude-maker"),
                second: PathBuf::from("/workspace/worktrees/claude-maker/nested"),
            })
        );
    }

    #[test]
    fn duplicate_worktree_should_fail() {
        let mut plan = valid_source_writing_plan();
        plan.workers[1].worktree = plan.workers[0].worktree.clone();

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::DuplicateWorktree(PathBuf::from(
                "/workspace/worktrees/claude-maker"
            )))
        );
    }

    #[test]
    fn source_writer_without_lease_should_fail() {
        let mut plan = valid_source_writing_plan();
        plan.workers[0].write_lease = None;

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::SourceWriterMissingLease {
                instance_id: "claude-maker".to_owned()
            })
        );
    }

    #[test]
    fn verifier_with_lease_should_fail() {
        let mut plan = valid_source_writing_plan();
        plan.workers[2].write_lease = Some(lease("lease-review", "nonce-review", "reviews"));

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::NonWriterHasLease {
                instance_id: "opencode-verifier".to_owned()
            })
        );
    }

    #[test]
    fn source_writing_run_should_require_exactly_one_verifier() {
        let mut missing = valid_source_writing_plan();
        missing.workers[2].role = EngineeringRunRole::ReadOnlyContributor;
        assert_eq!(
            validate_engineering_run_plan(&missing),
            Err(EngineeringRunPlanError::IndependentVerifierCount {
                found: 0,
                required: 1,
            })
        );

        let mut duplicate = valid_source_writing_plan();
        duplicate.workers[1].role = EngineeringRunRole::IndependentVerifier;
        duplicate.workers[1].write_lease = None;
        assert_eq!(
            validate_engineering_run_plan(&duplicate),
            Err(EngineeringRunPlanError::IndependentVerifierCount {
                found: 2,
                required: 1,
            })
        );
    }

    #[test]
    fn third_source_writer_should_exceed_writer_limit() {
        let mut plan = valid_source_writing_plan();
        plan.workers[2] = worker(
            KnownAdapter::Kiro,
            "kiro-maker",
            EngineeringRunRole::SourceWriter,
            "/workspace/worktrees/kiro-maker",
            Some(lease("lease-kiro", "nonce-kiro", "crates/sirinx-store")),
        );

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::TooManyWriters { found: 3, max: 2 })
        );
    }

    #[test]
    fn read_only_run_should_reject_source_writer() {
        let mut plan = valid_source_writing_plan();
        plan.mode = EngineeringRunMode::ReadOnly;

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::SourceWriterInReadOnlyRun(
                "claude-maker".to_owned()
            ))
        );
    }

    #[test]
    fn source_writing_run_should_reject_zero_writers() {
        let mut plan = valid_source_writing_plan();
        plan.workers = vec![worker(
            KnownAdapter::OpenCode,
            "opencode-verifier",
            EngineeringRunRole::IndependentVerifier,
            "/workspace/worktrees/opencode-verifier",
            None,
        )];

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::SourceWritingRunHasNoWriter)
        );
    }

    #[test]
    fn duplicate_lease_or_nonce_should_fail() {
        let mut duplicate_lease = valid_source_writing_plan();
        duplicate_lease.workers[1]
            .write_lease
            .as_mut()
            .unwrap()
            .lease_id = "lease-claude".to_owned();
        assert_eq!(
            validate_engineering_run_plan(&duplicate_lease),
            Err(EngineeringRunPlanError::DuplicateLeaseId(
                "lease-claude".to_owned()
            ))
        );

        let mut duplicate_nonce = valid_source_writing_plan();
        duplicate_nonce.workers[1]
            .write_lease
            .as_mut()
            .unwrap()
            .nonce = "nonce-claude".to_owned();
        assert_eq!(
            validate_engineering_run_plan(&duplicate_nonce),
            Err(EngineeringRunPlanError::DuplicateLeaseNonce(
                "nonce-claude".to_owned()
            ))
        );
    }

    #[test]
    fn lease_expiry_should_be_strictly_after_issue_time() {
        let mut plan = valid_source_writing_plan();
        let first_lease = plan.workers[0].write_lease.as_mut().unwrap();
        first_lease.expires_at_unix_seconds = first_lease.issued_at_unix_seconds;

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::InvalidLeaseExpiry {
                lease_id: "lease-claude".to_owned()
            })
        );
    }

    #[test]
    fn lease_should_be_valid_only_before_strict_expiry() {
        let mut exact_expiry = valid_source_writing_plan();
        exact_expiry.evaluated_at_unix_seconds = 200;
        assert_eq!(
            validate_engineering_run_plan(&exact_expiry),
            Err(EngineeringRunPlanError::LeaseExpired {
                lease_id: "lease-claude".to_owned()
            })
        );

        let mut after_expiry = valid_source_writing_plan();
        after_expiry.evaluated_at_unix_seconds = 201;
        assert_eq!(
            validate_engineering_run_plan(&after_expiry),
            Err(EngineeringRunPlanError::LeaseExpired {
                lease_id: "lease-claude".to_owned()
            })
        );
    }

    #[test]
    fn lease_issued_at_evaluation_time_should_be_valid() {
        let mut plan = valid_source_writing_plan();
        plan.evaluated_at_unix_seconds = 100;

        assert_eq!(validate_engineering_run_plan(&plan), Ok(()));
    }

    #[test]
    fn lease_issued_after_evaluation_should_fail() {
        let mut plan = valid_source_writing_plan();
        plan.workers[0]
            .write_lease
            .as_mut()
            .unwrap()
            .issued_at_unix_seconds = 151;

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::LeaseIssuedInFuture {
                lease_id: "lease-claude".to_owned()
            })
        );
    }

    #[test]
    fn lease_duration_should_be_bounded() {
        let mut plan = valid_source_writing_plan();
        plan.workers[0]
            .write_lease
            .as_mut()
            .unwrap()
            .expires_at_unix_seconds = 100 + MAX_WRITE_LEASE_DURATION_SECONDS + 1;

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::LeaseDurationTooLong {
                lease_id: "lease-claude".to_owned(),
                max_seconds: MAX_WRITE_LEASE_DURATION_SECONDS,
            })
        );
    }

    #[test]
    fn empty_or_non_normalized_owned_path_should_fail() {
        let mut empty = valid_source_writing_plan();
        empty.workers[0]
            .write_lease
            .as_mut()
            .unwrap()
            .owned_path_prefixes
            .clear();
        assert_eq!(
            validate_engineering_run_plan(&empty),
            Err(EngineeringRunPlanError::EmptyOwnedPathPrefixes {
                lease_id: "lease-claude".to_owned()
            })
        );

        for invalid in [
            "/absolute/path",
            "crates//sirinx-web",
            "crates/./sirinx-web",
            "crates/../sirinx-web",
            "crates/sirinx-web/",
            "crates\\sirinx-web",
        ] {
            let mut plan = valid_source_writing_plan();
            plan.workers[0]
                .write_lease
                .as_mut()
                .unwrap()
                .owned_path_prefixes = vec![invalid.to_owned()];
            assert_eq!(
                validate_engineering_run_plan(&plan),
                Err(EngineeringRunPlanError::InvalidOwnedPathPrefix(
                    invalid.to_owned()
                ))
            );
        }
    }

    #[test]
    fn overlapping_owned_path_prefixes_should_fail_across_writers() {
        let mut plan = valid_source_writing_plan();
        plan.workers[1]
            .write_lease
            .as_mut()
            .unwrap()
            .owned_path_prefixes = vec!["apps/public-web/src".to_owned()];

        assert_eq!(
            validate_engineering_run_plan(&plan),
            Err(EngineeringRunPlanError::OverlappingOwnedPathPrefixes {
                first: "apps/public-web".to_owned(),
                second: "apps/public-web/src".to_owned(),
            })
        );
    }

    #[test]
    fn sibling_path_prefixes_should_not_overlap() {
        let mut plan = valid_source_writing_plan();
        plan.workers[0]
            .write_lease
            .as_mut()
            .unwrap()
            .owned_path_prefixes = vec!["crates/sirinx".to_owned()];
        plan.workers[1]
            .write_lease
            .as_mut()
            .unwrap()
            .owned_path_prefixes = vec!["crates/sirinx-web".to_owned()];

        assert_eq!(validate_engineering_run_plan(&plan), Ok(()));
    }

    #[test]
    fn read_only_plan_should_allow_contributors_without_leases() {
        let plan = EngineeringRunPlan {
            mode: EngineeringRunMode::ReadOnly,
            repository_root: PathBuf::from("/workspace/sirinx-co"),
            worktree_root: PathBuf::from("/workspace/worktrees"),
            base_sha: BASE_SHA.to_owned(),
            evaluated_at_unix_seconds: 150,
            workers: vec![worker(
                KnownAdapter::Kimi,
                "kimi-reader",
                EngineeringRunRole::ReadOnlyContributor,
                "/workspace/worktrees/kimi-reader",
                None,
            )],
        };

        assert_eq!(validate_engineering_run_plan(&plan), Ok(()));
    }
}
