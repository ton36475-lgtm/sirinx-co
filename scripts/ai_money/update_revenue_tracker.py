#!/usr/bin/env python3
from __future__ import annotations

from _common import RUNTIME_ROOT, ensure_dirs, parser, print_result, write_csv


def main() -> int:
    args = parser("Create or refresh revenue tracker template.").parse_args()
    ensure_dirs()
    fields = ["date", "offer", "client", "amount_thb", "cost_thb", "profit_thb", "status", "notes"]
    rows = [
        {
            "date": args.date,
            "offer": "AI Local Promo Pack",
            "client": "Example client",
            "amount_thb": "0",
            "cost_thb": "0",
            "profit_thb": "0",
            "status": "template",
            "notes": "Replace with real paid client data only when safe to store locally",
        }
    ]
    path = args.output or (RUNTIME_ROOT / "revenue" / f"revenue_tracker_{args.date}.csv")
    write_csv(path, rows, fields)
    print_result("revenue_tracker", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
