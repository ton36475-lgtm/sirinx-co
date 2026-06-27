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

## Next Build Lane

Add a dry-run dispatch command that writes a new role task envelope into
`runtime/inbox/<role>/`, refreshes the fixture, and leaves provider mode off.
