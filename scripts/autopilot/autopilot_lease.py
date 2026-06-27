#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt

from _common import (
    LEASE_ROOT,
    audit,
    budget_ledger_metadata,
    command_hash_metadata,
    load_task,
    now_iso,
    parser,
    rate_ledger_metadata,
    stable_id,
    write_json,
    print_json,
)


def lease(task: dict) -> dict:
    goal = str(task.get("goal", ""))
    lease_id = stable_id("LEASE", goal)
    expires = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=12)).astimezone().isoformat(timespec="seconds")
    guard_metadata = {
        **command_hash_metadata(task),
        **budget_ledger_metadata(task),
        **rate_ledger_metadata(task),
    }
    return {
        "lease_id": lease_id,
        "mode": "FULL_AUTO",
        "task_id": task.get("task_id"),
        "project": task.get("project", "GHOSTCLAW"),
        "goal": goal,
        "action_type": task.get("action_type", "inspect"),
        "risk_tier": task.get("risk_tier", "A0"),
        "policy_decision": task.get("policy_decision", "auto_allow_policy_controlled"),
        "contract_status": task.get("contract_status", "unknown"),
        "missing_requirements": task.get("missing_requirements", []),
        "expires_at": expires,
        "rollback_required": True,
        "audit_required": True,
        "kill_switch_checked": True,
        "created_at": now_iso(),
        **guard_metadata,
    }


def main() -> int:
    args = parser("Create an Autopilot execution lease.").parse_args()
    payload = lease(load_task(args))
    output = args.output or (LEASE_ROOT / f"{payload['lease_id']}.json")
    write_json(output, payload)
    audit({"event": "autopilot.lease_created", "lease_file": str(output), "lease": payload})
    print_json({"lease_file": str(output), "lease": payload})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
