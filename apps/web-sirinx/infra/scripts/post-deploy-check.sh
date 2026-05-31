#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${1:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(pwd)"
fi
cd "$ROOT"

fail() {
  echo "POST_DEPLOY_FAIL: $*" >&2
  exit 1
}

BASE_URL="${POST_DEPLOY_URL:-${DEPLOY_BASE_URL:-}}"
[ -n "$BASE_URL" ] || fail "POST_DEPLOY_URL or DEPLOY_BASE_URL is required"

HEALTH_PATH="${POST_DEPLOY_HEALTH_PATH:-/}"
CHECK_URL="${BASE_URL%/}${HEALTH_PATH}"

python_cmd=""
if command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
  python_cmd="python"
elif command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  python_cmd="python3"
elif command -v py >/dev/null 2>&1; then
  python_cmd="py"
fi
[ -n "$python_cmd" ] || fail "python runtime not found"

http_code=""
if command -v curl >/dev/null 2>&1; then
  http_code="$(curl -sS -o /dev/null -w '%{http_code}' "$CHECK_URL" || true)"
else
  http_code="$("$python_cmd" - <<PY
import urllib.request
import urllib.error
url = "${CHECK_URL}"
try:
    with urllib.request.urlopen(url, timeout=10) as resp:
        print(resp.status)
except urllib.error.HTTPError as exc:
    print(exc.code)
except Exception:
    print("000")
PY
)"
fi

[ -n "$http_code" ] || fail "no HTTP status received from ${CHECK_URL}"
[ "$http_code" != "000" ] || fail "server unreachable: ${CHECK_URL}"
case "$http_code" in
  5*) fail "server returned ${http_code} at ${CHECK_URL}" ;;
esac

ENV_SNAPSHOT="${POST_DEPLOY_ENV_SNAPSHOT:-}"
if [ -n "$ENV_SNAPSHOT" ]; then
  [ -f "$ENV_SNAPSHOT" ] || fail "POST_DEPLOY_ENV_SNAPSHOT missing: ${ENV_SNAPSHOT}"
  [ -s "$ENV_SNAPSHOT" ] || fail "POST_DEPLOY_ENV_SNAPSHOT empty: ${ENV_SNAPSHOT}"
  for key in PORT PUBLIC_PRIMARY_HOST OPS_PUBLIC_HOST TLS_CERT_BASENAME DATABASE_URL; do
    grep -Eq "^${key}=" "$ENV_SNAPSHOT" || fail "deployed env snapshot missing key: ${key}"
  done
fi

LOG_SNAPSHOT="${POST_DEPLOY_LOG_SNAPSHOT:-}"
if [ -n "$LOG_SNAPSHOT" ]; then
  [ -f "$LOG_SNAPSHOT" ] || fail "POST_DEPLOY_LOG_SNAPSHOT missing: ${LOG_SNAPSHOT}"
  [ -s "$LOG_SNAPSHOT" ] || fail "POST_DEPLOY_LOG_SNAPSHOT empty: ${LOG_SNAPSHOT}"
  if grep -Eiq '(UnhandledPromiseRejection|uncaughtException|EADDRINUSE|Error: listen|FATAL|panic)' "$LOG_SNAPSHOT"; then
    fail "fatal runtime signature found in deployed log snapshot"
  fi
fi

echo "post-deploy-check: ok (${CHECK_URL})"
