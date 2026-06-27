#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

from _common import (
    AUTOPILOT_ROOT,
    audit,
    execution_guard_issues,
    kill_switch_on,
    parser,
    read_json,
    record_runtime_ledgers,
    write_json,
    print_json,
)


def main() -> int:
    args = parser("Execute a leased Autopilot task as a local artifact.").parse_args()
    if not args.lease_file:
        raise SystemExit("--lease-file is required")
    lease = read_json(args.lease_file)
    if kill_switch_on():
        result = {"status": "skipped", "reason": "kill_switch_on", "lease_id": lease.get("lease_id")}
        audit({"event": "autopilot.execute_skipped", **result})
        print_json(result)
        return 0
    decision = lease.get("policy_decision")
    if decision not in ("auto_allow", "auto_allow_with_limits", "auto_allow_policy_controlled"):
        result = {"status": "quarantined", "reason": "policy_not_allow", "lease_id": lease.get("lease_id")}
        write_json(AUTOPILOT_ROOT / "quarantined" / f"{lease.get('lease_id')}.json", {**lease, **result})
        audit({"event": "autopilot.execute_quarantined", **result})
        print_json(result)
        return 0
    guard_issues = execution_guard_issues(lease)
    if guard_issues:
        result = {
            "status": "quarantined",
            "reason": "external_execution_guard_failed",
            "lease_id": lease.get("lease_id"),
            "guard_issues": guard_issues,
        }
        write_json(AUTOPILOT_ROOT / "quarantined" / f"{lease.get('lease_id')}.json", {**lease, **result})
        audit({"event": "autopilot.execute_quarantined", **result})
        print_json(result)
        return 0
    ledger_paths = record_runtime_ledgers(lease)
    artifact: Path = AUTOPILOT_ROOT / "completed" / f"{lease.get('lease_id')}.json"
    payload = {**lease, "status": "completed", "artifact_type": "local_autopilot_marker", "ledger_paths": ledger_paths}
    write_json(artifact, payload)
    audit({"event": "autopilot.executed", "lease_id": lease.get("lease_id"), "artifact": str(artifact), "ledgers": ledger_paths})
    print_json({"status": "completed", "artifact": str(artifact), "lease_id": lease.get("lease_id"), "ledgers": ledger_paths})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
