# Resource Cleanup Review Request

Status: `PROPOSAL_ONLY / COLLECTED_NOT_APPROVED / CIRCUIT_HOLD`

This contract is the pre-approval bridge between the static cleanup design in
A23-A25 and a future action-time collector/executor. It accepts a closed packet
of bounded local observations for one literal target and returns only
`COLLECTED_NOT_APPROVED`.

It is deliberately not any of the following:

- a `resource-cleanup-approval.v2` receipt;
- `TargetManifestV1`, `ProcessEvidenceV1`, or A24 action-time evidence;
- proof that APFS will reclaim the target's displayed allocation;
- an authority, replay, lease, circuit, executor, dispatch, or cleanup surface.

The request binds the exact plan bytes and semantic plan hash, repository and
target identity, path/status-only worktree observation, metadata-only target
inventory, target-scoped process observation, local Cargo/Rustup artifact
identities, resource arithmetic, operation preview, recovery posture, and a
domain-separated request digest. All authority and effect flags are fixed
false. Each proposal expires within one hour; expiration makes it historical
review evidence and never renews it into action-time evidence.

## Claim ceiling

The only accepted claim ceiling is
`PRE_APPROVAL_LOCAL_READ_ONLY_OBSERVATIONS`. A structurally valid packet can
support human review of what was observed, but cannot become approval-ready,
action-time evidence, or an executable grant by changing a status field.

The validator requires explicit blockers for the missing proof classes:

- no durable cleanup authority or one-use human grant;
- no canonical full worktree snapshot;
- no two-pass content-bound `TargetManifestV1`;
- no complete, privileged, before-and-after `ProcessEvidenceV1`;
- no action-time `ExecutableIdentityV1` or immutable toolchain binding;
- no proven offline recovery and no conservative APFS minimum reclaim;
- no executor, replay ledger, or open circuit;
- nominal projection below the conservative 20 GiB working target.

## Recorded C01 observation

The fresh read-only observation at `2026-07-21T03:51:31+07:00` found
`13,625,216 KiB` free and `3,125,988 KiB` allocated under the exact Cargo
`target` directory. Their nominal sum is `16,751,204 KiB`, which is
`1,022,564 KiB` above the absolute 15 GiB workload floor but below the 20 GiB
conservative target. This is decision support only: allocated blocks are not a
guaranteed APFS reclaim amount.

This is capture-time evidence, not a live capacity claim. An independent
read-back at `2026-07-21T04:21:12+07:00` found only `11,811,132 KiB` free while
the target allocation remained `3,125,988 KiB`. The then-current nominal sum
was `14,937,120 KiB`, or `791,520 KiB` below the 15 GiB floor. C01 alone was
therefore no longer sufficient even on the optimistic nominal calculation.

A second metadata-only pass counted 27,787 descendants. It corrected an
important ambiguity in the first inventory: 18,716 regular-file entries belong
to 5,492 complete hard-link groups inside `target` (13,224 internal aliases),
with zero incomplete groups. The proposal binds that fact but does not read or
hash file content. A future collector must prove link-set completeness before
any content read and fail before touching a file if an external link is
possible.

The target-scoped `lsof` observation found no visible CWD, executable, or open
file reference. It is not a complete process snapshot: current-user visibility,
PID churn, mmap, argument, mount, and before/after race coverage remain absent.

## Future action-time collector

The approval-bearing collector should be a narrow Rust binary, not this pure
JavaScript validator. It must use descriptor-relative, no-follow traversal;
bind every ancestor and mount identity; reject symlink/special/incomplete-link
sets before content reads; hash through stable file descriptors with pre/post
metadata; enforce entry, path, byte, depth, time, memory, and output ceilings;
and complete two identical passes before emitting evidence.

It must also capture a canonical protected-read-safe Git snapshot, two process
snapshots with provenance and completeness errors, immutable Cargo/Rust
revisions, host/boot identity, and action-time resource readings. Output must be
written outside the target through an exclusive `0600` temporary file plus
no-replace atomic rename and fsync sequence. Any drift, truncation, permission
error, race, reboot, stale timestamp, or optimistic reclaim assumption remains
`BLOCKED`.

Even that collector cannot open the gate. B10's durable shared Authority Kernel,
a separately issued human ticket, an active lease, replay protection, and a
held-by-default `resource_cleanup` circuit remain mandatory.
