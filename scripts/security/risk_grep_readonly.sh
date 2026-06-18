#!/usr/bin/env bash
set -u

# Read-only risky-pattern scanner.
# Prints file:line only. It never prints command bodies or secret values.

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

PATTERN='sudo|curl|wget|eval|exec|subprocess|shell=True|docker run|chmod[[:space:]]+\+x|ngrok|cloudflared tunnel|public tunnel|APP_BIND=0\.0\.0\.0|AUTH_ENABLED=false'

if command -v rg >/dev/null 2>&1; then
  rg -n --hidden --no-heading -i \
    --glob '!**/.git/**' \
    --glob '!**/node_modules/**' \
    --glob '!**/dist/**' \
    --glob '!**/build/**' \
    --glob '!**/coverage/**' \
    --glob '!**/.next/**' \
    --glob '!**/.turbo/**' \
    --glob '!**/.cache/**' \
    --glob '!**/__pycache__/**' \
    --glob '!**/.pytest_cache/**' \
    --glob '!**/venv/**' \
    --glob '!**/venvs/**' \
    --glob '!**/.venv/**' \
    --glob '!**/site-packages/**' \
    --glob '!tools/repo-intake/**' \
    --glob '!tools/cli-anything-lab/**' \
    --glob '!vendor/**' \
    --glob '!legacy/**' \
    --glob '!outputs/**' \
    --glob '!reports/**' \
    --glob '!**/*.tsbuildinfo' \
    --glob '!**/pnpm-lock.yaml' \
    --glob '!**/package-lock.json' \
    --glob '!**/yarn.lock' \
    "$PATTERN" . \
    | awk -F: '{print $1 ":" $2}' \
    | sort -u
else
  find . -type f \
    -not -path '*/.git/*' \
    -not -path '*/node_modules/*' \
    -not -path '*/dist/*' \
    -not -path '*/build/*' \
    -not -path '*/coverage/*' \
    -not -path '*/.next/*' \
    -not -path '*/.turbo/*' \
    -not -path '*/.cache/*' \
    -not -path '*/__pycache__/*' \
    -not -path '*/.pytest_cache/*' \
    -not -path '*/venv/*' \
    -not -path '*/venvs/*' \
    -not -path '*/.venv/*' \
    -not -path '*/site-packages/*' \
    -not -path './tools/repo-intake/*' \
    -not -path './tools/cli-anything-lab/*' \
    -not -path './vendor/*' \
    -not -path './legacy/*' \
    -not -path './outputs/*' \
    -not -path './reports/*' \
    -not -name '*.tsbuildinfo' \
    -not -name 'pnpm-lock.yaml' \
    -not -name 'package-lock.json' \
    -not -name 'yarn.lock' \
    -print0 \
    | while IFS= read -r -d '' file; do
      perl -ne 'BEGIN { $pat = qr/sudo|curl|wget|eval|exec|subprocess|shell=True|docker run|chmod\s+\+x|ngrok|cloudflared tunnel|public tunnel|APP_BIND=0\.0\.0\.0|AUTH_ENABLED=false/i } if ($_ =~ $pat) { print "$ARGV:$.\n"; close ARGV }' "$file"
    done \
    | sort -u
fi
