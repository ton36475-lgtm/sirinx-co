# Auto Rollback Policy

Status: active design layer.

## Rollback Requirement

Rollback is required for:

- Destructive filesystem changes.
- Database migrations.
- Deployments.
- Public workflow activation.
- Customer-facing message sends.
- Batch import/export actions.

## Rollback Methods

- Git patch reverse for source changes.
- Backup restore for data files.
- Workflow deactivate for automation.
- Service stop for localhost services.
- Canary rollback for deployments.
- Quarantine for artifacts that cannot be safely reversed.

## No Permanent Delete

Permanent deletion is blocked unless a backup or trash strategy is recorded in
the lease and audit log.
