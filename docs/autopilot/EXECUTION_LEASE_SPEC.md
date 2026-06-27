# Execution Lease Spec

Status: active design layer.

## Purpose

An execution lease replaces human approval tokens. It is created automatically
when policy allows a task and defines the exact scope the executor may use.

## Shape

```json
{
  "lease_id": "LEASE-YYYYMMDD-NNNN",
  "mode": "FULL_AUTO",
  "task_id": "TASK-YYYYMMDD-NNNN",
  "task": "start_flowise_localhost",
  "scope": "local_docker_service",
  "risk_tier": "A3",
  "policy_decision": "auto_allow_with_limits",
  "action_type": "docker_localhost_start",
  "contract_status": "validated",
  "missing_requirements": [],
  "expires_at": "2026-06-20T23:59:00+07:00",
  "allowed_paths": [],
  "allowed_repositories": [],
  "allowed_commands_hash": "sha256:placeholder",
  "budget_cap_usd": 0,
  "rate_limit_key": "local_service_start",
  "rollback_required": true,
  "audit_required": true,
  "kill_switch_checked": true
}
```

## Lease Rules

- A lease is scoped to one task.
- A lease must expire.
- A lease must not include secret values.
- A lease must include rollback/quarantine requirements for risky work.
- A lease for an external adapter must include contract status and missing
  requirement details.
- Executors must re-check the kill switch immediately before execution.

Adapter contracts are defined in
`docs/autopilot/AUTOPILOT_ADAPTER_CONTRACTS.md`.
