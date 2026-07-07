# SIRINX Floating LINE CTA Production QA - 2026-07-07

## Scope

- Site: https://www.sirinx.co/
- Commit deployed: `932945841f7ba10948c16f35c40daa681d386a74`
- Deployment URL: https://bc30916f.sirinx-co.pages.dev
- Change verified: floating LINE Official CTA grouped with AI bot trigger in a bottom-right dock.

## Deployment Notes

The first Pages deploy used `dist` and produced a deployment URL that returned 404 because the static site build output is under `dist/public`.

The corrected production deploy used `dist/public` with the same commit and project, producing:

- https://bc30916f.sirinx-co.pages.dev

No DNS, R2, D1, KV, webhook, CRM/customer storage, provider/model call, secret read/print, or live message send was performed.

## Build And Validation

- Focused test: `client/src/test/footerLineCta.test.ts` -> 5 tests passed.
- Typecheck: `tsc --noEmit` -> passed.
- Frontend build: `vite build` -> passed.
- Static SEO generation: `server/staticSeoBuild.ts` -> generated 94 SEO routes, including 77 province routes.
- Server bundle: `esbuild server/_core/index.ts` -> passed.
- Diff whitespace check on changed source/test files -> passed.
- Changed-file secret scan -> no findings.

## Production Route Checks

Smoke routes checked on `https://www.sirinx.co`:

- `/`
- `/main`
- `/solar-carport/`
- `/line/`
- `/contact/`
- `/projects/`
- `/solutions/`
- `/pricing/`
- `/assessment/`
- `/home-solution/`
- `/about/`
- `/privacy/`
- `/terms/`
- `/cookies/`
- `/sitemap.xml`
- `/robots.txt`

Result: all returned HTTP 200.

Sitemap GET-only check:

- Sitemap URL count: 94
- HTTP 200 count: 94
- Non-200 results: 0
- Evidence: `json/sitemap-get-check.json`

## Browser QA

### Desktop

- Viewport: 1280 x 720
- Page title: `SIRINX | Solar Carport ลดค่าไฟองค์กร พร้อม EV Charger, BESS และ AI Energy`
- Solar Carport content present: yes
- Floating dock present: yes
- LINE CTA present: yes
- Bot trigger present: yes
- LINE href: `https://line.me/R/ti/p/%40304zrttj`
- LINE and bot are in the same row: yes
- Dock inside viewport: yes
- Horizontal overflow: no
- Console errors captured by browser: 0
- Evidence: `json/desktop-metrics.json`
- Screenshot: `screenshots/production-desktop-floating-line.png`

### Mobile

- Viewport: 390 x 844
- Solar Carport content present: yes
- Floating dock present: yes
- LINE CTA present: yes
- Bot trigger present: yes
- LINE href: `https://line.me/R/ti/p/%40304zrttj`
- LINE and bot are in the same row: yes
- LINE and bot overlap: no
- Dock inside viewport: yes
- Horizontal overflow: no
- Console errors captured by browser: 0
- Evidence: `json/mobile-metrics.json`
- Screenshot: `screenshots/production-mobile-floating-line.png`

### Bot Trigger Dry-Run

- Action: opened the AI bot panel on production mobile viewport.
- Message typed: no
- Message sent: no
- Close button visible: yes
- Text input visible: yes
- Send button visible: yes
- Evidence: `json/bot-open-metrics.json`
- Screenshot: `screenshots/production-mobile-bot-open-no-send.png`

## Verdict

`PRODUCTION_QA_PASS_FLOATING_LINE_CTA_VERIFIED`

The manual finding is fixed in production: the floating LINE Official CTA is now visible at the bottom-right and grouped in the same dock row as the AI bot trigger on desktop and mobile.

Deploy, push, DNS, R2, D1, KV, webhook activation, CRM/customer storage write, live Telegram/LINE/email/customer send, provider/model calls, and secret read/print remain separate gated surfaces.
