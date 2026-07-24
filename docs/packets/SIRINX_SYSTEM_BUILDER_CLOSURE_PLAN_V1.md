# SIRINX System Builder Closure Plan V1

Status: `PLAN_FROZEN / IMPLEMENTATION_WAITING_EXACT_GATE`

Parent architecture: `SIRINX_NEURAL_FABRIC_V1`

Child mission: `SIRINX_SYSTEM_BUILDER_FOUNDATION_V1_LOCAL_ONLY`

Prepared: 2026-07-23

<!-- PLAN_BODY_DIGEST_START -->

## 1. Goal

Finish and verify the governed system builder before Hermes may use it.

The system builder is not Hermes, OMX, OMC, Orca, cmux, a provider, or a
dashboard. It is the local Authority Kernel plus its closed task, lease,
receipt, verification, and durable-state contracts. Hermes remains an
engineering manager and may only request legal transitions after the builder
passes its local synthetic gates.

## 2. Current operator decision

```text
EXISTING_KEY_USE    = APPROVED_FOR_LOCAL_DEV_TEST
KEY_ROTATION        = DEFERRED
PRODUCTION_USE      = BLOCKED_UNTIL_ROTATED
SECRET_IN_LOGS/ARGV = FORBIDDEN
PROVIDER_CALL_NOW   = NOT_EXECUTED
```

This decision does not authorize a provider call in the builder phases below.
The existing key is not required before the bounded provider canary phase and
must never be printed, placed in command arguments, committed configuration, or
evidence artifacts.

## 3. Authority and repository lock

The newest approved architecture is `SIRINX_NEURAL_FABRIC_V1`.

| Repository | Builder role |
|---|---|
| `/Users/sirinx/SIRINXDev/sirinx-agent-native-os` | canonical contract and integration target |
| `/Users/sirinx/sirinx-os` | source candidate for deterministic Rust mission, outbox, lease, receipt, and agent-alignment primitives |
| `/Users/sirinx/SIRINXDev/sirinx-co` | source candidate for typed task/run/lease/receipt and Postgres-store semantics; live runtime remains quarantined |
| `/Users/sirinx/project-hermes` | manager/adapter reference only; execution bridges remain quarantined |

Older documents that call another repository or runtime the final authority are
historical source candidates for this mission. They cannot create a second live
builder or override the Neural Fabric authority model.

Snapshot observed 2026-07-23 (Asia/Bangkok), using
`git status --porcelain=v1 --untracked-files=all`:

| Repository | Branch | HEAD | Dirty-path basis | Exact dirty paths | Staged |
|---|---|---|---|---:|---:|
| `sirinx-agent-native-os` | `feat/sirinx-web-line-trust-v1` | `efaaccab8b02cc5979b51499f0683f1a847488a6` | pre-packet | 55 | 0 |
| `sirinx-agent-native-os` | `feat/sirinx-web-line-trust-v1` | `efaaccab8b02cc5979b51499f0683f1a847488a6` | post-packet | 56 | 0 |
| `sirinx-os` | `migration/v5-rebase` | `b55f81ecd372ff23a34fcf33c2744706447e14ca` | current | 1470 | 0 |
| `sirinx-co` | `agent/b1-b2-command-center` | `1f05814c3e9d173e525234d69b3ce7f2d1b01a57` | current | 284 | 0 |
| `project-hermes` | `main` | `3496f2e8a99bab0bbb8d399c12789af9539595d8` | current | 48 | 0 |

Free space at plan time is above the historical 15 GiB workload floor.
Capacity alone does not grant Docker, migration, provider, service, or external
action authority.

## 4. Current truth

```text
BUILDER_SPEC             = VERIFIED
BUILDER_EXECUTABLE_CORE  = ABSENT_IN_CANONICAL_TARGET
BUILDER_POLICY           = CONFLICTING
BUILDER_RUNTIME          = BLOCKED
HERMES_BUILDER_USE       = BLOCKED
PROVIDER_CALL            = NOT_EXECUTED
EXTERNAL_EFFECTS         = BLOCKED
```

Material conflicts:

1. The generated OMX overlay permits autonomous continuation and up to six
   children; the adopted model permits exactly three worker roles and at most
   two writers.
2. `.ai/constitution.md` assigns OpenCode as executor and Codex as reviewer,
   opposite to the current maker/verifier topology.
3. P092 and older state documents describe pre-Neural-Fabric roles and
   approval behavior.
4. The current Ronin registry still declares `one-maker`.
5. The canonical target has no executable `FabricEnvelopeV1`,
   `TaskContractV1`, `StageLeaseV1`, `WorkerReceiptV1`, `ApprovalGrantV2`, or
   `TransitionReceiptV2`.
6. The current ownership audit accounts for 51 paths. Four later Neural Fabric
   artifacts form ownership group O8 and bring the pre-packet count to 55.
   This packet is ownership group O9 and brings the post-packet count to 56.

### B0 ownership delta and closure

The existing ownership groups O1-O7 remain defined by
`docs/receipts/DIFF_OWNERSHIP_AUDIT_20260723.md`.

Ownership group O8 — Neural Fabric specification packet:

```text
owner_lane = lane.governance.neural-fabric-spec
status     = OWNED_HOLD_IMPLEMENTATION
paths      = 4

docs/packets/SIRINX_NEURAL_FABRIC_LOCAL_TEST_PLAN_V1.md
docs/receipts/SIRINX_NEURAL_FABRIC_V1_EVIDENCE_MANIFEST_20260723.json
docs/receipts/SIRINX_NEURAL_FABRIC_V1_SPEC_PACKET_20260723.md
docs/specs/SIRINX_NEURAL_FABRIC_V1.md
```

Ownership group O9 — system-builder planning:

```text
owner_lane = lane.governance.system-builder-plan
status     = PLAN_ONLY
paths      = 1

docs/packets/SIRINX_SYSTEM_BUILDER_CLOSURE_PLAN_V1.md
```

B0 definition of done:

- repository identity is
  `/Users/sirinx/SIRINXDev/sirinx-agent-native-os`,
  `feat/sirinx-web-line-trust-v1`,
  `efaaccab8b02cc5979b51499f0683f1a847488a6`;
- all 56 dirty paths are covered by O1-O9;
- no path is staged;
- exact excluded groups remain O4 historical, O5 unclaimed, and O6 generated;
- unrelated dirty paths remain untouched;
- the normalized plan-body digest between the digest markers is recorded in
  the B0 receipt below.

Digest rule:

```text
awk '/^<!-- PLAN_BODY_DIGEST_START -->$/{capture=1;next}
     /^<!-- PLAN_BODY_DIGEST_END -->$/{capture=0}
     capture' <packet> | shasum -a 256
```

## 5. Builder-first dependency DAG

```text
B0  Freeze current repository truth and preserve all unrelated dirty paths
 |\
 | +--> B2  Close Rust migration-core workspace membership evidence
 v
B1  Reconcile canonical governance and worker topology
 |
 v
B3  Repair security boundaries before any runtime wiring
 |
 +----------------------+
                        |
B2 ---------------------+
                        v
B4  Freeze executable schemas and Rust-domain parity
 |
 v
B5  Implement deterministic Authority Kernel test double
 |
 v
B6  Implement isolated durable PostgreSQL state
 |
 v
B7  Implement mock Claude/Codex adapters and OpenCode verifier
 |
 v
B8  Run two-maker plus independent-verifier synthetic E2E and recovery
 |
 v
B9  Integrate Hermes as manager-only adapter
 |
 v
B10 Optional bounded provider development canary under a separate exact gate
```

Dependency rule: B2 is an independent evidence closeout under its own exact
gate. B3 follows B1 immediately so security quarantine is not delayed. B4 may
start only after both B2 and B3 pass.

Hermes must not use the builder before B0-B8 have closed with current,
digest-bound evidence.

## 6. First implementation slice — B1 policy reconciliation

Gate reference:

```text
APPROVE_IMPLEMENTATION SIRINX_NEURAL_FABRIC_V1_N0B_SYSTEM_BUILDER_POLICY_RECONCILIATION_LOCAL_ONLY
```

Every occurrence of that phrase in this packet is
`REFERENCE_ONLY / NOT_GRANTED`. Only a fresh human-issued message may open B1.
That one-use grant must bind:

```text
PARENT_ARCHITECTURE = SIRINX_NEURAL_FABRIC_V1
CHILD_MISSION       = SIRINX_SYSTEM_BUILDER_FOUNDATION_V1_LOCAL_ONLY
SLICE               = B1_POLICY_RECONCILIATION
BASE_SHA            = efaaccab8b02cc5979b51499f0683f1a847488a6
PLAN_BODY_SHA256    = <exact B0 digest below>
ALLOWED_PATHSET_SHA256 = <exact B0 path-set digest below>
ONE_USE             = true
```

The grant authorizes B1 only. It does not authorize B2-B10, source runtime,
provider use, service start, database access, agent launch, external write,
commit, merge, push, or deployment.

Repository:

```text
/Users/sirinx/SIRINXDev/sirinx-agent-native-os
```

Allowed paths:

```text
AGENTS.md
.ai/constitution.md
docs/guidance-schema.md
policies/hermes-3-agent-operating-model.v1.json
scripts/verify-hermes-3-agent-operating-model.mjs
tests/hermes-3-agent-operating-model.test.mjs
docs/receipts/SIRINX_SYSTEM_BUILDER_POLICY_RECONCILIATION_V1.md
```

Allowed-pathset digest rule:

- use the exact seven entries above as UTF-8 strings;
- omit blank entries;
- delimit every entry with LF;
- sort with `LC_ALL=C`;
- retain exactly one trailing LF after the final sorted entry;
- hash the resulting bytes with SHA-256.

```text
printf '%s\n' <each-exact-allowed-path-as-one-argument> \
  | LC_ALL=C sort \
  | shasum -a 256
```

B1 is the approved successor/repair lane for ownership group O3. Before
editing, it must acquire the exclusive O3 lease; no OMC/OMX activation lane may
write `AGENTS.md` concurrently.

Required invariants:

```text
HERMES_ROLE            = ENGINEERING_MANAGER_ONLY
IMPLEMENTATION_AGENTS  = CLAUDE_CODE + CODEX + OPENCODE
MAX_PARALLEL_AGENTS    = 3
MAX_PARALLEL_WRITERS   = 2
INDEPENDENT_REVIEWER   = 1
KIMI                   = OPTIONAL_READ_ONLY_ADAPTER
MERGE_DEPLOY_PROD      = HUMAN_RED
PROVIDER_CALL          = SEPARATE_GATE
```

Acceptance:

- root governance and constitution agree on the same roles and limits;
- OMX guidance cannot expand the three-worker/two-writer ceiling;
- OpenCode is read-only verifier by default;
- Hermes cannot receive a product-code write lease;
- old P092 topology is explicitly historical and cannot override V1;
- validator rejects six-agent, three-writer, Hermes-coder, self-review, and
  provider-auto-fallback fixtures;
- no unrelated dirty path changes;
- no OMC/OMX/Orca launch or reload;
- no provider call, secret read, `.env` read, service start, database action,
  message, commit, push, deploy, or external mutation.

Verification after the exact gate:

```text
node --test tests/hermes-3-agent-operating-model.test.mjs
node scripts/verify-hermes-3-agent-operating-model.mjs
npm run check
git diff --check -- <allowed paths>
```

## 7. Subsequent bounded slices

### B2 — Rust source-candidate closeout

Mission:

```text
GHOSTCLAW_MIGRATION_CORE_WORKSPACE_MEMBERSHIP_CLOSEOUT_ONLY
```

Reconcile the stale workspace receipt and run current-tree, offline,
workspace-wide formatting, Clippy, tests, and diff checks. This proves only a
source candidate; it does not wire Hermes or create runtime authority.

### B3 — Security-boundary repair

Use separate, non-overlapping leases:

- fail-closed LINE raw-body signature behavior;
- quarantine ungated A2A registration and unsafe default-fetch tests;
- disable the legacy Hermes/Codex execution bridge;
- recover or identify the source of the port-8080 MCP service before changing
  its authentication/binding;
- keep dashboard `9119` quarantined until token exposure has a verified closure.

### B4-B8 — Builder implementation and proof

Create the closed schemas, deterministic kernel, durable store, mock adapters,
independent verifier, two isolated maker worktrees, integration lease, restart
recovery, receipt-chain validation, and synthetic E2E evidence. Every phase
receives its own task contract, path lease, current base SHA, and verifier
receipt.

## 8. Stop conditions

Stop and report `BLOCKED` if any of these occurs:

- exact implementation phrase is absent;
- path ownership overlaps an existing lane;
- an agent requests secret or `.env` access;
- a test would contact a live A2A, MCP, provider, Telegram, LINE, database, or
  production surface;
- the verifier authored the candidate;
- a claimed PASS has no current artifact;
- the worktree or base SHA drifts;
- any external action becomes necessary.

<!-- PLAN_BODY_DIGEST_END -->

## 9. Current receipt

```text
STATUS              = PLAN_FROZEN
B0_RECEIPT          = PASS
B0_BASE_SHA          = efaaccab8b02cc5979b51499f0683f1a847488a6
B0_DIRTY_PATHS       = 56
B0_STAGED_PATHS      = 0
B0_OWNERSHIP_GROUPS  = O1-O9
B0_PLAN_BODY_SHA256  = a6a39ada9b7897651e9875d8e9029064be75a38c8fa4de55c8cd9d89467c39ca
B1_PATHSET_SHA256    = c590796ea995354c509f84f8a74337b9eb5be4bc01f3a1d32680042040c4df69
FILES_ADDED         = 1
SOURCE_IMPLEMENTED  = NO
TESTS_EXECUTED      = 0
PROVIDER_CALLS      = 0
SERVICES_STARTED    = 0
EXTERNAL_WRITES     = 0
HERMES_DISPATCH     = BLOCKED
NEXT_GATE_REFERENCE = APPROVE_IMPLEMENTATION SIRINX_NEURAL_FABRIC_V1_N0B_SYSTEM_BUILDER_POLICY_RECONCILIATION_LOCAL_ONLY
NEXT_GATE_GRANTED   = NO
```
