#!/usr/bin/env bash
# Launch every SIRINX system agent inside one terminal-multiplexer
# session so a node runs the whole stack in a single supervised app.
#
# Works with tmux out of the box; point MUX_BIN at a tmux-compatible
# binary (psmux, cmux) to use another multiplexer.
#
# Usage:
#   SIRINX_ROOT=$HOME/SIRINX_OS ./scripts/agents-mux.sh          # start
#   ./scripts/agents-mux.sh attach                               # attach
#   ./scripts/agents-mux.sh stop                                 # kill session
#
# Windows created (only for components present on the node):
#   web        — sirinx-web Rust service (this repo)
#   dashboard  — Hermes dev dashboard (sirinx-os repo)
#   control    — Hermes control API health loop (sirinx-os repo)
#   telegram   — telegram command bot, dry-run only (this repo)
#   audit      — pipeline audit loop (this repo)

set -euo pipefail

MUX_BIN="${MUX_BIN:-tmux}"
SESSION="${SIRINX_MUX_SESSION:-sirinx-agents}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SIRINX_ROOT="${SIRINX_ROOT:-$(dirname "$REPO_ROOT")}"

command -v "$MUX_BIN" >/dev/null 2>&1 || {
    echo "error: multiplexer '$MUX_BIN' not found (set MUX_BIN)" >&2
    exit 1
}

case "${1:-start}" in
attach)
    exec "$MUX_BIN" attach -t "$SESSION"
    ;;
stop)
    "$MUX_BIN" kill-session -t "$SESSION"
    echo "session '$SESSION' stopped"
    exit 0
    ;;
start) ;;
*)
    echo "usage: $0 [start|attach|stop]" >&2
    exit 1
    ;;
esac

if "$MUX_BIN" has-session -t "$SESSION" 2>/dev/null; then
    echo "session '$SESSION' already running — attach with: $0 attach"
    exit 0
fi

# Window 1: Rust web service (in-memory unless DATABASE_URL is exported).
"$MUX_BIN" new-session -d -s "$SESSION" -n web -c "$REPO_ROOT"
"$MUX_BIN" send-keys -t "$SESSION:web" "cargo run -p sirinx-web" C-m

# Window 2: Hermes dashboard, when the sirinx-os checkout exists.
if [ -d "$SIRINX_ROOT/sirinx-os" ]; then
    "$MUX_BIN" new-window -t "$SESSION" -n dashboard -c "$SIRINX_ROOT/sirinx-os"
    "$MUX_BIN" send-keys -t "$SESSION:dashboard" "pnpm dashboard:run" C-m

    "$MUX_BIN" new-window -t "$SESSION" -n control -c "$SIRINX_ROOT/sirinx-os"
    "$MUX_BIN" send-keys -t "$SESSION:control" \
        "while true; do curl -fsS http://127.0.0.1:8711/health || true; sleep 30; done" C-m
fi

# Window 3: telegram command bot — dry-run only, per repo governance.
"$MUX_BIN" new-window -t "$SESSION" -n telegram -c "$REPO_ROOT"
"$MUX_BIN" send-keys -t "$SESSION:telegram" "npm run telegram:bot:dry-run" C-m

# Window 4: pipeline audit on a slow loop.
"$MUX_BIN" new-window -t "$SESSION" -n audit -c "$REPO_ROOT"
"$MUX_BIN" send-keys -t "$SESSION:audit" \
    "while true; do npm run pipeline:audit || true; sleep 900; done" C-m

"$MUX_BIN" select-window -t "$SESSION:web"
echo "session '$SESSION' started via $MUX_BIN — attach with: $0 attach"
