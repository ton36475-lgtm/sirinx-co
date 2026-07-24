# SIRINX Neural Fabric V1

Status: `SPEC_READY / IMPLEMENTATION_BLOCKED_BY_EXACT_GATE`

Mission: `SIRINX_NEURAL_FABRIC_V1_LOCAL_ONLY`

Prepared: 2026-07-23

## 1. Decision

SIRINX will use one governed event fabric to connect Hermes, coding agents,
MCP, memory, Telegram, LINE, provider routing, and verification.

This is a consolidation contract. It does not authorize runtime activation,
provider calls, live messages, service reloads, package installation, database
migration, Git publication, or deployment.

The fabric reuses existing mission, outbox, lease, receipt, policy, and
contract work. It must not create another competing orchestrator.

## 2. Authority lock

| Surface | Authority | Allowed role | Forbidden role |
|---|---|---|---|
| Human owner | final risk authority | exact HUMAN_RED approval | implicit or blanket grant |
| Telegram Commander | sole remote backend command transport | authenticated human-intent intake and status projection | grant issuer, direct executor, customer support |
| Hermes | engineering manager and workflow coordinator | plan, route, request leases, converge, request verification | system of record, product implementation, self-approval |
| Authority Kernel | sole transition and grant-issuance service | validate contracts, apply policy, issue scoped transitions/grants | operator identity, maker work, external adapter |
| PostgreSQL | sole durable system of record after admission | tasks, events, leases, grants, outbox, receipts | policy decisions or human approval |
| Claude Code | frontend maker | bounded worktree and owned paths | backend, migration, deploy |
| Codex | backend/data maker | bounded worktree and owned paths | deploy, production DB, live send |
| OpenCode | independent verifier | read-only review and tests | authoring candidate under review |
| Kimi | optional research adapter | read-only research/docs after verification | default maker or authority |
| LINE OA | customer-care channel only | verified customer ingress and governed reply draft | backend commands, agent control, provider control |
| OmniRoute | model transport adapter | route after policy and budget decision | approval, policy, state authority |
| cmux/Hermes One | operator projection | status and evidence display | runtime truth or hidden execution |

Hard topology:

```text
Human Owner
    |
    v
Telegram Commander --authenticated human intent--> Hermes Manager
                                                     |
                                                     v
                                            Authority Kernel
                                                     |
                                             PostgreSQL ledger
                                                     |
                                                     v
                                          Neural Fabric execution
                          +-------------------+-------------------+
                          |                   |                   |
                    Claude Maker          Codex Maker       OpenCode Verifier
                          |                   |                   |
                          +--------- receipts + evidence --------+
                                              |
                                              v
                                      Deterministic Guard
                                              |
                          +-------------------+-------------------+
                          |                                       |
                    Local delivery                         HUMAN_RED wait

LINE Customer --> LINE Webhook Guard --> Customer Policy --> Reply Draft/Outbox
      ^                                                            |
      +---------------- governed LINE sender after exact gate ------+
```

No worker may receive executable instructions directly from another worker.
All handoffs pass through Hermes as versioned, digest-bound artifacts.

## 3. Repository authority

| Repository | V1 role | Admission |
|---|---|---|
| `/Users/sirinx/SIRINXDev/sirinx-agent-native-os` | canonical contract, integration, test, and receipt target | `ADOPT` |
| `/Users/sirinx/sirinx-os` | source of deterministic Rust mission/outbox/lease/receipt primitives | `REFERENCE_AND_PORT` |
| `/Users/sirinx/SIRINXDev/sirinx-co` | strongest current Rust task/state/lease/receipt semantic model and store candidate | `REFERENCE_AND_PORT / QUARANTINE_LIVE_RUNTIME` |
| `/Users/sirinx/project-hermes` | prototype manager and Telegram/MCP evidence | `REFERENCE_ONLY / QUARANTINE_EXECUTION_BRIDGES` |

Existing dirty work remains owned by its original lanes. Neural Fabric work
uses new paths or an isolated worktree from a frozen base SHA. It must not
absorb unrelated changes.

The target remains one canonical monorepo. Rust semantics from `sirinx-co` are
ported or admitted through a reviewed migration; they do not remain a second
live authority.

### 3.1 Reuse, quarantine, and retire map

Reuse as design/source candidates:

- `project-hermes/config/hermes_routing_status_policy.json`
- `project-hermes/hermes_ceo_control.py`
- `sirinx-co/crates/sirinx-core/src/agent_runtime.rs`
- `sirinx-co/crates/sirinx-store/src/agent_runtime.rs`
- `sirinx-co/crates/sirinx-store/migrations/0005_agent_runtime_core.sql`
- `sirinx-co/crates/sirinx-store/migrations/0006_agent_runtime_runtime_access.sql`
- Ronin roles 37, 40, and 42
- the LINE Secretary contract set inside the customer-service boundary only

Quarantine as adapters or projections:

- A2A live-sync and OmniRoute registration services
- GhostClaw wire-schema candidates until reconciled with the Rust domain
- filesystem queues and cmux dispatchers
- dashboards, JSONL, Chroma, and Obsidian

Retire as independent authorities:

- Hermes in-memory `TASKS`
- process-memory approval queues and audit lists
- autonomous auto-approval engines
- independent SQLite A2A session authority
- unleased queue scanners/dispatchers
- any second Telegram backend scaffold

## 4. Fabric bounded contexts

### 4.1 Identity and ingress

Owns:

- authenticated principal
- source channel and trust zone
- raw payload digest
- schema validation
- timestamp/freshness
- nonce and replay check
- request and correlation IDs
- redaction and quarantine

Must never own execution or risk downgrade.

### 4.2 Authority Kernel mission core

Owns validation and the legal task-state transition rules, dependency DAG,
repair count, and terminal status. Hermes requests transitions; the kernel
validates and records them. It does not choose a provider or impersonate the
human approver.

### 4.3 Authority Kernel policy and capability gate

Owns action classification, capability ceiling, exact scope, budget, data
class, approval requirement, grant issuance after verified human intent, and
panic/hold state. The human is the approver, the Telegram adapter is the
transport, and the kernel is the issuer; those identities remain distinct.

Unknown action, unknown model, missing identity, missing digest, missing lease,
or policy ambiguity must fail closed.

### 4.4 Durable queue and outbox

Owns enqueue, claim, delay, retry, DLQ, causation lineage, and transactional
outbox. Transport is at-least-once. Effects must be idempotent; the system must
not claim exactly-once delivery.

### 4.5 Lease manager

Owns atomic compare-and-set leases bound to:

- task ID
- stage
- worker instance
- agent lane
- base SHA
- worktree
- exact owned paths
- capability list
- nonce
- issued/expiry timestamps
- heartbeat sequence

One writable path may have one active owner. At most two writers may hold
leases concurrently, but they must use different principals, runs, leases, and
isolated worktrees. Two source writers must never share one worktree, even when
their declared paths do not overlap. Each candidate produces an immutable
commit and a candidate-specific checker receipt. A separately leased single
integrator owns convergence. The verifier holds no write lease.

### 4.6 Worker adapters

Adapters translate a Task Contract into a specific CLI or MCP invocation. They
may not infer missing authority, expand paths, change provider, or bypass
Hermes.

### 4.7 Verification and evidence

Owns deterministic checks, independent review, read-back, receipt hashing,
and final truth labels:

`PASS`, `FAIL`, `BLOCKED`, `UNVERIFIED`.

No final receipt means the task cannot enter `DONE`.

### 4.8 Memory projections

Memory is separated into authority and projections:

| Layer | Role | V1 rule |
|---|---|---|
| PostgreSQL | target durable authority for task, lease, outbox, approval, and receipt state | not wired until migration decision and restore test |
| SQLite | current single-node MCP/API store and local test bootstrap | not multi-writer authority |
| Obsidian | verified human-readable knowledge digest | projection only, secret-free |
| Chroma/vector store | retrieval index | never workflow truth |
| Files/artifacts | immutable evidence payloads | referenced by digest, not trusted by path alone |

PostgreSQL is a store, not a manager or policy actor. Until it is wired and
verified behind the Authority Kernel, cross-process durable claim execution
remains blocked.

## 5. Canonical contracts

Implementation must start with closed JSON Schema 2020-12 contracts and
language mirrors that reject unknown fields.

The contract set also needs a deterministic memory-projection contract:
checkpoint identity, source-event range, projector version, redaction policy,
poison-event state, rebuild digest, and replay outcome. No current repository
contains a complete event-to-memory rebuild implementation.

### 5.0 Contract precedence

The Rust `TaskEnvelopeV1`, `AgentRuntimeEvent`, `StageLease`, and `RunReceipt`
models in the current `sirinx-co` candidate are the semantic baseline because
they already encode task state, CAS transitions, exact leases, independent
verification, and receipt-chain fields.

The GhostClaw/Fabric JSON Schemas in this document are wire projections. They
must be generated from or tested for parity with the admitted Rust domain.
`StageLease` and `StageLeaseV1`, or `RunReceipt` and
`TransitionReceiptV2`, must never operate as separate truths.

### 5.1 `FabricEnvelopeV1`

Required fields:

```text
schema_version
event_id
event_type
source_channel
source_node
principal_ref
trust_zone
request_id
correlation_id
causation_id
idempotency_key
payload_ref
payload_digest
schema_ref
created_at
expires_at
nonce
data_class
```

The digest is computed from RFC 8785/JCS canonical JSON. Raw secrets and raw
recipient IDs are not envelope fields.

### 5.2 `TaskContractV1`

Required groups:

- immutable identity and frozen base SHA
- objective and expected outcome
- dependency DAG
- assigned role and agent instance
- exact repository/worktree/branch
- owned and forbidden paths
- allowed and forbidden actions
- acceptance criteria
- verification commands
- time/cost/concurrency caps
- output receipt contract
- escalation conditions

### 5.3 `StageLeaseV1`

Must support atomic claim, heartbeat, expiry, revoke, and compare-and-set
renewal. A stale lease cannot be renewed by another identity.

### 5.4 `WorkerReceiptV1`

Required fields:

```text
task_id
lease_id
agent
role
base_commit
files_changed
out_of_scope_files
commands_run
test_results
artifact_digests
assumptions
residual_risks
requested_scope_changes
started_at
finished_at
output_digest
```

Self-reported tests are untrusted until independently rerun.

### 5.5 `ApprovalGrantV2`

One-use grant bound to:

- action ID and closed action type
- requester and approver identities
- exact target and scope
- plan, payload, and evidence digests
- nonce and expiry
- cost/message/action caps
- rollback reference

Same idempotency key plus different payload digest returns `409`.

### 5.6 `TransitionReceiptV2`

The receipt-chain digest must cover the full canonical transition, including:

- prior receipt hash
- old/new state hashes
- task and lease identity
- approval identity when applicable
- evidence manifest hash
- verifier identity
- timestamp
- outcome

Human-readable labels are not cryptographic signatures.

## 6. Team topology and ownership

Complex runs use exactly three worker roles:

| Lane | Role | Default access |
|---|---|---|
| `lane.claude_frontend` / Ronin 37 candidate | Maker A | write lease for frontend or bounded implementation paths |
| `lane.codex_backend` / Ronin 40 candidate | Maker B | write lease for backend/data or adapter paths |
| `lane.opencode_verifier` / Ronin 42 | independent verifier | read-only |

Kimi is optional and read-only until its adapter passes binary, authentication,
structured-output, and receipt verification.

Hermes never becomes a fourth coder.

The two maker receipts are reviewed independently. One aggregate verifier
message cannot authorize both candidates. Integration is a separate task,
lease, and receipt owned by one bounded integrator.

The current Ronin registry still encodes `one-maker`. Two-maker execution is
not admitted until the registry/schema/version change is reviewed and tested.
After both candidates have bound verifier receipts, Hermes may grant an
integration lease to one existing maker. Role 42 then verifies the combined
candidate with a new receipt.

Required sequence:

```text
ANALYZE_READ_ONLY
-> UNDERSTANDING_RECEIPT
-> PLAN
-> CONTRACT_FREEZE
-> PLAN_APPROVAL
-> WORKTREE_PROVISION
-> LEASE_MAKERS
-> COLLECT_RECEIPTS
-> DIFF_SCOPE_CHECK
-> INTEGRATE_CANDIDATE
-> INDEPENDENT_REVIEW
-> TARGETED_TEST
-> SECURITY_GUARD
-> LOCAL_DELIVERY | WAITING_HUMAN_RED | REPAIR | BLOCKED
-> FINAL_RECEIPT
```

Repair is capped at three rounds.

## 7. Channel isolation

### 7.1 Telegram backend control

Telegram is the only remote backend control transport. Local CLI fixtures may
exist for offline tests, but cannot mint remote operator authority.

Every inbound backend command must prove:

- transport-authenticated Telegram identity
- allowlisted operator principal
- fresh webhook/update identity
- exact command schema
- replay/idempotency protection
- correlation to one Hermes mission

Telegram never directly invokes a shell, coding CLI, provider, deployment, or
database mutation. It transports authenticated human intent to Hermes. Hermes
creates a mission request; the Authority Kernel independently validates scope,
freshness, nonce, digests, and policy before it issues a transition or one-use
grant. Telegram itself never mints a grant.

### 7.2 LINE customer operations

LINE is restricted to SIRINX customer care:

- verified customer webhook ingress
- FAQ and lead/booking intake
- human handoff
- governed reply draft
- exact-recipient outbound after policy

LINE must reject all backend command families, including agent control,
provider control, MCP authorization, deploy, secrets, Git, DNS, and admin
approval.

Production ingress must verify `x-line-signature` from raw request bytes before
parsing or enqueue. Missing header, missing secret, malformed signature, and
invalid signature all fail closed and enqueue nothing.

LINE Bot MCP remains a manual/operator outbound tool and is not the production
ingress or backend command surface.

## 8. Provider, MCP, and model routing

OmniRoute is the canonical provider gateway only after:

- exact provider/model catalog verification
- valid authentication
- cost and token caps
- declared fallback chain
- data-egress policy
- one-request canary grant
- route receipt

Provider authentication failure is fatal for that route. It must not be
retried through an undeclared provider.

MCP servers are capability adapters. A tool list is discovery evidence, not
authorization. Write tools require an exact scoped grant and server audience.
The current MCP/API bridge on port 8080 is admitted only as a local auxiliary
surface while its database is SQLite and its exposed tools remain read-only or
test-only.

## 9. Canonical mission state

```text
INTAKE
-> VALIDATED
-> PLANNED
-> CONTRACT_FROZEN
-> LEASED
-> EXECUTING
-> RECEIPT_SUBMITTED
-> INDEPENDENT_REVIEW
-> VERIFIED
-> LOCAL_DELIVERY

INDEPENDENT_REVIEW -> REPAIR -> LEASED
REPAIR at cap -> STALLED
HIGH_RISK -> WAITING_HUMAN_RED
UNKNOWN or invalid identity -> QUARANTINED
expired lease -> LEASE_EXPIRED
indeterminate effect -> EFFECT_UNKNOWN
fatal/exhausted -> DEAD_LETTER
```

No automatic redrive is allowed for `EFFECT_UNKNOWN`.

## 10. Security invariants

### MUST

1. Authenticate identity at transport ingress; never trust caller-supplied
   sender/chat fields.
2. Bind every executable stage to a durable lease and one task contract.
3. Use one writer per path and at most two concurrent writers.
4. Use a different agent instance for independent review.
5. Fail closed on missing secrets, signatures, approval, model catalog, lease,
   or persistence.
6. Bind approval, action, target, payload, expiry, and nonce cryptographically.
7. Preserve append-only receipt lineage and rerun required tests independently.
8. Keep LINE customer and Telegram backend namespaces disjoint.
9. Make PostgreSQL unavailability, schema drift, memory fallback, or failed
   RLS/role attestation disable every mutation.
10. Persist `REQUESTING` and atomically consume the grant plus insert/claim the
    outbox row before the first external network byte.
11. Keep requester, approver, issuer, maker, checker, and executor identities
    distinct for external effects.
12. Keep Hermes coordination, Authority Kernel transition/issuance, and
    PostgreSQL persistence as three non-overlapping responsibilities.

### MUST NOT

1. Accept free-text shell commands from Telegram, LINE, MCP, or another worker.
2. Use `approval_policy=never`, unrestricted workspace write, or bypass flags
   on an externally reachable bridge.
3. Treat a shaped text ticket as an attested human grant.
4. Treat JSON/Markdown status, UI state, or a listener as proof of execution.
5. Use SQLite or in-memory registries as cross-process production authority.
6. Auto-enable provider fallback, live messaging, merge, deploy, or production
   mutation.
7. Let memory/vector projections change workflow state.
8. Run two source writers in the same worktree.
9. Retry an ambiguous external effect under a new idempotency key.
10. Let MCP, LINE, a desktop client, local config, or direct bearer possession
    mint human authority.

## 11. Current admission blockers

| Blocker | Status | Required correction |
|---|---|---|
| A2A ports 9000/8790/8791 have no listener | `BLOCKED` | implement and verify one canonical local endpoint |
| `sirinx-co` live-sync routes allow `dryRun:false` registration without durable grant/lease/idempotency | `CRITICAL` | quarantine routes; move registration behind the kernel |
| legacy Telegram/MCP bridge lacks durable identity/lease enforcement | `CRITICAL` | quarantine execution path; add authenticated envelope and claim contract |
| LINE runtime signature behavior is weaker than the L1 contract | `CRITICAL` | implement fail-closed raw-body verification and regression tests |
| durable card/lease/outbox authority is fragmented or in-memory | `CRITICAL` | select PostgreSQL authority and transactional schema |
| current MCP/API bridge uses SQLite, declares no API auth, and is published on all interfaces | `CRITICAL` | bind loopback/internal network, add auth, keep auxiliary/read-only |
| PostgreSQL is healthy but exposed on all interfaces and not wired | `HIGH` | bind locally, define ownership, migrate and restore-test |
| provider auth/fallback is not production-ready | `BLOCKED` | repair credentials outside logs and verify bounded route |
| dashboard 9119 token exposure prerequisite remains unresolved | `CRITICAL` | close exposure before dashboard trust |
| generated OMX policy permits six children, conflicting with adopted model | `HOLD` | reconcile to three worker roles and two writers |
| current Ronin registry is hard-coded to `one-maker` | `BLOCKED` | version the registry and prove two-worktree/two-receipt behavior |

### 11.1 Evidence anchors

- Hermes routing is currently `declarative-only`:
  `/Users/sirinx/project-hermes/config/hermes_routing_status_policy.json:2`.
- The legacy FastMCP Telegram tool accepts caller-supplied identity:
  `/Users/sirinx/project-hermes/mcp_server/fastmcp_server.py:96`.
- Its tracked Codex bridge enables workspace execution with no approval:
  `/Users/sirinx/project-hermes/config/hermes_codex_telegram_bridge.json:1`.
- LINE signature verification may return missing/skipped states:
  `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/apps/public-web/server/_core/lineWebhookCore.ts:50`.
- The current LINE route rejects only `invalid`:
  `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/apps/public-web/server/_core/lineWebhook.ts:45`.
- A2A OmniRoute can call live sync when `dryRun:false`:
  `/Users/sirinx/SIRINXDev/sirinx-co/services/dev-control-api/src/a2a-omniroute.mjs:951`.
- Registration routes lack a durable grant/lease boundary:
  `/Users/sirinx/SIRINXDev/sirinx-co/services/dev-control-api/server.mjs:1416`.
- The Rust task/lease/receipt semantic candidate starts at:
  `/Users/sirinx/SIRINXDev/sirinx-co/crates/sirinx-core/src/agent_runtime.rs:17`.
- Durable store candidates start at:
  `/Users/sirinx/SIRINXDev/sirinx-co/crates/sirinx-store/src/agent_runtime.rs:93`.
- Source-writer worktree conflicts are enforced at:
  `/Users/sirinx/SIRINXDev/sirinx-co/crates/sirinx-core/src/agent_runtime.rs:818`.
- Independent checker constraints are enforced at:
  `/Users/sirinx/SIRINXDev/sirinx-co/crates/sirinx-store/src/agent_runtime.rs:736`.
- The current role registry declares `one-maker` at:
  `/Users/sirinx/SIRINXDev/sirinx-co/crates/sirinx-agents/data/ronin-role-registry.v1.json:7`.

## 12. Delivery phases

### N0 — Specification and truth freeze

Output this specification, the local test plan, ownership map, health snapshot,
and receipt. No source implementation.

### N1 — Security boundary repair

After exact implementation approval:

- quarantine or disable unsafe execution bridges
- quarantine ungated A2A live registration routes and unsafe tests
- enforce Telegram transport identity
- correct LINE signature fail-closed behavior
- close dashboard token exposure
- restrict MCP/API to authenticated loopback/internal access
- add channel-isolation tests

Stop if any security regression fails.

### N2 — Core contracts and deterministic kernel

Implement schemas, task DAG, policy gate, lease interface, receipt verifier,
and in-memory deterministic test double. No provider or live channels.

### N3 — Durable state

Implement PostgreSQL-backed task, lease, idempotency, outbox, approval, and
receipt state. Run migration up/down/up, transaction, backup, restore, and
multi-writer race tests before admission. Lease time and CAS come from the
database. RLS and per-action database-role attestation are release gates.

### N4 — Local adapters

Wire Telegram and LINE synthetic fixtures, local MCP read-only tools, and mock
worker adapters. No live messages or provider calls.

### N5 — Three-agent synthetic end-to-end

Run two mock makers plus one independent verifier through a complete local
mission. Prove ownership, repair cap, restart recovery, and final receipt.

### N6 — Bounded provider canary

Separate exact one-use approval. One verified model, one request, fixed
token/cost cap, no undeclared fallback.

### N7 — Bounded channel canaries

Separate exact approvals:

- Telegram owner status/approval canary
- LINE approved customer test-user reply canary

No broadcast.

### N8 — Release

Merge, deploy, DNS, production database, external messaging, and public
exposure remain HUMAN_RED.

## 13. Completion definition

The fabric is not `CONNECTED` until all of the following are proven in one
fresh evidence window:

- canonical endpoint listeners are healthy
- durable task/lease/outbox state is authoritative
- two makers cannot acquire the same path lease
- independent verifier identity differs from maker identity
- Telegram backend and LINE customer policy tests pass
- provider/mock route has a route receipt
- restart recovery preserves lineage
- receipt-chain tampering is detected
- no raw secret appears in evidence
- all required tests are independently rerun

Until then, the truthful status is `SPEC_READY / RUNTIME_PARTIAL`.
