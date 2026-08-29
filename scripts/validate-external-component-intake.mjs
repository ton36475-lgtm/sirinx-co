#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { types as utilTypes } from "node:util";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = realpathSync(resolve(SCRIPT_DIR, ".."));
export const CATALOG_PATH = "config/agent-runtime/external-components.research-only.v1.json";
export const SCHEMA_PATH = "schemas/agent-runtime/external-component-intake.v1.schema.json";
export const EXPECTED_CATALOG_SHA256 = "2c796db789c919c630ef425387ed75a0cba94a98886cd40299195e47451482ec";
export const EXPECTED_SCHEMA_SHA256 = "64127fbcb2595f606060c2fb627c2af414e1a18779d4c14d2bb50f271256d5eb";

export const EXPECTED_COMPONENTS = Object.freeze([
  ["cloudflare-agents", "cloudflare", "https://github.com/cloudflare/agents", "CANDIDATE_RESOURCE_HELD"],
  ["cloudflare-api-code-mode-mcp", "cloudflare", "https://github.com/cloudflare/mcp", "REFERENCE_ONLY"],
  ["modelcontextprotocol-rust-sdk", "modelcontextprotocol", "https://github.com/modelcontextprotocol/rust-sdk", "CANDIDATE_AUTHORITY_HELD"],
  ["modelcontextprotocol-specification", "modelcontextprotocol", "https://github.com/modelcontextprotocol/modelcontextprotocol", "REFERENCE_ONLY"],
  ["a2a-specification", "a2aproject", "https://github.com/a2aproject/A2A", "REFERENCE_ONLY"],
  ["a2a-javascript-sdk", "a2aproject", "https://github.com/a2aproject/a2a-js", "HOLD_PROTOCOL_VERSION"],
  ["a2a-rust-sdk", "a2aproject", "https://github.com/a2aproject/a2a-rs", "CANDIDATE_AUTHORITY_HELD"],
  ["openai-codex-cli", "openai", "https://github.com/openai/codex", "RECONCILE_EXISTING"],
  ["nous-hermes-agent", "NousResearch", "https://github.com/NousResearch/hermes-agent", "RECONCILE_EXISTING"],
  ["moonshot-kimi-code", "MoonshotAI", "https://github.com/MoonshotAI/kimi-code", "RECONCILE_EXISTING"],
  ["microsoft-playwright", "microsoft", "https://github.com/microsoft/playwright", "CANDIDATE_RESOURCE_HELD"],
  ["inspect-ai", "UKGovernmentBEIS", "https://github.com/UKGovernmentBEIS/inspect_ai", "CANDIDATE_RESOURCE_HELD"],
  ["axum-existing", "tokio-rs", "https://github.com/tokio-rs/axum", "RECONCILE_EXISTING"],
  ["sqlx-existing", "transact-rs", "https://github.com/transact-rs/sqlx", "RECONCILE_EXISTING"],
  ["line-node-sdk", "line", "https://github.com/line/line-bot-sdk-nodejs", "CANDIDATE_AUTHORITY_HELD"],
  ["line-bot-mcp-server", "line", "https://github.com/line/line-bot-mcp-server", "EXCLUDE_OVERLAP"],
  ["teloxide", "teloxide", "https://github.com/teloxide/teloxide", "EXCLUDE_OVERLAP"],
  ["grammy", "grammyjs", "https://github.com/grammyjs/grammY", "EXCLUDE_OVERLAP"],
  ["qwen25-coder-15b-gguf", "Qwen", "https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF", "CANDIDATE_RESOURCE_HELD"],
  ["granite-33-2b-gguf", "ibm-granite", "https://huggingface.co/ibm-granite/granite-3.3-2b-instruct-GGUF", "CANDIDATE_RESOURCE_HELD"],
  ["qwen35-2b-local", "Qwen / Ollama registry conversion", "https://huggingface.co/Qwen/Qwen3.5-2B", "QUARANTINE_UNPINNED"],
  ["glm-52", "zai-org", "https://huggingface.co/zai-org/GLM-5.2", "REJECT_LOCAL_RESOURCE"],
  ["kimi-k3", "MoonshotAI", "https://www.kimi.com/blog/kimi-k3", "HOLD_ARTIFACT_LICENSE"],
  ["openai-agents-python", "openai", "https://github.com/openai/openai-agents-python", "EXCLUDE_OVERLAP"],
  ["goose-agent", "block", "https://github.com/block/goose", "EXCLUDE_OVERLAP"],
  ["promptfoo", "promptfoo", "https://github.com/promptfoo/promptfoo", "CANDIDATE_RESOURCE_HELD"],
]);

export const EXPECTED_COMPONENT_SHA256 = Object.freeze([
  "2cd119d7e0589a757607dbdc5915a88af97f568a56ccd88d7597cf4de3faeb24",
  "d43b10b761fd24eda6ec193eeedd12b74f53b24954553fb1a075db4cfbf3e9d8",
  "fa845cdb3d472697ca6c0af76edd00a0fa95ff44a88a918877f898b6d90f3c63",
  "6cb53fb7aaf394bffdad1bb987aaa8ee491bd2d65f5b22606f6e8613244947eb",
  "5a68767ef9e653fece384d782848c11db04ae75b02d4ee48fcfea427003bf42e",
  "2a0628b4e2f59c5f1b5764c05b077d9e4fdb80415a66c8fadef180668e87fcb2",
  "a3a982916292cd5741789469424d12e40bc59925017622e7319db4759d2127e3",
  "fb11eebb994d9195b9587b6255aee232bb3670171486cf4b36037ca5af6773c1",
  "5c0d74e7349c06a471436f57a85928448f9c46852d37dbec3db3f5979f2b7b6f",
  "b23b2e946db19dfc9af16db22c03f5666acc30c395208bf8605631f6141fe902",
  "364281c25e3babe5375132c1c6896070ae271090113e356adb7278f670b7b1bb",
  "e605d3ca2fefab2f9fb0f6ff54e06dde408c9666fd57f2f26668c69506b51f07",
  "26e98a0274cb3b171a46def1d86fd6c4618b6d6cd1285a1afab3f631c6b4529a",
  "a38bef0aaeb92a8bc4f967f0ea100fbaea02a07b3909531a49f3facd164a1a72",
  "05d9c2fdddddf1aac695441ed25c16710c9536c005eeb328acfc1de9ce028cd8",
  "f049b47940b7803ed92f57ebb1841513b5f189847760846080eade0b2d3e2a61",
  "4e65e73d1565458534e141f0f476b950bae132fda3913e7769bf82bf0fe0161c",
  "7777d8266204e954d6f944656534e6becdc99dd79cee9dee0d6367621b3fa68f",
  "80dd56cc2dd4284055b7df6f3b97c49b0fee747aea22c51e8dd7fb9b6fcb5e5c",
  "f2659170ec1d922eb71066e41a4bd668cd78ea10fcaa28dee8098646a1d6b6e7",
  "1a7877ef9604c01cc512a4d3e1ce4475f2ccd9da56ab0facf0939776a7994863",
  "4a4ca1340311adb4940e591bc60132a51cafc434a5d4a7f8e5e77051e3367173",
  "fcaf66e79a282a3cc0a5d5b931dd58fed4ce59aea72153b70f65ea0693ca127f",
  "cace3fff35a8b654459ec0f9ff8ac472edd19eb77dec38987132902d4eeb1f5f",
  "d8f741938eed58bf10c9d56b44aa6bab2defd9cede552cc24c6ea3f65551dabb",
  "5d1fa712f1172f6b4393424e87d554b4fd2452874b91ba55860cb85f645ca993",
]);

export const EXPECTED_WAVE_SHA256 = Object.freeze([
  "3793df170457ccb3cffb40ab1ec25beed0e32de432e7aae4f8665a77314e53e7",
  "cbc563f1726aabfb364ff7d8c89d1c251fae1623a3560576243e2d27c60f08a3",
  "8fa98fdc09987efb00a883bb56e97412861251494308e9cba43da0f8571a36eb",
  "cb98d054be93314758f6b4e94070d9b02371219ef6b9dff4d7b2279c5742d67e",
]);

const FALSE_AUTHORITY_KEYS = Object.freeze([
  "installGrantPresent",
  "connectorGrantPresent",
  "providerGrantPresent",
  "cloudflareMutationGrantPresent",
  "liveSendGrantPresent",
]);

const FALSE_PROOF_KEYS = Object.freeze([
  "cloned",
  "installed",
  "postinstallRan",
  "modelDownloaded",
  "modelInvoked",
  "mcpStarted",
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

const FALSE_COMPONENT_KEYS = Object.freeze(["installReady", "canClone", "canInstall", "canRun", "canConnect"]);

export class ExternalComponentIntakeError extends Error {
  constructor(message) {
    super(`External component intake rejected: ${message}`);
    this.name = "ExternalComponentIntakeError";
  }
}

function fail(message) {
  throw new ExternalComponentIntakeError(message);
}

export function assertPlainJsonGraph(value, label = "value", seen = new WeakSet()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${label} contains a non-finite number`);
    return;
  }
  if (typeof value !== "object") fail(`${label} contains a non-JSON value`);
  if (utilTypes.isProxy(value)) fail(`${label} contains a Proxy`);
  if (seen.has(value)) fail(`${label} contains a cycle or shared object reference`);
  seen.add(value);

  if (Object.getOwnPropertySymbols(value).length > 0) fail(`${label} contains symbol properties`);
  const descriptors = Object.getOwnPropertyDescriptors(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) fail(`${label} has a non-plain array prototype`);
    const names = Object.getOwnPropertyNames(value);
    const expectedNames = [...Array(value.length).keys()].map(String).concat("length");
    if (names.length !== expectedNames.length || names.some((name, index) => name !== expectedNames[index])) {
      fail(`${label} is sparse or has extra array properties`);
    }
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set || !descriptor.enumerable) {
        fail(`${label}[${index}] is not a plain enumerable data property`);
      }
      assertPlainJsonGraph(descriptor.value, `${label}[${index}]`, seen);
    }
    return;
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) fail(`${label} has a non-plain object prototype`);
  for (const name of Object.getOwnPropertyNames(value)) {
    const descriptor = descriptors[name];
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set || !descriptor.enumerable) {
      fail(`${label}.${name} is not a plain enumerable data property`);
    }
    assertPlainJsonGraph(descriptor.value, `${label}.${name}`, seen);
  }
}

export function serializePlainJson(value) {
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

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function safeRelativePath(pathValue) {
  if (typeof pathValue !== "string" || !pathValue || isAbsolute(pathValue) || pathValue.includes("\0")) {
    fail("unsafe repository-relative path");
  }
  if (pathValue.split(/[\\/]/).some((segment) => !segment || segment === "." || segment === "..")) {
    fail(`unsafe path segment: ${pathValue}`);
  }
  return pathValue;
}

export function readCanonicalFile(pathValue) {
  const safePath = safeRelativePath(pathValue);
  const fullPath = join(REPO_ROOT, safePath);
  const canonical = realpathSync(fullPath);
  if (!canonical.startsWith(`${REPO_ROOT}${sep}`) || canonical !== fullPath) {
    fail(`path escapes the repository or is a symlink: ${safePath}`);
  }
  const stat = lstatSync(fullPath);
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`path is not a regular file: ${safePath}`);
  return readFileSync(fullPath);
}

export function parseJsonRejectDuplicateKeys(input, label = "JSON") {
  const source = Buffer.isBuffer(input) ? input.toString("utf8") : String(input);
  let cursor = 0;

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

  function parseArray() {
    cursor += 1;
    skipWhitespace();
    if (source[cursor] === "]") {
      cursor += 1;
      return;
    }
    while (cursor < source.length) {
      parseValue();
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

  function parseObject() {
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
      parseValue();
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

  function parseValue() {
    skipWhitespace();
    if (source[cursor] === "{") parseObject();
    else if (source[cursor] === "[") parseArray();
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

function countBy(values, selector) {
  return Object.fromEntries(
    [...values.reduce((counts, value) => {
      const key = selector(value);
      counts.set(key, (counts.get(key) || 0) + 1);
      return counts;
    }, new Map()).entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function validateCatalogShape(catalog, schema) {
  assertPlainJsonGraph(catalog, "catalog");
  assertPlainJsonGraph(schema, "schema");
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  if (!validateSchema(catalog)) fail(`schema validation failed: ${JSON.stringify(validateSchema.errors)}`);

  const expectedIds = EXPECTED_COMPONENTS.map(([id]) => id);
  assertExactArray(catalog.components.map(({ id }) => id), expectedIds, "component IDs");
  assertExactArray(catalog.licensePolicy.allowedSpdx, ["Apache-2.0", "MIT"], "allowed licenses");
  assertExactArray(catalog.installWaves.map(({ wave }) => wave), [0, 1, 2, 3], "install waves");

  if (catalog.baseline.freeDiskKiB >= catalog.baseline.workloadFloorKiB) {
    fail("resource baseline no longer supports HOLD_BELOW_15_GIB; collect and review a fresh packet");
  }
  if (catalog.baseline.resourceAdmission !== "HOLD_BELOW_15_GIB") fail("resource admission promoted");
  assertAllFalse(catalog.authority, FALSE_AUTHORITY_KEYS, "authority");
  assertAllFalse(catalog.proofFlags, FALSE_PROOF_KEYS, "proof");

  const componentIds = new Set(expectedIds);
  for (let index = 0; index < catalog.components.length; index += 1) {
    const component = catalog.components[index];
    const [expectedId, expectedPublisher, expectedSource, expectedDisposition] = EXPECTED_COMPONENTS[index];
    if (component.id !== expectedId || component.publisher !== expectedPublisher || component.sourceUrl !== expectedSource) {
      fail(`official identity drift: ${expectedId}`);
    }
    if (component.disposition !== expectedDisposition) fail(`disposition drift: ${expectedId}`);
    if (sha256(Buffer.from(serializePlainJson(component))) !== EXPECTED_COMPONENT_SHA256[index]) {
      fail(`component semantic digest drift: ${expectedId}`);
    }
    assertAllFalse(component, FALSE_COMPONENT_KEYS, `component ${expectedId}`);
    if (!component.sourceUrl.startsWith("https://")) fail(`non-HTTPS source: ${expectedId}`);
    if (component.officialSources.some((source) => !source.startsWith("https://"))) {
      fail(`non-HTTPS official source: ${expectedId}`);
    }

    if (component.permissiveLicenseVerified) {
      if (!component.licenseEvidenceUrl) fail(`missing license evidence: ${expectedId}`);
      if (component.licenseSpdx.includes("UNKNOWN")) fail(`unknown license marked verified: ${expectedId}`);
      for (const license of component.licenseSpdx) {
        if (!catalog.licensePolicy.allowedSpdx.includes(license)) fail(`disallowed license: ${expectedId}`);
      }
    } else if (
      component.disposition !== "HOLD_ARTIFACT_LICENSE" ||
      !component.licenseSpdx.includes("UNKNOWN") ||
      component.licenseEvidenceUrl !== null
    ) {
      fail(`unknown-license component not held closed: ${expectedId}`);
    }
  }

  for (let index = 0; index < catalog.installWaves.length; index += 1) {
    const wave = catalog.installWaves[index];
    if (wave.state !== "HOLD") fail(`install wave promoted: ${wave.wave}`);
    if (sha256(Buffer.from(serializePlainJson(wave))) !== EXPECTED_WAVE_SHA256[index]) {
      fail(`install wave semantic digest drift: ${wave.wave}`);
    }
    if (new Set(wave.componentIds).size !== wave.componentIds.length) fail(`duplicate wave component: ${wave.wave}`);
    for (const id of wave.componentIds) {
      if (!componentIds.has(id)) fail(`unknown wave component: ${id}`);
    }
  }

  const byId = new Map(catalog.components.map((component) => [component.id, component]));
  if (byId.get("a2a-javascript-sdk").selectedRevision !== "v0.3.14") fail("A2A stable SDK version drift");
  if (byId.get("a2a-javascript-sdk").disposition !== "HOLD_PROTOCOL_VERSION") fail("A2A version mismatch removed");
  if (byId.get("cloudflare-api-code-mode-mcp").overlapDecision !== "DO_NOT_ADD_OVERLAP") {
    fail("broad Cloudflare API MCP quarantine removed");
  }
  if (byId.get("line-bot-mcp-server").disposition !== "EXCLUDE_OVERLAP") fail("LINE broad MCP quarantine removed");
  if (byId.get("qwen35-2b-local").disposition !== "QUARANTINE_UNPINNED") fail("local Qwen provenance quarantine removed");
  if (byId.get("glm-52").resourceFit.fitsEightGiBHost !== false) fail("GLM resource rejection removed");
  if (byId.get("kimi-k3").resourceFit.fitsEightGiBHost !== false) fail("Kimi K3 resource rejection removed");

  return {
    status: "STATIC_CATALOG_VALIDATED_NOT_ADMITTED",
    claimCeiling: "PRIMARY_SOURCE_RESEARCH_AND_HOLD_ONLY",
    components: catalog.components.length,
    installWaves: catalog.installWaves.length,
    byDisposition: countBy(catalog.components, ({ disposition }) => disposition),
    byCategory: countBy(catalog.components, ({ category }) => category),
    cloned: false,
    installed: false,
    modelDownloaded: false,
    modelInvoked: false,
    mcpConnected: false,
    a2aLive: false,
    providerCalled: false,
    messageSent: false,
    pushed: false,
    merged: false,
    deployed: false,
    productionReady: false,
  };
}

export function validateCanonicalExternalComponentIntake() {
  const catalogBytes = readCanonicalFile(CATALOG_PATH);
  const schemaBytes = readCanonicalFile(SCHEMA_PATH);
  if (sha256(catalogBytes) !== EXPECTED_CATALOG_SHA256) fail("catalog byte digest drift");
  if (sha256(schemaBytes) !== EXPECTED_SCHEMA_SHA256) fail("schema byte digest drift");
  const catalog = parseJsonRejectDuplicateKeys(catalogBytes, "catalog");
  const schema = parseJsonRejectDuplicateKeys(schemaBytes, "schema");
  return validateCatalogShape(catalog, schema);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(`${JSON.stringify(validateCanonicalExternalComponentIntake(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
