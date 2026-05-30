#!/usr/bin/env bash
set -euo pipefail
ROOT="$HOME/SIRINXDev/sirinx-agent-native-os"
REPORTS="$ROOT/outputs/reports/openjarvis"
mkdir -p "$REPORTS"
echo "[1] Check Ollama"
command -v ollama >/dev/null 2>&1 || { echo "Ollama not found"; exit 1; }
echo "[2] Start Ollama if needed"
pgrep -f "ollama serve" >/dev/null || (ollama serve > "$REPORTS/ollama.log" 2>&1 & sleep 3)
echo "[3] Pull starter models"
ollama pull qwen3:0.6b || true
ollama pull qwen3:8b || true
echo "[4] Install OpenJarvis"
python3 -m pip install --upgrade openjarvis
echo "[5] Init config"
jarvis init || true
echo "[6] Set local model"
jarvis config set intelligence.default_model qwen3:8b || true
jarvis config set intelligence.preferred_engine ollama || true
echo "[7] Diagnostics"
jarvis doctor || true
jarvis model list || true
jarvis config hardware || true
echo "[8] Smoke test"
jarvis ask -e ollama -m qwen3:8b -t 0.2 "Say: OpenJarvis local-first node is ready."
echo "DONE"
