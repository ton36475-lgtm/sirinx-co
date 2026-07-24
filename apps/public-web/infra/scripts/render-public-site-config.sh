#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${APP_DIR:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi
cd "$ROOT"

TEMPLATE_PATH="${TEMPLATE_PATH:-infra/nginx/public-site.conf.template}"
PUBLIC_PRIMARY_HOST="${PUBLIC_PRIMARY_HOST:-sirinx.co}"
PUBLIC_SERVER_ALIASES_RAW="${PUBLIC_SERVER_ALIASES:-www.sirinx.co}"
TLS_CERT_BASENAME="${TLS_CERT_BASENAME:-$PUBLIC_PRIMARY_HOST}"
APP_PORT="${APP_PORT:-3000}"
OUTPUT_PATH="${OUTPUT_PATH:-infra/nginx/generated/${PUBLIC_PRIMARY_HOST}.conf}"

normalize_aliases() {
  printf "%s" "$1" | tr ',' ' ' | xargs
}

escape_sed() {
  printf "%s" "$1" | sed -e 's/[\/&]/\\&/g'
}

[ -f "$TEMPLATE_PATH" ] || {
  echo "missing template: $TEMPLATE_PATH" >&2
  exit 1
}

alias_names="$(normalize_aliases "$PUBLIC_SERVER_ALIASES_RAW")"
if [ -n "$alias_names" ]; then
  public_server_names="$PUBLIC_PRIMARY_HOST $alias_names"
else
  public_server_names="$PUBLIC_PRIMARY_HOST"
fi

mkdir -p "$(dirname "$OUTPUT_PATH")"

sed \
  -e "s/__PUBLIC_SERVER_NAMES__/$(escape_sed "$public_server_names")/g" \
  -e "s/__TLS_CERT_BASENAME__/$(escape_sed "$TLS_CERT_BASENAME")/g" \
  -e "s/__APP_PORT__/$(escape_sed "$APP_PORT")/g" \
  "$TEMPLATE_PATH" > "$OUTPUT_PATH"

echo "rendered public site config"
echo "template=$TEMPLATE_PATH"
echo "output=$OUTPUT_PATH"
echo "server_names=$public_server_names"
echo "tls_cert_basename=$TLS_CERT_BASENAME"
echo "app_port=$APP_PORT"
