# B16 slice — public-web egress guard + placeholder removal (2026-10-21)

Status: `SOURCE_SLICE_LANDED / DIST_NOT_REBUILT / C8_OPEN`
Method: MillerDev — inspect → plan → implement → verify → report, Truth Protocol on.
Parent finding: A42 §3.2 (`reports/runtime/rea-all-systems-audit-20261020.md`).

## 1. What was ordered vs what was done

B16 has four definition-of-done clauses. Three are source-level and landed here;
the fourth (a rebuilt and re-measured bundle) is blocked by the workload disk
floor that A22/A31/B12 froze, so it is not claimed.

| B16 clause | State | Evidence |
| --- | --- | --- |
| `cdn.example.com` placeholder gone | **done in source**, stale in `dist` | `apps/public-web/client/src/pages/admin/BlogCMS.tsx:276` |
| One CI-able check that fails on a new literal host outside an allowlist | **done** | `scripts/verify-public-web-egress.mjs`, wired into `npm run check` |
| Hero imagery from an origin we control, or an operator waiver | **waived, not resolved** | 6 C8 waivers in `config/public-web/egress.allowlist.v1.json` |
| Font strategy declared in the analytics/consent copy | **not done** | still only a waiver; the privacy copy is untouched |
| Re-run A42 receipts after the change | **not possible** | `dist` is not rebuilt (workload floor), so `--dist` still reports the old bundle |

## 2. The placeholder

`BlogCMS.tsx` shipped `placeholder="https://cdn.example.com/image.jpg"` inside the
admin blog form, which Vite inlined into the production chunk. It now reads
`/assets/blog/cover.webp หรือ https://www.sirinx.co/assets/…` — a first-party path
plus our own origin, so the string can no longer teach an editor to paste a
placeholder host.

The checked-in `dist` still contains the old string
(`dist/public/assets/BlogCMS-C6ZpxrV5.js`). That is expected: the bundle is built
output, and no build was run.

## 3. The guard

`scripts/verify-public-web-egress.mjs` is a static, offline assertion — no build,
no network, no target execution. It walks the shipped source surface:

- `apps/public-web/client/index.html`
- `apps/public-web/client/public` (including the extension-less `_headers` and
  `_redirects`, which the first draft silently skipped because they have no suffix)
- `apps/public-web/client/src`, `brands`, `shared`, `server` (test/spec files excluded)

and compares every literal `http(s)://host` against
`config/public-web/egress.allowlist.v1.json`. `--dist` adds
`apps/public-web/dist/public` for post-build verification. `--json` emits the full
result.

Rules:

| Rule | Behaviour |
| --- | --- |
| Host not in the allowlist | **error** `unknown_host` |
| Reserved/example host (`example.*`, `.invalid`, `.test`, `your-*`) | **error** `placeholder_host`; a subdomain such as `cdn.example.com` can never be allowlisted into passing |
| Same placeholder inside `brands/_<name>/` | **warning** `placeholder_host_scaffold` (a scaffold is never imported by the active brand) |
| `third-party-asset` / `third-party-font` with no waiver | **error** `third_party_without_waiver` |
| Same, with a ticket-bound waiver | **warning** `waived_third_party` |
| `service-api` to a non-own origin | **warning** `third_party_runtime_api` (visible every run) |
| Allowlisted host not found in the surface | **warning** `stale_allowlist_entry` |
| Structurally invalid allowlist (duplicate host, unknown class, misplaced waiver, `class: placeholder`, `documentation` on anything but the bare `example.*`) | **exit 2** |
| `http://localhost` + `*.sirinx-co.pages.dev` | handled (`local-dev`, and `subdomains: true`) |

## 4. Measured result (this host, today)

| Mode | Files | URL occurrences | Hosts | Errors | Warnings |
| --- | --- | --- | --- | --- | --- |
| source | 218 | 219 | 28 | **0** | 11 |
| source + `--dist` | 429 | 4,451 | 31 | **1** (stale `cdn.example.com`) | 11 |

The 11 source warnings, in full:

| Category | Hosts | Meaning |
| --- | --- | --- |
| waived third-party assets (C8, until 2026-11-30) | `d2xsxph8kpxj0f.cloudfront.net`, `images.unsplash.com`, `github.com`, `forge.butterfly-effect.dev` | fetched by the browser, outside our account |
| waived third-party fonts (C8) | `fonts.googleapis.com`, `fonts.gstatic.com` | every visitor contacts Google for fonts |
| scaffold placeholder | `your-cdn.com` | `brands/_template`, never imported |
| declared runtime APIs | `re.jrc.ec.europa.eu` (PVGIS), `forge.manus.im` | third-party call from our own code |
| stale allowlist entries | `react.dev`, `jcgt.org` | `upstream-reference`: only appear in vendored library text inside `dist` |

### 4.1 Findings the dist-level count in A42 did not name

The source scan names the egress *owners*, which a bundle-wide host count cannot:

- `apps/public-web/brands/sirinx/config.ts:116-119` — CloudFront `logo`, `heroImage`,
  `ogImage` (the 147 refs A42 counted all descend from these three lines plus page
  imagery). `client/src/lib/cfImage.ts` already returns the raw URL with a comment
  that the transform route 403s, so no transform is in play.
- `client/index.html:76-90` — Google Fonts preconnect + preload + `noscript` link.
- `client/public/_headers` — `font-src` allows `fonts.gstatic.com`, `style-src`
  allows `fonts.googleapis.com`, and `script-src` allows `static.cloudflareinsights.com`.
- `client/src/components/Map.tsx:92` — `forge.butterfly-effect.dev` map script.
- `client/src/pages/ComponentShowcase.tsx:699` — `github.com/shadcn.png` avatar.
- `client/src/lib/blogData.ts` — `images.unsplash.com` cover images.
- `server/_core/llm.ts:215` — `https://forge.manus.im/v1/chat/completions` as a
  hard-coded fallback whenever `FORGE_API_URL` is unset. This is the one item here
  that is a server-side third-party default rather than a browser asset, and it is
  outside C8's original scope; it is recorded so C8 can absorb or reject it.

## 5. Verification

| Check | Command | Result |
| --- | --- | --- |
| Guard + test syntax | `node --check scripts/verify-public-web-egress{,.test}.mjs` | rc 0 |
| Guard, source surface | `node scripts/verify-public-web-egress.mjs` | rc 0, 0 errors / 11 warnings |
| Guard, source + dist | `node scripts/verify-public-web-egress.mjs --dist` | rc 1 — exactly the stale placeholder, which is the intended behaviour until a rebuild |
| Guard tests | `node --test scripts/verify-public-web-egress.test.mjs` | **12/12 pass** |
| TypeScript after the TSX edit | `npm run web:check` (`tsc --noEmit`) | rc 0 |
| Existing validators | `node scripts/verify-pr-mono-001.mjs`, `node scripts/verify-next-phase.mjs` | rc 0 / rc 0 |
| Check-chain wiring | `node -p require('./package.json').scripts.check` | guard present after the validators, before `command-center:check` |
| `npm run check` (full) | — | **not run**: its final stage is `command-center:build`; the same workload-floor reason as A42 |
| `npm run control:test` | — | **not re-run**: nothing under `services/` changed |

## 6. Limits that must not be read as coverage

- **Literal hosts only.** A URL assembled at runtime (`\`${base}/x\``) or a host read
  from env/config is invisible. The guard proves today's *declared* set, not that no
  other request can happen.
- **CSP is the real egress boundary, and it is looser than the guard.** `_headers`
  sets `img-src 'self' data: https:` — any HTTPS image origin is permitted at
  runtime, so a dynamic `<img src>` from an undeclared host would still load. The
  guard cannot see that; tightening `img-src` is a separate decision.
- **Wildcards are honoured, not invented.** `*.sirinx-co.pages.dev` is covered
  because it appears literally in `_headers`; a wildcard generated at runtime is not.
- **`dist` is stale.** `--dist` reporting the old placeholder is the guard working,
  not a regression. It clears only with a fresh build receipt (B14/B16).
- **Waivers are not approvals.** Six hosts are *tolerated pending C8*; none of them
  is resolved, and the waiver expiry (2026-11-30) is a reminder, not enforcement —
  the guard does not fail on an expired date yet.
- **No network, no build, no send.** This report is a static-reading artifact.

## 7. What closes B16

1. Rebuild `apps/public-web` once the workload floor is restored, then
   `node scripts/verify-public-web-egress.mjs --dist` must return 0 errors and the
   regenerated A42 receipts must show `cdn.example.com` = 0.
2. C8 decision on the six waived hosts (accept, rehost to our origin, or drop),
   including the `forge.manus.im` fallback.
3. A font strategy statement in the analytics/consent copy, or self-hosted OFL fonts.
