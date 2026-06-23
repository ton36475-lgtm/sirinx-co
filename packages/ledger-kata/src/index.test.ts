import { describe, expect, it } from "vitest";

import {
  createLedgerKata,
  LedgerValidationError,
  type LedgerEntryInput,
} from "./index.js";

function depositEntries(userId: string, amountMinor: number): LedgerEntryInput[] {
  return [
    {
      account: "cash:provider",
      side: "debit",
      amountMinor,
    },
    {
      account: `liability:user:${userId}`,
      side: "credit",
      amountMinor,
    },
  ];
}

describe("ledger kata core", () => {
  it("posts a balanced double-entry transaction", () => {
    const kata = createLedgerKata();

    const result = kata.postTransaction({
      transactionId: "tx-balanced-001",
      type: "deposit",
      entries: depositEntries("alice", 10000),
      metadata: { source: "unit-test" },
    });

    expect(result.status).toBe("posted");
    expect(result.debitTotalMinor).toBe(10000);
    expect(result.creditTotalMinor).toBe(10000);
    expect(kata.getLedgerEntries()).toHaveLength(2);
    expect(kata.getBalanceMinor("alice")).toBe(10000);
  });

  it("rejects an unbalanced transaction without persisting entries", () => {
    const kata = createLedgerKata();

    expect(() =>
      kata.postTransaction({
        transactionId: "tx-unbalanced-001",
        type: "deposit",
        entries: [
          { account: "cash:provider", side: "debit", amountMinor: 10000 },
          { account: "liability:user:alice", side: "credit", amountMinor: 9900 },
        ],
      }),
    ).toThrow(LedgerValidationError);

    expect(kata.getLedgerEntries()).toHaveLength(0);
    expect(kata.getAuditEvents()).toEqual([
      expect.objectContaining({
        type: "unbalanced_transaction",
        transactionId: "tx-unbalanced-001",
      }),
    ]);
  });
});

describe("sandbox payment webhook idempotency", () => {
  it("credits a repeated deposit webhook exactly once", () => {
    const kata = createLedgerKata();

    const first = kata.simulateDepositWebhook({
      provider: "sandbox-provider",
      eventId: "evt-001",
      idempotencyKey: "deposit-event-001",
      userId: "alice",
      amountMinor: 10000,
    });

    const replay = kata.simulateDepositWebhook({
      provider: "sandbox-provider",
      eventId: "evt-001-replay",
      idempotencyKey: "deposit-event-001",
      userId: "alice",
      amountMinor: 10000,
    });

    expect(first.status).toBe("posted");
    expect(replay.status).toBe("duplicate");
    expect(replay.transactionId).toBe(first.transactionId);
    expect(kata.getBalanceMinor("alice")).toBe(10000);
    expect(kata.getLedgerEntries()).toHaveLength(2);
    expect(kata.getAuditEvents()).toContainEqual(
      expect.objectContaining({
        type: "payment_webhook_duplicate",
        transactionId: first.transactionId,
      }),
    );
  });

  it("rejects an invalid sandbox webhook signature without posting ledger entries", () => {
    const kata = createLedgerKata();

    expect(() =>
      kata.simulateDepositWebhook({
        provider: "sandbox-provider",
        eventId: "evt-invalid-signature",
        idempotencyKey: "deposit-invalid-signature",
        userId: "alice",
        amountMinor: 10000,
        signatureStatus: "invalid",
        createdAt: new Date().toISOString(),
      }),
    ).toThrow(LedgerValidationError);

    expect(kata.getLedgerEntries()).toHaveLength(0);
    expect(kata.getAuditEvents()).toContainEqual(
      expect.objectContaining({
        type: "payment_webhook_invalid_signature",
      }),
    );
  });

  it("rejects a stale sandbox webhook timestamp without posting ledger entries", () => {
    const kata = createLedgerKata();

    expect(() =>
      kata.simulateDepositWebhook({
        provider: "sandbox-provider",
        eventId: "evt-stale-timestamp",
        idempotencyKey: "deposit-stale-timestamp",
        userId: "alice",
        amountMinor: 10000,
        signatureStatus: "valid",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow(LedgerValidationError);

    expect(kata.getLedgerEntries()).toHaveLength(0);
    expect(kata.getAuditEvents()).toContainEqual(
      expect.objectContaining({
        type: "payment_webhook_stale_timestamp",
      }),
    );
  });
});

describe("withdrawal concurrency guard", () => {
  it("prevents two simultaneous withdrawals from spending the same balance twice", async () => {
    const kata = createLedgerKata();
    kata.simulateDepositWebhook({
      provider: "sandbox-provider",
      eventId: "evt-seed-balance",
      idempotencyKey: "deposit-seed-balance",
      userId: "alice",
      amountMinor: 10000,
    });

    const [first, second] = await Promise.allSettled([
      kata.requestWithdrawalSettlement({
        requestId: "withdrawal-001",
        userId: "alice",
        amountMinor: 8000,
      }),
      kata.requestWithdrawalSettlement({
        requestId: "withdrawal-002",
        userId: "alice",
        amountMinor: 8000,
      }),
    ]);

    const fulfilled = [first, second].filter((result) => result.status === "fulfilled");
    const rejected = [first, second].filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(kata.getBalanceMinor("alice")).toBe(2000);
    expect(kata.getLedgerEntries()).toHaveLength(4);
    expect(kata.getAuditEvents()).toContainEqual(
      expect.objectContaining({
        type: "insufficient_balance",
      }),
    );
  });
});
