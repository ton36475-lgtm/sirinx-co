# Mock Interview - iGaming Toy Ledger Kata

Status: local-only practice artifact
Source CSV: `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/igaming_practice/senior-lead-fullstack-igaming-practice/interview_quiz.csv`
Boundary: no real-money gambling, no live payment provider, no service-role key handling, no public endpoint

## Interview Goal

Use this pack to rehearse a senior/lead full-stack interview for an iGaming-style ledger role without building or operating a real gambling product. The evaluation focuses on engineering judgment: double-entry accounting, webhook idempotency, concurrency, realtime timing, secret handling, and observability.

## Scoring Rubric

- 0: misses the core risk or suggests direct mutation without audit trail.
- 1: names the risk but gives no implementation detail.
- 2: gives a workable implementation but misses an important operational guard.
- 3: gives a practical answer with tradeoffs, failure modes, and verification.

Passing target: average score `2.5+` with no `0` on security, idempotency, or concurrency.

## Questions And Strong Answers

### 1. Ledger

Question: Why should wallet balance not be directly edited without ledger entries?

Strong answer:
Wallet balance should be derived from append-only ledger entries so every balance change has an audit trail. Direct edits break reconciliation, hide bugs or abuse, and make disputes hard to investigate. Corrections should be posted as reversal or adjustment transactions with balanced debit/credit entries, metadata, operator/source identity, and audit events.

Pass signals:
- Mentions auditability and reconciliation.
- Mentions append-only history.
- Mentions reversals/adjustments instead of editing balances.

Red flags:
- Suggests updating a balance column directly as the source of truth.
- Ignores dispute investigation or accounting traceability.

### 2. Idempotency

Question: How do you handle the same payment webhook arriving twice?

Strong answer:
Use a provider-scoped idempotency key or event id with a unique constraint. The first valid webhook posts exactly one balanced ledger transaction. Replays return a duplicate-safe response pointing to the existing transaction and do not post new entries. Signature, timestamp, amount, currency, and account mapping should be validated before posting.

Pass signals:
- Mentions unique idempotency key.
- Credits exactly once.
- Handles duplicate response safely.
- Validates signature and timestamp before ledger mutation.

Red flags:
- Posts again because the webhook arrived again.
- Uses only in-memory dedupe in production.

### 3. Concurrency

Question: Two withdrawals arrive at the same time. How do you prevent double spend?

Strong answer:
Reserve or settle funds inside a database transaction with row-level locks, advisory locks, serializable isolation, or a single-account queue. Balance checks and ledger posting must be atomic. The second request must see the updated or reserved balance and fail safely. Record rejection audit events and expose pending-withdrawal age metrics.

Pass signals:
- Mentions transaction isolation or locking.
- Mentions reserved balance or queueing.
- Requires atomic check-and-post.
- Records rejection/observability.

Red flags:
- Checks balance before async settlement without a lock.
- Assumes frontend button disabling is enough.

### 4. Realtime

Question: When should a balance-updated event be emitted?

Strong answer:
Emit balance-updated only after the database transaction commits, preferably through an outbox/event queue so realtime clients cannot see uncommitted or rolled-back state. Clients should rehydrate from the authoritative backend and ignore stale events with sequence/version checks.

Pass signals:
- Mentions after commit.
- Mentions outbox/event queue.
- Mentions stale-event protection and rehydration.

Red flags:
- Emits before commit.
- Treats the websocket event as the source of truth.

### 5. Security

Question: Where should service-role keys live?

Strong answer:
Service-role keys belong only on the backend or trusted server runtime. They must never ship to frontend bundles, browser logs, mobile apps, screenshots, or analytics. Use environment/secret manager storage, rotate keys, restrict operational access, and mask logs. Client-facing reads/writes should go through RLS-safe anon/authenticated routes or a narrow backend API.

Pass signals:
- Backend/server only.
- Never frontend/logs.
- Rotation and scoping.
- Mentions RLS or narrow API boundary.

Red flags:
- Puts service-role key in `.env` used by frontend.
- Prints keys during debugging.

### 6. Observability

Question: Which metrics reveal payment or ledger trouble?

Strong answer:
Track duplicate webhook count, invalid signature count, stale timestamp count, unbalanced transaction rejects, pending withdrawal age, reconciliation mismatch count, provider latency, ledger posting latency, failure rate, queue depth, and balance-updated event lag. Alerts should separate provider errors, app validation rejects, and accounting mismatches.

Pass signals:
- Covers duplicate/replay metrics.
- Covers reconciliation mismatch.
- Covers withdrawal age and latency.
- Separates app/provider/accounting failure classes.

Red flags:
- Only monitors HTTP 500s.
- Has no accounting reconciliation alert.

## Practice Flow

1. Answer each question verbally in two minutes.
2. Score each answer with the rubric.
3. Write one follow-up implementation detail per weak answer.
4. Re-run the ledger kata tests:
   - balanced transaction
   - unbalanced transaction rejection
   - duplicate webhook idempotency
   - invalid signature rejection
   - stale timestamp rejection
   - withdrawal concurrency guard
5. Update the interview notes only with synthetic data.

## Current Local Test Status

- Package: `@sirinx/ledger-kata`
- Expected local test count: `6`
- Required new guards: invalid signature and stale timestamp
- Live payment provider: blocked
- Public endpoint: blocked
