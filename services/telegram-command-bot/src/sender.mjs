import { createHash } from "node:crypto";
import { resolveTelegramGatewayConfig, resolveTelegramGatewayReadiness } from "./config.mjs";

export const TELEGRAM_API_BASE = "https://api.telegram.org";
export const TELEGRAM_MAX_TEXT_LENGTH = 4096;
export const SENDER_VERSION = "1.1";

export const SENDER_BLOCKED_ACTIONS = [
  "deploy",
  "push",
  "cloudflare-write",
  "production-db-write",
  "customer-send",
  "paid-api",
  "direct-shell"
];

function nowIso(options = {}) {
  const value = typeof options.now === "function" ? options.now() : options.now || new Date();
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function textDigest(text) {
  return createHash("sha256").update(text).digest("hex");
}

function redactChatId(chatId) {
  return chatId ? `sha256:${textDigest(chatId).slice(0, 12)}` : null;
}

function readinessView(config) {
  return {
    ready: config.liveSendReady,
    envReady: config.envReady,
    gateOpen: config.gate.state === "open",
    mode: config.mode,
    missing: [...config.missing],
    gate: { ...config.gate, openRequires: [...config.gate.openRequires] }
  };
}

export async function checkTelegramSendReady(env = process.env, options = {}) {
  const config = options.checkDurableGate === false
    ? resolveTelegramGatewayConfig(env)
    : await resolveTelegramGatewayReadiness(env, options);
  return readinessView(config);
}

export async function sendTelegramMessage(chatId, text, options = {}) {
  const env = options.env || process.env;
  const botToken = String(env.TELEGRAM_BOT_TOKEN || "").trim();
  const configuredChatId = String(env.TELEGRAM_CHAT_ID || "").trim();
  const requestedChatId = String(chatId || configuredChatId || "").trim();
  const message = String(text || "");
  const parseMode = options.parseMode || null;
  const disableWebPagePreview = options.disableWebPagePreview !== false;
  const dryRun = options.dryRun !== false;
  const initialConfig = resolveTelegramGatewayConfig(env);

  const auditRecord = {
    sender: "telegram-sender",
    version: SENDER_VERSION,
    timestamp: nowIso(options),
    chatId: redactChatId(configuredChatId || requestedChatId),
    textDigest: textDigest(message),
    textLength: message.length,
    parseMode,
    readiness: readinessView(initialConfig),
    sent: false,
    dryRun,
    providerCalled: false,
    externalWriteOutcome: "none",
    commandExecuted: false,
    apiResponse: null,
    error: null
  };

  if (!configuredChatId) {
    return { ...auditRecord, error: "telegram_chat_id_missing" };
  }

  if (requestedChatId !== configuredChatId) {
    return { ...auditRecord, error: "telegram_destination_override_blocked" };
  }

  if (!botToken) {
    return { ...auditRecord, error: "telegram_bot_token_missing" };
  }

  if (!message.trim()) {
    return { ...auditRecord, error: "telegram_message_empty" };
  }

  if (message.length > TELEGRAM_MAX_TEXT_LENGTH) {
    return { ...auditRecord, error: "telegram_message_too_long" };
  }

  if (dryRun) {
    return {
      ...auditRecord,
      error: "telegram_dry_run_no_provider_call"
    };
  }

  // Re-read the durable Rust gate immediately before every provider attempt.
  // Status responses are never reused as send authority.
  const readiness = await checkTelegramSendReady(env, {
    ...options,
    checkDurableGate: true
  });
  const readyRecord = { ...auditRecord, readiness };

  if (!readiness.ready) {
    return {
      ...readyRecord,
      error: readiness.gate.reason || "telegram_live_send_not_ready"
    };
  }

  const telegramFetch = options.telegramFetchImpl || options.fetchImpl || globalThis.fetch;
  if (typeof telegramFetch !== "function") {
    return { ...readyRecord, error: "telegram_fetch_unavailable" };
  }

  try {
    const body = {
      chat_id: configuredChatId,
      text: message,
      disable_web_page_preview: disableWebPagePreview
    };

    if (parseMode) body.parse_mode = parseMode;

    const response = await telegramFetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: options.signal || AbortSignal.timeout(Number(options.timeoutMs || 15_000))
    });

    let responseBody = null;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }

    const sent = response.ok === true && responseBody?.ok === true;
    return {
      ...readyRecord,
      sent,
      providerCalled: true,
      externalWriteOutcome: sent ? "confirmed" : "rejected",
      apiResponse: {
        ok: responseBody?.ok === true,
        httpStatus: Number.isInteger(response.status) ? response.status : null,
        errorCode: responseBody?.error_code || null,
        descriptionPresent: typeof responseBody?.description === "string",
        result: sent
          ? {
              messageId: responseBody.result?.message_id || null,
              chat: redactChatId(String(responseBody.result?.chat?.id || configuredChatId)),
              date: responseBody.result?.date || null
            }
          : null
      },
      error: sent ? null : "telegram_provider_rejected"
    };
  } catch (error) {
    return {
      ...readyRecord,
      sent: false,
      providerCalled: true,
      externalWriteOutcome: "unknown",
      error: error?.name === "AbortError" || error?.name === "TimeoutError"
        ? "telegram_request_timeout"
        : "telegram_request_failed"
    };
  }
}

export async function sendTelegramAlert(text, options = {}) {
  const env = options.env || process.env;
  const prefix = options.prefix || "⚠️ SIRINX Alert";
  return sendTelegramMessage(env.TELEGRAM_CHAT_ID, `${prefix}\n\n${text}`, options);
}

export async function sendTelegramNotification(text, options = {}) {
  const env = options.env || process.env;
  const prefix = options.prefix || "ℹ️ SIRINX Notification";
  return sendTelegramMessage(env.TELEGRAM_CHAT_ID, `${prefix}\n\n${text}`, options);
}
