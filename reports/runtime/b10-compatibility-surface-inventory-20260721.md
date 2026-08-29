# B10.1 Compatibility Surface Inventory Evidence

Status: `VERIFIED_STATIC_INVENTORY_ONLY / RUNTIME_NOT_QUARANTINED / RESOURCE_HOLD / PRODUCTION_HOLD`

Date: 2026-07-21 (Asia/Bangkok)

Repository baseline:

- checkout: `/Users/sirinx/SIRINXDev/sirinx-co`
- branch: `agent/b1-b2-command-center`
- HEAD: `1f05814c3e9d173e525234d69b3ce7f2d1b01a57`
- working tree: dirty; every reviewed source is bound by its own byte hash

## Verified scope

This packet freezes a shared negative contract and accounts for the designated
B10.1 Rust, Node, and Telegram compatibility boundary. It does not implement a
runtime quarantine and supplies no deploy, provider, connector, MCP, A2A,
message, queue, database, or production authority.

| Evidence | Verified value |
|---|---:|
| Ordered compatibility surfaces | 39 |
| Exact source/test/store/migration/documentation pins | 28 |
| Shared 503 refusal required | 17 |
| False-authority status rewrite required | 18 |
| Derived effect suppression required | 1 |
| Legacy control restriction only | 1 |
| Data-egress review required | 1 |
| Non-authoritative status only | 1 |
| Open documentation hazards | 1 |
| Focused validator tests | 17/17 PASS |

Independent static discovery accounted for 10 Rust control
method/path/handler bindings, one Rust web method/path/handler binding, seven
Node method/path bindings, five Telegram method/path bindings, and 16 exported
function seams.

## Closed refusal contract

The frozen HTTP response for every `SHARED_REFUSAL_REQUIRED` surface is
`503 DURABLE_AUTHORITY_UNAVAILABLE`. It requires authority profile
`effect-authority-0007`, carries the A27 domain-separated manifest digest
`b2421996825817400d31f88757843225403ed2080541812c4db889e1ffe3cbb0`,
keeps all authority/effect fields `false`, rejects unknown fields, and fixes the
blocker order to:

1. `migration_0007_unavailable`
2. `durable_authority_store_unavailable`
3. `attested_human_authority_unavailable`
4. `authoritative_database_clock_unavailable`
5. `single_use_replay_ledger_unavailable`

The public lead path is deliberately different. Its excluded primary lead
write may remain, but the derived follow-up enqueue must be suppressed before
`insert_pending_work`. It must not emit a pre-write or post-write 503 that
causes retry ambiguity.

## Key risks confirmed by source accounting

- Legacy Rust action, A2A registration/routing, pending-work, readiness, and
  metrics paths can project or perform effects without migration 0007.
- The web lead handler reaches the shared pending-work store outside the
  control-plane queue route.
- Node A2A/OmniRoute/CenterBrain and the Codex bridge can project legacy
  live-send readiness or reach live composition seams.
- Telegram HTTP, direct sender, helper, readiness, webhook, and injected-gate
  seams remain legacy compatibility paths.
- `docs/TELEGRAM_CONTROL_PLANE.md` still contains the legacy gate-open and
  live-send procedure. This hazard remains intentionally open.

## Exact core hashes

| Artifact | SHA-256 |
|---|---|
| `config/agent-runtime/durable-authority-unavailable.v1.json` | `a4ada787b015edaa2653719b06343c3803695a7df2ae6a1f635729ddb7d90614` |
| `schemas/agent-runtime/durable-authority-unavailable.v1.schema.json` | `eb1d27bbfe32aaa9cd5f782262543a8b494685ab14df5a89e42386a355965533` |
| `config/agent-runtime/b10-compatibility-surfaces.plan-only.v1.json` | `fda4b84715228de6ff8e126b7c6dfbdd2a53931afc6a7da1d18453c2a4fc0787` |
| `schemas/agent-runtime/b10-compatibility-surface-inventory.v1.schema.json` | `6c1d8438901cad1b781acac558cf021b958eceaa3b6207972e312d61fcd8a68f` |
| `scripts/validate-b10-compatibility-surfaces.mjs` | `1a55d0eedc93beb041416eb5b37be0ea11014b93aa587b0d9851d1f35c083678` |
| `scripts/validate-b10-compatibility-surfaces.test.mjs` | `cd89de255bb1f49248f472205ea32c739a63768447600a8c03514effa81f2056` |
| `docs/agent-runtime/B10_COMPATIBILITY_QUARANTINE_PLAN.md` | `91744a4893599dd84e4317e773c5c8583445781a2f26bab4ae1fc7c193155904` |

## Validation receipts

- Node syntax checks: PASS for validator and focused test file.
- Canonical validator: PASS; status remained
  `STATIC_INVENTORY_VALIDATED_NOT_QUARANTINED` and every runtime/effect/
  readiness flag remained `false`.
- Focused tests: 17 passed, 0 failed.
- Two independent packet/schema reviewers: final verdict `CLEAN`.
- Independent evidence verifier: `VERIFIED` for the static packet only, using
  the frozen 39-surface / 28-pin / 17-test acceptance set.
- One disclosed non-blocking test gap remains: Telegram `/webhook` has no
  focused HTTP test; add it with runtime quarantine implementation.

## Resource and side-effect receipt

At `2026-07-21T02:37:07+0700`, a read-only filesystem sample showed
`14,507,540 KiB` available. This is `1,221,100 KiB` below the 15 GiB
implementation floor, so resource admission remains `HOLD`.

No network request, environment or secret read, process probe, database start
or write, migration, provider/model call, queue mutation, external message,
Cloudflare change, install, cleanup, commit, push, merge, or deploy occurred in
this slice.

## Next safe action

Keep all live gates held. Obtain a separately authorized, one-target resource
recovery receipt and remeasure above the implementation floor. Then implement
the shared 503 before each shared effect seam, suppress only the lead-derived
enqueue, force legacy readiness projections false, add the Telegram webhook
negative test, and replace the stale live-send runbook. Migration 0007 and any
ticketed connector canary remain later, separate gates.
