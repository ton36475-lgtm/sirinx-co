import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fetchGateStatus,
  formatGatesReply,
  formatGatesUnavailable,
  handleGatesCommand,
} from "./gate-status.mjs";

function fakeFetch(gates, { status = 200, authRequired = null } = {}) {
  return async (url, opts) => {
    if (authRequired) {
      const auth = opts?.headers?.Authorization;
      if (auth !== `Bearer ${authRequired}`) {
        return { ok: false, status: 401, json: async () => ({}) };
      }
    }
    if (status !== 200) {
      return { ok: false, status, json: async () => ({}) };
    }
    return { ok: true, status, json: async () => ({ gates }) };
  };
}

test("fetchGateStatus returns live gates on success", async () => {
  const gates = [{ name: "deploy", state: "hold", ticket: null }];
  const result = await fetchGateStatus({
    controlUrl: "http://x",
    fetchImpl: fakeFetch(gates),
  });
  assert.deepEqual(result, gates);
});

test("fetchGateStatus throws on non-OK response", async () => {
  await assert.rejects(
    () =>
      fetchGateStatus({ controlUrl: "http://x", fetchImpl: fakeFetch([], { status: 401 }) }),
    /401/
  );
});

test("fetchGateStatus sends bearer token when configured", async () => {
  const gates = [{ name: "deploy", state: "open", ticket: "GO-LIVE-001" }];
  const result = await fetchGateStatus({
    controlUrl: "http://x",
    token: "secret-token",
    fetchImpl: fakeFetch(gates, { authRequired: "secret-token" }),
  });
  assert.deepEqual(result, gates);
});

test("formatGatesReply shows lock icon for hold and unlock for open", () => {
  const reply = formatGatesReply([
    { name: "deploy", state: "hold", ticket: null },
    { name: "cloudflare_dns", state: "open", ticket: "GO-LIVE-DNS-1" },
  ]);
  assert.match(reply, /🔒 deploy: hold/);
  assert.match(reply, /🟢 cloudflare_dns: open \(ticket: GO-LIVE-DNS-1\)/);
});

test("formatGatesUnavailable never claims a gate state is open", () => {
  const reply = formatGatesUnavailable("connection refused");
  assert.match(reply, /hold until an/);
  // "opens one with a ticket" describes the human action, not a gate
  // state — must not read as "gate: open".
  assert.doesNotMatch(reply, /:\s*open\b/i);
});

test("handleGatesCommand falls back to fail-closed message on error", async () => {
  const reply = await handleGatesCommand({
    controlUrl: "http://x",
    fetchImpl: async () => {
      throw new Error("network unreachable");
    },
  });
  assert.match(reply, /Could not reach sirinx-control/);
  assert.match(reply, /network unreachable/);
});

test("handleGatesCommand reports live state end to end", async () => {
  const gates = [{ name: "telegram_send", state: "hold", ticket: null }];
  const reply = await handleGatesCommand({
    controlUrl: "http://x",
    fetchImpl: fakeFetch(gates),
  });
  assert.match(reply, /telegram_send: hold/);
});
