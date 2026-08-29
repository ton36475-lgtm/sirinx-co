import { getA2aSyncStatus, createA2aSyncPlan, a2aSyncBlockedActions } from "./a2a-sync.mjs";
import { getAgentDriverStatus } from "./agent-driver.mjs";
import { getAgentLaunchGateStatus } from "./agent-launch-gate.mjs";
import { getAiTeamPairingStatus } from "./ai-team-pairing.mjs";
import { getConnectorRegistryStatus } from "./connector-registry.mjs";
import { getCenterBrainHubStatus } from "./centerbrain-hub.mjs";
import { getTeamRuntimeBridgeStatus } from "./team-runtime-bridge.mjs";
import { getRuntimeAgentRolePlan } from "./runtime-agent-cards.mjs";
import { buildAgentCard, registerAgentWithControl, syncAgentIds } from "./a2a-live-sync.mjs";

export const OMNIROUTE_VERSION = "1.5";

export const omnirouteBlockedActions = [
  ...a2aSyncBlockedActions,
  "tmux_session_auto_create",
  "mcp_server_auto_start",
  "gateway_auto_reload",
  "agent_auto_deploy"
];

const HANDSHAKE_STEPS = [
  "discover",
  "classify",
  "route",
  "sync-plan",
  "evidence",
  "approval",
  "manual-activation"
];

const OMNIROUTE_LANES = [
  {
    id: "hermes-orchestrator",
    title: "Hermes Orchestrator",
    route: ["HERMES", "CODEX", "ANTIGRAVITY"],
    agents: ["hermes-agent"],
    tmuxSession: "hermes-gateway",
    mcpConfigured: true,
    telegramConfigured: true
  },
  {
    id: "codex-coding",
    title: "Codex Coding Lane",
    route: ["CODEX", "A2A"],
    agents: ["codex"],
    tmuxSession: "codex-lane",
    mcpConfigured: true,
    telegramConfigured: false
  },
  {
    id: "codex-app-lane",
    title: "Codex App Operator Surface",
    route: ["CODEX_APP", "CODEX", "A2A"],
    agents: ["codex-app"],
    tmuxSession: "codex-app-lane",
    mcpConfigured: false,
    telegramConfigured: false
  },
  {
    id: "claude-code-lane",
    title: "Claude Code Architecture Lane",
    route: ["CLAUDE", "CODEX", "A2A"],
    agents: ["claude-code"],
    tmuxSession: "claude-code-lane",
    mcpConfigured: false,
    telegramConfigured: false
  },
  {
    id: "opencode-lane",
    title: "OpenCode Independent Review Lane",
    route: ["OPENCODE", "CODEX", "A2A"],
    agents: ["opencode"],
    tmuxSession: "opencode-lane",
    mcpConfigured: false,
    telegramConfigured: false
  },
  {
    id: "system-ghostclaw",
    title: "OpenClaw System Lane",
    route: ["OPENCLAW", "HERMES", "A2A"],
    agents: ["openclaw"],
    tmuxSession: "openclaw-lane",
    mcpConfigured: true,
    telegramConfigured: true
  },
  {
    id: "a2a-sync-lane",
    title: "A2A Sync Transport Lane",
    route: ["A2A", "HERMES"],
    agents: ["a2a-sync"],
    tmuxSession: "a2a-sync-lane",
    mcpConfigured: false,
    telegramConfigured: true
  },
  {
    id: "messaging-telegram",
    title: "Telegram Messaging Lane",
    route: ["TELEGRAM", "HERMES"],
    agents: ["telegram-bot"],
    tmuxSession: "telegram-lane",
    mcpConfigured: false,
    telegramConfigured: true
  },
  {
    id: "assistant-lane",
    title: "Copilot CLI Assistant Lane",
    route: ["COPILOT", "CODEX", "A2A"],
    agents: ["copilot-cli"],
    tmuxSession: "copilot-lane",
    mcpConfigured: false,
    telegramConfigured: false
  },
  {
    id: "pi-lane",
    title: "Pi Research Advisory Lane",
    route: ["PI", "HERMES", "A2A"],
    agents: ["pi"],
    tmuxSession: "pi-lane",
    mcpConfigured: false,
    telegramConfigured: false
  },
  {
    id: "mobile-droid",
    title: "Mobile Droid Lane",
    route: ["DROID", "A2A"],
    agents: ["droid"],
    tmuxSession: "mobile-lane",
    mcpConfigured: false,
    telegramConfigured: true
  },
  {
    id: "manus-agent",
    title: "Manus Agent Platform",
    route: ["MANUS", "HERMES", "A2A"],
    agents: ["manus"],
    tmuxSession: "manus-lane",
    mcpConfigured: true,
    telegramConfigured: true
  },
  {
    id: "hermes-one-lane",
    title: "Hermes One Desktop",
    route: ["HERMES_ONE", "HERMES", "A2A"],
    agents: ["hermes-one"],
    tmuxSession: "hermes-one-lane",
    mcpConfigured: true,
    telegramConfigured: true
  },
  {
    id: "kimi-code-lane",
    title: "Kimi Code Lane",
    route: ["KIMI_CODE", "CODEX", "A2A"],
    agents: ["kimi-code"],
    tmuxSession: "kimi-code-lane",
    mcpConfigured: false,
    telegramConfigured: false
  },
  {
    id: "claude-cowork-lane",
    title: "Claude Cowork Desktop Lane",
    route: ["CLAUDE_COWORK", "CLAUDE", "CODEX", "A2A"],
    agents: ["claude-cowork"],
    tmuxSession: "claude-cowork-lane",
    mcpConfigured: false,
    telegramConfigured: true
  },
  {
    id: "antigravity-lane",
    title: "Antigravity Gemini Lane",
    route: ["ANTIGRAVITY", "CODEX", "A2A"],
    agents: ["antigravity"],
    tmuxSession: "antigravity-lane",
    mcpConfigured: false,
    telegramConfigured: false
  }
];

const OMNIROUTE_ROUTES = [
  { from: "hermes-agent", to: "telegram-bot", via: "telegram", type: "alert", priority: 1 },
  { from: "hermes-agent", to: "codex", via: "a2a", type: "sync_request", priority: 2 },
  { from: "hermes-agent", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 2 },
  { from: "codex", to: "hermes-agent", via: "a2a", type: "evidence_packet", priority: 2 },
  { from: "codex", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 2 },
  { from: "openclaw", to: "telegram-bot", via: "telegram", type: "alert", priority: 1 },
  { from: "openclaw", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 2 },
  { from: "a2a-sync", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 3 },
  { from: "telegram-bot", to: "hermes-agent", via: "a2a", type: "sync_request", priority: 1 },
  { from: "droid", to: "telegram-bot", via: "telegram", type: "alert", priority: 2 },
  { from: "claude-code", to: "codex", via: "a2a", type: "sync_request", priority: 3 },
  { from: "claude-code", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 3 },
  { from: "claude-cowork", to: "codex", via: "a2a", type: "sync_request", priority: 3 },
  { from: "claude-cowork", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 3 },
  { from: "codex", to: "claude-cowork", via: "a2a", type: "evidence_packet", priority: 3 },
  { from: "kimi-code", to: "codex", via: "a2a", type: "sync_request", priority: 3 },
  { from: "kimi-code", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 3 },
  { from: "codex", to: "kimi-code", via: "a2a", type: "evidence_packet", priority: 3 },
  { from: "opencode", to: "codex", via: "a2a", type: "sync_request", priority: 3 },
  { from: "opencode", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 3 },
  { from: "copilot-cli", to: "codex", via: "a2a", type: "notification", priority: 4 },
  { from: "copilot-cli", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 4 },
  { from: "pi", to: "hermes-agent", via: "a2a", type: "notification", priority: 4 },
  { from: "manus", to: "telegram-bot", via: "telegram", type: "alert", priority: 2 },
  { from: "codex", to: "manus", via: "a2a", type: "evidence_packet", priority: 3 },
  { from: "manus", to: "hermes-agent", via: "a2a", type: "sync_request", priority: 2 },
  { from: "hermes-one", to: "hermes-agent", via: "a2a", type: "sync_request", priority: 1 },
  { from: "hermes-one", to: "telegram-bot", via: "telegram", type: "alert", priority: 2 },
  { from: "codex-app", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 3 },
  { from: "codex", to: "hermes-one", via: "a2a", type: "evidence_packet", priority: 3 },
  { from: "claude-cowork", to: "hermes-agent", via: "a2a", type: "notification", priority: 2 },
  { from: "claude-cowork", to: "telegram-bot", via: "telegram", type: "alert", priority: 2 },
  { from: "antigravity", to: "codex", via: "a2a", type: "sync_request", priority: 3 },
  { from: "antigravity", to: "telegram-bot", via: "telegram", type: "approval_request", priority: 3 },
  { from: "codex", to: "antigravity", via: "a2a", type: "evidence_packet", priority: 3 }
];

const TMUX_SESSION_DEFINITIONS = [
  ["hermes-gateway", "hermes-agent", "hermes-agent"],
  ["codex-lane", "codex", "codex"],
  ["codex-app-lane", "codex-app", "codex-app"],
  ["claude-code-lane", "claude-code", "claude-code"],
  ["opencode-lane", "opencode", "opencode"],
  ["openclaw-lane", "openclaw", "openclaw"],
  ["a2a-sync-lane", "a2a-sync", "a2a-sync"],
  ["telegram-lane", "telegram-bot", "telegram-bot"],
  ["copilot-lane", "copilot-cli", "copilot-cli"],
  ["pi-lane", "pi", "pi"],
  ["mobile-lane", "droid", "droid"],
  ["manus-lane", "manus", "manus"],
  ["hermes-one-lane", "hermes-one", "hermes-one"],
  ["kimi-code-lane", "kimi-code", "kimi-code"],
  ["claude-cowork-lane", "claude-cowork", "claude-cowork"],
  ["antigravity-lane", "antigravity", "antigravity"]
].map(([session, window, agentId]) => ({
  session,
  window,
  agentId,
  command: null,
  cwd: "/Users/sirinx/SIRINXDev/sirinx-co",
  manualOnly: true
}));

const MCP_SERVER_DEFINITIONS = {
  "sirinx-files": { role: "file-system", syncConfigured: true, routeTo: ["codex", "hermes-agent", "manus"] },
  "slayer-demo": { role: "demo-agent", syncConfigured: true, routeTo: ["codex"] },
  "supabase": { role: "database-context", syncConfigured: false, routeTo: [] },
  "unreal-engine": { role: "render-engine", syncConfigured: false, routeTo: [] },
  "linear": { role: "project-management", syncConfigured: false, routeTo: [] },
  "hermes-one-bridge": { role: "desktop-bridge", syncConfigured: true, routeTo: ["hermes-one", "hermes-agent"] }
};

// Kimi Code advertises ACP over stdio. Do not label it as an MCP bridge until
// an actual adapter endpoint and runtime evidence are supplied.

const KNOWN_AGENT_IDS = new Set(OMNIROUTE_LANES.flatMap((lane) => lane.agents));
const KNOWN_MCP_SERVER_IDS = new Set(Object.keys(MCP_SERVER_DEFINITIONS));
const RUNTIME_SURFACE_DEFINITIONS = {
  "claude-cowork": { kind: "desktop-app", protocol: "unverified" },
  "kimi-code": { kind: "cli-and-desktop-app", protocol: "acp-stdio-available" }
};

function currentDate(options = {}) {
  const value = typeof options.now === "function" ? options.now() : options.now || new Date();
  return value instanceof Date ? value : new Date(value);
}

function nowIso(options = {}) {
  return currentDate(options).toISOString();
}

function lock() {
  return {
    externalWrites: false,
    productionWrites: false,
    customerVisible: false,
    canExecuteExternally: false,
    canCallPaidApi: false,
    canReadSecrets: false,
    canRunMcp: false,
    canSendTelegram: false,
    canStartAgents: false,
    canCreateTmuxSessions: false,
    commandExecuted: false,
    requiresHumanApproval: true
  };
}

function uniqueKnownIds(values, knownIds) {
  const raw = Array.isArray(values) ? values : [];
  return [...new Set(raw.map((value) => String(value).trim()).filter((id) => knownIds.has(id)))];
}

function normalizeAgentCardId(value) {
  const key = String(value || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
  const aliases = {
    "codex": "codex",
    "codex-app": "codex-app",
    "claude": "claude-code",
    "claude-code": "claude-code",
    "claude-cowork": "claude-cowork",
    "claude-cowork-app": "claude-cowork",
    "copilot": "copilot-cli",
    "copilot-cli": "copilot-cli",
    "copilot-cli-agent": "copilot-cli",
    "kimi": "kimi-code",
    "kimi-code": "kimi-code",
    "opencode": "opencode",
    "open-code": "opencode",
    "openclaw": "openclaw",
    "open-claw": "openclaw",
    "telegram": "telegram-bot",
    "telegram-bot": "telegram-bot",
    "hermes": "hermes-agent",
    "hermes-agent": "hermes-agent",
    "agy": "antigravity",
    "antigravity": "antigravity"
  };
  return aliases[key] || (KNOWN_AGENT_IDS.has(key) ? key : null);
}

function normalizeEndpointEvidence(value = {}) {
  const reportedObserved = value?.observed === true;
  const reportedOk = reportedObserved && value?.ok === true;
  return {
    reportedObserved,
    reportedOk,
    observed: false,
    ok: false,
    reason: typeof value?.reason === "string" ? value.reason : null
  };
}

function normalizeRuntimeSurfaces(value = {}) {
  return Object.fromEntries(
    Object.entries(RUNTIME_SURFACE_DEFINITIONS).map(([id, definition]) => {
      const input = value?.[id] && typeof value[id] === "object" ? value[id] : {};
      const reportedObserved = input.observed === true;
      const reportedInstalled = reportedObserved && input.installed === true;
      const reportedRunning = reportedObserved && input.running === true;
      const reportedAvailable = reportedObserved && input.available === true;
      const reportedHandshakeVerified = reportedObserved && input.handshakeVerified === true;
      const reportedVersion = reportedObserved && typeof input.version === "string"
        ? input.version.trim().slice(0, 64) || null
        : null;
      const reason = reportedObserved && typeof input.reason === "string"
        ? input.reason.trim().slice(0, 160) || null
        : null;

      return [id, {
        kind: definition.kind,
        protocol: definition.protocol,
        reportedObserved,
        reportedInstalled,
        reportedRunning,
        reportedAvailable,
        reportedHandshakeVerified,
        reportedVersion,
        observed: false,
        installed: false,
        running: false,
        available: false,
        handshakeVerified: false,
        version: null,
        reason,
        status: reportedHandshakeVerified
          ? "runtime-handshake-reported-not-admitted"
          : reportedObserved
            ? "runtime-surface-reported-not-admitted"
            : "unverified"
      }];
    })
  );
}

function normalizeRuntimeEvidence(value = {}, options = {}) {
  const hermesInput = value?.hermes && typeof value.hermes === "object" ? value.hermes : {};
  const health = normalizeEndpointEvidence(hermesInput.health);
  const agentCardBase = normalizeEndpointEvidence(hermesInput.agentCard);
  const knowledgeBase = normalizeEndpointEvidence(hermesInput.knowledge);
  const cardAgentIds = uniqueKnownIds(
    Array.isArray(hermesInput.agentCard?.agentIds)
      ? hermesInput.agentCard.agentIds.map(normalizeAgentCardId).filter(Boolean)
      : [],
    KNOWN_AGENT_IDS
  );
  const explicitAgentIds = uniqueKnownIds(
    Array.isArray(value?.agentIds)
      ? value.agentIds
      : Object.entries(value?.agents || {})
          .filter(([, evidence]) => evidence?.observed === true)
          .map(([id]) => id),
    KNOWN_AGENT_IDS
  );
  const cmuxAgentIds = uniqueKnownIds(value?.cmux?.agentIds, KNOWN_AGENT_IDS);
  const reportedAgentIds = new Set([...explicitAgentIds, ...cardAgentIds, ...cmuxAgentIds]);
  const surfaces = normalizeRuntimeSurfaces(value?.surfaces);

  for (const [agentId, surface] of Object.entries(surfaces)) {
    if (surface.reportedHandshakeVerified) reportedAgentIds.add(agentId);
  }

  // Even a successful read-only response lacks the task-bound, authenticated,
  // digest-bound receipt required for connection admission.
  if (health.reportedOk) reportedAgentIds.add("hermes-agent");

  const mcpServerIds = uniqueKnownIds(value?.mcp?.serverIds, KNOWN_MCP_SERVER_IDS);
  const cmuxObserved = value?.cmux?.observed === true;
  const mcpObserved = value?.mcp?.observed === true;
  const anyReported = health.reportedObserved || agentCardBase.reportedObserved || knowledgeBase.reportedObserved ||
    cmuxObserved || mcpObserved || reportedAgentIds.size > 0 ||
    Object.values(surfaces).some((surface) => surface.reportedObserved);

  return {
    source: typeof value?.source === "string" ? value.source : anyReported ? "injected-evidence" : "none",
    collectedAt: typeof value?.collectedAt === "string" ? value.collectedAt : anyReported ? nowIso(options) : null,
    reportedAvailable: anyReported,
    available: false,
    admissionStatus: anyReported ? "EVIDENCE_REPORTED_NOT_ADMITTED" : "UNVERIFIED",
    probeError: typeof value?.probeError === "string" ? value.probeError : null,
    hermes: {
      reportedObserved: health.reportedObserved || agentCardBase.reportedObserved || knowledgeBase.reportedObserved,
      observed: false,
      health,
      agentCard: {
        ...agentCardBase,
        cardCount: Number.isInteger(hermesInput.agentCard?.cardCount)
          ? Math.max(0, hermesInput.agentCard.cardCount)
          : cardAgentIds.length,
        reportedAgentIds: cardAgentIds,
        agentIds: []
      },
      knowledge: {
        ...knowledgeBase,
        dryRun: typeof hermesInput.knowledge?.dryRun === "boolean" ? hermesInput.knowledge.dryRun : null,
        liveSend: typeof hermesInput.knowledge?.liveSend === "boolean" ? hermesInput.knowledge.liveSend : null
      }
    },
    cmux: {
      reportedObserved: cmuxObserved,
      reportedAvailable: cmuxObserved && value?.cmux?.available === true,
      observed: false,
      available: false,
      workspaceCount: Number.isInteger(value?.cmux?.workspaceCount)
        ? Math.max(0, value.cmux.workspaceCount)
        : 0,
      reportedAgentIds: cmuxAgentIds,
      agentIds: [],
      reason: typeof value?.cmux?.reason === "string" ? value.cmux.reason : null
    },
    mcp: {
      reportedObserved: mcpObserved,
      reportedAvailable: mcpObserved && value?.mcp?.available === true,
      observed: false,
      available: false,
      reportedServerIds: mcpServerIds,
      serverIds: [],
      reason: typeof value?.mcp?.reason === "string" ? value.mcp.reason : null
    },
    surfaces,
    reportedAgentIds: [...reportedAgentIds],
    observedAgentIds: []
  };
}

function mergeRuntimeEvidence(base = {}, override = {}) {
  return {
    ...base,
    ...override,
    hermes: {
      ...(base.hermes || {}),
      ...(override.hermes || {}),
      health: { ...(base.hermes?.health || {}), ...(override.hermes?.health || {}) },
      agentCard: { ...(base.hermes?.agentCard || {}), ...(override.hermes?.agentCard || {}) },
      knowledge: { ...(base.hermes?.knowledge || {}), ...(override.hermes?.knowledge || {}) }
    },
    cmux: { ...(base.cmux || {}), ...(override.cmux || {}) },
    mcp: { ...(base.mcp || {}), ...(override.mcp || {}) },
    surfaces: { ...(base.surfaces || {}), ...(override.surfaces || {}) },
    agents: { ...(base.agents || {}), ...(override.agents || {}) },
    agentIds: [...new Set([...(base.agentIds || []), ...(override.agentIds || [])])]
  };
}

function isLoopbackUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

async function probeJson(fetchImpl, url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: { accept: "application/json" },
      redirect: "error",
      cache: "no-store",
      signal: controller.signal
    });
    let body = null;
    try {
      body = await response.json();
    } catch {
      return { observed: true, ok: false, reason: "invalid_json", body: null };
    }
    return {
      observed: true,
      ok: response.ok,
      reason: response.ok ? null : "http_error",
      body
    };
  } catch (error) {
    return {
      observed: false,
      ok: false,
      reason: error?.name === "AbortError" ? "timeout" : "request_failed",
      body: null
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractAgentCards(body) {
  if (Array.isArray(body)) return body;
  for (const key of ["cards", "agentCards", "agent_cards", "agents"]) {
    if (Array.isArray(body?.[key])) return body[key];
  }
  return body && typeof body === "object" ? [body] : [];
}

function extractKnowledgeBoolean(body, camelKey, snakeKey) {
  const candidates = [
    body?.[camelKey],
    body?.[snakeKey],
    body?.status?.[camelKey],
    body?.status?.[snakeKey]
  ];
  return candidates.find((value) => typeof value === "boolean") ?? null;
}

/**
 * Read-only, opt-in Hermes runtime probe. No probe is made by getOmnirouteStatus
 * unless `probeHermes: true` is supplied. Returned evidence is deliberately
 * reduced to health flags and identifiers; raw runtime payloads are discarded.
 */
export async function probeHermesRuntime(options = {}) {
  const baseUrl = String(options.hermesBaseUrl || "http://127.0.0.1:9000").replace(/\/$/, "");
  if (!isLoopbackUrl(baseUrl)) {
    return {
      source: "hermes-read-only-probe",
      probeError: "non_loopback_hermes_url_blocked",
      hermes: {
        health: { observed: false, ok: false, reason: "invalid_base_url" },
        agentCard: { observed: false, ok: false, reason: "invalid_base_url", agentIds: [] },
        knowledge: { observed: false, ok: false, reason: "invalid_base_url" }
      }
    };
  }

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    return {
      source: "hermes-read-only-probe",
      probeError: "fetch_unavailable",
      hermes: {
        health: { observed: false, ok: false, reason: "fetch_unavailable" },
        agentCard: { observed: false, ok: false, reason: "fetch_unavailable", agentIds: [] },
        knowledge: { observed: false, ok: false, reason: "fetch_unavailable" }
      }
    };
  }

  const timeoutMs = Number.isFinite(options.probeTimeoutMs)
    ? Math.max(50, Math.min(5000, options.probeTimeoutMs))
    : 1000;
  const [healthResult, cardResult, knowledgeResult] = await Promise.all([
    probeJson(fetchImpl, `${baseUrl}/health`, timeoutMs),
    probeJson(fetchImpl, `${baseUrl}/agent-card`, timeoutMs),
    probeJson(fetchImpl, `${baseUrl}/knowledge/status`, timeoutMs)
  ]);

  const healthStatus = String(healthResult.body?.status || "").toLowerCase();
  const healthOk = healthResult.ok && (
    healthResult.body?.ok === true ||
    healthResult.body?.healthy === true ||
    ["ok", "healthy", "ready"].includes(healthStatus)
  );
  const cards = extractAgentCards(cardResult.body);
  const cardAgentIds = cards
    .map((card) => normalizeAgentCardId(card?.id || card?.name || card?.title))
    .filter(Boolean);

  return {
    source: "hermes-read-only-probe",
    collectedAt: nowIso(options),
    hermes: {
      health: {
        observed: healthResult.observed,
        ok: healthOk,
        reason: healthOk ? null : healthResult.reason || "health_not_ready"
      },
      agentCard: {
        observed: cardResult.observed,
        ok: cardResult.ok,
        reason: cardResult.reason,
        cardCount: cards.length,
        agentIds: cardAgentIds
      },
      knowledge: {
        observed: knowledgeResult.observed,
        ok: knowledgeResult.ok,
        reason: knowledgeResult.reason,
        dryRun: extractKnowledgeBoolean(knowledgeResult.body, "dryRun", "dry_run"),
        liveSend: extractKnowledgeBoolean(knowledgeResult.body, "liveSend", "live_send")
      }
    }
  };
}

async function collectRuntimeEvidence(options = {}) {
  let evidence = {};

  if (options.probeHermes === true) {
    evidence = mergeRuntimeEvidence(evidence, await probeHermesRuntime(options));
  }

  if (typeof options.runtimeProbe === "function") {
    try {
      const probed = await options.runtimeProbe({
        now: currentDate(options),
        readOnly: true
      });
      evidence = mergeRuntimeEvidence(evidence, probed && typeof probed === "object" ? probed : {});
    } catch {
      evidence = mergeRuntimeEvidence(evidence, {
        source: "injected-runtime-probe",
        probeError: "runtime_probe_failed"
      });
    }
  }

  evidence = mergeRuntimeEvidence(evidence, options.runtimeEvidence || {});
  return normalizeRuntimeEvidence(evidence, options);
}

function makeLane(laneDef, evidence, telegramLiveReady, agentCardIndex) {
  // No evidence path in this preview is a durable connection-admission path.
  // Keep the observed set structurally closed until B10 supplies that path.
  const observedAgents = [];
  const reportedAgents = laneDef.agents.filter((agentId) => evidence.reportedAgentIds.includes(agentId));
  const reportedSurfaceAgents = laneDef.agents.filter(
    (agentId) => evidence.surfaces[agentId]?.reportedObserved === true
  );
  const reportedOnlyAgents = [...new Set([...reportedAgents, ...reportedSurfaceAgents])];
  const allAgentsObserved = false;
  const status = reportedOnlyAgents.length > 0
    ? "runtime-evidence-reported-not-admitted"
    : "configured-unverified-runtime";

  const primaryAgentId = laneDef.agents[0];
  const agentCard = agentCardIndex.get(primaryAgentId) || null;

  return {
    ...lock(),
    id: laneDef.id,
    title: laneDef.title,
    route: laneDef.route,
    agents: laneDef.agents,
    principalId: agentCard?.principalId || null,
    agentCard,
    tmuxSession: laneDef.tmuxSession,
    mcpEnabled: false,
    mcpConfigured: laneDef.mcpConfigured,
    // Gate readiness is a capability check, not proof that this route is
    // activated. `telegramEnabled` stays false until a separately evidenced
    // runtime activation contract exists.
    telegramEnabled: false,
    telegramConfigured: laneDef.telegramConfigured,
    telegramLiveReady: laneDef.telegramConfigured && telegramLiveReady,
    syncMode: "configured-unverified",
    configured: true,
    observed: allAgentsObserved,
    observedAgents,
    reportedAgents,
    reportedSurfaceAgents,
    reportedOnlyAgents,
    surfaceObservedAgents: [],
    surfaceOnlyAgents: [],
    surfaceEvidence: Object.fromEntries(
      laneDef.agents
        .filter((agentId) => evidence.surfaces[agentId])
        .map((agentId) => [agentId, evidence.surfaces[agentId]])
    ),
    unverifiedAgents: laneDef.agents.filter((agentId) => !observedAgents.includes(agentId)),
    status,
    handshakeComplete: false,
    lastHandshakeAt: null,
    blockedActions: omnirouteBlockedActions
  };
}

function makeRoute(routeDef) {
  return {
    ...routeDef,
    configured: true,
    observed: false,
    active: false,
    lastMessageAt: null,
    messageCount: 0,
    evidenceStatus: "unverified-runtime"
  };
}

function makeMcpIntegration(evidence) {
  const reportedIds = new Set(evidence.mcp.reportedServerIds);
  const servers = Object.fromEntries(
    Object.entries(MCP_SERVER_DEFINITIONS).map(([id, definition]) => [
      id,
      {
        role: definition.role,
        syncEnabled: false,
        syncConfigured: definition.syncConfigured,
        routeTo: definition.routeTo,
        configured: true,
        reported: reportedIds.has(id),
        observed: false,
        status: reportedIds.has(id) ? "runtime-reported-not-admitted" : "configured-unverified-runtime"
      }
    ])
  );

  return {
    configured: true,
    enabled: false,
    reportedObserved: evidence.mcp.reportedObserved,
    reportedAvailable: evidence.mcp.reportedAvailable,
    reportedServerCount: reportedIds.size,
    observed: false,
    available: false,
    observedServerCount: 0,
    servers,
    a2aSyncCommands: {
      agentStatus: "mcp__sirinx-files__read",
      agentDiscovery: "mcp__sirinx-files__readdir",
      agentEvidence: "mcp__sirinx-files__read"
    },
    commandExecuted: false
  };
}

function makeConnectedSystem(reportedStatus, detail = {}) {
  return {
    status: "configured-unverified-runtime",
    reportedStatus,
    observed: false,
    evidenceSource: "in-process-configuration-report",
    ...detail
  };
}

export async function getOmnirouteStatus(options = {}) {
  const [a2aSync, agentDriver, launchGate, aiTeamPairing, connectorRegistry, centerBrain, teamRuntime, runtimeEvidence] =
    await Promise.all([
      getA2aSyncStatus(options),
      getAgentDriverStatus(options),
      getAgentLaunchGateStatus(options),
      getAiTeamPairingStatus(options),
      getConnectorRegistryStatus(options),
      getCenterBrainHubStatus(options),
      getTeamRuntimeBridgeStatus(options),
      collectRuntimeEvidence(options)
    ]);

  const liveReady = a2aSync.summary.liveTelegramReady;
  const agentRolePlan = getRuntimeAgentRolePlan({
    ...options,
    observedAgentIds: runtimeEvidence.reportedAgentIds
  });
  const agentCardIndex = new Map(agentRolePlan.cards.map((card) => [card.id, card]));
  const lanes = OMNIROUTE_LANES.map((lane) => makeLane(lane, runtimeEvidence, liveReady, agentCardIndex));
  const routes = OMNIROUTE_ROUTES.map(makeRoute);
  const mcpIntegration = makeMcpIntegration(runtimeEvidence);
  const observedLanes = lanes.filter((lane) => lane.observed).length;
  const partiallyObservedLanes = lanes.filter((lane) => lane.observedAgents.length > 0 && !lane.observed).length;
  const surfaceOnlyLanes = lanes.filter((lane) => lane.surfaceOnlyAgents.length > 0).length;
  const reportedLanes = lanes.filter((lane) => lane.reportedOnlyAgents.length > 0).length;
  const status = runtimeEvidence.reportedAvailable
    ? "omniroute-evidence-reported-not-admitted"
    : "omniroute-configured-unverified";

  return {
    title: "A2A OmniRoute System",
    status,
    mode: "local-evidence-only",
    version: OMNIROUTE_VERSION,
    ...lock(),
    canSendTelegram: a2aSync.canSendTelegram,
    source: "local-dev-control-api",
    handshakeProtocol: HANDSHAKE_STEPS,
    summary: {
      lanes: lanes.length,
      configuredLanes: lanes.length,
      observedLanes,
      partiallyObservedLanes,
      surfaceOnlyLanes,
      reportedLanes,
      routes: routes.length,
      observedRoutes: 0,
      totalAgents: a2aSync.summary.syncAgents,
      logicalRoninRoles: agentRolePlan.summary.logicalRoninRoles,
      executionPrincipals: agentRolePlan.summary.executionPrincipals,
      sourceWriterCandidates: agentRolePlan.summary.sourceWriterCandidates,
      observedAgents: runtimeEvidence.observedAgentIds.length,
      reportedAgents: runtimeEvidence.reportedAgentIds.length,
      observedSurfaces: Object.values(runtimeEvidence.surfaces).filter((surface) => surface.observed).length,
      reportedSurfaces: Object.values(runtimeEvidence.surfaces)
        .filter((surface) => surface.reportedObserved).length,
      liveTelegramReady: liveReady,
      mcpEnabled: mcpIntegration.enabled,
      mcpConfigured: true,
      mcpObservedServers: mcpIntegration.observedServerCount,
      mcpReportedServers: mcpIntegration.reportedServerCount,
      cmuxObserved: runtimeEvidence.cmux.observed,
      cmuxWorkspacePlanned: TMUX_SESSION_DEFINITIONS.length,
      tmuxSessionPlanned: TMUX_SESSION_DEFINITIONS.length,
      liveExternalActions: 0,
      blockedActions: omnirouteBlockedActions.length
    },
    lanes,
    routes,
    agentRolePlan,
    runtimeEvidence,
    mcpIntegration,
    cmux: runtimeEvidence.cmux,
    cmuxWorkspaces: TMUX_SESSION_DEFINITIONS.map((definition) => ({
      ...definition,
      configured: true,
      observed: false,
      created: false,
      status: "configured-unverified-runtime"
    })),
    // Compatibility alias for older dashboard clients. No session is created.
    tmuxSessions: TMUX_SESSION_DEFINITIONS.map((definition) => ({
      ...definition,
      configured: true,
      observed: false,
      created: false,
      status: "configured-unverified-runtime"
    })),
    connectedSystems: {
      a2aSync: makeConnectedSystem(a2aSync.status, { agents: a2aSync.summary.syncAgents }),
      agentDriver: makeConnectedSystem(agentDriver.status, { agents: agentDriver.summary.totalDrivers }),
      launchGate: makeConnectedSystem(launchGate.status, { agents: launchGate.agents.length }),
      aiTeamPairing: makeConnectedSystem(aiTeamPairing.status, { roles: aiTeamPairing.summary.rolesTotal }),
      connectorRegistry: makeConnectedSystem(connectorRegistry.status, { connectors: connectorRegistry.summary.connectorsTotal }),
      centerBrainHub: makeConnectedSystem(centerBrain.status, { mode: centerBrain.mode }),
      teamRuntimeBridge: makeConnectedSystem(teamRuntime.status, { lanes: teamRuntime.summary.runtimeLanes })
    },
    blockedActions: omnirouteBlockedActions,
    stopRules: [
      "Treat configured lanes, routes, cmux workspaces, and MCP servers as unverified until evidence is supplied.",
      "Treat runtime identities, execution principals, and the 47 logical Ronin roles as separate layers of the topology.",
      "Only Codex may hold the exact-path source-write lease; alias surfaces never create another writer.",
      "Treat all caller-supplied agent, surface, handshake, cmux, and MCP claims as reported evidence only.",
      "A reported handshake or MCP availability boolean cannot admit a connection or enable a capability.",
      "Do not create cmux workspaces or tmux sessions automatically.",
      "Do not start or call MCP servers from OmniRoute output.",
      "Do not reload the Hermes gateway from OmniRoute output.",
      "Do not infer Telegram delivery from gate readiness."
    ],
    nextRecommendedAction: runtimeEvidence.reportedAvailable
      ? "Validate reported evidence against the closed connection contract; the HOLD-only preview cannot admit it."
      : "Collect read-only Hermes, cmux, MCP, and agent evidence; no lane is active from configuration alone.",
    stopPoint: liveReady
      ? "OMNIROUTE CONFIGURED - TELEGRAM GATE READY - RUNTIME ROUTES NOT ACTIVATED"
      : "OMNIROUTE CONFIGURED - RUNTIME UNVERIFIED - NO EXTERNAL ACTION",
    updatedAt: nowIso(options)
  };
}

function makeHandshakeLane(lane, dryRun) {
  const laneRoutes = OMNIROUTE_ROUTES.filter(
    (route) => lane.agents.includes(route.from) || lane.agents.includes(route.to)
  );
  const allEvidenceObserved = false;
  const anyEvidenceReported = lane.reportedOnlyAgents.length > 0;
  const evidenceStatus = anyEvidenceReported ? "reported-not-admitted" : "unverified";

  const handshakeSteps = [
    {
      step: "discover",
      status: evidenceStatus,
      detail: anyEvidenceReported
        ? `Received reports for ${lane.reportedOnlyAgents.length} of ${lane.agents.length} configured agent runtime(s); none admitted`
        : `No admitted evidence for ${lane.agents.length} configured agent runtime(s)`
    },
    {
      step: "classify",
      status: "configured",
      detail: `Static lane classification: ${lane.title}`
    },
    {
      step: "route",
      status: "configured-unverified",
      detail: `${laneRoutes.length} route definition(s); none observed active`
    },
    {
      step: "sync-plan",
      status: dryRun ? "dry-run" : "planned-not-executed",
      detail: "Local plan only; no runtime command executed"
    },
    {
      step: "evidence",
      status: evidenceStatus,
      detail: anyEvidenceReported
        ? "Caller-reported evidence is retained for review but grants no route authority"
        : "Closed connection evidence and durable admission are required"
    },
    {
      step: "approval",
      status: "required",
      detail: "No human approval receipt was supplied or consumed"
    },
    {
      step: "manual-activation",
      status: "not-executed",
      detail: "OmniRoute does not start sessions, MCP servers, agents, or gateways"
    }
  ];

  return {
    laneId: lane.id,
    title: lane.title,
    agents: lane.agents,
    route: lane.route,
    tmuxSession: lane.tmuxSession,
    mcpEnabled: lane.mcpEnabled,
    mcpConfigured: lane.mcpConfigured,
    telegramEnabled: lane.telegramEnabled,
    telegramConfigured: lane.telegramConfigured,
    observedAgents: lane.observedAgents,
    reportedAgents: lane.reportedAgents,
    reportedSurfaceAgents: lane.reportedSurfaceAgents,
    unverifiedAgents: lane.unverifiedAgents,
    handshakeSteps,
    allEvidenceObserved,
    allStepsComplete: false,
    planPrepared: true,
    requiresApproval: true,
    liveActivated: false
  };
}

export async function executeOmnirouteHandshake(body = {}, options = {}) {
  const goal = String(body.goal || "a2a omniroute handshake").trim();
  const requestId = String(body.requestId || "omniroute-handshake");
  const targetLanes = Array.isArray(body.targetLanes)
    ? body.targetLanes.filter((id) => OMNIROUTE_LANES.some((lane) => lane.id === id))
    : OMNIROUTE_LANES.map((lane) => lane.id);
  const dryRun = body.dryRun !== false;
  const doLiveSync = body.liveSync !== false && !dryRun;

  // Dangerous goal check is always active, even in dry-run.
  const dangerousPatterns = [
    /\bdeploy\b/i, /\bpush\b/i, /\bpublish\b/i,
    /\b(?:auto.?start|spawn agent)/i,
    /\b(?:secret|token|api.?key)/i,
    /\b(?:install|pnpm add|npm i\b)/i
  ];
  const blocked = dangerousPatterns.some((pattern) => pattern.test(goal));
  if (blocked) {
    return {
      title: "OmniRoute Handshake",
      status: "blocked-omniroute-handshake",
      mode: "local-evidence-only",
      requestId,
      goal,
      ...lock(),
      blockedReasons: ["dangerous_goal_detected"],
      blockedActions: omnirouteBlockedActions,
      handshake: null,
      syncNotification: null,
      nextRecommendedAction: "Remove dangerous patterns and retry with read-only evidence collection.",
      stopPoint: "OMNIROUTE HANDSHAKE BLOCKED - NO ACTION TAKEN",
      updatedAt: nowIso(options)
    };
  }

  const status = await getOmnirouteStatus(options);
  let liveSyncResult = null;
  if (doLiveSync) {
    const targetAgentIds = [...new Set(
      OMNIROUTE_LANES
        .filter((lane) => targetLanes.includes(lane.id))
        .flatMap((lane) => lane.agents)
    )];
    liveSyncResult = await syncAgentIds(targetAgentIds, options);
  }

  const handshakeLanes = status.lanes
    .filter((lane) => targetLanes.includes(lane.id))
    .map((lane) => {
      const handshake = makeHandshakeLane(lane, dryRun);
      const registered = liveSyncResult?.succeeded?.filter((a) =>
        lane.agents.includes(a)
      ) || [];
      if (registered.length > 0) {
        handshake.liveSyncRegistered = registered;
        handshake.liveSyncCount = registered.length;
        handshake.liveSyncComplete = registered.length === lane.agents.length;
        handshake.handshakeSteps[0] = {
          step: "discover",
          status: registered.length === lane.agents.length
            ? "live-synced"
            : "live-sync-partial",
          detail: `Registered ${registered.length}/${lane.agents.length} agent(s) via Rust A2A control plane`
        };
      }
      return handshake;
    });

  const anyEvidenceReported = handshakeLanes.some(
    (lane) => lane.reportedAgents.length > 0 || lane.reportedSurfaceAgents.length > 0
  );
  const anyLiveSync = liveSyncResult?.registered > 0;
  const allLiveSync = liveSyncResult && handshakeLanes.every((l) => l.liveSyncComplete);

  const statusCode = allLiveSync
    ? "omniroute-handshake-live-synced"
    : anyLiveSync
      ? "omniroute-handshake-live-sync-partial"
      : anyEvidenceReported
        ? "omniroute-handshake-evidence-reported-not-admitted"
        : "omniroute-handshake-unverified";

  const syncNotification = dryRun
    ? null
    : {
        routed: false,
        attempted: false,
        sent: false,
        providerCalled: false,
        reason: "omniroute_handshake_never_sends_provider_notifications",
        timestamp: nowIso(options)
      };

  return {
    title: "OmniRoute Handshake",
    status: statusCode,
    mode: liveSyncResult ? "live-sync" : "local-evidence-only",
    requestId,
    goal,
    ...lock(),
    canSendTelegram: status.canSendTelegram,
    blockedReasons: [],
    blockedActions: omnirouteBlockedActions,
    runtimeEvidence: status.runtimeEvidence,
    handshake: {
      protocol: HANDSHAKE_STEPS,
      lanes: handshakeLanes,
      allComplete: allLiveSync || false,
      allEvidenceObserved: false,
      totalLanes: handshakeLanes.length,
      activatedLanes: allLiveSync ? handshakeLanes.length : 0,
      pendingApprovalLanes: allLiveSync ? 0 : handshakeLanes.length
    },
    liveSync: liveSyncResult || { registered: 0, failed: 0, registrations: [] },
    syncNotification,
    liveActivationRequired: !allLiveSync,
    manualSteps: allLiveSync
      ? [
          "All target lanes are live-synced with the Rust A2A control plane.",
          "Agents are registered and discoverable via POST /api/a2a/route.",
          "Activate tmux sessions and MCP servers outside this handshake if needed."
        ]
      : [
          "Verify every unverified agent identity and runtime endpoint.",
          "Review configured routes; configuration does not prove an active connection.",
          "Record a separate human approval before any runtime operation.",
          "Start sessions, agents, and MCP servers outside this read-only planner."
        ],
    nextRecommendedAction: anyLiveSync
      ? `${liveSyncResult.failed} agent(s) failed to register. Check control plane connectivity and retry.`
      : anyEvidenceReported
        ? "Evidence is present for configured agent identities; obtain approval and verify route activity separately."
        : "Collect missing read-only evidence before considering any manual activation.",
    stopPoint: allLiveSync
      ? "OMNIROUTE HANDSHAKE LIVE-SYNCED - RUST A2A REGISTRATION COMPLETE"
      : "OMNIROUTE HANDSHAKE EVIDENCE REPORT - NO ACTIVATION - NO PROVIDER SEND",
    updatedAt: nowIso(options)
  };
}

export async function activateOmnirouteLane(body = {}, options = {}) {
  const laneId = String(body.laneId || "").trim();
  const laneDef = OMNIROUTE_LANES.find((lane) => lane.id === laneId);

  if (!laneDef) {
    return {
      ok: false,
      error: `unknown_lane: ${laneId}`,
      laneId,
      activated: false,
      commandExecuted: false
    };
  }

  const status = await getOmnirouteStatus(options);
  const laneStatus = status.lanes.find((lane) => lane.id === laneId);
  const syncPlans = await Promise.all(
    laneDef.agents.map((agentId) =>
      createA2aSyncPlan(
        {
          requestId: `omniroute-plan-${laneId}-${agentId}`,
          goal: `prepare local omniroute sync plan for ${laneId} and ${agentId}`,
          sourceAgent: "a2a-sync",
          targetAgents: [agentId],
          messageType: "sync_request",
          message: `OmniRoute local plan for ${laneId}: ${laneDef.title}`,
          dryRun: true
        },
        options
      )
    )
  );
  const preparedPlans = syncPlans.filter((plan) => plan?.syncPlan);

  return {
    ok: true,
    laneId,
    title: laneDef.title,
    route: laneDef.route,
    agents: laneDef.agents,
    tmuxSession: laneDef.tmuxSession,
    mcpEnabled: laneStatus.mcpEnabled,
    mcpConfigured: laneDef.mcpConfigured,
    telegramEnabled: laneStatus.telegramEnabled,
    telegramConfigured: laneDef.telegramConfigured,
    telegramLiveReady: laneStatus.telegramLiveReady,
    syncMode: laneStatus.syncMode,
    configured: true,
    observed: laneStatus.observed,
    activated: false,
    activationStatus: "not-executed",
    syncPlansCreated: preparedPlans.length,
    syncPlansRequested: syncPlans.length,
    syncPlanStatuses: syncPlans.map((plan, index) => ({
      agent: laneDef.agents[index],
      status: plan.status,
      messageType: plan.messageType || "sync_request"
    })),
    telegramNotification: laneDef.telegramConfigured
      ? {
          routed: false,
          attempted: false,
          sent: false,
          providerCalled: false,
          reason: "lane_plan_does_not_send_notifications"
        }
      : null,
    liveActivated: false,
    commandExecuted: false,
    requiresHumanApproval: true,
    nextExactStep: laneStatus.observed
      ? `Review evidence and obtain approval before manually operating ${laneDef.tmuxSession}.`
      : `Verify all runtime agents for ${laneId} before approval or manual operation.`
  };
}
