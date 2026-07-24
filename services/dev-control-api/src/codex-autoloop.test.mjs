import { describe, expect, it } from "vitest";
import {
  createCodexAutoloopPlan,
  getCodexAutoloopStatus,
  getCodexBridgeStatus,
  runCodexAutoloopCliMode
} from "./codex-autoloop.mjs";

const fixedNow = () => new Date("2026-07-20T05:30:00.000Z");
const receipt = JSON.stringify({
  jobId: "OPS-A2A-OPENCODE-TEST",
  agentId: "opencode",
  processExitCode: 0,
  providerCall: true,
  reportedCost: 0,
  writeObserved: true,
  writeScope: ["RESULT.md"],
  jobSha256: "a".repeat(64),
  resultSha256: "b".repeat(64),
  omnirouteEvidence: { persistentConnectionVerified: false, routeActivityVerified: false },
  externalOutcomes: { telegramSent: false, mcpCalled: false }
});

describe("Codex/OpenCode A2A autoloop truth contract", () => {
  it("recognizes the bounded receipt without claiming a live loop or sync", async () => {
    const status = await getCodexAutoloopStatus({
      env: {},
      now: fixedNow,
      readFileImpl: async () => receipt
    });

    expect(status).toMatchObject({
      status: "autoloop-evidence-ready-not-started",
      liveSync: false,
      persistentLoopRunning: false,
      allAgentsSynced: false,
      allAgentsApproved: false,
      externalWrites: false,
      canSpawnAgents: false,
      canActivateRoutes: false,
      commandExecuted: false,
      summary: {
        a2aSurfaceAgents: 16,
        omnirouteLanes: 16,
        logicalRoninRoles: 47,
        spawnedRoninRoles: 0,
        runningLoops: 0
      }
    });
    expect(status.openCode.boundedReceipt).toMatchObject({
      observed: true,
      persistentConnectionVerified: false,
      routeActivityVerified: false,
      telegramSent: false,
      mcpCalled: false
    });
  });

  it("builds an all-surface and all-role dry-run without activation, delivery, or spawn", async () => {
    const plan = await createCodexAutoloopPlan(
      { goal: "plan all agents" },
      { env: {}, now: fixedNow, readFileImpl: async () => receipt }
    );

    expect(plan).toMatchObject({
      status: "autoloop-dry-run-plan-ready",
      dryRun: true,
      liveSync: false,
      persistentLoopRunning: false,
      allAgentsSynced: false,
      allAgentsApproved: false,
      externalWrites: false,
      commandExecuted: false,
      omnirouteHandshake: { allComplete: false, activatedLanes: 0 },
      a2aSyncPlan: { deliveredTo: [], providerCalled: false, telegramSent: false },
      enterpriseDispatch: { plannedRoleCount: 47, spawnedRoleCount: 0, maxConcurrentWorkers: 3 }
    });
    expect(plan.targetAgents).toHaveLength(16);
    expect(plan.targetLanes).toHaveLength(16);
    expect(plan.a2aSyncPlan.plannedTargets).toHaveLength(16);
  });

  it("blocks dryRun=false instead of starting a loop or workers", async () => {
    const plan = await createCodexAutoloopPlan({ dryRun: false }, { now: fixedNow });

    expect(plan).toMatchObject({
      status: "blocked-autoloop-live-request",
      liveSync: false,
      persistentLoopRunning: false,
      externalWrites: false,
      commandExecuted: false
    });
  });

  it("projects the Rust bridge status contract without exposing action modes", async () => {
    const status = await getCodexBridgeStatus({
      env: {},
      now: fixedNow,
      readFileImpl: async () => receipt
    });

    expect(status).toMatchObject({
      status: "ok",
      mode: "read-only-status",
      a2a: {
        agents: 16,
        canSendTelegram: false,
        canRunMcp: false,
        canStartAgents: false
      },
      omniroute: {
        lanes: 16,
        routes: 35,
        tmuxSessions: 16,
        observedLanes: 0
      },
      externalWrites: false,
      providerCalled: false,
      telegramSent: false,
      commandExecuted: false
    });
  });

  it("rejects legacy CLI action modes instead of silently returning status", async () => {
    await expect(runCodexAutoloopCliMode("full", { env: {} }))
      .rejects.toMatchObject({ code: "unsupported_codex_bridge_mode" });
  });

  it("rejects non-string and empty bridge modes instead of coercing to status", async () => {
    for (const mode of [false, 0, null, ""]) {
      await expect(runCodexAutoloopCliMode(mode)).rejects.toThrow();
    }
  });
});
