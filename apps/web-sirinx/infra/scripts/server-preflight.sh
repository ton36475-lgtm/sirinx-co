#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${APP_DIR:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi
cd "$ROOT"

echo "SIRINX server preflight"
echo "root=$ROOT"

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

need_cmd docker
need_cmd curl

need_file package.json
need_file docker-compose.yml
need_file infra/docker/Dockerfile.sirinx
need_file infra/scripts/deploy-handshake.sh
need_file infra/scripts/server-source-sync.sh
need_file infra/scripts/server-receiver-install.sh
need_file infra/scripts/render-public-site-config.sh
need_file infra/scripts/server-cutover-smoke.sh
need_file infra/nginx/public-site.conf.template
need_file governance/APPROVAL_PACKET_GO_LIVE_HANDOFF_2026-04-23.md
need_file docs/migration/HERMES_AGENT_SERVER_CONTINUATION_PACKET.md
need_file docs/migration/SERVER_RECEIVER_BOOTSTRAP_GUIDE.md

if [ ! -f .env ]; then
  echo "missing server-local .env; create it from .env.example and fill approved values" >&2
  exit 1
fi

mkdir -p secrets
chmod 700 secrets

for secret_file in secrets/postgres_password.txt secrets/n8n_encryption_key.txt secrets/n8n_runner_token.txt; do
  if [ ! -f "$secret_file" ]; then
    echo "missing server-local secret file: $secret_file" >&2
    exit 1
  fi
  chmod 600 "$secret_file"
done

echo "git status:"
if [ -d .git ] && command -v git >/dev/null 2>&1; then
  git status --short
else
  echo "snapshot-backed source detected; git status skipped"
fi

echo "docker compose config:"
docker compose -f docker-compose.yml config >/tmp/sirinx-compose-config.out

echo "deployment handshake:"
bash infra/scripts/deploy-handshake.sh

echo "image build:"
docker compose -f docker-compose.yml build sirinx-public

echo "preflight complete"
echo "This script did not change DNS, TLS, reverse proxy routes, or production traffic."
