# Next Actions

## Immediate

1. Review `REPO_AUDIT_AND_MERGE_MAP.md`.
2. Review `SECURITY_QUARANTINE_REPORT.md`.
3. Review `docs/ADAPTIVE_SYNC_PC_NODE.md`.
4. Review `docs/TELEGRAM_CONTROL_PLANE.md`.
5. Run `npm run check`.
6. Review draft PR #1:
   `https://github.com/ton36475-lgtm/sirinx-co/pull/1`
7. Review `CLOUDFLARE_REAL_READINESS_REPORT.md`.

## After Approval

1. Decide Cloudflare tunnel route strategy:
   reuse `sirinx-hybrid-tunnel`, revive `SIRINX_SWARM`, or create `office-brain`.
2. Mount Windows `D:` as a Mac volume and rerun `npm run sync:plan`.
3. Start PR-MONO-003 or the public website import PR after governance is reviewed.
4. Prepare Cloudflare DNS/Tunnel/Access preview with rollback commands.

## Do Not Do Yet

- Do not deploy.
- Do not mutate Cloudflare DNS/Tunnel/Access without a confirmed-write gate.
- Do not expose `dev.sirinx.co`.
- Do not import legacy deploy scripts.
- Do not copy `.env` files.
- Do not activate customer messaging.
- Do not automate BotFather or send Telegram messages without action-time approval.
- Do not execute AdaptiveSync until Drive D is mounted and the dry-run is reviewed.
