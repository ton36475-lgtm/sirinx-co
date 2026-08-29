import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TELEGRAM_BOT_PORT,
  createTelegramCommandServer,
  runTelegramCommandBotCli,
} from "./index.mjs";

const FULL_ENV = {
  TELEGRAM_BOT_TOKEN: "123456789:TESTTOKEN_do-not-leak-abcdef",
  TELEGRAM_CHAT_ID: "-1001234567890",
  TELEGRAM_OWNER_IDS: "111,222,333",
  SIRINX_TELEGRAM_CONFIRM: "SEND",
  CONTROL_API_TOKEN: "local-control-test-token",
};

const servers = new Set();

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function openGateFetch() {
  return vi.fn(async () => jsonResponse({
    gates: [{ name: "telegram_send", state: "open", ticket: "OPS-TG-TEST-001" }],
    persistence: {
      backend: "postgres",
      durable: true,
      observedAt: new Date().toISOString(),
    },
  }));
}

function successfulTelegramFetch() {
  return vi.fn(async () => jsonResponse({
    ok: true,
    result: {
      message_id: 73,
      chat: { id: FULL_ENV.TELEGRAM_CHAT_ID },
      date: 1_725_000_000,
    },
  }));
}

async function startTestServer(options = {}) {
  const server = createTelegramCommandServer({
    env: FULL_ENV,
    host: "127.0.0.1",
    port: 0,
    ...options,
  });
  servers.add(server);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function postJson(baseUrl, body, options = {}) {
  return fetch(`${baseUrl}/send`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(async () => {
  await Promise.all([...servers].map((server) => new Promise((resolve) => {
    server.close(() => resolve());
  })));
  servers.clear();
  vi.restoreAllMocks();
});

describe("Telegram command bot HTTP boundary", () => {
  it("uses a non-conflicting default port and is importable without listening", () => {
    expect(DEFAULT_TELEGRAM_BOT_PORT).toBe(8791);
    const unstartedServer = createTelegramCommandServer({ env: FULL_ENV });
    expect(unstartedServer.listening).toBe(false);
  });

  it("preserves config and dry-run CLI modes without starting a listener", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    const config = await runTelegramCommandBotCli(["--config"], { env: FULL_ENV });
    const dryRun = await runTelegramCommandBotCli(["--dry-run"], { env: FULL_ENV });

    expect(config).toEqual({ mode: "config", server: null });
    expect(dryRun).toEqual({ mode: "dry-run", server: null });
    expect(log).toHaveBeenCalledTimes(2);
    expect(log.mock.calls.flat().join("\n")).not.toContain(FULL_ENV.TELEGRAM_BOT_TOKEN);
    expect(log.mock.calls.flat().join("\n")).not.toContain(FULL_ENV.CONTROL_API_TOKEN);
  });

  it("rejects an unauthenticated live send before gate or provider access", async () => {
    const controlFetchImpl = openGateFetch();
    const telegramFetchImpl = successfulTelegramFetch();
    const baseUrl = await startTestServer({ controlFetchImpl, telegramFetchImpl });

    const response = await postJson(baseUrl, { text: "hello", dryRun: false }, {
      headers: { "idempotency-key": "live-unauthorized-1" },
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe("Bearer");
    expect(body).toMatchObject({
      ok: false,
      status: "unauthorized_live_send",
      sent: false,
      providerCalled: false,
    });
    expect(controlFetchImpl).not.toHaveBeenCalled();
    expect(telegramFetchImpl).not.toHaveBeenCalled();
  });

  it("defaults to dry-run without consuming auth or calling either provider", async () => {
    const controlFetchImpl = openGateFetch();
    const telegramFetchImpl = successfulTelegramFetch();
    const baseUrl = await startTestServer({ controlFetchImpl, telegramFetchImpl });

    const response = await postJson(baseUrl, { text: "dry-run hello" });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      dryRun: true,
      sent: false,
      providerCalled: false,
      error: "telegram_dry_run_no_provider_call",
    });
    expect(controlFetchImpl).not.toHaveBeenCalled();
    expect(telegramFetchImpl).not.toHaveBeenCalled();
  });

  it("enforces the request body limit and returns sanitized invalid JSON errors", async () => {
    const baseUrl = await startTestServer({ maxBodyBytes: 64 });

    const tooLarge = await postJson(baseUrl, { text: "x".repeat(80) });
    expect(tooLarge.status).toBe(413);
    expect(await tooLarge.json()).toMatchObject({
      status: "request_body_too_large",
      providerCalled: false,
    });

    const invalid = await postJson(baseUrl, "{not-json");
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({
      ok: false,
      status: "invalid_json",
      sent: false,
      providerCalled: false,
      commandExecuted: false,
    });
  });

  it("requires an object, a boolean dryRun, and rejects every caller destination", async () => {
    const baseUrl = await startTestServer();

    const arrayBody = await postJson(baseUrl, []);
    expect(arrayBody.status).toBe(422);
    expect((await arrayBody.json()).status).toBe("request_body_must_be_object");

    const invalidDryRun = await postJson(baseUrl, { text: "hello", dryRun: "false" });
    expect(invalidDryRun.status).toBe(422);
    expect((await invalidDryRun.json()).status).toBe("dry_run_must_be_boolean");

    for (const override of [
      { chatId: FULL_ENV.TELEGRAM_CHAT_ID },
      { chat_id: FULL_ENV.TELEGRAM_CHAT_ID },
      { destination: FULL_ENV.TELEGRAM_CHAT_ID },
      { to: FULL_ENV.TELEGRAM_CHAT_ID },
    ]) {
      const response = await postJson(baseUrl, { text: "hello", ...override });
      expect(response.status).toBe(422);
      expect((await response.json()).status).toBe("telegram_destination_override_blocked");
    }
  });

  it("requires a configured control token and an idempotency key for live sends", async () => {
    const noAuthBaseUrl = await startTestServer({
      env: { ...FULL_ENV, CONTROL_API_TOKEN: "" },
    });
    const noControlToken = await postJson(noAuthBaseUrl, { text: "hello", dryRun: false });
    expect(noControlToken.status).toBe(503);
    expect((await noControlToken.json()).status).toBe("control_auth_unavailable");

    const baseUrl = await startTestServer();
    const noIdempotencyKey = await postJson(baseUrl, { text: "hello", dryRun: false }, {
      headers: { authorization: `Bearer ${FULL_ENV.CONTROL_API_TOKEN}` },
    });
    expect(noIdempotencyKey.status).toBe(400);
    expect((await noIdempotencyKey.json()).status).toBe("idempotency_key_required");
  });

  it("performs an authorized live send through a fresh durable gate to the fixed env destination", async () => {
    const controlFetchImpl = openGateFetch();
    const telegramFetchImpl = successfulTelegramFetch();
    const baseUrl = await startTestServer({ controlFetchImpl, telegramFetchImpl });

    const response = await postJson(baseUrl, { text: "hello", dryRun: false }, {
      headers: {
        authorization: `Bearer ${FULL_ENV.CONTROL_API_TOKEN}`,
        "idempotency-key": "live-success-1",
      },
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ sent: true, dryRun: false, providerCalled: true, error: null });
    expect(controlFetchImpl).toHaveBeenCalledTimes(1);
    expect(telegramFetchImpl).toHaveBeenCalledTimes(1);
    const [providerUrl, providerRequest] = telegramFetchImpl.mock.calls[0];
    expect(providerUrl).toContain("api.telegram.org");
    expect(JSON.parse(providerRequest.body)).toMatchObject({
      chat_id: FULL_ENV.TELEGRAM_CHAT_ID,
      text: "hello",
    });
    expect(JSON.stringify(body)).not.toContain(FULL_ENV.TELEGRAM_BOT_TOKEN);
    expect(JSON.stringify(body)).not.toContain(FULL_ENV.CONTROL_API_TOKEN);
  });

  it("replays an exact live request receipt without a second gate or provider call", async () => {
    const controlFetchImpl = openGateFetch();
    const telegramFetchImpl = successfulTelegramFetch();
    const baseUrl = await startTestServer({ controlFetchImpl, telegramFetchImpl });
    const headers = {
      authorization: `Bearer ${FULL_ENV.CONTROL_API_TOKEN}`,
      "idempotency-key": "live-replay-1",
    };

    const first = await postJson(baseUrl, { text: "one delivery", dryRun: false }, { headers });
    const firstBody = await first.json();
    const replay = await postJson(baseUrl, { text: "one delivery", dryRun: false }, { headers });
    const replayBody = await replay.json();

    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect(replay.headers.get("idempotency-replayed")).toBe("true");
    expect(replay.headers.get("access-control-expose-headers")).toContain("idempotency-replayed");
    expect(replayBody).toEqual(firstBody);
    expect(controlFetchImpl).toHaveBeenCalledTimes(1);
    expect(telegramFetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns 409 when one live idempotency key is reused for a different body", async () => {
    const controlFetchImpl = openGateFetch();
    const telegramFetchImpl = successfulTelegramFetch();
    const baseUrl = await startTestServer({ controlFetchImpl, telegramFetchImpl });
    const headers = {
      authorization: `Bearer ${FULL_ENV.CONTROL_API_TOKEN}`,
      "idempotency-key": "live-conflict-1",
    };

    const first = await postJson(baseUrl, { text: "first", dryRun: false }, { headers });
    expect(first.status).toBe(200);
    const conflict = await postJson(baseUrl, { text: "second", dryRun: false }, { headers });

    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      status: "idempotency_key_conflict",
      sent: false,
      providerCalled: false,
    });
    expect(controlFetchImpl).toHaveBeenCalledTimes(1);
    expect(telegramFetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not consume a live idempotency key during dry-run", async () => {
    const controlFetchImpl = openGateFetch();
    const telegramFetchImpl = successfulTelegramFetch();
    const baseUrl = await startTestServer({ controlFetchImpl, telegramFetchImpl });
    const key = "dry-then-live-1";

    const dryRun = await postJson(baseUrl, { text: "same", dryRun: true }, {
      headers: { "idempotency-key": key },
    });
    expect(dryRun.status).toBe(200);

    const live = await postJson(baseUrl, { text: "same", dryRun: false }, {
      headers: {
        authorization: `Bearer ${FULL_ENV.CONTROL_API_TOKEN}`,
        "idempotency-key": key,
      },
    });
    expect(live.status).toBe(200);
    expect(telegramFetchImpl).toHaveBeenCalledTimes(1);
  });

  it("allows loopback CORS with auth headers and denies arbitrary origins", async () => {
    const baseUrl = await startTestServer();

    const preflight = await fetch(`${baseUrl}/send`, {
      method: "OPTIONS",
      headers: { origin: "http://localhost:3000" },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect(preflight.headers.get("access-control-allow-headers")).toContain("authorization");
    expect(preflight.headers.get("access-control-allow-headers")).toContain("idempotency-key");

    const denied = await fetch(`${baseUrl}/status`, {
      headers: { origin: "https://evil.example" },
    });
    expect(denied.status).toBe(403);
    expect(denied.headers.get("access-control-allow-origin")).toBeNull();
    expect((await denied.json()).status).toBe("cors_origin_denied");
  });

  it("reads durable readiness asynchronously for status without exposing secrets", async () => {
    const controlFetchImpl = openGateFetch();
    const baseUrl = await startTestServer({ controlFetchImpl });
    const response = await fetch(`${baseUrl}/status`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ mode: "live-ready", envReady: true, liveSendReady: true });
    expect(body.gate).toMatchObject({
      state: "open",
      authoritative: true,
      fresh: true,
      ticketPrefixValid: true,
    });
    expect(controlFetchImpl).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(body)).not.toContain(FULL_ENV.TELEGRAM_BOT_TOKEN);
    expect(JSON.stringify(body)).not.toContain(FULL_ENV.CONTROL_API_TOKEN);
  });
});
