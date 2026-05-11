# Project State

## Current Phase

```text
PR-MONO-002: AdaptiveSync PC node and Telegram dry-run control
```

## Current Branch

```text
codex/pr-mono-002-adaptive-sync-telegram
```

## Status

- Target repo cloned locally from `ton36475-lgtm/sirinx-co`.
- Source repos cloned read-only into a local audit cache.
- Governance scaffold created.
- AdaptiveSync PC-node dry-run planner created.
- Windows Drive D handoff pack generated under `exports/drive-d/SIRINX_OS_PC_NODE_HANDOFF`.
- Telegram command lane created in dry-run mode only.
- Windows `D:` is not mounted on this Mac yet; no cross-device copy executed.
- No legacy code copied.
- No GitHub push.
- No Cloudflare mutation.
- No deploy.
- No real Telegram send.
- No BotFather action.
- No production DB write.
- External writes executed: NO.

## Latest Verification

Run:

```bash
npm run check
npm run sync:plan
npm run telegram:preview
npm run telegram:bot:dry-run
```

## Blocked Until

- Human approval for PR-MONO-001 push/PR.
- Human approval before PR-MONO-002 legacy website import.
- Mounted Windows Drive D share before any real AdaptiveSync execution.
- Telegram bot token and chat id configured outside repo before any real send.
- Cloudflare auth and Access policy before private route activation.
