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
5. KOB validates local command intent through Command Broker policy.
6. Mission Control observes generated fixtures only.

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
4. GLM-5.2 and DeepSeek worker reports follow only when Codex identifies a
   department-specific need.
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

## Next Build Lane

Codex should consume the first `ready_for_codex_plan` item from the dependency
fixture and produce a scoped implementation plan before any file edits.
