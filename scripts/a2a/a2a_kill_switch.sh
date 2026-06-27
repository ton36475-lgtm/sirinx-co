#!/usr/bin/env bash
set -euo pipefail

RUNTIME_ROOT="${A2A_RUNTIME_ROOT:-$HOME/SIRINXDev/.ghostclaw_runtime/a2async}"
KILL_DIR="$RUNTIME_ROOT/kill_switch"
STOP_FILE="$KILL_DIR/STOP_ALL"

mkdir -p "$KILL_DIR"

case "${1:-status}" in
  on)
    printf 'STOP_ALL\n' > "$STOP_FILE"
    echo "A2A kill switch: on"
    ;;
  off)
    rm -f "$STOP_FILE"
    echo "A2A kill switch: off"
    ;;
  status)
    if [ -f "$STOP_FILE" ]; then
      echo "A2A kill switch: on"
      exit 2
    fi
    echo "A2A kill switch: off"
    ;;
  *)
    echo "usage: $0 [on|off|status]" >&2
    exit 64
    ;;
esac
