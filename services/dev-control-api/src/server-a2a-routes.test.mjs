import { spawn } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const livePort = 21300 + Math.floor(Math.random() * 300);
const noTokenPort = livePort + 400;
const liveBaseUrl = `http://127.0.0.1:${livePort}`;
const noTokenBaseUrl = `http://127.0.0.1:${noTokenPort}`;
const controlToken = "test-control-token";
const processes = [];

function spawnServer(port, token) {
  const child = spawn("node", ["services/dev-control-api/server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DEV_CONTROL_API_PORT: String(port),
      DEV_CONTROL_API_HOST: "127.0.0.1",
      CONTROL_API_TOKEN: token,
      SIRINX_CONTROL_URL: `http://127.0.0.1:${port}`,
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_CHAT_ID: "",
      TELEGRAM_OWNER_IDS: "",
      SIRINX_TELEGRAM_CONFIRM: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  processes.push(child);
  return child;
}

function liveRequestBody(overrides = {}) {
  return {
    requestId: "server-live-test",
    goal: "local A2A route test",
    sourceAgent: "codex",
    targetAgents: ["hermes-agent"],
    messageType: "notification",
    message: "bounded test payload",
    dryRun: false,
    ...overrides
  };
}

async function postPlan(baseUrl, body, headers = {}) {
  return fetch(`${baseUrl}/api/a2a-sync/plan`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

describe("dev-control A2A route hardening", () => {
  beforeAll(async () => {
    spawnServer(livePort, controlToken);
    spawnServer(noTokenPort, "");
    await Promise.all([
      waitForServer(`${liveBaseUrl}/health`),
      waitForServer(`${noTokenBaseUrl}/health`)
    ]);
  }, 10000);

  afterAll(() => {
    for (const child of processes) {
      if (!child.killed) child.kill("SIGTERM");
    }
  });

  it("allows local dry-run planning without control auth", async () => {
    const response = await postPlan(liveBaseUrl, {
      ...liveRequestBody(),
      dryRun: true
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("a2a-sync-plan-ready");
    expect(body.externalWrites).toBe(false);
    expect(response.headers.get("idempotency-replayed")).toBeNull();
  });

  it("serves a truthful A2A status body over GET", async () => {
    const response = await fetch(`${liveBaseUrl}/api/a2a-sync`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "a2a-sync-dry-run",
      mode: "local-only-dry-run",
      canSendTelegram: false,
      commandExecuted: false,
      externalWrites: false,
      summary: {
        syncAgents: 16,
        verifiedRuntimeAgents: 0,
        liveTelegramReady: false,
      },
    });
    expect(body.syncAgents.map((agent) => agent.id)).toEqual(expect.arrayContaining([
      "opencode",
      "kimi-code",
      "claude-cowork",
    ]));
  });

  it("fails closed when live control auth is not configured", async () => {
    const response = await postPlan(noTokenBaseUrl, liveRequestBody(), {
      "idempotency-key": "missing-config-1"
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      status: "a2a_sync_live_control_unavailable",
      error: "control_api_token_not_configured",
      externalWrites: false,
      canSendTelegram: false
    });
  });

  it("automatically selects the Telegram lane for a live alert and fails closed before provider access", async () => {
    const response = await postPlan(liveBaseUrl, liveRequestBody({
      requestId: "http-alert-held",
      sourceAgent: "opencode",
      targetAgents: ["hermes-agent", "telegram-bot"],
      messageType: "alert",
      message: "bounded OpenCode handshake evidence is available",
    }), {
      authorization: `Bearer ${controlToken}`,
      "idempotency-key": "http-alert-held-1",
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "a2a-sync-plan-ready",
      messageType: "alert",
      providerCalled: false,
      externalWrites: false,
      telegramNotification: {
        routed: true,
        liveReady: false,
        attempted: false,
        dryRun: false,
        sent: false,
      },
    });
    expect(body.syncPlan.telegramRouted).toBe(true);
    expect(body.syncPlan.deliveredTo).toEqual([]);
    expect(body.syncPlan.failedTo).toEqual([]);
  });

  it.each([
    ["missing bearer", {}, "bearer_token_missing"],
    ["invalid bearer", { authorization: "Bearer wrong-token" }, "bearer_token_invalid"]
  ])("rejects %s for a live plan", async (_label, authHeaders, expectedError) => {
    const response = await postPlan(liveBaseUrl, liveRequestBody(), {
      "idempotency-key": `auth-${expectedError}`,
      ...authHeaders
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe("Bearer");
    expect(body.error).toBe(expectedError);
    expect(body.externalWrites).toBe(false);
  });

  it("requires a bounded idempotency key for authenticated live plans", async () => {
    const response = await postPlan(liveBaseUrl, liveRequestBody(), {
      authorization: `Bearer ${controlToken}`
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("idempotency_key_required");
    expect(body.externalWrites).toBe(false);
  });

  it("returns the cached receipt for an exact replay", async () => {
    const headers = {
      authorization: `Bearer ${controlToken}`,
      "idempotency-key": "exact-replay-1"
    };
    const requestBody = liveRequestBody({ requestId: "exact-replay" });

    const first = await postPlan(liveBaseUrl, requestBody, headers);
    const firstBody = await first.json();
    const replay = await postPlan(liveBaseUrl, requestBody, headers);
    const replayBody = await replay.json();

    expect(first.status).toBe(200);
    expect(first.headers.get("idempotency-replayed")).toBe("false");
    expect(replay.status).toBe(200);
    expect(replay.headers.get("idempotency-replayed")).toBe("true");
    expect(replayBody).toEqual(firstBody);
    expect(replayBody.providerCalled).toBe(false);
    expect(replayBody.externalWrites).toBe(false);
  });

  it("rejects reusing a live key with a different body", async () => {
    const headers = {
      authorization: `Bearer ${controlToken}`,
      "idempotency-key": "body-conflict-1"
    };
    const first = await postPlan(liveBaseUrl, liveRequestBody({ requestId: "conflict-a" }), headers);
    expect(first.status).toBe(200);

    const conflict = await postPlan(
      liveBaseUrl,
      liveRequestBody({ requestId: "conflict-b", message: "different payload" }),
      headers
    );
    const body = await conflict.json();

    expect(conflict.status).toBe(409);
    expect(body.error).toBe("idempotency_key_body_mismatch");
    expect(body.externalWrites).toBe(false);
  });

  it("does not consume a live idempotency key during dry-run", async () => {
    const headers = {
      authorization: `Bearer ${controlToken}`,
      "idempotency-key": "dry-run-does-not-consume"
    };
    const dryRun = await postPlan(liveBaseUrl, { ...liveRequestBody(), dryRun: true }, headers);
    expect(dryRun.status).toBe(200);
    expect(dryRun.headers.get("idempotency-replayed")).toBeNull();

    const live = await postPlan(liveBaseUrl, liveRequestBody(), headers);
    expect(live.status).toBe(200);
    expect(live.headers.get("idempotency-replayed")).toBe("false");
  });

  it("maps A2A contract validation to a stable 422 without internal details", async () => {
    const response = await postPlan(liveBaseUrl, {
      goal: "local validation test",
      messageType: "not-supported"
    });
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      status: "invalid_a2a_sync_plan_request",
      error: "a2a_message_type_unsupported",
      externalWrites: false
    });
    expect(body).not.toHaveProperty("message");
    expect(JSON.stringify(body)).not.toContain("stack");
  });

  it("rejects request bodies above 16 KiB", async () => {
    const response = await postPlan(liveBaseUrl, {
      ...liveRequestBody(),
      dryRun: true,
      message: "x".repeat(17 * 1024)
    });
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body.error).toBe("request_body_too_large");
    expect(body.externalWrites).toBe(false);
  });

  it("advertises auth and idempotency headers only to an allowed dashboard origin", async () => {
    const allowed = await fetch(`${liveBaseUrl}/api/a2a-sync/plan`, {
      method: "OPTIONS",
      headers: {
        origin: "http://localhost:8710",
        "access-control-request-method": "POST"
      }
    });
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get("access-control-allow-origin")).toBe("http://localhost:8710");
    expect(allowed.headers.get("access-control-allow-headers")).toContain("authorization");
    expect(allowed.headers.get("access-control-allow-headers")).toContain("idempotency-key");

    const denied = await fetch(`${liveBaseUrl}/api/a2a-sync`, {
      headers: { origin: "https://untrusted.example" }
    });
    expect(denied.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("serves a truthful OmniRoute status and handshake without activating or sending", async () => {
    const statusResponse = await fetch(`${liveBaseUrl}/api/omniroute`);
    const status = await statusResponse.json();
    expect(statusResponse.status).toBe(200);
    expect(status).toMatchObject({
      status: "omniroute-configured-unverified",
      externalWrites: false,
      commandExecuted: false,
    });

    const handshakeResponse = await fetch(`${liveBaseUrl}/api/omniroute/handshake`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requestId: "http-handshake", dryRun: false }),
    });
    const handshake = await handshakeResponse.json();
    expect(handshakeResponse.status).toBe(200);
    expect(handshake).toMatchObject({
      status: "omniroute-handshake-unverified",
      externalWrites: false,
      commandExecuted: false,
      liveActivationRequired: true,
      syncNotification: {
        routed: false,
        attempted: false,
        sent: false,
        providerCalled: false,
      },
    });
  });

  it("serves the 47-role enterprise registry without spawning workers", async () => {
    const statusResponse = await fetch(`${liveBaseUrl}/api/agent-enterprise`);
    const status = await statusResponse.json();

    expect(statusResponse.status).toBe(200);
    expect(status).toMatchObject({
      status: "enterprise-role-registry-ready-workers-not-spawned",
      canSpawnWorkersNow: false,
      externalWrites: false,
      commandExecuted: false,
      summary: {
        roninRoleCards: 47,
        departments: 5,
        spawnedRoles: 0,
        activeRoles: 0,
      },
      concurrency: {
        runtimeSlots: 4,
        coordinatorReservedSlots: 1,
        maxConcurrentWorkers: 3,
        activeWorkers: 0,
      },
    });
    expect(status.roleCards).toHaveLength(47);

    const planResponse = await fetch(`${liveBaseUrl}/api/agent-enterprise/dispatch/plan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ goal: "plan 47 departments", dryRun: true }),
    });
    const plan = await planResponse.json();
    expect(planResponse.status).toBe(200);
    expect(plan).toMatchObject({
      status: "enterprise-dispatch-plan-ready",
      plannedRoleCount: 47,
      spawnedRoleCount: 0,
      commandExecuted: false,
    });
  });

  it("serves a truthful OpenCode autoloop view and all-agent dry-run plan", async () => {
    const statusResponse = await fetch(`${liveBaseUrl}/api/codex-autoloop`);
    const status = await statusResponse.json();

    expect(statusResponse.status).toBe(200);
    expect(status).toMatchObject({
      status: "autoloop-evidence-ready-not-started",
      liveSync: false,
      persistentLoopRunning: false,
      allAgentsSynced: false,
      allAgentsApproved: false,
      canSpawnAgents: false,
      commandExecuted: false,
      summary: {
        a2aSurfaceAgents: 16,
        omnirouteLanes: 16,
        logicalRoninRoles: 47,
        spawnedRoninRoles: 0,
      },
    });

    const planResponse = await fetch(`${liveBaseUrl}/api/codex-autoloop/plan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ goal: "plan all agents", dryRun: true }),
    });
    const plan = await planResponse.json();
    expect(planResponse.status).toBe(200);
    expect(plan).toMatchObject({
      status: "autoloop-dry-run-plan-ready",
      liveSync: false,
      targetAgents: expect.any(Array),
      targetLanes: expect.any(Array),
      enterpriseDispatch: { plannedRoleCount: 47, spawnedRoleCount: 0 },
      commandExecuted: false,
    });
    expect(plan.targetAgents).toHaveLength(16);
    expect(plan.targetLanes).toHaveLength(16);
  });

  it("applies the same 16 KiB limit to OmniRoute handshake bodies", async () => {
    const response = await fetch(`${liveBaseUrl}/api/omniroute/handshake`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ goal: "x".repeat(17 * 1024) }),
    });
    const body = await response.json();

    expect(response.status).toBe(413);
    expect(body).toMatchObject({
      status: "invalid_omniroute_handshake_request",
      error: "request_body_too_large",
      externalWrites: false,
    });
    expect(body).not.toHaveProperty("message");
  });
});

async function waitForServer(url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 8000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Retry until the bounded startup deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 75));
  }
  throw new Error(`server did not start for ${url}`);
}
