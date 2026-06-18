#!/usr/bin/env bash
set -u

# Create a local PRE_APPROVAL_PACKET draft.
# This script writes a markdown packet only. It does not deploy, push, publish,
# call APIs, start services, or read secrets.

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

OUT_DIR="docs/approval"
STAMP="$(date +%Y%m%d_%H%M)"
OUT="$OUT_DIR/PRE_APPROVAL_PACKET_$STAMP.md"

mkdir -p "$OUT_DIR"

BRANCH="$(git branch --show-current 2>/dev/null || echo unknown)"
STATUS="$(git status --short 2>/dev/null || true)"

cat >"$OUT" <<EOF
# PRE_APPROVAL_PACKET $STAMP

## Goal

TBD

## Scope

TBD

## Files To Change

TBD

## Commands To Run

TBD

## External Services Touched

None proposed yet.

## Secrets Required

None proposed yet. List environment variable names only, never values.

## Current Git Context

- Branch: $BRANCH

\`\`\`text
$STATUS
\`\`\`

## Risks

- Security: TBD
- Licensing: TBD
- External service: TBD
- Deployment: TBD
- Model/API cost: TBD

## Rollback

TBD

## Tests

TBD

## Human Approval Checkbox

- [ ] I approve this bounded action.

## Stop Condition

Stop immediately if the command needs secrets, external mutation, public access,
service start, deploy, push, publish, or any unlisted file changes.
EOF

printf 'created %s\n' "$OUT"
