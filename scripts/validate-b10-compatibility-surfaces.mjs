#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = realpathSync(resolve(SCRIPT_DIR, ".."));

export const INVENTORY_PATH = "config/agent-runtime/b10-compatibility-surfaces.plan-only.v1.json";
export const INVENTORY_SCHEMA_PATH = "schemas/agent-runtime/b10-compatibility-surface-inventory.v1.schema.json";
export const EXPECTED_INVENTORY_SHA256 = "fda4b84715228de6ff8e126b7c6dfbdd2a53931afc6a7da1d18453c2a4fc0787";
export const EXPECTED_INVENTORY_SCHEMA_SHA256 = "6c1d8438901cad1b781acac558cf021b958eceaa3b6207972e312d61fcd8a68f";
export const EXPECTED_REFUSAL_FIXTURE_SHA256 = "a4ada787b015edaa2653719b06343c3803695a7df2ae6a1f635729ddb7d90614";
export const EXPECTED_REFUSAL_SCHEMA_SHA256 = "eb1d27bbfe32aaa9cd5f782262543a8b494685ab14df5a89e42386a355965533";
export const EXPECTED_A27_RAW_SHA256 = "b92c6152dbfa31d27a83e32f2bb567575ffabe75e558fbe7fb6776dbcdee4b01";
export const EXPECTED_A27_DOMAIN_DIGEST = "b2421996825817400d31f88757843225403ed2080541812c4db889e1ffe3cbb0";

const A27_DOMAIN = Buffer.from("sirinx:effect-authority-manifest:v1\0", "utf8");
const EXPECTED_SOURCE_PATHS = [
  "crates/sirinx-control/src/lib.rs",
  "crates/sirinx-control/src/main.rs",
  "crates/sirinx-a2a/src/lib.rs",
  "crates/sirinx-store/src/postgres.rs",
  "crates/sirinx-store/migrations/0002_pending_work.sql",
  "crates/sirinx-store/migrations/0003_control_gates.sql",
  "crates/sirinx-web/src/lib.rs",
  "services/dev-control-api/server.mjs",
  "services/dev-control-api/src/a2a-sync.mjs",
  "services/dev-control-api/src/a2a-omniroute.mjs",
  "services/dev-control-api/src/centerbrain-hub.mjs",
  "services/dev-control-api/src/codex-autoloop.mjs",
  "services/telegram-command-bot/src/index.mjs",
  "services/telegram-command-bot/src/sender.mjs",
  "services/telegram-command-bot/src/config.mjs",
  "services/telegram-command-bot/src/control-auth.mjs",
  "services/telegram-command-bot/src/control-gate.mjs",
  "crates/sirinx-web/tests/api.rs",
  "services/dev-control-api/src/a2a-sync.test.mjs",
  "services/dev-control-api/src/a2a-omniroute.test.mjs",
  "services/dev-control-api/src/centerbrain-hub.test.mjs",
  "services/dev-control-api/src/codex-autoloop.test.mjs",
  "services/dev-control-api/src/server-a2a-routes.test.mjs",
  "services/telegram-command-bot/src/index.test.mjs",
  "services/telegram-command-bot/src/sender.test.mjs",
  "services/telegram-command-bot/src/config.test.mjs",
  "services/telegram-command-bot/src/control-gate.test.mjs",
  "docs/TELEGRAM_CONTROL_PLANE.md",
];

const EXPECTED_SURFACE_IDS = [
  "rust-legacy-gate-decision",
  "rust-pending-work-write",
  "rust-action-live",
  "rust-a2a-sync",
  "rust-a2a-route",
  "rust-readiness-projection",
  "rust-gates-status",
  "rust-pending-work-read",
  "rust-a2a-card-status",
  "node-a2a-status",
  "node-a2a-live-plan-http",
  "node-create-a2a-sync-plan",
  "node-route-a2a-notification",
  "node-omniroute-status",
  "node-omniroute-handshake-http",
  "node-execute-omniroute-handshake",
  "node-omniroute-activate-http",
  "node-activate-omniroute-lane",
  "telegram-health-status",
  "telegram-status-root",
  "telegram-send-http",
  "telegram-send-function",
  "telegram-alert-helper",
  "telegram-notification-helper",
  "telegram-injected-gate-seam",
  "rust-control-metrics",
  "rust-web-lead-enqueue",
  "node-get-a2a-status-direct",
  "node-get-omniroute-status-direct",
  "node-probe-hermes-runtime",
  "node-centerbrain-status-http",
  "node-get-centerbrain-status-direct",
  "node-centerbrain-dryrun-http",
  "node-create-centerbrain-dryrun",
  "node-get-codex-bridge-status-direct",
  "telegram-resolve-config-direct",
  "telegram-resolve-readiness-direct",
  "telegram-check-send-ready-direct",
  "telegram-webhook-status",
];

const EXPECTED_CLASSIFICATION_COUNTS = Object.freeze({
  SHARED_REFUSAL_REQUIRED: 17,
  STATUS_REWRITE_REQUIRED: 18,
  DERIVED_EFFECT_SUPPRESSION_REQUIRED: 1,
  LEGACY_CONTROL_RESTRICT_ONLY: 1,
  DATA_EGRESS_REVIEW_REQUIRED: 1,
  STATUS_ONLY_ALLOWED: 1,
});

const EXPECTED_PROOF_FLAG_KEYS = [
  "runtimeQuarantineImplemented",
  "durableAuthorityAvailable",
  "migration0007Present",
  "canDispatch",
  "canRegisterPeer",
  "canRoutePeer",
  "canMutateQueue",
  "canCallProvider",
  "canSendMessage",
  "mcpConnected",
  "a2aLive",
  "productionReady",
];

const TOP_LEVEL_KEYS = [
  "schemaVersion",
  "status",
  "baseline",
  "scope",
  "contractPins",
  "sourcePins",
  "surfaces",
  "documentationHazards",
  "expectedSummary",
  "proofFlags",
];

const SURFACE_KEYS = [
  "id",
  "layer",
  "entryKind",
  "sourcePath",
  "locator",
  "classification",
  "effectProfiles",
  "currentRisk",
  "currentUnsafeBehaviorPresent",
  "requiredBoundary",
  "quarantineImplemented",
  "durableAuthorityAvailable",
  "runtimeVerified",
  "requiredSourceMarkers",
  "evidenceTestPath",
  "requiredTestMarkers",
  "dependencies",
];

export class B10InventoryError extends Error {
  constructor(message) {
    super(`B10.1 compatibility inventory rejected: ${message}`);
    this.name = "B10InventoryError";
  }
}

function fail(message) {
  throw new B10InventoryError(message);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
}

function assertExactKeys(value, expected, label) {
  assertObject(value, label);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    fail(`${label} keys drift: ${actual.join(",")}`);
  }
}

function assertExactArray(actual, expected, label) {
  if (!Array.isArray(actual) || JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} order or membership drift`);
  }
}

function assertNonEmptyUniqueStrings(actual, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(actual) || (!allowEmpty && actual.length === 0)) fail(`${label} must be a non-empty array`);
  if (new Set(actual).size !== actual.length) fail(`${label} must be unique`);
  for (const value of actual) {
    if (typeof value !== "string" || !value.trim()) fail(`${label} entries must be non-empty strings`);
  }
}

function safeRelativePath(pathValue, label) {
  if (typeof pathValue !== "string" || !pathValue || isAbsolute(pathValue) || pathValue.includes("\0")) {
    fail(`${label} is not a safe repository-relative path`);
  }
  const segments = pathValue.split(/[\\/]/);
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    fail(`${label} contains an unsafe path segment`);
  }
  return pathValue;
}

export function readCanonicalFile(pathValue) {
  const safePath = safeRelativePath(pathValue, "path");
  const fullPath = join(REPO_ROOT, safePath);
  const canonical = realpathSync(fullPath);
  const rootPrefix = `${REPO_ROOT}${sep}`;
  if (!canonical.startsWith(rootPrefix)) fail(`path escapes repository: ${safePath}`);
  if (canonical !== fullPath) fail(`symlink or realpath drift: ${safePath}`);
  const stat = lstatSync(fullPath);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`path is not a regular non-symlink file: ${safePath}`);
  return readFileSync(fullPath);
}

export function parseJsonRejectDuplicateKeys(input, label = "JSON") {
  const text = Buffer.isBuffer(input) ? input.toString("utf8") : String(input);
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
        try {
          return JSON.parse(text.slice(start, index));
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

function validateSchemaInstance(schema, instance, label) {
  try {
    const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    if (!validate(instance)) {
      const detail = (validate.errors || [])
        .map((error) => `${error.instancePath || "/"} ${error.message || "invalid"}`)
        .join("; ");
      fail(`${label} schema rejection: ${detail}`);
    }
  } catch (error) {
    if (error instanceof B10InventoryError) throw error;
    fail(`${label} schema compile failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function normalizedText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function assertMarker(sourceText, marker, label) {
  const normalizedSource = normalizedText(sourceText);
  const normalizedMarker = normalizedText(marker);
  if (!normalizedMarker) fail(`${label} marker must be non-empty`);
  if (!normalizedSource.includes(normalizedMarker)) fail(`${label} marker missing: ${marker}`);
}

function classificationBoundary(classification) {
  return {
    SHARED_REFUSAL_REQUIRED: "SHARED_503_BEFORE_ANY_EFFECT_SEAM",
    STATUS_REWRITE_REQUIRED: "FORCE_FALSE_AUTHORITY_PROJECTION",
    DERIVED_EFFECT_SUPPRESSION_REQUIRED: "SUPPRESS_DERIVED_EFFECT_PRESERVE_PRIMARY_WRITE",
    LEGACY_CONTROL_RESTRICT_ONLY: "LEGACY_HOLD_ONLY_OPEN_NONAUTHORITATIVE",
    DATA_EGRESS_REVIEW_REQUIRED: "SEPARATE_READ_ADMISSION_REQUIRED",
    STATUS_ONLY_ALLOWED: "NONAUTHORITATIVE_SELF_DESCRIPTION_ONLY",
  }[classification];
}

export function computeClassificationCounts(surfaces) {
  const counts = {};
  for (const surface of surfaces) counts[surface.classification] = (counts[surface.classification] || 0) + 1;
  return counts;
}

function assertClassificationCounts(actual, label) {
  assertExactKeys(actual, Object.keys(EXPECTED_CLASSIFICATION_COUNTS), label);
  for (const [classification, expected] of Object.entries(EXPECTED_CLASSIFICATION_COUNTS)) {
    if (actual[classification] !== expected) fail(`${label} drift: ${classification}`);
  }
}

export function validateInventoryShape(manifest) {
  assertExactKeys(manifest, TOP_LEVEL_KEYS, "manifest");
  if (manifest.schemaVersion !== "1.0") fail("schemaVersion drift");
  if (manifest.status !== "STATIC_INVENTORY_VALIDATED_NOT_QUARANTINED") fail("status drift");

  assertExactKeys(manifest.baseline, ["repository", "branch", "head", "workingTree", "resourceAdmission"], "baseline");
  if (manifest.baseline.repository !== "ton36475-lgtm/sirinx-co") fail("repository drift");
  if (manifest.baseline.branch !== "agent/b1-b2-command-center") fail("branch drift");
  if (manifest.baseline.head !== "1f05814c3e9d173e525234d69b3ce7f2d1b01a57") fail("baseline head drift");
  if (manifest.baseline.workingTree !== "DIRTY_WORKING_TREE_BYTES_PINNED_INDIVIDUALLY") fail("working-tree truth drift");
  if (manifest.baseline.resourceAdmission !== "HOLD_BELOW_15_GIB") fail("resource admission drift");

  assertExactKeys(manifest.scope, ["includedFamilies", "explicitExclusions", "claimCeiling"], "scope");
  assertExactArray(manifest.scope.includedFamilies, [
    "rust-action-a2a-queue-readiness",
    "node-a2a-omniroute-to-telegram",
    "telegram-http-direct-helper-and-injected-gate",
  ], "includedFamilies");
  if (manifest.scope.claimCeiling !== "DESIGNATED_B10_1_SURFACES_ACCOUNTED_ONLY") fail("claim ceiling drift");
  if (!Array.isArray(manifest.scope.explicitExclusions) || manifest.scope.explicitExclusions.length === 0) {
    fail("explicit exclusions missing");
  }
  assertNonEmptyUniqueStrings(manifest.scope.explicitExclusions, "explicit exclusions");

  assertExactKeys(manifest.contractPins, [
    "refusalFixturePath",
    "refusalFixtureSha256",
    "refusalSchemaPath",
    "refusalSchemaSha256",
    "a27ManifestPath",
    "a27RawSha256",
    "a27DomainSeparatedDigest",
  ], "contractPins");
  if (manifest.contractPins.refusalFixturePath !== "config/agent-runtime/durable-authority-unavailable.v1.json") fail("refusal fixture path drift");
  if (manifest.contractPins.refusalSchemaPath !== "schemas/agent-runtime/durable-authority-unavailable.v1.schema.json") fail("refusal schema path drift");
  if (manifest.contractPins.a27ManifestPath !== "config/agent-runtime/action-circuits.plan-only.v1.json") fail("A27 path drift");
  if (manifest.contractPins.refusalFixtureSha256 !== EXPECTED_REFUSAL_FIXTURE_SHA256) fail("refusal fixture review pin drift");
  if (manifest.contractPins.refusalSchemaSha256 !== EXPECTED_REFUSAL_SCHEMA_SHA256) fail("refusal schema review pin drift");
  if (manifest.contractPins.a27RawSha256 !== EXPECTED_A27_RAW_SHA256) fail("A27 raw review pin drift");
  if (manifest.contractPins.a27DomainSeparatedDigest !== EXPECTED_A27_DOMAIN_DIGEST) fail("A27 domain digest drift");

  if (!Array.isArray(manifest.sourcePins)) fail("sourcePins must be an array");
  assertExactArray(manifest.sourcePins.map((pin) => pin.path), EXPECTED_SOURCE_PATHS, "source pin paths");
  const pinPaths = new Set();
  for (const [index, pin] of manifest.sourcePins.entries()) {
    assertExactKeys(pin, ["path", "sha256", "kind"], `sourcePins[${index}]`);
    safeRelativePath(pin.path, `sourcePins[${index}].path`);
    if (pinPaths.has(pin.path)) fail(`duplicate source pin: ${pin.path}`);
    pinPaths.add(pin.path);
    if (!/^[0-9a-f]{64}$/.test(pin.sha256)) fail(`invalid source digest: ${pin.path}`);
    if (!["RUNTIME", "TEST", "STORE", "MIGRATION", "DOCUMENTATION"].includes(pin.kind)) fail(`invalid source kind: ${pin.path}`);
  }

  if (!Array.isArray(manifest.surfaces)) fail("surfaces must be an array");
  assertExactArray(manifest.surfaces.map((surface) => surface.id), EXPECTED_SURFACE_IDS, "surface IDs");
  const surfaceIds = new Set(EXPECTED_SURFACE_IDS);
  for (const [index, surface] of manifest.surfaces.entries()) {
    assertExactKeys(surface, SURFACE_KEYS, `surfaces[${index}]`);
    if (!["RUST_CONTROL", "NODE_CONTROL", "TELEGRAM"].includes(surface.layer)) fail(`invalid layer: ${surface.id}`);
    if (!["HTTP_ROUTE", "EXPORTED_FUNCTION", "COMPOSITION_SEAM"].includes(surface.entryKind)) fail(`invalid entry kind: ${surface.id}`);
    if (typeof surface.locator !== "string" || !surface.locator.trim()) fail(`locator missing: ${surface.id}`);
    if (typeof surface.currentRisk !== "string" || !surface.currentRisk.trim()) fail(`current risk missing: ${surface.id}`);
    if (!pinPaths.has(surface.sourcePath)) fail(`surface source is not pinned: ${surface.id}`);
    if (surface.evidenceTestPath !== null && !pinPaths.has(surface.evidenceTestPath)) {
      fail(`surface evidence test is not pinned: ${surface.id}`);
    }
    assertNonEmptyUniqueStrings(surface.requiredSourceMarkers, `source markers: ${surface.id}`);
    if (!Array.isArray(surface.requiredTestMarkers)) fail(`test markers invalid: ${surface.id}`);
    if (surface.requiredTestMarkers.length > 0) assertNonEmptyUniqueStrings(surface.requiredTestMarkers, `test markers: ${surface.id}`);
    if (surface.evidenceTestPath && surface.requiredTestMarkers.length === 0) fail(`test markers missing: ${surface.id}`);
    if (surface.quarantineImplemented !== false || surface.durableAuthorityAvailable !== false || surface.runtimeVerified !== false) {
      fail(`false implementation flags changed: ${surface.id}`);
    }
    const expectedBoundary = classificationBoundary(surface.classification);
    if (!expectedBoundary || surface.requiredBoundary !== expectedBoundary) fail(`classification/boundary mismatch: ${surface.id}`);
    const expectedUnsafe = surface.classification !== "STATUS_ONLY_ALLOWED";
    if (surface.currentUnsafeBehaviorPresent !== expectedUnsafe) fail(`unsafe-behavior truth drift: ${surface.id}`);
    assertNonEmptyUniqueStrings(surface.effectProfiles, `effectProfiles: ${surface.id}`);
    if (surface.effectProfiles.some((profile) => !/^[A-Z][A-Z0-9_]*$/.test(profile))) fail(`effectProfiles invalid: ${surface.id}`);
    if (!Array.isArray(surface.dependencies)) fail(`dependencies invalid: ${surface.id}`);
    if (new Set(surface.dependencies).size !== surface.dependencies.length) fail(`dependencies must be unique: ${surface.id}`);
    for (const dependency of surface.dependencies) {
      if (!surfaceIds.has(dependency) || dependency === surface.id) fail(`invalid dependency ${dependency}: ${surface.id}`);
    }
  }

  const counts = computeClassificationCounts(manifest.surfaces);
  assertClassificationCounts(counts, "classification counts");

  assertExactKeys(manifest.expectedSummary, ["surfaceCount", "sourcePinCount", "documentationHazardCount", "byClassification"], "expectedSummary");
  if (manifest.expectedSummary.surfaceCount !== EXPECTED_SURFACE_IDS.length) fail("surface summary drift");
  if (manifest.expectedSummary.sourcePinCount !== EXPECTED_SOURCE_PATHS.length) fail("source summary drift");
  if (manifest.expectedSummary.documentationHazardCount !== 1) fail("documentation summary drift");
  assertClassificationCounts(manifest.expectedSummary.byClassification, "classification summary");

  if (!Array.isArray(manifest.documentationHazards) || manifest.documentationHazards.length !== 1) fail("documentation hazard inventory drift");
  const hazard = manifest.documentationHazards[0];
  assertExactKeys(hazard, ["id", "path", "requiredMarker", "risk", "requiredRemediation", "resolved"], "documentationHazards[0]");
  if (hazard.id !== "telegram-legacy-live-runbook" || hazard.path !== "docs/TELEGRAM_CONTROL_PLANE.md" || hazard.resolved !== false) {
    fail("documentation hazard truth drift");
  }
  for (const key of ["requiredMarker", "risk", "requiredRemediation"]) {
    if (typeof hazard[key] !== "string" || !hazard[key].trim()) fail(`documentation hazard ${key} missing`);
  }

  assertExactKeys(manifest.proofFlags, EXPECTED_PROOF_FLAG_KEYS, "proofFlags");
  for (const key of EXPECTED_PROOF_FLAG_KEYS) if (manifest.proofFlags[key] !== false) fail(`proof flag promoted: ${key}`);
  return manifest;
}

export function verifyPinnedSources(manifest, readFile = readCanonicalFile) {
  const texts = new Map();
  for (const pin of manifest.sourcePins) {
    const bytes = readFile(pin.path);
    if (sha256(bytes) !== pin.sha256) fail(`source digest drift: ${pin.path}`);
    texts.set(pin.path, bytes.toString("utf8"));
  }

  for (const surface of manifest.surfaces) {
    const source = texts.get(surface.sourcePath);
    for (const marker of surface.requiredSourceMarkers) assertMarker(source, marker, `${surface.id} source`);
    if (surface.evidenceTestPath) {
      const testSource = texts.get(surface.evidenceTestPath);
      for (const marker of surface.requiredTestMarkers) assertMarker(testSource, marker, `${surface.id} test`);
    }
  }

  for (const hazard of manifest.documentationHazards) {
    assertMarker(texts.get(hazard.path), hazard.requiredMarker, `${hazard.id} documentation`);
  }
  return texts;
}

function discoveredMatches(text, pattern) {
  const matches = [];
  for (const match of text.matchAll(pattern)) matches.push(match[1]);
  return matches;
}

function discoverRustRouteBindings(text) {
  const bindings = [];
  for (const routeMatch of text.matchAll(/\.route\(\s*"([^"]+)"\s*,\s*([^\n]+?)\)\s*$/gm)) {
    const [, routePath, routeExpression] = routeMatch;
    for (const methodMatch of routeExpression.matchAll(/\b(get|post|patch|delete|put)\s*\(\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\)/g)) {
      bindings.push({
        method: methodMatch[1].toUpperCase(),
        path: routePath,
        handler: methodMatch[2],
      });
    }
  }
  return bindings;
}

function discoverNodeRouteBindings(text) {
  const bindings = [];
  for (const line of text.split("\n")) {
    const methodMatch = line.match(/request\.method\s*===\s*"([A-Z]+)"/);
    if (!methodMatch) continue;
    for (const pathMatch of line.matchAll(/url\.pathname\s*===\s*"([^"]+)"/g)) {
      bindings.push({ method: methodMatch[1], path: pathMatch[1] });
    }
  }
  return bindings;
}

export function assertIndependentScopeCoverage(manifest, texts) {
  const claimsMethodPath = (sourcePath, method, routePath) => manifest.surfaces.some(
    (surface) => {
      if (surface.sourcePath !== sourcePath || surface.entryKind !== "HTTP_ROUTE") return false;
      const locator = surface.locator.match(/^([A-Z]+) (.+?) -> /);
      return locator !== null
        && locator[1] === method
        && locator[2].split(" or ").includes(routePath);
    },
  );
  const claimsRustBinding = (sourcePath, binding) => manifest.surfaces.some(
    (surface) => {
      if (surface.sourcePath !== sourcePath || surface.entryKind !== "HTTP_ROUTE") return false;
      const expected = `${binding.method} ${binding.path} -> ${binding.handler}`;
      return surface.locator === expected || surface.locator.startsWith(`${expected} ->`);
    },
  );
  const claimsExport = (sourcePath, functionName) => manifest.surfaces.some(
    (surface) => surface.sourcePath === sourcePath
      && surface.entryKind === "EXPORTED_FUNCTION"
      && surface.locator.startsWith(`${functionName}(`),
  );

  const rustControlPath = "crates/sirinx-control/src/lib.rs";
  const rustControlRouteBindings = discoverRustRouteBindings(texts.get(rustControlPath))
    .filter((binding) => binding.path === "/ready"
      || binding.path === "/metrics"
      || binding.path === "/api/pending-work"
      || binding.path === "/api/actions"
      || binding.path.startsWith("/api/gates")
      || binding.path.startsWith("/api/a2a"));
  for (const binding of rustControlRouteBindings) {
    if (!claimsRustBinding(rustControlPath, binding)) {
      fail(`independent coverage missed Rust route binding: ${binding.method} ${binding.path} -> ${binding.handler}`);
    }
  }

  const rustWebPath = "crates/sirinx-web/src/lib.rs";
  const rustWebRouteBindings = discoverRustRouteBindings(texts.get(rustWebPath))
    .filter((binding) => binding.path === "/api/leads" && binding.method === "POST");
  for (const binding of rustWebRouteBindings) {
    if (!claimsRustBinding(rustWebPath, binding)) {
      fail(`independent coverage missed Rust route binding: ${binding.method} ${binding.path} -> ${binding.handler}`);
    }
  }
  if (texts.get(rustWebPath).includes("insert_pending_work")
      && !manifest.surfaces.some((surface) => surface.id === "rust-web-lead-enqueue")) {
    fail("independent coverage missed Rust web queue mutation");
  }

  const nodeServerPath = "services/dev-control-api/server.mjs";
  const nodeRouteBindings = discoverNodeRouteBindings(texts.get(nodeServerPath))
    .filter((binding) => binding.path.startsWith("/api/a2a-sync")
      || binding.path.startsWith("/api/omniroute")
      || binding.path.startsWith("/api/centerbrain-hub"));
  for (const binding of nodeRouteBindings) {
    if (!claimsMethodPath(nodeServerPath, binding.method, binding.path)) {
      fail(`independent coverage missed Node control route: ${binding.method} ${binding.path}`);
    }
  }

  const telegramIndexPath = "services/telegram-command-bot/src/index.mjs";
  const telegramPaths = new Set(["/health", "/status", "/", "/webhook", "/send"]);
  const telegramRouteBindings = discoverNodeRouteBindings(texts.get(telegramIndexPath))
    .filter((binding) => telegramPaths.has(binding.path));
  for (const binding of telegramRouteBindings) {
    if (!claimsMethodPath(telegramIndexPath, binding.method, binding.path)) {
      fail(`independent coverage missed Telegram route: ${binding.method} ${binding.path}`);
    }
  }

  const exportedFunctionScopes = [
    ["services/dev-control-api/src/a2a-sync.mjs", () => true],
    ["services/dev-control-api/src/a2a-omniroute.mjs", () => true],
    ["services/dev-control-api/src/centerbrain-hub.mjs", () => true],
    ["services/dev-control-api/src/codex-autoloop.mjs", (name) => name === "getCodexBridgeStatus"],
    ["services/telegram-command-bot/src/config.mjs", (name) => name.startsWith("resolveTelegramGateway")],
    ["services/telegram-command-bot/src/sender.mjs", () => true],
  ];
  for (const [sourcePath, includeName] of exportedFunctionScopes) {
    const functions = discoveredMatches(
      texts.get(sourcePath),
      /export\s+(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
    ).filter(includeName);
    for (const functionName of functions) {
      if (!claimsExport(sourcePath, functionName)) {
        fail(`independent coverage missed exported function: ${sourcePath}#${functionName}`);
      }
    }
  }

  return {
    rustControlRouteBindings: rustControlRouteBindings.length,
    rustWebRouteBindings: rustWebRouteBindings.length,
    nodeRouteBindings: nodeRouteBindings.length,
    telegramRouteBindings: telegramRouteBindings.length,
    exportedFunctions: exportedFunctionScopes.reduce((total, [sourcePath, includeName]) => total
      + discoveredMatches(
        texts.get(sourcePath),
        /export\s+(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
      ).filter(includeName).length, 0),
  };
}

export function validateRefusalContract(fixture, schema) {
  const expectedKeys = [
    "schemaVersion", "httpStatus", "status", "requiredAuthorityProfile", "authoritySource",
    "manifestDigest", "authorized", "executed", "providerCalled", "externalWrites",
    "claimCreated", "peerRegistered", "routeSelected", "queueMutated", "messageSent", "blockers",
  ];
  assertExactKeys(fixture, expectedKeys, "refusal fixture");
  if (fixture.schemaVersion !== "1.0" || fixture.httpStatus !== 503 || fixture.status !== "DURABLE_AUTHORITY_UNAVAILABLE") fail("refusal identity drift");
  if (fixture.requiredAuthorityProfile !== "effect-authority-0007" || fixture.authoritySource !== null) fail("refusal authority profile drift");
  if (fixture.manifestDigest !== EXPECTED_A27_DOMAIN_DIGEST) fail("refusal manifest digest drift");
  for (const key of ["authorized", "executed", "providerCalled", "externalWrites", "claimCreated", "peerRegistered", "routeSelected", "queueMutated", "messageSent"]) {
    if (fixture[key] !== false) fail(`refusal flag promoted: ${key}`);
  }
  assertExactArray(fixture.blockers, [
    "migration_0007_unavailable",
    "durable_authority_store_unavailable",
    "attested_human_authority_unavailable",
    "authoritative_database_clock_unavailable",
    "single_use_replay_ledger_unavailable",
  ], "refusal blockers");
  assertObject(schema, "refusal schema");
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema" || schema.additionalProperties !== false) {
    fail("refusal schema closure drift");
  }
  if (schema.properties?.status?.const !== "DURABLE_AUTHORITY_UNAVAILABLE") fail("refusal schema status drift");
  return fixture;
}

export function computeA27DomainDigest(a27Bytes) {
  const compact = Buffer.from(JSON.stringify(parseJsonRejectDuplicateKeys(a27Bytes, "A27 manifest")), "utf8");
  return sha256(Buffer.concat([A27_DOMAIN, compact]));
}

export function validateCanonicalB10Inventory() {
  const inventoryBytes = readCanonicalFile(INVENTORY_PATH);
  const schemaBytes = readCanonicalFile(INVENTORY_SCHEMA_PATH);
  if (sha256(inventoryBytes) !== EXPECTED_INVENTORY_SHA256) fail("review-pinned inventory digest drift");
  if (sha256(schemaBytes) !== EXPECTED_INVENTORY_SCHEMA_SHA256) fail("review-pinned inventory schema digest drift");

  const inventorySchema = parseJsonRejectDuplicateKeys(schemaBytes, "inventory schema");
  const manifest = validateInventoryShape(parseJsonRejectDuplicateKeys(inventoryBytes, "inventory"));
  validateSchemaInstance(inventorySchema, manifest, "inventory");
  const refusalFixtureBytes = readCanonicalFile(manifest.contractPins.refusalFixturePath);
  const refusalSchemaBytes = readCanonicalFile(manifest.contractPins.refusalSchemaPath);
  if (sha256(refusalFixtureBytes) !== EXPECTED_REFUSAL_FIXTURE_SHA256) fail("refusal fixture bytes drift");
  if (sha256(refusalSchemaBytes) !== EXPECTED_REFUSAL_SCHEMA_SHA256) fail("refusal schema bytes drift");
  const refusalFixture = parseJsonRejectDuplicateKeys(refusalFixtureBytes, "refusal fixture");
  const refusalSchema = parseJsonRejectDuplicateKeys(refusalSchemaBytes, "refusal schema");
  validateRefusalContract(refusalFixture, refusalSchema);
  validateSchemaInstance(refusalSchema, refusalFixture, "refusal fixture");

  const a27Bytes = readCanonicalFile(manifest.contractPins.a27ManifestPath);
  if (sha256(a27Bytes) !== EXPECTED_A27_RAW_SHA256) fail("A27 raw bytes drift");
  if (computeA27DomainDigest(a27Bytes) !== EXPECTED_A27_DOMAIN_DIGEST) fail("A27 canonical domain digest drift");

  const sourceTexts = verifyPinnedSources(manifest);
  const independentCoverage = assertIndependentScopeCoverage(manifest, sourceTexts);
  const classificationCounts = computeClassificationCounts(manifest.surfaces);
  return {
    status: manifest.status,
    claimCeiling: manifest.scope.claimCeiling,
    reviewPins: {
      inventorySha256: EXPECTED_INVENTORY_SHA256,
      inventorySchemaSha256: EXPECTED_INVENTORY_SCHEMA_SHA256,
      refusalFixtureSha256: EXPECTED_REFUSAL_FIXTURE_SHA256,
      refusalSchemaSha256: EXPECTED_REFUSAL_SCHEMA_SHA256,
      a27DomainSeparatedDigest: EXPECTED_A27_DOMAIN_DIGEST,
    },
    sourcePinsVerified: manifest.sourcePins.length,
    surfacesAccounted: manifest.surfaces.length,
    independentCoverage,
    documentationHazardsOpen: manifest.documentationHazards.length,
    classificationCounts,
    refusalContractValidated: true,
    ...manifest.proofFlags,
  };
}

function isDirectExecution() {
  return process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isDirectExecution()) {
  try {
    process.stdout.write(`${JSON.stringify(validateCanonicalB10Inventory(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
