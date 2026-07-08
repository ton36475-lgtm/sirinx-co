# SIRINX Web LINE Trust v1 Evidence

Status: `LOCAL_VALIDATED_PUSH_BLOCKED_BY_GITHUB_CREDENTIAL`

Generated: `2026-07-08 04:51 +0700`
Updated: `2026-07-08 12:08 +0700`

## Branch

`feat/sirinx-web-line-trust-v1`

## Current Local Commits

- `c75c9ef7` - `feat(public-web): add LINE trust and verification gates`
- `4103d3ef` - `docs(public-web): add competitor SWOT and AEO backlog`
- `8b4cea48` - `docs(public-web): record blocked push gate`

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
- `npm run check`: PASS after root verifier symlink/env-quarantine repair.
- `apps/public-web`: `corepack pnpm run test`: PASS, 7 test files / 44 tests.
- `apps/public-web`: `corepack pnpm run check`: PASS.
- `apps/public-web`: `corepack pnpm run build`: PASS; Vite build, static SEO generation, and server bundle passed.
- `npm run verify:p092-agentloop`: PASS.
- `npm run verify:public-web-deps`: PASS after dependency/layout repair.
- `git diff --check`: PASS.

## Push Gate Status

- Approved command attempted: `git push origin feat/sirinx-web-line-trust-v1`.
- Result: BLOCKED before remote update by local GitHub HTTPS credential state.
- Error evidence:

```text
fatal: could not read Username for 'https://github.com': Device not configured
```

- Receipt: `docs/receipts/PUBLIC_WEB_PUSH_GATE_BLOCKED_20260708.md`.

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
- Push: exact approved push command attempted; no remote update occurred because GitHub credential was unavailable.
- LINE webhook: no.
- Production analytics activation: no.
- CRM/customer data storage: no.
- Package install: no.

## Risk

Medium.

Reason: local package-level check/test/build now pass after dependency/layout repair, but remote push is blocked by the host GitHub credential state. `InvestmentTaxHub.tsx`, `Strategy.tsx`, and `/assessment` dynamic warnings still need separate i18n refactors for full language-switch parity. BlogPost keeps Thai article body as canonical Thai fallback while EN/CN content renders from localized overlays. Manual browser UAT, real-device QR scan, and existing bot behavior confirmation remain human-review gates.

## Rollback

- Revert local commits `8b4cea48`, `4103d3ef`, and `c75c9ef7` if this packet must be rolled back before push.
- Remove the newly added public-web i18n verifier scripts if they are not desired.
- Restore affected public page/components to their previous hardcoded-copy implementation.
- Remove the `/partner` and `/assessment` additions from `verify-public-web-language-switch.mjs`.

## Approval Gate

- Deploy approval still required.
- Push/merge approval still requires a working GitHub credential or a new exact remote/auth gate before retry.
- LINE webhook approval still required.
- Production analytics approval still required.
- CRM/customer data storage approval still required.
- Package install/dependency-layout repair approval still required before package-level build/check/test can be rerun.

## Next Safe Actions

1. Repair local GitHub credentials or provide a new exact remote/auth gate, then rerun `git push origin feat/sirinx-web-line-trust-v1`.
2. Browser UAT TH/EN/CN language switching across homepage, `/blog`, `/home-solution`, `/about`, legal pages, `/partner`, and `/assessment`.
3. Human real-device scan of LINE QR.
4. Manual confirmation that the existing website bot still opens and behaves correctly.
5. Convert `/assessment` dynamic warnings/recommendations to localized codes in a separate safe refactor.
6. Provide a real deploy command and target only after push/review evidence is settled.
