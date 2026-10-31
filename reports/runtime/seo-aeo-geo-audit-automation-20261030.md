# SEO / AEO / GEO quality pass + daily automation — 2026-10-30

Status: `BUILT_LOCAL / VERIFIED_LOCAL / DEPLOY_PENDING`

Scope: www.sirinx.co and www.sirinx.org (one app, two host variants).

## 1. Measured baseline (before this pass)

| Surface | Measurement | Result |
| --- | --- | --- |
| Live hosts | `scripts/qa-live-sweep.mjs` — 19 core routes + 77 provinces × 2 hosts | 216 checks, 0 defects, 0 warnings |
| Local build (`.co`) | 108 routes, 105 sitemap URLs | 0 pages with hreflang; 26 pages under 1,200 crawlable characters |
| FAQ markup | JSON-LD `Question` names vs visible text | 79 documents marked up questions the HTML did not show |
| Keyword map | `docs/seo/keyword-map-77-provinces.csv` — 1,712 rows | 473 target URLs; 385 targets have no built route |
| Province keyword coverage | map keywords present in title + H1 + body | median 0% exact-match (Thai compounds), see §4 |

The FAQ mismatch is the serious one: Google's structured-data policy requires
marked-up content to be visible on the page, and an answer engine that cannot
see the answer gains nothing from the markup. Province pages marked up 13
questions while rendering 5; `/solar-carport` marked up 6 and rendered 0;
`/solutions` marked up 6 and rendered 0; `/home-solution` marked up 4 and
rendered 0.

## 2. Change

| Change | Where |
| --- | --- |
| New offline audit: canonical host/path, one FAQPage per document, marked-up questions must exist in visible text, JSON-LD parse validity, sitemap ↔ built-route parity, robots AI-bot policy, llms.txt link integrity, crawlable-text floors, keyword-map coverage | `scripts/seo-keyword-audit.mjs` (new) |
| npm entry points `seo:audit`, `seo:audit:org`; syntax gate added to `npm run check` | `package.json` |
| `/home-solution` renders its 4 FAQ answers in the static shell (plus 4 internal links) | `apps/public-web/server/staticSeoBuild.ts` |
| `/solar-carport` gets a static service shell with its 6 FAQ answers and 4 internal links | `apps/public-web/server/staticSeoBuild.ts` |
| `/solutions` gets a static shell with the 6 BESS FAQ answers | `apps/public-web/server/staticSeoBuild.ts` |
| Province FAQPage now marks up exactly the long-form questions; the shared solar-carport FAQ is no longer claimed on pages that do not render it | `apps/public-web/server/ogTags.ts` |
| Hand-written provinces (bangkok) render their FAQ; generated provinces do not duplicate the questions the generator already renders as body text | `shared/provinceLongform.ts` (`getUnrenderedFaq`), `shared/provinceLongformHtml.ts`, `client/src/components/ProvinceLongform.tsx` |
| Test asserts the visible-parity invariant instead of the old count | `shared/provinceLongformGenerated.test.ts` |

## 3. Verification

| Check | Result |
| --- | --- |
| `npm run web:build` | rc 0, 108 SEO routes |
| `npm run web:build:dual` (.co + .org) | rc 0, 77 legacy province redirects per host |
| `scripts/seo-keyword-audit.mjs` on `.co` | **0 defects**, 121 warnings, 108 routes |
| `scripts/seo-keyword-audit.mjs` on `.org` | **0 defects**, 121 warnings, 108 routes |
| `npm run web:test` | **442/442** |
| `npm run web:check` (tsc) | rc 0 |
| `npm run check` (root gate) | rc 0 |
| Live sweep (unchanged builds on the hosts) | 216 checks, 0 defects |

Warning breakdown (identical on both builds): 90 titles over the 65-character
policy band, 26 pages under 1,200 crawlable characters, 2 keyword-coverage
flags, 1 description over 165, 1 page with two `<h1>` (the `/home-solution`
`<noscript>` fallback), 1 page between 400 and 1,200 characters.

## 4. What the audit changed about the keyword picture

The map is written as Thai compounds (`ติดตั้งโซลาร์เซลล์กรุงเทพมหานคร`) while the
pages space the province name out, so exact substring matching reported 0%
coverage for 77 of 77 provinces. The audit now accepts a keyword when at least
70% of its tokens appear, which is the honest measure for Thai text. Two pages
remain below 50% and are reported as warnings, not failures.

The bigger, real gap: **385 of 473 keyword-map target URLs do not exist**. They
are planned sub-pages such as `/solar-carport/<province>/factory`, `/bess`,
`/ev`, `/commercial`, `/hotel`. The map is ahead of the site, so "all keywords"
cannot be delivered by metadata alone — it needs those route families, or the
map has to be trimmed to the 108 routes that are actually published.

## 5. Daily automation (Hermes cron)

| Item | Value |
| --- | --- |
| Job | `910debe482a8` — `sirinx-web-evolution-daily` |
| Schedule | `0 7 * * *` (daily 07:00 Asia/Bangkok) |
| Mode | `no-agent` — deterministic script, no LLM, no cost |
| Script | `~/.hermes/profiles/solis/scripts/sirinx_web_evolution.sh` (source copy in `~/.hermes/scripts/`) |
| Workdir | `/Users/sirinx/SIRINXDev/sirinx-co` |
| Delivery | `local` |
| Output | live sweep + both audits, one PASS/FAIL line each, build-staleness notice, 30-day receipt retention |

What it does not do: build, deploy, push, mutate Cloudflare/DNS, call a paid
API, or touch the lead database. Proven once by hand:

```
live: PASS — checks passed: 216 warnings: 0 defects: 0
co audit: PASS — 0 defects, 121 warnings, 108 routes
org audit: PASS — 0 defects, 121 warnings, 108 routes
gate: PASS
```

## 6. Not done / next decisions

1. **Not deployed.** The hosts still serve the previous build; `npm run
   web:build:dual` + Cloudflare Pages deploy needs approval.
2. **Two domains, one document set.** `.co` and `.org` canonicalise to
   themselves with the same titles and body. That is duplicate content across
   domains; only a business decision (pick a primary and 301, or make `.org` a
   distinct knowledge surface) can fix it. `hreflang` is not the tool for two
   Thai hosts serving the same text.
3. **385 keyword targets have no page.** Either build the province ×
   industry/service families (`factory`, `bess`, `ev`, `commercial`, `hotel`)
   or trim the map. Building them at template scale is exactly the scaled
   content risk the mastery plan warns about, so each family needs its own
   evidence/data angle.
4. **Thin client-rendered pages.** `/blog/*` (10 posts), `/projects`,
   `/about`, `/partner` ship 220–350 visible characters to a non-JS crawler.
   Blog bodies live in JSX, so prerendering them is a content-extraction job,
   not a build tweak.
5. **90 titles exceed the 65-character band.** Trimming them is mechanical but
   changes live snippets; it should be done with Search Console CTR data, not
   blind.
6. **Search Console and Google Business Profile** remain outside the repo —
   they need account access and are the only source of real query/citation data
   for the next keyword round.

## 7. Frontend request (not started)

"ปรับ frontend ให้สวยขึ้นทุกส่วน" is a design pass, not a defect fix. It needs a
direction before code: either (a) systematic polish of the existing dark
energy-tech system (type scale, spacing rhythm, section entrances, card
elevation, hero composition) applied page by page, or (b) a new visual
direction. Option (a) is the safe first release; it can be measured against the
existing motion tokens and screenshot-diffed per page.
