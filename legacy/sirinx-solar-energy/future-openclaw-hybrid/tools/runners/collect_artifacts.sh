#!/usr/bin/env bash
# ======================================================
# collect_artifacts.sh
# รวบรวมและ validate artifacts จากทั้ง Lane A และ Lane B
# Usage: ./tools/runners/collect_artifacts.sh {job_id}
# ======================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

JOB_ID="${1:-}"
if [[ -z "$JOB_ID" ]]; then
  echo "Usage: $0 {job_id}"
  exit 1
fi

# ===== Paths =====
JOB_DIR="$PROJECT_ROOT/state/jobs/$JOB_ID"
FINDINGS_DIR="$PROJECT_ROOT/state/findings/$JOB_ID"
REVIEWS_DIR="$PROJECT_ROOT/state/reviews/$JOB_ID"
WORKTREE="$PROJECT_ROOT/.worktrees/job-$JOB_ID"
AUDIT_FILE="$PROJECT_ROOT/state/audit.jsonl"

# ===== Colors =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✅]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠️]${NC} $1"; }
error() { echo -e "${RED}[❌]${NC} $1"; }
header() { echo -e "${CYAN}$1${NC}"; }

audit() {
  echo "{\"timestamp\":\"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\",\"job_id\":\"$JOB_ID\",\"agent\":\"collect_artifacts\",\"action\":\"$1\",\"details\":\"$2\"}" >> "$AUDIT_FILE"
}

# ===== Check Artifact =====
check_artifact() {
  local name="$1"
  local path="$2"
  local required="${3:-true}"

  if [[ -f "$path" ]]; then
    local size
    size=$(du -h "$path" | awk '{print $1}')
    success "$name: ✅ ($size)"
    return 0
  elif [[ "$required" == "true" ]]; then
    error "$name: ❌ MISSING — $path"
    return 1
  else
    warn "$name: ⚠️ not present (optional) — $path"
    return 0
  fi
}

# ===== Collect Lane A Artifacts =====
collect_lane_a() {
  header "━━━ Lane A Artifacts (Codex Engineering) ━━━"

  local missing=0

  check_artifact "tasks.yaml" "$JOB_DIR/tasks.yaml" "true" || ((missing++))
  check_artifact "repo_map.yaml" "$JOB_DIR/repo_map.yaml" "false"
  check_artifact "change_summary.md" "$JOB_DIR/change_summary.md" "true" || ((missing++))
  check_artifact "test_results.json" "$JOB_DIR/test_results.json" "true" || ((missing++))

  # ตรวจ git diff ใน worktree
  if [[ -d "$WORKTREE" ]]; then
    local commit_count
    commit_count=$(git -C "$WORKTREE" log main..HEAD --oneline 2>/dev/null | wc -l || echo "0")
    if [[ "$commit_count" -gt 0 ]]; then
      success "Git commits: ✅ ($commit_count commits on branch)"
    else
      warn "Git commits: ⚠️ ไม่มี commits บน branch — อาจยังทำงานไม่เสร็จ"
    fi
  else
    warn "Worktree ไม่พบ: $WORKTREE (อาจถูกลบแล้ว)"
  fi

  if [[ $missing -gt 0 ]]; then
    error "Lane A: ขาด $missing required artifacts"
    return 1
  fi

  success "Lane A artifacts: ครบถ้วน"
  return 0
}

# ===== Collect Lane B Artifacts =====
collect_lane_b() {
  header "━━━ Lane B Artifacts (Claude Computer) ━━━"

  # Lane B เป็น optional (ถ้า job ไม่มี UI verification)
  if [[ ! -d "$FINDINGS_DIR" ]]; then
    log "Lane B: ไม่มี findings directory — อาจเป็น backend-only job"
    return 0
  fi

  local missing=0

  check_artifact "findings.yaml" "$FINDINGS_DIR/findings.yaml" "false" || ((missing++))
  check_artifact "console_errors.json" "$FINDINGS_DIR/console_errors.json" "false"

  # ตรวจ screenshots
  local screenshot_count
  screenshot_count=$(find "$FINDINGS_DIR/screenshots" -name "*.png" -o -name "*.jpg" 2>/dev/null | wc -l || echo "0")
  if [[ "$screenshot_count" -gt 0 ]]; then
    success "Screenshots: ✅ ($screenshot_count รูป)"
  else
    warn "Screenshots: ⚠️ ไม่พบ"
  fi

  success "Lane B artifacts: รวบรวมแล้ว"
  return 0
}

# ===== Check Test Results =====
check_test_results() {
  header "━━━ Test Results Summary ━━━"

  local test_file="$JOB_DIR/test_results.json"
  if [[ ! -f "$test_file" ]]; then
    warn "ไม่พบ test_results.json"
    return 0
  fi

  # ใช้ python หรือ jq ถ้ามี
  if command -v python3 &>/dev/null; then
    python3 - << EOF
import json
with open("$test_file") as f:
    r = json.load(f)
total = r.get('total', 0)
passed = r.get('passed', 0)
failed = r.get('failed', 0)
coverage = r.get('coverage_percent', 0)
print(f"  Tests: {passed}/{total} passed")
print(f"  Failed: {failed}")
print(f"  Coverage: {coverage}%")
if failed > 0:
    print(f"  ❌ FAILED TESTS: {r.get('failed_tests', [])}")
elif coverage < 70:
    print(f"  ⚠️ Coverage ต่ำกว่า threshold (70%)")
else:
    print("  ✅ All quality gates passed")
EOF
  elif command -v jq &>/dev/null; then
    jq -r '"  Tests: \(.passed)/\(.total) passed, Coverage: \(.coverage_percent)%"' "$test_file"
  else
    log "ติดตั้ง python3 หรือ jq เพื่อดู test summary"
    cat "$test_file"
  fi
}

# ===== Check Findings Summary =====
check_findings_summary() {
  header "━━━ Findings Summary ━━━"

  local findings_file="$FINDINGS_DIR/findings.yaml"
  if [[ ! -f "$findings_file" ]]; then
    log "ไม่มี findings (backend-only หรือ Lane B ยังไม่รัน)"
    return 0
  fi

  if command -v python3 &>/dev/null; then
    python3 - << EOF
import yaml
with open("$findings_file") as f:
    data = yaml.safe_load(f)
findings = data.get('findings', [])
by_severity = {}
for f in findings:
    s = f.get('severity', 'unknown')
    by_severity[s] = by_severity.get(s, 0) + 1
print(f"  Total findings: {len(findings)}")
for sev, count in sorted(by_severity.items()):
    emoji = {'critical': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🟢', 'info': '⚪'}.get(sev, '•')
    print(f"  {emoji} {sev}: {count}")
critical = by_severity.get('critical', 0)
if critical > 0:
    print(f"  ❌ BLOCKED: {critical} critical findings")
else:
    print(f"  ✅ No critical blockers")
EOF
  else
    log "ติดตั้ง python3 เพื่อดู findings summary"
  fi
}

# ===== Generate Collection Report =====
generate_report() {
  header "━━━ Artifact Collection Report ━━━"

  local report_file="$JOB_DIR/artifact_collection_report.md"
  cat > "$report_file" << EOF
# Artifact Collection Report: $JOB_ID
**Generated:** $(date '+%Y-%m-%d %H:%M:%S')

## Lane A Status
$(check_artifact "tasks.yaml" "$JOB_DIR/tasks.yaml" "false" 2>&1)
$(check_artifact "change_summary.md" "$JOB_DIR/change_summary.md" "false" 2>&1)
$(check_artifact "test_results.json" "$JOB_DIR/test_results.json" "false" 2>&1)

## Lane B Status
$(check_artifact "findings.yaml" "$FINDINGS_DIR/findings.yaml" "false" 2>&1)
Screenshots: $(find "$FINDINGS_DIR/screenshots" -name "*.png" 2>/dev/null | wc -l) รูป

## Next Step
ส่ง artifacts ไปยัง Reviewer:
\`openclaw run reviewer --job $JOB_ID\`
EOF

  success "Report: $report_file"
}

# ===== Main =====
main() {
  echo ""
  header "════════════════════════════════════════════"
  header "  OpenClaw Artifact Collector"
  header "  Job: $JOB_ID"
  header "════════════════════════════════════════════"
  echo ""

  local lane_a_ok=true
  local lane_b_ok=true

  collect_lane_a || lane_a_ok=false
  echo ""
  collect_lane_b || lane_b_ok=false
  echo ""
  check_test_results
  echo ""
  check_findings_summary
  echo ""
  generate_report

  echo ""
  header "════════════════════════════════════════════"
  if $lane_a_ok; then
    success "Lane A: READY"
  else
    error "Lane A: INCOMPLETE"
  fi

  success "Collection complete สำหรับ job $JOB_ID"
  header "════════════════════════════════════════════"

  audit "artifacts_collected" "job_id=$JOB_ID lane_a_ok=$lane_a_ok lane_b_ok=$lane_b_ok"
}

main "$@"
