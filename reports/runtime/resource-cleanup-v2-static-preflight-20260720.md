# Resource Cleanup v2 Static Preflight Evidence

Verdict: `STATIC_HOLD_PREFLIGHT_VERIFIED / NO_AUTHORITY / NO_REPLAY / NO_EXECUTOR / PRODUCTION_HOLD`

Date: 2026-07-20 (Asia/Bangkok)

## Candidate identity

- repository: `/Users/sirinx/SIRINXDev/sirinx-co`
- branch: `agent/b1-b2-command-center`
- base HEAD observed for this slice: `1f05814c3e9d173e525234d69b3ce7f2d1b01a57`
- state: dirty and untracked; this is path-scoped local evidence, not a clean
  checkout, committed candidate, CI receipt, or release-SHA proof

## Claimed scope

This slice adds closed plan-only contracts and a pure read-only structural
preflight for the proposed `RESOURCE_CLEANUP` action and held
`resource_cleanup` circuit. It deliberately does not add or invoke:

- approval-receipt v2 runtime authority, migration 0007, RLS, or a replay
  ledger;
- a server route, action consumer, command runner, process collector, target
  manifest collector, or cleanup executor;
- filesystem mutation, process stop, package install/prune, Cargo clean,
  database, Docker, model, browser, network, provider, message, queue,
  Cloudflare, Git remote, merge, or deploy action.

The only described candidate is the literal generated path
`/Users/sirinx/SIRINXDev/sirinx-co/target`. The operation preview binds an
absolute Cargo path, `--manifest-path`, explicit `--target-dir`, and a closed
non-inherited environment. This is a preview digest, not an invocation.

## Artifacts

- `config/agent-runtime/resource-cleanup.plan-only.v2.json`
- `schemas/agent-runtime/resource-cleanup-plan.v2.schema.json`
- `schemas/agent-runtime/resource-cleanup-approval.v2.schema.json`
- `schemas/agent-runtime/target-manifest.v1.schema.json`
- `schemas/agent-runtime/process-evidence.v1.schema.json`
- `services/dev-control-api/src/resource-cleanup-preflight.mjs`
- `services/dev-control-api/src/resource-cleanup-preflight.test.mjs`
- `docs/agent-runtime/RESOURCE_RECOVERY_ADMISSION.md`

## Verified static invariants

- the loaded plan, exact repository, one candidate, scope, full grant envelope,
  principals, nonce metadata, issuance window, recovery references, operation
  preview, and evidence digests are closed and domain-separated;
- protected-target and grant-exclusion overlap checks are symmetric and
  conservative; manifest symlink containment uses a separate byte-exact check
  so a case-variant sibling does not pass on a case-sensitive filesystem;
- `TargetManifestV1` recomputes UTF-8-sorted NUL entry digest, full artifact
  digest, entry count, logical size, link-set completeness, symlink containment,
  root binding, verified status, ordering, and freshness;
- `ProcessEvidenceV1` recomputes the full snapshot digest, caps entries, binds
  PID/start identity, rejects a process whose CWD/executable contradicts
  `targetReference`, and orders process start before capture;
- evidence age is at most 60 seconds, grant life at most 300 seconds, the
  minimum reclaim cannot exceed observed allocation, and required post-free
  space is at least the conservative 20 GiB target;
- the source imports only hashing, path, and read-only file primitives;
- every result remains `HOLD`, with `authorityValidated=false`,
  `admissionValidated=false`, `approvalConsumed=false`,
  `replayProtectionAvailable=false`, `canExecute=false`,
  `eligibleForExecutorHandoff=false`, and `cleanupExecuted=false`.

## Focused verification receipt

- Node syntax: `PASS` for module and test file.
- JSON parse: `PASS` for the plan and four new resource schemas.
- Focused Vitest: `PASS`, 1 file / 10 tests / 10 passed, final duration 491 ms.
- Scoped trailing-whitespace scan: `PASS`.
- Default read-back: `HOLD` with absent grant/evidence/manifest/process
  blockers plus unconditional authority, circuit, executor, and replay
  blockers; all mutation and execution fields are false.
- Disk around the final focused test: `10,916,984 KiB` before and
  `10,915,892 KiB` after. A later read showed `10,920,692 KiB`; APFS free space
  is volatile; the final handoff read showed `10,917,660 KiB` (10.412 GiB),
  still below both workload thresholds.

No full Node suite, Rust build/test, Docker, disposable Postgres, browser smoke,
or live service probe was run because resource admission remains closed.

## Independent review

The first static review returned `CHANGES_REQUIRED` for unbound plan/grant
fields, one-way path checks, stale/self-asserted evidence, summary-only
manifests, reclaim over-credit, unsafe operation semantics, and schema/loader
drift. The remediation added full plan/grant/artifact digests, canonical repo
and candidate binding, full process/manifest artifacts, TTL/order checks,
operation and environment closure, conservative thresholds, symmetric path
rules, packet caps, and unconditional replay refusal.

The final independent latest-tree verdict is:

`VERIFIED — for the claimed static HOLD-only preflight scope; no remaining material P1/P2 finding within that scope.`

## Explicit remaining gates

- Before any executor can become eligible, it must resolve the Cargo executable
  without symlink ambiguity and bind its device, inode, content digest, and
  exact revision immediately before invocation. The current plan binds only
  the executable path string and therefore cannot authorize execution.
- A managed one-use nonce/replay ledger, attested human verifier, Postgres/RLS
  circuit, action-time collectors, effect-unknown handling, and post-action
  receipt do not exist.
- The schema checks in this slice parse and spot-check Draft 2020-12 contracts;
  no Draft 2020-12 validator dependency is installed. The manual loader is
  stricter for the tested structural path, but schema-engine validation remains
  future evidence.
- One exact human cleanup grant is still required after those runtime pieces
  exist. `APPROVE_IMPLEMENTATION` does not grant `RESOURCE_CLEANUP`.

No cleanup target was acted on. The next safe action is to implement the
managed authority/executor gates, independently verify them, and only then ask
the human operator for one exact, single-use target grant.
