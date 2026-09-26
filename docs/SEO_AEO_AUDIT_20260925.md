# SEO / AEO / GEO Audit — www.sirinx.co + 77 Provinces

Date: 2026-09-25
Scope: `apps/public-web` (public site), the 77 Thai province Solar Carport landing pages, the
`.claude/skills/sirinx-seo-77-provinces/SKILL.md` plan, and the live production surface
`https://www.sirinx.co`.
Method: static analysis of the source, inspection of the real production build output, and live HTTP
plus real headless Chrome rendering of production pages.
Status of this document: evidence first. Every finding below cites a command that was run and the
result that was observed.

---

## 0. What this document can and cannot promise

**Cannot promise rankings.** No ranking position, impression count, click count, or AI Overview
presence was measured, because none of the required data sources were available in this environment:

| Needed input | Available here | Evidence |
| --- | --- | --- |
| Google Search Console property for `www.sirinx.co` | No | No GSC credential or property was connected in this session |
| GA4 property / CRM lead data | No | No analytics credential was connected |
| Keyword volume + difficulty tool (SEMrush, Ahrefs, Google Ads planner) | No | No API key or account was available |
| Live Google / Bing / AI answer engine SERP capture | Partially blocked | 2 of 6 web searches returned results, 4 were refused by the provider with an anti-bot challenge |
| Local Chrome rendering of production pages | Yes | Headless Chrome DOM dumps for 8 province pages, 5 hub pages, and raw HTML for the SEO endpoints |

Every keyword in this document and in `docs/seo/keyword-map-77-provinces.csv` therefore carries
`volume_status = unmeasured`. The list is a **research and optimization priority list**, not a
forecast, and not a ranking guarantee.

### 0.1 Interpretations I had to make

The request could be read more than one way. These are the calls I made, stated plainly so they can
be corrected:

1. **"All keywords for 77 provinces"** was read as "produce the complete keyword inventory for all 77
   provinces plus the national set", not "measure search volume for every keyword". No volume source
   was reachable, so a measured version is impossible today. If the intent was measured volume, that
   needs Search Console or a keyword tool.
2. **"Local pages"** was read as the existing province hub pages at `/solar-carport/<slug>`. The
   skill doc's cluster pages were evaluated as planned net-new work, not as existing pages, because
   they do not exist in the route table.
3. **Deliverable scope** was read as audit, keyword map, and roadmap. No fix was implemented, because
   the fixes change public content and the standing constraint is to preserve the current uncommitted
   working tree. Which P0 fix to start is a user decision.
4. **"Highest-ranking keywords"** was read as research priority, following the standing rule that
   ranking positions cannot be guaranteed.
5. **Which metadata template is canonical**, the one live serves or the one this checkout builds, was
   left open on purpose. It is a brand and rollout decision, not a technical finding.

---

## 1. Evidence base

Commands run and their results:

| # | Check | Result |
| --- | --- | --- |
| E1 | Production build output audit over all 77 provinces (`dist/public/solar-carport/<slug>/index.html`) | 77/77 files exist, 77/77 titles contain the Thai province name, 77/77 canonical correct, 77/77 contain `FAQPage` and `Service` schema, 0 failures |
| E2 | Production build sitemap and robots | 95 URLs, 77 of them province URLs, robots points at the same sitemap |
| E3 | Static province canary routes | `getStaticProvinceCanaryRoutes()` returned `0` routes because the `SIRINX_STATIC_PROVINCE_CANARY` flag is not set |
| E4 | Body content of the built province HTML | Every province page ships an empty `<div id="root">`, so the served HTML has no body copy |
| E5 | Built sitemap `lastmod` | All 95 `<lastmod>` values are the single build timestamp `2026-09-25T15:54:31.769Z` |
| E6 | Built sitemap project detail URLs | 0 `/projects/<slug>` URLs present in the sitemap |
| E7 | Source sitemap `client/public/sitemap.xml` | Stale: 24 URLs, no province URLs, no trailing slash convention, conflicting with the build output |
| E8 | Live HTTP status of SEO endpoints | `/sitemap.xml` 200, `/robots.txt` 200, `/solar-carport/bangkok/` 200, `/solar-carport/phitsanulok/` 200 |
| E9 | Live sitemap content | 95 URLs, 77 province URLs, 0 `<lastmod>`, priorities `{1.0:1, 0.95:1, 0.85:5, 0.75:77, 0.70:11}` |
| E10 | Live province page head | canonical `https://www.sirinx.co/solar-carport/bangkok/` correct, `robots index, follow`, viewport present, `<html lang="th">`, 0 `hreflang` tags, no font preconnect |
| E11 | Live province page raw HTML structured data | 1 JSON-LD block containing `@graph` = Organization, WebSite, WebPage, Service, BreadcrumbList, FAQPage with 8 questions, 2 of them province specific |
| E12 | Live province page rendered DOM (headless Chrome) | 2 JSON-LD blocks: the same `@graph` plus a second standalone `FAQPage` with the same 8 questions, plus 1 H1, 15 H2, about 6,400 characters of visible text |
| E13 | Cross-province rendered text similarity | 8 provinces rendered, 28 pairs, 5-gram Jaccard min = mean = max = 0.912, text length 6,390 to 6,438 characters |
| E14 | Internal links to province pages | 0 links to any `/solar-carport/<province>` across 13 rendered pages: `/`, `/solar-carport`, `/solutions`, `/industries`, `/pricing`, and 8 province pages |
| E15 | Visible breadcrumb on live province pages | Absent on all 8 rendered province pages, although `BreadcrumbList` schema is present on all 8 |
| E16 | Host canonicalization and TLS | `http://sirinx.co` to `https://www.sirinx.co` (2 hops), `https://sirinx.co` to `https://www.sirinx.co` (1 hop), HSTS present, served through Cloudflare |
| E17 | Unknown and mismatched province slugs on live | `/solar-carport/ayutthaya/`, `/solar-carport/lop-buri/`, `/solar-carport/si-sa-ket/`, `/solar-carport/chon-buri/` all return HTTP 404 with `noindex,follow` and a "not found" page. Unknown slugs behave the same, so there is no soft-404 crawl trap |
| E18 | Live vs this checkout | Live titles, descriptions and the province FAQ set differ from what this checkout builds. Live is not running the code in this working tree |
| E19 | Skill doc vs province registry in code | 6 slug mismatches, 5 region disagreements, wrong domain, wrong URL pattern, 8 unsupported commercial claims, an unsourced traffic model, and a ranking promise, all present in the doc |
| E20 | Working tree state | Branch `agent/b1-b2-command-center`, 80 dirty paths (50 modified, 30 untracked), 59 of them under `apps/public-web` |

---

## 2. What is already working

1. All 77 province URLs exist in the build and in the live sitemap, and every one of them is
   self-canonical with an indexable robots directive.
2. Every province page already carries `Service` schema with `areaServed` bound to its own
   `AdministrativeArea`, `Organization`, `WebSite`, `WebPage`, and `BreadcrumbList`.
3. The live FAQ set is partly province specific. 2 of 8 questions contain the province name, and
   those 2 are genuine local-intent questions.
4. Unknown and mis-slugged province URLs return a real 404 with `noindex,follow`, so the site does
   not create soft-404 or duplicate-host problems.
5. Host and protocol canonicalization is correct and HSTS is enabled.
6. Project privacy discipline already in the repo (`shared/siteContentRegistry.ts`,
   `shared/publicProjectContent.ts`) is strong and can be reused as the evidence gate for content.

---

## 3. Findings

Severity: **S1** blocks or actively harms indexing or AEO. **S2** materially reduces performance.
**S3** hygiene.

### F-01 (S1) The 77 province pages are near-duplicate doorway-style pages

Evidence: E13. Across 8 rendered provinces and all 28 pairs, the 5-gram Jaccard score is exactly
0.912 for every pair, with no spread at all. The rendered text length moves in a band of only 48
characters, from 6,390 to 6,438, across pages that each carry about 6,400 characters of copy.

Why it matters: near-duplicate location pages are the classic pattern Google treats as doorway pages
built to rank for many city queries. The pages also give answer engines almost nothing local to
quote, because the quotable text is the generic text.

Fix direction: every province hub needs a genuinely province specific information layer built only
from sources that can be cited (see section 6), and the shared marketing blocks need to be reduced or
moved to a single canonical page.

### F-02 (S1) Province pages ship no server-side body copy

Evidence: E3, E4. The static build can write a province body shell, but the canary gate is off, so all
77 built files have an empty `<div id="root">`. Live pages match this: the raw HTML has no body copy.

Why it matters: crawlers that do not execute JavaScript, including most AI answer engines, see an
empty page with metadata only. Even for Google this is wasted work for 77 URLs.

Fix direction: enable and extend the static province shell so that the served HTML contains the H1,
the local information layer, the FAQ answers, and the crawlable internal links. The mechanism already
exists in `server/staticSeoBuild.ts` via `buildStaticProvinceCanaryShell` and the
`SIRINX_STATIC_PROVINCE_CANARY` gate in `shared/siteContentRegistry.ts`.

### F-03 (S1) Duplicate `FAQPage` markup on every province page

Evidence: E11, E12. The served HTML contains the 8-question `FAQPage` inside the `@graph`, and after
hydration the client adds a second standalone `FAQPage` with the same 8 questions
(`client/src/pages/SolarCarport.tsx` emits it through `Helmet`).

Why it matters: two `FAQPage` blocks with the same questions is conflicting markup. Rich results
require the marked-up content to be visible and unambiguous, and validators flag duplicates.

Fix direction: single source of truth for FAQ content, emitted once. Either keep the server `@graph`
and drop the client block, or render FAQ in the client and stop injecting the server block, but not
both. The content should also be shared so the 2 province specific questions and the 6 generic ones
cannot drift.

### F-04 (S1) `BreadcrumbList` schema with no visible breadcrumb

Evidence: E15, E11. The schema declares Home, Solar Carport, and the province page, but the rendered
page shows no breadcrumb navigation. The static province shell does contain one, but the shell is not
being served (F-02).

Why it matters: breadcrumb structured data that does not match visible content is a validation
failure, and breadcrumbs are also an internal-linking path.

Fix direction: render a visible breadcrumb in the page component as well as in the static shell.

### F-05 (S2) The 77 province pages are orphaned

Evidence: E14. Zero links from `/`, zero from `/solar-carport/`, zero sibling province links, and no
province index page in the route table. The only discovery path is the sitemap.

Why it matters: sitemap discovery is the weakest internal signal. Link equity, crawl paths, and
"related province" context all depend on links.

Fix direction: add a province index page linked from the footer and from `/solar-carport`, and give
each province hub links to the hub page, its cluster pages, 3 to 5 neighbouring provinces, and the
contact page with the province parameter already supported by `contactHref` in
`client/src/pages/SolarCarport.tsx`.

### F-06 (S2) Live production is not running the code in this working tree

Evidence: E18. Live `/solar-carport/bangkok/` serves the title
`Solar Carport กรุงเทพมหานคร | สอบถามและประเมินไซต์ | SIRINX` and an 8-question province FAQ.
This checkout builds `ติดตั้ง Solar Carport กรุงเทพมหานคร | โซลาร์ที่จอดรถ EV Charger BESS | SIRINX`
and a 2-question province FAQ.

Why it matters: two different SEO templates are in play. Any optimization measured on live will not
predict the next deploy, and vice versa.

Fix direction: decide which template is canonical, make live and build agree, and re-measure after the
next real deploy. No deploy was performed in this audit.

### F-07 (S2) Sitemap `lastmod` is either absent or wrong

Evidence: E5, E9. Live emits 0 `lastmod` values. The build emits 95 identical values, all equal to
the build clock.

Why it matters: `lastmod` that equals the build time tells crawlers every page changed on every
build, which trains crawlers to ignore the field.

Fix direction: keep a per-route content modification date, or drop the field. Sitemap index split by
content type, as the skill doc proposes, is optional and not urgent at 95 URLs.

### F-08 (S2) Published project pages are missing from the sitemap

Evidence: E6. The two project pages that pass the publication gate are indexable but absent from the
sitemap.

Why it matters: The most trustworthy pages on the site, real completed installations, are the ones
not being submitted for discovery.

Fix direction: include indexable `/projects/<slug>` routes in `getStaticSeoRoutes()` in
`server/ogTags.ts` and keep non-publishable ones out, using the existing
`isProjectDetailIndexable` gate.

### F-09 (S2) No language targeting, and the language tag is inconsistent

Evidence: E10. `<html lang="th">` while the JSON-LD declares `inLanguage: "th-TH"`. 0 `hreflang`
tags anywhere.

Why it matters: `lang="th"` is a valid but weaker locale signal than `th-TH`, and the mismatch with
the JSON-LD is an avoidable inconsistency. If English pages are ever added, the absence of
`hreflang` plus `x-default` will create duplicates.

Fix direction: set `lang="th-TH"` and add self-referencing `th-TH` and `x-default` alternates on
province pages, or deliberately document that there is only one language and skip hreflang.

### F-10 (S3) The source sitemap file contradicts the build output

Evidence: E7. `client/public/sitemap.xml` holds 24 non-province URLs without trailing slashes, while
the build writes 95 URLs with trailing slashes.

Why it matters: it is a drift trap. A future build change could stop overwriting it and silently ship
a sitemap with 24 URLs.

Fix direction: delete the checked-in copy and let the build be the only source.

### F-11 (S3) The skill doc contradicts the province registry in code

Evidence: E19. The doc is a plan, the code is what is deployed, and they disagree.

| Province | Slug in skill doc | Slug in code and live |
| --- | --- | --- |
| ศรีสะเกษ | `si-sa-ket` | `sisaket` |
| หนองบัวลำภู | `nong-bua-lam-phu` | `nong-bua-lamphu` |
| พระนครศรีอยุธยา | `ayutthaya` | `phra-nakhon-si-ayutthaya` |
| ชลบุรี | `chon-buri` | `chonburi` |
| ปราจีนบุรี | `prachin-buri` | `prachinburi` |
| ลพบุรี | `lop-buri` | `lopburi` |

All six return HTTP 404 today, so following the doc literally would create 6 broken URLs.

Region disagreements between the doc and the code registry:

| Province | Region in skill doc | Region in code registry |
| --- | --- | --- |
| ตาก `tak` | north | west |
| นครสวรรค์ `nakhon-sawan` | north | central |
| อุทัยธานี `uthai-thani` | north | central |
| สมุทรสงคราม `samut-songkhram` | west | central |
| ชัยนาท `chai-nat` | listed in an unassigned "additional" bucket | central |

Neither side was treated as authoritative here. Region drives cluster grouping and internal linking,
so this has to be settled from an authoritative DOPA classification before any region page or
neighbour-linking rule is built.

### F-12 (S3) The skill doc contains commercial claims that the evidence policy forbids

Evidence: E19. Present in the doc: `ลดค่าไฟ 50-80%`, `35,000 บาท/kWp`, `รับประกันแผง 25 ปี`,
`ติดตั้งภายใน 3-7 วัน`, `aggregateRating` 4.9 from 47 reviews, `ทีมช่างประจำภูมิภาค`,
`estimatedCost 175000-2000000`, and a `055-XXX-XXXX` phone placeholder.

Why it matters: these are the exact claim types that were deliberately removed from public content
during the earlier project work. A doc that is used as a content brief will reintroduce them.

Fix direction: rewrite the doc's templates to use the site-survey language that is already approved,
and mark every numeric claim as blocked until it has a source.

### F-13 (S3) The skill doc targets the wrong domain and URL pattern

Evidence: E19. The doc uses `https://sirinx.com/solar/{slug}`. Production is `https://www.sirinx.co`
and the live pattern is `/solar-carport/{slug}`.

Why it matters: copying the doc produces canonicals to a host that does not serve this site, which is
the single most damaging SEO mistake available here. It also matters for evidence: the doc's target
is `sirinx.com`, while E16 shows production canonicalizes to `www.sirinx.co`.

### F-14 (S3) The doc's traffic model is an unsourced estimate

Evidence: E19. The doc asserts `77 x 500 searches/month = 38,500 organic searches/month` and
`CVR 2% = 770 leads/month`.

Why it matters: this is the number the whole business case rests on, and it has no source. It should
be replaced with a measurement plan, not a projection.

### F-15 (S3) `Service` schema offers a `PriceSpecification` with no price

Evidence: E11. The `Offer` has `availability InStock` and a description-only `PriceSpecification`
with no `price` or `priceCurrency`.

Why it matters: a price-less offer is not eligible for price rich results and adds no AEO value. It is
not harmful, but it is dead markup that suggests pricing exists where it does not.

### F-16 (S3) `areaServed` on non-province pages lists only the first 12 provinces alphabetically

Evidence: `server/ogTags.ts` uses `thaiProvinces.slice(0, 12)`, so `/` and `/solar-carport` advertise
Amnat Charoen through Lamphun and omit the rest.

Why it matters: it is arbitrary and can be read as a coverage claim. Use the full list, or use the
country node, or omit it.

---

## 4. Competitive surface observed

Two web searches returned real results before the provider began refusing requests. Both snapshots
are consistent: for Thai commercial solar queries the ranking page types are a mix of dedicated
province pages, package pages with prices, guides written around a specific buyer type, and FAQ-rich
landing pages. Named page types observed included province-specific package pages, factory and
commercial solar guides, and budget or price breakdown pages.

Four further queries were refused with an anti-bot challenge, and Bing fallback returned no results,
so this is a partial observation of the competitive surface, not a full SERP audit. One structural
inference is offered from those two snapshots, and it is labelled as an inference: the page types
that appeared were a province page, a package page with prices, a buyer-type guide, and a
FAQ-rich landing page, which suggests that one page per intent is the pattern that ranks. That
inference is not proven by two searches and should be retested with real SERP data before it drives
the content plan. The same snapshots do support one firm statement: competitors publish concrete,
checkable specifics, which is the argument against inventing numbers on 77 pages.

---

## 5. Keyword and topic architecture

Full list: `docs/seo/keyword-map-77-provinces.csv`, 1,712 rows, 18 national plus 22 patterns applied
across 77 provinces. Every row carries `intent`, `funnel_stage`, `target_url`, `evidence_required`,
`priority_hint`, and `volume_status = unmeasured`.

### Layer 0, national intent (18 keywords)

Owned by `/`, `/solar-carport`, `/solutions`, `/industries`, `/investment`, `/pricing`,
`/home-solution`, `/blog`. These are where the site's differentiated material already lives and
should be the strongest pages.

### Layer 1, province core (5 patterns x 77 = 385)

`ติดตั้งโซลาร์เซลล์{P}`, `โซลาร์เซลล์{P}`, `โซลาร์คาร์พอร์ต{P}`, `solar cell {E}`,
`บริษัทรับติดตั้งโซลาร์เซลล์{P}`. Target `/solar-carport/{slug}`. These are the pages that exist
today and that F-01 through F-05 apply to.

### Layer 2, commercial and price (6 patterns x 77 = 462)

`ราคาติดตั้งโซลาร์เซลล์{P}`, `ราคาโซลาร์เซลล์{P}`, `โซลาร์เซลล์โรงงาน{P}`,
`โซลาร์เซลล์โรงแรม{P}`, `โซลาร์เซลล์อาคารพาณิชย์{P}`, `ช่างโซลาร์{P}`.

These need either real evidence or an explicit "quoted after site survey" framing. This is the layer
where the removed claims used to live, so it is the layer that needs the evidence gate.

### Layer 3, cluster pages (3 patterns x 77 = 231)

`สถานีชาร์จรถยนต์ไฟฟ้า{P}`, `EV charger {E}`, `BESS {P}`. These map to the skill doc's cluster
idea. Note the correct route family is `/solar-carport/{slug}/...` to match live canonicals, not the
doc's `/solar/{slug}/...`.

### Layer 4, AEO questions (8 patterns x 77 = 616)

`ติดตั้งโซลาร์เซลล์{P} คุ้มไหม`, `โซลาร์เซลล์{P} ราคาเท่าไหร่`, `โซลาร์เซลล์{P} คืนทุนกี่ปี`,
`ขั้นตอนติดตั้งโซลาร์เซลล์{P}`, `ต้องขออนุญาตอะไรบ้าง {P}`,
`Solar Carport ใน{P} ต่างจาก Solar Rooftop อย่างไร`, `บริษัทโซลาร์เซลล์{P} ที่ไหนดี`,
`ระบบไฟฟ้า {P} เป็น PEA หรือ MEA`.

This layer is the real AEO surface. It is also where the skill doc's template is weakest, because 5
of these 8 questions cannot be answered honestly today without a source for price, payback,
permits, reviews, and the utility boundary per province.

### Priority order for optimization work

1. P0 technical, no content needed: F-02, F-03, F-04, F-05, F-08, F-09, F-11, F-13.
2. P1 differentiators: the province information layer described in section 6, aimed at reducing
   cross-province similarity below a threshold that can be measured.
3. P2 clusters: factory, hotel, and commercial pages for P1 provinces only, before expanding to 77.
4. P3 national depth: the national keywords in layer 0, which currently have real material and are the
   cheapest wins.

### Fixable now versus blocked

| Change | Where it lands | Needs |
| --- | --- | --- |
| Single source of truth for FAQ content, emitted once | `client/src/pages/SolarCarport.tsx`, `server/ogTags.ts` | Code only, then a build and a test run |
| Visible breadcrumb in the page component | `client/src/pages/SolarCarport.tsx` | Code only |
| Province index page plus footer and hub links | `client/src/App.tsx`, a new page, footer component, `SolarCarport.tsx` | Code only |
| Publish the static province shell for all 77 | `shared/siteContentRegistry.ts` gate, `server/staticSeoBuild.ts` | Code only, but the shell needs the province data model from section 6 first |
| Add indexable project detail URLs to the sitemap | `server/ogTags.ts` | Code only |
| Per-route sitemap `lastmod`, or drop the field | `server/staticSeoBuild.ts` | Code only |
| `lang="th-TH"` and locale consistency | `client/index.html` or the shell template | Code only |
| Delete the stale checked-in sitemap | `client/public/sitemap.xml` | Code only, user approval because it is a tracked file |
| Region truth for 5 provinces | `shared/thaiProvinces.ts` | Authoritative DOPA source, then code |
| Province facts such as district list, PEA or MEA, solar resource | `shared/thaiProvinces.ts` | Cited external sources per fact, one province at a time |
| Any change visible on `www.sirinx.co` | production | A real deploy of `apps/public-web`, which is not what the current Vercel project builds |
| Keyword volume and priority re-ranking | `docs/seo/keyword-map-77-provinces.csv` | A keyword tool or Search Console export |
| Before and after reporting | reporting | GSC, GA4, and a 28 day baseline |
| Live and build agreeing on one metadata template | both | Decide the canonical template, then deploy the chosen one |

---

## 6. Province information layer, and what may be published

The province pages need local facts. Only these categories are safe to publish, and each needs a
citable source recorded next to it.

| Fact type | Publishable | Source required | Note |
| --- | --- | --- | --- |
| Province name in Thai and English | Yes | In-repo registry | Already correct |
| Region | Yes | Authoritative DOPA classification | F-11 must be settled first |
| District list for service area | Yes | Official province administration source | Do not write from memory |
| Electricity authority, PEA or MEA | Yes | Official utility boundary source | High local intent, and factual |
| Solar resource such as irradiation or peak sun hours | Yes | PVGIS or NASA POWER, cited with retrieval date | The skill doc's numbers are unverified placeholders |
| Permits and grid connection steps | Yes | Utility or regulator source | Must match the province's authority |
| Local industry or tourism framing | Yes | Official or published source | Qualitative and cited |
| SIRINX installations in the province | Only if published | `shared/siteContentRegistry.ts` gate | Ruenphae is `REVIEW_REQUIRED`, HOLATEL is `PUBLISHED` with location withheld |
| Installed capacity, savings, payback figures | Only with a verified record | Commissioning record | Not available today |
| Price per kWp, discount, guarantee years, install duration | No, not today | Signed quotation or policy document | Deliberately removed from the site |
| Review counts and star ratings | No, not today | Public review source | No review source is connected |
| Team size, local crew, branch offices, phone per province | No, not today | Legal and HR confirmation | Doc placeholders only |
| Factory counts, GDP ranks | No | Official statistics with year and citation | Only with a real source |

Implementation shape: extend the province record in `shared/thaiProvinces.ts` with optional, sourced
fields, validate them in the existing `assertSiteContentRegistryIntegrity` guard, and render them in
both the client component and the static shell so the served HTML and the hydrated page stay in sync.

---

## 7. Skill doc reconciliation, proposed

1. Replace all six mismatched slugs with the registry values, and add a build-time test that asserts
   every slug in the doc exists in `shared/thaiProvinces.ts`.
2. Replace `https://sirinx.com` with `https://www.sirinx.co` everywhere.
3. Replace the `/solar/{slug}` pattern with `/solar-carport/{slug}` everywhere, including the sitemap
   examples and the 385-page plan.
4. Strip the unsupported claims listed in F-12 and replace the templates with the site's approved
   site-survey framing.
5. Delete the `38,500 searches` and `770 leads` arithmetic, and replace section 10 with a
   measurement plan that starts from zero because no data source is connected.
6. Assign the 5 "additional" provinces to a proper region set from an authoritative source, so region
   grouping is not implicit and cannot drift again.
7. Keep the `#1 ranking` language out of the plan and replace it with the measurable milestones in
   section 8.

---

## 8. Measurement plan

Nothing can be measured today. This is the minimum to make it measurable, in order.

1. Connect a verified GSC property for `www.sirinx.co` and submit the sitemap. Confirm the property
   and the domain property separately.
2. Segment the GSC Pages report by `/solar-carport/*` to get impressions, clicks, CTR, and average
   position per province, which is the only defensible way to report progress.
3. Define the baseline after 28 days of data. Until then, no before-and-after claim is valid.
4. Connect GA4 with a per-province dimension, and instrument lead events for the contact and
   assessment flows with the province slug attached. `SolarCarport.tsx` already builds
   `contactHref` with the province parameter, so the plumbing exists.
5. Only then purchase volume and difficulty data for the 1,712 keyword rows, and re-rank
   `priority_hint` with measured data.
6. Track AEO presence as a manual monthly check for a fixed question set, not as a claim.

---

## 9. Requirement to check traceability, with observed results

Every requirement below was run as an automated check against the real build output, the real
production pages rendered in Chrome, and the generated keyword map. The observed column is what the
check actually returned. The two check scripts and the machine-readable result file live in this
session's scratch directory and are not committed, so the values below are reproducible by re-running
the described checks rather than by running a checked-in command.

| ID | Requirement | How it was checked | Observed | Verdict |
| --- | --- | --- | --- | --- |
| R1 | All 77 Thai provinces covered | registry size, slug uniqueness, built file count | registry=77, unique=77, builtFiles=77 | PASS |
| R2 | Each province page unique title and self canonical | parse `<title>` and canonical in all 77 built files | uniqueTitles=77, canonicalMatches=77/77 | PASS |
| R3 | Every province page in the sitemap | count province `<loc>` entries in the built sitemap | urls=95, provinceUrls=77 | PASS |
| R4 | Bad and mismatched slugs return a real 404 | 6 live HTTP probes, 5 of them doc-style slugs plus 1 unknown | 404 on all 6 | PASS |
| R5 | Served HTML contains province body copy | count static shell and non-empty root in all 77 built files, plus the live root | builtWithShell=0/77, builtWithNonEmptyRoot=0/77, liveRootChars=0 | FAIL |
| R6 | Province pages are internally linked | render 13 pages, count distinct `/solar-carport/<slug>` hrefs | 0 links on every page, 5 hubs and 8 provinces, total 0 | FAIL |
| R7 | Visible breadcrumb matches BreadcrumbList schema | render 8 provinces, look for breadcrumb navigation against the schema | 8/8 visible=false, schema=true | FAIL |
| R8 | Exactly one FAQPage block per page | render 8 provinces, count JSON-LD blocks containing FAQPage | 8/8 blocks=2 | FAIL |
| R9 | Cross-province rendered text is materially different | render 8 provinces, 28 pairs, 5-gram Jaccard | min=mean=max=0.912, text 6,390 to 6,438 characters | FAIL |
| R10 | Indexable project detail pages in the sitemap | count `/projects/<slug>` in the built and the live sitemap | dist=0, live=0 | FAIL |
| R11 | Language and locale signals consistent | parse `html lang`, JSON-LD `inLanguage`, count hreflang | htmlLang=th, inLanguage=th-TH, hreflang=0 | FAIL |
| R12 | Skill doc agrees with registry, domain, and URL pattern | parse 75 doc table rows, count wrong-domain and wrong-path references | slugMismatch=6, sirinxComRefs=19, solarPathRefs=9 | FAIL |
| R13 | Commercial claims are evidence gated | scan 6 forbidden claim strings across all 77 province pages, the home page, and the skill doc | site province hits 0, site home hits 0, skill doc hits 6 | PASS for the site, FAIL for the skill doc |
| R14 | Ranking positions reported with data | look for GSC, GA4, or keyword-tool artifacts | 0 data sources present | NOT ATTEMPTED |
| R15 | Keyword map complete and honest about volume | row count, per-province size, duplicates, volume status, target slugs | rows=1712, national=18, province=1694, 22 per province for all 77, 0 missing, 0 duplicates, 0 not marked unmeasured, 0 invalid target slugs | PASS |
| R16 | Audit document numbers match the artifacts | assert the numbers printed in this document against the measurements | 5/5 present and matching | PASS |

Result: 7 PASS, 8 FAIL, 1 not attempted. The 8 failures are the P0 work in section 5. None of them
is a regression introduced by this audit, and none of them is fixed by this audit, because no change
was made to the site.

A note on R13 scope: the automated scan covers 6 forbidden strings. The other 2 claims listed in
F-12, the regional crew statement and the `055-XXX-XXXX` phone placeholder, are Thai-language
strings that were found by reading the doc, not by the scan.

---

## 10. What was deliberately not done

- No commit, no push, no deploy, no DNS change, no Vercel or Cloudflare mutation.
- No GSC, GA4, or Search Console property was created or connected.
- No ranking, impression, or lead projection was published as a fact.
- No province page content was rewritten. Sections 3 and 6 describe what should change and what
  evidence each change needs, and the content gate in `shared/siteContentRegistry.ts` should stay in
  front of it.
- No keyword volume was invented. Every row is marked `unmeasured`.
