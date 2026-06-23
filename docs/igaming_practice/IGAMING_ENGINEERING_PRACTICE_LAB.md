# iGaming Engineering Practice Lab

Snapshot date: 2026-06-23

This lab converts the prior hiring poster into a safe engineering practice
track. It is for interview preparation and skill testing only. It does not
build a gambling product, game-odds engine, real payment system, crypto
transfer system, or production platform.

## Boundary

Allowed:

- local-only architecture practice
- toy ledger and wallet accounting exercises
- idempotency and race-condition tests
- simulated payment webhook handling
- realtime status update design
- defensive security and observability planning
- incident response drills

Blocked:

- real gambling operations
- odds manipulation or betting mechanics
- real money movement
- real crypto transaction signing
- bypassing KYC, AML, geofence, captcha, quota, or provider controls
- public deployment
- production payment provider integration
- customer or player data handling

## What The Job Poster Actually Tests

The poster points to six engineering areas:

1. Backend and architecture
2. Payment and ledger system
3. Frontend development
4. Infrastructure and cybersecurity
5. DevOps and CI/CD
6. Observability and monitoring

The safest way to prepare is to build a toy platform that proves discipline in
these areas without touching live gaming or money.

## Reference Practice System

Build a local "High-Integrity Wallet and Ledger Lab":

```text
Client / Admin UI
  -> API Gateway
  -> Auth and session guard
  -> Wallet service
  -> Ledger service
  -> Webhook simulator
  -> Realtime event stream
  -> Audit log
  -> Metrics and logs
```

Minimum local capabilities:

- create test account
- create wallet
- simulate deposit event
- simulate withdrawal request
- post double-entry ledger transactions
- reject duplicate webhook with idempotency key
- reject insufficient balance
- emit balance-updated event
- write audit log
- expose local metrics summary

## Data Model To Understand

Core entities:

- `account`
- `wallet`
- `ledger_account`
- `ledger_transaction`
- `ledger_entry`
- `payment_event`
- `withdrawal_request`
- `idempotency_key`
- `audit_event`
- `risk_signal`

Key invariant:

Every posted transaction must balance:

```text
sum(debit entries) == sum(credit entries)
```

Operational invariant:

The wallet balance must be derived from ledger entries or reconciled against
them. It must not be a casually mutable number with no transaction history.

## Interview-Level Questions To Practice

### Ledger

1. How do you model double-entry ledger entries?
2. How do you prevent duplicate credit from a replayed payment webhook?
3. What happens if two withdrawal requests arrive at the same time?
4. How do you reverse a mistaken transaction without deleting history?
5. How do you reconcile wallet balance against ledger entries?

### Realtime

1. What events should the frontend receive?
2. What should be persisted before an event is emitted?
3. What happens if WebSocket delivery fails?
4. How do you prevent stale balance display?

### Security

1. Where do service-role or admin keys live?
2. How do you protect the origin server behind Cloudflare?
3. What endpoints need rate limiting?
4. How do you log suspicious behavior without leaking personal data?
5. What is never allowed in frontend code?

### Observability

1. Which metrics prove payment and ledger health?
2. How do you detect stuck withdrawals?
3. What logs are needed to investigate a duplicate webhook?
4. Which alerts are urgent at 03:00?

## Practice Milestones

### Milestone 1: Architecture Whiteboard

Deliverables:

- one-page architecture diagram
- entity list
- transaction flow
- failure modes

Pass signal:

- you can explain transaction boundaries and why state is not mutated
  directly

### Milestone 2: Ledger Kata

Deliverables:

- local toy ledger service or pure function module
- tests for balanced transaction posting
- tests for duplicate idempotency key rejection
- tests for insufficient balance

Pass signal:

- tests fail before implementation and pass after implementation

### Milestone 3: Webhook Simulator

Deliverables:

- simulated deposit webhook
- idempotency guard
- replay test
- audit event output

Pass signal:

- replayed webhook returns the same safe result and does not double-credit

### Milestone 4: Concurrency Drill

Deliverables:

- two simultaneous withdrawal attempts
- one succeeds, one fails or queues safely
- final ledger remains balanced

Pass signal:

- no negative balance and no double-spend

### Milestone 5: Observability Drill

Deliverables:

- local metrics summary
- structured audit log
- incident note for duplicate webhook or stuck withdrawal

Pass signal:

- another engineer can debug the toy incident from logs and metrics

## Recommended Study Order

1. Double-entry accounting basics
2. Database transactions and isolation
3. Idempotency key design
4. Webhook replay protection
5. Redis/database locking tradeoffs
6. Realtime event delivery
7. Rate limiting and abuse prevention
8. Cloudflare/origin protection basics
9. Observability and incident response
10. Deployment and rollback safety

## Output For Hiring Test

Bring these artifacts to the test:

- architecture diagram
- ledger schema
- transaction examples
- tests proving invariants
- incident response runbook
- monitoring checklist
- short explanation of security boundaries

## Positioning In Interview

Say clearly:

> I can help build high-integrity platform, ledger, realtime, security, and
> observability systems. I will not bypass compliance, manipulate odds, hide
> access, or move real money without proper legal, product, and security
> controls.
