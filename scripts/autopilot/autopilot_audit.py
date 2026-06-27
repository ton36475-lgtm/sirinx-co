#!/usr/bin/env python3
from __future__ import annotations

from _common import AUDIT_ROOT, audit, today, parser, print_json


def main() -> int:
    args = parser("Append or show Autopilot audit status.").parse_args()
    if args.goal:
        path = audit({"event": "autopilot.audit_note", "project": args.project, "goal": args.goal})
    else:
        path = AUDIT_ROOT / f"{today()}.jsonl"
    print_json({"audit_file": str(path), "exists": path.exists()})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
