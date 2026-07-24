import { describe, expect, it, vi } from "vitest";
import {
  assessTelegramSendGateEvidence,
  readTelegramSendGate,
} from "./control-gate.mjs";

const NOW = () => new Date("2026-07-20T00:00:00.000Z");
const ENV = { CONTROL_API_TOKEN: "control-secret-test" };
const DURABLE_PERSISTENCE = {
  backend: "postgres",
  durable: true,
  observedAt: "2026-07-20T00:00:00.000Z",
};

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe("readTelegramSendGate", () => {
  it("fails closed without CONTROL_API_TOKEN and never calls control", async () => {
    const fetchImpl = vi.fn();
    const result = await readTelegramSendGate({ env: {}, fetchImpl, now: NOW });

    expect(result.open).toBe(false);
    expect(result.reason).toBe("control_api_token_missing");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects non-loopback control URLs", async () => {
    const fetchImpl = vi.fn();
    const result = await readTelegramSendGate({
      env: ENV,
      baseUrl: "https://control.example.com",
      fetchImpl,
      now: NOW,
    });

    expect(result.reason).toBe("control_url_not_loopback");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("opens only one durable telegram_send gate with a valid OPS-TG ticket", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({
      gates: [{ name: "telegram_send", state: "open", ticket: "OPS-TG-TEST-001" }],
      persistence: DURABLE_PERSISTENCE,
    }));
    const result = await readTelegramSendGate({ env: ENV, fetchImpl, now: NOW });

    expect(result).toMatchObject({
      authority: "sirinx-control",
      effectiveState: "open",
      reportedState: "open",
      open: true,
      authoritative: true,
      fresh: true,
      ticketPresent: true,
      ticketPrefixValid: true,
      persistenceBackend: "postgres",
      durable: true,
      durabilityVerified: true,
      reason: null,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8711/api/gates",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ authorization: `Bearer ${ENV.CONTROL_API_TOKEN}` }),
      }),
    );
    expect(JSON.stringify(result)).not.toContain(ENV.CONTROL_API_TOKEN);
    expect(JSON.stringify(result)).not.toContain("OPS-TG-TEST-001");
  });

  it("holds an open MemoryStore gate because it is not durable", async () => {
    const result = await readTelegramSendGate({
      env: ENV,
      fetchImpl: vi.fn().mockResolvedValue(response({
        gates: [{ name: "telegram_send", state: "open", ticket: "OPS-TG-TEST-001" }],
        persistence: {
          backend: "memory",
          durable: false,
          observedAt: "2026-07-20T00:00:00.000Z",
        },
      })),
      now: NOW,
    });

    expect(result).toMatchObject({
      reportedState: "open",
      effectiveState: "hold",
      open: false,
      authoritative: true,
      persistenceBackend: "memory",
      durable: false,
      durabilityVerified: false,
      reason: "control_persistence_not_durable",
    });
  });

  it.each([
    ["missing", undefined, "control_persistence_invalid"],
    ["contradictory", {
      backend: "memory",
      durable: true,
      observedAt: "2026-07-20T00:00:00.000Z",
    }, "control_persistence_invalid"],
    ["stale", {
      backend: "postgres",
      durable: true,
      observedAt: "2026-07-19T23:59:00.000Z",
    }, "control_persistence_stale"],
  ])("holds an open gate with %s persistence evidence", async (_label, persistence, reason) => {
    const result = await readTelegramSendGate({
      env: ENV,
      fetchImpl: vi.fn().mockResolvedValue(response({
        gates: [{ name: "telegram_send", state: "open", ticket: "OPS-TG-TEST-001" }],
        persistence,
      })),
      now: NOW,
    });

    expect(result).toMatchObject({ open: false, effectiveState: "hold", reason });
  });

  it("marks injected gates as test-only without claiming durable storage", async () => {
    const result = await readTelegramSendGate({
      env: {},
      gate: { state: "open", ticket: "OPS-TG-TEST-001" },
      now: NOW,
    });

    expect(result).toMatchObject({
      authority: "test-injected",
      testOnly: true,
      open: true,
      persistenceBackend: "test-injected",
      durable: false,
      durabilityVerified: false,
    });
  });

  it.each([
    ["held", { gates: [{ name: "telegram_send", state: "hold", ticket: "OPS-TG-TEST-001" }] }, "gate_held"],
    ["bad ticket", { gates: [{ name: "telegram_send", state: "open", ticket: "CHANGE-001" }] }, "gate_ticket_invalid"],
    ["missing gate", { gates: [] }, "telegram_gate_missing"],
    ["duplicate gate", { gates: [
      { name: "telegram_send", state: "hold", ticket: "OPS-TG-A" },
      { name: "telegram_send", state: "open", ticket: "OPS-TG-B" },
    ] }, "telegram_gate_duplicate"],
  ])("fails closed for %s", async (_label, body, reason) => {
    const result = await readTelegramSendGate({
      env: ENV,
      fetchImpl: vi.fn().mockResolvedValue(response(body)),
      now: NOW,
    });

    expect(result.open).toBe(false);
    expect(result.effectiveState).toBe("hold");
    expect(result.reason).toBe(reason);
  });

  it("fails closed on HTTP, malformed JSON, timeout, and network errors", async () => {
    const cases = [
      [vi.fn().mockResolvedValue(response({}, 503)), "control_http_503"],
      [vi.fn().mockResolvedValue({ ok: true, status: 200, json: vi.fn().mockRejectedValue(new Error("bad")) }), "control_response_invalid_json"],
      [vi.fn().mockRejectedValue(Object.assign(new Error("timeout"), { name: "TimeoutError" })), "control_request_timeout"],
      [vi.fn().mockRejectedValue(new Error("secret network detail")), "control_request_failed"],
    ];

    for (const [fetchImpl, reason] of cases) {
      const result = await readTelegramSendGate({ env: ENV, fetchImpl, now: NOW });
      expect(result).toMatchObject({ open: false, reason });
      expect(JSON.stringify(result)).not.toContain("secret network detail");
    }
  });
});

describe("assessTelegramSendGateEvidence", () => {
  it("turns stale or future evidence back into hold", () => {
    const evidence = {
      authority: "sirinx-control",
      reportedState: "open",
      authoritative: true,
      ticketPrefixValid: true,
      checkedAtMs: 1_000,
    };

    expect(assessTelegramSendGateEvidence(evidence, { now: 4_001, maxAgeMs: 2_000 }).reason)
      .toBe("gate_evidence_stale");
    expect(assessTelegramSendGateEvidence(evidence, { now: 999, maxAgeMs: 2_000 }).reason)
      .toBe("gate_evidence_from_future");
  });
});
