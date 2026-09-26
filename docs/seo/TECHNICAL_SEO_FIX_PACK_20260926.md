# Technical SEO Fix Pack — www.sirinx.co — 2026-09-26

Status: LOCAL_ONLY · Lane: freebuff (Hermes control plane) · Gates consumed: **none**
Companion: `reports/SIRINX_CO_SEO77_REVIEW_AND_JCODE_LANE_AUDIT_20260926.md` (project-hermes checkout)
Guard test: `apps/public-web/shared/staticDeploySurface.test.ts` (6 tests, red→green proven)

> **ก่อนใช้เอกสารนี้ อ่าน `SEO77_VERIFICATION_AND_STATUS_20260926.md` ก่อน** — มีผลตรวจข้ออ้างทุกข้อเทียบกับไฟล์จริง
> (จริง 12 · บางส่วน 3 · เท็จ 1) พร้อมรายการที่ล้าสมัยแล้ว เช่น ตาราง §1 ที่ยังอ้างว่า `/projects` + `/blog`
> มี SPA fallback (ถูกลบไปแล้ว) และเกณฑ์ "ขาด energy record 13 รายการ" (ตอนนี้ครบ 77/77)
> นอกจากนี้ `client/public/robots.txt` ไม่ใช่ไฟล์ที่ deploy — มันถูก `buildRobots()` เขียนทับตอน build

## 1. Fixed here: the soft-404 catch-all (R19 finding)

**Before** — `client/public/_redirects` was one line:

```
/* /index.html 200
```

Every nonexistent URL answered 200 with the SPA shell. Crawlers could index the shell for
unknown paths, and uptime/link checks could not see real breakage (R19 diagnosis).

**After** — route-aware fallback (`client/public/_redirects`):

| request | behaviour |
| --- | --- |
| prerendered routes (22 top-level + 77 `/solar-carport/:province/`) | static file, unchanged |
| `/projects/<slug>`, `/blog/<slug>` (client-rendered details) | SPA shell via scoped `200` rewrite — real deep links keep working |
| `/admin`, `/admin/*` (client-rendered, robots-disallowed) | SPA shell via scoped `200` rewrite |
| anything else | **real 404** — `client/public/404.html` served by Cloudflare Pages with status 404 |

`404.html` is a self-contained Thai page (copy matched to `pages/NotFound.tsx`), `noindex, follow`,
with links to `/`, `/solar-carport/`, `/provinces/`, `/projects/`, `/pricing/`, `/contact/`.

Design note: the rules deliberately contain **no** `/*` catch-all, and the subtrees they cover
contain no hashed assets (those live under `/assets/`), so the result is correct under either
Cloudflare Pages redirect-vs-asset precedence interpretation. Empirical basis: on the current live
deployment the old catch-all did not shadow assets (the SPA renders, per R19), so prerendered
files win over `200` rewrites in practice.

**Remaining soft-404 surface: none.** `/projects/:slug` and `/blog/:slug` are now prerendered
(`server/ogTags.ts` `getStaticSeoRoutes` — 107 routes), their scoped `200` fallbacks were removed,
and unknown slugs hit the real 404. Only `/admin*` keeps the SPA fallback (robots-disallowed
client area).

## 2. DECIDED (2026-09-26) — URL structure for the 77-province pages

Two implementations target `www.sirinx.co` with **different URL structures for the same content**:

| implementation | URL pattern | state |
| --- | --- | --- |
| `sirinx-co/apps/public-web` (the apex source, R14) | `/solar-carport/<slug>/` | built locally, sitemap 96 URLs, not deployed |
| `sirinx-os/apps/public-web` (47-ronin static set) | `/solar/<slug>/` | built locally (77 pages + own sitemap), not deployed |

**Decision (Commander-approved 2026-09-26):** `/solar-carport/<slug>/` is canonical (apex source,
product keyword). If the sirinx-os set is ever deployed it must carry
`/solar/* /solar-carport/:splat 301` and must not publish its own sitemap against www.sirinx.co.

Also per Cloudflare's own proxying note: if any `200` proxy rules are added later for content that
also exists under another URL, add a `Link: <...>; rel="canonical"` header in `_headers` for that
path.

## 3. CLOSED (2026-09-26) — placeholder telephone in structured data

Closed by (2): the `telephone` field was removed from the generator
(`generate_77_province_seo.py`) and from all 79 generated/static files (77 pages + numbered SEO
pages + copies). JSON-LD re-validated as parseable. A real number may be re-added to the generator
only when a verified, published company number is supplied. The monorepo pages never carried the
field.

## 4. Follow-ups (not done in this pack)

1. ~~**Prerender `/projects/:slug` and `/blog/:slug`**~~ — **done** (2026-09-26, second pass):
   `getStaticSeoRoutes()` now covers all project detail slugs + 9 blog posts (107 routes), the
   sitemap lists only indexable routes (`getSitemapRoutes`, 105 URLs — project details enter it
   automatically when their evidence gate passes), blog meta now matches the client RouteSeo copy
   (crawler/client parity), and the two scoped `200` rewrites are gone. Guarded by
   `server/prerenderRoutes.test.ts` + the updated `shared/staticDeploySurface.test.ts`.
2. **Duplicate content is still the biggest ranking risk**: Bangkok vs Phuket rendered pages are
   98.2% identical (SequenceMatcher) — the jcode lane's data enrichment is necessary but not
   sufficient; each province needs unique prose (the commanded 3 000–12 000 words is currently
   ~2 400 with ~2% uniqueness).
3. **Deploy only after §2 is decided and the 13 missing province energy records land** (jcode
   lane's background job is filling them), and treat the 09-25 Vercel/Supabase receipt as
   unverified against the apex.
4. `robots.txt` has `Disallow: /admin` without a trailing slash — cosmetic, but `/admin` and
   `/admin/*` are already covered; consider `/admin` → `/admin/` for clarity.

## 5. What this pack did NOT do

No deploy, no push, no DNS/Cloudflare mutation, no secret read, no external message. Nothing in
`shared/provinceEnergyData*`, `docs/seo/generate-province-energy-data.mjs`,
`docs/seo/keyword-map-77-provinces.csv` or any file the jcode lane is currently writing was touched.
