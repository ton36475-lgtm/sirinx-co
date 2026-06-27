#!/usr/bin/env python3
"""Shared helpers for AI Money System local artifact generators."""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
from pathlib import Path
from typing import Iterable


RUNTIME_ROOT = Path(os.environ.get("AI_MONEY_RUNTIME_ROOT", "~/SIRINXDev/.ghostclaw_runtime/ai_money")).expanduser()


def today() -> str:
    return dt.date.today().isoformat()


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).astimezone().isoformat(timespec="seconds")


def ensure_dirs() -> None:
    for name in ("boards", "offers", "leads", "content", "case_studies", "revenue", "kpi"):
        (RUNTIME_ROOT / name).mkdir(parents=True, exist_ok=True)


def write_md(path: Path, text: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")
    return path


def write_json(path: Path, payload: dict) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return path


def write_csv(path: Path, rows: Iterable[dict], fields: list[str]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    return path


def parser(description: str) -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description=description)
    p.add_argument("--project", default="AI Money System", help="Project name.")
    p.add_argument("--niche", default="local food and fruit shops", help="Target niche.")
    p.add_argument("--date", default=today(), help="Board date.")
    p.add_argument("--output", type=Path, help="Output path override.")
    return p


def print_result(kind: str, path: Path) -> None:
    print(json.dumps({"kind": kind, "path": str(path), "created_at": now_iso()}, ensure_ascii=False, indent=2))
