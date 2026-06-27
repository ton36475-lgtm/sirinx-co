#!/usr/bin/env python3
from __future__ import annotations

from _common import REPORT_ROOT, audit, now_iso, parser, write_json, print_json


def main() -> int:
    args = parser("Write a non-secret Autopilot memory summary.").parse_args()
    payload = {
        "created_at": now_iso(),
        "project": args.project,
        "summary": args.goal or "Autopilot memory writeback summary",
        "secret_policy": "values_masked_never_printed",
    }
    output = args.output or (REPORT_ROOT / "autopilot_memory_writeback.json")
    write_json(output, payload)
    audit({"event": "autopilot.memory_writeback", "output": str(output), "project": args.project})
    print_json({"memory_writeback": str(output)})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
