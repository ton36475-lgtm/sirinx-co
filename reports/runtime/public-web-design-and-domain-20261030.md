# Public-web design batch 1 + host consolidation decision — 2026-10-30

Status: `BUILT_LOCAL / VERIFIED_LOCAL / DEPLOY_PENDING`

## 1. Frontend polish — batch 1 (homepage + shared rhythm)

Direction: keep the existing dark energy-tech system, replace hand-tuned spacing
with one rhythm, and make the repeated section header / card patterns consistent.

| Change | Where |
| --- | --- |
| `section-y` (clamp 3.5–6rem) and `section-y-sm` (2.5–4rem) replace the ad-hoc `py-16 lg:py-24` / `py-12 lg:py-16` / `py-10 lg:py-12` paddings across every homepage band | `client/src/index.css`, `client/src/pages/Home.tsx` |
| `eyebrow` class replaces nine copies of the long inline label style | same |
| `surface-card` (elevated surface, subtle border, 2px hover lift, reduced-motion opt-out) replaces the two hand-written card recipes | same |
| `text-wrap: balance` on `h1`/`h2` so headlines stop leaving orphan words | `client/src/index.css` |

Not changed in this batch: hero slideshow composition, 3D scenes, copy, motion
timings (still the named tokens), page-specific layouts other than home.

Verification: build rc 0; compiled CSS contains `.section-y`,
`.surface-card`, `.eyebrow`; `npm run web:test` 442/442; `npm run web:check`
rc 0; `npm run check` rc 0; SEO audit still 0 defects / 121 warnings.

## 2. Two-domain duplicate content — decision

**Decision: `www.sirinx.co` is the single canonical marketing host.**
`www.sirinx.org` becomes a permanent redirect to it.

Why: both hosts serve the same 108 documents, each canonicalising to itself,
with identical titles and body. `hreflang` does not fix two Thai hosts serving
the same text; only a canonical target or a redirect does. `.co` is already the
origin baked into `PRODUCTION_BASE_URL`, the sitemap, OG tags and JSON-LD, so
consolidating onto it avoids rewriting the build.

Implementation: `scripts/build-public-web-redirect-variant.mjs` + `npm run
web:build:org-redirect` produce `apps/public-web/dist-org-redirect` containing

- `_redirects` → `/* https://www.sirinx.co/:splat 301`
- `index.html` with `noindex, follow`, canonical to `.co` and a meta-refresh fallback
- `404.html`, `variant.json` (records `deployed: false`, rollback = `dist-org`)

Nothing is deleted: the full `.org` bundle remains the rollback target.

**Not deployed.** Publishing the redirect is a Cloudflare Pages action and needs
approval. After deploy, the `.org` property should be re-pointed at the
redirect bundle and the old build kept for one rollback window.

## 3. Route family per keyword map — scoped, not built

The keyword map targets 473 URLs; 385 have no page, including
`/solar-carport/<province>/{factory,bess,ev,hotel,commercial,…}`.

Building those as templates would violate the repo's own content gate:
`docs/seo/SEO_AEO_GEO_MASTERY_PLAN_20260926.md` sets a 3,200-word floor and a
Dice < 0.80 uniqueness ceiling, and §0 names template location pages as scaled
content abuse. A 400-word page per family × 77 provinces would be thin,
near-duplicate and a net risk.

Two evidence-safe paths, in order:

1. **Four national deep pages** — `/solar-carport/factory`, `/solar-carport/hotel`,
   `/bess` (already partly covered by `/solutions`), `/ev-charging`. Each needs
   its own data angle (load profile, roof vs carport decision, interconnection
   steps, PVGIS regional yield) plus QuotationSchema-safe FAQ; 1,200+ words is
   the minimum to be worth indexing, 3,200 to match the province standard.
2. **Bangkok canary × 4 families** — only for the province that already has
   hand-written 12k-word content, then measure indexing before scaling. This is
   the same canary pattern the repo used for the five-province static SEO pilot.

Route scaffolding was deliberately not created first: an empty route with
metadata but no reviewed content would look like coverage in the sitemap while
being exactly the thin page the gate forbids.

## 4. Open

- Deploy the redirect bundle (approval).
- Re-run the live sweep after deploy and confirm `.org` returns 301 for a
  sample of core + province URLs.
- Decide path 1 or path 2 for the keyword families, then write the content.
