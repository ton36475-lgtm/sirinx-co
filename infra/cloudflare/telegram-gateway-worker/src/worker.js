/**
 * SIRINX Telegram Gateway — Cloudflare Worker front door for the Hermes
 * / 47 Ronin commander center's Telegram bot.
 *
 * Governance: `telegram_send` stays hold-by-default (see
 * GO_LIVE_GATE_CHECKLIST.md and services/telegram-command-bot). This
 * worker never calls Telegram's sendMessage API. It computes the reply
 * a command would get (same live, fail-closed gate query as
 * services/telegram-command-bot/src/gate-status.mjs) and queues it into
 * D1 instead of sending it, so an operator can review exactly what the
 * bot *would* say before any real send path is approved and built.
 *
 *   POST /telegram/webhook   Telegram update -> queued reply, never sent
 *   GET  /telegram/outbox    bearer-protected: list queued replies
 *   GET  /health             open
 *
 * Fail-closed posture (matches the rest of SIRINX): both authenticated
 * routes REFUSE when their secret is unconfigured rather than running
 * wide open. A missing `TELEGRAM_WEBHOOK_SECRET` means the worker cannot
 * prove a POST is really from Telegram, so it rejects it; a missing
 * `GATEWAY_API_TOKEN` means the outbox (chat ids + reply text) has no
 * protection, so it refuses to serve.
 */

const ALLOWED_COMMANDS = new Set(["/status", "/gates", "/sync-plan", "/stop"]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function unauthorized() {
  return json({ error: "missing or invalid bearer token" }, 401);
}

/** Extract the leading `/command` token from a Telegram message update.
 *  In group chats Telegram appends the bot's username (`/gates@MyBot`);
 *  strip that suffix so the command still matches the allowlist. */
function parseCommand(update) {
  const text = update?.message?.text || "";
  const [rawToken] = text.trim().split(/\s+/);
  if (!rawToken) return null;
  // `/gates@SirinxBot` -> `/gates`; a plain `/gates` is unaffected.
  const atIndex = rawToken.indexOf("@");
  return atIndex === -1 ? rawToken : rawToken.slice(0, atIndex);
}

async function ensureOutboxTable(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS telegram_outbox (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        chat_id TEXT NOT NULL,
        command TEXT NOT NULL,
        reply TEXT NOT NULL,
        sent INTEGER NOT NULL DEFAULT 0
      )`
    )
    .run();
}

/**
 * Live-query sirinx-control for gate state, same fail-closed contract as
 * gate-status.mjs: never claims "open" when the query itself failed.
 */
async function fetchGatesReply(env) {
  const controlUrl = env.CONTROL_URL || "http://127.0.0.1:8711";
  const headers = env.CONTROL_API_TOKEN
    ? { Authorization: `Bearer ${env.CONTROL_API_TOKEN}` }
    : {};
  try {
    const response = await fetch(`${controlUrl}/api/gates`, { headers });
    if (!response.ok) {
      throw new Error(`sirinx-control returned ${response.status}`);
    }
    const body = await response.json();
    const lines = body.gates.map((g) => {
      const icon = g.state === "open" ? "🟢" : "🔒";
      const ticket = g.ticket ? ` (ticket: ${g.ticket})` : "";
      return `${icon} ${g.name}: ${g.state}${ticket}`;
    });
    return ["SIRINX release gates (live):", ...lines].join("\n");
  } catch (err) {
    return [
      "⚠️ Could not reach sirinx-control for live gate state.",
      `Reason: ${err.message}`,
      "Falling back to the documented default: ALL gates hold until an",
      "operator opens one with a ticket. See GO_LIVE_GATE_CHECKLIST.md.",
    ].join("\n");
  }
}

async function replyFor(command, env) {
  switch (command) {
    case "/gates":
    case "/status":
      return fetchGatesReply(env);
    case "/sync-plan":
      return "sync-plan is not wired to a live action in this scaffold.";
    case "/stop":
      return "stop is not wired to a live action in this scaffold.";
    default:
      return `Unknown or unsupported command: ${command}`;
  }
}

async function handleWebhook(request, env) {
  // Fail closed: with no configured secret the worker cannot verify a
  // POST actually came from Telegram, so it refuses rather than trust
  // any caller who found the URL.
  const configuredSecret = env.TELEGRAM_WEBHOOK_SECRET;
  if (!configuredSecret) {
    return json(
      { error: "TELEGRAM_WEBHOOK_SECRET not configured; refusing unverified webhook" },
      503
    );
  }
  const provided = request.headers.get("x-telegram-bot-api-secret-token");
  if (provided !== configuredSecret) {
    return unauthorized();
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

  const command = parseCommand(update);
  const chatId = String(update?.message?.chat?.id ?? "unknown");

  if (!env.TELEGRAM_DB) {
    // Nothing durable to queue into — acknowledge Telegram so it does
    // not retry, but never fabricate a reply that was never recorded.
    return json({ ok: true, queued: false, reason: "TELEGRAM_DB not configured" });
  }

  await ensureOutboxTable(env.TELEGRAM_DB);

  if (!command || !ALLOWED_COMMANDS.has(command)) {
    return json({ ok: true, queued: false });
  }

  const reply = await replyFor(command, env);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await env.TELEGRAM_DB.prepare(
    `INSERT INTO telegram_outbox (id, created_at, chat_id, command, reply, sent)
     VALUES (?, ?, ?, ?, ?, 0)`
  )
    .bind(id, createdAt, chatId, command, reply)
    .run();

  // No call to Telegram's sendMessage API here — `telegram_send` stays
  // hold. The reply is queued, not sent; see GET /telegram/outbox.
  return json({ ok: true, queued: true, id });
}

async function handleOutbox(env) {
  if (!env.TELEGRAM_DB) {
    return json({ error: "TELEGRAM_DB not configured" }, 503);
  }
  const rows = await env.TELEGRAM_DB.prepare(
    "SELECT id, created_at, chat_id, command, reply, sent FROM telegram_outbox ORDER BY created_at DESC LIMIT 50"
  ).all();
  return json({ outbox: rows.results });
}

function hasValidBearer(request, env) {
  // Fail closed: no configured token means the outbox has no protection,
  // so deny rather than expose queued chat ids / reply text to anyone.
  if (!env.GATEWAY_API_TOKEN) return false;
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  return token === env.GATEWAY_API_TOKEN;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ status: "ok", service: "sirinx-telegram-gateway" });
    }

    if (url.pathname === "/telegram/webhook" && request.method === "POST") {
      return handleWebhook(request, env);
    }

    if (url.pathname === "/telegram/outbox" && request.method === "GET") {
      if (!hasValidBearer(request, env)) return unauthorized();
      return handleOutbox(env);
    }

    return json({ error: "not found" }, 404);
  },
};

export { ALLOWED_COMMANDS, handleOutbox, handleWebhook, parseCommand, replyFor };
