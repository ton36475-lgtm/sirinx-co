#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readlinkSync,
  readSync,
  realpathSync,
} from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { types as utilTypes } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = realpathSync(resolve(SCRIPT_DIR, ".."));

export const SNAPSHOT_PATH = "config/agent-runtime/existing-components.provenance.v1.json";
export const SCHEMA_PATH = "schemas/agent-runtime/existing-component-provenance.v1.schema.json";
export const EXPECTED_SNAPSHOT_SHA256 = "42cee7dc44f636ed0726fd97c9496edee8290b0b3f948a5148eee514b4f884ea";
export const EXPECTED_SCHEMA_SHA256 = "13df3ba142bb6b0c2223b8d9117ac31cdad67c937c645c66b984f0a71c98c9ca";
const EXPECTED_SCHEMA_SEMANTIC_SHA256 = "58d2a10632748e21b964d52517b440772180d66f6af8ff21e6c9545ac011bddf";

const EXPECTED_REPO_READ_PATHS = Object.freeze([
  SNAPSHOT_PATH,
  SCHEMA_PATH,
  "Cargo.lock",
  "config/agent-runtime/external-components.research-only.v1.json",
  "schemas/agent-runtime/external-component-intake.v1.schema.json",
  "scripts/validate-external-component-intake.mjs",
]);

const EXPECTED_SECTION_SHA256 = Object.freeze({
  metadata: "79590883472f6f9b7802bdd4e5d75d5ad58962e4e6d4974db4c2b66d731c7104",
  baseline: "357379821cdee2db8ad534bc1a2fd452a86311bd621dd219229454623baa848c",
  parentCatalog: "15a9331d16f28b8bf3e039604b134af64af3955304f6f3331d402f5130ed0770",
  authority: "176b26ed8b1dbabb8cf3cfa88c8494401b605d7c0dfb2f1c5d180f39e30d0568",
  protectedReadBoundary: "0d6af6364408cf017233b33f88beab760086f55b8ca108c22a56890f585481d3",
  proofFlags: "629366b75a4282f577a11488e8fe62f9824172af95b6f78da46f6623f2d762d4",
  stopRules: "935f1041b6cca378a61f901257af7228c0bf1ea12b866d0ae8a3ca9168bc67e3",
});

const EXPECTED_COMPONENTS = Object.freeze([
  [
    "openai-codex-cli",
    "AGENT_HARNESS",
    "RECONCILE_EXISTING",
    "ARTIFACT_IDENTIFIED_NOT_UPSTREAM_BOUND",
    "0c2253b461ca3be828b2a253c8b0ca2ba1b206867fb34d3c6f385015ef3cab6b",
  ],
  [
    "nous-hermes-agent",
    "AGENT_HARNESS",
    "RECONCILE_EXISTING",
    "EDITABLE_SOURCE_UNPINNED",
    "05a10541f58083895231adfa747a9efb5dc60751188a649b2f99b098972dfd21",
  ],
  [
    "moonshot-kimi-code",
    "AGENT_HARNESS",
    "RECONCILE_EXISTING",
    "ARTIFACT_IDENTIFIED_NOT_UPSTREAM_BOUND",
    "75309361d9f758255eb3f95da7a515bb156a01dd3865cc80f931a4ef518d5f82",
  ],
  [
    "axum-existing",
    "API_FRAMEWORK",
    "RECONCILE_EXISTING",
    "LOCKFILE_AND_CACHE_VERIFIED_NOT_UPSTREAM_BOUND",
    "20069d92aa842e73b4ee541152178ab2581cebd4becbd56f9f71a0b214e3e8bf",
  ],
  [
    "sqlx-existing",
    "DATABASE_CLIENT",
    "RECONCILE_EXISTING",
    "LOCKFILE_AND_CACHE_VERIFIED_NOT_UPSTREAM_BOUND",
    "3263b9d4f0bdf8b851fbe8b24ae7057ea3cb54a1f1f77ce763821b391fb38dea",
  ],
  [
    "qwen35-2b-local",
    "LOCAL_MODEL",
    "QUARANTINE_UNPINNED",
    "LOCAL_MANIFEST_BLOBS_VERIFIED_NOT_UPSTREAM_BOUND",
    "740e5ba80675246f18dcbce3129b6385647b3acd229851f673c0ad299bb5c324",
  ],
]);

const EXPECTED_ARTIFACT_PATHS = Object.freeze([
  "/Users/sirinx/.local/bin/codex",
  "/Users/sirinx/.local/lib/node_modules/@openai/codex/package.json",
  "/Users/sirinx/.local/lib/node_modules/@openai/codex/node_modules/@openai/codex-darwin-arm64/package.json",
  "/Users/sirinx/.local/lib/node_modules/@openai/codex/node_modules/@openai/codex-darwin-arm64/vendor/aarch64-apple-darwin/bin/codex",
  "/Applications/ChatGPT.app/Contents/Resources/codex",
  "/Users/sirinx/.local/bin/hermes",
  "/Users/sirinx/.hermes/hermes-agent/venv/bin/hermes",
  "/Users/sirinx/.hermes/hermes-agent/venv/lib/python3.12/site-packages/hermes_agent-0.18.2.dist-info/METADATA",
  "/Users/sirinx/.hermes/hermes-agent/venv/lib/python3.12/site-packages/hermes_agent-0.18.2.dist-info/direct_url.json",
  "/Users/sirinx/.hermes/hermes-agent/venv/lib/python3.12/site-packages/hermes_agent-0.18.2.dist-info/RECORD",
  "/Users/sirinx/.hermes/hermes-agent/hermes_cli/main.py",
  "/Users/sirinx/.local/bin/kimi",
  "/Users/sirinx/.local/lib/node_modules/@moonshot-ai/kimi-code/package.json",
  "/opt/homebrew/bin/kimi",
  "/Users/sirinx/.cargo/registry/cache/index.crates.io-1949cf8c6b5b557f/axum-0.7.9.crate",
  "/Users/sirinx/.cargo/registry/cache/index.crates.io-1949cf8c6b5b557f/axum-core-0.4.5.crate",
  "/Users/sirinx/.cargo/registry/cache/index.crates.io-1949cf8c6b5b557f/sqlx-0.8.6.crate",
  "/Users/sirinx/.cargo/registry/cache/index.crates.io-1949cf8c6b5b557f/sqlx-core-0.8.6.crate",
  "/Users/sirinx/.cargo/registry/cache/index.crates.io-1949cf8c6b5b557f/sqlx-macros-0.8.6.crate",
  "/Users/sirinx/.cargo/registry/cache/index.crates.io-1949cf8c6b5b557f/sqlx-macros-core-0.8.6.crate",
  "/Users/sirinx/.cargo/registry/cache/index.crates.io-1949cf8c6b5b557f/sqlx-postgres-0.8.6.crate",
  "/Users/sirinx/.ollama/models/manifests/registry.ollama.ai/library/qwen3.5/2b",
  "/Users/sirinx/.ollama/models/blobs/sha256-ee043a99abe5e8317272712ed08ee2993af1f7930d69aefa3eba562cdc2822bd",
  "/Users/sirinx/.ollama/models/blobs/sha256-b709d81508a078a686961de6ca07a953b895d9b286c46e17f00fb267f4f2d297",
  "/Users/sirinx/.ollama/models/blobs/sha256-9be69ef463066202c1b1bd299aaf42bad370a01ba4b40d293617859720776c17",
  "/Users/sirinx/.ollama/models/blobs/sha256-9371364b27a52acac9d87f88bd93c9db1174d8d6ec57f6888925cdc1788871ff",
]);

const EXPECTED_PACKAGE_ROWS = Object.freeze([
  ["axum", "0.7.9", "edca88bc138befd0323b20752846e6587272d3b03b0343c8ea28a6f819e6e71f"],
  ["axum-core", "0.4.5", "09f2bd6146b97ae3359fa0cc6d6b376d9539582c7b4220f041a33ec24c226199"],
  ["sqlx", "0.8.6", "1fefb893899429669dcdd979aff487bd78f4064e5e7907e4269081e0ef7d97dc"],
  ["sqlx-core", "0.8.6", "ee6798b1838b6a0f69c007c133b8df5866302197e404e8b6ee8ed3e3a5e68dc6"],
  ["sqlx-macros", "0.8.6", "a2d452988ccaacfbf5e0bdbc348fb91d7c8af5bee192173ac3636b5fb6e6715d"],
  [
    "sqlx-macros-core",
    "0.8.6",
    "19a9c1841124ac5a61741f96e1d9e2ec77424bf323962dd894bdb93f37d5219b",
  ],
  ["sqlx-postgres", "0.8.6", "db58fcd5a53cf07c184b154801ff91347e4c30d17a3562a635ff028ad5deda46"],
]);

const EXPECTED_PROTECTED_BOUNDARY = Object.freeze([
  ".env files",
  "/Users/sirinx/.hermes/auth.json",
  "/Users/sirinx/.hermes/config.yaml",
  "browser profiles, cookies, and keychains",
]);

const FALSE_AUTHORITY_KEYS = Object.freeze([
  "installGrantPresent",
  "connectorGrantPresent",
  "providerGrantPresent",
  "localInferenceGrantPresent",
  "cloudflareMutationGrantPresent",
  "liveSendGrantPresent",
]);

const FALSE_COMPONENT_CLAIM_KEYS = Object.freeze([
  "upstreamIdentityBound",
  "installReceiptVerified",
  "reproducibleBuildVerified",
  "runtimeVerified",
  "admitted",
  "canInstall",
  "canRun",
  "canConnect",
]);

const FALSE_PROOF_KEYS = Object.freeze([
  "protectedConfigRead",
  "cliExecuted",
  "cloned",
  "installed",
  "lifecycleScriptRan",
  "modelDownloaded",
  "modelInvoked",
  "serviceStarted",
  "mcpConnected",
  "a2aLive",
  "providerCalled",
  "cloudflareMutated",
  "messageSent",
  "pushed",
  "merged",
  "deployed",
  "productionReady",
]);

export class ExistingComponentProvenanceError extends Error {
  constructor(message) {
    super(`Existing component provenance rejected: ${message}`);
    this.name = "ExistingComponentProvenanceError";
  }
}

function fail(message) {
  throw new ExistingComponentProvenanceError(message);
}

const MAX_JSON_ARRAY_LENGTH = 10_000;
const MAX_JSON_OBJECT_PROPERTIES = 10_000;
const MAX_JSON_GRAPH_NODES = 100_000;
const MAX_JSON_STRING_BYTES = 4 * 1024 * 1024;

function assertPlainJsonGraph(
  value,
  label = "value",
  seen = new WeakSet(),
  depth = 0,
  budget = { nodes: 0, stringBytes: 0 },
) {
  if (depth > 256) fail(`${label} exceeds the maximum JSON nesting depth`);
  if (typeof value === "string") {
    budget.stringBytes += Buffer.byteLength(value);
    if (budget.stringBytes > MAX_JSON_STRING_BYTES) fail(`${label} exceeds the JSON string-byte ceiling`);
    return;
  }
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${label} contains a non-finite number`);
    return;
  }
  if (typeof value !== "object") fail(`${label} contains a non-JSON value`);
  if (utilTypes.isProxy(value)) fail(`${label} contains a Proxy`);
  if (seen.has(value)) fail(`${label} contains a cycle or shared object reference`);
  seen.add(value);
  budget.nodes += 1;
  if (budget.nodes > MAX_JSON_GRAPH_NODES) fail(`${label} exceeds the JSON graph-node ceiling`);

  const names = Object.getOwnPropertyNames(value);
  if (names.length > MAX_JSON_OBJECT_PROPERTIES) fail(`${label} has too many own properties`);
  if (Object.getOwnPropertySymbols(value).length > 0) fail(`${label} contains symbol properties`);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) fail(`${label} has a non-plain array prototype`);
    if (value.length > MAX_JSON_ARRAY_LENGTH) fail(`${label} exceeds the JSON array-length ceiling`);
    if (
      names.length !== value.length + 1 ||
      names[names.length - 1] !== "length" ||
      names.slice(0, -1).some((name, index) => name !== String(index))
    ) {
      fail(`${label} is sparse or has extra array properties`);
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set || !descriptor.enumerable) {
        fail(`${label}[${index}] is not a plain enumerable data property`);
      }
      assertPlainJsonGraph(descriptor.value, `${label}[${index}]`, seen, depth + 1, budget);
    }
    return;
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) fail(`${label} has a non-plain object prototype`);
  for (const name of Object.getOwnPropertyNames(value)) {
    const descriptor = descriptors[name];
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set || !descriptor.enumerable) {
      fail(`${label}.${name} is not a plain enumerable data property`);
    }
    assertPlainJsonGraph(descriptor.value, `${label}.${name}`, seen, depth + 1, budget);
  }
}

function serializePlainJson(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Object.is(value, -0) ? "0" : String(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Array.isArray(value)) {
    return `[${[...Array(value.length).keys()]
      .map((index) => serializePlainJson(descriptors[String(index)].value))
      .join(",")}]`;
  }
  return `{${Object.getOwnPropertyNames(value)
    .map((name) => `${JSON.stringify(name)}:${serializePlainJson(descriptors[name].value)}`)
    .join(",")}}`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function parseJsonRejectDuplicateKeys(input, label = "JSON") {
  if (input && typeof input === "object" && utilTypes.isProxy(input)) {
    fail(`${label} input is a Proxy`);
  }
  let source;
  if (typeof input === "string") source = input;
  else if (Buffer.isBuffer(input)) source = Buffer.prototype.toString.call(input, "utf8");
  else fail(`${label} input must be a primitive string or Buffer`);
  if (Buffer.byteLength(source) > 8 * 1024 * 1024) fail(`${label} exceeds the bounded JSON input ceiling`);
  let cursor = 0;
  let nodes = 0;

  function skipWhitespace() {
    while (/\s/.test(source[cursor] ?? "")) cursor += 1;
  }

  function parseString() {
    skipWhitespace();
    if (source[cursor] !== '"') fail(`${label} expected a string at byte ${cursor}`);
    const start = cursor;
    cursor += 1;
    let escaped = false;
    while (cursor < source.length) {
      const char = source[cursor];
      if (escaped) {
        escaped = false;
        cursor += 1;
      } else if (char === "\\") {
        escaped = true;
        cursor += 1;
      } else if (char === '"') {
        cursor += 1;
        try {
          return JSON.parse(source.slice(start, cursor));
        } catch (error) {
          fail(`${label} invalid string at byte ${start}: ${error.message}`);
        }
      } else {
        cursor += 1;
      }
    }
    fail(`${label} unterminated string at byte ${start}`);
  }

  function parsePrimitive() {
    skipWhitespace();
    const start = cursor;
    while (cursor < source.length && !/[\s,}\]]/.test(source[cursor])) cursor += 1;
    if (start === cursor) fail(`${label} invalid value at byte ${cursor}`);
    try {
      JSON.parse(source.slice(start, cursor));
    } catch (error) {
      fail(`${label} invalid primitive at byte ${start}: ${error.message}`);
    }
  }

  function parseArray(depth) {
    cursor += 1;
    skipWhitespace();
    if (source[cursor] === "]") {
      cursor += 1;
      return;
    }
    while (cursor < source.length) {
      parseValue(depth + 1);
      skipWhitespace();
      if (source[cursor] === "]") {
        cursor += 1;
        return;
      }
      if (source[cursor] !== ",") fail(`${label} expected array comma at byte ${cursor}`);
      cursor += 1;
    }
    fail(`${label} unterminated array`);
  }

  function parseObject(depth) {
    cursor += 1;
    const keys = new Set();
    skipWhitespace();
    if (source[cursor] === "}") {
      cursor += 1;
      return;
    }
    while (cursor < source.length) {
      const key = parseString();
      if (keys.has(key)) fail(`${label} duplicate key ${JSON.stringify(key)}`);
      keys.add(key);
      skipWhitespace();
      if (source[cursor] !== ":") fail(`${label} expected colon after ${JSON.stringify(key)}`);
      cursor += 1;
      parseValue(depth + 1);
      skipWhitespace();
      if (source[cursor] === "}") {
        cursor += 1;
        return;
      }
      if (source[cursor] !== ",") fail(`${label} expected object comma at byte ${cursor}`);
      cursor += 1;
      skipWhitespace();
    }
    fail(`${label} unterminated object`);
  }

  function parseValue(depth = 0) {
    if (depth > 256) fail(`${label} exceeds the maximum raw JSON nesting depth`);
    nodes += 1;
    if (nodes > MAX_JSON_GRAPH_NODES) fail(`${label} exceeds the raw JSON node ceiling`);
    skipWhitespace();
    if (source[cursor] === "{") parseObject(depth);
    else if (source[cursor] === "[") parseArray(depth);
    else if (source[cursor] === '"') parseString();
    else parsePrimitive();
  }

  parseValue();
  skipWhitespace();
  if (cursor !== source.length) fail(`${label} trailing content at byte ${cursor}`);
  return JSON.parse(source);
}

function assertExactArray(actual, expected, label) {
  if (
    !Array.isArray(actual) ||
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    fail(`${label} order or membership drift`);
  }
}

function assertAllFalse(record, keys, label) {
  for (const key of keys) {
    if (record?.[key] !== false) fail(`${label} flag promoted: ${key}`);
  }
}

function sameFileState(left, right) {
  return ["dev", "ino", "mode", "size", "mtimeNs", "ctimeNs"].every((key) => left[key] === right[key]);
}

export function modeMatchesExpected(actualMode, expectedMode) {
  if (typeof expectedMode !== "string" || !/^[0-7]{3,4}$/.test(expectedMode)) return false;
  return (BigInt(actualMode) & 0o7777n) === BigInt(Number.parseInt(expectedMode, 8));
}

function safeRelativePath(pathValue) {
  if (typeof pathValue !== "string" || !pathValue || isAbsolute(pathValue) || pathValue.includes("\0")) {
    fail("unsafe repository-relative path");
  }
  if (pathValue.split(/[\\/]/).some((segment) => !segment || segment === "." || segment === "..")) {
    fail(`unsafe path segment: ${pathValue}`);
  }
  if (!EXPECTED_REPO_READ_PATHS.includes(pathValue)) fail(`repository read path is not allowlisted: ${pathValue}`);
  return pathValue;
}

function readBoundedRegularFileSync(path, maximumBytes, expectedState) {
  const descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  let before;
  let after;
  try {
    before = fstatSync(descriptor, { bigint: true });
    if (!before.isFile()) fail(`opened repository path is not a regular file: ${path}`);
    if (before.nlink !== 1n) fail(`opened repository path has hard-link aliases: ${path}`);
    if (!sameFileState(expectedState, before)) fail(`opened repository file identity drift: ${path}`);
    if (before.size > BigInt(maximumBytes)) fail(`repository file exceeds bounded read ceiling: ${path}`);
    const bytes = Buffer.alloc(Number(before.size));
    let offset = 0;
    while (offset < bytes.length) {
      const bytesRead = readSync(descriptor, bytes, offset, bytes.length - offset, null);
      if (bytesRead === 0) fail(`repository file truncated while reading: ${path}`);
      offset += bytesRead;
    }
    const extra = Buffer.allocUnsafe(1);
    if (readSync(descriptor, extra, 0, 1, null) !== 0) fail(`repository file grew while reading: ${path}`);
    after = fstatSync(descriptor, { bigint: true });
    if (!sameFileState(before, after)) fail(`repository file changed while reading: ${path}`);
    return { bytes, before, after };
  } finally {
    closeSync(descriptor);
  }
}

function readCanonicalFile(pathValue) {
  const safePath = safeRelativePath(pathValue);
  const fullPath = join(REPO_ROOT, safePath);
  const pathBefore = lstatSync(fullPath, { bigint: true });
  if (!pathBefore.isFile() || pathBefore.isSymbolicLink()) fail(`repository path is not a regular file: ${safePath}`);
  const canonical = realpathSync(fullPath);
  if (!canonical.startsWith(`${REPO_ROOT}${sep}`) || canonical !== fullPath) {
    fail(`repository path escapes root or is a symlink: ${safePath}`);
  }
  const inspected = readBoundedRegularFileSync(canonical, 8 * 1024 * 1024, pathBefore);
  if (!sameFileState(pathBefore, inspected.before) || !sameFileState(inspected.before, inspected.after)) {
    fail(`opened repository file identity drift: ${safePath}`);
  }
  const pathAfter = lstatSync(fullPath, { bigint: true });
  if (
    !sameFileState(inspected.after, pathAfter) ||
    !sameFileState(pathBefore, pathAfter) ||
    realpathSync(fullPath) !== canonical
  ) {
    fail(`repository path changed while reading: ${safePath}`);
  }
  return inspected.bytes;
}

function inspectRegularFileSync(path, expectedSize, expectedMode, expectedState) {
  const digest = createHash("sha256");
  const descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let before;
  let after;
  try {
    before = fstatSync(descriptor, { bigint: true });
    if (!before.isFile()) fail(`opened artifact is not a regular file: ${path}`);
    if (before.nlink !== 1n) fail(`opened artifact has hard-link aliases: ${path}`);
    if (!sameFileState(expectedState, before)) fail(`opened artifact identity drift: ${path}`);
    if (before.size !== BigInt(expectedSize)) fail(`artifact size drift: ${path}`);
    if (!modeMatchesExpected(before.mode, expectedMode)) {
      fail(`artifact mode drift: ${path}`);
    }

    let remaining = expectedSize;
    while (remaining > 0) {
      const bytesRead = readSync(descriptor, buffer, 0, Math.min(buffer.length, remaining), null);
      if (bytesRead === 0) fail(`artifact truncated while hashing: ${path}`);
      digest.update(buffer.subarray(0, bytesRead));
      remaining -= bytesRead;
    }
    if (readSync(descriptor, buffer, 0, 1, null) !== 0) fail(`artifact grew while hashing: ${path}`);

    after = fstatSync(descriptor, { bigint: true });
    if (!sameFileState(before, after)) fail(`artifact changed while hashing: ${path}`);
  } finally {
    closeSync(descriptor);
  }
  return { sha256: digest.digest("hex"), before, after };
}

function parseCargoPackages(lockBytes) {
  const lock = lockBytes.toString("utf8");
  const packages = new Map();
  for (const section of lock.split(/\n(?=\[\[package\]\]\n)/)) {
    if (!section.startsWith("[[package]]\n")) continue;
    const block = section.slice("[[package]]\n".length);
    const name = /^name = "([^"]+)"$/m.exec(block)?.[1];
    const version = /^version = "([^"]+)"$/m.exec(block)?.[1];
    const source = /^source = "([^"]+)"$/m.exec(block)?.[1];
    const checksum = /^checksum = "([0-9a-f]{64})"$/m.exec(block)?.[1];
    if (name && version) {
      const key = `${name}@${version}`;
      if (packages.has(key)) fail(`duplicate Cargo.lock package identity: ${key}`);
      packages.set(key, { name, version, source, checksum });
    }
  }
  return packages;
}

function validateArtifact(artifact, expectedPath) {
  if (artifact.path !== expectedPath) fail(`artifact allowlist drift: ${artifact.role}`);
  const pathStat = lstatSync(artifact.path, { bigint: true });
  if (artifact.pathKind === "SYMLINK_TO_REGULAR_FILE") {
    if (!pathStat.isSymbolicLink()) fail(`expected symlink: ${artifact.path}`);
    if (readlinkSync(artifact.path) !== artifact.linkTarget) fail(`symlink target drift: ${artifact.path}`);
  } else {
    if (artifact.linkTarget !== null) fail(`regular file has a link target: ${artifact.path}`);
    if (!pathStat.isFile() || pathStat.isSymbolicLink()) fail(`expected regular file: ${artifact.path}`);
  }

  const canonical = realpathSync(artifact.path);
  if (canonical !== artifact.canonicalPath) fail(`canonical path drift: ${artifact.path}`);
  const targetBefore = lstatSync(canonical, { bigint: true });
  if (!targetBefore.isFile() || targetBefore.isSymbolicLink()) {
    fail(`canonical target is not a regular file: ${artifact.path}`);
  }
  if (artifact.pathKind === "REGULAR_FILE" && !sameFileState(pathStat, targetBefore)) {
    fail(`regular artifact changed before hashing: ${artifact.path}`);
  }
  const inspected = inspectRegularFileSync(canonical, artifact.sizeBytes, artifact.modeOctal, targetBefore);
  if (!sameFileState(targetBefore, inspected.before) || !sameFileState(inspected.before, inspected.after)) {
    fail(`opened artifact identity drift: ${artifact.path}`);
  }
  if (inspected.sha256 !== artifact.sha256) {
    fail(`artifact digest drift: ${artifact.path}`);
  }

  const pathAfter = lstatSync(artifact.path, { bigint: true });
  const targetAfter = lstatSync(canonical, { bigint: true });
  if (!sameFileState(pathStat, pathAfter)) fail(`artifact path changed while hashing: ${artifact.path}`);
  if (!sameFileState(inspected.after, targetAfter)) fail(`artifact target changed while hashing: ${artifact.path}`);
  if (artifact.pathKind === "SYMLINK_TO_REGULAR_FILE" && readlinkSync(artifact.path) !== artifact.linkTarget) {
    fail(`symlink target changed while hashing: ${artifact.path}`);
  }
  if (realpathSync(artifact.path) !== artifact.canonicalPath) {
    fail(`canonical path changed while hashing: ${artifact.path}`);
  }
}

function validateParentCatalog(snapshot) {
  const parent = snapshot.parentCatalog;
  const catalogBytes = readCanonicalFile(parent.catalogPath);
  const schemaBytes = readCanonicalFile(parent.schemaPath);
  const validatorBytes = readCanonicalFile(parent.validatorPath);
  if (sha256(catalogBytes) !== parent.catalogSha256) fail("parent catalog digest drift");
  if (sha256(schemaBytes) !== parent.schemaSha256) fail("parent schema digest drift");
  if (sha256(validatorBytes) !== parent.validatorSha256) fail("parent validator digest drift");
  const catalog = parseJsonRejectDuplicateKeys(catalogBytes, "parent catalog");
  const schema = parseJsonRejectDuplicateKeys(schemaBytes, "parent schema");
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(catalog)) fail(`parent schema validation failed: ${JSON.stringify(validateSchema.errors)}`);
}

export function validateSnapshotShape(snapshot, schema) {
  assertPlainJsonGraph(snapshot, "snapshot");
  assertPlainJsonGraph(schema, "schema");
  if (sha256(Buffer.from(serializePlainJson(schema))) !== EXPECTED_SCHEMA_SEMANTIC_SHA256) {
    fail("schema semantic digest drift");
  }
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(snapshot)) fail(`schema validation failed: ${JSON.stringify(validateSchema.errors)}`);

  const frozenSections = {
    metadata: {
      schemaVersion: snapshot.schemaVersion,
      status: snapshot.status,
      generatedAt: snapshot.generatedAt,
    },
    baseline: snapshot.baseline,
    parentCatalog: snapshot.parentCatalog,
    authority: snapshot.authority,
    protectedReadBoundary: snapshot.protectedReadBoundary,
    proofFlags: snapshot.proofFlags,
    stopRules: snapshot.stopRules,
  };
  for (const [name, expectedDigest] of Object.entries(EXPECTED_SECTION_SHA256)) {
    if (sha256(Buffer.from(serializePlainJson(frozenSections[name]))) !== expectedDigest) {
      fail(`top-level semantic digest drift: ${name}`);
    }
  }

  if (snapshot.baseline.resourceReceipt.freeDiskKiB >= snapshot.baseline.resourceReceipt.workloadFloorKiB) {
    fail("resource receipt does not support HOLD_BELOW_15_GIB");
  }
  assertExactArray(snapshot.protectedReadBoundary, EXPECTED_PROTECTED_BOUNDARY, "protected-read boundary");
  assertAllFalse(snapshot.authority, FALSE_AUTHORITY_KEYS, "authority");
  assertAllFalse(snapshot.proofFlags, FALSE_PROOF_KEYS, "proof");

  const actualArtifactPaths = [];
  const actualPackageRows = [];
  for (let index = 0; index < snapshot.components.length; index += 1) {
    const component = snapshot.components[index];
    const [id, category, disposition, classification, semanticSha256] = EXPECTED_COMPONENTS[index];
    if (
      component.id !== id ||
      component.category !== category ||
      component.catalogDisposition !== disposition ||
      component.classification !== classification
    ) {
      fail(`component identity or disposition drift: ${id}`);
    }
    if (sha256(Buffer.from(serializePlainJson(component))) !== semanticSha256) {
      fail(`component semantic digest drift: ${id}`);
    }
    assertAllFalse(component.claims, FALSE_COMPONENT_CLAIM_KEYS, `component ${id}`);
    actualArtifactPaths.push(...component.artifacts.map(({ path }) => path));
    actualPackageRows.push(
      ...component.packageRecords.map(({ name, version, lockChecksum }) => [name, version, lockChecksum]),
    );
  }

  assertExactArray(actualArtifactPaths, EXPECTED_ARTIFACT_PATHS, "artifact paths");
  if (new Set(actualArtifactPaths).size !== actualArtifactPaths.length) fail("duplicate artifact path");
  assertExactArray(
    actualPackageRows.map((row) => row.join("|")),
    EXPECTED_PACKAGE_ROWS.map((row) => row.join("|")),
    "Cargo package rows",
  );

  return {
    status: "SHAPE_VALIDATED_NOT_ADMITTED",
    claimCeiling: "FROZEN_READ_ONLY_RECONCILIATION_PACKET",
    components: snapshot.components.length,
    artifacts: actualArtifactPaths.length,
    cargoPackages: actualPackageRows.length,
    upstreamIdentitiesBound: 0,
    admitted: false,
    runtimeVerified: false,
    mcpConnected: false,
    a2aLive: false,
    modelInvoked: false,
    providerCalled: false,
    messageSent: false,
    deployed: false,
    productionReady: false,
  };
}

export function validateCanonicalExistingComponentProvenance() {
  const snapshotBytes = readCanonicalFile(SNAPSHOT_PATH);
  const schemaBytes = readCanonicalFile(SCHEMA_PATH);
  if (sha256(snapshotBytes) !== EXPECTED_SNAPSHOT_SHA256) fail("snapshot byte digest drift");
  if (sha256(schemaBytes) !== EXPECTED_SCHEMA_SHA256) fail("schema byte digest drift");
  const snapshot = parseJsonRejectDuplicateKeys(snapshotBytes, "existing-component snapshot");
  const schema = parseJsonRejectDuplicateKeys(schemaBytes, "existing-component schema");
  const shape = validateSnapshotShape(snapshot, schema);

  validateParentCatalog(snapshot);
  const cargoLockBytes = readCanonicalFile(snapshot.baseline.cargoLockPath);
  if (sha256(cargoLockBytes) !== snapshot.baseline.cargoLockSha256) fail("Cargo.lock digest drift");
  const cargoPackages = parseCargoPackages(cargoLockBytes);
  for (const [name, version, checksum] of EXPECTED_PACKAGE_ROWS) {
    const record = cargoPackages.get(`${name}@${version}`);
    if (!record || record.source !== "registry+https://github.com/rust-lang/crates.io-index") {
      fail(`Cargo.lock source drift: ${name}@${version}`);
    }
    if (record.checksum !== checksum) fail(`Cargo.lock checksum drift: ${name}@${version}`);
  }

  let artifactIndex = 0;
  for (const component of snapshot.components) {
    for (const artifact of component.artifacts) {
      validateArtifact(artifact, EXPECTED_ARTIFACT_PATHS[artifactIndex]);
      artifactIndex += 1;
    }
    for (const packageRecord of component.packageRecords) {
      const artifact = component.artifacts.find(({ path }) => path === packageRecord.cacheArchivePath);
      if (!artifact || artifact.sha256 !== packageRecord.cacheArchiveSha256) {
        fail(`package archive binding drift: ${packageRecord.name}@${packageRecord.version}`);
      }
    }
  }

  return {
    ...shape,
    status: "PROVENANCE_VALIDATED_NOT_ADMITTED",
    claimCeiling: "EXACT_LOCAL_ARTIFACTS_AND_LOCKFILE_ONLY",
    resourceAdmission: "HOLD_BELOW_15_GIB",
    stopAt: "RECONCILIATION_PACKET_REVIEWED_NOT_ACTIVATED",
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(`${JSON.stringify(validateCanonicalExistingComponentProvenance(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
