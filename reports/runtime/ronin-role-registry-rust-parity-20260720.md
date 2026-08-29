# 47-Ronin Rust Registry Evidence — 2026-07-20

> Superseded for current-state decisions by
> `reports/runtime/ronin-registry-cross-language-parity-20260720.md`. This file
> preserves the earlier Rust-only checkpoint and its then-current residuals.

Verdict: `LOCAL_PASS / PRODUCTION_HOLD`

Repository baseline: `1f05814c3e9d173e525234d69b3ce7f2d1b01a57`
Branch: `agent/b1-b2-command-center`

## Implemented slice

- Added a typed Rust projection for the 47 numbered roles plus Kai.
- Raw JSON remains private; callers receive an immutable validated registry.
- Numeric department mapping is derived from `AgentId::layer()`.
- Registry identity/version, Postgres authority, three-lane policy, no-external-
  action state, department relationships, codenames, reporting chain, action
  classes, implementation anchors, principal partitions/boundaries, and Kai's
  draft-only separation fail closed.
- Unknown fields, malformed identifiers, empty required evidence, duplicate or
  missing relationships, widened boundaries, contradictory authority text,
  and other negative mutations are rejected.

## Local evidence

- `cargo test -p sirinx-agents --locked --offline`: `74 passed`.
- targeted `cargo clippy` with warnings denied: `PASS`.
- workspace formatting check: `PASS`.
- `node scripts/validate-ronin-role-registry.mjs`:
  `RONIN_REGISTRY_VALID roles=47 departments=16/9/10/8/4 cards=47 workers_max=3 external_actions=false schedules_enabled=0`.
- Free disk after validation: approximately `4.6 GiB`; resource admission for
  installs, full builds, model downloads, or disposable Postgres remains
  blocked below the 15 GiB threshold.

## Independent review

The first review rejected the initial implementation because validated state
was mutable, raw JSON was public, numeric ranges were duplicated, authority
fields were under-validated, action `X` was missing, and key negative cases
were absent. Those findings were corrected and the focused suite rerun.

## Residual risks and next gate

- `role_registry.rs` embeds `docs/agents/ronin/registry.json`, which is outside
  the crate directory. Both artifacts must land atomically, and standalone
  crate packaging is not yet proven.
- JavaScript still contains independently maintained role/principal
  projections. Cross-language parity is not complete until those are generated
  from or checked directly against the validated contract.
- `AgentId(pub u8)` remains constructible for values outside `0..=47`; registry
  lookup fails closed, but a checked runtime ID type remains a later hardening
  item.
- No provider, model, Telegram, queue, Cloudflare, Git remote, migration,
  database, merge, or deploy action occurred in this slice.

Next safe action: repair the JavaScript projection/parity contract in a
separate exact-path lease, then prove atomic packaging before starting durable
Postgres state work.
