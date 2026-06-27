#!/usr/bin/env python3
"""Create a read-only A2A2A implementation lane packet for Codex review."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BUILD_PLAN_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aCodexBuildPlan.json"
DEFAULT_WORKER_DIGEST_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aWorkerReportDigest.json"
)
DEFAULT_FIXTURE_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aImplementationLanePacket.json"
)
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
SECRET_PATTERNS = [
    re.compile(r"(sk-[A-Za-z0-9_-]{12,})"),
    re.compile(r"(kob_[A-Za-z0-9_-]{8,})"),
    re.compile(r"([A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Za-z0-9_]*=)([^\s]+)", re.I),
    re.compile(r"(Bearer\s+)([A-Za-z0-9._-]+)", re.I),
]


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def mask_secret_text(value: str) -> str:
    masked = value
    for pattern in SECRET_PATTERNS:
        if pattern.groups >= 2:
            masked = pattern.sub(lambda match: f"{match.group(1)}<masked>", masked)
        else:
            masked = pattern.sub("<masked>", masked)
    return masked


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def selected_reports(worker_digest: dict[str, Any]) -> list[dict[str, Any]]:
    reports = worker_digest.get("reports", [])
    if not isinstance(reports, list):
        return []
    selected = []
    for report in reports:
        if not isinstance(report, dict):
            continue
        selected.append(
            {
                "role": str(report.get("role", "")),
                "taskId": str(report.get("taskId", "")),
                "status": str(report.get("status", "")),
                "model": str(report.get("model", "")),
                "providerCall": bool(report.get("providerCall", False)),
                "safeToDispatchLocally": bool(report.get("safeToDispatchLocally", False)),
                "requiresHumanReview": bool(report.get("requiresHumanReview", False)),
                "nextOwner": str(report.get("nextOwner", "")),
                "summary": mask_secret_text(str(report.get("summary", ""))),
                "plannedActions": [mask_secret_text(str(action)) for action in report.get("plannedActions", [])[:6]],
            }
        )
    return selected


def report_roles(reports: list[dict[str, Any]]) -> set[str]:
    return {str(report.get("role", "")) for report in reports}


def build_dependencies(plan: dict[str, Any], worker_digest: dict[str, Any], reports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    roles = report_roles(reports)
    provider_calls = int(worker_digest.get("summary", {}).get("providerCalls", 0))
    return [
        {
            "id": "codex_plan_ready",
            "owner": "codex",
            "status": "ready" if plan else "blocked",
            "evidence": str(plan.get("planId", "")) if plan else "missing build plan",
        },
        {
            "id": "glm52_worker_report",
            "owner": "glm52",
            "status": "ready" if "glm52" in roles else "missing",
            "evidence": "report-only digest present" if "glm52" in roles else "dispatch glm52 dry-run report",
        },
        {
            "id": "deepseek_worker_report",
            "owner": "deepseek",
            "status": "ready" if "deepseek" in roles else "missing",
            "evidence": "report-only digest present" if "deepseek" in roles else "dispatch deepseek dry-run report",
        },
        {
            "id": "kob_validation_report",
            "owner": "kob",
            "status": "ready" if "kob" in roles else "missing",
            "evidence": "local validator report present" if "kob" in roles else "dispatch kob dry-run validation",
        },
        {
            "id": "provider_boundary",
            "owner": "hermes",
            "status": "ready" if provider_calls == 0 else "blocked",
            "evidence": f"providerCalls={provider_calls}",
        },
    ]


def build_priority_work_items(plan: dict[str, Any], reports: list[dict[str, Any]]) -> list[dict[str, Any]]:
    validation_commands = plan.get("validationCommands", []) if isinstance(plan.get("validationCommands"), list) else []
    worker_roles = ", ".join(sorted(report_roles(reports))) or "none"
    return [
        {
            "priority": 1,
            "owner": "codex",
            "task": "inspect_plan_and_worker_digest",
            "status": "ready",
            "why": "Codex owns repo state and must read the plan plus worker reports before edits.",
            "acceptance": "Implementation scope references the build plan id and worker digest status.",
        },
        {
            "priority": 2,
            "owner": "codex",
            "task": "implement_only_allowed_paths",
            "status": "ready",
            "why": "Dirty lanes exist outside A2A2A; edits must stay inside the plan scope.",
            "acceptance": "Scoped git status contains only files listed in the lane packet.",
        },
        {
            "priority": 3,
            "owner": "glm52_deepseek_kob",
            "task": "consume_report_only_feedback",
            "status": "ready" if reports else "missing_reports",
            "why": f"Worker reports available from: {worker_roles}.",
            "acceptance": "No worker commits, provider calls, or command execution are required.",
        },
        {
            "priority": 4,
            "owner": "codex",
            "task": "run_validation_commands",
            "status": "ready" if validation_commands else "needs_commands",
            "why": "Every implementation lane must prove tests and UI checks before staging.",
            "acceptance": "All validation commands pass and results are summarized in final report.",
        },
        {
            "priority": 5,
            "owner": "codex",
            "task": "stage_and_commit_scoped_lane",
            "status": "manual_codex_step",
            "why": "Only Codex stages and commits after validation; workers never mutate git.",
            "acceptance": "Commit contains only lane files and no generated unrelated assets.",
        },
    ]


def stage_command_for(files: list[str]) -> list[str]:
    return ["/usr/bin/git", "add", *files]


def build_packet(build_plan_fixture: dict[str, Any], worker_digest: dict[str, Any], runtime_root: Path) -> dict[str, Any]:
    plan = build_plan_fixture.get("plan") if isinstance(build_plan_fixture.get("plan"), dict) else {}
    reports = selected_reports(worker_digest)
    plan_id = str(plan.get("planId", "missing-plan"))
    lane_id = f"LANE-A2A2A-IMPLEMENT-{sha256_text(plan_id)[:10]}"
    allowed_paths = plan.get("scope", {}).get("allowedPaths", []) if isinstance(plan.get("scope"), dict) else []
    blocked_paths = plan.get("scope", {}).get("blockedPaths", []) if isinstance(plan.get("scope"), dict) else []
    validation_commands = plan.get("validationCommands", []) if isinstance(plan.get("validationCommands"), list) else []
    planned_files = [
        "scripts/a2a/a2a_implementation_lane_packet.py",
        "apps/mission-control/src/fixtures/a2a2aImplementationLanePacket.json",
        "apps/mission-control/src/App.tsx",
        "tests/ghostclaw_runner/test_runner_status_fixture.py",
        "docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md",
    ]
    dependencies = build_dependencies(plan, worker_digest, reports)
    blocked_dependencies = [item for item in dependencies if item["status"] == "blocked"]
    missing_dependencies = [item for item in dependencies if item["status"] == "missing"]
    execution_allowed = False
    status = "ready_for_codex_scoped_implementation_review"
    if blocked_dependencies:
        status = "blocked_by_policy_dependency"
    elif missing_dependencies:
        status = "waiting_for_worker_reports"
    packet = {
        "packetId": f"IMPLEMENT-PACKET-{sha256_text(lane_id)[:10]}",
        "laneId": lane_id,
        "sourcePlanId": plan_id,
        "sourceTaskId": str(plan.get("sourceTaskId", "")),
        "status": status,
        "executionAllowed": execution_allowed,
        "createdAt": now_iso(),
        "mode": "read_only_implementation_lane_packet",
        "generatedBy": "scripts/a2a/a2a_implementation_lane_packet.py",
        "runtimeRoot": str(runtime_root),
        "objective": mask_secret_text(str(plan.get("objective", "Open a scoped Codex implementation lane."))),
        "dependencyGate": dependencies,
        "priorityWorkItems": build_priority_work_items(plan, reports),
        "workerEvidence": reports,
        "scope": {
            "allowedPaths": [str(item) for item in allowed_paths],
            "blockedPaths": [str(item) for item in blocked_paths],
            "plannedFilesForThisPacket": planned_files,
        },
        "validationCommands": [str(command) for command in validation_commands]
        + [
            "python3 -m py_compile scripts/a2a/a2a_implementation_lane_packet.py tests/ghostclaw_runner/test_runner_status_fixture.py",
            "python3 -m json.tool apps/mission-control/src/fixtures/a2a2aImplementationLanePacket.json >/tmp/a2a2aImplementationLanePacket.json.check",
        ],
        "scopedStageCommand": stage_command_for(planned_files),
        "blockedActions": [
            "git_add_dot",
            "provider_call",
            "worker_direct_commit",
            "deploy",
            "push",
            "connector_sync",
            "secret_read_or_print",
            "modify_generated_web_sirinx_assets",
        ],
        "acceptanceCriteria": [
            "Mission Control shows the implementation lane packet from a static fixture.",
            "Dependency gate is ready or explicitly blocked with evidence.",
            "Worker evidence includes GLM-5.2, DeepSeek, and KOB report-only outputs before coding.",
            "Codex remains the only git state owner.",
            "Validation commands pass before any scoped stage/commit.",
        ],
        "nextSafeActions": [
            "Codex reviews this packet and confirms no blocked dependencies.",
            "Codex implements only planned lane files.",
            "Codex runs validation and stages only the scoped file list.",
        ],
    }
    runtime_packet_path = runtime_root / "implementation_lanes" / f"{lane_id}.json"
    write_json(runtime_packet_path, packet)
    return {
        "updatedAt": now_iso(),
        "mode": "read_only_implementation_lane_fixture",
        "generatedBy": "scripts/a2a/a2a_implementation_lane_packet.py",
        "runtimeRoot": str(runtime_root),
        "packetPath": str(runtime_packet_path),
        "summary": {
            "status": status,
            "dependencies": len(dependencies),
            "blockedDependencies": len(blocked_dependencies),
            "missingDependencies": len(missing_dependencies),
            "workerEvidence": len(reports),
            "providerCalls": int(worker_digest.get("summary", {}).get("providerCalls", 0)),
            "priorityItems": len(packet["priorityWorkItems"]),
            "executionAllowed": execution_allowed,
        },
        "packet": packet,
        "policyBoundary": [
            "read_only_fixture",
            "codex_git_owner",
            "worker_reports_are_inputs_only",
            "no_provider_call",
            "no_push",
            "no_deploy",
            "no_connector_sync",
            "no_secret_values",
        ],
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create A2A2A implementation lane packet fixture")
    parser.add_argument("--build-plan-path", default=str(DEFAULT_BUILD_PLAN_PATH))
    parser.add_argument("--worker-digest-path", default=str(DEFAULT_WORKER_DIGEST_PATH))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    build_plan_path = Path(os.path.expanduser(args.build_plan_path)).resolve()
    worker_digest_path = Path(os.path.expanduser(args.worker_digest_path)).resolve()
    fixture_path = Path(os.path.expanduser(args.fixture_path)).resolve()
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture = build_packet(read_json(build_plan_path), read_json(worker_digest_path), runtime_root)
    write_json(fixture_path, fixture)
    print(f"wrote {fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
