import { describe, expect, it } from "vitest";
import {
  BLOCKED_ACTIONS,
  DEFAULT_ALLOWED_COMMANDS,
  NIGHT_WATCH_ALERT_LEVELS,
  parseAllowedCommands,
  parseOwnerIds,
  resolveTelegramGatewayConfig,
  resolveTelegramGatewayReadiness,
} from "./config.mjs";

const FULL_ENV = {
  TELEGRAM_BOT_TOKEN: "123456789:TESTTOKEN_do-not-leak-abcdef",
  TELEGRAM_CHAT_ID: "-1001234567890",
  TELEGRAM_OWNER_IDS: "111, 222 ,333",
  TELEGRAM_ALLOWED_COMMANDS: "/status, /gates, /stop",
  SIRINX_TELEGRAM_CONFIRM: "SEND",
};

describe("parseOwnerIds", () => {
  it("parses comma-separated ids and trims whitespace", () => {
    expect(parseOwnerIds("111, 222 ,333")).toEqual(["111", "222", "333"]);
  });

  it("returns an empty list for missing or blank input", () => {
    expect(parseOwnerIds("")).toEqual([]);
    expect(parseOwnerIds(undefined)).toEqual([]);
    expect(parseOwnerIds(" , ,")).toEqual([]);
  });
});

describe("parseAllowedCommands", () => {
  it("falls back to defaults when unset", () => {
    expect(parseAllowedCommands("")).toEqual(DEFAULT_ALLOWED_COMMANDS);
    expect(parseAllowedCommands(undefined)).toEqual(DEFAULT_ALLOWED_COMMANDS);
  });

  it("normalizes commands without a leading slash and dedupes", () => {
    expect(parseAllowedCommands("status, /gates, status")).toEqual(["/status", "/gates"]);
  });
});

describe("resolveTelegramGatewayConfig", () => {
  it("defaults to dry-run with every requirement missing", () => {
    const config = resolveTelegramGatewayConfig({});

    expect(config.mode).toBe("dry-run");
    expect(config.envReady).toBe(false);
    expect(config.liveSendReady).toBe(false);
    expect(config.missing).toEqual([
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_CHAT_ID",
      "TELEGRAM_OWNER_IDS",
      "SIRINX_TELEGRAM_CONFIRM=SEND",
    ]);
    expect(config.allowedCommands).toEqual(DEFAULT_ALLOWED_COMMANDS);
    expect(config.blockedActions).toEqual(BLOCKED_ACTIONS);
    expect(config.nightWatchAlertLevels).toEqual(NIGHT_WATCH_ALERT_LEVELS);
  });

  it("requires SIRINX_TELEGRAM_CONFIRM to be exactly SEND", () => {
    const config = resolveTelegramGatewayConfig({
      ...FULL_ENV,
      SIRINX_TELEGRAM_CONFIRM: "send",
    });

    expect(config.confirmSend).toBe(false);
    expect(config.envReady).toBe(false);
    expect(config.missing).toContain("SIRINX_TELEGRAM_CONFIRM=SEND");
  });

  it("does not report whitespace-only token or chat id as configured", () => {
    const config = resolveTelegramGatewayConfig({
      ...FULL_ENV,
      TELEGRAM_BOT_TOKEN: "   ",
      TELEGRAM_CHAT_ID: "\t\n",
    });

    expect(config.envReady).toBe(false);
    expect(config.liveSendReady).toBe(false);
    expect(config.credentials.botTokenConfigured).toBe(false);
    expect(config.credentials.chatIdConfigured).toBe(false);
    expect(config.missing).toEqual(expect.arrayContaining([
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_CHAT_ID",
    ]));
  });

  it("reports env-ready but gate-unavailable until durable authority is checked", () => {
    const config = resolveTelegramGatewayConfig(FULL_ENV);

    expect(config.mode).toBe("env-ready-gate-unavailable");
    expect(config.envReady).toBe(true);
    expect(config.missing).toEqual([]);
    expect(config.gate.name).toBe("telegram_send");
    expect(config.gate.state).toBe("hold");
    expect(config.gate.ticketPrefix).toBe("OPS-TG-");
    expect(config.liveSendReady).toBe(false);
  });

  it("treats a fresh durable OPS-TG gate as live-ready", () => {
    const config = resolveTelegramGatewayConfig(FULL_ENV, {
      gateEvidence: {
        authority: "sirinx-control",
        effectiveState: "open",
        reportedState: "open",
        open: true,
        authoritative: true,
        fresh: true,
        ticketPresent: true,
        ticketPrefixValid: true,
        checkedAt: "2026-07-20T00:00:00.000Z",
        expiresAt: "2026-07-20T00:00:02.000Z",
        reason: null,
      },
    });

    expect(config.mode).toBe("live-ready");
    expect(config.gate.state).toBe("open");
    expect(config.liveSendReady).toBe(true);
  });

  it("reports credential booleans and owner count without leaking values", () => {
    const config = resolveTelegramGatewayConfig(FULL_ENV);

    expect(config.credentials).toEqual({
      botTokenConfigured: true,
      chatIdConfigured: true,
      ownerIdsConfigured: true,
      ownerCount: 3,
    });

    const serialized = JSON.stringify(config);
    expect(serialized).not.toContain(FULL_ENV.TELEGRAM_BOT_TOKEN);
    expect(serialized).not.toContain(FULL_ENV.TELEGRAM_CHAT_ID);
    expect(serialized).not.toContain("TESTTOKEN");
  });

  it("honors the TELEGRAM_ALLOWED_COMMANDS override", () => {
    const config = resolveTelegramGatewayConfig(FULL_ENV);
    expect(config.allowedCommands).toEqual(["/status", "/gates", "/stop"]);
  });
});

describe("resolveTelegramGatewayReadiness", () => {
  it("fails closed when CONTROL_API_TOKEN is absent", async () => {
    const config = await resolveTelegramGatewayReadiness(FULL_ENV);

    expect(config.mode).toBe("env-ready-gate-unavailable");
    expect(config.liveSendReady).toBe(false);
    expect(config.gate.reason).toBe("control_api_token_missing");
  });

  it("does not expose the control token or durable ticket", async () => {
    const env = { ...FULL_ENV, CONTROL_API_TOKEN: "control-secret-test" };
    const config = await resolveTelegramGatewayReadiness(env, {
      gate: { state: "open", ticket: "OPS-TG-TEST-001" },
      now: () => new Date("2026-07-20T00:00:00.000Z"),
    });
    const serialized = JSON.stringify(config);

    expect(config.liveSendReady).toBe(true);
    expect(serialized).not.toContain(env.CONTROL_API_TOKEN);
    expect(serialized).not.toContain("OPS-TG-TEST-001");
  });
});
