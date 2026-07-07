# PR3 Preview UAT Evidence - 2026-07-07

Gate: `APPROVE_PR3_PREVIEW_UAT_REVIEW_20260707`

Repository: `ton36475-lgtm/sirinx-co`

PR: https://github.com/ton36475-lgtm/sirinx-co/pull/3

Merged commit: `1fee8e7e0f03ceff4eb6b397f3069912ca834183`

Cloudflare Pages project: `sirinx-co`

Preview deployment:

- `https://65a5bd27.sirinx-co.pages.dev`
- `https://pr3-public-web-restore-20260.sirinx-co.pages.dev`

## Validation Before Preview Deploy

- `node scripts/verify-public-web-import.mjs`: passed
- `pnpm --config.verify-deps-before-run=false --dir apps/public-web check`: passed
- `pnpm --config.verify-deps-before-run=false check`: passed
- `pnpm --config.verify-deps-before-run=false --dir apps/public-web build`: passed

## Preview HTTP Checks

Primary preview URL:

| Route | Status | Bytes |
| --- | ---: | ---: |
| `/` | 200 | 10797 |
| `/solar-carport/` | 200 | 8406 |
| `/contact/` | 200 | 8630 |
| `/projects/` | 200 | 8226 |
| `/solutions/` | 200 | 8912 |
| `/sitemap.xml` | 200 | 18126 |
| `/robots.txt` | 200 | 84 |

Preview alias URL:

| Route | Status | Bytes |
| --- | ---: | ---: |
| `/` | 200 | 10797 |
| `/solar-carport/` | 200 | 8406 |
| `/contact/` | 200 | 8630 |
| `/projects/` | 200 | 8226 |
| `/solutions/` | 200 | 8912 |
| `/sitemap.xml` | 200 | 18126 |
| `/robots.txt` | 200 | 84 |

## Content Checks

The preview HTML contains Solar Carport metadata and SIRINX brand content:

- `SIRINX | Solar Carport วางแผนลดค่าไฟองค์กร พร้อม EV Charger, BESS & AI Energy`
- `Solar Carport โดย SIRINX | เปลี่ยนที่จอดรถเป็นโรงไฟฟ้า ผลิตไฟฟ้า+ร่มเงา+EV Charger`
- `SIRINX — Solar Carport พร้อม BESS และ AI Energy Management`

## Gate Boundaries

Performed:

- Preview UAT review only
- Local evidence file write

Not performed in this gate:

- Production deploy
- DNS mutation
- R2/D1/KV mutation
- LINE webhook activation
- CRM/customer storage write
- Live Telegram/LINE/email/customer send
- Provider/model call
- Secret read/print

## Next Gate

Approved next gates received in the same operator instruction:

- `APPROVE_PR3_SCOPED_PREVIEW_EVIDENCE_COMMIT_20260707`
- `APPROVE_PR3_PRODUCTION_DEPLOY_20260707`

Production deploy remains scoped to Cloudflare Pages project `sirinx-co`, commit
`1fee8e7e0f03ceff4eb6b397f3069912ca834183`, and branch `main`. DNS, R2, D1, KV,
webhooks, live sends, provider/model calls, and secret read/print remain blocked.
