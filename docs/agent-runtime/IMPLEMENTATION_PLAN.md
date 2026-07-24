# 47-Role Agent Manager Implementation Plan

Status: P1 is locally complete. P2.1 has an independently verified static
candidate for the durable store and split Postgres authority. A24 also has an
independently verified HOLD-only/no-dispatch cleanup admission candidate, and
A25 adds strict Draft 2020-12 positive/negative instance parity. A26 freezes a
non-authoritative connection-evidence preview, and A27 freezes the B10.0
approval/circuit contract manifest plus pure HOLD-only Rust preview. Final
compile, Phase-B database probes, live disposable Postgres, runtime authority,
and all later phases remain pending behind resource admission.

## Scope

Deliver a production-grade, API-first manager for 47 logical Ronin roles on a
resource-constrained Mac mini M2, with Postgres authority, bounded local
execution, independent verification, A2A v1 interoperability, ticketed
Cloudflare/provider paths, and Telegram status/approval links.

## Non-goals

- starting 47 processes or model sessions;
- bulk installing public repositories;
- downloading a frontier model;
- reading protected credential/config files;
- activating a provider, Telegram live send, queue mutation, Cloudflare, push,
  merge, migration, or deploy without a separate exact ticket.

## Phases

### P0 — Truth and resource admission

- [x] Define canonical passive registry location and role-card shape.
- [x] Define production, management, background, harness, and crosswalk docs.
- [x] Define JSON Schemas for role, task, lease, run, approval, receipt, harness,
  and schedule proposal.
- [x] Complete a read-only candidate inventory and independent cleanup safety
  review; define the fail-closed one-target resource recovery contract.
- [x] Add the closed plan-only `RESOURCE_CLEANUP` v2 schemas and read-only
  preflight with exact candidate/repository binding, canonical target and
  process evidence digests, freshness, conservative reclaim, and unconditional
  `NO_GRANT / CIRCUIT_HOLD / NO_EXECUTOR` output.
- [ ] Reconcile all existing dirty/untracked candidate files and assign owners.
- [x] Add HOLD-only executable identity, action-time evidence, effect-attempt,
  and post-action receipt contracts with a pure admission evaluator that has no
  dispatch surface. The static preflight and evaluator are not runtime
  authority.
- [x] Pin Ajv 8.20.0 plus formats 3.0.1 and validate all four A24 schemas in
  strict Draft 2020-12 mode with positive, closure, format, external-reference,
  PREPARED-only, and false-PASS negatives. No package was installed.
- [x] Freeze the B10.0 generic approval-receipt v2 structural schema, ordered
  review-pinned 13-row all-HOLD action/circuit manifest, A26 plan binding, and
  pure Rust `CONTRACT_VALIDATED_NOT_AUTHORIZED` preview. This adds no SQL,
  route, authority, claim, executor, or effect.
- [ ] Coordinate one shared migration 0007 with P5a for attested-human
  verification, generic held circuits, atomic single-use grant consumption,
  effect reservation, version-aware startup admission, and per-executor RLS;
  do not create a cleanup-specific duplicate approval ledger.
- [ ] Only after that shared kernel passes disposable Postgres tests, implement
  the bounded one-target collector/executor and append-only receipt integration.
- [ ] Make the disposable harness enforce the reviewed growth margin and refuse
  `KEEP=1` during capacity recovery; remove legacy blanket auto-clean wording.
- [ ] Recover disk through separately approved, one-target, recoverable actions
  until free space satisfies both the absolute 15 GiB floor and
  `5 GiB + reviewed worst-case growth`; use 20 GiB as the conservative full
  verification target until a measured peak profile exists.

Exit: exact SHA/worktree/dirty ownership, JSON validation, resource receipt.

### P1 — Cross-language role parity

- [x] Review all 47 passive role cards plus the Kai liaison card.
- [x] Implement immutable Rust `RoninRoleCard` registry validation without changing existing coded
  agent behavior.
- [x] Add tests for exact count, unique IDs/slugs, department ranges, heads,
  implemented-role anchors, action classes, and source references.
- [x] Move the single canonical JSON artifact inside `sirinx-agents` and prove
  the Cargo package file set contains it.
- [x] Generate JS/API projections from the canonical contract; remove array-position
  inference.

Local evidence (2026-07-20): the canonical JSON is embedded from
`crates/sirinx-agents/data/ronin-role-registry.v1.json`; Cargo's offline package
listing includes that path exactly once; the typed projection has an exact
semantic round-trip test; all 78 `sirinx-agents` tests pass offline; and
targeted Clippy with warnings denied plus formatting check pass. The Node
loader, runtime cards, enterprise cards, and CLI validator consume the same
canonical path; 36 relevant Node tests pass across the registry validator,
registry projection, runtime cards, and enterprise cards. Human review also
confirmed every numbered card and Kai card contains all 22 required fields.
A packaged build or clean-checkout CI pass is not claimed by the file-list
proof alone.

Exit: Rust is executable authority; JS and docs parity tests pass.

### P2 — Durable task/run/lease core

- [x] Create expand-only migration after 0004 for tasks, runs, events, leases,
  tickets, approvals, outbox, dedupe, verification, receipts, models, peers,
  and artifacts.
- [x] Implement compare-and-swap leases, expiry, heartbeat, cancellation,
  single-writer enforcement, and ordered state transitions.
- [x] Implement append-only receipt hashing and `EFFECT_UNKNOWN` handling.
- [ ] Test on disposable Postgres from empty and prior migration states.

Pre-review evidence (2026-07-20): the initial slice passed 17 `sirinx-core` and
19 `sirinx-store` library tests, including 7 core and 14 store agent-runtime
tests, plus focused check, Clippy, formatting, diff, and static migration
checks. Those receipts do not cover the later remediation.

Independent review then returned `BLOCKED`: maker self-PASS could finalize a
run/task, the durable seam accepted only three `TaskEnvelopeV1` fields, and
zero-policy `FORCE RLS` had no proved least-privilege runtime path. The static
remediation now uses closed typed envelope validation; restricts PASS to maker
roles 37–41 and checker role 42; requires the maker to reference a prior
hash-valid checker PASS with different run, principal, and lease plus matching
task/commit/plan/scope/action; prevents checker-only task finalization; and
adds SQL top-level envelope checks, composite task/run coherence, event-state
checks, verification FK, and source-writer role bounds. Rust formatting and
static inspection pass, but compile/tests were intentionally not rerun: disk
was about 3.8 GiB during remediation and later recovered externally to about
13.6 GiB, still below the 15 GiB implementation admission threshold.
The follow-up static checker also found and drove two additional corrections:
receipt appends now freeze after a task becomes `RECEIPTED`/`SUCCEEDED`, and
source-write leases require roles 37–41 plus action class B/C in both stores.
Migration 0006 now adds an explicit least-privilege path without changing the
0005 checksum: NOLOGIN owner/app roles, exact five-table column grants, 13
command policies, ownership for all 13 tables and three identity sequences,
and conditional effective-ACL denial for Supabase `anon`, `authenticated`, and
`service_role`. `PostgresStore::connect` and the dedicated
`AgentRuntimePostgresStore::connect_runtime` are connect-only; the single
migration authority is `migrate_postgres_once`. Runtime admission rejects
wrong role membership, ownership, RLS/policy/grant drift, groundwork access,
and privileged external-role access. Independent final static verdict is
`STATIC_P2_1_VERIFIED`. The latest snapshot showed 10.114 GiB free, so the
15 GiB compile/disposable-database floor remains closed.

The existing optional legacy Postgres test returns early without
`TEST_DATABASE_URL`, so it is not live evidence. A new ignored Phase-A harness
requires an exact disposable fixture and never treats missing URLs as a pass;
it covers empty/prior-state SQL, runtime admission, permitted task insert/read,
and initial authority denials. It has not run. Full run/lease/receipt flows,
races/failure injection, connection reuse, restore, and negative-attestation
variants remain Phase B `UNVERIFIED_RESOURCE_GATE`. Tables outside the first
task/run/event/lease/receipt vertical slice remain schema groundwork.

Exit: deterministic negative tests and migration/restore evidence pass.

### P3 — Local dry-run scheduler

- [ ] Implement one coordinator plus three lane admission.
- [ ] Enforce L1 → L2 → L3 → L4 receipt order and L5 advisory behavior.
- [ ] Keep all background schedules disabled; expose plan/status only.
- [ ] Add cancellation, budget, timeout, stale lease, panic, and restart tests.

Exit: no external adapter and no source write occurs in dry-run mode.

### P4 — One maker/checker pilot

- [ ] Select one exact internal task and isolated worktree.
- [ ] Issue one maker lease and one different checker lease.
- [ ] Run focused tests and generate a receipt-bound verdict.
- [ ] Prove checker cannot edit maker-owned paths or self-approve.

Exit: one reversible local candidate completes with full evidence.

### P5 — Harness expansion

- [ ] Contract/unit/integration/security/failure-injection suites.
- [ ] Disposable Postgres migration suite including 0003–0004.
- [ ] Deterministic authenticated browser smoke.
- [ ] Exact-SHA release manifest and rollback drill.

Exit: `PASS`, `FAIL`, and `UNVERIFIED` are independently reproducible.

### P5a — Provider/model Admission Kernel and Effect Plane

- [x] Record the Mac mini hardware/resource truth and current local model
  inventory without running inference or reading credentials.
- [x] Decide GLM-5.2 and Kimi K3 are locally ineligible on this 8 GiB host;
  retain installed small Qwen models as unadmitted pilot candidates only.
- [x] Remove protected Hermes profile-config reads from the Node status path and
  collapse CodexBridge to the status contract actually implemented.
- [x] Add the closed generic approval-receipt v2 structural contract, complete
  ordered action/circuit map, and pure opaque HOLD-only preview. Keep every
  circuit/executor/effect route disabled and migration 0007 deferred.
- [x] Resolve migration 0007 persistence semantics without writing SQL: one
  shared additive kernel installs the exact 13 ordered definitions and 13 held
  circuits, seeds zero authority rows, reuses 0005 tickets/grants/outbox, and
  cannot authorize its own ticketed bootstrap.
- [ ] Before migration 0007, quarantine the legacy Rust `/api/actions`, Rust
  `/api/a2a/*`, Node A2A-to-Telegram, and Telegram `/send` compatibility paths
  behind one shared `DURABLE_AUTHORITY_UNAVAILABLE` refusal. Valid bearer auth,
  an OPEN legacy gate, an idempotency key, A2A registration, or a structurally
  valid A27 preview must not turn that refusal into authority.
- [ ] Add closed provider endpoint, model revision, principal attestation, route
  plan, external effect, effect attempt, and operator snapshot contracts.
- [ ] Add one coordinated expand-only migration 0007 for the shared Authority
  Kernel under the frozen A33 13-definition/13-held-circuit decision, with
  exact action kinds, atomic effect claims,
  version-aware startup inventory, and per-executor RLS; do not change
  migrations 0005–0006 or create a second provider/cleanup approval ledger.
- [ ] Prove admission, idempotency, grant consumption, `EFFECT_UNKNOWN`,
  least-privilege login, and restore behavior on disposable Postgres.
- [ ] Run one network-denied, tools-disabled, public-synthetic local Qwen pilot
  with an independent checker and resource receipt.

Exit: one exact local artifact is admitted by digest and measured resource
profile. No automatic remote fallback exists; all external effects remain held.

#### B10.1 compatibility refusal contract

Status: `STATIC_INVENTORY_VALIDATED / RUNTIME_QUARANTINE_NOT_IMPLEMENTED / IMPLEMENTATION_RESOURCE_HOLD`

The smallest safe post-A27 implementation is a cross-language negative boundary,
not a memory-backed or API-local approval mechanism. Effect requests on the
legacy paths return HTTP 503 with a shared closed body containing:

- `status = DURABLE_AUTHORITY_UNAVAILABLE`;
- `requiredAuthorityProfile = effect-authority-0007`;
- `authoritySource = null`;
- A27 manifest digest
  `b2421996825817400d31f88757843225403ed2080541812c4db889e1ffe3cbb0`;
- `authorized`, `executed`, `providerCalled`, `externalWrites`, and
  `claimCreated` all `false`;
- blockers for absent migration 0007, authority store, attested human authority,
  database clock, and replay ledger.

Dry-run and status-only behavior may remain non-mutating. Tests must prove that
no sender, provider, fetch, effect claim, registration, or route result can
reinterpret bearer authentication, legacy gate state, A2A presence, or the A27
structural preview as durable authority. Implementation starts only after a
fresh resource sample clears the implementation threshold.

The static B10.1 packet now freezes the exact refusal instance/schema and a
review-pinned inventory of the designated compatibility boundary:

- 39 HTTP, direct-function, helper, status, legacy-control, and composition
  surfaces across Rust control/web queue, Node A2A/OmniRoute/CenterBrain, and
  Telegram;
- 28 exact working-tree source/test/store/migration/documentation byte pins;
- 17 entries requiring the shared refusal, 18 status projections requiring a
  false-authority rewrite, one derived enqueue requiring suppression while the
  primary lead write is preserved, one restrictive-only legacy control route,
  one data egress review, and one non-authoritative self-card allowance;
- one open documentation hazard: the Telegram guide still describes the
  legacy gate-open and live-send workflow;
- one local static validator plus 17 focused Node tests, including strict Draft
  2020-12 instance validation, duplicate-key rejection, independent scoped
  method/path/handler route discovery, export discovery, and negative
  authority-promotion cases.

Artifacts are
`config/agent-runtime/{durable-authority-unavailable.v1.json,b10-compatibility-surfaces.plan-only.v1.json}`,
`schemas/agent-runtime/{durable-authority-unavailable.v1.schema.json,b10-compatibility-surface-inventory.v1.schema.json}`,
`scripts/validate-b10-compatibility-surfaces.{mjs,test.mjs}`, and
`docs/agent-runtime/B10_COMPATIBILITY_QUARANTINE_PLAN.md`. The evidence receipt
is `reports/runtime/b10-compatibility-surface-inventory-20260721.md`.

This is accounting and contract evidence only. The current runtime paths are
still unquarantined, current legacy live-success tests still describe reachable
effect seams, and every implementation/authority/MCP/A2A/send/provider/queue/
production flag remains false.

### P5b — MCP and connection admission

- [x] Add a closed 16-entry plan for Cloudflare MCP, Codex, Claude/Cowork,
  Kimi, Hermes, LINE MCP, Telegram/LINE transports, and four A2A peers with
  every entry disabled, deny-all, and runtime-unverified.
- [x] Add a static loader that rejects enablement, duplicate IDs, insecure
  endpoints, un-ticketed effects, unknown fields, and network/process-start
  primitives.
- [x] Add the no-I/O Connection Evidence Admission Preview. Bind exact peer,
  principal, revision/license, endpoint/card/capability/data-ceiling,
  observation/expiry, task/run/lease/receipt digests; reject caller-authored
  readiness booleans; return only `EVIDENCE_VALIDATED_NOT_ADMITTED` with every
  connect/MCP/A2A/send flag false.
- [ ] Admit exact client/server/package revisions and reconcile Kimi's installed
  version before any upgrade proposal.
- [x] Define structural approval-receipt v2 plus held `connector_activation`
  and `a2a_egress` rows in the review-pinned A27 manifest; this grants no
  durable authority and exposes no route or executor.
- [ ] Implement durable v2 issuance/consumption plus database-backed
  `connector_activation` and `a2a_egress` circuits; current v1 and A27 static
  validation cannot authorize either action.
- [ ] Build a local documentation-only Cloudflare remote MCP preview with
  server-side OAuth and deny-all tools; no deploy or OAuth consent.
- [ ] Pass independent MCP auth/input/tool-boundary review and A2A TCK/security
  negatives before any single-client or single-peer canary.

Exit: one public-docs MCP client canary and one authenticated A2A peer canary
have separate exact receipts. Telegram/LINE, paid tools, Cloudflare mutation,
and all other peers remain held.

### P6 — A2A v1 adapter

- [ ] Quarantine and review an exact official SDK revision.
- [ ] Implement Agent Card trust, auth, task mapping, streaming order,
  idempotency, versioning, and SSRF defenses.
- [ ] Pass the A2A TCK and negative tests.
- [ ] Keep current internal sync endpoints as private compatibility shims.

Exit: authenticated A2A v1 conformance evidence; no live peer activation.

### P7 — Cloudflare private-dev lane

- [ ] Implement local preview contracts for Worker/Agent/DO, Queues/DLQ,
  Workflows, Access, Hyperdrive, and rollback.
- [ ] Prove provider-disabled preview makes zero paid calls.
- [ ] Use one DO/Agent per `org_id:task_id`; Postgres stays authoritative.
- [ ] Deploy only with a private-dev ticket bound to an exact SHA/account scope.

Exit: private canary and rollback evidence; all production flags remain held.

### P8 — Telegram and release chain

- [ ] Dry-run fixed-destination/auth/idempotency/approval-link tests.
- [ ] One ticketed synthetic Telegram canary with delivery read-back.
- [ ] Billing Lock → CI → disposable migrations → authenticated browser smoke →
  independent review → merge ticket → per-service deploy tickets.

Exit: all exact-SHA receipts pass; operator may decide whether to declare
production-complete.

## File ownership for implementation

| Area | Primary files | Maker | Checker |
|---|---|---|---|
| Role contract | `crates/sirinx-agents` + passive registry | L4-37 | L4-42 |
| Database | `crates/sirinx-store` + migrations | L4-38 | L4-42 |
| Control/API | `crates/sirinx-control` | L4-37 | L4-42 |
| A2A/Telegram | `crates/sirinx-a2a`, adapters | L4-40 | L4-42 |
| Cloudflare | edge package/infra contracts | L4-39 | L4-42 |
| Command Center | operator UI/API client | L4-41 | L4-42 |
| Release/receipts | manifests and rollback packet | L4-43 | L4-42 |

Every row requires an exact task envelope and non-overlapping path lease before
implementation.
