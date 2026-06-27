#!/usr/bin/env python3
from __future__ import annotations

from _common import audit, parser, read_json, print_json


def main() -> int:
    args = parser("Verify a local Autopilot artifact.").parse_args()
    target = args.output or args.lease_file or args.task_file
    if not target or not target.exists():
        result = {"verified": False, "reason": "target_missing", "target": str(target) if target else ""}
    else:
        payload = read_json(target)
        result = {"verified": bool(payload), "target": str(target), "keys": sorted(payload.keys())}
    audit({"event": "autopilot.verified", **result})
    print_json(result)
    return 0 if result["verified"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
