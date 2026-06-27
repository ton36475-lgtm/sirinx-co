#!/usr/bin/env python3
from __future__ import annotations

from _common import RUNTIME_ROOT, ensure_dirs, parser, print_result, write_json


def main() -> int:
    args = parser("Create daily KPI summary.").parse_args()
    ensure_dirs()
    payload = {
        "date": args.date,
        "project": args.project,
        "niche": args.niche,
        "revenue_thb": 0,
        "new_leads": 0,
        "qualified_leads": 0,
        "conversations": 0,
        "offers_sent": 0,
        "closed_deals": 0,
        "content_items": 0,
        "case_studies": 0,
        "next_focus": "seed first AI Local Promo Pack proof asset",
    }
    path = args.output or (RUNTIME_ROOT / "kpi" / f"daily_kpi_{args.date}.json")
    write_json(path, payload)
    print_result("daily_kpi", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
