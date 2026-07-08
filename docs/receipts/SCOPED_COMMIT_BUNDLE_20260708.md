# Scoped Commit Bundle

Date: 2026-07-08

Status: local commit-readiness map only. No files were staged, committed, pushed, deployed, or sent externally by this receipt.

## Current Branch

```text
feat/sirinx-web-line-trust-v1
```

## Verification Basis

Latest local gates run after the root verification repair:

- `npm run check`: PASS
- `corepack pnpm run test` in `apps/public-web`: PASS
  - 7 test files
  - 44 tests
- `corepack pnpm run check` in `apps/public-web`: PASS
- `corepack pnpm run build` in `apps/public-web`: PASS
- `npm run verify:p092-agentloop`: PASS
- `npm run verify:public-web-line-i18n`: PASS
- `npm run verify:public-web-language-switch`: PASS
- `npm run verify:public-web-deps`: PASS
- `git diff --check`: PASS

## Bundle A: Public Website LINE + Language Trust Layer

Suggested local commit message:

```text
feat(public-web): harden LINE contact and multilingual trust flows
```

Scope:

- Preserve existing website bot.
- Keep LINE OA visible and verifiable.
- Keep public routes multilingual where already hardened.
- Keep website UI/page structure unchanged in this bundle; this is source hardening, not deploy.

Exact path candidates:

```text
apps/public-web/client/src/App.tsx
apps/public-web/client/src/components/FloatingChatWidget.tsx
apps/public-web/client/src/components/HeroSlideshow.tsx
apps/public-web/client/src/components/Layout.tsx
apps/public-web/client/src/components/LegalPage.tsx
apps/public-web/client/src/contexts/LanguageContext.tsx
apps/public-web/client/src/i18n/pages/about.ts
apps/public-web/client/src/i18n/pages/blog.ts
apps/public-web/client/src/i18n/pages/blogPost.ts
apps/public-web/client/src/i18n/pages/home.ts
apps/public-web/client/src/i18n/pages/homeSolution.ts
apps/public-web/client/src/i18n/pages/legal.ts
apps/public-web/client/src/i18n/pages/partner.ts
apps/public-web/client/src/i18n/pages/projects.ts
apps/public-web/client/src/i18n/pages/solarAssessment.ts
apps/public-web/client/src/i18n/pages/solarCarport.ts
apps/public-web/client/src/lib/blogArticleContent.ts
apps/public-web/client/src/lib/blogData.ts
apps/public-web/client/src/pages/About.tsx
apps/public-web/client/src/pages/Blog.tsx
apps/public-web/client/src/pages/BlogPost.tsx
apps/public-web/client/src/pages/Cookies.tsx
apps/public-web/client/src/pages/Home.tsx
apps/public-web/client/src/pages/HomeSolution.tsx
apps/public-web/client/src/pages/NotFound.tsx
apps/public-web/client/src/pages/Partner.tsx
apps/public-web/client/src/pages/Privacy.tsx
apps/public-web/client/src/pages/Projects.tsx
apps/public-web/client/src/pages/SolarAssessment.tsx
apps/public-web/client/src/pages/SolarCarport.tsx
apps/public-web/client/src/pages/Terms.tsx
apps/public-web/client/src/test/footerLineCta.test.ts
apps/public-web/shared/lineOfficial.ts
scripts/verify-public-web-language-switch.mjs
scripts/verify-public-web-line-i18n.mjs
docs/a2async/WEB_SIRINX_PUBLIC_WEB_I18N_HARDENING_20260708.md
vault/evidence/sirinx-web-line-trust-v1/EVIDENCE.md
```

## Bundle B: P092 LINE OA Dry-Run Webhook Gate

Suggested local commit message:

```text
feat(public-web): add LINE OA dry-run webhook gate
```

Scope:

- Add LINE webhook route in dry-run mode only.
- Register raw-body route before `express.json()`.
- Add local signature helper and tests.
- Mirror P092 command-center packet and specs.

Exact path candidates:

```text
apps/public-web/server/_core/index.ts
apps/public-web/server/_core/lineWebhook.ts
apps/public-web/server/_core/lineWebhookCore.ts
apps/public-web/server/_core/lineWebhook.test.ts
package.json
scripts/verify-p092-agentloop-gates.mjs
docs/command-center/P092_TELEGRAM_COMMAND_CENTER_APPROVAL_20260708.md
docs/packets/packet_092_full_automation_agentloop_a2a2a_sync.json
docs/specs/p092-agentloop-a2a2a-sync/BRD.md
docs/specs/p092-agentloop-a2a2a-sync/DATA_CONTRACT.md
docs/specs/p092-agentloop-a2a2a-sync/FRD.md
docs/specs/p092-agentloop-a2a2a-sync/RUNBOOK.md
docs/receipts/SIRINX_LINE_OA_GATE_P092_AUTO_LOOP_SYNC_20260708.md
```

## Bundle C: Dependency Layout + Root Verification Repair

Suggested local commit message:

```text
chore(public-web): repair local verification gates
```

Scope:

- Repair `apps/public-web` dependency layout while preserving app structure.
- Remove stale wouter patch hook from package config and lockfile.
- Make root verifiers robust to quarantine symlinks and `tools/repo-intake` cache.
- Keep root `.env` out of repo and in local quarantine.

Exact path candidates:

```text
apps/public-web/client/src/test/LightMarkdown.test.tsx
apps/public-web/package.json
apps/public-web/pnpm-lock.yaml
apps/public-web/pnpm-workspace.yaml
scripts/verify-pr-mono-001.mjs
scripts/verify-next-phase.mjs
scripts/verify-public-web-dependency-layout.mjs
docs/receipts/PUBLIC_WEB_DEPENDENCY_LAYOUT_REPAIR_20260708.md
docs/receipts/ROOT_VERIFICATION_REPAIR_20260708.md
```

## Bundle D: Strategy / AEO Planning Docs

Suggested local commit message:

```text
docs(public-web): add SIRINX competitor SWOT and AEO backlog
```

Exact path candidates:

```text
docs/strategy/SIRINX_CO_COMPETITOR_SWOT_AEO_20260708.md
```

## Explicitly Excluded From Commit Bundles

Do not stage these paths in the current bundle set:

```text
.ghostclaw_runtime/
.mcp.json
outputs/
tools/
apps/public-web/node_modules/
apps/public-web/dist/
node_modules/
```

Rationale:

- `.ghostclaw_runtime/` includes browser/cache/runtime artifacts.
- `.mcp.json` is local connector configuration.
- `outputs/` contains unrelated pre-approval packets.
- `tools/` contains external intake/audit cache and may include ignored `.env` files or Git LFS pointer symlinks.
- dependency/build outputs are reproducible and should stay uncommitted.

## Safety Gate

- Local commit may be considered after human review of this scoped bundle map.
- Push still requires an exact push gate.
- Deploy still requires an exact deploy gate.
- LINE webhook production activation still requires deploy evidence, signature verification, and explicit test-user approval.
- CRM/customer data storage and production analytics still require separate explicit approval.
