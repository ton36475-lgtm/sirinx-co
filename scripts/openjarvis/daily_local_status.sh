#!/usr/bin/env bash
set -euo pipefail
ROOT="$HOME/SIRINXDev/sirinx-agent-native-os"
OUT="$ROOT/outputs/reports/daily/$(date +%Y%m%d)"
mkdir -p "$OUT"
{
  echo "# SIRINXDev Daily Local Status"
  echo
  date
  echo
  echo "## Root"
  pwd
  echo
  echo "## Git"
  git status || true
  echo
  echo "## Node"
  node -v || true
  npm -v || true
  pnpm -v || true
  echo
  echo "## Ollama"
  ollama list || true
  echo
  echo "## OpenJarvis"
  jarvis telemetry stats || true
  jarvis memory stats || true
  echo
  echo "## Reports"
  find "$ROOT/outputs" -type f 2>/dev/null | tail -30 || true
} | tee "$OUT/status.md"
