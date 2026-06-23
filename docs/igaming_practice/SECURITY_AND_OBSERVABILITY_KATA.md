# Security and Observability Kata

Goal: practice production-minded engineering for high-risk platform systems
without touching real gambling, real payments, or real user data.

## Defensive Security Areas

### Origin Protection

Expected answers:

- Cloudflare proxy in front of the app
- origin server only accepts traffic from trusted proxy or private network
- WAF rules for obvious malicious patterns
- rate limits on auth, wallet, webhook, and admin routes
- TLS everywhere

### Secret Handling

Expected answers:

- service-role keys only on backend
- no secrets in frontend bundles
- no secrets in logs
- environment separation
- rotation plan

### Admin Access

Expected answers:

- role-based access control
- least privilege
- audit log for admin actions
- session timeout and MFA where possible
- no shared accounts

### Webhook Security

Expected answers:

- signature verification
- timestamp tolerance
- idempotency key
- replay rejection
- structured audit event

## Observability Metrics

| Area | Metric |
|---|---|
| API | latency p50/p95/p99 |
| API | error rate by route |
| Ledger | posted transaction count |
| Ledger | rejected unbalanced transaction count |
| Ledger | reconciliation mismatch count |
| Payment | webhook duplicate count |
| Payment | webhook signature failure count |
| Withdrawal | pending withdrawal age |
| Realtime | connected clients |
| Realtime | reconnect count |
| Security | rate-limit hit count |
| Risk | suspicious pattern count |

## Incident Drill: Duplicate Deposit Webhook

### Symptom

Metrics show duplicate webhook count increasing.

### First Checks

1. confirm provider and event type
2. search audit log by idempotency key
3. verify only one ledger transaction was posted
4. check webhook signature status
5. check retry pattern and source IP

### Expected Resolution

- duplicate event is marked safe
- no double credit
- audit trail links both webhook attempts to one ledger transaction
- alert severity depends on whether duplicate was safely handled

## Incident Drill: Ledger Mismatch

### Symptom

Reconciliation job reports wallet balance mismatch.

### First Checks

1. freeze affected account from new withdrawals in the toy system
2. export ledger entries for the account
3. recompute balance from entries
4. compare with wallet snapshot
5. identify missing or duplicate transaction

### Expected Resolution

- do not edit old ledger entries
- post correction/reversal transaction
- write incident report
- add regression test

## What Not To Do

- do not print secrets to debug
- do not bypass auth for convenience
- do not disable rate limits during incident
- do not manually edit balances without ledger entry
- do not delete audit logs
- do not make unverified public compliance claims
