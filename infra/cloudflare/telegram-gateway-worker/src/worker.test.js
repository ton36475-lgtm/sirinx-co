import { afterEach, describe, expect, it, vi } from "vitest";
import { handleOutbox, handleWebhook, parseCommand, replyFor } from "./worker.js";

function createMockD1() {
  const rows = [];
  const statements = [];

  return {
    statements,
    rows,
    prepare(sql) {
      const statement = {
        sql,
        bindings: [],
        bind(...values) {
          this.bindings = values;
          return this;
        },
        async run() {
          statements.push({ sql: this.sql, bindings: this.bindings });
          if (/^INSERT INTO telegram_outbox/i.test(this.sql)) {
            const [id, created_at, chat_id, command, reply] = this.bindings;
            rows.push({ id, created_at, chat_id, command, reply, sent: 0 });
          }
          return { success: true };
        },
        async all() {
          statements.push({ sql: this.sql, bindings: this.bindings });
          return { results: rows.slice() };
        },
      };
      return statement;
    },
  };
}

function webhookRequest(body, headers = {}) {
  return new Request("https://gateway.example/telegram/webhook", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function readJson(response) {
  return JSON.parse(await response.text());
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseCommand", () => {
  it("extracts the leading command token", () => {
    expect(parseCommand({ message: { text: "/gates now please" } })).toBe("/gates");
  });

  it("returns null when there is no message text", () => {
    expect(parseCommand({})).toBeNull();
  });

  it("strips the @botname suffix Telegram adds in group chats", () => {
    // Regression: group-chat commands arrive as `/gates@SirinxBot` and
    // must still resolve to `/gates` to match the allowlist.
    expect(parseCommand({ message: { text: "/gates@SirinxBot" } })).toBe("/gates");
    expect(parseCommand({ message: { text: "/status@SirinxBot extra args" } })).toBe("/status");
  });
});

describe("handleWebhook group-chat command", () => {
  it("queues a reply for an @botname-suffixed command", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ gates: [{ name: "deploy", state: "hold", ticket: null }] }),
      }))
    );
    const db = createMockD1();
    const request = webhookRequest({ message: { text: "/gates@SirinxBot", chat: { id: 7 } } });
    const response = await handleWebhook(request, { TELEGRAM_DB: db, CONTROL_URL: "http://x" });

    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({ ok: true, queued: true });
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0].command).toBe("/gates");
  });
});

describe("replyFor", () => {
  it("renders live gate state on a successful query", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ gates: [{ name: "deploy", state: "hold", ticket: null }] }),
      }))
    );
    const reply = await replyFor("/gates", { CONTROL_URL: "http://x" });
    expect(reply).toMatch(/🔒 deploy: hold/);
  });

  it("fails closed (never claims open) when sirinx-control is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("connection refused");
      })
    );
    const reply = await replyFor("/status", { CONTROL_URL: "http://x" });
    expect(reply).toMatch(/Could not reach sirinx-control/);
    expect(reply).not.toMatch(/:\s*open\b/i);
  });
});

describe("handleWebhook", () => {
  it("rejects a request with the wrong Telegram secret token", async () => {
    const request = webhookRequest(
      { message: { text: "/gates", chat: { id: 1 } } },
      { "x-telegram-bot-api-secret-token": "wrong" }
    );
    const response = await handleWebhook(request, {
      TELEGRAM_WEBHOOK_SECRET: "correct-secret",
      TELEGRAM_DB: createMockD1(),
    });
    expect(response.status).toBe(401);
  });

  it("queues a reply for an allowed command without ever sending it", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ gates: [{ name: "telegram_send", state: "hold", ticket: null }] }),
      }))
    );
    const db = createMockD1();
    const request = webhookRequest({ message: { text: "/gates", chat: { id: 42 } } });
    const response = await handleWebhook(request, { TELEGRAM_DB: db, CONTROL_URL: "http://x" });

    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body).toMatchObject({ ok: true, queued: true });
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]).toMatchObject({ chat_id: "42", command: "/gates", sent: 0 });
    expect(db.rows[0].reply).toMatch(/telegram_send: hold/);
  });

  it("acknowledges but does not queue an unsupported command", async () => {
    const db = createMockD1();
    const request = webhookRequest({ message: { text: "/rm -rf", chat: { id: 1 } } });
    const response = await handleWebhook(request, { TELEGRAM_DB: db });

    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({ ok: true, queued: false });
    expect(db.rows).toHaveLength(0);
  });

  it("acknowledges without fabricating a reply when TELEGRAM_DB is missing", async () => {
    const request = webhookRequest({ message: { text: "/gates", chat: { id: 1 } } });
    const response = await handleWebhook(request, {});
    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({ ok: true, queued: false });
  });
});

describe("handleOutbox", () => {
  it("lists queued replies", async () => {
    const db = createMockD1();
    db.rows.push({
      id: "1",
      created_at: "2026-07-20T00:00:00.000Z",
      chat_id: "42",
      command: "/gates",
      reply: "SIRINX release gates (live):\n🔒 deploy: hold",
      sent: 0,
    });
    const response = await handleOutbox({ TELEGRAM_DB: db });
    const body = await readJson(response);
    expect(body.outbox).toHaveLength(1);
    expect(body.outbox[0].command).toBe("/gates");
  });

  it("returns 503 when TELEGRAM_DB is not configured", async () => {
    const response = await handleOutbox({});
    expect(response.status).toBe(503);
  });
});
