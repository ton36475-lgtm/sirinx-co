# og:image fix — deployed 2026-09-27

## The defect
Every `og:image` on the site pointed at
`https://d2xsxph8kpxj0f.cloudfront.net/.../sirinx-og-image-*.png`.
That origin now answers `403 AccessDenied` (S3, `x-cache: Error from cloudfront`)
to every request, including the `facebookexternalhit` user agent. Every link
preview of every page rendered blank.

It stayed invisible because:
- `audit-live-seo.mjs` measured H1, visible text, funnel links and feed status —
  never og:image
- `ogTags.test.ts` asserted the presence of the dead URL, not its reachability,
  so the test passed for as long as the origin stayed broken

## The fix
- `ogTags.ts`: per-province cards from `/provinces/<slug>-og.jpg`; the site
  fallback also moved off CloudFront
- committed the 77 `-og.jpg` files (5.4 MB) that were already built and served
  but referenced by nothing and untracked in git
- `audit-live-seo.mjs`: HEADs every distinct og:image, reports
  `ogImageCount` / `ogImageOk` / `ogImageBroken`, and treats a drop in
  `ogImageOk` as a regression
- replaced the test that pinned the dead URL; added a per-province case

## Measured
| | before | after |
|---|---|---|
| production og:image retrievable | 0 / 1 | 2 / 2 |
| broken og:image | 1 | 0 |
| province pages with their own card | 0 / 77 | 77 / 77 |
| `facebookexternalhit` UA on /solar-carport/bangkok/ | 403 | 200, 74 KB |

Tests: 42 files / 332 tests passed (was 331; the per-province case is new).
`node scripts/audit-live-seo.mjs --compare` → exit 0.

## Ship
- commit `4e3c3dd`, branch `main`
- Pages `https://7fa7843c.sirinx-co.pages.dev`
- rollback: `20001d9` (previous deploy), `backup/pre-push-20260927` (`96c70bb`)
