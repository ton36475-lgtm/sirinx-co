#!/usr/bin/env bash
# =============================================================================
# SIRINX Omarchy (Arch/WSL2 on Windows aiagent) — One-shot bootstrap
# Installs: base deps + 9router + model pools catalog + ComfyUI-ready GPU stack
# + a2a agent runner + Bonsai scaffolding (model DL gated by owner flag)
# Run:  bash omarchy_bootstrap.sh            (safe, no model download)
#   or  BONSAI_APPROVE=1 bash omarchy_bootstrap.sh   (downloads Bonsai GGUF ~7GB)
# Designed to be run via Codex/ChatGPT on Windows inside WSL Omarchy shell.
# =============================================================================
set -euo pipefail
export PATH="$HOME/.local/bin:/usr/lib/wsl/lib:$PATH"
TS() { date '+%H:%M:%S'; }
log() { echo "[$(TS)] $*"; }

# ── [1/8] DNS fix (WSL getaddrinfo -5) ──────────────────────────────────────
log "[1/8] DNS"
if ! getent hosts github.com >/dev/null 2>&1; then
  printf 'nameserver 8.8.8.8\nnameserver 1.1.1.1\n' | sudo tee /etc/resolv.conf >/dev/null
  sudo chattr +i /etc/resolv.conf 2>/dev/null || true
fi
getent hosts github.com | head -1 || { log "DNS ยังตาย — เช็ค Windows vEthernet"; exit 1; }

# ── [2/8] Base packages ─────────────────────────────────────────────────────
log "[2/8] pacman base"
sudo pacman -Sy --noconfirm --needed git base-devel nodejs npm python python-pip uv curl wget unzip ripgrep fd jq which

# ── [3/8] NVIDIA passthrough ────────────────────────────────────────────────
log "[3/8] GPU"
GPU=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || true)
[ -n "$GPU" ] && log "GPU: $GPU" || log "⚠ nvidia-smi ไม่เห็น GPU — driver ฝั่ง Windows ต้องรองรับ WSL CUDA"

# ── [4/8] npm global deps (agent toolchain) ────────────────────────────────
log "[4/8] npm globals"
npm install -g pnpm@latest openclaw@latest opencode-ai@1.19.0 wrangler@latest @openai/codex@latest 2>/dev/null || log "(บาง global ติดตั้งไม่ครบ — ดู log)"
node -v; npm -v

# ── [5/8] 9router — copy pools+catalog from Mac via GitHub bundle ──────────
log "[5/8] 9router"
mkdir -p ~/.9router
# Catalog snapshot พร้อมใช้จาก Mac (1405 models / 21 providers, synced 16 ต.ค.)
if [ ! -f ~/.9router/model-catalog.json ]; then
  curl -fsSL --max-time 60 -o ~/.9router/model-catalog.json \
    https://raw.githubusercontent.com/ton36475-lgtm/sirinx-os/main/9router/model-catalog.json 2>/dev/null \
    || log "(catalog ยังไม่อยู่บน GitHub — จะ sync ผ่าน tailscale ทีหลัง)"
fi
[ -f ~/.9router/model-catalog.json ] && log "catalog: $(jq '.models|length' ~/.9router/model-catalog.json 2>/dev/null || echo '?') models" || log "⚠ catalog missing — sync ทีหลัง"

# ── [6/8] ComfyUI + torch cu126 (GPU ready) ────────────────────────────────
log "[6/8] ComfyUI"
if [ ! -d ~/comfy/ComfyUI/.git ]; then
  git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git ~/comfy/ComfyUI
fi
cd ~/comfy/ComfyUI
[ -d .venv ] || uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install --upgrade pip wheel setuptools >/dev/null
uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126
uv pip install -r requirements.txt
# systemd user service
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/comfyui.service <<UNIT
[Unit]
Description=ComfyUI (Omarchy WSL2)
After=network.target
[Service]
WorkingDirectory=%h/comfy/ComfyUI
ExecStart=%h/comfy/ComfyUI/.venv/bin/python main.py --listen 0.0.0.0 --port 8188
Restart=on-failure
RestartSec=10
[Install]
WantedBy=default.target
UNIT
systemctl --user daemon-reload
systemctl --user enable --now comfyui.service || true

# ── [7/8] a2a agent runner (fusion telegram bridge hook) ───────────────────
log "[7/8] a2a runner"
mkdir -p ~/sirinx-a2a
cat > ~/sirinx-a2a/agent.yaml <<YAML
node: aiagent-omarchy
role: coding-worker
hub: http://100.90.189.112:9005      # Mac a2a gateway (tailnet)
telegram_fusion: true
report_channel: "Test"               # telegram group หลัก
capabilities: [comfyui, npm, codex-cli, openclaw, 9router]
YAML
log "a2a config → ~/sirinx-a2a/agent.yaml (รอ Mac ฝั่ง :9005 เปิด HMAC รับ enroll)"

# ── [8/8] Bonsai (gated — ต้อง BONSAI_APPROVE=1 เท่านั้น) ──────────────────
log "[8/8] Bonsai"
if [ "${BONSAI_APPROVE:-0}" = "1" ]; then
  log "ดาวน์โหลด Ternary-Bonsai-2-27B (PQ2_0-MTP ~7GB) — CC BY-NC ห้ามเชิงพาณิชย์ local-only"
  mkdir -p ~/models/bonsai
  # PrismML llama.cpp build (mainline/Ollama โหลด MTP ไม่ได้ — ต้อง tag prism-b10743+)
  if [ ! -d ~/llama.cpp-prism ]; then
    git clone --depth 1 --branch prism-b10743-adfffbe https://github.com/PrismML/llama.cpp.git ~/llama.cpp-prism \
      || log "⚠ PrismML tag ไม่เจอ — pull ทีหลัง"
  fi
  log "GGUF URL ต้องยืนยันจาก hotdogs/Ternary-Bonsai-2-27B-Abliterated-Hemmingway-1-MTP ก่อน (ใส่ URL ที่ BONSAI_URL=)"
  [ -n "${BONSAI_URL:-}" ] && curl -L --fail -o ~/models/bonsai/bonsai-pq2-mtp.gguf "$BONSAI_URL" || log "ข้าม DL — ไม่มี BONSAI_URL"
else
  log "ข้าม Bonsai DL (เรียกด้วย BONSAI_APPROVE=1 BONSAI_URL=<gguf-url> เมื่อ owner ยืนยัน)"
fi

log "═══ BOOTSTRAP DONE ═══"
systemctl --user is-active comfyui.service && curl -sf http://127.0.0.1:8188/system_stats | head -c 200 || log "ComfyUI กำลัง start — ตรวจ: journalctl --user -u comfyui -n 20"
