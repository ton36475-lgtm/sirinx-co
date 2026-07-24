# Resource Recovery Bootstrap Review

Status: `COMPARISON_ONLY / BOOTSTRAP_REVIEW_BLOCKED / NO_AUTHORITY / PRODUCTION_HOLD`

This contract compares the exact resource-recovery candidates already named by
A22 after A31 proved that C01 alone no longer restores the 15 GiB workload
floor. It is a decision-support artifact only. It cannot refresh A31, issue or
consume a cleanup grant, combine targets into one approval, credit nominal APFS
allocation as guaranteed reclaim, or dispatch any cleanup operation.

## Why this bridge is required

- A31 is an expired, digest-bound historical observation for the Cargo target.
  Editing its clock or target would invalidate the request rather than renew it.
- A23-A25 bind only one generated Cargo target and one `cargo clean` preview.
  They cannot authorize npm or pnpm cache entries.
- A31 reviews the absolute 15 GiB workload floor, while the promotable A23/A24
  grant shape requires at least the conservative 20 GiB target. A comparison
  packet must not be promoted across that threshold mismatch.
- B10's durable `resource_cleanup` circuit and one-use human grant depend on
  migration 0007, but database/build work remains resource-held. This is an
  unresolved authority bootstrap cycle, not permission to bypass the kernel.
- A33 now resolves the registry decision: migration 0007 must install the
  complete ordered 13-row definition registry and 13 matching held circuits.
  That decision does not resolve the resource or human-authority bootstrap and
  does not authorize SQL implementation.

## Recorded metadata snapshot

The bounded read-only snapshot ended at
`2026-07-21T04:40:19+07:00`. Same-filesystem free space was
`11,820,344 KiB`; the 15 GiB shortfall was `3,908,296 KiB` and the
20 GiB shortfall was `9,151,176 KiB`.

| ID | Exact target | Class | Allocated / logical KiB | Nominal free | Result |
|---|---|---|---:|---:|---|
| C01 | `/Users/sirinx/SIRINXDev/sirinx-co/target` | generated build output | 3,125,988 / 3,098,930 | 14,946,332 | 782,308 below 15 GiB |
| C02a | `/Users/sirinx/.npm/_npx/7a45358b2a5848bb` | one npm/npx cache entry | 2,619,468 / 2,397,745 | 14,439,812 | 1,288,828 below 15 GiB |
| C05a | `/Users/sirinx/Library/pnpm/store/v3` | one pnpm store generation | 1,931,228 / 1,705,487 | 13,751,572 | 1,977,068 below 15 GiB |
| C05b | `/Users/sirinx/Library/pnpm/store/v10` | one pnpm store generation | 2,950,664 / 2,683,175 | 14,771,008 | 957,632 below 15 GiB |

All four roots were real directories on `/dev/disk3s5`; none was a top-level
symlink. That observation does not prove a safe recursive target. C01 contains
complete internal hard-link sets but still lacks action-time content and APFS
extent proof. C02a contains 49 non-followed symlinks and needs a distinct
candidate policy. C05a/C05b had no observed multi-link regular files, while
clone/sharing, open consumers, offline recovery, and operation semantics remain
unproved for every candidate.

Every candidate therefore has `guaranteedMinimumReclaimKiB = 0`, incomplete
consumer/hard-link/clone/recovery evidence, no bound operation plan, and
`approvalEligible = false`. None reaches even 15 GiB nominally by itself.

## Portfolio arithmetic is not an approval

For decision support only, the recorded allocations would produce these upper
bounds if each target were separately approved, actually reclaimed its full
displayed allocation, and the filesystem did not otherwise change:

| Sequence | Nominal free | Interpretation |
|---|---:|---|
| C01 then C05a | 16,877,560 KiB | crosses 15 GiB only after two separate actions |
| C01 then C02a | 17,565,800 KiB | crosses 15 GiB only after two separate actions |
| C01 + C05a + C05b | 19,828,224 KiB | still 1,143,296 below 20 GiB |
| previous row plus C02a | 22,447,692 KiB | theoretical 20 GiB crossing only |

The validator grants no aggregate reclaim credit. One grant may bind one
literal target only, every action must stop and remeasure, and a later target
requires a new observation, new review, and new grant. Automatic continuation
is fixed false.

## Policy locks

The following broader roots remain ineligible wholesale even when their size
looks attractive:

- `/Users/sirinx/.npm/_npx`
- `/Users/sirinx/.npm/_cacache`
- `/Users/sirinx/go/pkg/mod`
- `/Users/sirinx/Library/pnpm/store`

The following remain keep-by-default and cannot be substituted as candidates:

- C05c: `/Users/sirinx/Library/pnpm/store/v11`
- C06: `/Users/sirinx/.cargo/registry`

Repositories, source, dirty/untracked work, `.git`, evidence, receipts,
Obsidian, `.codex`, `.hermes`, `.opencode`, `.env`, credentials, browser data,
databases, Docker volumes, queues, models, backups, and user documents remain
permanently excluded by the A22/A23 contract.

## Required outcome and next safe action

The only truthful result is `BOOTSTRAP_REVIEW_BLOCKED` with at least these
blockers:

- `no_single_target_meets_threshold`;
- `staged_recovery_policy_unresolved`;
- `bootstrap_authority_unavailable`;
- `candidate_specific_operation_plans_absent`;
- `apfs_unique_extent_proof_absent`;
- `consumer_absence_proof_absent`;
- `hardlink_isolation_proof_absent`;
- `clone_isolation_proof_absent`;
- `recovery_proof_absent`;
- `migration_0007_registry_semantics_unresolved` was an A32 capture-time
  blocker and remains part of that immutable historical packet. A33 resolves
  it prospectively; all other bootstrap and resource blockers remain.

After capacity is restored through a separately authorized path, the ordered
implementation sequence remains B10.1 runtime refusal/quarantine, migration
0007 candidate implementation with disposable Postgres/RLS proof under the
A33 13-row decision, the narrow Rust action-time collector, and only then one
independently reviewed, human-approved one-target canary.

The machine-readable packet is
`config/agent-runtime/resource-recovery.bootstrap-review.v1.json`. Its pure
validator has no collector, route, filesystem/process/environment/network/
database primitive, approval transition, or executor. The canonical review,
task, and run IDs, capture/expiry timestamps, and packet digest are exact pins;
changing the clock and resealing cannot make the historical metadata fresh.
