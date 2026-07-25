//! Authority-free contracts for local Harness Engineering.
//!
//! These types validate a proposed local run. They do not launch an agent,
//! issue a lease, run a command, call a provider, or write outside the
//! process-local receipt chain.

use std::collections::{BTreeSet, HashSet};
use std::path::{Component, Path};

use serde::{Deserialize, Serialize};
use serde_json::json;
use sha2::{Digest, Sha256};
use sirinx_agents::{
    validate_engineering_run_plan, EngineeringAdapterSlot, EngineeringPrincipal,
    EngineeringRunPlan, EngineeringRunPlanError, EngineeringRunRole, FutureAdapterSlot,
    KnownAdapter, MAX_PARALLEL_ACTIVE_AGENTS, MAX_PARALLEL_WRITERS,
};

use super::command_catalog::{command_spec, TestCommandId};

pub const MAX_REPAIR_CYCLES: u8 = 2;
pub const MAX_TEST_COMMANDS: usize = 12;
pub const MAX_COMMAND_SECONDS: u64 = 900;
pub const MAX_RUN_SECONDS: u64 = 3_600;
pub const MAX_CONTEXT_ITEMS: usize = 16;
pub const MAX_CONTEXT_TEXT_BYTES: usize = 24_000;

const DIGEST_PREFIX: &str = "sha256:";

/// Mandatory non-repairable and bounded-stop policies.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum StopCondition {
    GoalSpecInvalid,
    PlanOrScopeDigestMismatch,
    BaseShaMismatchOrDrift,
    DirtyStartNotDeclared,
    ContextSnapshotMissingOrTampered,
    ContextItemContractViolation,
    SecretOrRawPrivateMaterialDetected,
    ProviderOrExternalNetworkAttempt,
    AgentWriterOrVerifierLimitViolation,
    IdentityOrWorktreeCollision,
    LeaseMissingExpiredReusedOrOutOfScope,
    UnknownOrMutatedTestCommand,
    CommandOrRunTimeout,
    ProtectedHarnessPolicyModified,
    ReceiptChainInvalid,
    RepairBudgetExhausted,
    VerifierMissingNonIndependentOrDisagrees,
}

pub const MANDATORY_STOP_CONDITIONS: [StopCondition; 17] = [
    StopCondition::GoalSpecInvalid,
    StopCondition::PlanOrScopeDigestMismatch,
    StopCondition::BaseShaMismatchOrDrift,
    StopCondition::DirtyStartNotDeclared,
    StopCondition::ContextSnapshotMissingOrTampered,
    StopCondition::ContextItemContractViolation,
    StopCondition::SecretOrRawPrivateMaterialDetected,
    StopCondition::ProviderOrExternalNetworkAttempt,
    StopCondition::AgentWriterOrVerifierLimitViolation,
    StopCondition::IdentityOrWorktreeCollision,
    StopCondition::LeaseMissingExpiredReusedOrOutOfScope,
    StopCondition::UnknownOrMutatedTestCommand,
    StopCondition::CommandOrRunTimeout,
    StopCondition::ProtectedHarnessPolicyModified,
    StopCondition::ReceiptChainInvalid,
    StopCondition::RepairBudgetExhausted,
    StopCondition::VerifierMissingNonIndependentOrDisagrees,
];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ContextBundleRefV1 {
    pub schema_version: String,
    pub task_id: String,
    pub goal_spec_digest: String,
    pub repository_id: String,
    pub base_sha: String,
    pub graph_snapshot_digest: String,
    pub obsidian_snapshot_digest: Option<String>,
    pub query_digest: String,
    pub item_count: usize,
    pub total_text_bytes: usize,
    pub provider_calls: u32,
    pub external_calls: u32,
    pub bundle_digest: String,
}

impl ContextBundleRefV1 {
    pub fn validate(&self) -> Result<(), HarnessContractError> {
        validate_id(&self.task_id, "context task_id")?;
        validate_id(&self.repository_id, "repository_id")?;
        validate_sha(&self.base_sha)?;
        for digest in [
            &self.goal_spec_digest,
            &self.graph_snapshot_digest,
            &self.query_digest,
            &self.bundle_digest,
        ] {
            validate_digest(digest)?;
        }
        if let Some(digest) = &self.obsidian_snapshot_digest {
            validate_digest(digest)?;
        }
        if self.schema_version != "1.0.0" {
            return Err(HarnessContractError::UnsupportedSchema);
        }
        if self.item_count == 0 || self.item_count > MAX_CONTEXT_ITEMS {
            return Err(HarnessContractError::ContextItemLimit);
        }
        if self.total_text_bytes == 0 || self.total_text_bytes > MAX_CONTEXT_TEXT_BYTES {
            return Err(HarnessContractError::ContextByteLimit);
        }
        if self.provider_calls != 0 || self.external_calls != 0 {
            return Err(HarnessContractError::ContextExternalEffect);
        }
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PathLeaseV1 {
    pub schema_version: String,
    pub lease_id: String,
    pub task_id: String,
    pub plan_digest: String,
    pub scope_digest: String,
    pub principal_id: String,
    pub instance_id: String,
    pub worktree: String,
    pub base_sha: String,
    pub exact_paths: Vec<String>,
    pub issued_at_unix_seconds: u64,
    pub expires_at_unix_seconds: u64,
    pub nonce: String,
    pub max_files: usize,
    pub max_bytes: u64,
    pub lease_digest: String,
}

impl PathLeaseV1 {
    pub(crate) fn validate(
        &self,
        plan: &HarnessEngineeringPlanV1,
        evaluated_at_unix_seconds: u64,
        seen_nonces: &mut HashSet<String>,
        seen_paths: &mut HashSet<String>,
    ) -> Result<(), HarnessContractError> {
        if self.schema_version != "1.0.0" {
            return Err(HarnessContractError::UnsupportedSchema);
        }
        for value in [
            &self.lease_id,
            &self.task_id,
            &self.principal_id,
            &self.instance_id,
            &self.nonce,
        ] {
            validate_id(value, "lease identity")?;
        }
        validate_digest(&self.plan_digest)?;
        validate_digest(&self.scope_digest)?;
        validate_digest(&self.lease_digest)?;
        validate_sha(&self.base_sha)?;
        if self.task_id != plan.task_id
            || self.plan_digest != plan.plan_digest
            || self.scope_digest != plan.scope_digest
            || self.base_sha != plan.run_plan.base_sha
        {
            return Err(HarnessContractError::LeaseBindingMismatch);
        }
        if self.lease_digest != lease_digest_for(self) {
            return Err(HarnessContractError::LeaseDigestMismatch);
        }
        if self.worktree.trim() != self.worktree
            || !Path::new(&self.worktree).is_absolute()
            || self.worktree == "/"
        {
            return Err(HarnessContractError::InvalidLeaseWorktree);
        }
        if self.issued_at_unix_seconds > evaluated_at_unix_seconds
            || self.issued_at_unix_seconds < plan.issued_at_unix_seconds
            || self.expires_at_unix_seconds <= evaluated_at_unix_seconds
            || self.expires_at_unix_seconds > plan.expires_at_unix_seconds
            || self.expires_at_unix_seconds <= self.issued_at_unix_seconds
            || self.expires_at_unix_seconds - self.issued_at_unix_seconds > MAX_RUN_SECONDS
        {
            return Err(HarnessContractError::InvalidLeaseWindow);
        }
        if !seen_nonces.insert(self.nonce.clone()) {
            return Err(HarnessContractError::ReusedLeaseNonce);
        }
        if self.exact_paths.is_empty()
            || self.max_files == 0
            || self.exact_paths.len() > self.max_files
            || self.max_bytes == 0
        {
            return Err(HarnessContractError::InvalidLeaseBudget);
        }
        for path in &self.exact_paths {
            validate_exact_relative_file(path)?;
            if is_protected_harness_path(path) {
                return Err(HarnessContractError::ProtectedHarnessPath(path.clone()));
            }
            if !seen_paths.insert(path.clone()) {
                return Err(HarnessContractError::OverlappingLeasePath(path.clone()));
            }
        }
        let worker = plan
            .run_plan
            .workers
            .iter()
            .find(|worker| worker.instance_id == self.instance_id)
            .ok_or(HarnessContractError::LeaseWorkerMissing)?;
        if worker.role != EngineeringRunRole::SourceWriter
            || self.principal_id != principal_key(&worker.principal, &worker.instance_id)
            || worker.worktree != Path::new(&self.worktree)
        {
            return Err(HarnessContractError::LeaseWorkerMismatch);
        }
        let registry_lease = worker
            .write_lease
            .as_ref()
            .ok_or(HarnessContractError::LeaseWorkerMismatch)?;
        if self.issued_at_unix_seconds < registry_lease.issued_at_unix_seconds
            || self.expires_at_unix_seconds > registry_lease.expires_at_unix_seconds
            || self.exact_paths.iter().any(|path| {
                !registry_lease
                    .owned_path_prefixes
                    .iter()
                    .any(|prefix| exact_path_is_within_prefix(path, prefix))
            })
        {
            return Err(HarnessContractError::LeaseWorkerMismatch);
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", deny_unknown_fields)]
pub struct HarnessDenialsV1 {
    pub provider_call: bool,
    pub external_network: bool,
    pub external_write: bool,
    pub deploy: bool,
    pub push: bool,
    pub message_send: bool,
}

impl HarnessDenialsV1 {
    pub const fn all_denied() -> Self {
        Self {
            provider_call: true,
            external_network: true,
            external_write: true,
            deploy: true,
            push: true,
            message_send: true,
        }
    }

    fn validate(self) -> Result<(), HarnessContractError> {
        if self == Self::all_denied() {
            Ok(())
        } else {
            Err(HarnessContractError::RequiredDenialMissing)
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HarnessBudgetsV1 {
    pub max_active_agents: usize,
    pub max_writers: usize,
    pub independent_verifiers: usize,
    pub max_repair_cycles: u8,
    pub max_test_commands: usize,
    pub max_command_seconds: u64,
    pub max_run_seconds: u64,
}

impl HarnessBudgetsV1 {
    fn validate(self, source_writing: bool) -> Result<(), HarnessContractError> {
        if self.max_active_agents == 0
            || self.max_active_agents > MAX_PARALLEL_ACTIVE_AGENTS
            || self.max_writers > MAX_PARALLEL_WRITERS
            || (source_writing && self.independent_verifiers != 1)
            || (!source_writing && self.independent_verifiers > 1)
            || self.max_repair_cycles > MAX_REPAIR_CYCLES
            || self.max_test_commands == 0
            || self.max_test_commands > MAX_TEST_COMMANDS
            || self.max_command_seconds == 0
            || self.max_command_seconds > MAX_COMMAND_SECONDS
            || self.max_run_seconds == 0
            || self.max_run_seconds > MAX_RUN_SECONDS
        {
            return Err(HarnessContractError::InvalidBudget);
        }
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HarnessEngineeringPlanV1 {
    pub schema_version: String,
    pub task_id: String,
    pub plan_id: String,
    pub goal_spec_digest: String,
    pub context_bundle_digest: String,
    pub repository_id: String,
    pub expected_clean_start: bool,
    pub run_plan: EngineeringRunPlan,
    pub path_leases: Vec<PathLeaseV1>,
    pub test_command_ids: Vec<TestCommandId>,
    pub stop_conditions: BTreeSet<StopCondition>,
    pub budgets: HarnessBudgetsV1,
    pub denials: HarnessDenialsV1,
    pub evaluated_at_unix_seconds: u64,
    pub issued_at_unix_seconds: u64,
    pub expires_at_unix_seconds: u64,
    pub nonce: String,
    pub plan_digest: String,
    pub scope_digest: String,
}

impl HarnessEngineeringPlanV1 {
    pub fn validate(&self) -> Result<(), HarnessContractError> {
        if self.schema_version != "1.0.0" {
            return Err(HarnessContractError::UnsupportedSchema);
        }
        for value in [
            &self.task_id,
            &self.plan_id,
            &self.repository_id,
            &self.nonce,
        ] {
            validate_id(value, "plan identity")?;
        }
        for digest in [
            &self.goal_spec_digest,
            &self.context_bundle_digest,
            &self.plan_digest,
            &self.scope_digest,
        ] {
            validate_digest(digest)?;
        }
        if self.scope_digest != scope_digest_for(self) {
            return Err(HarnessContractError::ScopeDigestMismatch);
        }
        if self.plan_digest != plan_digest_for(self) {
            return Err(HarnessContractError::PlanDigestMismatch);
        }
        if self.run_plan.evaluated_at_unix_seconds != self.evaluated_at_unix_seconds {
            return Err(HarnessContractError::EvaluationTimeMismatch);
        }
        if self.issued_at_unix_seconds > self.evaluated_at_unix_seconds
            || self.expires_at_unix_seconds <= self.evaluated_at_unix_seconds
            || self.expires_at_unix_seconds <= self.issued_at_unix_seconds
            || self.expires_at_unix_seconds - self.issued_at_unix_seconds > MAX_RUN_SECONDS
        {
            return Err(HarnessContractError::InvalidPlanWindow);
        }
        validate_engineering_run_plan(&self.run_plan)?;
        let source_writers = self
            .run_plan
            .workers
            .iter()
            .filter(|worker| worker.role == EngineeringRunRole::SourceWriter)
            .count();
        let independent_verifiers = self
            .run_plan
            .workers
            .iter()
            .filter(|worker| worker.role == EngineeringRunRole::IndependentVerifier)
            .count();
        self.budgets.validate(source_writers > 0)?;
        if self.run_plan.workers.len() > self.budgets.max_active_agents
            || source_writers > self.budgets.max_writers
            || independent_verifiers != self.budgets.independent_verifiers
        {
            return Err(HarnessContractError::ActualWorkerCountExceedsBudget);
        }
        self.denials.validate()?;
        if self.test_command_ids.is_empty()
            || self.test_command_ids.len() > self.budgets.max_test_commands
        {
            return Err(HarnessContractError::InvalidCommandCount);
        }
        let mut commands = HashSet::new();
        for command in &self.test_command_ids {
            if command_spec(*command).timeout_seconds > self.budgets.max_command_seconds {
                return Err(HarnessContractError::CommandExceedsBudget);
            }
            if !commands.insert(*command) {
                return Err(HarnessContractError::DuplicateCommand);
            }
        }
        let required: BTreeSet<_> = MANDATORY_STOP_CONDITIONS.into_iter().collect();
        if !required.is_subset(&self.stop_conditions) {
            return Err(HarnessContractError::MandatoryStopConditionMissing);
        }
        validate_path_lease_set(self, &self.path_leases, self.evaluated_at_unix_seconds)?;
        Ok(())
    }

    pub fn writer_principals(&self) -> HashSet<String> {
        self.run_plan
            .workers
            .iter()
            .filter(|worker| worker.role == EngineeringRunRole::SourceWriter)
            .map(|worker| principal_key(&worker.principal, &worker.instance_id))
            .collect()
    }

    pub fn verifier_principal(&self) -> Option<String> {
        self.run_plan
            .workers
            .iter()
            .find(|worker| worker.role == EngineeringRunRole::IndependentVerifier)
            .map(|worker| principal_key(&worker.principal, &worker.instance_id))
    }

    pub fn lease_for_principal(&self, principal_id: &str) -> Option<&PathLeaseV1> {
        self.path_leases
            .iter()
            .find(|lease| lease.principal_id == principal_id)
    }
}

pub(crate) fn validate_path_lease_set(
    plan: &HarnessEngineeringPlanV1,
    leases: &[PathLeaseV1],
    evaluated_at_unix_seconds: u64,
) -> Result<(), HarnessContractError> {
    let writer_instances: HashSet<_> = plan
        .run_plan
        .workers
        .iter()
        .filter(|worker| worker.role == EngineeringRunRole::SourceWriter)
        .map(|worker| worker.instance_id.as_str())
        .collect();
    if leases.len() != writer_instances.len() {
        return Err(HarnessContractError::WriterLeaseCountMismatch);
    }
    let mut seen_nonces = HashSet::new();
    let mut seen_paths = HashSet::new();
    let mut seen_lease_ids = HashSet::new();
    let mut seen_lease_digests = HashSet::new();
    for lease in leases {
        if !seen_lease_ids.insert(lease.lease_id.as_str())
            || !seen_lease_digests.insert(lease.lease_digest.as_str())
        {
            return Err(HarnessContractError::ReusedLeaseNonce);
        }
        lease.validate(
            plan,
            evaluated_at_unix_seconds,
            &mut seen_nonces,
            &mut seen_paths,
        )?;
    }
    let leased_instances: HashSet<_> = leases
        .iter()
        .map(|lease| lease.instance_id.as_str())
        .collect();
    if writer_instances != leased_instances {
        return Err(HarnessContractError::WriterLeaseCountMismatch);
    }
    Ok(())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AdmissionDecision {
    Approve,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AdmissionGrantV1 {
    pub schema_version: String,
    pub task_id: String,
    pub action: String,
    pub plan_digest: String,
    pub scope_digest: String,
    pub base_sha: String,
    pub approver_principal: String,
    pub issued_at_unix_seconds: u64,
    pub expires_at_unix_seconds: u64,
    pub nonce: String,
    pub max_repair_cycles: u8,
    pub decision: AdmissionDecision,
    pub grant_digest: String,
}

impl AdmissionGrantV1 {
    pub fn validate_for(
        &self,
        plan: &HarnessEngineeringPlanV1,
        now: u64,
    ) -> Result<(), HarnessContractError> {
        if self.schema_version != "1.0.0"
            || self.action != "local_harness_engineering_source_write_and_tests"
            || self.approver_principal == "hermes-manager"
        {
            return Err(HarnessContractError::InvalidGrant);
        }
        for value in [&self.task_id, &self.approver_principal, &self.nonce] {
            validate_id(value, "grant identity")?;
        }
        for digest in [&self.plan_digest, &self.scope_digest, &self.grant_digest] {
            validate_digest(digest)?;
        }
        validate_sha(&self.base_sha)?;
        if self.task_id != plan.task_id
            || self.plan_digest != plan.plan_digest
            || self.scope_digest != plan.scope_digest
            || self.base_sha != plan.run_plan.base_sha
            || self.max_repair_cycles != plan.budgets.max_repair_cycles
        {
            return Err(HarnessContractError::GrantBindingMismatch);
        }
        if self.grant_digest != grant_digest_for(self) {
            return Err(HarnessContractError::GrantDigestMismatch);
        }
        if self.issued_at_unix_seconds < plan.evaluated_at_unix_seconds
            || self.issued_at_unix_seconds < plan.issued_at_unix_seconds
            || self.issued_at_unix_seconds > now
            || self.expires_at_unix_seconds <= now
            || self.expires_at_unix_seconds > plan.expires_at_unix_seconds
            || self.expires_at_unix_seconds <= self.issued_at_unix_seconds
            || self.expires_at_unix_seconds - self.issued_at_unix_seconds > MAX_RUN_SECONDS
        {
            return Err(HarnessContractError::InvalidGrantWindow);
        }
        Ok(())
    }
}

pub fn scope_digest_for(plan: &HarnessEngineeringPlanV1) -> String {
    let mut leases: Vec<_> = plan
        .path_leases
        .iter()
        .map(|lease| {
            let mut paths = lease.exact_paths.clone();
            paths.sort();
            json!({
                "instance_id": lease.instance_id,
                "principal_id": lease.principal_id,
                "worktree": lease.worktree,
                "exact_paths": paths,
                "max_files": lease.max_files,
                "max_bytes": lease.max_bytes,
            })
        })
        .collect();
    leases.sort_by_key(|value| value["instance_id"].as_str().unwrap_or_default().to_owned());
    hash_json(&json!({
        "task_id": plan.task_id,
        "repository_id": plan.repository_id,
        "repository_root": plan.run_plan.repository_root,
        "worktree_root": plan.run_plan.worktree_root,
        "base_sha": plan.run_plan.base_sha,
        "leases": leases,
    }))
}

pub fn lease_digest_for(lease: &PathLeaseV1) -> String {
    hash_json(&json!({
        "schema_version": lease.schema_version,
        "lease_id": lease.lease_id,
        "task_id": lease.task_id,
        "plan_digest": lease.plan_digest,
        "scope_digest": lease.scope_digest,
        "principal_id": lease.principal_id,
        "instance_id": lease.instance_id,
        "worktree": lease.worktree,
        "base_sha": lease.base_sha,
        "exact_paths": lease.exact_paths,
        "issued_at_unix_seconds": lease.issued_at_unix_seconds,
        "expires_at_unix_seconds": lease.expires_at_unix_seconds,
        "nonce": lease.nonce,
        "max_files": lease.max_files,
        "max_bytes": lease.max_bytes,
    }))
}

pub fn plan_digest_for(plan: &HarnessEngineeringPlanV1) -> String {
    let workers: Vec<_> = plan
        .run_plan
        .workers
        .iter()
        .map(|worker| {
            let future_identity = worker.future_identity.as_ref().map(|identity| {
                json!({
                    "canonical_name": identity.canonical_name,
                    "binary_name": identity.binary_name,
                    "version": identity.version,
                    "immutable_source_sha256": identity.immutable_source_sha256,
                })
            });
            let registry_write_lease = worker.write_lease.as_ref().map(|lease| {
                let mut owned_path_prefixes = lease.owned_path_prefixes.clone();
                owned_path_prefixes.sort();
                json!({
                    "lease_id": lease.lease_id,
                    "nonce": lease.nonce,
                    "issued_at_unix_seconds": lease.issued_at_unix_seconds,
                    "expires_at_unix_seconds": lease.expires_at_unix_seconds,
                    "owned_path_prefixes": owned_path_prefixes,
                })
            });
            json!({
                "principal": format!("{:?}", worker.principal),
                "instance_id": worker.instance_id,
                "role": format!("{:?}", worker.role),
                "base_sha": worker.base_sha,
                "worktree": worker.worktree,
                "future_identity": future_identity,
                "registry_write_lease": registry_write_lease,
            })
        })
        .collect();
    let mut initial_path_leases: Vec<_> = plan
        .path_leases
        .iter()
        .map(|lease| {
            let mut exact_paths = lease.exact_paths.clone();
            exact_paths.sort();
            json!({
                "lease_id": lease.lease_id,
                "task_id": lease.task_id,
                "principal_id": lease.principal_id,
                "instance_id": lease.instance_id,
                "worktree": lease.worktree,
                "base_sha": lease.base_sha,
                "exact_paths": exact_paths,
                "issued_at_unix_seconds": lease.issued_at_unix_seconds,
                "expires_at_unix_seconds": lease.expires_at_unix_seconds,
                "nonce": lease.nonce,
                "max_files": lease.max_files,
                "max_bytes": lease.max_bytes,
            })
        })
        .collect();
    initial_path_leases.sort_by_key(|value| {
        value["principal_id"]
            .as_str()
            .unwrap_or_default()
            .to_owned()
    });
    hash_json(&json!({
        "schema_version": plan.schema_version,
        "task_id": plan.task_id,
        "plan_id": plan.plan_id,
        "goal_spec_digest": plan.goal_spec_digest,
        "context_bundle_digest": plan.context_bundle_digest,
        "repository_id": plan.repository_id,
        "expected_clean_start": plan.expected_clean_start,
        "run_mode": format!("{:?}", plan.run_plan.mode),
        "base_sha": plan.run_plan.base_sha,
        "workers": workers,
        "initial_path_leases": initial_path_leases,
        "registry_limits": {
            "max_active_workers": MAX_PARALLEL_ACTIVE_AGENTS,
            "max_source_writers": MAX_PARALLEL_WRITERS,
            "max_independent_verifiers": 1,
        },
        "test_command_ids": plan.test_command_ids,
        "stop_conditions": plan.stop_conditions,
        "budgets": plan.budgets,
        "denials": plan.denials,
        "evaluated_at_unix_seconds": plan.evaluated_at_unix_seconds,
        "issued_at_unix_seconds": plan.issued_at_unix_seconds,
        "expires_at_unix_seconds": plan.expires_at_unix_seconds,
        "nonce": plan.nonce,
        "scope_digest": plan.scope_digest,
    }))
}

pub fn grant_digest_for(grant: &AdmissionGrantV1) -> String {
    hash_json(&json!({
        "schema_version": grant.schema_version,
        "task_id": grant.task_id,
        "action": grant.action,
        "plan_digest": grant.plan_digest,
        "scope_digest": grant.scope_digest,
        "base_sha": grant.base_sha,
        "approver_principal": grant.approver_principal,
        "issued_at_unix_seconds": grant.issued_at_unix_seconds,
        "expires_at_unix_seconds": grant.expires_at_unix_seconds,
        "nonce": grant.nonce,
        "max_repair_cycles": grant.max_repair_cycles,
        "decision": grant.decision,
    }))
}

pub(crate) fn hash_json(value: &serde_json::Value) -> String {
    let encoded = serde_json::to_vec(value).expect("JSON value serialization is infallible");
    let digest = Sha256::digest(encoded);
    format!("{DIGEST_PREFIX}{digest:x}")
}

pub(crate) fn validate_digest(value: &str) -> Result<(), HarnessContractError> {
    if value.len() != DIGEST_PREFIX.len() + 64
        || !value.starts_with(DIGEST_PREFIX)
        || !value[DIGEST_PREFIX.len()..]
            .bytes()
            .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
    {
        return Err(HarnessContractError::InvalidDigest);
    }
    Ok(())
}

pub(crate) fn validate_sha(value: &str) -> Result<(), HarnessContractError> {
    if value.len() != 40
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
    {
        return Err(HarnessContractError::InvalidBaseSha);
    }
    Ok(())
}

fn validate_id(value: &str, _name: &str) -> Result<(), HarnessContractError> {
    if value.is_empty()
        || value.len() > 128
        || value.trim() != value
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-' | b':'))
    {
        return Err(HarnessContractError::InvalidIdentity);
    }
    Ok(())
}

fn validate_exact_relative_file(value: &str) -> Result<(), HarnessContractError> {
    let path = Path::new(value);
    if value.is_empty()
        || value.trim() != value
        || path.is_absolute()
        || value.ends_with('/')
        || value.contains(['*', '?', '[', ']', '{', '}'])
        || !path
            .components()
            .all(|component| matches!(component, Component::Normal(_)))
    {
        return Err(HarnessContractError::InvalidExactPath(value.to_owned()));
    }
    Ok(())
}

fn exact_path_is_within_prefix(path: &str, prefix: &str) -> bool {
    path == prefix
        || prefix
            .strip_suffix('/')
            .is_some_and(|normalized| path.starts_with(&format!("{normalized}/")))
        || path.starts_with(&format!("{prefix}/"))
}

fn is_protected_harness_path(value: &str) -> bool {
    // Protection is intentionally case-insensitive. A case-only variant can
    // still target the same policy surface on a case-insensitive worktree.
    let normalized = value.to_ascii_lowercase();
    let path = Path::new(&normalized);
    let basename = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("");
    let has_protected_component = path.components().any(|component| {
        matches!(
            component,
            Component::Normal(name)
                if matches!(
                    name.to_str(),
                    Some(
                        "node_modules"
                            | ".cargo"
                            | ".git"
                            | ".claude"
                            | ".codex"
                            | ".secrets"
                            | ".graphifyignore"
                            | "cargo.toml"
                            | "cargo.lock"
                            | "package.json"
                            | "package-lock.json"
                            | "pnpm-lock.yaml"
                            | "yarn.lock"
                            | ".npmrc"
                            | ".pnpmfile.cjs"
                            | "rust-toolchain"
                            | "rust-toolchain.toml"
                    )
                )
        )
    });
    has_protected_component
        || normalized == "master_plan.md"
        || normalized.starts_with(".git/")
        || normalized.starts_with(".cargo/")
        || normalized.ends_with("/build.rs")
        || basename.starts_with("vitest.config.")
        || basename == "agents.md"
        || basename == "claude.md"
        || basename == "codex_handoff.md"
        || basename == "agent_team_plan.md"
        || basename == ".env"
        || basename.starts_with(".env.")
        || matches!(
            Path::new(basename).extension().and_then(|value| value.to_str()),
            Some("pem" | "key" | "p12" | "pfx")
        )
        || matches!(
            normalized.as_str(),
            "crates/sirinx-agents/src/engineering_registry.rs"
                | "crates/sirinx-agents/src/lib.rs"
                | "crates/sirinx-control/src/lib.rs"
                | "services/dev-control-api/src/local-rag.test.mjs"
        )
        || normalized.starts_with("crates/sirinx-control/src/harness_engineering/")
        || normalized.starts_with("tools/graph-memory/")
}

fn principal_key(principal: &EngineeringPrincipal, instance_id: &str) -> String {
    let slot = match principal {
        EngineeringPrincipal::HermesManager => "hermes-manager".to_owned(),
        EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Known(adapter)) => {
            let name = match adapter {
                KnownAdapter::ClaudeCode => "claude-code",
                KnownAdapter::Codex => "codex",
                KnownAdapter::OpenCode => "opencode",
                KnownAdapter::Kiro => "kiro",
                KnownAdapter::Cline => "cline",
                KnownAdapter::AgyAntigravity => "agy-antigravity",
                KnownAdapter::GitHubCopilot => "github-copilot",
                KnownAdapter::Kimi => "kimi",
                KnownAdapter::ZCode => "zcode",
                KnownAdapter::Gemini => "gemini",
                KnownAdapter::Qwen => "qwen",
            };
            format!("known:{name}")
        }
        EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Future(slot)) => {
            let name = match slot {
                FutureAdapterSlot::F01 => "f01",
                FutureAdapterSlot::F02 => "f02",
                FutureAdapterSlot::F03 => "f03",
                FutureAdapterSlot::F04 => "f04",
                FutureAdapterSlot::F05 => "f05",
            };
            format!("future:{name}")
        }
    };
    format!("{slot}:{instance_id}")
}

#[derive(Debug, thiserror::Error)]
pub enum HarnessContractError {
    #[error("unsupported Harness Engineering schema")]
    UnsupportedSchema,
    #[error("identity is invalid")]
    InvalidIdentity,
    #[error("digest must be sha256 followed by 64 lowercase hexadecimal characters")]
    InvalidDigest,
    #[error("base SHA must be 40 lowercase hexadecimal characters")]
    InvalidBaseSha,
    #[error("context item count exceeds policy")]
    ContextItemLimit,
    #[error("context text bytes exceed policy")]
    ContextByteLimit,
    #[error("context bundle reported a provider or external call")]
    ContextExternalEffect,
    #[error("plan and engineering-run evaluation times differ")]
    EvaluationTimeMismatch,
    #[error("plan validity window is invalid")]
    InvalidPlanWindow,
    #[error("Harness Engineering budget is outside policy")]
    InvalidBudget,
    #[error("actual active-agent, writer, or verifier count exceeds the declared plan budget")]
    ActualWorkerCountExceedsBudget,
    #[error("required denial is missing")]
    RequiredDenialMissing,
    #[error("test command count is outside policy")]
    InvalidCommandCount,
    #[error("test command exceeds the plan timeout budget")]
    CommandExceedsBudget,
    #[error("test command is duplicated")]
    DuplicateCommand,
    #[error("mandatory stop condition is missing")]
    MandatoryStopConditionMissing,
    #[error("source-writer and exact-lease counts differ")]
    WriterLeaseCountMismatch,
    #[error("lease is not bound to this task, plan, scope, and base")]
    LeaseBindingMismatch,
    #[error("lease digest does not match its canonical content")]
    LeaseDigestMismatch,
    #[error("lease worktree is invalid")]
    InvalidLeaseWorktree,
    #[error("lease validity window is invalid")]
    InvalidLeaseWindow,
    #[error("lease nonce is reused")]
    ReusedLeaseNonce,
    #[error("lease file or byte budget is invalid")]
    InvalidLeaseBudget,
    #[error("exact path is invalid: {0}")]
    InvalidExactPath(String),
    #[error("protected Harness Engineering path cannot be leased: {0}")]
    ProtectedHarnessPath(String),
    #[error("exact path is owned by more than one writer: {0}")]
    OverlappingLeasePath(String),
    #[error("lease worker is not in the run plan")]
    LeaseWorkerMissing,
    #[error("lease worker identity, role, or worktree does not match")]
    LeaseWorkerMismatch,
    #[error("admission grant is invalid")]
    InvalidGrant,
    #[error("admission grant does not bind the exact plan")]
    GrantBindingMismatch,
    #[error("admission grant validity window is invalid")]
    InvalidGrantWindow,
    #[error("scope digest does not match its canonical content")]
    ScopeDigestMismatch,
    #[error("plan digest does not match its canonical content")]
    PlanDigestMismatch,
    #[error("grant digest does not match its canonical content")]
    GrantDigestMismatch,
    #[error(transparent)]
    EngineeringPlan(#[from] EngineeringRunPlanError),
}
