import { describe, expect, it, vi } from "vitest";
import {
  omnirouteBlockedActions,
  getOmnirouteStatus,
  executeOmnirouteHandshake,
  activateOmnirouteLane,
  probeHermesRuntime
} from "./a2a-omniroute.mjs";

const fixedNow = () => new Date("2026-05-27T03:00:00.000Z");
const allAgentIds = [
  "hermes-agent", "codex", "codex-app", "claude-code", "opencode",
  "openclaw", "a2a-sync", "telegram-bot", "copilot-cli", "pi", "droid", "manus",
  "hermes-one", "kimi-code", "claude-cowork"
];

const observedRuntime = {
  source: "offline-test-evidence",
  collectedAt: "2026-05-27T02:59:00.000Z",
  agentIds: allAgentIds,
  hermes: {
    health: { observed: true, ok: true },
    agentCard: { observed: true, ok: true, cardCount: 2, agentIds: ["codex", "hermes-agent"] },
    knowledge: { observed: true, ok: true, dryRun: true, liveSend: false }
  },
  cmux: { observed: true, available: true, workspaceCount: 2, agentIds: ["codex", "opencode"] },
  mcp: { observed: true, available: true, serverIds: ["sirinx-files", "slayer-demo"] },
  manus: { observed: true, ok: true, appInstalled: true, bundleId: "tech.butterfly.app" },
  hermesOne: { observed: true, ok: true, appInstalled: true, bundleId: "com.nousresearch.hermes", version: "0.7.3" },
  surfaces: {
    "kimi-code": { observed: true, installed: true, running: true, available: true, handshakeVerified: true, version: "0.27.0" },
    "claude-cowork": { observed: true, installed: true, running: true, available: true, handshakeVerified: true, version: "1.22209.3" }
  }
};

describe("OmniRoute status", () => {
  it("reports configured lanes as unverified without making a default runtime probe", async () => {
    const fetchImpl = vi.fn(() => {
      throw new Error("must not probe by default");
    });
    const status = await getOmnirouteStatus({ now: fixedNow, env: {}, fetchImpl });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(status.title).toBe("A2A OmniRoute System");
    expect(status.status).toBe("omniroute-configured-unverified");
    expect(status.mode).toBe("local-evidence-only");
    expect(status.version).toBe("1.5");
    expect(status.canSendTelegram).toBe(false);
    expect(status.canStartAgents).toBe(false);
    expect(status.canCreateTmuxSessions).toBe(false);
    expect(status.commandExecuted).toBe(false);
    expect(status.summary.lanes).toBe(16);
    expect(status.summary.routes).toBe(35);
    expect(status.summary.observedLanes).toBe(0);
    expect(status.summary.mcpConfigured).toBe(true);
    expect(status.summary.mcpEnabled).toBe(false);
    expect(status.summary.tmuxSessionPlanned).toBe(16);
    expect(status.summary.logicalRoninRoles).toBe(47);
    expect(status.summary.executionPrincipals).toBe(14);
    expect(status.summary.sourceWriterCandidates).toBe(1);
    expect(status.runtimeEvidence.available).toBe(false);
    expect(new Set(status.lanes.map((lane) => lane.id)).size).toBe(status.lanes.length);
    expect(new Set(status.routes.map((route) => `${route.from}:${route.to}:${route.via}:${route.type}`)).size)
      .toBe(status.routes.length);
    expect(new Set(status.tmuxSessions.map((session) => session.session)).size)
      .toBe(status.tmuxSessions.length);
    for (const session of status.tmuxSessions) {
      expect(session).toMatchObject({
        command: null,
        manualOnly: true,
        created: false,
        observed: false
      });
    }
    expect(status.mcpIntegration.servers["kimi-code-bridge"]).toBeUndefined();
  });

  it("routes approval requests from CLI/Code agents to Hermes Command Center via Telegram", async () => {
    const status = await getOmnirouteStatus({ now: fixedNow, env: {} });
    const cliSourceAgents = [
      "codex",
      "codex-app",
      "claude-code",
      "claude-cowork",
      "kimi-code",
      "opencode",
      "copilot-cli",
      "antigravity",
      "openclaw"
    ];
    for (const source of cliSourceAgents) {
      const match = status.routes.find((route) =>
        route.from === source &&
        route.to === "telegram-bot" &&
        route.via === "telegram" &&
        route.type === "approval_request"
      );
      expect(match).toBeDefined();
    }
  });

  it("does not promote Claude Cowork or Kimi Code surface presence to an A2A handshake", async () => {
    const status = await getOmnirouteStatus({
      now: fixedNow,
      env: {},
      runtimeEvidence: {
        source: "local-read-only-surface-audit",
        surfaces: {
          "claude-cowork": {
            observed: true,
            installed: true,
            running: true,
            available: false,
            handshakeVerified: false,
            reason: "app_running_no_a2a_identity_evidence"
          },
          "kimi-code": {
            observed: true,
            installed: true,
            running: false,
            available: true,
            handshakeVerified: false,
            version: "0.27.0",
            reason: "cli_installed_acp_not_started"
          }
        }
      }
    });

    expect(status.runtimeEvidence.observedAgentIds).toEqual([]);
    expect(status.runtimeEvidence.reportedAgentIds).toEqual([]);
    expect(status.summary.observedSurfaces).toBe(0);
    expect(status.summary.reportedSurfaces).toBe(2);
    expect(status.summary.surfaceOnlyLanes).toBe(0);
    expect(status.summary.reportedLanes).toBe(2);
    for (const laneId of ["claude-cowork-lane", "kimi-code-lane"]) {
      const lane = status.lanes.find((item) => item.id === laneId);
      expect(lane.observed).toBe(false);
      expect(lane.observedAgents).toEqual([]);
      expect(lane.status).toBe("runtime-evidence-reported-not-admitted");
    }
    expect(status.runtimeEvidence.surfaces["kimi-code"]).toMatchObject({
      protocol: "acp-stdio-available",
      reportedObserved: true,
      reportedInstalled: true,
      reportedAvailable: true,
      reportedVersion: "0.27.0",
      installed: false,
      running: false,
      available: false,
      handshakeVerified: false,
      version: null
    });
  });

  it("keeps a caller-reported handshake outside connection admission", async () => {
    const status = await getOmnirouteStatus({
      now: fixedNow,
      env: {},
      runtimeEvidence: {
        surfaces: {
          "kimi-code": {
            observed: true,
            installed: true,
            running: true,
            available: true,
            handshakeVerified: true
          }
        }
      }
    });

    const lane = status.lanes.find((item) => item.id === "kimi-code-lane");
    expect(lane.observed).toBe(false);
    expect(lane.observedAgents).toEqual([]);
    expect(lane.reportedAgents).toEqual(["kimi-code"]);
    expect(lane.status).toBe("runtime-evidence-reported-not-admitted");
    expect(status.runtimeEvidence.surfaces["kimi-code"]).toMatchObject({
      reportedHandshakeVerified: true,
      handshakeVerified: false
    });
    expect(lane.handshakeComplete).toBe(false);
  });

  it("separates configured lanes from caller-reported identities", async () => {
    const status = await getOmnirouteStatus({
      now: fixedNow,
      env: {},
      runtimeEvidence: {
        source: "offline-test-evidence",
        agentIds: ["hermes-agent", "codex"],
        cmux: { observed: true, available: true, workspaceCount: 1, agentIds: [] }
      }
    });

    expect(status.status).toBe("omniroute-evidence-reported-not-admitted");
    const hermes = status.lanes.find((lane) => lane.id === "hermes-orchestrator");
    expect(hermes.configured).toBe(true);
    expect(hermes.observed).toBe(false);
    expect(hermes.reportedAgents).toEqual(["hermes-agent"]);
    expect(hermes.handshakeComplete).toBe(false);

    const codex = status.lanes.find((lane) => lane.id === "codex-coding");
    expect(codex.observed).toBe(false);
    expect(codex.observedAgents).toEqual([]);
    expect(codex.reportedAgents).toEqual(["codex"]);
    expect(codex.unverifiedAgents).toEqual(["codex"]);
    expect(codex.agentCard).toMatchObject({
      principalId: "codex",
      reportedObserved: true,
      observed: false,
      endpointVerified: false,
      registrationEligible: false,
      sourceWriterCandidate: true,
      sourceLeaseHeld: false,
      canWriteSource: false
    });
    expect(status.cmux.reportedObserved).toBe(true);
    expect(status.cmux.observed).toBe(false);
    expect(status.cmux.agentIds).toEqual([]);
  });

  it("keeps caller-reported MCP availability outside capability admission", async () => {
    const status = await getOmnirouteStatus({ now: fixedNow, env: {}, runtimeEvidence: observedRuntime });

    expect(status.mcpIntegration.configured).toBe(true);
    expect(status.mcpIntegration.enabled).toBe(false);
    expect(status.mcpIntegration.available).toBe(false);
    expect(status.mcpIntegration.reportedAvailable).toBe(true);
    expect(status.mcpIntegration.observedServerCount).toBe(0);
    expect(status.mcpIntegration.reportedServerCount).toBe(2);
    expect(status.mcpIntegration.servers["sirinx-files"]).toMatchObject({
      configured: true,
      reported: true,
      observed: false,
      syncConfigured: true,
      syncEnabled: false,
      status: "runtime-reported-not-admitted"
    });
    expect(status.mcpIntegration.servers.supabase).toMatchObject({
      configured: true,
      observed: false,
      syncEnabled: false
    });
    expect(status.canRunMcp).toBe(false);
  });

  it("labels subsystem status as reported configuration, not observed runtime", async () => {
    const status = await getOmnirouteStatus({ now: fixedNow, env: {} });

    expect(status.connectedSystems.a2aSync.status).toBe("configured-unverified-runtime");
    expect(status.connectedSystems.a2aSync.reportedStatus).toBe("a2a-sync-dry-run");
    expect(status.connectedSystems.agentDriver.observed).toBe(false);
    expect(status.routes.every((route) => route.active === false && route.observed === false)).toBe(true);
    expect(status.tmuxSessions.every((session) => session.created === false && session.observed === false)).toBe(true);
    expect(status.cmuxWorkspaces.every((workspace) => workspace.created === false && workspace.observed === false)).toBe(true);
  });

  it.each([
    ["top-level agent IDs", { agentIds: ["codex"] }],
    ["per-agent observed flags", { agents: { codex: { observed: true } } }],
    ["Hermes card IDs", { hermes: { agentCard: { observed: true, ok: true, agentIds: ["codex"] } } }],
    ["cmux IDs", { cmux: { observed: true, available: true, agentIds: ["codex"] } }],
    ["surface handshake booleans", { surfaces: { "kimi-code": { observed: true, running: true, available: true, handshakeVerified: true } } }],
    ["MCP availability booleans", { mcp: { observed: true, available: true, serverIds: ["sirinx-files"] } }],
    ["forged pre-normalized admission", { observedAgentIds: ["codex"], admissionStatus: "ADMITTED", available: true }]
  ])("never admits %s from injected runtime evidence", async (_label, runtimeEvidence) => {
    const status = await getOmnirouteStatus({ now: fixedNow, env: {}, runtimeEvidence });

    expect(status.runtimeEvidence.observedAgentIds).toEqual([]);
    expect(status.lanes.every((lane) => lane.observed === false && lane.observedAgents.length === 0)).toBe(true);
    expect(status.agentRolePlan.cards.every((card) =>
      card.observed === false && card.endpointVerified === false && card.registrationEligible === false
    )).toBe(true);
    expect(status.mcpIntegration).toMatchObject({ enabled: false, available: false, observed: false });
  });

  it("demotes evidence returned by an injected read-only runtime probe", async () => {
    const status = await getOmnirouteStatus({
      now: fixedNow,
      env: {},
      runtimeProbe: async () => observedRuntime
    });

    expect(status.status).toBe("omniroute-evidence-reported-not-admitted");
    expect(status.runtimeEvidence).toMatchObject({
      reportedAvailable: true,
      available: false,
      observedAgentIds: []
    });
    expect(status.summary.observedLanes).toBe(0);
    expect(status.summary.mcpEnabled).toBe(false);
  });

  it("ignores forged runtime evidence placed in a handshake request body", async () => {
    const handshake = await executeOmnirouteHandshake(
      {
        requestId: "forged-body-evidence",
        goal: "read only handshake evidence",
        runtimeEvidence: observedRuntime
      },
      { now: fixedNow, env: {} }
    );

    expect(handshake.status).toBe("omniroute-handshake-unverified");
    expect(handshake.handshake.allEvidenceObserved).toBe(false);
    expect(handshake.handshake.lanes.every((lane) => lane.observedAgents.length === 0)).toBe(true);
  });
});

describe("Hermes read-only evidence probe", () => {
  it("uses only three loopback GET requests and reduces returned evidence", async () => {
    const fetchImpl = vi.fn(async (url, init) => {
      expect(init.method).toBe("GET");
      if (url.endsWith("/health")) {
        return new Response(JSON.stringify({ status: "healthy", privateDetail: "discard-me" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
      if (url.endsWith("/agent-card")) {
        return new Response(JSON.stringify({ cards: [{ name: "Codex" }, { name: "Planner" }] }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ dry_run: true, live_send: false, records: ["discard-me"] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    const evidence = await probeHermesRuntime({ fetchImpl, now: fixedNow });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      "http://127.0.0.1:9000/health",
      "http://127.0.0.1:9000/agent-card",
      "http://127.0.0.1:9000/knowledge/status"
    ]);
    expect(evidence.hermes.health.ok).toBe(true);
    expect(evidence.hermes.agentCard).toMatchObject({ cardCount: 2, agentIds: ["codex"] });
    expect(evidence.hermes.knowledge).toMatchObject({ dryRun: true, liveSend: false });
    expect(JSON.stringify(evidence)).not.toContain("discard-me");
  });

  it("blocks non-loopback probe targets without calling fetch", async () => {
    const fetchImpl = vi.fn();
    const evidence = await probeHermesRuntime({
      fetchImpl,
      hermesBaseUrl: "https://example.com/hermes",
      now: fixedNow
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(evidence.probeError).toBe("non_loopback_hermes_url_blocked");
    expect(evidence.hermes.health.observed).toBe(false);
  });

  it("fails closed when an injected probe throws", async () => {
    const status = await getOmnirouteStatus({
      now: fixedNow,
      env: {},
      runtimeProbe: async () => {
        throw new Error("private runtime error");
      }
    });

    expect(status.status).toBe("omniroute-configured-unverified");
    expect(status.runtimeEvidence.probeError).toBe("runtime_probe_failed");
    expect(JSON.stringify(status)).not.toContain("private runtime error");
  });

  it("keeps successful opt-in Hermes probe results reported but not admitted", async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (url.endsWith("/health")) return new Response(JSON.stringify({ status: "healthy" }), { status: 200 });
      if (url.endsWith("/agent-card")) return new Response(JSON.stringify({ cards: [{ name: "Codex" }] }), { status: 200 });
      return new Response(JSON.stringify({ dry_run: true, live_send: false }), { status: 200 });
    });
    const status = await getOmnirouteStatus({ now: fixedNow, env: {}, probeHermes: true, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(status.status).toBe("omniroute-evidence-reported-not-admitted");
    expect(status.runtimeEvidence.hermes).toMatchObject({ reportedObserved: true, observed: false });
    expect(status.runtimeEvidence.observedAgentIds).toEqual([]);
    expect(status.lanes.find((lane) => lane.id === "hermes-orchestrator").observed).toBe(false);
  });
});

describe("OmniRoute handshake", () => {
  it("returns unverified evidence steps and never reports a completed handshake by default", async () => {
    const handshake = await executeOmnirouteHandshake(
      { requestId: "omniroute-test", goal: "a2a omniroute handshake for all agents" },
      { now: fixedNow, env: {} }
    );

    expect(handshake.status).toBe("omniroute-handshake-unverified");
    expect(handshake.mode).toBe("local-evidence-only");
    expect(handshake.commandExecuted).toBe(false);
    expect(handshake.syncNotification).toBeNull();
    expect(handshake.handshake.protocol).toHaveLength(7);
    expect(handshake.handshake.totalLanes).toBe(16);
    expect(handshake.handshake.allComplete).toBe(false);
    expect(handshake.handshake.allEvidenceObserved).toBe(false);
    expect(handshake.handshake.activatedLanes).toBe(0);

    const hermes = handshake.handshake.lanes.find((lane) => lane.laneId === "hermes-orchestrator");
    expect(hermes.handshakeSteps.map((step) => step.status)).toEqual([
      "unverified",
      "configured",
      "configured-unverified",
      "dry-run",
      "unverified",
      "required",
      "not-executed"
    ]);
    expect(hermes.allStepsComplete).toBe(false);
    expect(hermes.requiresApproval).toBe(true);
    expect(hermes.liveActivated).toBe(false);
  });

  it("does not treat caller-reported evidence as handshake-ready", async () => {
    const handshake = await executeOmnirouteHandshake(
      { requestId: "evidence-ready", goal: "read only handshake evidence" },
      { now: fixedNow, env: {}, runtimeEvidence: observedRuntime }
    );

    expect(handshake.status).toBe("omniroute-handshake-evidence-reported-not-admitted");
    expect(handshake.handshake.allEvidenceObserved).toBe(false);
    expect(handshake.handshake.allComplete).toBe(false);
    expect(handshake.handshake.activatedLanes).toBe(0);
    expect(handshake.liveActivationRequired).toBe(true);
    expect(handshake.externalWrites).toBe(false);
  });

  it("never claims a provider notification on a non-dry-run request", async () => {
    const handshake = await executeOmnirouteHandshake(
      { requestId: "no-provider", goal: "read only handshake evidence", dryRun: false },
      { now: fixedNow, env: {}, runtimeEvidence: observedRuntime }
    );

    expect(handshake.syncNotification).toMatchObject({
      routed: false,
      attempted: false,
      sent: false,
      providerCalled: false
    });
    expect(handshake.externalWrites).toBe(false);
    expect(handshake.commandExecuted).toBe(false);
  });

  it("blocks dangerous goals", async () => {
    const handshake = await executeOmnirouteHandshake(
      { goal: "deploy and push to github" },
      { now: fixedNow, env: {} }
    );

    expect(handshake.status).toBe("blocked-omniroute-handshake");
    expect(handshake.handshake).toBeNull();
    expect(handshake.externalWrites).toBe(false);
    expect(handshake.canSendTelegram).toBe(false);
  });

  it("handles partial lane targeting without upgrading evidence", async () => {
    const handshake = await executeOmnirouteHandshake(
      {
        requestId: "omniroute-partial",
        goal: "handshake only hermes and telegram lanes",
        targetLanes: ["hermes-orchestrator", "messaging-telegram"]
      },
      { now: fixedNow, env: {}, runtimeEvidence: { agentIds: ["hermes-agent"] } }
    );

    expect(handshake.status).toBe("omniroute-handshake-evidence-reported-not-admitted");
    expect(handshake.handshake.totalLanes).toBe(2);
    expect(handshake.handshake.lanes.map((lane) => lane.laneId)).toEqual([
      "hermes-orchestrator", "messaging-telegram"
    ]);
    expect(handshake.handshake.allComplete).toBe(false);
  });
});

describe("OmniRoute lane activation preview", () => {
  it("rejects unknown lane IDs", async () => {
    const result = await activateOmnirouteLane(
      { laneId: "nonexistent-lane" },
      { now: fixedNow, env: {} }
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain("unknown_lane");
    expect(result.activated).toBe(false);
  });

  it("prepares local sync plans but never claims activation", async () => {
    const result = await activateOmnirouteLane(
      { laneId: "messaging-telegram" },
      { now: fixedNow, env: {} }
    );

    expect(result.ok).toBe(true);
    expect(result.laneId).toBe("messaging-telegram");
    expect(result.route).toEqual(["TELEGRAM", "HERMES"]);
    expect(result.activated).toBe(false);
    expect(result.liveActivated).toBe(false);
    expect(result.activationStatus).toBe("not-executed");
    expect(result.syncPlansCreated).toBe(1);
    expect(result.commandExecuted).toBe(false);
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.telegramNotification).toMatchObject({
      routed: false,
      sent: false,
      providerCalled: false
    });
  });

  it("keeps MCP disabled when only caller-reported evidence is supplied", async () => {
    const unverified = await activateOmnirouteLane(
      { laneId: "hermes-orchestrator" },
      { now: fixedNow, env: {} }
    );
    const observed = await activateOmnirouteLane(
      { laneId: "hermes-orchestrator" },
      { now: fixedNow, env: {}, runtimeEvidence: observedRuntime }
    );

    expect(unverified.mcpConfigured).toBe(true);
    expect(unverified.mcpEnabled).toBe(false);
    expect(observed.mcpEnabled).toBe(false);
    expect(observed.observed).toBe(false);
    expect(observed.activated).toBe(false);
  });
});

describe("OmniRoute safety contract", () => {
  it("keeps irreversible runtime actions blocked", () => {
    expect(omnirouteBlockedActions).toEqual(expect.arrayContaining([
      "tmux_session_auto_create",
      "mcp_server_auto_start",
      "gateway_auto_reload",
      "agent_auto_deploy"
    ]));
  });
});
