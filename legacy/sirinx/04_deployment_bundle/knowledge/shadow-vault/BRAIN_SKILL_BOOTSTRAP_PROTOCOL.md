# Brain Skill Bootstrap Protocol

## Purpose

Provide the governed protocol for staging Hermes brain-skill assets and mentor packets so junior agents can continue deterministic work after source delivery reaches the target server.

## Runtime Paths

Default server-local paths:

- `runtime/hermes/brain-skills`
- `runtime/hermes/agent-packets`
- `runtime/hermes/logs`

Recommended packet layout:

- `runtime/hermes/agent-packets/db`
- `runtime/hermes/agent-packets/mentor`
- `runtime/hermes/agent-packets/apprentice`

## Packet Sources

Hermes should draw from:

- `MULTI_AGENT_SYSTEM_PROMPTS.md`
- `ORCHESTRATION_SCHEMA.json`
- `.ops/contracts/DATABASE_STEWARD_SCHEMA.json`
- `.ops/contracts/MENTOR_BOOTSTRAP_SCHEMA.json`
- `docs/migration/HERMES_DATABASE_BRAIN_SETUP_RUNBOOK.md`
- `docs/migration/HERMES_AGENT_SERVER_CONTINUATION_PACKET.md`

## Mentor to Apprentice Flow

1. Mentor reads the approved runbook and contracts.
2. Mentor emits a starter packet that defines:
   - exact task scope
   - required paths
   - validator gates
   - escalation rule
3. Apprentice executes only those deterministic steps.
4. Validator checks output before Hermes routes the next action.

## Database Steward Flow

1. Hermes requests DB bootstrap or preflight.
2. Database Steward emits a packet for PostgreSQL/pgvector readiness.
3. `infra/scripts/db-ops-preflight.sh` generates evidence.
4. Validator confirms no live-cutover, no destructive DB action, and no secret drift.

## Safety Rules

- No raw production credentials inside packets.
- No destructive SQL or migration execution by default.
- No promotion of field hardware context into locked package truth.
- No cutover claim until server and validator evidence both exist.

## Rollback Note

If a starter packet is missing, stale, or references non-existent files, stop apprentice execution and regenerate the packet from the canonical repo.

## Audit Trail Note

Retain the mentor packet, apprentice evidence, DB preflight log, and validator result in the server-local artifacts directory.
