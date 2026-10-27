# www.sirinx.co / www.sirinx.org — site work, 2026-10-27

Status: `LOCAL_FIXES_VERIFIED / DEPLOY_HELD / ONE_ORIGIN_DEAD`

Scope: everything the two public sites own — fonts, caching, headers, the
live matrix, and the defects that need a cloud or operator decision. Nothing
was deployed, no DNS/Worker/Access change was made, and no production lead was
written.

## 1. Landed in the repo (verified locally)

### 1.1 Fonts are self-hosted

The asset previously stated as a C8 decision was measured and closed on the
repo side: the page no longer calls `fonts.googleapis.com` or
`fonts.gstatic.com`.

| Fact | Before | After |
| --- | --- | --- |
| font hosts fetched per visitor | 2 | **0** |
| `@font-face` declarations | 0 local (remote CSS) | **7 local** |
| font payload | remote, 2 extra RTTs | **85.0 KiB** (8 woff2 files, latin+thai only) |
| CSP `font-src` | `'self' https://fonts.gstatic.com` | **`'self'`** |
| CSP `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | **`'self' 'unsafe-inline'`** |

Files: `apps/public-web/client/public/fonts/{fonts.css,LICENSE.txt,*.woff2}`.
Space Grotesk is one variable woff2 for 600–700 (Google serves the same file
for both weights); IBM Plex Sans Thai ships 400/600/700 × latin/thai.
`LICENSE.txt` records provenance and the SIL OFL 1.1 terms; it deliberately
contains **no literal URL** so the egress guard does not treat documentation
as a fetch.

The two primary body faces (Thai 400, Latin 400) are preloaded; the stylesheet
is a local `<link>`, not the old `onload` swap.

### 1.2 A duplicate Cache-Control that disabled asset caching

Cloudflare Pages concatenates every matching `_headers` rule into one value.
`/*` set `max-age=0, must-revalidate` and `/assets/*` set
`max-age=31536000, immutable`, so production shipped:

```text
cache-control: public, max-age=0, must-revalidate, public, max-age=31536000, immutable
```

Duplicate `max-age` directives are not resolved in the browser's favour: RFC
9111 says such a response is stale, so the immutable year was effectively
ignored. The fix detaches the inherited header in each specific rule
(`! Cache-Control`). Verified against the built bundle with
`wrangler pages dev` (local, no deploy):

| Path | Header now |
| --- | --- |
| `/` | `public, max-age=0, must-revalidate` |
| `/assets/index-*.js` | `public, max-age=31536000, immutable` (single value) |
| `/fonts/*.woff2` | `public, max-age=604800` (stable names, 1-week TTL) |
| `/sitemap.xml` | `public, max-age=3600` + `application/xml; charset=utf-8` |

### 1.3 Tests and checks

`shared/staticDeploySurface.test.ts` gained 6 tests: no third-party font host
in the shell, `font-src`/`style-src` restricted to self, every font file that
`fonts.css` declares exists, and no `Cache-Control` override without a detach
(including a guard that the asset rule has exactly one `max-age`).

| Check | Result |
| --- | --- |
| `npm run web:check` (tsc) | rc 0 |
| web vitest | **417/417**, 52 files |
| `npm run web:build:dual` | rc 0 — 108 HTML pages, 77 redirects, 118 retargeted, `leftovers: []` |
| `node scripts/verify-public-web-egress.mjs --dist` | **PASS**, 0 errors, 9 warnings (was 11; the two font warnings are gone) |
| `npm run check` (root) | rc 0 |
| `node scripts/audit-live-seo.mjs --compare` | rc 0, no regression, og:image 2/2 retrievable |

Local build identity: `assets/index-ROwWgmdn.js`, `assets/index-EM3xbtF_.css`,
dist 37 MB / dist-org 32 MB. Production still serves `assets/index-DuQydVdg.js`
from build `d0a7f0f`, so everything above is **not live yet**.

## 2. Live matrix (measured, before deploy)

| Check | www.sirinx.co | www.sirinx.org |
| --- | --- | --- |
| `/` | 200 | 200 |
| canonical | `https://www.sirinx.co/` | `https://www.sirinx.org/` |
| apex → www | **301** | **200 (duplicate)** |
| http → https | 301 | 301 |
| unknown path | **404** (honest) | **404** |
| sitemap | 105 URLs, all `.co` | 105 URLs, all `.org` |
| legacy `/solar-carport-bangkok/` | 301 → `/solar-carport/bangkok/` | 301 → same on `.org` |
| `robots.txt` | allow + AI bots, `Disallow: /admin` | same |
| security headers | HSTS, CSP, COOP, nosniff, referrer, permissions | same |
| `/api/trpc/lead.submit` OPTIONS | **204** | **405** |
| `/api/trpc/lead.submit` POST `{}` | **400** (validation) | **405** (no route) |

The `.org` numbers are the defect: it is a custom domain of Pages project
`sirinx-co-preview`, not a route of the `sirinx-main-router` Worker, so the
lead endpoint that Worker owns does not exist there. A visitor who fills in the
contact form on `www.sirinx.org` gets a transport error; the lead is never
written. The Worker (`infra/cloudflare/main-router`) also only knows
`www.sirinx.co`/`sirinx.co` and returns 404 for every other hostname, so fixing
it needs a route + host support in Worker code — a cloud change.

Two project detail pages (`/projects/ruenphae-royal-park/`,
`/projects/holatel-rim-nan/`) answer 200 but are `noindex, nofollow` and are
excluded from the sitemap on purpose: `isProjectDetailIndexable` requires
`publicationState=PUBLISHED` **and** `numericStatus=VERIFIED_FOR_PUBLIC_CLAIM`.
The first record is still `REVIEW_REQUIRED`, both withhold numeric claims, so
the gate is doing what it was built for — the portfolio is visible but not yet
indexable. That is a content-evidence decision, not a bug in the deploy.

## 3. The dead origin: all CloudFront imagery is 403

`https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/…`
now answers **403 `AccessDenied`** (S3 behind CloudFront, `x-cache: Error from
cloudfront`) for **every one of the 33 unique files** the site references:

| Group | Files | Where |
| --- | --- | --- |
| brand / hero / logo | `hero-main-*.webp`, `photo_2026-03-24_*.jpg`, `sirinx-og-image-*.png` | `brands/sirinx/config.ts`, `client/index.html`, `client/src/lib/seo.ts` |
| pricing cards | `pricing-size-{s,m,l}-*.webp` | `Pricing.tsx` |
| brochures | 5 previews + 5 originals (`brochure_*`) | `Pricing.tsx` (download links) |
| sector photos | `carport-wide/structure`, `floating-solar-reservoir`, `resort-rooftop`, `warehouse-rooftop`, `farm-solar-bess`, `sirinx-smart-energy`, `video_ref_house` | `SolarAssessment.tsx`, `Strategy.tsx` |
| gallery / pages | `FB_IMG_*` ×7 and the `CDN` constants in `Projects`, `Industries`, `Solutions`, `About`, `SolarCarport`, `InvestmentTaxHub` | 6 pages |
| video | `sirinx_marketing_video_*.mp4` (source + poster + download) | `Pricing.tsx` |

The 2026-09-27 og:image fix moved **only** the OG cards onto
`/provinces/<slug>-og.jpg`; page imagery was left on the dead host. `App.tsx`
swaps a failed image for `/assets/image-unavailable.svg`, so the pages do not
break their layout — they render the placeholder instead of the photo.

Originals are **not recoverable** from this host (403, not a timeout) and the
repository never contained them: `git log --all -- '*hero-main*' '*brochure*'
'*og-image*'` finds only a doc. The repo does carry an independent local set of
SIRINX photography at `client/public/assets/optimized/` (six subjects ×
640/960/1280 in jpg+avif, plus `sirinx-logo.jpg` and the installation photos
under `assets/projects/`).

That leaves one decision, which is C8 and the reason no substitution was
written into the source today: replace 33 redirects to a dead third-party host
with the local photo set (a visual/content choice, and brochures/video have no
local equivalent — those download links would have to be withdrawn), or restore
the bucket/originals. Substituting silently would change what the site claims
to show.

## 4. Held for approval

1. **Deploy** `apps/public-web/dist/public` → `sirinx-co` and
   `apps/public-web/dist-org` → `sirinx-co-preview` (production Pages deploy;
   rollback targets are `95e6a06e` and `40f78bcf`).
2. **`.org` lead path**: add `www.sirinx.org/*` (and apex) to the
   `sirinx-main-router` route list, teach the Worker the `.org` host, and
   redirect the `.org` apex to `www.sirinx.org` with a zone redirect rule — or
   accept `.org` as a read-only mirror and drop its contact form.
3. **CloudFront imagery**: choose local substitution (with brochure/video
   withdrawal) or origin restoration.

No deploy, DNS, Worker, Access, or lead write happened in this pass.
