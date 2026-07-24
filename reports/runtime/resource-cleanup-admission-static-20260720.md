# Resource Cleanup Admission Static Evidence

Verdict: `STATIC_HOLD_ADMISSION_VERIFIED / DRAFT_2020_12_INSTANCE_PASS / NO_AUTHORITY / NO_DISPATCH / NO_EXECUTOR / PRODUCTION_HOLD`

Date: 2026-07-20 (Asia/Bangkok)

## Candidate identity

- repository: `/Users/sirinx/SIRINXDev/sirinx-co`
- branch: `agent/b1-b2-command-center`
- observed HEAD: `1f05814c3e9d173e525234d69b3ce7f2d1b01a57`
- state: dirty and untracked; this is path-scoped candidate evidence, not a
  committed SHA, clean-checkout, CI, merge, deploy, or production receipt

## Outcome

This B12 slice adds a second pure evidence plane after the A23 cleanup
preflight. It can validate closed structural packets but cannot consume
authority or cross the effect boundary. Its result is unconditionally:

```text
status=HOLD
effectState=PREPARED
authorityValidated=false
replayProtectionAvailable=false
approvalConsumed=false
executorAvailable=false
canDispatch=false
nextEffectState=null
automaticRetry=false
```

No API/server route, child process, filesystem collector or mutation, network
client, database adapter, migration, approval consumer, cleanup executor, or
tool registration was added.

## Artifacts

- `schemas/agent-runtime/executable-identity.v1.schema.json`
- `schemas/agent-runtime/resource-cleanup-action-time-evidence.v1.schema.json`
- `schemas/agent-runtime/resource-cleanup-effect-attempt.v1.schema.json`
- `schemas/agent-runtime/resource-cleanup-post-action-receipt.v1.schema.json`
- `services/dev-control-api/src/resource-cleanup-admission.mjs`
- `services/dev-control-api/src/resource-cleanup-admission.test.mjs`
- `package.json`, `package-lock.json`, and `pnpm-lock.yaml` schema-engine
  dependency metadata
- `docs/agent-runtime/RESOURCE_CLEANUP_AUTHORITY_KERNEL.md`
- corrected `.hermes` truth and `docs/03` through `docs/05`

## Structural invariants

### Executable identity

- binds invocation lstat, every symlink hop, resolved rustup launcher, selected
  Cargo regular file, device/inode/mode/owner/link/size/nanosecond mtime, content
  SHA-256, architecture, exact Cargo/rustc revisions, repository toolchain-file
  identity, operation/environment digests, and all user-owned path ancestors;
- selected Cargo must be exactly
  `/Users/sirinx/.rustup/toolchains/<pinned-toolchain>/bin/cargo`;
- mutable names such as `stable`, missing parents, writable executable/parent
  nodes, content/revision drift, and path substitution fail closed;
- Darwin symlink mode bits are not misread as resolved-file permissions;
- the exact `RUSTUP_TOOLCHAIN` override is deliberately not in the A23 plan
  digest, so admission remains blocked even for a structurally valid fixture.

### Action-time evidence

- must be after grant issue, before grant expiry, fresh, and bound to the exact
  task/ticket/grant/run, repository, worktree, target root and stable manifest,
  complete process snapshot, executor identity, lease, operation, resource
  arithmetic, and recovery references;
- replay and circuit snapshots are explicitly structural-only inputs. They are
  not database authority;
- the executor is required to report `available=false` in this slice.

### Effect and receipt

- the persisted-attempt shape accepts only `PREPARED`, version one, zero retry,
  no process identity, no result, and no dispatch;
- protocol transitions are modelled purely, but `REQUESTING` and every later
  effect state are unavailable in this slice;
- interruption at or after future `REQUESTING` maps to terminal
  `EFFECT_UNKNOWN` with no automatic retry;
- a post-action object is marked `STRUCTURAL_ONLY_NO_AUTHORITY`;
- structural PASS requires the exact plan, grant, action-time evidence,
  PREPARED attempt, full post-process artifact, full post-target manifest when
  the target remains, derived exclusion digest, and a distinct bound checker
  receipt shape;
- effect/process/read-back time order, exit, signal, timeout, truncation,
  worktree, exclusions, impact, reclaim, threshold, target identity, and
  post-artifact digests are cross-checked. Calling the receipt validator with a
  caller-authored PASS and no contexts is rejected.

None of these structural checks proves a cleanup occurred.

## Draft 2020-12 instance validation

- Ajv 8.20.0 and `ajv-formats` 3.0.1 are exact development dependencies in
  both npm and pnpm dependency metadata.
- Ajv runs with `strict=true`, `allErrors=true`, and format validation enabled.
- The target-manifest, process-evidence, and executable-identity schemas are
  registered before the four cleanup schemas are compiled.
- The executable identity, action-time evidence, PREPARED attempt, and
  structural post-action receipt fixtures all pass their schemas.
- An unknown top-level field fails each of the four schemas. Malformed
  executable and process timestamps, an open nested target-manifest entry, a
  `REQUESTING` attempt, and a PASS with non-zero exit also fail.
- Three executable node refinement branches and the receipt PASS conditional
  now declare their object type explicitly, allowing strict compilation.
- `npm ci --dry-run --ignore-scripts --offline --no-audit --no-fund` accepts the
  updated tracked npm lockfile candidate. No package installation occurred; the
  current checkout still has no root `node_modules/ajv` or
  `node_modules/ajv-formats` link. The new whole-workspace pnpm lock remains
  untracked candidate state.
- The focused no-install run resolved the declared packages through `NODE_PATH`
  to the pre-existing pnpm virtual store. The test source itself uses only bare
  declared package names and contains no private-store fallback. Clean npm
  materialization and CI remain unverified.

This closes schema-engine instance parity for these four fixtures only. It is
not a JSON Schema conformance-suite claim and does not validate runtime effects.

## Read-only host observation

The existing A23 plan binds the string `/Users/sirinx/.cargo/bin/cargo`. A
read-only inspection showed:

```text
cargo: symlink -> rustup
cargo lstat: device 16777232, inode 30862423
rustup: regular arm64 Mach-O, device 16777232, inode 30862417
rustup size: 11053296 bytes
rustup SHA-256: aeb4105778ca1bd3c6b0e75768f581c656633cd51368fa61289b6a71696ac7e1
repository selector: rust-toolchain.toml channel = stable
```

This observation explains the stronger contract. It is not an action-time
launch identity, and no Cargo/rustup revision probe or executable was run.

## Authority-kernel decision

SQL migration 0007 is deferred. The existing runtime admission expects exactly
13 agent-runtime tables and 13 policies, migrations 0005-0006 intentionally
withhold ticket/grant/outbox access, and B10 previously shared the same 0007
number. A cleanup-only migration would break admission or create a duplicate
approval ledger.

The decision-complete design reserves one shared authority kernel over the
existing ticket/grant/outbox groundwork, with held circuits, managed principal
attestations, v2 bindings, cleanup scope, independently persisted action-time
admission, DB-clock atomic one-use consume plus `REQUESTING` claim, separate
executor/checker roles, version-aware startup inventory, terminal unknown
effects, and an exact disposable-Postgres acceptance matrix. It is design only;
no SQL file or runtime state was created.

## Verification receipt

- Node syntax: `PASS` for module and test file.
- JSON parse: `PASS` for four new schemas, package metadata, and
  `.hermes/state.json`.
- Strict Draft 2020-12 compile and instance matrix: `PASS` for four positive
  and nine negative fixture classes, including external references, formats,
  and the false-PASS conditional.
- Npm lock dry-run: `PASS` offline with lifecycle scripts disabled; no package
  was installed.
- Scoped diff/trailing-whitespace check: `PASS`.
- Mutation-surface source scan: `PASS`; no child-process, network, filesystem
  mutation, route, `canDispatch=true`, executor, authority, or approval consume
  primitive.
- Pre-hardening focused Vitest: 9 of 9 passed, then independent review found
  optional-context false-PASS and executable/path/recovery/time gaps.
- Remediation run: 8 of 9 passed; the failure correctly exposed that an
  `EFFECT_UNKNOWN` receipt must be allowed to keep threshold booleans
  conservative instead of inferring PASS from arithmetic.
- Final latest-tree focused Vitest after schema-engine integration: `PASS`,
  1 file / 9 tests / 9 passed, duration 563 ms.
- Independent latest-tree verdict: `VERIFIED` for the claimed HOLD-only,
  no-dispatch structural scope; no blocking finding remains in that scope.

The independent reviewer reran the latest focused file (9 of 9 passed) and
verified the schema/test/lock slice. The reviewer did not verify authoritative
cleanup, clean dependency materialization, full-suite CI, or production.

## Resource truth

Free space was volatile during the focused work: one sample was
`9,247,952 KiB`; the report-bound 23:20:59 sample was `14,594,096 KiB`
(13.918 GiB).
No cleanup, Trash move, cache prune, model/Docker/database mutation, or process
stop occurred in this slice. The report-bound sample remains `1,134,544 KiB`
below the absolute 15 GiB workload floor and `6,377,424 KiB` below the conservative
20 GiB full-chain target. Every later workload must remeasure.

No full Node suite, Rust build/test, Docker, disposable Postgres, browser smoke,
CI, or external probe was run.

## Remaining gates

1. Implement the coordinated shared migration 0007 only when empty/prior-state,
   RLS/ACL, DB-clock, replay/race/crash, restore, and rollback tests can run in
   disposable Postgres.
2. Add durable attestation/audience/session verification, atomic nonce/grant/
   ticket/admission consumption, and pre-effect `REQUESTING`.
3. Add the independent persisted checker and post-worktree/exclusion chain.
4. Prove descriptor/atomic executable and target TOCTOU protection plus real
   symlink/case/Unicode/hardlink/mount/process/APFS fixtures.
5. Obtain one separate exact, single-use human `RESOURCE_CLEANUP` grant only
   after those gates pass.

No cleanup authority is inherited from `APPROVE_IMPLEMENTATION`, this report,
or any structurally valid fixture.
