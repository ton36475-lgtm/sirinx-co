# Risk Register

- No external writes allowed without approval
- No provider calls without explicit gate
- Resource admission remains HOLD below the 15 GiB workload floor.
- Migration 0007, trusted clock, attested human issuance, replay/claim,
  durable `REQUESTING`, and per-executor RLS are absent.
- Legacy `/api/actions`, `/api/a2a/*`, and Telegram sender surfaces have not
  migrated to the A27 v2 authority contract and cannot count as managed proof.
- LINE and customer messaging have no A27 binding; cross-channel relabeling is
  rejected.
