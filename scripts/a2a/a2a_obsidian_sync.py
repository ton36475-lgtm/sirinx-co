#!/usr/bin/env python3
"""Append concise A2A work pulses to the SIRINX Obsidian Brain."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from _common import ensure_runtime, mask_secret_text, now_iso, runtime_path, write_json

DIGEST = Path("/Users/sirinx/Documents/Obsidian Vault/SIRINX/AI HQ Knowledge Digest.md")
VAULT_ROOT = Path("/Users/sirinx/Documents/Obsidian Vault/SIRINX")
RUNTIME_JSONL = runtime_path("memory", "obsidian_sync.jsonl")

SECRET_HINTS = [
    re.compile(r"kob_[A-Za-z0-9_-]{8,}"),
    re.compile(r"sk-[A-Za-z0-9_-]{12,}"),
    re.compile(r"Bearer\s+[A-Za-z0-9._-]+", re.I),
    re.compile(r"(api[_-]?key|token|secret|password)\s*[:=]\s*[^\s]+", re.I),
]


def assert_safe(text: str) -> None:
    for pattern in SECRET_HINTS:
        if pattern.search(text):
            raise SystemExit("blocked: secret-like value detected in Obsidian sync input")


def build_entry(title: str, summary: str, source: str, next_action: str) -> str:
    stamp = now_iso()
    safe_title = mask_secret_text(title.strip())
    safe_summary = mask_secret_text(summary.strip())
    safe_source = mask_secret_text(source.strip())
    safe_next = mask_secret_text(next_action.strip())
    for value in (safe_title, safe_summary, safe_source, safe_next):
        assert_safe(value)
    return "\n".join(
        [
            "",
            f"## {stamp} - {safe_title}",
            "",
            f"- Summary: {safe_summary}",
            f"- Source: `{safe_source}`",
            f"- Next action: `{safe_next}`",
            "- Policy: local-only Obsidian Brain sync; no secrets, provider calls, clone, deploy, push, or public endpoint.",
            "",
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Append a safe Obsidian Brain sync pulse")
    parser.add_argument("--title", required=True)
    parser.add_argument("--summary", required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--next-action", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    ensure_runtime()
    if not VAULT_ROOT.exists():
        raise SystemExit(f"blocked: vault root missing: {VAULT_ROOT}")
    if not DIGEST.exists():
        raise SystemExit(f"blocked: digest note missing: {DIGEST}")

    entry = build_entry(args.title, args.summary, args.source, args.next_action)
    event = {
        "created_at": now_iso(),
        "title": mask_secret_text(args.title),
        "summary": mask_secret_text(args.summary),
        "source": mask_secret_text(args.source),
        "next_action": mask_secret_text(args.next_action),
        "digest": str(DIGEST),
        "dry_run": args.dry_run,
    }

    if args.dry_run:
        print(entry)
        return 0

    with DIGEST.open("a", encoding="utf-8") as fh:
        fh.write(entry)
    RUNTIME_JSONL.parent.mkdir(parents=True, exist_ok=True)
    with RUNTIME_JSONL.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(event, ensure_ascii=False, sort_keys=True) + "\n")
    write_json(runtime_path("memory", "obsidian_sync_last.json"), event)
    print(f"appended {DIGEST}")
    print(f"wrote {RUNTIME_JSONL}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
