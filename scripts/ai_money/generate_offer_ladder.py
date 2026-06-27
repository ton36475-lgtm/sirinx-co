#!/usr/bin/env python3
from __future__ import annotations

from _common import RUNTIME_ROOT, ensure_dirs, parser, print_result, write_json


def main() -> int:
    args = parser("Generate AI Money offer ladder.").parse_args()
    ensure_dirs()
    payload = {
        "project": args.project,
        "niche": args.niche,
        "offers": [
            {"name": "AI Local Promo Pack", "price_thb": "3500-7900", "goal": "first proof and local cashflow"},
            {"name": "Prompt & Template Pack", "price_thb": "390-9900", "goal": "digital product scale"},
            {"name": "AI Content Agency", "price_thb_monthly": "9900-39000+", "goal": "recurring revenue"},
            {"name": "AI Automation Service", "price_thb": "15000-120000", "goal": "high-ticket workflow setup"},
        ],
    }
    path = args.output or (RUNTIME_ROOT / "offers" / f"offer_ladder_{args.date}.json")
    write_json(path, payload)
    print_result("offer_ladder", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
