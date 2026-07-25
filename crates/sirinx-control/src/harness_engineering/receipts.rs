//! Digest-chained, content-minimized Harness Engineering receipts.

use serde::{Deserialize, Serialize};
use serde_json::json;

use super::contracts::{hash_json, validate_digest, HarnessContractError};

pub const GENESIS_RECEIPT_HASH: &str =
    "sha256:0000000000000000000000000000000000000000000000000000000000000000";

/// Validation state derived from supplied, digest-bound evidence.
///
/// `ValidationPassed` is deliberately not named `Passed` or `Done`: this
/// validation-only module does not execute commands or independently observe
/// the filesystem, so the state is not proof that an external action occurred.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HarnessState {
    Received,
    Validating,
    ContextReady,
    AdmissionValidated,
    Ready,
    MakersRunning,
    MakersComplete,
    Testing,
    TestsPassed,
    TestFailed,
    Verifying,
    VerificationFailed,
    RepairPlanned,
    LeaseRevalidating,
    ValidationPassed,
    Failed,
    StoppedPolicy,
    Unverified,
    RecoveryReviewRequired,
}

impl HarnessState {
    pub fn is_terminal(self) -> bool {
        matches!(
            self,
            Self::ValidationPassed
                | Self::Failed
                | Self::StoppedPolicy
                | Self::Unverified
                | Self::RecoveryReviewRequired
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ReceiptEventKind {
    Admission,
    Retrieval,
    Worker,
    Lease,
    Test,
    Verifier,
    Repair,
    Terminal,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ReceiptVerdict {
    Pass,
    Fail,
    Blocked,
    Unverified,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(super) struct ReceiptDraftV1 {
    pub event_kind: ReceiptEventKind,
    pub actor_principal: String,
    pub from_state: HarnessState,
    pub to_state: HarnessState,
    pub lease_digest: Option<String>,
    pub command_id: Option<String>,
    pub artifact_digests: Vec<String>,
    pub patch_digest: Option<String>,
    pub stdout_sha256: Option<String>,
    pub stderr_sha256: Option<String>,
    pub stdout_bytes: u64,
    pub stderr_bytes: u64,
    pub started_at_unix_seconds: u64,
    pub finished_at_unix_seconds: u64,
    pub verdict: ReceiptVerdict,
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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ReceiptEventV1 {
    pub schema_version: String,
    pub sequence: u64,
    pub previous_hash: String,
    pub event_kind: ReceiptEventKind,
    pub task_id: String,
    pub run_id: String,
    pub goal_spec_digest: String,
    pub plan_digest: String,
    pub scope_digest: String,
    pub context_bundle_digest: String,
    pub base_sha: String,
    pub actor_principal: String,
    pub from_state: HarnessState,
    pub to_state: HarnessState,
    pub lease_digest: Option<String>,
    pub command_id: Option<String>,
    pub artifact_digests: Vec<String>,
    pub patch_digest: Option<String>,
    pub stdout_sha256: Option<String>,
    pub stderr_sha256: Option<String>,
    pub stdout_bytes: u64,
    pub stderr_bytes: u64,
    pub started_at_unix_seconds: u64,
    pub finished_at_unix_seconds: u64,
    pub verdict: ReceiptVerdict,
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
    pub chain_hash: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct ReceiptIdentityV1 {
    pub task_id: String,
    pub run_id: String,
    pub goal_spec_digest: String,
    pub plan_digest: String,
    pub scope_digest: String,
    pub context_bundle_digest: String,
    pub base_sha: String,
}

#[derive(Debug, Clone, Default)]
pub(crate) struct ReceiptChainV1 {
    events: Vec<ReceiptEventV1>,
}

impl ReceiptChainV1 {
    pub(super) fn events(&self) -> &[ReceiptEventV1] {
        &self.events
    }

    pub(super) fn head(&self) -> &str {
        self.events
            .last()
            .map(|event| event.chain_hash.as_str())
            .unwrap_or(GENESIS_RECEIPT_HASH)
    }

    pub(super) fn append(
        &mut self,
        identity: &ReceiptIdentityV1,
        draft: ReceiptDraftV1,
    ) -> Result<&ReceiptEventV1, ReceiptChainError> {
        validate_receipt_draft(&draft)?;
        let previous_hash = self.head().to_owned();
        let mut event = ReceiptEventV1 {
            schema_version: "1.0.0".to_owned(),
            sequence: self.events.len() as u64 + 1,
            previous_hash,
            event_kind: draft.event_kind,
            task_id: identity.task_id.clone(),
            run_id: identity.run_id.clone(),
            goal_spec_digest: identity.goal_spec_digest.clone(),
            plan_digest: identity.plan_digest.clone(),
            scope_digest: identity.scope_digest.clone(),
            context_bundle_digest: identity.context_bundle_digest.clone(),
            base_sha: identity.base_sha.clone(),
            actor_principal: draft.actor_principal,
            from_state: draft.from_state,
            to_state: draft.to_state,
            lease_digest: draft.lease_digest,
            command_id: draft.command_id,
            artifact_digests: draft.artifact_digests,
            patch_digest: draft.patch_digest,
            stdout_sha256: draft.stdout_sha256,
            stderr_sha256: draft.stderr_sha256,
            stdout_bytes: draft.stdout_bytes,
            stderr_bytes: draft.stderr_bytes,
            started_at_unix_seconds: draft.started_at_unix_seconds,
            finished_at_unix_seconds: draft.finished_at_unix_seconds,
            verdict: draft.verdict,
            provider_calls: draft.provider_calls,
            external_calls: draft.external_calls,
            network_denied: draft.network_denied,
            provider_environment_scrubbed: draft.provider_environment_scrubbed,
            secret_output_detected: draft.secret_output_detected,
            secret_private_read_detected: draft.secret_private_read_detected,
            external_write_attempted: draft.external_write_attempted,
            deploy_attempted: draft.deploy_attempted,
            push_attempted: draft.push_attempted,
            message_send_attempted: draft.message_send_attempted,
            chain_hash: String::new(),
        };
        event.chain_hash = receipt_hash_for(&event);
        self.events.push(event);
        Ok(self.events.last().expect("event was just appended"))
    }

    pub(super) fn verify(&self, identity: &ReceiptIdentityV1) -> Result<(), ReceiptChainError> {
        let mut previous = GENESIS_RECEIPT_HASH;
        let mut expected_from_state = HarnessState::Received;
        let mut state_entered_at_unix_seconds = 0;
        let mut last_event_started_at_unix_seconds = 0;
        for (index, event) in self.events.iter().enumerate() {
            if event.sequence != index as u64 + 1
                || event.previous_hash != previous
                || event.from_state != expected_from_state
                || !legal_transition(event.from_state, event.to_state)
                || !event_semantics_are_valid(event)
                || event.started_at_unix_seconds < state_entered_at_unix_seconds
                || event.started_at_unix_seconds < last_event_started_at_unix_seconds
                || event.task_id != identity.task_id
                || event.run_id != identity.run_id
                || event.goal_spec_digest != identity.goal_spec_digest
                || event.plan_digest != identity.plan_digest
                || event.scope_digest != identity.scope_digest
                || event.context_bundle_digest != identity.context_bundle_digest
                || event.base_sha != identity.base_sha
                || event.chain_hash != receipt_hash_for(event)
            {
                return Err(ReceiptChainError::Integrity);
            }
            validate_receipt_event(event)?;
            previous = &event.chain_hash;
            expected_from_state = event.to_state;
            last_event_started_at_unix_seconds = event.started_at_unix_seconds;
            if event.from_state != event.to_state {
                state_entered_at_unix_seconds = event.finished_at_unix_seconds;
            }
        }
        Ok(())
    }

    /// Verify an externally restored sequence without accepting it as live
    /// state. This is the only supported recovery/read-back entrypoint.
    #[cfg(test)]
    pub(super) fn verify_restored(
        events: &[ReceiptEventV1],
        identity: &ReceiptIdentityV1,
        expected_external_head: &str,
    ) -> Result<(), ReceiptChainError> {
        if events.is_empty() {
            return Err(ReceiptChainError::EmptyRestoredChain);
        }
        validate_digest(expected_external_head)?;
        let restored = Self {
            events: events.to_vec(),
        };
        restored.verify(identity)?;
        if restored.head() != expected_external_head {
            return Err(ReceiptChainError::ExternalAnchorMismatch);
        }
        Ok(())
    }
}

pub(crate) fn receipt_hash_for(event: &ReceiptEventV1) -> String {
    hash_json(&json!({
        "schema_version": event.schema_version,
        "sequence": event.sequence,
        "previous_hash": event.previous_hash,
        "event_kind": event.event_kind,
        "task_id": event.task_id,
        "run_id": event.run_id,
        "goal_spec_digest": event.goal_spec_digest,
        "plan_digest": event.plan_digest,
        "scope_digest": event.scope_digest,
        "context_bundle_digest": event.context_bundle_digest,
        "base_sha": event.base_sha,
        "actor_principal": event.actor_principal,
        "from_state": event.from_state,
        "to_state": event.to_state,
        "lease_digest": event.lease_digest,
        "command_id": event.command_id,
        "artifact_digests": event.artifact_digests,
        "patch_digest": event.patch_digest,
        "stdout_sha256": event.stdout_sha256,
        "stderr_sha256": event.stderr_sha256,
        "stdout_bytes": event.stdout_bytes,
        "stderr_bytes": event.stderr_bytes,
        "started_at_unix_seconds": event.started_at_unix_seconds,
        "finished_at_unix_seconds": event.finished_at_unix_seconds,
        "verdict": event.verdict,
        "provider_calls": event.provider_calls,
        "external_calls": event.external_calls,
        "network_denied": event.network_denied,
        "provider_environment_scrubbed": event.provider_environment_scrubbed,
        "secret_output_detected": event.secret_output_detected,
        "secret_private_read_detected": event.secret_private_read_detected,
        "external_write_attempted": event.external_write_attempted,
        "deploy_attempted": event.deploy_attempted,
        "push_attempted": event.push_attempted,
        "message_send_attempted": event.message_send_attempted,
    }))
}

fn validate_receipt_draft(draft: &ReceiptDraftV1) -> Result<(), ReceiptChainError> {
    if draft.actor_principal.trim().is_empty()
        || draft.actor_principal.len() > 128
        || draft.started_at_unix_seconds > draft.finished_at_unix_seconds
        || draft.provider_calls != 0
        || draft.external_calls != 0
        || !draft.network_denied
        || !draft.provider_environment_scrubbed
        || draft.secret_output_detected
        || draft.secret_private_read_detected
        || draft.external_write_attempted
        || draft.deploy_attempted
        || draft.push_attempted
        || draft.message_send_attempted
    {
        return Err(ReceiptChainError::InvalidEvent);
    }
    for digest in draft
        .artifact_digests
        .iter()
        .chain(draft.lease_digest.iter())
        .chain(draft.patch_digest.iter())
        .chain(draft.stdout_sha256.iter())
        .chain(draft.stderr_sha256.iter())
    {
        validate_digest(digest)?;
    }
    Ok(())
}

fn validate_receipt_event(event: &ReceiptEventV1) -> Result<(), ReceiptChainError> {
    if event.schema_version != "1.0.0" {
        return Err(ReceiptChainError::UnsupportedSchema);
    }
    validate_receipt_draft(&ReceiptDraftV1 {
        event_kind: event.event_kind,
        actor_principal: event.actor_principal.clone(),
        from_state: event.from_state,
        to_state: event.to_state,
        lease_digest: event.lease_digest.clone(),
        command_id: event.command_id.clone(),
        artifact_digests: event.artifact_digests.clone(),
        patch_digest: event.patch_digest.clone(),
        stdout_sha256: event.stdout_sha256.clone(),
        stderr_sha256: event.stderr_sha256.clone(),
        stdout_bytes: event.stdout_bytes,
        stderr_bytes: event.stderr_bytes,
        started_at_unix_seconds: event.started_at_unix_seconds,
        finished_at_unix_seconds: event.finished_at_unix_seconds,
        verdict: event.verdict,
        provider_calls: event.provider_calls,
        external_calls: event.external_calls,
        network_denied: event.network_denied,
        provider_environment_scrubbed: event.provider_environment_scrubbed,
        secret_output_detected: event.secret_output_detected,
        secret_private_read_detected: event.secret_private_read_detected,
        external_write_attempted: event.external_write_attempted,
        deploy_attempted: event.deploy_attempted,
        push_attempted: event.push_attempted,
        message_send_attempted: event.message_send_attempted,
    })?;
    validate_digest(&event.previous_hash)?;
    validate_digest(&event.chain_hash)?;
    Ok(())
}

fn legal_transition(from: HarnessState, to: HarnessState) -> bool {
    matches!(
        (from, to),
        (HarnessState::Received, HarnessState::Validating)
            | (HarnessState::Validating, HarnessState::ContextReady)
            | (HarnessState::ContextReady, HarnessState::AdmissionValidated)
            | (HarnessState::AdmissionValidated, HarnessState::Ready)
            | (HarnessState::Ready, HarnessState::MakersRunning)
            | (HarnessState::MakersRunning, HarnessState::MakersRunning)
            | (HarnessState::MakersRunning, HarnessState::MakersComplete)
            | (HarnessState::MakersComplete, HarnessState::Testing)
            | (HarnessState::Testing, HarnessState::Testing)
            | (HarnessState::Testing, HarnessState::TestsPassed)
            | (HarnessState::Testing, HarnessState::TestFailed)
            | (HarnessState::TestsPassed, HarnessState::Verifying)
            | (
                HarnessState::Verifying,
                HarnessState::ValidationPassed
            )
            | (HarnessState::Verifying, HarnessState::VerificationFailed)
            | (HarnessState::TestFailed, HarnessState::RepairPlanned)
            | (
                HarnessState::VerificationFailed,
                HarnessState::RepairPlanned
            )
            | (HarnessState::RepairPlanned, HarnessState::LeaseRevalidating)
            | (
                HarnessState::LeaseRevalidating,
                HarnessState::LeaseRevalidating
            )
            | (HarnessState::LeaseRevalidating, HarnessState::MakersRunning)
            | (HarnessState::TestFailed, HarnessState::Failed)
            | (HarnessState::VerificationFailed, HarnessState::Failed)
    ) || (!from.is_terminal()
        && matches!(
            to,
            HarnessState::StoppedPolicy | HarnessState::RecoveryReviewRequired
        ))
}

fn event_semantics_are_valid(event: &ReceiptEventV1) -> bool {
    let manager = event.actor_principal == "hermes-manager";
    let verdict_matches = match (event.event_kind, event.from_state, event.to_state) {
        (ReceiptEventKind::Test, HarnessState::Testing, HarnessState::Testing) => {
            matches!(event.verdict, ReceiptVerdict::Pass | ReceiptVerdict::Fail)
        }
        (
            _,
            _,
            HarnessState::TestFailed | HarnessState::VerificationFailed | HarnessState::Failed,
        ) => event.verdict == ReceiptVerdict::Fail,
        (_, _, HarnessState::StoppedPolicy) => event.verdict == ReceiptVerdict::Blocked,
        (_, _, HarnessState::RecoveryReviewRequired) => event.verdict == ReceiptVerdict::Unverified,
        _ => event.verdict == ReceiptVerdict::Pass,
    };
    if !verdict_matches {
        return false;
    }

    match (event.event_kind, event.from_state, event.to_state) {
        (ReceiptEventKind::Admission, HarnessState::Received, HarnessState::Validating)
        | (ReceiptEventKind::Admission, HarnessState::AdmissionValidated, HarnessState::Ready)
        | (ReceiptEventKind::Worker, HarnessState::Ready, HarnessState::MakersRunning)
        | (
            ReceiptEventKind::Worker,
            HarnessState::LeaseRevalidating,
            HarnessState::MakersRunning,
        )
        | (ReceiptEventKind::Test, HarnessState::MakersComplete, HarnessState::Testing)
        | (
            ReceiptEventKind::Test,
            HarnessState::Testing,
            HarnessState::TestsPassed | HarnessState::TestFailed,
        )
        | (ReceiptEventKind::Verifier, HarnessState::TestsPassed, HarnessState::Verifying)
        | (
            ReceiptEventKind::Repair,
            HarnessState::TestFailed | HarnessState::VerificationFailed,
            HarnessState::RepairPlanned,
        )
        | (ReceiptEventKind::Lease, HarnessState::RepairPlanned, HarnessState::LeaseRevalidating) => {
            manager
        }
        (ReceiptEventKind::Retrieval, HarnessState::Validating, HarnessState::ContextReady) => {
            event.command_id.is_some()
                && event.artifact_digests.len() >= 2
                && event.stdout_sha256.is_some()
                && event.stderr_sha256.is_some()
        }
        (
            ReceiptEventKind::Admission,
            HarnessState::ContextReady,
            HarnessState::AdmissionValidated,
        ) => !manager && event.artifact_digests.len() == 2,
        (ReceiptEventKind::Worker, HarnessState::MakersRunning, HarnessState::MakersRunning) => {
            !manager
                && event.lease_digest.is_some()
                && event.patch_digest.is_some()
                && !event.artifact_digests.is_empty()
        }
        (ReceiptEventKind::Lease, HarnessState::MakersRunning, HarnessState::MakersComplete) => {
            manager && event.patch_digest.is_some()
        }
        (
            ReceiptEventKind::Lease,
            HarnessState::LeaseRevalidating,
            HarnessState::LeaseRevalidating,
        ) => manager && event.lease_digest.is_some(),
        (ReceiptEventKind::Test, HarnessState::Testing, HarnessState::Testing) => {
            event.actor_principal == "deterministic-test-runner"
                && event.command_id.is_some()
                && event.stdout_sha256.is_some()
                && event.stderr_sha256.is_some()
        }
        (
            ReceiptEventKind::Verifier,
            HarnessState::Verifying,
            HarnessState::ValidationPassed | HarnessState::VerificationFailed,
        ) => !manager && event.patch_digest.is_some() && !event.artifact_digests.is_empty(),
        (
            ReceiptEventKind::Terminal,
            HarnessState::TestFailed | HarnessState::VerificationFailed,
            HarnessState::Failed,
        ) => manager,
        (ReceiptEventKind::Terminal, from, HarnessState::StoppedPolicy) => !from.is_terminal(),
        (ReceiptEventKind::Terminal, from, HarnessState::RecoveryReviewRequired) => {
            !from.is_terminal() && event.actor_principal == "harness-recovery-guard"
        }
        _ => false,
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ReceiptChainError {
    #[error("unsupported receipt schema")]
    UnsupportedSchema,
    #[error("restored receipt chain cannot be empty")]
    EmptyRestoredChain,
    #[error("receipt event is invalid or reports a forbidden effect")]
    InvalidEvent,
    #[error("receipt chain integrity validation failed")]
    Integrity,
    #[error("restored receipt chain does not match the externally supplied head")]
    ExternalAnchorMismatch,
    #[error(transparent)]
    Contract(#[from] HarnessContractError),
}
