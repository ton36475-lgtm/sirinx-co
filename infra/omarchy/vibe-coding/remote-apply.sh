#!/usr/bin/env bash
# =============================================================================
# Run the Omarchy vibe-coding bundle on the node, over Tailscale SSH.
#
#   bash remote-apply.sh --user=<os-user> --preview     # copy + preview only
#   bash remote-apply.sh --user=<os-user> --apply       # preview, apply, verify
#   bash remote-apply.sh --user=<os-user> --verify      # check an applied install
#   bash remote-apply.sh --user=<os-user> --rollback    # unwind recorded runs
#
# Dry run by default: without --apply nothing is written on the node.
#
# Guarantees:
#   * refuses to continue when the tailnet SSH policy denies the session
#     (prints the policy hint instead of looking like a settings failure);
#   * copies the bundle to a cache dir on the node, never the repo;
#   * runs the bundle's own apply.sh, so its backups, marker merges, version
#     gate and --rollback semantics are the ones that take effect;
#   * no sudo, no package install, no tailnet change, no secret, no deploy.
# =============================================================================
set -euo pipefail

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST="100.87.189.34"
REMOTE_USER=""
PORT="22"
MODE="preview"
FORCE_VERSION=""

for arg in "$@"; do
  case "$arg" in
    --host=*) HOST="${arg#*=}" ;;
    --user=*) REMOTE_USER="${arg#*=}" ;;
    --port=*) PORT="${arg#*=}" ;;
    --preview) MODE="preview" ;;
    --apply) MODE="apply" ;;
    --verify) MODE="verify" ;;
    --rollback) MODE="rollback" ;;
    --force-version=*) FORCE_VERSION="${arg#*=}" ;;
    -h|--help) sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf 'remote-apply.sh: unknown argument %s (try --help)\n' "$arg" >&2; exit 2 ;;
  esac
done

[ -n "$REMOTE_USER" ] || { printf 'remote-apply.sh: --user=<os-user on the node> is required\n' >&2; exit 2; }

# No LogLevel=ERROR here: ssh prints the tailscale policy refusal at the default
# level only, and the preflight below greps for exactly that line.
SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=8 -o ConnectionAttempts=1
          -o StrictHostKeyChecking=accept-new -p "$PORT")
REMOTE="$REMOTE_USER@$HOST"
REMOTE_DIR='${HOME}/.cache/sirinx-vibe-bundle'

say() { printf '%s\n' "$*"; }

# --- 1. preflight: can we even open a session? -------------------------------
probe=$(ssh "${SSH_OPTS[@]}" "$REMOTE" 'id -un; . /etc/os-release 2>/dev/null && echo "$PRETTY_NAME"' </dev/null 2>&1) || {
  printf '\nSSH preflight failed for %s:\n  %s\n\n' "$REMOTE" "$(printf '%s' "$probe" | head -3 | tr '\n' ' ')"
  if printf '%s' "$probe" | grep -q 'tailnet policy does not permit'; then
    say "This is the tailnet SSH policy (action holdAndDelegate at an unused URL), not the bundle."
    say "Patch + verification steps: infra/omarchy/TAILNET_SSH_ACCESS.md"
    exit 3
  fi
  exit 4
}

say "remote: $REMOTE"
say "$(printf '%s' "$probe" | sed 's/^/  /')"

# --- 2. which Omarchy era is on the node? ------------------------------------
era=$(ssh "${SSH_OPTS[@]}" "$REMOTE" 'if [ -f "$HOME/.config/hypr/hyprland.lua" ]; then echo v4; elif [ -f "$HOME/.config/hypr/hyprland.conf" ]; then echo v3; else echo unknown; fi' </dev/null)
say "hyprland era: $era"
if [ "$era" = "v3" ]; then
  say "node is Omarchy v3 (.conf); the bundle writes Lua and would be inert — refusing."
  exit 5
fi
if [ "$era" = "unknown" ]; then
  say "cannot detect the Hyprland config era; pass a host that has ~/.config/hypr/{hyprland.lua,hyprland.conf}"
  exit 5
fi

# --- 3. copy the bundle (cache dir only, never the repo) ---------------------
say "copying bundle -> $REMOTE_DIR"
ssh "${SSH_OPTS[@]}" "$REMOTE" "mkdir -p '$REMOTE_DIR'" </dev/null
for item in apply.sh dotfiles env; do
  [ -e "$BUNDLE_DIR/$item" ] || { say "missing $item next to remote-apply.sh"; exit 6; }
done
tar -C "$BUNDLE_DIR" -cf - apply.sh dotfiles env | ssh "${SSH_OPTS[@]}" "$REMOTE" "tar -C '$REMOTE_DIR' -xf -"

run_remote() { # $1 = label, rest = apply.sh args
  local label="$1"; shift
  say ""
  say "== $label =="
  ssh "${SSH_OPTS[@]}" "$REMOTE" "cd '$REMOTE_DIR' && bash apply.sh $*" </dev/null
}

EXTRA=""
[ -n "$FORCE_VERSION" ] && EXTRA="--force-version=$FORCE_VERSION"

case "$MODE" in
  preview)
    run_remote "preview (nothing written)" $EXTRA
    say ""
    say "preview complete. Re-run with --apply to write to \$HOME on the node."
    ;;
  apply)
    run_remote "preview (nothing written)" $EXTRA
    run_remote "apply" "--apply $EXTRA"
    run_remote "verify" "--verify"
    ;;
  verify)
    run_remote "verify" "--verify"
    ;;
  rollback)
    run_remote "rollback (unwinds every recorded run, newest first)" "--rollback --apply"
    ;;
esac
