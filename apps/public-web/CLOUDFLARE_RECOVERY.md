# SIRINX Cloudflare recovery — 2026-09-19

Status: isolated source repairs and CI validation. Production is not redeployed.
Repository: `ton36475-lgtm/sirinx-co`; base `76ae569416c136eb9097e78fcf8277746e9d6cb2`.
Recovery branch: `fix/cloudflare-recovery-20260919`; draft PR #10.
App: `apps/public-web`. Static output: `dist/public` relative to the app, not the repository root or all of `dist`.
The live production repository/commit, Cloudflare account settings and backend routing still require authenticated reconciliation.

## Repairs and verification

- Make Cloudflare image transformations opt-in through `VITE_CF_IMAGE_TRANSFORMS=true`.
  Absent/false keeps original URLs and omits transformed srcset. This does not restore unavailable originals.
  Validate the exact CloudFront origin/path and finite normalized widths/quality. Preserve existing helper callers.
- Remove the blanket `/* /index.html 200` rewrite so static assets and generated SEO HTML retain their native routing.
  Native Pages SPA fallback requires no top-level `404.html`; the preflight checks this condition.
- Add 11 dependency-free recovery checks and a real-build asset preflight.
- Restore three whitespace bytes in `patches/wouter@3.7.1.patch`. Its 918-byte result matches the EXISTING lockfile hash:
  `4e16e6ff3fde7d6c1024d3e0c8605dc9eb6afb690d0d49958c2f449091813072`.
  Do not trim blank context lines in patch files. No dependency versions or lockfile contents changed.
- Install this nested app with `--ignore-workspace`: the parent workspace has no pnpm lockfile and must not absorb this install.
- Exclude development/editor instrumentation from Vitest, retaining the original test assertions.
- Reconcile the root governance allowlist with the already-existing `secret-scan.yml`; all other workflow names remain blocked.
- Add website checks to the existing CI workflow, with read-only contents permission and no deployment steps/cloud credentials.
  It runs recovery tests, frozen install, app typecheck, the configured client test suite, static build and preflight.
  Independent checks continue after a typecheck/test failure for diagnostics, but any failure leaves the job failed.

Local native recovery tests passed (11/11). Governance allowlist fixtures passed (5/5), including blocked deploy.yml and .env.
The image helper passed an isolated strict TypeScript check with the app's default ES5 target.
GitHub Actions run 35435249093 verified the restored frozen install and static output: 94 generated SEO routes and 221 files,
while exposing the helper Set-iteration type error and editor-instrumented markup test failure corrected in this revision.
Use PR #10's checks for the latest revision's results; the preceding run is not proof of this revision passing all checks.
Synthetic preflight fixtures do not decode images. CI client tests are not browser QA, production API tests or a security audit.

## Correct install and static build

Run from a reviewed checkout of `apps/public-web`, using Node 22 and its existing pinned pnpm packageManager.
The successful static-build runner used Node 22.23.2 and pnpm 10.4.1. Do not silently switch package-manager major versions.

```sh
corepack pnpm install --ignore-workspace --frozen-lockfile --prod=false
node --experimental-strip-types --test scripts/cloudflare-recovery.check.mjs
corepack pnpm run check
corepack pnpm run test
corepack pnpm exec vite build
corepack pnpm exec tsx server/staticSeoBuild.ts
node scripts/pages-preflight.mjs
```

Stop on every nonzero exit. Set `NODE_ENV=production` and `VITE_CF_IMAGE_TRANSFORMS=false` for the build, not unit tests.
In PowerShell, check `$LASTEXITCODE` after native commands; `$ErrorActionPreference` alone does not catch their failures.
The existing `pnpm run build` also bundles an Express/Node server as `dist/index.js`; a static upload does not run that server.
Never upload all of `dist`, the repository, development logs, environment files or backend code as public assets.

For the existing Pages project's PREVIEW build, after confirming source identity, use:
- Root directory: `apps/public-web`
- Output directory: `dist/public`
- `SKIP_DEPENDENCY_INSTALL=true` to avoid the automatic parent-workspace install
- `NODE_VERSION=22.23.2` (the observed working runner version; verify availability)
- `PNPM_VERSION=10.4.1`, `VITE_CF_IMAGE_TRANSFORMS=false`, `NODE_ENV=production`
- Build command:

```sh
corepack pnpm install --ignore-workspace --frozen-lockfile --prod=false && corepack pnpm exec vite build && corepack pnpm exec tsx server/staticSeoBuild.ts && node scripts/pages-preflight.mjs
```

Cloudflare documents Pages v1 build-image retirement on 2026-09-15. Check whether the existing project was migrated;
this is a diagnostic lead, NOT a verified cause of this site's incident. Pin tested tool versions rather than relying on defaults.

## Reconcile Wrangler, do not overwrite settings blindly

Authenticate on the authorized machine. Do not paste tokens into chat or source files.
The historical project name is `sirinx-co`; verify domains and production branch before using it.
Use Wrangler v4 for discovery, then pin the reviewed exact version for repeatable deployment tooling:

```sh
npx wrangler@4 --version
npx wrangler@4 whoami
npx wrangler@4 pages project list
npx wrangler@4 pages deployment list --project-name sirinx-co --environment production --json
```

Use `npx wrangler@4 login` only when authentication is needed. Record the current production deployment ID for rollback.
Run `npx wrangler@4 pages download config sirinx-co` in a NEW private temporary directory OUTSIDE the repository.
This can overwrite an existing Wrangler file. Treat its contents as private until reviewed/redacted.
Reconcile the downloaded name, compatibility date and preview/production bindings with `wrangler.pages.example.jsonc`.
Only then establish `apps/public-web/wrangler.jsonc`, including `pages_build_output_dir: "./dist/public"`.
The example's date is a candidate, not a verified production setting. Do not mix Workers `main`/`assets.directory` into Pages config.

## Cloudflare MCP

`cloudflare-mcp.vscode.example.json` uses VS Code's `servers` schema. Merge reviewed entries into `.vscode/mcp.json`,
start the server and complete its supported OAuth flow. Other clients use different configuration schemas.
The API Code Mode endpoint supports account/project inspection. The Docs endpoint is documentation, not account access.
The Builds endpoint is specifically Workers Builds; do not assume it supplies Pages build logs.
Example files do not activate an MCP connector inside this ChatGPT conversation.

First inspect the authorized account, `sirinx.co` zone, existing Pages project, canonical deployment, Git source,
production branch, custom domains, DNS, relevant Worker routes/Functions, bindings, logs and image transformation settings.
Read secret names/metadata only when needed; do not print values. Keep GhostClaw/Hermes internal services private.

## Preview and release gates

The client calls `/api/trpc` with credentials. Preserve and verify its existing backend route separately.
HTML returned there is not API success. A static-only preview cannot prove login, lead submission, chat or database behavior.
Ensure the recovery branch is not the project's production branch. Once all preceding checks pass, from the app directory:

```sh
npx wrangler@4 pages deploy dist/public --project-name sirinx-co --branch fix/cloudflare-recovery-20260919
```

Use the exact preview URL returned by Cloudflare. Validate desktop and mobile:
- `/`, `/projects/`, `/contact/`, `/solar-carport/`, `/home-solution/`, and all routes in the built sitemap.
- Expected JS/CSS MIME types, decoded visible images, lazy chunks, fonts, no console/CSP errors.
- Correct route-specific titles/canonicals and working client navigation.
- Read-only API probes return expected JSON/status; use explicit safe test data for form writes in a test environment.
- Compare preview and production asset hashes, response headers and cache behavior.

Promote only after all release gates pass and the rollback deployment is recorded. Use the existing project's verified release
mechanism and the identical tested artifact. These files do not merge, deploy, purge cache, change DNS, migrate databases or enable paid features.

## Image and cache follow-up

Before enabling transformations, verify BOTH original and transformed image responses decode successfully.
Allow only `d2xsxph8kpxj0f.cloudfront.net` and `/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/` as required sources.
Do not enable unrestricted origins. Changing a Vite flag requires a rebuild.
If originals are unavailable, restore approved owned images before any optional R2/Images migration.
The existing year-long immutable `/assets/*` cache policy also covers unversioned images; review narrower caching or hashed filenames.
Cache clearing cannot restore missing originals. The root npm install also reported dependency advisories; triage separately without force upgrades.

## Primary references

- https://developers.cloudflare.com/pages/configuration/redirects/
- https://developers.cloudflare.com/pages/configuration/serving-pages/
- https://developers.cloudflare.com/pages/configuration/build-image/
- https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- https://developers.cloudflare.com/workers/wrangler/commands/pages/
- https://developers.cloudflare.com/images/optimization/transformations/sources/
- https://developers.cloudflare.com/agent-setup/visual-studio-code/
- https://v2.vitest.dev/config/file
