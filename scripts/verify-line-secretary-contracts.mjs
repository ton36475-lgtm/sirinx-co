import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const CONTRACT_MISSION_ID =
  "GHOSTCLAW_LINE_SECRETARY_20260723_001_L1_CONTRACT_ONLY";

export const REQUIRED_PATHS = Object.freeze({
  "/api/line/webhook": ["post"],
  "/v1/secretary/captures": ["post"],
  "/v1/secretary/inbox": ["get"],
  "/v1/secretary/briefings/today": ["get"],
  "/v1/secretary/briefings/generate": ["post"],
  "/v1/tasks": ["post"],
  "/v1/tasks/{taskId}": ["patch"],
  "/v1/tasks/{taskId}/complete": ["post"],
  "/v1/appointments": ["post"],
  "/v1/appointments/{appointmentId}/confirm": ["post"],
  "/v1/appointments/{appointmentId}/cancel": ["post"],
  "/v1/ideas": ["post"],
  "/v1/expense-drafts": ["post"],
  "/v1/expense-drafts/{expenseDraftId}/confirm": ["post"],
  "/v1/leads": ["post"],
  "/v1/bookings": ["post"],
  "/v1/bookings/{bookingId}/confirm": ["post"],
  "/v1/line/messages/drafts": ["post"],
  "/v1/line/messages/{messageId}/approve": ["post"],
  "/v1/line/messages/{messageId}/send": ["post"],
  "/v1/line/quota": ["get"],
});

export const REQUIRED_EVENTS = Object.freeze([
  "line.webhook.received",
  "line.message.normalized",
  "media.content.downloaded",
  "audio.transcription.completed",
  "document.ocr.completed",
  "secretary.intent.classified",
  "task.draft.created",
  "appointment.awaiting_confirmation",
  "lead.created",
  "reply.draft.created",
  "approval.requested",
  "line.message.sent",
  "line.message.failed",
  "briefing.generated",
]);

export const CONTRACT_FILES = Object.freeze([
  "openapi/line-secretary.yaml",
  "asyncapi/line-secretary.yaml",
  "schemas/line-secretary/line-event.schema.json",
  "schemas/line-secretary/secretary-intent.schema.json",
  "schemas/line-secretary/outbound-message.schema.json",
]);

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);
const HIGH_RISK_SUFFIXES = ["/approve", "/confirm", "/send"];
const EXACT_APPROVAL_FIELDS = Object.freeze([
  "approvalReceiptId",
  "actionId",
  "actionType",
  "requesterId",
  "approverId",
  "target",
  "scope",
  "payloadDigest",
  "createdAt",
  "expiresAt",
  "nonce",
  "oneUse",
  "maxActions",
  "evidenceContractDigest",
]);
const LINE_MESSAGE_BINDING_FIELDS = Object.freeze([
  "messageId",
  "recipientAlias",
  "recipientHash",
  "messageDigest",
  "templateDigest",
  "idempotencyKey",
]);
const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "trace",
]);

const fail = (message) => {
  throw new Error(`LINE Secretary contract gate failed: ${message}`);
};

export function readJsonContract(root, relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) fail(`missing ${relativePath}`);

  try {
    return JSON.parse(readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`${relativePath} must use dependency-free JSON syntax: ${error.message}`);
  }
}

function parameterHeader(operation, headerName) {
  return (operation.parameters ?? []).find(
    (parameter) =>
      parameter?.in === "header" &&
      parameter?.name?.toLowerCase() === headerName.toLowerCase(),
  );
}

function validateOpenApi(openapi) {
  if (openapi.openapi !== "3.1.1") fail("OpenAPI version must be 3.1.1");
  if (openapi["x-sirinx-mission-id"] !== CONTRACT_MISSION_ID) {
    fail("OpenAPI mission id mismatch");
  }
  if (openapi["x-sirinx-contract-phase"] !== "L1_CONTRACT_ONLY") {
    fail("OpenAPI phase must be L1_CONTRACT_ONLY");
  }
  if (
    openapi["x-sirinx-persistence-status"] !==
    "PENDING_L2_DATABASE_DECISION"
  ) {
    fail("OpenAPI must keep persistence decision pending");
  }
  if (openapi["x-sirinx-external-effects"] !== "BLOCKED") {
    fail("OpenAPI external effects must remain blocked");
  }
  if (!openapi.components?.securitySchemes?.bearerAuth) {
    fail("OpenAPI bearerAuth security scheme is missing");
  }

  const operationIds = new Set();
  let operationCount = 0;
  for (const [path, methods] of Object.entries(REQUIRED_PATHS)) {
    const pathItem = openapi.paths?.[path];
    if (!pathItem) fail(`OpenAPI path missing: ${path}`);

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) fail(`OpenAPI operation missing: ${method.toUpperCase()} ${path}`);
      operationCount += 1;

      if (!operation.operationId) {
        fail(`operationId missing: ${method.toUpperCase()} ${path}`);
      }
      if (operationIds.has(operation.operationId)) {
        fail(`duplicate operationId: ${operation.operationId}`);
      }
      operationIds.add(operation.operationId);

      if (path.startsWith("/v1/") && !operation.security?.some((entry) => entry.bearerAuth)) {
        fail(`bearerAuth missing: ${method.toUpperCase()} ${path}`);
      }

      if (path.startsWith("/v1/") && MUTATING_METHODS.has(method)) {
        const idempotency = parameterHeader(operation, "Idempotency-Key");
        const requestId = parameterHeader(operation, "X-Request-ID");
        if (!idempotency?.required) {
          fail(`required Idempotency-Key missing: ${method.toUpperCase()} ${path}`);
        }
        if (!requestId?.required) {
          fail(`required X-Request-ID missing: ${method.toUpperCase()} ${path}`);
        }
      }

      if (
        method === "post" &&
        HIGH_RISK_SUFFIXES.some((suffix) => path.endsWith(suffix))
      ) {
        if (operation["x-sirinx-risk-tier"] !== "HUMAN_RED") {
          fail(`HUMAN_RED marker missing: ${method.toUpperCase()} ${path}`);
        }
        if (
          operation["x-sirinx-external-effect"] !==
          "BLOCKED_UNTIL_EXACT_APPROVAL"
        ) {
          fail(`external-effect block missing: ${method.toUpperCase()} ${path}`);
        }
        if (
          operation["x-sirinx-approval-validation"] !==
          "RECOMPUTE_RFC8785_JCS_DIGEST_AND_COMPARE"
        ) {
          fail(`canonical approval digest rule missing: ${method.toUpperCase()} ${path}`);
        }
        if (
          operation["x-sirinx-approval-target-binding"] !==
          "PATH_RESOURCE_ID_AND_OPERATION_ID_MUST_MATCH_GRANT"
        ) {
          fail(`approval target binding missing: ${method.toUpperCase()} ${path}`);
        }
        if (
          operation["x-sirinx-approval-replay-policy"] !==
          "REJECT_EXPIRED_OR_REUSED_NONCE"
        ) {
          fail(`approval replay policy missing: ${method.toUpperCase()} ${path}`);
        }
      }
    }
  }

  for (const [path, pathItem] of Object.entries(openapi.paths ?? {})) {
    for (const method of Object.keys(pathItem ?? {})) {
      if (HTTP_METHODS.has(method) && !REQUIRED_PATHS[path]?.includes(method)) {
        fail(`unapproved OpenAPI operation present: ${method.toUpperCase()} ${path}`);
      }
    }
  }

  const webhook = openapi.paths["/api/line/webhook"].post;
  const signature = parameterHeader(webhook, "x-line-signature");
  if (!signature?.required) fail("LINE webhook signature header must be required");
  if (webhook.security?.length) {
    fail("LINE webhook must use LINE signature auth, not bearer auth");
  }
  for (const status of ["202", "400", "401", "413", "429", "503"]) {
    if (!webhook.responses?.[status]) {
      fail(`LINE webhook response ${status} is missing`);
    }
  }
  if (webhook["x-sirinx-signature-policy"] !== "FAIL_CLOSED") {
    fail("LINE webhook signature policy must be FAIL_CLOSED");
  }
  if (webhook["x-sirinx-processing-mode"] !== "ASYNC_ENQUEUE_ONLY") {
    fail("LINE webhook processing mode must be ASYNC_ENQUEUE_ONLY");
  }

  const schemas = openapi.components.schemas;
  const exactApproval = schemas.ExactHumanApproval;
  for (const field of EXACT_APPROVAL_FIELDS) {
    if (!exactApproval?.required?.includes(field)) {
      fail(`ExactHumanApproval required field missing: ${field}`);
    }
  }
  if (exactApproval.properties?.oneUse?.const !== true) {
    fail("ExactHumanApproval oneUse must be true");
  }
  if (exactApproval.properties?.maxActions?.const !== 1) {
    fail("ExactHumanApproval maxActions must be exactly 1");
  }
  if (
    exactApproval.properties?.scope?.minItems !== 1 ||
    exactApproval.properties?.scope?.maxItems !== 1
  ) {
    fail("ExactHumanApproval scope must bind exactly one scope");
  }
  const approvalTuples = new Set(
    (exactApproval.oneOf ?? []).map((variant) => {
      const properties = variant.properties ?? {};
      return [
        properties.actionType?.const,
        properties.target?.properties?.operationId?.const,
        properties.target?.properties?.pathTemplate?.const,
        properties.target?.properties?.resourceType?.const,
        properties.scope?.items?.const,
      ].join("|");
    }),
  );
  for (const expectedTuple of [
    "APPOINTMENT_CONFIRM|confirmAppointment|/v1/appointments/{appointmentId}/confirm|APPOINTMENT|appointment:confirm",
    "EXPENSE_DRAFT_CONFIRM|confirmExpenseDraft|/v1/expense-drafts/{expenseDraftId}/confirm|EXPENSE_DRAFT|expense-draft:confirm",
    "BOOKING_CONFIRM|confirmBooking|/v1/bookings/{bookingId}/confirm|BOOKING|booking:confirm",
    "LINE_MESSAGE_APPROVE|approveLineMessage|/v1/line/messages/{messageId}/approve|LINE_MESSAGE|line-message:approve",
    "LINE_MESSAGE_SEND|sendLineMessage|/v1/line/messages/{messageId}/send|LINE_MESSAGE|line-message:send",
  ]) {
    if (!approvalTuples.has(expectedTuple)) {
      fail(`ExactHumanApproval tuple binding missing: ${expectedTuple}`);
    }
  }
  for (const field of LINE_MESSAGE_BINDING_FIELDS) {
    if (!schemas.LineMessageBinding?.required?.includes(field)) {
      fail(`LineMessageBinding required field missing: ${field}`);
    }
  }
  if (
    schemas.LineMessageBinding?.properties?.recipientAlias?.pattern !==
    "^alias:[a-z0-9][a-z0-9._-]{2,127}$"
  ) {
    fail("LineMessageBinding recipientAlias must reject raw LINE user IDs");
  }
  for (const schemaName of [
    "HumanRedActionRequest",
    "LineMessageApprovalRequest",
    "SendRequest",
  ]) {
    if (!schemas[schemaName]?.required?.includes("approval")) {
      fail(`${schemaName} must require an exact approval`);
    }
  }
  for (const schemaName of ["LineMessageApprovalRequest", "SendRequest"]) {
    if (!schemas[schemaName]?.required?.includes("messageBinding")) {
      fail(`${schemaName} must require the exact LINE message binding`);
    }
  }
  const expectedDigestSources = {
    HumanRedActionRequest: [
      "/expectedVersion",
      "/approval/actionType",
      "/approval/target",
      "/approval/scope",
    ],
    LineMessageApprovalRequest: [
      "/expectedVersion",
      "/approval/actionType",
      "/approval/target",
      "/approval/scope",
      "/messageBinding",
    ],
    SendRequest: [
      "/expectedVersion",
      "/approval/actionType",
      "/approval/target",
      "/approval/scope",
      "/messageBinding",
    ],
  };
  for (const [schemaName, expectedSources] of Object.entries(expectedDigestSources)) {
    const digestContract = schemas[schemaName]?.["x-sirinx-canonical-digest"];
    if (
      digestContract?.algorithm !== "RFC8785_JCS_SHA256" ||
      digestContract?.mustEqual !== "/approval/payloadDigest" ||
      JSON.stringify(digestContract.sourcePointers) !== JSON.stringify(expectedSources)
    ) {
      fail(`${schemaName} canonical digest source contract mismatch`);
    }
  }
  for (const [schemaName, actionType] of [
    ["LineMessageApprovalRequest", "LINE_MESSAGE_APPROVE"],
    ["SendRequest", "LINE_MESSAGE_SEND"],
  ]) {
    const constraint = schemas[schemaName]?.properties?.approval?.allOf?.[1];
    if (
      !constraint?.required?.includes("maxMessages") ||
      constraint?.properties?.maxMessages?.const !== 1 ||
      constraint?.properties?.actionType?.const !== actionType
    ) {
      fail(`${schemaName} must bind one message to ${actionType}`);
    }
  }
  const expectedHighRiskRequests = {
    confirmAppointment: "#/components/schemas/HumanRedActionRequest",
    confirmExpenseDraft: "#/components/schemas/HumanRedActionRequest",
    confirmBooking: "#/components/schemas/HumanRedActionRequest",
    approveLineMessage: "#/components/schemas/LineMessageApprovalRequest",
    sendLineMessage: "#/components/schemas/SendRequest",
  };
  for (const [operationId, expectedRef] of Object.entries(expectedHighRiskRequests)) {
    const operation = Object.values(openapi.paths)
      .flatMap((pathItem) => Object.values(pathItem))
      .find((candidate) => candidate?.operationId === operationId);
    if (
      operation?.requestBody?.content?.["application/json"]?.schema?.$ref !==
      expectedRef
    ) {
      fail(`${operationId} request is not bound to ${expectedRef}`);
    }
  }

  return { operationCount, operationIds: [...operationIds].sort() };
}

function validateAsyncApi(asyncapi) {
  if (asyncapi.asyncapi !== "3.0.0") fail("AsyncAPI version must be 3.0.0");
  if (asyncapi["x-sirinx-mission-id"] !== CONTRACT_MISSION_ID) {
    fail("AsyncAPI mission id mismatch");
  }
  if (asyncapi["x-sirinx-contract-phase"] !== "L1_CONTRACT_ONLY") {
    fail("AsyncAPI phase must be L1_CONTRACT_ONLY");
  }
  if (
    asyncapi["x-sirinx-persistence-status"] !==
    "PENDING_L2_DATABASE_DECISION"
  ) {
    fail("AsyncAPI must keep persistence decision pending");
  }
  if (asyncapi["x-sirinx-external-effects"] !== "BLOCKED") {
    fail("AsyncAPI external effects must remain blocked");
  }

  for (const eventName of REQUIRED_EVENTS) {
    const channel = asyncapi.channels?.[eventName];
    if (!channel) fail(`AsyncAPI channel missing: ${eventName}`);
    if (channel.address !== eventName) {
      fail(`AsyncAPI channel address mismatch: ${eventName}`);
    }
    if (!Object.keys(channel.messages ?? {}).length) {
      fail(`AsyncAPI channel has no message: ${eventName}`);
    }
  }

  const unapprovedChannels = Object.keys(asyncapi.channels ?? {}).filter(
    (channel) => !REQUIRED_EVENTS.includes(channel),
  );
  if (unapprovedChannels.length) {
    fail(`unapproved AsyncAPI channels: ${unapprovedChannels.join(", ")}`);
  }

  return { eventCount: REQUIRED_EVENTS.length };
}

function validateJsonSchemas(schemas) {
  const expectedDraft = "https://json-schema.org/draft/2020-12/schema";
  for (const [relativePath, schema] of schemas) {
    if (schema.$schema !== expectedDraft) {
      fail(`${relativePath} must use JSON Schema draft 2020-12`);
    }
    if (!schema.$id || !schema.title || schema.type !== "object") {
      fail(`${relativePath} is missing $id, title, or object type`);
    }
    if (schema.additionalProperties !== false) {
      fail(`${relativePath} must reject undeclared properties`);
    }
  }

  const lineEvent = schemas.find(([path]) =>
    path.endsWith("line-event.schema.json"),
  )?.[1];
  const secretaryIntent = schemas.find(([path]) =>
    path.endsWith("secretary-intent.schema.json"),
  )?.[1];
  const outboundMessage = schemas.find(([path]) =>
    path.endsWith("outbound-message.schema.json"),
  )?.[1];

  for (const field of [
    "webhookEventId",
    "eventType",
    "rawEventDigest",
    "occurredAt",
    "receivedAt",
    "source",
  ]) {
    if (!lineEvent.required?.includes(field)) {
      fail(`line-event schema required field missing: ${field}`);
    }
  }
  for (const field of [
    "intentId",
    "intent",
    "confidence",
    "riskClass",
    "requiresConfirmation",
  ]) {
    if (!secretaryIntent.required?.includes(field)) {
      fail(`secretary-intent schema required field missing: ${field}`);
    }
  }
  for (const field of [
    "messageId",
    "recipientAlias",
    "recipientHash",
    "messageDigest",
    "status",
    "sendPolicy",
  ]) {
    if (!outboundMessage.required?.includes(field)) {
      fail(`outbound-message schema required field missing: ${field}`);
    }
  }

  const outboundStatuses = outboundMessage.properties?.status?.enum ?? [];
  for (const status of [
    "DRAFT",
    "WAITING_APPROVAL",
    "APPROVED",
    "SEND_REQUESTED",
    "SENT",
    "FAILED",
    "CANCELLED",
  ]) {
    if (!outboundStatuses.includes(status)) {
      fail(`outbound-message status missing: ${status}`);
    }
  }
  const approvalGrant = outboundMessage.$defs?.exactApprovalGrant;
  for (const field of [
    ...EXACT_APPROVAL_FIELDS,
    "maxMessages",
    "messageBinding",
  ]) {
    if (!approvalGrant?.required?.includes(field)) {
      fail(`outbound exact approval required field missing: ${field}`);
    }
  }
  for (const field of LINE_MESSAGE_BINDING_FIELDS) {
    if (!approvalGrant.properties?.messageBinding?.required?.includes(field)) {
      fail(`outbound approval message binding missing: ${field}`);
    }
  }
  if (
    approvalGrant.properties?.oneUse?.const !== true ||
    approvalGrant.properties?.maxActions?.const !== 1 ||
    approvalGrant.properties?.maxMessages?.const !== 1
  ) {
    fail("outbound approval must be one-use and bounded to one action/message");
  }
  const equalityPairs = new Set(
    (outboundMessage["x-sirinx-equality-constraints"] ?? []).map(
      ({ left, right }) => `${left}=${right}`,
    ),
  );
  for (const field of LINE_MESSAGE_BINDING_FIELDS) {
    const rootField =
      field === "messageId" ? "messageId" : field;
    const expected =
      `/approval/messageBinding/${field}=/${rootField}`;
    if (!equalityPairs.has(expected)) {
      fail(`outbound approval equality constraint missing: ${field}`);
    }
  }
  if (
    outboundMessage["x-sirinx-canonical-digest"]?.algorithm !==
      "RFC8785_JCS_SHA256" ||
    outboundMessage["x-sirinx-canonical-digest"]?.mustEqual !==
      "/approval/payloadDigest"
  ) {
    fail("outbound canonical approval digest contract is missing");
  }

  return { schemaCount: schemas.length };
}

function resolveJsonPointer(document, fragment, referenceLabel) {
  if (!fragment) return document;
  if (!fragment.startsWith("/")) {
    fail(`unsupported JSON Pointer in ${referenceLabel}`);
  }

  let current = document;
  for (const encodedToken of fragment.slice(1).split("/")) {
    const token = decodeURIComponent(encodedToken)
      .replaceAll("~1", "/")
      .replaceAll("~0", "~");
    if (
      !current ||
      typeof current !== "object" ||
      !Object.prototype.hasOwnProperty.call(current, token)
    ) {
      fail(`unresolved JSON Pointer in ${referenceLabel}`);
    }
    current = current[token];
  }
  return current;
}

function validateReferences(root, relativePath, document) {
  const normalizedRoot = resolve(root);
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;

    if (typeof value.$ref === "string") {
      const [filePart, fragment = ""] = value.$ref.split("#", 2);
      if (!filePart) {
        resolveJsonPointer(document, fragment, `${relativePath}: ${value.$ref}`);
      } else {
        if (isAbsolute(filePart) || /^[a-z][a-z0-9+.-]*:/i.test(filePart)) {
          fail(`${relativePath} has non-local reference: ${value.$ref}`);
        }
        const referencedPath = resolve(
          dirname(join(normalizedRoot, relativePath)),
          filePart,
        );
        if (
          referencedPath !== normalizedRoot &&
          !referencedPath.startsWith(`${normalizedRoot}/`)
        ) {
          fail(`${relativePath} reference escapes repository root: ${value.$ref}`);
        }
        if (!existsSync(referencedPath)) {
          fail(`${relativePath} has unresolved reference: ${value.$ref}`);
        }
        let referencedDocument;
        try {
          referencedDocument = JSON.parse(readFileSync(referencedPath, "utf8"));
        } catch (error) {
          fail(
            `${relativePath} references non-JSON contract ${value.$ref}: ${error.message}`,
          );
        }
        resolveJsonPointer(
          referencedDocument,
          fragment,
          `${relativePath}: ${value.$ref}`,
        );
      }
    }
    Object.values(value).forEach(visit);
  };
  visit(document);
}

function validateNoSecrets(root, files) {
  const patterns = [
    /sk-[A-Za-z0-9_-]{20,}/,
    /xox[baprs]-[A-Za-z0-9-]{20,}/,
    /(?:LINE_CHANNEL_ACCESS_TOKEN|LINE_CHANNEL_SECRET)\s*[=:]\s*["']?[A-Za-z0-9+/_=-]{20,}/,
    /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/,
  ];

  for (const relativePath of files) {
    const content = readFileSync(join(root, relativePath), "utf8");
    for (const pattern of patterns) {
      if (pattern.test(content)) fail(`possible secret value in ${relativePath}`);
    }
  }
}

export function verifyLineSecretaryContracts(root = process.cwd()) {
  const packageJson = readJsonContract(root, "package.json");
  if (
    packageJson.scripts?.["verify:line-secretary-contracts"] !==
    "node --test tests/line-secretary-contracts.test.mjs"
  ) {
    fail("package.json verifier script mismatch");
  }

  const openapi = readJsonContract(root, "openapi/line-secretary.yaml");
  const asyncapi = readJsonContract(root, "asyncapi/line-secretary.yaml");
  const schemaPaths = CONTRACT_FILES.filter((path) => path.endsWith(".json"));
  const schemas = schemaPaths.map((path) => [path, readJsonContract(root, path)]);

  for (const [relativePath, document] of [
    ["openapi/line-secretary.yaml", openapi],
    ["asyncapi/line-secretary.yaml", asyncapi],
    ...schemas,
  ]) {
    validateReferences(root, relativePath, document);
  }

  const openapiSummary = validateOpenApi(openapi);
  const asyncapiSummary = validateAsyncApi(asyncapi);
  const schemaSummary = validateJsonSchemas(schemas);
  validateNoSecrets(root, [
    ...CONTRACT_FILES,
    "scripts/verify-line-secretary-contracts.mjs",
    "tests/line-secretary-contracts.test.mjs",
  ]);

  return {
    missionId: CONTRACT_MISSION_ID,
    status: "CONTRACT_OK",
    persistenceStatus: "PENDING_L2_DATABASE_DECISION",
    externalEffects: "BLOCKED",
    operationCount: openapiSummary.operationCount,
    eventCount: asyncapiSummary.eventCount,
    schemaCount: schemaSummary.schemaCount,
  };
}

const entrypoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (entrypoint === import.meta.url) {
  try {
    const summary = verifyLineSecretaryContracts();
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
