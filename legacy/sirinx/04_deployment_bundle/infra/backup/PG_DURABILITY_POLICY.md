# PostgreSQL Durability Policy

## Scope

This policy applies when the v15 PostgreSQL target becomes the live SIRINX database.

## Required Settings

- WAL enabled with archive destination configured.
- `pgvector` extension enabled only on the approved PostgreSQL target.
- Daily logical backup.
- Base backup via `pg_basebackup` or managed equivalent before first production cutover.
- At least one automated restore rehearsal before cutover.
- Separate backup storage from the primary host.
- Backup encryption managed outside the repo.
- Redis/BullMQ and n8n queue state must be treated as recoverable operational state, not the durable source of truth.

## Backup Cadence

| Artifact | Cadence | Retention |
| --- | --- | --- |
| WAL archive | Continuous | 7 days minimum |
| Base backup | Daily before cutover, then per RPO | 7 days minimum |
| Logical dump | Daily | 14 days minimum |
| Full restore rehearsal | Before cutover, then monthly | Latest evidence retained |

## Restore Drill

1. Create a non-production database.
2. Restore the latest backup.
3. Run schema checks.
4. Run app smoke against restored database.
5. Confirm `pgvector` extension and vector indexes exist if the custom AI framework is enabled.
6. Record evidence in the deployment audit trail.

## n8n Queue Durability

The approved target is:

- `EXECUTIONS_MODE=queue`
- Redis/BullMQ on the private network only
- n8n main plus n8n worker services
- optional `n8nio/runners` service documented separately
- PostgreSQL-backed n8n state after migration approval

Queue backlogs, DLQs, and runner status may be displayed in the Omniscient Dashboard, but the dashboard must remain read-only by default.

## Rollback Rule

Any schema migration must define:

- Forward migration.
- Reverse migration or restore point.
- Data loss risk.
- Expected downtime.
- Approver.
