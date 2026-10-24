#!/bin/bash
# WhatsApp bridge launcher for ai.hermes.whatsapp-bridge (launchd).
#
# Parks instead of crash-looping: the bridge cannot start without a paired
# session, and `WHATSAPP_ENABLED=false`/a logged-out `creds.json` is exactly the
# state that produced 61 exit-1 retries on 2026-10-24. A clean exit parks the job
# (KeepAlive: SuccessfulExit=false), so nothing respawns until someone pairs.
#
# When it does run, the bridge is started with the same argv the Hermes adapter
# uses (`node bridge.js --port 3000 --session <dir> --mode self-chat`), and the
# adapter's `_reuse_running_bridge` adopts it over /health instead of spawning a
# second one (adapter.py: `Disconnecting (external bridge left running)`).
set -u

HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
SESSION="$HERMES_HOME/whatsapp/session"
BRIDGE="$HERMES_HOME/hermes-agent/scripts/whatsapp-bridge/bridge.js"
PORT="${WHATSAPP_BRIDGE_PORT:-3000}"
MODE="${WHATSAPP_MODE:-self-chat}"

log() { printf '%s whatsapp-bridge-launchd: %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

if [ -f "$HERMES_HOME/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$HERMES_HOME/.env" >/dev/null 2>&1 || true
  set +a
fi

flag="$(printf '%s' "${WHATSAPP_ENABLED:-}" | tr '[:upper:]' '[:lower:]')"
case "$flag" in
  true|1|yes) ;;
  *) log "parked: WHATSAPP_ENABLED=${WHATSAPP_ENABLED:-unset}"; exit 0 ;;
esac

if [ ! -s "$SESSION/creds.json" ]; then
  log "parked: no WhatsApp session at $SESSION (pair with: hermes whatsapp)"
  exit 0
fi

if [ ! -f "$BRIDGE" ]; then
  log "missing bridge script: $BRIDGE"
  exit 1
fi

node_bin="$(command -v node 2>/dev/null || true)"
if [ -z "$node_bin" ]; then
  for candidate in "$HERMES_HOME/node/bin/node" "$HERMES_HOME"/tools/node-*/bin/node; do
    if [ -x "$candidate" ]; then node_bin="$candidate"; break; fi
  done
fi
if [ -z "$node_bin" ]; then
  log "node not found; run: hermes pm install node"
  exit 1
fi

log "starting bridge on :$PORT (mode=$MODE)"
exec "$node_bin" "$BRIDGE" --port "$PORT" --session "$SESSION" --mode "$MODE"
