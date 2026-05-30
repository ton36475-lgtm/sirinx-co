# SIRINX Data Center Upload Operations Manual

## Purpose

This manual defines the governed workflow for packaging, reviewing, uploading, and re-validating the SIRINX handoff bundle before any server-side cutover.

This manual is safe to upload with the Data Center handoff package because it contains commands, approval gates, and review procedures only. It must not be used to bypass the server approval flow.

## Canonical Sources

- Canonical repo: `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx`
- Bundle root: `04_deployment_bundle/`
- Bundle markdown manifest: `04_deployment_bundle/MANIFEST.md`
- Bundle manifest: `04_deployment_bundle/MANIFEST.json`
- Bundle checksums: `04_deployment_bundle/CHECKSUMS.SHA256.txt`
- Review script: `infra/scripts/full-system-review.ps1`
- Contract validator: `infra/scripts/validate-agent-contracts.py`
- Real file validator: `infra/scripts/validate-real-files.sh`
- JSON schema validator: `infra/scripts/validate-json-schemas.sh`
- Locked fact validator: `infra/scripts/validate-sirinx-facts.sh`
- Bundle validator: `infra/scripts/validate-handoff-bundle.sh`
- Final validator: `infra/scripts/ultimate-validator.sh`
- Pre-deploy validator: `infra/scripts/pre-deploy-check.sh`
- Runtime smoke validator: `infra/scripts/smoke-test.sh`
- Post-deploy validator: `infra/scripts/post-deploy-check.sh`
- Deployment gate: `infra/scripts/deploy-gate.sh`

## Local Pre-Upload Review

Run this command from the canonical repo before every upload:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\full-system-review.ps1
```

This review performs:

- contract validation
- real file validation
- JSON schema validation
- locked fact validation
- TypeScript check
- test suite
- production build
- Docker Compose render
- overlap audit
- shell syntax checks for server scripts
- bundle rebuild
- final bundle validation

Expected outcome:

- `artifacts/review/<timestamp>/SIRINX_FULL_SYSTEM_REVIEW.json`
- `artifacts/review/<timestamp>/SIRINX_FULL_SYSTEM_REVIEW.md`
- `artifacts/validation/SIRINX_MULTI_AGENT_VALIDATION_<timestamp>.json`
- `artifacts/live-handoff/SIRINX_MULTI_AGENT_HANDOFF_<timestamp>.zip`
- `artifacts/source-snapshots/SIRINX_SOURCE_SNAPSHOT_<timestamp>.zip` when the runtime source must be delivered from this workstation
- a fresh `04_deployment_bundle/`

## Upload Package

Upload only governed artifacts:

- latest handoff zip from `artifacts/live-handoff/`
- latest validation JSON from `artifacts/validation/`
- matching review JSON and markdown from `artifacts/review/<timestamp>/`
- latest source snapshot zip from `artifacts/source-snapshots/` when the target host will not pull Git directly
- current `04_deployment_bundle/` if the Data Center team requests the extracted folder instead of the zip

Do not upload:

- local `.env`
- `secrets/`
- `node_modules/`
- `dist/`
- caches
- keystores
- plaintext credentials

## Integrity Verification Before Upload

From the canonical repo:

```powershell
Get-FileHash -Algorithm SHA256 .\artifacts\live-handoff\<LATEST_ZIP>.zip
Get-Content .\04_deployment_bundle\CHECKSUMS.SHA256.txt
```

Confirm that:

- the zip hash matches the handoff record
- `04_deployment_bundle/MANIFEST.json` exists
- `04_deployment_bundle/MANIFEST.md` exists
- `04_deployment_bundle/CHECKSUMS.SHA256.txt` exists

## Data Center Receive-and-Extract Flow

On the approved target server or staging host:

```bash
mkdir -p /opt/sirinx-handoff
cd /opt/sirinx-handoff
unzip SIRINX_MULTI_AGENT_HANDOFF_<STAMP>.zip
```

If the team receives the raw bundle directory instead of the zip:

```bash
mkdir -p /opt/sirinx-handoff
rsync -av 04_deployment_bundle/ /opt/sirinx-handoff/
cd /opt/sirinx-handoff
```

If the runtime source is supplied from this workstation, extract it separately:

```bash
mkdir -p /opt/sirinx
cd /opt/sirinx
unzip /tmp/SIRINX_SOURCE_SNAPSHOT_<STAMP>.zip
```

If the runtime source is supplied from an approved Git remote instead, use the continuation packet and source-sync script from the runtime source tree after clone or pull.

## Server-Side Review Commands

Run these before any deployment attempt:

```bash
python infra/scripts/validate-agent-contracts.py
bash -n infra/scripts/deploy-handshake.sh
bash -n infra/scripts/server-source-sync.sh
bash -n infra/scripts/server-receiver-install.sh
bash -n infra/scripts/render-public-site-config.sh
bash -n infra/scripts/server-preflight.sh
bash -n infra/scripts/server-cutover-smoke.sh
docker compose -f docker-compose.yml config
```

After approved server-local `.env` and secret files are created:

```bash
bash infra/scripts/server-receiver-install.sh
bash infra/scripts/server-preflight.sh
```

The preflight must not be treated as cutover authorization.

## Deployment Safety Layer

Run these commands in order when the runtime source is staged locally and ready for Data Center review:

```bash
bash infra/scripts/pre-deploy-check.sh
bash infra/scripts/smoke-test.sh
bash infra/scripts/post-deploy-check.sh
bash infra/scripts/deploy-gate.sh
```

Safety expectations:

- `pre-deploy-check.sh` validates `.env.example`, required environment keys, active config files, suspicious secret-like assignments, and runtime port consistency.
- `smoke-test.sh` performs a local production build, boots the app on a temporary port, verifies the endpoint responds, verifies logs exist, and fails if fatal runtime signatures appear in the first 10 seconds.
- `post-deploy-check.sh` is for the receiving host after deployment staging. It requires `POST_DEPLOY_URL` and can optionally validate an environment snapshot and a log snapshot without exposing secrets in chat.
- `deploy-gate.sh` allows deploy only after the validators, pre-deploy check, and smoke test pass.

`ALLOW DEPLOY` is a technical readiness signal only. Human approval, approved server access, and the governed maintenance window are still required before any live cutover.

## Required Server-Local Inputs

The Data Center or IT team must provide locally on the server:

- `.env` created from `.env.example`
- `secrets/postgres_password.txt`
- `secrets/n8n_encryption_key.txt`
- `secrets/n8n_runner_token.txt`

These files must never be committed back to the repository.

## Troubleshooting

### Contract Validation Fails

- Check that `ORCHESTRATION_SCHEMA.json` and `.ops/contracts/*.json` all exist
- Check that `shared/_core/agentContracts.ts` still matches the five-agent roster
- Re-run the local review script and rebuild the bundle

### Bundle Validation Fails

- Re-run `powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\build-handoff-bundle.ps1`
- Confirm `04_deployment_bundle/MANIFEST.json` and `CHECKSUMS.SHA256.txt` were regenerated
- Confirm historical blueprint files remain excluded from the final bundle and are not referenced as active artifacts

### Docker Compose Config Fails

- Confirm Docker Engine and Docker Compose are installed on the host
- Review `docker-compose.yml` for server-local env or secret paths
- Do not guess secret values in chat

### Wrong Brand or Gambling Content Appears

- Stop immediately
- run the local review script again
- inspect `infra/scripts/overlap-audit.ps1`
- quarantine the offending runtime or artifact before any upload

## Stop Condition

The package may be uploaded for server review when:

- full-system review passed
- if full-system review reports `passed-with-warnings`, each warning must be triaged and accepted in writing before upload
- bundle exists
- manifest and checksums exist
- no secrets are present in the upload set

The package may not be deployed to production until the server team provides approved access details and explicit deployment authorization.
