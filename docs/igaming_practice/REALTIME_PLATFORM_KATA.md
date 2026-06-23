# Realtime Platform Kata

Goal: practice the realtime architecture expected from a senior/lead
full-stack developer working on high-traffic platform systems.

## Scope

This kata is local-only and does not include real game mechanics or real money.
It focuses on state delivery, consistency, and operational correctness.

## Event Types

| Event | Trigger | Consumer |
|---|---|---|
| `wallet.balance.updated` | ledger transaction posted | user UI, admin UI |
| `withdrawal.requested` | user creates withdrawal request | admin/risk queue |
| `withdrawal.settled` | simulated provider confirms payout | user UI, audit |
| `payment.webhook.duplicate` | duplicate webhook detected | metrics/audit |
| `risk.signal.created` | risk rule detects suspicious pattern | risk dashboard |
| `system.degraded` | metrics cross threshold | ops dashboard |

## Realtime Delivery Choices

### WebSocket

Use when:

- user sessions need bidirectional updates
- UI needs low-latency balance/status updates

Risks:

- connection lifecycle complexity
- auth refresh
- replay missed events

### Server-Sent Events

Use when:

- UI only needs server-to-client updates
- simpler deployment is preferred

Risks:

- not bidirectional
- proxy buffering must be configured carefully

### Polling Fallback

Use when:

- realtime connection fails
- mobile network is unstable

Risk:

- higher backend load if interval is too short

## Correct Event Order

For a ledger-backed event:

1. validate request
2. open transaction
3. apply idempotency guard
4. post balanced ledger entries
5. write audit event
6. commit transaction
7. publish realtime event after commit

Do not publish a balance update before the database commit.

## Practice Exercise

Design a local event stream for:

1. simulated deposit received
2. user balance updated
3. withdrawal requested
4. withdrawal settled
5. duplicate webhook replayed

For each event define:

- event name
- payload fields
- privacy-sensitive fields to exclude
- persistence requirement
- retry behavior
- frontend state update behavior

## Failure Drills

### WebSocket Disconnects

Expected design:

- frontend reconnects
- backend exposes last-known event cursor
- frontend rehydrates balance from authoritative API

### Out-of-Order Events

Expected design:

- event has monotonic sequence or created_at
- frontend ignores stale balance events
- backend remains source of truth

### Event Published But UI Missed It

Expected design:

- UI fetches current wallet state after reconnect
- event stream is not the only source of truth
