import { isAbsolute } from "node:path";

export const CLINE_BIN = "cline";
export const CLINE_LIVE_FLAG = "SIRINX_CLINE_LIVE";
export const CLINE_TICKET_ENV = "SIRINX_PROVIDER_CALL_TICKET";

const SAFE_VALUE = /^[A-Za-z0-9._:@/+=~-]{1,160}$/;
const TICKET_PATTERN = /^[A-Z0-9][A-Z0-9-]{5,63}$/;
const SECRET_PATTERN = /(?:api[_-]?key|token|secret|password|bearer|sk-[A-Za-z0-9])/i;

function fail(message) {
  throw new Error(`invalid_cline_lane:${message}`);
}

function safeValue(value, label) {
  if (typeof value !== "string" || !SAFE_VALUE.test(value)) fail(label);
  if (SECRET_PATTERN.test(value)) fail(`${label}_must_not_carry_secrets`);
  return value;
}

function requireProposalOnly(packet) {
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) fail("packet_must_be_object");
  if (packet.action_class !== "PROPOSAL_ONLY") fail("action_class");
  if (typeof packet.goal !== "string" || packet.goal.trim() === "" || packet.goal.length > 4000) {
    fail("goal");
  }
  if (typeof packet.role_id !== "string" || !/^(L[1-5]-\d{2}|Kai)$/.test(packet.role_id)) {
    fail("role_id");
  }
  if (!packet.effects || packet.effects.provider_call !== false || packet.effects.spawn !== false) {
    fail("packet_effects");
  }
}

function buildPrompt(packet) {
  return [
    `Role: ${packet.role_id} (${packet.duty || "worker"})`,
    `Goal: ${packet.goal.trim()}`,
    "Stop conditions:",
    ...(packet.stop_conditions || []).map((rule) => `- ${rule}`),
    "Work read-only. Return a candidate result with evidence and the effects you did not take."
  ].join("\n");
}

export function buildClineInvocation(packet, options = {}) {
  requireProposalOnly(packet);

  const workspaceRoot = options.workspaceRoot;
  if (typeof workspaceRoot !== "string" || !isAbsolute(workspaceRoot)) fail("workspace_root_must_be_absolute");
  if (workspaceRoot === "/" || workspaceRoot.includes("..")) fail("workspace_root_must_be_scoped");

  const timeoutSeconds = options.timeoutSeconds ?? 900;
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 60 || timeoutSeconds > 3600) {
    fail("timeout_out_of_range");
  }

  if (options.autoApprove === true) fail("auto_approve_must_stay_false");
  const mode = options.mode || "plan";
  if (!["plan", "act"].includes(mode)) fail("mode");
  if (mode === "act" && options.allowAct !== true) fail("act_requires_explicit_allow");

  const prompt = buildPrompt(packet);
  if (prompt.length > 18000) fail("prompt_too_long");
  if (SECRET_PATTERN.test(prompt)) fail("prompt_must_not_carry_secrets");

  const args = [
    "--json",
    "--cwd",
    workspaceRoot,
    "--timeout",
    String(timeoutSeconds),
    "--auto-approve",
    "false"
  ];
  if (mode === "plan") args.push("-p");
  if (options.model) args.push("-m", safeValue(options.model, "model"));
  if (options.provider) args.push("-P", safeValue(options.provider, "provider"));

  let dataDir = null;
  if (options.dataDir) {
    if (typeof options.dataDir !== "string" || !isAbsolute(options.dataDir) || options.dataDir.includes("..")) {
      fail("data_dir_must_be_absolute");
    }
    dataDir = options.dataDir;
    args.push("--data-dir", dataDir);
  }
  args.push(prompt);

  return {
    command: CLINE_BIN,
    args,
    cwd: workspaceRoot,
    mode,
    autoApprove: false,
    env: dataDir ? { CLINE_MCP_SETTINGS_PATH: `${dataDir}/settings/cline_mcp_settings.json` } : {},
    promptChars: prompt.length
  };
}

function parseRunResult(stdout) {
  const lines = String(stdout || "").split("\n").filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      const message = JSON.parse(lines[index]);
      if (message.type === "run_result") return message;
    } catch {
      // Non-JSON banner lines are expected in headless output.
    }
  }
  return null;
}

export async function runClineLane(invocation, options = {}) {
  const env = options.env || process.env;

  if (env[CLINE_LIVE_FLAG] !== "1") {
    return {
      status: "DRY_RUN",
      providerCalled: false,
      invocation,
      stopPoint: "CLINE LANE DRY RUN - SIRINX_CLINE_LIVE IS NOT 1"
    };
  }

  const ticket = env[CLINE_TICKET_ENV];
  if (typeof ticket !== "string" || !TICKET_PATTERN.test(ticket)) {
    return { status: "BLOCKED", providerCalled: false, reason: "missing_or_invalid_provider_call_ticket" };
  }

  if (typeof options.runner !== "function") {
    return { status: "BLOCKED", providerCalled: false, reason: "missing_injected_runner" };
  }

  const result = await options.runner(invocation.command, invocation.args, {
    cwd: invocation.cwd,
    env: { ...env, ...invocation.env },
    shell: false
  });

  const runResult = parseRunResult(result?.stdout);
  if (!runResult) {
    return { status: "ERROR", providerCalled: true, reason: "missing_run_result" };
  }

  return {
    status: "COMPLETED",
    providerCalled: true,
    text: runResult.text ?? null,
    sessionId: runResult.sessionId ?? runResult.session_id ?? null
  };
}
