# SIRINX Production Readiness Checklist

## Preflight

- [ ] Read `docs/migration/LOCAL_SOURCE_INVENTORY_2026-04-23.md` and continue from local recovery evidence before importing GitHub or Telegram reference packs.
- [ ] Read `docs/migration/WORKSPACE_PROJECT_CONSOLIDATION_MAP.md` and confirm SIRINX remains the only project included in SIRINX handoff.
- [ ] Read `docs/migration/GO_LIVE_HANDOFF_2026-04-23.md`.
- [ ] Read `docs/migration/HERMES_AGENT_SERVER_CONTINUATION_PACKET.md`.
- [ ] Read `docs/migration/HERMES_DATABASE_BRAIN_SETUP_RUNBOOK.md`.
- [ ] Read `docs/migration/SERVER_RECEIVER_BOOTSTRAP_GUIDE.md`.
- [ ] Read `docs/migration/EXECUTIVE_ROI_STANDARD_2026-04-23.md` before publishing executive ROI content.
- [ ] Read `governance/CANONICAL_OPERATING_SYSTEM.md`.
- [ ] Read `governance/CODE_OVERLAP_AUDIT_2026-04-23.md`.
- [ ] Review `governance/APPROVAL_PACKET_GO_LIVE_HANDOFF_2026-04-23.md`.
- [ ] Confirm current public blocker and target hosting path.
- [ ] Confirm final domain routing for `sirinx.co`.
- [ ] Confirm internal host routing for `ops.sirinx.co`.
- [ ] Confirm private network routing for `agents.sirinx.internal`.
- [ ] Confirm no CHOKMA/gambling assets exist in the SIRINX build.
- [ ] Confirm `.env` and Docker secrets are server-local only.
- [ ] Confirm executive ROI claims are marked as fact, estimate, scenario, or review required.
- [ ] Review `governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md`.
- [ ] Review `governance/LOCKED_BUSINESS_FACTS.md`.
- [ ] Review `governance/OMNISCIENT_DASHBOARD_ARCHITECTURE.md`.
- [ ] Review `ORCHESTRATION_SCHEMA.json`.
- [ ] Review `MULTI_AGENT_SYSTEM_PROMPTS.md`.
- [ ] Review `.ops/contracts/HANDOFF_BUNDLE_MANIFEST.json`.
- [ ] Review `knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md` before enabling hardware telemetry.
- [ ] Confirm LISINER/Solis references remain field context, not package truth.

## Local Validation

- [ ] `powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\full-system-review.ps1`
- [ ] `powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\build-handoff-bundle.ps1`
- [ ] `powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\overlap-audit.ps1`
- [ ] `python infra/scripts/validate-agent-contracts.py`
- [ ] `bash infra/scripts/ultimate-validator.sh`
- [ ] `pnpm run check`
- [ ] `pnpm run test`
- [ ] `pnpm run build`
- [ ] Confirm the production build has no Vite chunk-size warning and no JS asset larger than 500,000 bytes.
- [ ] Confirm Manus/debug runtime plugins are not enabled in production builds.
- [ ] Confirm production JavaScript obfuscation remains opt-in through `VITE_ENABLE_JS_OBFUSCATION=true`.
- [ ] Confirm chat markdown uses the lightweight SIRINX renderer, not a heavy markdown/diagram runtime.
- [ ] `bash infra/scripts/pre-deploy-check.sh`
- [ ] `bash infra/scripts/smoke-test.sh`
- [ ] Keep `bash infra/scripts/post-deploy-check.sh` for the staged host after deployment sync and URL confirmation.
- [ ] Use `bash infra/scripts/deploy-gate.sh` as the final technical deployment gate after validators pass.
- [ ] Confirm `04_deployment_bundle/MANIFEST.json` and `04_deployment_bundle/CHECKSUMS.SHA256.txt` were rebuilt from the latest contracts.
- [ ] Confirm bundle includes root + nested `AGENTS.md`, orchestration contracts, and no historical blueprint drift.
- [ ] Confirm the latest review artifact exists under `artifacts/review/`.
- [ ] Confirm the latest review artifact reports `passed` or that any `passed-with-warnings` findings were triaged and accepted explicitly.
- [ ] Confirm the matching validation JSON exists under `artifacts/validation/`.
- [ ] Confirm the matching reviewed zip exists under `artifacts/live-handoff/`.
- [ ] Confirm the latest source snapshot exists under `artifacts/source-snapshots/` if the target host will not pull Git directly.
- [ ] `docker compose config`
- [ ] `docker compose build sirinx-public`
- [ ] `docker compose up -d sirinx-public`
- [ ] Public smoke: `curl http://127.0.0.1:3000/`
- [ ] Brand smoke: response contains `SIRINX` and does not contain unrelated gambling terms.
- [ ] Target-server receiver bootstrap: `bash infra/scripts/server-receiver-install.sh`
- [ ] Target-server preflight: `bash infra/scripts/server-preflight.sh`
- [ ] Target-server smoke: `bash infra/scripts/server-cutover-smoke.sh http://127.0.0.1:3000/`
- [ ] Confirm the generated nginx config for the approved host exists on the target host before proxy activation.
- [ ] Confirm `runtime/hermes/brain-skills` and starter packets exist on the target host.
- [ ] Confirm `artifacts/db-preflight/` contains the latest Database Steward evidence before any DB readiness claim.

## Data

- [ ] Decide whether first server release remains MySQL/TiDB compatible.
- [ ] If migrating to PostgreSQL, complete schema migration and dry-run data import.
- [ ] Verify backup snapshot before any migration.
- [ ] Verify restore from backup.

## Automation

- [ ] Keep `automation` profile disabled for initial public recovery unless explicitly approved.
- [ ] Review n8n workflows before enabling.
- [ ] Verify runner token scope.
- [ ] Verify kill switch.
- [ ] Confirm Mentor and Apprentice starter packets were regenerated from canonical docs and contracts.

## Cyber-Physical Telemetry

- [ ] Hardware integration provenance record complete.
- [ ] Solis EMS metric source and permission boundary documented.
- [ ] LISINER BESS/chiller signal source and permission boundary documented.
- [ ] Data freshness and stale-data behavior tested.
- [ ] Read-only telemetry default confirmed.
- [ ] Remote write/control path blocked unless separately approved.
- [ ] Redaction, retention, and quarantine behavior tested.
- [ ] Omniscient Dashboard feed remains internal-only and read-only on mobile.

## Cutover

- [ ] Approval packet signed.
- [ ] Rollback target confirmed.
- [ ] DNS TTL lowered if needed.
- [ ] Reverse proxy points to healthy `sirinx-public`.
- [ ] Reverse proxy validates with `nginx -t` or equivalent provider check.
- [ ] TLS certificate valid.
- [ ] Post-cutover smoke test passed: `bash infra/scripts/server-cutover-smoke.sh https://sirinx.co/`
- [ ] Old blocked host retained only as rollback reference or retired after verification.
