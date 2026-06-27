#!/usr/bin/env python3
"""KOB adapter that creates dry-run command plans by default."""

from __future__ import annotations

import argparse

from _common import ensure_runtime, now_iso, runtime_path, safe_run, sha256_text, task_id, write_json

MODEL_MAP = {
    "opus-5": "anthropic/claude-opus-4.8",
    "fable-5": "anthropic/claude-fable-5",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a KOB dry-run command plan")
    parser.add_argument("--model", default="opus-5")
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    ensure_runtime()
    model = MODEL_MAP.get(args.model, args.model)
    command = ["kob", "ask", "-m", model, args.prompt]
    report = {
        "created_at": now_iso(),
        "adapter": "kob",
        "mode": "execute" if args.execute else "dry_run",
        "command_hash": sha256_text(" ".join(command)),
        "command_preview": ["kob", "ask", "-m", model, "<prompt>"],
    }
    if args.execute:
        report["result"] = safe_run(command, timeout=60)
    out = runtime_path("artifacts", f"{task_id('KOB')}.json")
    write_json(out, report)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
