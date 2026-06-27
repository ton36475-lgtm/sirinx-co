# Autopilot State Machine

Status: active design layer.

## Success Path

```text
RECEIVED
-> CLASSIFIED
-> PLANNED
-> POLICY_CHECKED
-> EXECUTION_LEASED
-> EXECUTING
-> VERIFYING
-> COMPLETED
-> MEMORY_WRITTEN
```

## Failure Path

```text
FAILED
-> AUTO_RETRY
-> VERIFYING
-> COMPLETED
```

If retries fail:

```text
FAILED
-> AUTO_ROLLBACK
-> QUARANTINED
-> LOGGED
-> NEXT_TASK_CONTINUES
```

## Policy Block Path

```text
POLICY_BLOCKED
-> LOGGED
-> SKIP_TASK
-> CONTINUE_NEXT_TASK
```

There is no `PENDING_APPROVAL` state in full-auto mode.

## State Rules

- Every task must have exactly one current state.
- Retry count must be recorded.
- Rollback state must reference the artifact or backup used.
- Quarantine must include reason, policy rule, task id, and next safe action.
