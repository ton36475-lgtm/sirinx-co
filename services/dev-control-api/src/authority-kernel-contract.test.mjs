import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const testRequire = createRequire(import.meta.url);
const Ajv2020 = testRequire("ajv/dist/2020");
const addFormats = testRequire("ajv-formats");

const ROOT = new URL("../../../", import.meta.url);
const REGISTRY_URL = new URL("config/agent-runtime/action-circuits.plan-only.v1.json", ROOT);
const REGISTRY_SCHEMA_URL = new URL("schemas/agent-runtime/action-circuit-registry.v1.schema.json", ROOT);
const APPROVAL_SCHEMA_URL = new URL("schemas/agent-runtime/approval-receipt.v2.schema.json", ROOT);
const PREVIEW_SCHEMA_URL = new URL("schemas/agent-runtime/effect-authority-preview.v1.schema.json", ROOT);
const RUST_SOURCE_URL = new URL("crates/sirinx-core/src/effect_authority.rs", ROOT);
const MANIFEST_DIGEST = "b2421996825817400d31f88757843225403ed2080541812c4db889e1ffe3cbb0";
const CONNECTION_PLAN_DIGEST = "51bb41ec38c1472c1ec0684cc6668591cebc3d58a05747d112d1917eecb046d1";
const APPROVAL_GOLDEN_DIGEST = "ae8572ec8efa464ca86e0231b5698cceea52bdc9f64d428ca8c0234003014e84";
const APPROVAL_DIGEST_DOMAIN = Buffer.from("sirinx:approval-receipt:v2-plan\0");
const APPROVAL_WIRE_VERSION = Buffer.from("sirinx:approval-receipt:v2-wire:1\0");
const hex = (character, length = 64) => character.repeat(length);
const clone = (value) => structuredClone(value);

function uint64(value) {
  const bytes = Buffer.alloc(8);
  bytes.writeBigUInt64BE(BigInt(value));
  return bytes;
}

function wireField(name, value) {
  const nameBytes = Buffer.from(name);
  const valueBytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return Buffer.concat([uint64(nameBytes.length), nameBytes, uint64(valueBytes.length), valueBytes]);
}

function optionalWireText(value) {
  return value === null
    ? Buffer.from([0])
    : Buffer.concat([Buffer.from([1]), Buffer.from(String(value))]);
}

function approvalContractBytes(approval) {
  const fields = [];
  const add = (name, value) => fields.push(wireField(name, value));
  for (const [name, value] of [
    ["schemaVersion", approval.schemaVersion],
    ["status", approval.status],
    ["manifestDigest", approval.manifestDigest],
    ["ticketId", approval.ticketId],
    ["ticketVersion", approval.ticketVersion],
    ["grantId", approval.grantId],
    ["grantVersion", approval.grantVersion],
    ["taskId", approval.taskId],
    ["taskDigest", approval.taskDigest],
    ["runId", approval.runId],
    ["runDigest", approval.runDigest],
    ["leaseId", approval.leaseId],
    ["leaseDigest", approval.leaseDigest],
    ["actionKind", approval.actionKind],
    ["actionClass", approval.actionClass],
    ["circuitName", approval.circuitName],
    ["effectProfile", approval.effectProfile],
    ["executorRole", approval.executorRole],
    ["effectState", approval.effectState],
    ["effectKey", approval.effectKey],
    ["targetRef", approval.targetRef],
    ["targetDigest", approval.targetDigest],
    ["payloadDigest", approval.payloadDigest],
    ["repositoryCommitSha", approval.repositoryCommitSha],
    ["planHash", approval.planHash],
    ["scopeHash", approval.scopeHash],
    ["actionDigest", approval.actionDigest],
    ["dataClass", approval.dataClass],
    ["limits.maxCalls", approval.limits.maxCalls],
    ["limits.maxCostMicrousd", approval.limits.maxCostMicrousd],
    ["limits.maxRuntimeSeconds", approval.limits.maxRuntimeSeconds],
    ["principals.requester", approval.principals.requester],
    ["principals.approver", approval.principals.approver],
    ["principals.maker", approval.principals.maker],
    ["principals.checker", approval.principals.checker],
    ["principals.executor", approval.principals.executor],
    ["principals.issuer", approval.principals.issuer],
    ["attestations.approverAttestationId", approval.attestations.approverAttestationId],
    ["attestations.approverAttestationDigest", approval.attestations.approverAttestationDigest],
    ["attestations.issuerAttestationId", approval.attestations.issuerAttestationId],
    ["attestations.issuerAttestationDigest", approval.attestations.issuerAttestationDigest],
    ["approverAssertionRef", approval.approverAssertionRef],
    ["nonceDigest", approval.nonceDigest],
    ["scope.schemaId", approval.scope.schemaId],
    ["scope.schemaVersion", approval.scope.schemaVersion],
    ["scope.scopeDigest", approval.scope.scopeDigest],
    ["scope.artifactRef", approval.scope.artifactRef]
  ]) add(name, value);
  for (const [name, value] of [
    ["connectionEvidence.connectionId", approval.connectionEvidence.connectionId],
    ["connectionEvidence.planDigest", approval.connectionEvidence.planDigest],
    ["connectionEvidence.evidenceDigest", approval.connectionEvidence.evidenceDigest],
    ["connectionEvidence.agentCardDigest", approval.connectionEvidence.agentCardDigest],
    ["connectionEvidence.endpointDigest", approval.connectionEvidence.endpointDigest],
    ["connectionEvidence.authenticationPolicyDigest", approval.connectionEvidence.authenticationPolicyDigest],
    ["connectionEvidence.toolPolicyDigest", approval.connectionEvidence.toolPolicyDigest],
    ["connectionEvidence.componentRevisionDigest", approval.connectionEvidence.componentRevisionDigest],
    ["connectionEvidence.licenseDigest", approval.connectionEvidence.licenseDigest],
    ["connectionEvidence.provenanceDigest", approval.connectionEvidence.provenanceDigest]
  ]) add(name, optionalWireText(value));
  add("issuedAtUnixMs", approval.issuedAtUnixMs);
  add("expiresAtUnixMs", approval.expiresAtUnixMs);
  add("consumedAtUnixMs", optionalWireText(approval.consumedAtUnixMs));
  return Buffer.concat([APPROVAL_WIRE_VERSION, ...fields]);
}

function approvalContractDigest(approval) {
  return createHash("sha256")
    .update(APPROVAL_DIGEST_DOMAIN)
    .update(approvalContractBytes(approval))
    .digest("hex");
}

function approvalSemanticParity(approval, candidateNowUnixMs) {
  const principals = Object.values(approval.principals);
  return new Set(principals).size === principals.length &&
    approval.effectKey === `${approval.circuitName}:${approval.grantId}` &&
    approval.issuedAtUnixMs > 0 &&
    approval.expiresAtUnixMs > approval.issuedAtUnixMs &&
    approval.expiresAtUnixMs - approval.issuedAtUnixMs <= 300_000 &&
    candidateNowUnixMs >= approval.issuedAtUnixMs &&
    candidateNowUnixMs < approval.expiresAtUnixMs &&
    approval.consumedAtUnixMs === null &&
    approval.contractDigest === approvalContractDigest(approval);
}

async function loadJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

async function validators() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const [registrySchema, approvalSchema, previewSchema] = await Promise.all([
    loadJson(REGISTRY_SCHEMA_URL),
    loadJson(APPROVAL_SCHEMA_URL),
    loadJson(PREVIEW_SCHEMA_URL)
  ]);
  return {
    registry: ajv.compile(registrySchema),
    approval: ajv.compile(approvalSchema),
    preview: ajv.compile(previewSchema)
  };
}

function approvalFixture() {
  const approval = {
    schemaVersion: "2.0",
    status: "ISSUED_STRUCTURAL_ONLY",
    manifestDigest: MANIFEST_DIGEST,
    ticketId: "TKT-effect-preview-001",
    ticketVersion: 1,
    grantId: "GRANT-effect-preview-001",
    grantVersion: 1,
    taskId: "TASK-effect-preview-001",
    taskDigest: hex("e"),
    runId: "RUN-effect-preview-001",
    runDigest: hex("f"),
    leaseId: "LEASE-effect-preview-001",
    leaseDigest: hex("1"),
    actionKind: "LIVE_SEND",
    actionClass: "D",
    circuitName: "telegram_send",
    effectProfile: "TELEGRAM",
    executorRole: "sirinx_agent_runtime_telegram_send_executor",
    effectState: "PREPARED",
    effectKey: "telegram_send:GRANT-effect-preview-001",
    targetRef: "target://telegram/fixed-destination-digest",
    targetDigest: hex("a"),
    payloadDigest: hex("b"),
    repositoryCommitSha: hex("c", 40),
    planHash: hex("d"),
    scopeHash: hex("e"),
    actionDigest: hex("f"),
    contractDigest: hex("0"),
    dataClass: "INTERNAL",
    limits: { maxCalls: 1, maxCostMicrousd: 0, maxRuntimeSeconds: 30 },
    principals: {
      requester: "principal:requester",
      approver: "principal:approver",
      maker: "principal:maker",
      checker: "principal:checker",
      executor: "principal:executor",
      issuer: "principal:issuer"
    },
    attestations: {
      approverAttestationId: "ATTEST-approver-001",
      approverAttestationDigest: hex("1"),
      issuerAttestationId: "ATTEST-issuer-001",
      issuerAttestationDigest: hex("2")
    },
    approverAssertionRef: "assertion://human/effect-preview-001",
    nonceDigest: hex("3"),
    scope: {
      schemaId: "https://sirinx.co/schemas/agent-runtime/live-send-scope.v2.schema.json",
      schemaVersion: "2.0",
      scopeDigest: hex("4"),
      artifactRef: "artifact://scope/live-send-effect-preview-001"
    },
    connectionEvidence: {
      connectionId: "telegram-bot-transport",
      planDigest: CONNECTION_PLAN_DIGEST,
      evidenceDigest: hex("6"),
      agentCardDigest: null,
      endpointDigest: hex("8"),
      authenticationPolicyDigest: hex("9"),
      toolPolicyDigest: hex("a"),
      componentRevisionDigest: hex("b"),
      licenseDigest: hex("c"),
      provenanceDigest: hex("d")
    },
    issuedAtUnixMs: 1795103970000,
    expiresAtUnixMs: 1795104030000,
    consumedAtUnixMs: null
  };
  approval.contractDigest = approvalContractDigest(approval);
  return approval;
}

function previewFixture(approval, manifestDigest) {
  return {
    schemaVersion: "1.0-plan",
    status: "CONTRACT_VALIDATED_NOT_AUTHORIZED",
    mode: "rust-pure-hold-only-preview",
    manifestDigest,
    contractDigest: approval.contractDigest,
    ticketId: approval.ticketId,
    grantId: approval.grantId,
    actionKind: approval.actionKind,
    circuitName: approval.circuitName,
    effectProfile: approval.effectProfile,
    effectState: "PREPARED",
    validation: {
      manifestDigestConsistent: true,
      actionCircuitBindingConsistent: true,
      approvalContractDigestConsistent: true,
      principalSeparationConsistent: true,
      connectionEvidenceShapeConsistent: true,
      candidateClockWindowConsistent: true,
      scopeArtifactValidated: false,
      attestationAuthorityValidated: false,
      clockAuthorityValidated: false
    },
    readOnly: true,
    authorityValidated: false,
    databaseAuthorityValidated: false,
    circuitOpen: false,
    grantActive: false,
    approvalConsumed: false,
    replayProtectionAvailable: false,
    effectClaimed: false,
    outboxPrepared: false,
    requestingPersisted: false,
    canPrepare: false,
    canClaim: false,
    canExecute: false,
    canConnect: false,
    canEmitA2a: false,
    canSend: false,
    canCallProvider: false,
    canMutate: false,
    canDeploy: false,
    ioPerformed: false,
    networkCalls: false,
    databaseWrites: false,
    externalWrites: false,
    messagesSent: false,
    providerCalled: false,
    commandExecuted: false,
    blockers: [
      "approval_is_structural_plan_only",
      "attestation_authority_unavailable",
      "candidate_clock_is_caller_supplied",
      "durable_authority_kernel_unavailable",
      "effect_circuit_hold",
      "migration_0007_deferred",
      "replay_ledger_unavailable",
      "scope_artifact_not_validated"
    ],
    stopPoint: "EFFECT AUTHORITY CONTRACT VALIDATED - NO AUTHORITY, CLAIM, EXECUTOR, OR EFFECT"
  };
}

describe("B10.0 authority-kernel schema and wire contract", () => {
  it("accepts the exact 13-row all-HOLD registry and matches the Rust review pin", async () => {
    const [validate, registry, source] = await Promise.all([
      validators(),
      loadJson(REGISTRY_URL),
      readFile(RUST_SOURCE_URL, "utf8")
    ]);
    expect(validate.registry(registry), validate.registry.errors?.map((error) => error.message).join("; ")).toBe(true);
    expect(registry.bindings).toHaveLength(13);
    expect(new Set(registry.bindings.map((binding) => binding.circuitName)).size).toBe(13);
    expect(registry.bindings.every((binding) =>
      binding.circuitState === "HOLD" &&
      binding.effectState === "PREPARED" &&
      binding.enabled === false &&
      binding.executorAvailable === false &&
      binding.routeRegistered === false
    )).toBe(true);
    expect(registry.unboundEffectProfiles).toEqual(["LINE"]);

    const digest = createHash("sha256")
      .update(Buffer.from("sirinx:effect-authority-manifest:v1\0"))
      .update(Buffer.from(JSON.stringify(registry)))
      .digest("hex");
    const pinned = source.match(/REVIEW_PINNED_MANIFEST_DIGEST: &str =\s*"([0-9a-f]{64})";/)?.[1];
    expect(pinned).toBe(digest);
  });

  it("rejects registry enablement, OPEN state, aliases, duplicates, and LINE fallback", async () => {
    const { registry: validate } = await validators();
    const registry = await loadJson(REGISTRY_URL);
    const mutations = [
      (value) => { value.bindings[0].enabled = true; },
      (value) => { value.bindings[0].circuitState = "OPEN"; },
      (value) => { value.bindings[0].effectState = "REQUESTING"; },
      (value) => { value.bindings[0].circuitName = "cloudflare_dns"; },
      (value) => { [value.bindings[0], value.bindings[1]] = [value.bindings[1], value.bindings[0]]; },
      (value) => { value.bindings.push(clone(value.bindings[0])); },
      (value) => { value.unboundEffectProfiles = []; }
    ];
    for (const mutate of mutations) {
      const candidate = clone(registry);
      mutate(candidate);
      expect(validate(candidate)).toBe(false);
    }
  });

  it("validates closed v2 structure and rejects cross-channel, legacy, partial, and open-state drift", async () => {
    const { approval: validate } = await validators();
    const approval = approvalFixture();
    expect(approval.contractDigest).toBe(APPROVAL_GOLDEN_DIGEST);
    expect(validate(approval), validate.errors?.map((error) => error.message).join("; ")).toBe(true);
    expect(approvalSemanticParity(approval, 1795104000000)).toBe(true);
    const mutations = [
      (value) => { value.circuitName = "customer_messaging"; },
      (value) => { value.effectProfile = "CUSTOMER_MESSAGING"; },
      (value) => { value.effectProfile = "LINE"; },
      (value) => {
        value.circuitName = "customer_messaging";
        value.effectProfile = "CUSTOMER_MESSAGING";
        value.executorRole = "sirinx_agent_runtime_customer_messaging_executor";
        value.targetRef = "target://line/destination-digest";
        value.connectionEvidence.connectionId = "line-webhook-transport";
      },
      (value) => { value.schemaVersion = "1.1"; },
      (value) => { value.schemaVersion = "2.0-plan"; },
      (value) => { value.manifestDigest = hex("9"); },
      (value) => { value.actionKind = "provider_call"; },
      (value) => { value.effectState = "REQUESTING"; },
      (value) => { value.consumedAtUnixMs = value.issuedAtUnixMs; },
      (value) => { value.connectionEvidence.provenanceDigest = null; },
      (value) => { value.connectionEvidence.planDigest = hex("9"); },
      (value) => { value.scope.schemaId = "https://sirinx.co/schemas/agent-runtime/other-scope.v2.schema.json"; },
      (value) => {
        for (const key of Object.keys(value.connectionEvidence)) value.connectionEvidence[key] = null;
      },
      (value) => { value.principals.unexpected = "principal:intruder"; },
      (value) => { value.rawNonce = "forbidden"; }
    ];
    for (const mutate of mutations) {
      const candidate = clone(approval);
      mutate(candidate);
      expect(validate(candidate)).toBe(false);
    }

    const semanticOnlyMutations = [
      (value) => { value.principals.checker = value.principals.maker; },
      (value) => { value.expiresAtUnixMs = value.issuedAtUnixMs - 1; },
      (value) => { value.expiresAtUnixMs = value.issuedAtUnixMs + 300_001; },
      (value) => { value.effectKey = "telegram_send:GRANT-different"; }
    ];
    for (const mutate of semanticOnlyMutations) {
      const candidate = clone(approval);
      mutate(candidate);
      candidate.contractDigest = approvalContractDigest(candidate);
      expect(validate(candidate), validate.errors?.map((error) => error.message).join("; ")).toBe(true);
      expect(approvalSemanticParity(candidate, 1795104000000)).toBe(false);
    }
  });

  it("allows only the fixed false-authority preview result", async () => {
    const { preview: validate } = await validators();
    const preview = previewFixture(approvalFixture(), MANIFEST_DIGEST);
    expect(validate(preview), validate.errors?.map((error) => error.message).join("; ")).toBe(true);
    const manifestDrift = clone(preview);
    manifestDrift.manifestDigest = hex("9");
    expect(validate(manifestDrift)).toBe(false);
    for (const key of [
      "authorityValidated", "databaseAuthorityValidated", "circuitOpen", "grantActive",
      "approvalConsumed", "replayProtectionAvailable", "effectClaimed", "outboxPrepared",
      "requestingPersisted", "canPrepare", "canClaim", "canExecute", "canConnect",
      "canEmitA2a", "canSend", "canCallProvider", "canMutate", "canDeploy", "ioPerformed",
      "networkCalls", "databaseWrites", "externalWrites", "messagesSent", "providerCalled",
      "commandExecuted"
    ]) {
      const candidate = clone(preview);
      candidate[key] = true;
      expect(validate(candidate), key).toBe(false);
    }
  });

  it("keeps the Rust production module free of effect-plane I/O surfaces", async () => {
    const source = (await readFile(RUST_SOURCE_URL, "utf8")).split("#[cfg(test)]\nmod tests")[0];
    for (const fragment of [
      "std::process", "std::net", "tokio", "sqlx", "reqwest", "fetch(",
      "Command::new", "TcpStream", "UdpSocket", "std::env", "std::fs"
    ]) {
      expect(source, fragment).not.toContain(fragment);
    }
  });
});
