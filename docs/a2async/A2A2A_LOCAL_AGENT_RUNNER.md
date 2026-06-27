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
- Provider calls are disabled unless both `--execute` and
  `--allow-provider-call` are passed.
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
providers unless `--execute --allow-provider-call` is explicitly supplied.

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

## Next Build Lane

Codex should consume the first `ready_for_codex_plan` item from the dependency
fixture and produce a scoped implementation plan before any file edits.
