#!/usr/bin/env bash
# ======================================================
# job_status_report.sh
# แสดง status รายงาน jobs ทั้งหมดหรือ job เฉพาะ
# Usage: ./tools/reporters/job_status_report.sh [job_id|all]
# ======================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
JOB_FILTER="${1:-all}"

JOBS_DIR="$PROJECT_ROOT/state/jobs"

# ===== Colors =====
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; MAGENTA='\033[0;35m'
BOLD='\033[1m'; NC='\033[0m'

status_icon() {
  case "$1" in
    pending)      echo "⏳" ;;
    planning)     echo "📋" ;;
    executing)    echo "⚙️" ;;
    reviewing)    echo "🔍" ;;
    blocked)      echo "🚫" ;;
    approved)     echo "✅" ;;
    merged)       echo "🔀" ;;
    released)     echo "🚀" ;;
    failed)       echo "💥" ;;
    cancelled)    echo "❌" ;;
    *)            echo "❓" ;;
  esac
}

status_color() {
  case "$1" in
    pending|planning)   echo "${CYAN}" ;;
    executing)          echo "${BLUE}" ;;
    reviewing)          echo "${YELLOW}" ;;
    blocked|failed)     echo "${RED}" ;;
    approved|merged|released) echo "${GREEN}" ;;
    *)                  echo "${NC}" ;;
  esac
}

print_job() {
  local job_id="$1"
  local job_state="$JOBS_DIR/$job_id/job_state.yaml"

  if [[ ! -f "$job_state" ]]; then
    echo -e "  ${YELLOW}⚠️  $job_id — no job_state.yaml${NC}"
    return
  fi

  local status title priority
  status=$(grep "^status:" "$job_state" 2>/dev/null | awk '{print $2}' || echo "unknown")
  title=$(grep "^title:" "$job_state" 2>/dev/null | cut -d'"' -f2 || echo "unknown")
  priority=$(grep "^priority:" "$job_state" 2>/dev/null | awk '{print $2}' || echo "medium")

  local icon
  icon=$(status_icon "$status")
  local color
  color=$(status_color "$status")

  printf "  ${BOLD}%-15s${NC} ${color}%-12s${NC} %s %-8s %s\n" \
    "$job_id" "$status" "$icon" "[$priority]" "$title"

  # ตรวจสอบ quality gates ถ้ามี
  local qg_file="$JOBS_DIR/$job_id/test_results.json"
  if [[ -f "$qg_file" ]] && command -v python3 &>/dev/null; then
    local failed
    failed=$(python3 -c "import json; d=json.load(open('$qg_file')); print(d.get('failed',0))" 2>/dev/null || echo "?")
    local coverage
    coverage=$(python3 -c "import json; d=json.load(open('$qg_file')); print(d.get('coverage_percent',0))" 2>/dev/null || echo "?")
    printf "  %-15s ${CYAN}tests: %s failed, coverage: %s%%${NC}\n" "" "$failed" "$coverage"
  fi
}

print_summary() {
  local total=0 active=0 blocked=0 done=0 failed=0

  for job_dir in "$JOBS_DIR"/*/; do
    [[ -d "$job_dir" ]] || continue
    local job_state="$job_dir/job_state.yaml"
    [[ -f "$job_state" ]] || continue

    local status
    status=$(grep "^status:" "$job_state" 2>/dev/null | awk '{print $2}' || echo "unknown")
    ((total++))

    case "$status" in
      executing|reviewing|planning) ((active++)) ;;
      blocked|failed) ((blocked++)); [[ "$status" == "failed" ]] && ((failed++)) ;;
      merged|released|approved) ((done++)) ;;
    esac
  done

  echo ""
  echo -e "${BOLD}Summary:${NC} Total: $total | Active: ${BLUE}$active${NC} | Blocked: ${RED}$blocked${NC} | Done: ${GREEN}$done${NC} | Failed: ${RED}$failed${NC}"
}

main() {
  echo ""
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${CYAN}  OpenClaw Job Status Report${NC}"
  echo -e "${BOLD}${CYAN}  Generated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  printf "  ${BOLD}%-15s %-12s %-3s %-8s %s${NC}\n" "JOB ID" "STATUS" "" "PRIORITY" "TITLE"
  printf "  ${BOLD}%s${NC}\n" "$(printf '%.0s─' {1..75})"

  if [[ "$JOB_FILTER" == "all" ]]; then
    local found=false
    for job_dir in "$JOBS_DIR"/*/; do
      [[ -d "$job_dir" ]] || continue
      local job_id
      job_id=$(basename "$job_dir")
      [[ "$job_id" == ".gitkeep" ]] && continue
      [[ "$job_id" == "archive" ]] && continue
      print_job "$job_id"
      found=true
    done
    if ! $found; then
      echo "  ไม่มี jobs"
    fi
    print_summary
  else
    print_job "$JOB_FILTER"
  fi

  echo ""
}

main "$@"
