# SIRINX Floating LINE CTA QA — 2026-07-07

## Scope

- Target issue: manual production review reported that the floating LINE button was missing from the bottom-right action area and was not grouped with the AI bot button.
- Repo: `/Users/sirinx/restore-sources/github-audit/sirinx-co`
- App: `apps/public-web`
- Mode: local source patch + local preview validation only.

## Root Cause

The footer/contact LINE CTA existed in `Layout.tsx`, but the floating contact layer in `App.tsx` rendered only the AI bot trigger before the chat widget was loaded. The loaded chat widget also returned to a bot-only floating trigger when closed. There was no standalone floating LINE anchor in the bottom-right action group.

## Changes

- Added a bottom-right `sirinx-floating-contact-dock` in `App.tsx` with:
  - `floating-line-cta` pointing to `lineOfficialConfig.addFriendUrl`
  - AI bot trigger grouped in the same row
  - compact mobile sizing and desktop expanded sizing
- Updated `FloatingChatWidget.tsx` so the post-load closed state keeps the same LINE + AI bot dock.
- Added regression coverage in `footerLineCta.test.ts` for:
  - initial floating LINE CTA beside the AI bot trigger
  - loaded chatbot trigger grouped with the floating LINE CTA
  - no webhook/message-send/customer-storage endpoint introduced

## Validation

- `./node_modules/.bin/vitest run client/src/test/footerLineCta.test.ts` — PASS, 5 tests.
- `./node_modules/.bin/tsc --noEmit` — PASS.
- `git diff --check -- apps/public-web/client/src/App.tsx apps/public-web/client/src/components/FloatingChatWidget.tsx apps/public-web/client/src/test/footerLineCta.test.ts` — PASS.
- `./node_modules/.bin/vite build` — PASS.
- `./node_modules/.bin/tsx server/staticSeoBuild.ts` — PASS, 94 SEO routes, 77 province routes.
- `./node_modules/.bin/esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist` — PASS.
- Secret-pattern scan over changed files — no findings.

## Visual Evidence

- Desktop: `reports/qa/p091t-floating-line-fix-20260707/screenshots/inapp-desktop-floating-line.png`
- Mobile: `reports/qa/p091t-floating-line-fix-20260707/screenshots/inapp-mobile-floating-line.png`

## Current Gate State

- Local fix: ready for review.
- Commit: not performed.
- Push: not performed.
- Deploy: not performed.
- Cloudflare/DNS/R2/D1/KV mutation: not performed.
- LINE/Telegram/email live send: not performed.
- Provider/model call: not performed.
- Secret read/print: not performed.

## Next Safe Gate

Open a scoped local commit gate for the three changed source/test files plus this QA evidence folder. Push and deploy should remain separate exact approval gates.
