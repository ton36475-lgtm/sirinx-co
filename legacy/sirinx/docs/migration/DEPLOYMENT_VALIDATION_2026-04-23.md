# SIRINX Deployment Validation - 2026-04-23

## Scope

This validation covers the recovered SIRINX public website and the v15 server-preparation package. It does not perform a production DNS, reverse-proxy, or live traffic cutover.

## Inputs Reviewed

- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx\docs\migration\LOCAL_SOURCE_INVENTORY_2026-04-23.md`
- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\artifacts\control-plane\SIRINX_MANUS_BLOCK_RECOVERY_2026-04-23.md`
- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\artifacts\control-plane\SIRINX_ROUTE_SMOKE-25690423-052244.json`
- `C:\Users\Ton36\Downloads\SIRINX_Server_Prep_Handoff_v15.md`
- `C:\Users\Ton36\Downloads\SIRINX_Server_Prep_Handoff_v15.docx`
- `C:\Users\Ton36\Downloads\SIRINX_Codex_Ultimate_Prompt_v15_Canonical.md`
- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\_github\ton36475-lgtm\ghost-claw-os` as a reference-only GitHub mirror
- `docs/migration/EXECUTIVE_ROI_STANDARD_2026-04-23.md`

## Commands Executed

- `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test_hybrid_website_control.ps1`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\hybrid_website_control.ps1 -Mode continue-safe`
- local route smoke for `/`, `/contact`, and `/assessment`
- `bash infra/scripts/deploy-handshake.sh`
- `bash -n infra/scripts/server-preflight.sh`
- `bash -n infra/scripts/server-cutover-smoke.sh`
- `corepack pnpm run check`
- `corepack pnpm run test`
- `corepack pnpm run build`
- `docker compose -f docker-compose.yml build sirinx-public`
- `docker run -d --name sirinx-public-smoke -p 3010:3000 sirinx-public:local`
- `Invoke-WebRequest http://127.0.0.1:3010/`
- `docker compose -f docker-compose.yml config`

## Results

- Hybrid controller smoke: passed after parser-safety fix.
- Hybrid `continue-safe`: passed.
- Windows OpenClaw gateway owner: confirmed as the only gateway owner.
- Ubuntu PM2 baseline: `Zenith-Sentinel` and `Zenith-Cognitive` online; no duplicate brain/limbs/reporter owners.
- Local route smoke: passed for `/`, `/contact`, and `/assessment`.
- Deploy handshake: passed required-file, secret-hygiene, check, test, and build phases.
- Deploy handshake Docker phase: skipped in Bash/WSL because Docker was not available in that shell; Windows PowerShell Docker validation passed separately.
- Server preflight script syntax: passed.
- Server cutover smoke script syntax: passed.
- Server cutover smoke script local execution from Bash to Windows `127.0.0.1:3000`: not used as evidence because this workstation's Bash/WSL network boundary cannot reach the Windows-bound dev server. Use this script on the target server after Docker starts `sirinx-public`; use PowerShell route smoke for this Windows local recovery session.
- Executive ROI standard: added to keep boardroom-facing ROI content strong but assumption-labeled and package-safe.
- TypeScript check: passed.
- Unit tests: passed, 12 test files and 141 tests.
- Production build: passed.
- Docker image build: passed.
- Docker runtime smoke: passed with HTTP 200.
- Brand smoke: passed, SIRINX found in rendered HTML.
- Separation smoke: passed, CHOKMA/gambling keywords were not found in rendered HTML.
- Docker Compose render: passed.
- Cyber-physical governance continuation: passed documentation validation for field hardware context, hardware integration provenance, telemetry protocol, mobile access policy, and server handoff final.
- Current continuation validation on 2026-04-23 afternoon: `git diff --check` passed with CRLF warnings only; `corepack pnpm run check` passed; `corepack pnpm run test` passed with 12 test files and 141 tests; `corepack pnpm run build` passed; `docker compose -f docker-compose.yml config` passed.
- Consolidation validation on 2026-04-23 late afternoon: `powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\overlap-audit.ps1` passed; runtime forbidden-term hits were 0; required canonical docs were present; `sirinx-public` had exactly one service and one `3000:3000` mapping; DB/Redis direct host exposure check was false; `corepack pnpm run check`, `corepack pnpm run test`, `corepack pnpm run build`, and `docker compose -f docker-compose.yml config` all passed.
- Advanced build hardening validation on 2026-04-23 final pass: `corepack pnpm run check` passed; `corepack pnpm run test` passed with 13 test files and 143 tests; `corepack pnpm run build` passed with no Vite source-map or chunk-size warnings; largest JavaScript asset was `vendor-react-BiuN0ery.js` at 239,607 bytes; `bash infra/scripts/ultimate-validator.sh` passed; `powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\overlap-audit.ps1` passed; `docker compose -f docker-compose.yml config` passed.

## Runtime Bug Fixed

The first Docker runtime smoke failed because the production server bundle pulled `vite.config.ts` into `dist/index.js`, which required dev-only Vite plugins at container startup.

Fix:

- `server/_core/vite.ts` now loads Vite and the Vite config through dynamic variable imports inside the development-only setup path.
- `server/runtimeScripts.test.ts` now guards against static Vite/config imports returning to the production server bundle.
- `.windsurfrules`, `.cursorrules`, and the repository audit plan now require Docker runtime smoke after server bundle changes.

## Hybrid Control Bug Fixed

The first `continue-safe` run on 2026-04-23 failed before execution because `scripts/hybrid_website_control.ps1` contained non-ASCII Thai string literals that Windows PowerShell 5.1 misread through a legacy code page.

Fix:

- `scripts/hybrid_website_control.ps1` is now ASCII-only.
- Wrong-brand detection is centralized through `Test-KnownWrongBrandContent`.
- `scripts/test_hybrid_website_control.ps1` fails if non-ASCII characters return to the hybrid control script.
- The rule was added to `AGENTS.md`, `.windsurfrules`, and `.cursorrules`.
- Details are captured in `docs/migration/HYBRID_CONTROL_PARSER_RECOVERY_2026-04-23.md`.

## Production Build Hardening Fixed

Production builds previously carried optional development/debug tooling and a heavy chat markdown renderer into the release graph.

Fix:

- `vite.config.ts` now keeps Manus runtime/debug plugins out of production builds.
- Production JavaScript obfuscation remains opt-in through `VITE_ENABLE_JS_OBFUSCATION=true`.
- `client/src/App.tsx` lazy-loads route pages, admin screens, and the floating chat widget.
- `client/src/components/AIChatBox.tsx` and `client/src/components/FloatingChatWidget.tsx` now use `client/src/components/LightMarkdown.tsx`.
- `client/src/test/LightMarkdown.test.tsx` validates markdown rendering safety.
- `infra/scripts/ultimate-validator.sh` enforces the no-heavy-markdown, opt-in-obfuscation, and max-JS-asset-size gates.

## Evidence

- `artifacts/control-plane/HYBRID_CONTINUE_SAFE-25690423-071631.log`
- `artifacts/control-plane/HYBRID_CONTINUE_SAFE-25690423-072145.log`
- `artifacts/control-plane/SIRINX_ROUTE_SMOKE-25690423-072409.json`
- `artifacts/deploy-handshake/20260423T032643Z/summary.log`
- `artifacts/deploy-handshake/20260423T032643Z/check.log`
- `artifacts/deploy-handshake/20260423T032643Z/test.log`
- `artifacts/deploy-handshake/20260423T032643Z/build.log`
- `infra/scripts/server-preflight.sh`
- `infra/scripts/server-cutover-smoke.sh`
- `infra/nginx/sirinx.co.conf.example`
- `artifacts/deploy-handshake/docker-smoke-latest.log`
- `artifacts/deploy-handshake/docker-smoke-container-latest.log`
- `artifacts/deploy-handshake/docker-build-sirinx-public-latest.log`
- `artifacts/deploy-handshake/docker-compose-config-latest.log`
- `artifacts/deploy-handshake/docker-compose-config-powershell-latest.log`
- `artifacts/live-handoff/SIRINX_GO_LIVE_HANDOFF_25690423-154721.zip`
- `governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md`
- `knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md`
- `governance/records/HARDWARE_INTEGRATION_PROVENANCE_GUARDRAIL_2026-04-23.md`
- `PROJECT_CONSOLIDATION_MAP.md`
- `docs/migration/WORKSPACE_PROJECT_CONSOLIDATION_MAP.md`
- `docs/migration/CONSOLIDATION_COMPLETION_2026-04-23.md`
- `governance/CANONICAL_OPERATING_SYSTEM.md`
- `governance/CODE_OVERLAP_AUDIT_2026-04-23.md`
- `infra/scripts/overlap-audit.ps1`

## Gates Still Required Before Production Cutover

- Continue from local recovery evidence before importing GitHub or Telegram material.
- Human approval packet sign-off.
- Server-specific reverse proxy and TLS configuration.
- Approved production secrets through SOPS, Docker secrets, or a server-managed secret store.
- Database migration decision: current code still uses the MySQL/TiDB baseline; PostgreSQL remains the v15 target and is gated.
- Rollback command rehearsal on the target server.
- Optional GitHub auth setup if private repositories such as `sirinx-solar-energy` must be mirrored locally.
