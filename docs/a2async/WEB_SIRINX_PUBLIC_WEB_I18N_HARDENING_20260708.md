# WEB SIRINX PUBLIC WEB I18N HARDENING 2026-07-08

Status: `LOCAL_ONLY_PARTIAL_VALIDATION`

## Scope

Continuation of SIRINX website language-switch quality work after the active source tree was observed under `apps/public-web`.

This does not deploy, push, activate webhook, activate production analytics, store CRM/customer data, or send customer messages.

## Current Source Path

- Current branch: `feat/sirinx-web-line-trust-v1`
- Current website source path with files present: `apps/public-web`
- `apps/web-sirinx` source files were not present in the current snapshot; it contained dependency artifacts only.
- Hermes screenshot follow-up: searched the current repo for `supabasePublicEndpoint` and `supabasePublicRoutes`; no matches were found. The entry point currently present is `apps/public-web/server/_core/index.ts`, which registers JSON body parsing, OAuth, and tRPC, with no LINE webhook route or Supabase public-route symbol in this snapshot.

## Changes

- Moved footer LINE QR CTA text in `apps/public-web/client/src/components/Layout.tsx` from hardcoded Thai copy to `useLanguage().t(...)` keys.
- Moved initial floating LINE/bot dock aria/title copy in `apps/public-web/client/src/App.tsx` to translation keys.
- Moved loaded `FloatingChatWidget` visible chrome and accessibility labels to translation keys:
  - intro bubble
  - LINE CTA labels
  - bot trigger aria
  - online status
  - close button
  - welcome copy
  - quick reply labels/messages
  - assessment-data label
  - LINE transfer CTA
  - textarea aria/placeholder
  - send button aria
  - AI disclaimer
- Added Thai, English, and Chinese translations in `apps/public-web/client/src/contexts/LanguageContext.tsx`.
- Updated `apps/public-web/client/src/test/footerLineCta.test.ts` so it guards against reintroducing hardcoded Thai UI chrome in the footer/floating chat path.
- Added `scripts/verify-public-web-line-i18n.mjs` and the root `verify:public-web-line-i18n` script so the LINE/bot i18n guard can run without requiring the currently missing `apps/public-web` dependency layout.
- Converted `/about` visible page copy to `usePageTranslation("about")`, added `apps/public-web/client/src/i18n/pages/about.ts`, and added a LINE Official CTA to the About closing CTA group.
- Added `scripts/verify-public-web-language-switch.mjs` and root `verify:public-web-language-switch` to guard the `/about` language-switch path.
- Added `scripts/verify-public-web-dependency-layout.mjs` and root `verify:public-web-deps` to make missing app dependencies explicit without installing packages.
- Converted `/privacy`, `/terms`, and `/cookies` visible trust/legal copy to `usePageTranslation("legal")`, added `apps/public-web/client/src/i18n/pages/legal.ts`, and updated `LegalPage` shared labels for localized update/contact copy.
- Converted `/partner` visible hero, market, card, form, success, sidebar, disclaimer, and CTA copy to `usePageTranslation("partner")`, added `apps/public-web/client/src/i18n/pages/partner.ts`, and added a LINE Official CTA to the final partner CTA group.
- Hardened `/assessment` high-visibility calculator copy by moving selectable region/roof/orientation data, stepper labels, hero, form labels, BESS mode labels, result tabs, KPI cards, cost/technical/projection labels, CTAs, and navigation copy to `usePageTranslation("solarAssessment")`.
- Hardened homepage `HeroSlideshow` by removing Thai fallback copy from slide data and rendering badge/headline/highlight/description/CTA text directly from `heroSlideshow` translations.
- Hardened shared `Layout` chrome by moving the mobile assessment subtitle, footer certification labels, badge titles, and legal footer links to global translations.
- Hardened `/404` by moving NotFound title, description, and home CTA to global translations.
- Hardened `/solar-carport` remaining copy by moving province-specific hero subtitle, local planning panel, assessment checklist, ROI value, and gallery aria labels to the `solarCarport` dictionary.
- Hardened `/projects` gallery/lightbox aria labels through the `projects` dictionary.
- Hardened homepage project-proof metric text through the `home` dictionary.
- Hardened `/blog` index UI chrome by moving hero, search, category labels, featured/all headings, empty state, calculator CTA, metric cards, newsletter copy, and toast messages to a dedicated `blog` dictionary.
- Hardened `/blog` and `/blog/:slug` content switching by adding localized blog metadata for English and Chinese (`title`, `excerpt`, `date`, `readTime`, `author`, `tags`) and localized article body overlays for BlogPost detail pages.
- Added `apps/public-web/client/src/i18n/pages/blogPost.ts` so BlogPost not-found, share, sidebar, article CTA, related posts, and final CTA chrome use page translations.
- Hardened `/home-solution` visible copy, image alt text, metadata, Open Graph text, FAQ JSON-LD content, proof/process sections, final CTA, and stat cards through a dedicated `homeSolution` dictionary.
- Expanded `verify:public-web-language-switch` to cover homepage hero slideshow, shared layout chrome, `/404`, `/`, `/solar-carport`, `/projects`, `/blog`, `/blog/:slug`, `/home-solution`, `/about`, `/privacy`, `/terms`, `/cookies`, `/partner`, `/assessment`, shared legal CTA labels, partner CTA labels, blog metadata/content guards, home-solution guards, and calculator CTA labels.

## Verification

Passed:

- `npm run verify:public-web-line-i18n`: PASS.
- `npm run verify:public-web-language-switch`: PASS. Current coverage: homepage hero slideshow, shared layout chrome, `/404`, `/`, `/solar-carport`, `/projects`, `/blog`, `/blog/:slug`, `/home-solution`, `/about`, `/privacy`, `/terms`, `/cookies`, `/partner`, `/assessment`, visible copy, trust/legal/partner/blog/home/calculator CTA labels.
- Focused `footerLineCta.test.ts` via root Vitest with a temporary node-only config: PASS, 5 tests passed.
- Static LINE/chat i18n source guard: PASS.
- TypeScript isolated transpile for changed TSX/TS files: PASS, 32 scoped changed TS/TSX files, including shared chrome, Home, Projects, SolarCarport, HomeSolution, Blog, BlogPost, blog data/content overlays, About, legal/trust pages, Partner, and SolarAssessment.
- Node syntax checks for the three public-web verifier scripts: PASS.
- `git diff --check`: PASS.
- Scoped whitespace check for changed public-web files: PASS.

Blocked:

- `pnpm --config.verify-deps-before-run=false --dir apps/public-web exec vitest run client/src/test/footerLineCta.test.ts`
  - BLOCKED: Vite config could not load `@builder.io/vite-plugin-jsx-loc`.
- `npm run web:check`
  - BLOCKED: missing type definition files for `node` and `vite/client`.
- `npm run web:build`
  - BLOCKED: `vite` command was not found in the current dependency layout.
- `npm run verify:public-web-deps`
  - BLOCKED as expected: `apps/public-web/node_modules` currently contains `typescript` only and is missing app packages required for package-level validation.

## Dependency Layout Finding

`pnpm -r list --depth -1 --json` sees the root workspace and `apps/public-web`, but `apps/public-web/node_modules` currently contains only `typescript`. The current local pnpm store/repo search did not find `@builder.io/vite-plugin-jsx-loc`, so package-level Vitest/check/build cannot be restored without a dependency restoration/install gate or a separate approved dependency-layout repair.

Current missing app packages reported by `npm run verify:public-web-deps`:

- `vite`
- `vitest`
- `@types/node`
- `@vitejs/plugin-react`
- `@tailwindcss/vite`
- `@builder.io/vite-plugin-jsx-loc`
- `vite-plugin-manus-runtime`
- `vite-plugin-javascript-obfuscator`
- `tsx`
- `esbuild`
- `react`
- `react-dom`
- `wouter`

## Risk

Medium.

Reason: the patch is scoped to language/CTA chrome and isolated syntax checks passed, but package-level Vitest/typecheck/build are blocked by the current dependency layout. Do not claim release-ready until package validation is restored and rerun.

Known residual: `InvestmentTaxHub.tsx` and `Strategy.tsx` still have public-page hardcoded copy outside this focused patch. `/assessment` also still has Thai warning/recommendation strings generated directly inside the calculation engine. BlogPost still keeps Thai article body as the canonical Thai fallback in the component, while English and Chinese render through localized article overlays.

## Safety

- Push: no.
- Deploy: no.
- Webhook: no.
- Production analytics: no.
- CRM/customer data storage: no.
- Customer messages: no.
- Secret read: no.
- Package install: no approval granted.

## Next Safe Action

1. Restore or validate the intended `apps/public-web` dependency layout without broad/unapproved install.
2. Rerun `footerLineCta.test.ts`, package `check`, package `test`, and package `build`.
3. Browser UAT the language switch for footer LINE CTA and floating assistant in Thai, English, and Chinese.
4. Keep push/deploy/webhook/analytics/CRM gates closed until fresh evidence and explicit approval.
