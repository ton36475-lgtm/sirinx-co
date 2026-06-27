# OpenCode and AGY Executor Contract

OpenCode and AGY Antigravity 2 are scoped executors inside the local A2A bridge.
They are not global orchestrators and do not replace Codex-local supervision.

## Required Inputs

Each executor task must include:

- `executor`: `opencode` or `agy-antigravity2`
- `lane`: a short lane name such as `a2a-docs` or `mission-control-fixture`
- `goal`: one concrete result
- `allowed_paths`: exact paths or path prefixes
- `validation_commands`: commands that prove the scoped result
- `task_id`: source A2A task id when available

## Execution Rules

- Create a lease before execution.
- Acquire a lane lock before repo mutation.
- Write a command plan artifact before any command execution.
- Keep provider calls disabled unless a separate budgeted provider policy
  explicitly allows them.
- Return artifacts to Codex-local for review before staging or commit.

## Blocked Work

- Policy or sandbox bypass.
- Secret reads or secret printing.
- Public port exposure.
- Force push, deploy, publish, or connector writes.
- Mutating a lane already locked by another executor.
- Running against broad paths such as repo root without a task-specific lease.

## Artifact Contract

Executor artifacts must be JSON and include:

- `adapter`
- `mode`
- `executor`
- `goal`
- `repo_path`
- `lane`
- `lease_id`
- `command_preview`
- `blocked_actions`
- `next_review_agent`

The artifact must not embed full `.env` contents, raw logs with secrets, browser
profiles, or private session data.
