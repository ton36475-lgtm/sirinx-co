import { describe, expect, it } from "vitest";
import { RONIN_ROLE_REGISTRY } from "./ronin-role-registry.mjs";
import {
  AGENTIC_ENTERPRISE_MAX_WORKERS,
  createAgenticEnterpriseDispatchPlan,
  getAgenticEnterpriseStatus
} from "./agentic-enterprise.mjs";

const fixedNow = () => new Date("2026-07-20T05:20:00.000Z");

describe("SIRINX Agentic Enterprise", () => {
  it("registers exactly 47 unique Ronin cards across five departments plus Kai", () => {
    const status = getAgenticEnterpriseStatus({ now: fixedNow });

    expect(status.version).toBe("1.1");
    expect(status.summary).toMatchObject({
      roninRoleCards: 47,
      kaiCards: 1,
      departments: 5,
      executionPrincipals: 14,
      kaiPrincipals: 1,
      surfaceCards: 15,
      sourceWriterPrincipals: 1,
      registeredRoles: 47,
      spawnedRoles: 0,
      activeRoles: 0
    });
    expect(new Set(status.roleCards.map((card) => card.roleId)).size).toBe(47);
    expect(status.departments.map((department) => department.roleIds.length)).toEqual([16, 9, 10, 8, 4]);
    expect(status.kai).toMatchObject({ roleId: 0, sourceWriteEligible: false, spawned: false });
  });

  it("maps all canonical role and Kai fields without synthesizing alternate identities", () => {
    const status = getAgenticEnterpriseStatus({ now: fixedNow });

    for (const [index, role] of RONIN_ROLE_REGISTRY.roles.entries()) {
      expect(status.roleCards[index]).toMatchObject(role);
    }
    expect(status.roleCards.map((card) => ({
      roleId: card.roleId,
      cardId: card.cardId,
      functionalRoleId: card.functionalRoleId,
      codename: card.codename,
      title: card.title,
      mission: card.mission,
      departmentId: card.departmentId,
      headRoleId: card.headRoleId,
      principalId: card.principalId,
      runtimePrincipalBoundary: card.runtimePrincipalBoundary,
      actionClasses: card.actionClasses
    }))).toEqual(RONIN_ROLE_REGISTRY.roles.map((role) => ({
      roleId: role.roleId,
      cardId: role.cardId,
      functionalRoleId: role.functionalRoleId,
      codename: role.codename,
      title: role.title,
      mission: role.mission,
      departmentId: role.departmentId,
      headRoleId: role.headRoleId,
      principalId: role.runtimePrincipalId,
      runtimePrincipalBoundary: role.runtimePrincipalBoundary,
      actionClasses: role.actionClasses
    })));
    expect(status.kai).toMatchObject({
      cardId: RONIN_ROLE_REGISTRY.kai.cardId,
      functionalRoleId: RONIN_ROLE_REGISTRY.kai.functionalRoleId,
      title: RONIN_ROLE_REGISTRY.kai.title,
      mission: RONIN_ROLE_REGISTRY.kai.mission,
      principalId: RONIN_ROLE_REGISTRY.kai.runtimePrincipalId,
      actionClasses: RONIN_ROLE_REGISTRY.kai.actionClasses
    });
    expect(status.kai).toMatchObject(RONIN_ROLE_REGISTRY.kai);
  });

  it("keeps only Codex-owned L4 roles eligible for an exact source lease", () => {
    const status = getAgenticEnterpriseStatus({ now: fixedNow });
    const eligible = status.roleCards.filter((card) => card.sourceWriteEligible);

    expect(eligible.map((card) => card.roleId)).toEqual([37, 38, 39]);
    expect(eligible.every((card) => card.principalId === "codex" && card.sourceLeaseHeld === false)).toBe(true);
    expect(status.authority).toMatchObject({ singleRepoWriter: "codex", maxConcurrentRepoWriters: 1 });
  });

  it("plans all roles in bounded department waves without spawning any worker", () => {
    const plan = createAgenticEnterpriseDispatchPlan({ goal: "organize all agents" }, { now: fixedNow });

    expect(AGENTIC_ENTERPRISE_MAX_WORKERS).toBe(3);
    expect(plan).toMatchObject({
      status: "enterprise-dispatch-plan-ready",
      dryRun: true,
      requestedRoleCount: 47,
      plannedRoleCount: 47,
      spawnedRoleCount: 0,
      activeRoleCount: 0,
      maxConcurrentWorkers: 3,
      externalWrites: false,
      commandExecuted: false
    });
    expect(plan.waves.flatMap((wave) => wave.roleIds)).toHaveLength(47);
    expect(plan.waves.every((wave) => wave.roleIds.length <= 3 && wave.workersSpawned === 0)).toBe(true);
    expect(plan.waves.find((wave) => wave.departmentId === "L2").requiresPriorDepartmentReceipt).toBe("L1");
    expect(plan.waves.filter((wave) => wave.departmentId === "L5").every((wave) => wave.advisoryOnly)).toBe(true);
  });

  it("blocks a live spawn request without task envelopes, leases, and free slots", () => {
    const plan = createAgenticEnterpriseDispatchPlan({ dryRun: false }, { now: fixedNow });

    expect(plan).toMatchObject({
      status: "blocked-enterprise-dispatch",
      spawnedRoleCount: 0,
      canSpawnWorkersNow: false,
      commandExecuted: false,
      blockedReasons: ["live_spawn_requires_task_envelopes_leases_and_available_slots"]
    });
  });
});
