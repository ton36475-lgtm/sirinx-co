#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

URL="${1:-${SIRINX_SMOKE_URL:-http://127.0.0.1:3000/}}"
OUT="${SIRINX_SMOKE_OUT:-}"

tmp_file="$(mktemp)"
cleanup() {
  rm -f "$tmp_file"
}
trap cleanup EXIT

status="$(curl -L -sS -o "$tmp_file" -w "%{http_code}" "$URL")"
html="$(cat "$tmp_file")"

brand_ok="false"
wrong_brand="false"

if printf "%s" "$html" | grep -Eiq "SIRINX|Solar|Energy|Carport"; then
  brand_ok="true"
fi

if printf "%s" "$html" | grep -Eiq "CHOKMA|deejai789|casino|gambling|lottery|baccarat"; then
  wrong_brand="true"
fi

json="{\"url\":\"$URL\",\"status\":$status,\"brandOk\":$brand_ok,\"wrongBrand\":$wrong_brand}"

if [ -n "$OUT" ]; then
  mkdir -p "$(dirname "$OUT")"
  printf "%s\n" "$json" > "$OUT"
fi

printf "%s\n" "$json"

if [ "$status" != "200" ]; then
  echo "smoke failed: expected HTTP 200" >&2
  exit 1
fi

if [ "$brand_ok" != "true" ]; then
  echo "smoke failed: SIRINX brand markers not found" >&2
  exit 1
fi

if [ "$wrong_brand" != "false" ]; then
  echo "smoke failed: wrong-brand markers found" >&2
  exit 1
fi
