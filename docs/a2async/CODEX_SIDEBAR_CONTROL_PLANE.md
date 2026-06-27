# Codex Sidebar Control Plane

The Codex sidebar project `Ghostclaw Autoflow and autocut` is the local operator
surface for A2A work.

## Surfaces

| Surface        | Purpose                                          |
| -------------- | ------------------------------------------------ |
| Codex sidebar  | Operator-visible planning and execution surface  |
| Canonical repo | A2A docs, scripts, policies, and agent cards     |
| Runtime root   | Queue, artifacts, leases, locks, logs, summaries |
| Obsidian Brain | Concise non-secret memory pulses                 |

## Sidebar Responsibilities

- Show the current goal and selected A2A lane.
- Show the latest Codex command broker decision for tool/repo requests.
- Route tasks to KOB, Codex-local, OpenCode, AGY, or Manus.
- Keep command plans reviewable.
- Keep repo mutations scoped and auditable.
- Record next safe action after each meaningful run.

## What It Must Not Do

- Run shell commands from browser UI code.
- Store secrets in fixtures or docs.
- Treat generated Manus HTML as production source.
- Allow multiple executors to mutate the same lane.
- Convert a policy block into a bypass request.

## Recommended Read Order

1. `docs/a2async/KOB_AGENT.md`
2. `docs/a2async/KOB_CODEX_SIDEBAR_TASK.md`
3. `docs/a2async/A2A_CODEX_SIDEBAR_AUTOFLOW_V3.md`
4. `docs/a2async/OPENCODE_AGY_EXECUTOR_CONTRACT.md`
5. `docs/a2async/A2A_EXECUTOR_LEASE_AND_LOCK_POLICY.md`
6. `docs/a2async/CODEX_COMMAND_BROKER_TOOL_GITREPO_INTEGRATION.md`
