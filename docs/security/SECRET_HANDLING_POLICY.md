# Secret Handling Policy

Status: active.

## Core Rules

- Never print secret values.
- Never commit secrets.
- Never read browser profiles, password stores, SSH keys, cloud configs, or
  credential stores unless the human explicitly approves a bounded inspection.
- Use environment variables or ignored local secret slots.
- Masked scans must output only `file:line`.

## Local Secret Slots

Allowed only when ignored by Git and owner-readable where possible. Example
patterns:

- `.env.*.local`
- `.mcp.local/*.json`
- approved keychain-backed environment injection

## Scanner Rule

The project should prefer masked scanners over commands that print matching
lines. Existing scanners that print full lines must not be used on sensitive
worktrees until replaced or wrapped.

## Provider Key Rule

External model/API keys, including `ZAI_API_KEY`, must come from environment
variables. They must not be placed in tracked files or output logs.

## Incident Handling

If a secret value is printed or found in tracked files, stop immediately,
record the file path without repeating the value, and request rotation guidance.
