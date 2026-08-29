# Resource Recovery Admission Plan — 2026-07-20

Verdict: `READ_ONLY_INVENTORY_COMPLETE / RESOURCE_CLEANUP_UNAUTHORIZED / PRODUCTION_HOLD`

## Snapshot

Read-only measurements were taken at `2026-07-20T21:26:34+0700`.

| Field | Evidence |
|---|---|
| Repository | `/Users/sirinx/SIRINXDev/sirinx-co` |
| Branch | `agent/b1-b2-command-center` |
| Baseline HEAD | `1f05814c3e9d173e525234d69b3ce7f2d1b01a57` |
| Worktree path/status inventory | 195 entries from `git status --porcelain=v1 --untracked-files=all`; NUL-stream digest `7d2fadf2f6a88a27eea09e3305daab2a4c5c3eb9b44a71fa3e39c6acfe8a71aa` |
| Same-filesystem free space | `10,605,404 KiB` (10.114 GiB) |
| Absolute 15 GiB floor | `15,728,640 KiB`; deficit `5,123,236 KiB` (4.886 GiB) |
| 18 GiB reference | `18,874,368 KiB`; deficit `8,268,964 KiB` (7.886 GiB) |
| Conservative 20 GiB target | `20,971,520 KiB`; deficit `10,366,116 KiB` (9.886 GiB) |

The worktree is extensively dirty/untracked. The digest above expands untracked
paths but does not bind their contents or an already-modified tracked file's
new bytes. It is a path/status inventory, not cleanup authority or unchanged-
worktree proof. An action grant must bind the canonical full snapshot defined
by the recovery contract and refresh it immediately before execution.
No protected config, secret, `.env`, browser profile, cookie, token, private
key, model payload, database, Docker volume, or user document was read.

## Read-only candidate inventory

Sizes are allocated KiB from `du -sk`. They are not guaranteed reclaimed bytes
on APFS. `Candidate` means inspectable and plausibly regenerable; it does not
mean idle, recoverable offline, approved, or safe to remove now.

| ID | Exact path | KiB | Candidate class | Pre-execution requirement |
|---|---|---:|---|---|
| C01 | `/Users/sirinx/SIRINXDev/sirinx-co/target` | 3,098,816 | Rust build output | exact Cargo dry-run/read-back, no active build, dependency recovery proof |
| C02 | `/Users/sirinx/.npm/_npx` | 3,079,448 | temporary npx root | `INELIGIBLE_WHOLESALE`; inventory only, never a root target |
| C02a | `/Users/sirinx/.npm/_npx/7a45358b2a5848bb` | 2,619,468 | one npx install entry | `EXCEPTION_CANDIDATE`; recent/use/package/recovery proof absent |
| C03 | `/Users/sirinx/.npm/_cacache` | 1,897,264 | npm content-cache root | `INELIGIBLE_WHOLESALE`; must be granularized and independently proved |
| C04 | `/Users/sirinx/go/pkg/mod` | 2,048,188 | Go module-cache root | `INELIGIBLE_WHOLESALE`; must be granularized and independently proved |
| C05a | `/Users/sirinx/Library/pnpm/store/v3` | 1,931,228 | one pnpm store generation | `EXCEPTION_CANDIDATE`; prove no v3 consumer and pinned recovery |
| C05b | `/Users/sirinx/Library/pnpm/store/v10` | 2,950,664 | one pnpm store generation | `EXCEPTION_CANDIDATE`; prove no v10 consumer and pinned recovery |
| C05c | `/Users/sirinx/Library/pnpm/store/v11` | 484,044 | current pnpm store generation | keep by default; current pnpm is 11.1.3 |
| C06 | `/Users/sirinx/.cargo/registry` | 875,592 | shared Cargo registry/cache | keep by default; needed for offline Rust recovery |

Additional observed dependency trees and application caches are not proposed
as default targets. They may be in use and can require an unapproved reinstall
or service stop.

## Capacity upper bounds for decision support only

These are deletion/off-filesystem-transfer upper bounds, not executable
bundles or Trash projections. A same-filesystem move to `/Users/sirinx/.Trash`
reclaims zero bytes. Every target still requires its own ticket, process check,
recovery proof, and post-action measurement; C02a/C05a/C05b remain exception
candidates, not eligible targets.

| Upper bound | Targets | Nominal KiB | Snapshot free plus nominal allocation | Decision |
|---|---|---:|---:|---|
| U1 | C01 only | 3,098,816 | 13,704,220 KiB (13.069 GiB) | does not cross 15 GiB |
| U2 | C01 + C05a + C05b | 7,980,708 | 18,586,112 KiB (17.725 GiB) | exception evidence absent; below 20 GiB |
| U3 | U2 + C02a | 10,600,176 | 21,205,580 KiB (20.223 GiB) | theoretical margin only; no target is approved or verified idle/recoverable |

Tool-native operations were inspected or previewed where available. No cleanup
command ran. `cargo clean --dry-run --offline --locked` reported the current
repo target as 26,739 files / about 3.5 GiB. `brew cleanup` dry-run showed only
about 7 MiB of likely reclaim. `pnpm store prune` and npm/Go cache cleanup have
no useful dry-run that proves actual reclaim, so they remain held. A same-disk
Trash move is not counted as reclaim. No deletion or off-filesystem transfer is
proposed by this packet.

## Independent verification verdict

The checker returned `BLOCKED / CLEANUP PLAN UNVERIFIED` for execution:

- no candidate has a current approval receipt;
- active-consumer and offline recovery proofs are incomplete;
- displayed allocation may not equal APFS reclaim;
- the v1 approval schema has no cleanup action;
- broad Git, Docker, package-store, model-store, app-cache, or workspace cleanup
  is unsafe.

The review also found three policy drifts that must be corrected before a
cleanup executor can pass: the disposable-Postgres harness uses the bare
15 GiB check rather than 15 GiB plus reviewed growth; `KEEP=1` may retain its
container/network during capacity recovery; and the legacy autonomous-ops
skill contains blanket automatic log/temp cleanup language. None of those
paths grants authority for this packet.

The exact candidate checklist and authority model are canonicalized in
[`docs/agent-runtime/RESOURCE_RECOVERY_ADMISSION.md`](../../docs/agent-runtime/RESOURCE_RECOVERY_ADMISSION.md).

After the contract corrections, an independent final re-audit returned
`VERIFIED`: cleanup-start and post-workload thresholds are distinct, the
recursive target scope is frozen by `TargetManifestV1`, wholesale caches are
ineligible, exception candidates remain unapproved, same-filesystem Trash is
counted as zero reclaim, and v2 implementation/verification precedes any human
grant. This verifies the plan's fail-closed consistency; it does not authorize
or verify a cleanup execution.

## Required next receipt

Before any mutation, implement and verify the future v2 schema, held circuit,
RLS, and executor, and then separately issue one `RESOURCE_CLEANUP` grant for
one literal target. It must bind the refreshed
path/device/inode, repository SHA, dirty-manifest digest, action/plan/scope
hashes, a recursively rebuilt `TargetManifestV1` digest, maximum affected
bytes, minimum reclaim, process-stop evidence, recovery source, exclusions,
maker/checker, human approver, one-use nonce, expiry, timeout, cleanup-start
predicate, and post-recovery workload threshold. The `resource_cleanup`
circuit must be held by default.

Recovery is the only lane that may start below 15 GiB: its fresh pre-action
free space must still cover the 5 GiB emergency floor plus worst-case cleanup
growth, and conservative minimum reclaim must project the intended workload
threshold. Builds, installs, model work, Docker, Postgres, and browser evidence
remain barred until the cleanup stops and post-action measurement passes.

After each target: re-read same-filesystem free space, prove the Git manifest
and exclusions unchanged, record actual reclaim, and stop. Do not automatically
continue into builds, migrations, model loads, external connections, sends, or
deploys.

No deletion, install, model change, Docker mutation, service start, provider
call, MCP/A2A connection, Telegram/LINE send, Git push/merge, or deploy occurred
during this inventory.
