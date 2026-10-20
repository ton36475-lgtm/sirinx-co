# Deploy — sirinx.org (3D / WebGL glass frontend) 2026-10-21

Status: `DEPLOYED / VERIFIED_LIVE`

## 1. Which resource actually owns sirinx.org

`wrangler pages project list --json` exposes a `Project Domains` field that the
table view does not show:

```text
sirinx-co          → sirinx-co.pages.dev
sirinx-co-preview  → sirinx-co-preview.pages.dev, sirinx.org, www.sirinx.org
```

So `sirinx.org` and `www.sirinx.org` are custom domains of the Pages project
**`sirinx-co-preview`** (last modified 4 days ago), not a Worker and not a
separate project. Deploying there needs **no DNS, route, Worker, or Access
change** — the custom domains already exist.

Before this deploy the project served a 77-province knowledge site
(`/solar-carport-<province>/`, ~13.5 KB per page, distinct H1 per province,
canonical `www.sirinx.org`). Its previous Production deployment was
`f4586a46-2a90-4efa-8769-c3431bf27a74` — that is the rollback target.

## 2. Defect found before publishing

The public-web build hard-codes `www.sirinx.co` in the canonical link, OG/JSON-LD,
`sitemap.xml`, `robots.txt` and the CSP `script-src` list. Deploying that bundle
to `.org` unchanged would have made all 105 sitemap URLs and every canonical
point at `sirinx.co` — duplicate content, and the CSP would have allowed the
wrong asset origin.

Fix: `scripts/build-public-web-variant.mjs` copies `dist/public` to `dist-org`
and retargets only absolute origins (`www.sirinx.co` → `www.sirinx.org`,
`https://sirinx.co` → `https://sirinx.org`) in text surfaces (`.html .js .css
.json .xml .txt .webmanifest .map` plus the extension-less `_headers` /
`_redirects`). It fails (exit 1) if any `www.sirinx.co` remains, excluding its
own manifest.

```text
{"ok": true, "origin": "https://www.sirinx.org", "textFilesScanned": 213,
 "textFilesChanged": 118, "leftovers": []}
```

Second defect: the old `.org` province URLs are `/solar-carport-bangkok/`, while
public-web publishes `/solar-carport/bangkok/`; after the switch the 77 indexed
URLs returned **404**. Fix: `scripts/gen-legacy-province-redirects.mjs --dist=…`
appends one explicit `301` per generated province (77 rules) to the built
`_redirects`, in both bundles.

## 3. Deployments

| Project | Bundle | Commit | Deployment | Environment |
| --- | --- | --- | --- | --- |
| `sirinx-co-preview` (.org) | `apps/public-web/dist-org` | `d0a7f0f` | `cce620eb` → final `40f78bcf` (after redirects) | Production / main |
| `sirinx-co` (.co) | `apps/public-web/dist/public` | `d0a7f0f` | `b83e1a1b` → final `95e6a06e` (after redirects) | Production / main |

The second deploy of each project carried only `_redirects`.

## 4. Live verification

| Check | Result |
| --- | --- |
| `https://sirinx.org/` | 200, 22,078 B, title "SIRINX | Solar Carport วางแผนลดค่าไฟองค์กร…" |
| canonical on `.org` | `https://www.sirinx.org/` (not `.co`) |
| `https://www.sirinx.org/` | 200, same build |
| `/.org/sitemap.xml` | 200, **105 URLs, all `https://www.sirinx.org`**, zero `.co` |
| `/projects/` on `.org` | 200 — real installation portfolio |
| `/projects/ruenphae-royal-park/` | 200 |
| `/solar-carport/bangkok/` | 200 |
| `/assets/three.module-Dljb2UHm.js` | 200 — the 3D stack ships on `.org` |
| `/solar-carport-bangkok/` (legacy) | **301 → `/solar-carport/bangkok/`** (spot-checked bangkok, chiang-mai, yasothon) |
| `/solar-carport-bangkok/` on `.co` | 301 → `/solar-carport/bangkok/` |
| `https://www.sirinx.co/` | 200, unchanged behaviour |

CSP on `.org` now allows `https://www.sirinx.org/assets/` and
`https://sirinx.org/assets/`, and still allows the `*.sirinx-co.pages.dev` preview
origin so a preview deployment can load its own assets.

## 5. Rollback

- `.org`: Cloudflare dashboard → Pages → `sirinx-co-preview` → Deployments →
  select `f4586a46-2a90-4efa-8769-c3431bf27a74` → "Rollback to this deployment".
- `.co`: same path on `sirinx-co`, select `086ac283-6761-4a73-8ec7-56d9cccffb98`.

No DNS/binding change was made, so a rollback is a deployment switch only.

## 6. Known consequences and limits

- The `.org` knowledge site's prose (77 province H1s) is replaced by the
  public-web content. Province coverage remains at the new URL pattern, and the
  old URLs 301 instead of 404. The old copy itself is not in this repo; it exists
  only in deployment `f4586a46` and its predecessors.
- The variant rewrite is textual: any future hard-coded `.co` origin added to the
  build will be caught (`leftovers` check) but the mechanism is not a template.
- No Worker/lead-API change: `.org` is a static Pages site and has no lead
  endpoint of its own; `.co` keeps `sirinx-main-router` + D1.
- The build was produced at 6.5 GiB free; no `npm run check` build stage was run
  (15 GiB floor), only the public-web build itself plus the egress guard.
