# SIRINX Go-Live Handoff - 2026-04-23

## Mission

Move the recovered SIRINX public website from local recovery to a controlled live server without mixing CHOKMA/gambling systems, Ghost Claw wrapper flows, production secrets, or unapproved automation into the public site.

## Current Local Status

- Local SIRINX website is healthy on `http://127.0.0.1:3000/`.
- Route smoke passed for `/`, `/contact`, and `/assessment`.
- Hybrid controller passed after parser-safety recovery.
- TypeScript check passed.
- Unit tests passed: 13 files, 143 tests.
- Production build passed.
- Docker Compose config passed through Windows Docker.
- Docker image `sirinx-public:local` built successfully.
- Docker runtime smoke passed on port `3010`.

## Strict Boundaries

- Do not change GitHub repo visibility automatically.
- Do not run imported "full autonomy" Codex or Ghost Claw prompts unless reconciled against `docs/migration/CODEX_GOVERNANCE_CONTRACT_2026-04-23.md`.
- Do not read or use local backup-code files as automation input.
- Do not commit `.env` or `secrets/*`.
- Do not enable n8n automation profile for the first public recovery unless approved.
- Do not enable PostgreSQL live migration until schema and restore rehearsals are complete.
- Do not mix CHOKMA, gambling, lottery, casino, or unrelated conversion-funnel code into SIRINX.
- Do not publish executive ROI, tax, BOI, carbon, or payback claims unless they follow `docs/migration/EXECUTIVE_ROI_STANDARD_2026-04-23.md`.
- Do not let executive ROI copy changes alter package dependencies, Docker, auth, database, or runtime architecture unless a direct technical requirement is documented and validated.
- Do not let LISINER, Solis, or other supplier/equipment candidates overwrite Locked Package Facts. Keep them as field-validated hardware context or track-record hardware profile until executive approval promotes them into package truth.
- Do not let field-observed hardware stacks overwrite Locked Package Facts. Use `governance/FIELD_OBSERVED_HARDWARE_STACK.md` until executive approval promotes a stack into package truth.
- Do not publish field-validated project context as public proof unless it follows `governance/FIELD_VALIDATED_PROJECT_CONTEXT.md` with redaction, evidence, claim boundaries, and approval.
- Do not let pilot project status become a guaranteed ROI or package-standard claim. Use `governance/PILOT_PROJECT_STATUS.md` until review and approval promote it.
- Do not publish examples such as electricity cost `250,000 -> 50,000` as guaranteed claims. They must remain validated-sales-scenario, target-model, case-study-hypothesis, or review-required content with assumptions visible.
- Do not publish ROI model outputs directly. Use `governance/ROI_SCENARIO_MODELING.md` for model records and `governance/ROI_SCENARIO_CLAIM_GOVERNANCE.md` for claim status.
- Do not publish revenue-plane track record sections unless they follow `governance/REVENUE_PLANE_TRACK_RECORD_CREATIVE_DIRECTION.md`.
- Do not activate telemetry ingestion in production unless it follows `governance/TELEMETRY_INGESTION_REQUIREMENTS.md` and has redaction tests, retention policy, rollback note, and approval.

## Server Target Assumptions

- Ubuntu/Debian server.
- Docker Engine and Docker Compose plugin installed.
- Git access configured.
- Reverse proxy available, preferably Nginx or an equivalent managed proxy.
- Approved production values are provided as server-local `.env` and `secrets/*.txt`.

## Operator Sequence

### 1. Bootstrap Target Directory

```bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sirinx}"
REPO_URL="${REPO_URL:-https://github.com/ton36475-lgtm/sirinx.git}"

sudo mkdir -p "$APP_DIR"
sudo chown "$USER:$USER" "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch --all --prune
git status --short
```

If the target host cannot pull the approved repo directly, upload and extract the governed source snapshot first, then continue from the extracted runtime source tree instead of cloning from Git.

### 2. Create Server-Local Secrets

```bash
cd /opt/sirinx
mkdir -p secrets
chmod 700 secrets

test -f .env || cp .env.example .env
test -f secrets/postgres_password.txt || openssl rand -base64 32 > secrets/postgres_password.txt
test -f secrets/n8n_encryption_key.txt || openssl rand -base64 32 > secrets/n8n_encryption_key.txt
test -f secrets/n8n_runner_token.txt || openssl rand -base64 32 > secrets/n8n_runner_token.txt
chmod 600 secrets/*.txt
```

Review `.env` manually. Do not use production secrets from chat logs, backup-code files, or committed files.

### 3. Run Preflight

```bash
cd /opt/sirinx
bash infra/scripts/server-preflight.sh
```

### 3A. Receiver Bootstrap

Use the receiver bootstrap to prepare `.env`, secret placeholders, and the rendered reverse-proxy config before local staging:

```bash
cd /opt/sirinx
bash infra/scripts/server-receiver-install.sh
```

If the approved public FQDN is `www.sirin.co` instead of the canonical `sirinx.co` example:

```bash
cd /opt/sirinx
PUBLIC_PRIMARY_HOST=www.sirin.co \
PUBLIC_SERVER_ALIASES="sirin.co" \
TLS_CERT_BASENAME=sirin.co \
bash infra/scripts/server-receiver-install.sh
```

### 4. Start Staging Container On Target Server

```bash
cd /opt/sirinx
docker compose -f docker-compose.yml up -d sirinx-redis sirinx-public
docker compose -f docker-compose.yml ps
bash infra/scripts/server-cutover-smoke.sh http://127.0.0.1:3000/
```

### 5. Prepare Reverse Proxy

Use `infra/nginx/sirinx.co.conf.example` as the canonical example or `infra/nginx/public-site.conf.template` via `infra/scripts/render-public-site-config.sh` for an approved host override, then validate:

```bash
sudo nginx -t
```

Do not reload the public reverse proxy until approval is signed.

### 6. Final Cutover Gate

Before DNS or reverse proxy cutover, confirm:

- Approval packet accepted: `governance/APPROVAL_PACKET_GO_LIVE_HANDOFF_2026-04-23.md`
- Rollback target known.
- TLS certificate valid.
- Target smoke passes locally.
- No CHOKMA/gambling content appears in the rendered HTML.
- Human operator approves the final route.

### 7. Post-Cutover Smoke

```bash
cd /opt/sirinx
bash infra/scripts/server-cutover-smoke.sh https://sirinx.co/
```

Save the output with the deployment evidence.

## Rollback

If cutover fails, restore the previous reverse proxy or DNS route first, then stop the new target stack:

```bash
cd /opt/sirinx
docker compose -f docker-compose.yml stop sirinx-public
docker compose -f docker-compose.yml ps
```

If the target app itself fails before public cutover, keep DNS unchanged and stop the target container:

```bash
cd /opt/sirinx
docker compose -f docker-compose.yml stop sirinx-public
```

## Audit Trail

Collect:

- current commit: `git rev-parse HEAD`
- worktree status: `git status --short`
- preflight output
- compose config output
- container status
- local target smoke output
- reverse proxy validation output
- public post-cutover smoke output
- DNS before/after state

## Handoff Status

Ready for target-server operator execution, pending human approval and server-local secrets. This document is not itself approval to cut over live traffic.
