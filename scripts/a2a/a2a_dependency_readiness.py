#!/usr/bin/env python3
"""Build a read-only A2A2A dependency readiness and Codex handoff queue fixture."""

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
DEFAULT_FIXTURE_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aDependencyReadiness.json"
)
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


def load_results(runtime_root: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for path in sorted((runtime_root / "outbox").glob("*/*.result.json")):
        data = read_json(path)
        if not data:
            continue
        task = data.get("task", {}) if isinstance(data.get("task"), dict) else {}
        output = data.get("output", {}) if isinstance(data.get("output"), dict) else {}
        handoff = output.get("handoff", {}) if isinstance(output.get("handoff"), dict) else {}
        rows.append(
            {
                "path": str(path),
                "createdAt": str(data.get("created_at", "")),
                "role": str(data.get("role", "")),
                "status": str(data.get("status", "")),
                "providerCall": bool(data.get("provider_call", False)),
                "taskId": str(task.get("task_id", path.stem.replace(".result", ""))),
                "fromAgent": str(task.get("raw_from_agent", "")),
                "nextOwner": str(handoff.get("next_owner", "")),
                "safeToDispatchLocally": bool(handoff.get("safe_to_dispatch_locally", False)),
                "summary": mask_secret_text(str(output.get("summary", "")))[:220],
            }
        )
    return sorted(rows, key=lambda row: (row["createdAt"], row["path"]), reverse=True)


def make_check(check_id: str, label: str, status: str, evidence: str, next_action: str) -> dict[str, str]:
    return {
        "id": check_id,
        "label": label,
        "status": status,
        "evidence": evidence,
        "nextAction": next_action,
    }


def build_codex_queue(results: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    queue = []
    for result in results:
        if (
            result["role"] == "opus"
            and result["nextOwner"] == "codex"
            and result["safeToDispatchLocally"]
            and not result["providerCall"]
            and result["status"] == "dry_run_completed"
        ):
            queue.append(
                {
                    "queueId": f"CODEX-BUILD-{result['taskId']}",
                    "taskId": result["taskId"],
                    "sourceRole": result["role"],
                    "targetOwner": "codex",
                    "readiness": "ready_for_codex_plan",
                    "sourceResultPath": result["path"],
                    "summary": result["summary"],
                    "executionAllowed": False,
                    "nextAction": "Codex creates a scoped implementation plan from the Opus handoff before editing files.",
                }
            )
    return queue[:limit]


def build_fixture(runtime_root: Path, limit: int) -> dict[str, Any]:
    results = load_results(runtime_root)
    provider_calls = [row for row in results if row["providerCall"]]
    hermes_routed = [row for row in results if row["fromAgent"] == "hermes" or row["role"] == "hermes"]
    opus_handoffs = [
        row
        for row in results
        if row["role"] == "opus" and row["nextOwner"] == "codex" and row["safeToDispatchLocally"]
    ]
    worker_reports = [row for row in results if row["role"] in {"glm52", "deepseek", "agy"}]
    kob_reports = [row for row in results if row["role"] == "kob"]
    codex_queue = build_codex_queue(results, limit)

    checks = [
        make_check(
            "runner_transport",
            "Runner transport",
            "ready" if results else "missing",
            f"{len(results)} result files found",
            "Create and run a local role task envelope.",
        ),
        make_check(
            "hermes_routing",
            "Hermes routing",
            "ready" if hermes_routed else "missing",
            f"{len(hermes_routed)} Hermes-origin or Hermes-role result files found",
            "Dispatch Hermes-owned tasks into role inboxes.",
        ),
        make_check(
            "opus_architecture_handoff",
            "Opus architecture handoff",
            "ready" if opus_handoffs else "missing",
            f"{len(opus_handoffs)} Opus to Codex handoff files found",
            "Run Opus dry-run planning before Codex edits files.",
        ),
        make_check(
            "codex_build_queue",
            "Codex build queue",
            "ready" if codex_queue else "missing",
            f"{len(codex_queue)} Codex handoff items queued",
            "Codex should convert the top queue item into a scoped build plan.",
        ),
        make_check(
            "department_worker_reports",
            "GLM/DeepSeek/AGY worker reports",
            "partial" if not worker_reports else "ready",
            f"{len(worker_reports)} worker result files found",
            "Dispatch worker report tasks after the Codex plan identifies department needs.",
        ),
        make_check(
            "kob_local_validation",
            "KOB local validation",
            "partial" if not kob_reports else "ready",
            f"{len(kob_reports)} KOB validation files found",
            "Dispatch KOB validation after Codex proposes commands.",
        ),
        make_check(
            "provider_boundary",
            "Provider boundary",
            "ready" if not provider_calls else "review",
            f"{len(provider_calls)} provider-call results found",
            "Keep provider calls disabled until Command Broker policy allows them.",
        ),
    ]
    status_rank = {"ready": 0, "partial": 1, "missing": 2, "review": 3}
    worst_status = max((check["status"] for check in checks), key=lambda status: status_rank.get(status, 99))
    return {
        "updatedAt": now_iso(),
        "mode": "read_only_dependency_fixture",
        "generatedBy": "scripts/a2a/a2a_dependency_readiness.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "overallStatus": "ready_for_scoped_codex_plan" if codex_queue and not provider_calls else "needs_dependency_work",
            "dependencyChecks": len(checks),
            "codexQueueItems": len(codex_queue),
            "workerReports": len(worker_reports),
            "kobReports": len(kob_reports),
            "providerCalls": len(provider_calls),
            "worstDependencyStatus": worst_status,
        },
        "dependencyChecks": checks,
        "codexBuildQueue": codex_queue,
        "policyBoundary": [
            "read_only_fixture",
            "codex_plan_before_file_edits",
            "workers_report_before_department_changes",
            "kob_validates_commands_before_execution",
            "no_provider_call_by_default",
            "no_git_mutation_from_workers",
            "no_push",
            "no_deploy",
            "no_connector_sync",
            "no_secret_read_or_print",
        ],
        "nextSafeActions": [
            "Codex reviews the first ready Codex build queue item.",
            "Codex writes a scoped implementation plan with files, commands, and validation.",
            "Dispatch GLM/DeepSeek/AGY only for department-specific worker reports.",
            "Dispatch KOB only for command validation after Codex proposes commands.",
        ],
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export A2A2A dependency readiness fixture")
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
