#!/usr/bin/env python3
from __future__ import annotations

from _common import RUNTIME_ROOT, ensure_dirs, parser, print_result, write_md


def main() -> int:
    args = parser("Create daily AI Money execution board.").parse_args()
    ensure_dirs()
    path = args.output or (RUNTIME_ROOT / "boards" / f"daily_money_board_{args.date}.md")
    text = f"""# Daily Money Board — {args.date}

Project: {args.project}
Niche: {args.niche}

## Market
- Pain point to validate:
- Competitor/content hook:
- Offer gap:

## Offer
- Primary offer: AI Local Promo Pack
- Price test:
- Bonus:

## Content
- Post 1:
- Post 2:
- Short video prompt:

## Lead
- New lead target:
- Lead source:
- Opt-in status:

## Sales
- Offer sent:
- Follow-up due:
- Objection:

## Delivery
- Active client:
- Deliverable due:
- Revision status:

## Proof
- Before/after:
- Testimonial request:
- Case study draft:

## KPI
- Revenue:
- New leads:
- Conversations:
- Closed deals:
- Case studies:
"""
    write_md(path, text)
    print_result("daily_money_board", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
