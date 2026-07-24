import { createHash } from "node:crypto";
import { validateMcpConnectionPlan } from "./mcp-connection-plan.mjs";

export const CONNECTION_EVIDENCE_VERSION = "1.0";
export const CONNECTION_ADMISSION_PREVIEW_VERSION = "1.0";
export const CONNECTION_EVIDENCE_MAX_AGE_MS = 5 * 60 * 1000;
export const CONNECTION_EVIDENCE_MAX_LIFETIME_MS = 5 * 60 * 1000;
export const CONNECTION_EVIDENCE_MAX_FUTURE_SKEW_MS = 0;
// Review-pinned digest of the closed v1 plan. A config change must update this
// constant and its evidence in the same reviewed slice; caller-supplied plans
// cannot become their own authority.
export const MCP_CONNECTION_PLAN_V1_DIGEST = "51bb41ec38c1472c1ec0684cc6668591cebc3d58a05747d112d1917eecb046d1";

const DIGEST = /^[0-9a-f]{64}$/;
const REVISION = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const CONNECTION_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;
const EVIDENCE_ID = /^CEV-[A-Za-z0-9._-]+$/;
const PEER_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;
const COLLECTOR_ID = /^COLLECTOR-[A-Za-z0-9._-]+$/;
const TASK_ID = /^TASK-[A-Za-z0-9._-]+$/;
const RUN_ID = /^RUN-[A-Za-z0-9._-]+$/;
const LEASE_ID = /^LEASE-[A-Za-z0-9._-]+$/;
const RECEIPT_ID = /^RECEIPT-[A-Za-z0-9._-]+$/;
const SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/;
const PROTOCOL_VERSION = /^(?:[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?|[0-9]{4}-[0-9]{2}-[0-9]{2})$/;
const SPDX_EXPRESSION = /^[A-Za-z0-9][A-Za-z0-9 .()+-]{0,255}$/;
const RFC3339 = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;

const EVIDENCE_KEYS = [
  "agentCard", "bindings", "capabilities", "collector", "component",
  "connectionId", "dataClassCeiling", "endpointOrigin", "evidenceDigest",
  "evidenceId", "expiresAt", "observedAt", "peer", "protocol",
  "schemaVersion", "status", "transport"
];
const PEER_KEYS = ["identityDigest", "peerId", "principalId", "role"];
const COMPONENT_KEYS = [
  "artifactDigest", "identityDigest", "licenseDigest", "name",
  "provenanceDigest", "sourceRevision", "spdxLicenseExpression", "version"
];
const AGENT_CARD_KEYS = [
  "capabilityDigest", "cardDigest", "dataClassCeilingDigest", "endpointOrigin",
  "peerId", "protocolDigest"
];
const PROTOCOL_KEYS = ["digest", "name", "version"];
const CAPABILITY_KEYS = ["declared", "digest"];
const DATA_CEILING_KEYS = ["digest", "value"];
const COLLECTOR_KEYS = [
  "attestationDigest", "binaryDigest", "collectorId", "identityDigest",
  "principalId", "revision"
];
const BINDING_KEYS = [
  "leaseDigest", "leaseId", "planDigest", "receiptDigest", "receiptId",
  "runDigest", "runId", "taskDigest", "taskId"
];
const CANDIDATE_CONTEXT_KEYS = [
  "agentCardDigest", "artifactDigest", "capabilityDigest", "collectorAttestationDigest",
  "collectorBinaryDigest", "collectorId", "collectorIdentityDigest",
  "collectorPrincipalId", "collectorRevision", "componentIdentityDigest",
  "componentName", "componentVersion", "dataClassCeilingDigest", "leaseDigest",
  "leaseId", "licenseDigest", "peerId", "peerIdentityDigest", "principalId",
  "protocolDigest", "provenanceDigest", "receiptDigest", "receiptId", "runDigest",
  "runId", "sourceRevision", "spdxLicenseExpression", "taskDigest", "taskId"
];

const ROLE_PROTOCOL = Object.freeze({
  REMOTE_MCP_SERVER: "MCP",
  MCP_PORTAL: "MCP",
  MCP_CLIENT: "MCP",
  LOCAL_MCP_SERVER: "MCP",
  MESSAGING_TRANSPORT: null,
  A2A_PEER: "A2A"
});

function fail(code) {
  throw new Error(`invalid_connection_evidence:${code}`);
}

function record(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}_must_be_object`);
}

function exactKeys(value, expected, label) {
  record(value, label);
  const actual = Object.keys(value).sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail(`${label}_must_be_closed`);
  }
}

function text(value, label, max = 256) {
  if (typeof value !== "string" || value.trim() === "" || value.length > max) fail(label);
}

function pattern(value, regex, label) {
  if (typeof value !== "string" || !regex.test(value)) fail(label);
}

function digest(value, label) {
  pattern(value, DIGEST, label);
}

function equal(actual, expected, label) {
  if (actual !== expected) fail(label);
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function connectionBindingDigest(domain, value) {
  text(domain, "digest_domain", 128);
  return createHash("sha256").update(domain).update("\0").update(canonical(value)).digest("hex");
}

export function connectionEvidenceDigest(evidence) {
  record(evidence, "evidence");
  const { evidenceDigest: _ignored, ...unsigned } = evidence;
  return connectionBindingDigest("sirinx:connection-evidence:v1", unsigned);
}

function partDigest(domain, value, omittedKey) {
  const unsigned = Object.fromEntries(Object.entries(value).filter(([key]) => key !== omittedKey));
  return connectionBindingDigest(domain, unsigned);
}

function parseTimestamp(value, label) {
  pattern(value, RFC3339, label);
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) {
    fail(label);
  }
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) fail(label);
  return milliseconds;
}

function currentMilliseconds(nowInput) {
  if (nowInput !== undefined && !(nowInput instanceof Date) && typeof nowInput !== "string") {
    fail("now_input_must_be_date_or_iso_string");
  }
  const value = nowInput || new Date();
  const milliseconds = value instanceof Date ? value.getTime() : Date.parse(String(value));
  if (!Number.isFinite(milliseconds)) fail("now_invalid");
  return milliseconds;
}

function blockedIpv4(host) {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168);
}

function validateEndpointOrigin(value, transport) {
  if (["stdio", "none"].includes(transport)) {
    if (value !== null) fail("endpoint_must_be_null_for_local_transport");
    return;
  }
  if (value === null) fail("endpoint_origin_required");
  if (typeof value !== "string" || value.length > 2048) fail("endpoint_origin_invalid");
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail("endpoint_origin_invalid");
  }
  if (parsed.protocol !== "https:") fail("endpoint_origin_https_required");
  if (parsed.username || parsed.password) fail("endpoint_origin_userinfo_forbidden");
  if (parsed.search || parsed.hash || parsed.pathname !== "/") fail("endpoint_origin_not_canonical");
  if (value !== parsed.origin) fail("endpoint_origin_not_canonical");
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost")) fail("endpoint_origin_localhost_forbidden");
  // Reject every literal IPv6 origin in this preview. This is intentionally
  // stricter than the minimum private/link-local rule and closes mapped-IPv4
  // and alternate textual representations without DNS or network helpers.
  if (hostname.includes(":")) fail("endpoint_origin_ipv6_literal_unsupported");
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) && blockedIpv4(hostname)) {
    fail("endpoint_origin_private_literal_forbidden");
  }
}

function validateCandidateContext(candidateContext) {
  exactKeys(candidateContext, CANDIDATE_CONTEXT_KEYS, "candidate_context");
  for (const key of [
    "artifactDigest", "capabilityDigest", "collectorAttestationDigest", "collectorBinaryDigest",
    "collectorIdentityDigest", "componentIdentityDigest", "dataClassCeilingDigest", "leaseDigest",
    "licenseDigest", "peerIdentityDigest", "protocolDigest", "provenanceDigest", "receiptDigest",
    "runDigest", "taskDigest"
  ]) digest(candidateContext[key], `candidate_context_${key}`);
  if (candidateContext.agentCardDigest !== null) digest(candidateContext.agentCardDigest, "candidate_context_agentCardDigest");
  pattern(candidateContext.peerId, PEER_ID, "candidate_context_peerId");
  text(candidateContext.principalId, "candidate_context_principalId");
  text(candidateContext.componentName, "candidate_context_componentName", 128);
  pattern(candidateContext.componentVersion, SEMVER, "candidate_context_componentVersion");
  pattern(candidateContext.sourceRevision, REVISION, "candidate_context_sourceRevision");
  pattern(candidateContext.spdxLicenseExpression, SPDX_EXPRESSION, "candidate_context_spdxLicenseExpression");
  pattern(candidateContext.collectorId, COLLECTOR_ID, "candidate_context_collectorId");
  text(candidateContext.collectorPrincipalId, "candidate_context_collectorPrincipalId");
  pattern(candidateContext.collectorRevision, REVISION, "candidate_context_collectorRevision");
  pattern(candidateContext.taskId, TASK_ID, "candidate_context_taskId");
  pattern(candidateContext.runId, RUN_ID, "candidate_context_runId");
  pattern(candidateContext.leaseId, LEASE_ID, "candidate_context_leaseId");
  pattern(candidateContext.receiptId, RECEIPT_ID, "candidate_context_receiptId");
}

function validateStructure(evidence) {
  exactKeys(evidence, EVIDENCE_KEYS, "evidence");
  equal(evidence.schemaVersion, CONNECTION_EVIDENCE_VERSION, "schema_version");
  equal(evidence.status, "COLLECTED_NOT_ADMITTED", "status");
  pattern(evidence.evidenceId, EVIDENCE_ID, "evidence_id");
  pattern(evidence.connectionId, CONNECTION_ID, "connection_id");
  if (!["streamable-http", "cloud-connector", "stdio", "telegram-bot-api", "line-webhook", "a2a-https", "none"].includes(evidence.transport)) fail("transport");

  exactKeys(evidence.peer, PEER_KEYS, "peer");
  pattern(evidence.peer.peerId, PEER_ID, "peer_id");
  text(evidence.peer.principalId, "principal_id");
  if (!Object.hasOwn(ROLE_PROTOCOL, evidence.peer.role)) fail("peer_role");
  digest(evidence.peer.identityDigest, "peer_identity_digest");

  exactKeys(evidence.component, COMPONENT_KEYS, "component");
  text(evidence.component.name, "component_name", 128);
  text(evidence.component.version, "component_version", 128);
  pattern(evidence.component.version, SEMVER, "component_version");
  pattern(evidence.component.sourceRevision, REVISION, "component_revision");
  pattern(evidence.component.spdxLicenseExpression, SPDX_EXPRESSION, "component_spdx_license");
  for (const key of ["artifactDigest", "licenseDigest", "provenanceDigest", "identityDigest"]) {
    digest(evidence.component[key], `component_${key}`);
  }

  exactKeys(evidence.protocol, PROTOCOL_KEYS, "protocol");
  if (!["MCP", "A2A", "TELEGRAM_BOT_API", "LINE_MESSAGING_API"].includes(evidence.protocol.name)) fail("protocol_name");
  text(evidence.protocol.version, "protocol_version", 128);
  pattern(evidence.protocol.version, PROTOCOL_VERSION, "protocol_version");
  digest(evidence.protocol.digest, "protocol_digest");

  exactKeys(evidence.capabilities, CAPABILITY_KEYS, "capabilities");
  if (!Array.isArray(evidence.capabilities.declared) || evidence.capabilities.declared.length > 256 ||
    evidence.capabilities.declared.some((item) => typeof item !== "string" || item.trim() === "" || item.length > 128) ||
    new Set(evidence.capabilities.declared).size !== evidence.capabilities.declared.length) fail("capabilities_declared");
  digest(evidence.capabilities.digest, "capabilities_digest");

  exactKeys(evidence.dataClassCeiling, DATA_CEILING_KEYS, "data_class_ceiling");
  if (!["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"].includes(evidence.dataClassCeiling.value)) fail("data_class_ceiling_value");
  digest(evidence.dataClassCeiling.digest, "data_class_ceiling_digest");

  exactKeys(evidence.collector, COLLECTOR_KEYS, "collector");
  pattern(evidence.collector.collectorId, COLLECTOR_ID, "collector_id");
  text(evidence.collector.principalId, "collector_principal_id");
  pattern(evidence.collector.revision, REVISION, "collector_revision");
  for (const key of ["binaryDigest", "attestationDigest", "identityDigest"]) digest(evidence.collector[key], `collector_${key}`);

  exactKeys(evidence.bindings, BINDING_KEYS, "bindings");
  pattern(evidence.bindings.taskId, TASK_ID, "task_id");
  pattern(evidence.bindings.runId, RUN_ID, "run_id");
  pattern(evidence.bindings.leaseId, LEASE_ID, "lease_id");
  pattern(evidence.bindings.receiptId, RECEIPT_ID, "receipt_id");
  for (const key of ["planDigest", "taskDigest", "runDigest", "leaseDigest", "receiptDigest"]) digest(evidence.bindings[key], `bindings_${key}`);
  digest(evidence.evidenceDigest, "evidence_digest");

  if (evidence.agentCard !== null) {
    exactKeys(evidence.agentCard, AGENT_CARD_KEYS, "agent_card");
    pattern(evidence.agentCard.peerId, PEER_ID, "agent_card_peer_id");
    for (const key of ["protocolDigest", "capabilityDigest", "dataClassCeilingDigest", "cardDigest"]) digest(evidence.agentCard[key], `agent_card_${key}`);
  }
}

function validateSelfBindings(evidence) {
  equal(evidence.peer.identityDigest, partDigest("sirinx:connection-peer:v1", evidence.peer, "identityDigest"), "peer_identity_digest_mismatch");
  equal(evidence.component.identityDigest, partDigest("sirinx:connection-component:v1", evidence.component, "identityDigest"), "component_identity_digest_mismatch");
  equal(evidence.protocol.digest, partDigest("sirinx:connection-protocol:v1", evidence.protocol, "digest"), "protocol_digest_mismatch");
  equal(evidence.capabilities.digest, partDigest("sirinx:connection-capabilities:v1", evidence.capabilities, "digest"), "capability_digest_mismatch");
  equal(evidence.dataClassCeiling.digest, partDigest("sirinx:connection-data-ceiling:v1", evidence.dataClassCeiling, "digest"), "data_class_ceiling_digest_mismatch");
  equal(evidence.collector.identityDigest, partDigest("sirinx:connection-collector:v1", evidence.collector, "identityDigest"), "collector_identity_digest_mismatch");
  equal(evidence.evidenceDigest, connectionEvidenceDigest(evidence), "evidence_digest_mismatch");
  if (evidence.agentCard !== null) {
    equal(evidence.agentCard.cardDigest, partDigest("sirinx:connection-agent-card:v1", evidence.agentCard, "cardDigest"), "agent_card_digest_mismatch");
    equal(evidence.agentCard.peerId, evidence.peer.peerId, "agent_card_peer_mismatch");
    equal(evidence.agentCard.endpointOrigin, evidence.endpointOrigin, "agent_card_endpoint_mismatch");
    equal(evidence.agentCard.protocolDigest, evidence.protocol.digest, "agent_card_protocol_mismatch");
    equal(evidence.agentCard.capabilityDigest, evidence.capabilities.digest, "agent_card_capability_mismatch");
    equal(evidence.agentCard.dataClassCeilingDigest, evidence.dataClassCeiling.digest, "agent_card_data_ceiling_mismatch");
  }
}

function validateCandidateBindings(evidence, candidateContext) {
  const pairs = [
    [evidence.peer.peerId, candidateContext.peerId, "peer_mismatch"],
    [evidence.peer.principalId, candidateContext.principalId, "principal_mismatch"],
    [evidence.peer.identityDigest, candidateContext.peerIdentityDigest, "peer_identity_candidate_mismatch"],
    [evidence.component.name, candidateContext.componentName, "component_name_mismatch"],
    [evidence.component.version, candidateContext.componentVersion, "component_version_mismatch"],
    [evidence.component.sourceRevision, candidateContext.sourceRevision, "component_revision_mismatch"],
    [evidence.component.artifactDigest, candidateContext.artifactDigest, "component_artifact_mismatch"],
    [evidence.component.spdxLicenseExpression, candidateContext.spdxLicenseExpression, "component_license_expression_mismatch"],
    [evidence.component.licenseDigest, candidateContext.licenseDigest, "component_license_digest_mismatch"],
    [evidence.component.provenanceDigest, candidateContext.provenanceDigest, "component_provenance_mismatch"],
    [evidence.component.identityDigest, candidateContext.componentIdentityDigest, "component_identity_candidate_mismatch"],
    [evidence.protocol.digest, candidateContext.protocolDigest, "protocol_candidate_mismatch"],
    [evidence.capabilities.digest, candidateContext.capabilityDigest, "capability_candidate_mismatch"],
    [evidence.dataClassCeiling.digest, candidateContext.dataClassCeilingDigest, "data_ceiling_candidate_mismatch"],
    [evidence.collector.collectorId, candidateContext.collectorId, "collector_id_mismatch"],
    [evidence.collector.principalId, candidateContext.collectorPrincipalId, "collector_principal_mismatch"],
    [evidence.collector.revision, candidateContext.collectorRevision, "collector_revision_mismatch"],
    [evidence.collector.binaryDigest, candidateContext.collectorBinaryDigest, "collector_binary_mismatch"],
    [evidence.collector.attestationDigest, candidateContext.collectorAttestationDigest, "collector_attestation_mismatch"],
    [evidence.collector.identityDigest, candidateContext.collectorIdentityDigest, "collector_identity_candidate_mismatch"],
    [evidence.bindings.taskId, candidateContext.taskId, "task_id_mismatch"],
    [evidence.bindings.taskDigest, candidateContext.taskDigest, "task_digest_mismatch"],
    [evidence.bindings.runId, candidateContext.runId, "run_id_mismatch"],
    [evidence.bindings.runDigest, candidateContext.runDigest, "run_digest_mismatch"],
    [evidence.bindings.leaseId, candidateContext.leaseId, "lease_id_mismatch"],
    [evidence.bindings.leaseDigest, candidateContext.leaseDigest, "lease_digest_mismatch"],
    [evidence.bindings.receiptId, candidateContext.receiptId, "receipt_id_mismatch"],
    [evidence.bindings.receiptDigest, candidateContext.receiptDigest, "receipt_digest_mismatch"]
  ];
  for (const [actual, wanted, label] of pairs) equal(actual, wanted, label);
  equal(evidence.agentCard?.cardDigest || null, candidateContext.agentCardDigest, "agent_card_candidate_mismatch");
}

function validatePlanBindings(plan, evidence) {
  validateMcpConnectionPlan(plan);
  const planDigest = connectionBindingDigest("sirinx:mcp-connection-plan:v1", plan);
  equal(planDigest, MCP_CONNECTION_PLAN_V1_DIGEST, "plan_authority_digest_mismatch");
  equal(evidence.bindings.planDigest, planDigest, "plan_digest_mismatch");
  const connection = plan.connections.find((item) => item.connectionId === evidence.connectionId);
  if (!connection) fail("connection_not_in_plan");
  equal(evidence.peer.peerId, connection.connectionId, "connection_peer_id_mismatch");
  equal(evidence.peer.role, connection.role, "connection_role_mismatch");
  equal(evidence.transport, connection.transport, "connection_transport_mismatch");
  const expectedOrigin = connection.endpoint === null ? null : new URL(connection.endpoint).origin;
  equal(evidence.endpointOrigin, expectedOrigin, "connection_endpoint_mismatch");
  if (canonical(evidence.capabilities.declared) !== canonical(connection.capabilities)) fail("connection_capabilities_mismatch");
  equal(evidence.dataClassCeiling.value, connection.dataClassCeiling, "connection_data_ceiling_mismatch");
  const expectedProtocol = ROLE_PROTOCOL[connection.role];
  if (expectedProtocol !== null) equal(evidence.protocol.name, expectedProtocol, "connection_protocol_mismatch");
  if (connection.role === "MESSAGING_TRANSPORT") {
    const protocol = connection.transport === "telegram-bot-api" ? "TELEGRAM_BOT_API" : "LINE_MESSAGING_API";
    equal(evidence.protocol.name, protocol, "connection_protocol_mismatch");
  }
  if (connection.role === "A2A_PEER" && evidence.agentCard === null) fail("a2a_agent_card_required");
  if (connection.role !== "A2A_PEER" && evidence.agentCard !== null) fail("agent_card_forbidden_for_role");
  return planDigest;
}

function validateFreshness(evidence, nowInput) {
  const now = currentMilliseconds(nowInput);
  const observedAt = parseTimestamp(evidence.observedAt, "observed_at");
  const expiresAt = parseTimestamp(evidence.expiresAt, "expires_at");
  if (observedAt > now + CONNECTION_EVIDENCE_MAX_FUTURE_SKEW_MS) fail("observed_at_in_future");
  if (now - observedAt > CONNECTION_EVIDENCE_MAX_AGE_MS) fail("evidence_stale");
  if (expiresAt <= now) fail("evidence_expired");
  if (expiresAt <= observedAt || expiresAt - observedAt > CONNECTION_EVIDENCE_MAX_LIFETIME_MS) fail("evidence_lifetime_invalid");
}

export function validateConnectionEvidenceV1(evidence, candidateContext, nowInput) {
  validateCandidateContext(candidateContext);
  validateStructure(evidence);
  validateEndpointOrigin(evidence.endpointOrigin, evidence.transport);
  if (evidence.agentCard !== null) validateEndpointOrigin(evidence.agentCard.endpointOrigin, evidence.transport);
  validateFreshness(evidence, nowInput);
  validateSelfBindings(evidence);
  validateCandidateBindings(evidence, candidateContext);
  return evidence;
}

export function previewConnectionAdmission(input, nowInput) {
  exactKeys(input, ["candidateContext", "evidence", "plan"], "preview_input");
  const planDigest = validatePlanBindings(input.plan, input.evidence);
  validateConnectionEvidenceV1(input.evidence, input.candidateContext, nowInput);
  const evidence = input.evidence;
  return {
    schemaVersion: CONNECTION_ADMISSION_PREVIEW_VERSION,
    status: "EVIDENCE_VALIDATED_NOT_ADMITTED",
    mode: "local-pure-preview",
    connectionId: evidence.connectionId,
    evidenceId: evidence.evidenceId,
    planDigest,
    evidenceDigest: evidence.evidenceDigest,
    observedAt: evidence.observedAt,
    expiresAt: evidence.expiresAt,
    validation: {
      planDigestConsistent: true,
      evidenceDigestConsistent: true,
      endpointBindingConsistent: true,
      capabilityDigestConsistent: true,
      candidateRuntimeBindingsConsistent: true,
      candidateContextAuthorityValidated: false,
      clockAuthorityValidated: false
    },
    readOnly: true,
    ioPerformed: false,
    admitted: false,
    enabled: false,
    endpointVerified: false,
    agentCardTrusted: false,
    handshakeReady: false,
    authenticationValidated: false,
    capabilityAuthorityValidated: false,
    canConnect: false,
    canRunMcp: false,
    canEmitA2a: false,
    canSendMessages: false,
    authorityValidated: false,
    durableAdmission: false,
    replayProtectionAvailable: false,
    evidenceUniquenessValidated: false,
    networkCalls: false,
    processStarted: false,
    environmentRead: false,
    secretsRead: false,
    databaseWrites: false,
    externalWrites: false,
    messagesSent: false,
    routesRegistered: false,
    commandExecuted: false,
    blockers: [
      "candidate_context_is_caller_supplied",
      "clock_authority_not_attested",
      "connection_authority_unavailable",
      "dns_resolution_and_origin_auth_unverified",
      "durable_connection_admission_unavailable",
      "effect_circuits_unavailable",
      "network_and_message_io_disabled",
      "replay_ledger_unavailable"
    ],
    stopPoint: "CONNECTION EVIDENCE VALIDATED - NO CONNECTION, MCP, A2A, OR MESSAGE AUTHORITY"
  };
}
