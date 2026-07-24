# Resource Recovery Admission Contract

Status: `PLAN_ONLY / RESOURCE_CLEANUP_UNAUTHORIZED / PRODUCTION_HOLD`

This contract defines how local disk recovery may be proposed and verified. It
does not authorize deletion, cache pruning, moving data to Trash, stopping a
process, installing dependencies, downloading recovery artifacts, or running
the deferred build/database/model workload.

## Admission thresholds

- Resource recovery has a distinct start predicate because it may need to run
  while free space is below 15 GiB. It may start only when fresh pre-action
  free space satisfies `free >= 5 GiB + reviewed worst-case cleanup growth`
  and the conservative minimum-reclaim calculation projects the post-action
  filesystem above the intended workload threshold.
- Builds, installs, model downloads/loads, Docker, disposable databases,
  authenticated browser evidence, and other deferred workloads remain barred
  until the cleanup has stopped and a fresh post-action receipt proves at least
  15 GiB free and `5 GiB + reviewed worst-case workload growth`.
- Until a measured peak profile exists for the deferred full verification
  chain, 20 GiB free is the conservative post-recovery working target.
  Reaching exactly 15 GiB is not enough evidence for an unbounded build,
  database, browser, or model workload.
- Disk displayed by `du` is candidate allocation, not guaranteed APFS reclaim.
  Every action must stop and re-read `df -Pk` before another target is
  considered.

## Current authority gap

The v1 approval receipt has no cleanup action. Future shared Authority Kernel
and `approval-receipt.v2` work must add both:

- action kind `RESOURCE_CLEANUP`;
- held-by-default circuit `resource_cleanup`.

Neither exists in the runtime today. A generic implementation approval, an
automation goal, or a model/install ticket cannot be relabelled as cleanup
authority.

### Static v2 preflight slice

A local evidence-plane candidate now describes the future v2 shape without
changing that authority gap:

- `config/agent-runtime/resource-cleanup.plan-only.v2.json` is fixed at
  `NO_GRANT / CIRCUIT_HOLD`, binds this repository and the single literal
  generated target candidate, and permits only a canonical `cargo clean`
  preview bound to an absolute cargo binary, explicit `--target-dir`, and a
  closed non-inherited environment;
- `resource-cleanup-approval.v2`, `TargetManifestV1`, and
  `ProcessEvidenceV1` are closed schemas for one structural packet;
- `services/dev-control-api/src/resource-cleanup-preflight.mjs` recomputes the
  plan, scope, full grant, target-entry, and process-snapshot digests; checks
  distinct principals, exact repository/target identity, bidirectional path
  overlap, short evidence freshness, ordering, recovery and operation preview,
  full hard-link/symlink manifest rules, and conservative reclaim bounds;
- its result always sets `authorityValidated=false`,
  `admissionValidated=false`, `canExecute=false`,
  `approvalConsumed=false`, `replayProtectionAvailable=false`, and
  `cleanupExecuted=false`.

This is static negative-proof infrastructure only. It does not extend the v1
receipt, add the shared migration 0007, verify a human attestation, read live
process or filesystem state, wire a route, open `resource_cleanup`, or
implement an executor. Structurally valid synthetic fixtures are not a grant
and must not be presented as admission or runtime evidence. Migration 0007 is
co-owned with the provider/model Effect Plane: cleanup must reuse the existing
ticket/grant/outbox groundwork through that kernel, not create a second
approval ledger.

Known policy drift must be removed before an executor is admitted: the current
disposable-Postgres harness checks the absolute 15 GiB floor without a reviewed
growth margin; its `KEEP=1` option may retain capacity during recovery; and the
legacy autonomous-ops skill describes automatic log/temp cleanup without an
exact target ticket. Capacity-recovery mode must use the threshold above,
refuse retained disposable resources, and never inherit that blanket cleanup
language.

## One-target grant

One grant binds exactly one literal target and one operation. It must contain:

- task, repository, branch, base SHA, dirty-manifest digest, plan hash, scope
  hash, action digest, maker, independent checker, human approver, nonce, and
  expiry;
- absolute path plus filesystem device/inode identity, or an immutable
  tool-native object ID; no glob, unresolved variable, symlink traversal,
  workspace root, home root, or target named `all`;
- `TargetManifestV1` version and digest for a recursively sorted, NUL-delimited
  inventory of every relative entry: lstat type, device, inode, mode, link
  count, size, nanosecond mtime, regular-file SHA-256, and symlink link text
  without following it. Device/socket/FIFO entries, symlink traversal, and
  hard links whose complete link set is not proved inside the target are
  refusal conditions;
- target class, pre-action allocated bytes, expected minimum reclaim, maximum
  bytes affected, execution timeout, and minimum required free space after the
  action;
- exact operation and arguments, recovery source and recovery procedure,
  required process-stop evidence, and explicit exclusions;
- whether network/install authority would be required to recover the target;
- post-action measurement, unchanged tracked/untracked manifest proof, and
  receipt location.

An executor must refuse an absent/stale grant, path identity change, active
consumer, insufficient predicted margin, dirty-manifest mismatch, missing
recovery source, or any target that overlaps an exclusion. No cleanup executor
is implemented by this candidate.

The executor must rebuild `TargetManifestV1` immediately before mutation and
match its grant digest exactly. A stable root inode is insufficient. After the
action it records the consumed manifest digest and proves that no entry outside
that frozen recursive target was affected.

`dirty-manifest digest` means a future canonical worktree snapshot, not the
default directory-collapsed `git status` output. It must expand all untracked
files, bind the NUL-delimited path/status stream, bind the tracked diff, and
bind content plus stable metadata for every non-protected untracked regular
file. Protected excluded roots are never content-read; their literal root
identity/metadata, exclusion decision, and no-writer evidence are bound
instead. The snapshot procedure and version must be part of the grant and must
be repeated unchanged after the action.

## Candidate verification

A target is `VERIFIED_REGENERABLE` only when all of these are proven at action
time:

1. It is generated/cache data, not source, evidence, user data, operational
   state, database state, queue state, backup, or credential material.
2. Its exact path and identity are stable and do not contain or resolve through
   a symlink.
3. No active process, build, database, model runtime, package manager, or
   worktree consumes it.
4. Recovery is pinned and available without an unapproved network, install,
   credential, or provider action.
5. The cleanup start predicate preserves the 5 GiB emergency floor plus
   worst-case cleanup growth, and the conservative minimum reclaim projects the
   required post-recovery workload threshold.
6. A different checker verifies the target manifest, exclusions, command
   preview, recovery procedure, and approval receipt.

After execution, `PASS` requires the same-filesystem free-space measurement,
unchanged Git tracked/untracked manifest, excluded-path read-back, actual bytes
reclaimed, timestamps, command status, and recovery reference. Short reclaim
is `BLOCKED`; ambiguous impact is `EFFECT_UNKNOWN`; neither may continue
automatically.

## Permanent exclusions

- repositories, source files, `.git`, worktrees, dirty/untracked files;
- `.hermes`, `.codex`, `.opencode`, Obsidian, Cursor snapshots, browser
  profiles/cookies, keychains, `.env`, secrets, tokens, and private keys;
- Postgres/database files, Docker volumes, queues, audit logs, receipts,
  evidence, backups, user documents, system files, and APFS/Time Machine
  snapshots;
- Ollama, Hugging Face, or GGUF blobs without exact per-artifact provenance,
  sharing analysis, use evidence, and separate approval;
- shared package stores, toolchains, app caches, and dependency directories as
  wholesale/root or implicit targets. A single literal inactive version
  generation or content-addressed entry may become an `EXCEPTION_CANDIDATE`
  only after process, ownership, sharing, pinned recovery, network-authority,
  and independent-review evidence; it is never eligible by age or size alone.

`git clean -fdx`, broad recursive deletion, Docker volume/system prune, model
store deletion, and whole-home/workspace cleanup are never valid operations.

## Recovery sequence

1. Freeze new installs, builds, model loads, Docker/database work, and package
   jobs; collect read-only process evidence.
2. Refresh free space, exact target allocation, filesystem identity, Git dirty
   manifest, and exclusions.
3. Issue one exact human grant after independent review, binding the canonical
   worktree snapshot and recursive `TargetManifestV1` digest.
4. Execute only that target through a bounded, recoverable operation.
5. Re-measure and write the receipt. Stop if the threshold is not met or the
   effect is uncertain.
6. Repeat only with a new grant. Do not chain cleanup and verification without
   a fresh resource-admission receipt.

A move into `/Users/sirinx/.Trash` on the same filesystem is quarantine, not
reclaim, and contributes zero bytes to capacity projections. Reclaim requires
either a separately approved transfer to another filesystem or an explicitly
approved deletion after recovery evidence; neither is authorized here.

The current evidence packet is
[`reports/runtime/resource-recovery-admission-plan-20260720.md`](../../reports/runtime/resource-recovery-admission-plan-20260720.md).
The independently reviewed static-preflight receipt is
[`reports/runtime/resource-cleanup-v2-static-preflight-20260720.md`](../../reports/runtime/resource-cleanup-v2-static-preflight-20260720.md).
