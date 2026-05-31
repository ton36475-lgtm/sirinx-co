#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${1:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(pwd)"
fi
cd "$ROOT"

python_cmd=""
if command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
  python_cmd="python"
elif command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  python_cmd="python3"
elif command -v py >/dev/null 2>&1; then
  python_cmd="py"
fi

if [ -z "$python_cmd" ]; then
  echo "VALIDATION_FAIL: python runtime not found for JSON parsing" >&2
  exit 1
fi

json_targets=(
  "ORCHESTRATION_SCHEMA.json"
  ".ops/contracts/ORCHESTRATOR_SCHEMA.json"
  ".ops/contracts/ANALYST_SCHEMA.json"
  ".ops/contracts/CREATOR_SCHEMA.json"
  ".ops/contracts/DATABASE_STEWARD_SCHEMA.json"
  ".ops/contracts/VALIDATOR_SCHEMA.json"
  ".ops/contracts/DELIVERY_SCHEMA.json"
  ".ops/contracts/MENTOR_BOOTSTRAP_SCHEMA.json"
  ".ops/contracts/HANDOFF_BUNDLE_MANIFEST.json"
  "schemas/orchestration_payload.schema.json"
  "schemas/agent_handoff.schema.json"
  "schemas/design_prototyper_payload.schema.json"
  "schemas/design_to_creator_payload.schema.json"
  "schemas/analyst_output.schema.json"
  "schemas/creator_output.schema.json"
  "schemas/validator_report.schema.json"
  "schemas/delivery_manifest.schema.json"
  "schemas/rag_chunk.schema.json"
  "schemas/retrieval_result.schema.json"
  "schemas/audit_event.schema.json"
)

for path in "${json_targets[@]}"; do
  [ -f "$path" ] || {
    echo "VALIDATION_FAIL: missing JSON target: $path" >&2
    exit 1
  }
  "$python_cmd" -m json.tool "$path" >/dev/null || {
    echo "VALIDATION_FAIL: invalid JSON schema: $path" >&2
    exit 1
  }
done

echo "validate-json-schemas: ok"
