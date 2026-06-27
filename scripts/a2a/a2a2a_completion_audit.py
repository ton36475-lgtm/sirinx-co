#!/usr/bin/env python3
"""Audit A2A2A readiness from read-only Mission Control fixtures."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_DIR = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aCompletionAudit.json"


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def check(check_id: str, label: str, passed: bool, evidence: str, next_action: str) -> dict[str, str]:
    return {
        "id": check_id,
        "label": label,
        "status": "pass" if passed else "fail",
        "evidence": evidence,
        "nextAction": next_action,
    }


def fixture_path(name: str) -> Path:
    return FIXTURE_DIR / f"{name}.json"


def load_fixtures() -> dict[str, dict[str, Any]]:
    return {
        "runner": read_json(fixture_path("a2a2aRunnerStatus")),
        "readiness": read_json(fixture_path("a2a2aDependencyReadiness")),
        "plan": read_json(fixture_path("a2a2aCodexBuildPlan")),
        "digest": read_json(fixture_path("a2a2aWorkerReportDigest")),
        "packet": read_json(fixture_path("a2a2aImplementationLanePacket")),
    }


def role_names(runner: dict[str, Any]) -> set[str]:
    rows = runner.get("roleCounts", [])
    if not isinstance(rows, list):
        return set()
    return {str(row.get("role", "")) for row in rows if isinstance(row, dict)}


def packet_dependency_status(packet: dict[str, Any]) -> dict[str, str]:
    dependencies = packet.get("packet", {}).get("dependencyGate", [])
    if not isinstance(dependencies, list):
        return {}
    return {str(item.get("id", "")): str(item.get("status", "")) for item in dependencies if isinstance(item, dict)}


def build_checks(fixtures: dict[str, dict[str, Any]]) -> list[dict[str, str]]:
    runner = fixtures["runner"]
    readiness = fixtures["readiness"]
    plan = fixtures["plan"]
    digest = fixtures["digest"]
    packet = fixtures["packet"]

    runner_summary = runner.get("summary", {})
    readiness_summary = readiness.get("summary", {})
    digest_summary = digest.get("summary", {})
    packet_summary = packet.get("summary", {})
    roles = role_names(runner)
    required_roles = {"hermes", "opus", "glm52", "deepseek", "agy", "kob"}
    dependencies = packet_dependency_status(packet)
    blocked_actions = packet.get("packet", {}).get("blockedActions", [])
    if not isinstance(blocked_actions, list):
        blocked_actions = []

    provider_calls = int(runner_summary.get("providerCalls", 0) or 0) + int(
        readiness_summary.get("providerCalls", 0) or 0
    ) + int(digest_summary.get("providerCalls", 0) or 0) + int(packet_summary.get("providerCalls", 0) or 0)

    return [
        check(
            "role_roster",
            "Six local A2A2A roles are visible",
            required_roles.issubset(roles),
            f"roles={sorted(roles)}",
            "Add missing role specs before opening implementation.",
        ),
        check(
            "runner_health",
            "Runner has completed dry-run tasks without failures",
            int(runner_summary.get("completed", 0) or 0) >= 7 and int(runner_summary.get("failed", 0) or 0) == 0,
            f"completed={runner_summary.get('completed')}; failed={runner_summary.get('failed')}",
            "Run bounded dry-run dispatch for any failing role.",
        ),
        check(
            "provider_boundary",
            "Provider calls remain closed",
            provider_calls == 0,
            f"combinedProviderCalls={provider_calls}",
            "Quarantine any provider-backed result before using it.",
        ),
        check(
            "dependency_readiness",
            "Dependency readiness is ready for scoped Codex plan",
            readiness_summary.get("overallStatus") == "ready_for_scoped_codex_plan"
            and readiness_summary.get("worstDependencyStatus") == "ready",
            f"overall={readiness_summary.get('overallStatus')}; worst={readiness_summary.get('worstDependencyStatus')}",
            "Resolve missing Hermes/Opus/Codex queue dependencies.",
        ),
        check(
            "codex_plan",
            "Codex build plan exists and remains review-only",
            plan.get("status") == "ready_for_codex_review"
            and not bool((plan.get("plan") or {}).get("executionAllowed", True)),
            f"status={plan.get('status')}; executionAllowed={(plan.get('plan') or {}).get('executionAllowed')}",
            "Create a plan-only Codex build artifact before file edits.",
        ),
        check(
            "worker_reports",
            "GLM, DeepSeek, AGY, and KOB reports are present",
            int(digest_summary.get("workerReports", 0) or 0) >= 3
            and int(digest_summary.get("kobReports", 0) or 0) >= 1
            and int(digest_summary.get("safeReports", 0) or 0) == int(digest_summary.get("reports", -1) or -1),
            (
                f"reports={digest_summary.get('reports')}; workers={digest_summary.get('workerReports')}; "
                f"kob={digest_summary.get('kobReports')}; safe={digest_summary.get('safeReports')}"
            ),
            "Dispatch missing report-only workers through the dry-run runner.",
        ),
        check(
            "implementation_packet",
            "Implementation lane packet has no missing or blocked dependencies",
            packet_summary.get("status") == "ready_for_codex_scoped_implementation_review"
            and int(packet_summary.get("blockedDependencies", 0) or 0) == 0
            and int(packet_summary.get("missingDependencies", 0) or 0) == 0
            and not bool(packet_summary.get("executionAllowed", True)),
            (
                f"status={packet_summary.get('status')}; blocked={packet_summary.get('blockedDependencies')}; "
                f"missing={packet_summary.get('missingDependencies')}; executionAllowed={packet_summary.get('executionAllowed')}"
            ),
            "Review packet before Codex opens implementation.",
        ),
        check(
            "agy_dependency",
            "AGY report is part of the dependency gate",
            dependencies.get("agy_worker_report") == "ready",
            f"agy_worker_report={dependencies.get('agy_worker_report', 'missing')}",
            "Dispatch AGY dry-run review before UI/integration work.",
        ),
        check(
            "blocked_actions",
            "Blocked action list preserves production safety boundaries",
            {"git_add_dot", "provider_call", "deploy", "push", "secret_read_or_print"}.issubset(
                {str(action) for action in blocked_actions}
            ),
            f"blockedActions={len(blocked_actions)}",
            "Add missing blocked actions before coding lane execution.",
        ),
    ]


def build_audit(runtime_root: Path) -> dict[str, Any]:
    fixtures = load_fixtures()
    checks = build_checks(fixtures)
    passed = sum(1 for row in checks if row["status"] == "pass")
    failed = len(checks) - passed
    overall_status = "ready_for_first_scoped_codex_lane" if failed == 0 else "needs_a2a2a_sync_work"
    audit = {
        "updatedAt": now_iso(),
        "mode": "read_only_a2a2a_completion_audit",
        "generatedBy": "scripts/a2a/a2a2a_completion_audit.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "overallStatus": overall_status,
            "requirements": len(checks),
            "passed": passed,
            "failed": failed,
            "providerCalls": fixtures["digest"].get("summary", {}).get("providerCalls", 0),
            "roles": fixtures["runner"].get("summary", {}).get("roles", 0),
            "workerReports": fixtures["digest"].get("summary", {}).get("workerReports", 0),
            "implementationPacketStatus": fixtures["packet"].get("summary", {}).get("status", "unknown"),
        },
        "checks": checks,
        "prioritySequence": [
            "Review a2a2aImplementationLanePacket.json.",
            "Open the first scoped Codex implementation lane from packet priorityWorkItems.",
            "Keep GLM-5.2, DeepSeek, AGY, and KOB report-only until a separate execution lane exists.",
            "Run validation commands before any scoped stage.",
            "Stage only packet-listed files; never use git add dot.",
        ],
        "policyBoundary": [
            "read_only_fixture",
            "codex_only_git_owner",
            "workers_report_only",
            "no_provider_call",
            "no_connector_sync",
            "no_deploy",
            "no_push",
            "no_secret_read_or_print",
            "no_generated_web_sirinx_asset_mutation",
        ],
    }
    runtime_report_path = runtime_root / "completion_audits" / "latest.json"
    write_json(runtime_report_path, audit)
    audit["runtimeReportPath"] = str(runtime_report_path)
    return audit


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export read-only A2A2A completion audit fixture")
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture_path = Path(os.path.expanduser(args.fixture_path)).resolve()
    fixture = build_audit(runtime_root)
    write_json(fixture_path, fixture)
    print(f"wrote {fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
