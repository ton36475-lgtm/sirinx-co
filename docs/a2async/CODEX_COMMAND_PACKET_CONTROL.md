# Codex Command Packet Control

Status: local-only command-control layer.

The command packet turns every proposed executor command into an auditable
artifact before it can leave planning mode. It does not run shell commands. It
records the broker decision, command hash, risk flags, lease state, and the next
safe action.

## Why This Exists

The user-facing phrase "unlock all commands" is implemented as complete command
classification, not security bypass. Every command must be visible to Mission
Control before it can be handed to Codex-local, OpenCode, AGY Antigravity 2, or
another executor lane.

## Pipeline

```text
goal / command proposal
-> Codex command broker decision
-> command packet hash + risk scan
-> executor lease check when required
-> lane lock check in the executor phase
-> command may run only if the packet and lane policy allow it
```

## Generated Artifacts

- Script:
  `scripts/a2a/a2a_command_packet.py`
- Latest runtime JSON:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/codex_command_packet.json`
- Latest runtime Markdown:
  `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/codex_command_packet.md`
- Mission Control fixture:
  `apps/mission-control/src/fixtures/codexCommandPacketStatus.json`

## Packet Decisions

| Decision                           | Meaning                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `ready_dry_run_packet`             | Broker allows a local non-mutating dry-run command.                     |
| `ready_plan_only_lease`            | Lease exists but execution flag is false. Keep as plan only.            |
| `ready_with_executor_lease`        | Lease is valid and execution is allowed for the scoped lane.            |
| `preflight_required`               | Registry or adapter preflight must run before execution.                |
| `blocked_first_phase`              | Live or production action is not enabled in this phase.                 |
| `blocked_by_command_packet`        | Command text matched a blocking pattern.                                |
| `blocked_missing_or_invalid_lease` | Action requires an executor lease, but the lease is missing or invalid. |
| `blocked_by_broker`                | Broker policy blocks the action.                                        |

## Blocking Patterns

The first command-packet layer blocks command text that references:

- `.env`, private keys, browser profiles, token stores, or cookies
- destructive recursive deletion
- `git push`
- Cloudflare deploy commands
- Docker service start commands
- dependency installs
- direct database migration or destructive SQL
- curl/wget pipe-to-shell patterns
- `sudo` and world-writable permission changes

This is not a complete sandbox. It is a required pre-execution artifact and
should be paired with executor leases, lane locks, scoped staging, and local
validation.

## Mission Control

Mission Control exposes a read-only `Command Packet` panel. The browser reads a
static fixture only. It does not execute commands, read runtime files directly,
sync connectors, call providers, push, deploy, or expose public endpoints.

## Production Rule

No command should be sent to an executor runner unless it has:

1. A broker artifact.
2. A command packet.
3. A command hash.
4. No command-level block flags.
5. A valid executor lease when the broker decision requires one.
6. A lane lock before actual mutation.
7. A rollback or validation path for repo-affecting work.
