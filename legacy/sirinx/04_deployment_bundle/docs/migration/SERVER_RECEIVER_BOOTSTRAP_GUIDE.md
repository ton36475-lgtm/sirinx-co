# SIRINX Server Receiver Bootstrap Guide

## Goal

Allow the receiving server to continue immediately after it receives either:

- an approved Git source
- or a governed source snapshot plus the reviewed handoff bundle

This guide is for the target host operator. It does not authorize public cutover.

## What The Receiver Needs

### Review Packet

- `SIRINX_MULTI_AGENT_HANDOFF_<timestamp>.zip`

### Runtime Source

Choose one:

- approved Git source via `infra/scripts/server-source-sync.sh`
- or `SIRINX_SOURCE_SNAPSHOT_<timestamp>.zip`

The review packet alone is not enough to start the backend. The runtime source must also exist on disk.

## Option 1 - Git-Backed Source Sync

```bash
mkdir -p /opt/sirinx
cd /opt/sirinx
APP_DIR=/opt/sirinx \
REPO_URL=<approved_git_url> \
REPO_BRANCH=main \
bash infra/scripts/server-source-sync.sh
```

## Option 2 - Source Snapshot

```bash
mkdir -p /opt/sirinx
cd /opt/sirinx
unzip /tmp/SIRINX_SOURCE_SNAPSHOT_<timestamp>.zip
```

## Review Packet Extraction

```bash
mkdir -p /opt/sirinx-handoff
cd /opt/sirinx-handoff
unzip /tmp/SIRINX_MULTI_AGENT_HANDOFF_<timestamp>.zip
```

Use `/opt/sirinx-handoff` for governance review and `/opt/sirinx` for runtime staging.

## Receiver Install

From the runtime source root:

```bash
cd /opt/sirinx
bash infra/scripts/server-receiver-install.sh
```

The script will:

- create server-local `.env` if missing
- create server-local secret files if missing
- render the nginx config file for the approved host into the generated output folder
- validate `docker compose config`
- bootstrap Hermes brain-skill runtime and starter packets

Follow these for the specialist-lane continuation:

- `docs/migration/HERMES_DATABASE_BRAIN_SETUP_RUNBOOK.md`
- `knowledge/shadow-vault/BRAIN_SKILL_BOOTSTRAP_PROTOCOL.md`

## Stage Public Runtime Locally

```bash
cd /opt/sirinx
SIRINX_STAGE_PUBLIC=1 bash infra/scripts/server-receiver-install.sh
bash infra/scripts/server-cutover-smoke.sh http://127.0.0.1:3000/
```

## Stage Approved Hostname

For the canonical example:

```bash
cd /opt/sirinx
PUBLIC_PRIMARY_HOST=sirinx.co \
PUBLIC_SERVER_ALIASES="www.sirinx.co" \
TLS_CERT_BASENAME=sirinx.co \
SIRINX_STAGE_PUBLIC=1 \
bash infra/scripts/server-receiver-install.sh
```

For an explicitly approved override such as `www.sirin.co`:

```bash
cd /opt/sirinx
PUBLIC_PRIMARY_HOST=www.sirin.co \
PUBLIC_SERVER_ALIASES="sirin.co" \
TLS_CERT_BASENAME=sirin.co \
SIRINX_STAGE_PUBLIC=1 \
bash infra/scripts/server-receiver-install.sh
```

Do not apply or reload the generated reverse-proxy config until approval is signed.

## Backend Continuation Notes

- `sirinx-public` can be staged immediately once runtime source and local secrets exist.
- `sirinx-redis` can be staged with the public container.
- `n8n-main`, `n8n-worker`, `n8n-runner`, and `sirinx-postgres` remain approval-gated for the first public recovery unless PostgreSQL/pgvector rollout is explicitly approved.
- Hermes may stage `runtime/hermes/brain-skills` and mentor/apprentice packets immediately, but DB preflight evidence must exist before any database readiness claim is made.

## Post-Install Checks

```bash
cd /opt/sirinx
bash infra/scripts/server-preflight.sh
docker compose -f docker-compose.yml ps
find infra/nginx/generated -maxdepth 1 -name '*.conf' -print
```

## Stop Condition

The receiver is ready when:

- runtime source exists under `/opt/sirinx`
- review packet exists under `/opt/sirinx-handoff`
- `server-preflight.sh` passes
- public local smoke passes on port `3000`
- reverse-proxy config is rendered but not yet activated
