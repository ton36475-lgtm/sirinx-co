#!/usr/bin/env python3
"""Safe local discovery for A2A CLI peers and environment presence."""

from __future__ import annotations

import os

from _common import ensure_runtime, now_iso, runtime_path, safe_run, write_json


COMMANDS = [
    ["which", "kob"],
    ["kob", "--version"],
    ["kob", "--help"],
    ["kob", "models"],
    ["kob", "profiles"],
    ["which", "codex"],
    ["codex", "--version"],
    ["codex", "--help"],
    ["which", "opencode"],
    ["opencode", "--version"],
    ["which", "agy"],
    ["agy", "--version"],
    ["node", "--version"],
    ["npm", "--version"],
]

ENV_PREFIXES = ("NODE_OPTIONS", "KOB", "CODEX", "OPENCODE", "AGY", "OPENAI", "ANTHROPIC")


def env_presence() -> dict[str, str]:
    result: dict[str, str] = {}
    for key in sorted(os.environ):
        if key.startswith(ENV_PREFIXES):
            result[key] = "<set>" if os.environ.get(key) else "<empty>"
    return result


def main() -> int:
    ensure_runtime()
    checks = [safe_run(cmd, timeout=8) for cmd in COMMANDS]
    report = {
        "created_at": now_iso(),
        "checks": checks,
        "env_presence": env_presence(),
        "notes": [
            "Secret-like values are masked.",
            "This command performs discovery only and does not call provider APIs directly.",
        ],
    }
    out = runtime_path("logs", "healthcheck.json")
    write_json(out, report)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
