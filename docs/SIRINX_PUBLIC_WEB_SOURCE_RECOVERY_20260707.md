# SIRINX Public Web Source Recovery

Status: READY_FOR_LOCAL_RUN_OR_CI_REVIEW
Date: 2026-07-07
Source: `ton36475-lgtm/sirinx@main`
Target: `ton36475-lgtm/sirinx-co@codex/restore-public-web-source-20260707`
Target path: `apps/public-web/`

## Finding

`www.sirinx.co` still matches the complete public website source in `ton36475-lgtm/sirinx@main`.
The incomplete repository is `ton36475-lgtm/sirinx-co`, whose canonical monorepo branch had not yet imported the public website application.

The production hero text was verified against `client/src/components/HeroSlideshow.tsx`:

- `Solar Carport`
- `เปลี่ยนที่จอดรถ`
- `เป็นโรงไฟฟ้าพลังงานแสงอาทิตย์`
- `ขอใบเสนอราคา Solar Carport`
- `ดูผลงานจริง`

## Recovery Command

Run from the root of `sirinx-co` after checking out this branch:

```bash
node scripts/restore-public-web-from-sirinx.mjs --force
node scripts/verify-public-web-import.mjs
pnpm --dir apps/public-web install --ignore-scripts
pnpm --config.verify-deps-before-run=false --dir apps/public-web check
pnpm --config.verify-deps-before-run=false --dir apps/public-web build
```

## What The Restore Script Does

- clones `ton36475-lgtm/sirinx@main` into a temporary directory
- copies the public website source into `apps/public-web/`
- includes the shared `brands/` configuration required by the React app
- backs up an existing `apps/public-web/` directory before replacing it when `--force` is used
- creates or updates root scripts for `web:check`, `web:test`, and `web:build`
- writes `pnpm-workspace.yaml` if it is missing
- does not deploy
- does not mutate DNS, Cloudflare, R2, D1, KV, or secrets

## Safety Boundary

This recovery branch is source restoration only. It must stop after build validation.

Blocked actions remain blocked:

- deploy
- GitHub push outside the explicit branch/PR flow
- DNS or Cloudflare mutation
- secret read or print
- live LINE, Telegram, or email send

## Recommended Merge Gate

Only merge this branch after:

1. `node scripts/restore-public-web-from-sirinx.mjs --force`
2. `node scripts/verify-public-web-import.mjs`
3. `pnpm --dir apps/public-web install --ignore-scripts`
4. `pnpm --config.verify-deps-before-run=false --dir apps/public-web check`
5. `pnpm --config.verify-deps-before-run=false --dir apps/public-web build`
6. human review of imported diff

No production deployment is implied by this recovery.
