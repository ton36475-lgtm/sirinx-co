#!/usr/bin/env bash
set -euo pipefail

runtime_root="${GHOSTCLAW_RUNTIME_ROOT:-$HOME/SIRINXDev/.ghostclaw_runtime}"
switch_dir="$runtime_root/kill_switch"
switch_file="$switch_dir/STOP_ALL"
cmd="${1:-status}"

mkdir -p "$switch_dir"

case "$cmd" in
  on)
    date -u +"%Y-%m-%dT%H:%M:%SZ" > "$switch_file"
    echo "kill_switch=on"
    ;;
  off)
    rm -f "$switch_file"
    echo "kill_switch=off"
    ;;
  status)
    if [[ -f "$switch_file" ]]; then
      echo "kill_switch=on"
    else
      echo "kill_switch=off"
    fi
    ;;
  *)
    echo "usage: $0 on|off|status" >&2
    exit 2
    ;;
esac
