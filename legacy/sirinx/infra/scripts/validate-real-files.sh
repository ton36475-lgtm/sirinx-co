#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${1:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(pwd)"
fi
cd "$ROOT"

fail() {
  echo "VALIDATION_FAIL: $*" >&2
  exit 1
}

required_files=(
  "AGENTS.md"
  "apps/web/AGENTS.md"
  "client/AGENTS.md"
  "docs/AGENTS.md"
  "docs/design/AGENTS.md"
  "governance/AGENTS.md"
  "infra/AGENTS.md"
  "knowledge/AGENTS.md"
  "schemas/AGENTS.md"
  "tests/AGENTS.md"
  "server/AGENTS.md"
  ".ops/AGENTS.md"
  "skills/AGENTS_MD_REPO_GOVERNANCE_SKILL.md"
  "skills/MULTI_AGENT_JSON_HANDOFF_SKILL.md"
  "skills/DESIGN_PROTOTYPER_SKILL.md"
  "skills/REAL_FILE_VALIDATION_SKILL.md"
  "skills/SERVER_HANDOFF_BUNDLE_SKILL.md"
  "skills/PLAYWRIGHT_E2E_VALIDATION_SKILL.md"
  "skills/PGVECTOR_RAG_MEMORY_SKILL.md"
  "skills/N8N_QUEUE_MODE_SKILL.md"
  "skills/OPENTELEMETRY_OBSERVABILITY_SKILL.md"
  "skills/LOCAL_LLM_OFFLINE_DRAFTING_SKILL.md"
  "agents/system_prompts/HERMES_ORCHESTRATOR.md"
  "agents/system_prompts/CYBER_PHYSICAL_ANALYST.md"
  "agents/system_prompts/DESIGN_PROTOTYPER.md"
  "agents/system_prompts/SOVEREIGN_CREATOR.md"
  "agents/system_prompts/VALIDATOR_AGENT.md"
  "agents/system_prompts/DELIVERY_AGENT.md"
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
  "docs/design/CLAUDE_DESIGN_WORKFLOW.md"
  "docs/design/DESIGN_PROTOTYPER_SYSTEM_PROMPT.md"
  "docs/design/CLAUDE_CODE_HANDOFF_RULES.md"
  "docs/design/VERCEL_DEPLOY_CHECKLIST.md"
  "infra/scripts/validate-real-files.sh"
  "infra/scripts/validate-json-schemas.sh"
  "infra/scripts/validate-handoff-bundle.sh"
  "infra/scripts/validate-sirinx-facts.sh"
  "infra/scripts/pre-deploy-check.sh"
  "infra/scripts/smoke-test.sh"
  "infra/scripts/post-deploy-check.sh"
  "infra/scripts/deploy-gate.sh"
  "tests/e2e/package-facts.spec.ts"
  "tests/e2e/mobile-layout.spec.ts"
  "tests/e2e/handoff-bundle.spec.ts"
  "tests/e2e/track-record-media.spec.ts"
)

for path in "${required_files[@]}"; do
  [ -f "$path" ] || fail "missing required file: $path"
  [ -s "$path" ] || fail "required file is empty: $path"
done

if grep -R -Eiq '^[[:space:]]*(TODO|TBD|coming soon|placeholder)[[:space:]]*$' \
  AGENTS.md apps/web docs/design skills agents/system_prompts schemas tests/e2e infra/scripts docs/migration governance 2>/dev/null; then
  fail "placeholder-only content detected in required deliverables"
fi

echo "validate-real-files: ok"
