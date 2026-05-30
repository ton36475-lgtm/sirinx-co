# Approval Packet: SIRINX Go-Live Handoff

## Change Summary

This packet prepares a go-live handoff for the recovered SIRINX website. It adds server operator scripts, an Nginx reverse-proxy example, and a live handoff document. It does not change DNS, production secrets, TLS certificates, repository visibility, collaborators, or live traffic.

## Objective

Give a server operator enough deterministic commands to deploy and smoke-test the recovered SIRINX website on a target Ubuntu/Debian server.

## Diff Scope

- `infra/scripts/server-preflight.sh`
- `infra/scripts/server-source-sync.sh`
- `infra/scripts/server-receiver-install.sh`
- `infra/scripts/render-public-site-config.sh`
- `infra/scripts/build-source-snapshot.ps1`
- `infra/nginx/public-site.conf.template`
- `infra/scripts/server-cutover-smoke.sh`
- `infra/nginx/sirinx.co.conf.example`
- `docs/migration/GO_LIVE_HANDOFF_2026-04-23.md`
- `docs/migration/HERMES_AGENT_SERVER_CONTINUATION_PACKET.md`
- `docs/migration/SERVER_RECEIVER_BOOTSTRAP_GUIDE.md`
- `docs/migration/CODEX_GOVERNANCE_CONTRACT_2026-04-23.md`
- `docs/migration/EXECUTIVE_ROI_STANDARD_2026-04-23.md`
- `governance/HARDWARE_CONTEXT_GOVERNANCE.md`
- `governance/FIELD_OBSERVED_HARDWARE_STACK.md`
- `governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md`
- `governance/records/FIELD_OBSERVED_LISINER_LIQUID_COOLED_BESS_2026-04-23.md`
- `governance/records/FIELD_OBSERVED_SOLIS_EMS_INVERTER_INTERFACE_2026-04-23.md`
- `governance/records/HARDWARE_INTEGRATION_PROVENANCE_GUARDRAIL_2026-04-23.md`
- `governance/FIELD_VALIDATED_PROJECT_CONTEXT.md`
- `governance/PILOT_PROJECT_STATUS.md`
- `governance/records/PILOT_PROJECT_COMPLETION_ESTIMATE_2026-04-23.md`
- `governance/ROI_SCENARIO_MODELING.md`
- `governance/ROI_SCENARIO_CLAIM_GOVERNANCE.md`
- `governance/records/ROI_TARGET_MODEL_250K_TO_50K_70K_2026-04-23.md`
- `governance/REVENUE_PLANE_TRACK_RECORD_CREATIVE_DIRECTION.md`
- `governance/records/EXECUTIVE_UI_TRACK_RECORD_IMAGERY_DIRECTIVE_2026-04-23.md`
- `governance/records/PACKAGE_TRUTH_PROMOTION_GUARDRAIL_2026-04-23.md`
- `governance/TELEMETRY_INGESTION_REQUIREMENTS.md`
- `knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md`
- `governance/DATA_CONTRACTS.md`
- `governance/RBAC_AND_APPROVAL_MATRIX.md`
- `docs/migration/DEPLOYMENT_VALIDATION_2026-04-23.md`
- `docs/migration/PRODUCTION_READINESS_CHECKLIST.md`

## Risk Level

Medium. This is production-facing documentation and operator tooling, but it is not a live cutover.

## Required Evidence Before Approval

- Local `check`, `test`, and `build` pass.
- Docker Compose config renders.
- `sirinx-public:local` image builds.
- Docker runtime smoke passes.
- Target server `infra/scripts/server-preflight.sh` passes.
- Target server receiver bootstrap passes and renders the approved reverse-proxy config without activating it.
- Target server route smoke passes through `infra/scripts/server-cutover-smoke.sh`.
- Reverse proxy config validates with `nginx -t` or the equivalent host proxy test.
- Executive ROI content follows `docs/migration/EXECUTIVE_ROI_STANDARD_2026-04-23.md`.
- Codex autonomous continuation follows `docs/migration/CODEX_GOVERNANCE_CONTRACT_2026-04-23.md`.
- LISINER, Solis, and other supplier/equipment candidates do not overwrite Locked Package Facts unless field evidence, executive package-standard approval, and an approval packet explicitly promote them.
- Any large bill-reduction examples such as `250,000 -> 50,000` are labeled as validated sales scenario, target model, case-study hypothesis, or review-required, not guaranteed.
- Hardware context records follow `governance/HARDWARE_CONTEXT_GOVERNANCE.md`.
- Field-observed hardware stack records follow `governance/FIELD_OBSERVED_HARDWARE_STACK.md`.
- Hardware integration knowledge records follow `governance/records/HARDWARE_INTEGRATION_PROVENANCE_GUARDRAIL_2026-04-23.md`.
- Hardware telemetry routes follow `knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md`.
- The LISINER liquid-cooled BESS with integrated chiller record remains field-observed context, not package truth.
- The Solis EMS / Solis industrial inverter interface record remains field-observed inverter and EMS context, not package truth.
- Field-validated project context records follow `governance/FIELD_VALIDATED_PROJECT_CONTEXT.md`.
- Pilot project status records follow `governance/PILOT_PROJECT_STATUS.md`.
- The pilot completion estimate of 85-90 percent remains an estimate-only `Pilot Under Review` record until punch-list, commissioning, telemetry, and acceptance evidence support promotion.
- ROI scenario model records follow `governance/ROI_SCENARIO_MODELING.md`.
- ROI scenario claim records follow `governance/ROI_SCENARIO_CLAIM_GOVERNANCE.md`.
- The target business case scenario `250,000 -> 50,000-70,000 THB` remains a `Target Model`, review required, not verified and not guaranteed.
- The `250,000 -> 50,000-70,000 THB` range may be described only as a target scenario, ROI model input, or case-study objective unless verified evidence supports promotion.
- No ROI range or target scenario may be presented as a guaranteed universal outcome.
- Revenue-plane track record sections follow `governance/REVENUE_PLANE_TRACK_RECORD_CREATIVE_DIRECTION.md`.
- Track Record pages use premium real-world imagery only, such as solar carport, smart hotel, BESS, EV charger, EMS, or comparable commercial/industrial installations, and must follow `governance/records/EXECUTIVE_UI_TRACK_RECORD_IMAGERY_DIRECTIVE_2026-04-23.md`.
- Validated project and track-record context remain context only unless governance explicitly upgrades them to global package truth through `governance/records/PACKAGE_TRUTH_PROMOTION_GUARDRAIL_2026-04-23.md` and an approval packet.
- Telemetry ingestion follows `governance/TELEMETRY_INGESTION_REQUIREMENTS.md` before production activation.

## Human Approval Required Before

- Pointing `sirinx.co` DNS to the target server.
- Pointing any alternative approved public FQDN, such as `www.sirin.co`, to the target server.
- Enabling or reloading the target reverse proxy for public traffic.
- Installing or changing production TLS certificates.
- Enabling PostgreSQL as the live database.
- Enabling n8n automation profile.
- Enabling telemetry ingestion against production traffic.
- Publishing revenue-plane track record sections with named clients, project photos, pilot evidence, or high-impact ROI claims.
- Publishing Track Record imagery that includes real customers, site details, installation photos, monitoring screenshots, bill data, signage, or any asset that could imply verified project evidence.
- Publishing field-validated project context as public proof or package evidence.
- Adding or rotating production secrets.
- Changing GitHub repository visibility or collaborators.
- Running imported unrestricted "full autonomy" prompts against production-facing SIRINX workflows.

## Rollback Note

If the target deployment fails before DNS cutover, stop the target container stack:

```bash
cd /opt/sirinx
docker compose -f docker-compose.yml stop sirinx-public
```

If the failure occurs after DNS or reverse-proxy cutover, point the reverse proxy or DNS record back to the last known good origin, then stop the new target stack:

```bash
cd /opt/sirinx
docker compose -f docker-compose.yml stop sirinx-public
```

Keep the old blocked Manus host only as evidence or rollback reference until the new host is verified.

## Audit Trail Note

Save these target-server outputs before and after cutover:

- `git rev-parse HEAD`
- `git status --short`
- `bash infra/scripts/server-preflight.sh`
- `docker compose -f docker-compose.yml ps`
- `bash infra/scripts/server-cutover-smoke.sh http://127.0.0.1:3000/`
- `bash infra/scripts/server-cutover-smoke.sh https://sirinx.co/`
- reverse proxy validation output
- DNS record state before and after cutover

## Current Decision

Prepared for human review. Not approved for live cutover until the production readiness checklist is completed on the target server.
