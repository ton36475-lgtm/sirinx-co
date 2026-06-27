# Kill Switch Policy

Status: active design layer.

## Purpose

The kill switch is the emergency brake for full-auto mode. It is not an
approval gate. It stops new risky execution when the operator needs the system
to pause.

## Runtime Path

`~/SIRINXDev/.ghostclaw_runtime/kill_switch/STOP_ALL`

## Behavior

When STOP_ALL exists:

- Do not start new external jobs.
- Do not start Docker services.
- Do not call providers.
- Do not publish or send messages.
- Do not deploy.
- Allow read-only inspection and audit summary generation.

Existing tasks should stop at the nearest safe checkpoint and write audit logs.
