# Shared Authority Contract Manifest — A27 Static Receipt

Status: `VERIFIED_HOLD_ONLY / CONTRACT_VALIDATED_NOT_AUTHORIZED / PRODUCTION_HOLD`

Date: 2026-07-20 (Asia/Bangkok)

This receipt covers the local B10.0 contract-only slice. It does not prove a
durable authority kernel, an open circuit, an executable grant, a connected MCP
or A2A peer, a live messaging channel, or production readiness.

## Delivered boundary

Added or hardened:

- `config/agent-runtime/action-circuits.plan-only.v1.json`
- `schemas/agent-runtime/action-circuit-registry.v1.schema.json`
- `schemas/agent-runtime/approval-receipt.v2.schema.json`
- `schemas/agent-runtime/effect-authority-preview.v1.schema.json`
- `crates/sirinx-core/src/effect_authority.rs`
- `services/dev-control-api/src/authority-kernel-contract.test.mjs`

The ordered manifest contains exactly 13 action/circuit/effect/executor rows.
Every row is fixed to:

```text
circuitState      = HOLD
effectState       = PREPARED
enabled           = false
executorAvailable = false
routeRegistered   = false
```

The review-pinned, domain-separated manifest digest is:

```text
b2421996825817400d31f88757843225403ed2080541812c4db889e1ffe3cbb0
```

Connected receipt evidence is also pinned to the A26 disabled connection plan:

```text
51bb41ec38c1472c1ec0684cc6668591cebc3d58a05747d112d1917eecb046d1
```

Changing the manifest, reordering rows, substituting a channel, or changing
either digest fails closed.

## Closed action map

| Action | Class | Circuit | Effect profile | State |
|---|---:|---|---|---|
| `INSTALL` | D | `install` | `INSTALL` | HOLD |
| `RESOURCE_CLEANUP` | C | `resource_cleanup` | `RESOURCE_CLEANUP` | HOLD |
| `CONNECTOR_ACTIVATION` | D | `connector_activation` | `CONNECTOR_ACTIVATION` | HOLD |
| `PROVIDER_CALL` | D | `provider_call` | `PROVIDER_CALL` | HOLD |
| `QUEUE_MUTATION` | D | `queue_mutation` | `QUEUE_MUTATION` | HOLD |
| `A2A_EGRESS` | D | `a2a_egress` | `A2A_EGRESS` | HOLD |
| `LIVE_SEND` | D | `telegram_send` | `TELEGRAM` | HOLD |
| `LIVE_SEND` | D | `customer_messaging` | `CUSTOMER_MESSAGING` | HOLD/unbound |
| `PUSH` | D | `push` | `PUSH` | HOLD |
| `MERGE` | D | `merge` | `MERGE` | HOLD |
| `PRODUCTION_MIGRATION` | D | `production_migration` | `PRODUCTION_MIGRATION` | HOLD |
| `CLOUDFLARE_MUTATION` | D | `cloudflare_mutation` | `CLOUDFLARE_MUTATION` | HOLD |
| `DEPLOY` | D | `deploy` | `DEPLOY` | HOLD |

LINE remains explicitly unbound. Customer messaging is also rejected until a
reviewed channel-specific contract exists. Telegram receipts require the exact
`telegram-bot-transport` connection, `target://telegram/` target prefix, and
`live-send-scope.v2.schema.json` scope. A2A receipts require one of the four
reviewed peer IDs plus an AgentCard digest. Other action types cannot smuggle an
A2A AgentCard into their connection evidence.

`local_inference` is deliberately outside this external-effect map. It remains
a separate local model/resource admission lane and gains no authority from its
absence here. A model install still requires a separate `INSTALL` action.

## Rust authority boundary

Rust performs the semantic checks that JSON Schema alone cannot establish:

- exact review-pinned manifest and A26 connection-plan digests;
- exact ordered action/circuit/profile/class/executor binding;
- domain-separated portable receipt digest. The wire starts with
  `sirinx:approval-receipt:v2-wire:1\0`, then encodes every named field in exact
  order as big-endian 64-bit name length, UTF-8 name, big-endian 64-bit value
  length, and value bytes. Integers are canonical base-10 ASCII; optional values
  have an explicit null/present byte. `contractDigest` is excluded;
- exact `effectKey = circuitName:grantId`, preventing same-grant key switching;
- six distinct bounded principals;
- bounded candidate time window, with caller time explicitly non-authoritative;
- complete action-aware connection evidence;
- channel-specific target and scope binding.

The validated manifest and the preview fields are opaque outside the module.
Safe downstream Rust cannot mutate `enabled`, `circuitOpen`, `canExecute`, or
similar truth fields after validation. The only public preview result is:

```text
status = CONTRACT_VALIDATED_NOT_AUTHORIZED
```

All authority, circuit, grant, claim, replay, executor, connection, A2A,
provider, message, mutation, deployment, I/O, network, database-write, and
command-execution flags are fixed `false`.

## Verification performed

Local focused verification passed:

```text
Rust effect_authority tests       16 passed / 0 failed
Full sirinx-core tests            36 passed / 0 failed
Node schema/wire contract tests    5 passed / 0 failed
Node syntax                        PASS
JSON parse                         PASS
```

The shared Rust/Node approval fixture produces this exact golden digest:

```text
ae8572ec8efa464ca86e0231b5698cceea52bdc9f64d428ca8c0234003014e84
```

Draft 2020-12 supplies closed structural validation. The Node suite separately
mirrors semantic-only negatives for principal separation, time-window bounds,
deterministic effect keys, and the portable digest. Rust remains the production
semantic validator; the schema is not described as proof of database time,
principal attestation, or durable uniqueness.

Negative cases cover manifest drift, row reordering, enablement, `OPEN`,
`REQUESTING`, tuple/channel substitution, legacy lowercase actions, unknown
fields, partial connection evidence, A26 plan drift, missing A2A AgentCard,
LINE relabeling, principal overlap, deterministic-effect-key drift,
contract-digest drift, invalid candidate time, incompatible cleanup evidence,
leading-hyphen connection IDs, and every false-authority preview flag being
changed to true.

The Rust production module is source-guarded against process, network, async,
database, environment, and filesystem imports. No install was performed; the
already-workspace-pinned `sha2` crate is reused.

## Explicit non-proof and unresolved risks

- Migration `0007_agent_runtime_effect_authority.sql` does not exist and was
  not created or applied.
- There is no authoritative database clock, attested human issuer, replay
  ledger, atomic grant consumption/effect claim, durable `REQUESTING` state,
  per-executor RLS, collector, executor, or managed route.
- The existing free-form `/api/actions`, internal `/api/a2a/*`, and Telegram
  sender are pre-existing compatibility surfaces. They were not modified by
  A27 and must not be interpreted as v2 authority. They need migration or
  quarantine before managed readiness.
- `approval-receipt.v1` and the separate resource-cleanup `2.0-plan` contract
  remain unchanged; neither is silently promoted to generic v2 authority.
- The final read-only filesystem sample after verification showed
  `14,445,252 KiB` free, still `1,283,388 KiB` below the absolute 15 GiB
  workload floor.
  Disposable Postgres, full workspace verification, browser smoke, build,
  install, model work, and deploy remain unadmitted.
- No secret/config credential file was read. No provider call, external
  message, Cloudflare mutation, database write, push, merge, or deploy occurred.

## Next safe action

Restore resource admission through a separately approved recoverable action,
then design and test the single additive migration 0007 on empty and prior
disposable Postgres states. It must preserve 0005–0006, seed only held circuits,
enforce attested human-only issuance, atomic single-use claims, durable
pre-effect `REQUESTING`, least-privilege RLS, crash/restore/idempotency behavior,
and managed-startup refusal. No external executor canary is implied by A27.
