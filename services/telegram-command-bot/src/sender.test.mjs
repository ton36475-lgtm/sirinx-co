import { describe, expect, it, vi } from "vitest";
import {
  SENDER_BLOCKED_ACTIONS,
  SENDER_VERSION,
  TELEGRAM_MAX_TEXT_LENGTH,
  checkTelegramSendReady,
  sendTelegramAlert,
  sendTelegramMessage,
  sendTelegramNotification,
} from "./sender.mjs";

const FULL_ENV = {
  TELEGRAM_BOT_TOKEN: "123456789:TESTTOKEN_do-not-leak-abcdef",
  TELEGRAM_CHAT_ID: "-1001234567890",
  TELEGRAM_OWNER_IDS: "111,222,333",
  SIRINX_TELEGRAM_CONFIRM: "SEND",
  CONTROL_API_TOKEN: "control-secret-test",
};
const OPEN_GATE = { state: "open", ticket: "OPS-TG-TEST-001" };
const HELD_GATE = { state: "hold", ticket: "OPS-TG-TEST-001" };
const NOW = () => new Date("2026-07-20T00:00:00.000Z");

function telegramResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe("checkTelegramSendReady", () => {
  it("returns not ready in empty env", async () => {
    const readiness = await checkTelegramSendReady({}, { now: NOW });

    expect(readiness).toMatchObject({
      ready: false,
      envReady: false,
      gateOpen: false,
      mode: "dry-run",
    });
    expect(readiness.missing.length).toBeGreaterThan(0);
  });

  it("reports a durable held gate without a provider call", async () => {
    const readiness = await checkTelegramSendReady(FULL_ENV, { gate: HELD_GATE, now: NOW });

    expect(readiness).toMatchObject({
      envReady: true,
      gateOpen: false,
      ready: false,
      mode: "env-ready-gate-held",
    });
  });

  it("requires env readiness and a fresh authoritative gate", async () => {
    const readiness = await checkTelegramSendReady(FULL_ENV, { gate: OPEN_GATE, now: NOW });

    expect(readiness).toMatchObject({
      ready: true,
      envReady: true,
      gateOpen: true,
      mode: "live-ready",
    });
  });
});

describe("sendTelegramMessage", () => {
  it("defaults to dry-run and never calls control or Telegram", async () => {
    const controlFetchImpl = vi.fn();
    const telegramFetchImpl = vi.fn();
    const message = "Hello from test";
    const result = await sendTelegramMessage(FULL_ENV.TELEGRAM_CHAT_ID, message, {
      env: FULL_ENV,
      controlFetchImpl,
      telegramFetchImpl,
      now: NOW,
    });

    expect(result).toMatchObject({
      sender: "telegram-sender",
      version: SENDER_VERSION,
      dryRun: true,
      sent: false,
      providerCalled: false,
      externalWriteOutcome: "none",
      commandExecuted: false,
      error: "telegram_dry_run_no_provider_call",
      textLength: message.length,
    });
    expect(result.chatId).toMatch(/^sha256:[a-f0-9]{12}$/);
    expect(result.textDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(result).not.toHaveProperty("textPreview");
    expect(controlFetchImpl).not.toHaveBeenCalled();
    expect(telegramFetchImpl).not.toHaveBeenCalled();
  });

  it("validates fixed destination, credentials, message, and length", async () => {
    const missingChat = await sendTelegramMessage("", "test", { env: {}, now: NOW });
    const override = await sendTelegramMessage("different-chat", "test", { env: FULL_ENV, now: NOW });
    const missingToken = await sendTelegramMessage(FULL_ENV.TELEGRAM_CHAT_ID, "test", {
      env: { TELEGRAM_CHAT_ID: FULL_ENV.TELEGRAM_CHAT_ID },
      now: NOW,
    });
    const empty = await sendTelegramMessage(FULL_ENV.TELEGRAM_CHAT_ID, "  ", { env: FULL_ENV, now: NOW });
    const tooLong = await sendTelegramMessage(
      FULL_ENV.TELEGRAM_CHAT_ID,
      "x".repeat(TELEGRAM_MAX_TEXT_LENGTH + 1),
      { env: FULL_ENV, now: NOW },
    );

    expect(missingChat.error).toBe("telegram_chat_id_missing");
    expect(override.error).toBe("telegram_destination_override_blocked");
    expect(missingToken.error).toBe("telegram_bot_token_missing");
    expect(empty.error).toBe("telegram_message_empty");
    expect(tooLong.error).toBe("telegram_message_too_long");
  });

  it("re-reads the held gate at action time and does not call Telegram", async () => {
    const telegramFetchImpl = vi.fn();
    const result = await sendTelegramMessage(FULL_ENV.TELEGRAM_CHAT_ID, "live test", {
      env: FULL_ENV,
      dryRun: false,
      gate: HELD_GATE,
      telegramFetchImpl,
      now: NOW,
    });

    expect(result).toMatchObject({
      dryRun: false,
      sent: false,
      providerCalled: false,
      error: "gate_held",
    });
    expect(telegramFetchImpl).not.toHaveBeenCalled();
  });

  it("uses separate control and provider calls and confirms Telegram body ok", async () => {
    const controlFetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        gates: [{ name: "telegram_send", state: "open", ticket: "OPS-TG-TEST-001" }],
        persistence: {
          backend: "postgres",
          durable: true,
          observedAt: "2026-07-20T00:00:00.000Z",
        },
      }),
    });
    const telegramFetchImpl = vi.fn().mockResolvedValue(telegramResponse({
      ok: true,
      result: {
        message_id: 42,
        chat: { id: FULL_ENV.TELEGRAM_CHAT_ID },
        date: 1_784_486_400,
      },
    }));
    const result = await sendTelegramMessage(FULL_ENV.TELEGRAM_CHAT_ID, "approved live test", {
      env: FULL_ENV,
      dryRun: false,
      controlFetchImpl,
      telegramFetchImpl,
      now: NOW,
    });

    expect(result).toMatchObject({
      sent: true,
      providerCalled: true,
      externalWriteOutcome: "confirmed",
      error: null,
      apiResponse: {
        ok: true,
        httpStatus: 200,
        result: { messageId: 42 },
      },
    });
    expect(controlFetchImpl).toHaveBeenCalledTimes(1);
    expect(telegramFetchImpl).toHaveBeenCalledTimes(1);
    const providerOptions = telegramFetchImpl.mock.calls[0][1];
    expect(JSON.parse(providerOptions.body)).toMatchObject({
      chat_id: FULL_ENV.TELEGRAM_CHAT_ID,
      text: "approved live test",
    });
  });

  it.each([
    ["Telegram ok=false", telegramResponse({ ok: false, error_code: 400 }, 200)],
    ["HTTP rejection", telegramResponse({ ok: false, error_code: 403 }, 403)],
    ["invalid JSON", { ok: true, status: 200, json: vi.fn().mockRejectedValue(new Error("bad json")) }],
  ])("reports %s as a provider rejection", async (_label, providerResponse) => {
    const result = await sendTelegramMessage(FULL_ENV.TELEGRAM_CHAT_ID, "approved", {
      env: FULL_ENV,
      dryRun: false,
      gate: OPEN_GATE,
      telegramFetchImpl: vi.fn().mockResolvedValue(providerResponse),
      now: NOW,
    });

    expect(result).toMatchObject({
      sent: false,
      providerCalled: true,
      externalWriteOutcome: "rejected",
      error: "telegram_provider_rejected",
    });
  });

  it("sanitizes provider network and timeout failures", async () => {
    const cases = [
      [new Error(`network failed for ${FULL_ENV.TELEGRAM_BOT_TOKEN}`), "telegram_request_failed"],
      [Object.assign(new Error("timeout"), { name: "TimeoutError" }), "telegram_request_timeout"],
    ];

    for (const [error, expected] of cases) {
      const result = await sendTelegramMessage(FULL_ENV.TELEGRAM_CHAT_ID, "private approved body", {
        env: FULL_ENV,
        dryRun: false,
        gate: OPEN_GATE,
        telegramFetchImpl: vi.fn().mockRejectedValue(error),
        now: NOW,
      });
      const serialized = JSON.stringify(result);

      expect(result).toMatchObject({
        sent: false,
        providerCalled: true,
        externalWriteOutcome: "unknown",
        error: expected,
      });
      expect(serialized).not.toContain(FULL_ENV.TELEGRAM_BOT_TOKEN);
      expect(serialized).not.toContain(FULL_ENV.TELEGRAM_CHAT_ID);
      expect(serialized).not.toContain("private approved body");
      expect(serialized).not.toContain("OPS-TG-TEST-001");
    }
  });
});

describe("message helpers", () => {
  it.each([
    [sendTelegramAlert, "⚠️ SIRINX Alert"],
    [sendTelegramNotification, "ℹ️ SIRINX Notification"],
  ])("uses a safe prefix while retaining dry-run behavior", async (helper, prefix) => {
    const result = await helper("All systems nominal", { env: FULL_ENV, now: NOW });

    expect(result).toMatchObject({ dryRun: true, sent: false, providerCalled: false });
    expect(result.textLength).toBe(`${prefix}\n\nAll systems nominal`.length);
  });
});

describe("SENDER_BLOCKED_ACTIONS", () => {
  it("lists the expected blocked actions", () => {
    expect(SENDER_BLOCKED_ACTIONS).toEqual([
      "deploy",
      "push",
      "cloudflare-write",
      "production-db-write",
      "customer-send",
      "paid-api",
      "direct-shell",
    ]);
  });
});
