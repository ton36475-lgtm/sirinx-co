#!/usr/bin/env python3
from __future__ import annotations

from _common import RUNTIME_ROOT, ensure_dirs, parser, print_result, write_csv


def main() -> int:
    args = parser("Create local business lead tracker template.").parse_args()
    ensure_dirs()
    fields = ["lead_name", "niche", "source", "contact_channel", "opt_in", "stage", "next_action", "notes"]
    rows = [
        {
            "lead_name": "Example local fruit shop",
            "niche": args.niche,
            "source": "owned research",
            "contact_channel": "LINE OA / Facebook page",
            "opt_in": "unknown",
            "stage": "research",
            "next_action": "create portfolio sample before outreach",
            "notes": "Do not auto-send until opt-in or owned inbound context exists",
        }
    ]
    path = args.output or (RUNTIME_ROOT / "leads" / f"local_business_leads_{args.date}.csv")
    write_csv(path, rows, fields)
    print_result("lead_tracker", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
