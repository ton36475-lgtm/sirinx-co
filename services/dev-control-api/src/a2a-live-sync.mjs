import { syncAgentDefinitions, A2A_SYNC_AGENT_IDS } from "./a2a-sync.mjs";

export const A2A_LIVE_SYNC_VERSION = "1.0";

const DEFAULT_CONTROL_URL = "http://127.0.0.1:8711";

const AGENT_CAPABILITIES = {
  "hermes-agent": ["orchestrate", "route", "review", "gate", "intake", "report"],
  "codex": ["code", "implement", "edit", "analyze", "architecture"],
  "codex-app": ["code", "gui", "edit"],
  "claude-code": ["code", "inspect", "review", "architecture"],
  "opencode": ["code", "implement", "review"],
  "openclaw": ["system", "ghostclaw", "orchestrate"],
  "copilot-cli": ["suggest", "assist", "review"],
  "droid": ["mobile", "automate", "observe"],
  "pi": ["assist", "research", "summarize"],
  "telegram-bot": ["messaging", "notify", "alert", "telegram"],
  "a2a-sync": ["sync", "coordinate", "route"],
  "manus": ["research", "collect", "external"],
  "hermes-one": ["desktop", "observe", "bridge"],
  "kimi-code": ["code", "review", "qa", "security"],
  "claude-cowork": ["desktop", "plan", "synthesize", "workspace"],
  "antigravity": ["code", "scaffold", "prototype"]
};

function controlUrl(options = {}) {
  return String(options.sirinxControlUrl || options.controlBaseUrl || process.env.SIRINX_CONTROL_URL || DEFAULT_CONTROL_URL).replace(/\/+$/, "");
}

function agentEndpoint(agentId) {
  const ports = {
    "hermes-agent": "http://127.0.0.1:9000",
    "telegram-bot": "http://127.0.0.1:8791",
    "a2a-sync": `${DEFAULT_CONTROL_URL}`,
    "codex": `${DEFAULT_CONTROL_URL}`,
    "claude-code": "http://127.0.0.1:8710",
    "opencode": `${DEFAULT_CONTROL_URL}`,
    "openclaw": `${DEFAULT_CONTROL_URL}`,
    "manus": "http://127.0.0.1:8792",
    "hermes-one": `${DEFAULT_CONTROL_URL}`,
    "kimi-code": "http://127.0.0.1:8712",
    "claude-cowork": `${DEFAULT_CONTROL_URL}`,
    "antigravity": `${DEFAULT_CONTROL_URL}`,
    "copilot-cli": `${DEFAULT_CONTROL_URL}`,
    "droid": `${DEFAULT_CONTROL_URL}`,
    "pi": `${DEFAULT_CONTROL_URL}`,
    "codex-app": `${DEFAULT_CONTROL_URL}`
  };
  return ports[agentId] || `${DEFAULT_CONTROL_URL}`;
}

function agentPriority(agentId) {
  const priorities = {
    "hermes-agent": 10,
    "a2a-sync": 8,
    "codex": 6,
    "telegram-bot": 6,
    "claude-code": 5,
    "opencode": 4,
    "manus": 4,
    "kimi-code": 3,
    "claude-cowork": 3,
    "antigravity": 2,
    "hermes-one": 3,
    "openclaw": 5,
    "copilot-cli": 1,
    "droid": 2,
    "pi": 2,
    "codex-app": 3
  };
  return priorities[agentId] || 0;
}

export function buildAgentCard(agentId) {
  const def = syncAgentDefinitions.find(([id]) => id === agentId);
  if (!def) return null;
  const [, title] = def;
  return {
    id: agentId,
    name: title,
    capabilities: AGENT_CAPABILITIES[agentId] || [],
    endpoint: agentEndpoint(agentId),
    priority: agentPriority(agentId)
  };
}

export function buildAllAgentCards() {
  return A2A_SYNC_AGENT_IDS.map(buildAgentCard).filter(Boolean);
}

export async function registerAgentWithControl(agentId, options = {}) {
  const card = buildAgentCard(agentId);
  if (!card) return { ok: false, agentId, error: "unknown_agent" };

  const baseUrl = controlUrl(options);
  const timeoutMs = Math.min(5000, Math.max(500, options.timeoutMs || 2000));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  try {
    const syncBody = {
      node: card,
      knownWorkIds: []
    };
    const response = await fetchImpl(`${baseUrl}/api/a2a/sync`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(syncBody),
      signal: controller.signal
    });
    if (!response.ok) {
      return { ok: false, agentId, error: `control_sync_failed: ${response.status}`, card };
    }
    const result = await response.json();
    return {
      ok: true,
      agentId,
      registeredNode: result.node,
      peerCount: Array.isArray(result.peerAgents) ? result.peerAgents.length : 0,
      missingWorkCount: Array.isArray(result.missingWork) ? result.missingWork.length : 0,
      card
    };
  } catch (err) {
    return {
      ok: false,
      agentId,
      error: err.name === "AbortError" ? "timeout" : `request_failed: ${err.message}`,
      card
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function syncAllAgents(options = {}) {
  const results = await Promise.allSettled(
    A2A_SYNC_AGENT_IDS.map((agentId) => registerAgentWithControl(agentId, options))
  );
  const registrations = results.map((r) => (r.status === "fulfilled" ? r.value : { ok: false, error: r.reason?.message || "unhandled" }));
  const succeeded = registrations.filter((r) => r.ok);
  const failed = registrations.filter((r) => !r.ok);
  return {
    total: A2A_SYNC_AGENT_IDS.length,
    registered: succeeded.length,
    failed: failed.length,
    timestamp: new Date().toISOString(),
    registrations,
    succeeded: succeeded.map((r) => r.agentId),
    failedAgents: failed.map((r) => ({ agentId: r.agentId, error: r.error }))
  };
}

export async function syncAgentIds(agentIds, options = {}) {
  const ids = [...new Set(agentIds.filter(Boolean))];
  if (ids.length === 0) {
    return { targetAgents: [], total: 0, registered: 0, failed: 0, timestamp: new Date().toISOString(), registrations: [], succeeded: [], failedAgents: [] };
  }
  const results = await Promise.allSettled(
    ids.map((agentId) => registerAgentWithControl(agentId, options))
  );
  const registrations = results.map((r) => (r.status === "fulfilled" ? r.value : { ok: false, error: r.reason?.message || "unhandled" }));
  const succeeded = registrations.filter((r) => r.ok);
  const failed = registrations.filter((r) => !r.ok);
  return {
    targetAgents: ids,
    total: ids.length,
    registered: succeeded.length,
    failed: failed.length,
    timestamp: new Date().toISOString(),
    registrations,
    succeeded: succeeded.map((r) => r.agentId),
    failedAgents: failed.map((r) => ({ agentId: r.agentId, error: r.error }))
  };
}

// Kept for backwards compat — resolves lane IDs to agent IDs using OMNIROUTE_LANES.
export async function syncLanes(laneIds, options = {}) {
  const { OMNIROUTE_LANES } = await import("./a2a-omniroute.mjs");
  const targetAgents = new Set();
  for (const laneId of laneIds) {
    const lane = OMNIROUTE_LANES.find((l) => l.id === laneId);
    if (lane) lane.agents.forEach((a) => targetAgents.add(a));
  }
  const result = await syncAgentIds([...targetAgents], options);
  return { ...result, requestedLanes: laneIds };
}

export async function getLiveSyncStatus(options = {}) {
  const cards = buildAllAgentCards();
  return {
    version: A2A_LIVE_SYNC_VERSION,
    controlUrl: controlUrl(options),
    agentCount: cards.length,
    cards,
    syncRequired: true,
    lastSyncAt: null,
    mode: "live-sync-configured"
  };
}

export async function queryControlCard(options = {}) {
  const baseUrl = controlUrl(options);
  const timeoutMs = Math.min(3000, Math.max(500, options.timeoutMs || 1000));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  try {
    const response = await fetchImpl(`${baseUrl}/api/a2a/card`, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) return { observed: false, error: `http_${response.status}` };
    const card = await response.json();
    return { observed: true, card };
  } catch (err) {
    return { observed: false, error: err.name === "AbortError" ? "timeout" : err.message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function routeThroughControl(capabilities, options = {}) {
  const baseUrl = controlUrl(options);
  const timeoutMs = Math.min(5000, Math.max(500, options.timeoutMs || 2000));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  try {
    const response = await fetchImpl(`${baseUrl}/api/a2a/route`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ capabilities }),
      signal: controller.signal
    });
    if (response.status === 404) return { found: false, capabilities };
    if (!response.ok) return { found: false, error: `http_${response.status}`, capabilities };
    const card = await response.json();
    return { found: true, card, capabilities };
  } catch (err) {
    return { found: false, error: err.name === "AbortError" ? "timeout" : err.message, capabilities };
  } finally {
    clearTimeout(timeout);
  }
}
