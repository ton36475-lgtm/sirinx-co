import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import {
  EFFECT_AUTHORITY_MIGRATION_CIRCUIT_ROWS,
  EFFECT_AUTHORITY_MIGRATION_REGISTRY_DEFINITIONS,
  EFFECT_AUTHORITY_MIGRATION_SEMANTICS_PACKET_DIGEST,
  EFFECT_AUTHORITY_MIGRATION_SEMANTICS_SCHEMA_URL,
  EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS,
  computeEffectAuthorityManifestDigest,
  computeEffectAuthorityMigrationSemanticsDigest,
  validateEffectAuthorityRegistrySourceV1,
  validateEffectAuthorityMigrationSemanticsV1,
  validateEffectAuthorityMigrationSourceFilesV1
} from "./effect-authority-migration-semantics.mjs";

const ROOT = new URL("../../../", import.meta.url);
const PACKET_URL = new URL(
  "config/agent-runtime/effect-authority-migration.semantics.plan-only.v1.json",
  ROOT
);
const MIGRATION_0007_URL = new URL(
  "crates/sirinx-store/migrations/0007_agent_runtime_effect_authority.sql",
  ROOT
);
const clone = (value) => JSON.parse(JSON.stringify(value));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function canonicalPacket() {
  return JSON.parse(await readFile(PACKET_URL, "utf8"));
}

async function canonicalSourceFiles() {
  const paths = [
    EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.actionRegistry.path,
    EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.actionRegistry.schemaPath,
    ...EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.previousMigrations.map((entry) => entry.path)
  ];
  return Object.fromEntries(await Promise.all(paths.map(async (path) => [
    path,
    await readFile(new URL(path, ROOT), "utf8")
  ])));
}

function expectDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const entry of Object.values(value)) expectDeepFrozen(entry, seen);
}

function expectInvalid(packet, sourceFiles, pattern = /^invalid_effect_authority_migration_semantics:/) {
  expect(() => validateEffectAuthorityMigrationSemanticsV1(packet, { sourceFiles })).toThrow(pattern);
}

describe("effect authority migration 0007 frozen semantics", () => {
  it("validates the canonical plan without implementing or applying migration 0007", async () => {
    const packet = await canonicalPacket();
    const sourceFiles = await canonicalSourceFiles();
    const validated = validateEffectAuthorityMigrationSemanticsV1(packet, { sourceFiles });

    expect(validated).not.toBe(packet);
    expect(validated).toEqual(packet);
    expect(validated.status).toBe("MIGRATION_0007_SEMANTICS_FROZEN_NOT_IMPLEMENTED");
    expect(validated.migration).toEqual({
      filename: "0007_agent_runtime_effect_authority.sql",
      state: "DEFERRED",
      mode: "SINGLE_SHARED_ADDITIVE_AUTHORITY_KERNEL",
      filePresent: false,
      appliesDatabaseChanges: false
    });
    expect(packet.packetDigest).toBe(EFFECT_AUTHORITY_MIGRATION_SEMANTICS_PACKET_DIGEST);
    expect(packet.packetDigest).toBe(computeEffectAuthorityMigrationSemanticsDigest(packet));
    expect(Object.values(packet.authority).every((value) => value === false)).toBe(true);
    expect(Object.values(packet.effects).every((value) => value === false)).toBe(true);
    await expect(access(MIGRATION_0007_URL)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("returns a distinct deeply frozen clone that cannot be promoted", async () => {
    const packet = await canonicalPacket();
    const validated = validateEffectAuthorityMigrationSemanticsV1(packet, {
      sourceFiles: await canonicalSourceFiles()
    });

    expect(validated.installation).not.toBe(packet.installation);
    expect(validated.installation.registryDefinitionRows[0]).not.toBe(
      packet.installation.registryDefinitionRows[0]
    );
    expectDeepFrozen(validated);
    expect(() => { validated.authority.canExecute = true; }).toThrow(TypeError);
    expect(() => { validated.installation.circuitRows[0].state = "OPEN"; }).toThrow(TypeError);
    expect(validated.authority.canExecute).toBe(false);
    expect(validated.installation.circuitRows[0].state).toBe("HOLD");
  });

  it("strictly compiles the closed Draft 2020-12 schema", async () => {
    const require = createRequire(import.meta.url);
    const Ajv2020 = require("ajv/dist/2020.js").default;
    const formatsModule = require("ajv-formats");
    const addFormats = formatsModule.default ?? formatsModule;
    const schema = JSON.parse(await readFile(EFFECT_AUTHORITY_MIGRATION_SEMANTICS_SCHEMA_URL, "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const packet = await canonicalPacket();

    expect(validate(packet), JSON.stringify(validate.errors)).toBe(true);
    for (const mutate of [
      (value) => { value.unexpected = true; },
      (value) => { value.installation.registryDefinitionRows[0].unexpected = true; },
      (value) => { value.installation.circuitRows[0].state = "OPEN"; },
      (value) => { value.seedCounts.tickets = 1; },
      (value) => { value.bootstrapAuthority.kernelCanAuthorizeOwnInstall = true; }
    ]) {
      const candidate = clone(packet);
      mutate(candidate);
      expect(validate(candidate)).toBe(false);
    }
  });

  it("reads and verifies the exact registry, schema, migrations, and 13-row manifest", async () => {
    const sourceFiles = await canonicalSourceFiles();
    const registryPin = EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.actionRegistry;
    const registry = JSON.parse(sourceFiles[registryPin.path]);

    expect(validateEffectAuthorityMigrationSourceFilesV1(sourceFiles)).toBe(true);
    expect(sha256(sourceFiles[registryPin.path])).toBe(registryPin.sha256);
    expect(sha256(sourceFiles[registryPin.schemaPath])).toBe(registryPin.schemaSha256);
    expect(computeEffectAuthorityManifestDigest(registry)).toBe(registryPin.manifestDigest);
    expect(registry.bindings).toHaveLength(13);
    expect(registry.bindings.map((row) => ({ ...row, version: 1 }))).toEqual(
      EFFECT_AUTHORITY_MIGRATION_REGISTRY_DEFINITIONS
    );
    expect(registry.bindings.every((row) =>
      row.circuitState === "HOLD" &&
      row.effectState === "PREPARED" &&
      row.enabled === false &&
      row.executorAvailable === false &&
      row.routeRegistered === false
    )).toBe(true);
  });

  it("refuses to validate a packet without the exact pinned source bytes", async () => {
    const packet = await canonicalPacket();
    expect(() => validateEffectAuthorityMigrationSemanticsV1(packet)).toThrow(
      /source_files_required/
    );

    const sourceFiles = await canonicalSourceFiles();
    const registryPath = EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.actionRegistry.path;
    const malformedRegistry = clone(sourceFiles);
    const registry = JSON.parse(malformedRegistry[registryPath]);
    registry.bindings = null;
    malformedRegistry[registryPath] = JSON.stringify(registry);
    expect(() => validateEffectAuthorityMigrationSourceFilesV1(malformedRegistry)).toThrow(
      /source_registry_sha256_drift/
    );

    const registryWithInternalVersion = JSON.parse(sourceFiles[registryPath]);
    registryWithInternalVersion.bindings[0].version = 1;
    expect(() => validateEffectAuthorityRegistrySourceV1(registryWithInternalVersion)).toThrow(
      /source_registry_binding_0_must_be_closed/
    );
  });

  it("requires all 13 definitions and circuits; cleanup is one member, not its own ledger", async () => {
    const packet = await canonicalPacket();
    const sourceFiles = await canonicalSourceFiles();

    expect(packet.installation.registryDefinitionRows).toHaveLength(13);
    expect(packet.installation.circuitRows).toHaveLength(13);
    expect(packet.installation.registryDefinitionRows).toEqual(
      EFFECT_AUTHORITY_MIGRATION_REGISTRY_DEFINITIONS
    );
    expect(packet.installation.circuitRows).toEqual(EFFECT_AUTHORITY_MIGRATION_CIRCUIT_ROWS);
    expect(packet.installation.registryDefinitionRows.filter(
      (row) => row.actionKind === "RESOURCE_CLEANUP"
    )).toHaveLength(1);
    expect(packet.installation.resourceCleanup.separateLedger).toBe(false);

    const cleanupOnly = clone(packet);
    cleanupOnly.installation.registryDefinitionRows = [
      clone(packet.installation.registryDefinitionRows[1])
    ];
    cleanupOnly.installation.circuitRows = [clone(packet.installation.circuitRows[1])];
    cleanupOnly.seedCounts.registryDefinitionRows = 1;
    cleanupOnly.seedCounts.circuitRows = 1;
    expectInvalid(cleanupOnly, sourceFiles, /registry_definition_rows_must_have_13_rows/);
  });

  it("rejects every OPEN, enablement, route, or executor promotion", async () => {
    const packet = await canonicalPacket();
    const sourceFiles = await canonicalSourceFiles();
    const mutations = [
      (value) => { value.installation.registryDefinitionRows[0].circuitState = "OPEN"; },
      (value) => { value.installation.registryDefinitionRows[1].enabled = true; },
      (value) => { value.installation.registryDefinitionRows[2].routeRegistered = true; },
      (value) => { value.installation.registryDefinitionRows[3].executorAvailable = true; },
      (value) => { value.installation.circuitRows[4].state = "OPEN"; },
      (value) => { value.installation.circuitRows[5].activeGrantId = "GRANT-forbidden"; },
      (value) => { value.seedCounts.openCircuits = 1; },
      (value) => { value.seedCounts.routes = 1; },
      (value) => { value.seedCounts.executorRegistrations = 1; },
      (value) => { value.laterCanary.circuitOpenedByEligibility = true; },
      (value) => { value.laterCanary.executorRegisteredByEligibility = true; }
    ];
    for (const mutate of mutations) {
      const candidate = clone(packet);
      mutate(candidate);
      expectInvalid(candidate, sourceFiles);
    }
  });

  it("rejects every authority-bearing seed", async () => {
    const packet = await canonicalPacket();
    const sourceFiles = await canonicalSourceFiles();
    for (const key of [
      "tickets",
      "grants",
      "attestations",
      "outbox",
      "admissions",
      "openCircuits",
      "loginRoles",
      "executorRegistrations",
      "routes"
    ]) {
      const candidate = clone(packet);
      candidate.seedCounts[key] = 1;
      expectInvalid(candidate, sourceFiles, new RegExp(`seed_${key}_must_remain_zero`));
    }
  });

  it("rejects every authority or effect flag promotion", async () => {
    const packet = await canonicalPacket();
    const sourceFiles = await canonicalSourceFiles();
    for (const section of ["authority", "effects"]) {
      for (const key of Object.keys(packet[section])) {
        const candidate = clone(packet);
        candidate[section][key] = true;
        expectInvalid(candidate, sourceFiles, new RegExp(`${section}_${key}_must_remain_false`));
      }
    }
  });

  it("rejects self-authorizing bootstrap and unsafe prerequisite-role semantics", async () => {
    const packet = await canonicalPacket();
    const sourceFiles = await canonicalSourceFiles();
    for (const mutate of [
      (value) => { value.bootstrapAuthority.kernelCanAuthorizeOwnInstall = true; },
      (value) => { value.bootstrapAuthority.bindingComplete = true; },
      (value) => { value.bootstrapAuthority.existingProcess = "NEW_KERNEL_SELF_AUTHORITY"; },
      (value) => { value.bootstrapAuthority.requiredBindings.pop(); },
      (value) => { value.prerequisiteCapabilityRoles.noLoginRequired = false; },
      (value) => { value.prerequisiteCapabilityRoles.leastPrivilegeRequired = false; },
      (value) => { value.prerequisiteCapabilityRoles.migrationAbortsIfAbsent = false; },
      (value) => { value.prerequisiteCapabilityRoles.migrationAbortsIfUnsafe = false; },
      (value) => { value.prerequisiteCapabilityRoles.verified = true; },
      (value) => { value.prerequisiteCapabilityRoles.credentialValuesIncluded = true; }
    ]) {
      const candidate = clone(packet);
      mutate(candidate);
      expectInvalid(candidate, sourceFiles);
    }
  });

  it("rejects source hash drift and any missing pinned source file", async () => {
    const sourceFiles = await canonicalSourceFiles();
    const registryPath = EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.actionRegistry.path;
    const drifted = clone(sourceFiles);
    drifted[registryPath] = `${drifted[registryPath]}\n`;
    expect(() => validateEffectAuthorityMigrationSourceFilesV1(drifted)).toThrow(
      /source_registry_sha256_drift/
    );

    for (const path of Object.keys(sourceFiles)) {
      const missing = clone(sourceFiles);
      delete missing[path];
      expect(() => validateEffectAuthorityMigrationSourceFilesV1(missing)).toThrow(
        /source_files_must_be_closed/
      );
    }
  });

  it("rejects unknown keys, source-pin drift, and packet-digest drift", async () => {
    const packet = await canonicalPacket();
    const sourceFiles = await canonicalSourceFiles();
    const unknown = clone(packet);
    unknown.architecture.rawCredential = "forbidden";
    expectInvalid(unknown, sourceFiles, /architecture_must_be_closed/);

    const sourcePinDrift = clone(packet);
    sourcePinDrift.sourcePins.actionRegistry.sha256 = "f".repeat(64);
    expectInvalid(sourcePinDrift, sourceFiles, /source_pins_action_registry_sha256_drift/);

    const digestDrift = clone(packet);
    digestDrift.packetDigest = "f".repeat(64);
    expectInvalid(digestDrift, sourceFiles, /packet_digest_pin_drift/);
  });
});
