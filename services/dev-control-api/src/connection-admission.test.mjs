import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import {
  connectionBindingDigest,
  connectionEvidenceDigest,
  previewConnectionAdmission,
  validateConnectionEvidenceV1
} from "./connection-admission.mjs";
import { MCP_CONNECTION_PLAN_URL } from "./mcp-connection-plan.mjs";

const fixedNow = new Date("2026-07-20T16:00:00.000Z");
const testRequire = createRequire(import.meta.url);
const hex = (character, length = 64) => character.repeat(length);
const clone = (value) => structuredClone(value);

async function rawPlan() {
  return JSON.parse(await readFile(MCP_CONNECTION_PLAN_URL, "utf8"));
}

function unsigned(value, key) {
  return Object.fromEntries(Object.entries(value).filter(([name]) => name !== key));
}

function sealEvidence(evidence) {
  evidence.peer.identityDigest = connectionBindingDigest(
    "sirinx:connection-peer:v1",
    unsigned(evidence.peer, "identityDigest")
  );
  evidence.component.identityDigest = connectionBindingDigest(
    "sirinx:connection-component:v1",
    unsigned(evidence.component, "identityDigest")
  );
  evidence.protocol.digest = connectionBindingDigest(
    "sirinx:connection-protocol:v1",
    unsigned(evidence.protocol, "digest")
  );
  evidence.capabilities.digest = connectionBindingDigest(
    "sirinx:connection-capabilities:v1",
    unsigned(evidence.capabilities, "digest")
  );
  evidence.dataClassCeiling.digest = connectionBindingDigest(
    "sirinx:connection-data-ceiling:v1",
    unsigned(evidence.dataClassCeiling, "digest")
  );
  evidence.collector.identityDigest = connectionBindingDigest(
    "sirinx:connection-collector:v1",
    unsigned(evidence.collector, "identityDigest")
  );
  if (evidence.agentCard) {
    evidence.agentCard.peerId = evidence.peer.peerId;
    evidence.agentCard.endpointOrigin = evidence.endpointOrigin;
    evidence.agentCard.protocolDigest = evidence.protocol.digest;
    evidence.agentCard.capabilityDigest = evidence.capabilities.digest;
    evidence.agentCard.dataClassCeilingDigest = evidence.dataClassCeiling.digest;
    evidence.agentCard.cardDigest = connectionBindingDigest(
      "sirinx:connection-agent-card:v1",
      unsigned(evidence.agentCard, "cardDigest")
    );
  }
  evidence.evidenceDigest = connectionEvidenceDigest(evidence);
  return evidence;
}

function candidateContextFrom(evidence) {
  return {
    agentCardDigest: evidence.agentCard?.cardDigest || null,
    artifactDigest: evidence.component.artifactDigest,
    capabilityDigest: evidence.capabilities.digest,
    collectorAttestationDigest: evidence.collector.attestationDigest,
    collectorBinaryDigest: evidence.collector.binaryDigest,
    collectorId: evidence.collector.collectorId,
    collectorIdentityDigest: evidence.collector.identityDigest,
    collectorPrincipalId: evidence.collector.principalId,
    collectorRevision: evidence.collector.revision,
    componentIdentityDigest: evidence.component.identityDigest,
    componentName: evidence.component.name,
    componentVersion: evidence.component.version,
    dataClassCeilingDigest: evidence.dataClassCeiling.digest,
    leaseDigest: evidence.bindings.leaseDigest,
    leaseId: evidence.bindings.leaseId,
    licenseDigest: evidence.component.licenseDigest,
    peerId: evidence.peer.peerId,
    peerIdentityDigest: evidence.peer.identityDigest,
    principalId: evidence.peer.principalId,
    protocolDigest: evidence.protocol.digest,
    provenanceDigest: evidence.component.provenanceDigest,
    receiptDigest: evidence.bindings.receiptDigest,
    receiptId: evidence.bindings.receiptId,
    runDigest: evidence.bindings.runDigest,
    runId: evidence.bindings.runId,
    sourceRevision: evidence.component.sourceRevision,
    spdxLicenseExpression: evidence.component.spdxLicenseExpression,
    taskDigest: evidence.bindings.taskDigest,
    taskId: evidence.bindings.taskId
  };
}

async function validFixture() {
  const plan = await rawPlan();
  const connection = plan.connections.find((item) => item.connectionId === "cloudflare-docs-mcp");
  const evidence = {
    schemaVersion: "1.0",
    status: "COLLECTED_NOT_ADMITTED",
    evidenceId: "CEV-cloudflare-docs-001",
    connectionId: connection.connectionId,
    transport: connection.transport,
    peer: {
      peerId: "cloudflare-docs-mcp",
      principalId: "principal:cloudflare-docs-mcp",
      role: connection.role,
      identityDigest: hex("0")
    },
    component: {
      name: "cloudflare-docs-mcp",
      version: "1.2.3",
      sourceRevision: hex("a", 40),
      artifactDigest: hex("b"),
      spdxLicenseExpression: "Apache-2.0",
      licenseDigest: hex("c"),
      provenanceDigest: hex("d"),
      identityDigest: hex("0")
    },
    endpointOrigin: new URL(connection.endpoint).origin,
    agentCard: null,
    protocol: { name: "MCP", version: "2025-06-18", digest: hex("0") },
    capabilities: { declared: [...connection.capabilities], digest: hex("0") },
    dataClassCeiling: { value: connection.dataClassCeiling, digest: hex("0") },
    collector: {
      collectorId: "COLLECTOR-local-readonly-001",
      principalId: "principal:collector:local-readonly",
      revision: hex("e", 40),
      binaryDigest: hex("1"),
      attestationDigest: hex("2"),
      identityDigest: hex("0")
    },
    observedAt: "2026-07-20T15:59:00.000Z",
    expiresAt: "2026-07-20T16:03:00.000Z",
    bindings: {
      planDigest: connectionBindingDigest("sirinx:mcp-connection-plan:v1", plan),
      taskId: "TASK-connection-preview-001",
      taskDigest: hex("3"),
      runId: "RUN-connection-preview-001",
      runDigest: hex("4"),
      leaseId: "LEASE-connection-preview-001",
      leaseDigest: hex("5"),
      receiptId: "RECEIPT-connection-preview-001",
      receiptDigest: hex("6")
    },
    evidenceDigest: hex("0")
  };
  sealEvidence(evidence);
  return { plan, evidence, candidateContext: candidateContextFrom(evidence) };
}

async function schemaA2aEvidence() {
  const { evidence } = await validFixture();
  evidence.connectionId = "codex-a2a-peer";
  evidence.transport = "a2a-https";
  evidence.peer.peerId = "codex-a2a-peer";
  evidence.peer.principalId = "principal:codex-a2a";
  evidence.peer.role = "A2A_PEER";
  evidence.endpointOrigin = "https://codex.example.test";
  evidence.protocol = { name: "A2A", version: "1.0.0", digest: hex("a") };
  evidence.agentCard = {
    peerId: "codex-a2a-peer",
    endpointOrigin: "https://codex.example.test",
    protocolDigest: hex("a"),
    capabilityDigest: evidence.capabilities.digest,
    dataClassCeilingDigest: evidence.dataClassCeiling.digest,
    cardDigest: hex("b")
  };
  return evidence;
}

async function strictSchemaValidators() {
  const Ajv2020 = testRequire("ajv/dist/2020.js").default;
  const formatsModule = testRequire("ajv-formats");
  const addFormats = formatsModule.default ?? formatsModule;
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
  addFormats(ajv);
  const [evidenceSchema, previewSchema] = await Promise.all([
    readFile(new URL("../../../schemas/agent-runtime/connection-evidence.v1.schema.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../../../schemas/agent-runtime/connection-admission-preview.v1.schema.json", import.meta.url), "utf8").then(JSON.parse)
  ]);
  return {
    evidence: ajv.compile(evidenceSchema),
    preview: ajv.compile(previewSchema)
  };
}

describe("Connection Evidence Admission Preview", () => {
  it("validates a closed evidence packet but unconditionally refuses admission and effects", async () => {
    const fixture = await validFixture();
    const preview = previewConnectionAdmission(fixture, fixedNow);

    expect(preview).toMatchObject({
      status: "EVIDENCE_VALIDATED_NOT_ADMITTED",
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
      commandExecuted: false
    });
    expect(preview.validation.candidateContextAuthorityValidated).toBe(false);
    expect(preview.validation.clockAuthorityValidated).toBe(false);
    expect(preview.blockers).toContain("candidate_context_is_caller_supplied");
  });

  it("strictly compiles and validates both Draft 2020-12 schemas", async () => {
    const fixture = await validFixture();
    const preview = previewConnectionAdmission(fixture, fixedNow);
    const validators = await strictSchemaValidators();

    expect(validators.evidence(fixture.evidence), validators.evidence.errors?.map((error) => error.message).join("; ")).toBe(true);
    expect(validators.preview(preview), validators.preview.errors?.map((error) => error.message).join("; ")).toBe(true);
    expect(validators.evidence({ ...fixture.evidence, handshakeVerified: true })).toBe(false);
    expect(validators.preview({ ...preview, enabled: true })).toBe(false);
    expect(validators.preview({ ...preview, unknown: true })).toBe(false);
  });

  it("rejects unknown fields in every nested evidence object", async () => {
    const fixture = await validFixture();
    const validators = await strictSchemaValidators();
    const mutations = [
      (evidence) => { evidence.unknown = true; },
      (evidence) => { evidence.peer.unknown = true; },
      (evidence) => { evidence.component.unknown = true; },
      (evidence) => { evidence.protocol.unknown = true; },
      (evidence) => { evidence.capabilities.unknown = true; },
      (evidence) => { evidence.dataClassCeiling.unknown = true; },
      (evidence) => { evidence.collector.unknown = true; },
      (evidence) => { evidence.bindings.unknown = true; }
    ];

    for (const mutate of mutations) {
      const evidence = clone(fixture.evidence);
      mutate(evidence);
      expect(validators.evidence(evidence)).toBe(false);
    }

    const a2a = await schemaA2aEvidence();
    a2a.agentCard.unknown = true;
    expect(validators.evidence(a2a)).toBe(false);
  });

  it("rejects every preview authority/effect flag flip and nested validation drift", async () => {
    const fixture = await validFixture();
    const preview = previewConnectionAdmission(fixture, fixedNow);
    const validators = await strictSchemaValidators();
    const falseFields = Object.keys(preview).filter((key) => preview[key] === false);

    expect(falseFields.length).toBeGreaterThanOrEqual(25);
    for (const field of falseFields) {
      expect(validators.preview({ ...preview, [field]: true }), field).toBe(false);
    }
    expect(validators.preview({ ...preview, readOnly: false })).toBe(false);

    for (const [field, value] of Object.entries(preview.validation)) {
      const changed = { ...preview, validation: { ...preview.validation, [field]: !value } };
      expect(validators.preview(changed), field).toBe(false);
    }
    expect(validators.preview({
      ...preview,
      validation: { ...preview.validation, unknown: true }
    })).toBe(false);
    expect(validators.preview({ ...preview, blockers: [...preview.blockers].reverse() })).toBe(false);
    expect(validators.preview({ ...preview, blockers: [...preview.blockers.slice(0, -1), "forged"] })).toBe(false);
  });

  it("enforces stdio endpoint and A2A AgentCard schema conditionals", async () => {
    const fixture = await validFixture();
    const validators = await strictSchemaValidators();

    const stdioWithNull = clone(fixture.evidence);
    stdioWithNull.transport = "stdio";
    stdioWithNull.endpointOrigin = null;
    expect(validators.evidence(stdioWithNull), validators.evidence.errors?.map((error) => error.message).join("; ")).toBe(true);

    const stdioWithEndpoint = clone(fixture.evidence);
    stdioWithEndpoint.transport = "stdio";
    expect(validators.evidence(stdioWithEndpoint)).toBe(false);

    const validA2a = await schemaA2aEvidence();
    expect(validators.evidence(validA2a), validators.evidence.errors?.map((error) => error.message).join("; ")).toBe(true);

    const a2aWithoutCard = clone(validA2a);
    a2aWithoutCard.agentCard = null;
    expect(validators.evidence(a2aWithoutCard)).toBe(false);

    const nonA2aWithCard = clone(fixture.evidence);
    nonA2aWithCard.agentCard = (await schemaA2aEvidence()).agentCard;
    expect(validators.evidence(nonA2aWithCard)).toBe(false);
  });

  it.each([
    ["unknown evidence field", async (fixture) => { fixture.evidence.handshakeVerified = true; }],
    ["unknown candidate-context field", async (fixture) => { fixture.candidateContext.authorityValidated = true; }],
    ["cross-peer replay", async (fixture) => { fixture.evidence.peer.peerId = "different-peer"; sealEvidence(fixture.evidence); }],
    ["cross-principal replay", async (fixture) => { fixture.evidence.peer.principalId = "principal:different"; sealEvidence(fixture.evidence); }],
    ["component revision drift", async (fixture) => { fixture.evidence.component.sourceRevision = hex("f", 40); sealEvidence(fixture.evidence); }],
    ["license drift", async (fixture) => { fixture.evidence.component.licenseDigest = hex("7"); sealEvidence(fixture.evidence); }],
    ["provenance drift", async (fixture) => { fixture.evidence.component.provenanceDigest = hex("8"); sealEvidence(fixture.evidence); }],
    ["endpoint drift", async (fixture) => { fixture.evidence.endpointOrigin = "https://different.example.test"; sealEvidence(fixture.evidence); }],
    ["private endpoint literal", async (fixture) => { fixture.evidence.endpointOrigin = "https://127.0.0.1"; sealEvidence(fixture.evidence); }],
    ["metadata endpoint literal", async (fixture) => { fixture.evidence.endpointOrigin = "https://169.254.169.254"; sealEvidence(fixture.evidence); }],
    ["IPv4-mapped IPv6 endpoint", async (fixture) => { fixture.evidence.endpointOrigin = "https://[::ffff:127.0.0.1]"; sealEvidence(fixture.evidence); }],
    ["trailing-dot localhost endpoint", async (fixture) => { fixture.evidence.endpointOrigin = "https://localhost."; sealEvidence(fixture.evidence); }],
    ["endpoint query", async (fixture) => { fixture.evidence.endpointOrigin = "https://docs.mcp.cloudflare.com?ready=true"; sealEvidence(fixture.evidence); }],
    ["oversized endpoint origin", async (fixture) => { fixture.evidence.endpointOrigin = `https://${"a".repeat(2050)}.test`; sealEvidence(fixture.evidence); }],
    ["malformed protocol version", async (fixture) => { fixture.evidence.protocol.version = "latest"; sealEvidence(fixture.evidence); }],
    ["oversized protocol version", async (fixture) => { fixture.evidence.protocol.version = `1.0.0+${"a".repeat(128)}`; sealEvidence(fixture.evidence); }],
    ["oversized component version", async (fixture) => { fixture.evidence.component.version = `1.0.0+${"a".repeat(128)}`; sealEvidence(fixture.evidence); }],
    ["malformed SPDX expression", async (fixture) => { fixture.evidence.component.spdxLicenseExpression = "Apache-2.0 OR @custom"; sealEvidence(fixture.evidence); }],
    ["capability escalation", async (fixture) => { fixture.evidence.capabilities.declared.push("admin"); sealEvidence(fixture.evidence); }],
    ["data ceiling escalation", async (fixture) => { fixture.evidence.dataClassCeiling.value = "RESTRICTED"; sealEvidence(fixture.evidence); }],
    ["cross-task replay", async (fixture) => { fixture.evidence.bindings.taskId = "TASK-other"; sealEvidence(fixture.evidence); }],
    ["cross-run replay", async (fixture) => { fixture.evidence.bindings.runId = "RUN-other"; sealEvidence(fixture.evidence); }],
    ["cross-lease replay", async (fixture) => { fixture.evidence.bindings.leaseId = "LEASE-other"; sealEvidence(fixture.evidence); }],
    ["cross-receipt replay", async (fixture) => { fixture.evidence.bindings.receiptId = "RECEIPT-other"; sealEvidence(fixture.evidence); }],
    ["plan digest drift", async (fixture) => { fixture.evidence.bindings.planDigest = hex("9"); sealEvidence(fixture.evidence); }],
    ["evidence digest tamper", async (fixture) => { fixture.evidence.evidenceDigest = hex("9"); }]
  ])("rejects %s", async (_label, mutate) => {
    const fixture = await validFixture();
    await mutate(fixture);
    expect(() => previewConnectionAdmission(fixture, fixedNow)).toThrow(/invalid_connection_evidence|invalid_mcp_connection_plan/);
  });

  it.each([
    ["stale evidence", (fixture) => { fixture.evidence.observedAt = "2026-07-20T15:50:00.000Z"; }, /evidence_stale/],
    ["future evidence", (fixture) => { fixture.evidence.observedAt = "2026-07-20T16:00:00.001Z"; }, /observed_at_in_future/],
    ["expired evidence", (fixture) => { fixture.evidence.expiresAt = "2026-07-20T15:59:30.000Z"; }, /evidence_expired/],
    ["impossible calendar date", (fixture) => { fixture.evidence.observedAt = "2026-02-30T15:59:00.000Z"; }, /observed_at/]
  ])("rejects %s after resealing with the specific temporal error", async (_label, mutate, error) => {
    const fixture = await validFixture();
    mutate(fixture);
    sealEvidence(fixture.evidence);
    expect(() => previewConnectionAdmission(fixture, fixedNow)).toThrow(error);
  });

  it("rejects a resealed raw readiness status with the specific status error", async () => {
    const fixture = await validFixture();
    fixture.evidence.status = "ADMITTED";
    sealEvidence(fixture.evidence);

    expect(() => previewConnectionAdmission(fixture, fixedNow)).toThrow(/invalid_connection_evidence:status/);
  });

  it("binds an A2A agent card to peer, endpoint, protocol, capability, and ceiling digests", async () => {
    const fixture = await validFixture();
    const connection = fixture.plan.connections.find((item) => item.connectionId === "codex-a2a-peer");
    connection.endpoint = "https://codex.example.test/a2a";
    const evidence = fixture.evidence;
    evidence.connectionId = connection.connectionId;
    evidence.transport = connection.transport;
    evidence.peer.peerId = "codex-a2a-peer";
    evidence.peer.principalId = "principal:codex-a2a";
    evidence.peer.role = connection.role;
    evidence.endpointOrigin = "https://codex.example.test";
    evidence.protocol = { name: "A2A", version: "1.0.0", digest: hex("0") };
    evidence.capabilities = { declared: [...connection.capabilities], digest: hex("0") };
    evidence.dataClassCeiling = { value: connection.dataClassCeiling, digest: hex("0") };
    evidence.agentCard = {
      peerId: evidence.peer.peerId,
      endpointOrigin: evidence.endpointOrigin,
      protocolDigest: hex("0"),
      capabilityDigest: hex("0"),
      dataClassCeilingDigest: hex("0"),
      cardDigest: hex("0")
    };
    evidence.bindings.planDigest = connectionBindingDigest("sirinx:mcp-connection-plan:v1", fixture.plan);
    sealEvidence(evidence);
    fixture.candidateContext = candidateContextFrom(evidence);

    expect(validateConnectionEvidenceV1(evidence, fixture.candidateContext, fixedNow)).toBe(evidence);
    expect(() => previewConnectionAdmission(fixture, fixedNow))
      .toThrow(/plan_authority_digest_mismatch/);

    const forged = clone(fixture);
    forged.evidence.agentCard.capabilityDigest = hex("f");
    forged.evidence.evidenceDigest = connectionEvidenceDigest(forged.evidence);
    expect(() => validateConnectionEvidenceV1(forged.evidence, forged.candidateContext, fixedNow))
      .toThrow(/agent_card_capability_mismatch|agent_card_digest_mismatch/);
  });

  it("rejects a caller-forged but internally self-consistent connection plan", async () => {
    const fixture = await validFixture();
    const connection = fixture.plan.connections.find((item) => item.connectionId === fixture.evidence.connectionId);
    connection.endpoint = "https://forged.example.test/mcp";
    fixture.evidence.endpointOrigin = "https://forged.example.test";
    fixture.evidence.bindings.planDigest = connectionBindingDigest("sirinx:mcp-connection-plan:v1", fixture.plan);
    sealEvidence(fixture.evidence);
    fixture.candidateContext = candidateContextFrom(fixture.evidence);

    expect(() => previewConnectionAdmission(fixture, fixedNow))
      .toThrow(/plan_authority_digest_mismatch/);
  });

  it("leaves every canonical null-endpoint remote/transport/A2A entry ineligible for evidence preview", async () => {
    const plan = await rawPlan();
    const missingEndpoint = plan.connections.filter(
      (connection) => connection.endpoint === null && !["stdio", "none"].includes(connection.transport)
    );

    expect(missingEndpoint).toHaveLength(11);
    expect(missingEndpoint.every((connection) => connection.enabled === false)).toBe(true);
  });

  it("does not contain I/O, process, environment, routing, provider, database, or messaging primitives", async () => {
    const source = await readFile(new URL("./connection-admission.mjs", import.meta.url), "utf8");
    for (const forbidden of [
      "node:fs", "node:net", "process.env", "fetch(", "node:child_process", "spawn(", "exec(",
      "DATABASE_URL", "registerRoute", "providerCall", "sendMessage", "telegram.send"
    ]) expect(source).not.toContain(forbidden);
    expect(source).not.toContain("omniroute-handshake-evidence-ready");
  });

  it("validates evidence independently without turning it into authority", async () => {
    const fixture = await validFixture();
    expect(validateConnectionEvidenceV1(fixture.evidence, fixture.candidateContext, fixedNow)).toBe(fixture.evidence);
  });

  it("rejects a caller-supplied clock callback without invoking it", async () => {
    const fixture = await validFixture();
    let invoked = false;

    expect(() => previewConnectionAdmission(fixture, () => { invoked = true; return fixedNow; }))
      .toThrow(/now_input_must_be_date_or_iso_string/);
    expect(invoked).toBe(false);
  });
});
