# SIRINX Production QA Executive Summary - 2026-07-07

Target: `https://www.sirinx.co`

Artifact root:
`/Users/sirinx/restore-sources/github-audit/sirinx-co/reports/qa/sirinx-production-2026-07-07T08-35-37-017Z`

Mode: read-only production QA. No form submit, live send, provider/model call,
secret read/print, deploy, DNS mutation, R2/D1/KV mutation, or rollback was
performed.

## Scope Covered

- Sitemap routes checked: 94
- Internal links checked: 101
- Same-origin asset sample checked: 31
- Browser viewport checks: 24
- Viewports: desktop 1440, mobile 375, tablet 768
- Priority browser routes:
  - `/`
  - `/solar-carport/`
  - `/contact/`
  - `/projects/`
  - `/solutions/`
  - `/assessment/`
  - `/pricing/`
  - `/home-solution/`

## Overall Verdict

`PASS_WITH_FINDINGS`

The production site is live and routable, but it is not clean enough to call
"fully complete" yet. The most important blocker is the `Solar Carport` page
rendering large blank vertical sections. The second issue is a repeated
Content-Security-Policy console error on every priority browser check.

## Findings That Matter

### 1. Solar Carport page has large blank sections

Severity: High UX finding

Evidence:

- Desktop screenshot:
  `/Users/sirinx/restore-sources/github-audit/sirinx-co/reports/qa/sirinx-production-2026-07-07T08-35-37-017Z/screenshots/solar-carport-desktop1440.png`
- Mobile screenshot:
  `/Users/sirinx/restore-sources/github-audit/sirinx-co/reports/qa/sirinx-production-2026-07-07T08-35-37-017Z/screenshots/solar-carport-mobile375.png`

Observed behavior:

- Header, hero, floating AI button, and footer render.
- Middle content contains unusually large blank dark sections.
- This affects both desktop and mobile.
- This is visible to users and should be fixed before claiming the page is
  visually complete.

### 2. CSP blocks inline script and inline event handler

Severity: High technical finding

Count: 24 browser console findings across 8 priority routes x 3 viewports.

Pattern:

- Inline script blocked by `script-src`.
- Inline `onload` handler blocked on Google Font preload.
- Cloudflare-injected inline challenge script is blocked by the current CSP.

Evidence:

- Raw QA JSON:
  `/Users/sirinx/restore-sources/github-audit/sirinx-co/reports/qa/sirinx-production-2026-07-07T08-35-37-017Z/qa-result.json`
- Example affected page:
  `https://www.sirinx.co/solar-carport/`

Production HTML lines observed:

- Font preload uses inline `onload`.
- JSON-LD is inline.
- Cloudflare challenge snippet is inline.

Recommended fix direction:

- Remove inline `onload` font preload pattern or replace with CSP-safe CSS loading.
- Decide whether Cloudflare challenge/telemetry inline script should be allowed
  via nonce/hash or disabled for this Pages deployment path.
- Keep CSP strict; do not add broad `unsafe-inline` unless explicitly accepted
  as a security tradeoff.

### 3. Static HTML heading structure is weak

Severity: SEO/accessibility warning

Count: 93 `h1_count` warnings in static HTML.

Observed behavior:

- Most static route HTML contains no server-rendered H1.
- `/home-solution/` contains two static H1 entries.
- This may be acceptable for client-rendered React visually, but it is weak for
  crawlers, no-JS contexts, and static SEO evidence.

Recommended fix direction:

- Ensure each generated static route has exactly one semantic H1 in the rendered
  static HTML.
- For province pages, generate route-specific H1 text.

### 4. Cloudflare RUM POST occurs during passive page load

Severity: Warning

Count: 24 browser observations.

Observed request:

- `POST https://www.sirinx.co/cdn-cgi/rum?`

Interpretation:

- This appears to be Cloudflare telemetry, not app-level customer/live-send
  behavior.
- It should remain documented because it is still a non-GET request during
  passive load.

## Checks That Passed

- 0 critical findings.
- No sitemap route returned 404/500 during HTTP crawl.
- No broken internal links found in the checked internal-link set.
- Same-origin asset sample returned cleanly.
- Main production site returns HTTP 200.
- Solar Carport metadata is present.
- No app-level form submission was performed.
- No live Telegram/LINE/email send was performed.
- No provider/model call was performed.
- No secret read/print was performed.

## Screenshot Evidence

Primary failure screenshots:

- `screenshots/solar-carport-desktop1440.png`
- `screenshots/solar-carport-mobile375.png`

Additional priority-page screenshots are in:

`/Users/sirinx/restore-sources/github-audit/sirinx-co/reports/qa/sirinx-production-2026-07-07T08-35-37-017Z/screenshots`

## Recommended Next Gate

Open a scoped patch gate for production-site fixes:

`APPROVE_SIRINX_PRODUCTION_QA_FIX_CSP_AND_SOLAR_CARPORT_BLANKS_20260707`

Suggested scope:

- Fix `/solar-carport/` blank sections.
- Fix CSP console errors without weakening CSP broadly.
- Improve static H1 generation for SEO routes.
- Re-run production QA on preview before any production redeploy.

Blocked until separate approvals:

- production redeploy
- DNS mutation
- R2/D1/KV mutation
- webhook/live send
- provider/model calls
- secret read/print
- rollback
