#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${1:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(pwd)"
fi
cd "$ROOT"

echo "== SIRINX ultimate validator =="

fail() {
  echo "VALIDATION_FAIL: $*" >&2
  exit 1
}

run_pnpm() {
  if command -v pnpm >/dev/null 2>&1 && pnpm --version >/dev/null 2>&1; then
    pnpm "$@"
  elif command -v cmd.exe >/dev/null 2>&1 && cmd.exe /C corepack pnpm --version >/dev/null 2>&1; then
    cmd.exe /C corepack pnpm "$@"
  elif command -v corepack >/dev/null 2>&1 && corepack --version >/dev/null 2>&1; then
    corepack pnpm "$@"
  else
    fail "pnpm/corepack not executable in this shell"
  fi
}

required_files=(
  "AGENTS.md"
  "apps/web/AGENTS.md"
  "client/AGENTS.md"
  "docs/design/AGENTS.md"
  "server/AGENTS.md"
  "infra/AGENTS.md"
  "governance/AGENTS.md"
  "knowledge/AGENTS.md"
  "schemas/AGENTS.md"
  "tests/AGENTS.md"
  "docs/AGENTS.md"
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
  "ORCHESTRATION_SCHEMA.json"
  "MULTI_AGENT_SYSTEM_PROMPTS.md"
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
  "governance/LOCKED_BUSINESS_FACTS.md"
  "governance/OMNISCIENT_DASHBOARD_ARCHITECTURE.md"
  "governance/SIRINX_FINAL_ARCHITECTURE_BLUEPRINT.md"
  "governance/REPO_CONSOLIDATION_MATRIX.md"
  "governance/RBAC_AND_APPROVAL_MATRIX.md"
  "governance/DATA_CONTRACTS.md"
  "governance/DESIGN.md"
  "governance/OBSERVABILITY_CONTRACT.md"
  "governance/CUSTOM_AI_FRAMEWORK_ARCHITECTURE.md"
  "governance/DEPLOYMENT_AND_SECRETS_POLICY.md"
  "governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md"
  "docs/migration/PRODUCTION_READINESS_CHECKLIST.md"
  "docs/migration/IT_SERVER_REQUIREMENT_REMOTE_DEPLOYMENT.md"
  "docs/migration/HERMES_AGENT_SERVER_CONTINUATION_PACKET.md"
  "docs/migration/MOBILE_ACCESS_CONTROL_POLICY.md"
  "docs/migration/DATACENTER_UPLOAD_OPERATIONS.md"
  "docs/migration/DATACENTER_UPLOAD_OPERATIONS_MANUAL.md"
  "docs/migration/PRE_SERVER_SYSTEM_REVIEW.md"
  "docs/migration/PRE_SERVER_SYSTEM_REVIEW_2026-04-24.md"
  "docs/migration/SERVER_RECEIVER_BOOTSTRAP_GUIDE.md"
  "docs/migration/TRACK_RECORD_MEDIA_POLICY.md"
  "docs/migration/SERVER_HANDOFF_FINAL.md"
  "docs/design/CLAUDE_DESIGN_WORKFLOW.md"
  "docs/design/DESIGN_PROTOTYPER_SYSTEM_PROMPT.md"
  "docs/design/CLAUDE_CODE_HANDOFF_RULES.md"
  "docs/design/VERCEL_DEPLOY_CHECKLIST.md"
  "infra/backup/PG_DURABILITY_POLICY.md"
  "infra/scripts/build-handoff-bundle.ps1"
  "infra/scripts/build-source-snapshot.ps1"
  "infra/scripts/deploy-handshake.sh"
  "infra/scripts/full-system-review.ps1"
  "infra/scripts/validate-real-files.sh"
  "infra/scripts/validate-json-schemas.sh"
  "infra/scripts/validate-handoff-bundle.sh"
  "infra/scripts/validate-sirinx-facts.sh"
  "infra/scripts/pre-deploy-check.sh"
  "infra/scripts/smoke-test.sh"
  "infra/scripts/post-deploy-check.sh"
  "infra/scripts/deploy-gate.sh"
  "infra/nginx/public-site.conf.template"
  "infra/scripts/render-public-site-config.sh"
  "infra/scripts/server-receiver-install.sh"
  "infra/scripts/server-source-sync.sh"
  "infra/scripts/spend-breaker.py"
  "infra/scripts/ultimate-validator.sh"
  "infra/scripts/validate-agent-contracts.py"
  "knowledge/standard-vault/BRAND_TRUTH.md"
  "knowledge/shadow-vault/SHADOW_PROTOCOLS.md"
  "knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md"
  "shared/_core/agentContracts.ts"
  ".ops/audit/CONTINUATION_AUDIT.md"
  ".ops/audit/LOCAL_REPO_NORMALIZATION_REPORT.md"
  ".ops/audit/FINAL_SYSTEM_REVIEW.md"
  ".ops/contracts/ORCHESTRATOR_SCHEMA.json"
  ".ops/contracts/ANALYST_SCHEMA.json"
  ".ops/contracts/CREATOR_SCHEMA.json"
  ".ops/contracts/VALIDATOR_SCHEMA.json"
  ".ops/contracts/DELIVERY_SCHEMA.json"
  ".ops/contracts/HANDOFF_BUNDLE_MANIFEST.json"
)

for path in "${required_files[@]}"; do
  [ -f "$path" ] || fail "required file missing: $path"
  [ -s "$path" ] || fail "required file empty: $path"
  if grep -Eiq '^[[:space:]]*(TODO|TBD|coming soon|placeholder)[[:space:]]*$' "$path"; then
    fail "placeholder-only required file: $path"
  fi
done

grep -Fq "Brand: SIRINX" governance/LOCKED_BUSINESS_FACTS.md || fail "locked brand fact missing"
grep -Fq "Slogan: Clean Tech • Smart Future" governance/LOCKED_BUSINESS_FACTS.md || fail "locked slogan fact missing"
grep -Fq "หยุดจ่ายค่าไฟทิ้งทิ้ง... แล้วเปลี่ยนหลังคาให้เป็นสินทรัพย์" governance/LOCKED_BUSINESS_FACTS.md || fail "locked Thai headline missing"
grep -Fq "เปลี่ยนค่าใช้จ่าย ให้เป็นการลงทุนที่สร้างผลตอบแทน" governance/LOCKED_BUSINESS_FACTS.md || fail "locked Thai footer missing"
grep -Fq "LISINER liquid-cooled BESS with integrated chiller system." governance/LOCKED_BUSINESS_FACTS.md || fail "field LISINER context missing"
grep -Fq "Solis EMS / Solis industrial inverter interface." governance/LOCKED_BUSINESS_FACTS.md || fail "field Solis context missing"
grep -Fq "START: 125,000 THB + VAT 7%" governance/SIRINX_FINAL_ARCHITECTURE_BLUEPRINT.md || fail "START package truth missing"
grep -Fq "PRO: 315,000 THB + VAT 7%" governance/SIRINX_FINAL_ARCHITECTURE_BLUEPRINT.md || fail "PRO package truth missing"
grep -Fq "ENTERPRISE BESS: 4,990,000 THB + VAT 7%" governance/SIRINX_FINAL_ARCHITECTURE_BLUEPRINT.md || fail "ENTERPRISE BESS package truth missing"
grep -Fq "not package truth" governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md || fail "field hardware context boundary missing"
grep -Fq "graphite, black glass, muted gold" governance/OMNISCIENT_DASHBOARD_ARCHITECTURE.md || fail "dashboard premium UI policy missing"
grep -Fq "anime" governance/OMNISCIENT_DASHBOARD_ARCHITECTURE.md || fail "dashboard rejected aesthetic guardrail missing"
grep -Fq "full runtime source, not only the review bundle" docs/migration/HERMES_AGENT_SERVER_CONTINUATION_PACKET.md || fail "Hermes continuation packet must require full runtime source"
grep -Fq "The review packet alone is not enough to start the backend." docs/migration/SERVER_RECEIVER_BOOTSTRAP_GUIDE.md || fail "receiver guide must distinguish review bundle from runtime source"

for script in infra/scripts/*.sh; do
  [ -f "$script" ] || continue
  bash -n "$script"
done

python_cmd=""
if command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
  python_cmd="python"
elif command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  python_cmd="python3"
elif command -v py >/dev/null 2>&1; then
  python_cmd="py"
fi

[ -n "$python_cmd" ] || fail "python/python3/py not found for syntax validation"
"$python_cmd" -m py_compile infra/scripts/spend-breaker.py
"$python_cmd" -m py_compile infra/scripts/validate-agent-contracts.py
"$python_cmd" infra/scripts/validate-agent-contracts.py
bash infra/scripts/validate-json-schemas.sh
bash infra/scripts/validate-sirinx-facts.sh
bash infra/scripts/validate-real-files.sh

if command -v powershell >/dev/null 2>&1; then
  powershell -NoProfile -ExecutionPolicy Bypass -File infra/scripts/overlap-audit.ps1 >/tmp/sirinx-overlap-audit.json
elif command -v pwsh >/dev/null 2>&1; then
  pwsh -NoProfile -ExecutionPolicy Bypass -File infra/scripts/overlap-audit.ps1 >/tmp/sirinx-overlap-audit.json
else
  echo "PowerShell not found; skipping overlap-audit.ps1 in this shell"
fi

if command -v git >/dev/null 2>&1; then
  git status --short
fi

if [ -f package.json ]; then
  if grep -R -F "streamdown" package.json pnpm-lock.yaml client/src >/tmp/sirinx-heavy-markdown-hits.txt 2>/dev/null; then
    fail "heavy Streamdown runtime dependency found; use client/src/components/LightMarkdown.tsx unless explicitly approved"
  fi
  grep -Fq 'VITE_ENABLE_JS_OBFUSCATION === "true"' vite.config.ts || fail "production obfuscation must remain opt-in"
  run_pnpm run check
  run_pnpm run test
  run_pnpm run build
  "$python_cmd" - <<'PY'
from pathlib import Path

assets = Path("dist/public/assets")
if not assets.exists():
    raise SystemExit("VALIDATION_FAIL: dist/public/assets missing after build")

js_assets = sorted(assets.glob("*.js"), key=lambda p: p.stat().st_size, reverse=True)
if not js_assets:
    raise SystemExit("VALIDATION_FAIL: no built JS assets found")

largest = js_assets[0]
limit = 500_000
if largest.stat().st_size > limit:
    raise SystemExit(
        f"VALIDATION_FAIL: largest JS asset exceeds {limit} bytes: "
        f"{largest} ({largest.stat().st_size} bytes)"
    )

print(f"largest JS asset: {largest.name} ({largest.stat().st_size} bytes)")
PY
fi

if [ -f docker-compose.yml ]; then
  grep -Fq "pgvector/pgvector:pg16" docker-compose.yml || fail "docker compose must declare pgvector postgres target"
  grep -Fq 'EXECUTIONS_MODE: queue' docker-compose.yml || fail "docker compose must keep n8n queue mode"
  grep -Fq 'image: n8nio/runners:1.116.2' docker-compose.yml || fail "docker compose must declare n8nio/runners"
  compose_validated="false"
  if command -v docker >/dev/null 2>&1; then
    if docker compose -f docker-compose.yml config >/tmp/sirinx-compose-config.yml 2>/tmp/sirinx-compose-config.err; then
      compose_validated="true"
    fi
  fi
  if [ "$compose_validated" != "true" ] && command -v cmd.exe >/dev/null 2>&1; then
    if cmd.exe /C docker compose -f docker-compose.yml config >/tmp/sirinx-compose-config.yml 2>/tmp/sirinx-compose-config.err; then
      compose_validated="true"
    fi
  fi
  if [ "$compose_validated" = "true" ]; then
    echo "docker compose config: ok"
  else
    echo "docker compose config: skipped in this shell; run from Windows PowerShell if Docker is available"
  fi
fi

bundle_dir="04_deployment_bundle"
[ -d "$bundle_dir" ] || fail "bundle directory missing"
[ -f "$bundle_dir/MANIFEST.json" ] || fail "bundle manifest missing"
[ -f "$bundle_dir/MANIFEST.md" ] || fail "bundle markdown manifest missing"
[ -f "$bundle_dir/CHECKSUMS.SHA256.txt" ] || fail "bundle checksums missing"
[ -f "$bundle_dir/.ops/contracts/HANDOFF_BUNDLE_MANIFEST.json" ] || fail "bundle contract manifest missing"
[ ! -f "$bundle_dir/governance/SIRINX_V15_ARCHITECTURE_BLUEPRINT.md" ] || fail "historical architecture blueprint must not remain in final bundle"

bundle_count="$(find "$bundle_dir" -type f | wc -l | tr -d ' ')"
[ "$bundle_count" -gt 10 ] || fail "bundle has too few files: $bundle_count"

for path in "${required_files[@]}"; do
  [ -f "$bundle_dir/$path" ] || fail "bundle missing required file: $path"
  [ -s "$bundle_dir/$path" ] || fail "bundle required file empty: $path"
done

"$python_cmd" - <<'PY'
from pathlib import Path
import json

root = Path("04_deployment_bundle")
manifest = json.loads((root / ".ops/contracts/HANDOFF_BUNDLE_MANIFEST.json").read_text(encoding="utf-8"))

for rel in manifest["requiredFiles"]:
    target = root / rel
    if not target.exists():
        raise SystemExit(f"VALIDATION_FAIL: bundle manifest file missing: {rel}")
    if target.is_file() and target.stat().st_size <= 0:
        raise SystemExit(f"VALIDATION_FAIL: bundle manifest file empty: {rel}")

for directory in manifest["requiredDirectories"]:
    target = root / directory["path"]
    if not target.exists():
        raise SystemExit(f"VALIDATION_FAIL: bundle manifest directory missing: {directory['path']}")
PY

"$python_cmd" - <<'PY'
from pathlib import Path
import re

root = Path("04_deployment_bundle")
missing = []
for doc in root.rglob("*.md"):
    text = doc.read_text(encoding="utf-8", errors="replace")
    for line_no, line in enumerate(text.splitlines(), start=1):
        for match in re.finditer(r"`([^`]+)`", line):
            ref = match.group(1)
            if not re.match(r"^(governance|docs/migration|infra|knowledge|\.ops)/", ref):
                continue
            if any(ch in ref for ch in "*?"):
                continue
            target = root / Path(ref)
            if not target.exists():
                missing.append(f"{doc.relative_to(root)}:{line_no} -> {ref}")

if missing:
    raise SystemExit("VALIDATION_FAIL: bundle has broken markdown references:\n" + "\n".join(missing[:50]))
PY

if find "$bundle_dir" \( \
  -path "*/node_modules/*" -o \
  -path "*/dist/*" -o \
  -path "*/.git/*" -o \
  -path "*/artifacts/*" -o \
  -path "*/secrets/*" -o \
  -path "*/.cache/*" -o \
  -path "*/__pycache__/*" -o \
  -name ".env" -o \
  -name "*.pem" -o \
  -name "*.key" -o \
  -name "*.p12" -o \
  -name "*.pfx" \
  \) -print | grep -q .; then
  fail "forbidden junk/secret artifact found in bundle"
fi

bash infra/scripts/validate-handoff-bundle.sh

if find client server shared brands -type f \( \
  -name '*.ts' -o \
  -name '*.tsx' -o \
  -name '*.js' -o \
  -name '*.jsx' -o \
  -name '*.json' -o \
  -name '*.css' -o \
  -name '*.html' \
  \) -print0 2>/dev/null | xargs -0 grep -E "CHOKMA|chokma|deejai789|casino|gambling|baccarat|บาคาร่า|พนัน|หวย" >/tmp/sirinx-forbidden-runtime-hits.txt 2>/dev/null; then
  fail "forbidden unrelated runtime content found"
fi

echo "== validator complete =="
