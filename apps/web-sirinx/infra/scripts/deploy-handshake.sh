#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="$ROOT_DEFAULT"
if [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi
cd "$ROOT"

STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
ARTIFACT_DIR="$ROOT/artifacts/deploy-handshake/$STAMP"
mkdir -p "$ARTIFACT_DIR"

run_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    pnpm "$@"
  elif command -v cmd.exe >/dev/null 2>&1 && command -v corepack.cmd >/dev/null 2>&1; then
    cmd.exe /C corepack pnpm "$@"
  elif command -v corepack >/dev/null 2>&1; then
    corepack pnpm "$@"
  else
    echo "pnpm/corepack not found" >&2
    return 127
  fi
}

echo "SIRINX deploy handshake: $STAMP" | tee "$ARTIFACT_DIR/summary.log"

echo "1/6 Checking required files..." | tee -a "$ARTIFACT_DIR/summary.log"
test -f package.json
test -f docker-compose.yml
test -f infra/docker/Dockerfile.sirinx
test -f infra/scripts/server-source-sync.sh
test -f infra/scripts/server-receiver-install.sh
test -f infra/scripts/render-public-site-config.sh
test -f infra/nginx/public-site.conf.template
test -f governance/APPROVAL_PACKET_V15_SERVER_PREP.md

echo "2/6 Checking secret hygiene..." | tee -a "$ARTIFACT_DIR/summary.log"
if find . -path ./.git -prune -o -type f \( -name ".env" -o \( -path "./secrets/*" ! -name ".gitignore" \) \) -print | grep -q .; then
  echo "Found local secret files. This is allowed locally, but they must not be committed." | tee -a "$ARTIFACT_DIR/summary.log"
fi

echo "3/6 TypeScript check..." | tee -a "$ARTIFACT_DIR/summary.log"
run_pnpm run check 2>&1 | tee "$ARTIFACT_DIR/check.log"

echo "4/6 Test suite..." | tee -a "$ARTIFACT_DIR/summary.log"
run_pnpm run test 2>&1 | tee "$ARTIFACT_DIR/test.log"

echo "5/6 Production build..." | tee -a "$ARTIFACT_DIR/summary.log"
run_pnpm run build 2>&1 | tee "$ARTIFACT_DIR/build.log"

echo "6/6 Docker Compose render..." | tee -a "$ARTIFACT_DIR/summary.log"
if command -v docker >/dev/null 2>&1; then
  set +e
  docker compose -f docker-compose.yml config 2>&1 | tee "$ARTIFACT_DIR/docker-compose-config.log"
  docker_status="${PIPESTATUS[0]}"
  set -e
  if [ "$docker_status" -ne 0 ]; then
    echo "Docker Compose render could not run on this shell. Treat as environment warning, not a source failure." | tee -a "$ARTIFACT_DIR/summary.log"
  fi
else
  echo "Docker CLI not found. Skipping compose render on this host." | tee "$ARTIFACT_DIR/docker-compose-config.log"
fi

cat <<'EOF' | tee -a "$ARTIFACT_DIR/summary.log"

Handshake complete.
This script does not cut over DNS, change reverse proxies, enable PostgreSQL live migration, or start production traffic.
Human approval is still required before server cutover.
EOF
