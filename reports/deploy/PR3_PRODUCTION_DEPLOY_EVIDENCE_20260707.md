# PR3 Production Deploy Evidence - 2026-07-07

Gate: `APPROVE_PR3_PRODUCTION_DEPLOY_20260707`

Repository: `ton36475-lgtm/sirinx-co`

PR: https://github.com/ton36475-lgtm/sirinx-co/pull/3

Merged source commit: `1fee8e7e0f03ceff4eb6b397f3069912ca834183`

Cloudflare Pages project: `sirinx-co`

Production branch used for Pages deploy: `main`

Production deployment URL:

- `https://022614bb.sirinx-co.pages.dev`

Production domain:

- `https://www.sirinx.co`

## Production Deploy Command Scope

The approved deploy was scoped to Cloudflare Pages static asset deployment only:

- Project: `sirinx-co`
- Branch: `main`
- Commit hash attached: `1fee8e7e0f03ceff4eb6b397f3069912ca834183`
- Commit message attached: `Merge PR #3: restore SIRINX public web source`

No DNS, R2, D1, KV, webhook, CRM/customer storage, live messaging, provider/model
call, or secret read/print was approved or performed.

## Verification

Production domain:

| Route | Status | Bytes |
| --- | ---: | ---: |
| `/` | 200 | 11716 |
| `/solar-carport/` | 200 | 9325 |
| `/contact/` | 200 | 9549 |
| `/projects/` | 200 | 9145 |
| `/solutions/` | 200 | 9831 |
| `/sitemap.xml` | 200 | 18126 |
| `/robots.txt` | 200 | 67 |

Deployment URL:

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

The production domain and deployment URL both returned Solar Carport/SIRINX
metadata:

- `SIRINX | Solar Carport วางแผนลดค่าไฟองค์กร พร้อม EV Charger, BESS & AI Energy`
- `Solar Carport โดย SIRINX | เปลี่ยนที่จอดรถเป็นโรงไฟฟ้า ผลิตไฟฟ้า+ร่มเงา+EV Charger`
- `SIRINX — Solar Carport พร้อม BESS และ AI Energy Management`

## Rollback Scope

Rollback was not executed. If rollback is needed, it must be opened as a separate
approval gate and should redeploy the previous known-good Pages deployment or
commit after validating the target deployment URL and branch scope.

## Gate Boundaries

Performed:

- Cloudflare Pages production deploy for project `sirinx-co`
- Read-only HTTP/content verification
- Local evidence file write

Not performed:

- DNS mutation
- R2/D1/KV mutation
- LINE webhook activation
- CRM/customer storage write
- Live Telegram/LINE/email/customer send
- Provider/model call
- Secret read/print
- Rollback
- Git push

## Next Safe Action

Open a separate scoped evidence commit/push gate if this production deploy
evidence should be recorded in remote Git history.
