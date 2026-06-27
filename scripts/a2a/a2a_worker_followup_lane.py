#!/usr/bin/env python3
"""Create the next Codex lane fixture from the A2A2A worker follow-up brief."""

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
DEFAULT_BRIEF_PATH = FIXTURE_DIR / "a2a2aWorkerFollowupBrief.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aWorkerFollowupLane.json"
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


def build_lane(brief: dict[str, Any], runtime_root: Path) -> dict[str, Any]:
    summary = brief.get("summary") if isinstance(brief.get("summary"), dict) else {}
    followup = brief.get("recommendedCodexFollowup") if isinstance(brief.get("recommendedCodexFollowup"), dict) else {}
    source_packet = brief.get("sourcePacket") if isinstance(brief.get("sourcePacket"), dict) else {}
    ready = (
        summary.get("status") == "ready_for_codex_followup_brief"
        and bool(summary.get("codexMayOpenNextLane", False))
        and int(summary.get("providerCalls", 1) or 0) == 0
    )
    lane_name = str(followup.get("lane", "LANE_A2A2A_WORKER_FEEDBACK_CONSUMPTION"))
    lane_id = f"{lane_name}-{sha256_text(str(source_packet.get('packetId', 'missing-packet')))[:8]}"
    allowed_paths = [str(path) for path in followup.get("allowedPaths", []) if str(path)]
    blocked_actions = [str(action) for action in followup.get("blockedActions", []) if str(action)]
    validation_commands = [str(command) for command in followup.get("validationCommands", []) if str(command)]
    lane = {
        "laneId": lane_id,
        "sourceBriefStatus": str(summary.get("status", "")),
        "sourcePacketId": str(source_packet.get("packetId", "")),
        "sourceQueueId": str(source_packet.get("queueId", "")),
        "createdAt": now_iso(),
        "status": "open_for_codex_scoped_work" if ready else "blocked_until_followup_brief_ready",
        "owner": "codex",
        "gitOwner": "codex",
        "workerDirectEditsAllowed": False,
        "providerCallsAllowed": False,
        "connectorSyncAllowed": False,
        "deployAllowed": False,
        "pushAllowed": False,
        "gitAddDotAllowed": False,
        "objective": str(followup.get("task", "consume worker reports and open the next scoped implementation lane")),
        "allowedPaths": allowed_paths,
        "blockedActions": blocked_actions,
        "validationCommands": validation_commands,
        "tasks": [
            {
                "taskId": "FOLLOWUP-CODEX-01",
                "owner": "codex",
                "status": "ready_for_codex" if ready else "blocked",
                "name": "review_worker_followup_brief",
                "acceptance": "Codex confirms source packet, worker signals, providerCalls=0, and allowed paths.",
            },
            {
                "taskId": "FOLLOWUP-CODEX-02",
                "owner": "codex",
                "status": "ready_for_codex" if ready else "blocked",
                "name": "create_next_scoped_implementation_packet",
                "acceptance": "New packet names files, tests, and blocked actions before any edit.",
            },
            {
                "taskId": "FOLLOWUP-CODEX-03",
                "owner": "codex",
                "status": "ready_for_codex" if ready else "blocked",
                "name": "run_validation_before_stage",
                "acceptance": "Focused tests, Mission Control typecheck, JSON parse, Prettier, and scoped diff check pass.",
            },
        ],
        "acceptanceCriteria": [
            "Workers remain report-only inputs.",
            "Codex owns all repo edits and git state.",
            "Provider calls require a valid Command Broker lease.",
            "No deploy, push, connector sync, secret read, Docker start, external clone, or git add dot.",
        ],
    }
    runtime_lane_path = runtime_root / "worker_followup_lanes" / f"{lane_id}.json"
    write_json(runtime_lane_path, lane)
    return {
        "updatedAt": now_iso(),
        "mode": "read_only_worker_followup_lane",
        "generatedBy": "scripts/a2a/a2a_worker_followup_lane.py",
        "runtimeRoot": str(runtime_root),
        "runtimeLanePath": str(runtime_lane_path),
        "summary": {
            "status": lane["status"],
            "tasks": len(lane["tasks"]),
            "codexReadyTasks": sum(1 for task in lane["tasks"] if task["status"] == "ready_for_codex"),
            "providerCallsAllowed": lane["providerCallsAllowed"],
            "workerDirectEditsAllowed": lane["workerDirectEditsAllowed"],
            "gitAddDotAllowed": lane["gitAddDotAllowed"],
            "allowedPaths": len(allowed_paths),
            "validationCommands": len(validation_commands),
        },
        "lane": lane,
        "policyBoundary": [
            "read_only_lane_fixture",
            "codex_only_scoped_repo_edits",
            "workers_report_only",
            "provider_calls_require_command_broker_lease",
            "no_connector_sync",
            "no_deploy",
            "no_push",
            "no_secret_values",
            "no_git_add_dot",
        ],
        "nextSafeActions": [
            "Codex reviews this lane fixture before opening the next implementation packet.",
            "Keep worker report signals as inputs only.",
            "Regenerate Mission Control fixtures after the next packet is created.",
        ],
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create A2A2A worker follow-up lane fixture")
    parser.add_argument("--brief-path", default=str(DEFAULT_BRIEF_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    brief = read_json(Path(os.path.expanduser(args.brief_path)).resolve())
    fixture = build_lane(brief, runtime_root)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {Path(os.path.expanduser(args.fixture_path)).resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
