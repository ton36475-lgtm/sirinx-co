#!/usr/bin/env python3
from __future__ import annotations

from _common import AUTOPILOT_ROOT, audit, parser, read_json, write_json, print_json


def main() -> int:
    args = parser("Record an Autopilot rollback/quarantine action.").parse_args()
    if not args.lease_file:
        raise SystemExit("--lease-file is required")
    lease = read_json(args.lease_file)
    payload = {**lease, "status": "rolled_back_or_quarantined", "rollback_type": "record_only"}
    output = AUTOPILOT_ROOT / "quarantined" / f"{lease.get('lease_id')}.json"
    write_json(output, payload)
    audit({"event": "autopilot.rollback_recorded", "lease_id": lease.get("lease_id"), "output": str(output)})
    print_json({"status": "rolled_back_or_quarantined", "output": str(output)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
