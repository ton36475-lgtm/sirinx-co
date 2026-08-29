import { describe, expect, it, vi } from "vitest";
import {
  collectTelegramOperatorPreflight,
  inspectOperatorEnvironment,
  probeServiceIdentity,
  runTelegramOperatorPreflightCli,
} from "./operator-preflight.mjs";

const NOW = () => new Date("2026-07-20T04:30:00.000Z");
const FULL_ENV = {
  TELEGRAM_BOT_TOKEN: "test-bot-token-never-print",
  TELEGRAM_CHAT_ID: "-10000000001",
  TELEGRAM_OWNER_IDS: "1001,1002",
  SIRINX_TELEGRAM_CONFIRM: "SEND",
  CONTROL_API_TOKEN: "test-control-token-never-print",
  DATABASE_URL: "postgresql://test-never-print",
  SIRINX_CONTROL_URL: "http://127.0.0.1:8711",
};

const HELD_DURABLE_GATE = {
  authority: "sirinx-control",
  testOnly: false,
  effectiveState: "hold",
  reportedState: "hold",
  open: false,
  authoritative: true,
  fresh: true,
  persistenceBackend: "postgres",
  durable: true,
  durabilityVerified: true,
  reason: "gate_held",
};

function healthyProbe(service) {
  return {
    reachable: true,
    httpOk: true,
    identityVerified: true,
    httpStatus: 200,
    reportedEnvReady: service.id === "telegramGateway",
    reportedLiveSendReady: false,
    reason: null,
  };
}

describe("operator environment inspection", () => {
  it("reports only readiness booleans and never returns environment values", () => {
    const result = inspectOperatorEnvironment(FULL_ENV);

    expect(result.ready).toBe(true);
    expect(Object.values(result).every((value) => typeof value === "boolean")).toBe(true);
    const serialized = JSON.stringify(result);
    for (const secretLikeValue of Object.values(FULL_ENV)) {
      expect(serialized).not.toContain(secretLikeValue);
    }
  });
});

describe("collectTelegramOperatorPreflight", () => {
  it("returns READY only for exact core identities, complete env, durable Postgres, and held gate", async () => {
    const probeImpl = vi.fn(healthyProbe);
    const readTelegramSendGateImpl = vi.fn().mockResolvedValue(HELD_DURABLE_GATE);
    const report = await collectTelegramOperatorPreflight({
      env: FULL_ENV,
      now: NOW,
      probeImpl,
      readTelegramSendGateImpl,
    });

    expect(report).toMatchObject({
      verdict: "READY",
      ready: true,
      readOnly: true,
      providerCalls: false,
      mutations: false,
      blockers: [],
      gate: {
        state: "hold",
        authoritative: true,
        postgresBacked: true,
        durable: true,
        heldForReview: true,
      },
    });
    expect(Object.keys(report.services)).toEqual([
      "rustControl",
      "nodeLongTail",
      "telegramGateway",
    ]);
    expect(probeImpl).toHaveBeenCalledTimes(3);
    expect(readTelegramSendGateImpl).toHaveBeenCalledTimes(1);
    const serialized = JSON.stringify(report);
    for (const secretLikeValue of Object.values(FULL_ENV)) {
      expect(serialized).not.toContain(secretLikeValue);
    }
  });

  it("fails closed with stable blockers for missing env, wrong identity, and an open gate", async () => {
    const probeImpl = vi.fn(async (service) => (
      service.id === "rustControl"
        ? {
            reachable: true,
            httpOk: true,
            identityVerified: false,
            httpStatus: 200,
            reason: "identity_mismatch",
          }
        : healthyProbe(service)
    ));
    const report = await collectTelegramOperatorPreflight({
      env: { ...FULL_ENV, TELEGRAM_BOT_TOKEN: "", DATABASE_URL: "" },
      now: NOW,
      probeImpl,
      readTelegramSendGateImpl: vi.fn().mockResolvedValue({
        ...HELD_DURABLE_GATE,
        effectiveState: "open",
        reportedState: "open",
        open: true,
        reason: null,
      }),
    });

    expect(report.verdict).toBe("HOLD");
    expect(report.ready).toBe(false);
    expect(report.blockers).toEqual(expect.arrayContaining([
      "env_telegram_bot_token_missing",
      "env_database_url_missing",
      "service_rustControl_identity_mismatch",
      "telegram_gate_not_held",
    ]));
  });

  it("never calls the authenticated gate reader when CONTROL_API_TOKEN is missing", async () => {
    const readTelegramSendGateImpl = vi.fn();
    const report = await collectTelegramOperatorPreflight({
      env: { ...FULL_ENV, CONTROL_API_TOKEN: "" },
      now: NOW,
      probeImpl: vi.fn(healthyProbe),
      readTelegramSendGateImpl,
    });

    expect(readTelegramSendGateImpl).not.toHaveBeenCalled();
    expect(report.verdict).toBe("HOLD");
    expect(report.blockers).toEqual(expect.arrayContaining([
      "env_control_api_token_missing",
      "control_gate_not_checked_without_token",
    ]));
  });

  it("requires exact Hermes identity only when explicitly included", async () => {
    const probeImpl = vi.fn(async (service) => (
      service.id === "hermesA2a"
        ? {
            reachable: true,
            httpOk: true,
            identityVerified: false,
            httpStatus: 200,
            reason: "identity_mismatch",
          }
        : healthyProbe(service)
    ));
    const withoutHermes = await collectTelegramOperatorPreflight({
      env: FULL_ENV,
      now: NOW,
      probeImpl,
      readTelegramSendGateImpl: vi.fn().mockResolvedValue(HELD_DURABLE_GATE),
    });
    expect(withoutHermes.verdict).toBe("READY");
    expect(withoutHermes.services).not.toHaveProperty("hermesA2a");

    const withHermes = await collectTelegramOperatorPreflight({
      env: FULL_ENV,
      now: NOW,
      includeHermes: true,
      probeImpl,
      readTelegramSendGateImpl: vi.fn().mockResolvedValue(HELD_DURABLE_GATE),
    });
    expect(withHermes.verdict).toBe("HOLD");
    expect(withHermes.blockers).toContain("service_hermesA2a_identity_mismatch");
  });

  it("rejects test-only or non-durable gate evidence", async () => {
    const report = await collectTelegramOperatorPreflight({
      env: FULL_ENV,
      now: NOW,
      probeImpl: vi.fn(healthyProbe),
      readTelegramSendGateImpl: vi.fn().mockResolvedValue({
        ...HELD_DURABLE_GATE,
        testOnly: true,
        persistenceBackend: "test-injected",
        durable: false,
        durabilityVerified: false,
      }),
    });

    expect(report.verdict).toBe("HOLD");
    expect(report.blockers).toEqual(expect.arrayContaining([
      "control_gate_test_evidence_rejected",
      "control_gate_not_durable_postgres",
    ]));
  });

  it("sanitizes unexpected probe and gate reasons", async () => {
    const report = await collectTelegramOperatorPreflight({
      env: FULL_ENV,
      now: NOW,
      probeImpl: vi.fn().mockResolvedValue({
        reason: `do-not-leak-${FULL_ENV.CONTROL_API_TOKEN}`,
      }),
      readTelegramSendGateImpl: vi.fn().mockResolvedValue({
        reason: `do-not-leak-${FULL_ENV.TELEGRAM_BOT_TOKEN}`,
      }),
    });
    const serialized = JSON.stringify(report);

    expect(serialized).not.toContain(FULL_ENV.CONTROL_API_TOKEN);
    expect(serialized).not.toContain(FULL_ENV.TELEGRAM_BOT_TOKEN);
    expect(report.gate.reason).toBe("control_gate_evidence_invalid");
  });
});

describe("probeServiceIdentity", () => {
  it("uses one GET-only exact loopback health probe", async () => {
    const service = {
      id: "rustControl",
      healthUrl: "http://127.0.0.1:8711/health",
      matches: (body) => body.status === "ok" && body.service === "sirinx-control",
    };
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: "ok",
      service: "sirinx-control",
    }), { status: 200 }));

    const result = await probeServiceIdentity(service, { fetchImpl });

    expect(result).toMatchObject({
      reachable: true,
      httpOk: true,
      identityVerified: true,
      httpStatus: 200,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8711/health",
      expect.objectContaining({ method: "GET", redirect: "error" }),
    );
  });

  it("does not expose response bodies or thrown error text", async () => {
    const service = {
      id: "rustControl",
      healthUrl: "http://127.0.0.1:8711/health",
      matches: () => false,
    };
    const wrong = await probeServiceIdentity(service, {
      fetchImpl: vi.fn().mockResolvedValue(new Response(JSON.stringify({
        service: "wrong-service-with-private-detail",
      }), { status: 200 })),
    });
    const failed = await probeServiceIdentity(service, {
      fetchImpl: vi.fn().mockRejectedValue(new Error("private network detail")),
    });

    expect(wrong.reason).toBe("identity_mismatch");
    expect(JSON.stringify(wrong)).not.toContain("private-detail");
    expect(failed.reason).toBe("request_failed");
    expect(JSON.stringify(failed)).not.toContain("private network detail");
  });
});

describe("operator preflight CLI", () => {
  it("returns exit 0 for READY and exit 2 for unsupported arguments without probing", async () => {
    const writes = [];
    const ready = await runTelegramOperatorPreflightCli([], {
      env: FULL_ENV,
      now: NOW,
      probeImpl: vi.fn(healthyProbe),
      readTelegramSendGateImpl: vi.fn().mockResolvedValue(HELD_DURABLE_GATE),
      writeImpl: (value) => writes.push(value),
    });
    expect(ready.exitCode).toBe(0);
    expect(JSON.parse(writes[0]).verdict).toBe("READY");

    const probeImpl = vi.fn();
    const invalid = await runTelegramOperatorPreflightCli(["--send"], {
      env: FULL_ENV,
      now: NOW,
      probeImpl,
      writeImpl: (value) => writes.push(value),
    });
    expect(invalid.exitCode).toBe(2);
    expect(invalid.report.blockers).toEqual(["unsupported_cli_argument"]);
    expect(probeImpl).not.toHaveBeenCalled();
  });
});
