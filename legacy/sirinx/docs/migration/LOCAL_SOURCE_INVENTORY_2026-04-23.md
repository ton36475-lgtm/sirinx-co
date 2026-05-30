# SIRINX Local Source Inventory - 2026-04-23

## Purpose

This inventory records the local files that were already started on this computer and defines the order for continuing SIRINX recovery before importing any additional GitHub, Telegram, Ghost Claw, Zenith, or CHOKMA material.

## Operating Decision

Continue from the local SIRINX recovery lane first.

- Canonical app repo: `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx`
- Canonical recovery controller: `C:\Users\Ton36\OneDrive\เอกสาร\Playground\scripts\hybrid_website_control.ps1`
- Canonical emergency recovery note: `C:\Users\Ton36\OneDrive\เอกสาร\Playground\artifacts\control-plane\SIRINX_MANUS_BLOCK_RECOVERY_2026-04-23.md`
- Canonical v15 deploy validation: `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx\docs\migration\DEPLOYMENT_VALIDATION_2026-04-23.md`

GitHub mirrors and imported Telegram packs are reference-only until they are reconciled against the local recovery lane.

## Local Files Reviewed

| File | Decision | Reason |
| --- | --- | --- |
| `artifacts/control-plane/SIRINX_MANUS_BLOCK_RECOVERY_2026-04-23.md` | Canonical recovery evidence | Explains the Manus block, wrong-brand CHOKMA masking issue, fixed brand smoke, and current local recovery proof. |
| `artifacts/control-plane/SIRINX_ROUTE_SMOKE-25690423-052244.json` | Canonical smoke evidence | Confirms `/`, `/contact`, and `/assessment` returned HTTP 200 with SIRINX content and no wrong-brand content. |
| `sirinx/ACTIVE_RECOVERY_VALIDATION.md` | Recovery baseline | Preserves the first working validation pass after moving recovery fixes into the writable active repo. |
| `sirinx/RECOVERY_COMMAND_BASELINE.md` | Recovery command baseline | Defines the rescue-first command lane and warns not to redesign or refactor unrelated areas. |
| `sirinx/docs/RUNTIME_SCRIPT_RECOVERY_PACKET_2026-04-18.md` | Confirmed bug packet | Documents the Windows runtime-script bug, regression coverage, rollback, audit trail, and prevention note. |
| `sirinx/docs/migration/DEPLOYMENT_VALIDATION_2026-04-23.md` | Current deploy evidence | Confirms check/test/build, Docker image build, Docker smoke, brand smoke, and separation smoke passed. |
| `sirinx/docs/migration/HERMES_AGENT_SERVER_CONTINUATION_PACKET.md` | Continuation support lane | Documents the governed continuation workflow for the verified starter repo and server handoff lane. Not a production-ready claim. |
| `packages/prompts/system/sirinx-codex-continuation-bridge.md` | Prompt guardrail | Keeps imported packs untrusted and prevents false failure claims from non-fatal Codex CLI warnings. |
| `sirinx/.ops/audit/CONTINUATION_AUDIT.md` | Prevention evidence | Documents recovery findings, future prevention notes, and current continuation guardrails. |
| `artifacts/codex-continuation/SIRINX_CODEX_CONTINUATION_REPORT-*.md` | Historical continuation evidence | Useful for control-plane state, but not a public-site production readiness proof. |
| `C:\Users\Ton36\Projects\10-Recovery\SIRINX\sirinx-codex-workspace\sirinx-hermes-control-starter-v2\handoff\04-next-3-tasks.md` | Control-plane next point | Latest starter-repo tasks: capture manual-login export evidence, restore real env credentials, then run Hermes continuation against the mounted workspace. |
| `C:\Users\Ton36\Projects\10-Recovery\SIRINX\sirinx-codex-workspace\sirinx-hermes-control-starter-v2\handoff\08-codex-continuation-check.md` | Control-plane source of truth | Confirms official `codex exec` lane and marks Ghost Claw wrapper/`localhost:8000` flows as legacy-only. |
| `sirinx/docs/migration/GITHUB_SOURCE_INVENTORY_2026-04-23.md` | External reference inventory | Records that `ghost-claw-os` is reference-only and that private GitHub repos require explicit auth. |

## Files Explicitly Not Used

| File or Source | Decision | Reason |
| --- | --- | --- |
| `C:\Users\Ton36\Downloads\Telegram Desktop\squarespace_backup_codes_sirinxsolarcell@gmail.com.txt` | Do not read or commit | Backup codes are secret material. Use only through an explicit human-approved host recovery step. |
| CHOKMA/gambling assets, Docker services, and landing pages | Keep separate | SIRINX recovery must not include gambling, lottery, casino, CHOKMA, or unrelated conversion-funnel content. |
| Ghost Claw wrapper scripts and `localhost:8000` custom backend references | Legacy reference only | The verified lane uses local SIRINX recovery plus official `codex exec`, not wrapper-installed CLIs. |
| Zenith/OpenClaw root-owned services | Quarantine unless re-approved | They can conflict with gateway/model-host ownership in the hybrid Windows + Ubuntu setup. |

## Current Verified State

- Local SIRINX app was recovered on port `3000`.
- Brand smoke requires SIRINX content, not only HTTP 200.
- Wrong-brand CHOKMA/gambling content on SIRINX routes is a blocker.
- Docker server-prep smoke passed for `sirinx-public`.
- `sirinx.co` public hosting was still blocked on the old host at the time of the recovery note.
- No production DNS, reverse proxy, TLS, or secret cutover has been performed.

## Fresh Local Smoke - 2026-04-23

Checked from the current Windows workspace against `http://127.0.0.1:3000`.

| Route | HTTP status | SIRINX brand found | Wrong-brand found |
| --- | --- | --- | --- |
| `/` | `200` | yes | no |
| `/contact` | `200` | yes | no |
| `/assessment` | `200` | yes | no |

This smoke confirms local continuity only. It is not a public production readiness claim.

## Continue-First Order

1. Keep public website recovery and control-plane continuation separate:

   - Public SIRINX website lane: active repo at `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx`.
   - Control-plane continuation lane: starter repo at `C:\Users\Ton36\Projects\10-Recovery\SIRINX\sirinx-codex-workspace\sirinx-hermes-control-starter-v2`.

2. Run the hybrid controller before ad-hoc recovery:

   ```powershell
   Set-Location "C:\Users\Ton36\OneDrive\เอกสาร\Playground"
   .\scripts\hybrid_website_control.ps1 -Mode continue-safe
   ```

3. Confirm the three public SIRINX routes still pass brand smoke:

   - `http://127.0.0.1:3000/`
   - `http://127.0.0.1:3000/contact`
   - `http://127.0.0.1:3000/assessment`

4. Re-run local validation inside the active repo:

   ```powershell
   Set-Location "C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx"
   corepack pnpm run check
   corepack pnpm run test
   corepack pnpm run build
   docker compose -f docker-compose.yml config
   docker compose -f docker-compose.yml build sirinx-public
   ```

5. Continue the starter control-plane only after the public website remains healthy:

   ```powershell
   Get-Content -Raw "C:\Users\Ton36\Projects\10-Recovery\SIRINX\sirinx-codex-workspace\sirinx-hermes-control-starter-v2\handoff\07-resume-prompt.md" | codex exec -m "gpt-5.4-mini" -C "C:\Users\Ton36\Projects\10-Recovery\SIRINX\sirinx-codex-workspace\sirinx-hermes-control-starter-v2" --sandbox workspace-write --add-dir "C:\Users\Ton36\Downloads\Telegram Desktop" -
   ```

6. Keep server deployment in review-only mode until the production readiness checklist is complete.

## Production Gate

Before public cutover, require:

- human approval packet sign-off
- server-local secrets only
- reverse proxy and TLS smoke on the target host
- rollback rehearsal
- brand smoke proving SIRINX content and no CHOKMA/gambling content
- database decision for the current MySQL/TiDB baseline versus the PostgreSQL v15 target

## Future Prevention

Every future SIRINX recovery or deploy pack must include:

- route-level brand smoke, not only HTTP status checks
- wrong-brand negative smoke for CHOKMA/gambling terms
- Docker runtime smoke after server bundle or Dockerfile changes
- explicit separation between verified local facts, external references, and assumptions
- a secret-handling note for any file that looks like credentials, backup codes, tokens, or service-account material
- ASCII-only hybrid control scripts so Windows PowerShell 5.1 can parse the recovery lane even on non-Unicode console/code-page setups
