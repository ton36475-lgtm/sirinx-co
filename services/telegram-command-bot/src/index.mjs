import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";
import { authorizeControlRequest } from "./control-auth.mjs";
import {
  BLOCKED_ACTIONS,
  resolveTelegramGatewayConfig,
  resolveTelegramGatewayReadiness,
} from "./config.mjs";
import { sendTelegramMessage } from "./sender.mjs";

export const DEFAULT_TELEGRAM_BOT_HOST = "127.0.0.1";
export const DEFAULT_TELEGRAM_BOT_PORT = 8791;
export const DEFAULT_MAX_REQUEST_BODY_BYTES = 16 * 1024;
export const DEFAULT_IDEMPOTENCY_MAX_ENTRIES = 128;
export const DEFAULT_IDEMPOTENCY_TTL_MS = 10 * 60 * 1000;

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const DESTINATION_FIELDS = new Set([
  "chatId",
  "chat_id",
  "destination",
  "destinationId",
  "to",
]);
const SEND_FIELDS = new Set(["text", "dryRun", "parseMode"]);

class HttpRequestError extends Error {
  constructor(statusCode, code) {
    super(code);
    this.name = "HttpRequestError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function isObjectRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveListenOptions(env, options = {}) {
  const host = String(options.host || env.TELEGRAM_BOT_HOST || DEFAULT_TELEGRAM_BOT_HOST);
  const requestedPort = Number(options.port ?? env.TELEGRAM_BOT_PORT ?? DEFAULT_TELEGRAM_BOT_PORT);
  const port = Number.isInteger(requestedPort) && requestedPort >= 0 && requestedPort <= 65_535
    ? requestedPort
    : DEFAULT_TELEGRAM_BOT_PORT;
  return { host, port };
}

function configuredOrigins(env, options = {}) {
  const configured = options.allowedOrigins ?? env.TELEGRAM_ALLOWED_ORIGINS ?? "";
  const values = Array.isArray(configured) ? configured : String(configured).split(",");
  return new Set(values.map((value) => String(value).trim()).filter(Boolean));
}

function isLoopbackOrigin(origin) {
  try {
    const parsed = new URL(origin);
    return ["http:", "https:"].includes(parsed.protocol)
      && ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)
      && parsed.origin === origin;
  } catch {
    return false;
  }
}

function resolveCorsOrigin(request, env, options = {}) {
  const origin = String(request.headers.origin || "").trim();
  if (!origin) return { allowed: true, origin: null };
  const allowed = isLoopbackOrigin(origin) || configuredOrigins(env, options).has(origin);
  return { allowed, origin: allowed ? origin : null };
}

function responseHeaders(corsOrigin, extraHeaders = {}) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "authorization, content-type, idempotency-key",
    "access-control-expose-headers": "idempotency-replayed",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extraHeaders,
  };
  if (corsOrigin) {
    headers["access-control-allow-origin"] = corsOrigin;
    headers.vary = "Origin";
  }
  return headers;
}

function sendJson(response, statusCode, body, corsOrigin = null, extraHeaders = {}) {
  response.writeHead(statusCode, responseHeaders(corsOrigin, extraHeaders));
  if (statusCode === 204) {
    response.end();
    return;
  }
  response.end(JSON.stringify(body));
}

async function readJson(request, maxBodyBytes) {
  const contentType = String(request.headers["content-type"] || "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    request.resume();
    throw new HttpRequestError(415, "content_type_must_be_application_json");
  }

  const contentLength = Number(request.headers["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    request.resume();
    throw new HttpRequestError(413, "request_body_too_large");
  }

  const chunks = [];
  let size = 0;
  let exceeded = false;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      exceeded = true;
      chunks.length = 0;
    } else if (!exceeded) {
      chunks.push(chunk);
    }
  }

  if (exceeded) throw new HttpRequestError(413, "request_body_too_large");

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpRequestError(400, "invalid_json");
  }
}

function validateObjectBody(body) {
  if (!isObjectRecord(body)) {
    throw new HttpRequestError(422, "request_body_must_be_object");
  }
}

function validateSendBody(body) {
  validateObjectBody(body);

  for (const field of Object.keys(body)) {
    if (DESTINATION_FIELDS.has(field)) {
      throw new HttpRequestError(422, "telegram_destination_override_blocked");
    }
    if (!SEND_FIELDS.has(field)) {
      throw new HttpRequestError(422, "unsupported_send_field");
    }
  }

  if (body.dryRun !== undefined && typeof body.dryRun !== "boolean") {
    throw new HttpRequestError(422, "dry_run_must_be_boolean");
  }
  if (typeof body.text !== "string" || !body.text.trim()) {
    throw new HttpRequestError(422, "missing_message_text");
  }
  if (body.parseMode !== undefined
      && body.parseMode !== null
      && !["HTML", "MarkdownV2"].includes(body.parseMode)) {
    throw new HttpRequestError(422, "parse_mode_invalid");
  }

  return {
    text: body.text.trim(),
    dryRun: body.dryRun !== false,
    parseMode: body.parseMode || null,
  };
}

function idempotencyFingerprint(body, env) {
  return createHash("sha256")
    .update(JSON.stringify({
      text: body.text,
      dryRun: body.dryRun,
      parseModePresent: Object.hasOwn(body, "parseMode"),
      parseMode: body.parseMode ?? null,
      destination: String(env.TELEGRAM_CHAT_ID || ""),
    }))
    .digest("hex");
}

export function createInMemoryIdempotencyStore(options = {}) {
  const maxEntries = parsePositiveInteger(options.maxEntries, DEFAULT_IDEMPOTENCY_MAX_ENTRIES);
  const ttlMs = parsePositiveInteger(options.ttlMs, DEFAULT_IDEMPOTENCY_TTL_MS);
  const now = typeof options.now === "function" ? options.now : Date.now;
  const entries = new Map();

  function removeExpired(currentTime) {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= currentTime && entry.settled) entries.delete(key);
    }
  }

  function makeRoom(currentTime) {
    removeExpired(currentTime);
    if (entries.size < maxEntries) return true;
    for (const [key, entry] of entries) {
      if (entry.settled) {
        entries.delete(key);
        return true;
      }
    }
    return false;
  }

  return {
    async execute(key, fingerprint, producer) {
      const currentTime = Number(now());
      removeExpired(currentTime);
      const existing = entries.get(key);
      if (existing) {
        if (existing.fingerprint !== fingerprint) return { state: "conflict", receipt: null };
        return { state: "replay", receipt: await existing.promise };
      }

      if (!makeRoom(currentTime)) return { state: "full", receipt: null };

      const entry = {
        fingerprint,
        expiresAt: currentTime + ttlMs,
        settled: false,
        promise: null,
      };
      entry.promise = Promise.resolve().then(producer);
      entries.set(key, entry);

      try {
        const receipt = await entry.promise;
        entry.settled = true;
        entry.expiresAt = Number(now()) + ttlMs;
        return { state: "new", receipt };
      } catch (error) {
        entries.delete(key);
        throw error;
      }
    },
    get size() {
      removeExpired(Number(now()));
      return entries.size;
    },
  };
}

function handleWebhook(body, config, env) {
  validateObjectBody(body);
  const message = body.message || body.edited_message || body.channel_post || {};
  const text = String(message.text || message.caption || "").trim();
  const chat = message.chat || {};
  const from = message.from || {};
  const ownerIds = config.credentials.ownerCount > 0
    ? String(env.TELEGRAM_OWNER_IDS || "").split(",").map((id) => id.trim())
    : [];
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
      allowedCommands: config.allowedCommands,
    },
    gates: {
      telegram_send: config.gate.state,
      envReady: config.envReady,
      liveSendReady: config.liveSendReady,
    },
    guardrail: "Webhook inspection is dry-run only; no provider or command execution occurred.",
  };
}

function receiptStatus(result, dryRun) {
  if (dryRun) return 200;
  if (result.sent) return 200;
  return result.providerCalled ? 502 : 409;
}

function sanitizedError(error) {
  if (error instanceof HttpRequestError) {
    return { statusCode: error.statusCode, code: error.code };
  }
  return { statusCode: 500, code: "internal_error" };
}

export function createTelegramRequestHandler(options = {}) {
  const env = options.env || process.env;
  const maxBodyBytes = parsePositiveInteger(
    options.maxBodyBytes,
    DEFAULT_MAX_REQUEST_BODY_BYTES,
  );
  const idempotencyStore = options.idempotencyStore || createInMemoryIdempotencyStore({
    maxEntries: options.idempotencyMaxEntries,
    ttlMs: options.idempotencyTtlMs,
    now: options.nowMs,
  });
  const sendMessage = options.sendTelegramMessageImpl || sendTelegramMessage;
  const resolveReadiness = options.resolveTelegramGatewayReadinessImpl
    || resolveTelegramGatewayReadiness;
  const { host, port } = resolveListenOptions(env, options);

  async function dispatch(request, response) {
    const cors = resolveCorsOrigin(request, env, options);
    if (!cors.allowed) {
      sendJson(response, 403, { ok: false, status: "cors_origin_denied" });
      return;
    }

    const url = new URL(request.url || "/", `http://${host}:${port}`);

    if (request.method === "OPTIONS") {
      sendJson(response, 204, {}, cors.origin);
      return;
    }

    if (request.method === "GET" && url.pathname === "/health") {
      const readiness = await resolveReadiness(env, {
        controlFetchImpl: options.controlFetchImpl,
        controlBaseUrl: options.controlBaseUrl,
        controlTimeoutMs: options.controlTimeoutMs,
        gateMaxAgeMs: options.gateMaxAgeMs,
        now: options.now,
        gate: options.gate,
      });
      sendJson(response, 200, {
        status: "ok",
        service: "telegram-command-bot",
        mode: readiness.mode,
        envReady: readiness.envReady,
        liveSendReady: readiness.liveSendReady,
        externalWrites: false,
      }, cors.origin);
      return;
    }

    if (request.method === "GET" && (url.pathname === "/status" || url.pathname === "/")) {
      const readiness = await resolveReadiness(env, {
        controlFetchImpl: options.controlFetchImpl,
        controlBaseUrl: options.controlBaseUrl,
        controlTimeoutMs: options.controlTimeoutMs,
        gateMaxAgeMs: options.gateMaxAgeMs,
        now: options.now,
        gate: options.gate,
      });
      sendJson(response, 200, readiness, cors.origin);
      return;
    }

    if (request.method === "POST" && url.pathname === "/webhook") {
      const body = await readJson(request, maxBodyBytes);
      const readiness = await resolveReadiness(env, {
        controlFetchImpl: options.controlFetchImpl,
        controlBaseUrl: options.controlBaseUrl,
        controlTimeoutMs: options.controlTimeoutMs,
        gateMaxAgeMs: options.gateMaxAgeMs,
        now: options.now,
        gate: options.gate,
      });
      sendJson(response, 200, handleWebhook(body, readiness, env), cors.origin);
      return;
    }

    if (request.method === "POST" && url.pathname === "/send") {
      const body = await readJson(request, maxBodyBytes);
      const sendRequest = validateSendBody(body);

      if (!sendRequest.dryRun) {
        const authorization = authorizeControlRequest(request.headers, env);
        if (!authorization.configured) {
          sendJson(response, 503, {
            ok: false,
            status: "control_auth_unavailable",
            error: "control_api_token_missing",
            sent: false,
            providerCalled: false,
          }, cors.origin);
          return;
        }
        if (!authorization.authorized) {
          sendJson(response, 401, {
            ok: false,
            status: "unauthorized_live_send",
            error: "bearer_token_required",
            sent: false,
            providerCalled: false,
          }, cors.origin, { "www-authenticate": "Bearer" });
          return;
        }

        const idempotencyKey = String(request.headers["idempotency-key"] || "").trim();
        if (!idempotencyKey) {
          sendJson(response, 400, {
            ok: false,
            status: "idempotency_key_required",
            sent: false,
            providerCalled: false,
          }, cors.origin);
          return;
        }
        if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
          sendJson(response, 400, {
            ok: false,
            status: "idempotency_key_invalid",
            sent: false,
            providerCalled: false,
          }, cors.origin);
          return;
        }

        const fingerprint = idempotencyFingerprint(body, env);
        const execution = await idempotencyStore.execute(idempotencyKey, fingerprint, async () => {
          const result = await sendMessage(String(env.TELEGRAM_CHAT_ID || ""), sendRequest.text, {
            env,
            dryRun: false,
            parseMode: sendRequest.parseMode,
            controlFetchImpl: options.controlFetchImpl,
            telegramFetchImpl: options.telegramFetchImpl,
            controlBaseUrl: options.controlBaseUrl,
            controlTimeoutMs: options.controlTimeoutMs,
            gateMaxAgeMs: options.gateMaxAgeMs,
            now: options.now,
            gate: options.gate,
            timeoutMs: options.telegramTimeoutMs,
          });
          return { statusCode: receiptStatus(result, false), body: result };
        });

        if (execution.state === "conflict") {
          sendJson(response, 409, {
            ok: false,
            status: "idempotency_key_conflict",
            sent: false,
            providerCalled: false,
          }, cors.origin);
          return;
        }
        if (execution.state === "full") {
          sendJson(response, 503, {
            ok: false,
            status: "idempotency_store_busy",
            sent: false,
            providerCalled: false,
          }, cors.origin);
          return;
        }

        sendJson(
          response,
          execution.receipt.statusCode,
          execution.receipt.body,
          cors.origin,
          execution.state === "replay" ? { "idempotency-replayed": "true" } : {},
        );
        return;
      }

      const result = await sendMessage(String(env.TELEGRAM_CHAT_ID || ""), sendRequest.text, {
        env,
        dryRun: true,
        parseMode: sendRequest.parseMode,
        telegramFetchImpl: options.telegramFetchImpl,
      });
      sendJson(response, receiptStatus(result, true), result, cors.origin);
      return;
    }

    sendJson(response, 404, { ok: false, status: "not_found" }, cors.origin);
  }

  return (request, response) => {
    dispatch(request, response).catch((error) => {
      if (response.headersSent || response.writableEnded) {
        response.end();
        return;
      }
      const safe = sanitizedError(error);
      const cors = resolveCorsOrigin(request, env, options);
      sendJson(response, safe.statusCode, {
        ok: false,
        status: safe.code,
        sent: false,
        providerCalled: false,
        commandExecuted: false,
      }, cors.allowed ? cors.origin : null);
    });
  };
}

export function createTelegramCommandServer(options = {}) {
  return createServer(createTelegramRequestHandler(options));
}

export async function startTelegramCommandServer(options = {}) {
  const env = options.env || process.env;
  const { host, port } = resolveListenOptions(env, options);
  const server = createTelegramCommandServer({ ...options, env, host, port });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  const activePort = typeof address === "object" && address ? address.port : port;
  return { server, host, port: activePort };
}

export async function runTelegramCommandBotCli(args = process.argv.slice(2), options = {}) {
  const env = options.env || process.env;
  const flags = new Set(args);

  if (flags.has("--config")) {
    console.log(JSON.stringify(resolveTelegramGatewayConfig(env), null, 2));
    return { mode: "config", server: null };
  }

  if (flags.has("--dry-run")) {
    const config = resolveTelegramGatewayConfig(env);
    const status = {
      service: "telegram-command-bot",
      mode: "dry-run",
      tokenConfigured: config.credentials.botTokenConfigured,
      chatIdConfigured: config.credentials.chatIdConfigured,
      ownerIdsConfigured: config.credentials.ownerIdsConfigured,
      allowedCommands: config.allowedCommands,
      blockedActions: [...BLOCKED_ACTIONS],
      serverStarted: false,
      guardrail: "Dry-run CLI performs no provider call and starts no HTTP listener.",
    };
    console.log(JSON.stringify(status, null, 2));
    return { mode: "dry-run", server: null };
  }

  const started = await startTelegramCommandServer({ ...options, env });
  console.log(JSON.stringify({
    service: "telegram-command-bot",
    status: "listening",
    host: started.host,
    port: started.port,
    endpoints: {
      health: `http://${started.host}:${started.port}/health`,
      status: `http://${started.host}:${started.port}/status`,
      webhook: `http://${started.host}:${started.port}/webhook`,
      send: `http://${started.host}:${started.port}/send`,
    },
    guardrail: "Live sends require Bearer auth, an idempotency key, env readiness, and a fresh durable OPS-TG gate.",
  }, null, 2));
  return { mode: "server", ...started };
}

function isMainModule() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  await runTelegramCommandBotCli();
}
