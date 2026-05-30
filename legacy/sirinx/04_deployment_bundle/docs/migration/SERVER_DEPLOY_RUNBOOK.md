# SIRINX Server Deploy Runbook

## Goal

Bring the recovered SIRINX website online on a controlled server without changing DNS or production traffic until approval is complete.

## Recommended Source Delivery Model

Use the reviewed handoff bundle for governance review and either:

- approved Git source sync
- or a governed source snapshot built from the canonical workstation

Do not try to boot the public app from the handoff bundle alone.

## Go-Live Handoff

Use `docs/migration/GO_LIVE_HANDOFF_2026-04-23.md` as the operator-facing live handoff. Use `governance/APPROVAL_PACKET_GO_LIVE_HANDOFF_2026-04-23.md` as the approval gate before DNS, TLS, or reverse-proxy cutover.

## Server Prerequisites

- Ubuntu/Debian server with Docker Engine and Docker Compose plugin.
- Git access to the SIRINX repository.
- Reverse proxy prepared but not cut over.
- Server-local `.env` and `secrets/*.txt` files created outside source control.

## First-Time Server Bootstrap

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

mkdir -p secrets
chmod 700 secrets

test -f .env || cp .env.example .env
test -f secrets/postgres_password.txt || openssl rand -base64 32 > secrets/postgres_password.txt
test -f secrets/n8n_encryption_key.txt || openssl rand -base64 32 > secrets/n8n_encryption_key.txt
test -f secrets/n8n_runner_token.txt || openssl rand -base64 32 > secrets/n8n_runner_token.txt
chmod 600 secrets/*.txt
```

## Preferred Server Continuation Flow

If the server can pull from the approved canonical source:

```bash
cd /opt/sirinx
APP_DIR=/opt/sirinx \
REPO_URL=<approved_git_url> \
REPO_BRANCH=main \
bash infra/scripts/server-source-sync.sh
```

If the server receives a governed source snapshot instead:

```bash
mkdir -p /opt/sirinx
cd /opt/sirinx
unzip /tmp/SIRINX_SOURCE_SNAPSHOT_<STAMP>.zip
```

Then run the governed receiver bootstrap:

```bash
cd /opt/sirinx
bash infra/scripts/server-receiver-install.sh
```

To stage the public app locally on the server without public cutover:

```bash
cd /opt/sirinx
SIRINX_STAGE_PUBLIC=1 bash infra/scripts/server-receiver-install.sh
```

If the approved public FQDN for this rollout is `www.sirin.co`, render the receiver config with the approved host override:

```bash
cd /opt/sirinx
PUBLIC_PRIMARY_HOST=www.sirin.co \
PUBLIC_SERVER_ALIASES="sirin.co" \
TLS_CERT_BASENAME=sirin.co \
SIRINX_STAGE_PUBLIC=1 \
bash infra/scripts/server-receiver-install.sh
```

## Pre-Deploy Validation

```bash
cd /opt/sirinx
bash infra/scripts/server-preflight.sh
bash infra/scripts/deploy-handshake.sh
docker compose -f docker-compose.yml config
```

## Staging Start

```bash
cd /opt/sirinx
docker compose -f docker-compose.yml build sirinx-public
docker compose -f docker-compose.yml up -d sirinx-redis sirinx-public
docker compose -f docker-compose.yml ps
curl -fsS http://127.0.0.1:3000/ | head -c 500
bash infra/scripts/server-cutover-smoke.sh http://127.0.0.1:3000/
```

## Brand Smoke

```bash
cd /opt/sirinx
HTML="$(curl -fsS http://127.0.0.1:3000/)"
printf "%s" "$HTML" | grep -qi "sirinx"
! printf "%s" "$HTML" | grep -Eqi "casino|gambling|lottery|chokma|บาคาร่า|พนัน|หวย"
bash infra/scripts/server-cutover-smoke.sh http://127.0.0.1:3000/
```

## Reverse Proxy Template

Use `infra/nginx/sirinx.co.conf.example` as the canonical example or `infra/nginx/public-site.conf.template` via `infra/scripts/render-public-site-config.sh` for an approved host override. Validate with:

```bash
sudo nginx -t
```

## Optional Automation Profile

Enable only after public site is stable and approved.

```bash
cd /opt/sirinx
docker compose -f docker-compose.yml --profile automation up -d n8n-main n8n-worker n8n-runner
docker compose -f docker-compose.yml --profile automation ps
```

## Rollback

```bash
cd /opt/sirinx
docker compose -f docker-compose.yml stop sirinx-public
git log --oneline -5
git checkout <last-known-good-commit>
docker compose -f docker-compose.yml build sirinx-public
docker compose -f docker-compose.yml up -d sirinx-public
curl -fsS http://127.0.0.1:3000/ >/dev/null
```

## Cutover Gate

Do not point `sirinx.co` to this server until:

- Approval packet is accepted.
- Brand smoke passes.
- Rollback target is known.
- TLS is valid.
- Human operator confirms the final route.
