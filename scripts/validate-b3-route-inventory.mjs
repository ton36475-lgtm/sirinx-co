#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MANIFEST_PATH = join(
  REPO_ROOT,
  "config/route-parity/b3-route-inventory.v1.json",
);
const SCHEMA_PATH = join(
  REPO_ROOT,
  "schemas/route-parity/b3-route-inventory.v1.schema.json",
);
const PLAN_PATH = join(REPO_ROOT, "docs/agent-runtime/B3_ROUTE_PARITY_PLAN.md");
const GIT = "/usr/bin/git";
const EXPECTED_MANIFEST_SHA256 = "e29b40cce160432b6f8ecf10eeeb161b1053355ccadfa2addc69cd5fc6e8e182";
const EXPECTED_SCHEMA_SHA256 = "1bc67ac4f48405b318fddbea8186aefb99ec219f9262a4b127ac685acef382da";
const EXPECTED_PLAN_SHA256 = "d6db48ffbb11acf5942493776a80e5a40c6c9178a9c7902516036ba1d975a95f";

const GIT_ENV = Object.freeze({
  PATH: "/usr/bin:/bin",
  LANG: "C",
  LC_ALL: "C",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_NO_LAZY_FETCH: "1",
  GIT_OPTIONAL_LOCKS: "0",
  GIT_TERMINAL_PROMPT: "0",
});

const LAYOUT = Object.freeze({
  target: Object.freeze({
    repoPath: "/Users/sirinx/SIRINXDev/sirinx-co",
    canonicalAuditCommit: "1f05814c3e9d173e525234d69b3ce7f2d1b01a57",
    observedHead: "1f05814c3e9d173e525234d69b3ce7f2d1b01a57",
    relation: "ROUTE_SET_ONLY_MATCH",
    files: Object.freeze([
      Object.freeze({
        path: "crates/sirinx-web/src/lib.rs",
        canonicalSha256: "321638a84620b47881c8da17013f697a7fe1b9867ce199b933aa03e878dc71ac",
        observedSha256: "321638a84620b47881c8da17013f697a7fe1b9867ce199b933aa03e878dc71ac",
      }),
      Object.freeze({
        path: "crates/sirinx-web/src/main.rs",
        canonicalSha256: "1ec8a03d921deb01adb54f1c835e8a756fef3493a813112e21858379d11e5902",
        observedSha256: "cd90c7e5db7de78b0fa2e5316ae3eab229954a01a3d95a3014eeec50654f9a36",
      }),
    ]),
  }),
  automationGateway: Object.freeze({
    repoPath: "/Users/sirinx/restore-sources/github-audit/automation-system-backend",
    canonicalAuditCommit: "2e3dae794cd0d09978972d3c8df0420d55d15ce0",
    observedHead: "2e3dae794cd0d09978972d3c8df0420d55d15ce0",
    relation: "EXACT_BYTES_AT_OBSERVED_HEAD",
    files: Object.freeze([
      Object.freeze({
        path: "backend/api-gateway.js",
        canonicalSha256: "37e9c8100b0444319a30c79bc01697c54d30ea2ce7e0a739d9fe96f7ecd067cc",
        observedSha256: "37e9c8100b0444319a30c79bc01697c54d30ea2ce7e0a739d9fe96f7ecd067cc",
      }),
    ]),
  }),
  sirinx: Object.freeze({
    repoPath: "/Users/sirinx/restore-sources/github-audit/sirinx",
    canonicalAuditCommit: "48a93d375815e13671899329dcfa9dc7c6b9c3e9",
    observedHead: "41dced72faae5536269f097c25626ffe004374a2",
    relation: "OPERATION_SET_ONLY_MATCH",
    files: Object.freeze([
      Object.freeze({
        path: "server/routers.ts",
        canonicalSha256: "282dd4ba90b6accd16095c1b19551ea0157b2f1d66cc65c05ab25eedc684983a",
        observedSha256: "bfd3aa2e65ed0da407c1974835a2dbee651af5f1021fa99d49bed700dee9ad65",
      }),
      Object.freeze({
        path: "server/_core/systemRouter.ts",
        canonicalSha256: "b3e2dae253ee35e4b29aadefe06865c5acf35ef69d7d99bca6bb27310cc717f4",
        observedSha256: "b3e2dae253ee35e4b29aadefe06865c5acf35ef69d7d99bca6bb27310cc717f4",
      }),
      Object.freeze({
        path: "server/_core/oauth.ts",
        canonicalSha256: "d2e2fe4532ec9d142e8d4d448b2c1d8cc9eddd45a1433ad843c07afa5c13efc1",
        observedSha256: "d2e2fe4532ec9d142e8d4d448b2c1d8cc9eddd45a1433ad843c07afa5c13efc1",
      }),
      Object.freeze({
        path: "server/_core/index.ts",
        canonicalSha256: "873c0e9f7b542031b69afed1a063fe692e58f5fe4f86696972b10d018ddf3525",
        observedSha256: "873c0e9f7b542031b69afed1a063fe692e58f5fe4f86696972b10d018ddf3525",
      }),
      Object.freeze({
        path: "server/_core/trpc.ts",
        canonicalSha256: "95679492e0478938f9bab6e3388ba6a95d3ab3329e6ff2eb9686e638cd07d98e",
        observedSha256: "95679492e0478938f9bab6e3388ba6a95d3ab3329e6ff2eb9686e638cd07d98e",
      }),
    ]),
  }),
});

const EXPECTED_COUNTS = Object.freeze({
  automationGateway: 25,
  sirinxApi: 29,
  sourceTotal: 54,
  targetRegistrations: 10,
  targetApiProbeRoutes: 8,
  exactParity: 0,
  implementedSourceOperations: 0,
  safeReplacementOperations: 2,
  overlapOnly: 7,
  holdAuthData: 34,
  holdEffect: 7,
  holdSecurity: 3,
  holdPrivacy: 1,
});

const EXPECTED_DISPOSITION_IDS = Object.freeze({
  OVERLAP_ONLY: Object.freeze(["A01", "A12", "S01", "S06", "S09", "S10", "S24"]),
  SAFE_REPLACEMENT_PLANNED: Object.freeze(["S11", "S12"]),
  HOLD_AUTH_DATA: Object.freeze([
    "A03", "A04", "A05", "A06", "A07", "A08", "A10", "A11", "A14",
    "A15", "A16", "A17", "A18", "A19", "A20", "A22", "A25", "S04",
    "S05", "S07", "S08", "S13", "S14", "S15", "S16", "S17", "S18",
    "S19", "S20", "S21", "S22", "S25", "S26", "S28",
  ]),
  HOLD_EFFECT: Object.freeze(["A09", "A21", "A23", "A24", "S03", "S27", "S29"]),
  HOLD_SECURITY: Object.freeze(["A02", "A13", "S02"]),
  HOLD_PRIVACY: Object.freeze(["S23"]),
});

const TOP_KEYS = Object.freeze([
  "schemaRef", "schemaVersion", "status", "authority", "planPin", "snapshots",
  "sourceTruth", "expectedCounts", "targetRegistrations", "operations",
  "selectedSlice", "completion",
]);
const AUTHORITY_KEYS = Object.freeze([
  "canExecute", "canConnect", "canMutate", "canSend", "canDeploy",
  "canAuthorize", "canClaimCompletion",
]);
const PLAN_KEYS = Object.freeze(["path", "sha256"]);
const SNAPSHOT_KEYS = Object.freeze([
  "repoPath", "canonicalAuditCommit", "observedHead", "relation", "files",
]);
const FILE_KEYS = Object.freeze(["path", "canonicalSha256", "observedSha256"]);
const SOURCE_TRUTH_KEYS = Object.freeze([
  "automationGatewayDeclarationsAreRuntimeProof", "automationProxyDeclarations",
  "automationProvenDownstreamPathMatches", "sirinxObservedBytesEqualCanonical",
  "sirinxOperationSetOnlyMatch", "targetRepositoryClean", "targetScope",
  "targetRuntimeSurfaceProven",
]);
const TARGET_KEYS = Object.freeze(["id", "method", "route", "class"]);
const OPERATION_KEYS = Object.freeze([
  "id", "source", "protocol", "method", "pathOrProcedure", "access",
  "effect", "disposition", "targetIds", "reasonCodes", "exactParity",
  "implemented",
]);
const SLICE_KEYS = Object.freeze([
  "id", "status", "sourceOperationIds", "plannedTargetRoutes",
  "requiresResourceAdmission", "requiresMigrationOrderingFreeze",
  "reservedMigration", "parityOutcomeIfImplemented",
  "authorizesImplementation", "authorizesMigration", "authorizesExternalEffects",
]);
const COMPLETION_KEYS = Object.freeze([
  "inventoryAccounted", "routeInventoryDiffEmpty", "exactParityCount",
  "semanticParityProven", "b3Complete", "productionReady", "claim",
]);

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "QUERY", "MUTATION"]);
const ALLOWED_ACCESS = new Set(["PUBLIC", "AUTHENTICATED", "ADMIN"]);
const ALLOWED_EFFECTS = new Set(["NONE", "LOCAL_READ", "LOCAL_WRITE", "EXTERNAL_EFFECT", "SECURITY_RISK", "PRIVACY_RISK"]);
const ALLOWED_REASONS = new Set([
  "RESPONSE_CONTRACT_DIFF", "LEGACY_AUTH_REDESIGN_REQUIRED",
  "AUTH_CONTRACT_ABSENT", "DATA_CONTRACT_ABSENT",
  "DURABLE_EFFECT_AUTHORITY_ABSENT", "CALLER_SQL_QUARANTINED",
  "DTO_PROTOCOL_DIFF", "PUBLIC_READINESS_REDESIGN_REQUIRED",
  "PUBLIC_READ_SLICE_SELECTED", "PUBLIC_READ_CONTRACT_ABSENT",
  "CONSENT_CONTRACT_CONFLICT", "PROVIDER_AUTHORITY_ABSENT",
  "OAUTH_CONNECTOR_AUTHORITY_ABSENT",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message) {
  throw new Error(`B3 route inventory rejected: ${message}`);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertClosedObject(value, expectedKeys, label) {
  if (!isPlainObject(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail(`${label} keys must be exactly ${expected.join(",")}; got ${actual.join(",")}`);
  }
}

function assertExactArray(actual, expected, label) {
  if (!Array.isArray(actual)) fail(`${label} must be an array`);
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    fail(`${label} must be exactly ${JSON.stringify(expected)}; got ${JSON.stringify(actual)}`);
  }
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) fail(`${label} must be unique`);
}

function parseJsonRejectDuplicateKeys(text, label = "JSON") {
  let index = 0;

  function skipWhitespace() {
    while (/\s/.test(text[index] ?? "")) index += 1;
  }

  function parseString() {
    skipWhitespace();
    if (text[index] !== '"') fail(`${label} expected string at byte ${index}`);
    const start = index;
    index += 1;
    let escaped = false;
    while (index < text.length) {
      const char = text[index];
      if (escaped) {
        escaped = false;
        index += 1;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        index += 1;
        continue;
      }
      if (char === '"') {
        index += 1;
        const token = text.slice(start, index);
        try {
          return JSON.parse(token);
        } catch (error) {
          fail(`${label} invalid string at byte ${start}: ${error.message}`);
        }
      }
      index += 1;
    }
    fail(`${label} unterminated string at byte ${start}`);
  }

  function parsePrimitive() {
    skipWhitespace();
    const start = index;
    while (index < text.length && !/[\s,}\]]/.test(text[index])) index += 1;
    if (start === index) fail(`${label} invalid value at byte ${index}`);
    const token = text.slice(start, index);
    try {
      JSON.parse(token);
    } catch (error) {
      fail(`${label} invalid primitive ${JSON.stringify(token)}: ${error.message}`);
    }
  }

  function parseArray() {
    index += 1;
    skipWhitespace();
    if (text[index] === "]") {
      index += 1;
      return;
    }
    while (index < text.length) {
      parseValue();
      skipWhitespace();
      if (text[index] === "]") {
        index += 1;
        return;
      }
      if (text[index] !== ",") fail(`${label} expected array comma at byte ${index}`);
      index += 1;
    }
    fail(`${label} unterminated array`);
  }

  function parseObject() {
    index += 1;
    const keys = new Set();
    skipWhitespace();
    if (text[index] === "}") {
      index += 1;
      return;
    }
    while (index < text.length) {
      const key = parseString();
      if (keys.has(key)) fail(`${label} duplicate key ${JSON.stringify(key)}`);
      keys.add(key);
      skipWhitespace();
      if (text[index] !== ":") fail(`${label} expected colon after ${JSON.stringify(key)}`);
      index += 1;
      parseValue();
      skipWhitespace();
      if (text[index] === "}") {
        index += 1;
        return;
      }
      if (text[index] !== ",") fail(`${label} expected object comma at byte ${index}`);
      index += 1;
      skipWhitespace();
    }
    fail(`${label} unterminated object`);
  }

  function parseValue() {
    skipWhitespace();
    const char = text[index];
    if (char === "{") return parseObject();
    if (char === "[") return parseArray();
    if (char === '"') {
      parseString();
      return;
    }
    parsePrimitive();
  }

  parseValue();
  skipWhitespace();
  if (index !== text.length) fail(`${label} trailing content at byte ${index}`);
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${label} parse failed: ${error.message}`);
  }
}

function validateRelativeFilePath(path, label) {
  if (typeof path !== "string" || path.length === 0) fail(`${label} must be a non-empty string`);
  if (isAbsolute(path) || path.startsWith("-") || path.includes("..") || path.includes("\\") || path.includes(":")) {
    fail(`${label} contains a forbidden path form`);
  }
  if (/\0|[\u0001-\u001f\u007f]/.test(path)) fail(`${label} contains control characters`);
}

function validateManifest(manifest) {
  assertClosedObject(manifest, TOP_KEYS, "manifest");
  if (manifest.schemaRef !== "schemas/route-parity/b3-route-inventory.v1.schema.json") fail("schemaRef drift");
  if (manifest.schemaVersion !== "1.0") fail("schemaVersion drift");
  if (manifest.status !== "STATIC_INVENTORY_ONLY") fail("status must remain STATIC_INVENTORY_ONLY");

  assertClosedObject(manifest.authority, AUTHORITY_KEYS, "authority");
  for (const key of AUTHORITY_KEYS) {
    if (manifest.authority[key] !== false) fail(`authority.${key} must remain false`);
  }

  assertClosedObject(manifest.planPin, PLAN_KEYS, "planPin");
  if (manifest.planPin.path !== "docs/agent-runtime/B3_ROUTE_PARITY_PLAN.md") fail("planPin.path drift");
  if (manifest.planPin.sha256 !== EXPECTED_PLAN_SHA256) {
    fail("planPin.sha256 drift");
  }

  assertClosedObject(manifest.snapshots, Object.keys(LAYOUT), "snapshots");
  for (const [name, expected] of Object.entries(LAYOUT)) {
    const actual = manifest.snapshots[name];
    assertClosedObject(actual, SNAPSHOT_KEYS, `snapshots.${name}`);
    for (const key of ["repoPath", "canonicalAuditCommit", "observedHead", "relation"]) {
      if (actual[key] !== expected[key]) fail(`snapshots.${name}.${key} drift`);
    }
    if (!/^[a-f0-9]{40}$/.test(actual.canonicalAuditCommit) || !/^[a-f0-9]{40}$/.test(actual.observedHead)) {
      fail(`snapshots.${name} commits must be lowercase 40-hex`);
    }
    if (!Array.isArray(actual.files) || actual.files.length !== expected.files.length) {
      fail(`snapshots.${name}.files count drift`);
    }
    actual.files.forEach((file, index) => {
      assertClosedObject(file, FILE_KEYS, `snapshots.${name}.files[${index}]`);
      validateRelativeFilePath(file.path, `snapshots.${name}.files[${index}].path`);
      for (const key of FILE_KEYS) {
        if (file[key] !== expected.files[index][key]) fail(`snapshots.${name}.files[${index}].${key} drift`);
      }
      if (!/^[a-f0-9]{64}$/.test(file.canonicalSha256) || !/^[a-f0-9]{64}$/.test(file.observedSha256)) {
        fail(`snapshots.${name}.files[${index}] digests must be lowercase SHA-256`);
      }
    });
  }

  assertClosedObject(manifest.sourceTruth, SOURCE_TRUTH_KEYS, "sourceTruth");
  const expectedSourceTruth = {
    automationGatewayDeclarationsAreRuntimeProof: false,
    automationProxyDeclarations: 22,
    automationProvenDownstreamPathMatches: 0,
    sirinxObservedBytesEqualCanonical: false,
    sirinxOperationSetOnlyMatch: true,
    targetRepositoryClean: false,
    targetScope: "LIB_RS_REGISTRATIONS_ONLY",
    targetRuntimeSurfaceProven: false,
  };
  assert.deepEqual(manifest.sourceTruth, expectedSourceTruth, "sourceTruth must remain fail-closed");

  assertClosedObject(manifest.expectedCounts, Object.keys(EXPECTED_COUNTS), "expectedCounts");
  assert.deepEqual(manifest.expectedCounts, EXPECTED_COUNTS, "expectedCounts drift");

  if (!Array.isArray(manifest.targetRegistrations) || manifest.targetRegistrations.length !== 10) {
    fail("targetRegistrations must contain exactly 10 rows");
  }
  const expectedTargetIds = Array.from({ length: 10 }, (_, index) => `T${String(index + 1).padStart(2, "0")}`);
  assertExactArray(manifest.targetRegistrations.map(row => row.id), expectedTargetIds, "target registration IDs");
  const targetTuples = [];
  for (const [index, row] of manifest.targetRegistrations.entries()) {
    assertClosedObject(row, TARGET_KEYS, `targetRegistrations[${index}]`);
    if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(row.method)) fail(`${row.id} has invalid method`);
    if (typeof row.route !== "string" || !row.route.startsWith("/")) fail(`${row.id} has invalid route`);
    if (!["PAGE", "API_PROBE", "API"].includes(row.class)) fail(`${row.id} has invalid class`);
    targetTuples.push(`${row.method} ${row.route}`);
  }
  assertUnique(targetTuples, "target method/route tuples");
  const apiProbeCount = manifest.targetRegistrations.filter(row => row.class !== "PAGE").length;
  if (apiProbeCount !== EXPECTED_COUNTS.targetApiProbeRoutes) fail("target API/probe count drift");

  if (!Array.isArray(manifest.operations) || manifest.operations.length !== 54) {
    fail("operations must contain exactly 54 rows");
  }
  const expectedOperationIds = [
    ...Array.from({ length: 25 }, (_, index) => `A${String(index + 1).padStart(2, "0")}`),
    ...Array.from({ length: 29 }, (_, index) => `S${String(index + 1).padStart(2, "0")}`),
  ];
  assertExactArray(manifest.operations.map(row => row.id), expectedOperationIds, "operation IDs");
  const targetIdSet = new Set(expectedTargetIds);
  const sourceTuples = [];
  for (const [index, row] of manifest.operations.entries()) {
    assertClosedObject(row, OPERATION_KEYS, `operations[${index}]`);
    const isAutomation = row.id.startsWith("A");
    if (row.source !== (isAutomation ? "AUTOMATION_GATEWAY" : "SIRINX_API")) fail(`${row.id} source mismatch`);
    if (!ALLOWED_METHODS.has(row.method) || !ALLOWED_ACCESS.has(row.access) || !ALLOWED_EFFECTS.has(row.effect)) {
      fail(`${row.id} has an unknown method/access/effect`);
    }
    if (isAutomation && (row.protocol !== "HTTP" || !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(row.method))) {
      fail(`${row.id} must be an HTTP operation`);
    }
    if (!isAutomation && row.id !== "S29" && (row.protocol !== "TRPC" || !["QUERY", "MUTATION"].includes(row.method))) {
      fail(`${row.id} must be a tRPC query or mutation`);
    }
    if (row.id === "S29" && (row.protocol !== "HTTP" || row.method !== "GET")) fail("S29 must be the OAuth HTTP GET");
    if (row.protocol === "HTTP" && !row.pathOrProcedure.startsWith("/")) fail(`${row.id} HTTP path must start with /`);
    if (row.protocol === "TRPC" && !/^[a-z][A-Za-z0-9]*\.[a-z][A-Za-z0-9]*$/.test(row.pathOrProcedure)) {
      fail(`${row.id} has an invalid tRPC procedure key`);
    }
    if (!Array.isArray(row.targetIds) || row.targetIds.some(id => !targetIdSet.has(id))) fail(`${row.id} targetIds invalid`);
    assertUnique(row.targetIds, `${row.id} targetIds`);
    if (!Array.isArray(row.reasonCodes) || row.reasonCodes.length === 0 || row.reasonCodes.some(code => !ALLOWED_REASONS.has(code))) {
      fail(`${row.id} reasonCodes invalid`);
    }
    assertUnique(row.reasonCodes, `${row.id} reasonCodes`);
    if (row.exactParity !== false || row.implemented !== false) fail(`${row.id} cannot claim parity or implementation in v1`);
    if (row.disposition === "OVERLAP_ONLY" && row.targetIds.length === 0) fail(`${row.id} overlap requires a target reference`);
    if (row.disposition === "SAFE_REPLACEMENT_PLANNED") {
      if (!EXPECTED_DISPOSITION_IDS.SAFE_REPLACEMENT_PLANNED.includes(row.id)) fail(`${row.id} cannot enter the safe replacement slice`);
      if (row.access !== "PUBLIC" || row.effect !== "LOCAL_READ" || row.method !== "QUERY") fail(`${row.id} safe replacement must be a public local read query`);
      if (row.targetIds.length !== 0) fail(`${row.id} planned route cannot be treated as registered target evidence`);
    }
    if (row.effect === "EXTERNAL_EFFECT" && row.disposition !== "HOLD_EFFECT") fail(`${row.id} external effect must remain held`);
    if (row.effect === "SECURITY_RISK" && row.disposition !== "HOLD_SECURITY") fail(`${row.id} security risk must remain held`);
    if (row.effect === "PRIVACY_RISK" && row.disposition !== "HOLD_PRIVACY") fail(`${row.id} privacy risk must remain held`);
    sourceTuples.push(`${row.source}\0${row.protocol}\0${row.method}\0${row.pathOrProcedure}`);
  }
  assertUnique(sourceTuples, "source operation tuples");

  for (const [disposition, expectedIds] of Object.entries(EXPECTED_DISPOSITION_IDS)) {
    const actualIds = manifest.operations.filter(row => row.disposition === disposition).map(row => row.id);
    assertExactArray(actualIds, expectedIds, `${disposition} IDs`);
  }
  const knownDispositionCount = Object.values(EXPECTED_DISPOSITION_IDS).reduce((sum, ids) => sum + ids.length, 0);
  if (knownDispositionCount !== manifest.operations.length) fail("one or more operations has an unknown disposition");

  assertClosedObject(manifest.selectedSlice, SLICE_KEYS, "selectedSlice");
  const expectedSlice = {
    id: "B3.1",
    status: "PLANNED_NOT_IMPLEMENTED",
    sourceOperationIds: ["S11", "S12"],
    plannedTargetRoutes: ["GET /api/blog", "GET /api/blog/:slug"],
    requiresResourceAdmission: true,
    requiresMigrationOrderingFreeze: true,
    reservedMigration: "0007_EFFECT_AUTHORITY_DO_NOT_USE",
    parityOutcomeIfImplemented: "SAFE_REPLACEMENT_NO_EXACT_CREDIT",
    authorizesImplementation: false,
    authorizesMigration: false,
    authorizesExternalEffects: false,
  };
  assert.deepEqual(manifest.selectedSlice, expectedSlice, "selectedSlice drift");

  assertClosedObject(manifest.completion, COMPLETION_KEYS, "completion");
  const expectedCompletion = {
    inventoryAccounted: true,
    routeInventoryDiffEmpty: false,
    exactParityCount: 0,
    semanticParityProven: false,
    b3Complete: false,
    productionReady: false,
    claim: "STATIC_ACCOUNTING_ONLY",
  };
  assert.deepEqual(manifest.completion, expectedCompletion, "completion must remain explicitly incomplete");
  return manifest;
}

function validateSchemaSentinels(schema) {
  if (!isPlainObject(schema)) fail("schema must be an object");
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") fail("schema dialect drift");
  if (schema.additionalProperties !== false) fail("schema top level must be closed");
  if (schema.$defs?.operation?.additionalProperties !== false) fail("operation schema must be closed");
  if (schema.$defs?.operation?.properties?.exactParity?.const !== false) fail("schema must forbid exact parity");
  if (schema.$defs?.operation?.properties?.implemented?.const !== false) fail("schema must forbid implemented=true");
  if (schema.properties?.completion?.properties?.b3Complete?.const !== false) fail("schema must forbid B3 completion");
  if (schema.properties?.selectedSlice?.properties?.authorizesImplementation?.const !== false) fail("schema must forbid implementation authority");
  return true;
}

function validateRoot(repoPath, label) {
  const stat = lstatSync(repoPath);
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`${label} root must be a real directory`);
  const canonical = realpathSync(repoPath);
  if (canonical !== repoPath) fail(`${label} root realpath drift: ${canonical}`);
  return canonical;
}

function resolvePinnedFile(repoPath, relativePath, label) {
  validateRelativeFilePath(relativePath, label);
  const root = validateRoot(repoPath, label);
  const absolute = join(root, relativePath);
  const stat = lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`${label} must be a regular non-symlink file`);
  const canonical = realpathSync(absolute);
  if (canonical !== absolute) fail(`${label} realpath drift: ${canonical}`);
  const rel = relative(root, canonical);
  if (rel.startsWith(`..${sep}`) || rel === ".." || isAbsolute(rel)) fail(`${label} escapes the pinned root`);
  return canonical;
}

function maskNonCode(text, { nestedBlockComments = false } = {}) {
  if (typeof text !== "string") fail("source text must be a string");
  const masked = text.split("");

  function blank(index) {
    if (text[index] !== "\n" && text[index] !== "\r") masked[index] = " ";
  }

  function blankRange(start, end) {
    for (let index = start; index < end; index += 1) blank(index);
  }

  let index = 0;
  while (index < text.length) {
    if (text.startsWith("//", index)) {
      const start = index;
      index += 2;
      while (index < text.length && text[index] !== "\n") index += 1;
      blankRange(start, index);
      continue;
    }
    if (text.startsWith("/*", index)) {
      const start = index;
      let depth = 1;
      index += 2;
      while (index < text.length && depth > 0) {
        if (nestedBlockComments && text.startsWith("/*", index)) {
          depth += 1;
          index += 2;
        } else if (text.startsWith("*/", index)) {
          depth -= 1;
          index += 2;
        } else {
          index += 1;
        }
      }
      blankRange(start, index);
      if (depth !== 0) fail("unterminated block comment while scanning source");
      continue;
    }

    if (text[index] === "r" || (text[index] === "b" && text[index + 1] === "r")) {
      const raw = /^(?:br|r)(#{0,255})"/.exec(text.slice(index));
      if (raw) {
        const start = index;
        const closing = `"${raw[1]}`;
        const close = text.indexOf(closing, index + raw[0].length);
        index = close < 0 ? text.length : close + closing.length;
        blankRange(start, index);
        continue;
      }
    }

    const quote = text[index];
    if (quote === "'" || quote === '"') {
      index += 1;
      let closed = false;
      while (index < text.length) {
        if (text[index] === "\\") {
          blank(index);
          index += 1;
          if (index < text.length) blank(index);
          index += 1;
          continue;
        }
        if (text[index] === quote) {
          index += 1;
          closed = true;
          break;
        }
        blank(index);
        index += 1;
      }
      if (!closed) fail("unterminated quoted string while scanning source");
      continue;
    }

    if (quote === "`") {
      const start = index;
      index += 1;
      let closed = false;
      while (index < text.length) {
        if (text[index] === "\\") {
          index += 2;
          continue;
        }
        if (text[index] === "`") {
          index += 1;
          closed = true;
          break;
        }
        index += 1;
      }
      blankRange(start, Math.min(index, text.length));
      if (!closed) fail("unterminated template string while scanning source");
      continue;
    }

    index += 1;
  }
  return masked.join("");
}

function readQuotedLiteral(text, quoteIndex, label) {
  const quote = text[quoteIndex];
  if (quote !== "'" && quote !== '"') fail(`${label} must use a direct quoted literal`);
  let value = "";
  for (let index = quoteIndex + 1; index < text.length; index += 1) {
    const char = text[index];
    if (char === quote) return { value, end: index + 1 };
    if (char === "\n" || char === "\r") fail(`${label} route literal cannot span lines`);
    if (char === "\\") fail(`${label} route literal escapes are not accepted as static evidence`);
    value += char;
  }
  fail(`${label} route literal is unterminated`);
}

function runGit(repoPath, args, label) {
  if (!Object.values(LAYOUT).some(entry => entry.repoPath === repoPath)) fail(`${label} repo root is not pinned`);
  if (!Array.isArray(args) || args.some(arg => typeof arg !== "string" || /\0|[\u0001-\u001f\u007f]/.test(arg))) {
    fail(`${label} git arguments invalid`);
  }
  const allowed = args.length === 2 && args[0] === "rev-parse" && args[1] === "HEAD"
    || args.length === 3 && args[0] === "cat-file" && args[1] === "blob" && /^[a-f0-9]{40}:[A-Za-z0-9_./-]+$/.test(args[2]);
  if (!allowed) fail(`${label} requested a forbidden git operation`);
  return execFileSync(GIT, args, {
    cwd: repoPath,
    env: GIT_ENV,
    encoding: null,
    input: undefined,
    maxBuffer: 4 * 1024 * 1024,
    timeout: 5_000,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
}

function extractHttpRoutes(text, receiver) {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(receiver)) fail("HTTP receiver must be a simple identifier");
  const masked = maskNonCode(text);
  const regex = new RegExp(`^\\s*${receiver}\\.(get|post|put|patch|delete)\\(\\s*(["'])`, "gm");
  return [...masked.matchAll(regex)].map(match => {
    const quoteIndex = match.index + match[0].length - 1;
    const literal = readQuotedLiteral(text, quoteIndex, `${receiver}.${match[1]}`);
    return {
      method: match[1].toUpperCase(),
      pathOrProcedure: literal.value,
    };
  });
}

function extractStringFirstArgumentCalls(text, receiver, method) {
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(receiver) || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(method)) {
    fail("call receiver and method must be simple identifiers");
  }
  const masked = maskNonCode(text);
  const regex = new RegExp(`\\b${receiver}\\.${method}\\(\\s*(["'])`, "g");
  return [...masked.matchAll(regex)].map(match => {
    const quoteIndex = match.index + match[0].length - 1;
    return readQuotedLiteral(text, quoteIndex, `${receiver}.${method}`).value;
  });
}

function extractAxumRoutes(text) {
  const masked = maskNonCode(text, { nestedBlockComments: true });
  const regex = /^\s*\.route\(\s*(["'])/gm;
  const routes = [];
  for (const match of masked.matchAll(regex)) {
    const quoteIndex = match.index + match[0].length - 1;
    const literal = readQuotedLiteral(text, quoteIndex, "Axum route");
    let cursor = literal.end;
    while (/\s/.test(masked[cursor] ?? "")) cursor += 1;
    if (masked[cursor] !== ",") continue;
    cursor += 1;
    while (/\s/.test(masked[cursor] ?? "")) cursor += 1;
    const handler = /^(get|post|put|patch|delete)\s*\(/.exec(masked.slice(cursor));
    if (!handler) continue;
    routes.push({
      method: handler[1].toUpperCase(),
      route: literal.value,
    });
  }
  return routes;
}

function blockBetween(text, startMarker, endMarker, label) {
  const start = text.indexOf(startMarker);
  if (start < 0) fail(`${label} start marker missing`);
  const end = endMarker ? text.indexOf(endMarker, start + startMarker.length) : text.length;
  if (end < 0) fail(`${label} end marker missing`);
  return text.slice(start, end);
}

function extractProcedureBlock(block, prefix, indent, label) {
  const startRegex = new RegExp(`^ {${indent}}([A-Za-z][A-Za-z0-9]*): (publicProcedure|protectedProcedure|adminProcedure)\\b`, "gm");
  const starts = [...block.matchAll(startRegex)];
  const accessMap = {
    publicProcedure: "PUBLIC",
    protectedProcedure: "AUTHENTICATED",
    adminProcedure: "ADMIN",
  };
  return starts.map((match, index) => {
    const end = index + 1 < starts.length ? starts[index + 1].index : block.length;
    const body = block.slice(match.index, end);
    const hasQuery = /\.query\s*\(/.test(body);
    const hasMutation = /\.mutation\s*\(/.test(body);
    if (hasQuery === hasMutation) fail(`${label}.${match[1]} must have exactly one query/mutation kind`);
    return {
      method: hasQuery ? "QUERY" : "MUTATION",
      pathOrProcedure: `${prefix}.${match[1]}`,
      access: accessMap[match[2]],
    };
  });
}

function extractSirinxProcedures(routersText, systemText, oauthText) {
  const routersCode = maskNonCode(routersText);
  const systemCode = maskNonCode(systemText);
  const blocks = [
    ["lead", "const leadRouter = router({", "const blogRouter = router({", 2],
    ["blog", "const blogRouter = router({", "const projectRouter = router({", 2],
    ["project", "const projectRouter = router({", "const analyticsRouter = router({", 2],
    ["analytics", "const analyticsRouter = router({", "const chatbotRouter = router({", 2],
    ["chatbot", "const chatbotRouter = router({", "const contactRouter = router({", 2],
    ["contact", "const contactRouter = router({", "export const appRouter = router({", 2],
    ["auth", "  auth: router({", "  lead: leadRouter", 4],
  ];
  const operations = [];
  for (const [prefix, start, end, indent] of blocks) {
    operations.push(...extractProcedureBlock(blockBetween(routersCode, start, end, prefix), prefix, indent, prefix));
  }
  operations.unshift(...extractProcedureBlock(systemCode, "system", 2, "system"));
  const oauthRoutes = extractHttpRoutes(oauthText, "app").filter(route => route.pathOrProcedure === "/api/oauth/callback");
  if (oauthRoutes.length !== 1 || oauthRoutes[0].method !== "GET") fail("OAuth callback declaration drift");
  operations.push({
    method: "GET",
    pathOrProcedure: "/api/oauth/callback",
    access: "PUBLIC",
  });
  return operations;
}

function collectEvidence() {
  const snapshots = {};
  for (const [name, layout] of Object.entries(LAYOUT)) {
    validateRoot(layout.repoPath, name);
    const observedHead = runGit(layout.repoPath, ["rev-parse", "HEAD"], `${name}.head`).toString("utf8").trim();
    const files = {};
    for (const file of layout.files) {
      const observedPath = resolvePinnedFile(layout.repoPath, file.path, `${name}.${file.path}`);
      const observedBytes = readFileSync(observedPath);
      const objectSpec = `${layout.canonicalAuditCommit}:${file.path}`;
      const canonicalBytes = runGit(layout.repoPath, ["cat-file", "blob", objectSpec], `${name}.${file.path}.canonical`);
      files[file.path] = {
        canonicalBytes,
        observedBytes,
        canonicalSha256: sha256(canonicalBytes),
        observedSha256: sha256(observedBytes),
      };
    }
    snapshots[name] = { observedHead, files };
  }
  return { snapshots };
}

function tupleKey(row) {
  return `${row.method}\0${row.pathOrProcedure}${row.access ? `\0${row.access}` : ""}`;
}

function assertSetEqual(actualRows, expectedRows, label) {
  const actual = actualRows.map(tupleKey).sort();
  const expected = expectedRows.map(tupleKey).sort();
  assertExactArray(actual, expected, label);
}

function validateEvidence(manifest, evidence) {
  for (const [name, layout] of Object.entries(LAYOUT)) {
    const actual = evidence.snapshots[name];
    if (actual.observedHead !== layout.observedHead) fail(`${name} observed HEAD drift`);
    for (const file of layout.files) {
      const observed = actual.files[file.path];
      if (!Buffer.isBuffer(observed.canonicalBytes) || !Buffer.isBuffer(observed.observedBytes)) {
        fail(`${name} evidence bytes missing for ${file.path}`);
      }
      const canonicalSha256 = sha256(observed.canonicalBytes);
      const observedSha256 = sha256(observed.observedBytes);
      if (observed.canonicalSha256 !== canonicalSha256 || canonicalSha256 !== file.canonicalSha256) {
        fail(`${name} canonical blob drift for ${file.path}`);
      }
      if (observed.observedSha256 !== observedSha256 || observedSha256 !== file.observedSha256) {
        fail(`${name} observed file drift for ${file.path}`);
      }
    }
  }

  const targetCanonical = evidence.snapshots.target.files["crates/sirinx-web/src/lib.rs"].canonicalBytes.toString("utf8");
  const targetRoutes = extractAxumRoutes(targetCanonical);
  assertSetEqual(
    targetRoutes.map(row => ({ method: row.method, pathOrProcedure: row.route })),
    manifest.targetRegistrations.map(row => ({ method: row.method, pathOrProcedure: row.route })),
    "target Axum route set",
  );

  const automationCanonical = evidence.snapshots.automationGateway.files["backend/api-gateway.js"].canonicalBytes.toString("utf8");
  const automationRoutes = extractHttpRoutes(automationCanonical, "app");
  const automationManifest = manifest.operations
    .filter(row => row.source === "AUTOMATION_GATEWAY")
    .map(row => ({ method: row.method, pathOrProcedure: row.pathOrProcedure }));
  assertSetEqual(automationRoutes, automationManifest, "automation gateway declaration set");

  const sirinxFiles = evidence.snapshots.sirinx.files;
  const canonicalProcedures = extractSirinxProcedures(
    sirinxFiles["server/routers.ts"].canonicalBytes.toString("utf8"),
    sirinxFiles["server/_core/systemRouter.ts"].canonicalBytes.toString("utf8"),
    sirinxFiles["server/_core/oauth.ts"].canonicalBytes.toString("utf8"),
  );
  const observedProcedures = extractSirinxProcedures(
    sirinxFiles["server/routers.ts"].observedBytes.toString("utf8"),
    sirinxFiles["server/_core/systemRouter.ts"].observedBytes.toString("utf8"),
    sirinxFiles["server/_core/oauth.ts"].observedBytes.toString("utf8"),
  );
  const sirinxManifest = manifest.operations
    .filter(row => row.source === "SIRINX_API")
    .map(row => ({ method: row.method, pathOrProcedure: row.pathOrProcedure, access: row.access }));
  assertSetEqual(canonicalProcedures, sirinxManifest, "historical SIRINX operation set");
  assertSetEqual(observedProcedures, canonicalProcedures, "observed SIRINX operation-set-only relation");

  const mountText = sirinxFiles["server/_core/index.ts"].canonicalBytes.toString("utf8");
  const mountCode = maskNonCode(mountText);
  const appUsePaths = extractStringFirstArgumentCalls(mountText, "app", "use");
  if (!/\bregisterOAuthRoutes\s*\(\s*app\s*\)/.test(mountCode) || !appUsePaths.includes("/api/trpc")) {
    fail("historical SIRINX mount evidence drift");
  }
  const trpcText = maskNonCode(sirinxFiles["server/_core/trpc.ts"].canonicalBytes.toString("utf8"));
  for (const symbol of ["publicProcedure", "protectedProcedure", "adminProcedure"]) {
    if (!new RegExp(`export const ${symbol}\\b`).test(trpcText)) fail(`historical tRPC access definition ${symbol} missing`);
  }
  const targetMainCanonical = maskNonCode(
    evidence.snapshots.target.files["crates/sirinx-web/src/main.rs"].canonicalBytes.toString("utf8"),
    { nestedBlockComments: true },
  );
  const targetMainObserved = maskNonCode(
    evidence.snapshots.target.files["crates/sirinx-web/src/main.rs"].observedBytes.toString("utf8"),
    { nestedBlockComments: true },
  );
  if (!/\brouter\(state\)/.test(targetMainCanonical) || !/\brouter\(state\)/.test(targetMainObserved)) {
    fail("target main wiring no longer references the scoped router");
  }

  return {
    targetRoutes: targetRoutes.length,
    automationGatewayRoutes: automationRoutes.length,
    sirinxCanonicalOperations: canonicalProcedures.length,
    sirinxObservedOperations: observedProcedures.length,
  };
}

function loadStaticFiles() {
  const manifestText = readFileSync(
    resolvePinnedFile(REPO_ROOT, relative(REPO_ROOT, MANIFEST_PATH), "manifest"),
    "utf8",
  );
  const schemaText = readFileSync(
    resolvePinnedFile(REPO_ROOT, relative(REPO_ROOT, SCHEMA_PATH), "schema"),
    "utf8",
  );
  const planText = readFileSync(
    resolvePinnedFile(REPO_ROOT, relative(REPO_ROOT, PLAN_PATH), "plan"),
    "utf8",
  );
  return {
    manifestText,
    schemaText,
    planText,
    manifest: parseJsonRejectDuplicateKeys(manifestText, "B3 manifest"),
    schema: parseJsonRejectDuplicateKeys(schemaText, "B3 schema"),
  };
}

function runValidation() {
  const files = loadStaticFiles();
  if (sha256(files.manifestText) !== EXPECTED_MANIFEST_SHA256) fail("review-pinned manifest digest drift");
  if (sha256(files.schemaText) !== EXPECTED_SCHEMA_SHA256) fail("review-pinned schema digest drift");
  validateManifest(files.manifest);
  validateSchemaSentinels(files.schema);
  if (sha256(files.planText) !== files.manifest.planPin.sha256) fail("B3 plan content drift");
  const evidence = collectEvidence();
  const derived = validateEvidence(files.manifest, evidence);
  return {
    status: "STATIC_INVENTORY_VALIDATED_NOT_PARITY",
    inventoryComplete: true,
    sourceOperations: files.manifest.operations.length,
    targetRegistrations: files.manifest.targetRegistrations.length,
    exactParityCount: 0,
    parityComplete: false,
    b3Complete: false,
    productionReady: false,
    resourceAdmission: "HOLD",
    authorityValidated: false,
    canDispatch: false,
    canRegisterRoutes: false,
    externalEffectsAuthorized: false,
    manifestSha256: sha256(files.manifestText),
    schemaSha256: sha256(files.schemaText),
    planSha256: sha256(files.planText),
    derived,
  };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--json")) {
    fail("only the optional --json flag is accepted");
  }
  const result = runValidation();
  process.stdout.write(`${JSON.stringify(result, null, args[0] === "--json" ? 2 : 0)}\n`);
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

export {
  collectEvidence,
  extractAxumRoutes,
  extractHttpRoutes,
  extractSirinxProcedures,
  extractStringFirstArgumentCalls,
  loadStaticFiles,
  maskNonCode,
  parseJsonRejectDuplicateKeys,
  resolvePinnedFile,
  runValidation,
  validateEvidence,
  validateManifest,
  validateSchemaSentinels,
};
