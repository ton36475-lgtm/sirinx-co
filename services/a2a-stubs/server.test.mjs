import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = join(here, "server.mjs");

function startStubs(ports) {
  const child = spawn(process.execPath, [serverPath, "--all"], {
    env: { ...process.env, A2A_STUB_PORTS: ports, A2A_STUB_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const ready = new Promise((resolve, reject) => {
    let out = "";
    const timer = setTimeout(() => reject(new Error(`stubs did not start: ${out}`)), 8000);
    child.stdout.on("data", (chunk) => {
      out += chunk;
      const found = [...out.matchAll(/listening on http:\/\/127\.0\.0\.1:(\d+)/g)].map((m) => Number(m[1]));
      if (found.length === ports.split(",").length) {
        clearTimeout(timer);
        resolve(found);
      }
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`stubs exited early (${code})`));
    });
  });

  return { child, ready };
}

test("serves a stub agent card and health on every port", async () => {
  const { child, ready } = startStubs("0,0");
  try {
    const ports = await ready;
    assert.equal(ports.length, 2);

    const names = [];
    for (const port of ports) {
      const health = await fetch(`http://127.0.0.1:${port}/health`).then((r) => r.json());
      assert.equal(health.ok, true);
      assert.equal(health.service, "a2a-stub");
      assert.equal(health.stub, true);
      assert.equal(health.port, port);

      const card = await fetch(`http://127.0.0.1:${port}/.well-known/agent-card.json`).then((r) => r.json());
      assert.equal(card.stub, true);
      assert.equal(card.reconstructed, true);
      assert.equal(card.url, `http://127.0.0.1:${port}`);
      names.push(card.name);
    }
    assert.equal(new Set(names).size, 2, "each stub needs its own identity");
  } finally {
    child.kill("SIGTERM");
  }
});

test("answers message/send with a completed stub task that claims no work", async () => {
  const { child, ready } = startStubs("0");
  try {
    const [port] = await ready;
    const body = {
      jsonrpc: "2.0",
      id: 7,
      method: "message/send",
      params: { message: "hello mesh", contextId: "ctx-1" }
    };
    const response = await fetch(`http://127.0.0.1:${port}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then((r) => r.json());

    assert.equal(response.id, 7);
    assert.equal(response.result.kind, "task");
    assert.equal(response.result.status.state, "completed");
    assert.equal(response.result.contextId, "ctx-1");
    assert.equal(response.result.metadata.stub, true);
    assert.equal(response.result.metadata.provider_call, false);
    assert.match(response.result.artifacts[0].parts[0].text, /no work performed/);
  } finally {
    child.kill("SIGTERM");
  }
});

test("rejects unknown JSON-RPC methods instead of pretending to run them", async () => {
  const { child, ready } = startStubs("0");
  try {
    const [port] = await ready;
    const response = await fetch(`http://127.0.0.1:${port}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tasks/cancel" })
    }).then((r) => r.json());

    assert.equal(response.error.code, -32601);
    assert.equal(response.result, undefined);
  } finally {
    child.kill("SIGTERM");
  }
});
