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

import { readTelegramSendGate, TELEGRAM_CONTROL_GATE } from "./control-gate.mjs";

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
  // This is a safe local fallback for config-only/dry-run output. It is not
  // live authority. Live readiness is read fresh from sirinx-control.
  state: "hold",
  authority: TELEGRAM_CONTROL_GATE.authority,
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

export function resolveTelegramGatewayConfig(env = process.env, options = {}) {
  const botToken = String(env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = String(env.TELEGRAM_CHAT_ID || "").trim();
  const ownerIds = parseOwnerIds(env.TELEGRAM_OWNER_IDS);
  const allowedCommands = parseAllowedCommands(env.TELEGRAM_ALLOWED_COMMANDS);
  const confirmSend = env.SIRINX_TELEGRAM_CONFIRM === "SEND";

  const missing = [];
  if (!botToken) missing.push("TELEGRAM_BOT_TOKEN");
  if (!chatId) missing.push("TELEGRAM_CHAT_ID");
  if (ownerIds.length === 0) missing.push("TELEGRAM_OWNER_IDS");
  if (!confirmSend) missing.push("SIRINX_TELEGRAM_CONFIRM=SEND");

  const envReady = missing.length === 0;
  const gateEvidence = options.gateEvidence && typeof options.gateEvidence === "object"
    ? options.gateEvidence
    : {
        authority: TELEGRAM_SEND_GATE.authority,
        effectiveState: TELEGRAM_SEND_GATE.state,
        reportedState: TELEGRAM_SEND_GATE.state,
        open: false,
        authoritative: false,
        fresh: false,
        ticketPresent: false,
        ticketPrefixValid: false,
        checkedAt: null,
        expiresAt: null,
        reason: "durable_gate_not_checked"
      };
  const gateOpen = gateEvidence.open === true
    && gateEvidence.authoritative === true
    && gateEvidence.fresh === true;
  const liveSendReady = envReady && gateOpen;

  return {
    service: "telegram-command-bot",
    gateway: "command-center-telegram",
    version: TELEGRAM_GATEWAY_VERSION,
    mode: liveSendReady
      ? "live-ready"
      : envReady && gateEvidence.authoritative
        ? "env-ready-gate-held"
        : envReady
          ? "env-ready-gate-unavailable"
          : "dry-run",
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
    gate: {
      name: TELEGRAM_SEND_GATE.name,
      state: gateEvidence.effectiveState || "hold",
      reportedState: gateEvidence.reportedState || null,
      authority: gateEvidence.authority || TELEGRAM_SEND_GATE.authority,
      authoritative: gateEvidence.authoritative === true,
      fresh: gateEvidence.fresh === true,
      ticketPresent: gateEvidence.ticketPresent === true,
      ticketPrefixValid: gateEvidence.ticketPrefixValid === true,
      checkedAt: gateEvidence.checkedAt || null,
      expiresAt: gateEvidence.expiresAt || null,
      reason: gateEvidence.reason || null,
      ticketPrefix: TELEGRAM_SEND_GATE.ticketPrefix,
      openRequires: [...TELEGRAM_SEND_GATE.openRequires]
    },
    envReady,
    liveSendReady,
    missing,
    guardrail:
      "Config is redacted. Real Telegram send requires env readiness, explicit dryRun=false, CONTROL_API_TOKEN auth, and a fresh durable telegram_send gate with an OPS-TG ticket.",
  };
}

export async function resolveTelegramGatewayReadiness(env = process.env, options = {}) {
  const readGate = options.readTelegramSendGateImpl || readTelegramSendGate;
  const gateEvidence = await readGate({
    env,
    fetchImpl: options.controlFetchImpl,
    baseUrl: options.controlBaseUrl,
    timeoutMs: options.controlTimeoutMs,
    maxAgeMs: options.gateMaxAgeMs,
    now: options.now,
    signal: options.controlSignal,
    gate: options.gate
  });

  return resolveTelegramGatewayConfig(env, { gateEvidence });
}
