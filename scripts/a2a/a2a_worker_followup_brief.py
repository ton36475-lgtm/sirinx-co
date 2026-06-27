#!/usr/bin/env python3
"""Build a read-only Codex follow-up brief from A2A2A worker reports."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
DEFAULT_DIGEST_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aWorkerReportDigest.json"
)
DEFAULT_PACKETS_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aTeamWorkPackets.json"
)
DEFAULT_FIXTURE_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aWorkerFollowupBrief.json"
)


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def report_only_packet(packets: dict[str, Any]) -> dict[str, Any]:
    packet_rows = packets.get("packets") if isinstance(packets.get("packets"), list) else []
    for packet in packet_rows:
        if not isinstance(packet, dict):
            continue
        if (
            packet.get("task") == "consume_report_only_feedback"
            and packet.get("ownerMode") == "report_and_validate_only"
        ):
            return packet
    return {}


def summarize_reports(digest: dict[str, Any]) -> list[dict[str, Any]]:
    reports = digest.get("reports") if isinstance(digest.get("reports"), list) else []
    rows: list[dict[str, Any]] = []
    for report in reports:
        if not isinstance(report, dict):
            continue
        rows.append(
            {
                "role": str(report.get("role", "")),
                "taskId": str(report.get("taskId", "")),
                "status": str(report.get("status", "")),
                "nextOwner": str(report.get("nextOwner", "")),
                "safeToDispatchLocally": bool(report.get("safeToDispatchLocally", False)),
                "providerCall": bool(report.get("providerCall", False)),
                "summary": str(report.get("summary", ""))[:280],
                "plannedActions": [
                    str(action)
                    for action in (
                        report.get("plannedActions") if isinstance(report.get("plannedActions"), list) else []
                    )[:6]
                ],
            }
        )
    return rows


def build_followup_brief(
    digest: dict[str, Any],
    packets: dict[str, Any],
    runtime_root: Path,
) -> dict[str, Any]:
    packet = report_only_packet(packets)
    digest_summary = digest.get("summary") if isinstance(digest.get("summary"), dict) else {}
    provider_calls = int(digest_summary.get("providerCalls", 0) or 0)
    reports = int(digest_summary.get("reports", 0) or 0)
    safe_reports = int(digest_summary.get("safeReports", 0) or 0)
    packet_ready = bool(packet)
    digest_ready = digest_summary.get("overallStatus") == "ready_worker_reports"
    status = "ready_for_codex_followup_brief"
    if not packet_ready:
        status = "missing_report_only_packet"
    elif not digest_ready or provider_calls:
        status = "blocked_worker_report_review_required"
    role_signals = summarize_reports(digest)
    allowed_paths = [
        "scripts/a2a/",
        "ghostclaw_runner/",
        "tests/ghostclaw_runner/",
        "apps/mission-control/src/fixtures/",
        "apps/mission-control/src/App.tsx",
        "docs/a2async/",
        "PROJECT_STATE.md",
        "NEXT_ACTIONS.md",
    ]
    blocked_actions = [
        "provider_call_without_command_broker_lease",
        "connector_sync",
        "deploy",
        "push",
        "secret_read_or_print",
        "git_add_dot",
        "worker_direct_commit",
        "generated_web_sirinx_asset_mutation",
    ]
    fixture = {
        "updatedAt": now_iso(),
        "mode": "read_only_worker_followup_brief",
        "generatedBy": "scripts/a2a/a2a_worker_followup_brief.py",
        "runtimeRoot": str(runtime_root),
        "runtimeReportPath": str(runtime_root / "worker_followup" / "latest.json"),
        "sourceFixtures": {
            "workerReportDigest": str(DEFAULT_DIGEST_PATH),
            "teamWorkPackets": str(DEFAULT_PACKETS_PATH),
        },
        "summary": {
            "status": status,
            "reports": reports,
            "safeReports": safe_reports,
            "providerCalls": provider_calls,
            "roleSignals": len(role_signals),
            "packetReady": packet_ready,
            "codexMayOpenNextLane": status == "ready_for_codex_followup_brief",
        },
        "sourcePacket": {
            "packetId": str(packet.get("packetId", "")),
            "queueId": str(packet.get("queueId", "")),
            "task": str(packet.get("task", "")),
            "owner": str(packet.get("owner", "")),
            "ownerMode": str(packet.get("ownerMode", "")),
            "status": str(packet.get("status", "")),
            "why": str(packet.get("why", "")),
            "acceptance": str(packet.get("acceptance", "")),
        },
        "recommendedCodexFollowup": {
            "lane": "LANE_A2A2A_WORKER_FEEDBACK_CONSUMPTION",
            "owner": "codex",
            "task": "consume worker reports and open the next scoped implementation lane",
            "allowedPaths": allowed_paths,
            "blockedActions": blocked_actions,
            "validationCommands": [
                "python3 -m unittest tests.ghostclaw_runner.test_agent_runner tests.ghostclaw_runner.test_runner_status_fixture",
                "pnpm --filter @sirinx/mission-control exec tsc --noEmit",
                "pnpm exec prettier --check apps/mission-control/src/App.tsx docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md PROJECT_STATE.md NEXT_ACTIONS.md",
                "git diff --check -- scripts/a2a ghostclaw_runner tests/ghostclaw_runner apps/mission-control/src/fixtures apps/mission-control/src/App.tsx docs/a2async PROJECT_STATE.md NEXT_ACTIONS.md",
            ],
            "nextAction": "Codex converts this brief into a new implementation-lane packet; workers remain report-only.",
        },
        "roleSignals": role_signals,
        "policyBoundary": [
            "mission_control_reads_static_fixture_only",
            "worker_reports_are_inputs_not_repo_edits",
            "codex_owns_repo_changes",
            "provider_calls_require_command_broker_lease",
            "kob_validates_only_until_lease",
            "no_external_sync",
            "no_deploy",
            "no_secret_values",
        ],
        "nextSafeActions": [
            "Review this brief in Mission Control.",
            "Open one new Codex implementation-lane packet if the brief status is ready.",
            "Keep GLM, DeepSeek, AGY, and KOB as report-only workers until a broker lease changes scope.",
        ],
    }
    write_json(runtime_root / "worker_followup" / "latest.json", fixture)
    return fixture


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build A2A2A worker follow-up brief fixture")
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--digest-path", default=str(DEFAULT_DIGEST_PATH))
    parser.add_argument("--packets-path", default=str(DEFAULT_PACKETS_PATH))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    digest = read_json(Path(os.path.expanduser(args.digest_path)).resolve())
    packets = read_json(Path(os.path.expanduser(args.packets_path)).resolve())
    fixture = build_followup_brief(digest, packets, runtime_root)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {Path(os.path.expanduser(args.fixture_path)).resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
