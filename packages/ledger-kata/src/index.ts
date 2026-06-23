export type LedgerSide = "debit" | "credit";

export type LedgerEntryInput = {
  account: string;
  side: LedgerSide;
  amountMinor: number;
};

export type LedgerTransactionInput = {
  transactionId: string;
  type: "deposit" | "withdrawal_settlement" | "bonus" | "reversal";
  entries: LedgerEntryInput[];
  metadata?: Record<string, string>;
};

export type PostedLedgerEntry = LedgerEntryInput & {
  transactionId: string;
  sequence: number;
};

export type PostedTransaction = {
  transactionId: string;
  status: "posted";
  debitTotalMinor: number;
  creditTotalMinor: number;
  entries: PostedLedgerEntry[];
};

export type SandboxDepositWebhookInput = {
  provider: string;
  eventId: string;
  idempotencyKey: string;
  userId: string;
  amountMinor: number;
  signatureStatus?: "valid" | "invalid" | "not_checked";
  createdAt?: string;
};

export type SandboxWebhookResult = {
  status: "posted" | "duplicate";
  transactionId: string;
};

export type WithdrawalSettlementInput = {
  requestId: string;
  userId: string;
  amountMinor: number;
};

export type AuditEvent = {
  type: string;
  transactionId?: string;
  detail: Record<string, string | number | boolean>;
};

export class LedgerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LedgerValidationError";
  }
}

export type LedgerKata = {
  postTransaction(input: LedgerTransactionInput): PostedTransaction;
  simulateDepositWebhook(input: SandboxDepositWebhookInput): SandboxWebhookResult;
  requestWithdrawalSettlement(input: WithdrawalSettlementInput): Promise<PostedTransaction>;
  getLedgerEntries(): PostedLedgerEntry[];
  getAuditEvents(): AuditEvent[];
  getBalanceMinor(userId: string): number;
};

export function createLedgerKata(): LedgerKata {
  const entries: PostedLedgerEntry[] = [];
  const auditEvents: AuditEvent[] = [];
  const idempotencyRecords = new Map<string, string>();
  const staleWebhookToleranceMs = 5 * 60 * 1000;

  function postTransaction(input: LedgerTransactionInput): PostedTransaction {
    validateTransactionInput(input);

    const debitTotalMinor = sumSide(input.entries, "debit");
    const creditTotalMinor = sumSide(input.entries, "credit");

    if (debitTotalMinor !== creditTotalMinor) {
      auditEvents.push({
        type: "unbalanced_transaction",
        transactionId: input.transactionId,
        detail: {
          debitTotalMinor,
          creditTotalMinor,
        },
      });
      throw new LedgerValidationError("Transaction is unbalanced.");
    }

    const postedEntries = input.entries.map((entry, index) => ({
      ...entry,
      transactionId: input.transactionId,
      sequence: entries.length + index + 1,
    }));
    entries.push(...postedEntries);

    auditEvents.push({
      type: "transaction_posted",
      transactionId: input.transactionId,
      detail: {
        entryCount: postedEntries.length,
        debitTotalMinor,
        creditTotalMinor,
      },
    });

    return {
      transactionId: input.transactionId,
      status: "posted",
      debitTotalMinor,
      creditTotalMinor,
      entries: postedEntries,
    };
  }

  function simulateDepositWebhook(input: SandboxDepositWebhookInput): SandboxWebhookResult {
    validateSandboxDepositWebhook(input);

    if (input.signatureStatus === "invalid") {
      auditEvents.push({
        type: "payment_webhook_invalid_signature",
        detail: {
          provider: input.provider,
          eventId: input.eventId,
          idempotencyKey: input.idempotencyKey,
        },
      });
      throw new LedgerValidationError("Sandbox webhook signature is invalid.");
    }

    if (isStaleWebhookTimestamp(input.createdAt, staleWebhookToleranceMs)) {
      auditEvents.push({
        type: "payment_webhook_stale_timestamp",
        detail: {
          provider: input.provider,
          eventId: input.eventId,
          idempotencyKey: input.idempotencyKey,
          createdAt: input.createdAt ?? "",
        },
      });
      throw new LedgerValidationError("Sandbox webhook timestamp is stale.");
    }

    const idempotencyScope = `${input.provider}:${input.idempotencyKey}`;
    const existingTransactionId = idempotencyRecords.get(idempotencyScope);
    if (existingTransactionId !== undefined) {
      auditEvents.push({
        type: "payment_webhook_duplicate",
        transactionId: existingTransactionId,
        detail: {
          provider: input.provider,
          eventId: input.eventId,
          idempotencyKey: input.idempotencyKey,
        },
      });
      return {
        status: "duplicate",
        transactionId: existingTransactionId,
      };
    }

    const transactionId = `deposit:${input.provider}:${input.idempotencyKey}`;
    idempotencyRecords.set(idempotencyScope, transactionId);
    postTransaction({
      transactionId,
      type: "deposit",
      entries: [
        {
          account: "cash:provider",
          side: "debit",
          amountMinor: input.amountMinor,
        },
        {
          account: `liability:user:${input.userId}`,
          side: "credit",
          amountMinor: input.amountMinor,
        },
      ],
      metadata: {
        provider: input.provider,
        eventId: input.eventId,
        idempotencyKey: input.idempotencyKey,
      },
    });

    auditEvents.push({
      type: "payment_webhook_posted",
      transactionId,
      detail: {
        provider: input.provider,
        eventId: input.eventId,
        idempotencyKey: input.idempotencyKey,
      },
    });

    return {
      status: "posted",
      transactionId,
    };
  }

  async function requestWithdrawalSettlement(input: WithdrawalSettlementInput): Promise<PostedTransaction> {
    validateWithdrawalSettlement(input);

    const availableBalanceMinor = getBalanceMinor(input.userId);
    if (availableBalanceMinor < input.amountMinor) {
      auditEvents.push({
        type: "insufficient_balance",
        detail: {
          requestId: input.requestId,
          userId: input.userId,
          requestedAmountMinor: input.amountMinor,
          availableBalanceMinor,
        },
      });
      throw new LedgerValidationError("Insufficient balance for sandbox withdrawal settlement.");
    }

    const transactionId = `withdrawal:${input.requestId}`;
    return postTransaction({
      transactionId,
      type: "withdrawal_settlement",
      entries: [
        {
          account: `liability:user:${input.userId}`,
          side: "debit",
          amountMinor: input.amountMinor,
        },
        {
          account: "cash:provider",
          side: "credit",
          amountMinor: input.amountMinor,
        },
      ],
      metadata: {
        requestId: input.requestId,
        userId: input.userId,
      },
    });
  }

  function getBalanceMinor(userId: string): number {
    const liabilityAccount = `liability:user:${userId}`;
    return entries
      .filter((entry) => entry.account === liabilityAccount)
      .reduce((balance, entry) => {
        if (entry.side === "credit") {
          return balance + entry.amountMinor;
        }
        return balance - entry.amountMinor;
      }, 0);
  }

  return {
    postTransaction,
    simulateDepositWebhook,
    requestWithdrawalSettlement,
    getLedgerEntries: () => [...entries],
    getAuditEvents: () => [...auditEvents],
    getBalanceMinor,
  };
}

function validateTransactionInput(input: LedgerTransactionInput): void {
  if (input.entries.length < 2) {
    throw new LedgerValidationError("Transaction must contain at least two entries.");
  }

  for (const entry of input.entries) {
    if (!Number.isInteger(entry.amountMinor) || entry.amountMinor <= 0) {
      throw new LedgerValidationError("Entry amount must be a positive integer in minor units.");
    }
  }
}

function validateWithdrawalSettlement(input: WithdrawalSettlementInput): void {
  if (!input.requestId || !input.userId) {
    throw new LedgerValidationError("Withdrawal settlement is missing required fields.");
  }

  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new LedgerValidationError("Withdrawal amount must be a positive integer in minor units.");
  }
}

function validateSandboxDepositWebhook(input: SandboxDepositWebhookInput): void {
  if (!input.provider || !input.eventId || !input.idempotencyKey || !input.userId) {
    throw new LedgerValidationError("Sandbox webhook is missing required fields.");
  }

  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new LedgerValidationError("Sandbox webhook amount must be a positive integer in minor units.");
  }

  if (input.createdAt !== undefined && Number.isNaN(Date.parse(input.createdAt))) {
    throw new LedgerValidationError("Sandbox webhook createdAt must be an ISO timestamp.");
  }
}

function sumSide(entries: LedgerEntryInput[], side: LedgerSide): number {
  return entries
    .filter((entry) => entry.side === side)
    .reduce((total, entry) => total + entry.amountMinor, 0);
}

function isStaleWebhookTimestamp(createdAt: string | undefined, toleranceMs: number): boolean {
  if (createdAt === undefined) {
    return false;
  }

  const createdAtMs = Date.parse(createdAt);
  return Date.now() - createdAtMs > toleranceMs;
}
