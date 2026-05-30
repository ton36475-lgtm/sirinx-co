#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${1:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(pwd)"
fi
cd "$ROOT"

block() {
  echo "BLOCK DEPLOY: $*" >&2
  exit 1
}

bash infra/scripts/validate-real-files.sh || block "validate-real-files failed"
bash infra/scripts/validate-json-schemas.sh || block "validate-json-schemas failed"
bash infra/scripts/validate-sirinx-facts.sh || block "validate-sirinx-facts failed"
bash infra/scripts/validate-handoff-bundle.sh || block "validate-handoff-bundle failed"
bash infra/scripts/pre-deploy-check.sh || block "pre-deploy-check failed"
bash infra/scripts/smoke-test.sh || block "smoke-test failed"

echo "ALLOW DEPLOY"
