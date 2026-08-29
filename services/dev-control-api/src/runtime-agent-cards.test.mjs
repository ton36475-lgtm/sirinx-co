import { describe, expect, it } from "vitest";
import { activeRoninProfiles, roninRoleRoster } from "./agent-team.mjs";
import { RONIN_ROLE_REGISTRY } from "./ronin-role-registry.mjs";
import {
  RONIN_DEPARTMENTS,
  RONIN_EXECUTION_PRINCIPALS,
  RONIN_KAI,
  RONIN_NUMBERED_ROLES,
  RONIN_OPERATIONAL_FLOW,
  RONIN_OWNER_GROUPS,
  getRuntimeAgentCard,
  getRuntimeAgentRolePlan
} from "./runtime-agent-cards.mjs";

const fixedNow = () => new Date("2026-07-20T05:00:00.000Z");

describe("runtime Agent Card and 47 Ronin plan", () => {
  it("keeps 15 runtime cards separate from 47 unique logical roles", () => {
    const plan = getRuntimeAgentRolePlan({ now: fixedNow });
    const roleIds = RONIN_NUMBERED_ROLES.map((role) => role.roleId);

    expect(plan.version).toBe("1.2");
    expect(plan.summary).toMatchObject({
      runtimeAgentCards: 15,
      observedAgentCards: 0,
      logicalRoninRoles: 47,
      uniqueLogicalRoninRoles: 47,
      logicalOwnerProfiles: 12,
      executionPrincipals: 14,
      kaiPrincipals: 1,
      numericPrincipalRoleClaims: 47,
      activeCards: 0
    });
    expect(new Set(plan.cards.map((card) => card.id)).size).toBe(15);
    expect(new Set(roleIds).size).toBe(47);
    expect(plan.ronin.runtimeProcessesAreRonin).toBe(false);
    expect(plan.ronin.ownerGroupsComplete).toBe(true);
    expect(plan.ronin.ownerGroupsAuthority).toBe("legacy-business-aliases-only");
    expect(plan.ronin.numericRolesComplete).toBe(true);
    expect(plan.ronin.jsBusinessRosterNumbersAuthoritative).toBe(false);
    const numericIds = RONIN_EXECUTION_PRINCIPALS.flatMap((principal) => principal.roleIds);
    expect(numericIds.slice().sort((left, right) => left - right)).toEqual(
      Array.from({ length: 47 }, (_, index) => index + 1)
    );
  });

  it("projects every numbered identity, department, principal, and Kai from the canonical registry", () => {
    const plan = getRuntimeAgentRolePlan({ now: fixedNow });

    expect(plan.ronin.roles.map((role) => ({
      roleId: role.roleId,
      cardId: role.cardId,
      functionalRoleId: role.functionalRoleId,
      codename: role.codename,
      departmentId: role.departmentId,
      headRoleId: role.headRoleId,
      runtimePrincipalId: role.runtimePrincipalId,
      runtimePrincipalBoundary: role.runtimePrincipalBoundary
    }))).toEqual(RONIN_ROLE_REGISTRY.roles.map((role) => ({
      roleId: role.roleId,
      cardId: role.cardId,
      functionalRoleId: role.functionalRoleId,
      codename: role.codename,
      departmentId: role.departmentId,
      headRoleId: role.headRoleId,
      runtimePrincipalId: role.runtimePrincipalId,
      runtimePrincipalBoundary: role.runtimePrincipalBoundary
    })));
    expect(RONIN_DEPARTMENTS.map((department) => ({
      departmentId: department.id,
      title: department.title,
      range: department.range,
      count: department.count,
      headRoleId: department.headRoleId,
      headCodename: department.headCodename
    }))).toEqual(RONIN_ROLE_REGISTRY.departments.map((department) => ({
      departmentId: department.departmentId,
      title: department.title,
      range: department.range,
      count: department.count,
      headRoleId: department.headRoleId,
      headCodename: department.headCodename
    })));
    expect(RONIN_EXECUTION_PRINCIPALS.map((principal) => ({
      runtimePrincipalId: principal.id,
      roleIds: principal.roleIds,
      sourceAccess: principal.sourceAccess
    }))).toEqual(RONIN_ROLE_REGISTRY.runtimePrincipals);
    expect(RONIN_KAI).toEqual(RONIN_ROLE_REGISTRY.kai);
    expect(plan.ronin.kai).toMatchObject(RONIN_ROLE_REGISTRY.kai);
  });

  it("derives legacy business aliases from stable agent-team IDs without numeric inference", () => {
    const projectedIds = RONIN_OWNER_GROUPS.flatMap((group) => group.roles).sort();
    const stableRosterIds = roninRoleRoster.map((role) => role.id).sort();

    expect(projectedIds).toEqual(stableRosterIds);
    expect(new Set(projectedIds).size).toBe(47);
    expect(RONIN_OWNER_GROUPS.map((group) => group.owner).sort()).toEqual(
      activeRoninProfiles.map((profile) => profile.name).sort()
    );
    expect(projectedIds.every((id) => typeof id === "string")).toBe(true);
  });

  it("preserves canonical department counts and no-skip flow", () => {
    expect(RONIN_DEPARTMENTS.reduce((total, department) => total + department.count, 0)).toBe(47);
    expect(RONIN_OPERATIONAL_FLOW).toEqual(["L1", "L2", "L3", "L4"]);
    expect(RONIN_DEPARTMENTS.find((department) => department.id === "L4")).toMatchObject({
      count: 8,
      writes: "exact-lease-only"
    });
    expect(RONIN_DEPARTMENTS.find((department) => department.id === "L5")).toMatchObject({
      count: 4,
      writes: "none"
    });
  });

  it("never treats a caller-provided lease-holder string as a durable source lease", () => {
    const configured = getRuntimeAgentRolePlan({ now: fixedNow, observedAgentIds: ["codex", "codex-app"] });
    const leased = getRuntimeAgentRolePlan({
      now: fixedNow,
      observedAgentIds: ["codex", "codex-app"],
      sourceWriterLeaseHolder: "codex"
    });

    expect(configured.summary.sourceWriterCandidates).toBe(1);
    expect(configured.summary.sourceLeasesHeld).toBe(0);
    expect(configured.summary.reportedAgentCards).toBe(2);
    expect(configured.summary.observedAgentCards).toBe(0);
    expect(configured.cards.find((card) => card.id === "codex")).toMatchObject({
      reportedObserved: true,
      observed: false,
      endpointVerified: false,
      registrationEligible: false,
      sourceLeaseHeld: false,
      canWriteSource: false
    });
    const codexApp = configured.cards.find((card) => card.id === "codex-app");
    expect(codexApp).toMatchObject({
      writerAliasOf: "codex",
      canWriteSource: false
    });
    expect(codexApp.sourceWriterCandidate).toBeUndefined();
    expect(leased.authority).toMatchObject({
      sourceWriterLeaseHolder: null,
      unverifiedSourceWriterLeaseClaim: "codex",
      durableSourceLeaseReceiptValidatorAvailable: false
    });
    expect(leased.summary.sourceLeasesHeld).toBe(0);
    expect(leased.cards.find((card) => card.id === "codex")).toMatchObject({
      sourceLeaseHeld: false,
      canWriteSource: false
    });
  });

  it("keeps transports outside Ronin departments and external authority", () => {
    const plan = getRuntimeAgentRolePlan({
      now: fixedNow,
      observedAgentIds: ["a2a-sync", "telegram-bot"]
    });

    for (const id of ["a2a-sync", "telegram-bot"]) {
      expect(plan.cards.find((card) => card.id === id)).toMatchObject({
        primaryDepartment: null,
        eligibleDepartments: [],
        canWriteSource: false,
        canExecuteExternally: false,
        active: false
      });
    }
    expect(plan.canSendTelegram).toBe(false);
  });

  it("keeps caller-reported identity evidence outside endpoint and registration authority", () => {
    const plan = getRuntimeAgentRolePlan({ now: fixedNow, observedAgentIds: ["kimi-code"] });
    const kimi = plan.cards.find((card) => card.id === "kimi-code");

    expect(kimi).toMatchObject({
      reportedObserved: true,
      observed: false,
      endpointVerified: false,
      registrationEligible: false,
      active: false,
      sourceAccess: "read-only",
      status: "runtime-identity-reported-not-admitted"
    });
    expect(plan.status).toBe("agent-role-plan-evidence-reported-not-admitted");
    expect(plan.summary).toMatchObject({ reportedAgentCards: 1, observedAgentCards: 0 });
    expect(getRuntimeAgentCard("missing-agent")).toBeNull();
  });

  it("ignores unknown caller-reported identities without changing plan truth", () => {
    const plan = getRuntimeAgentRolePlan({ now: fixedNow, observedAgentIds: ["forged-agent"] });

    expect(plan.status).toBe("agent-role-plan-configured-unverified");
    expect(plan.summary).toMatchObject({ reportedAgentCards: 0, observedAgentCards: 0 });
  });
});
