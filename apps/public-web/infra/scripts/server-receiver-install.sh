#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${APP_DIR:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi
cd "$ROOT"

STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
ARTIFACT_DIR="$ROOT/artifacts/receiver-install/$STAMP"
mkdir -p "$ARTIFACT_DIR"

echo "SIRINX server receiver install" | tee "$ARTIFACT_DIR/summary.log"
echo "root=$ROOT" | tee -a "$ARTIFACT_DIR/summary.log"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing required command: $1" >&2
    return 1
  fi
}

need_file() {
  if [ ! -f "$1" ]; then
    echo "missing required file: $1" >&2
    return 1
  fi
}

generate_secret_file() {
  target="$1"
  if [ -f "$target" ]; then
    return 0
  fi

  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 32 > "$target"
  elif command -v python3 >/dev/null 2>&1; then
    python3 - <<'PY' > "$target"
import secrets
print(secrets.token_urlsafe(32))
PY
  else
    echo "missing openssl/python3 for secret generation: $target" >&2
    return 1
  fi
}

need_cmd docker
need_cmd curl
need_cmd bash

need_file package.json
need_file docker-compose.yml
need_file infra/docker/Dockerfile.sirinx
need_file infra/scripts/server-preflight.sh
need_file infra/scripts/server-cutover-smoke.sh
need_file infra/scripts/server-source-sync.sh
need_file infra/scripts/render-public-site-config.sh
need_file infra/scripts/hermes-brain-bootstrap.sh
need_file infra/scripts/db-ops-preflight.sh
need_file infra/nginx/public-site.conf.template
need_file docs/migration/HERMES_AGENT_SERVER_CONTINUATION_PACKET.md
need_file docs/migration/SERVER_RECEIVER_BOOTSTRAP_GUIDE.md
need_file docs/migration/HERMES_DATABASE_BRAIN_SETUP_RUNBOOK.md
need_file knowledge/shadow-vault/BRAIN_SKILL_BOOTSTRAP_PROTOCOL.md

if [ ! -d client ] || [ ! -d server ] || [ ! -f vite.config.ts ]; then
  echo "full source tree not found in $ROOT" | tee -a "$ARTIFACT_DIR/summary.log"
  echo "sync the canonical repo or extract the governed source snapshot before staging containers" | tee -a "$ARTIFACT_DIR/summary.log"
  exit 1
fi

mkdir -p secrets artifacts
chmod 700 secrets

if [ ! -f .env ]; then
  cp .env.example .env
  echo "created .env from .env.example" | tee -a "$ARTIFACT_DIR/summary.log"
fi

for secret_file in secrets/postgres_password.txt secrets/n8n_encryption_key.txt secrets/n8n_runner_token.txt; do
  generate_secret_file "$secret_file"
  chmod 600 "$secret_file"
done

echo "rendering public site config..." | tee -a "$ARTIFACT_DIR/summary.log"
bash infra/scripts/render-public-site-config.sh | tee "$ARTIFACT_DIR/render-public-site-config.log"

echo "docker compose config..." | tee -a "$ARTIFACT_DIR/summary.log"
docker compose -f docker-compose.yml config > "$ARTIFACT_DIR/docker-compose-config.yml"

if [ "${SIRINX_STAGE_HERMES:-1}" = "1" ]; then
  echo "bootstrapping Hermes brain skill runtime..." | tee -a "$ARTIFACT_DIR/summary.log"
  bash infra/scripts/hermes-brain-bootstrap.sh | tee "$ARTIFACT_DIR/hermes-brain-bootstrap.log"
else
  echo "Hermes brain bootstrap skipped; set SIRINX_STAGE_HERMES=1 to stage brain skills and starter packets" | tee -a "$ARTIFACT_DIR/summary.log"
fi

if [ "${SIRINX_STAGE_PUBLIC:-0}" = "1" ]; then
  echo "staging public runtime..." | tee -a "$ARTIFACT_DIR/summary.log"
  docker compose -f docker-compose.yml up -d --build sirinx-redis sirinx-public | tee "$ARTIFACT_DIR/public-up.log"
  bash infra/scripts/server-cutover-smoke.sh http://127.0.0.1:3000/ | tee "$ARTIFACT_DIR/public-smoke.json"
else
  echo "public runtime staging skipped; set SIRINX_STAGE_PUBLIC=1 to build and start sirinx-public locally on the server" | tee -a "$ARTIFACT_DIR/summary.log"
fi

if [ "${SIRINX_STAGE_AUTOMATION:-0}" = "1" ]; then
  echo "staging automation profile..." | tee -a "$ARTIFACT_DIR/summary.log"
  docker compose -f docker-compose.yml --profile automation up -d sirinx-postgres n8n-main n8n-worker n8n-runner | tee "$ARTIFACT_DIR/automation-up.log"
else
  echo "automation profile skipped; keep it disabled until PostgreSQL/pgvector approval and secret review are complete" | tee -a "$ARTIFACT_DIR/summary.log"
fi

cat <<'EOF' | tee -a "$ARTIFACT_DIR/summary.log"

Receiver install complete.
This script does not change DNS, install TLS, or reload the public reverse proxy.
Review the generated nginx file under infra/nginx/generated/ before copying it into the live reverse-proxy path.
Hermes brain skill runtime and starter packets are staged for governed continuation.
EOF
