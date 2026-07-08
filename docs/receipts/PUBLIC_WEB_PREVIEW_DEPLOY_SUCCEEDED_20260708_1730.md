# Public Web Preview Deploy Succeeded - 2026-07-08 17:30 +07

## Scope

Preview deploy for `feat/sirinx-web-line-trust-v1` to Cloudflare Pages project
`sirinx-co`.

## Approved Deploy Command

The approved deploy command was:

```bash
pnpm --dir apps/public-web build && wrangler pages deploy apps/public-web/dist/public --project-name sirinx-co --branch feat/sirinx-web-line-trust-v1
```

Wrangler was installed as a local `apps/public-web` dev dependency and exposed
on `PATH` for this shell so the approved command shape could run from the repo
root with the approved `apps/public-web/dist/public` path.

## Tooling

- Wrangler version: `4.108.0`.
- Auth status: logged in via existing OAuth token for the local Cloudflare account.
- Package install: yes, limited to `wrangler` as an `apps/public-web`
  dev dependency after explicit approval.

## Build Result

Status: PASS.

- Vite production build completed.
- Static SEO generation completed.
- Server bundle completed.
- Generated SEO routes: 94.
- Province routes: 77.
- Output directory: `apps/public-web/dist/public`.

## Deploy Result

Status: PASS.

Cloudflare Pages output:

```text
Deployment complete! Take a peek over at https://80952e8f.sirinx-co.pages.dev
Deployment alias URL: https://feat-sirinx-web-line-trust-v.sirinx-co.pages.dev
```

## Smoke Verification

- `https://80952e8f.sirinx-co.pages.dev/`: HTTP 200.
- `https://80952e8f.sirinx-co.pages.dev/line`: HTTP 200.
- `https://80952e8f.sirinx-co.pages.dev/contact`: HTTP 308 to `/contact/`, then HTTP 200.
- `https://feat-sirinx-web-line-trust-v.sirinx-co.pages.dev/`: HTTP 200.

## Safety Status

- Preview deploy: yes, approved and completed.
- Production custom domain deploy: no explicit production domain switch was performed.
- Webhook activation: no.
- Production analytics activation: no.
- CRM/customer data storage: no.
- Merge/PR: no.
- Secret read/write: no.
- DNS mutation: no.

## Preview URLs

- Unique preview:
  `https://80952e8f.sirinx-co.pages.dev`
- Branch alias:
  `https://feat-sirinx-web-line-trust-v.sirinx-co.pages.dev`

## Next Safe Action

Human preview review on the unique preview and branch alias URLs. Production
promotion/custom-domain deploy, PR/merge, webhook activation, analytics
activation, and CRM/customer data storage remain separate gates.
