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
  echo "SMOKE_TEST_FAIL: $*" >&2
  exit 1
}

run_pnpm() {
  if command -v pnpm >/dev/null 2>&1 && pnpm --version >/dev/null 2>&1; then
    pnpm "$@"
  elif command -v cmd.exe >/dev/null 2>&1 && cmd.exe /C corepack pnpm --version >/dev/null 2>&1; then
    cmd.exe /C corepack pnpm "$@"
  elif command -v corepack >/dev/null 2>&1 && corepack --version >/dev/null 2>&1; then
    corepack pnpm "$@"
  else
    fail "pnpm/corepack not executable in this shell"
  fi
}

python_cmd=""
if command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
  python_cmd="python"
elif command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  python_cmd="python3"
elif command -v py >/dev/null 2>&1; then
  python_cmd="py"
fi
[ -n "$python_cmd" ] || fail "python runtime not found"

PORT="${SMOKE_PORT:-3010}"
SMOKE_URL="${SMOKE_URL:-http://127.0.0.1:${PORT}/}"
LOG_DIR="artifacts/smoke-test"
LOG_FILE="${LOG_DIR}/smoke-test.log"
PID_FILE="${LOG_DIR}/smoke-test.pid"
mkdir -p "$LOG_DIR"
: > "$LOG_FILE"

"$python_cmd" - <<PY
import socket
port = int("${PORT}")
sock = socket.socket()
try:
    sock.bind(("127.0.0.1", port))
finally:
    sock.close()
PY

cleanup() {
  if [ -f "$PID_FILE" ]; then
    pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "${pid:-}" ] && kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
      wait "$pid" >/dev/null 2>&1 || true
    fi
    rm -f "$PID_FILE"
  fi
}
trap cleanup EXIT

run_pnpm run build >/dev/null

PORT="$PORT" NODE_ENV=production node dist/index.js >"$LOG_FILE" 2>&1 &
server_pid=$!
echo "$server_pid" > "$PID_FILE"

endpoint_ok="false"
for _ in $(seq 1 30); do
  if ! kill -0 "$server_pid" >/dev/null 2>&1; then
    fail "server process exited before endpoint became ready"
  fi
  if command -v curl >/dev/null 2>&1; then
    if curl -fsS "$SMOKE_URL" >/dev/null 2>&1; then
      endpoint_ok="true"
      break
    fi
  else
    if "$python_cmd" - <<PY
import urllib.request
urllib.request.urlopen("${SMOKE_URL}", timeout=2).read(1)
PY
    then
      endpoint_ok="true"
      break
    fi
  fi
  sleep 1
done

[ "$endpoint_ok" = "true" ] || fail "main endpoint did not respond: ${SMOKE_URL}"

sleep 10

kill -0 "$server_pid" >/dev/null 2>&1 || fail "server crashed during first 10 seconds"
[ -s "$LOG_FILE" ] || fail "no logs were generated"

if grep -Eiq '(UnhandledPromiseRejection|uncaughtException|EADDRINUSE|Error: listen|FATAL|panic|address already in use)' "$LOG_FILE"; then
  fail "fatal runtime signature found in smoke log: $LOG_FILE"
fi

echo "smoke-test: ok (${SMOKE_URL})"
