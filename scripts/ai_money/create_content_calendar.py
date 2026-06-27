#!/usr/bin/env python3
from __future__ import annotations

from _common import RUNTIME_ROOT, ensure_dirs, parser, print_result, write_csv


def main() -> int:
    args = parser("Create 7-day content calendar.").parse_args()
    ensure_dirs()
    fields = ["day", "theme", "format", "hook", "cta", "status"]
    rows = [
        {"day": "Day 1", "theme": "before/after", "format": "image post", "hook": "ร้านธรรมดาให้ดูเป็นแบรนด์ใน 7 วัน", "cta": "DM for promo pack", "status": "draft"},
        {"day": "Day 2", "theme": "pain point", "format": "short video", "hook": "ทำไมรูปสินค้าไม่ทำให้คนอยากซื้อ", "cta": "send product photo", "status": "draft"},
        {"day": "Day 3", "theme": "proof", "format": "case-style post", "hook": "ตัวอย่างแพ็กโปรโมทร้านผลไม้", "cta": "book sample", "status": "draft"},
        {"day": "Day 4", "theme": "education", "format": "carousel", "hook": "3 ภาพที่ร้านอาหารควรมี", "cta": "save checklist", "status": "draft"},
        {"day": "Day 5", "theme": "offer", "format": "offer post", "hook": "AI Local Promo Pack", "cta": "limited slots", "status": "draft"},
        {"day": "Day 6", "theme": "behind the scenes", "format": "short video", "hook": "จากบรีฟถึงพรอมป์", "cta": "ask for template", "status": "draft"},
        {"day": "Day 7", "theme": "recap", "format": "story/reel", "hook": "7 วัน 10 คอนเทนต์พร้อมขาย", "cta": "start next week", "status": "draft"},
    ]
    path = args.output or (RUNTIME_ROOT / "content" / f"content_calendar_{args.date}.csv")
    write_csv(path, rows, fields)
    print_result("content_calendar", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
