#!/usr/bin/env bash
# ======================================================
# validate_artifacts.sh
# ตรวจสอบ artifacts ว่า complete และ valid ก่อน review
# Usage: ./tools/validators/validate_artifacts.sh {job_id}
# ======================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
JOB_ID="${1:-}"

if [[ -z "$JOB_ID" ]]; then
  echo "Usage: $0 {job_id}"
  exit 1
fi

JOB_DIR="$PROJECT_ROOT/state/jobs/$JOB_ID"
FINDINGS_DIR="$PROJECT_ROOT/state/findings/$JOB_ID"
SPEC_DIR="$PROJECT_ROOT/docs/specs/active/$JOB_ID"

ERRORS=0
WARNINGS=0

# ===== Colors =====
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

pass() { echo -e "${GREEN}  ✅ PASS${NC} — $1"; }
fail() { echo -e "${RED}  ❌ FAIL${NC} — $1"; ((ERRORS++)); }
warn() { echo -e "${YELLOW}  ⚠️ WARN${NC} — $1"; ((WARNINGS++)); }
section() { echo -e "\n${BLUE}▶ $1${NC}"; }

# ===== Spec Validation =====
validate_spec() {
  section "Spec Validation"

  local spec="$SPEC_DIR/spec.md"
  if [[ ! -f "$spec" ]]; then
    fail "spec.md ไม่พบ: $spec"
    return
  fi
  pass "spec.md exists"

  # ตรวจ required sections
  local required_sections=("ที่มาและบริบท" "ปัญหาที่พบ" "แนวทางแก้ไข" "Acceptance Criteria" "นอกเหนือ Scope" "ความเสี่ยง")
  for section_name in "${required_sections[@]}"; do
    if grep -q "$section_name" "$spec"; then
      pass "spec section: $section_name"
    else
      fail "spec missing section: $section_name"
    fi
  done

  # ตรวจ acceptance criteria count
  local ac_count
  ac_count=$(grep -c "^\- \[ \] \*\*AC-" "$spec" 2>/dev/null || grep -c "AC-" "$spec" 2>/dev/null || echo "0")
  if [[ "$ac_count" -ge 3 ]]; then
    pass "Acceptance criteria count: $ac_count"
  else
    warn "Acceptance criteria อาจน้อยเกินไป: $ac_count (recommended: ≥ 3)"
  fi
}

# ===== Tasks Validation =====
validate_tasks() {
  section "Tasks Validation"

  local tasks="$JOB_DIR/tasks.yaml"
  if [[ ! -f "$tasks" ]]; then
    fail "tasks.yaml ไม่พบ"
    return
  fi
  pass "tasks.yaml exists"

  # ตรวจ required fields
  if grep -q "job_id:" "$tasks"; then
    pass "tasks.yaml has job_id"
  else
    fail "tasks.yaml missing job_id"
  fi

  if grep -q "tasks:" "$tasks"; then
    pass "tasks.yaml has tasks array"
  else
    fail "tasks.yaml missing tasks array"
  fi

  # ตรวจว่าทุก task มี acceptance_criteria
  if grep -q "acceptance_criteria:" "$tasks"; then
    pass "tasks.yaml has acceptance_criteria"
  else
    warn "tasks.yaml อาจขาด acceptance_criteria ใน tasks"
  fi
}

# ===== Test Results Validation =====
validate_test_results() {
  section "Test Results Validation"

  local results="$JOB_DIR/test_results.json"
  if [[ ! -f "$results" ]]; then
    fail "test_results.json ไม่พบ"
    return
  fi
  pass "test_results.json exists"

  if command -v python3 &>/dev/null; then
    python3 - << EOF
import json, sys
with open("$results") as f:
    r = json.load(f)

failed = r.get('failed', -1)
coverage = r.get('coverage_percent', -1)
lint_errors = r.get('lint_errors', [])
typecheck_errors = r.get('typecheck_errors', [])

if failed == 0:
    print("  ✅ PASS — Tests: 0 failed")
elif failed > 0:
    print(f"  ❌ FAIL — Tests: {failed} failed")
    sys.exit(1)

if coverage >= 70:
    print(f"  ✅ PASS — Coverage: {coverage}%")
else:
    print(f"  ⚠️ WARN — Coverage: {coverage}% (threshold: 70%)")

if not lint_errors:
    print("  ✅ PASS — Lint: 0 errors")
else:
    print(f"  ❌ FAIL — Lint: {len(lint_errors)} errors")
    sys.exit(1)

if not typecheck_errors:
    print("  ✅ PASS — TypeCheck: 0 errors")
else:
    print(f"  ❌ FAIL — TypeCheck: {len(typecheck_errors)} errors")
    sys.exit(1)
EOF
  else
    pass "test_results.json exists (install python3 for detailed validation)"
  fi
}

# ===== Findings Validation =====
validate_findings() {
  section "Findings Validation (Lane B)"

  if [[ ! -d "$FINDINGS_DIR" ]]; then
    warn "ไม่มี findings directory — อาจเป็น backend-only job"
    return
  fi

  local findings="$FINDINGS_DIR/findings.yaml"
  if [[ ! -f "$findings" ]]; then
    warn "findings.yaml ไม่พบ — Lane B อาจไม่ได้รัน"
    return
  fi
  pass "findings.yaml exists"

  # ตรวจ critical findings
  if command -v python3 &>/dev/null; then
    python3 - << EOF
import yaml, sys
with open("$findings") as f:
    data = yaml.safe_load(f)
findings_list = data.get('findings', [])
critical = [f for f in findings_list if f.get('severity') == 'critical' and not f.get('waived', False)]
high = [f for f in findings_list if f.get('severity') == 'high' and not f.get('waived', False)]

if critical:
    print(f"  ❌ FAIL — Critical findings (unwaived): {len(critical)}")
    for f in critical:
        print(f"    - {f.get('finding_id')}: {f.get('description', '')[:80]}")
    sys.exit(1)
else:
    print(f"  ✅ PASS — No critical findings")

# ตรวจ screenshot refs
for f in findings_list:
    ref = f.get('screenshot_ref')
    if not ref:
        print(f"  ⚠️ WARN — Finding {f.get('finding_id')} ไม่มี screenshot_ref")
    else:
        import os
        screenshot_path = "$FINDINGS_DIR/screenshots/" + ref
        if os.path.exists(screenshot_path):
            print(f"  ✅ PASS — Screenshot exists: {ref}")
        else:
            print(f"  ⚠️ WARN — Screenshot not found: {ref}")
EOF
  else
    pass "findings.yaml exists (install python3 for detailed validation)"
  fi
}

# ===== Summary =====
main() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Artifact Validator — Job: $JOB_ID"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  validate_spec
  validate_tasks
  validate_test_results
  validate_findings

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "  Errors:   ${RED}$ERRORS${NC}"
  echo -e "  Warnings: ${YELLOW}$WARNINGS${NC}"

  if [[ $ERRORS -gt 0 ]]; then
    echo -e "  ${RED}❌ VALIDATION FAILED — แก้ไข $ERRORS errors ก่อนส่ง review${NC}"
    exit 1
  else
    echo -e "  ${GREEN}✅ VALIDATION PASSED — พร้อมส่ง review${NC}"
  fi
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

main "$@"
