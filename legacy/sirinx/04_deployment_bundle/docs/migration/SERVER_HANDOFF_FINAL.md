# SIRINX Server Handoff Final

## Status

`Server-Ready Hold Mode`

The repository and handoff artifacts are prepared for server-team review. Production deployment remains blocked until approved server access details and deployment authorization are provided.

## Local Source Of Truth

- Canonical repo: `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx`
- Branch: `main`
- Handoff docs: `docs/migration/`
- Governance docs: `governance/`
- Server scripts: `infra/scripts/`
- Deployment bundle staging: `04_deployment_bundle/`
- Agent contracts: `ORCHESTRATION_SCHEMA.json` and `.ops/contracts/`
- Data Center manual: `docs/migration/DATACENTER_UPLOAD_OPERATIONS_MANUAL.md`
- Hermes continuation packet: `docs/migration/HERMES_AGENT_SERVER_CONTINUATION_PACKET.md`
- Server receiver guide: `docs/migration/SERVER_RECEIVER_BOOTSTRAP_GUIDE.md`
- Hermes DB/brain setup runbook: `docs/migration/HERMES_DATABASE_BRAIN_SETUP_RUNBOOK.md`
- Reviewed artifacts: `artifacts/review/`, `artifacts/validation/`, and `artifacts/live-handoff/`

## Expected Services

- `sirinx-public`: public website container, exposed to local reverse proxy only.
- Optional PostgreSQL/pgvector: internal only, no public exposure.
- Optional Redis/BullMQ plus n8n queue mode: internal agent plane only after approval.
- Omniscient Dashboard route on the internal control plane, read-only by default.
- Telemetry workers: internal only after provenance, redaction, retention, and approval gates.
- Five-agent governed workflow: Hermes -> Analyst -> Creator -> Validator -> Delivery.
- Specialist lanes: Database Steward, Mentor, and Apprentice for server bootstrap and junior-agent enablement only.

## Required Server Inputs

- SSH/sudo access.
- Server IP/hostname.
- OS confirmation.
- Storage layout.
- Backup target.
- DNS / Zero Trust owner.
- Outbound access confirmation.
- Maintenance window.

## Validation Commands

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\full-system-review.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\overlap-audit.ps1
python infra/scripts/validate-agent-contracts.py
```

```bash
bash infra/scripts/pre-deploy-check.sh
bash infra/scripts/smoke-test.sh
bash infra/scripts/ultimate-validator.sh
APP_DIR=/opt/sirinx REPO_URL=<approved_git_url> REPO_BRANCH=main bash infra/scripts/server-source-sync.sh
bash infra/scripts/server-receiver-install.sh
bash infra/scripts/hermes-brain-bootstrap.sh
bash infra/scripts/db-ops-preflight.sh
bash infra/scripts/server-preflight.sh
POST_DEPLOY_URL=https://<approved-host>/ bash infra/scripts/post-deploy-check.sh
bash infra/scripts/deploy-gate.sh
docker compose -f docker-compose.yml config
docker compose -f docker-compose.yml up -d --build sirinx-public
bash infra/scripts/server-cutover-smoke.sh http://127.0.0.1:3000/
```

## Deployment-Blocking Gates

- No production secrets in repo or handoff bundle.
- Human approval before DNS/TLS/proxy cutover.
- Human approval before n8n/automation production activation.
- Human approval before telemetry ingestion from production hardware.
- Human approval before PostgreSQL migration, PITR activation, or any destructive DB action.
- Track Record and ROI claims must follow governance records.
- Delivery Agent must not mark the package ready unless all manifest files physically exist.
- Data Center upload must use the reviewed bundle and latest review artifact, not an ad-hoc folder copy.
- If the target host cannot pull the canonical source directly, the handoff must include a governed source snapshot as the runtime payload.
- Any `passed-with-warnings` review result must be triaged and approved before upload or deployment planning continues.
- Mentor packets and DB bootstrap packets must exist before junior agents are allowed to continue server-side setup tasks.
- `post-deploy-check.sh` requires an approved staged URL and does not authorize live cutover by itself.
- `deploy-gate.sh` is a technical gate only and does not replace human approval.

## Rollback Note

Before DNS cutover, stop the new container if smoke fails. After cutover, restore the last known good origin in DNS/proxy and then stop the new stack.

## Audit Trail Note

Save git hash, contract validation output, bundle hash, compose config output, server preflight output, route smoke output, reverse proxy validation, DNS state, and operator approval.
