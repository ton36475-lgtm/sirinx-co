//! Compile-time, HOLD-only contracts for the future shared effect authority.
//!
//! This module deliberately contains no store, route, process, network, provider,
//! or message adapter. Structural validation cannot mint authority. Migration
//! 0007, current principal attestations, a database clock, a single-use replay
//! ledger, and a durable `REQUESTING` transition are still required before any
//! executor can exist.

use std::collections::BTreeSet;

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::agent_runtime::ActionClass;

const MANIFEST_JSON: &str =
    include_str!("../../../config/agent-runtime/action-circuits.plan-only.v1.json");
const MANIFEST_DIGEST_DOMAIN: &[u8] = b"sirinx:effect-authority-manifest:v1\0";
const APPROVAL_DIGEST_DOMAIN: &[u8] = b"sirinx:approval-receipt:v2-plan\0";
const APPROVAL_WIRE_VERSION: &[u8] = b"sirinx:approval-receipt:v2-wire:1\0";
const REVIEW_PINNED_MANIFEST_DIGEST: &str =
    "b2421996825817400d31f88757843225403ed2080541812c4db889e1ffe3cbb0";
const CONNECTION_PLAN_V1_DIGEST: &str =
    "51bb41ec38c1472c1ec0684cc6668591cebc3d58a05747d112d1917eecb046d1";
const MAX_GRANT_LIFETIME_MS: i64 = 300_000;
const MAX_SAFE_JSON_INTEGER: u64 = 9_007_199_254_740_991;

const STOP_RULES: &[&str] = &[
    "migration-0007-deferred",
    "durable-authority-kernel-unavailable",
    "all-effect-circuits-held",
    "approval-consumption-disabled",
    "outbox-claim-disabled",
    "executors-unavailable",
    "b10-effect-routes-unregistered",
    "network-provider-and-message-io-disabled",
];

const PREVIEW_BLOCKERS: &[&str] = &[
    "approval_is_structural_plan_only",
    "attestation_authority_unavailable",
    "candidate_clock_is_caller_supplied",
    "durable_authority_kernel_unavailable",
    "effect_circuit_hold",
    "migration_0007_deferred",
    "replay_ledger_unavailable",
    "scope_artifact_not_validated",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EffectActionKind {
    Install,
    ResourceCleanup,
    ConnectorActivation,
    ProviderCall,
    QueueMutation,
    A2aEgress,
    LiveSend,
    Push,
    Merge,
    ProductionMigration,
    CloudflareMutation,
    Deploy,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EffectProfile {
    Install,
    ResourceCleanup,
    ConnectorActivation,
    ProviderCall,
    QueueMutation,
    A2aEgress,
    Telegram,
    CustomerMessaging,
    Push,
    Merge,
    ProductionMigration,
    CloudflareMutation,
    Deploy,
    Line,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CircuitStatePlan {
    Hold,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum EffectStatePlan {
    Prepared,
}

/// Future durable attempt vocabulary frozen by B10.0.
///
/// The contract oracle models allowed edges, but this crate cannot persist or
/// perform them. In particular, only migration-0007 authority may atomically
/// move a prepared effect to `REQUESTING` while consuming its single-use grant.
#[cfg(test)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum EffectAttemptStateV1 {
    Prepared,
    Requesting,
    Verifying,
    Delivered,
    Failed,
    EffectUnknown,
}

#[cfg(test)]
const fn future_effect_protocol_edge_defined(
    from: EffectAttemptStateV1,
    to: EffectAttemptStateV1,
) -> bool {
    matches!(
        (from, to),
        (
            EffectAttemptStateV1::Prepared,
            EffectAttemptStateV1::Requesting
        ) | (
            EffectAttemptStateV1::Requesting,
            EffectAttemptStateV1::Verifying
                | EffectAttemptStateV1::Failed
                | EffectAttemptStateV1::EffectUnknown
        ) | (
            EffectAttemptStateV1::Verifying,
            EffectAttemptStateV1::Delivered
                | EffectAttemptStateV1::Failed
                | EffectAttemptStateV1::EffectUnknown
        )
    )
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct ActionCircuitBindingV1 {
    action_kind: EffectActionKind,
    circuit_name: String,
    effect_profile: EffectProfile,
    action_class: ActionClass,
    approval_schema_version: String,
    executor_role: String,
    circuit_state: CircuitStatePlan,
    effect_state: EffectStatePlan,
    enabled: bool,
    executor_available: bool,
    route_registered: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct ActionCircuitManifestV1 {
    schema_version: String,
    status: String,
    migration: String,
    migration_state: String,
    authority_source: String,
    bindings: Vec<ActionCircuitBindingV1>,
    unbound_effect_profiles: Vec<EffectProfile>,
    stop_rules: Vec<String>,
}

#[derive(Clone, Copy)]
struct ExpectedBinding {
    action: EffectActionKind,
    circuit: &'static str,
    profile: EffectProfile,
    class: ActionClass,
    role: &'static str,
}

const EXPECTED_BINDINGS: &[ExpectedBinding] = &[
    ExpectedBinding {
        action: EffectActionKind::Install,
        circuit: "install",
        profile: EffectProfile::Install,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_install_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::ResourceCleanup,
        circuit: "resource_cleanup",
        profile: EffectProfile::ResourceCleanup,
        class: ActionClass::C,
        role: "sirinx_agent_runtime_resource_cleanup_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::ConnectorActivation,
        circuit: "connector_activation",
        profile: EffectProfile::ConnectorActivation,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_connector_activation_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::ProviderCall,
        circuit: "provider_call",
        profile: EffectProfile::ProviderCall,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_provider_call_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::QueueMutation,
        circuit: "queue_mutation",
        profile: EffectProfile::QueueMutation,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_queue_mutation_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::A2aEgress,
        circuit: "a2a_egress",
        profile: EffectProfile::A2aEgress,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_a2a_egress_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::LiveSend,
        circuit: "telegram_send",
        profile: EffectProfile::Telegram,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_telegram_send_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::LiveSend,
        circuit: "customer_messaging",
        profile: EffectProfile::CustomerMessaging,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_customer_messaging_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::Push,
        circuit: "push",
        profile: EffectProfile::Push,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_push_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::Merge,
        circuit: "merge",
        profile: EffectProfile::Merge,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_merge_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::ProductionMigration,
        circuit: "production_migration",
        profile: EffectProfile::ProductionMigration,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_production_migration_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::CloudflareMutation,
        circuit: "cloudflare_mutation",
        profile: EffectProfile::CloudflareMutation,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_cloudflare_mutation_executor",
    },
    ExpectedBinding {
        action: EffectActionKind::Deploy,
        circuit: "deploy",
        profile: EffectProfile::Deploy,
        class: ActionClass::D,
        role: "sirinx_agent_runtime_deploy_executor",
    },
];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ApprovalLimitsV2 {
    pub max_calls: u32,
    pub max_cost_microusd: u64,
    pub max_runtime_seconds: u32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ApprovalPrincipalsV2 {
    pub requester: String,
    pub approver: String,
    pub maker: String,
    pub checker: String,
    pub executor: String,
    pub issuer: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ApprovalAttestationsV2 {
    pub approver_attestation_id: String,
    pub approver_attestation_digest: String,
    pub issuer_attestation_id: String,
    pub issuer_attestation_digest: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ScopeBindingV2 {
    pub schema_id: String,
    pub schema_version: String,
    pub scope_digest: String,
    pub artifact_ref: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ConnectionEvidenceBindingV1 {
    pub connection_id: Option<String>,
    pub plan_digest: Option<String>,
    pub evidence_digest: Option<String>,
    pub agent_card_digest: Option<String>,
    pub endpoint_digest: Option<String>,
    pub authentication_policy_digest: Option<String>,
    pub tool_policy_digest: Option<String>,
    pub component_revision_digest: Option<String>,
    pub license_digest: Option<String>,
    pub provenance_digest: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ApprovalReceiptV2Plan {
    pub schema_version: String,
    pub status: String,
    pub manifest_digest: String,
    pub ticket_id: String,
    pub ticket_version: u64,
    pub grant_id: String,
    pub grant_version: u64,
    pub task_id: String,
    pub task_digest: String,
    pub run_id: String,
    pub run_digest: String,
    pub lease_id: String,
    pub lease_digest: String,
    pub action_kind: EffectActionKind,
    pub action_class: ActionClass,
    pub circuit_name: String,
    pub effect_profile: EffectProfile,
    pub executor_role: String,
    pub effect_state: EffectStatePlan,
    pub effect_key: String,
    pub target_ref: String,
    pub target_digest: String,
    pub payload_digest: String,
    pub repository_commit_sha: String,
    pub plan_hash: String,
    pub scope_hash: String,
    pub action_digest: String,
    pub contract_digest: String,
    pub data_class: String,
    pub limits: ApprovalLimitsV2,
    pub principals: ApprovalPrincipalsV2,
    pub attestations: ApprovalAttestationsV2,
    pub approver_assertion_ref: String,
    pub nonce_digest: String,
    pub scope: ScopeBindingV2,
    pub connection_evidence: ConnectionEvidenceBindingV1,
    pub issued_at_unix_ms: i64,
    pub expires_at_unix_ms: i64,
    pub consumed_at_unix_ms: Option<i64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
struct EffectAuthorityValidationV1 {
    manifest_digest_consistent: bool,
    action_circuit_binding_consistent: bool,
    approval_contract_digest_consistent: bool,
    principal_separation_consistent: bool,
    connection_evidence_shape_consistent: bool,
    candidate_clock_window_consistent: bool,
    scope_artifact_validated: bool,
    attestation_authority_validated: bool,
    clock_authority_validated: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EffectAuthorityPreviewV1 {
    schema_version: &'static str,
    status: &'static str,
    mode: &'static str,
    manifest_digest: String,
    contract_digest: String,
    ticket_id: String,
    grant_id: String,
    action_kind: EffectActionKind,
    circuit_name: String,
    effect_profile: EffectProfile,
    effect_state: EffectStatePlan,
    validation: EffectAuthorityValidationV1,
    read_only: bool,
    authority_validated: bool,
    database_authority_validated: bool,
    circuit_open: bool,
    grant_active: bool,
    approval_consumed: bool,
    replay_protection_available: bool,
    effect_claimed: bool,
    outbox_prepared: bool,
    requesting_persisted: bool,
    can_prepare: bool,
    can_claim: bool,
    can_execute: bool,
    can_connect: bool,
    can_emit_a2a: bool,
    can_send: bool,
    can_call_provider: bool,
    can_mutate: bool,
    can_deploy: bool,
    io_performed: bool,
    network_calls: bool,
    database_writes: bool,
    external_writes: bool,
    messages_sent: bool,
    provider_called: bool,
    command_executed: bool,
    blockers: Vec<&'static str>,
    stop_point: &'static str,
}

#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum EffectAuthorityContractError {
    #[error("invalid embedded action/circuit manifest JSON: {0}")]
    ManifestJson(String),
    #[error("effect authority manifest drift: {0}")]
    Manifest(&'static str),
    #[error("effect authority manifest digest drift")]
    ManifestDigest,
    #[error("invalid approval receipt v2 plan: {0}")]
    Approval(&'static str),
    #[error("approval receipt serialization failed: {0}")]
    Serialization(String),
}

fn hash(domain: &[u8], bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(domain);
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

fn manifest_digest(
    manifest: &ActionCircuitManifestV1,
) -> Result<String, EffectAuthorityContractError> {
    let bytes = serde_json::to_vec(manifest)
        .map_err(|error| EffectAuthorityContractError::Serialization(error.to_string()))?;
    Ok(hash(MANIFEST_DIGEST_DOMAIN, &bytes))
}

fn validate_manifest(
    manifest: &ActionCircuitManifestV1,
) -> Result<(), EffectAuthorityContractError> {
    if manifest.schema_version != "1.0-plan" {
        return Err(EffectAuthorityContractError::Manifest("schema_version"));
    }
    if manifest.status != "PLAN_ONLY_ALL_EFFECT_CIRCUITS_HELD" {
        return Err(EffectAuthorityContractError::Manifest("status"));
    }
    if manifest.migration != "0007_agent_runtime_effect_authority.sql"
        || manifest.migration_state != "DEFERRED"
        || manifest.authority_source != "RUST_EMBEDDED_REVIEW_PINNED_MANIFEST"
    {
        return Err(EffectAuthorityContractError::Manifest("authority_boundary"));
    }
    if manifest.bindings.len() != EXPECTED_BINDINGS.len() {
        return Err(EffectAuthorityContractError::Manifest("binding_count"));
    }
    let expected_stop_rules: Vec<String> =
        STOP_RULES.iter().map(|value| (*value).to_owned()).collect();
    if manifest.stop_rules != expected_stop_rules {
        return Err(EffectAuthorityContractError::Manifest("stop_rules"));
    }
    if manifest.unbound_effect_profiles != [EffectProfile::Line] {
        return Err(EffectAuthorityContractError::Manifest(
            "unbound_effect_profiles",
        ));
    }

    let mut circuits = BTreeSet::new();
    let mut tuples = BTreeSet::new();
    for (binding, expected) in manifest.bindings.iter().zip(EXPECTED_BINDINGS) {
        if binding.action_kind != expected.action
            || binding.circuit_name != expected.circuit
            || binding.effect_profile != expected.profile
            || binding.action_class != expected.class
            || binding.executor_role != expected.role
        {
            return Err(EffectAuthorityContractError::Manifest("binding_drift"));
        }
        if binding.approval_schema_version != "2.0"
            || binding.circuit_state != CircuitStatePlan::Hold
            || binding.effect_state != EffectStatePlan::Prepared
            || binding.enabled
            || binding.executor_available
            || binding.route_registered
        {
            return Err(EffectAuthorityContractError::Manifest("binding_not_held"));
        }
        if !circuits.insert(binding.circuit_name.as_str()) {
            return Err(EffectAuthorityContractError::Manifest("duplicate_circuit"));
        }
        if !tuples.insert((binding.action_kind, binding.effect_profile)) {
            return Err(EffectAuthorityContractError::Manifest(
                "duplicate_action_profile",
            ));
        }
    }
    Ok(())
}

fn embedded_effect_authority_manifest(
) -> Result<(ActionCircuitManifestV1, String), EffectAuthorityContractError> {
    let manifest: ActionCircuitManifestV1 = serde_json::from_str(MANIFEST_JSON)
        .map_err(|error| EffectAuthorityContractError::ManifestJson(error.to_string()))?;
    validate_manifest(&manifest)?;
    let digest = manifest_digest(&manifest)?;
    if digest != REVIEW_PINNED_MANIFEST_DIGEST {
        return Err(EffectAuthorityContractError::ManifestDigest);
    }
    Ok((manifest, digest))
}

/// Digest of the validated, review-pinned embedded manifest.
///
/// The manifest itself remains private so callers cannot pair a mutated set of
/// authority-like flags with this trusted digest.
pub fn review_pinned_effect_authority_manifest_digest(
) -> Result<String, EffectAuthorityContractError> {
    embedded_effect_authority_manifest().map(|(_, digest)| digest)
}

fn push_wire_field(output: &mut Vec<u8>, name: &str, value: &[u8]) {
    output.extend_from_slice(&(name.len() as u64).to_be_bytes());
    output.extend_from_slice(name.as_bytes());
    output.extend_from_slice(&(value.len() as u64).to_be_bytes());
    output.extend_from_slice(value);
}

fn push_wire_text(output: &mut Vec<u8>, name: &str, value: &str) {
    push_wire_field(output, name, value.as_bytes());
}

fn push_wire_u64(output: &mut Vec<u8>, name: &str, value: u64) {
    push_wire_text(output, name, &value.to_string());
}

fn push_wire_i64(output: &mut Vec<u8>, name: &str, value: i64) {
    push_wire_text(output, name, &value.to_string());
}

fn push_wire_optional_text(output: &mut Vec<u8>, name: &str, value: Option<&str>) {
    let mut encoded = Vec::new();
    match value {
        Some(value) => {
            encoded.push(1);
            encoded.extend_from_slice(value.as_bytes());
        }
        None => encoded.push(0),
    }
    push_wire_field(output, name, &encoded);
}

fn push_wire_optional_i64(output: &mut Vec<u8>, name: &str, value: Option<i64>) {
    let encoded = value.map(|value| value.to_string());
    push_wire_optional_text(output, name, encoded.as_deref());
}

const fn action_kind_wire(value: EffectActionKind) -> &'static str {
    match value {
        EffectActionKind::Install => "INSTALL",
        EffectActionKind::ResourceCleanup => "RESOURCE_CLEANUP",
        EffectActionKind::ConnectorActivation => "CONNECTOR_ACTIVATION",
        EffectActionKind::ProviderCall => "PROVIDER_CALL",
        EffectActionKind::QueueMutation => "QUEUE_MUTATION",
        EffectActionKind::A2aEgress => "A2A_EGRESS",
        EffectActionKind::LiveSend => "LIVE_SEND",
        EffectActionKind::Push => "PUSH",
        EffectActionKind::Merge => "MERGE",
        EffectActionKind::ProductionMigration => "PRODUCTION_MIGRATION",
        EffectActionKind::CloudflareMutation => "CLOUDFLARE_MUTATION",
        EffectActionKind::Deploy => "DEPLOY",
    }
}

const fn action_class_wire(value: ActionClass) -> &'static str {
    match value {
        ActionClass::A => "A",
        ActionClass::B => "B",
        ActionClass::C => "C",
        ActionClass::D => "D",
        ActionClass::X => "X",
    }
}

const fn effect_profile_wire(value: EffectProfile) -> &'static str {
    match value {
        EffectProfile::Install => "INSTALL",
        EffectProfile::ResourceCleanup => "RESOURCE_CLEANUP",
        EffectProfile::ConnectorActivation => "CONNECTOR_ACTIVATION",
        EffectProfile::ProviderCall => "PROVIDER_CALL",
        EffectProfile::QueueMutation => "QUEUE_MUTATION",
        EffectProfile::A2aEgress => "A2A_EGRESS",
        EffectProfile::Telegram => "TELEGRAM",
        EffectProfile::CustomerMessaging => "CUSTOMER_MESSAGING",
        EffectProfile::Push => "PUSH",
        EffectProfile::Merge => "MERGE",
        EffectProfile::ProductionMigration => "PRODUCTION_MIGRATION",
        EffectProfile::CloudflareMutation => "CLOUDFLARE_MUTATION",
        EffectProfile::Deploy => "DEPLOY",
        EffectProfile::Line => "LINE",
    }
}

/// Canonical, portable v2 approval bytes excluding `contractDigest`.
///
/// The wire begins with `sirinx:approval-receipt:v2-wire:1\0`. Every field is
/// then encoded in the order below as an unsigned 64-bit big-endian field-name
/// length, UTF-8 field name, unsigned 64-bit big-endian value length, and value
/// bytes. Integers use canonical base-10 ASCII. Optional values use a leading
/// `0x00` for null or `0x01` followed by UTF-8 content for present values.
pub fn approval_contract_bytes_v2(receipt: &ApprovalReceiptV2Plan) -> Vec<u8> {
    let mut output = APPROVAL_WIRE_VERSION.to_vec();
    let text_fields = [
        ("schemaVersion", receipt.schema_version.as_str()),
        ("status", receipt.status.as_str()),
        ("manifestDigest", receipt.manifest_digest.as_str()),
        ("ticketId", receipt.ticket_id.as_str()),
    ];
    for (name, value) in text_fields {
        push_wire_text(&mut output, name, value);
    }
    push_wire_u64(&mut output, "ticketVersion", receipt.ticket_version);
    push_wire_text(&mut output, "grantId", &receipt.grant_id);
    push_wire_u64(&mut output, "grantVersion", receipt.grant_version);
    for (name, value) in [
        ("taskId", receipt.task_id.as_str()),
        ("taskDigest", receipt.task_digest.as_str()),
        ("runId", receipt.run_id.as_str()),
        ("runDigest", receipt.run_digest.as_str()),
        ("leaseId", receipt.lease_id.as_str()),
        ("leaseDigest", receipt.lease_digest.as_str()),
        ("actionKind", action_kind_wire(receipt.action_kind)),
        ("actionClass", action_class_wire(receipt.action_class)),
        ("circuitName", receipt.circuit_name.as_str()),
        ("effectProfile", effect_profile_wire(receipt.effect_profile)),
        ("executorRole", receipt.executor_role.as_str()),
        ("effectState", "PREPARED"),
        ("effectKey", receipt.effect_key.as_str()),
        ("targetRef", receipt.target_ref.as_str()),
        ("targetDigest", receipt.target_digest.as_str()),
        ("payloadDigest", receipt.payload_digest.as_str()),
        (
            "repositoryCommitSha",
            receipt.repository_commit_sha.as_str(),
        ),
        ("planHash", receipt.plan_hash.as_str()),
        ("scopeHash", receipt.scope_hash.as_str()),
        ("actionDigest", receipt.action_digest.as_str()),
        ("dataClass", receipt.data_class.as_str()),
    ] {
        push_wire_text(&mut output, name, value);
    }
    push_wire_u64(
        &mut output,
        "limits.maxCalls",
        u64::from(receipt.limits.max_calls),
    );
    push_wire_u64(
        &mut output,
        "limits.maxCostMicrousd",
        receipt.limits.max_cost_microusd,
    );
    push_wire_u64(
        &mut output,
        "limits.maxRuntimeSeconds",
        u64::from(receipt.limits.max_runtime_seconds),
    );
    for (name, value) in [
        (
            "principals.requester",
            receipt.principals.requester.as_str(),
        ),
        ("principals.approver", receipt.principals.approver.as_str()),
        ("principals.maker", receipt.principals.maker.as_str()),
        ("principals.checker", receipt.principals.checker.as_str()),
        ("principals.executor", receipt.principals.executor.as_str()),
        ("principals.issuer", receipt.principals.issuer.as_str()),
        (
            "attestations.approverAttestationId",
            receipt.attestations.approver_attestation_id.as_str(),
        ),
        (
            "attestations.approverAttestationDigest",
            receipt.attestations.approver_attestation_digest.as_str(),
        ),
        (
            "attestations.issuerAttestationId",
            receipt.attestations.issuer_attestation_id.as_str(),
        ),
        (
            "attestations.issuerAttestationDigest",
            receipt.attestations.issuer_attestation_digest.as_str(),
        ),
        (
            "approverAssertionRef",
            receipt.approver_assertion_ref.as_str(),
        ),
        ("nonceDigest", receipt.nonce_digest.as_str()),
        ("scope.schemaId", receipt.scope.schema_id.as_str()),
        ("scope.schemaVersion", receipt.scope.schema_version.as_str()),
        ("scope.scopeDigest", receipt.scope.scope_digest.as_str()),
        ("scope.artifactRef", receipt.scope.artifact_ref.as_str()),
    ] {
        push_wire_text(&mut output, name, value);
    }
    let connection = &receipt.connection_evidence;
    for (name, value) in [
        (
            "connectionEvidence.connectionId",
            connection.connection_id.as_deref(),
        ),
        (
            "connectionEvidence.planDigest",
            connection.plan_digest.as_deref(),
        ),
        (
            "connectionEvidence.evidenceDigest",
            connection.evidence_digest.as_deref(),
        ),
        (
            "connectionEvidence.agentCardDigest",
            connection.agent_card_digest.as_deref(),
        ),
        (
            "connectionEvidence.endpointDigest",
            connection.endpoint_digest.as_deref(),
        ),
        (
            "connectionEvidence.authenticationPolicyDigest",
            connection.authentication_policy_digest.as_deref(),
        ),
        (
            "connectionEvidence.toolPolicyDigest",
            connection.tool_policy_digest.as_deref(),
        ),
        (
            "connectionEvidence.componentRevisionDigest",
            connection.component_revision_digest.as_deref(),
        ),
        (
            "connectionEvidence.licenseDigest",
            connection.license_digest.as_deref(),
        ),
        (
            "connectionEvidence.provenanceDigest",
            connection.provenance_digest.as_deref(),
        ),
    ] {
        push_wire_optional_text(&mut output, name, value);
    }
    push_wire_i64(&mut output, "issuedAtUnixMs", receipt.issued_at_unix_ms);
    push_wire_i64(&mut output, "expiresAtUnixMs", receipt.expires_at_unix_ms);
    push_wire_optional_i64(&mut output, "consumedAtUnixMs", receipt.consumed_at_unix_ms);
    output
}

pub fn approval_contract_digest_v2(
    receipt: &ApprovalReceiptV2Plan,
) -> Result<String, EffectAuthorityContractError> {
    let bytes = approval_contract_bytes_v2(receipt);
    Ok(hash(APPROVAL_DIGEST_DOMAIN, &bytes))
}

fn valid_prefixed_id(value: &str, prefix: &str) -> bool {
    value.len() > prefix.len()
        && value.len() <= 160
        && value.starts_with(prefix)
        && value[prefix.len()..]
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-'))
}

fn valid_digest(value: &str, length: usize) -> bool {
    value.len() == length
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

fn valid_bounded(value: &str, max: usize) -> bool {
    !value.trim().is_empty()
        && value.len() <= max
        && !value
            .bytes()
            .any(|byte| byte == 0 || byte.is_ascii_control())
}

fn validate_connection_evidence_shape(
    value: &ConnectionEvidenceBindingV1,
    action: EffectActionKind,
) -> Result<(), EffectAuthorityContractError> {
    let core_digests = [
        &value.plan_digest,
        &value.evidence_digest,
        &value.endpoint_digest,
        &value.authentication_policy_digest,
        &value.tool_policy_digest,
        &value.component_revision_digest,
        &value.license_digest,
        &value.provenance_digest,
    ];
    let core_present = core_digests.iter().filter(|item| item.is_some()).count();
    let absent =
        value.connection_id.is_none() && core_present == 0 && value.agent_card_digest.is_none();
    let connection_required = matches!(
        action,
        EffectActionKind::ConnectorActivation
            | EffectActionKind::ProviderCall
            | EffectActionKind::QueueMutation
            | EffectActionKind::A2aEgress
            | EffectActionKind::LiveSend
            | EffectActionKind::Push
            | EffectActionKind::Merge
            | EffectActionKind::ProductionMigration
            | EffectActionKind::CloudflareMutation
            | EffectActionKind::Deploy
    );
    if absent {
        return if connection_required {
            Err(EffectAuthorityContractError::Approval(
                "connection_evidence_required",
            ))
        } else {
            Ok(())
        };
    }
    if action == EffectActionKind::ResourceCleanup {
        return Err(EffectAuthorityContractError::Approval(
            "connection_evidence_not_applicable",
        ));
    }
    if value.connection_id.as_ref().is_none_or(|id| {
        id.len() < 3
            || id.len() > 64
            || !id
                .as_bytes()
                .first()
                .is_some_and(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit())
            || !id
                .bytes()
                .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
    }) || core_present != core_digests.len()
    {
        return Err(EffectAuthorityContractError::Approval(
            "connection_evidence_partial",
        ));
    }
    if core_digests
        .into_iter()
        .flatten()
        .any(|digest| !valid_digest(digest, 64))
        || value
            .agent_card_digest
            .as_ref()
            .is_some_and(|digest| !valid_digest(digest, 64))
    {
        return Err(EffectAuthorityContractError::Approval(
            "connection_evidence_digest",
        ));
    }
    if value.plan_digest.as_deref() != Some(CONNECTION_PLAN_V1_DIGEST) {
        return Err(EffectAuthorityContractError::Approval(
            "connection_plan_digest",
        ));
    }
    if action == EffectActionKind::A2aEgress && value.agent_card_digest.is_none() {
        return Err(EffectAuthorityContractError::Approval(
            "a2a_agent_card_required",
        ));
    }
    if !matches!(
        action,
        EffectActionKind::A2aEgress | EffectActionKind::ConnectorActivation
    ) && value.agent_card_digest.is_some()
    {
        return Err(EffectAuthorityContractError::Approval(
            "agent_card_not_applicable",
        ));
    }
    Ok(())
}

fn validate_effect_profile_target(
    receipt: &ApprovalReceiptV2Plan,
) -> Result<(), EffectAuthorityContractError> {
    let connection_id = receipt.connection_evidence.connection_id.as_deref();
    if matches!(
        connection_id,
        Some("line-official-local-mcp" | "line-webhook-transport")
    ) || receipt.target_ref.starts_with("target://line/")
    {
        return Err(EffectAuthorityContractError::Approval(
            "line_effect_profile_unbound",
        ));
    }
    match receipt.effect_profile {
        EffectProfile::Telegram => {
            if connection_id != Some("telegram-bot-transport")
                || !receipt.target_ref.starts_with("target://telegram/")
                || receipt.scope.schema_id
                    != "https://sirinx.co/schemas/agent-runtime/live-send-scope.v2.schema.json"
            {
                return Err(EffectAuthorityContractError::Approval(
                    "telegram_transport_binding",
                ));
            }
        }
        EffectProfile::CustomerMessaging => {
            return Err(EffectAuthorityContractError::Approval(
                "customer_messaging_connection_unbound",
            ));
        }
        EffectProfile::A2aEgress => match connection_id {
            Some("codex-a2a-peer" | "claude-a2a-peer" | "kimi-a2a-peer" | "hermes-a2a-peer") => {}
            _ => {
                return Err(EffectAuthorityContractError::Approval("a2a_peer_binding"));
            }
        },
        _ => {}
    }
    Ok(())
}

fn validate_approval(
    receipt: &ApprovalReceiptV2Plan,
    binding: &ActionCircuitBindingV1,
    candidate_now_unix_ms: i64,
) -> Result<(), EffectAuthorityContractError> {
    if receipt.schema_version != "2.0" || receipt.status != "ISSUED_STRUCTURAL_ONLY" {
        return Err(EffectAuthorityContractError::Approval("version_or_status"));
    }
    if receipt.manifest_digest != REVIEW_PINNED_MANIFEST_DIGEST {
        return Err(EffectAuthorityContractError::Approval("manifest_digest"));
    }
    if !valid_prefixed_id(&receipt.ticket_id, "TKT-")
        || !valid_prefixed_id(&receipt.grant_id, "GRANT-")
        || !valid_prefixed_id(&receipt.task_id, "TASK-")
        || !valid_prefixed_id(&receipt.run_id, "RUN-")
        || !valid_prefixed_id(&receipt.lease_id, "LEASE-")
        || receipt.ticket_version == 0
        || receipt.grant_version == 0
        || receipt.ticket_version > MAX_SAFE_JSON_INTEGER
        || receipt.grant_version > MAX_SAFE_JSON_INTEGER
    {
        return Err(EffectAuthorityContractError::Approval(
            "identity_or_version",
        ));
    }
    if receipt.action_kind != binding.action_kind
        || receipt.action_class != binding.action_class
        || receipt.circuit_name != binding.circuit_name
        || receipt.effect_profile != binding.effect_profile
        || receipt.executor_role != binding.executor_role
        || receipt.effect_state != EffectStatePlan::Prepared
    {
        return Err(EffectAuthorityContractError::Approval(
            "action_circuit_binding",
        ));
    }
    if !valid_bounded(&receipt.effect_key, 256)
        || receipt.effect_key != format!("{}:{}", receipt.circuit_name, receipt.grant_id)
        || !valid_bounded(&receipt.target_ref, 2048)
        || !receipt.target_ref.starts_with("target://")
        || !valid_digest(&receipt.target_digest, 64)
        || !valid_digest(&receipt.payload_digest, 64)
        || !valid_digest(&receipt.repository_commit_sha, 40)
        || !valid_digest(&receipt.task_digest, 64)
        || !valid_digest(&receipt.run_digest, 64)
        || !valid_digest(&receipt.lease_digest, 64)
        || !valid_digest(&receipt.plan_hash, 64)
        || !valid_digest(&receipt.scope_hash, 64)
        || !valid_digest(&receipt.action_digest, 64)
        || !valid_digest(&receipt.contract_digest, 64)
        || !valid_digest(&receipt.nonce_digest, 64)
    {
        return Err(EffectAuthorityContractError::Approval("effect_binding"));
    }
    if !matches!(
        receipt.data_class.as_str(),
        "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED"
    ) || receipt.limits.max_calls != 1
        || receipt.limits.max_cost_microusd > MAX_SAFE_JSON_INTEGER
        || receipt.limits.max_runtime_seconds == 0
        || receipt.limits.max_runtime_seconds > 3600
    {
        return Err(EffectAuthorityContractError::Approval(
            "limits_or_data_class",
        ));
    }
    let principals = [
        receipt.principals.requester.as_str(),
        receipt.principals.approver.as_str(),
        receipt.principals.maker.as_str(),
        receipt.principals.checker.as_str(),
        receipt.principals.executor.as_str(),
        receipt.principals.issuer.as_str(),
    ];
    if principals.iter().any(|value| !valid_bounded(value, 256))
        || principals.iter().copied().collect::<BTreeSet<_>>().len() != principals.len()
    {
        return Err(EffectAuthorityContractError::Approval(
            "principal_separation",
        ));
    }
    if !valid_prefixed_id(&receipt.attestations.approver_attestation_id, "ATTEST-")
        || !valid_prefixed_id(&receipt.attestations.issuer_attestation_id, "ATTEST-")
        || !valid_digest(&receipt.attestations.approver_attestation_digest, 64)
        || !valid_digest(&receipt.attestations.issuer_attestation_digest, 64)
    {
        return Err(EffectAuthorityContractError::Approval("attestation_shape"));
    }
    if !receipt.approver_assertion_ref.starts_with("assertion://")
        || !valid_bounded(&receipt.approver_assertion_ref, 2048)
    {
        return Err(EffectAuthorityContractError::Approval("assertion_ref"));
    }
    if !receipt
        .scope
        .schema_id
        .starts_with("https://sirinx.co/schemas/")
        || !valid_bounded(&receipt.scope.schema_id, 2048)
        || !valid_bounded(&receipt.scope.schema_version, 32)
        || !valid_digest(&receipt.scope.scope_digest, 64)
        || !receipt.scope.artifact_ref.starts_with("artifact://")
        || !valid_bounded(&receipt.scope.artifact_ref, 2048)
    {
        return Err(EffectAuthorityContractError::Approval("scope_binding"));
    }
    validate_connection_evidence_shape(&receipt.connection_evidence, receipt.action_kind)?;
    validate_effect_profile_target(receipt)?;
    if receipt.issued_at_unix_ms <= 0
        || receipt.issued_at_unix_ms as u64 > MAX_SAFE_JSON_INTEGER
        || receipt.expires_at_unix_ms as u64 > MAX_SAFE_JSON_INTEGER
        || receipt.expires_at_unix_ms <= receipt.issued_at_unix_ms
        || receipt.expires_at_unix_ms - receipt.issued_at_unix_ms > MAX_GRANT_LIFETIME_MS
        || candidate_now_unix_ms < receipt.issued_at_unix_ms
        || candidate_now_unix_ms >= receipt.expires_at_unix_ms
        || receipt.consumed_at_unix_ms.is_some()
    {
        return Err(EffectAuthorityContractError::Approval(
            "candidate_time_window",
        ));
    }
    if approval_contract_digest_v2(receipt)? != receipt.contract_digest {
        return Err(EffectAuthorityContractError::Approval("contract_digest"));
    }
    Ok(())
}

pub fn preview_effect_authority_contract(
    receipt: &ApprovalReceiptV2Plan,
    candidate_now_unix_ms: i64,
) -> Result<EffectAuthorityPreviewV1, EffectAuthorityContractError> {
    let (manifest, manifest_digest) = embedded_effect_authority_manifest()?;
    let binding = manifest
        .bindings
        .iter()
        .find(|binding| {
            binding.action_kind == receipt.action_kind
                && binding.circuit_name == receipt.circuit_name
                && binding.effect_profile == receipt.effect_profile
                && binding.executor_role == receipt.executor_role
        })
        .ok_or(EffectAuthorityContractError::Approval(
            "unknown_action_circuit",
        ))?;
    validate_approval(receipt, binding, candidate_now_unix_ms)?;

    Ok(EffectAuthorityPreviewV1 {
        schema_version: "1.0-plan",
        status: "CONTRACT_VALIDATED_NOT_AUTHORIZED",
        mode: "rust-pure-hold-only-preview",
        manifest_digest,
        contract_digest: receipt.contract_digest.clone(),
        ticket_id: receipt.ticket_id.clone(),
        grant_id: receipt.grant_id.clone(),
        action_kind: receipt.action_kind,
        circuit_name: receipt.circuit_name.clone(),
        effect_profile: receipt.effect_profile,
        effect_state: EffectStatePlan::Prepared,
        validation: EffectAuthorityValidationV1 {
            manifest_digest_consistent: true,
            action_circuit_binding_consistent: true,
            approval_contract_digest_consistent: true,
            principal_separation_consistent: true,
            connection_evidence_shape_consistent: true,
            candidate_clock_window_consistent: true,
            scope_artifact_validated: false,
            attestation_authority_validated: false,
            clock_authority_validated: false,
        },
        read_only: true,
        authority_validated: false,
        database_authority_validated: false,
        circuit_open: false,
        grant_active: false,
        approval_consumed: false,
        replay_protection_available: false,
        effect_claimed: false,
        outbox_prepared: false,
        requesting_persisted: false,
        can_prepare: false,
        can_claim: false,
        can_execute: false,
        can_connect: false,
        can_emit_a2a: false,
        can_send: false,
        can_call_provider: false,
        can_mutate: false,
        can_deploy: false,
        io_performed: false,
        network_calls: false,
        database_writes: false,
        external_writes: false,
        messages_sent: false,
        provider_called: false,
        command_executed: false,
        blockers: PREVIEW_BLOCKERS.to_vec(),
        stop_point:
            "EFFECT AUTHORITY CONTRACT VALIDATED - NO AUTHORITY, CLAIM, EXECUTOR, OR EFFECT",
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const NOW: i64 = 1_795_104_000_000;

    fn digest(character: char, length: usize) -> String {
        std::iter::repeat_n(character, length).collect()
    }

    fn receipt() -> ApprovalReceiptV2Plan {
        let mut receipt = ApprovalReceiptV2Plan {
            schema_version: "2.0".into(),
            status: "ISSUED_STRUCTURAL_ONLY".into(),
            manifest_digest: REVIEW_PINNED_MANIFEST_DIGEST.into(),
            ticket_id: "TKT-effect-preview-001".into(),
            ticket_version: 1,
            grant_id: "GRANT-effect-preview-001".into(),
            grant_version: 1,
            task_id: "TASK-effect-preview-001".into(),
            task_digest: digest('e', 64),
            run_id: "RUN-effect-preview-001".into(),
            run_digest: digest('f', 64),
            lease_id: "LEASE-effect-preview-001".into(),
            lease_digest: digest('1', 64),
            action_kind: EffectActionKind::LiveSend,
            action_class: ActionClass::D,
            circuit_name: "telegram_send".into(),
            effect_profile: EffectProfile::Telegram,
            executor_role: "sirinx_agent_runtime_telegram_send_executor".into(),
            effect_state: EffectStatePlan::Prepared,
            effect_key: "telegram_send:GRANT-effect-preview-001".into(),
            target_ref: "target://telegram/fixed-destination-digest".into(),
            target_digest: digest('a', 64),
            payload_digest: digest('b', 64),
            repository_commit_sha: digest('c', 40),
            plan_hash: digest('d', 64),
            scope_hash: digest('e', 64),
            action_digest: digest('f', 64),
            contract_digest: digest('0', 64),
            data_class: "INTERNAL".into(),
            limits: ApprovalLimitsV2 {
                max_calls: 1,
                max_cost_microusd: 0,
                max_runtime_seconds: 30,
            },
            principals: ApprovalPrincipalsV2 {
                requester: "principal:requester".into(),
                approver: "principal:approver".into(),
                maker: "principal:maker".into(),
                checker: "principal:checker".into(),
                executor: "principal:executor".into(),
                issuer: "principal:issuer".into(),
            },
            attestations: ApprovalAttestationsV2 {
                approver_attestation_id: "ATTEST-approver-001".into(),
                approver_attestation_digest: digest('1', 64),
                issuer_attestation_id: "ATTEST-issuer-001".into(),
                issuer_attestation_digest: digest('2', 64),
            },
            approver_assertion_ref: "assertion://human/effect-preview-001".into(),
            nonce_digest: digest('3', 64),
            scope: ScopeBindingV2 {
                schema_id: "https://sirinx.co/schemas/agent-runtime/live-send-scope.v2.schema.json"
                    .into(),
                schema_version: "2.0".into(),
                scope_digest: digest('4', 64),
                artifact_ref: "artifact://scope/live-send-effect-preview-001".into(),
            },
            connection_evidence: ConnectionEvidenceBindingV1 {
                connection_id: Some("telegram-bot-transport".into()),
                plan_digest: Some(CONNECTION_PLAN_V1_DIGEST.into()),
                evidence_digest: Some(digest('6', 64)),
                agent_card_digest: None,
                endpoint_digest: Some(digest('8', 64)),
                authentication_policy_digest: Some(digest('9', 64)),
                tool_policy_digest: Some(digest('a', 64)),
                component_revision_digest: Some(digest('b', 64)),
                license_digest: Some(digest('c', 64)),
                provenance_digest: Some(digest('d', 64)),
            },
            issued_at_unix_ms: NOW - 30_000,
            expires_at_unix_ms: NOW + 30_000,
            consumed_at_unix_ms: None,
        };
        receipt.contract_digest = approval_contract_digest_v2(&receipt).unwrap();
        receipt
    }

    fn reseal(receipt: &mut ApprovalReceiptV2Plan) {
        receipt.contract_digest = approval_contract_digest_v2(receipt).unwrap();
    }

    #[test]
    fn embedded_manifest_is_complete_held_and_line_is_unbound() {
        let (manifest, digest) = embedded_effect_authority_manifest().unwrap();
        assert_eq!(manifest.bindings.len(), 13);
        assert_eq!(manifest.unbound_effect_profiles, [EffectProfile::Line]);
        assert_eq!(digest, REVIEW_PINNED_MANIFEST_DIGEST);
        assert!(manifest.bindings.iter().all(|binding| {
            binding.circuit_state == CircuitStatePlan::Hold
                && binding.effect_state == EffectStatePlan::Prepared
                && !binding.enabled
                && !binding.executor_available
                && !binding.route_registered
        }));
    }

    #[test]
    fn approval_wire_digest_matches_the_cross_language_golden_vector() {
        assert_eq!(
            receipt().contract_digest,
            "ae8572ec8efa464ca86e0231b5698cceea52bdc9f64d428ca8c0234003014e84"
        );
    }

    #[test]
    fn valid_contract_can_only_return_not_authorized() {
        let preview = preview_effect_authority_contract(&receipt(), NOW).unwrap();
        assert_eq!(preview.status, "CONTRACT_VALIDATED_NOT_AUTHORIZED");
        assert!(preview.read_only);
        assert!(!preview.authority_validated);
        assert!(!preview.database_authority_validated);
        assert!(!preview.circuit_open);
        assert!(!preview.grant_active);
        assert!(!preview.approval_consumed);
        assert!(!preview.replay_protection_available);
        assert!(!preview.effect_claimed);
        assert!(!preview.outbox_prepared);
        assert!(!preview.requesting_persisted);
        assert!(!preview.can_prepare);
        assert!(!preview.can_claim);
        assert!(!preview.can_execute);
        assert!(!preview.can_connect);
        assert!(!preview.can_emit_a2a);
        assert!(!preview.can_send);
        assert!(!preview.can_call_provider);
        assert!(!preview.can_mutate);
        assert!(!preview.can_deploy);
        assert!(!preview.io_performed);
        assert!(!preview.network_calls);
        assert!(!preview.database_writes);
        assert!(!preview.external_writes);
        assert!(!preview.messages_sent);
        assert!(!preview.provider_called);
        assert!(!preview.command_executed);
    }

    #[test]
    fn future_transition_oracle_is_closed_and_terminals_never_retry() {
        assert!(future_effect_protocol_edge_defined(
            EffectAttemptStateV1::Prepared,
            EffectAttemptStateV1::Requesting
        ));
        assert!(future_effect_protocol_edge_defined(
            EffectAttemptStateV1::Requesting,
            EffectAttemptStateV1::EffectUnknown
        ));
        assert!(future_effect_protocol_edge_defined(
            EffectAttemptStateV1::Verifying,
            EffectAttemptStateV1::Delivered
        ));
        for terminal in [
            EffectAttemptStateV1::Delivered,
            EffectAttemptStateV1::Failed,
            EffectAttemptStateV1::EffectUnknown,
        ] {
            for target in [
                EffectAttemptStateV1::Prepared,
                EffectAttemptStateV1::Requesting,
                EffectAttemptStateV1::Verifying,
                EffectAttemptStateV1::Delivered,
                EffectAttemptStateV1::Failed,
                EffectAttemptStateV1::EffectUnknown,
            ] {
                assert!(!future_effect_protocol_edge_defined(terminal, target));
            }
        }
        assert!(!future_effect_protocol_edge_defined(
            EffectAttemptStateV1::Prepared,
            EffectAttemptStateV1::Delivered
        ));
    }

    #[test]
    fn live_send_profile_cannot_be_substituted() {
        let mut value = receipt();
        value.circuit_name = "customer_messaging".into();
        value.effect_profile = EffectProfile::CustomerMessaging;
        reseal(&mut value);
        assert!(matches!(
            preview_effect_authority_contract(&value, NOW),
            Err(EffectAuthorityContractError::Approval(
                "unknown_action_circuit"
            )) | Err(EffectAuthorityContractError::Approval(
                "action_circuit_binding"
            ))
        ));
    }

    #[test]
    fn line_has_no_binding_and_fails_closed() {
        let mut value = receipt();
        value.effect_profile = EffectProfile::Line;
        value.circuit_name = "line_send".into();
        value.executor_role = "sirinx_agent_runtime_line_send_executor".into();
        reseal(&mut value);
        assert_eq!(
            preview_effect_authority_contract(&value, NOW),
            Err(EffectAuthorityContractError::Approval(
                "unknown_action_circuit"
            ))
        );
    }

    #[test]
    fn principal_overlap_is_rejected_even_after_reseal() {
        let mut value = receipt();
        value.principals.checker = value.principals.maker.clone();
        reseal(&mut value);
        assert_eq!(
            preview_effect_authority_contract(&value, NOW),
            Err(EffectAuthorityContractError::Approval(
                "principal_separation"
            ))
        );
    }

    #[test]
    fn cross_binding_and_contract_digest_drift_are_rejected() {
        let mut value = receipt();
        value.task_id = "TASK-replayed".into();
        assert_eq!(
            preview_effect_authority_contract(&value, NOW),
            Err(EffectAuthorityContractError::Approval("contract_digest"))
        );
        reseal(&mut value);
        assert!(preview_effect_authority_contract(&value, NOW).is_ok());
    }

    #[test]
    fn effect_key_is_deterministically_bound_to_circuit_and_grant() {
        let mut value = receipt();
        value.effect_key = "telegram_send:GRANT-different".into();
        reseal(&mut value);
        assert_eq!(
            preview_effect_authority_contract(&value, NOW),
            Err(EffectAuthorityContractError::Approval("effect_binding"))
        );
    }

    #[test]
    fn receipt_is_bound_to_the_reviewed_manifest_and_connection_plan() {
        let mut manifest_drift = receipt();
        manifest_drift.manifest_digest = digest('9', 64);
        reseal(&mut manifest_drift);
        assert_eq!(
            preview_effect_authority_contract(&manifest_drift, NOW),
            Err(EffectAuthorityContractError::Approval("manifest_digest"))
        );

        let mut plan_drift = receipt();
        plan_drift.connection_evidence.plan_digest = Some(digest('9', 64));
        reseal(&mut plan_drift);
        assert_eq!(
            preview_effect_authority_contract(&plan_drift, NOW),
            Err(EffectAuthorityContractError::Approval(
                "connection_plan_digest"
            ))
        );
    }

    #[test]
    fn stale_future_and_overlife_candidate_windows_are_rejected() {
        let valid = receipt();
        assert_eq!(
            preview_effect_authority_contract(&valid, valid.expires_at_unix_ms),
            Err(EffectAuthorityContractError::Approval(
                "candidate_time_window"
            ))
        );
        assert_eq!(
            preview_effect_authority_contract(&valid, valid.issued_at_unix_ms - 1),
            Err(EffectAuthorityContractError::Approval(
                "candidate_time_window"
            ))
        );
        let mut overlife = valid;
        overlife.expires_at_unix_ms = overlife.issued_at_unix_ms + MAX_GRANT_LIFETIME_MS + 1;
        reseal(&mut overlife);
        assert_eq!(
            preview_effect_authority_contract(&overlife, NOW),
            Err(EffectAuthorityContractError::Approval(
                "candidate_time_window"
            ))
        );
    }

    #[test]
    fn partial_connection_evidence_is_rejected() {
        let mut value = receipt();
        value.connection_evidence.provenance_digest = None;
        reseal(&mut value);
        assert_eq!(
            preview_effect_authority_contract(&value, NOW),
            Err(EffectAuthorityContractError::Approval(
                "connection_evidence_partial"
            ))
        );
    }

    #[test]
    fn connection_evidence_is_action_aware_and_a2a_requires_a_card() {
        let mut live_send = receipt();
        live_send.connection_evidence = ConnectionEvidenceBindingV1 {
            connection_id: None,
            plan_digest: None,
            evidence_digest: None,
            agent_card_digest: None,
            endpoint_digest: None,
            authentication_policy_digest: None,
            tool_policy_digest: None,
            component_revision_digest: None,
            license_digest: None,
            provenance_digest: None,
        };
        reseal(&mut live_send);
        assert_eq!(
            preview_effect_authority_contract(&live_send, NOW),
            Err(EffectAuthorityContractError::Approval(
                "connection_evidence_required"
            ))
        );

        let mut a2a = receipt();
        a2a.action_kind = EffectActionKind::A2aEgress;
        a2a.circuit_name = "a2a_egress".into();
        a2a.effect_profile = EffectProfile::A2aEgress;
        a2a.executor_role = "sirinx_agent_runtime_a2a_egress_executor".into();
        a2a.effect_key = "a2a_egress:GRANT-effect-preview-001".into();
        a2a.connection_evidence.connection_id = Some("codex-a2a-peer".into());
        reseal(&mut a2a);
        assert_eq!(
            preview_effect_authority_contract(&a2a, NOW),
            Err(EffectAuthorityContractError::Approval(
                "a2a_agent_card_required"
            ))
        );
        a2a.connection_evidence.agent_card_digest = Some(digest('7', 64));
        reseal(&mut a2a);
        assert!(preview_effect_authority_contract(&a2a, NOW).is_ok());

        let mut cleanup = receipt();
        cleanup.action_kind = EffectActionKind::ResourceCleanup;
        cleanup.action_class = ActionClass::C;
        cleanup.circuit_name = "resource_cleanup".into();
        cleanup.effect_profile = EffectProfile::ResourceCleanup;
        cleanup.executor_role = "sirinx_agent_runtime_resource_cleanup_executor".into();
        cleanup.effect_key = "resource_cleanup:GRANT-effect-preview-001".into();
        reseal(&mut cleanup);
        assert_eq!(
            preview_effect_authority_contract(&cleanup, NOW),
            Err(EffectAuthorityContractError::Approval(
                "connection_evidence_not_applicable"
            ))
        );

        let mut leading_hyphen = receipt();
        leading_hyphen.connection_evidence.connection_id = Some("-bad-connection".into());
        reseal(&mut leading_hyphen);
        assert_eq!(
            preview_effect_authority_contract(&leading_hyphen, NOW),
            Err(EffectAuthorityContractError::Approval(
                "connection_evidence_partial"
            ))
        );
    }

    #[test]
    fn line_cannot_be_relabelled_as_customer_messaging() {
        let mut value = receipt();
        value.circuit_name = "customer_messaging".into();
        value.effect_profile = EffectProfile::CustomerMessaging;
        value.executor_role = "sirinx_agent_runtime_customer_messaging_executor".into();
        value.effect_key = "customer_messaging:GRANT-effect-preview-001".into();
        value.target_ref = "target://line/destination-digest".into();
        value.connection_evidence.connection_id = Some("line-webhook-transport".into());
        reseal(&mut value);
        assert_eq!(
            preview_effect_authority_contract(&value, NOW),
            Err(EffectAuthorityContractError::Approval(
                "line_effect_profile_unbound"
            ))
        );

        value.target_ref = "target://customer-messaging/destination-digest".into();
        value.connection_evidence.connection_id = Some("future-customer-transport".into());
        reseal(&mut value);
        assert_eq!(
            preview_effect_authority_contract(&value, NOW),
            Err(EffectAuthorityContractError::Approval(
                "customer_messaging_connection_unbound"
            ))
        );
    }

    #[test]
    fn unknown_fields_and_legacy_lowercase_actions_fail_deserialization() {
        let value = serde_json::to_value(receipt()).unwrap();
        let mut unknown = value.clone();
        unknown
            .as_object_mut()
            .unwrap()
            .insert("executed".into(), serde_json::Value::Bool(true));
        assert!(serde_json::from_value::<ApprovalReceiptV2Plan>(unknown).is_err());

        let mut legacy = value;
        legacy["actionKind"] = serde_json::Value::String("provider_call".into());
        assert!(serde_json::from_value::<ApprovalReceiptV2Plan>(legacy).is_err());
    }

    #[test]
    fn module_source_has_no_effect_plane_imports_or_true_authority_flags() {
        let source = include_str!("effect_authority.rs")
            .split("#[cfg(test)]\nmod tests")
            .next()
            .expect("production source precedes tests");
        for forbidden in [
            "std::process",
            "std::net",
            "tokio",
            "sqlx",
            "reqwest",
            "fetch(",
            "Command::new",
            "TcpStream",
            "UdpSocket",
            "std::env",
            "std::fs",
            "approval_consumed: true",
            "authority_validated: true",
            "can_execute: true",
            "provider_called: true",
            "messages_sent: true",
            "command_executed: true",
        ] {
            assert!(
                !source.contains(forbidden),
                "forbidden source fragment: {forbidden}"
            );
        }
    }
}
