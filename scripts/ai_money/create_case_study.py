#!/usr/bin/env python3
from __future__ import annotations

from _common import RUNTIME_ROOT, ensure_dirs, parser, print_result, write_md


def main() -> int:
    args = parser("Create case study draft.").parse_args()
    ensure_dirs()
    path = args.output or (RUNTIME_ROOT / "case_studies" / f"case_study_{args.date}.md")
    text = f"""# Case Study Draft — {args.date}

Project: {args.project}
Niche: {args.niche}

## Client / Example
Local fruit or food shop.

## Problem
The business needs professional-looking visuals and short-form content without hiring a full creative team.

## Offer Used
AI Local Promo Pack.

## Deliverables
- 5 promotional images
- 3 short-video prompts
- 10 captions
- 7-day content calendar

## Before
- Existing visual quality:
- Posting consistency:
- Lead capture:

## After
- New creative assets:
- Content calendar:
- Lead capture path:

## Metrics
- Reach:
- Messages:
- Leads:
- Sales:

## Proof Needed
- screenshots
- customer quote
- before/after assets
- delivery checklist
"""
    write_md(path, text)
    print_result("case_study", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
