# A2A2A Local Agent Runner

The local agent runner is the first working transport layer for the A2A2A team.
It turns role inbox folders into a real local dispatch loop without opening
provider calls by default.

## Why This Exists

The Hermes Commander scaffold created doctrines, inboxes, outboxes, and runtime
folders. That was enough to describe the team, but not enough to make work move.
The missing part was a runner that polls role inboxes and writes results.

## Role Order

1. Hermes classifies the mission and routes the next task.
2. Opus writes architecture-first handoff notes before build work starts.
3. Codex owns repo integration, patches, tests, staging, and commits.
4. GLM-5.2 and DeepSeek return department worker reports and patch proposals.
5. AGY Antigravity returns fast UI/integration scaffold review notes.
6. KOB validates local command intent through Command Broker policy.
7. Mission Control observes generated fixtures only.

## Runtime Flow

```text
runtime/inbox/<role>/<task>.json
  -> ghostclaw_runner/agent_runner.py
  -> prompt from _OBSIDIAN_GHOSTCLAW_BRAIN or ghostclaw_runner/prompts
  -> runtime/outbox/<role>/<task>.result.json
  -> runtime/tasks/completed/<role>/<task>.json
  -> runtime/logs/runner-events.jsonl
```

## Safety Defaults

- Dry-run is the default.
- Provider calls are disabled unless `--execute`, `--allow-provider-call`, and
  `--provider-lease-path <command-broker-lease.json>` are all present. A
  missing, invalid, expired, or over-broad lease fails closed before any inbox
  task is moved.
- The browser UI never reads runtime folders directly.
- Mission Control reads only
  `apps/mission-control/src/fixtures/a2a2aRunnerStatus.json`.
- No git mutation, deploy, push, connector sync, Docker start, or secret read is
  performed by the runner.

## Mission Control Fixture

Generate the read-only fixture from runtime output:

```bash
python3 scripts/a2a/a2a_export_runner_status_fixture.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

The fixture is intentionally static so it can be reviewed, staged, and committed
as evidence without giving the frontend runtime access to local files.

## Bounded Watch Mode

For a real local mail-runner loop, keep provider calls disabled and run bounded
polling cycles:

```bash
python3 ghostclaw_runner/agent_runner.py \
  --agent all \
  --watch \
  --max-cycles 10 \
  --poll-interval 2 \
  --dry-run
```

This checks all role inboxes in role order and writes deterministic local
results. Use `--max-cycles` during operator-reviewed runs. Continuous watch
mode is available by leaving `--max-cycles` at `0`, but it still does not call
providers unless `--execute --allow-provider-call --provider-lease-path ...` is
explicitly supplied and the lease validates.

## Dispatch Command

Create a local role task envelope without provider calls:

```bash
python3 scripts/a2a/a2a_runner_dispatch_command.py \
  --role opus \
  --goal "Plan the next Codex build lane from the current A2A2A runner status" \
  --context-ref "Mission Control runner panel"
```

Create the envelope and process one task immediately through the dry-run runner:

```bash
python3 scripts/a2a/a2a_runner_dispatch_command.py \
  --role opus \
  --goal "Plan the next Codex build lane from the current A2A2A runner status" \
  --context-ref "Mission Control runner panel" \
  --run-once
```

`--run-once` still uses `ghostclaw_runner/agent_runner.py --dry-run`. It does
not enable provider calls.

## Handoff Router

After runner results exist, register local handoffs into a reviewable queue:

```bash
python3 scripts/a2a/a2a_handoff_router.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This reads `outbox/<role>/*.result.json` and writes:

- a runtime report at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/handoffs/latest.json`
- Codex review queue artifacts under
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/handoffs/codex_queue/`
- a static Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aHandoffRouter.json`

Codex queue items are review-only. They do not permit file edits by themselves.
The Codex queue is sorted in dependency order: Opus architecture handoffs first,
then GLM-5.2, DeepSeek, AGY, KOB, and Hermes. Inside the Opus lane, real
architecture handoffs such as `HERMES-OPUS-NEXT-CODEX-LANE` outrank smoke tasks
so Codex starts from a buildable handoff instead of a system check.

Role-to-role routing is deliberately separate from runner execution. To enqueue
safe role handoffs into a local role inbox, pass:

```bash
python3 scripts/a2a/a2a_handoff_router.py --route-role-inbox
```

Do not combine role inbox routing with unbounded runner watch mode. Use bounded
cycles first so a bad handoff cannot create a repeated task loop.

## Dependency Readiness

Generate the dependency board after runner output exists:

```bash
python3 scripts/a2a/a2a_dependency_readiness.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

The board turns runner results into a Codex build queue:

1. Hermes-owned routing must exist.
2. Opus architecture handoff must exist.
3. Codex may then create a scoped implementation plan.
4. GLM-5.2, DeepSeek, and AGY worker reports follow only when Codex identifies
   a department-specific need.
5. KOB validates local command intent only after Codex proposes commands.

This is a dependency gate, not a human approval gate. It prevents workers from
running out of order while keeping all work local and reviewable.

Dependency readiness uses the same task priority rule as the handoff router:
buildable Opus architecture handoffs, especially
`A2A2A-HERMES-OPUS-NEXT-CODEX-LANE-001`, outrank smoke checks. The Mission
Control fixture exposes `summary.nextCodexTaskId` and each queue item's
`taskPriority` so Codex, KOB, and external sidebars select the same next lane.

## Codex Build Plan

Create a plan-only Codex build artifact from the first ready queue item:

```bash
python3 scripts/a2a/a2a_codex_build_plan.py \
  --readiness-path apps/mission-control/src/fixtures/a2a2aDependencyReadiness.json \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This writes:

- a runtime plan under
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/codex_plans/`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aCodexBuildPlan.json`

The plan defines ordered steps, allowed paths, blocked paths, validation
commands, and worker dispatch recommendations. It is still plan-only; Codex
must open a scoped implementation lane before editing files.

## Worker Report Digest

After Codex creates a build plan, dispatch worker reports as local dry-runs:

```bash
python3 scripts/a2a/a2a_runner_dispatch_command.py \
  --role glm52 \
  --goal "Review the Codex build plan for structure and test coverage" \
  --context-ref /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/codex_plans/CODEX-PLAN-ec5461ae55.json \
  --run-once

python3 scripts/a2a/a2a_runner_dispatch_command.py \
  --role deepseek \
  --goal "Review command and data-flow risk for the Codex build plan" \
  --context-ref /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/codex_plans/CODEX-PLAN-ec5461ae55.json \
  --run-once

python3 scripts/a2a/a2a_runner_dispatch_command.py \
  --role agy \
  --goal "Review UI and integration scaffolding clarity for the Codex build plan" \
  --context-ref /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/codex_plans/CODEX-PLAN-ec5461ae55.json \
  --run-once

python3 scripts/a2a/a2a_runner_dispatch_command.py \
  --role kob \
  --goal "Validate local commands proposed by the Codex build plan" \
  --context-ref /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/codex_plans/CODEX-PLAN-ec5461ae55.json \
  --run-once
```

Then export a read-only digest for Mission Control:

```bash
python3 scripts/a2a/a2a_worker_report_digest.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

The digest includes role, task id, model alias, provider-call flag, summary,
planned actions, context references, and prompt hash. It does not include full
prompt bodies, secrets, or executable commands. If any worker report has
`providerCall=true`, treat the digest as review-required before using it for
Codex planning.

## Worker Follow-up Brief

After the first Codex implementation lane is closed, convert the report-only
worker packet into a concrete next-lane brief for Codex:

```bash
python3 scripts/a2a/a2a_worker_followup_brief.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This reads:

- `apps/mission-control/src/fixtures/a2a2aWorkerReportDigest.json`
- `apps/mission-control/src/fixtures/a2a2aTeamWorkPackets.json`

It writes:

- a runtime report at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/worker_followup/latest.json`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aWorkerFollowupBrief.json`

The brief does not execute worker recommendations. It translates GLM-5.2,
DeepSeek, AGY, and KOB report-only output into a Codex-owned follow-up lane with
allowed paths, blocked actions, validation commands, and the source packet that
triggered the handoff. If the worker digest has any provider calls, or the
`consume_report_only_feedback` packet is missing, the brief blocks the next lane
instead of silently advancing.

Mission Control uses this fixture to show the next safe action after all scoped
Codex packets in the current implementation lane are complete. Workers remain
inputs only; Codex remains the Git owner; provider calls still require a valid
Command Broker lease.

## Implementation Lane Packet

Create the final review packet that turns the Codex plan and worker reports into
an ordered implementation lane:

```bash
python3 scripts/a2a/a2a_implementation_lane_packet.py \
  --build-plan-path apps/mission-control/src/fixtures/a2a2aCodexBuildPlan.json \
  --worker-digest-path apps/mission-control/src/fixtures/a2a2aWorkerReportDigest.json \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This writes:

- a runtime packet under
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/implementation_lanes/`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aImplementationLanePacket.json`

The packet defines dependency gates, priority work items, worker evidence,
allowed paths, blocked paths, validation commands, blocked actions, acceptance
criteria, and the exact scoped stage command. It intentionally keeps
`executionAllowed=false`; Codex still has to review, implement, validate, and
stage only the listed files.

## Completion Audit

Before opening the first scoped Codex implementation lane, generate the
read-only completion audit:

```bash
python3 scripts/a2a/a2a2a_completion_audit.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This reads only the generated Mission Control fixtures and writes:

- a runtime report at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/completion_audits/latest.json`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aCompletionAudit.json`

The audit proves the role roster, dependency order, provider boundary, worker
reports, handoff router, AGY gate, blocked actions, and implementation packet
readiness before Codex opens a real implementation lane.

## First Codex Implementation Lane

Open the first scoped Codex-owned implementation lane from the implementation
packet and completion audit:

```bash
python3 scripts/a2a/a2a_codex_first_implementation_lane.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This writes:

- a runtime lane at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/codex_implementation_lanes/`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aFirstCodexImplementationLane.json`

The lane is the first point where Codex may edit files, but only inside the
allowed paths and only after reviewing the lane tasks. Workers remain
report-only. Provider calls, connector sync, deploy, push, secrets, generated
`web-sirinx` asset mutation, and `git add .` remain blocked.

## Backlog Priority Board

Export a read-only backlog priority board from `NEXT_ACTIONS.md`:

```bash
python3 scripts/a2a/a2a_backlog_priority.py \
  --next-actions NEXT_ACTIONS.md \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This writes:

- a runtime report at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/backlog_priority/latest.json`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aBacklogPriority.json`

The board is deterministic and local-only. It reads `NEXT_ACTIONS.md`, extracts
unchecked tasks, assigns owner and priority labels, masks secret-like text, and
keeps blocked gates separate from ready review items. It does not execute KOB,
call providers, sync connectors, clone repos, deploy, push, or mutate generated
`web-sirinx` assets.

## Team Assignment Board

Export the current A2A2A assignment board from local Mission Control fixtures:

```bash
python3 scripts/a2a/a2a_team_assignment_board.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This reads:

- `apps/mission-control/src/fixtures/a2a2aBacklogPriority.json`
- `apps/mission-control/src/fixtures/a2a2aFirstCodexImplementationLane.json`
- `apps/mission-control/src/fixtures/a2a2aImplementationLanePacket.json`

It writes:

- a runtime report at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/team_assignment/latest.json`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aTeamAssignmentBoard.json`

The assignment board is the handoff layer between planning and coding. It makes
the role map explicit, combines the first Codex implementation lane with P0/P1
backlog items, and surfaces the next Codex action. It remains read-only: GLM-5.2,
DeepSeek, AGY, and KOB are report/validation inputs only, while Codex is the only
scoped repo editor.

## Team Work Packets

Export role-scoped work packets from the assignment board:

```bash
python3 scripts/a2a/a2a_team_work_packets.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This reads:

- `apps/mission-control/src/fixtures/a2a2aTeamAssignmentBoard.json`
- `apps/mission-control/src/fixtures/a2a2aFirstCodexImplementationLane.json`
- `apps/mission-control/src/fixtures/a2a2aScopedPathGuard.json`

It writes:

- a runtime report at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/work_packets/latest.json`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aTeamWorkPackets.json`

The packet layer is the first machine-readable "do this next" surface for the
team. Each packet declares owner, owner mode, allowed actions, blocked actions,
allowed paths, planned files, and validation commands. Codex packets may allow
scoped repo edits; worker packets stay report-only; KOB remains validate-only.
No packet enables provider calls, connector sync, deploy, push, secret reads,
generated `web-sirinx` asset mutation, or `git add .`.

## Team Work Packet Validation

Run the allowlisted validation commands for the current validation packet:

```bash
python3 scripts/a2a/a2a_team_work_packet_validation.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This reads:

- `apps/mission-control/src/fixtures/a2a2aTeamWorkPackets.json`

It writes:

- a runtime report at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/work_packet_validations/latest.json`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aTeamWorkPacketValidation.json`

The validation runner does not execute arbitrary packet text. It runs the fixed
allowlist for this lane: focused runner/fixture tests, Mission Control
TypeScript, Prettier check, Python compile, JSON parse, and scoped diff checks.
It keeps provider calls, connector sync, deploy, push, secrets, generated
`web-sirinx` asset mutation, and `git add .` blocked.

## Team Work Packet Outcome

Record a completed role-scoped packet before regenerating the work packet board:

```bash
python3 scripts/a2a/a2a_team_work_packet_outcome.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This reads:

- `apps/mission-control/src/fixtures/a2a2aTeamWorkPackets.json`
- `apps/mission-control/src/fixtures/a2a2aScopedPathGuard.json`

It writes:

- a runtime report at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/work_packet_outcomes/latest.json`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aTeamWorkPacketOutcome.json`

After an outcome reports `packet_completed`, regenerate the work packet board.
The completed packet becomes `completed`, `executionAllowed=false`, and the
next Codex packet advances to the next scoped task. This keeps A2A2A as a real
queue with local evidence, without letting workers edit files or letting the UI
touch runtime folders directly.

For the `run_validation_commands` packet, the outcome requires
`a2a2aTeamWorkPacketValidation.json` to report `passed`. A dry-run validation or
missing validation report is not enough to close that packet.

## Codex Lane Outcome

Record the first Codex-owned implementation slice outcome:

```bash
python3 scripts/a2a/a2a_codex_lane_outcome.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This writes:

- a runtime report at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/codex_lane_outcome/latest.json`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aCodexLaneOutcome.json`

The outcome fixture closes only the first Codex-owned inspection slice. After it
exists, the assignment board treats `inspect_plan_and_worker_digest` as
completed and advances the next Codex action to `implement_only_allowed_paths`.

## Scoped Path Guard

Before Codex stages any A2A2A implementation slice, regenerate the scoped path
guard:

```bash
python3 scripts/a2a/a2a_scoped_path_guard.py \
  --runtime-root /Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a
```

This writes:

- a runtime report at
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2a2a/scoped_path_guard/latest.json`
- a Mission Control fixture at
  `apps/mission-control/src/fixtures/a2a2aScopedPathGuard.json`

The guard compares the implementation packet's planned files and scoped stage
command against the lane's allowed and blocked paths. It also reports existing
dirty paths from the worktree so generated `web-sirinx` assets and other
unrelated lanes stay visible but untouched.

The guard is intentionally evidence-only:

- it does not stage files
- it does not clean dirty lanes
- it does not read secrets
- it does not call providers
- it does not deploy, push, or sync connectors
- it keeps `git add .` blocked

If `plannedBlocked` is greater than zero, stop and fix the packet before any
stage attempt. If only `outOfScopeDirty` is greater than zero, continue with the
scoped file list and leave those dirty lanes alone.

## Next Build Lane

Codex should consume the first `ready_for_codex_plan` item from the dependency
fixture and produce a scoped implementation plan before any file edits.
