# Ledger Metrics Checklist

Snapshot date: 2026-06-23

These metrics support the local toy ledger kata and interview preparation for
high-integrity platform systems. They are not connected to real gambling,
payment providers, crypto, or player data.

## API Health

| Metric | Why it matters |
|---|---|
| `api_latency_ms_p50` | baseline responsiveness |
| `api_latency_ms_p95` | user-impacting slow paths |
| `api_latency_ms_p99` | tail latency during traffic spikes |
| `api_error_rate` | general health |
| `rate_limit_hits_total` | abuse or runaway clients |

## Ledger Correctness

| Metric | Why it matters |
|---|---|
| `ledger_transactions_posted_total` | throughput of posted transactions |
| `ledger_unbalanced_rejected_total` | catches invalid accounting attempts |
| `ledger_reconciliation_mismatch_total` | highest-severity correctness alert |
| `ledger_entries_written_total` | expected to be at least two per transaction |
| `wallet_negative_balance_attempt_total` | catches double-spend pressure |

## Payment Webhook Sandbox

| Metric | Why it matters |
|---|---|
| `sandbox_webhook_received_total` | input volume |
| `sandbox_webhook_duplicate_total` | replay behavior |
| `sandbox_webhook_invalid_signature_total` | security signal |
| `sandbox_webhook_stale_timestamp_total` | replay or delayed delivery signal |
| `sandbox_webhook_unknown_event_total` | provider contract drift |

## Withdrawal Operations

| Metric | Why it matters |
|---|---|
| `withdrawal_requested_total` | request volume |
| `withdrawal_settled_total` | successful settlement count |
| `withdrawal_rejected_insufficient_balance_total` | user/account pressure |
| `withdrawal_pending_age_seconds_max` | stuck payout indicator |
| `withdrawal_duplicate_request_total` | idempotency pressure |

## Realtime Operations

| Metric | Why it matters |
|---|---|
| `realtime_connected_clients` | current load |
| `realtime_reconnect_total` | network or server instability |
| `realtime_event_publish_failure_total` | UI notification risk |
| `realtime_event_lag_ms_p95` | stale user experience |

## Alert Severity

### Page Immediately

- ledger reconciliation mismatch
- negative balance persisted
- withdrawal pending age exceeds threshold
- webhook invalid signature spike
- API error rate spike on wallet/ledger routes

### Investigate During Business Hours

- duplicate webhook increase with safe handling
- mild realtime reconnect increase
- unknown sandbox event type from a test provider
- rate-limit hit increase without user impact

## Incident Note Template

```text
Incident:
Detected at:
Metric/alert:
Affected test account:
Ledger transaction IDs:
Idempotency key:
Current balance from ledger:
Current balance from snapshot:
Action taken:
Regression test added:
Follow-up owner:
```

## Interview Talking Point

For a financial ledger, a green API health dashboard is not enough. You need
business correctness metrics: reconciliation mismatch, duplicate webhooks,
pending withdrawal age, rejected unbalanced transactions, and negative-balance
attempts.
