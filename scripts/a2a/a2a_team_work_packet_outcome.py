#!/usr/bin/env python3
"""Record the outcome for the current A2A2A team work packet."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_DIR = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures"
DEFAULT_PACKETS_PATH = FIXTURE_DIR / "a2a2aTeamWorkPackets.json"
DEFAULT_GUARD_PATH = FIXTURE_DIR / "a2a2aScopedPathGuard.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aTeamWorkPacketOutcome.json"
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


def git_oneline(repo_root: Path) -> str:
    try:
        return subprocess.check_output(
            ["/usr/bin/git", "log", "-1", "--oneline"],
            cwd=repo_root,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def select_packet(packets: dict[str, Any], packet_id: str) -> dict[str, Any]:
    if packet_id:
        for packet in packets.get("packets", []):
            if isinstance(packet, dict) and packet.get("packetId") == packet_id:
                return packet
        return {}
    packet = packets.get("nextCodexPacket", {})
    return packet if isinstance(packet, dict) else {}


def build_outcome(
    packets: dict[str, Any],
    guard: dict[str, Any],
    runtime_root: Path,
    commit_evidence: str,
    packet_id: str = "",
) -> dict[str, Any]:
    selected_packet = select_packet(packets, packet_id)
    packets_summary = packets.get("summary", {})
    guard_summary = guard.get("summary", {})
    planned_blocked = int(guard_summary.get("plannedBlocked", 0) or 0)
    ready = (
        bool(selected_packet)
        and selected_packet.get("ownerMode") == "scoped_repo_edit"
        and selected_packet.get("status") == "ready_for_codex_scoped_work"
        and bool(selected_packet.get("executionAllowed"))
        and not bool(packets_summary.get("providerCallsAllowed"))
        and not bool(packets_summary.get("workerDirectEditsAllowed"))
        and not bool(packets_summary.get("gitAddDotAllowed"))
        and planned_blocked == 0
    )
    validation_evidence = {
        "scopedPathGuardStatus": str(guard_summary.get("status", "")),
        "plannedFiles": int(guard_summary.get("plannedFiles", 0) or 0),
        "plannedAllowed": int(guard_summary.get("plannedAllowed", 0) or 0),
        "plannedBlocked": planned_blocked,
        "outOfScopeDirty": int(guard_summary.get("outOfScopeDirty", 0) or 0),
        "providerCalls": int(guard_summary.get("providerCalls", 0) or 0),
        "gitAddDotAllowed": bool(guard_summary.get("gitAddDotAllowed")),
    }
    outcome = {
        "updatedAt": now_iso(),
        "mode": "read_only_team_work_packet_outcome",
        "generatedBy": "scripts/a2a/a2a_team_work_packet_outcome.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "status": "packet_completed" if ready else "blocked_until_local_evidence_ready",
            "selectedPacketId": str(selected_packet.get("packetId", "")),
            "selectedQueueId": str(selected_packet.get("queueId", "")),
            "selectedTask": str(selected_packet.get("task", "")),
            "completedPackets": 1 if ready else 0,
            "providerCallsAllowed": False,
            "workerDirectEditsAllowed": False,
            "gitAddDotAllowed": False,
            "plannedBlocked": planned_blocked,
            "commitEvidence": commit_evidence,
        },
        "completedPackets": [str(selected_packet.get("packetId", ""))] if ready else [],
        "completedQueueIds": [str(selected_packet.get("queueId", ""))] if ready else [],
        "selectedPacket": selected_packet,
        "validationEvidence": validation_evidence,
        "policyBoundary": [
            "read_only_outcome_fixture",
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
            "Regenerate a2a2aTeamWorkPackets.json so the completed packet is skipped.",
            "Run scoped validation for the next Codex packet.",
            "Keep provider, connector, deploy, push, and generated asset lanes blocked.",
        ],
    }
    runtime_report_path = runtime_root / "work_packet_outcomes" / "latest.json"
    write_json(runtime_report_path, outcome)
    outcome["runtimeReportPath"] = str(runtime_report_path)
    return outcome


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export A2A2A team work packet outcome")
    parser.add_argument("--packets-path", default=str(DEFAULT_PACKETS_PATH))
    parser.add_argument("--guard-path", default=str(DEFAULT_GUARD_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--packet-id", default="")
    parser.add_argument("--commit-evidence", default="")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    packets = read_json(Path(os.path.expanduser(args.packets_path)).resolve())
    guard = read_json(Path(os.path.expanduser(args.guard_path)).resolve())
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    commit_evidence = args.commit_evidence.strip() or git_oneline(REPO_ROOT)
    fixture = build_outcome(packets, guard, runtime_root, commit_evidence, args.packet_id.strip())
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {args.fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
