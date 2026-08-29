import { describe, expect, it, vi } from "vitest";
import {
  A2A_MAX_MESSAGE_LENGTH,
  A2aSyncValidationError,
  a2aSyncBlockedActions,
  createA2aSyncPlan,
  getA2aSyncStatus,
  routeA2aNotification,
} from "./a2a-sync.mjs";

const fixedNow = () => new Date("2026-07-20T03:00:00.000Z");
const FULL_ENV = {
  TELEGRAM_BOT_TOKEN: "123456789:TESTTOKEN-do-not-leak",
  TELEGRAM_CHAT_ID: "-1001234567890",
  TELEGRAM_OWNER_IDS: "111,222",
  SIRINX_TELEGRAM_CONFIRM: "SEND",
  CONTROL_API_TOKEN: "control-secret-test",
};
const OPEN_GATE = { state: "open", ticket: "OPS-TG-TEST-001" };
const HELD_GATE = { state: "hold", ticket: "OPS-TG-TEST-001" };

describe("A2A Sync Coordinator status", () => {
  it("registers static definitions as unverified and exposes no external capability by default", async () => {
    const status = await getA2aSyncStatus({ env: {}, now: fixedNow });

    expect(status).toMatchObject({
      status: "a2a-sync-dry-run",
      mode: "local-only-dry-run",
      canSendTelegram: false,
      canStartAgents: false,
      commandExecuted: false,
      externalWrites: false,
      canRunMcp: false,
      canReadSecrets: false,
      summary: {
        syncAgents: 16,
        verifiedRuntimeAgents: 0,
        totalMessages: 0,
        pendingMessages: 0,
        liveTelegramReady: false,
        liveExternalActions: 0,
      },
    });
    expect(status.syncAgents.every((agent) => agent.status === "registered-unverified-runtime"))
      .toBe(true);
    expect(status.syncAgents.every((agent) => agent.lastSeenAt === null)).toBe(true);
  });

  it("reports all supported agents and message types", async () => {
    const status = await getA2aSyncStatus({ env: {}, now: fixedNow });

    expect(status.syncAgents.map((agent) => agent.id)).toEqual([
      "hermes-agent",
      "codex",
      "codex-app",
      "claude-code",
      "opencode",
      "openclaw",
      "copilot-cli",
      "droid",
      "pi",
      "telegram-bot",
      "a2a-sync",
      "manus",
      "hermes-one",
      "kimi-code",
      "claude-cowork",
      "antigravity",
    ]);
    expect(new Set(status.syncAgents.map((agent) => agent.id)).size).toBe(status.syncAgents.length);
    expect(status.messageTypes.map((item) => item.type)).toEqual([
      "status_update",
      "notification",
      "alert",
      "sync_request",
      "sync_response",
      "evidence_packet",
      "approval_request",
    ]);
  });

  it("becomes live-ready only with env readiness and fresh durable OPS-TG evidence", async () => {
    const held = await getA2aSyncStatus({ env: FULL_ENV, gate: HELD_GATE, now: fixedNow });
    const open = await getA2aSyncStatus({ env: FULL_ENV, gate: OPEN_GATE, now: fixedNow });

    expect(held.telegramLane).toMatchObject({
      liveSendReady: false,
      gateState: "hold",
      gateAuthoritative: true,
      ticketPrefixValid: true,
    });
    expect(open).toMatchObject({
      status: "a2a-sync-live-ready",
      mode: "live-sync-ready",
      canSendTelegram: true,
      telegramLane: {
        liveSendReady: true,
        gateState: "open",
        gateAuthoritative: true,
        gateFresh: true,
        ticketPrefixValid: true,
      },
    });
    expect(open.externalWrites).toBe(false);
  });
});

describe("createA2aSyncPlan", () => {
  it("blocks dangerous execution goals before planning", async () => {
    const plan = await createA2aSyncPlan({
      goal: "deploy and git push, start MCP, read secrets, launch agent",
    }, { env: {}, now: fixedNow });

    expect(plan.status).toBe("blocked-a2a-sync-plan");
    expect(plan.blockedReasons).toEqual(expect.arrayContaining([
      "deploy",
      "push",
      "real_mcp_execution",
      "secret_read_or_print",
      "agent_auto_start",
    ]));
    expect(plan.syncPlan).toBeNull();
    expect(plan.externalWrites).toBe(false);
  });

  it("creates only a plan and never marks unobserved agent delivery", async () => {
    const plan = await createA2aSyncPlan({
      requestId: "a2a-test-001",
      goal: "local-only agent sync notification",
      sourceAgent: "codex",
      targetAgents: ["hermes-agent", "telegram-bot"],
      messageType: "notification",
      message: "Codex completed local test run",
    }, { env: {}, now: fixedNow });

    expect(plan).toMatchObject({
      status: "a2a-sync-plan-ready",
      mode: "local-only-dry-run",
      requestId: "a2a-test-001",
      sourceAgent: "codex",
      targetAgents: ["hermes-agent", "telegram-bot"],
      messageType: "notification",
      externalWrites: false,
      providerCalled: false,
      externalWriteOutcome: "none",
      telegramNotification: {
        routed: false,
        attempted: false,
        sent: false,
      },
    });
    expect(plan.syncPlan.plannedTargets).toEqual(["hermes-agent", "telegram-bot"]);
    expect(plan.syncPlan.deliveredTo).toEqual([]);
    expect(plan.syncPlan.failedTo).toEqual([]);
  });

  it.each(["alert", "approval_request"])(
    "routes %s in dry-run without invoking the sender",
    async (messageType) => {
      const sendTelegramMessageImpl = vi.fn();
      const plan = await createA2aSyncPlan({
        requestId: `a2a-${messageType}`,
        sourceAgent: "a2a-sync",
        targetAgents: ["hermes-agent", "telegram-bot"],
        messageType,
        message: "Review required",
        dryRun: true,
      }, {
        env: FULL_ENV,
        gate: OPEN_GATE,
        sendTelegramMessageImpl,
        now: fixedNow,
      });

      expect(plan.telegramNotification).toMatchObject({
        routed: true,
        liveReady: true,
        attempted: false,
        dryRun: true,
        sent: false,
        reason: "telegram_dry_run_no_provider_call",
      });
      expect(sendTelegramMessageImpl).not.toHaveBeenCalled();
    },
  );

  it("supports the documented alert body and sends only on explicit dryRun=false", async () => {
    const sendTelegramMessageImpl = vi.fn().mockResolvedValue({
      sent: true,
      providerCalled: true,
      error: null,
      apiResponse: { ok: true, httpStatus: 200, result: { messageId: 42 } },
    });
    const plan = await createA2aSyncPlan({
      messageType: "alert",
      dryRun: false,
    }, {
      env: FULL_ENV,
      gate: OPEN_GATE,
      sendTelegramMessageImpl,
      now: fixedNow,
    });

    expect(sendTelegramMessageImpl).toHaveBeenCalledTimes(1);
    expect(plan).toMatchObject({
      status: "a2a-sync-plan-telegram-sent",
      mode: "live-sync",
      externalWrites: true,
      customerVisible: true,
      providerCalled: true,
      externalWriteOutcome: "confirmed",
      telegramNotification: {
        attempted: true,
        dryRun: false,
        sent: true,
      },
    });
    expect(plan.syncPlan.message).toBe("A2A alert from a2a-sync");
    expect(plan.syncPlan.deliveredTo).toEqual(["telegram-bot"]);
  });

  it("does not invoke a live sender while the durable gate holds", async () => {
    const sendTelegramMessageImpl = vi.fn();
    const plan = await createA2aSyncPlan({
      messageType: "alert",
      message: "held",
      dryRun: false,
    }, {
      env: FULL_ENV,
      gate: HELD_GATE,
      sendTelegramMessageImpl,
      now: fixedNow,
    });

    expect(sendTelegramMessageImpl).not.toHaveBeenCalled();
    expect(plan).toMatchObject({
      status: "a2a-sync-plan-ready",
      externalWrites: false,
      providerCalled: false,
      externalWriteOutcome: "none",
      telegramNotification: { attempted: false, sent: false, reason: "gate_held" },
    });
  });

  it("reports an unknown external outcome after an inconclusive provider attempt", async () => {
    const plan = await createA2aSyncPlan({
      messageType: "approval_request",
      message: "approve?",
      dryRun: false,
    }, {
      env: FULL_ENV,
      gate: OPEN_GATE,
      sendTelegramMessageImpl: vi.fn().mockResolvedValue({
        sent: false,
        providerCalled: true,
        error: "telegram_request_timeout",
      }),
      now: fixedNow,
    });

    expect(plan).toMatchObject({
      status: "a2a-sync-plan-telegram-failed",
      externalWrites: false,
      providerCalled: true,
      externalWriteOutcome: "unknown",
      telegramNotification: { attempted: true, sent: false, reason: "telegram_request_timeout" },
    });
    expect(plan.syncPlan.failedTo).toEqual(["telegram-bot"]);
  });

  it.each([
    [null, "a2a_body_must_be_object"],
    [{ dryRun: "false" }, "a2a_dry_run_must_be_boolean"],
    [{ sourceAgent: "unknown" }, "a2a_source_agent_unknown"],
    [{ targetAgents: [] }, "a2a_target_agents_empty"],
    [{ targetAgents: ["codex", "codex"] }, "a2a_target_agents_duplicate"],
    [{ targetAgents: ["unknown"] }, "a2a_target_agent_unknown"],
    [{ messageType: "unsupported" }, "a2a_message_type_unsupported"],
    [{ messageType: "alert", message: "x".repeat(A2A_MAX_MESSAGE_LENGTH + 1) }, "a2a_message_too_long"],
  ])("rejects malformed input with %s", async (input, code) => {
    await expect(createA2aSyncPlan(input, { env: {}, now: fixedNow })).rejects.toEqual(
      expect.objectContaining({ name: "A2aSyncValidationError", code }),
    );
  });

  it("exports stable blocked-action disclosure", () => {
    expect(a2aSyncBlockedActions).toContain("telegram_send_without_gate");
    expect(new A2aSyncValidationError("test").code).toBe("test");
  });
});

describe("routeA2aNotification", () => {
  it("rejects unknown source/type and overlong messages without recording anything", async () => {
    const unknownSource = await routeA2aNotification("unknown", "alert", "test", { now: fixedNow });
    const unknownType = await routeA2aNotification("codex", "unknown", "test", { now: fixedNow });
    const tooLong = await routeA2aNotification(
      "codex",
      "alert",
      "x".repeat(A2A_MAX_MESSAGE_LENGTH + 1),
      { now: fixedNow },
    );

    expect(unknownSource).toMatchObject({ ok: false, error: "a2a_source_agent_unknown" });
    expect(unknownType).toMatchObject({ ok: false, error: "a2a_message_type_unsupported" });
    expect(tooLong).toMatchObject({ ok: false, error: "a2a_message_too_long" });
  });

  it("re-checks authority through the sender and reports the observed receipt", async () => {
    const sendTelegramMessageImpl = vi.fn().mockResolvedValue({
      sent: false,
      providerCalled: false,
      error: "gate_held",
    });
    const result = await routeA2aNotification("a2a-sync", "alert", "heartbeat missed", {
      env: FULL_ENV,
      gate: OPEN_GATE,
      dryRun: false,
      sendTelegramMessageImpl,
      now: fixedNow,
    });

    expect(sendTelegramMessageImpl).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: true,
      telegramRouted: true,
      telegramReady: true,
      telegramAttempted: true,
      telegramSent: false,
      providerCalled: false,
      externalWrites: false,
      externalWriteOutcome: "none",
      notificationRecorded: false,
      reason: "gate_held",
    });
  });
});
