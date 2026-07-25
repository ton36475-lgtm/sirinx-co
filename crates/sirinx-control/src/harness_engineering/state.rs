//! Evidence-driven local Harness Engineering state machine.
//!
//! The state machine validates receipts only. Process launch, Git execution,
//! tests, providers, network, and external effects are intentionally absent.

use std::collections::HashSet;

use serde::{Deserialize, Serialize};
use serde_json::json;

use super::command_catalog::{command_spec, command_spec_digest, TestCommandId};
use super::contracts::{
    hash_json, validate_digest, validate_path_lease_set, AdmissionGrantV1, HarnessContractError,
    HarnessEngineeringPlanV1, PathLeaseV1,
};
use super::git_guard::{
    git_evidence_digest_for, validate_git_diff_evidence, GitDiffEvidenceV1, GitGuardError,
};
use super::receipts::{
    HarnessState, ReceiptChainError, ReceiptChainV1, ReceiptDraftV1, ReceiptEventKind,
    ReceiptEventV1, ReceiptIdentityV1, ReceiptVerdict,
};
use super::retrieval::{RetrievalEvidenceError, RetrievalEvidenceV1};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MakerReceiptV1 {
    pub principal_id: String,
    pub lease_digest: String,
    pub patch_digest: String,
    pub artifact_digests: Vec<String>,
    pub git_evidence: GitDiffEvidenceV1,
    pub started_at_unix_seconds: u64,
    pub finished_at_unix_seconds: u64,
    pub provider_calls: u32,
    pub external_calls: u32,
    pub network_denied: bool,
    pub provider_environment_scrubbed: bool,
    pub secret_output_detected: bool,
    pub secret_private_read_detected: bool,
    pub external_write_attempted: bool,
    pub deploy_attempted: bool,
    pub push_attempted: bool,
    pub message_send_attempted: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TestExecutionReceiptV1 {
    pub command_id: TestCommandId,
    pub exit_code: i32,
    pub stdout_sha256: String,
    pub stderr_sha256: String,
    pub stdout_bytes: u64,
    pub stderr_bytes: u64,
    pub fixed_argv_verified: bool,
    pub shell_used: bool,
    pub network_denied: bool,
    pub provider_environment_scrubbed: bool,
    pub secret_output_detected: bool,
    pub secret_private_read_detected: bool,
    pub external_write_attempted: bool,
    pub deploy_attempted: bool,
    pub push_attempted: bool,
    pub message_send_attempted: bool,
    pub timed_out: bool,
    pub started_at_unix_seconds: u64,
    pub finished_at_unix_seconds: u64,
    pub provider_calls: u32,
    pub external_calls: u32,
}

pub fn test_execution_receipt_digest_for(receipt: &TestExecutionReceiptV1) -> String {
    hash_json(&json!({
        "schema_version": "1.0.0",
        "command_id": receipt.command_id,
        "exit_code": receipt.exit_code,
        "stdout_sha256": receipt.stdout_sha256,
        "stderr_sha256": receipt.stderr_sha256,
        "stdout_bytes": receipt.stdout_bytes,
        "stderr_bytes": receipt.stderr_bytes,
        "fixed_argv_verified": receipt.fixed_argv_verified,
        "shell_used": receipt.shell_used,
        "network_denied": receipt.network_denied,
        "provider_environment_scrubbed": receipt.provider_environment_scrubbed,
        "secret_output_detected": receipt.secret_output_detected,
        "secret_private_read_detected": receipt.secret_private_read_detected,
        "external_write_attempted": receipt.external_write_attempted,
        "deploy_attempted": receipt.deploy_attempted,
        "push_attempted": receipt.push_attempted,
        "message_send_attempted": receipt.message_send_attempted,
        "timed_out": receipt.timed_out,
        "started_at_unix_seconds": receipt.started_at_unix_seconds,
        "finished_at_unix_seconds": receipt.finished_at_unix_seconds,
        "provider_calls": receipt.provider_calls,
        "external_calls": receipt.external_calls,
    }))
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum VerifierDecision {
    Pass,
    Fail,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VerifierReceiptV1 {
    pub principal_id: String,
    pub reviewed_chain_head: String,
    pub reviewed_patch_digest: String,
    pub decision: VerifierDecision,
    pub artifact_digests: Vec<String>,
    pub has_write_lease: bool,
    pub provider_calls: u32,
    pub external_calls: u32,
    pub network_denied: bool,
    pub provider_environment_scrubbed: bool,
    pub secret_output_detected: bool,
    pub secret_private_read_detected: bool,
    pub external_write_attempted: bool,
    pub deploy_attempted: bool,
    pub push_attempted: bool,
    pub message_send_attempted: bool,
    pub started_at_unix_seconds: u64,
    pub finished_at_unix_seconds: u64,
}

/// Process-local one-use guard for admission grants and path leases.
///
/// A durable executor must atomically persist all of these sets before it may
/// claim crash-safe one-use enforcement. This validation-only module
/// intentionally does not perform persistence or auto-resume after restart.
#[derive(Debug, Default)]
pub struct AdmissionNonceLedgerV1 {
    consumed_grant_nonces: HashSet<String>,
    consumed_lease_ids: HashSet<String>,
    consumed_lease_nonces: HashSet<String>,
    consumed_lease_digests: HashSet<String>,
}

impl AdmissionNonceLedgerV1 {
    fn reserve_admission(
        &mut self,
        grant_nonce: &str,
        leases: &[PathLeaseV1],
    ) -> Result<(), OneUseLedgerCollision> {
        if self.consumed_grant_nonces.contains(grant_nonce) {
            return Err(OneUseLedgerCollision::Grant);
        }
        if self.has_lease_collision(leases) {
            return Err(OneUseLedgerCollision::Lease);
        }
        self.consumed_grant_nonces.insert(grant_nonce.to_owned());
        self.reserve_lease_values(leases);
        Ok(())
    }

    fn reserve_replacement_leases(
        &mut self,
        leases: &[PathLeaseV1],
    ) -> Result<(), OneUseLedgerCollision> {
        if self.has_lease_collision(leases) {
            return Err(OneUseLedgerCollision::Lease);
        }
        self.reserve_lease_values(leases);
        Ok(())
    }

    fn has_lease_collision(&self, leases: &[PathLeaseV1]) -> bool {
        leases.iter().any(|lease| {
            self.consumed_lease_ids.contains(&lease.lease_id)
                || self.consumed_lease_nonces.contains(&lease.nonce)
                || self.consumed_lease_digests.contains(&lease.lease_digest)
        })
    }

    fn reserve_lease_values(&mut self, leases: &[PathLeaseV1]) {
        for lease in leases {
            self.consumed_lease_ids.insert(lease.lease_id.clone());
            self.consumed_lease_nonces.insert(lease.nonce.clone());
            self.consumed_lease_digests
                .insert(lease.lease_digest.clone());
        }
    }

    pub fn contains(&self, nonce: &str) -> bool {
        self.consumed_grant_nonces.contains(nonce)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum OneUseLedgerCollision {
    Grant,
    Lease,
}

#[derive(Debug)]
pub struct HarnessEngineeringRunV1 {
    plan: HarnessEngineeringPlanV1,
    identity: ReceiptIdentityV1,
    state: HarnessState,
    started_at_unix_seconds: u64,
    state_entered_at_unix_seconds: u64,
    repair_cycles: u8,
    active_path_leases: Vec<PathLeaseV1>,
    consumed_lease_ids: HashSet<String>,
    consumed_lease_nonces: HashSet<String>,
    consumed_lease_digests: HashSet<String>,
    combined_patch_digest: Option<String>,
    receipts: ReceiptChainV1,
}

impl HarnessEngineeringRunV1 {
    pub fn new(
        plan: HarnessEngineeringPlanV1,
        run_id: impl Into<String>,
        now: u64,
    ) -> Result<Self, HarnessRunError> {
        plan.validate()?;
        if now < plan.evaluated_at_unix_seconds
            || now < plan.issued_at_unix_seconds
            || now >= plan.expires_at_unix_seconds
        {
            return Err(HarnessRunError::PlanExpired);
        }
        let run_id = run_id.into();
        validate_runtime_id(&run_id)?;
        let identity = ReceiptIdentityV1 {
            task_id: plan.task_id.clone(),
            run_id,
            goal_spec_digest: plan.goal_spec_digest.clone(),
            plan_digest: plan.plan_digest.clone(),
            scope_digest: plan.scope_digest.clone(),
            context_bundle_digest: plan.context_bundle_digest.clone(),
            base_sha: plan.run_plan.base_sha.clone(),
        };
        let mut run = Self {
            plan,
            identity,
            state: HarnessState::Received,
            started_at_unix_seconds: now,
            state_entered_at_unix_seconds: now,
            repair_cycles: 0,
            active_path_leases: Vec::new(),
            consumed_lease_ids: HashSet::new(),
            consumed_lease_nonces: HashSet::new(),
            consumed_lease_digests: HashSet::new(),
            combined_patch_digest: None,
            receipts: ReceiptChainV1::default(),
        };
        run.active_path_leases = run.plan.path_leases.clone();
        run.transition(
            HarnessState::Validating,
            ReceiptEventKind::Admission,
            "hermes-manager",
            ReceiptVerdict::Pass,
            now,
        )?;
        Ok(run)
    }

    pub fn state(&self) -> HarnessState {
        self.state
    }

    pub fn repair_cycles(&self) -> u8 {
        self.repair_cycles
    }

    pub fn receipt_events(&self) -> &[ReceiptEventV1] {
        self.receipts.events()
    }

    pub fn receipt_head(&self) -> &str {
        self.receipts.head()
    }

    pub fn load_context(
        &mut self,
        evidence: &RetrievalEvidenceV1,
        actor: &str,
        now: u64,
    ) -> Result<(), HarnessRunError> {
        self.require_state(HarnessState::Validating)?;
        self.ensure_active(now)?;
        self.verify_chain()?;
        evidence.validate()?;
        let context = &evidence.context_bundle;
        if context.task_id != self.plan.task_id
            || context.goal_spec_digest != self.plan.goal_spec_digest
            || context.repository_id != self.plan.repository_id
            || context.base_sha != self.plan.run_plan.base_sha
            || context.bundle_digest != self.plan.context_bundle_digest
        {
            return self.policy_stop(
                "context-binding",
                now,
                HarnessRunError::ContextBindingMismatch,
            );
        }
        self.append_receipt(ReceiptDraftV1 {
            event_kind: ReceiptEventKind::Retrieval,
            actor_principal: actor.to_owned(),
            from_state: self.state,
            to_state: HarnessState::ContextReady,
            lease_digest: None,
            command_id: Some(evidence.command_id.clone()),
            artifact_digests: vec![
                context.bundle_digest.clone(),
                context.graph_snapshot_digest.clone(),
            ],
            patch_digest: None,
            stdout_sha256: Some(evidence.stdout_sha256.clone()),
            stderr_sha256: Some(evidence.stderr_sha256.clone()),
            stdout_bytes: evidence.stdout_bytes,
            stderr_bytes: evidence.stderr_bytes,
            started_at_unix_seconds: now,
            finished_at_unix_seconds: now,
            verdict: ReceiptVerdict::Pass,
            provider_calls: evidence.provider_calls,
            external_calls: evidence.external_calls,
            network_denied: evidence.network_denied,
            provider_environment_scrubbed: evidence.provider_environment_scrubbed,
            secret_output_detected: evidence.secret_output_detected,
            secret_private_read_detected: evidence.secret_private_read_detected,
            external_write_attempted: evidence.external_write_attempted,
            deploy_attempted: evidence.deploy_attempted,
            push_attempted: evidence.push_attempted,
            message_send_attempted: evidence.message_send_attempted,
        })?;
        self.state = HarnessState::ContextReady;
        self.state_entered_at_unix_seconds = now;
        Ok(())
    }

    pub fn admit(
        &mut self,
        grant: &AdmissionGrantV1,
        nonce_ledger: &mut AdmissionNonceLedgerV1,
        now: u64,
    ) -> Result<(), HarnessRunError> {
        self.require_state(HarnessState::ContextReady)?;
        self.ensure_active(now)?;
        self.verify_chain()?;
        grant.validate_for(&self.plan, now)?;
        match nonce_ledger.reserve_admission(&grant.nonce, &self.active_path_leases) {
            Ok(()) => {}
            Err(OneUseLedgerCollision::Grant) => {
                return self.policy_stop("grant-reuse", now, HarnessRunError::GrantAlreadyConsumed);
            }
            Err(OneUseLedgerCollision::Lease) => {
                return self.policy_stop("lease-reuse", now, HarnessRunError::LeaseAlreadyConsumed);
            }
        }
        let nonce_commitment = hash_json(&json!({"grant_nonce": grant.nonce}));
        self.append_receipt(ReceiptDraftV1 {
            event_kind: ReceiptEventKind::Admission,
            actor_principal: grant.approver_principal.clone(),
            from_state: self.state,
            to_state: HarnessState::AdmissionValidated,
            lease_digest: None,
            command_id: None,
            artifact_digests: vec![grant.grant_digest.clone(), nonce_commitment],
            patch_digest: None,
            stdout_sha256: None,
            stderr_sha256: None,
            stdout_bytes: 0,
            stderr_bytes: 0,
            started_at_unix_seconds: now,
            finished_at_unix_seconds: now,
            verdict: ReceiptVerdict::Pass,
            provider_calls: 0,
            external_calls: 0,
            network_denied: true,
            provider_environment_scrubbed: true,
            secret_output_detected: false,
            secret_private_read_detected: false,
            external_write_attempted: false,
            deploy_attempted: false,
            push_attempted: false,
            message_send_attempted: false,
        })?;
        self.state = HarnessState::AdmissionValidated;
        self.state_entered_at_unix_seconds = now;
        self.transition(
            HarnessState::Ready,
            ReceiptEventKind::Admission,
            "hermes-manager",
            ReceiptVerdict::Pass,
            now,
        )
    }

    pub fn start_makers(&mut self, now: u64) -> Result<(), HarnessRunError> {
        self.require_state(HarnessState::Ready)?;
        self.ensure_active(now)?;
        self.verify_chain()?;
        validate_path_lease_set(&self.plan, &self.active_path_leases, now)?;
        self.transition(
            HarnessState::MakersRunning,
            ReceiptEventKind::Worker,
            "hermes-manager",
            ReceiptVerdict::Pass,
            now,
        )
    }

    pub fn complete_makers(
        &mut self,
        maker_receipts: &[MakerReceiptV1],
        now: u64,
    ) -> Result<(), HarnessRunError> {
        self.require_state(HarnessState::MakersRunning)?;
        self.ensure_active(now)?;
        self.verify_chain()?;
        let expected = self.plan.writer_principals();
        let observed: HashSet<_> = maker_receipts
            .iter()
            .map(|receipt| receipt.principal_id.clone())
            .collect();
        if maker_receipts.len() != expected.len() || observed != expected {
            return self.policy_stop(
                "maker-identity",
                now,
                HarnessRunError::MakerIdentityMismatch,
            );
        }
        let mut patches = Vec::with_capacity(maker_receipts.len());
        let mut ordered_receipts: Vec<_> = maker_receipts.iter().collect();
        ordered_receipts.sort_by(|left, right| {
            (
                left.started_at_unix_seconds,
                left.finished_at_unix_seconds,
                left.principal_id.as_str(),
            )
                .cmp(&(
                    right.started_at_unix_seconds,
                    right.finished_at_unix_seconds,
                    right.principal_id.as_str(),
                ))
        });
        for receipt in ordered_receipts {
            if receipt.provider_calls != 0
                || receipt.external_calls != 0
                || receipt.artifact_digests.is_empty()
                || !receipt.network_denied
                || !receipt.provider_environment_scrubbed
                || receipt.secret_output_detected
                || receipt.secret_private_read_detected
                || receipt.external_write_attempted
                || receipt.deploy_attempted
                || receipt.push_attempted
                || receipt.message_send_attempted
                || receipt.started_at_unix_seconds > receipt.finished_at_unix_seconds
                || receipt.started_at_unix_seconds < self.state_entered_at_unix_seconds
                || receipt.finished_at_unix_seconds > now
            {
                return self.policy_stop("maker-effect", now, HarnessRunError::ForbiddenEffect);
            }
            validate_digest(&receipt.lease_digest)?;
            validate_digest(&receipt.patch_digest)?;
            for digest in &receipt.artifact_digests {
                validate_digest(digest)?;
            }
            let Some(lease) = self
                .active_path_leases
                .iter()
                .find(|lease| lease.principal_id == receipt.principal_id)
                .cloned()
            else {
                return self.policy_stop("maker-lease", now, HarnessRunError::MakerLeaseMismatch);
            };
            if lease.lease_digest != receipt.lease_digest
                || lease.issued_at_unix_seconds > receipt.started_at_unix_seconds
                || lease.expires_at_unix_seconds <= receipt.finished_at_unix_seconds
                || lease.expires_at_unix_seconds <= now
                || self.consumed_lease_digests.contains(&receipt.lease_digest)
            {
                return self.policy_stop("maker-lease", now, HarnessRunError::MakerLeaseMismatch);
            }
            if let Err(error) =
                validate_git_diff_evidence(&self.plan, &lease, &receipt.git_evidence)
            {
                return self.policy_stop("git-guard", now, HarnessRunError::GitGuard(error));
            }
            let git_evidence_digest = git_evidence_digest_for(&receipt.git_evidence);
            if receipt.git_evidence.diff_sha256 != receipt.patch_digest
                || !receipt.artifact_digests.contains(&git_evidence_digest)
            {
                return self.policy_stop(
                    "git-evidence-binding",
                    now,
                    HarnessRunError::MakerLeaseMismatch,
                );
            }
            self.consumed_lease_digests
                .insert(receipt.lease_digest.clone());
            self.consumed_lease_ids.insert(lease.lease_id.clone());
            self.consumed_lease_nonces.insert(lease.nonce.clone());
            patches.push(receipt.patch_digest.clone());
            self.append_receipt(ReceiptDraftV1 {
                event_kind: ReceiptEventKind::Worker,
                actor_principal: receipt.principal_id.clone(),
                from_state: HarnessState::MakersRunning,
                to_state: HarnessState::MakersRunning,
                lease_digest: Some(receipt.lease_digest.clone()),
                command_id: None,
                artifact_digests: receipt.artifact_digests.clone(),
                patch_digest: Some(receipt.patch_digest.clone()),
                stdout_sha256: None,
                stderr_sha256: None,
                stdout_bytes: 0,
                stderr_bytes: 0,
                started_at_unix_seconds: receipt.started_at_unix_seconds,
                finished_at_unix_seconds: receipt.finished_at_unix_seconds,
                verdict: ReceiptVerdict::Pass,
                provider_calls: 0,
                external_calls: 0,
                network_denied: receipt.network_denied,
                provider_environment_scrubbed: receipt.provider_environment_scrubbed,
                secret_output_detected: receipt.secret_output_detected,
                secret_private_read_detected: receipt.secret_private_read_detected,
                external_write_attempted: receipt.external_write_attempted,
                deploy_attempted: receipt.deploy_attempted,
                push_attempted: receipt.push_attempted,
                message_send_attempted: receipt.message_send_attempted,
            })?;
        }
        patches.sort();
        let combined = hash_json(&json!({"patch_digests": patches}));
        self.combined_patch_digest = Some(combined.clone());
        self.append_receipt(ReceiptDraftV1 {
            event_kind: ReceiptEventKind::Lease,
            actor_principal: "hermes-manager".to_owned(),
            from_state: self.state,
            to_state: HarnessState::MakersComplete,
            lease_digest: None,
            command_id: None,
            artifact_digests: Vec::new(),
            patch_digest: Some(combined),
            stdout_sha256: None,
            stderr_sha256: None,
            stdout_bytes: 0,
            stderr_bytes: 0,
            started_at_unix_seconds: now,
            finished_at_unix_seconds: now,
            verdict: ReceiptVerdict::Pass,
            provider_calls: 0,
            external_calls: 0,
            network_denied: true,
            provider_environment_scrubbed: true,
            secret_output_detected: false,
            secret_private_read_detected: false,
            external_write_attempted: false,
            deploy_attempted: false,
            push_attempted: false,
            message_send_attempted: false,
        })?;
        self.state = HarnessState::MakersComplete;
        self.state_entered_at_unix_seconds = now;
        Ok(())
    }

    pub fn record_tests(
        &mut self,
        test_receipts: &[TestExecutionReceiptV1],
        now: u64,
    ) -> Result<(), HarnessRunError> {
        self.require_state(HarnessState::MakersComplete)?;
        self.ensure_active(now)?;
        self.verify_chain()?;
        let testing_started_at = test_receipts
            .iter()
            .map(|receipt| receipt.started_at_unix_seconds)
            .min()
            .ok_or(HarnessRunError::TestCommandSetMismatch)?;
        if testing_started_at < self.state_entered_at_unix_seconds || testing_started_at > now {
            return self.policy_stop(
                "test-chronology",
                now,
                HarnessRunError::TestEvidencePolicyViolation,
            );
        }
        self.transition(
            HarnessState::Testing,
            ReceiptEventKind::Test,
            "hermes-manager",
            ReceiptVerdict::Pass,
            testing_started_at,
        )?;
        let expected: HashSet<_> = self.plan.test_command_ids.iter().copied().collect();
        let observed: HashSet<_> = test_receipts
            .iter()
            .map(|receipt| receipt.command_id)
            .collect();
        if test_receipts.len() != expected.len() || observed != expected {
            return self.policy_stop(
                "test-command-set",
                now,
                HarnessRunError::TestCommandSetMismatch,
            );
        }
        let mut all_passed = true;
        let mut ordered_receipts: Vec<_> = test_receipts.iter().collect();
        ordered_receipts.sort_by_key(|receipt| {
            (
                receipt.started_at_unix_seconds,
                receipt.finished_at_unix_seconds,
                format!("{:?}", receipt.command_id),
            )
        });
        for receipt in ordered_receipts {
            validate_digest(&receipt.stdout_sha256)?;
            validate_digest(&receipt.stderr_sha256)?;
            let duration = receipt
                .finished_at_unix_seconds
                .checked_sub(receipt.started_at_unix_seconds);
            let safety_valid = receipt.fixed_argv_verified
                && !receipt.shell_used
                && receipt.provider_calls == 0
                && receipt.external_calls == 0
                && receipt.network_denied
                && receipt.provider_environment_scrubbed
                && !receipt.secret_output_detected
                && !receipt.secret_private_read_detected
                && !receipt.external_write_attempted
                && !receipt.deploy_attempted
                && !receipt.push_attempted
                && !receipt.message_send_attempted
                && !receipt.timed_out
                && receipt.started_at_unix_seconds >= self.state_entered_at_unix_seconds
                && receipt.finished_at_unix_seconds <= now
                && duration.is_some_and(|seconds| {
                    seconds <= command_spec(receipt.command_id).timeout_seconds
                        && seconds <= self.plan.budgets.max_command_seconds
                });
            if !safety_valid {
                return self.policy_stop(
                    "test-evidence-policy",
                    now,
                    HarnessRunError::TestEvidencePolicyViolation,
                );
            }
            let passed = receipt.exit_code == 0;
            all_passed &= passed;
            let execution_receipt_digest = test_execution_receipt_digest_for(receipt);
            let catalog_spec_digest = command_spec_digest(receipt.command_id);
            self.append_receipt(ReceiptDraftV1 {
                event_kind: ReceiptEventKind::Test,
                actor_principal: "deterministic-test-runner".to_owned(),
                from_state: HarnessState::Testing,
                to_state: HarnessState::Testing,
                lease_digest: None,
                command_id: Some(format!("{:?}", receipt.command_id)),
                artifact_digests: vec![execution_receipt_digest, catalog_spec_digest],
                patch_digest: self.combined_patch_digest.clone(),
                stdout_sha256: Some(receipt.stdout_sha256.clone()),
                stderr_sha256: Some(receipt.stderr_sha256.clone()),
                stdout_bytes: receipt.stdout_bytes,
                stderr_bytes: receipt.stderr_bytes,
                started_at_unix_seconds: receipt.started_at_unix_seconds,
                finished_at_unix_seconds: receipt.finished_at_unix_seconds,
                verdict: if passed {
                    ReceiptVerdict::Pass
                } else {
                    ReceiptVerdict::Fail
                },
                provider_calls: receipt.provider_calls,
                external_calls: receipt.external_calls,
                network_denied: receipt.network_denied,
                provider_environment_scrubbed: receipt.provider_environment_scrubbed,
                secret_output_detected: receipt.secret_output_detected,
                secret_private_read_detected: receipt.secret_private_read_detected,
                external_write_attempted: receipt.external_write_attempted,
                deploy_attempted: receipt.deploy_attempted,
                push_attempted: receipt.push_attempted,
                message_send_attempted: receipt.message_send_attempted,
            })?;
        }
        let target = if all_passed {
            HarnessState::TestsPassed
        } else {
            HarnessState::TestFailed
        };
        self.transition(
            target,
            ReceiptEventKind::Test,
            "hermes-manager",
            if all_passed {
                ReceiptVerdict::Pass
            } else {
                ReceiptVerdict::Fail
            },
            now,
        )
    }

    pub fn begin_verification(&mut self, now: u64) -> Result<(), HarnessRunError> {
        self.require_state(HarnessState::TestsPassed)?;
        self.ensure_active(now)?;
        self.verify_chain()?;
        self.transition(
            HarnessState::Verifying,
            ReceiptEventKind::Verifier,
            "hermes-manager",
            ReceiptVerdict::Pass,
            now,
        )
    }

    pub fn finish_verification(
        &mut self,
        receipt: &VerifierReceiptV1,
        now: u64,
    ) -> Result<(), HarnessRunError> {
        self.require_state(HarnessState::Verifying)?;
        self.ensure_active(now)?;
        self.verify_chain()?;
        let expected = self
            .plan
            .verifier_principal()
            .ok_or(HarnessRunError::VerifierIdentityMismatch)?;
        if receipt.principal_id != expected
            || self
                .plan
                .writer_principals()
                .contains(&receipt.principal_id)
            || receipt.has_write_lease
            || receipt.artifact_digests.is_empty()
            || receipt.reviewed_chain_head != self.receipts.head()
            || self.combined_patch_digest.as_deref() != Some(receipt.reviewed_patch_digest.as_str())
            || receipt.provider_calls != 0
            || receipt.external_calls != 0
            || !receipt.network_denied
            || !receipt.provider_environment_scrubbed
            || receipt.secret_output_detected
            || receipt.secret_private_read_detected
            || receipt.external_write_attempted
            || receipt.deploy_attempted
            || receipt.push_attempted
            || receipt.message_send_attempted
            || receipt.started_at_unix_seconds > receipt.finished_at_unix_seconds
            || receipt.started_at_unix_seconds < self.state_entered_at_unix_seconds
            || receipt.finished_at_unix_seconds > now
        {
            return self.policy_stop(
                "verifier-independence",
                now,
                HarnessRunError::VerifierIdentityMismatch,
            );
        }
        validate_digest(&receipt.reviewed_chain_head)?;
        validate_digest(&receipt.reviewed_patch_digest)?;
        for digest in &receipt.artifact_digests {
            validate_digest(digest)?;
        }
        let passed = receipt.decision == VerifierDecision::Pass;
        self.append_receipt(ReceiptDraftV1 {
            event_kind: ReceiptEventKind::Verifier,
            actor_principal: receipt.principal_id.clone(),
            from_state: self.state,
            to_state: if passed {
                HarnessState::ValidationPassed
            } else {
                HarnessState::VerificationFailed
            },
            lease_digest: None,
            command_id: None,
            artifact_digests: receipt.artifact_digests.clone(),
            patch_digest: Some(receipt.reviewed_patch_digest.clone()),
            stdout_sha256: None,
            stderr_sha256: None,
            stdout_bytes: 0,
            stderr_bytes: 0,
            started_at_unix_seconds: receipt.started_at_unix_seconds,
            finished_at_unix_seconds: receipt.finished_at_unix_seconds,
            verdict: if passed {
                ReceiptVerdict::Pass
            } else {
                ReceiptVerdict::Fail
            },
            provider_calls: receipt.provider_calls,
            external_calls: receipt.external_calls,
            network_denied: receipt.network_denied,
            provider_environment_scrubbed: receipt.provider_environment_scrubbed,
            secret_output_detected: receipt.secret_output_detected,
            secret_private_read_detected: receipt.secret_private_read_detected,
            external_write_attempted: receipt.external_write_attempted,
            deploy_attempted: receipt.deploy_attempted,
            push_attempted: receipt.push_attempted,
            message_send_attempted: receipt.message_send_attempted,
        })?;
        self.state = if passed {
            HarnessState::ValidationPassed
        } else {
            HarnessState::VerificationFailed
        };
        self.state_entered_at_unix_seconds = receipt.finished_at_unix_seconds;
        Ok(())
    }

    pub fn request_repair(
        &mut self,
        replacement_leases: Vec<PathLeaseV1>,
        nonce_ledger: &mut AdmissionNonceLedgerV1,
        now: u64,
    ) -> Result<(), HarnessRunError> {
        if !matches!(
            self.state,
            HarnessState::TestFailed | HarnessState::VerificationFailed
        ) {
            return Err(HarnessRunError::InvalidTransition {
                from: self.state,
                expected: HarnessState::TestFailed,
            });
        }
        self.ensure_active(now)?;
        self.verify_chain()?;
        if self.repair_cycles >= self.plan.budgets.max_repair_cycles {
            self.transition(
                HarnessState::Failed,
                ReceiptEventKind::Terminal,
                "hermes-manager",
                ReceiptVerdict::Fail,
                now,
            )?;
            return Err(HarnessRunError::RepairBudgetExhausted);
        }
        if let Err(error) = self.validate_replacement_leases(&replacement_leases, now) {
            return self.policy_stop("repair-lease", now, error);
        }
        if nonce_ledger
            .reserve_replacement_leases(&replacement_leases)
            .is_err()
        {
            return self.policy_stop(
                "repair-lease-reuse",
                now,
                HarnessRunError::LeaseAlreadyConsumed,
            );
        }
        self.repair_cycles += 1;
        self.transition(
            HarnessState::RepairPlanned,
            ReceiptEventKind::Repair,
            "hermes-manager",
            ReceiptVerdict::Pass,
            now,
        )?;
        self.transition(
            HarnessState::LeaseRevalidating,
            ReceiptEventKind::Lease,
            "hermes-manager",
            ReceiptVerdict::Pass,
            now,
        )?;
        for lease in &replacement_leases {
            self.append_receipt(ReceiptDraftV1 {
                event_kind: ReceiptEventKind::Lease,
                actor_principal: "hermes-manager".to_owned(),
                from_state: HarnessState::LeaseRevalidating,
                to_state: HarnessState::LeaseRevalidating,
                lease_digest: Some(lease.lease_digest.clone()),
                command_id: None,
                artifact_digests: Vec::new(),
                patch_digest: self.combined_patch_digest.clone(),
                stdout_sha256: None,
                stderr_sha256: None,
                stdout_bytes: 0,
                stderr_bytes: 0,
                started_at_unix_seconds: now,
                finished_at_unix_seconds: now,
                verdict: ReceiptVerdict::Pass,
                provider_calls: 0,
                external_calls: 0,
                network_denied: true,
                provider_environment_scrubbed: true,
                secret_output_detected: false,
                secret_private_read_detected: false,
                external_write_attempted: false,
                deploy_attempted: false,
                push_attempted: false,
                message_send_attempted: false,
            })?;
        }
        self.active_path_leases = replacement_leases;
        self.combined_patch_digest = None;
        self.transition(
            HarnessState::MakersRunning,
            ReceiptEventKind::Worker,
            "hermes-manager",
            ReceiptVerdict::Pass,
            now,
        )
    }

    pub fn mark_restart_detected(&mut self, now: u64) -> Result<(), HarnessRunError> {
        if self.state.is_terminal() {
            return Ok(());
        }
        self.verify_chain()?;
        let terminal_at = now.max(self.state_entered_at_unix_seconds);
        self.transition(
            HarnessState::RecoveryReviewRequired,
            ReceiptEventKind::Terminal,
            "harness-recovery-guard",
            ReceiptVerdict::Unverified,
            terminal_at,
        )
    }

    pub fn verify_chain(&self) -> Result<(), HarnessRunError> {
        self.receipts.verify(&self.identity)?;
        Ok(())
    }

    fn ensure_active(&mut self, now: u64) -> Result<(), HarnessRunError> {
        let elapsed = now.checked_sub(self.started_at_unix_seconds);
        if now < self.plan.issued_at_unix_seconds
            || now < self.state_entered_at_unix_seconds
            || now >= self.plan.expires_at_unix_seconds
            || elapsed.is_none()
            || elapsed.is_some_and(|seconds| seconds > self.plan.budgets.max_run_seconds)
        {
            return self.policy_stop(
                "run-time-budget",
                now,
                HarnessRunError::RunTimeBudgetExceeded,
            );
        }
        Ok(())
    }

    fn validate_replacement_leases(
        &self,
        replacement_leases: &[PathLeaseV1],
        now: u64,
    ) -> Result<(), HarnessRunError> {
        validate_path_lease_set(&self.plan, replacement_leases, now)?;
        for replacement in replacement_leases {
            let Some(original) = self.plan.lease_for_principal(&replacement.principal_id) else {
                return Err(HarnessRunError::ReplacementLeaseMismatch);
            };
            if replacement.lease_id == original.lease_id
                || replacement.nonce == original.nonce
                || replacement.lease_digest == original.lease_digest
                || self.consumed_lease_ids.contains(&replacement.lease_id)
                || self.consumed_lease_nonces.contains(&replacement.nonce)
                || self
                    .consumed_lease_digests
                    .contains(&replacement.lease_digest)
                || replacement.task_id != original.task_id
                || replacement.plan_digest != original.plan_digest
                || replacement.scope_digest != original.scope_digest
                || replacement.principal_id != original.principal_id
                || replacement.instance_id != original.instance_id
                || replacement.worktree != original.worktree
                || replacement.base_sha != original.base_sha
                || replacement.exact_paths != original.exact_paths
                || replacement.max_files != original.max_files
                || replacement.max_bytes != original.max_bytes
            {
                return Err(HarnessRunError::ReplacementLeaseMismatch);
            }
        }
        Ok(())
    }

    fn transition(
        &mut self,
        to_state: HarnessState,
        event_kind: ReceiptEventKind,
        actor: &str,
        verdict: ReceiptVerdict,
        now: u64,
    ) -> Result<(), HarnessRunError> {
        let from_state = self.state;
        self.append_receipt(ReceiptDraftV1 {
            event_kind,
            actor_principal: actor.to_owned(),
            from_state,
            to_state,
            lease_digest: None,
            command_id: None,
            artifact_digests: Vec::new(),
            patch_digest: self.combined_patch_digest.clone(),
            stdout_sha256: None,
            stderr_sha256: None,
            stdout_bytes: 0,
            stderr_bytes: 0,
            started_at_unix_seconds: now,
            finished_at_unix_seconds: now,
            verdict,
            provider_calls: 0,
            external_calls: 0,
            network_denied: true,
            provider_environment_scrubbed: true,
            secret_output_detected: false,
            secret_private_read_detected: false,
            external_write_attempted: false,
            deploy_attempted: false,
            push_attempted: false,
            message_send_attempted: false,
        })?;
        self.state = to_state;
        self.state_entered_at_unix_seconds = now;
        Ok(())
    }

    fn append_receipt(&mut self, draft: ReceiptDraftV1) -> Result<(), HarnessRunError> {
        self.receipts.append(&self.identity, draft)?;
        Ok(())
    }

    fn require_state(&self, expected: HarnessState) -> Result<(), HarnessRunError> {
        if self.state == expected {
            Ok(())
        } else {
            Err(HarnessRunError::InvalidTransition {
                from: self.state,
                expected,
            })
        }
    }

    fn policy_stop<T>(
        &mut self,
        actor: &str,
        now: u64,
        error: HarnessRunError,
    ) -> Result<T, HarnessRunError> {
        let terminal_at = now.max(self.state_entered_at_unix_seconds);
        let _ = self.transition(
            HarnessState::StoppedPolicy,
            ReceiptEventKind::Terminal,
            actor,
            ReceiptVerdict::Blocked,
            terminal_at,
        );
        Err(error)
    }
}

fn validate_runtime_id(value: &str) -> Result<(), HarnessRunError> {
    if value.is_empty()
        || value.len() > 128
        || value.trim() != value
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-' | b':'))
    {
        return Err(HarnessRunError::InvalidRunId);
    }
    Ok(())
}

#[derive(Debug, thiserror::Error)]
pub enum HarnessRunError {
    #[error("run id is invalid")]
    InvalidRunId,
    #[error("Harness Engineering plan is not active at this time")]
    PlanExpired,
    #[error("invalid state transition from {from:?}; expected {expected:?}")]
    InvalidTransition {
        from: HarnessState,
        expected: HarnessState,
    },
    #[error("context bundle does not bind the exact task, goal, repository, base, and plan")]
    ContextBindingMismatch,
    #[error("one-use admission grant was already consumed")]
    GrantAlreadyConsumed,
    #[error("one-use path lease identity, nonce, or digest was already consumed")]
    LeaseAlreadyConsumed,
    #[error("maker receipt identities do not match every planned writer exactly once")]
    MakerIdentityMismatch,
    #[error("maker receipt reported a forbidden effect")]
    ForbiddenEffect,
    #[error("maker receipt does not match its exact path lease")]
    MakerLeaseMismatch,
    #[error("test receipt set does not match the fixed plan command set")]
    TestCommandSetMismatch,
    #[error("test receipt violates fixed command, timeout, network, provider, or secret policy")]
    TestEvidencePolicyViolation,
    #[error("independent verifier identity, chain head, patch, or lease is invalid")]
    VerifierIdentityMismatch,
    #[error("replacement repair lease is not fresh or does not preserve exact scope")]
    ReplacementLeaseMismatch,
    #[error("Harness Engineering run exceeded its active time budget")]
    RunTimeBudgetExceeded,
    #[error("repair budget is exhausted")]
    RepairBudgetExhausted,
    #[error(transparent)]
    Contract(#[from] HarnessContractError),
    #[error(transparent)]
    Receipt(#[from] ReceiptChainError),
    #[error(transparent)]
    Retrieval(#[from] RetrievalEvidenceError),
    #[error(transparent)]
    GitGuard(#[from] GitGuardError),
}
