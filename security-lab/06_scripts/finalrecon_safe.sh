#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-}"
MODE="${2:-passive}"
ROOT="$HOME/SIRINXDev/sirinx-agent-native-os/security-lab"
FR="$ROOT/00_sources/FinalRecon"
ALLOW="$ROOT/04_targets_allowlist/owned-targets.txt"
OUT="$ROOT/05_reports/finalrecon/$(date +%Y%m%d-%H%M%S)"
if [ -z "$TARGET" ]; then
  echo "Usage: $0 <domain-or-url> [passive|light|active]"
  exit 1
fi
HOST="$(echo "$TARGET" | sed -E 's#^https?://##' | cut -d/ -f1)"
if ! grep -qx "$HOST" "$ALLOW"; then
  echo "BLOCKED: $HOST is not in allowlist."
  exit 2
fi
mkdir -p "$OUT"
cd "$FR"
source .venv/bin/activate
case "$MODE" in
  passive)
    python3 finalrecon.py --headers --sslinfo --whois --dns --wayback --url "https://$HOST" -cd "$OUT"
    ;;
  light)
    python3 finalrecon.py --headers --sslinfo --whois --dns --crawl --url "https://$HOST" -cd "$OUT"
    ;;
  active)
    python3 finalrecon.py --full --url "https://$HOST" -cd "$OUT" -dt 10 -pt 20 -T 20
    ;;
  *)
    echo "Unknown mode: $MODE"
    exit 3
    ;;
esac
echo "Saved report to: $OUT"
