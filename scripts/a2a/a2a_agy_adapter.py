#!/usr/bin/env python3
"""Create AGY Antigravity 2 A2A command-plan artifacts."""

from __future__ import annotations

import argparse
from pathlib import Path

from _common import REPO_ROOT, ensure_runtime, now_iso, read_json, runtime_path, safe_run, sha256_text, task_id, write_json


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create an AGY scoped executor command plan")
    parser.add_argument("--goal", required=True)
    parser.add_argument("--repo-path", default=str(REPO_ROOT))
    parser.add_argument("--lane", required=True)
    parser.add_argument("--lease-file", default="")
    parser.add_argument("--execute", action="store_true")
    return parser


def load_lease(path_text: str) -> dict[str, object] | None:
    if not path_text:
        return None
    path = Path(path_text).expanduser()
    if not path.exists():
        return None
    data = read_json(path)
    if data.get("executor") != "agy-antigravity2":
        return None
    return data


def main() -> int:
    args = build_parser().parse_args()
    ensure_runtime()
    lease = load_lease(args.lease_file)
    executable = bool(args.execute and lease and lease.get("allow_execution"))
    version = safe_run(["agy", "--version"], timeout=8)
    command_preview = ["agy", "<scoped-task>", "--repo", args.repo_path, "--lane", args.lane]
    artifact = {
        "created_at": now_iso(),
        "adapter": "agy-antigravity2",
        "mode": "execute_ready" if executable else "dry_run",
        "executor": "agy-antigravity2",
        "goal": args.goal,
        "repo_path": args.repo_path,
        "lane": args.lane,
        "lease_id": lease.get("lease_id") if lease else "",
        "lease_valid": bool(lease),
        "version_check": version,
        "command_preview": command_preview,
        "command_hash": sha256_text(" ".join(command_preview) + args.goal),
        "blocked_actions": [
            "print_secret",
            "read_secret_files",
            "force_push",
            "deploy",
            "public_endpoint",
            "provider_call_without_budget_and_scope",
        ],
        "next_review_agent": "codex-local",
        "note": "No AGY provider task was executed by this adapter in dry-run mode.",
    }
    out = runtime_path("artifacts", f"{task_id('AGY')}-{args.lane}.json")
    write_json(out, artifact)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
