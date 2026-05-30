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
ARTIFACT_DIR="$ROOT/artifacts/db-preflight/$STAMP"
mkdir -p "$ARTIFACT_DIR"

echo "SIRINX database operations preflight" | tee "$ARTIFACT_DIR/summary.log"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing required command: $1" >&2
    return 1
  fi
}

need_file() {
  if [ ! -f "$1" ]; then
    echo "missing required file: $1" >&2
    return 1
  fi
}

need_cmd docker
need_cmd bash

need_file docker-compose.yml
need_file infra/postgres/init/001-enable-pgvector.sql
need_file infra/backup/PG_DURABILITY_POLICY.md
need_file governance/AGENT_SWARM_DATABASE_OPERATIONS_POLICY.md
need_file .ops/contracts/DATABASE_STEWARD_SCHEMA.json

docker compose -f docker-compose.yml config > "$ARTIFACT_DIR/docker-compose-config.yml"

python3 - <<'PY' > "$ARTIFACT_DIR/db-preflight.json"
import json
from pathlib import Path

root = Path.cwd()
compose = (root / "docker-compose.yml").read_text(encoding="utf-8")
report = {
    "status": "preflight-ready",
    "target_service": "sirinx-postgres",
    "pgvector_expected": "pgvector/pgvector:pg16" in compose,
    "queue_mode_expected": "EXECUTIONS_MODE: queue" in compose,
    "runner_expected": "n8nio/runners:1.116.2" in compose,
    "required_docs": {
        "durability_policy": (root / "infra/backup/PG_DURABILITY_POLICY.md").exists(),
        "db_ops_policy": (root / "governance/AGENT_SWARM_DATABASE_OPERATIONS_POLICY.md").exists(),
        "db_contract": (root / ".ops/contracts/DATABASE_STEWARD_SCHEMA.json").exists(),
    },
    "notes": [
        "Preflight is dry-run only.",
        "No destructive SQL or production migration was executed.",
        "Validator evidence is still required before any staged automation activation."
    ]
}
print(json.dumps(report, indent=2))
PY

cat <<'EOF' | tee -a "$ARTIFACT_DIR/summary.log"
Database Steward preflight complete.
- PostgreSQL/pgvector target was inspected through compose config only.
- WAL/PITR policy remains approval-gated.
- No live database change was executed.
EOF
