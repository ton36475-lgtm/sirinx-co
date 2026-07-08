# Public Web Preview LINE + Language UAT - 2026-07-08 17:47 +07

## Scope

Preview validation for `apps/public-web` on branch
`feat/sirinx-web-line-trust-v1` after adding the dedicated `/line` page and
fixing the desktop language switcher click behavior.

## Preview Target

- Unique preview: `https://aae25828.sirinx-co.pages.dev`
- Branch alias: `https://feat-sirinx-web-line-trust-v.sirinx-co.pages.dev`

## Code Updates Covered

- Added dedicated `/line` landing page route.
- Added `/line` metadata and static SEO route handling.
- Added footer link to the LINE landing page.
- Fixed desktop language selector so click and keyboard flows can open the
  language menu.
- Changed contact page LINE fallback to use canonical LINE Official config.
- Added source guard for the initial AI bot trigger so it still loads the
  existing `FloatingChatWidget` with `initialOpen`.

## Fresh Verification

- `pnpm --config.verify-deps-before-run=false --dir apps/public-web test`:
  PASS, 8 test files / 48 tests.
- `pnpm --config.verify-deps-before-run=false --dir apps/public-web check`:
  PASS.
- `pnpm --config.verify-deps-before-run=false --dir apps/public-web build`:
  PASS.
- `git diff --check`: PASS.

## Preview Smoke

Target: `https://aae25828.sirinx-co.pages.dev`

- Routes checked from generated sitemap plus required pages: 102.
- Failed routes: 0.
- `/`: HTTP 200.
- `/line`: HTTP 200.
- `/contact`: HTTP 200.
- `/assessment`: HTTP 200.
- `/blog`: HTTP 200.
- `/projects`: HTTP 200.
- `/pricing`: HTTP 200.
- `/solar-carport`: HTTP 200.
- `/line` canonical check: PASS for `https://www.sirinx.co/line`.
- `/line` chunk check: PASS for `Line-*.js`.
- `/contact` chunk check: PASS for `Contact-*.js`.
- LINE QR image endpoint:
  `https://qr-official.line.me/gs/M_304zrttj_GW.png?oat_content=qr` returned
  HTTP 200.
- LINE short link `https://lin.ee/S97R6nj` returned HTTP 301, expected for a
  redirecting short link.

## Browser UAT Notes

- `/line` rendered as a real landing page on the preview, not only SPA
  fallback.
- The LINE QR image was visible on the `/line` page.
- The desktop language menu opened on click.
- Selecting `EN` changed visible navigation, footer, and `/line` headline copy
  to English.
- Language state persisted while navigating to another page.
- The floating LINE CTA and AI bot trigger were visible together in the
  floating contact dock.

## Remaining Manual Checks

- Real-device scan of the LINE QR still requires human confirmation.
- Existing bot click behavior still requires human confirmation on the preview.
  Source-level guard confirms the original trigger remains present and loads the
  existing `FloatingChatWidget` with `initialOpen`.

## Safety Status

- Preview deploy: completed using the exact approved command shape.
- Production/custom-domain deploy: no.
- Git push after these new local changes: no.
- PR/merge: no.
- LINE webhook: no.
- Production analytics activation: no.
- CRM/customer data storage: no.
- Secret read/write: no.
