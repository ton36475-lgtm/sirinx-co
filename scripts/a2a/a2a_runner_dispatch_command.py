#!/usr/bin/env python3
"""Create a local A2A2A runner task envelope and optionally process it once."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))
SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from ghostclaw_runner import agent_runner  # noqa: E402
import a2a_export_runner_status_fixture  # noqa: E402


DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
ROLES = ["hermes", "opus", "glm52", "deepseek", "agy", "kob"]
SECRET_PATTERNS = [
    re.compile(r"(sk-[A-Za-z0-9_-]{12,})"),
    re.compile(r"(kob_[A-Za-z0-9_-]{8,})"),
    re.compile(r"([A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Za-z0-9_]*=)([^\s]+)", re.I),
    re.compile(r"(Bearer\s+)([A-Za-z0-9._-]+)", re.I),
]


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def safe_slug(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip("-") or "task"


def mask_secret_text(value: str) -> str:
    masked = value
    for pattern in SECRET_PATTERNS:
        if pattern.groups >= 2:
            masked = pattern.sub(lambda match: f"{match.group(1)}<masked>", masked)
        else:
            masked = pattern.sub("<masked>", masked)
    return masked


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def append_jsonl(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(data, sort_keys=True, ensure_ascii=True) + "\n")


def task_id_for(role: str, goal: str) -> str:
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    digest = sha256_text(f"{role}:{goal}:{stamp}")[:8]
    return f"A2A2A-{stamp}-{role}-{digest}"


def build_envelope(args: argparse.Namespace, task_id: str) -> dict[str, Any]:
    goal = mask_secret_text(args.goal)
    context_refs = [mask_secret_text(ref) for ref in args.context_ref]
    return {
        "task_id": task_id,
        "created_at": now_iso(),
        "from_agent": args.from_agent,
        "to_agent": args.role,
        "priority": args.priority,
        "goal": goal,
        "goal_hash": sha256_text(args.goal),
        "context_refs": context_refs,
        "dispatch_mode": "dry_run",
        "runner_contract": {
            "provider_call_allowed": False,
            "git_mutation_allowed": False,
            "external_write_allowed": False,
            "secret_read_allowed": False,
        },
        "next_step": "ghostclaw_runner/agent_runner.py --dry-run",
    }


def dispatch_envelope(runtime_root: Path, envelope: dict[str, Any]) -> Path:
    role = str(envelope["to_agent"])
    path = runtime_root / "inbox" / role / f"{safe_slug(str(envelope['task_id']))}.json"
    write_json(path, envelope)
    append_jsonl(
        runtime_root / "logs" / "runner-dispatch-command.jsonl",
        {
            "created_at": now_iso(),
            "event": "task_envelope_created",
            "role": role,
            "task_id": envelope["task_id"],
            "path": str(path),
            "provider_call_allowed": False,
        },
    )
    return path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a local A2A2A runner dispatch envelope")
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(a2a_export_runner_status_fixture.DEFAULT_FIXTURE_PATH))
    parser.add_argument("--role", choices=ROLES, required=True)
    parser.add_argument("--goal", required=True)
    parser.add_argument("--from-agent", default="hermes")
    parser.add_argument("--priority", default="normal")
    parser.add_argument("--context-ref", action="append", default=[])
    parser.add_argument("--task-id", default=None)
    parser.add_argument(
        "--run-once",
        action="store_true",
        help="Process one queued task for this role through the local dry-run runner.",
    )
    parser.add_argument(
        "--no-refresh-fixture",
        action="store_true",
        help="Skip Mission Control fixture refresh.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture_path = Path(os.path.expanduser(args.fixture_path)).resolve()
    task_id = safe_slug(args.task_id) if args.task_id else task_id_for(args.role, args.goal)
    envelope = build_envelope(args, task_id)
    task_path = dispatch_envelope(runtime_root, envelope)

    runner_exit = 0
    if args.run_once:
        runner_exit = agent_runner.main(
            [
                "--runtime-root",
                str(runtime_root),
                "--repo-root",
                str(REPO_ROOT),
                "--agent",
                args.role,
                "--once",
                "--dry-run",
            ]
        )

    if not args.no_refresh_fixture:
        a2a_export_runner_status_fixture.main(
            [
                "--runtime-root",
                str(runtime_root),
                "--fixture-path",
                str(fixture_path),
            ]
        )

    print(
        json.dumps(
            {
                "task_path": str(task_path),
                "task_id": task_id,
                "role": args.role,
                "run_once": bool(args.run_once),
                "runner_exit": runner_exit,
                "fixture_path": str(fixture_path),
            },
            sort_keys=True,
        )
    )
    return runner_exit


if __name__ == "__main__":
    raise SystemExit(main())
