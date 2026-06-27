#!/usr/bin/env python3
"""Export A2A2A local runner status to a Mission Control read-only fixture."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
from collections import Counter
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
DEFAULT_FIXTURE_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aRunnerStatus.json"
)
ROLES = ["hermes", "opus", "glm52", "deepseek", "kob"]
SECRET_PATTERNS = [
    re.compile(r"(sk-[A-Za-z0-9_-]{12,})"),
    re.compile(r"(kob_[A-Za-z0-9_-]{8,})"),
    re.compile(r"([A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Za-z0-9_]*=)([^\s]+)", re.I),
    re.compile(r"(Bearer\s+)([A-Za-z0-9._-]+)", re.I),
]


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def mask_secret_text(value: str) -> str:
    masked = value
    for pattern in SECRET_PATTERNS:
        if pattern.groups >= 2:
            masked = pattern.sub(lambda match: f"{match.group(1)}<masked>", masked)
        else:
            masked = pattern.sub("<masked>", masked)
    return masked


def read_json(path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def count_json_files(path: Path) -> int:
    return len(list(path.glob("*.json"))) if path.exists() else 0


def role_counts(runtime_root: Path) -> list[dict[str, Any]]:
    rows = []
    for role in ROLES:
        rows.append(
            {
                "role": role,
                "inbox": count_json_files(runtime_root / "inbox" / role),
                "running": count_json_files(runtime_root / "running" / role),
                "outbox": count_json_files(runtime_root / "outbox" / role),
                "completed": count_json_files(runtime_root / "tasks" / "completed" / role),
                "failed": count_json_files(runtime_root / "tasks" / "failed" / role),
            }
        )
    return rows


def load_latest_results(runtime_root: Path, limit: int) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for path in sorted((runtime_root / "outbox").glob("*/*.result.json")):
        data = read_json(path)
        if not data:
            continue
        task = data.get("task", {}) if isinstance(data.get("task"), dict) else {}
        output = data.get("output", {}) if isinstance(data.get("output"), dict) else {}
        handoff = output.get("handoff", {}) if isinstance(output.get("handoff"), dict) else {}
        summary = mask_secret_text(str(output.get("summary", "")))[:220]
        results.append(
            {
                "path": str(path),
                "createdAt": str(data.get("created_at", "")),
                "role": str(data.get("role", "")),
                "taskId": str(task.get("task_id", path.stem.replace(".result", ""))),
                "status": str(data.get("status", "unknown")),
                "providerCall": bool(data.get("provider_call", False)),
                "model": str(data.get("model", "")),
                "promptSource": str(data.get("prompt_source", "")),
                "nextOwner": str(handoff.get("next_owner", "")),
                "safeToDispatchLocally": bool(handoff.get("safe_to_dispatch_locally", False)),
                "summary": summary,
            }
        )
    return sorted(results, key=lambda row: (row["createdAt"], row["path"]), reverse=True)[:limit]


def load_runner_summary(runtime_root: Path) -> dict[str, Any]:
    summary = read_json(runtime_root / "logs" / "runner-summary.json") or {}
    return {
        "createdAt": str(summary.get("created_at", "")),
        "mode": str(summary.get("mode", "")),
        "watch": bool(summary.get("watch", False)),
        "cycles": int(summary.get("cycles", 0) or 0),
        "processed": int(summary.get("processed", 0) or 0),
        "providerCallAllowed": bool(summary.get("provider_call_allowed", False)),
        "rolesChecked": summary.get("roles_checked", []) if isinstance(summary.get("roles_checked"), list) else [],
    }


def build_fixture(runtime_root: Path, limit: int) -> dict[str, Any]:
    counts = role_counts(runtime_root)
    latest_results = load_latest_results(runtime_root, limit)
    runner_summary = load_runner_summary(runtime_root)
    status_counts = Counter(row["status"] for row in latest_results)
    provider_calls = sum(1 for row in latest_results if row["providerCall"])
    summary = {
        "roles": len(counts),
        "inbox": sum(row["inbox"] for row in counts),
        "running": sum(row["running"] for row in counts),
        "outbox": sum(row["outbox"] for row in counts),
        "completed": sum(row["completed"] for row in counts),
        "failed": sum(row["failed"] for row in counts),
        "latestResults": len(latest_results),
        "providerCalls": provider_calls,
        "dryRunCompleted": status_counts.get("dry_run_completed", 0),
        "overallStatus": "ready_local_runner" if latest_results and provider_calls == 0 else "review_required",
    }
    return {
        "updatedAt": now_iso(),
        "mode": "read_only_runtime_fixture",
        "generatedBy": "scripts/a2a/a2a_export_runner_status_fixture.py",
        "runtimeRoot": str(runtime_root),
        "sourceGlob": str(runtime_root / "outbox" / "*" / "*.result.json"),
        "summary": summary,
        "lastRunnerSummary": runner_summary,
        "roleCounts": counts,
        "latestResults": latest_results,
        "policyBoundary": [
            "mission_control_reads_static_fixture_only",
            "no_browser_runtime_filesystem_access",
            "no_provider_call_by_default",
            "no_secret_read_or_print",
            "no_git_mutation",
            "no_push",
            "no_deploy",
            "no_connector_sync",
            "no_docker_start",
        ],
        "nextSafeActions": [
            "wire Mission Control runner panel to this fixture",
            "add dry-run dispatch command that writes inbox envelopes",
            "keep LiteLLM provider mode disabled until Command Broker policy allows it",
            "route Opus architecture handoff to Codex only after dependency status is visible",
        ],
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export A2A2A runner status fixture")
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--limit", type=int, default=12)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture_path = Path(os.path.expanduser(args.fixture_path)).resolve()
    fixture = build_fixture(runtime_root, args.limit)
    write_json(fixture_path, fixture)
    print(f"wrote {fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
