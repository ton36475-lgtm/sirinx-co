import { createHash } from "node:crypto";
import { types as utilTypes } from "node:util";

export const EFFECT_AUTHORITY_MIGRATION_SEMANTICS_SCHEMA_URL = new URL(
  "../../../schemas/agent-runtime/effect-authority-migration-semantics.v1.schema.json",
  import.meta.url
);

export const EFFECT_AUTHORITY_MIGRATION_SEMANTICS_STATUS =
  "MIGRATION_0007_SEMANTICS_FROZEN_NOT_IMPLEMENTED";
export const EFFECT_AUTHORITY_MIGRATION_FILENAME =
  "0007_agent_runtime_effect_authority.sql";
export const EFFECT_AUTHORITY_MIGRATION_MODE =
  "SINGLE_SHARED_ADDITIVE_AUTHORITY_KERNEL";
export const EFFECT_AUTHORITY_MIGRATION_REPOSITORY_BRANCH =
  "agent/b1-b2-command-center";
export const EFFECT_AUTHORITY_MIGRATION_REPOSITORY_HEAD =
  "1f05814c3e9d173e525234d69b3ce7f2d1b01a57";
export const EFFECT_AUTHORITY_MIGRATION_PACKET_DIGEST_DOMAIN =
  "sirinx:effect-authority-migration-semantics:v1";
export const EFFECT_AUTHORITY_MANIFEST_DIGEST_DOMAIN =
  "sirinx:effect-authority-manifest:v1";
export const EFFECT_AUTHORITY_MIGRATION_SEMANTICS_PACKET_DIGEST =
  "ccb4a5afc0a2ee33114859dd777e4ebcd758f03abf92a103f075405c9324fcea";

function freezeLiteral(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const entry of Object.values(value)) freezeLiteral(entry);
    Object.freeze(value);
  }
  return value;
}

export const EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS = freezeLiteral({
  actionRegistry: {
    path: "config/agent-runtime/action-circuits.plan-only.v1.json",
    sha256: "b92c6152dbfa31d27a83e32f2bb567575ffabe75e558fbe7fb6776dbcdee4b01",
    schemaPath: "schemas/agent-runtime/action-circuit-registry.v1.schema.json",
    schemaSha256: "01f9a49f683b175613bc2bb0ff72225d17dc9811c005d7e1d1be7ceeb682b532",
    manifestDigest: "b2421996825817400d31f88757843225403ed2080541812c4db889e1ffe3cbb0"
  },
  previousMigrations: [
    {
      filename: "0005_agent_runtime_core.sql",
      path: "crates/sirinx-store/migrations/0005_agent_runtime_core.sql",
      sha256: "50f19a77ec448932236676c91858a558b60bfadfcb5629649efee02b10531051"
    },
    {
      filename: "0006_agent_runtime_runtime_access.sql",
      path: "crates/sirinx-store/migrations/0006_agent_runtime_runtime_access.sql",
      sha256: "22c17ea3fdca3675630ba0a18c127a63e822852ea0013241445a41a2494bc56b"
    }
  ]
});

const registryDefinition = (
  actionKind,
  circuitName,
  effectProfile,
  actionClass,
  executorRole
) => ({
  actionKind,
  circuitName,
  effectProfile,
  actionClass,
  approvalSchemaVersion: "2.0",
  executorRole,
  circuitState: "HOLD",
  effectState: "PREPARED",
  enabled: false,
  executorAvailable: false,
  routeRegistered: false,
  version: 1
});

export const EFFECT_AUTHORITY_MIGRATION_REGISTRY_DEFINITIONS = freezeLiteral([
  registryDefinition("INSTALL", "install", "INSTALL", "D", "sirinx_agent_runtime_install_executor"),
  registryDefinition("RESOURCE_CLEANUP", "resource_cleanup", "RESOURCE_CLEANUP", "C", "sirinx_agent_runtime_resource_cleanup_executor"),
  registryDefinition("CONNECTOR_ACTIVATION", "connector_activation", "CONNECTOR_ACTIVATION", "D", "sirinx_agent_runtime_connector_activation_executor"),
  registryDefinition("PROVIDER_CALL", "provider_call", "PROVIDER_CALL", "D", "sirinx_agent_runtime_provider_call_executor"),
  registryDefinition("QUEUE_MUTATION", "queue_mutation", "QUEUE_MUTATION", "D", "sirinx_agent_runtime_queue_mutation_executor"),
  registryDefinition("A2A_EGRESS", "a2a_egress", "A2A_EGRESS", "D", "sirinx_agent_runtime_a2a_egress_executor"),
  registryDefinition("LIVE_SEND", "telegram_send", "TELEGRAM", "D", "sirinx_agent_runtime_telegram_send_executor"),
  registryDefinition("LIVE_SEND", "customer_messaging", "CUSTOMER_MESSAGING", "D", "sirinx_agent_runtime_customer_messaging_executor"),
  registryDefinition("PUSH", "push", "PUSH", "D", "sirinx_agent_runtime_push_executor"),
  registryDefinition("MERGE", "merge", "MERGE", "D", "sirinx_agent_runtime_merge_executor"),
  registryDefinition("PRODUCTION_MIGRATION", "production_migration", "PRODUCTION_MIGRATION", "D", "sirinx_agent_runtime_production_migration_executor"),
  registryDefinition("CLOUDFLARE_MUTATION", "cloudflare_mutation", "CLOUDFLARE_MUTATION", "D", "sirinx_agent_runtime_cloudflare_mutation_executor"),
  registryDefinition("DEPLOY", "deploy", "DEPLOY", "D", "sirinx_agent_runtime_deploy_executor")
]);

export const EFFECT_AUTHORITY_MIGRATION_CIRCUIT_ROWS = freezeLiteral(
  EFFECT_AUTHORITY_MIGRATION_REGISTRY_DEFINITIONS.map(({ actionKind, circuitName }) => ({
    actionKind,
    circuitName,
    state: "HOLD",
    activeGrantId: null,
    activeActionDigest: null,
    openedByPrincipalId: null,
    openedAt: null,
    expiresAt: null,
    version: 1
  }))
);

export const EFFECT_AUTHORITY_MIGRATION_REQUIRED_BLOCKERS = freezeLiteral([
  "resource_admission_missing",
  "disposable_postgres_proof_missing",
  "bootstrap_ticket_missing",
  "bootstrap_roles_unverified",
  "migration_candidate_absent",
  "independent_review_missing",
  "runtime_inventory_update_missing"
]);

const SHA256 = /^[0-9a-f]{64}$/;
const COMMIT_SHA = /^[0-9a-f]{40}$/;
const MAX_JSON_DEPTH = 64;
const MAX_JSON_NODES = 20_000;
const MAX_JSON_PROPERTIES = 128;
const MAX_JSON_ARRAY_LENGTH = 128;

const TOP_LEVEL_KEYS = [
  "architecture",
  "authority",
  "blockers",
  "bootstrapAuthority",
  "effects",
  "installation",
  "laterCanary",
  "migration",
  "packetDigest",
  "prerequisiteCapabilityRoles",
  "repository",
  "schemaVersion",
  "seedCounts",
  "sourcePins",
  "status"
];
const REPOSITORY_KEYS = ["branch", "headSha"];
const MIGRATION_KEYS = ["appliesDatabaseChanges", "filePresent", "filename", "mode", "state"];
const SOURCE_PINS_KEYS = ["actionRegistry", "previousMigrations"];
const ACTION_REGISTRY_PIN_KEYS = ["manifestDigest", "path", "schemaPath", "schemaSha256", "sha256"];
const PREVIOUS_MIGRATION_KEYS = ["filename", "path", "sha256"];
const INSTALLATION_KEYS = ["circuitRows", "registryDefinitionRows", "resourceCleanup"];
const REGISTRY_DEFINITION_KEYS = [
  "actionClass",
  "actionKind",
  "approvalSchemaVersion",
  "circuitName",
  "circuitState",
  "effectProfile",
  "effectState",
  "enabled",
  "executorAvailable",
  "executorRole",
  "routeRegistered",
  "version"
];
const SOURCE_REGISTRY_BINDING_KEYS = REGISTRY_DEFINITION_KEYS.filter(
  (key) => key !== "version"
);
const CIRCUIT_ROW_KEYS = [
  "actionKind",
  "activeActionDigest",
  "activeGrantId",
  "circuitName",
  "expiresAt",
  "openedAt",
  "openedByPrincipalId",
  "state",
  "version"
];
const RESOURCE_CLEANUP_KEYS = ["membershipCount", "separateLedger"];
const ARCHITECTURE_KEYS = [
  "cleanupOnlyLedgerAdded",
  "genericV2Binding",
  "perActionClosedArtifactsRemainSeparate",
  "preserve0006GenericAppDenial",
  "reuse0005",
  "runtimeInventoryPolicy"
];
const GENERIC_V2_BINDING_KEYS = ["actionIntentBound", "bindingKind", "cleanupOnly", "scopeBound"];
const BOOTSTRAP_AUTHORITY_KEYS = [
  "bindingComplete",
  "existingProcess",
  "kernelCanAuthorizeOwnInstall",
  "requiredBindings"
];
const PREREQUISITE_ROLE_KEYS = [
  "credentialValuesIncluded",
  "leastPrivilegeRequired",
  "migrationAbortsIfAbsent",
  "migrationAbortsIfUnsafe",
  "noLoginRequired",
  "provisioning",
  "verified"
];
const SEED_COUNT_KEYS = [
  "admissions",
  "attestations",
  "circuitRows",
  "executorRegistrations",
  "grants",
  "loginRoles",
  "openCircuits",
  "outbox",
  "registryDefinitionRows",
  "routes",
  "tickets"
];
const LATER_CANARY_KEYS = [
  "circuitOpenedByEligibility",
  "disposablePostgresProofRequired",
  "eligibleAction",
  "eligibleNow",
  "executorRegisteredByEligibility",
  "separateExactEvidenceRequired",
  "separateExactGrantRequired",
  "separateExactTicketRequired"
];
const AUTHORITY_KEYS = [
  "canApplyMigration",
  "canClaimEffect",
  "canExecute",
  "canIssueGrant",
  "canOpenCircuit"
];
const EFFECT_KEYS = [
  "databaseMutationPerformed",
  "externalEffects",
  "rolesCreated",
  "routesRegistered"
];
const REQUIRED_BOOTSTRAP_BINDINGS = [
  "candidateSha",
  "candidateChecksum",
  "target",
  "baseline",
  "rollback",
  "forwardRecovery",
  "operatorIdentity",
  "timeWindow",
  "prerequisiteRoleInventory",
  "prerequisiteRoleSafety",
  "disposableEmptyStateProofReceipt",
  "disposablePriorStateProofReceipt",
  "disposableRlsProofReceipt",
  "disposableRaceProofReceipt",
  "disposableCrashProofReceipt",
  "disposableRestoreProofReceipt",
  "independentReviewReceipt"
];
const REUSED_0005_OBJECTS = [
  "agent_runtime_action_tickets",
  "agent_runtime_approval_grants",
  "agent_runtime_outbox"
];

function fail(code) {
  throw new Error(`invalid_effect_authority_migration_semantics:${code}`);
}

function assertPlainJsonGraph(
  value,
  label = "packet",
  seen = new WeakSet(),
  depth = 0,
  budget = { nodes: 0 }
) {
  if (depth > MAX_JSON_DEPTH) fail(`${label}_exceeds_maximum_depth`);
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${label}_contains_non_finite_number`);
    return;
  }
  if (typeof value !== "object") fail(`${label}_contains_non_json_value`);
  if (utilTypes.isProxy(value)) fail(`${label}_contains_proxy`);
  if (seen.has(value)) fail(`${label}_contains_cycle_or_shared_reference`);
  seen.add(value);
  budget.nodes += 1;
  if (budget.nodes > MAX_JSON_NODES) fail(`${label}_exceeds_node_limit`);

  const names = Object.getOwnPropertyNames(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (names.length > MAX_JSON_PROPERTIES) fail(`${label}_exceeds_property_limit`);
  if (Object.getOwnPropertySymbols(value).length !== 0) fail(`${label}_contains_symbol_property`);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) fail(`${label}_array_prototype`);
    if (value.length > MAX_JSON_ARRAY_LENGTH) fail(`${label}_exceeds_array_limit`);
    if (
      names.length !== value.length + 1 ||
      names[names.length - 1] !== "length" ||
      names.slice(0, -1).some((name, index) => name !== String(index))
    ) fail(`${label}_sparse_or_extended_array`);
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set || !descriptor.enumerable) {
        fail(`${label}_${index}_not_plain_data`);
      }
      assertPlainJsonGraph(descriptor.value, `${label}_${index}`, seen, depth + 1, budget);
    }
    return;
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) fail(`${label}_object_prototype`);
  for (const name of names) {
    const descriptor = descriptors[name];
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set || !descriptor.enumerable) {
      fail(`${label}_${name}_not_plain_data`);
    }
    assertPlainJsonGraph(descriptor.value, `${label}_${name}`, seen, depth + 1, budget);
  }
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}_must_be_object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label}_must_be_closed`);
  }
}

function exact(value, expected, label) {
  if (value !== expected) fail(label);
}

function exactArray(actual, expected, label) {
  if (!Array.isArray(actual) || actual.length !== expected.length) fail(`${label}_must_be_canonical`);
  for (let index = 0; index < expected.length; index += 1) {
    exact(actual[index], expected[index], `${label}_must_be_canonical`);
  }
}

function exactObject(actual, expected, keys, label) {
  exactKeys(actual, keys, label);
  for (const key of keys) exact(actual[key], expected[key], `${label}_${key}_drift`);
}

function validateExactObjectRows(actual, expected, keys, label) {
  if (!Array.isArray(actual) || actual.length !== expected.length) fail(`${label}_must_have_13_rows`);
  for (let index = 0; index < expected.length; index += 1) {
    exactObject(actual[index], expected[index], keys, `${label}_${index}`);
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function domainDigest(domain, value) {
  return createHash("sha256")
    .update(`${domain}\0${canonicalize(value)}`, "utf8")
    .digest("hex");
}

function cloneAndFreezePlainJson(value) {
  if (value === null || typeof value !== "object") return value;
  const clone = Array.isArray(value)
    ? value.map((entry) => cloneAndFreezePlainJson(entry))
    : Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneAndFreezePlainJson(entry)])
    );
  return Object.freeze(clone);
}

export function computeEffectAuthorityMigrationSemanticsDigest(packet) {
  assertPlainJsonGraph(packet);
  const { packetDigest: _packetDigest, ...payload } = packet;
  return domainDigest(EFFECT_AUTHORITY_MIGRATION_PACKET_DIGEST_DOMAIN, payload);
}

export function computeEffectAuthorityManifestDigest(registry) {
  assertPlainJsonGraph(registry, "action_registry");
  return createHash("sha256")
    .update(`${EFFECT_AUTHORITY_MANIFEST_DIGEST_DOMAIN}\0`, "utf8")
    .update(JSON.stringify(registry), "utf8")
    .digest("hex");
}

export function validateEffectAuthorityRegistrySourceV1(registry) {
  exactKeys(registry, [
    "authoritySource",
    "bindings",
    "migration",
    "migrationState",
    "schemaVersion",
    "status",
    "stopRules",
    "unboundEffectProfiles"
  ], "source_registry");
  if (!Array.isArray(registry.bindings)) {
    fail("source_registry_bindings_must_have_13_rows");
  }
  if (registry.bindings.length !== 13) {
    fail("source_registry_bindings_must_have_13_rows");
  }
  for (let index = 0; index < registry.bindings.length; index += 1) {
    exactKeys(
      registry.bindings[index],
      SOURCE_REGISTRY_BINDING_KEYS,
      `source_registry_binding_${index}`
    );
  }
  const sourceRows = registry.bindings.map((row) => ({ ...row, version: 1 }));
  validateExactObjectRows(
    sourceRows,
    EFFECT_AUTHORITY_MIGRATION_REGISTRY_DEFINITIONS,
    REGISTRY_DEFINITION_KEYS,
    "source_registry_bindings"
  );
  exact(registry.schemaVersion, "1.0-plan", "source_registry_schema_version_drift");
  exact(registry.status, "PLAN_ONLY_ALL_EFFECT_CIRCUITS_HELD", "source_registry_status_drift");
  exact(registry.migration, EFFECT_AUTHORITY_MIGRATION_FILENAME, "source_registry_migration_drift");
  exact(registry.migrationState, "DEFERRED", "source_registry_migration_state_drift");
  exactArray(registry.unboundEffectProfiles, ["LINE"], "source_registry_unbound_profiles");
  exact(
    computeEffectAuthorityManifestDigest(registry),
    EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.actionRegistry.manifestDigest,
    "source_registry_manifest_digest_drift"
  );
}

export function validateEffectAuthorityMigrationSourceFilesV1(sourceFiles) {
  assertPlainJsonGraph(sourceFiles, "source_files");
  const paths = [
    EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.actionRegistry.path,
    EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.actionRegistry.schemaPath,
    ...EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.previousMigrations.map((entry) => entry.path)
  ];
  exactKeys(sourceFiles, paths, "source_files");
  for (const path of paths) {
    if (typeof sourceFiles[path] !== "string") fail(`source_file_${path}_must_be_utf8_text`);
  }

  const registryPin = EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.actionRegistry;
  exact(sha256Bytes(sourceFiles[registryPin.path]), registryPin.sha256, "source_registry_sha256_drift");
  exact(sha256Bytes(sourceFiles[registryPin.schemaPath]), registryPin.schemaSha256, "source_registry_schema_sha256_drift");
  for (const migration of EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.previousMigrations) {
    exact(sha256Bytes(sourceFiles[migration.path]), migration.sha256, `source_${migration.filename}_sha256_drift`);
  }

  let registry;
  try {
    registry = JSON.parse(sourceFiles[registryPin.path]);
  } catch {
    fail("source_registry_invalid_json");
  }
  assertPlainJsonGraph(registry, "source_registry");
  validateEffectAuthorityRegistrySourceV1(registry);
  return true;
}

function validateFalseFlags(value, keys, label) {
  exactKeys(value, keys, label);
  for (const key of keys) exact(value[key], false, `${label}_${key}_must_remain_false`);
}

export function validateEffectAuthorityMigrationSemanticsV1(packet, { sourceFiles } = {}) {
  assertPlainJsonGraph(packet);
  exactKeys(packet, TOP_LEVEL_KEYS, "packet");
  exact(packet.schemaVersion, "1.0-plan", "schema_version_drift");
  exact(packet.status, EFFECT_AUTHORITY_MIGRATION_SEMANTICS_STATUS, "status_drift");

  exactKeys(packet.repository, REPOSITORY_KEYS, "repository");
  exact(packet.repository.branch, EFFECT_AUTHORITY_MIGRATION_REPOSITORY_BRANCH, "repository_branch_drift");
  if (typeof packet.repository.headSha !== "string" || !COMMIT_SHA.test(packet.repository.headSha)) {
    fail("repository_head_must_be_commit_sha");
  }
  exact(packet.repository.headSha, EFFECT_AUTHORITY_MIGRATION_REPOSITORY_HEAD, "repository_head_drift");

  exactKeys(packet.migration, MIGRATION_KEYS, "migration");
  exact(packet.migration.filename, EFFECT_AUTHORITY_MIGRATION_FILENAME, "migration_filename_drift");
  exact(packet.migration.state, "DEFERRED", "migration_state_drift");
  exact(packet.migration.mode, EFFECT_AUTHORITY_MIGRATION_MODE, "migration_mode_drift");
  exact(packet.migration.filePresent, false, "migration_file_must_remain_absent");
  exact(packet.migration.appliesDatabaseChanges, false, "migration_must_not_apply_database_changes");

  exactKeys(packet.sourcePins, SOURCE_PINS_KEYS, "source_pins");
  exactObject(
    packet.sourcePins.actionRegistry,
    EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.actionRegistry,
    ACTION_REGISTRY_PIN_KEYS,
    "source_pins_action_registry"
  );
  if (!Array.isArray(packet.sourcePins.previousMigrations) || packet.sourcePins.previousMigrations.length !== 2) {
    fail("source_pins_previous_migrations_must_be_canonical");
  }
  for (let index = 0; index < 2; index += 1) {
    exactObject(
      packet.sourcePins.previousMigrations[index],
      EFFECT_AUTHORITY_MIGRATION_SOURCE_PINS.previousMigrations[index],
      PREVIOUS_MIGRATION_KEYS,
      `source_pins_previous_migration_${index}`
    );
  }

  exactKeys(packet.installation, INSTALLATION_KEYS, "installation");
  validateExactObjectRows(
    packet.installation.registryDefinitionRows,
    EFFECT_AUTHORITY_MIGRATION_REGISTRY_DEFINITIONS,
    REGISTRY_DEFINITION_KEYS,
    "registry_definition_rows"
  );
  validateExactObjectRows(
    packet.installation.circuitRows,
    EFFECT_AUTHORITY_MIGRATION_CIRCUIT_ROWS,
    CIRCUIT_ROW_KEYS,
    "circuit_rows"
  );
  exactKeys(packet.installation.resourceCleanup, RESOURCE_CLEANUP_KEYS, "installation_resource_cleanup");
  exact(packet.installation.resourceCleanup.membershipCount, 1, "resource_cleanup_must_be_exactly_one_member");
  exact(packet.installation.resourceCleanup.separateLedger, false, "resource_cleanup_separate_ledger_forbidden");
  const cleanupCount = packet.installation.registryDefinitionRows
    .filter((row) => row.actionKind === "RESOURCE_CLEANUP").length;
  exact(cleanupCount, 1, "resource_cleanup_must_be_exactly_one_registry_row");

  exactKeys(packet.architecture, ARCHITECTURE_KEYS, "architecture");
  exactArray(packet.architecture.reuse0005, REUSED_0005_OBJECTS, "architecture_reuse_0005");
  exactKeys(packet.architecture.genericV2Binding, GENERIC_V2_BINDING_KEYS, "architecture_generic_v2_binding");
  exact(packet.architecture.genericV2Binding.bindingKind, "GENERIC_V2_ACTION_INTENT_SCOPE_BINDING", "generic_v2_binding_kind_drift");
  exact(packet.architecture.genericV2Binding.actionIntentBound, true, "generic_v2_action_intent_must_be_bound");
  exact(packet.architecture.genericV2Binding.scopeBound, true, "generic_v2_scope_must_be_bound");
  exact(packet.architecture.genericV2Binding.cleanupOnly, false, "generic_v2_binding_must_not_be_cleanup_only");
  exact(packet.architecture.cleanupOnlyLedgerAdded, false, "cleanup_only_ledger_forbidden");
  exact(packet.architecture.perActionClosedArtifactsRemainSeparate, true, "closed_per_action_artifacts_required");
  exact(packet.architecture.preserve0006GenericAppDenial, true, "migration_0006_generic_app_denial_required");
  exact(packet.architecture.runtimeInventoryPolicy, "VERSION_AWARE_EXACT_INVENTORY_AND_REFUSAL", "runtime_inventory_policy_drift");

  exactKeys(packet.bootstrapAuthority, BOOTSTRAP_AUTHORITY_KEYS, "bootstrap_authority");
  exact(packet.bootstrapAuthority.existingProcess, "OUT_OF_BAND_HUMAN_TICKETED_PRODUCTION_MIGRATION_RELEASE", "bootstrap_process_drift");
  exactArray(packet.bootstrapAuthority.requiredBindings, REQUIRED_BOOTSTRAP_BINDINGS, "bootstrap_required_bindings");
  exact(packet.bootstrapAuthority.kernelCanAuthorizeOwnInstall, false, "bootstrap_self_authorization_forbidden");
  exact(packet.bootstrapAuthority.bindingComplete, false, "bootstrap_binding_must_remain_incomplete");

  exactKeys(packet.prerequisiteCapabilityRoles, PREREQUISITE_ROLE_KEYS, "prerequisite_capability_roles");
  exact(packet.prerequisiteCapabilityRoles.provisioning, "SEPARATELY_TICKETED_OUT_OF_BAND", "prerequisite_role_provisioning_drift");
  exact(packet.prerequisiteCapabilityRoles.noLoginRequired, true, "prerequisite_roles_must_be_nologin");
  exact(packet.prerequisiteCapabilityRoles.leastPrivilegeRequired, true, "prerequisite_roles_must_be_least_privilege");
  exact(packet.prerequisiteCapabilityRoles.migrationAbortsIfAbsent, true, "migration_must_abort_if_roles_absent");
  exact(packet.prerequisiteCapabilityRoles.migrationAbortsIfUnsafe, true, "migration_must_abort_if_roles_unsafe");
  exact(packet.prerequisiteCapabilityRoles.credentialValuesIncluded, false, "credential_values_forbidden");
  exact(packet.prerequisiteCapabilityRoles.verified, false, "prerequisite_roles_must_remain_unverified");

  exactKeys(packet.seedCounts, SEED_COUNT_KEYS, "seed_counts");
  exact(packet.seedCounts.registryDefinitionRows, 13, "seed_registry_definition_count_drift");
  exact(packet.seedCounts.circuitRows, 13, "seed_circuit_count_drift");
  for (const key of SEED_COUNT_KEYS.filter((key) => !["registryDefinitionRows", "circuitRows"].includes(key))) {
    exact(packet.seedCounts[key], 0, `seed_${key}_must_remain_zero`);
  }

  exactKeys(packet.laterCanary, LATER_CANARY_KEYS, "later_canary");
  exact(packet.laterCanary.eligibleAction, "RESOURCE_CLEANUP", "later_canary_action_drift");
  exact(packet.laterCanary.separateExactTicketRequired, true, "later_canary_ticket_required");
  exact(packet.laterCanary.separateExactGrantRequired, true, "later_canary_grant_required");
  exact(packet.laterCanary.separateExactEvidenceRequired, true, "later_canary_evidence_required");
  exact(packet.laterCanary.disposablePostgresProofRequired, true, "later_canary_postgres_proof_required");
  exact(packet.laterCanary.circuitOpenedByEligibility, false, "later_canary_eligibility_cannot_open_circuit");
  exact(packet.laterCanary.executorRegisteredByEligibility, false, "later_canary_eligibility_cannot_register_executor");
  exact(packet.laterCanary.eligibleNow, false, "later_canary_must_not_be_currently_eligible");

  exactArray(packet.blockers, EFFECT_AUTHORITY_MIGRATION_REQUIRED_BLOCKERS, "blockers");
  validateFalseFlags(packet.authority, AUTHORITY_KEYS, "authority");
  validateFalseFlags(packet.effects, EFFECT_KEYS, "effects");

  if (typeof packet.packetDigest !== "string" || !SHA256.test(packet.packetDigest)) {
    fail("packet_digest_must_be_sha256");
  }
  exact(packet.packetDigest, EFFECT_AUTHORITY_MIGRATION_SEMANTICS_PACKET_DIGEST, "packet_digest_pin_drift");
  exact(packet.packetDigest, computeEffectAuthorityMigrationSemanticsDigest(packet), "packet_digest_mismatch");

  if (sourceFiles === undefined) fail("source_files_required");
  validateEffectAuthorityMigrationSourceFilesV1(sourceFiles);
  return cloneAndFreezePlainJson(packet);
}
