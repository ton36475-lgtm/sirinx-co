#!/usr/bin/env bash
set -euo pipefail
ROOT="$HOME/SIRINXDev/sirinx-agent-native-os/security-lab"
OUT="$ROOT/05_reports/daily/$(date +%Y%m%d)"
mkdir -p "$OUT"
{
  echo "# Daily Defensive Security Digest"
  echo
  date
  echo
  echo "## FinalRecon Reports"
  find "$ROOT/05_reports/finalrecon" -type f 2>/dev/null | tail -20 || true
  echo
  echo "## Pentest Swarm Reports"
  find "$ROOT/05_reports/pentest-swarm" -type f 2>/dev/null | tail -20 || true
  echo
  echo "## AI Summary"
  jarvis ask -t 0.2 \
  "Summarize today's defensive security notes and reports. Focus on owned assets only. Output: findings, risk, remediation, next safe actions."
} | tee "$OUT/digest.md"
