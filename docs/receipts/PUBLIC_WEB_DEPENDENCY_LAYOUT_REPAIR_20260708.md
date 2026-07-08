# Public Web Dependency Layout Repair Receipt

Date: 2026-07-08

## Status

`apps/public-web` dependency/layout repair completed locally. No website page UI or route was changed for this repair.

## What Changed

- Added `apps/public-web/pnpm-workspace.yaml` so pnpm reads package-local override settings from the current supported config location.
- Repaired `apps/public-web/node_modules` using the app package manager (`pnpm@10.4.1`) through Corepack.
- Removed the stale `wouter@3.7.1` patch hook from package config and lockfile because the patch no longer applies and the app source does not reference `window.__WOUTER_ROUTES__`.
- Kept the old patch file in place as historical evidence; no destructive deletion was performed.
- Updated `LightMarkdown.test.tsx` to tolerate dev-time `data-loc` attributes while preserving the semantic `<strong>Ready</strong>` assertion.

## Verification

- `corepack pnpm run test`: PASS
  - 7 test files passed
  - 44 tests passed
- `corepack pnpm exec vitest run server/_core/lineWebhook.test.ts --root . --environment node`: PASS
  - 1 test file passed
  - 3 tests passed
- `corepack pnpm run check`: PASS
- `corepack pnpm run build`: PASS
  - Vite build passed
  - static SEO build generated 94 routes
  - server bundle passed
- `npm run verify:p092-agentloop`: PASS
- `npm run verify:public-web-line-i18n`: PASS
- `npm run verify:public-web-language-switch`: PASS
- `npm run verify:public-web-deps`: PASS
- `git diff --check`: PASS
- `npm run check`: PASS after root verifier symlink/env-quarantine repair

## Safety

- Push: no
- Deploy: no
- Telegram send: no
- LINE live reply: no
- Webhook production activation: no
- Production analytics mutation: no
- CRM/customer data storage: no
- Secret read or print: no

## Next Safe Action

Perform human review before commit/push/deploy gates.
