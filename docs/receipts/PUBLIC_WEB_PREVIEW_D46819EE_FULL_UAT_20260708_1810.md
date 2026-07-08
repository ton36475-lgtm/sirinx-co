# Public Web Preview Full UAT - 2026-07-08 18:10 +07

## Scope

Full preview UAT for `apps/public-web` on branch
`feat/sirinx-web-line-trust-v1` after the LINE page, desktop language switcher,
and CSP compatibility fixes.

## Preview Target

- Unique preview: `https://d46819ee.sirinx-co.pages.dev`
- Branch alias: `https://feat-sirinx-web-line-trust-v.sirinx-co.pages.dev`

## Fixes Included Before This UAT

- Replaced the Google Fonts inline `onload` event handler in
  `client/index.html` with a normal stylesheet link so the deployed CSP no
  longer blocks an inline event handler.
- Changed the desktop language switcher from hover-close behavior to a
  click-first menu with Escape and blur close handling.
- Added regression coverage for CSP-safe HTML entry and stable language menu
  behavior.

## Deploy Verification

Approved preview deploy command shape was run after the fixes:

```bash
pnpm --dir apps/public-web build && wrangler pages deploy apps/public-web/dist/public --project-name sirinx-co --branch feat/sirinx-web-line-trust-v1
```

Result: PASS.

Cloudflare Pages output:

```text
Deployment complete! Take a peek over at https://d46819ee.sirinx-co.pages.dev
Deployment alias URL: https://feat-sirinx-web-line-trust-v.sirinx-co.pages.dev
```

## Local Verification

- `pnpm --config.verify-deps-before-run=false --dir apps/public-web test`:
  PASS, 8 files / 49 tests.
- `pnpm --config.verify-deps-before-run=false --dir apps/public-web check`:
  PASS.
- `pnpm --config.verify-deps-before-run=false --dir apps/public-web build`:
  PASS.

## Preview Route Smoke

- Route count checked: 113.
- Failed routes: 0.
- Required route statuses:
  - `/`: 200.
  - `/line`: 200.
  - `/contact`: 200.
  - `/assessment`: 200.
  - `/projects`: 200.
  - `/pricing`: 200.
  - `/blog`: 200.
  - `/solar-carport`: 200.
  - `/home-solution`: 200.
  - `/about`: 200.
  - `/solutions`: 200.
  - `/industries`: 200.
  - `/investment`: 200.
  - `/strategy`: 200.
  - `/partner`: 200.
  - `/privacy`: 200.
  - `/terms`: 200.
  - `/cookies`: 200.
  - `/404`: 200.

## Browser UAT

Runtime evidence folder:
`.ghostclaw_runtime/website-uat/public-web-preview-d46819ee-20260708-uat`

- Browser checks: 74 / 74 passed.
- Console errors: 0.
- Page errors: 0.
- Desktop `/line`: QR image visible and canonical LINE links present.
- Desktop language switch: TH, EN, and CN visible copy passed.
- Desktop bot: existing SIRINX Assistant opened from the floating bot trigger.
- Contact page: LINE Official contact path present.
- Mobile `/line`: headline and QR present.
- Mobile floating dock: present.
- Mobile bot: existing SIRINX Assistant opened from floating bot trigger.

Screenshots captured:

- `.ghostclaw_runtime/website-uat/public-web-preview-d46819ee-20260708-uat/line-desktop.png`
- `.ghostclaw_runtime/website-uat/public-web-preview-d46819ee-20260708-uat/line-bot-open-desktop.png`
- `.ghostclaw_runtime/website-uat/public-web-preview-d46819ee-20260708-uat/contact-desktop.png`
- `.ghostclaw_runtime/website-uat/public-web-preview-d46819ee-20260708-uat/line-mobile.png`
- `.ghostclaw_runtime/website-uat/public-web-preview-d46819ee-20260708-uat/line-mobile-bot-open.png`
- `.ghostclaw_runtime/website-uat/public-web-preview-d46819ee-20260708-uat/report.json`

## Safety Status

- Submitted forms: no.
- Clicked external LINE links: no; hrefs were inspected only.
- Production/custom-domain deploy: no.
- LINE webhook activation: no.
- Production analytics activation: no.
- CRM/customer data storage: no.
- PR/merge: no.
- Git push after these local changes: no.
- Secrets read/written: no.

## Remaining Human Checks

- Real-device QR scan still requires human confirmation.
- Human visual review of the latest preview URL is still recommended before any
  production/custom-domain promotion.
