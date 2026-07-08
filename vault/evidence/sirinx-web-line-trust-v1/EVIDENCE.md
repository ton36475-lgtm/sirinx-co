# SIRINX Web LINE Trust v1 Evidence

Status: `LOCAL_ONLY_PARTIAL_VALIDATION`

Generated: `2026-07-08 04:51 +0700`

## Branch

`feat/sirinx-web-line-trust-v1`

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

## Verification

- `npm run verify:public-web-language-switch`: PASS.
  - Coverage: homepage hero slideshow, shared layout chrome, `/404`, `/`, `/solar-carport`, `/projects`, `/blog`, `/blog/:slug`, `/home-solution`, `/about`, `/privacy`, `/terms`, `/cookies`, `/partner`, `/assessment`, visible copy and trust/legal/partner/blog/home/calculator CTA labels.
- `npm run verify:public-web-line-i18n`: PASS.
  - Coverage: footer LINE CTA, floating LINE dock, chat widget copy, aria labels, canonical LINE config.
- Focused `footerLineCta.test.ts` via root Vitest with temporary node-only config: PASS, 5 tests passed.
- Isolated TypeScript transpile for changed TS/TSX files: PASS, 32 scoped changed files.
- Node syntax checks for `verify-public-web-language-switch.mjs`, `verify-public-web-line-i18n.mjs`, and `verify-public-web-dependency-layout.mjs`: PASS.
- `git diff --check`: PASS.
- `npm run verify:public-web-deps`: FAIL as expected.
  - Present in `apps/public-web/node_modules`: `typescript`.
  - Missing: `vite`, `vitest`, `@types/node`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `@builder.io/vite-plugin-jsx-loc`, `vite-plugin-manus-runtime`, `vite-plugin-javascript-obfuscator`, `tsx`, `esbuild`, `react`, `react-dom`, `wouter`.

## Manual UAT Status

- Homepage: not rerun in browser during this patch.
- `/line`: not rerun in browser during this patch.
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
- Floating bot: source-level preservation checks passed for LINE/bot i18n path; manual bot behavior still needs real browser confirmation.
- LINE QR: source-level config guard passed; real-device QR scan still requires human review.
- Mobile: not rerun in browser during this patch.

## Security

- Secrets touched: no.
- Production data touched: no.
- External writes: no.
- Deploy: no.
- Push: no.
- LINE webhook: no.
- Production analytics activation: no.
- CRM/customer data storage: no.
- Package install: no.

## Risk

Medium.

Reason: static and isolated checks passed, but package-level check/test/build remain blocked by the current `apps/public-web` dependency layout. `InvestmentTaxHub.tsx`, `Strategy.tsx`, and `/assessment` dynamic warnings still need separate i18n refactors for full language-switch parity. BlogPost keeps Thai article body as canonical Thai fallback while EN/CN content renders from localized overlays.

## Rollback

- Revert the local diff or future commit containing this packet.
- Remove the newly added public-web i18n verifier scripts if they are not desired.
- Restore affected public page/components to their previous hardcoded-copy implementation.
- Remove the `/partner` and `/assessment` additions from `verify-public-web-language-switch.mjs`.

## Approval Gate

- Deploy approval still required.
- Push/merge approval still required.
- LINE webhook approval still required.
- Production analytics approval still required.
- CRM/customer data storage approval still required.
- Package install/dependency-layout repair approval still required before package-level build/check/test can be rerun.

## Next Safe Actions

1. Restore or validate `apps/public-web` dependency layout under an explicit dependency-repair/package-install gate.
2. Rerun package-level check/test/build.
3. Browser UAT TH/EN/CN language switching across homepage, `/blog`, `/home-solution`, `/about`, legal pages, `/partner`, and `/assessment`.
4. Human real-device scan of LINE QR.
5. Manual confirmation that the existing website bot still opens and behaves correctly.
6. Convert `/assessment` dynamic warnings/recommendations to localized codes in a separate safe refactor.
