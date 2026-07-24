# B3 Route Parity Plan

Status: `STATIC_INVENTORY_READY / IMPLEMENTATION_RESOURCE_HOLD`

Date: 2026-07-21 (Asia/Bangkok)

This is the L3 plan for `MASTER_PLAN.md` item B3. It freezes the source and
target route inventory, separates functional overlap from exact contract
parity, and selects the first reversible vertical slice. It does not claim that
any legacy route has been ported.

## Admission truth

- Canonical target: `/Users/sirinx/SIRINXDev/sirinx-co`
- Target branch: `agent/b1-b2-command-center`
- Target snapshot: `1f05814c3e9d173e525234d69b3ce7f2d1b01a57`
- Target route source SHA-256:
  `321638a84620b47881c8da17013f697a7fe1b9867ce199b933aa03e878dc71ac`
- The target count covers registrations in `sirinx-web/src/lib.rs` only. The
  target worktree is dirty and `main.rs` differs from the target commit, so this
  inventory is not runtime-surface proof.
- Current free-space samples are below the absolute 15 GiB workload floor.
- `resource_cleanup` is `HOLD`; no cleanup grant, executor, or replay ledger
  exists.
- Builds, installs, migrations, database start, external connections, provider
  calls, sends, push, merge, and deploy therefore remain out of scope.

Only bounded static inspection and this documentation update are admitted in
the current state.

## Frozen source snapshots

| Source | Canonical audit snapshot | Observed local snapshot | Result |
| --- | --- | --- | --- |
| `automation-system-backend` | `2e3dae794cd0d09978972d3c8df0420d55d15ce0` | same, clean `main` | 25 public-gateway declarations |
| `sirinx` | `48a93d375815e13671899329dcfa9dc7c6b9c3e9` | `41dced72faae5536269f097c25626ffe004374a2`, clean `main` | 28 tRPC procedures plus one OAuth callback |

The `sirinx` checkout has advanced since `REPO_AUDIT_AND_MERGE_MAP.md`. The
procedure/callback declaration set is unchanged, but `server/routers.ts` bytes
and handler semantics differ. The historical audit snapshot remains the B3
source authority; the observed checkout has only an operation-set match and
later semantics must be reviewed as a separate intake.

## Parity definitions

- `EXACT`: method/protocol, path or procedure name, authentication, request,
  response, persistence, errors, and side effects match.
- `OVERLAP_ONLY`: similar business purpose, but one or more contract dimensions
  differ. This never counts as ported.
- `SAFE_REPLACEMENT_PLANNED`: selected for a bounded, redacted replacement
  after admission. Even after implementation it receives zero exact-parity
  credit because the legacy response exposes a broader row shape.
- `HOLD_AUTH_DATA`: authentication, authorization, or durable data contract is
  missing in the target.
- `HOLD_EFFECT`: provider, notification, execution, integration mutation, or
  another externally observable effect needs the shared Authority Kernel and a
  separate action grant.
- `HOLD_SECURITY`: the legacy contract is unsafe to copy literally.
- `HOLD_PRIVACY`: the legacy behavior conflicts with the target's consent-safe
  analytics contract.

## Target inventory

`crates/sirinx-web/src/lib.rs` currently registers 10 routes: two HTML pages
and eight API/probe routes.

| ID | Target route | Current purpose |
| --- | --- | --- |
| T01 | `GET /` | home page |
| T02 | `GET /thaimart-sirinx` | Thaimart landing page |
| T03 | `GET /health` | liveness |
| T04 | `GET /metrics` | Prometheus lead/event counters |
| T05 | `GET /api/packages` | energy package catalogue |
| T06 | `POST /api/roi` | ROI pre-screen |
| T07 | `POST /api/leads` | create a consent-bearing lead |
| T08 | `PATCH /api/leads/:id/status` | guarded lead-state transition |
| T09 | `DELETE /api/leads/:id` | remove a draft lead |
| T10 | `POST /api/events` | consent and allowlist-gated analytics intake |

## `automation-system-backend` gateway inventory

Source: `backend/api-gateway.js` at the frozen commit. The direct services add
29 secondary declarations, but they are not proven public gateway contracts;
they stay quarantined below this table.

| ID | Legacy route | Disposition | Reason / target overlap |
| --- | --- | --- | --- |
| A01 | `GET /health` | `OVERLAP_ONLY` | T03 payload and service semantics differ |
| A02 | `POST /api/v1/auth/login` | `HOLD_SECURITY` | legacy JWT fallback secret must not be copied |
| A03 | `POST /api/v1/auth/logout` | `HOLD_AUTH_DATA` | no target web-session contract |
| A04 | `POST /api/v1/workflows` | `HOLD_AUTH_DATA` | workflow model and owner authorization absent |
| A05 | `GET /api/v1/workflows` | `HOLD_AUTH_DATA` | workflow repository and authorization absent |
| A06 | `GET /api/v1/workflows/:id` | `HOLD_AUTH_DATA` | workflow repository and authorization absent |
| A07 | `PUT /api/v1/workflows/:id` | `HOLD_AUTH_DATA` | workflow repository and authorization absent |
| A08 | `DELETE /api/v1/workflows/:id` | `HOLD_AUTH_DATA` | workflow repository and authorization absent |
| A09 | `POST /api/v1/workflows/:id/execute` | `HOLD_EFFECT` | execution needs durable claim and action grant |
| A10 | `GET /api/v1/executions` | `HOLD_AUTH_DATA` | execution model and authorization absent |
| A11 | `GET /api/v1/executions/:id` | `HOLD_AUTH_DATA` | execution model and authorization absent |
| A12 | `GET /api/v1/analytics/metrics` | `OVERLAP_ONLY` | T04 exposes different aggregate semantics |
| A13 | `POST /api/v1/analytics/query` | `HOLD_SECURITY` | legacy service executes caller-supplied SQL |
| A14 | `GET /api/v1/analytics/events` | `HOLD_AUTH_DATA` | protected query contract is absent |
| A15 | `GET /api/v1/analytics/trends` | `HOLD_AUTH_DATA` | protected aggregate contract is absent |
| A16 | `POST /api/v1/dashboards` | `HOLD_AUTH_DATA` | dashboard model and authorization absent |
| A17 | `GET /api/v1/dashboards` | `HOLD_AUTH_DATA` | dashboard repository and authorization absent |
| A18 | `GET /api/v1/dashboards/:id` | `HOLD_AUTH_DATA` | dashboard repository and authorization absent |
| A19 | `PUT /api/v1/dashboards/:id` | `HOLD_AUTH_DATA` | dashboard repository and authorization absent |
| A20 | `DELETE /api/v1/dashboards/:id` | `HOLD_AUTH_DATA` | dashboard repository and authorization absent |
| A21 | `POST /api/v1/integrations/github` | `HOLD_EFFECT` | OAuth/secret/provider mutation requires authority |
| A22 | `GET /api/v1/integrations/github` | `HOLD_AUTH_DATA` | authenticated redacted status contract absent |
| A23 | `DELETE /api/v1/integrations/github` | `HOLD_EFFECT` | integration mutation requires authority |
| A24 | `POST /api/v1/integrations/api` | `HOLD_EFFECT` | credential/integration mutation requires authority |
| A25 | `GET /api/v1/integrations/api` | `HOLD_AUTH_DATA` | authenticated redacted status contract absent |

Quarantined direct-service declarations:

| Service file | Declarations | Why it is not a B3 public contract |
| --- | ---: | --- |
| `backend/automation-service.js` | 9 | gateway prefix forwarding does not match the direct paths |
| `backend/analytics-service.js` | 7 | includes caller-SQL behavior and different paths |
| `backend/github-integration-service.js` | 4 | provider/OAuth effects and path mismatch |
| `backend/codex-integration-service.js` | 9 | paid/provider-style code generation surface, not gateway-exposed |

## `sirinx` API inventory

The API is tRPC under `/api/trpc`, plus one Express OAuth callback. It is not a
REST gateway, so matching business nouns do not imply exact parity.

| ID | Legacy operation | Disposition | Reason / target overlap |
| --- | --- | --- | --- |
| S01 | `system.health` | `OVERLAP_ONLY` | T03 uses a different protocol and response |
| S02 | `system.integrationHealth` | `HOLD_SECURITY` | public configuration-readiness disclosure needs a new redacted contract |
| S03 | `system.notifyOwner` | `HOLD_EFFECT` | external notification requires message authority |
| S04 | `auth.me` | `HOLD_AUTH_DATA` | no target web-session contract |
| S05 | `auth.logout` | `HOLD_AUTH_DATA` | no target web-session contract |
| S06 | `lead.submit` | `OVERLAP_ONLY` | T07 has a different DTO, UUID, consent, and no notification effect |
| S07 | `lead.list` | `HOLD_AUTH_DATA` | admin authorization and list repository absent |
| S08 | `lead.getById` | `HOLD_AUTH_DATA` | admin authorization and safe projection absent |
| S09 | `lead.update` | `OVERLAP_ONLY` | T08 only advances status and intentionally omits notes |
| S10 | `lead.stats` | `OVERLAP_ONLY` | T04 has only coarse counters |
| S11 | `blog.list` | `SAFE_REPLACEMENT_PLANNED` | public, read-only, published-only listing |
| S12 | `blog.getBySlug` | `SAFE_REPLACEMENT_PLANNED` | public, read-only, published-only lookup |
| S13 | `blog.adminList` | `HOLD_AUTH_DATA` | drafts require admin authorization |
| S14 | `blog.getById` | `HOLD_AUTH_DATA` | drafts require admin authorization |
| S15 | `blog.create` | `HOLD_AUTH_DATA` | author identity, write model, and authorization absent |
| S16 | `blog.update` | `HOLD_AUTH_DATA` | write model and authorization absent |
| S17 | `blog.delete` | `HOLD_AUTH_DATA` | write model and authorization absent |
| S18 | `project.list` | `HOLD_AUTH_DATA` | public read model and repository are not yet defined |
| S19 | `project.adminList` | `HOLD_AUTH_DATA` | admin authorization and repository absent |
| S20 | `project.create` | `HOLD_AUTH_DATA` | write model and authorization absent |
| S21 | `project.update` | `HOLD_AUTH_DATA` | write model and authorization absent |
| S22 | `project.delete` | `HOLD_AUTH_DATA` | write model and authorization absent |
| S23 | `analytics.trackPageView` | `HOLD_PRIVACY` | T10 intentionally rejects generic page views without the closed allowlist |
| S24 | `analytics.trackEvent` | `OVERLAP_ONLY` | T10 covers only consented allowlisted events and uses a different DTO |
| S25 | `analytics.pageViews` | `HOLD_AUTH_DATA` | admin query/aggregation contract absent |
| S26 | `analytics.events` | `HOLD_AUTH_DATA` | admin query/aggregation contract absent |
| S27 | `chatbot.chat` | `HOLD_EFFECT` | remote LLM invocation needs provider authority; fallback is not exact parity |
| S28 | `contact.list` | `HOLD_AUTH_DATA` | admin authorization and contact repository absent |
| S29 | `GET /api/oauth/callback` | `HOLD_EFFECT` | OAuth/provider/secret path requires separate connector authority |

## Current parity result

- Gateway source declarations: 25.
- Legacy `sirinx` operations: 29.
- Total frozen source operations: 54.
- Target registrations: 10, of which eight are API/probe routes.
- Exact source-to-target response-contract parity: 0 of 54.
- Functional overlap exists for health, lead intake/status, event intake, and
  coarse metrics, but it does not satisfy B3's definition of done.
- B3 remains queued. `route inventory diff = empty` is not claimed.

## Machine-readable inventory guard

The static accounting is mirrored in:

- `config/route-parity/b3-route-inventory.v1.json`;
- `schemas/route-parity/b3-route-inventory.v1.schema.json`;
- `scripts/validate-b3-route-inventory.mjs`;
- `scripts/validate-b3-route-inventory.test.mjs`.

The validator uses fixed canonical realpaths and fixed lowercase commit IDs. It
reads authority bytes only with bounded `/usr/bin/git cat-file blob` calls,
disables lazy fetch, passes no user-controlled repository/ref/path argument,
does not import legacy source, and performs no write, install, build, checkout,
database, network API, provider, message, or deploy action. It separately hashes
the observed worktree files so current drift cannot silently replace the
historical authority.

The successful result is deliberately named
`STATIC_INVENTORY_VALIDATED_NOT_PARITY`. Exit zero proves only that the 54-row
ledger, ten scoped `lib.rs` registrations, historical blobs, operation sets,
classification histogram, and all-false authority/completion flags agree. It
does not prove runtime availability, semantic parity, B3 completion, or
production readiness. The initial bounded suite passes 11 of 11 tests; full
repository and runtime verification remain resource-held.

## First vertical slice: public blog reads

After resource admission is restored, implement exactly:

1. `GET /api/blog?category=<optional>&limit=<1..100>&offset=<0..>`
2. `GET /api/blog/:slug`

Contract requirements:

- return only `published = true` records;
- default `limit = 20`, maximum `100`, default `offset = 0`;
- stable newest-first ordering with an ID tie-breaker;
- validate slug and return 404 for missing, draft, or invalid lookups without
  revealing which case occurred;
- never return `authorId`, draft metadata, or internal storage errors;
- no admin write route, auth implementation, provider call, notification,
  workflow execution, or external connection in this slice;
- MemoryStore and PostgresStore must implement the same read-only repository
  behavior before the slice is called complete.

Expected ownership:

- `crates/sirinx-core`: closed public blog DTOs and validation;
- `crates/sirinx-store`: read-only list/by-slug trait plus Memory/Postgres parity;
- `crates/sirinx-web`: the two handlers and direct Axum tests;
- `SYSTEM_SCHEMA.md`: API and storage truth;
- one additive migration only after migration ordering is coordinated.

Migration 0007 is reserved for the shared Authority Kernel. B3 must not create a
different `0007`, silently renumber an existing migration, or add a later
migration before the migration owner freezes the ordering.

## Validation gate

Run only after a fresh free-space sample is at or above the relevant threshold:

1. focused core/store/web unit and Axum contract tests;
2. format and warnings-denied Clippy for owned crates;
3. empty and prior-state disposable Postgres migration tests, including
   published-only and draft-leakage negatives;
4. full repository verification at the conservative full-chain resource target;
5. independent review of auth, privacy, SQL bounds, DTO closure, and rollback.

The implementation is not complete until all five are evidenced against the
same snapshot. Static inventory, source folder presence, or a route registration
alone is not completion evidence.

## Rollback

Keep the slice in one bounded commit. Rollback is a revert of that commit plus
the reviewed down/restore procedure for its additive schema. No data deletion,
external send, provider call, or gate transition belongs in the rollback path.

## Next safe action

Remain on resource `HOLD`. Obtain fresh one-target cleanup evidence and a
separate exact human cleanup grant only after the cleanup authority/replay/
executor gates exist. Once capacity is restored, remeasure, reconcile file
ownership in the dirty worktree, freeze migration ordering, and implement the
two-route public blog slice.
