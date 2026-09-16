#!/usr/bin/env bash
# One-command A2A handshake for ANY agentic coding worker.
# Run from any terminal (Codex sidebar/footer terminal, Kimi CLI shell,
# a Claude session, a bare Mac terminal):
#
#   CONTROL=http://127.0.0.1:8711 CONTROL_API_TOKEN=... \
#     ./scripts/a2a-handshake.sh agent:codex "Codex worker" coding,rust-build
#
# What it does:
#   1. Registers/refreshes this worker's card on OmniRoute (A2A sync).
#   2. Pulls the shared queue and prints unclaimed work with planRefs.
#   3. Prints the claim + protocol reminder (CODEX_HANDOFF.md).
# Read-only apart from the card registration; claiming stays explicit.

set -euo pipefail

AGENT_ID="${1:?usage: a2a-handshake.sh <agent-id> [name] [cap1,cap2,...]}"
AGENT_NAME="${2:-$AGENT_ID}"
CAPS="${3:-coding}"
CONTROL="${CONTROL:-http://127.0.0.1:8711}"

if [ -z "${CONTROL_API_TOKEN:-}" ]; then
    echo "warn: CONTROL_API_TOKEN not set — works only against a tokenless local dev control plane" >&2
fi

caps_json=$(printf '%s' "$CAPS" | awk -F, '{for(i=1;i<=NF;i++) printf "%s\"%s\"", (i>1?",":""), $i}')

echo "== 1/3 registering $AGENT_ID on $CONTROL =="
sync_response=$(curl -fsS -X POST "$CONTROL/api/a2a/sync" \
    ${CONTROL_API_TOKEN:+-H "Authorization: Bearer $CONTROL_API_TOKEN"} \
    -H "content-type: application/json" \
    -d "{\"node\":{\"id\":\"$AGENT_ID\",\"name\":\"$AGENT_NAME\",\"capabilities\":[$caps_json],\"endpoint\":\"\",\"priority\":0},\"knownWorkIds\":[]}")

peers=$(printf '%s' "$sync_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | sort -u | tr '\n' ' ')
echo "   mesh peers: $peers"

echo "== 2/3 unclaimed work on the shared queue =="
printf '%s' "$sync_response" | python3 -c '
import json, sys
data = json.load(sys.stdin)
work = data.get("missingWork", [])
if not work:
    print("   (queue empty here — with DATABASE_URL set this shows the shared queue; see MASTER_PLAN.md section B)")
for item in work:
    ref = (item.get("detail") or {}).get("planRef", "-")
    print("   [%s] %s  (id: %s...)" % (ref, item["title"], item["id"][:8]))
'

echo "== 3/3 next steps =="
cat <<'EOT'
   1. Read MASTER_PLAN.md, then CODEX_HANDOFF.md.
   2. Claim ONE item before starting (set claimed_by = your agent id).
   3. Work the method: ทวนคำสั่ง → Context → Plan → Implement → Verify →
      Report → Commit. Full verification chain before any "done".
   4. Gated actions are always dry-run + escalate. Human ตัดสินใจสุดท้าย.
EOT
