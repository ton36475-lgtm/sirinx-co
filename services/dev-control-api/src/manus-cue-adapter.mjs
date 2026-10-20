export const MANUS_TASK_CREATE_URL = "https://api.manus.ai/v2/task.create";
export const MANUS_AUTH_HEADER = "x-manus-api-key";
export const MANUS_LIVE_FLAG = "SIRINX_MANUS_LIVE";
export const MANUS_TICKET_ENV = "SIRINX_PROVIDER_CALL_TICKET";
export const MANUS_MAX_PROMPT_CHARS = 18000;

const MANUS_PROFILES = new Set([
  "standard",
  "lite",
  "max",
  "max-medium",
  "max-high",
  "max-extra",
  "max-ultra"
]);
const MAX_TITLE = 120;
const TICKET_PATTERN = /^[A-Z0-9][A-Z0-9-]{5,63}$/;
const SECRET_PATTERN = /(?:api[_-]?key|token|secret|password|bearer|sk-[A-Za-z0-9])/i;

function fail(message) {
  throw new Error(`invalid_manus_task:${message}`);
}

function requireProposalOnly(packet) {
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) fail("packet_must_be_object");
  if (packet.action_class !== "PROPOSAL_ONLY") fail("action_class");
  if (typeof packet.goal !== "string" || packet.goal.trim() === "") fail("goal");
  if (typeof packet.role_id !== "string" || !/^(L[1-5]-\d{2}|Kai)$/.test(packet.role_id)) {
    fail("role_id");
  }
  if (!packet.effects || packet.effects.provider_call !== false || packet.effects.spawn !== false) {
    fail("packet_effects");
  }
}

function buildPrompt(packet) {
  const lines = [
    `Role: ${packet.role_id} (${packet.duty || "worker"})`,
    `Goal: ${packet.goal.trim()}`,
    "Stop conditions:",
    ...(packet.stop_conditions || []).map((rule) => `- ${rule}`),
    "Return a candidate result with evidence references and an explicit list of effects not taken."
  ];
  return lines.join("\n");
}

export function buildManusTaskRequest(packet, options = {}) {
  requireProposalOnly(packet);

  const agentProfile = options.agentProfile || "standard";
  if (!MANUS_PROFILES.has(agentProfile)) fail("agent_profile");

  const prompt = buildPrompt(packet);
  if (prompt.length > MANUS_MAX_PROMPT_CHARS) fail("prompt_too_long");
  if (SECRET_PATTERN.test(prompt)) fail("prompt_must_not_carry_secrets");

  const title = (options.title || `${packet.role_id} ${packet.duty || "task"}`).slice(0, MAX_TITLE);
  if (SECRET_PATTERN.test(title)) fail("title_must_not_carry_secrets");

  const body = {
    message: {
      content: [{ type: "text", text: prompt, visibility: "visible" }]
    },
    title,
    locale: "en",
    interactive_mode: false,
    hide_in_task_list: true,
    share_visibility: "private",
    agent_profile: agentProfile
  };

  return {
    url: MANUS_TASK_CREATE_URL,
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    auth: { headerName: MANUS_AUTH_HEADER, credentialRef: "env:MANUS_API_KEY" }
  };
}

export async function createManusTask(packet, options = {}) {
  const request = buildManusTaskRequest(packet, { agentProfile: options.agentProfile });
  const env = options.env || process.env;

  if (env[MANUS_LIVE_FLAG] !== "1") {
    return {
      status: "DRY_RUN",
      providerCalled: false,
      request,
      stopPoint: "MANUS LANE DRY RUN - SIRINX_MANUS_LIVE IS NOT 1"
    };
  }

  const ticket = env[MANUS_TICKET_ENV];
  if (typeof ticket !== "string" || !TICKET_PATTERN.test(ticket)) {
    return { status: "BLOCKED", providerCalled: false, reason: "missing_or_invalid_provider_call_ticket" };
  }

  if (typeof options.fetchImpl !== "function") {
    return { status: "BLOCKED", providerCalled: false, reason: "missing_fetch_impl" };
  }

  const apiKey = env.MANUS_API_KEY;
  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    return { status: "BLOCKED", providerCalled: false, reason: "missing_manus_api_key" };
  }

  const response = await options.fetchImpl(request.url, {
    method: request.method,
    headers: { ...request.headers, [MANUS_AUTH_HEADER]: apiKey },
    body: JSON.stringify(request.body),
    signal: AbortSignal.timeout(options.timeoutMs || 60000)
  });

  let data;
  try {
    data = await response.json();
  } catch {
    return { status: "ERROR", providerCalled: true, reason: "unparseable_response" };
  }

  if (!response.ok || data.ok !== true) {
    return {
      status: "ERROR",
      providerCalled: true,
      reason: data?.error?.code || "http_error",
      requestId: data?.request_id || null
    };
  }

  return {
    status: "CREATED",
    providerCalled: true,
    taskId: data.task_id,
    taskTitle: data.task_title,
    taskUrl: data.task_url,
    shareUrl: data.share_url,
    requestId: data.request_id
  };
}
