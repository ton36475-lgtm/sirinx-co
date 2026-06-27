#!/usr/bin/env python3
"""Open the first scoped Codex implementation lane from A2A2A audit evidence."""

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
DEFAULT_PACKET_PATH = FIXTURE_DIR / "a2a2aImplementationLanePacket.json"
DEFAULT_AUDIT_PATH = FIXTURE_DIR / "a2a2aCompletionAudit.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aFirstCodexImplementationLane.json"
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


def packet_ready(packet_fixture: dict[str, Any]) -> bool:
    summary = packet_fixture.get("summary", {})
    return (
        summary.get("status") == "ready_for_codex_scoped_implementation_review"
        and int(summary.get("blockedDependencies", 1) or 0) == 0
        and int(summary.get("missingDependencies", 1) or 0) == 0
        and int(summary.get("providerCalls", 1) or 0) == 0
    )


def audit_ready(audit_fixture: dict[str, Any]) -> bool:
    summary = audit_fixture.get("summary", {})
    return (
        summary.get("overallStatus") == "ready_for_first_scoped_codex_lane"
        and int(summary.get("failed", 1) or 0) == 0
        and int(summary.get("providerCalls", 1) or 0) == 0
    )


def lane_tasks(packet: dict[str, Any]) -> list[dict[str, Any]]:
    tasks = []
    for item in packet.get("priorityWorkItems", []):
        if not isinstance(item, dict):
            continue
        tasks.append(
            {
                "taskId": f"CODEX-LANE-TASK-{int(item.get('priority', 0)):02d}",
                "priority": int(item.get("priority", 0) or 0),
                "owner": str(item.get("owner", "")),
                "name": str(item.get("task", "")),
                "status": "ready_for_codex" if str(item.get("owner", "")).startswith("codex") else "report_input",
                "why": str(item.get("why", "")),
                "acceptance": str(item.get("acceptance", "")),
            }
        )
    return sorted(tasks, key=lambda row: row["priority"])


def build_lane(packet_fixture: dict[str, Any], audit_fixture: dict[str, Any], runtime_root: Path) -> dict[str, Any]:
    packet = packet_fixture.get("packet", {}) if isinstance(packet_fixture.get("packet"), dict) else {}
    ready = packet_ready(packet_fixture) and audit_ready(audit_fixture)
    source_lane_id = str(packet.get("laneId", "missing-lane"))
    lane_id = f"CODEX-FIRST-{sha256_text(source_lane_id)[:10]}"
    scope = packet.get("scope", {}) if isinstance(packet.get("scope"), dict) else {}
    lane = {
        "laneId": lane_id,
        "sourcePacketId": str(packet.get("packetId", "")),
        "sourceLaneId": source_lane_id,
        "status": "open_for_codex_scoped_work" if ready else "blocked_until_audit_passes",
        "createdAt": now_iso(),
        "objective": "Execute the first Codex-owned implementation lane from the A2A2A packet while keeping workers report-only.",
        "codexFileEditsAllowed": bool(ready),
        "workerDirectEditsAllowed": False,
        "providerCallsAllowed": False,
        "gitOwner": "codex",
        "allowedPaths": [str(item) for item in scope.get("allowedPaths", [])],
        "blockedPaths": [str(item) for item in scope.get("blockedPaths", [])],
        "tasks": lane_tasks(packet),
        "validationCommands": [str(command) for command in packet.get("validationCommands", [])],
        "scopedStageCommand": [str(part) for part in packet.get("scopedStageCommand", [])],
        "blockedActions": [str(action) for action in packet.get("blockedActions", [])],
        "acceptanceCriteria": [str(item) for item in packet.get("acceptanceCriteria", [])]
        + [
            "Completion audit remains 9/9 pass before Codex edits.",
            "Workers provide reports only; no worker commits or direct file edits.",
            "Codex validates and stages only lane-scoped files.",
        ],
        "reviewInputs": {
            "completionAudit": audit_fixture.get("summary", {}),
            "implementationPacket": packet_fixture.get("summary", {}),
        },
    }
    runtime_lane_path = runtime_root / "codex_implementation_lanes" / f"{lane_id}.json"
    write_json(runtime_lane_path, lane)
    return {
        "updatedAt": now_iso(),
        "mode": "read_only_first_codex_implementation_lane",
        "generatedBy": "scripts/a2a/a2a_codex_first_implementation_lane.py",
        "runtimeRoot": str(runtime_root),
        "runtimeLanePath": str(runtime_lane_path),
        "summary": {
            "status": lane["status"],
            "tasks": len(lane["tasks"]),
            "codexReadyTasks": sum(1 for task in lane["tasks"] if task["status"] == "ready_for_codex"),
            "reportInputTasks": sum(1 for task in lane["tasks"] if task["status"] == "report_input"),
            "providerCallsAllowed": lane["providerCallsAllowed"],
            "workerDirectEditsAllowed": lane["workerDirectEditsAllowed"],
            "codexFileEditsAllowed": lane["codexFileEditsAllowed"],
            "validationCommands": len(lane["validationCommands"]),
        },
        "lane": lane,
        "policyBoundary": [
            "codex_only_file_edits",
            "workers_report_only",
            "no_provider_call",
            "no_connector_sync",
            "no_deploy",
            "no_push",
            "no_secret_read_or_print",
            "no_git_add_dot",
            "no_generated_web_sirinx_asset_mutation",
        ],
        "nextSafeActions": [
            "Codex reviews lane tasks and selects the smallest implementation slice.",
            "Codex edits only allowed paths and keeps worker reports as inputs.",
            "Run validation commands before scoped staging.",
        ],
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Open first scoped Codex implementation lane from A2A2A fixtures")
    parser.add_argument("--packet-path", default=str(DEFAULT_PACKET_PATH))
    parser.add_argument("--audit-path", default=str(DEFAULT_AUDIT_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    packet = read_json(Path(os.path.expanduser(args.packet_path)).resolve())
    audit = read_json(Path(os.path.expanduser(args.audit_path)).resolve())
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture = build_lane(packet, audit, runtime_root)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {args.fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
