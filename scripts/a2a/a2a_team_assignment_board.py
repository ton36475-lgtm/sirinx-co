#!/usr/bin/env python3
"""Build a read-only A2A2A team assignment board from local fixtures."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_DIR = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures"
DEFAULT_BACKLOG_PATH = FIXTURE_DIR / "a2a2aBacklogPriority.json"
DEFAULT_LANE_PATH = FIXTURE_DIR / "a2a2aFirstCodexImplementationLane.json"
DEFAULT_PACKET_PATH = FIXTURE_DIR / "a2a2aImplementationLanePacket.json"
DEFAULT_OUTCOME_PATH = FIXTURE_DIR / "a2a2aCodexLaneOutcome.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aTeamAssignmentBoard.json"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def compact(value: str) -> str:
    return " ".join(str(value).split())


def role_rows() -> list[dict[str, str]]:
    return [
        {
            "role": "hermes",
            "title": "Supreme Mission Commander",
            "responsibility": "Owns mission order, dependency gates, blocked actions, and policy boundaries.",
            "currentAction": "Confirm P0/P1 ordering and keep blocked gates closed.",
            "editRights": "policy_state_only",
        },
        {
            "role": "opus",
            "title": "Chief Architect",
            "responsibility": "Produces architecture-first handoff before Codex edits.",
            "currentAction": "Architecture handoff is already represented by the implementation packet.",
            "editRights": "report_only",
        },
        {
            "role": "codex",
            "title": "Build Captain",
            "responsibility": "Owns repo edits, validation, scoped staging, and commits.",
            "currentAction": "Start with inspect_plan_and_worker_digest, then implement only allowed paths.",
            "editRights": "scoped_repo_owner",
        },
        {
            "role": "glm52",
            "title": "Coding Consistency Worker",
            "responsibility": "Reviews structure, code consistency, and long-context implementation risks.",
            "currentAction": "Remain report-only until provider execution lane exists.",
            "editRights": "report_only",
        },
        {
            "role": "deepseek",
            "title": "Risk and Data-Flow Worker",
            "responsibility": "Reviews command/data-flow risks and implementation edge cases.",
            "currentAction": "Remain report-only until provider execution lane exists.",
            "editRights": "report_only",
        },
        {
            "role": "agy",
            "title": "UI and Integration Scaffold Worker",
            "responsibility": "Reviews UI/integration scaffold shape and Mission Control readability.",
            "currentAction": "Remain report-only until provider execution lane exists.",
            "editRights": "report_only",
        },
        {
            "role": "kob",
            "title": "Local Validator",
            "responsibility": "Validates local command plans through Command Broker assumptions.",
            "currentAction": "Stay validate-only until Command Broker issues an execution lease.",
            "editRights": "validate_only",
        },
        {
            "role": "mission_control",
            "title": "Read-Only Observer",
            "responsibility": "Displays generated fixtures; never polls runtime files directly.",
            "currentAction": "Show assignment, backlog, lane, and blocked-gate state.",
            "editRights": "read_only_fixture",
        },
    ]


def completed_tasks_from_outcome(outcome_fixture: dict[str, Any] | None) -> set[str]:
    if not outcome_fixture:
        return set()
    source_next_action = (
        outcome_fixture.get("selectedSlice", {}).get("sourceNextAction", {})
        if isinstance(outcome_fixture.get("selectedSlice"), dict)
        else {}
    )
    task = str(source_next_action.get("task", "")).strip()
    return {task} if task else set()


def lane_queue(lane_fixture: dict[str, Any], completed_tasks: set[str] | None = None) -> list[dict[str, Any]]:
    lane = lane_fixture.get("lane", {}) if isinstance(lane_fixture.get("lane"), dict) else {}
    completed_tasks = completed_tasks or set()
    rows = []
    for task in lane.get("tasks", []):
        if not isinstance(task, dict):
            continue
        task_name = compact(str(task.get("name", "")))
        status = str(task.get("status", ""))
        if task_name in completed_tasks:
            status = "completed"
        rows.append(
            {
                "queueId": f"LANE-{task.get('taskId', 'unknown')}",
                "source": "first_codex_implementation_lane",
                "priority": int(task.get("priority", 99) or 99),
                "owner": str(task.get("owner", "")),
                "status": status,
                "task": task_name,
                "why": compact(str(task.get("why", ""))),
                "acceptance": compact(str(task.get("acceptance", ""))),
            }
        )
    return sorted(rows, key=lambda row: row["priority"])


def backlog_queue(backlog_fixture: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for item in backlog_fixture.get("topItems", []):
        if not isinstance(item, dict):
            continue
        if int(item.get("priority", 99) or 99) > 1:
            continue
        rows.append(
            {
                "queueId": f"BACKLOG-L{item.get('line', 'unknown')}",
                "source": "next_actions_backlog",
                "priority": int(item.get("priority", 99) or 99),
                "owner": str(item.get("owner", "")),
                "status": str(item.get("status", "")),
                "task": compact(str(item.get("task", ""))),
                "why": f"{item.get('section', 'Unknown')} line {item.get('line', 'unknown')}",
                "acceptance": compact(str(item.get("nextAction", ""))),
            }
        )
    return sorted(rows, key=lambda row: (row["priority"], row["source"], row["queueId"]))


def packet_dependencies(packet_fixture: dict[str, Any]) -> list[dict[str, str]]:
    packet = packet_fixture.get("packet", {}) if isinstance(packet_fixture.get("packet"), dict) else {}
    dependencies = packet.get("dependencyGate", [])
    rows = []
    if isinstance(dependencies, list):
        for item in dependencies:
            if not isinstance(item, dict):
                continue
            rows.append(
                {
                    "id": str(item.get("id", "")),
                    "status": str(item.get("status", "")),
                    "evidence": compact(str(item.get("evidence", ""))),
                }
            )
    return rows


def build_assignment(
    backlog_fixture: dict[str, Any],
    lane_fixture: dict[str, Any],
    packet_fixture: dict[str, Any],
    runtime_root: Path,
    outcome_fixture: dict[str, Any] | None = None,
) -> dict[str, Any]:
    lane_summary = lane_fixture.get("summary", {})
    backlog_summary = backlog_fixture.get("summary", {})
    packet_summary = packet_fixture.get("summary", {})
    completed_tasks = completed_tasks_from_outcome(outcome_fixture)
    lane_items = lane_queue(lane_fixture, completed_tasks)
    backlog_items = backlog_queue(backlog_fixture)
    open_lane_items = [item for item in lane_items if item["status"] != "completed"]
    immediate_queue = open_lane_items[:5] + backlog_items[:7]
    next_codex = next((item for item in open_lane_items if item["owner"].startswith("codex")), {})
    status = (
        "ready_for_codex_assignment"
        if lane_summary.get("status") == "open_for_codex_scoped_work"
        and packet_summary.get("status") == "ready_for_codex_scoped_implementation_review"
        and not bool(lane_summary.get("providerCallsAllowed", True))
        else "blocked_until_assignment_inputs_are_ready"
    )
    board = {
        "updatedAt": now_iso(),
        "mode": "read_only_a2a2a_team_assignment",
        "generatedBy": "scripts/a2a/a2a_team_assignment_board.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "status": status,
            "roles": len(role_rows()),
            "immediateQueueItems": len(immediate_queue),
            "codexReadyTasks": int(lane_summary.get("codexReadyTasks", 0) or 0),
            "completedCodexTasks": sum(1 for item in lane_items if item["status"] == "completed"),
            "reportOnlyWorkerTasks": int(lane_summary.get("reportInputTasks", 0) or 0),
            "backlogP0": int(backlog_summary.get("p0", 0) or 0),
            "backlogP1": int(backlog_summary.get("p1", 0) or 0),
            "blockedGates": int(backlog_summary.get("blocked", 0) or 0),
            "providerCallsAllowed": bool(lane_summary.get("providerCallsAllowed", True)),
            "workerDirectEditsAllowed": bool(lane_summary.get("workerDirectEditsAllowed", True)),
            "codexFileEditsAllowed": bool(lane_summary.get("codexFileEditsAllowed", False)),
        },
        "nextCodexAction": next_codex,
        "roles": role_rows(),
        "immediateQueue": immediate_queue,
        "completedLaneTasks": [item for item in lane_items if item["status"] == "completed"],
        "dependencyGate": packet_dependencies(packet_fixture),
        "blockedGates": backlog_fixture.get("blockedGates", [])[:8],
        "sourceFixtures": {
            "backlogPriority": "apps/mission-control/src/fixtures/a2a2aBacklogPriority.json",
            "firstCodexImplementationLane": "apps/mission-control/src/fixtures/a2a2aFirstCodexImplementationLane.json",
            "implementationLanePacket": "apps/mission-control/src/fixtures/a2a2aImplementationLanePacket.json",
        },
        "policyBoundary": [
            "read_only_assignment_fixture",
            "codex_only_repo_edits",
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
            "Codex reviews the nextCodexAction and source fixtures.",
            "Codex opens the smallest scoped implementation slice from the lane task list.",
            "Workers remain report-only and KOB remains validate-only until new lanes explicitly change those gates.",
        ],
    }
    runtime_report_path = runtime_root / "team_assignment" / "latest.json"
    write_json(runtime_report_path, board)
    board["runtimeReportPath"] = str(runtime_report_path)
    return board


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export read-only A2A2A team assignment board")
    parser.add_argument("--backlog-path", default=str(DEFAULT_BACKLOG_PATH))
    parser.add_argument("--lane-path", default=str(DEFAULT_LANE_PATH))
    parser.add_argument("--packet-path", default=str(DEFAULT_PACKET_PATH))
    parser.add_argument("--outcome-path", default=str(DEFAULT_OUTCOME_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    backlog = read_json(Path(os.path.expanduser(args.backlog_path)).resolve())
    lane = read_json(Path(os.path.expanduser(args.lane_path)).resolve())
    packet = read_json(Path(os.path.expanduser(args.packet_path)).resolve())
    outcome_path = Path(os.path.expanduser(args.outcome_path)).resolve()
    outcome = read_json(outcome_path) if outcome_path.exists() else None
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture = build_assignment(backlog, lane, packet, runtime_root, outcome)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {args.fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
