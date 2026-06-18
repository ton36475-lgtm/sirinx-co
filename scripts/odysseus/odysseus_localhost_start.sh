#!/usr/bin/env bash
set -u

# Approved-use-only Odysseus localhost starter.
# Verifies local-only settings and asks for confirmation before Docker start.

ODYSSEUS_DIR="${ODYSSEUS_DIR:-/Users/sirinx/SIRINXDev/_external_repos/odysseus}"

if [ ! -d "$ODYSSEUS_DIR" ]; then
  printf 'missing Odysseus directory: %s\n' "$ODYSSEUS_DIR" >&2
  exit 1
fi

cd "$ODYSSEUS_DIR" || exit 1

if [ ! -f .env ]; then
  printf 'missing .env. Create it manually first:\n'
  printf '  cd %s && cp .env.example .env\n' "$ODYSSEUS_DIR"
  exit 1
fi

if grep -Eq '^[[:space:]]*APP_BIND[[:space:]]*=[[:space:]]*0\.0\.0\.0' .env; then
  printf 'blocked: APP_BIND=0.0.0.0 detected in .env\n' >&2
  exit 2
fi

if grep -Eq '^[[:space:]]*AUTH_ENABLED[[:space:]]*=[[:space:]]*false' .env; then
  printf 'blocked: AUTH_ENABLED=false detected in .env\n' >&2
  exit 2
fi

APP_PORT="$(grep -E '^[[:space:]]*APP_PORT[[:space:]]*=' .env | tail -1 | sed 's/.*=//; s/[[:space:]]//g')"
[ -n "$APP_PORT" ] || APP_PORT="7000"

printf 'Odysseus directory: %s\n' "$ODYSSEUS_DIR"
printf 'Planned URL: http://localhost:%s\n' "$APP_PORT"
printf 'Type APPROVE_ODYSSEUS_LOCALHOST_START to run docker compose: '
read -r answer

if [ "$answer" != "APPROVE_ODYSSEUS_LOCALHOST_START" ]; then
  printf 'aborted: approval phrase not provided\n' >&2
  exit 3
fi

docker compose up -d --build
printf 'Odysseus should be available at http://localhost:%s\n' "$APP_PORT"
printf 'View logs with: docker compose logs --tail=120 odysseus\n'
