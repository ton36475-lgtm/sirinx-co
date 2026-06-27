#!/usr/bin/env python3
"""Export a read-only digest of A2A2A worker reports for Mission Control."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
DEFAULT_FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aWorkerReportDigest.json"
REPORT_ROLES = ("glm52", "deepseek", "kob")
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
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def collect_reports(runtime_root: Path, limit: int) -> list[dict[str, Any]]:
    reports: list[dict[str, Any]] = []
    for role in REPORT_ROLES:
        for path in sorted((runtime_root / "outbox" / role).glob("*.result.json")):
            result = read_json(path)
            if not result:
                continue
            task = result.get("task") if isinstance(result.get("task"), dict) else {}
            output = result.get("output") if isinstance(result.get("output"), dict) else {}
            handoff = output.get("handoff") if isinstance(output.get("handoff"), dict) else {}
            planned_actions = output.get("planned_actions") if isinstance(output.get("planned_actions"), list) else []
            context_refs = task.get("context_refs") if isinstance(task.get("context_refs"), list) else []
            reports.append(
                {
                    "path": str(path),
                    "createdAt": str(result.get("created_at", "")),
                    "role": str(result.get("role", role)),
                    "taskId": str(task.get("task_id", path.stem.replace(".result", ""))),
                    "status": str(result.get("status", "unknown")),
                    "model": str(result.get("model", "unknown")),
                    "providerCall": bool(result.get("provider_call", False)),
                    "promptSha256": str(result.get("prompt_sha256", "")),
                    "nextOwner": str(handoff.get("next_owner", "")),
                    "safeToDispatchLocally": bool(handoff.get("safe_to_dispatch_locally", False)),
                    "requiresHumanReview": bool(handoff.get("requires_human_review", False)),
                    "summary": mask_secret_text(str(output.get("summary", ""))),
                    "goalPreview": mask_secret_text(str(task.get("goal_preview", task.get("goal", "")))),
                    "plannedActions": [mask_secret_text(str(action)) for action in planned_actions[:8]],
                    "contextRefs": [mask_secret_text(str(ref)) for ref in context_refs[:6]],
                }
            )
    reports.sort(key=lambda item: item["createdAt"], reverse=True)
    return reports[:limit]


def build_fixture(runtime_root: Path, limit: int) -> dict[str, Any]:
    reports = collect_reports(runtime_root, limit)
    provider_calls = sum(1 for report in reports if report["providerCall"])
    worker_reports = sum(1 for report in reports if report["role"] in {"glm52", "deepseek"})
    kob_reports = sum(1 for report in reports if report["role"] == "kob")
    safe_reports = sum(1 for report in reports if report["safeToDispatchLocally"] and not report["providerCall"])
    overall_status = "ready_worker_reports" if reports and provider_calls == 0 else "review_required"
    if not reports:
        overall_status = "missing_worker_reports"
    return {
        "updatedAt": now_iso(),
        "mode": "read_only_worker_report_digest",
        "generatedBy": "scripts/a2a/a2a_worker_report_digest.py",
        "runtimeRoot": str(runtime_root),
        "sourceGlob": "outbox/{glm52,deepseek,kob}/*.result.json",
        "summary": {
            "reports": len(reports),
            "workerReports": worker_reports,
            "kobReports": kob_reports,
            "providerCalls": provider_calls,
            "safeReports": safe_reports,
            "overallStatus": overall_status,
        },
        "reports": reports,
        "policyBoundary": [
            "read_only_digest",
            "no_runtime_polling_from_browser",
            "no_provider_call",
            "no_command_execution",
            "no_git_mutation_from_workers",
            "no_secret_values",
        ],
        "nextSafeActions": [
            "Codex reviews worker report digest before opening implementation.",
            "If providerCalls is greater than zero, quarantine the worker result before use.",
            "KOB validation remains report-only until Command Broker grants an execution lease.",
        ],
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export A2A2A worker report digest fixture")
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--limit", type=int, default=12)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture_path = Path(os.path.expanduser(args.fixture_path)).resolve()
    fixture = build_fixture(runtime_root, max(1, args.limit))
    write_json(fixture_path, fixture)
    print(f"wrote {fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
