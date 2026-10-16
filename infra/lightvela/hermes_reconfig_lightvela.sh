#!/usr/bin/env bash
# =============================================================================
# Hermes reconfig for LightVela VM (vm-2-126-ubuntu / lightvela.ai node)
# Reconfig = ติดตั้ง hermes-agent runtime + เชื่อม tailnet + register เป็น node
# Run on VM: bash hermes_reconfig_lightvela.sh
# Prereq: Node 20+, git, SSH access จาก Mac (หรือรันผ่าน web console ของ provider)
# =============================================================================
set -euo pipefail
log(){ echo "[$(date '+%H:%M:%S')] $*"; }

HERMES_DIR="$HOME/hermes-agent"
NODE_ID="lightvela-vm"
TS_NET_IP="100.72.202.12"

log "[1/6] prereq"
node -v || { log "ติดตั้ง Node 20+ ก่อน: curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs"; exit 1; }
git --version

log "[2/6] clone/Update hermes-agent"
if [ -d "$HERMES_DIR/.git" ]; then
  git -C "$HERMES_DIR" pull --ff-only || true
else
  # TODO: ใส่ repo URL ของ hermes-agent (private SIRINX repo หรือ upstream)
  log "⚠ ใส่ HERMES_REPO_URL ที่ env ก่อนรัน: HERMES_REPO_URL=git@github.com:... bash $0"
  [ -n "${HERMES_REPO_URL:-}" ] || exit 2
  git clone --depth 1 "$HERMES_REPO_URL" "$HERMES_DIR"
fi
cd "$HERMES_DIR"

log "[3/6] install deps"
[ -f package.json ] && { npm install --no-audit --no-fund; npm run build 2>/dev/null || true; }
[ -f pyproject.toml ] && { python3 -m pip install -U pip; pip install -e . 2>/dev/null || pip install .; }

log "[4/6] node identity + gateway config"
mkdir -p ~/.hermes
cat > ~/.hermes/node.json <<JSON
{
  "nodeId": "${NODE_ID}",
  "role": "coding-worker",
  "hub": "http://100.90.189.112:9005",
  "tailscaleIp": "${TS_NET_IP}",
  "capabilities": ["dsh", "deepseek-harness", "npm", "git", "a2a"],
  "registered": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON
# MCP hub ฝั่ง Mac ต้องเห็น VM — เพิ่ม [[server]] ใน mcp-hub.toml (ทำบน Mac แทน)

log "[5/6] tailscale health"
tailscale status >/dev/null 2>&1 && log "tailscale OK: $(tailscale ip -4 2>/dev/null | head -1)" \
  || log "⚠ tailscale ไม่ active — รัน: sudo tailscale up --ssh"

log "[6/6] verify"
curl -sf --max-time 8 "http://100.90.189.112:9005/" >/dev/null 2>&1 \
  && log "a2a gateway (Mac) reachable ✅" || log "⚠ a2a gateway ยังไม่ reachable (Mac firewall/HMAC)"
log "═══ HERMES RECONFIG DONE — node '${NODE_ID}' ═══"
log "Next: Mac ฝั่งเพิ่ม [[server]] lightvela ใน mcp-hub.toml + register token"
