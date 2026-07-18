import { describe, expect, it } from "vitest";
import {
  BLOCKED_ACTIONS,
  DEFAULT_ALLOWED_COMMANDS,
  NIGHT_WATCH_ALERT_LEVELS,
  parseAllowedCommands,
  parseOwnerIds,
  resolveTelegramGatewayConfig,
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

  it("reports env-ready but stays blocked while the telegram_send gate holds", () => {
    const config = resolveTelegramGatewayConfig(FULL_ENV);

    expect(config.mode).toBe("env-ready-gate-held");
    expect(config.envReady).toBe(true);
    expect(config.missing).toEqual([]);
    expect(config.gate.name).toBe("telegram_send");
    expect(config.gate.state).toBe("hold");
    expect(config.gate.ticketPrefix).toBe("OPS-TG-");
    expect(config.liveSendReady).toBe(false);
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
