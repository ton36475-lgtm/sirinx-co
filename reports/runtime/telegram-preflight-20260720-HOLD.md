# Telegram A2A Operator Preflight — HOLD

Observed on 2026-07-20 (Asia/Bangkok) with the read-only
`npm run telegram:preflight` contract.

## Runtime identity

- `127.0.0.1:8711` is reachable but identifies as the stale Node
  `sirinx-dev-control-api`, not Rust `sirinx-control`.
- `127.0.0.1:8790` is not listening.
- `127.0.0.1:8791` is not listening.

## Admission booleans

The current process has none of the six required operator conditions:
Telegram bot token, fixed chat ID, owner IDs, exact `SEND` confirmation,
control Bearer token, or Postgres database URL. No values were read or logged.

No reviewed non-test `OPS-TG-…` ticket was found. The durable gate was not
opened, no Telegram provider call occurred, and no service process was
started or stopped.

## Next safe action

Restore the exact service topology and provision credentials through the host
secret store, then rerun `npm run telegram:preflight`. Keep `telegram_send`
held until the exact destination, message, idempotency key, and re-hold step
are reviewed under a real `OPS-TG-…` ticket.
