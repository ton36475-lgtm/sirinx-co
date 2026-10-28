# Public-web route JSON-LD ownership + per-route card dimensions — 2026-10-28

Status: `BUILT_LOCAL / VERIFIED_LOCAL / DEPLOY_PENDING`

This closes B17, the cleanup A60 recorded in
`reports/runtime/public-web-qa-bess-20261027.md` §8.

## 1. Defects

| # | Defect | Evidence |
| --- | --- | --- |
| D1 | `/home-solution` shipped its own client-side `Service` + `FAQPage` + `BreadcrumbList` graph **and** the static build injected the route graph, so the hydrated document carried two `FAQPage` nodes for one page | `client/src/pages/HomeSolution.tsx` jsonLd block vs `server/ogTags.ts` `getStructuredData("/home-solution")` |
| D2 | `og:image:width/height` were static 1200×630 in `client/index.html`, but `/home-solution` names a 1672×941 card and blog posts name Unsplash cards served at `w=600&h=400` | `sips -g pixelWidth -g pixelHeight` on `home-solution-drone-hero.jpg` (1672×941); `blogData.ts` image URLs |

## 2. Change

| Change | Where |
| --- | --- |
| Removed the client-side route graph; the page renders visible content only, with a comment naming the static build as the owner | `client/src/pages/HomeSolution.tsx` |
| Added `imageWidth`/`imageHeight` to server `PageMeta` and client `SeoMeta`; default 1200×630, `/home-solution` 1672×941, blog posts 600×400 | `server/ogTags.ts`, `client/src/lib/seo.ts` |
| The static injector replaces `og:image:width`/`og:image:height` beside every `og:image`, appending them when the template lacks them | `server/ogTags.ts` |
| `RouteSeo` upserts the same two tags after client navigation, so hydrated and crawler HTML agree | `client/src/components/RouteSeo.tsx` |
| Tests: one route graph + one `FAQPage` for `/home-solution`; the page source must not contain `application/ld+json`; card dimensions injected for home solution, blog and default routes; parity compares title, description, noindex, image and dimensions across 19 core routes, all 77 provinces and a blog slug | `server/ogTags.test.ts` |

## 3. Measured verification

| Check | Result |
| --- | --- |
| `tsc --noEmit` (public-web) | rc 0 |
| `vitest run client server shared` | **442/442** (was 436; +6) |
| Local build (`pnpm --dir apps/public-web build`) | rc 0, **108** SEO routes |
| Built `/home-solution/index.html` | 1 route script, 1 `FAQPage`, width **1672**, height **941** |
| Built `/blog/rooftop-solar-roi-2025/index.html` | width **600**, height **400** |
| Built `/pricing` + `/solar-carport/bangkok/` | width **1200**, height **630** |
| Client chunks naming `home-solution#service` | **0** |
| Egress guard `--dist` | PASS, 0 errors, 8 warnings (unchanged set) |
| `npm run check` | rc 0 |
| `npm run control:test` | **507/507** |
| `cargo fmt` / `clippy -D warnings` / `test --workspace` | all rc 0, **227** Rust tests |

## 4. Not changed / open

- `/` and `/pricing` still emit a **page-scoped** `FAQPage` client-side. Neither
  duplicates a server node — each document has exactly one `FAQPage` — but
  moving those FAQs into the static graph would add crawler-visible schema and
  is a content decision, not part of this defect. The route graph itself is
  server-owned everywhere.
- **Not deployed.** Live hosts still serve the A60 build (`eb87db97` on `.co`,
  `2b94f01e` on `.org`, `index-DqCrDmst.js`). Deployment needs approval and
  `npm run web:build:dual`; the local build here is the single-host `dist`
  artifact and did not regenerate the legacy province redirects.
- No DNS, Worker, Access, D1 or tunnel change; no lead write; no push.

## 5. Rollback

Revert the five source files and rebuild. The deployed rollback targets remain
A60's `eb87db97` (`.co`) / `2b94f01e` (`.org`).
