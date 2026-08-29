import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CATALOG_PATH,
  EXPECTED_CATALOG_SHA256,
  EXPECTED_COMPONENTS,
  EXPECTED_SCHEMA_SHA256,
  ExternalComponentIntakeError,
  SCHEMA_PATH,
  parseJsonRejectDuplicateKeys,
  readCanonicalFile,
  sha256,
  validateCanonicalExternalComponentIntake,
  validateCatalogShape,
} from "./validate-external-component-intake.mjs";

function readJson(path) {
  return JSON.parse(readCanonicalFile(path).toString("utf8"));
}

function cloneCatalog() {
  return structuredClone(readJson(CATALOG_PATH));
}

const schema = readJson(SCHEMA_PATH);

function expectRejected(mutator, pattern) {
  const catalog = cloneCatalog();
  mutator(catalog);
  assert.throws(() => validateCatalogShape(catalog, schema), pattern);
}

test("canonical catalog validates only primary-source research and HOLD state", () => {
  const result = validateCanonicalExternalComponentIntake();
  assert.deepEqual(
    {
      status: result.status,
      claimCeiling: result.claimCeiling,
      components: result.components,
      installWaves: result.installWaves,
      cloned: result.cloned,
      installed: result.installed,
      modelDownloaded: result.modelDownloaded,
      modelInvoked: result.modelInvoked,
      mcpConnected: result.mcpConnected,
      a2aLive: result.a2aLive,
      providerCalled: result.providerCalled,
      messageSent: result.messageSent,
      pushed: result.pushed,
      merged: result.merged,
      deployed: result.deployed,
      productionReady: result.productionReady,
    },
    {
      status: "STATIC_CATALOG_VALIDATED_NOT_ADMITTED",
      claimCeiling: "PRIMARY_SOURCE_RESEARCH_AND_HOLD_ONLY",
      components: 26,
      installWaves: 4,
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
    },
  );
});

test("review pins bind the exact catalog and schema bytes", () => {
  assert.equal(sha256(readCanonicalFile(CATALOG_PATH)), EXPECTED_CATALOG_SHA256);
  assert.equal(sha256(readCanonicalFile(SCHEMA_PATH)), EXPECTED_SCHEMA_SHA256);
});

test("duplicate JSON keys are rejected before parser normalization", () => {
  assert.throws(
    () => parseJsonRejectDuplicateKeys('{"status":"hold","status":"open"}', "fixture"),
    /duplicate key "status"/,
  );
});

test("schema and manual checks reject every authority, proof, and execution promotion", () => {
  for (const key of Object.keys(cloneCatalog().authority).filter((key) => key.endsWith("Present"))) {
    expectRejected((catalog) => {
      catalog.authority[key] = true;
    }, new RegExp(`authority flag promoted: ${key}|must be equal to constant`));
  }

  for (const key of Object.keys(cloneCatalog().proofFlags)) {
    expectRejected((catalog) => {
      catalog.proofFlags[key] = true;
    }, new RegExp(`proof flag promoted: ${key}|must be equal to constant`));
  }

  for (const key of ["installReady", "canClone", "canInstall", "canRun", "canConnect"]) {
    expectRejected((catalog) => {
      catalog.components[0][key] = true;
    }, new RegExp(`component cloudflare-agents flag promoted: ${key}|must be equal to constant`));
  }
});

test("component membership, publisher identity, source, and disposition are closed", () => {
  expectRejected((catalog) => {
    catalog.components.pop();
  }, /component IDs order or membership drift/);
  expectRejected((catalog) => {
    [catalog.components[0], catalog.components[1]] = [catalog.components[1], catalog.components[0]];
  }, /component IDs order or membership drift/);
  expectRejected((catalog) => {
    catalog.components[0].publisher = "lookalike";
  }, /official identity drift/);
  expectRejected((catalog) => {
    catalog.components[0].sourceUrl = "https://github.com/lookalike/agents";
  }, /official identity drift/);
  expectRejected((catalog) => {
    catalog.components[1].disposition = "CANDIDATE_AUTHORITY_HELD";
  }, /disposition drift/);
  assert.equal(EXPECTED_COMPONENTS.length, 26);
});

test("license gate rejects unknown promotion and missing publisher evidence", () => {
  expectRejected((catalog) => {
    const kimi = catalog.components.find(({ id }) => id === "kimi-k3");
    kimi.permissiveLicenseVerified = true;
  }, /component semantic digest drift|must be string|unknown license marked verified|missing license evidence/);
  expectRejected((catalog) => {
    const codex = catalog.components.find(({ id }) => id === "openai-codex-cli");
    codex.licenseEvidenceUrl = null;
  }, /component semantic digest drift|missing license evidence/);
  expectRejected((catalog) => {
    const codex = catalog.components.find(({ id }) => id === "openai-codex-cli");
    codex.licenseSpdx = ["UNKNOWN"];
  }, /component semantic digest drift|unknown license marked verified/);

  expectRejected((catalog) => {
    const kimi = catalog.components.find(({ id }) => id === "kimi-k3");
    kimi.licenseSpdx = ["MIT"];
    kimi.licenseEvidenceUrl = "https://attacker.invalid/LICENSE";
    kimi.permissiveLicenseVerified = true;
    kimi.sourceVerification = "PRIMARY_SOURCE_VERIFIED";
    kimi.revisionPolicy = "PIN_EXACT_STABLE_RELEASE";
    kimi.selectedRevision = "v999";
    kimi.requiredTickets = [];
  }, /component semantic digest drift/);

  expectRejected((catalog) => {
    const kimi = catalog.components.find(({ id }) => id === "kimi-k3");
    const original = structuredClone(kimi);
    kimi.licenseSpdx = ["MIT"];
    kimi.licenseEvidenceUrl = "https://attacker.invalid/LICENSE";
    kimi.permissiveLicenseVerified = true;
    kimi.sourceVerification = "PRIMARY_SOURCE_VERIFIED";
    Object.setPrototypeOf(kimi, { toJSON: () => original });
  }, /non-plain object prototype/);

  const pollutedCatalog = cloneCatalog();
  const pollutedKimi = pollutedCatalog.components.find(({ id }) => id === "kimi-k3");
  const originalKimi = structuredClone(pollutedKimi);
  pollutedKimi.licenseSpdx = ["MIT"];
  pollutedKimi.licenseEvidenceUrl = "https://attacker.invalid/LICENSE";
  pollutedKimi.permissiveLicenseVerified = true;
  pollutedKimi.sourceVerification = "PRIMARY_SOURCE_VERIFIED";
  const priorToJson = Object.getOwnPropertyDescriptor(Object.prototype, "toJSON");
  const maskedObjects = new WeakMap([[pollutedKimi, originalKimi]]);
  Object.defineProperty(Object.prototype, "toJSON", {
    configurable: true,
    value() {
      return maskedObjects.get(this) || this;
    }
  });
  try {
    assert.throws(
      () => validateCatalogShape(pollutedCatalog, schema),
      /component semantic digest drift: kimi-k3/,
    );
  } finally {
    if (priorToJson) Object.defineProperty(Object.prototype, "toJSON", priorToJson);
    else delete Object.prototype.toJSON;
  }
});

test("A2A mismatch and broad Cloudflare and LINE MCP quarantines cannot be relabeled", () => {
  expectRejected((catalog) => {
    catalog.components.find(({ id }) => id === "a2a-javascript-sdk").selectedRevision = "v1.0.0-beta.0";
  }, /component semantic digest drift|A2A stable SDK version drift/);
  expectRejected((catalog) => {
    catalog.components.find(({ id }) => id === "a2a-javascript-sdk").disposition = "CANDIDATE_AUTHORITY_HELD";
  }, /disposition drift|A2A version mismatch removed/);
  expectRejected((catalog) => {
    catalog.components.find(({ id }) => id === "cloudflare-api-code-mode-mcp").overlapDecision = "FILL_GAP";
  }, /component semantic digest drift|broad Cloudflare API MCP quarantine removed/);
  expectRejected((catalog) => {
    catalog.components.find(({ id }) => id === "line-bot-mcp-server").disposition = "CANDIDATE_AUTHORITY_HELD";
  }, /disposition drift|LINE broad MCP quarantine removed/);

  expectRejected((catalog) => {
    const line = catalog.components.find(({ id }) => id === "line-bot-mcp-server");
    line.overlapDecision = "FILL_GAP";
    line.installationState = "NOT_INSTALLED";
    line.requiredTickets = [];
    catalog.installWaves[1].componentIds.push(line.id);
    catalog.installWaves[1].entryCriteria = ["No resource floor required"];
  }, /component semantic digest drift|install wave semantic digest drift/);

  expectRejected((catalog) => {
    catalog.components.find(({ id }) => id === "a2a-specification").selectedRevision = "unreviewed";
  }, /component semantic digest drift/);

  expectRejected((catalog) => {
    catalog.components.find(({ id }) => id === "a2a-rust-sdk").selectedRevision = "0000000000000000000000000000000000000000";
  }, /component semantic digest drift/);
});

test("model resource and provenance holds cannot be promoted", () => {
  expectRejected((catalog) => {
    catalog.components.find(({ id }) => id === "glm-52").resourceFit.fitsEightGiBHost = true;
  }, /component semantic digest drift|GLM resource rejection removed/);
  expectRejected((catalog) => {
    catalog.components.find(({ id }) => id === "kimi-k3").resourceFit.fitsEightGiBHost = true;
  }, /component semantic digest drift|Kimi K3 resource rejection removed/);
  expectRejected((catalog) => {
    catalog.components.find(({ id }) => id === "qwen35-2b-local").disposition = "CANDIDATE_RESOURCE_HELD";
  }, /disposition drift|local Qwen provenance quarantine removed/);

  expectRejected((catalog) => {
    const qwen = catalog.components.find(({ id }) => id === "qwen35-2b-local");
    qwen.sourceVerification = "PRIMARY_SOURCE_VERIFIED";
    qwen.selectedRevision = "claimed-revision";
    qwen.selectedArtifact = "claimed-digest";
  }, /component semantic digest drift/);
});

test("resource HOLD and install-wave membership are closed", () => {
  expectRejected((catalog) => {
    catalog.baseline.freeDiskKiB = catalog.baseline.workloadFloorKiB;
  }, /resource baseline no longer supports HOLD_BELOW_15_GIB/);
  expectRejected((catalog) => {
    catalog.installWaves[0].state = "READY";
  }, /must be equal to constant|install wave promoted/);
  expectRejected((catalog) => {
    catalog.installWaves[0].componentIds.push("not-cataloged");
  }, /install wave semantic digest drift|unknown wave component/);
  expectRejected((catalog) => {
    catalog.installWaves[0].componentIds.push(catalog.installWaves[0].componentIds[0]);
  }, /must NOT have duplicate items|duplicate wave component/);
  expectRejected((catalog) => {
    catalog.installWaves[1].componentIds = [];
  }, /must NOT have fewer than 1 items|install wave semantic digest drift/);
  expectRejected((catalog) => {
    catalog.installWaves[1].entryCriteria = ["skip resource and authority checks"];
  }, /install wave semantic digest drift/);
  expectRejected((catalog) => {
    const wave = catalog.installWaves[1];
    const original = structuredClone(wave);
    wave.componentIds.push("line-bot-mcp-server");
    wave.entryCriteria = ["No resource floor required"];
    Object.setPrototypeOf(wave, { toJSON: () => original });
  }, /non-plain object prototype/);
  expectRejected((catalog) => {
    const component = catalog.components[0];
    Object.defineProperty(component, "sourceUrl", {
      enumerable: true,
      get: () => "https://attacker.invalid/source"
    });
  }, /not a plain enumerable data property/);
  expectRejected((catalog) => {
    catalog.components[0][Symbol("hidden-capability")] = "enabled";
  }, /symbol properties/);
  expectRejected((catalog) => {
    catalog.components[1].resourceFit = catalog.components[0].resourceFit;
  }, /cycle or shared object reference/);
  expectRejected((catalog) => {
    const target = catalog.components[0];
    target.sourceUrl = "https://attacker.invalid/source";
    catalog.components[0] = new Proxy(target, {
      get(object, property, receiver) {
        if (property === "sourceUrl") return "https://github.com/cloudflare/agents";
        return Reflect.get(object, property, receiver);
      }
    });
  }, /contains a Proxy/);

  const proxyCatalog = cloneCatalog();
  let proxyGets = 0;
  proxyCatalog.installWaves[1] = new Proxy(proxyCatalog.installWaves[1], {
    get(object, property, receiver) {
      proxyGets += 1;
      return Reflect.get(object, property, receiver);
    }
  });
  assert.throws(() => validateCatalogShape(proxyCatalog, schema), /contains a Proxy/);
  assert.equal(proxyGets, 0, "proxy traps must not run before rejection");
});

test("validator has an exact static import allowlist and no dynamic capability loader", () => {
  const source = readFileSync(new URL("./validate-external-component-intake.mjs", import.meta.url), "utf8");
  const importStatements = source.match(/^import .*;$/gm);
  assert.deepEqual(importStatements, [
    'import { createHash } from "node:crypto";',
    'import { lstatSync, readFileSync, realpathSync } from "node:fs";',
    'import { dirname, isAbsolute, join, resolve, sep } from "node:path";',
    'import { fileURLToPath } from "node:url";',
    'import { types as utilTypes } from "node:util";',
    'import Ajv2020 from "ajv/dist/2020.js";',
    'import addFormats from "ajv-formats";',
  ]);
  assert.deepEqual(source.match(/readFileSync\([^)]*\)/g), ["readFileSync(fullPath)"]);
  for (const forbidden of [
    /node:child_process/,
    /node:(?:http|https|net|tls|dns|dgram|worker_threads)/,
    /\bundici\b/,
    /\bspawn\s*\(/,
    /\bexec(?:File|Sync)?\s*\(/,
    /\bfetch\s*\(/,
    /\bimport\s*\(/,
    /\brequire\s*\(/,
    /\beval\s*\(/,
    /\bFunction\s*\(/,
    /process\.env/,
    /process\.(?:binding|dlopen|mainModule)/,
    /DATABASE_URL/,
    /\b(?:writeFile|appendFile|rm|unlink|rename|mkdir|readdir|open)Sync\s*\(/,
    /wrangler/,
    /ollama\s+pull/,
    /hermes\/auth\.json/,
    /hermes\/config\.yaml/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test("canonical file reader rejects traversal", () => {
  assert.throws(() => readCanonicalFile("../.env"), ExternalComponentIntakeError);
});
