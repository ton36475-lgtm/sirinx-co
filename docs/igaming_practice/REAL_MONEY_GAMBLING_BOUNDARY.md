# Real-Money Gambling Boundary

Snapshot date: 2026-06-23

This project must not build, deploy, or operate a real-money gambling platform
or connect live payment providers unless a properly licensed operator, legal
review, compliance program, provider contracts, security controls, and
production governance are already in place.

## Directly Blocked In This Repo

Blocked actions:

- creating a live gambling product
- enabling real betting or wagering
- connecting live payment provider credentials
- processing deposits or withdrawals with real money
- signing or broadcasting crypto transactions
- bypassing KYC, AML, age checks, geofencing, tax, reporting, or provider rules
- hiding traffic, evading provider review, or disguising gambling transaction
  purpose
- deploying public player-facing endpoints
- storing real player/customer data in local practice artifacts

## Allowed Safe Alternative

Allowed for interview preparation and engineering proof:

- sandbox-only payment provider adapter design
- fake-money wallet and ledger simulation
- local webhook replay simulator
- compliance checklist
- provider onboarding readiness checklist
- risk-control design
- KYC/AML/geofence integration points as interfaces only
- audit log and incident response drills
- test cases for idempotency, double-spend, and ledger correctness

## Required Compliance Gates Before Any Live System

Any real-money platform requires these outside the coding lane:

1. Jurisdiction and license review
2. Legal entity and beneficial ownership review
3. Age verification and geofence policy
4. KYC / KYB / AML program
5. Responsible gambling controls
6. Payment provider contract that explicitly allows the use case
7. Fraud and risk-control policy
8. Data protection and privacy policy
9. Tax/reporting/accounting policy
10. Security review, penetration test, and incident response plan
11. Production change-management process
12. Independent reconciliation and audit process

## Engineering Position

The safe interview answer is:

> I can design the ledger, wallet, webhook, idempotency, realtime, observability,
> and security architecture. I will only connect live payments or enable
> real-money wagering after licensing, compliance, provider approval, security
> review, and production governance are complete.

## What To Build For The Test Instead

Build a sandbox readiness prototype:

```text
Provider Sandbox Event
  -> Signature and timestamp check
  -> Idempotency key guard
  -> Double-entry ledger transaction
  -> Audit event
  -> Realtime fake balance update
  -> Metrics and reconciliation summary
```

Everything uses test data and fake money. No real provider keys, real users,
real funds, or public endpoints are used.
