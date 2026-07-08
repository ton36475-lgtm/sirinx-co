# SIRINX Web LINE Trust v1 Evidence

Status: `LOCAL_VALIDATED_INTERNAL_GOAL_READY_BRANCH_PUSHED_REVIEW_PENDING`

Generated: `2026-07-08 04:51 +0700`
Updated: `2026-07-08 18:10 +0700`

## Branch

`feat/sirinx-web-line-trust-v1`

## Current Local Commits

- `c75c9ef7` - `feat(public-web): add LINE trust and verification gates`
- `4103d3ef` - `docs(public-web): add competitor SWOT and AEO backlog`
- `8b4cea48` - `docs(public-web): record blocked push gate`
- `27ce23b2` - `docs(public-web): update goal dependency gate evidence`
- `c77e901b` - `docs(governance): add all-project integration ledger`
- `1a419ada` - `docs(governance): add all-project spec pack foundation`
- `f5e5cb68` - `docs(governance): add all-project source discovery`
- `1030dfd7` - `docs(governance): add all-project execution backlog`
- `d061e330` - `docs(governance): add all-project spec skeleton matrix`
- `5761005` - `feat(public-web): add internal goal dependency layout`
- `e4cd7983` - `docs(public-web): update goal readiness evidence`
- `a08c4cb0` - `docs(public-web): record push retry blocker`
- `dc5b1e62` - `docs(public-web): record goal local smoke`

## Scope

- Current active website source in this snapshot: `apps/public-web`.
- `apps/web-sirinx` source files were not present in the current snapshot; it contained dependency artifacts only.
- This packet records local i18n hardening for the existing website LINE/contact layer and public trust/conversion pages.

## Changed Areas

- Footer LINE CTA, floating LINE dock, and existing assistant/chat chrome now use language-aware copy.
- `/about` visible copy now uses page translations and includes a LINE Official CTA.
- `/privacy`, `/terms`, and `/cookies` visible legal/trust copy now uses page translations.
- `/partner` visible hero, market, form, success, sidebar, disclaimer, and CTA copy now uses page translations, with LINE Official CTA in the final CTA group.
- `/assessment` high-visibility calculator copy now uses page translations for selectable data, stepper, hero, form labels, BESS mode labels, result tabs, KPI cards, cost/technical/projection labels, CTAs, and navigation.
- Homepage `HeroSlideshow` no longer stores Thai fallback copy in slide data; visible slide text and CTA labels render from `heroSlideshow` translations.
- Shared layout chrome now uses translations for the mobile assessment subtitle, certification/footer titles, and legal footer links.
- `/404` NotFound copy now uses global translations.
- `/solar-carport` remaining hardcoded copy was moved into the `solarCarport` dictionary, including province-specific local planning copy, ROI value text, and gallery aria labels.
- `/projects` gallery/lightbox aria labels now use the `projects` dictionary.
- Homepage project-proof metric copy now uses the `home` dictionary.
- `/blog` index UI chrome now uses a dedicated page dictionary for hero, search, category labels, featured/all headings, empty state, calculator CTA, metric cards, newsletter copy, and toast messages.
- `/blog` listing metadata now switches by language through localized blog data for English and Chinese.
- `/blog/:slug` article pages now switch not-found/share/CTA/sidebar/related/final CTA chrome through `blogPost` translations and switch English/Chinese article body through localized article content overlays.
- `/home-solution` visible copy, image alt text, metadata, Open Graph text, FAQ JSON-LD content, proof/process sections, final CTA, and stat cards now use the `homeSolution` dictionary.
- Added local verification scripts for LINE i18n, language-switch coverage, and dependency-layout preflight.
- Added an internal-only `/goal` readiness surface behind the existing `internalRoutesEnabled` gate for localhost, `dev.sirinx.co`, and LAN hosts.
- Added a regression test that verifies `/goal` remains static, local, gate-focused, and free of API calls, mutations, beacon calls, or browser storage.

## Verification

- `npm run verify:public-web-language-switch`: PASS.
  - Coverage: homepage hero slideshow, shared layout chrome, `/404`, `/`, `/solar-carport`, `/projects`, `/blog`, `/blog/:slug`, `/home-solution`, `/about`, `/privacy`, `/terms`, `/cookies`, `/partner`, `/assessment`, visible copy and trust/legal/partner/blog/home/calculator CTA labels.
- `npm run verify:public-web-line-i18n`: PASS.
  - Coverage: footer LINE CTA, floating LINE dock, chat widget copy, aria labels, canonical LINE config.
- Focused `footerLineCta.test.ts` via root Vitest with temporary node-only config: PASS, 5 tests passed.
- Isolated TypeScript transpile for changed TS/TSX files: PASS, 32 scoped changed files.
- Node syntax checks for `verify-public-web-language-switch.mjs`, `verify-public-web-line-i18n.mjs`, and `verify-public-web-dependency-layout.mjs`: PASS.
- `git diff --check`: PASS.
- `npm run check`: PASS after root verifier symlink/env-quarantine repair.
- `apps/public-web`: `corepack pnpm run test`: PASS, 7 test files / 44 tests.
- `apps/public-web`: `corepack pnpm run check`: PASS.
- `apps/public-web`: `corepack pnpm run build`: PASS; Vite build, static SEO generation, and server bundle passed.
- `npm run verify:p092-agentloop`: PASS.
- `npm run verify:public-web-deps`: PASS after dependency/layout repair.
- `git diff --check`: PASS.
- `apps/public-web`: `corepack pnpm run test`: PASS, 8 test files / 46 tests after `/goal` readiness guard.
- `apps/public-web`: `corepack pnpm run check`: PASS after `/goal` route.
- `apps/public-web`: `corepack pnpm run build`: PASS after `/goal` route; Vite build, static SEO generation, and server bundle passed.
- `npm run verify:public-web-deps`: PASS after `/goal` route.
- `npm run verify:public-web-line-i18n`: PASS after `/goal` route.
- `npm run verify:public-web-language-switch`: PASS after `/goal` route.
- `npm run check`: PASS after `/goal` route.
- `git diff --check`: PASS after `/goal` route.
- `/goal` local HTTP smoke: PASS for `http://127.0.0.1:3107/goal` with HTTP `200`; receipt `docs/receipts/PUBLIC_WEB_GOAL_LOCAL_SMOKE_20260708_1556.md`.
- `/goal` rendered browser smoke: BLOCKED because local Chrome headless timed out and Playwright was not available without installing packages.

## Push Gate Status

- Approved command attempted: `git push origin feat/sirinx-web-line-trust-v1`.
- Initial result: BLOCKED before remote update by local GitHub HTTPS credential state.
- Initial error evidence:

```text
fatal: could not read Username for 'https://github.com': Device not configured
```

- Blocked receipt: `docs/receipts/PUBLIC_WEB_PUSH_GATE_BLOCKED_20260708.md`.
- Final result after GitHub CLI browser authentication: PASS.
- Successful push receipt: `docs/receipts/PUBLIC_WEB_PUSH_GATE_SUCCEEDED_20260708_1604.md`.
- Remote update:

```text
310134e5..dc5b1e62  feat/sirinx-web-line-trust-v1 -> feat/sirinx-web-line-trust-v1
```

- Verified state: local `HEAD` and `origin/feat/sirinx-web-line-trust-v1` both pointed at `dc5b1e6276d6c3ccb5402f2f150aa5c8c040d41b`.

## Manual UAT Status

- Homepage: not rerun in browser during this patch.
- `/line`: preview browser UAT confirmed the dedicated LINE landing page renders
  at `https://aae25828.sirinx-co.pages.dev/line`.
- `/about`: static language-switch guard passed.
- `/privacy`, `/terms`, `/cookies`: static language-switch guard passed.
- `/partner`: static language-switch guard passed.
- `/assessment`: static language-switch guard passed for visible calculator chrome.
- Homepage hero slideshow: static language-switch guard passed.
- Shared layout chrome and `/404`: static language-switch guard passed.
- `/solar-carport`, `/projects`, and homepage project-proof residue: static language-switch guard passed.
- `/blog`: static language-switch guard passed for Blog index UI chrome, search/category labels, calculator CTA, newsletter copy, and localized metadata.
- `/blog/:slug`: static language-switch guard passed for BlogPost UI chrome, localized metadata usage, and English/Chinese article body overlays.
- `/home-solution`: static language-switch guard passed for visible copy, image alt text, metadata, FAQ JSON-LD content, proof/process sections, stat cards, and final CTA.
- `/goal`: static route/test/build validation passed and local HTTP smoke returned HTTP `200`. Rendered browser UAT remains blocked by local browser automation tooling. The route is internal-only by host gate.
- Floating bot: source-level preservation checks passed for LINE/bot i18n path;
  the trigger is visible beside the LINE CTA on preview. Manual bot click
  behavior still needs real browser confirmation.
- LINE QR: preview render and QR endpoint checks passed; real-device QR scan
  still requires human review.
- Mobile: not rerun in browser during this patch.

## Security

- Secrets touched: no.
- Production data touched: no.
- External writes: GitHub branch push and Cloudflare Pages preview deploy only,
  both using approved gates.
- Deploy: Cloudflare Pages preview deploy completed; production/custom-domain
  deploy not performed.
- Push: exact approved push command succeeded after GitHub CLI browser authentication.
- PR creation/merge: no.
- LINE webhook: no.
- Production analytics activation: no.
- CRM/customer data storage: no.
- Package install: Wrangler `4.108.0` added only as an `apps/public-web` dev
  dependency after explicit approval.

## Risk

Medium.

Reason: local package-level check/test/build and `/goal` HTTP smoke passed after dependency/layout repair and the internal `/goal` route, the feature branch was pushed, and the latest Cloudflare Pages preview deploy passed route smoke and browser UAT. `InvestmentTaxHub.tsx`, `Strategy.tsx`, and `/assessment` dynamic warnings still need separate i18n refactors for full language-switch parity. BlogPost keeps Thai article body as canonical Thai fallback while EN/CN content renders from localized overlays. Real-device QR scan, PR/merge, any next push, and production/custom-domain deploy remain human-review gates.

## Rollback

- Revert local commit `5761005` to remove the internal `/goal` readiness surface.
- Revert local commits `8b4cea48`, `4103d3ef`, and `c75c9ef7` if the LINE/i18n packet must be rolled back before push.
- Remove the newly added public-web i18n verifier scripts if they are not desired.
- Restore affected public page/components to their previous hardcoded-copy implementation.
- Remove the `/partner` and `/assessment` additions from `verify-public-web-language-switch.mjs`.

## Approval Gate

- Production/custom-domain deploy approval still required. The approved
  Cloudflare Pages preview deploy was completed.
- Latest preview deploy gate was blocked because `Allowed command` was the
  placeholder `<exact deploy command>`; see
  `docs/receipts/PUBLIC_WEB_DEPLOY_GATE_BLOCKED_PLACEHOLDER_20260708_1634.md`.
- Preview deploy command runbook added at
  `docs/runbooks/PUBLIC_WEB_PREVIEW_DEPLOY_GATE_RUNBOOK_20260708.md`; it records
  candidate command shapes only and does not authorize deployment.
- Local preview deploy preflight passed for `apps/public-web` check/test/build;
  see `docs/receipts/PUBLIC_WEB_PREVIEW_DEPLOY_PREFLIGHT_20260708_1700.md`.
- Read-only public hosting discovery found Cloudflare/Pages signals and a
  likely `sirinx-co` Pages target, but deploy is still blocked until Wrangler
  install/auth/project confirmation and an exact executable command; see
  `docs/receipts/PUBLIC_WEB_HOSTING_DISCOVERY_20260708_1703.md`.
- Exact preview deploy command was attempted after approval; local build passed
  but deploy did not run because `wrangler` is not installed on `PATH`; see
  `docs/receipts/PUBLIC_WEB_PREVIEW_DEPLOY_ATTEMPT_BLOCKED_WRANGLER_20260708_1706.md`.
- Follow-up Wrangler availability check found no local Wrangler binary or
  dependency; see
  `docs/receipts/PUBLIC_WEB_WRANGLER_AVAILABILITY_CHECK_20260708_1708.md`.
- Continuation deploy-gate audit reran the safe `apps/public-web` build
  preflight successfully, confirmed the current gate text still contains a
  placeholder instead of a complete executable deploy command, and reconfirmed
  Wrangler is unavailable locally; see
  `docs/receipts/PUBLIC_WEB_PREVIEW_DEPLOY_CONTINUATION_AUDIT_20260708_1712.md`.
- A complete preview deploy command was then approved and run exactly:
  `pnpm --dir apps/public-web build && wrangler pages deploy apps/public-web/dist/public --project-name sirinx-co --branch feat/sirinx-web-line-trust-v1`.
  The build step passed, but the Cloudflare Pages deploy step did not start
  because `wrangler` is not installed or available on `PATH`; see
  `docs/receipts/PUBLIC_WEB_PREVIEW_DEPLOY_APPROVED_ATTEMPT_WRANGLER_MISSING_20260708_1719.md`.
- Wrangler install/auth was then explicitly approved. Wrangler `4.108.0` was
  added as an `apps/public-web` dev dependency, the existing Cloudflare OAuth
  session was verified, and the preview deploy completed successfully to
  Cloudflare Pages. Preview URLs:
  `https://80952e8f.sirinx-co.pages.dev` and
  `https://feat-sirinx-web-line-trust-v.sirinx-co.pages.dev`; see
  `docs/receipts/PUBLIC_WEB_PREVIEW_DEPLOY_SUCCEEDED_20260708_1730.md`.
- PR/merge approval still required.
- Any next push after these new local changes requires a new exact push gate.
- LINE webhook approval still required.
- Production analytics approval still required.
- CRM/customer data storage approval still required.
- Follow-up `/line` route and desktop language-switch fix were validated after
  deploy. Fresh checks passed:
  `pnpm --config.verify-deps-before-run=false --dir apps/public-web test`
  (8 files / 48 tests), `pnpm --config.verify-deps-before-run=false --dir
  apps/public-web check`, `pnpm --config.verify-deps-before-run=false --dir
  apps/public-web build`, `git diff --check`, and preview smoke for 102 routes.
  Current preview URL: `https://aae25828.sirinx-co.pages.dev`; branch alias:
  `https://feat-sirinx-web-line-trust-v.sirinx-co.pages.dev`. See
  `docs/receipts/PUBLIC_WEB_PREVIEW_LINE_LANGUAGE_UAT_20260708_1747.md`.
- Latest preview deploy after CSP and language-menu hardening completed at
  `https://d46819ee.sirinx-co.pages.dev`; branch alias remains
  `https://feat-sirinx-web-line-trust-v.sirinx-co.pages.dev`. Fresh checks
  passed: `apps/public-web` test (8 files / 49 tests), check, build, preview
  route smoke (113 routes / 0 failures), and browser UAT (74 / 74 checks,
  0 console errors, 0 page errors). Desktop and mobile bot open behavior passed
  on the preview. See
  `docs/receipts/PUBLIC_WEB_PREVIEW_D46819EE_FULL_UAT_20260708_1810.md`.

## Next Safe Actions

1. Human/GitHub review of `origin/feat/sirinx-web-line-trust-v1`.
2. Human visual review of the latest preview:
   `https://d46819ee.sirinx-co.pages.dev`.
3. Human real-device scan of LINE QR.
4. Convert `/assessment` dynamic warnings/recommendations to localized codes in a separate safe refactor.
5. Provide exact gates for any next push, PR/merge, or production/custom-domain promotion.
