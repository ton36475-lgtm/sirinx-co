# Workflow Map

Status: local-only canonical flow.

## Canonical Flow

```text
Goal -> Plan -> PRD -> Issues -> Tasks -> Diff -> Verify -> Budget Gate -> Approval Packet -> Stop
```

## Stage Definitions

| Stage | Output | Stop Condition |
|---|---|---|
| Goal | Clear user intent and target repo | Stop if root/path is ambiguous |
| Plan | Local-only task sequence | Stop if external actions are needed |
| PRD | Product/business requirements | Stop if requirements conflict |
| Issues | Work items and owners | Stop if scope becomes too broad |
| Tasks | File-level execution plan | Stop if dirty work may be overwritten |
| Diff | Minimal patch | Stop if implementation was not approved |
| Verify | Tests, syntax checks, screenshots, or dry-run evidence | Stop on failed safety check |
| Budget Gate | Usage, quota, infra cost, queue limit, and rollback check | Stop if cost/rate limit is undefined |
| Approval Packet | Scope, commands, risks, rollback, tests | Stop until human approval |
| Stop | Report current state and next safe command | Never silently continue into external action |

## Worker Rule

Workers may prepare the next packet, but they must not cross approval gates.

## Evidence Rule

Every claim must be linked to local evidence, current command output, checked
files, or explicitly marked as memory-derived and potentially stale.

## Budget Rule

Before any public launch, fleet run, paid provider call, or production deploy,
the worker must identify cost surfaces: compute, database, storage, egress, AI
API, email, analytics, queue, and worker runtime. Missing usage limits are a
stop condition.
