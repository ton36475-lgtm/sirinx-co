# Audit Log Policy

Status: active design layer.

## Required Fields

Every autonomous action must log:

- timestamp
- task id
- lease id
- project
- action type
- risk tier
- policy decision
- executor
- paths touched
- external services touched
- budget estimate
- rate limit key
- verification result
- rollback/quarantine result
- memory writeback result

## Location

Runtime audit logs live outside git:

`~/SIRINXDev/.ghostclaw_runtime/audit/`

Tracked docs may contain summaries, never raw secrets or live credentials.
