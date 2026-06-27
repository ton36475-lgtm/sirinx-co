# A2A Codex Sidebar Autoflow v3

Status: local-first scoped executor integration.

This document extends A2A Sync v2 so the Codex sidebar can coordinate KOB CLI,
OpenCode, AGY Antigravity 2, Manus, and Codex-local without creating a public
A2A server or bypassing command policy.

## Roles

| Agent              | Role                                 | Authority                |
| ------------------ | ------------------------------------ | ------------------------ |
| `kob-cli-opus`     | Planner, router, context compressor  | Plan only                |
| `codex-local`      | Repo supervisor and default executor | Scoped repo work         |
| `opencode`         | Coding/review executor               | Scoped lease required    |
| `agy-antigravity2` | Fast scaffold/refactor executor      | Scoped lease required    |
| `manus`            | Visual/spec artifact producer        | Metadata and hashes only |
| `ponytail`         | Minimalism review gate               | Review only              |

## Control Flow

```text
User goal
-> KOB planning summary
-> A2A task manifest
-> Codex command broker decision
-> executor route decision
-> executor lease
-> lane lock
-> dry-run command plan
-> scoped execution only when policy allows
-> Codex-local review
-> validation artifact
-> Obsidian memory pulse
```

## Hard Boundary

This is not a jailbreak layer. The bridge must not disable safety checks, bypass
tool policy, read secrets, expose public endpoints, or run unscoped commands.
The goal is command coordination with auditability.

## Codex Sidebar Behavior

The Codex sidebar remains the local control plane. It may show and review A2A
task state, executor leases, lane locks, Manus artifact hashes, and command
plans. Browser UI code must never run shell commands directly.

## Command Broker

All sidebar, KOB, Manus, OpenCode, and AGY requests that imply tool or Git repo
work must pass through the Codex Command Broker before executor routing. The
broker is defined in:

- `docs/a2async/CODEX_COMMAND_BROKER_TOOL_GITREPO_INTEGRATION.md`
- `policies/codex_command_broker.json`
- `scripts/a2a/a2a_command_broker.py`

The broker writes a runtime decision artifact and returns one of:

- `auto_allow_dry_run`
- `requires_executor_lease`
- `policy_controlled_registry_allow`
- `blocked_first_phase`
- `blocked`

It never runs provider calls, pushes, deploys, public endpoints, clones, or
repo mutations by itself.

## First Milestone

The first implementation milestone is complete when:

- OpenCode and AGY have agent cards.
- A2A model routing recognizes OpenCode and AGY task classes.
- Lease and lane lock scripts can create runtime manifests.
- Adapters can produce dry-run command plans without provider calls.
- Codex command broker can classify tool and repo actions into auditable
  runtime artifacts.
- JSON and Python syntax validation pass.
