#!/usr/bin/env bash
# =============================================================================
# SIRINX Omarchy (Arch/Hyprland, optionally WSL2 on aiagent) -> tailnet join
#
# Run INSIDE the Omarchy machine:
#   bash omarchy_tailscale_join.sh
#   TS_AUTHKEY_FILE=/run/sirinx/ts.key bash omarchy_tailscale_join.sh   # non-interactive
#
# This script does one thing: make the Omarchy host a normal, non-routing
# tailnet member. It never sets an exit node, never advertises subnet routes,
# never enables Funnel, and never writes a key to disk or to the repo.
#
# Env (all optional):
#   TS_HOSTNAME      tailnet name            default omarchy-<short hostname>
#   TS_AUTHKEY_FILE  file holding a key      default unset -> interactive login URL
#   TS_AUTHKEY       inline key (discouraged, visible in process args)
#   TS_TAGS          advertised tags         default none
#   TS_ACCEPT_DNS    accept tailnet DNS      default false (resolved/WSL owns DNS)
#   TS_SSH           enable tailnet SSH      default false
#   TS_ACCEPT_ROUTES accept advertised routes default false
# =============================================================================
set -euo pipefail

MAC_MINI_IP="100.90.189.112"
TS_HOSTNAME="${TS_HOSTNAME:-omarchy-$(hostname -s 2>/dev/null || echo node)}"
TS_ACCEPT_DNS="${TS_ACCEPT_DNS:-false}"
TS_SSH="${TS_SSH:-false}"
TS_ACCEPT_ROUTES="${TS_ACCEPT_ROUTES:-false}"

log() { printf '[omarchy-tailscale] %s\n' "$*"; }
die() { printf '[omarchy-tailscale] ERROR: %s\n' "$*" >&2; exit 1; }

[ "$(uname -s)" = "Linux" ] || die "this script targets the Omarchy Linux host, not $(uname -s)"

# --- 1. systemd -------------------------------------------------------------
if [ ! -d /run/systemd/system ]; then
  die "systemd is not PID 1. In WSL2 set 'systemd=true' under [boot] in /etc/wsl.conf, run 'wsl --shutdown' from Windows, then re-run."
fi

# --- 2. package -------------------------------------------------------------
if ! command -v tailscale >/dev/null 2>&1; then
  command -v pacman >/dev/null 2>&1 || die "pacman missing; install tailscale with your package manager first"
  log "installing tailscale via pacman"
  sudo pacman -S --needed --noconfirm tailscale
fi
command -v tailscale >/dev/null 2>&1 || die "tailscale binary still missing after install"
log "tailscale $(tailscale version | head -1)"

# --- 3. daemon --------------------------------------------------------------
sudo systemctl enable --now tailscaled >/dev/null 2>&1 || die "could not enable/start tailscaled"
log "tailscaled active: $(systemctl is-active tailscaled)"

# --- 4. join ----------------------------------------------------------------
args=(
  "--hostname=${TS_HOSTNAME}"
  "--accept-dns=${TS_ACCEPT_DNS}"
  "--accept-routes=${TS_ACCEPT_ROUTES}"
  "--ssh=${TS_SSH}"
)
[ -n "${TS_TAGS:-}" ] && args+=("--advertise-tags=${TS_TAGS}")

if [ -n "${TS_AUTHKEY_FILE:-}" ]; then
  [ -r "${TS_AUTHKEY_FILE}" ] || die "TS_AUTHKEY_FILE is not readable: ${TS_AUTHKEY_FILE}"
  args+=("--auth-key=file:${TS_AUTHKEY_FILE}")
elif [ -n "${TS_AUTHKEY:-}" ]; then
  log "WARNING: TS_AUTHKEY is visible in process args; prefer TS_AUTHKEY_FILE"
  args+=("--auth-key=${TS_AUTHKEY}")
else
  log "no key given -> tailscaled will print a login URL; approve it in a browser, then re-run verification below"
fi

log "joining as ${TS_HOSTNAME} (accept-dns=${TS_ACCEPT_DNS}, ssh=${TS_SSH}, accept-routes=${TS_ACCEPT_ROUTES})"
sudo tailscale up "${args[@]}"

# --- 5. verify --------------------------------------------------------------
state="$(sudo tailscale status --json | sed -n 's/.*"BackendState": *"\([^"]*\)".*/\1/p' | head -1)"
[ "${state}" = "Running" ] || die "BackendState=${state:-unknown}; open the login URL printed above and approve this node"
ip4="$(tailscale ip -4 2>/dev/null | head -1)"
log "BackendState=Running ip4=${ip4:-none}"

if [ -n "${ip4:-}" ]; then
  if timeout 20 tailscale ping --c 3 "${MAC_MINI_IP}" >/dev/null 2>&1; then
    log "reachable: macminisirinx ${MAC_MINI_IP}"
  else
    log "ping to ${MAC_MINI_IP} did not answer yet (relay/DERP or ACL) - check 'tailscale netcheck'"
  fi
fi

cat <<EOF

[omarchy-tailscale] node ready. No exit node, no subnet routes, no Funnel were configured.

Next, from the Mac mini (100.90.189.112):
  tailscale status | grep ${TS_HOSTNAME}
  tailscale ping ${TS_HOSTNAME}

Owner-side follow-ups that are NOT done by this script:
  - ACL/tag grant for this node in the tailnet policy
  - any worker enroll (a2a gateway :9005) needs its own ticket
EOF
