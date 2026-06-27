#!/usr/bin/env python3
"""Create scoped executor leases for A2A local workers."""

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path

from _common import ensure_runtime, now_iso, runtime_path, slugify, task_id, write_json

EXECUTORS = {"codex-local", "opencode", "agy-antigravity2"}
BLOCKED_MARKERS = (
    ".env",
    "id_rsa",
    "credentials",
    "secrets",
    "private_keys",
    "browser_profiles",
    "token_stores",
)


def is_blocked_path(value: str) -> bool:
    lowered = value.lower()
    return any(marker in lowered for marker in BLOCKED_MARKERS)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create an A2A executor lease")
    parser.add_argument("--executor", required=True, choices=sorted(EXECUTORS))
    parser.add_argument("--lane", required=True)
    parser.add_argument("--goal", required=True)
    parser.add_argument("--task-id", default="")
    parser.add_argument("--allowed-path", action="append", required=True)
    parser.add_argument("--validation-command", action="append", required=True)
    parser.add_argument("--expires-minutes", type=int, default=60)
    parser.add_argument("--allow-execution", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    ensure_runtime()

    blocked = [path for path in args.allowed_path if is_blocked_path(path)]
    if blocked:
        report = {
            "created_at": now_iso(),
            "status": "blocked",
            "reason": "blocked_path_in_allowed_scope",
            "blocked_paths": blocked,
        }
        out = runtime_path("quarantined", f"{task_id('LEASE-BLOCK')}-{slugify(args.lane)}.json")
        write_json(out, report)
        print(f"blocked {out}")
        return 2

    now = dt.datetime.now(dt.UTC).replace(microsecond=0)
    expires = now + dt.timedelta(minutes=args.expires_minutes)
    lease_id = task_id("LEASE")
    lease = {
        "lease_id": lease_id,
        "created_at": now.isoformat(),
        "expires_at": expires.isoformat(),
        "task_id": args.task_id,
        "executor": args.executor,
        "lane": slugify(args.lane),
        "goal": args.goal,
        "allowed_paths": args.allowed_path,
        "validation_commands": args.validation_command,
        "allow_execution": bool(args.allow_execution),
        "policy": {
            "runtime_only": True,
            "requires_lane_lock": True,
            "no_secret_printing": True,
            "no_public_ports": True,
            "no_force_push": True,
            "no_deploy": True,
            "codex_review_required": True,
        },
    }
    out = runtime_path("state", "executor_leases", f"{lease_id}-{slugify(args.lane)}.json")
    write_json(out, lease)
    print(f"created {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
