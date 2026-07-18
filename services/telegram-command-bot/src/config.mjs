// Telegram gateway config for the SIRINX Command Center (Hermes lane).
//
// Canonical, read-only resolution of the Telegram control-plane configuration.
// This module NEVER returns secret values — only booleans and counts — so its
// output is safe to print, log, and attach to dry-run audit events.
//
// Live sending stays blocked by two independent controls:
//   1. Environment readiness (token/chat id/owner ids/SIRINX_TELEGRAM_CONFIRM=SEND)
//   2. The durable `telegram_send` control gate (migration 0003, hold-by-default),
//      which opens only through an OPS-TG-… ticket per GO_LIVE_GATE_CHECKLIST.md.

export const TELEGRAM_GATEWAY_VERSION = "1.0";

export const DEFAULT_ALLOWED_COMMANDS = ["/status", "/gates", "/sync-plan", "/stop"];

export const BLOCKED_ACTIONS = [
  "deploy",
  "push",
  "cloudflare-write",
  "production-db-write",
  "customer-send",
  "paid-api",
  "direct-shell",
];

// Alert levels the Command Center may route to Telegram, aligned with
// classifyNightWatchCallback().telegramLevel in services/hermes-api.
export const NIGHT_WATCH_ALERT_LEVELS = ["success", "success_warning", "failure"];

export const TELEGRAM_SEND_GATE = {
  name: "telegram_send",
  state: "hold",
  ticketPrefix: "OPS-TG-",
  openRequires: [
    "bot token + chat id provisioned outside the repo",
    "dry-run previews reviewed (npm run telegram:preview)",
    "message templates approved (no customer data leakage)",
  ],
};

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeCommand(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function parseOwnerIds(value) {
  return parseCommaList(value);
}

export function parseAllowedCommands(value, fallback = DEFAULT_ALLOWED_COMMANDS) {
  const parsed = parseCommaList(value).map(normalizeCommand).filter(Boolean);
  return parsed.length > 0 ? [...new Set(parsed)] : [...fallback];
}

export function resolveTelegramGatewayConfig(env = process.env) {
  const botToken = String(env.TELEGRAM_BOT_TOKEN || "");
  const chatId = String(env.TELEGRAM_CHAT_ID || "");
  const ownerIds = parseOwnerIds(env.TELEGRAM_OWNER_IDS);
  const allowedCommands = parseAllowedCommands(env.TELEGRAM_ALLOWED_COMMANDS);
  const confirmSend = env.SIRINX_TELEGRAM_CONFIRM === "SEND";

  const missing = [];
  if (!botToken) missing.push("TELEGRAM_BOT_TOKEN");
  if (!chatId) missing.push("TELEGRAM_CHAT_ID");
  if (ownerIds.length === 0) missing.push("TELEGRAM_OWNER_IDS");
  if (!confirmSend) missing.push("SIRINX_TELEGRAM_CONFIRM=SEND");

  const envReady = missing.length === 0;
  const gateOpen = TELEGRAM_SEND_GATE.state === "open";

  return {
    service: "telegram-command-bot",
    gateway: "command-center-telegram",
    version: TELEGRAM_GATEWAY_VERSION,
    mode: envReady ? "env-ready-gate-held" : "dry-run",
    credentials: {
      botTokenConfigured: Boolean(botToken),
      chatIdConfigured: Boolean(chatId),
      ownerIdsConfigured: ownerIds.length > 0,
      ownerCount: ownerIds.length,
    },
    confirmSend,
    allowedCommands,
    blockedActions: [...BLOCKED_ACTIONS],
    nightWatchAlertLevels: [...NIGHT_WATCH_ALERT_LEVELS],
    gate: { ...TELEGRAM_SEND_GATE, openRequires: [...TELEGRAM_SEND_GATE.openRequires] },
    envReady,
    liveSendReady: envReady && gateOpen,
    missing,
    guardrail:
      "Config is read-only and redacted. Real Telegram send still requires --send, env credentials, SIRINX_TELEGRAM_CONFIRM=SEND, and an opened telegram_send gate (OPS-TG-…).",
  };
}
