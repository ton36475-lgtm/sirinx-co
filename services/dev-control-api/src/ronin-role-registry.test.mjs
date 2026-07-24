import { describe, expect, it } from "vitest";
import {
  RONIN_ROLE_REGISTRY,
  RONIN_ROLE_REGISTRY_ERROR_CODES,
  RONIN_ROLE_REGISTRY_PACKAGING_CONSTRAINT,
  RONIN_ROLE_REGISTRY_SEMANTIC_FINGERPRINT,
  RoninRoleRegistryError,
  getRoninRoleRegistrySemanticFingerprint,
  loadRoninRoleRegistry,
  validateRoninRoleRegistry
} from "./ronin-role-registry.mjs";

function mutableRegistry() {
  return structuredClone(RONIN_ROLE_REGISTRY);
}

function expectRegistryError(action, code) {
  let thrown;
  try {
    action();
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(RoninRoleRegistryError);
  expect(thrown).toMatchObject({ code });
}

describe("canonical 47 Ronin role registry", () => {
  it("loads one deeply frozen registry with 47 numbered roles, 14 principals, and separate Kai", () => {
    expect(RONIN_ROLE_REGISTRY).toMatchObject({
      registryId: "sirinx-47-ronin-passive-role-registry",
      registryVersion: "1.0.0",
      status: "passive-specification",
      executable: false,
      authority: { maxConcurrentWorkers: 3, externalActions: false },
      kai: { roleId: 0, runtimePrincipalId: "telegram-kai" }
    });
    expect(RONIN_ROLE_REGISTRY.roles).toHaveLength(47);
    expect(RONIN_ROLE_REGISTRY.runtimePrincipals).toHaveLength(14);
    expect(Object.isFrozen(RONIN_ROLE_REGISTRY)).toBe(true);
    expect(Object.isFrozen(RONIN_ROLE_REGISTRY.roles[0].actionClasses)).toBe(true);
    expect(RONIN_ROLE_REGISTRY.runtimePrincipals.some((principal) => principal.runtimePrincipalId === "telegram-kai")).toBe(false);
  });

  it("returns a validated frozen copy without mutating caller input", () => {
    const input = mutableRegistry();
    const validated = validateRoninRoleRegistry(input);

    expect(validated).not.toBe(input);
    expect(validated).toEqual(input);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(validated.roles[46])).toBe(true);
  });

  it("keeps stable ASCII identifiers while enforcing Unicode display codenames", () => {
    const l2 = RONIN_ROLE_REGISTRY.departments.find((department) => department.departmentId === "L2");
    const junai = RONIN_ROLE_REGISTRY.roles.find((role) => role.roleId === 17);
    const jurozaemon = RONIN_ROLE_REGISTRY.roles.find((role) => role.roleId === 25);

    expect(l2?.headCodename).toBe("Jūnai");
    expect(junai).toMatchObject({
      cardId: "ronin-17-junai-lead-analyst",
      functionalRoleId: "analysis.lead-scorer",
      codename: "Jūnai"
    });
    expect(jurozaemon).toMatchObject({
      cardId: "ronin-25-jurozaemon-secondary-reviewer",
      functionalRoleId: "analysis.secondary-review",
      codename: "Jūrōzaemon"
    });
  });

  it("binds the full closed contract to one reviewed semantic fingerprint", () => {
    expect(getRoninRoleRegistrySemanticFingerprint(RONIN_ROLE_REGISTRY)).toBe(
      RONIN_ROLE_REGISTRY_SEMANTIC_FINGERPRINT
    );
    expect(RONIN_ROLE_REGISTRY_PACKAGING_CONSTRAINT).toContain(
      "crates/sirinx-agents/data/ronin-role-registry.v1.json"
    );
  });

  it("reports a stable code for malformed JSON", () => {
    expectRegistryError(
      () => loadRoninRoleRegistry({ readFileSyncImpl: () => "{" }),
      RONIN_ROLE_REGISTRY_ERROR_CODES.JSON_INVALID
    );
  });

  it("rejects executable registry drift", () => {
    const registry = mutableRegistry();
    registry.executable = true;

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.EXECUTABLE_FORBIDDEN
    );
  });

  it("rejects worker-cap drift", () => {
    const registry = mutableRegistry();
    registry.authority.maxConcurrentWorkers = 47;

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.WORKER_CAP_INVALID
    );
  });

  it("rejects duplicate numbered role IDs", () => {
    const registry = mutableRegistry();
    registry.roles[1].roleId = registry.roles[0].roleId;

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.ROLE_ID_SET_INVALID
    );
  });

  it("rejects duplicate numbered card IDs", () => {
    const registry = mutableRegistry();
    registry.roles[1].cardId = registry.roles[0].cardId;

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.CARD_ID_DUPLICATE
    );
  });

  it("rejects a missing numbered-role principal", () => {
    const registry = mutableRegistry();
    registry.runtimePrincipals = registry.runtimePrincipals.filter(
      (principal) => principal.runtimePrincipalId !== "openclaw"
    );

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.PRINCIPAL_SET_INVALID
    );
  });

  it("rejects a widened principal source boundary", () => {
    const registry = mutableRegistry();
    registry.runtimePrincipals.find((principal) => principal.runtimePrincipalId === "codex").sourceAccess = "write-anywhere";

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.PRINCIPAL_BOUNDARY_INVALID
    );
  });

  it("rejects authority lane-policy semantic drift", () => {
    const registry = mutableRegistry();
    registry.authority.lanePolicy.reverse();

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.SEMANTIC_FINGERPRINT_INVALID
    );
  });

  it("rejects exact principal-membership drift even when coverage remains internally consistent", () => {
    const registry = mutableRegistry();
    const webmcp = registry.runtimePrincipals.find((principal) => principal.runtimePrincipalId === "webmcp");
    const claudeCode = registry.runtimePrincipals.find((principal) => principal.runtimePrincipalId === "claude-code");
    webmcp.roleIds[webmcp.roleIds.indexOf(5)] = 8;
    claudeCode.roleIds[claudeCode.roleIds.indexOf(8)] = 5;
    registry.roles.find((role) => role.roleId === 5).runtimePrincipalId = "claude-code";
    registry.roles.find((role) => role.roleId === 8).runtimePrincipalId = "webmcp";

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.SEMANTIC_FINGERPRINT_INVALID
    );
  });

  it("rejects reportsTo drift that remains syntactically valid", () => {
    const registry = mutableRegistry();
    registry.roles[0].reportsTo = "human-operator";

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.SEMANTIC_FINGERPRINT_INVALID
    );
  });

  it("rejects exact action-class drift even when every class is allowed", () => {
    const registry = mutableRegistry();
    registry.roles[36].actionClasses = ["A", "B_EXACT_LEASE", "C_MAKER_CHECKER"];

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.SEMANTIC_FINGERPRINT_INVALID
    );
  });

  it("rejects malformed role identifier syntax", () => {
    const registry = mutableRegistry();
    registry.roles[0].functionalRoleId = "invalid role id";

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.IDENTIFIER_SYNTAX_INVALID
    );
  });

  it("rejects unknown fields instead of silently accepting them", () => {
    const registry = mutableRegistry();
    registry.roles[0].unexpectedAuthority = true;

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.CONTRACT_FIELDS_INVALID
    );
  });

  it("rejects Kai colliding with a numbered card identity", () => {
    const registry = mutableRegistry();
    registry.kai.cardId = registry.roles[0].cardId;

    expectRegistryError(
      () => validateRoninRoleRegistry(registry),
      RONIN_ROLE_REGISTRY_ERROR_CODES.KAI_COLLISION
    );
  });
});
