#!/usr/bin/env python3
"""Create the A2A2A team coding start packet after worker follow-up closes."""

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
DEFAULT_OUTCOME_PATH = FIXTURE_DIR / "a2a2aWorkerFollowupPacketOutcome.json"
DEFAULT_BACKLOG_PATH = FIXTURE_DIR / "a2a2aBacklogPriority.json"
DEFAULT_ASSIGNMENT_PATH = FIXTURE_DIR / "a2a2aTeamAssignmentBoard.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aTeamCodingStartPacket.json"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def safe_str(value: Any) -> str:
    return str(value or "")


def as_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def ready_items(backlog: dict[str, Any], limit: int = 8) -> list[dict[str, Any]]:
    items = []
    for item in backlog.get("topItems", []):
        if not isinstance(item, dict) or item.get("status") != "ready_for_review":
            continue
        items.append(
            {
                "id": safe_str(item.get("id")),
                "priority": int(item.get("priority", 9) or 9),
                "owner": safe_str(item.get("owner")),
                "task": safe_str(item.get("task")),
                "nextAction": safe_str(item.get("nextAction")),
                "source": "a2a2aBacklogPriority.topItems",
            }
        )
    return items[:limit]


def role_map(assignment: dict[str, Any]) -> list[dict[str, str]]:
    roles = []
    for role in assignment.get("roles", []):
        if not isinstance(role, dict):
            continue
        roles.append(
            {
                "role": safe_str(role.get("role")),
                "title": safe_str(role.get("title")),
                "responsibility": safe_str(role.get("responsibility")),
                "currentAction": safe_str(role.get("currentAction")),
                "editRights": safe_str(role.get("editRights")),
            }
        )
    return roles


def select_coding_item(queue: list[dict[str, Any]]) -> dict[str, Any]:
    for item in queue:
        task = safe_str(item.get("task")).lower()
        if item.get("owner") == "codex" and "screenshot" not in task and not task.startswith("capture "):
            return item
    for item in queue:
        if item.get("owner") == "codex":
            return item
    return queue[0] if queue else {}


def build_packet(
    outcome_fixture: dict[str, Any],
    backlog_fixture: dict[str, Any],
    assignment_fixture: dict[str, Any],
    runtime_root: Path,
) -> dict[str, Any]:
    outcome_summary = (
        outcome_fixture.get("summary") if isinstance(outcome_fixture.get("summary"), dict) else {}
    )
    backlog_summary = (
        backlog_fixture.get("summary") if isinstance(backlog_fixture.get("summary"), dict) else {}
    )
    queue = ready_items(backlog_fixture)
    roles = role_map(assignment_fixture)
    ready = (
        outcome_summary.get("status") == "packet_completed"
        and outcome_summary.get("validationStatus") == "passed"
        and as_int(outcome_summary.get("validationFailed"), 1) == 0
        and not bool(outcome_summary.get("providerCallsAllowed"))
        and not bool(outcome_summary.get("workerDirectEditsAllowed"))
        and not bool(outcome_summary.get("gitAddDotAllowed"))
    )
    selected_queue = select_coding_item(queue)
    packet_seed = f"{outcome_summary.get('selectedPacketId','missing')}|{selected_queue.get('id','no-backlog')}"
    start_packet = {
        "packetId": f"TEAM-CODING-START-{sha256_text(packet_seed)[:10]}",
        "status": "ready_for_scoped_packet_creation" if ready else "blocked_until_worker_outcome_complete",
        "owner": "codex",
        "ownerMode": "scoped_packet_author",
        "sourceOutcomePacketId": safe_str(outcome_summary.get("selectedPacketId")),
        "sourceOutcomeStatus": safe_str(outcome_summary.get("status")),
        "selectedBacklogId": safe_str(selected_queue.get("id")),
        "selectedBacklogOwner": safe_str(selected_queue.get("owner")),
        "task": "create_next_scoped_codex_coding_packet",
        "why": "The report-only worker feedback cycle is closed; Codex can open the next smallest coding packet.",
        "acceptance": "Create a fresh scoped packet for the selected queue item before editing business code.",
        "allowedActions": [
            "inspect_priority_queue",
            "create_scoped_packet",
            "define_allowed_paths",
            "define_validation_commands",
            "keep_workers_report_only",
        ],
        "blockedActions": [
            "provider_call_without_command_broker_lease",
            "connector_sync",
            "deploy",
            "push",
            "secret_read_or_print",
            "git_add_dot",
            "worker_direct_commit",
            "generated_web_sirinx_asset_mutation",
            "business_logic_edit_without_fresh_packet",
        ],
        "allowedPathsForPacketAuthoring": [
            "scripts/a2a/",
            "apps/mission-control/src/fixtures/",
            "apps/mission-control/src/App.tsx",
            "docs/a2async/",
            "PROJECT_STATE.md",
            "NEXT_ACTIONS.md",
            "tests/ghostclaw_runner/",
        ],
        "validationCommands": [
            "python3 -m unittest tests.ghostclaw_runner.test_runner_status_fixture",
            "pnpm --filter @sirinx/mission-control exec tsc --noEmit",
            "pnpm exec prettier --check apps/mission-control/src/App.tsx docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md PROJECT_STATE.md NEXT_ACTIONS.md",
            "git diff --check -- scripts/a2a tests/ghostclaw_runner apps/mission-control/src/fixtures apps/mission-control/src/App.tsx docs/a2async PROJECT_STATE.md NEXT_ACTIONS.md",
        ],
    }
    status = "ready_for_team_coding" if ready else "blocked_until_worker_followup_outcome"
    packet = {
        "updatedAt": now_iso(),
        "mode": "read_only_team_coding_start_packet",
        "generatedBy": "scripts/a2a/a2a_team_coding_start_packet.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "status": status,
            "sourceOutcomeStatus": safe_str(outcome_summary.get("status")),
            "sourceOutcomeValidation": safe_str(outcome_summary.get("validationStatus")),
            "readyQueueItems": len(queue),
            "blockedGates": as_int(backlog_summary.get("blocked")),
            "roles": len(roles),
            "providerCallsAllowed": False,
            "workerDirectEditsAllowed": False,
            "gitAddDotAllowed": False,
            "businessLogicEditsAllowed": False,
        },
        "codexStartPacket": start_packet,
        "priorityQueue": queue,
        "roleMap": roles,
        "policyBoundary": [
            "read_only_team_coding_start_packet",
            "codex_creates_fresh_scoped_packet_before_business_edits",
            "hermes_classifies_dependency_and_gate_order",
            "opus_architecture_before_build",
            "glm52_deepseek_agy_report_only",
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
            "Codex creates a fresh scoped implementation packet for the selected backlog item.",
            "Hermes keeps blocked gates separate from ready coding work.",
            "Workers may produce reports only after Codex defines the scoped packet.",
        ],
    }
    runtime_report_path = runtime_root / "team_coding_start_packets" / "latest.json"
    write_json(runtime_report_path, packet)
    packet["runtimeReportPath"] = str(runtime_report_path)
    return packet


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export A2A2A team coding start packet")
    parser.add_argument("--outcome-path", default=str(DEFAULT_OUTCOME_PATH))
    parser.add_argument("--backlog-path", default=str(DEFAULT_BACKLOG_PATH))
    parser.add_argument("--assignment-path", default=str(DEFAULT_ASSIGNMENT_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    outcome = read_json(Path(os.path.expanduser(args.outcome_path)).resolve())
    backlog = read_json(Path(os.path.expanduser(args.backlog_path)).resolve())
    assignment = read_json(Path(os.path.expanduser(args.assignment_path)).resolve())
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture = build_packet(outcome, backlog, assignment, runtime_root)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {Path(os.path.expanduser(args.fixture_path)).resolve()}")
    return 0 if fixture["summary"]["status"] == "ready_for_team_coding" else 1


if __name__ == "__main__":
    raise SystemExit(main())
