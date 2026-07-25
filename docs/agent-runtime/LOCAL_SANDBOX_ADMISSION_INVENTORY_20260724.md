# Local Sandbox Admission Inventory — 2026-07-24

Status: `INTEGRATION_IN_PROGRESS`

This inventory turns local sandbox and worktree findings into a fail-closed
admission queue. It is not proof that a candidate is merged, running, or
deployed.

## Authority and boundaries

- Integration is local-only.
- Provider inference, external writes, service starts, runtime activation,
  secret reads, Git push/merge, and deploy remain denied.
- User-owned dirty roots are preserved.
- Candidate patches are admitted path-by-path into fresh worktrees; no blanket
  copy, checkout, reset, or cherry-pick is allowed.
- At most two source writers may be active and exactly one independent verifier
  is required before a source-writing candidate can pass.
- Historical agent worktrees are evidence sources, not authority.

## Active owned lane

| Candidate | State | Admission decision |
| --- | --- | --- |
| `/Users/sirinx/SIRINXDev/worktrees/sirinx-goalspec-e2e-20260724` | `ACTIVE_OWNED` | Finish focused and workspace-wide verification first. This lane owns the sealed GoalSpec runtime, GoalRun API, engineering-agent registry, and project-local graph-memory implementation. |

The active lane overlaps the dirty canonical `sirinx-co` root on six paths:

1. `Cargo.lock`
2. `crates/sirinx-agents/src/lib.rs`
3. `crates/sirinx-autoloop/src/goal.rs`
4. `crates/sirinx-autoloop/src/lib.rs`
5. `crates/sirinx-control/src/lib.rs`
6. `docs/agent-runtime/`

Integration of this lane therefore requires a later six-path ownership read-back
against the canonical dirty root. No whole-tree replacement is permitted.

## Pending local candidates

| Candidate | Observed state | Required admission action |
| --- | --- | --- |
| `sirinx-os/.worktrees/ghostclaw-durable-outbox` | dirty 14; older broad candidate | Superseded for admission. Eleven extra paths are formatting/import-order churn, including one canonical-root conflict. |
| `sirinx-os/.worktrees/ghostclaw-durable-outbox-final` | dirty 3; verified byte-identical subset of the broad candidate | Selected for a fresh-worktree replay of exactly `lib.rs`, `outbox.rs`, and `outbox_store.rs`; tests and architecture gates still decide acceptance. |
| `sirinx-os/.worktrees/project-state-truth-20260719` | dirty 2; documentation-only candidate | Verbatim admission blocked: disk, dirty-count, and runtime claims are stale. Rebuild a new dated snapshot from current evidence instead. |
| `sirinx-os/.worktrees/pr1-deploy-pipeline-safe` | staged 2; 142 commits behind | Direct replay blocked. Current HEAD already has the executable path and the later V2 security contract remains unimplemented. Rebuild as a current-base two-file validator-only task with new tests and receipt. |
| `sirinx-os/.worktrees/claude` | clean; 35 commits behind | Historical evidence only. |
| `sirinx-os/.worktrees/codex` | clean; 249 commits behind | Historical evidence only. |
| `sirinx-os/.worktrees/opencode` | clean; 248 commits behind | Historical evidence only. |
| missing `/private/tmp` worktree records | directories absent | Metadata cleanup is separate and destructive; no action in this integration run. |
| PyTorch knowledge-manager research lane | clean receipt with bounded gaps | Knowledge input only. Exclude `.codex`, `.omx`, and any runtime configuration. |
| A2A/autopilot quarantine directories | empty or unknown | Keep quarantined until a candidate patch and evidence receipt exist. |

## Protected dirty roots

The following roots contain unrelated user-owned work and are not integration
targets:

- `/Users/sirinx/SIRINXDev/sirinx-co`
- `/Users/sirinx/sirinx-os`
- `/Users/sirinx/SIRINXDev/sirinx-agent-native-os`
- `/Users/sirinx/project-hermes`

OhMyCodex/OpenCode sandbox configuration and research `.codex` content remain
outside admission because they cross a protected configuration/secret boundary.

## Central admission order

1. Verify and close the active GoalSpec/Graph Memory lane.
2. Produce the six-path `sirinx-co` ownership read-back.
3. Verify the exact three-file durable-outbox final subset in a fresh
   current-base worktree.
4. Replace the project-state documentation candidate with a fresh evidence
   snapshot; do not copy the July 19 text.
5. Treat PR1 as a new two-file V2 implementation task, not a replay of the
   stale addition.
6. Keep stale Claude/Codex/OpenCode worktrees and missing temporary worktree
   records as historical evidence only.
7. Route knowledge artifacts through proposal-only graph memory; never copy
   agent configuration.
8. Reconcile `sirinx-agent-native-os` and `project-hermes` as separate
   repositories with their own base, owner, tests, and receipt.

## Current truth

`INVENTORIED` does not mean `ADMITTED`.

`ADMITTED` does not mean `MERGED`.

`MERGED` does not mean `RUNNING`.

`RUNNING` does not mean `PRODUCTION`.

No sandbox candidate other than the active GoalSpec/Graph Memory lane has been
replayed or integrated by this document.
