import assert from "node:assert/strict";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

import {
  B10InventoryError,
  EXPECTED_A27_DOMAIN_DIGEST,
  EXPECTED_INVENTORY_SCHEMA_SHA256,
  EXPECTED_INVENTORY_SHA256,
  EXPECTED_REFUSAL_FIXTURE_SHA256,
  EXPECTED_REFUSAL_SCHEMA_SHA256,
  INVENTORY_PATH,
  INVENTORY_SCHEMA_PATH,
  assertIndependentScopeCoverage,
  computeA27DomainDigest,
  parseJsonRejectDuplicateKeys,
  readCanonicalFile,
  sha256,
  validateCanonicalB10Inventory,
  validateInventoryShape,
  validateRefusalContract,
  verifyPinnedSources,
} from "./validate-b10-compatibility-surfaces.mjs";

const REFUSAL_FIXTURE_PATH = "config/agent-runtime/durable-authority-unavailable.v1.json";
const REFUSAL_SCHEMA_PATH = "schemas/agent-runtime/durable-authority-unavailable.v1.schema.json";
const A27_PATH = "config/agent-runtime/action-circuits.plan-only.v1.json";

function readJson(path) {
  return JSON.parse(readCanonicalFile(path).toString("utf8"));
}

function cloneInventory() {
  return structuredClone(readJson(INVENTORY_PATH));
}

function expectInventoryRejected(mutator, pattern) {
  const manifest = cloneInventory();
  mutator(manifest);
  assert.throws(() => validateInventoryShape(manifest), pattern);
}

const inventorySchema = readJson(INVENTORY_SCHEMA_PATH);
const refusalSchema = readJson(REFUSAL_SCHEMA_PATH);
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateInventorySchema = ajv.compile(inventorySchema);
const validateRefusalSchema = ajv.compile(refusalSchema);

test("canonical inventory proves only static accounting and keeps every effect claim false", () => {
  const result = validateCanonicalB10Inventory();
  assert.deepEqual(
    {
      status: result.status,
      claimCeiling: result.claimCeiling,
      sourcePinsVerified: result.sourcePinsVerified,
      surfacesAccounted: result.surfacesAccounted,
      documentationHazardsOpen: result.documentationHazardsOpen,
      refusalContractValidated: result.refusalContractValidated,
      runtimeQuarantineImplemented: result.runtimeQuarantineImplemented,
      durableAuthorityAvailable: result.durableAuthorityAvailable,
      migration0007Present: result.migration0007Present,
      canDispatch: result.canDispatch,
      canRegisterPeer: result.canRegisterPeer,
      canRoutePeer: result.canRoutePeer,
      canMutateQueue: result.canMutateQueue,
      canCallProvider: result.canCallProvider,
      canSendMessage: result.canSendMessage,
      mcpConnected: result.mcpConnected,
      a2aLive: result.a2aLive,
      productionReady: result.productionReady,
    },
    {
      status: "STATIC_INVENTORY_VALIDATED_NOT_QUARANTINED",
      claimCeiling: "DESIGNATED_B10_1_SURFACES_ACCOUNTED_ONLY",
      sourcePinsVerified: 28,
      surfacesAccounted: 39,
      documentationHazardsOpen: 1,
      refusalContractValidated: true,
      runtimeQuarantineImplemented: false,
      durableAuthorityAvailable: false,
      migration0007Present: false,
      canDispatch: false,
      canRegisterPeer: false,
      canRoutePeer: false,
      canMutateQueue: false,
      canCallProvider: false,
      canSendMessage: false,
      mcpConnected: false,
      a2aLive: false,
      productionReady: false,
    },
  );
});

test("review pins bind the exact inventory, schemas, and refusal fixture bytes", () => {
  assert.equal(sha256(readCanonicalFile(INVENTORY_PATH)), EXPECTED_INVENTORY_SHA256);
  assert.equal(sha256(readCanonicalFile(INVENTORY_SCHEMA_PATH)), EXPECTED_INVENTORY_SCHEMA_SHA256);
  assert.equal(sha256(readCanonicalFile(REFUSAL_FIXTURE_PATH)), EXPECTED_REFUSAL_FIXTURE_SHA256);
  assert.equal(sha256(readCanonicalFile(REFUSAL_SCHEMA_PATH)), EXPECTED_REFUSAL_SCHEMA_SHA256);
});

test("Draft 2020-12 schemas strictly accept canonical inventory and refusal instances", () => {
  assert.equal(validateInventorySchema(readJson(INVENTORY_PATH)), true, JSON.stringify(validateInventorySchema.errors));
  assert.equal(validateRefusalSchema(readJson(REFUSAL_FIXTURE_PATH)), true, JSON.stringify(validateRefusalSchema.errors));
});

test("inventory schema rejects unknown fields and false-authority promotion", () => {
  const unknown = cloneInventory();
  unknown.unreviewed = true;
  assert.equal(validateInventorySchema(unknown), false);

  const promoted = cloneInventory();
  promoted.proofFlags.canCallProvider = true;
  assert.equal(validateInventorySchema(promoted), false);

  const implemented = cloneInventory();
  implemented.surfaces[0].quarantineImplemented = true;
  assert.equal(validateInventorySchema(implemented), false);
});

test("duplicate JSON member names are rejected before parser normalization", () => {
  assert.throws(
    () => parseJsonRejectDuplicateKeys('{"status":"hold","status":"open"}', "fixture"),
    /duplicate key "status"/,
  );
  assert.throws(
    () => computeA27DomainDigest(Buffer.from('{"x":0,"x":1}')),
    /duplicate key "x"/,
  );
});

test("manual validator rejects unknown fields and all proof-flag promotions", () => {
  expectInventoryRejected((manifest) => {
    manifest.unreviewed = true;
  }, /manifest keys drift/);

  for (const key of Object.keys(cloneInventory().proofFlags)) {
    expectInventoryRejected((manifest) => {
      manifest.proofFlags[key] = true;
    }, new RegExp(`proof flag promoted: ${key}`));
  }
});

test("surface membership is closed against removal, duplication, and reordering", () => {
  expectInventoryRejected((manifest) => {
    manifest.surfaces.pop();
  }, /surface IDs order or membership drift/);
  expectInventoryRejected((manifest) => {
    manifest.surfaces[1].id = manifest.surfaces[0].id;
  }, /surface IDs order or membership drift/);
  expectInventoryRejected((manifest) => {
    [manifest.surfaces[0], manifest.surfaces[1]] = [manifest.surfaces[1], manifest.surfaces[0]];
  }, /surface IDs order or membership drift/);
});

test("classification, boundary, and unsafe-behavior truth cannot be relabeled", () => {
  expectInventoryRejected((manifest) => {
    manifest.surfaces.find((surface) => surface.id === "telegram-send-http").classification = "STATUS_ONLY_ALLOWED";
  }, /classification\/boundary mismatch/);
  expectInventoryRejected((manifest) => {
    manifest.surfaces.find((surface) => surface.id === "rust-a2a-card-status").currentUnsafeBehaviorPresent = true;
  }, /unsafe-behavior truth drift/);
  expectInventoryRejected((manifest) => {
    manifest.expectedSummary.byClassification.SHARED_REFUSAL_REQUIRED = 15;
  }, /classification summary drift/);
});

test("manual validator mirrors schema enums and rejects empty markers", () => {
  expectInventoryRejected((manifest) => {
    manifest.surfaces[0].layer = "NOT_A_LAYER";
  }, /invalid layer/);
  expectInventoryRejected((manifest) => {
    manifest.surfaces[0].entryKind = "NOT_AN_ENTRY_KIND";
  }, /invalid entry kind/);
  expectInventoryRejected((manifest) => {
    manifest.surfaces[0].requiredSourceMarkers = [""];
  }, /entries must be non-empty strings/);
});

test("dependencies cannot name missing or self surfaces", () => {
  expectInventoryRejected((manifest) => {
    manifest.surfaces[0].dependencies = ["missing-surface"];
  }, /invalid dependency missing-surface/);
  expectInventoryRejected((manifest) => {
    manifest.surfaces[0].dependencies = [manifest.surfaces[0].id];
  }, /invalid dependency rust-legacy-gate-decision/);
});

test("source and test markers are verified against hash-pinned canonical bytes", () => {
  const manifest = validateInventoryShape(cloneInventory());
  const texts = verifyPinnedSources(manifest);
  assert.equal(texts.size, 28);

  const target = "services/telegram-command-bot/src/sender.mjs";
  assert.throws(
    () => verifyPinnedSources(manifest, (path) => {
      const bytes = readCanonicalFile(path);
      return path === target
        ? Buffer.from(bytes.toString("utf8").replace("export async function sendTelegramMessage", "async function removedSender"))
        : bytes;
    }),
    /source digest drift: services\/telegram-command-bot\/src\/sender\.mjs/,
  );
});

test("independent discovery covers scoped routes and exported direct-call seams", () => {
  const manifest = validateInventoryShape(cloneInventory());
  const texts = verifyPinnedSources(manifest);
  const coverage = assertIndependentScopeCoverage(manifest, texts);
  assert.deepEqual(coverage, {
    rustControlRouteBindings: 10,
    rustWebRouteBindings: 1,
    nodeRouteBindings: 7,
    telegramRouteBindings: 5,
    exportedFunctions: 16,
  });

  const missingPost = structuredClone(manifest);
  missingPost.surfaces = missingPost.surfaces.filter((surface) => surface.id !== "rust-pending-work-write");
  assert.throws(
    () => assertIndependentScopeCoverage(missingPost, texts),
    /independent coverage missed Rust route binding: POST \/api\/pending-work -> add_pending/,
  );

  const wrongHandler = structuredClone(manifest);
  wrongHandler.surfaces.find((surface) => surface.id === "rust-pending-work-write").locator =
    "POST /api/pending-work -> wrong_handler";
  assert.throws(
    () => assertIndependentScopeCoverage(wrongHandler, texts),
    /independent coverage missed Rust route binding: POST \/api\/pending-work -> add_pending/,
  );

  const extraExport = new Map(texts);
  const path = "services/dev-control-api/src/a2a-sync.mjs";
  extraExport.set(path, `${texts.get(path)}\nexport async function unreviewedLiveBypass() {}`);
  assert.throws(
    () => assertIndependentScopeCoverage(manifest, extraExport),
    /independent coverage missed exported function: .*unreviewedLiveBypass/,
  );

  const extraRoute = new Map(texts);
  const serverPath = "services/dev-control-api/server.mjs";
  extraRoute.set(serverPath, `${texts.get(serverPath)}\nif (request.method === "POST" && url.pathname === "/api/a2a-sync/unreviewed") {}`);
  assert.throws(
    () => assertIndependentScopeCoverage(manifest, extraRoute),
    /independent coverage missed Node control route: POST \/api\/a2a-sync\/unreviewed/,
  );
});

test("source pin paths and hashes cannot be caller-rewritten", () => {
  expectInventoryRejected((manifest) => {
    manifest.sourcePins[0].path = "../.env";
  }, /source pin paths order or membership drift/);
  const manifest = validateInventoryShape(cloneInventory());
  assert.throws(
    () => verifyPinnedSources(manifest, (path) => {
      const bytes = readCanonicalFile(path);
      return path === manifest.sourcePins[0].path ? Buffer.concat([bytes, Buffer.from("\n")]) : bytes;
    }),
    /source digest drift/,
  );
});

test("refusal fixture is closed, ordered, and cannot be promoted", () => {
  const canonical = readJson(REFUSAL_FIXTURE_PATH);
  assert.equal(validateRefusalContract(canonical, refusalSchema), canonical);

  for (const key of [
    "authorized", "executed", "providerCalled", "externalWrites", "claimCreated",
    "peerRegistered", "routeSelected", "queueMutated", "messageSent",
  ]) {
    const promoted = structuredClone(canonical);
    promoted[key] = true;
    assert.throws(() => validateRefusalContract(promoted, refusalSchema), new RegExp(`refusal flag promoted: ${key}`));
    assert.equal(validateRefusalSchema(promoted), false);
  }

  const reordered = structuredClone(canonical);
  [reordered.blockers[0], reordered.blockers[1]] = [reordered.blockers[1], reordered.blockers[0]];
  assert.throws(() => validateRefusalContract(reordered, refusalSchema), /refusal blockers order or membership drift/);
  assert.equal(validateRefusalSchema(reordered), false);
});

test("A27 digest is recomputed from parsed compact JSON using the reviewed domain", () => {
  assert.equal(computeA27DomainDigest(readCanonicalFile(A27_PATH)), EXPECTED_A27_DOMAIN_DIGEST);
  const mutated = JSON.parse(readCanonicalFile(A27_PATH).toString("utf8"));
  mutated.bindings[0].enabled = true;
  assert.notEqual(computeA27DomainDigest(Buffer.from(JSON.stringify(mutated))), EXPECTED_A27_DOMAIN_DIGEST);
});

test("documentation hazard must stay open until the stale live procedure is replaced", () => {
  expectInventoryRejected((manifest) => {
    manifest.documentationHazards[0].resolved = true;
  }, /documentation hazard truth drift/);
  expectInventoryRejected((manifest) => {
    manifest.documentationHazards = [];
  }, /documentation hazard inventory drift/);
});

test("validator has no process, network, environment, database, or provider primitive", () => {
  const source = readCanonicalFile("scripts/validate-b10-compatibility-surfaces.mjs").toString("utf8");
  for (const forbidden of [
    "node:child_process",
    "node:http",
    "node:https",
    "fetch(",
    "process.env",
    "DATABASE_URL",
    "TELEGRAM_BOT_TOKEN",
    "exec(",
    "spawn(",
  ]) {
    assert.equal(source.includes(forbidden), false, `validator must not contain ${forbidden}`);
  }
  assert.throws(() => {
    throw new B10InventoryError("sentinel");
  }, /B10\.1 compatibility inventory rejected: sentinel/);
});
