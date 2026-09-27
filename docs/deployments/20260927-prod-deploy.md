# Production deploy receipt — 2026-09-27

## What shipped
- commit `96c70bb` (13 commits, fast-forward from `ed9ae12`)
- branch `main`, pushed to `github.com/ton36475-lgtm/sirinx-co`
- Cloudflare Pages project `sirinx-co`, branch `main`
- deployment URL `https://11095ccf.sirinx-co.pages.dev`
- served at `www.sirinx.co` via the `sirinx-main-router` Worker

## Verified after deploy (measured, not assumed)
| route | before | after |
|---|---|---|
| /pricing/ H1 | 0 | 1 |
| /pricing/ visibleText | 0 | 344 |
| /projects/ H1 | 0 | 1 |
| /assessment/ H1 | 0 | 1 |
| /solar-carport/ H1 | 0 | 1 |
| /provinces/ h2 | 0 | 2 |
| homepageProvinceLinks | 0 | 77 |
| sampledWithFunnelLinks | 0/10 | 10/10 |
| sampledDescriptionOver160 | 10/10 | 0/10 |
| longestDescription | 202 | 148 |
| /feed.xml | 404 | 200 (107 items) |

`node scripts/audit-live-seo.mjs --compare` → exit 0, no metric worse than baseline.

## Tests run before deploy
- `pnpm --dir apps/public-web test` → 42 files / 331 tests passed
- `npm run control:test` → 48 files / 492 tests passed
- `pnpm --dir apps/public-web build` → exit 0

## Rollback
- git tag `backup/pre-push-20260927` → `96c70bb`
- previous production commit was `ed9ae12`; redeploy that build to revert
