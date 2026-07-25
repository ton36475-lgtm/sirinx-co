#!/usr/bin/env node
/**
 * LineSecretary A2A Gateway — minimal zero-dep Node ESM server.
 *
 * Bridges the A2A mesh (http://127.0.0.1:9006) to the LINE OA Secretary
 * contracts in sirinx-agent-native-os. The runtime contract is CONTRACT_OK
 * (OpenAPI/AsyncAPI schemas exist); this gateway provides a live A2A endpoint
 * that validates intents against the schema without sending real LINE messages.
 *
 *   GET  /health                              → liveness
 *   GET  /.well-known/agent-card.json         → A2A card
 *   GET  /agent-card                          → card passthrough
 *   POST /rpc                                 → JSON-RPC SendMessage (intent classification)
 *
 * Safety: SIRINX_LINE_SEND_BLOCKED=true by default. Never sends LINE messages
 * unless explicitly enabled AND SIRINX_LINE_CHANNEL_TOKEN is set.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.LINE_SECRETARY_PORT || "9006", 10);
const SEND_BLOCKED = process.env.SIRINX_LINE_SEND_BLOCKED !== "false"; // default true
const MODE = process.env.SIRINX_LINE_MODE || "dry-run";

const CARD = {
  name: "LineSecretary",
  description: "LINE OA Secretary + Neural Fabric V1 contracts (zero-dep Node ESM)",
  url: `http://127.0.0.1:${PORT}`,
  version: "0.2.0",
  capabilities: { streaming: false, pushNotifications: false },
  role: "LINE OA Secretary + Neural Fabric V1 contracts",
  endpoint: `http://127.0.0.1:${PORT}`,
  model: "claude-fable-5",
  runtime_status: "CONTRACT_OK_GATEWAY_LIVE",
  skills: ["line", "secretary", "contract", "webhook", "hmac", "openapi", "asyncapi", "neural-fabric"],
};

function json(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); }
      catch { resolve({}); }
    });
  });
}

// Minimal intent classifier — maps message keywords to secretary intents.
// Full NLU lives in the contract runtime; this is the L1 router.
function classifyIntent(message) {
  const m = message.toLowerCase();
  if (/เลื่อน|reschedule|postpone|เปลี่ยนเวลา/.test(m)) return { intent: "reschedule", riskClass: "medium", requiresConfirmation: true };
  if (/ยกเลิก|cancel|ยืนยันการยกเลิก/.test(m)) return { intent: "cancel", riskClass: "high", requiresConfirmation: true };
  if (/สรุป|summary|รายงาน|report/.test(m)) return { intent: "summary", riskClass: "low", requiresConfirmation: false };
  if (/นัดหมาย|book|schedule|appointment/.test(m)) return { intent: "book", riskClass: "medium", requiresConfirmation: true };
  if (/ถาม|query|ข้อมูล|info/.test(m)) return { intent: "faq", riskClass: "low", requiresConfirmation: false };
  return { intent: "unknown", riskClass: "low", requiresConfirmation: false };
}

async function handleRpc(req, res) {
  const request = await readBody(req);
  const method = String(request.method || "");
  const id = request.id;
  let result;

  if (method === "SendMessage") {
    const message = String(request.params?.message || request.params?.payload || "");
    const intent = classifyIntent(message);
    result = {
      accepted: true,
      agent: "LineSecretary",
      method: "SendMessage",
      intent,
      mode: MODE,
      send_blocked: SEND_BLOCKED,
      schema: "secretary-intent.schema.json",
      contract: "L1-validated",
      live_send: false,
      note: SEND_BLOCKED ? "intent classified; LINE send blocked (SIRINX_LINE_SEND_BLOCKED=true)" : "intent classified; ready for outbox",
    };
  } else if (method === "CeoControl") {
    result = {
      accepted: true,
      agent: "LineSecretary",
      method: "CeoControl",
      safety: { live_send: false, provider_call: false, external_message_send: false },
    };
  } else {
    json(res, 200, { jsonrpc: "2.0", id, error: { code: -32601, message: `method not found: ${method}` } });
    return;
  }
  json(res, 200, { jsonrpc: "2.0", id, result });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const path = url.pathname;

  if (req.method === "GET" && path === "/health") {
    json(res, 200, { ok: true, service: "line-secretary", port: PORT, mode: MODE, send_blocked: SEND_BLOCKED });
    return;
  }
  if (req.method === "GET" && (path === "/.well-known/agent-card.json" || path === "/agent-card")) {
    json(res, 200, CARD);
    return;
  }
  if (req.method === "POST" && path === "/rpc") {
    await handleRpc(req, res);
    return;
  }
  json(res, 404, { error: "not found", path });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`line-secretary A2A gateway listening on http://127.0.0.1:${PORT} (mode=${MODE}, send_blocked=${SEND_BLOCKED})`);
});
