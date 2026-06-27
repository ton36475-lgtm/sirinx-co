#!/usr/bin/env python3
"""Export role-scoped A2A2A work packets from the team assignment board."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_DIR = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures"
DEFAULT_ASSIGNMENT_PATH = FIXTURE_DIR / "a2a2aTeamAssignmentBoard.json"
DEFAULT_LANE_PATH = FIXTURE_DIR / "a2a2aFirstCodexImplementationLane.json"
DEFAULT_GUARD_PATH = FIXTURE_DIR / "a2a2aScopedPathGuard.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aTeamWorkPackets.json"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def compact(value: Any) -> str:
    return " ".join(str(value).split())


def owner_mode(owner: str) -> str:
    if owner.startswith("codex"):
        return "scoped_repo_edit"
    if owner == "glm52_deepseek_agy_kob":
        return "report_and_validate_only"
    if owner in {"glm52", "deepseek", "agy"}:
        return "report_only"
    if owner == "kob":
        return "validate_only"
    if owner == "hermes":
        return "policy_state_only"
    return "read_only"


def allowed_actions_for(mode: str) -> list[str]:
    if mode == "scoped_repo_edit":
        return [
            "inspect_source_fixtures",
            "edit_allowed_paths_only",
            "run_scoped_validation",
            "stage_packet_files_after_validation",
        ]
    if mode == "report_and_validate_only":
        return ["read_source_fixtures", "write_report_only_feedback", "validate_command_plan_only"]
    if mode == "report_only":
        return ["read_source_fixtures", "write_report_only_feedback"]
    if mode == "validate_only":
        return ["read_command_plan", "write_validation_report_only"]
    if mode == "policy_state_only":
        return ["read_source_fixtures", "update_policy_state_docs_only"]
    return ["read_source_fixtures"]


def packet_status(item: dict[str, Any], mode: str) -> str:
    status = str(item.get("status", ""))
    if status == "completed":
        return "completed"
    if mode == "scoped_repo_edit" and status == "ready_for_codex":
        return "ready_for_codex_scoped_work"
    if mode in {"report_only", "report_and_validate_only"}:
        return "ready_for_worker_report"
    if mode == "validate_only":
        return "ready_for_kob_validation"
    if mode == "policy_state_only":
        return "ready_for_hermes_policy_review"
    return "read_only"


def build_packet(
    item: dict[str, Any],
    lane: dict[str, Any],
    guard: dict[str, Any],
    sequence: int,
) -> dict[str, Any]:
    owner = str(item.get("owner", ""))
    mode = owner_mode(owner)
    queue_id = str(item.get("queueId", f"QUEUE-{sequence:02d}"))
    packet_id = f"WORK-{sha256_text(queue_id)[:10]}"
    allowed_paths = lane.get("lane", {}).get("allowedPaths", [])
    blocked_paths = lane.get("lane", {}).get("blockedPaths", [])
    validation_commands = lane.get("lane", {}).get("validationCommands", [])
    planned_files = [row.get("path", "") for row in guard.get("plannedFiles", []) if isinstance(row, dict)]
    return {
        "packetId": packet_id,
        "queueId": queue_id,
        "priority": int(item.get("priority", 99) or 99),
        "owner": owner,
        "ownerMode": mode,
        "status": packet_status(item, mode),
        "source": str(item.get("source", "")),
        "task": compact(item.get("task", "")),
        "why": compact(item.get("why", "")),
        "acceptance": compact(item.get("acceptance", "")),
        "allowedActions": allowed_actions_for(mode),
        "blockedActions": [
            "git_add_dot",
            "worker_direct_commit",
            "provider_call",
            "connector_sync",
            "deploy",
            "push",
            "secret_read_or_print",
            "generated_web_sirinx_asset_mutation",
        ],
        "allowedPaths": [str(path) for path in allowed_paths] if mode == "scoped_repo_edit" else [],
        "blockedPaths": [str(path) for path in blocked_paths],
        "plannedFiles": planned_files if mode == "scoped_repo_edit" else [],
        "validationCommands": [str(command) for command in validation_commands] if mode == "scoped_repo_edit" else [],
        "sourceFixtures": {
            "assignmentBoard": "apps/mission-control/src/fixtures/a2a2aTeamAssignmentBoard.json",
            "firstCodexLane": "apps/mission-control/src/fixtures/a2a2aFirstCodexImplementationLane.json",
            "scopedPathGuard": "apps/mission-control/src/fixtures/a2a2aScopedPathGuard.json",
        },
        "executionAllowed": mode == "scoped_repo_edit",
        "providerCallsAllowed": False,
        "workerDirectEditsAllowed": False,
    }


def build_packets(
    assignment: dict[str, Any],
    lane: dict[str, Any],
    guard: dict[str, Any],
    runtime_root: Path,
) -> dict[str, Any]:
    queue = assignment.get("immediateQueue", [])
    if not isinstance(queue, list):
        queue = []
    packets = [
        build_packet(item, lane, guard, index + 1)
        for index, item in enumerate(queue)
        if isinstance(item, dict)
    ]
    codex_packets = [packet for packet in packets if packet["ownerMode"] == "scoped_repo_edit"]
    worker_packets = [
        packet
        for packet in packets
        if packet["ownerMode"] in {"report_only", "report_and_validate_only", "validate_only"}
    ]
    next_codex_packet = next(
        (packet for packet in codex_packets if packet["status"] == "ready_for_codex_scoped_work"),
        {},
    )
    report = {
        "updatedAt": now_iso(),
        "mode": "read_only_a2a2a_team_work_packets",
        "generatedBy": "scripts/a2a/a2a_team_work_packets.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "status": "ready_for_team_packets" if packets else "blocked_no_assignment_queue",
            "packets": len(packets),
            "codexPackets": len(codex_packets),
            "workerPackets": len(worker_packets),
            "nextCodexPacketId": str(next_codex_packet.get("packetId", "")),
            "nextCodexTask": str(next_codex_packet.get("task", "")),
            "providerCallsAllowed": False,
            "workerDirectEditsAllowed": False,
            "gitAddDotAllowed": False,
        },
        "nextCodexPacket": next_codex_packet,
        "packets": packets,
        "policyBoundary": [
            "read_only_work_packet_fixture",
            "codex_only_scoped_repo_edits",
            "workers_report_only",
            "kob_validate_only",
            "mission_control_read_only",
            "no_provider_call",
            "no_connector_sync",
            "no_deploy",
            "no_push",
            "no_secret_read_or_print",
            "no_git_add_dot",
            "no_generated_web_sirinx_asset_mutation",
        ],
        "nextSafeActions": [
            "Codex executes only the nextCodexPacket allowed paths and validation commands.",
            "Workers use their packets for report-only review; they do not edit or commit.",
            "KOB validates proposed commands only after a Command Broker lease exists.",
        ],
    }
    runtime_report_path = runtime_root / "work_packets" / "latest.json"
    write_json(runtime_report_path, report)
    report["runtimeReportPath"] = str(runtime_report_path)
    return report


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export A2A2A role-scoped team work packets")
    parser.add_argument("--assignment-path", default=str(DEFAULT_ASSIGNMENT_PATH))
    parser.add_argument("--lane-path", default=str(DEFAULT_LANE_PATH))
    parser.add_argument("--guard-path", default=str(DEFAULT_GUARD_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    assignment = read_json(Path(os.path.expanduser(args.assignment_path)).resolve())
    lane = read_json(Path(os.path.expanduser(args.lane_path)).resolve())
    guard = read_json(Path(os.path.expanduser(args.guard_path)).resolve())
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture = build_packets(assignment, lane, guard, runtime_root)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {args.fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
