# Public sites deploy — www.sirinx.co / www.sirinx.org, 2026-10-27

Status: `DEPLOYED / VERIFIED_LIVE`

This is the deploy pass that follows `public-web-sites-20261027.md` (fonts +
cache headers) and adds the three approved items: replace the dead CloudFront
imagery with local photography, route `sirinx.org` through the site Worker so
its contact form can submit, and ship the redesigned slide-aware 3D hero.

## 1. Imagery: the 403 origin is gone from the code

The retired Manus CloudFront distribution answered **403 for all 51 referenced
files**, so every picture on the marketing pages rendered
`/assets/image-unavailable.svg`. The originals were never in this repo, so the
substitution was explicit rather than silent:

| Surface | Mapping |
| --- | --- |
| brand logo / hero / og:image | `/assets/optimized/sirinx-logo.jpg`, `solar-carport-hero-1280.jpg`, `/provinces/phitsanulok-og.jpg` |
| pricing package illustrations | `solar-carport-hero-{640,960,1280}.jpg` |
| installation gallery (12 items) | real SIRINX photos: `assets/projects/ruenphae/**`, `assets/projects/holatel/**` |
| sector + strategy imagery | the six `assets/optimized/hero-*` families and `assets/home-solution/*` |
| brochure previews/originals + marketing video | **withdrawn** — no local file exists, so the download section was removed instead of shipping dead links |

`client/src/lib/media.ts` holds the whole mapping plus a real-photo fallback;
`mediaAbsolute()` exists for og:image/JSON-LD contexts. `cfImage()` is now a
documented pass-through. A test walks the client source and fails if any module
(other than the registry) references the dead host.

## 2. sirinx.org is served by `sirinx-main-router`

`sirinx.org` is a custom domain of the Pages project `sirinx-co-preview`, which
the Worker's `wrangler.jsonc` never covered, so `www.sirinx.org/api/trpc/
lead.submit` answered **405** and every contact-form submission on `.org` was
lost. The router now knows both zones:

| Host | Behaviour |
| --- | --- |
| `www.sirinx.co` | lead endpoint (`LEAD_DB`) else proxy → `sirinx-co.pages.dev` |
| `sirinx.co` | 301 → `https://www.sirinx.co/` |
| `www.sirinx.org` | lead endpoint (same D1) else proxy → `sirinx-co-preview.pages.dev` |
| `sirinx.org` | 301 → `https://www.sirinx.org/` |
| anything else | plain 404, never proxied |

The routing table is a pure exported function (`resolveHostRoute`) with 7 new
Worker tests, including the `.org` apex redirect and the `.org` lead path
reaching `handleLeadSubmit` instead of Pages' 405.

## 3. 3D hero: slide-aware, no longer fighting the slideshow

The old hero stacked a generic energy core over every slide photo. The new
layer builds a **different Three.js sculpture per solution category** (carport,
rooftop, floating, BESS cabinet, hospitality, AI grid) from primitives, and
anime.js drives the intro, the slide transition (previous sculpture scales out
while the next flies in, panels stagger) and the idle core pulse. It is pinned
to the right half (`md:w-[52%] lg:w-[46%]`, pointer-events none, `mix-blend-
screen`) while the copy column is capped at `md:max-w-[56%]`, so the two never
overlap. Reduced-motion users get the final frame with no timelines.
`animejs@4.5.0` is a new dependency; it is dynamically imported with three.js,
so the entry chunk still contains neither (verified: `grep -c anime` on
`assets/index-*.js` → 0). Two tests were added: the scene anchors right, and a
category change rebuilds the sculpture.

## 4. Shipped

| Target | Deployment / version |
| --- | --- |
| `sirinx-co` (.co) | `100c4af3` (212 files uploaded) |
| `sirinx-co-preview` (.org) | `27a8547c` (213 files) |
| `sirinx-main-router` | `09c61f2d-7846-4b7d-a875-e2bf1a6e1b97`, 4 routes (2 zones) |
| Build identity | `assets/index-DLps5G_e.js` on both domains |

Rollback: Pages deployments `95e6a06e` (.co) and `40f78bcf` (.org) are the
previous Production snapshots; the Worker's previous version can be restored
from the Cloudflare dashboard.

## 5. Live verification (measured after deploy)

| Check | .co | .org |
| --- | --- | --- |
| `/` | 200, `index-DLps5G_e.js` | 200, same build |
| `cloudfront` references in HTML | **0** | **0** |
| `/fonts/fonts.css` linked | yes | yes |
| apex | 301 → www.sirinx.co | **301 → www.sirinx.org** (was 200) |
| `/api/trpc/lead.submit` OPTIONS / POST `{}` | 204 / 400 | **204 / 400** (was 405/405) |
| unknown path | 404 | 404 (through the Worker) |
| `/sitemap.xml` | 105 `.co` URLs | 105 `.org` URLs |
| legacy `/solar-carport-bangkok/` | 301 | 301 |
| `llms.txt` / `feed.xml` | 200 | 200 |
| security headers | HSTS+CSP+COOP | HSTS+CSP+COOP (proxied intact) |
| `/assets/*` Cache-Control | `public, max-age=31536000, immutable` single value | same |
| local imagery | `hero-*.jpg` 200 `image/jpeg` | `assets/projects/**` 200 |

No production lead row was written: the POST probes used `{}` (validation
error, 400). No DNS, Access, or D1 schema change was made.

## 6. Checks run before deploy

`npm run web:check` (tsc) rc 0 · web vitest **426/426** (52 files) ·
`npm run web:build:dual` rc 0 (214 text files scanned, 118 retargeted,
`leftovers: []`) · egress guard `--dist` **PASS** (0 errors, 8 warnings — was
11 before the font work) · worker tests **15/15** · media registry tests 7/7 ·
deploy-surface tests 11/11.

## 7. Still open

1. **Province/BESS content work** from the shared QA plan: 77-province data
   parity, BESS/battery-storage emphasis on `.org`, and the SEO/AEO/GEO
   leadership pass (schema depth, internal linking, AI-crawler surfaces).
2. **C8 remainder**: Unsplash stock (27 refs), the GitHub avatar in the
   component showcase, and the butterfly-effect map script are still waived;
   they are third-party fetches by every visitor.
3. **Portfolio indexability**: `/projects/ruenphae-royal-park/` and
   `/projects/holatel-rim-nan/` remain `noindex` until their evidence gate
   (`publicationState=PUBLISHED` + `VERIFIED_FOR_PUBLIC_CLAIM`) passes.
