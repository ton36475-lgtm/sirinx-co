# Ledger Event Schema

Snapshot date: 2026-06-23

These events are for the local toy ledger kata only. They model realtime
platform behavior without real gambling, real payments, real crypto transfers,
or player data.

## Event Rules

1. Persist ledger/audit state before publishing an event.
2. Do not include secrets, provider credentials, or private identity documents.
3. Include a stable event ID and sequence/cursor for replay recovery.
4. Treat the database or ledger store as source of truth; realtime events are
   notifications, not authority.
5. Frontend must rehydrate current wallet state after reconnect.

## `wallet.balance.updated`

Emitted after a balanced ledger transaction changes a wallet balance.

```json
{
  "event_id": "evt-wallet-balance-001",
  "event_type": "wallet.balance.updated",
  "user_id": "alice",
  "balance_minor": 10000,
  "currency": "TEST",
  "ledger_transaction_id": "deposit:sandbox-provider:deposit-event-001",
  "sequence": 1,
  "created_at": "2026-06-23T00:00:00Z"
}
```

Privacy:

- Use internal test user IDs only.
- Do not include email, phone, ID card, bank account, wallet private key, or IP
  address.

## `withdrawal.requested`

Emitted when a withdrawal request is accepted into a pending state.

```json
{
  "event_id": "evt-withdrawal-requested-001",
  "event_type": "withdrawal.requested",
  "request_id": "withdrawal-001",
  "user_id": "alice",
  "amount_minor": 8000,
  "currency": "TEST",
  "status": "pending",
  "sequence": 2,
  "created_at": "2026-06-23T00:00:01Z"
}
```

## `withdrawal.settled`

Emitted after a sandbox withdrawal settlement posts a balanced ledger
transaction.

```json
{
  "event_id": "evt-withdrawal-settled-001",
  "event_type": "withdrawal.settled",
  "request_id": "withdrawal-001",
  "user_id": "alice",
  "amount_minor": 8000,
  "currency": "TEST",
  "ledger_transaction_id": "withdrawal:withdrawal-001",
  "status": "settled",
  "sequence": 3,
  "created_at": "2026-06-23T00:00:02Z"
}
```

## `payment.webhook.duplicate`

Emitted when a sandbox provider event is replayed and safely mapped to the
original transaction without double credit.

```json
{
  "event_id": "evt-webhook-duplicate-001",
  "event_type": "payment.webhook.duplicate",
  "provider": "sandbox-provider",
  "idempotency_key": "deposit-event-001",
  "original_transaction_id": "deposit:sandbox-provider:deposit-event-001",
  "duplicate_event_id": "evt-001-replay",
  "sequence": 4,
  "created_at": "2026-06-23T00:00:03Z"
}
```

## Reconnect Behavior

On reconnect:

1. Client sends last observed event sequence.
2. Server replays missed events if retained.
3. Client fetches current wallet snapshot.
4. Client ignores stale events with older sequence.

## Interview Talking Point

Realtime delivery must never be the only source of financial truth. The ledger
commits first; events notify the UI after commit.
