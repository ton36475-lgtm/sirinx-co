# A2A Executor Lease and Lock Policy

The A2A bridge uses leases and lane locks to prevent several AI executors from
editing the same repo surface at the same time.

## Lease

A lease is a runtime JSON document under:

`~/SIRINXDev/.ghostclaw_runtime/a2async/state/executor_leases/`

It grants one executor a bounded scope. A lease is not a permission to deploy,
push, publish, or read secrets.

## Lane Lock

A lane lock is a runtime JSON document under:

`~/SIRINXDev/.ghostclaw_runtime/a2async/state/lane_locks/`

It prevents simultaneous mutation by Codex, OpenCode, and AGY on the same lane.

## Required State Transition

```text
queued task
-> policy check
-> lease created
-> lane lock acquired
-> command plan artifact
-> scoped execution or dry-run
-> Codex-local review
-> validation
-> lock release
```

## Failure Behavior

- Missing lease: block.
- Existing lock owned by another executor: quarantine or skip.
- Missing validation command: block.
- Broad path with no scope: block.
- Secret-like path: block.

## Review Rule

Codex-local owns the final review. OpenCode and AGY may produce scoped changes
only after lease and lock checks; Codex-local reviews the resulting diff before
staging or commit.
