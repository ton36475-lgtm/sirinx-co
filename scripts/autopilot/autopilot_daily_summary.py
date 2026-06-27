#!/usr/bin/env python3
from __future__ import annotations

import json

from _common import AUDIT_ROOT, REPORT_ROOT, audit, today, write_json, parser, print_json


def main() -> int:
    parser("Create Autopilot daily summary.").parse_args()
    audit_file = AUDIT_ROOT / f"{today()}.jsonl"
    counts: dict[str, int] = {}
    if audit_file.exists():
        for line in audit_file.read_text(encoding="utf-8").splitlines():
            try:
                event = json.loads(line).get("event", "unknown")
            except json.JSONDecodeError:
                event = "invalid_json"
            counts[event] = counts.get(event, 0) + 1
    output = REPORT_ROOT / f"autopilot_daily_summary_{today()}.json"
    write_json(output, {"date": today(), "audit_file": str(audit_file), "event_counts": counts})
    audit({"event": "autopilot.daily_summary", "output": str(output)})
    print_json({"summary_file": str(output), "event_counts": counts})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
