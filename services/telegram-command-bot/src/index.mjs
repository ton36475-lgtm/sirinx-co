import { createServer } from "node:http";

const TELEGRAM_BOT_HOST = process.env.TELEGRAM_BOT_HOST || "127.0.0.1";
const TELEGRAM_BOT_PORT = Number(process.env.TELEGRAM_BOT_PORT || 8788);

const allowedCommands = ["/status", "/gates", "/sync-plan", "/stop"];
const blockedActions = [
  "deploy",
  "push",
  "cloudflare-write",
  "production-db-write",
  "customer-send",
  "paid-api",
  "direct-shell",
];

function sendJson(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body, null, 2));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid_json"));
      }
    });
    request.on("error", reject);
  });
}

function handleWebhook(body) {
  const message = body.message || body.edited_message || body.channel_post || {};
  const text = String(message.text || message.caption || "").trim();
  const chat = message.chat || {};
  const from = message.from || {};
  const ownerIds = (process.env.TELEGRAM_OWNER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean);
  const isOwner = from.id ? ownerIds.includes(String(from.id)) : false;

  return {
    ok: true,
    dryRun: true,
    telegramUpdateProcessed: false,
    messageSent: false,
    providerCalled: false,
    commandExecuted: false,
    webhook: {
      updateId: body.update_id || null,
      chatId: chat.id || null,
      chatType: chat.type || null,
      userId: from.id || null,
      isOwner,
      text,
      allowedCommands,
    },
    guardrail:
      "Telegram webhook received in dry-run mode. No message sent, no provider called, no command executed.",
  };
}

async function handleRequest(request, response) {
  const url = new URL(request.url || "/", `http://${TELEGRAM_BOT_HOST}:${TELEGRAM_BOT_PORT}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && (url.pathname === "/health" || url.pathname === "/")) {
    sendJson(response, 200, {
      status: "ok",
      service: "telegram-command-bot",
      mode: "dry-run-http-server",
      tokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      ownerIdsConfigured: Boolean(process.env.TELEGRAM_OWNER_IDS),
      allowedCommands,
      blockedActions,
      guardrail:
        "Live Telegram polling/sending is disabled in this scaffold.",
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/webhook") {
    try {
      const body = await readJson(request);
      sendJson(response, 200, handleWebhook(body));
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        status: "invalid_webhook_payload",
        error: error.message,
        messageSent: false,
        providerCalled: false,
        commandExecuted: false,
      });
    }
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

const server = createServer(handleRequest);
server.listen(TELEGRAM_BOT_PORT, TELEGRAM_BOT_HOST, () => {
  console.log(JSON.stringify({
    service: "telegram-command-bot",
    status: "dry-run-http-server",
    host: TELEGRAM_BOT_HOST,
    port: TELEGRAM_BOT_PORT,
    mode: "dry-run",
    endpoints: {
      health: `http://${TELEGRAM_BOT_HOST}:${TELEGRAM_BOT_PORT}/health`,
      webhook: `http://${TELEGRAM_BOT_HOST}:${TELEGRAM_BOT_PORT}/webhook`,
    },
  }, null, 2));
});
