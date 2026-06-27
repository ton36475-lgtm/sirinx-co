# Approval Gate Policy

Status: legacy compatibility.

This file records the previous human approval-gated model. New autonomous work
uses:

- `docs/autopilot/AUTOPILOT_POLICY_SPEC.md`
- `docs/autopilot/EXECUTION_LEASE_SPEC.md`
- `policies/autopilot_policy.yaml`

Approval packets are replaced by job manifests and execution leases. Human
approval is no longer a normal execution state; policy allow/block/quarantine
is the active decision mechanism.

## Gate Classes

### Read-Only Gate

Allowed: inspect files, list status, read docs, map repo, produce reports.

Blocked: edits, dependency installs, network mutation, service start, provider
call, deploy, push, publish.

### Docs-Only Gate

Allowed: approved docs, specs, templates, local plans, and non-executable
control-plane files.

Blocked: source implementation, scripts, external clone, runtime mutation, live
message send.

### Safe Script Gate

Allowed: approved local scripts that are read-only by default, confirm before
mutation, and never print secrets.

Blocked: running clone/start/API scripts unless separately approved.

### Implementation Gate

Allowed: minimal source changes for the approved scope and targeted validation.

Blocked: unrelated refactors, broad rewrites, external calls.

### External Action Gate

Requires PRE_APPROVAL_PACKET and human approval before clone, install, Docker
start, provider call, deploy, push, publish, public access, or live send.

## Approval Packet Requirements

- Goal.
- Scope.
- Files to change.
- Commands to run.
- External services touched.
- Secrets required.
- Risks.
- Rollback.
- Tests.
- Human approval checkbox.
- Stop condition.

## Stop Rules

Stop when secrets, network mutation, public exposure, service start, global
config changes, dirty-work conflicts, or destructive commands are required.
