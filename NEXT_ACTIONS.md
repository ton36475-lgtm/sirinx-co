# Next Actions

## Immediate

1. Review `REPO_AUDIT_AND_MERGE_MAP.md`.
2. Review `SECURITY_QUARANTINE_REPORT.md`.
3. Review `docs/ADAPTIVE_SYNC_PC_NODE.md`.
4. Review `docs/TELEGRAM_CONTROL_PLANE.md`.
5. Run `npm run check`.
6. Approve or revise PR-MONO-001 / PR-MONO-002 local branches.

## After Approval

1. Push branch `codex/pr-mono-001-inventory-quarantine`.
2. Open PR-MONO-001.
3. Push branch `codex/pr-mono-002-adaptive-sync-telegram` if you want the PC-node/Telegram scaffold reviewed separately.
4. Mount Windows `D:` as a Mac volume and rerun `npm run sync:plan`.
5. Start PR-MONO-003 or the public website import PR after governance is merged.

## Do Not Do Yet

- Do not deploy.
- Do not mutate Cloudflare.
- Do not expose `dev.sirinx.co`.
- Do not import legacy deploy scripts.
- Do not copy `.env` files.
- Do not activate customer messaging.
- Do not automate BotFather or send Telegram messages without action-time approval.
- Do not execute AdaptiveSync until Drive D is mounted and the dry-run is reviewed.
