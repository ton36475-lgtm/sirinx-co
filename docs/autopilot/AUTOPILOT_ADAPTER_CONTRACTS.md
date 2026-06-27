# Autopilot Adapter Contracts

Status: active hardening contract with machine-readable registry.

## Purpose

Autopilot must not execute real external actions just because a task has a
policy decision. Every action that can mutate external state, start a service,
spend money, publish content, send messages, or expose a port needs an adapter
contract first.

The contract is the boundary between:

```text
policy decision -> execution lease -> adapter preflight -> adapter execution
```

Until an adapter contract is validated, the executor must quarantine the task.

Machine-readable registry:

```text
policies/autopilot_adapter_registry.json
```

## Current Core Behavior

The hardened core now separates local artifact work from real external actions:

| Class             | Examples                                               | Default                               |
| ----------------- | ------------------------------------------------------ | ------------------------------------- |
| Local artifact    | docs, manifests, reports, local JSON/CSV/MD            | allow as policy-controlled local work |
| External adapter  | clone, Docker start, API smoke, MCP/n8n activation     | quarantine unless contract validated  |
| Business action   | social publish, email/LINE/Telegram send, CRM write    | quarantine unless contract validated  |
| Production action | deploy, push, merge, public endpoint                   | quarantine unless contract validated  |
| Hard safety block | secrets, captcha bypass, quota bypass, non-opt-in spam | hard block                            |

## Required Lease Fields

Every lease should carry:

```json
{
  "lease_id": "LEASE-...",
  "task_id": "TASK-...",
  "mode": "FULL_AUTO",
  "project": "GHOSTCLAW",
  "goal": "task text",
  "action_type": "docker_localhost_start",
  "risk_tier": "A3",
  "policy_decision": "auto_quarantine",
  "contract_status": "missing",
  "missing_requirements": ["missing adapter contract validation"],
  "expires_at": "timestamp",
  "rollback_required": true,
  "audit_required": true,
  "kill_switch_checked": true,
  "command_hash_status": "verified",
  "allowed_command_hashes": ["sha256:..."],
  "allowed_command_count": 1,
  "budget_ledger_status": "planned",
  "budget_category": "provider_api_smoke",
  "estimated_cost_usd": 0.01,
  "budget_cap_usd": 1.0,
  "rate_ledger_status": "planned",
  "rate_limit_key": "providers"
}
```

For local artifact actions, command hashes and ledgers may be
`not_required`. For external `auto_allow_with_limits` leases, executor code
must quarantine the lease if command hash verification is `missing` or
`mismatch`, or if budget/rate metadata is blocked.

## Adapter Contract Registry

The registry currently defines contract fields and validators for:

- `docker_localhost_start`
- `external_repo_clone`
- `provider_api_smoke`
- `mcp_connector_activation`

The current core implementation reads the registry, validates required fields,
and applies per-adapter checks before allowing a lease.

### `external_repo_clone`

Required fields:

- `target_repository`
- `target_path`
- `rollback_command`

Rules:

- repository must be in `policies/allowed_external_repos.yaml`
- clone path must be under `/Users/sirinx/SIRINXDev/_external_repos`
- no dependency install during clone
- no lifecycle script execution
- audit report required

### `docker_localhost_start`

Required fields:

- `service_name`
- `localhost_bind`
- `auth_required`
- `rollback_command`

Rules:

- rendered compose config must bind only to `127.0.0.1` or `localhost`
- auth/token must be required when the service is a control plane
- stop command must be known before start
- evidence directory must be outside git
- no personal browser profile reuse

Current validator checks:

- required fields exist
- `adapter_contract_validated` is true
- `localhost_bind` starts with `127.0.0.1` or `localhost`
- `auth_required` is true when the registry requires auth

### `provider_api_smoke`

Required fields:

- `provider_name`
- `budget_cap_usd`
- `rate_limit_key`

Rules:

- key must come from environment only
- key must never be printed
- prompt must be harmless and small
- budget ledger must have room
- no private repo/client data is sent

Current validator checks:

- provider exists in registry
- requested `budget_cap_usd` is numeric
- requested `budget_cap_usd` does not exceed provider cap
- `rate_limit_key` matches provider policy

### `mcp_connector_activation`

Required fields:

- `connector_name`
- `auth_required`
- `rollback_command`

Rules:

- connector config must not contain real secrets in tracked files
- activation must be local or project-scoped
- deactivation/rollback command required
- no connector mutation without audit log

Current validator checks:

- connector exists in registry allowlist
- `auth_required` is true when the registry requires auth

### `n8n_workflow_activation`

Required fields:

- `workflow_name`
- `rate_limit_key`
- `rollback_command`

Rules:

- workflow must be imported as inactive first
- live sends disabled unless opt-in/channel rules pass
- deactivate command required
- execution log required

### `social_publish`

Required fields:

- `channel`
- `rate_limit_key`
- `rollback_command`

Rules:

- channel must be in `policies/allowed_publish_channels.yaml`
- owned channel only
- rate limit must pass
- content safety check required
- rollback may be delete/unpublish where supported

### `email_or_line_send`

Required fields:

- `channel`
- `opt_in_proof`
- `rate_limit_key`
- `rollback_command`

Rules:

- opt-in proof required
- unsubscribe/opt-out path required for email campaigns
- no scraped-contact outreach
- no non-opt-in broadcast

### `deploy`

Required fields:

- `target_environment`
- `tests_green`
- `backup_ready`
- `rollback_command`

Rules:

- tests/build must pass
- rollback path must exist
- canary/health check required
- no raw database/model/vector/admin port public exposure

### `git_remote_mutation`

Required fields:

- `target_remote`
- `tests_green`
- `rollback_command`

Rules:

- branch must be cleanly staged by lane
- no unrelated dirty changes may be included
- push/merge/rebase requires green verification evidence

## Current Implementation Mapping

`scripts/autopilot/autopilot_classify.py` maps goal text into these action
types. `scripts/autopilot/autopilot_decide.py` auto-classifies the goal when a
task lacks `action_type`, calls the adapter contract check, and quarantines
missing or unknown contracts. `scripts/autopilot/autopilot_lease.py` copies
contract fields into the lease.

The validator code currently lives in `scripts/autopilot/_common.py`.

This means a task like:

```text
start PinchTab docker localhost service
```

is classified as `docker_localhost_start` and quarantined until the lease has a
validated adapter contract.

## Runtime Guard Ledgers

The executor writes local ledger reservations only after policy and lease guards
pass:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/budgets/
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/rate_limits/
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/command_hashes/
```

These files are runtime audit artifacts, not source-of-truth business records.
They exist so a later adapter runner can prove the command, spend category, and
rate bucket were frozen before execution.

## Next Hardening Step

The next implementation layer should add adapter runners that consume validated
leases. Until runner code exists, external adapters may receive
`auto_allow_with_limits` decisions but should still be treated as preflight-only;
do not run Docker/API/MCP/clone commands through Autopilot yet. A runner must
compare the command it intends to run against the lease command hash before any
real external action.
