#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${APP_DIR:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi
cd "$ROOT"

STAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
ARTIFACT_DIR="$ROOT/artifacts/hermes-bootstrap/$STAMP"
RUNTIME_ROOT="${HERMES_RUNTIME_ROOT:-$ROOT/runtime/hermes}"
BRAIN_ROOT="${BRAIN_SKILL_ROOT:-$RUNTIME_ROOT/brain-skills}"
PACKET_ROOT="${AGENT_PACKET_ROOT:-$RUNTIME_ROOT/agent-packets}"

mkdir -p "$ARTIFACT_DIR" \
  "$BRAIN_ROOT" \
  "$PACKET_ROOT/db" \
  "$PACKET_ROOT/mentor" \
  "$PACKET_ROOT/apprentice" \
  "$RUNTIME_ROOT/logs"

echo "SIRINX Hermes brain bootstrap" | tee "$ARTIFACT_DIR/summary.log"

need_file() {
  if [ ! -f "$1" ]; then
    echo "missing required file: $1" >&2
    return 1
  fi
}

need_file MULTI_AGENT_SYSTEM_PROMPTS.md
need_file ORCHESTRATION_SCHEMA.json
need_file .ops/contracts/DATABASE_STEWARD_SCHEMA.json
need_file .ops/contracts/MENTOR_BOOTSTRAP_SCHEMA.json
need_file docs/migration/HERMES_DATABASE_BRAIN_SETUP_RUNBOOK.md
need_file knowledge/shadow-vault/BRAIN_SKILL_BOOTSTRAP_PROTOCOL.md

cat > "$PACKET_ROOT/db/DATABASE_STEWARD_STARTER.json" <<EOF
{
  "specialist_lane": "DatabaseSteward",
  "task_type": "preflight",
  "database_scope": {
    "engine": "postgresql",
    "target_service": "sirinx-postgres",
    "profile": "automation",
    "pgvector_expected": true
  },
  "approved_change_window": "pending-human-approval",
  "validator_gate_required": true,
  "actions_allowed": [
    "docker compose config",
    "policy and contract inspection",
    "preflight evidence collection"
  ],
  "actions_forbidden": [
    "destructive SQL",
    "production migration",
    "secret injection"
  ],
  "rollback_note": "Stop staged automation services and keep the database target in hold mode if preflight fails.",
  "audit_trail_note": "Preserve db-preflight artifacts and validator output."
}
EOF

cat > "$PACKET_ROOT/mentor/HERMES_MENTOR_STARTER.json" <<EOF
{
  "specialist_lane": "Mentor",
  "training_mode": "guided-handoff",
  "senior_agent": "Hermes",
  "apprentice_scope": [
    "contract validation",
    "bundle refresh",
    "path checks",
    "db preflight evidence collection"
  ],
  "starter_packet_refs": [
    "runtime/hermes/agent-packets/db/DATABASE_STEWARD_STARTER.json",
    "docs/migration/HERMES_DATABASE_BRAIN_SETUP_RUNBOOK.md",
    "knowledge/shadow-vault/BRAIN_SKILL_BOOTSTRAP_PROTOCOL.md"
  ],
  "validator_gate_required": true,
  "escalation_rule": "Escalate to Hermes and Validator if approval, secrets, or live infrastructure changes are required.",
  "allowed_actions": [
    "deterministic validation",
    "non-destructive bootstrap preparation",
    "artifact collection"
  ],
  "forbidden_actions": [
    "live cutover",
    "unapproved domain changes",
    "production secrets handling"
  ],
  "rollback_note": "Delete generated runtime packets and return to the last approved handoff state if packet drift is detected.",
  "audit_trail_note": "Preserve mentor packet, apprentice evidence, and validator result."
}
EOF

cat > "$PACKET_ROOT/apprentice/JUNIOR_AGENT_FIRST_TASKS.json" <<EOF
{
  "specialist_lane": "Apprentice",
  "required_packet": "runtime/hermes/agent-packets/mentor/HERMES_MENTOR_STARTER.json",
  "first_tasks": [
    "Run python infra/scripts/validate-agent-contracts.py",
    "Run docker compose -f docker-compose.yml config",
    "Run bash infra/scripts/db-ops-preflight.sh",
    "Collect artifacts for Validator review"
  ],
  "stop_conditions": [
    "Missing packet",
    "Missing approval",
    "Validator failure",
    "Any live infrastructure change request"
  ]
}
EOF

if [ "${SIRINX_STAGE_DATABASE:-0}" = "1" ]; then
  echo "running db-ops-preflight..." | tee -a "$ARTIFACT_DIR/summary.log"
  bash infra/scripts/db-ops-preflight.sh | tee "$ARTIFACT_DIR/db-ops-preflight.log"
else
  echo "db preflight skipped; set SIRINX_STAGE_DATABASE=1 to collect DB readiness evidence" | tee -a "$ARTIFACT_DIR/summary.log"
fi

cat <<EOF | tee -a "$ARTIFACT_DIR/summary.log"
Hermes brain bootstrap complete.
runtime_root=$RUNTIME_ROOT
brain_skill_root=$BRAIN_ROOT
packet_root=$PACKET_ROOT
EOF
