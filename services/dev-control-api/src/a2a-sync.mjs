import { resolveTelegramGatewayReadiness } from "../../telegram-command-bot/src/config.mjs";
import { sendTelegramMessage } from "../../telegram-command-bot/src/sender.mjs";

export const a2aSyncBlockedActions = [
  "deploy",
  "push",
  "publish",
  "external_connector_activation",
  "real_mcp_execution",
  "paid_api_call",
  "secret_read_or_print",
  "customer_message_send",
  "production_database_write",
  "telegram_send_without_gate",
  "line_send",
  "agent_auto_start",
  "package_install"
];

export const A2A_SYNC_VERSION = "1.2";
export const DEFAULT_A2A_SYNC_MODE = "local-only-dry-run";
export const A2A_MAX_MESSAGE_LENGTH = 3800;

export const syncAgentDefinitions = [
  ["hermes-agent", "Hermes Agent", "team-orchestrator", "primary orchestrator and TUI review agent"],
  ["codex", "Codex", "coding", "local code editing and implementation agent"],
  ["codex-app", "Codex App", "coding", "Codex GUI app lane"],
  ["claude-code", "Claude Code", "coding", "Anthropic CLI coding agent"],
  ["opencode", "OpenCode", "coding", "open-source coding agent"],
  ["openclaw", "OpenClaw", "system", "GhostClaw OS agent"],
  ["copilot-cli", "Copilot CLI", "assistant", "GitHub Copilot CLI assistant"],
  ["droid", "Droid", "mobile", "mobile automation agent"],
  ["pi", "Pi", "assistant", "personal intelligence agent"],
  ["telegram-bot", "Telegram Bot", "messaging", "Telegram command and notification gateway"],
  ["a2a-sync", "A2A Sync", "sync", "agent-to-agent sync coordinator"],
  ["manus", "Manus", "agent-platform", "Manus AI generalist agent platform for the Mac mini (Mac App Store: tech.butterfly.app)"],
  ["hermes-one", "Hermes One", "desktop-agent", "Nous Research Hermes One desktop app v0.7.3 (com.nousresearch.hermes)"],
  ["kimi-code", "Kimi Code", "coding", "Kimi Code CLI v0.27.0 and Kimi.app v3.1.2 with optional ACP stdio"],
  ["claude-cowork", "Claude Cowork", "desktop-agent", "Claude Desktop v1.22209.3 Cowork surface; runtime handshake requires separate evidence"],
  ["antigravity", "Antigravity", "coding", "Antigravity CLI (AGY) Gemini coding agent; runtime handshake requires separate evidence"]
];

export const A2A_SYNC_AGENT_IDS = syncAgentDefinitions.map(([id]) => id);

const knownAgentIds = new Set(syncAgentDefinitions.map(([id]) => id));
const messageTypes = [
  "status_update",
  "notification",
  "alert",
  "sync_request",
  "sync_response",
  "evidence_packet",
  "approval_request"
];
const telegramMessageTypes = new Set(["alert", "approval_request"]);

// Each rule is a single grouped alternation. Ungrouped `/\ba|b\b/` alternations
// bound only the first and last alternative, which previously let short tokens
// match inside unrelated words (e.g. "line" blocked the goal word "linear").
const dangerousGoalRules = [
  ["deploy", /\bdeploy\b/i],
  ["push", /\bpush/i],
  ["publish", /\bpublish\b/i],
  ["package_install", /\b(?:install|pnpm add|npm i\b)/i],
  ["real_mcp_execution", /(?:\bmcp|model context protocol|start server|start-server)/i],
  ["secret_read_or_print", /\b(?:secret|token|api ?key|password|credential)/i],
  ["paid_api_call", /\b(?:call provider|paid api|openrouter call|run qwen|invoke qwen)\b/i],
  ["customer_message_send", /\b(?:line|dm|sms|email\w*|customer message)\b/i],
  ["external_connector_activation", /\b(?:activate|connect live|oauth|external connector|supabase write|github push)/i],
  ["agent_auto_start", /\b(?:auto.?start|launch agent|spawn agent)/i]
];

export class A2aSyncValidationError extends Error {
  constructor(code) {
    super(code);
    this.name = "A2aSyncValidationError";
    this.code = code;
  }
}

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
    commandExecuted: false,
    requiresHumanApproval: true
  };
}

function makeSyncAgent([id, title, role, purpose], index) {
  return {
    id,
    title,
    role,
    ordinal: index + 1,
    purpose,
    status: "registered-unverified-runtime",
    syncMode: "dry-run",
    lastSeenAt: null,
    messageCount: 0,
    pendingMessages: 0,
    ...lock(),
    nextExactStep: `Verify ${title} runtime presence before marking its handshake live.`
  };
}

function makeMessageTypeInfo(messageType) {
  return {
    type: messageType,
    supported: true,
    routeToTelegram: telegramMessageTypes.has(messageType),
    requiresApproval: telegramMessageTypes.has(messageType)
  };
}

function makeTelegramNotificationLane(config) {
  return {
    id: "telegram-notification",
    title: "Telegram Notification Lane",
    provider: "Telegram Bot API",
    status: config.liveSendReady ? "live-ready" : "dry-run",
    mode: config.mode,
    envReady: config.envReady,
    gateState: config.gate.state,
    gateAuthority: config.gate.authority,
    gateAuthoritative: config.gate.authoritative,
    gateFresh: config.gate.fresh,
    gateReason: config.gate.reason,
    ticketPrefixValid: config.gate.ticketPrefixValid,
    liveSendReady: config.liveSendReady,
    canSend: config.liveSendReady,
    allowedCommands: config.allowedCommands,
    blockedActions: a2aSyncBlockedActions
  };
}

function findBlockedReasons(goal) {
  return dangerousGoalRules.filter(([, pattern]) => pattern.test(goal)).map(([reason]) => reason);
}

function normalizeBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new A2aSyncValidationError("a2a_body_must_be_object");
  }
  return body;
}

function normalizeTargets(value) {
  const targets = Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : syncAgentDefinitions.map(([id]) => id);
  if (targets.length === 0) throw new A2aSyncValidationError("a2a_target_agents_empty");
  if (new Set(targets).size !== targets.length) {
    throw new A2aSyncValidationError("a2a_target_agents_duplicate");
  }
  if (targets.some((id) => !knownAgentIds.has(id))) {
    throw new A2aSyncValidationError("a2a_target_agent_unknown");
  }
  return targets;
}

function makeSyncPlan(sourceAgent, targetAgents, messageType, message, options = {}) {
  const current = currentDate(options);
  return {
    messageId: `a2a-${current.getTime()}-${String(Math.random()).slice(2, 8)}`,
    sourceAgent,
    targetAgents,
    plannedTargets: [...targetAgents],
    messageType,
    message,
    timestamp: current.toISOString(),
    deliveredTo: [],
    failedTo: [],
    telegramRouted: false,
    telegramSent: false,
    providerCalled: false,
    externalWriteOutcome: "none",
    commandExecuted: false
  };
}

export async function getA2aSyncStatus(options = {}) {
  const telegramConfig = await resolveTelegramGatewayReadiness(options.env || process.env, options);
  const syncAgents = syncAgentDefinitions.map(makeSyncAgent);
  const messageTypeInfo = messageTypes.map(makeMessageTypeInfo);
  const telegramLane = makeTelegramNotificationLane(telegramConfig);
  const liveReady = telegramLane.liveSendReady;

  return {
    title: "A2A Sync Coordinator",
    status: liveReady ? "a2a-sync-live-ready" : "a2a-sync-dry-run",
    mode: liveReady ? "live-sync-ready" : "local-only-dry-run",
    version: A2A_SYNC_VERSION,
    ...lock(),
    canSendTelegram: telegramLane.canSend,
    source: "local-dev-control-api",
    summary: {
      syncAgents: syncAgents.length,
      messageTypes: messageTypeInfo.length,
      totalMessages: 0,
      pendingMessages: 0,
      verifiedRuntimeAgents: 0,
      liveTelegramReady: telegramLane.liveSendReady,
      liveExternalActions: 0,
      blockedActions: a2aSyncBlockedActions.length
    },
    syncAgents,
    messageTypes: messageTypeInfo,
    telegramLane,
    blockedActions: a2aSyncBlockedActions,
    stopRules: [
      "Do not mark static agent definitions as live handshakes.",
      "Route alerts and approval requests only with explicit dryRun=false and a fresh durable telegram_send gate.",
      "Do not start agents or MCP servers automatically from sync messages.",
      "Do not call paid APIs, read secrets, or send customer messages."
    ],
    nextRecommendedAction: liveReady
      ? "Telegram lane is live-ready; each provider attempt will re-check the durable OPS-TG gate."
      : "Provision the Telegram env contract and open the durable sirinx-control telegram_send gate with an OPS-TG ticket.",
    stopPoint: liveReady
      ? "A2A SYNC READY - TELEGRAM LANE LIVE-READY - EXPLICIT SEND REQUEST REQUIRED"
      : "A2A SYNC READY - LOCAL-ONLY DRY-RUN - WAITING FOR ENV + DURABLE GATE",
    updatedAt: nowIso(options)
  };
}

export async function createA2aSyncPlan(input = {}, options = {}) {
  const body = normalizeBody(input);
  const requestId = String(body.requestId || "a2a-sync-plan").trim().slice(0, 128);
  const goal = String(body.goal || "local-only agent sync").trim();
  const sourceAgent = String(body.sourceAgent || "a2a-sync").trim();
  const targetAgents = normalizeTargets(body.targetAgents);
  const messageType = String(body.messageType || "notification").trim();
  const routeToTelegram = telegramMessageTypes.has(messageType);
  const defaultMessage = routeToTelegram ? `A2A ${messageType} from ${sourceAgent}` : "";
  const message = String(body.message ?? defaultMessage).trim();
  const dryRun = body.dryRun !== false;

  if (typeof body.dryRun !== "undefined" && typeof body.dryRun !== "boolean") {
    throw new A2aSyncValidationError("a2a_dry_run_must_be_boolean");
  }
  if (!requestId) throw new A2aSyncValidationError("a2a_request_id_empty");
  if (!knownAgentIds.has(sourceAgent)) throw new A2aSyncValidationError("a2a_source_agent_unknown");
  if (!messageTypes.includes(messageType)) throw new A2aSyncValidationError("a2a_message_type_unsupported");
  if (routeToTelegram && !message) throw new A2aSyncValidationError("a2a_message_empty");
  if (message.length > A2A_MAX_MESSAGE_LENGTH) {
    throw new A2aSyncValidationError("a2a_message_too_long");
  }

  const blockedReasons = findBlockedReasons(goal);
  if (blockedReasons.length > 0) {
    return {
      title: "A2A Sync Plan",
      status: "blocked-a2a-sync-plan",
      mode: "local-only-dry-run",
      requestId,
      goal,
      ...lock(),
      blockedReasons,
      blockedActions: a2aSyncBlockedActions,
      syncPlan: null,
      nextRecommendedAction: "Remove blocked actions and request local-only planning.",
      stopPoint: "A2A SYNC PLAN BLOCKED - NO ACTION TAKEN",
      updatedAt: nowIso(options)
    };
  }

  const status = await getA2aSyncStatus(options);
  const plan = makeSyncPlan(sourceAgent, targetAgents, messageType, message, options);
  let notification = null;

  if (routeToTelegram) {
    notification = await routeA2aNotification(sourceAgent, messageType, message, {
      ...options,
      dryRun,
      status
    });
    plan.telegramRouted = true;
    plan.telegramSent = notification.telegramSent;
    plan.providerCalled = notification.providerCalled;
    plan.externalWriteOutcome = notification.externalWriteOutcome;
    plan.telegramResult = notification.telegramResult;
    if (plan.telegramSent) plan.deliveredTo.push("telegram-bot");
    if (notification.telegramAttempted && !plan.telegramSent) plan.failedTo.push("telegram-bot");
  }

  const telegramAttempted = notification?.telegramAttempted === true;
  const telegramFailed = telegramAttempted && !plan.telegramSent;
  const liveReady = status.telegramLane.liveSendReady;

  return {
    title: "A2A Sync Plan",
    status: plan.telegramSent
      ? "a2a-sync-plan-telegram-sent"
      : telegramFailed
        ? "a2a-sync-plan-telegram-failed"
        : "a2a-sync-plan-ready",
    mode: plan.telegramSent ? "live-sync" : "local-only-dry-run",
    requestId,
    goal,
    sourceAgent,
    targetAgents,
    messageType,
    ...lock(),
    externalWrites: plan.telegramSent,
    customerVisible: plan.telegramSent,
    canExecuteExternally: liveReady,
    canSendTelegram: liveReady,
    providerCalled: plan.providerCalled,
    externalWriteOutcome: plan.externalWriteOutcome,
    blockedReasons: [],
    blockedActions: a2aSyncBlockedActions,
    syncPlan: plan,
    telegramNotification: {
      routed: routeToTelegram,
      liveReady,
      attempted: telegramAttempted,
      dryRun,
      sent: plan.telegramSent,
      reason: notification?.reason || "message_type_not_routed_to_telegram"
    },
    manualSteps: [
      "Review the sync plan and target agents.",
      "Use explicit dryRun=false only for the approved alert or approval_request.",
      "Open the durable telegram_send gate through sirinx-control with an OPS-TG ticket.",
      "Retain the returned provider receipt; never infer delivery from readiness."
    ],
    nextRecommendedAction: plan.telegramSent
      ? "Record the Telegram delivery receipt against the OPS-TG ticket."
      : liveReady
        ? "Submit dryRun=false for an approved routed message."
        : "Complete env and durable gate admission before live notification routing.",
    stopPoint: plan.telegramSent
      ? "A2A SYNC PLAN COMPLETE - TELEGRAM DELIVERY REPORTED"
      : "A2A SYNC PLAN READY - NO TELEGRAM DELIVERY",
    updatedAt: nowIso(options)
  };
}

export async function routeA2aNotification(sourceAgent, messageType, message, options = {}) {
  const source = String(sourceAgent || "").trim();
  const type = String(messageType || "").trim();
  const text = String(message || "").trim();
  const dryRun = options.dryRun !== false;

  if (!knownAgentIds.has(source)) {
    return { ok: false, error: "a2a_source_agent_unknown", telegramSent: false, providerCalled: false };
  }
  if (!messageTypes.includes(type)) {
    return { ok: false, error: "a2a_message_type_unsupported", telegramSent: false, providerCalled: false };
  }
  if (text.length > A2A_MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "a2a_message_too_long", telegramSent: false, providerCalled: false };
  }

  const status = options.status || await getA2aSyncStatus(options);
  const liveReady = status.telegramLane.liveSendReady;
  const routeToTelegram = telegramMessageTypes.has(type);
  const telegramAttempted = routeToTelegram && liveReady && !dryRun;
  let telegramResult = null;

  if (telegramAttempted) {
    const sendTelegram = options.sendTelegramMessageImpl || sendTelegramMessage;
    telegramResult = await sendTelegram(
      (options.env || process.env).TELEGRAM_CHAT_ID,
      `[${type.toUpperCase()}] from ${source}: ${text}`,
      {
        dryRun: false,
        env: options.env || process.env,
        gate: options.gate,
        readTelegramSendGateImpl: options.readTelegramSendGateImpl,
        controlFetchImpl: options.controlFetchImpl,
        controlBaseUrl: options.controlBaseUrl,
        telegramFetchImpl: options.telegramFetchImpl,
        timeoutMs: options.timeoutMs,
        now: options.now
      }
    );
  }

  const telegramSent = telegramResult?.sent === true;
  const reason = !routeToTelegram
    ? "message_type_not_routed_to_telegram"
    : dryRun
      ? "telegram_dry_run_no_provider_call"
      : !liveReady
        ? status.telegramLane.gateReason || "telegram_live_send_not_ready"
        : telegramSent
          ? "telegram_notification_sent"
          : telegramResult?.error || "telegram_provider_rejected";

  return {
    ok: true,
    sourceAgent: source,
    messageType: type,
    message: text,
    timestamp: nowIso(options),
    telegramRouted: routeToTelegram,
    telegramReady: liveReady,
    telegramAttempted,
    telegramSent,
    providerCalled: telegramResult?.providerCalled === true,
    externalWrites: telegramSent,
    customerVisible: telegramSent,
    externalWriteOutcome: telegramSent
      ? "confirmed"
      : telegramResult?.providerCalled === true
        ? "unknown"
        : "none",
    telegramResult,
    notificationRecorded: false,
    reason,
    commandExecuted: false
  };
}
