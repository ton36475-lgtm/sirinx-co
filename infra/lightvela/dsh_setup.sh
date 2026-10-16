#!/usr/bin/env bash
# DeepSeek Harness (dsh) — LightVela VM (vm-2-126-ubuntu) one-shot setup
# Prereq: Node 20+, pnpm — ตรวจก่อน
set -euo pipefail
log(){ echo "[$(date '+%H:%M:%S')] $*"; }

log "[1/5] prereq check"
node -v || { log "ต้องติดตั้ง Node 20+ ก่อน (nvm หรือ apt)"; exit 1; }
command -v pnpm >/dev/null || npm install -g pnpm@latest

log "[2/5] clone harness"
mkdir -p ~/services && cd ~/services
[ -d deepseek-harness/.git ] || git clone --depth 1 https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness

log "[3/5] install + build"
pnpm install
pnpm run build

log "[4/5] model provider env (ใส่ key ผ่าน .env — ห้าม hardcode)"
cat > .env.example.local <<ENV
# เลือก provider ที่ใช้ — ตั้งจริงใน .env
# DSH ไม่ผูกโมเดลเดียว: รองรับ Anthropic/OpenAI/Bedrock/Azure/Gemini/DeepSeek/custom OpenAI-compatible
# เชื่อมกับ 9router (Mac) ผ่าน custom OpenAI-compatible gateway ได้:
#   9router: http://100.90.189.112:20128/v1  (tailnet)
DSH_PROVIDER=openrouter
ENV

log "[5/5] launch web UI (bind tailnet เพื่อให้ทุก node เข้าได้)"
pnpm dsh web -- --host 100.72.202.12 --port 3080 --no-open || pnpm dsh web --no-open
log "DONE — Web UI: http://100.72.202.12:3080 (tailnet only)"
