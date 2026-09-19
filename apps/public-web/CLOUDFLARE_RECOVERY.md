# SIRINX Cloudflare recovery — 2026-09-19

Status: source hardening and standalone tests only. Production is not redeployed.
Inspected base: `ton36475-lgtm/sirinx-co@76ae569416c136eb9097e78fcf8277746e9d6cb2`.
App: `apps/public-web`. Its frontend output is `dist/public`, not the repository root or all of `dist`.
The current production repository/commit, Cloudflare settings and backend routing still need authenticated reconciliation.

## Changes

- Image transforms are opt-in through the public build flag `VITE_CF_IMAGE_TRANSFORMS=true`.
  With the flag absent/false, `src` uses the original image and transformed `srcset` is omitted.
  This removes the transformation dependency; it cannot restore a missing original at CloudFront.
- Validate exact remote origin/path and normalize numeric image parameters.
- Remove the blanket `/* /index.html 200` rewrite. Preserve matching static assets and generated SEO HTML;
  rely on native Pages SPA fallback, which requires no top-level `404.html`.
- Add dependency-free recovery tests and a static output preflight. No dependencies or lockfiles changed.
- Wrangler and VS Code MCP files are examples only; they are not active production configuration.

## Run locally

Use Node 22.16+ (or a compatible newer version) for the standalone TypeScript-strip test runner.
Run from `apps/public-web`:

```sh
node --experimental-strip-types --test scripts/cloudflare-recovery.check.mjs
```

The audit environment passed 11 standalone tests and an isolated TypeScript check of `cfImage.ts`.
Fixture files used by preflight tests are synthetic, not a real website build or image-decoding test.
Full install, application typecheck/tests, Vite build, browser QA and Cloudflare preview remain unverified.

On the authorized build machine, preserve the existing pnpm lock and packageManager version:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm run check
corepack pnpm run test
corepack pnpm exec vite build
corepack pnpm exec tsx server/staticSeoBuild.ts
node scripts/pages-preflight.mjs
```

Stop on any nonzero exit. Set `NODE_ENV=production` and `VITE_CF_IMAGE_TRANSFORMS=false` in the build environment.
In PowerShell, check `$LASTEXITCODE` after each native command; do not assume `$ErrorActionPreference` catches it.
Static build command for Pages: `pnpm exec vite build && pnpm exec tsx server/staticSeoBuild.ts && node scripts/pages-preflight.mjs`.
Root directory: `apps/public-web`. Output directory relative to that root: `dist/public`.
The existing `pnpm run build` also bundles an Express/Node server as `dist/index.js`; a static upload does not run it.
Never upload the whole repository or the Node server output as public assets.

## Reconcile Wrangler before configuration changes

Use the authorized Cloudflare account; do not paste tokens into chat or source files.
The historical project name is `sirinx-co`; verify its domains and production branch before using it.
Inspect Wrangler first, then pin the approved exact version for repeatable deployment tooling:

```sh
npx wrangler@4 --version
npx wrangler@4 whoami
npx wrangler@4 pages project list
npx wrangler@4 pages deployment list --project-name sirinx-co --environment production --json
```

Use `npx wrangler@4 login` only when authentication is needed. Record the current deployment ID for rollback.
Run `npx wrangler@4 pages download config sirinx-co` in a NEW private temporary directory OUTSIDE the repository.
That command can overwrite a Wrangler file. Treat the downloaded file as private until values are reviewed/redacted.
Compare it to `wrangler.pages.example.jsonc`; preserve existing preview/production bindings and compatibility settings.
Only then establish `apps/public-web/wrangler.jsonc` with the verified name and `pages_build_output_dir: "./dist/public"`.
Do not mix Workers `main`/`assets.directory` configuration into a Pages configuration or invent account/zone/binding IDs.

## Preview and release gates

Before uploading, inspect for existing Pages Functions or a Worker route that handles `/api/*`; preserve it.
The client calls `/api/trpc` with credentials. HTML returned there is NOT a successful API response.
Keep authentication, lead submission, chat and database behavior out of the static-only success claim.
Verify domain ownership, source commit, production branch, custom domains, DNS, Worker routes, CSP and API backend.
Ensure the recovery branch is NOT the project's production branch. Then, from a reviewed checkout:

```sh
npx wrangler@4 pages deploy dist/public --project-name sirinx-co --branch fix/cloudflare-recovery-20260919
```

Use the exact preview URL returned by Cloudflare, not an invented address. Check on mobile and desktop:
- `/`, `/projects/`, `/contact/`, `/solar-carport/`, `/home-solution/`, plus every route in the built sitemap.
- Every built JS/CSS asset has its expected MIME type, not `text/html`; all visible images decode successfully.
- Generated route titles/canonicals differ correctly from the home page; client-side navigation works.
- Known API reads return the expected JSON/status; test form writes only with explicit test data in a safe environment.
- No console exceptions, CSP violations, broken fonts, stale service-worker cache or missing lazy chunks.

Do not promote until these checks pass and the current rollback deployment is recorded.
Production promotion must use the verified existing project's release mechanism and the identical tested artifact.
No merge, production upload, cache purge, DNS change, database migration or paid feature activation is performed by these files.

## Optional image transformations

Only enable the flag after both original and transformed images return decodable image responses.
In Images > Transformations for `sirinx.co`, verify enablement and allow only the required source:
- Domain: `d2xsxph8kpxj0f.cloudfront.net`
- Path: `/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/`

Do not enable unrestricted origins. Rebuild when changing the Vite flag; it is not a runtime setting.
If the original is unavailable, restore approved owned originals before considering R2/Images migration.
The existing `/assets/*` one-year immutable policy also covers unversioned images; assess content-hashed filenames
or narrower cache policy separately. Cache clearing alone cannot restore missing originals.

## Cloudflare MCP

Merge the `servers` entries in `cloudflare-mcp.vscode.example.json` into VS Code `.vscode/mcp.json` only after review.
Other clients have different configuration schemas. Authenticate the API/builds/observability services via their supported OAuth flow.
The Docs endpoint is documentation access, not proof of account access. Example files do not connect MCP in ChatGPT.
First read the account, `sirinx.co` zone, existing Pages project/deployments/domains and relevant routes/logs.
Use bounded reads and redacted receipts. Do not expose internal GhostClaw/Hermes services to repair the public website.

## Primary references

- https://developers.cloudflare.com/pages/configuration/redirects/
- https://developers.cloudflare.com/pages/configuration/serving-pages/
- https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- https://developers.cloudflare.com/workers/wrangler/commands/pages/
- https://developers.cloudflare.com/images/optimization/transformations/sources/
- https://developers.cloudflare.com/agent-setup/
