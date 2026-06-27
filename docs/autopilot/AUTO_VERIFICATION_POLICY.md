# Auto Verification Policy

Status: active design layer.

## Verification By Work Type

| Work type      | Required checks                                                           |
| -------------- | ------------------------------------------------------------------------- |
| Code           | lint, tests, typecheck, build where available, diff check                 |
| Docs           | markdown sanity, link/path check where practical, duplicate section check |
| Scripts        | shell syntax or Python compile, no secret printing, safe defaults         |
| Local services | localhost bind check, auth check, health check                            |
| n8n/workflows  | JSON validation, dry-run where available, execution log check             |
| Marketing      | opt-in check, rate limit, banned-word check, owned-channel whitelist      |
| Deploy         | CI green, backup ready, canary healthy, rollback ready                    |

## Failure Behavior

- First failure: auto retry if retry budget remains.
- Repeated failure: auto rollback if possible.
- No rollback path: quarantine and continue to the next safe task.
- Verification output must be logged without printing secrets.
