# Telegram Command Bot

Status: dry-run service scaffold.

This service prepares the Telegram command lane for SIRINX OS. It does not poll, send, or mutate Telegram unless a later confirmed action provides credentials and enables send mode outside the repo.

## Dry Run

```bash
npm run telegram:bot:dry-run
```

## Real Mode Boundary

Real Telegram actions require:

- explicit user approval
- token from environment only
- owner id allowlist
- command allowlist
- audit log
- no customer messages in this phase
