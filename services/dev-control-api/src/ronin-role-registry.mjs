import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// Packaging contract: dev-control-api is not a standalone artifact unless this
// crate-owned registry is copied to the same relative monorepo path.
export const RONIN_ROLE_REGISTRY_PACKAGING_CONSTRAINT =
  "requires ../../../crates/sirinx-agents/data/ronin-role-registry.v1.json relative to this module";
export const RONIN_ROLE_REGISTRY_URL = new URL(
  "../../../crates/sirinx-agents/data/ronin-role-registry.v1.json",
  import.meta.url
);

export const RONIN_ROLE_REGISTRY_ERROR_CODES = Object.freeze({
  READ_FAILED: "RONIN_REGISTRY_READ_FAILED",
  JSON_INVALID: "RONIN_REGISTRY_JSON_INVALID",
  SHAPE_INVALID: "RONIN_REGISTRY_SHAPE_INVALID",
  IDENTITY_INVALID: "RONIN_REGISTRY_IDENTITY_INVALID",
  STATUS_INVALID: "RONIN_REGISTRY_STATUS_INVALID",
  EXECUTABLE_FORBIDDEN: "RONIN_REGISTRY_EXECUTABLE_FORBIDDEN",
  WORKER_CAP_INVALID: "RONIN_REGISTRY_WORKER_CAP_INVALID",
  EXTERNAL_ACTIONS_FORBIDDEN: "RONIN_REGISTRY_EXTERNAL_ACTIONS_FORBIDDEN",
  DEPARTMENT_SET_INVALID: "RONIN_REGISTRY_DEPARTMENT_SET_INVALID",
  ROLE_ID_SET_INVALID: "RONIN_REGISTRY_ROLE_ID_SET_INVALID",
  ROLE_SHAPE_INVALID: "RONIN_REGISTRY_ROLE_SHAPE_INVALID",
  CARD_ID_DUPLICATE: "RONIN_REGISTRY_CARD_ID_DUPLICATE",
  FUNCTIONAL_ROLE_ID_DUPLICATE: "RONIN_REGISTRY_FUNCTIONAL_ROLE_ID_DUPLICATE",
  ACTION_CLASS_INVALID: "RONIN_REGISTRY_ACTION_CLASS_INVALID",
  IMPLEMENTATION_STATUS_INVALID: "RONIN_REGISTRY_IMPLEMENTATION_STATUS_INVALID",
  PRINCIPAL_SET_INVALID: "RONIN_REGISTRY_PRINCIPAL_SET_INVALID",
  PRINCIPAL_ROLE_COVERAGE_INVALID: "RONIN_REGISTRY_PRINCIPAL_ROLE_COVERAGE_INVALID",
  PRINCIPAL_BOUNDARY_INVALID: "RONIN_REGISTRY_PRINCIPAL_BOUNDARY_INVALID",
  KAI_INVALID: "RONIN_REGISTRY_KAI_INVALID",
  KAI_COLLISION: "RONIN_REGISTRY_KAI_COLLISION",
  CONTRACT_FIELDS_INVALID: "RONIN_REGISTRY_CONTRACT_FIELDS_INVALID",
  IDENTIFIER_SYNTAX_INVALID: "RONIN_REGISTRY_IDENTIFIER_SYNTAX_INVALID",
  SEMANTIC_FINGERPRINT_INVALID: "RONIN_REGISTRY_SEMANTIC_FINGERPRINT_INVALID"
});

export const RONIN_ROLE_REGISTRY_SEMANTIC_FINGERPRINT =
  "2c8242b556cece4cec47200b7be0e39bc7131b025e3e89cb9f8a682e27495bd2";

export class RoninRoleRegistryError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "RoninRoleRegistryError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

const EXPECTED_DEPARTMENTS = Object.freeze([
  Object.freeze({ departmentId: "L1", title: "Perception", range: "01-16", min: 1, max: 16, count: 16, headRoleId: 1, headCodename: "Kuranosuke" }),
  Object.freeze({ departmentId: "L2", title: "Analysis", range: "17-25", min: 17, max: 25, count: 9, headRoleId: 17, headCodename: "Jūnai" }),
  Object.freeze({ departmentId: "L3", title: "Decision", range: "26-35", min: 26, max: 35, count: 10, headRoleId: 26, headCodename: "Kihei" }),
  Object.freeze({ departmentId: "L4", title: "Coordination", range: "36-43", min: 36, max: 43, count: 8, headRoleId: 36, headCodename: "Gengo" }),
  Object.freeze({ departmentId: "L5", title: "Research", range: "44-47", min: 44, max: 47, count: 4, headRoleId: 44, headCodename: "Mimura" })
]);

const EXPECTED_PRINCIPAL_BOUNDARIES = Object.freeze({
  "sirinx-rust-runtime": "compiled-runtime-only",
  webmcp: "read-only",
  "claude-code": "read-only",
  "claude-cowork": "read-only",
  hermes: "read-only",
  manus: "read-only",
  droid: "read-only",
  pi: "read-only",
  "kimi-code": "read-only",
  codex: "write-with-exact-path-lease-for-l4-only",
  "copilot-cli": "read-only",
  opencode: "read-only-except-exact-artifact-job",
  antigravity2: "candidate-output-only",
  openclaw: "no-repo-source-write"
});

const ALLOWED_ACTION_CLASSES = new Set([
  "A",
  "A_DRAFT_ONLY",
  "B_PLAN_ONLY",
  "B_COORDINATION",
  "B_EXACT_LEASE",
  "B_FIXTURE_ONLY",
  "C_MAKER_CHECKER",
  "D_TICKETED_ONLY",
  "X"
]);
const ALLOWED_IMPLEMENTATION_STATUSES = new Set([
  "coded-rust-runtime-plus-passive-card",
  "passive-specification-anchor-codename",
  "passive-specification-runtime-principal-mapped"
]);
const CODED_ROLE_IDS = new Set([1, 2, 3, 4, 17, 18, 19, 26, 36]);
const CONTRACT_KEYS = Object.freeze({
  registry: Object.freeze([
    "authority",
    "departments",
    "description",
    "executable",
    "kai",
    "registryId",
    "registryVersion",
    "roles",
    "runtimePrincipals",
    "status"
  ]),
  authority: Object.freeze([
    "durableStateAuthority",
    "externalActionPolicy",
    "externalActions",
    "lanePolicy",
    "makerCheckerSeparation",
    "maxConcurrentWorkers",
    "numericRoleRanges",
    "runtimeMeaning"
  ]),
  department: Object.freeze([
    "count",
    "defaultActionClasses",
    "departmentId",
    "headCodename",
    "headRoleId",
    "range",
    "title"
  ]),
  principal: Object.freeze(["roleIds", "runtimePrincipalId", "sourceAccess"]),
  role: Object.freeze([
    "actionClasses",
    "allowedInputs",
    "backgroundCadence",
    "cardId",
    "codename",
    "departmentId",
    "departmentTitle",
    "escalation",
    "functionalRoleId",
    "headRoleId",
    "implementationStatus",
    "mission",
    "outputs",
    "prohibitedActions",
    "reportsTo",
    "requiredEvidence",
    "responsibilities",
    "roleId",
    "runtimePrincipalBoundary",
    "runtimePrincipalId",
    "sourceRefs",
    "title"
  ]),
  kai: Object.freeze([
    "actionClasses",
    "allowedInputs",
    "backgroundCadence",
    "cardId",
    "codename",
    "departmentId",
    "departmentTitle",
    "escalation",
    "functionalRoleId",
    "headRoleId",
    "implementationStatus",
    "mission",
    "outputs",
    "prohibitedActions",
    "reportsTo",
    "requiredEvidence",
    "responsibilities",
    "roleId",
    "runtimePrincipalBoundary",
    "runtimePrincipalId",
    "sourceRefs",
    "title"
  ])
});

function fail(code, message, details = {}) {
  throw new RoninRoleRegistryError(code, message, details);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value, field) {
  if (!isRecord(value)) {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.SHAPE_INVALID, `${field} must be an object`, { field });
  }
}

function requireExactKeys(value, expectedKeys, field) {
  requireRecord(value, field);
  const actualKeys = Object.keys(value).sort();
  const requiredKeys = [...expectedKeys].sort();
  if (!sameValues(actualKeys, requiredKeys)) {
    fail(
      RONIN_ROLE_REGISTRY_ERROR_CODES.CONTRACT_FIELDS_INVALID,
      `${field} fields do not match the closed registry contract`,
      {
        field,
        missing: requiredKeys.filter((key) => !actualKeys.includes(key)),
        unknown: actualKeys.filter((key) => !requiredKeys.includes(key))
      }
    );
  }
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.ROLE_SHAPE_INVALID, `${field} must be a non-empty string`, { field });
  }
}

function requireStringArray(value, field, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.ROLE_SHAPE_INVALID, `${field} must be an array of non-empty strings`, { field });
  }
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function getRoninRoleRegistrySemanticFingerprint(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function sameValues(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sortedNumbers(values) {
  return [...values].sort((left, right) => left - right);
}

function departmentForRole(roleId) {
  return EXPECTED_DEPARTMENTS.find((department) => roleId >= department.min && roleId <= department.max);
}

function validateAuthority(registry) {
  requireExactKeys(registry.authority, CONTRACT_KEYS.authority, "authority");
  if (registry.authority.maxConcurrentWorkers !== 3) {
    fail(
      RONIN_ROLE_REGISTRY_ERROR_CODES.WORKER_CAP_INVALID,
      "authority.maxConcurrentWorkers must equal 3",
      { actual: registry.authority.maxConcurrentWorkers }
    );
  }
  if (registry.authority.externalActions !== false) {
    fail(
      RONIN_ROLE_REGISTRY_ERROR_CODES.EXTERNAL_ACTIONS_FORBIDDEN,
      "authority.externalActions must remain false"
    );
  }
  requireStringArray(registry.authority.lanePolicy, "authority.lanePolicy");
}

function validateDepartments(registry) {
  if (!Array.isArray(registry.departments) || registry.departments.length !== EXPECTED_DEPARTMENTS.length) {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.DEPARTMENT_SET_INVALID, "departments must contain exactly L1 through L5");
  }

  for (const expected of EXPECTED_DEPARTMENTS) {
    const department = registry.departments.find((item) => item?.departmentId === expected.departmentId);
    if (department) requireExactKeys(department, CONTRACT_KEYS.department, `department.${expected.departmentId}`);
    if (!department
      || department.title !== expected.title
      || department.range !== expected.range
      || department.count !== expected.count
      || department.headRoleId !== expected.headRoleId
      || department.headCodename !== expected.headCodename) {
      fail(
        RONIN_ROLE_REGISTRY_ERROR_CODES.DEPARTMENT_SET_INVALID,
        `${expected.departmentId} department contract drifted`,
        { departmentId: expected.departmentId }
      );
    }
    requireStringArray(department.defaultActionClasses, `${expected.departmentId}.defaultActionClasses`);
  }

  const ids = registry.departments.map((department) => department.departmentId).sort();
  if (!sameValues(ids, EXPECTED_DEPARTMENTS.map((department) => department.departmentId).sort())) {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.DEPARTMENT_SET_INVALID, "department IDs must equal L1 through L5");
  }
}

function validatePrincipals(registry) {
  const expectedPrincipalIds = Object.keys(EXPECTED_PRINCIPAL_BOUNDARIES).sort();
  if (!Array.isArray(registry.runtimePrincipals) || registry.runtimePrincipals.length !== expectedPrincipalIds.length) {
    fail(
      RONIN_ROLE_REGISTRY_ERROR_CODES.PRINCIPAL_SET_INVALID,
      `runtimePrincipals must contain exactly ${expectedPrincipalIds.length} numbered-role principals`
    );
  }

  const actualPrincipalIds = registry.runtimePrincipals.map((principal) => principal?.runtimePrincipalId).sort();
  if (!sameValues(actualPrincipalIds, expectedPrincipalIds)) {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.PRINCIPAL_SET_INVALID, "runtime principal IDs drifted");
  }

  const principalByRoleId = new Map();
  for (const principal of registry.runtimePrincipals) {
    requireExactKeys(principal, CONTRACT_KEYS.principal, `runtimePrincipal.${principal.runtimePrincipalId}`);
    if (!/^[a-z][a-z0-9-]*$/.test(principal.runtimePrincipalId)) {
      fail(
        RONIN_ROLE_REGISTRY_ERROR_CODES.IDENTIFIER_SYNTAX_INVALID,
        `${principal.runtimePrincipalId} is not a valid runtime principal ID`
      );
    }
    const expectedBoundary = EXPECTED_PRINCIPAL_BOUNDARIES[principal.runtimePrincipalId];
    if (principal.sourceAccess !== expectedBoundary) {
      fail(
        RONIN_ROLE_REGISTRY_ERROR_CODES.PRINCIPAL_BOUNDARY_INVALID,
        `${principal.runtimePrincipalId} source boundary drifted`,
        { runtimePrincipalId: principal.runtimePrincipalId }
      );
    }
    if (!Array.isArray(principal.roleIds) || principal.roleIds.length === 0) {
      fail(
        RONIN_ROLE_REGISTRY_ERROR_CODES.PRINCIPAL_ROLE_COVERAGE_INVALID,
        `${principal.runtimePrincipalId} must own at least one numbered role`
      );
    }
    for (const roleId of principal.roleIds) {
      if (!Number.isInteger(roleId) || roleId < 1 || roleId > 47 || principalByRoleId.has(roleId)) {
        fail(
          RONIN_ROLE_REGISTRY_ERROR_CODES.PRINCIPAL_ROLE_COVERAGE_INVALID,
          `role ${roleId} is invalid or assigned to multiple principals`,
          { roleId }
        );
      }
      principalByRoleId.set(roleId, principal.runtimePrincipalId);
    }
  }

  const expectedRoleIds = Array.from({ length: 47 }, (_, index) => index + 1);
  if (!sameValues(sortedNumbers(principalByRoleId.keys()), expectedRoleIds)) {
    fail(
      RONIN_ROLE_REGISTRY_ERROR_CODES.PRINCIPAL_ROLE_COVERAGE_INVALID,
      "runtime principals must partition roles 1 through 47 exactly once"
    );
  }
  return principalByRoleId;
}

function validateRoles(registry, principalByRoleId) {
  if (!Array.isArray(registry.roles) || registry.roles.length !== 47) {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.ROLE_ID_SET_INVALID, "roles must contain exactly 47 entries");
  }

  const expectedRoleIds = Array.from({ length: 47 }, (_, index) => index + 1);
  const roleIds = registry.roles.map((role) => role?.roleId);
  if (!sameValues(sortedNumbers(roleIds), expectedRoleIds) || new Set(roleIds).size !== 47) {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.ROLE_ID_SET_INVALID, "role IDs must equal 1 through 47 exactly once");
  }

  const cardIds = new Set();
  const functionalRoleIds = new Set();
  for (const role of registry.roles) {
    requireExactKeys(role, CONTRACT_KEYS.role, `role.${role?.roleId ?? "unknown"}`);
    const expectedDepartment = departmentForRole(role.roleId);
    for (const field of [
      "cardId",
      "functionalRoleId",
      "departmentId",
      "departmentTitle",
      "codename",
      "title",
      "mission",
      "reportsTo",
      "runtimePrincipalId",
      "runtimePrincipalBoundary",
      "backgroundCadence",
      "implementationStatus"
    ]) requireString(role[field], `role.${role.roleId}.${field}`);
    for (const field of [
      "actionClasses",
      "responsibilities",
      "allowedInputs",
      "outputs",
      "requiredEvidence",
      "prohibitedActions",
      "escalation",
      "sourceRefs"
    ]) requireStringArray(role[field], `role.${role.roleId}.${field}`);

    if (cardIds.has(role.cardId)) {
      fail(RONIN_ROLE_REGISTRY_ERROR_CODES.CARD_ID_DUPLICATE, `duplicate cardId ${role.cardId}`);
    }
    cardIds.add(role.cardId);
    if (functionalRoleIds.has(role.functionalRoleId)) {
      fail(RONIN_ROLE_REGISTRY_ERROR_CODES.FUNCTIONAL_ROLE_ID_DUPLICATE, `duplicate functionalRoleId ${role.functionalRoleId}`);
    }
    functionalRoleIds.add(role.functionalRoleId);
    if (!/^ronin-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(role.cardId)
      || !role.cardId.startsWith(`ronin-${String(role.roleId).padStart(2, "0")}-`)
      || !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(role.functionalRoleId)
      || !/^(?:ronin-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*|human-operator|requesting-operational-layer)$/.test(role.reportsTo)) {
      fail(
        RONIN_ROLE_REGISTRY_ERROR_CODES.IDENTIFIER_SYNTAX_INVALID,
        `role ${role.roleId} contains an invalid identifier`,
        { roleId: role.roleId }
      );
    }

    if (!expectedDepartment
      || role.departmentId !== expectedDepartment.departmentId
      || role.departmentTitle !== expectedDepartment.title
      || role.headRoleId !== expectedDepartment.headRoleId) {
      fail(
        RONIN_ROLE_REGISTRY_ERROR_CODES.DEPARTMENT_SET_INVALID,
        `role ${role.roleId} department or head mapping drifted`,
        { roleId: role.roleId }
      );
    }
    if (role.actionClasses.some((actionClass) => !ALLOWED_ACTION_CLASSES.has(actionClass))) {
      fail(RONIN_ROLE_REGISTRY_ERROR_CODES.ACTION_CLASS_INVALID, `role ${role.roleId} has an unknown action class`);
    }
    const principalId = principalByRoleId.get(role.roleId);
    if (role.runtimePrincipalId !== principalId) {
      fail(
        RONIN_ROLE_REGISTRY_ERROR_CODES.PRINCIPAL_ROLE_COVERAGE_INVALID,
        `role ${role.roleId} principal mapping drifted`,
        { roleId: role.roleId }
      );
    }
    if (role.runtimePrincipalBoundary !== EXPECTED_PRINCIPAL_BOUNDARIES[principalId]) {
      fail(
        RONIN_ROLE_REGISTRY_ERROR_CODES.PRINCIPAL_BOUNDARY_INVALID,
        `role ${role.roleId} principal boundary drifted`,
        { roleId: role.roleId }
      );
    }
    if (!ALLOWED_IMPLEMENTATION_STATUSES.has(role.implementationStatus)
      || (role.implementationStatus === "coded-rust-runtime-plus-passive-card") !== CODED_ROLE_IDS.has(role.roleId)) {
      fail(
        RONIN_ROLE_REGISTRY_ERROR_CODES.IMPLEMENTATION_STATUS_INVALID,
        `role ${role.roleId} implementation status drifted`,
        { roleId: role.roleId }
      );
    }
  }
  return { cardIds, functionalRoleIds };
}

function validateKai(registry, numberedIdentities) {
  const kai = registry.kai;
  requireExactKeys(kai, CONTRACT_KEYS.kai, "kai");
  if (kai.roleId !== 0
    || kai.departmentId !== "KAI"
    || kai.departmentTitle !== "Customer Liaison"
    || kai.codename !== "Kai"
    || kai.headRoleId !== null
    || kai.runtimePrincipalId !== "telegram-kai"
    || kai.runtimePrincipalBoundary !== "none"
    || kai.implementationStatus !== "passive-specification-outside-47") {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.KAI_INVALID, "Kai must remain the separate draft-only role 0");
  }
  for (const field of ["cardId", "functionalRoleId", "title", "mission", "reportsTo", "backgroundCadence"]) {
    requireString(kai[field], `kai.${field}`);
  }
  for (const field of [
    "actionClasses",
    "responsibilities",
    "allowedInputs",
    "outputs",
    "requiredEvidence",
    "prohibitedActions",
    "escalation",
    "sourceRefs"
  ]) requireStringArray(kai[field], `kai.${field}`);
  if (!sameValues(kai.actionClasses, ["A_DRAFT_ONLY"])) {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.KAI_INVALID, "Kai action class must remain A_DRAFT_ONLY");
  }
  if (numberedIdentities.cardIds.has(kai.cardId)
    || numberedIdentities.functionalRoleIds.has(kai.functionalRoleId)
    || registry.runtimePrincipals.some((principal) => principal.runtimePrincipalId === kai.runtimePrincipalId)) {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.KAI_COLLISION, "Kai must not collide with or join the numbered roster");
  }
}

export function validateRoninRoleRegistry(input) {
  requireExactKeys(input, CONTRACT_KEYS.registry, "registry");
  if (input.registryId !== "sirinx-47-ronin-passive-role-registry" || input.registryVersion !== "1.0.0") {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.IDENTITY_INVALID, "registry identity or version drifted");
  }
  if (input.status !== "passive-specification") {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.STATUS_INVALID, "registry status must remain passive-specification");
  }
  if (input.executable !== false) {
    fail(RONIN_ROLE_REGISTRY_ERROR_CODES.EXECUTABLE_FORBIDDEN, "registry must remain non-executable");
  }

  validateAuthority(input);
  validateDepartments(input);
  const principalByRoleId = validatePrincipals(input);
  const numberedIdentities = validateRoles(input, principalByRoleId);
  validateKai(input, numberedIdentities);

  const fingerprint = getRoninRoleRegistrySemanticFingerprint(input);
  if (fingerprint !== RONIN_ROLE_REGISTRY_SEMANTIC_FINGERPRINT) {
    fail(
      RONIN_ROLE_REGISTRY_ERROR_CODES.SEMANTIC_FINGERPRINT_INVALID,
      "registry semantics drifted from the reviewed canonical contract",
      { expected: RONIN_ROLE_REGISTRY_SEMANTIC_FINGERPRINT, actual: fingerprint }
    );
  }

  return deepFreeze(structuredClone(input));
}

export function loadRoninRoleRegistry(options = {}) {
  const registryUrl = options.registryUrl || RONIN_ROLE_REGISTRY_URL;
  const readFile = options.readFileSyncImpl || readFileSync;
  let source;
  try {
    source = readFile(registryUrl, "utf8");
  } catch (error) {
    fail(
      RONIN_ROLE_REGISTRY_ERROR_CODES.READ_FAILED,
      "unable to read the canonical Ronin role registry",
      { cause: error instanceof Error ? error.message : String(error) }
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    fail(
      RONIN_ROLE_REGISTRY_ERROR_CODES.JSON_INVALID,
      "canonical Ronin role registry is not valid JSON",
      { cause: error instanceof Error ? error.message : String(error) }
    );
  }
  return validateRoninRoleRegistry(parsed);
}

export const RONIN_ROLE_REGISTRY = loadRoninRoleRegistry();
