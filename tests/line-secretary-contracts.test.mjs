import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTRACT_FILES,
  CONTRACT_MISSION_ID,
  REQUIRED_EVENTS,
  REQUIRED_PATHS,
  readJsonContract,
  verifyLineSecretaryContracts,
} from "../scripts/verify-line-secretary-contracts.mjs";

const root = process.cwd();

test("LINE Secretary L1 contract bundle passes the fail-closed gate", () => {
  const summary = verifyLineSecretaryContracts(root);

  assert.deepEqual(summary, {
    missionId: CONTRACT_MISSION_ID,
    status: "CONTRACT_OK",
    persistenceStatus: "PENDING_L2_DATABASE_DECISION",
    externalEffects: "BLOCKED",
    operationCount: Object.values(REQUIRED_PATHS).flat().length,
    eventCount: REQUIRED_EVENTS.length,
    schemaCount: CONTRACT_FILES.filter((path) => path.endsWith(".json")).length,
  });
});

test("OpenAPI freezes the exact approved surface and mandatory signature policy", () => {
  const openapi = readJsonContract(root, "openapi/line-secretary.yaml");

  assert.equal(openapi.openapi, "3.1.1");
  assert.deepEqual(Object.keys(openapi.paths).sort(), Object.keys(REQUIRED_PATHS).sort());
  assert.equal(
    openapi.paths["/api/line/webhook"].post["x-sirinx-signature-policy"],
    "FAIL_CLOSED",
  );
  assert.equal(
    openapi.paths["/api/line/webhook"].post["x-sirinx-processing-mode"],
    "ASYNC_ENQUEUE_ONLY",
  );
});

test("AsyncAPI declares exactly the approved event vocabulary", () => {
  const asyncapi = readJsonContract(root, "asyncapi/line-secretary.yaml");

  assert.equal(asyncapi.asyncapi, "3.0.0");
  assert.deepEqual(Object.keys(asyncapi.channels).sort(), [...REQUIRED_EVENTS].sort());
});

test("outbound contract is alias/hash scoped and approval bounded", () => {
  const outbound = readJsonContract(
    root,
    "schemas/line-secretary/outbound-message.schema.json",
  );

  assert.ok(outbound.required.includes("recipientAlias"));
  assert.ok(outbound.required.includes("recipientHash"));
  assert.ok(outbound.required.includes("messageDigest"));
  assert.ok(outbound.required.includes("templateDigest"));
  assert.ok(outbound.required.includes("idempotencyKey"));
  assert.ok(outbound.required.includes("sendPolicy"));
  assert.equal(outbound.properties.sendPolicy.properties.oneUse.const, true);
  assert.equal(outbound.properties.sendPolicy.properties.maxMessages.maximum, 1);
  assert.equal(
    outbound.properties.sendPolicy.properties.externalEffect.const,
    "BLOCKED_UNTIL_EXACT_APPROVAL",
  );
  assert.equal("recipientId" in outbound.properties, false);
  assert.equal("channelAccessToken" in outbound.properties, false);
});

test("HUMAN_RED approval is target, digest, expiry, nonce, and message bound", () => {
  const openapi = readJsonContract(root, "openapi/line-secretary.yaml");
  const approval = openapi.components.schemas.ExactHumanApproval;
  const outbound = readJsonContract(
    root,
    "schemas/line-secretary/outbound-message.schema.json",
  );
  const outboundGrant = outbound.$defs.exactApprovalGrant;

  for (const field of [
    "actionId",
    "requesterId",
    "approverId",
    "target",
    "scope",
    "payloadDigest",
    "expiresAt",
    "nonce",
    "evidenceContractDigest",
  ]) {
    assert.ok(approval.required.includes(field));
    assert.ok(outboundGrant.required.includes(field));
  }
  assert.equal(approval.properties.oneUse.const, true);
  assert.equal(approval.properties.maxActions.const, 1);
  assert.equal(approval.oneOf.length, 5);
  assert.equal(
    openapi.components.schemas.LineMessageBinding.properties.recipientAlias.pattern,
    "^alias:[a-z0-9][a-z0-9._-]{2,127}$",
  );
  assert.equal(
    new RegExp(
      openapi.components.schemas.LineMessageBinding.properties.recipientAlias.pattern,
    ).test("U0123456789abcdef0123456789abcdef"),
    false,
  );
  assert.ok(
    openapi.components.schemas.HumanRedActionRequest[
      "x-sirinx-canonical-digest"
    ].sourcePointers.includes("/expectedVersion"),
  );
  assert.equal(outboundGrant.properties.maxMessages.const, 1);
  assert.deepEqual(
    outboundGrant.properties.messageBinding.required,
    [
      "messageId",
      "recipientAlias",
      "recipientHash",
      "messageDigest",
      "templateDigest",
      "idempotencyKey",
    ],
  );
  assert.equal(
    outbound["x-sirinx-canonical-digest"].algorithm,
    "RFC8785_JCS_SHA256",
  );
  assert.equal(
    outbound["x-sirinx-canonical-digest"].mustEqual,
    "/approval/payloadDigest",
  );
});

test("intent contract distinguishes confirmation and human-red risk", () => {
  const intent = readJsonContract(
    root,
    "schemas/line-secretary/secretary-intent.schema.json",
  );

  assert.deepEqual(intent.properties.riskClass.enum, [
    "AUTO_GREEN",
    "AUTO_AMBER",
    "HUMAN_RED",
  ]);
  assert.equal(intent.properties.requiresConfirmation.type, "boolean");
});
