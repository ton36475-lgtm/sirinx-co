# Command Audit Logging

The command broker writes audit-ready artifacts before execution is considered.
The audit layer is append-only by policy. Mission Control may read summaries
but must not edit audit logs.

## Runtime Logs

Runtime logs live outside git:

`/Users/sirinx/SIRINXDev/.ghostclaw_runtime/command_broker/logs/`

Files:

- `command-audit.jsonl`
- `command-denied.jsonl`
- `command-execution.jsonl`
- `incidents.jsonl`

## Audit Event Fields

Each audit event should include:

- `eventId`
- `requestId`
- `tool`
- `action`
- `riskTier`
- `decision`
- `reason`
- `commandSha256`
- `createdAt`
- `actor`
- `lane`
- `sourceArtifact`

## Redaction Rules

Audit events must not contain:

- `.env` values
- private keys
- raw tokens
- browser cookies
- account recovery codes
- raw provider credentials

Store hashes and references instead of secret values.
