# Public sites QA sweep + BESS/AEO pass — 2026-10-27

Status: `DEPLOYED / VERIFIED_LIVE / 0 DEFECTS OPEN`

This is the QA + content pass that follows `public-web-deploy-20261027.md`.
It adds a reusable live sweep, fixes the three defect classes the sweep and a
crawler/client metadata probe found, and lands the BESS weight on both hosts.

## 1. The sweep itself — `scripts/qa-live-sweep.mjs`

One run measures both hosts with **216 required checks**:

| Surface | Checks |
| --- | --- |
| All 77 province pages, both hosts | status, canonical, title/description, corrupted-Thai marker, per-province og:image (tag + HEAD 200), the three funnel links in raw HTML, JSON-LD parse, required schema nodes (Article, HowTo, FAQPage, BreadcrumbList, Service), viewport meta, no dead hosts, CSP without font CDNs |
| 19 core routes, both hosts | the same, minus the province-only rules |
| Forms | `OPTIONS` → 204 and `POST {}` → 400 with a JSON content-type on `/api/trpc/lead.submit`, no lead row written |
| SEO surfaces | robots.txt (sitemap line on the same host), sitemap.xml (URL count, host purity, 77 province URLs), llms.txt, feed.xml, site social card + home-solution card HEAD 200 |
| Redirects / 404 | legacy `/solar-carport-bangkok/` 301, apex 301, unknown path a real 404 |
| Cache / fonts | `/fonts/fonts.css` 200 with no `must-revalidate` |

Receipts: `qa-live-sweep-20261027-before.json` (first run) and
`qa-live-sweep-20261027.json` (final, 216 pass / 0 warnings / 0 defects).

## 2. Defects found and fixed

| # | Defect | Fix |
| --- | --- | --- |
| D1 | The prerendered province description shipped the corrupted Thai **"สำหรับโงานแลงและลานจอดรถ"** on all 77 province pages — and only on the server side, so crawler HTML and hydrated HTML disagreed | corrected to "สำหรับโรงงานและลานจอดรถ" in `server/ogTags.ts`; regression test walks all 77 provinces for the corruption marker |
| D2 | Every non-province page previewed as one province: server default = Amnat Charoen card, shell + client default = Phitsanulok card | new site-owned card `assets/optimized/sirinx-og-card-1200x630.jpg` (real installation photo cropped to the declared 1200×630) now used by `index.html`, `ogTags.ts`, and the media registry; tests assert non-province pages never carry a `/provinces/*-og.jpg` |
| D3 | Crawler/hydrated metadata drift on **11 of 19 core routes** (different titles and descriptions between `ogTags.ts` routeMetaMap and `client/src/lib/seo.ts` metaByPath) | client copy aligned to the server's test-pinned SEO copy; a new parity contract test fails on any future drift across 19 core routes + 77 provinces (title, description, noindex, image) |

## 3. Sweep self-audit (checks that were wrong, fixed before trusting them)

The first run flagged 304 items; most were the sweep's own rules, not site defects:
"รงง" is legitimate Thai inside "โรงงาน" (false marker, removed); funnel links
were required on core routes that are a JS shell by design (now province-only);
the og:image rule now only rejects province cards on non-province pages; the
`_redirects` Location is root-relative and both forms are accepted.

## 4. BESS + AEO pass

| Change | Where |
| --- | --- |
| 6-question BESS FAQ (Thai, quotable, explicitly no guarantees / no fixed figures) | `shared/bessFaq.ts` |
| `/solutions` JSON-LD gains a **FAQPage (6 questions)** and its **own Service node** `/solutions#service` (previously it claimed `solar-carport#service`) | `server/ogTags.ts` |
| The page renders the same FAQ strings visibly; schema is emitted for Thai only, en/cn keep none | `client/src/pages/Solutions.tsx`, `routeSeoContent.ts` |
| llms.txt now lists /solutions with the BESS FAQ and states the FAQPage declaration | `server/staticSeoBuild.ts` |
| Every province page's crawler HTML now links `/solutions/` ("ดูโซลูชัน BESS และระบบกักเก็บพลังงาน") — an internal-linking edge from 77 pages | `shared/provinceLongformHtml.ts` |

## 5. Shipped

| Target | Before this pass | Final |
| --- | --- | --- |
| `sirinx-co` (.co) | `100c4af3` | `cb448bb9` (QA fixes) → **`eb87db97`** |
| `sirinx-co-preview` (.org) | `27a8547c` | `2e84ef16` (QA fixes) → **`2b94f01e`** |
| `sirinx-main-router` | `09c61f2d` | unchanged (routing already covered both zones) |
| Build identity | `index-DLps5G_e.js` | `index-DqCrDmst.js` on both hosts |

Rollback: previous Pages production snapshots `100c4af3` (.co) / `27a8547c` (.org).

## 6. Live verification (post-deploy)

- `qa-live-sweep.mjs` → **216 checks, 0 warnings, 0 defects** on both hosts.
- Sample: `/solar-carport/chiang-mai/` description now "สำหรับโรงงานและ…" on both
  hosts; `/pricing/` og:image = the site card on each host; card HEAD 200
  `image/jpeg`.
- `/solutions/` on both hosts: JSON-LD nodes `Organization, WebSite, WebPage,
  Service, BreadcrumbList, FAQPage`, FAQ 6 questions, Service `@id` =
  `https://www.<host>/solutions#service`.
- llms.txt carries the solutions/BESS lines (2 refs); province pages carry the
  `/solutions/` link (1 per page).
- No lead row was written: POST probes used `{}`. No DNS, Access, D1, or Worker
  change.

## 7. Checks before deploy

`npm run check` (tsc) rc 0 · web vitest **436/436** (was 426; +10: parity 3,
social card 3, Thai guard 1, BESS 4 — minus the replaced probe) ·
`npm run web:build:dual` rc 0 (leftovers `[]`) · egress guard `--dist` **PASS**
on both dists (0 errors, 8 warnings, unchanged set) · `npm run check` rc 0 ·
`npm run control:test` **507/507**.

## 8. Observed, not changed (recorded for a decision)

1. **C8 remainder** — Unsplash (27 refs), the GitHub avatar, and the
   butterfly-effect map script are still third-party fetches by every visitor.
2. `/home-solution` still emits a client-side JSON-LD copy (Service + FAQPage +
   BreadcrumbList) while the static build injects the route graph, so the
   hydrated document carries two FAQPage nodes for that one page
   (`client/src/pages/HomeSolution.tsx` line ~225 vs `server/ogTags.ts`).
   Pre-existing; the ogTags contract says the static build owns route JSON-LD.
3. `og:image:width/height` in `index.html` declares 1200×630 while the
   `/home-solution` card is 1672×941 — pre-existing, cosmetic.
4. hreflang: the site is one URL per page with a client-side language toggle, so
   there are no per-language URLs for `hreflang` to point at; the current
   self-referential `alternate` stays as-is until the URL model changes.
