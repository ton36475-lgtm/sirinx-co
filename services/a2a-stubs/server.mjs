#!/usr/bin/env node
/**
 * A2A stub agents — minimal zero-dep Node ESM server (reconstructed 2026-10-26).
 *
 * The previous implementation (`~/project-hermes/a2a_server/agent_stubs.py`) was
 * deleted together with the rest of `project-hermes/`; its launchd job was disabled
 * on 2026-10-22, which left ports 9001–9004 closed and made a discovering peer see
 * an agent card with no agents behind it.
 *
 * This is a replacement, not a restoration: the original source was not recoverable,
 * so every response here says `stub: true`. The stubs exist so the mesh has
 * *something measurable* on 9001–9004 — they do no work, call no provider, and hold
 * no credentials.
 *
 * Routes (one HTTP server per port):
 *   GET  /health                          → liveness + stub flag
 *   GET  /                                → card
 *   GET  /.well-known/agent-card.json     → A2A agent card
 *   GET  /agent-card                      → same card
 *   POST /rpc                             → JSON-RPC message/send | tasks/send
 *   POST /                                → same as /rpc
 *
 * Env:
 *   A2A_STUB_PORTS   comma list, default "9001,9002,9003,9004"  (0 = ephemeral)
 *   A2A_STUB_HOST    default "127.0.0.1"
 *
 * --all is accepted for compatibility with the old plist and is the default.
 */
import { createServer } from "node:http";

const HOST = process.env.A2A_STUB_HOST || "127.0.0.1";
const RAW_PORTS = process.env.A2A_STUB_PORTS || "9001,9002,9003,9004";
const VERSION = "0.1.0";
const STARTED_AT = Date.now();

const ROLE_HINTS = [
  { slug: "stub-research", description: "Stub research agent (reconstructed placeholder)" },
  { slug: "stub-build", description: "Stub build agent (reconstructed placeholder)" },
  { slug: "stub-review", description: "Stub review agent (reconstructed placeholder)" },
  { slug: "stub-qa", description: "Stub QA agent (reconstructed placeholder)" }
];

function cardFor(slug, description, url) {
  return {
    name: slug,
    description,
    url,
    version: VERSION,
    provider: { organization: "SIRINX OS", url: "http://127.0.0.1:9000/" },
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    skills: [],
    stub: true,
    reconstructed: true
  };
}

function json(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function makeServer(slug, description) {
  const state = { port: 0 };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${HOST}:${state.port}`);
    const card = cardFor(slug, description, `http://${HOST}:${state.port}`);

    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, {
        ok: true,
        service: "a2a-stub",
        agent: slug,
        port: state.port,
        version: VERSION,
        uptime_s: Math.round((Date.now() - STARTED_AT) / 1000),
        stub: true
      });
    }

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/agent-card" || url.pathname === "/.well-known/agent-card.json")) {
      return json(res, 200, card);
    }

    if (req.method === "POST" && (url.pathname === "/" || url.pathname === "/rpc")) {
      const request = await readBody(req);
      const method = String(request.method || "");
      const message = request.params?.message;
      const text = typeof message === "string"
        ? message
        : String(message?.parts?.[0]?.text ?? message?.text ?? "");

      if (method !== "message/send" && method !== "tasks/send" && method !== "SendMessage") {
        return json(res, 200, {
          jsonrpc: "2.0",
          id: request.id ?? null,
          error: { code: -32601, message: `method not supported by stub: ${method || "(none)"}` }
        });
      }

      return json(res, 200, {
        jsonrpc: "2.0",
        id: request.id ?? null,
        result: {
          kind: "task",
          id: `stub-${Date.now()}`,
          contextId: request.params?.contextId || `stub-ctx-${slug}`,
          status: { state: "completed", timestamp: new Date().toISOString() },
          artifacts: [{
            artifactId: "stub-echo",
            name: "stub-response",
            parts: [{
              kind: "text",
              text: `stub agent ${slug} received ${text.length} char(s); no work performed`
            }]
          }],
          metadata: { stub: true, agent: slug, provider_call: false, live_send: false }
        }
      });
    }

    return json(res, 404, { ok: false, error: "not_found", path: url.pathname, stub: true });
  });

  return { server, state };
}

const ports = RAW_PORTS.split(",").map((p) => parseInt(p.trim(), 10)).filter((p) => Number.isInteger(p) && p >= 0);
if (ports.length === 0) {
  console.error("a2a-stubs: A2A_STUB_PORTS resolved to no usable port");
  process.exit(2);
}

const started = [];

for (const [index, port] of ports.entries()) {
  const hint = ROLE_HINTS[index % ROLE_HINTS.length];
  const slug = ports.length <= ROLE_HINTS.length ? hint.slug : `${hint.slug}-${index + 1}`;
  const { server, state } = makeServer(slug, hint.description);

  server.on("error", (error) => {
    console.error(`a2a-stubs: ${slug} failed to listen on ${HOST}:${port} — ${error.code || error.message}`);
    if (started.length === 0) process.exit(1);
  });

  server.listen(port, HOST, () => {
    state.port = server.address().port;
    started.push(state.port);
    console.log(`a2a-stubs: ${slug} listening on http://${HOST}:${state.port} (stub)`);
    if (started.length === ports.length) {
      console.log(`a2a-stubs: ${started.length} agent(s) ready on ${started.join(",")}`);
    }
  });
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`a2a-stubs: ${signal}, shutting down`);
    process.exit(0);
  });
}
