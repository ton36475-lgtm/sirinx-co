# A2A2A P091T Footer LINE QR CTA - 2026-07-07

## Status

`P091T_FOOTER_LINE_QR_CTA_READY_FOR_REVIEW`

## Scope

Approved local-only patch:

- Add a LINE Official QR CTA block to the existing footer/contact area.
- Reuse existing SIRINX LINE Official data from prior local source evidence.
- Do not redesign or replace the Solar Carport page.
- Do not deploy, push, mutate Cloudflare/DNS/R2/D1/KV, activate webhook, send live messages, call providers, or read/print secrets.

## Files Changed

- `apps/public-web/client/src/components/Layout.tsx`
- `apps/public-web/shared/lineOfficial.ts`
- `apps/public-web/client/src/test/footerLineCta.test.ts`
- `reports/mission/A2A2A_P091T_FOOTER_LINE_QR_CTA_20260707.md`
- `reports/review/p091t/footer_line_qr_cta_receipt.json`

## LINE Data Reused

Source evidence found in existing local SIRINX site/source material:

- LINE ID: `@304zrttj`
- Short link: `https://lin.ee/S97R6nj`
- Add-friend URL: `https://line.me/R/ti/p/%40304zrttj`
- Chat URL: `https://line.me/R/oaMessage/%40304zrttj`
- QR image: `https://qr-official.line.me/gs/M_304zrttj_GW.png?oat_content=qr`

## Implementation Summary

- Added `lineOfficialConfig` under `apps/public-web/shared/lineOfficial.ts`.
- Appended a `footer-line-qr` section inside the existing `Footer` brand/contact column in `Layout.tsx`.
- Preserved existing footer navigation, contact email/phone/address, social links, certification badges, and bottom legal links.
- Added accessible labels, lazy QR image loading, explicit QR alt text, keyboard-visible focus styles, and mobile-friendly stacking.
- Added a regression test that checks canonical LINE data, footer CTA source, and absence of webhook/message-send/CRM patterns in touched source.

## Validation

Passed:

- TDD red check before implementation: no-install static check failed as expected because footer LINE QR CTA was missing.
- No-install static regression after implementation: passed.
- Scoped diff check on touched files: passed.
- Scoped secret pattern scan on touched files: no findings.
- Targeted Vitest in temp validation copy: `src/test/footerLineCta.test.ts` passed, 3/3 tests.
- Production-mode package tests in temp validation copy: passed, 7 files / 42 tests.
- TypeScript check in temp validation copy: passed.
- Production build in temp validation copy: passed.
- Built `dist` contains `footer-line-qr`, `@304zrttj`, LINE QR image URL, short link, and chat URL.

Validation Environment Note:

- The current worktree has no `node_modules`, so direct package commands there are unavailable without install.
- No dependency install was performed.
- Validation was completed in `/tmp/sirinx-p091t-validate.tJn7v7`, a temp copy of the current worktree with `node_modules` symlinked from the sibling validated worktree.
- A dev-mode full test run in the temp copy exposed an unrelated `LightMarkdown` Vite `data-loc` snapshot mismatch. The P091T targeted test passed, and the production-mode full test passed.

## Blocked Actions Confirmed

- No production deploy.
- No preview deploy.
- No git push.
- No Cloudflare/DNS/R2/D1/KV mutation.
- No LINE webhook activation.
- No CRM/customer storage write.
- No live Telegram/LINE/email/customer send.
- No provider/model API call from scripts.
- No secret read/print.
- No full page rewrite.
- No full repo cleanup.
- No `git add -A`.

## Next Safe Gate

`P091T_OPENCODE_REVIEW_FOOTER_LINE_QR_CTA`

Review should verify:

1. Footer/contact area contains the LINE Official QR CTA.
2. Existing QR/link data was reused.
3. The Solar Carport page structure remains intact.
4. No webhook/live-send/CRM/customer storage path was introduced.
5. Build/test validation evidence from the temp dependency-backed copy is acceptable for review, or rerun package validation in a fully installed worktree before any preview deploy packet.
