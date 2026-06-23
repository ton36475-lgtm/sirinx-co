# Payment Provider Sandbox Readiness

This document defines how to practice payment-provider integration without
touching real money.

## Scope

Allowed:

- sandbox provider interface
- fake webhook payloads
- local signature verification placeholder
- fake deposits and withdrawals
- idempotency tests
- reconciliation report
- provider error simulation

Blocked:

- real provider API keys
- real deposits
- real withdrawals
- live bank transfer
- live crypto transfer
- real customer/player data
- public callback URL

## Sandbox Adapter Contract

```ts
type SandboxPaymentEvent = {
  provider: string;
  eventId: string;
  idempotencyKey: string;
  eventType: "deposit.confirmed" | "withdrawal.settled" | "withdrawal.failed";
  userId: string;
  amountMinor: number;
  currency: "TEST";
  createdAt: string;
  signatureStatus: "valid" | "invalid" | "not_checked";
};
```

## Required Checks

For every provider event:

1. Validate required fields.
2. Validate signature or mark sandbox placeholder explicitly.
3. Check timestamp tolerance.
4. Check idempotency key.
5. Validate amount is positive.
6. Map event to a ledger transaction.
7. Commit ledger state.
8. Write audit event.
9. Emit realtime event after commit.
10. Update metrics.

## Failure Simulations

Run these in the sandbox:

| Case | Expected behavior |
|---|---|
| duplicate deposit event | credit once, return duplicate-safe result |
| invalid signature | reject, no ledger entry |
| stale timestamp | reject, no ledger entry |
| negative amount | reject, no ledger entry |
| unknown event type | quarantine, no ledger entry |
| provider timeout | retry with backoff, do not duplicate transaction |
| withdrawal settlement replay | settle once, duplicate-safe response |

## Reconciliation Report

The sandbox should be able to output:

- provider event count
- posted ledger transaction count
- duplicate event count
- rejected event count
- total simulated deposits
- total simulated withdrawals
- ledger debit total
- ledger credit total
- imbalance count

## Interview Talking Point

If asked to connect a live provider quickly, answer:

> I will first implement the provider integration against sandbox credentials,
> prove idempotency and ledger reconciliation, then move to live only after
> legal/compliance/provider approval and production security gates pass.
