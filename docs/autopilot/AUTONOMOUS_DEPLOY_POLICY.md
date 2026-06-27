# Autonomous Deploy Policy

Status: active design layer.

## Deploy Criteria

Autonomous deploy is allowed only when all conditions pass:

- Branch policy permits deploy.
- Tests pass.
- Build passes.
- Secret scan is clean or classified.
- Backup is complete.
- Canary or preview route is available.
- Health check passes.
- Rollback command is available.
- Error budget is within cap.

## Blocked Deploy Conditions

- Failed tests or build.
- Missing rollback.
- Public bind of raw database/model/vector/admin ports.
- Disabled auth.
- Missing budget cap.
- Unknown environment target.
- Secrets in tracked files.

## Default

Production deploy is policy-blocked until a concrete deploy policy is filled
for the target project and environment.
