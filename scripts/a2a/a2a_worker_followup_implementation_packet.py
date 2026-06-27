#!/usr/bin/env python3
"""Create a scoped implementation packet from the worker follow-up lane."""

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
DEFAULT_LANE_PATH = FIXTURE_DIR / "a2a2aWorkerFollowupLane.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aWorkerFollowupImplementationPacket.json"
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


def unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def build_packet(lane_fixture: dict[str, Any], runtime_root: Path) -> dict[str, Any]:
    lane = lane_fixture.get("lane") if isinstance(lane_fixture.get("lane"), dict) else {}
    summary = lane_fixture.get("summary") if isinstance(lane_fixture.get("summary"), dict) else {}
    ready = (
        summary.get("status") == "open_for_codex_scoped_work"
        and not bool(summary.get("providerCallsAllowed", True))
        and not bool(summary.get("workerDirectEditsAllowed", True))
        and not bool(summary.get("gitAddDotAllowed", True))
    )
    source_lane_id = str(lane.get("laneId", "missing-lane"))
    packet_id = f"FOLLOWUP-PACKET-{sha256_text(source_lane_id)[:10]}"
    planned_files = unique(
        [
            "scripts/a2a/a2a_worker_followup_implementation_packet.py",
            "apps/mission-control/src/fixtures/a2a2aWorkerFollowupImplementationPacket.json",
            "apps/mission-control/src/App.tsx",
            "tests/ghostclaw_runner/test_runner_status_fixture.py",
            "docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md",
            "PROJECT_STATE.md",
            "NEXT_ACTIONS.md",
        ]
    )
    validation_commands = unique(
        [
            *[str(command) for command in lane.get("validationCommands", []) if str(command)],
            "python3 -m py_compile scripts/a2a/a2a_worker_followup_implementation_packet.py tests/ghostclaw_runner/test_runner_status_fixture.py",
            "python3 -m json.tool apps/mission-control/src/fixtures/a2a2aWorkerFollowupImplementationPacket.json >/tmp/a2a2aWorkerFollowupImplementationPacket.json.check",
        ]
    )
    packet = {
        "packetId": packet_id,
        "sourceLaneId": source_lane_id,
        "sourcePacketId": str(lane.get("sourcePacketId", "")),
        "sourceQueueId": str(lane.get("sourceQueueId", "")),
        "createdAt": now_iso(),
        "status": "ready_for_codex_scoped_work" if ready else "blocked_until_lane_ready",
        "owner": "codex",
        "ownerMode": "scoped_repo_edit",
        "executionAllowed": bool(ready),
        "providerCallsAllowed": False,
        "workerDirectEditsAllowed": False,
        "gitAddDotAllowed": False,
        "task": "implement_next_scoped_a2a2a_sync_slice",
        "why": "Worker reports have been normalized into a Codex-owned follow-up lane.",
        "acceptance": "Codex edits only packet files, runs validation, and stages only this packet scope.",
        "allowedActions": [
            "inspect_source_fixtures",
            "edit_allowed_paths_only",
            "run_scoped_validation",
            "stage_packet_files_after_validation",
        ],
        "allowedPaths": [str(path) for path in lane.get("allowedPaths", []) if str(path)],
        "blockedActions": [str(action) for action in lane.get("blockedActions", []) if str(action)],
        "plannedFiles": planned_files,
        "validationCommands": validation_commands,
        "sourceFixtures": {
            "workerFollowupBrief": "apps/mission-control/src/fixtures/a2a2aWorkerFollowupBrief.json",
            "workerFollowupLane": "apps/mission-control/src/fixtures/a2a2aWorkerFollowupLane.json",
        },
        "tasks": [
            {
                "taskId": "FOLLOWUP-PACKET-01",
                "name": "inspect_followup_lane",
                "owner": "codex",
                "status": "ready",
            },
            {
                "taskId": "FOLLOWUP-PACKET-02",
                "name": "implement_packet_files_only",
                "owner": "codex",
                "status": "ready" if ready else "blocked",
            },
            {
                "taskId": "FOLLOWUP-PACKET-03",
                "name": "run_validation_and_stage_scope",
                "owner": "codex",
                "status": "ready" if ready else "blocked",
            },
        ],
    }
    runtime_packet_path = runtime_root / "worker_followup_packets" / f"{packet_id}.json"
    write_json(runtime_packet_path, packet)
    return {
        "updatedAt": now_iso(),
        "mode": "read_only_worker_followup_implementation_packet",
        "generatedBy": "scripts/a2a/a2a_worker_followup_implementation_packet.py",
        "runtimeRoot": str(runtime_root),
        "runtimePacketPath": str(runtime_packet_path),
        "summary": {
            "status": packet["status"],
            "tasks": len(packet["tasks"]),
            "plannedFiles": len(planned_files),
            "allowedPaths": len(packet["allowedPaths"]),
            "validationCommands": len(validation_commands),
            "providerCallsAllowed": packet["providerCallsAllowed"],
            "workerDirectEditsAllowed": packet["workerDirectEditsAllowed"],
            "gitAddDotAllowed": packet["gitAddDotAllowed"],
            "executionAllowed": packet["executionAllowed"],
        },
        "packet": packet,
        "policyBoundary": [
            "read_only_packet_fixture",
            "codex_git_owner",
            "workers_report_only",
            "provider_calls_require_command_broker_lease",
            "no_connector_sync",
            "no_deploy",
            "no_push",
            "no_secret_values",
            "no_git_add_dot",
        ],
        "nextSafeActions": [
            "Codex reviews this packet and confirms the planned file list.",
            "Run validation before scoped staging.",
            "Stage only the packet-listed files.",
        ],
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create A2A2A worker follow-up implementation packet")
    parser.add_argument("--lane-path", default=str(DEFAULT_LANE_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    lane = read_json(Path(os.path.expanduser(args.lane_path)).resolve())
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture = build_packet(lane, runtime_root)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {Path(os.path.expanduser(args.fixture_path)).resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
