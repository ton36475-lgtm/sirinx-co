import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createA2aSyncPlan, getA2aSyncStatus } from "./a2a-sync.mjs";
import { executeOmnirouteHandshake, getOmnirouteStatus } from "./a2a-omniroute.mjs";
import {
  createAgenticEnterpriseDispatchPlan,
  getAgenticEnterpriseStatus
} from "./agentic-enterprise.mjs";

export const CODEX_AUTOLOOP_VERSION = "2.0";
export const CODEX_BRIDGE_MODES = Object.freeze(["status"]);
const DEFAULT_OPENCODE_RECEIPT_URL = new URL(
  "../../../reports/runtime/opencode-handshake-20260720-001/HANDSHAKE.json",
  import.meta.url
);

function currentDate(options = {}) {
  const value = typeof options.now === "function" ? options.now() : options.now || new Date();
  return value instanceof Date ? value : new Date(value);
}

async function readOpenCodeReceipt(options = {}) {
  const readFileImpl = options.readFileImpl || readFile;
  try {
    const value = JSON.parse(await readFileImpl(options.openCodeReceiptUrl || DEFAULT_OPENCODE_RECEIPT_URL, "utf8"));
    const valid = value?.agentId === "opencode"
      && value?.processExitCode === 0
      && value?.writeObserved === true
      && typeof value?.jobSha256 === "string"
      && typeof value?.resultSha256 === "string";
    return {
      observed: valid,
      status: valid ? "bounded-job-receipt-observed" : "receipt-invalid",
      jobIdPresent: typeof value?.jobId === "string" && value.jobId.length > 0,
      providerCall: valid && value.providerCall === true,
      reportedZeroCost: valid && value.reportedCost === 0,
      writeScopeBounded: valid && Array.isArray(value.writeScope) && value.writeScope.length === 1,
      persistentConnectionVerified: valid && value.omnirouteEvidence?.persistentConnectionVerified === true,
      routeActivityVerified: valid && value.omnirouteEvidence?.routeActivityVerified === true,
      telegramSent: valid && value.externalOutcomes?.telegramSent === true,
      mcpCalled: valid && value.externalOutcomes?.mcpCalled === true
    };
  } catch {
    return {
      observed: false,
      status: "receipt-unavailable",
      jobIdPresent: false,
      providerCall: false,
      reportedZeroCost: false,
      writeScopeBounded: false,
      persistentConnectionVerified: false,
      routeActivityVerified: false,
      telegramSent: false,
      mcpCalled: false
    };
  }
}

export async function getCodexAutoloopStatus(options = {}) {
  const [a2a, omniroute, enterprise, openCodeReceipt] = await Promise.all([
    getA2aSyncStatus(options),
    getOmnirouteStatus(options),
    Promise.resolve(getAgenticEnterpriseStatus(options)),
    readOpenCodeReceipt(options)
  ]);
  const opencodeLane = omniroute.lanes.find((lane) => lane.id === "opencode-lane");

  return {
    title: "Codex/OpenCode A2A Autoloop",
    version: CODEX_AUTOLOOP_VERSION,
    status: openCodeReceipt.observed
      ? "autoloop-evidence-ready-not-started"
      : "autoloop-configured-unverified",
    mode: "bounded-plan-and-receipt-only",
    liveSync: false,
    persistentLoopRunning: false,
    allAgentsSynced: false,
    allAgentsApproved: false,
    externalWrites: false,
    providerCallAuthorized: false,
    canSpawnAgents: false,
    canActivateRoutes: false,
    canSendTelegram: false,
    commandExecuted: false,
    openCode: {
      laneConfigured: Boolean(opencodeLane),
      laneObserved: opencodeLane?.observed === true,
      laneActivated: false,
      boundedReceipt: openCodeReceipt
    },
    summary: {
      a2aSurfaceAgents: a2a.summary.syncAgents,
      omnirouteLanes: omniroute.summary.lanes,
      observedLanes: omniroute.summary.observedLanes,
      activeRoutes: 0,
      logicalRoninRoles: enterprise.summary.roninRoleCards,
      registeredRoninRoles: enterprise.summary.registeredRoles,
      spawnedRoninRoles: enterprise.summary.spawnedRoles,
      runningLoops: 0,
      providerCallsThisStatus: 0,
      telegramSendsThisStatus: 0
    },
    stopRules: [
      "A bounded OpenCode job receipt is not a persistent A2A connection or live autoloop.",
      "An ACP initialize response is identity evidence only; it creates no session, route, lease, or approval.",
      "Do not activate all agents from configuration or process presence.",
      "Dispatch at most three worker roles after exact task envelopes and leases exist.",
      "Do not report all agents synced or approved without task-bound route and receipt evidence."
    ],
    nextRecommendedAction: "Review a dry-run autoloop plan; issue exact task envelopes and leases for one bounded wave before any worker dispatch.",
    updatedAt: currentDate(options).toISOString()
  };
}

export async function createCodexAutoloopPlan(input = {}, options = {}) {
  const requestId = String(input.requestId || "codex-autoloop-plan").trim().slice(0, 128);
  const goal = String(input.goal || "plan bounded A2A sync for all registered agents").trim();
  if (input.dryRun === false) {
    return {
      title: "Codex/OpenCode A2A Autoloop Plan",
      status: "blocked-autoloop-live-request",
      mode: "local-only-dry-run",
      requestId,
      goal,
      liveSync: false,
      persistentLoopRunning: false,
      externalWrites: false,
      commandExecuted: false,
      blockedReasons: ["live_autoloop_requires_task_envelopes_leases_route_receipts_and_worker_slots"],
      stopPoint: "AUTOLOOP LIVE REQUEST BLOCKED - NO AGENT SPAWNED OR ROUTE ACTIVATED",
      updatedAt: currentDate(options).toISOString()
    };
  }

  const status = await getCodexAutoloopStatus(options);
  const omniroute = await getOmnirouteStatus(options);
  const a2a = await getA2aSyncStatus(options);
  const targetAgents = a2a.syncAgents.map((agent) => agent.id);
  const targetLanes = omniroute.lanes.map((lane) => lane.id);
  const [handshake, syncPlan] = await Promise.all([
    executeOmnirouteHandshake(
      { requestId: `${requestId}-handshake`, goal: "bounded local omniroute evidence plan", targetLanes, dryRun: true },
      options
    ),
    createA2aSyncPlan(
      {
        requestId: `${requestId}-sync`,
        goal: "bounded local agent sync plan",
        sourceAgent: "codex",
        targetAgents,
        messageType: "sync_request",
        message: "",
        dryRun: true
      },
      options
    )
  ]);
  const enterprisePlan = createAgenticEnterpriseDispatchPlan(
    { requestId: `${requestId}-enterprise`, goal, dryRun: true },
    options
  );

  return {
    title: "Codex/OpenCode A2A Autoloop Plan",
    status: "autoloop-dry-run-plan-ready",
    mode: "local-only-dry-run",
    requestId,
    goal,
    dryRun: true,
    liveSync: false,
    persistentLoopRunning: false,
    allAgentsSynced: false,
    allAgentsApproved: false,
    externalWrites: false,
    providerCallAuthorized: false,
    commandExecuted: false,
    targetAgents,
    targetLanes,
    omnirouteHandshake: {
      status: handshake.status,
      allEvidenceObserved: handshake.handshake?.allEvidenceObserved === true,
      allComplete: handshake.handshake?.allComplete === true,
      activatedLanes: handshake.handshake?.activatedLanes || 0
    },
    a2aSyncPlan: {
      status: syncPlan.status,
      plannedTargets: syncPlan.syncPlan?.plannedTargets || [],
      deliveredTo: syncPlan.syncPlan?.deliveredTo || [],
      providerCalled: syncPlan.syncPlan?.providerCalled === true,
      telegramSent: syncPlan.syncPlan?.telegramSent === true
    },
    enterpriseDispatch: {
      status: enterprisePlan.status,
      plannedRoleCount: enterprisePlan.plannedRoleCount,
      spawnedRoleCount: enterprisePlan.spawnedRoleCount,
      maxConcurrentWorkers: enterprisePlan.maxConcurrentWorkers,
      waveCount: enterprisePlan.waves.length
    },
    evidence: status.openCode.boundedReceipt,
    stopPoint: "AUTOLOOP PLAN READY - ZERO ROUTES ACTIVATED - ZERO WORKERS SPAWNED",
    updatedAt: currentDate(options).toISOString()
  };
}

export async function getCodexBridgeStatus(options = {}) {
  const [a2a, omniroute] = await Promise.all([
    getA2aSyncStatus(options),
    getOmnirouteStatus(options)
  ]);

  return {
    status: "ok",
    mode: "read-only-status",
    runtimeStatus: {
      a2a: a2a.status,
      omniroute: omniroute.status
    },
    a2a: {
      mode: a2a.mode,
      agents: a2a.summary.syncAgents,
      liveTelegram: a2a.summary.liveTelegramReady === true,
      canSendTelegram: a2a.canSendTelegram === true,
      canRunMcp: false,
      canStartAgents: false
    },
    omniroute: {
      lanes: omniroute.summary.lanes,
      routes: omniroute.summary.routes,
      tmuxSessions: Array.isArray(omniroute.tmuxSessions) ? omniroute.tmuxSessions.length : 0,
      observedSurfaces: omniroute.summary.observedSurfaces,
      observedLanes: omniroute.summary.observedLanes
    },
    externalWrites: false,
    providerCalled: false,
    telegramSent: false,
    commandExecuted: false,
    stopPoint: "CODEX BRIDGE STATUS ONLY - NO HANDSHAKE, ACTIVATION, SYNC, OR PROVIDER ACTION"
  };
}

export async function runCodexAutoloopCliMode(mode = "status", options = {}) {
  if (typeof mode !== "string") {
    const error = new TypeError("unsupported_codex_bridge_mode_type");
    error.code = "unsupported_codex_bridge_mode_type";
    throw error;
  }
  const normalizedMode = mode.trim();
  if (!CODEX_BRIDGE_MODES.includes(normalizedMode)) {
    const error = new Error(`unsupported_codex_bridge_mode:${normalizedMode}`);
    error.code = "unsupported_codex_bridge_mode";
    throw error;
  }

  return getCodexBridgeStatus(options);
}

async function runCli() {
  if (process.argv.length > 3) {
    const error = new Error("unexpected_codex_bridge_arguments");
    error.code = "unexpected_codex_bridge_arguments";
    throw error;
  }
  const mode = process.argv.length === 3 ? process.argv[2] : "status";
  const result = await runCodexAutoloopCliMode(mode, { env: {} });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await runCli();
  } catch (error) {
    console.error(JSON.stringify({
      status: "codex-bridge-cli-rejected",
      error: error?.code || "codex_bridge_cli_failed",
      commandExecuted: false
    }));
    process.exitCode = 2;
  }
}
