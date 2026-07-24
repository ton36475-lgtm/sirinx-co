# B10.1 Compatibility Quarantine Plan

Status: `STATIC_INVENTORY_VALIDATED / RUNTIME_NOT_QUARANTINED / RESOURCE_HOLD`

This plan freezes the negative boundary that must land before migration 0007
or any MCP, A2A, provider, Telegram, LINE, Cloudflare, model, or deploy canary.
It is not runtime remediation and it is not authority.

## Current verified risk

The working-tree compatibility paths can currently reinterpret legacy state as
authority:

- Rust `POST /api/actions` returns `executed:true` when a legacy gate is open,
  although no executor exists.
- Rust `POST /api/a2a/sync` registers an untrusted caller card before a fallible
  pending-work read, then can disclose work and route data.
- Rust `POST /api/pending-work` performs an ungated queue insert; Postgres can
  emit `pg_notify` for that insert.
- Rust `POST /api/leads` also enqueues follow-up work through the same Store,
  bypassing a quarantine applied only to the control-plane queue route.
- Rust `/ready` can report Telegram live admission from a configured bearer,
  selected Postgres backend, and open legacy gate without migration 0007.
- Node `POST /api/a2a-sync/plan` with `dryRun:false` can call the Telegram sender
  after bearer and process-local idempotency checks.
- Node OmniRoute non-dry-run handshake and activation routes, exported status
  functions, Hermes probe, and CenterBrain projections can perform loopback
  status/gate reads without durable connector or A2A authority.
- Telegram `POST /send` and direct sender/helper calls can reach the Bot API
  after legacy readiness. An injected in-process test gate can also be treated
  as authoritative by the current composition seam.
- Telegram config/readiness helpers plus health/status/webhook routes can
  project `liveSendReady` from the same legacy or injected evidence.
- The Telegram operator guide still documents the legacy open-and-send flow.

These are compatibility facts, not proof that any service is currently
running, reachable, connected, or sending.

## Frozen refusal

Every surface classified `SHARED_REFUSAL_REQUIRED` must return HTTP 503 using
exactly:

- `config/agent-runtime/durable-authority-unavailable.v1.json`
- `schemas/agent-runtime/durable-authority-unavailable.v1.schema.json`

The response is closed, carries the review-pinned A27 domain-separated manifest
digest, and fixes every authority/effect flag to `false`. The blocker order is
part of the contract. Bearer authentication, an idempotency key, an open legacy
gate, caller-reported A2A presence, an injected test gate, or a structurally
valid A27 preview cannot change it.

This HTTP refusal does not apply to the
`DERIVED_EFFECT_SUPPRESSION_REQUIRED` lead enqueue. That boundary preserves the
excluded primary lead write and prevents only the derived queue effect before
its Store call; it must not return 503 before or after committing the lead.

## Runtime insertion order after resource admission

1. Add one pure refusal constructor in Rust and one in Node, with a shared JSON
   fixture proving byte-for-field parity.
2. Point Rust action, A2A sync, and A2A route registrations at a no-extractor
   503 handler. This must happen before JSON extraction, gate reads, peer
   registration, pending-work reads, or route selection.
3. Refuse live Node A2A plans before bearer/idempotency state, plus add direct
   function guards before status or sender calls.
4. Refuse non-dry-run OmniRoute handshake and activation before any Hermes or
   control-plane probe.
5. Refuse Telegram live HTTP sends before auth/idempotency state and guard the
   direct sender before durable-gate or provider fetches. Helpers inherit the
   same refusal.
6. Quarantine direct Rust pending-work writes under `QUEUE_MUTATION`. For the
   public lead route, preserve the explicitly excluded primary lead write but
   suppress the derived follow-up enqueue before `insert_pending_work`; do not
   return a route-entry or post-write 503 that creates lead retry ambiguity.
   Keep emergency legacy `HOLD` available, but make `OPEN` non-authoritative.
7. Rewrite readiness/status projections so they never report durable admission,
   registration, routing, or live-send readiness while migration 0007 is absent.
8. Replace the stale Telegram live-runbook section with the refusal workflow.

## Required negative proof

- For every `SHARED_REFUSAL_REQUIRED` surface, correct bearer, bounded
  idempotency key, open persisted legacy gate, injected open gate, and forged
  A27 preview all produce the exact same refusal.
- Before that shared refusal, no store gate read, idempotency insertion, peer registration, pending-work
  read/write, route selection, Hermes probe, control fetch, sender, provider
  fetch, effect claim, queue mutation, or external write occurs.
- Rust and Node responses validate against the same strict schema with no
  unknown fields and no secret, ticket, target, endpoint, or message echo.
- Dry-run and explicitly non-authoritative status views remain non-mutating.
- `GET /api/a2a/card` may remain a self-description only; it cannot become
  trust, admission, heartbeat, registration, or route authority.
- `POST /api/leads` is the explicit exception to the no-write rule: it may
  create the primary lead, but the derived pipeline must not call
  `insert_pending_work`; its response must not claim the follow-up queue was
  admitted or created.

## Scope and non-proof

The machine inventory accompanying this plan covers the B10.1-designated Rust
action/A2A/queue/readiness (including the public lead flow's follow-up queue
insert), Node A2A/OmniRoute/CenterBrain-to-Telegram, and Telegram send/readiness
families plus their direct-call bypasses, the Codex bridge consumer, and tests.
The closed inventory has 39 surfaces and 28 exact
source/test/store/migration/documentation byte pins. The validator independently
discovers matching scoped Rust method/path/handler bindings, Node/Telegram
method/path bindings, and exported functions; it also rejects duplicate JSON
keys and applies both strict Draft 2020-12 schemas in the canonical path.
Seventeen focused tests cover the static packet.

This is not a claim that every effect in the monorepo has been audited. The
lead's primary record write, analytics writes, approval-evidence writes, deploy
tooling, migrations, and unrelated services remain governed by their own
tickets and reviews.

No runtime source, route, gate, database, process, provider, network, message,
or external system is changed by this static packet. Runtime work remains held
until a fresh filesystem sample clears the 15 GiB implementation floor.
