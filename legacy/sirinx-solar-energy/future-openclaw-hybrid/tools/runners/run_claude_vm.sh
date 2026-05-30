#!/usr/bin/env bash
# ======================================================
# run_claude_vm.sh
# รัน Claude Computer Operator ใน isolated Docker VM
# Usage: ./tools/runners/run_claude_vm.sh {job_id} [staging_url]
# ======================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ===== Arguments =====
JOB_ID="${1:-}"
STAGING_URL="${2:-http://localhost:3002}"

if [[ -z "$JOB_ID" ]]; then
  echo "ERROR: ต้องระบุ job_id"
  echo "Usage: $0 {job_id} [staging_url]"
  echo "Example: $0 2026-001"
  echo "Example: $0 2026-001 http://localhost:3002"
  exit 1
fi

# ===== Paths =====
FINDINGS_OUT="$PROJECT_ROOT/state/findings/$JOB_ID"
SCREENSHOTS_OUT="$FINDINGS_OUT/screenshots"
TASKS_IN="$PROJECT_ROOT/state/jobs/$JOB_ID/tasks.yaml"
SCENARIOS_IN="$PROJECT_ROOT/docs/specs/active/$JOB_ID/test_scenarios.md"
AUDIT_FILE="$PROJECT_ROOT/state/audit.jsonl"
LOG_FILE="$PROJECT_ROOT/state/logs/claude-vm-$JOB_ID.log"

CONTAINER_NAME="claude-vm-$JOB_ID"
IMAGE_NAME="claude-computer-isolated:latest"

# ===== Colors =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌${NC} $1" | tee -a "$LOG_FILE"; }

audit() {
  local action="$1"
  local details="$2"
  echo "{\"timestamp\":\"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\",\"job_id\":\"$JOB_ID\",\"agent\":\"claude_vm_runner\",\"action\":\"$action\",\"details\":\"$details\"}" >> "$AUDIT_FILE"
}

# ===== Security Validation =====
validate_security() {
  log "ตรวจสอบ security constraints..."

  # ห้าม staging_url ชี้ไปยัง production
  if echo "$STAGING_URL" | grep -qE "^https?://(app\.|api\.)?sirinx\.com"; then
    error "SECURITY VIOLATION: ห้ามใช้ production URL กับ Claude Computer VM"
    error "URL: $STAGING_URL"
    audit "security_violation" "attempted_production_url=$STAGING_URL"
    exit 1
  fi

  # ตรวจว่าไม่มี production credentials ใน environment
  for var in PRODUCTION_API_KEY PROD_DB_URL STRIPE_SECRET_KEY; do
    if [[ -n "${!var:-}" ]]; then
      error "SECURITY VIOLATION: พบ production credential ใน environment: $var"
      error "ห้าม inject production secrets เข้า Claude VM"
      audit "security_violation" "found_production_secret=$var"
      exit 1
    fi
  done

  success "Security validation passed"
}

# ===== Pre-flight Checks =====
preflight_check() {
  log "ตรวจสอบ prerequisites..."

  # ตรวจ Docker
  if ! command -v docker &> /dev/null; then
    error "Docker ไม่ได้ install หรือไม่อยู่ใน PATH"
    exit 1
  fi

  if ! docker ps &> /dev/null; then
    error "Docker daemon ไม่ได้รัน"
    exit 1
  fi

  # ตรวจ input files
  if [[ ! -f "$TASKS_IN" ]]; then
    error "ไม่พบ tasks.yaml: $TASKS_IN"
    exit 1
  fi

  if [[ ! -f "$SCENARIOS_IN" ]]; then
    error "ไม่พบ test_scenarios.md: $SCENARIOS_IN"
    error "Planner ต้องสร้างไฟล์นี้ก่อน"
    exit 1
  fi

  # ตรวจว่า staging accessible
  log "ตรวจสอบ staging URL: $STAGING_URL"
  if ! curl -s --max-time 5 "$STAGING_URL" > /dev/null 2>&1; then
    warn "Staging URL ไม่ตอบสนอง: $STAGING_URL"
    warn "รัน staging server แล้วหรือยัง? (y/N)"
    read -r confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
      exit 1
    fi
  fi

  # สร้าง output directories
  mkdir -p "$FINDINGS_OUT" "$SCREENSHOTS_OUT"

  # ตรวจว่าไม่มี container ค้างอยู่
  if docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
    warn "พบ container เก่า: $CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME" 2>&1 | tee -a "$LOG_FILE"
    warn "ลบ container เก่าแล้ว"
  fi

  success "Pre-flight checks ผ่าน"
}

# ===== Build or Pull Image =====
prepare_image() {
  log "เตรียม Docker image: $IMAGE_NAME..."

  local dockerfile="$PROJECT_ROOT/tools/docker/claude-vm/Dockerfile"

  if docker image inspect "$IMAGE_NAME" &> /dev/null; then
    log "Image มีอยู่แล้ว: $IMAGE_NAME"
  elif [[ -f "$dockerfile" ]]; then
    log "Build image จาก Dockerfile..."
    docker build -t "$IMAGE_NAME" "$(dirname "$dockerfile")" 2>&1 | tee -a "$LOG_FILE"
    success "Build image สำเร็จ"
  else
    warn "ไม่พบ Dockerfile ใช้ base image แทน"
    IMAGE_NAME="ubuntu:22.04"
  fi
}

# ===== Run VM =====
run_vm() {
  log "กำลังรัน Claude Computer VM..."
  log "Container: $CONTAINER_NAME"
  log "Staging URL: $STAGING_URL"
  log "Findings output: $FINDINGS_OUT"

  audit "vm_starting" "container=$CONTAINER_NAME staging_url=$STAGING_URL"

  docker run \
    --name "$CONTAINER_NAME" \
    --rm \
    --network bridge \
    --memory 4g \
    --cpus 2 \
    --security-opt no-new-privileges \
    --read-only \
    --tmpfs /tmp:rw,noexec,nosuid,size=1g \
    --tmpfs /run:rw,noexec,nosuid,size=100m \
    -e JOB_ID="$JOB_ID" \
    -e STAGING_URL="$STAGING_URL" \
    -e CLAUDE_OPERATOR_VERSION="1.0" \
    -v "$FINDINGS_OUT:/output/findings:rw" \
    -v "$SCREENSHOTS_OUT:/output/screenshots:rw" \
    -v "$TASKS_IN:/input/tasks.yaml:ro" \
    -v "$SCENARIOS_IN:/input/test_scenarios.md:ro" \
    --stop-timeout 60 \
    "$IMAGE_NAME" \
    /bin/bash -c "
      echo 'Claude Computer VM started'
      echo 'Job: $JOB_ID'
      echo 'Staging: $STAGING_URL'
      # TODO: เรียก Claude Computer Use API ที่นี่
      # claude-computer run --scenarios /input/test_scenarios.md --output /output/
      echo 'VM session ready — ส่ง test scenarios ให้ Claude Computer'
    " 2>&1 | tee -a "$LOG_FILE"

  local exit_code=$?

  if [[ $exit_code -eq 0 ]]; then
    success "Claude VM session เสร็จสิ้น"
    audit "vm_completed" "exit_code=0"
  else
    error "Claude VM session ล้มเหลว (exit code: $exit_code)"
    audit "vm_failed" "exit_code=$exit_code"
    exit $exit_code
  fi
}

# ===== Collect and Validate Output =====
collect_output() {
  log "ตรวจสอบ output artifacts..."

  local has_findings=false
  local has_screenshots=false

  if [[ -f "$FINDINGS_OUT/findings.yaml" ]]; then
    has_findings=true
    success "findings.yaml: ✅"
  else
    warn "findings.yaml ไม่พบ — Claude Operator อาจไม่ได้สร้าง"
  fi

  local screenshot_count
  screenshot_count=$(find "$SCREENSHOTS_OUT" -name "*.png" -o -name "*.jpg" | wc -l)
  if [[ $screenshot_count -gt 0 ]]; then
    has_screenshots=true
    success "Screenshots: ✅ ($screenshot_count รูป)"
  else
    warn "ไม่พบ screenshots ใน $SCREENSHOTS_OUT"
  fi

  if $has_findings; then
    log "Artifacts พร้อมสำหรับ Visual Verifier"
    log "รัน: openclaw run visual_verifier --job $JOB_ID"
    audit "artifacts_collected" "findings=$has_findings screenshots=$screenshot_count"
  else
    error "ไม่มี artifacts — ตรวจสอบ VM logs"
    audit "artifacts_missing" "findings=$has_findings screenshots=$screenshot_count"
    return 1
  fi
}

# ===== Cleanup =====
cleanup() {
  local exit_code=$?
  # ลบ container ถ้ายังค้างอยู่
  if docker ps --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    log "Container stopped and removed"
  fi
  if [[ $exit_code -ne 0 ]]; then
    error "VM run failed for job $JOB_ID"
  fi
}
trap cleanup EXIT

# ===== Main =====
main() {
  mkdir -p "$(dirname "$LOG_FILE")"
  touch "$AUDIT_FILE"

  log "================================================"
  log "OpenClaw Claude Computer VM Runner"
  log "Job ID: $JOB_ID"
  log "Staging: $STAGING_URL"
  log "================================================"

  audit "vm_runner_started" "job_id=$JOB_ID"

  validate_security
  preflight_check
  prepare_image
  run_vm
  collect_output

  success "Claude VM job เสร็จสิ้นสำหรับ $JOB_ID"
}

main "$@"
