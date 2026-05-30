# Agent Swarm Database Operations Policy

## Purpose

Define how SIRINX extends the governed five-agent core with database administration depth and brain-skill bootstrap support without granting uncontrolled production autonomy.

## Scope

This policy applies to:

- Hermes-controlled server bootstrap
- PostgreSQL and pgvector readiness review
- Redis and n8n queue-mode dependency checks
- mentor-to-apprentice operational handoff packets

## Specialist Lanes

### Database Steward

The Database Steward lane may:

- inspect PostgreSQL and pgvector readiness
- review WAL, PITR, backup, and restore drill posture
- prepare DB bootstrap packets and preflight findings
- validate queue-mode dependencies for Redis and n8n

The Database Steward lane must not:

- run destructive SQL on production
- rotate secrets from chat
- promote field context into package truth
- claim migration completion without Validator evidence

### Mentor and Apprentice

The Mentor lane may:

- turn approved runbooks into deterministic starter packets
- define escalation rules for junior agents
- prepare rollout checklists for Hermes-controlled setup

The Apprentice lane may:

- execute deterministic tasks from a mentor packet
- collect evidence
- rerun validations and path checks

The Apprentice lane must not:

- improvise system changes
- grant itself new privileges
- continue if validator or approval gates are missing

## Database Boundaries

- PostgreSQL remains the target durable database for approved internal automation and retrieval.
- `pgvector` is allowed as the retrieval extension only on the approved PostgreSQL target.
- Until migration approval is granted, public runtime may continue to operate without live PostgreSQL cutover.
- Database bootstrap must remain staging-first and server-local.

## Brain Skill Boundaries

- Brain Skill assets are operational packets, starter checklists, and validated internal prompts.
- They are not a bypass around governance, secrets policy, or live deployment approval.
- All starter packets must point back to canonical contracts and runbooks.

## Rollback Note

If a DB bootstrap or mentor packet widens privilege, targets a live database, or routes around Validator/Delivery gates, disable the specialist lane, preserve artifacts, and revert to the last approved server bootstrap sequence.

## Audit Trail Note

Keep:

- specialist lane packet
- validator output
- server preflight output
- DB preflight output
- bootstrap summary
- reviewer and approver

## Approval Packet

Use `governance/records/APPROVAL_PACKET_HERMES_DATABASE_BRAIN_ENABLEMENT_2026-04-24.md` before promoting this policy into a live deployment plan.
