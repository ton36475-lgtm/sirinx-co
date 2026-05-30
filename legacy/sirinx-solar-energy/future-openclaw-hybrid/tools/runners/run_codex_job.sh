#!/usr/bin/env bash
# ======================================================
# run_codex_job.sh
# เรียกใช้ Codex job ด้วย worktree isolation
# Usage: ./tools/runners/run_codex_job.sh {job_id} [task_id]
# ======================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OPENCLAW_CONFIG="$PROJECT_ROOT/.openclaw/system.yaml"
CODEX_CONFIG="$PROJECT_ROOT/.codex/config.toml"

# ===== Arguments =====
JOB_ID="${1:-}"
TASK_ID="${2:-all}"  # 'all' = รันทุก task ใน job

if [[ -z "$JOB_ID" ]]; then
  echo "ERROR: ต้องระบุ job_id"
  echo "Usage: $0 {job_id} [task_id]"
  echo "Example: $0 2026-001"
  echo "Example: $0 2026-001 T01"
  exit 1
fi

# ===== Paths =====
JOB_STATE_DIR="$PROJECT_ROOT/state/jobs/$JOB_ID"
TASKS_FILE="$JOB_STATE_DIR/tasks.yaml"
REPO_MAP_FILE="$JOB_STATE_DIR/repo_map.yaml"
WORKTREE_PATH="$PROJECT_ROOT/.worktrees/job-$JOB_ID"
LOCKFILE="$WORKTREE_PATH/.openclaw.lock"
LOG_FILE="$PROJECT_ROOT/state/logs/codex-$JOB_ID.log"
AUDIT_FILE="$PROJECT_ROOT/state/audit.jsonl"

# ===== Colors =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌${NC} $1" | tee -a "$LOG_FILE"; }

# ===== Audit Log =====
audit() {
  local action="$1"
  local details="$2"
  echo "{\"timestamp\":\"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\",\"job_id\":\"$JOB_ID\",\"agent\":\"codex_runner\",\"action\":\"$action\",\"details\":\"$details\"}" >> "$AUDIT_FILE"
}

# ===== Pre-flight Checks =====
preflight_check() {
  log "ตรวจสอบ prerequisites สำหรับ job $JOB_ID..."

  # ตรวจ job state directory
  if [[ ! -d "$JOB_STATE_DIR" ]]; then
    error "ไม่พบ job state directory: $JOB_STATE_DIR"
    error "สร้าง job ก่อน: cp state/template_tasks.yaml state/jobs/$JOB_ID/tasks.yaml"
    exit 1
  fi

  # ตรวจ tasks.yaml
  if [[ ! -f "$TASKS_FILE" ]]; then
    error "ไม่พบ tasks.yaml: $TASKS_FILE"
    exit 1
  fi

  # ตรวจ repo_map.yaml
  if [[ ! -f "$REPO_MAP_FILE" ]]; then
    warn "ไม่พบ repo_map.yaml — Repo Cartographer ควรรันก่อน"
    warn "รันต่อโดยไม่มี repo_map? (y/N)"
    read -r confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      exit 1
    fi
  fi

  # ตรวจ lock (single writer enforcement)
  if [[ -f "$LOCKFILE" ]]; then
    local lock_agent
    lock_agent=$(grep -o '"agent":"[^"]*"' "$LOCKFILE" 2>/dev/null | cut -d'"' -f4 || echo "unknown")
    error "Worktree ถูก lock โดย: $lock_agent"
    error "Lockfile: $LOCKFILE"
    error "ถ้า agent crash แล้ว ลบ lockfile ด้วย: rm $LOCKFILE"
    exit 1
  fi

  success "Pre-flight checks ผ่าน"
}

# ===== Create Worktree =====
create_worktree() {
  log "สร้าง git worktree สำหรับ job $JOB_ID..."

  # อ่าน branch name จาก tasks.yaml หรือ job state
  local branch_name
  branch_name=$(grep "branch:" "$JOB_STATE_DIR/job_state.yaml" 2>/dev/null | awk '{print $2}' || echo "job/$JOB_ID/work")

  if [[ -d "$WORKTREE_PATH" ]]; then
    log "Worktree มีอยู่แล้ว: $WORKTREE_PATH"
  else
    git -C "$PROJECT_ROOT" worktree add "$WORKTREE_PATH" -b "$branch_name" 2>&1 | tee -a "$LOG_FILE"
    success "สร้าง worktree: $WORKTREE_PATH (branch: $branch_name)"
  fi

  audit "worktree_created" "path=$WORKTREE_PATH branch=$branch_name"
}

# ===== Acquire Lock =====
acquire_lock() {
  log "กำลัง acquire lock..."

  cat > "$LOCKFILE" << EOF
{
  "agent": "codex_implementer",
  "job_id": "$JOB_ID",
  "task_id": "$TASK_ID",
  "locked_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "pid": $$
}
EOF

  success "Lock acquired: $LOCKFILE"
  audit "lock_acquired" "lockfile=$LOCKFILE"
}

# ===== Release Lock =====
release_lock() {
  if [[ -f "$LOCKFILE" ]]; then
    rm "$LOCKFILE"
    success "Lock released"
    audit "lock_released" "lockfile=$LOCKFILE"
  fi
}

# ===== Run Quality Checks =====
run_quality_checks() {
  log "รัน quality checks..."

  cd "$WORKTREE_PATH"

  # Lint
  log "รัน lint..."
  if npm run lint 2>&1 | tee -a "$LOG_FILE"; then
    success "Lint: PASSED"
    audit "lint" "status=passed"
  else
    error "Lint: FAILED"
    audit "lint" "status=failed"
    return 1
  fi

  # TypeCheck
  log "รัน typecheck..."
  if npm run typecheck 2>&1 | tee -a "$LOG_FILE"; then
    success "TypeCheck: PASSED"
    audit "typecheck" "status=passed"
  else
    error "TypeCheck: FAILED"
    audit "typecheck" "status=failed"
    return 1
  fi

  # Tests
  log "รัน tests..."
  if npm test -- --coverage 2>&1 | tee -a "$LOG_FILE"; then
    success "Tests: PASSED"
    audit "tests" "status=passed"
  else
    error "Tests: FAILED"
    audit "tests" "status=failed"
    return 1
  fi

  success "Quality checks ทั้งหมดผ่าน"
}

# ===== Cleanup on Exit =====
cleanup() {
  local exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    error "Job $JOB_ID ล้มเหลว (exit code: $exit_code)"
    audit "job_failed" "exit_code=$exit_code"
  fi
  release_lock
}
trap cleanup EXIT

# ===== Main =====
main() {
  mkdir -p "$(dirname "$LOG_FILE")"
  touch "$AUDIT_FILE"

  log "================================================"
  log "OpenClaw Codex Job Runner"
  log "Job ID: $JOB_ID"
  log "Task: $TASK_ID"
  log "================================================"

  audit "job_started" "job_id=$JOB_ID task=$TASK_ID"

  preflight_check
  create_worktree
  acquire_lock

  log "Codex environment พร้อม"
  log "Worktree: $WORKTREE_PATH"
  log "Tasks: $TASKS_FILE"
  log ""
  log "ถัดไป: Codex Implementer จะอ่าน tasks.yaml และเริ่ม implement"
  log "Monitor progress ที่: $LOG_FILE"

  # ถ้ามี codex CLI ให้รัน — uncomment บรรทัดด้านล่าง
  # codex run --worktree "$WORKTREE_PATH" \
  #   --tasks "$TASKS_FILE" \
  #   --task-id "$TASK_ID" \
  #   --config "$CODEX_CONFIG"

  success "Codex job environment ready สำหรับ $JOB_ID"
  audit "job_environment_ready" "worktree=$WORKTREE_PATH"
}

main "$@"
