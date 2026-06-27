#!/usr/bin/env python3
"""Record the outcome for the active A2A2A next scoped coding packet."""

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
DEFAULT_PACKET_PATH = FIXTURE_DIR / "a2a2aNextScopedCodingPacket.json"
DEFAULT_VALIDATION_PATH = FIXTURE_DIR / "a2a2aNextScopedCodingPacketValidation.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aNextScopedCodingPacketOutcome.json"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
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


def as_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def build_outcome(
    packet_fixture: dict[str, Any],
    validation_fixture: dict[str, Any],
    runtime_root: Path,
    commit_evidence: str,
) -> dict[str, Any]:
    packet_summary = packet_fixture.get("summary") if isinstance(packet_fixture.get("summary"), dict) else {}
    packet = packet_fixture.get("packet") if isinstance(packet_fixture.get("packet"), dict) else {}
    validation_summary = (
        validation_fixture.get("summary") if isinstance(validation_fixture.get("summary"), dict) else {}
    )
    validation_passed = (
        validation_summary.get("status") == "passed"
        and validation_summary.get("packetId") == packet.get("packetId")
        and validation_summary.get("selectedBacklogId") == packet.get("selectedBacklogId")
        and as_int(validation_summary.get("failed"), 1) == 0
    )
    ready = (
        bool(packet)
        and packet_summary.get("status") == "ready_for_scoped_coding_packet"
        and packet.get("status") == "ready_for_scoped_coding"
        and packet.get("owner") == "codex"
        and packet.get("ownerMode") == "scoped_repo_edit"
        and packet.get("selectedBacklogId") == "BACKLOG-092"
        and bool(packet.get("executionAllowed"))
        and validation_passed
        and not bool(packet_summary.get("providerCallsAllowed"))
        and not bool(packet_summary.get("workerDirectEditsAllowed"))
        and not bool(packet_summary.get("gitAddDotAllowed"))
        and not bool(packet.get("providerCallsAllowed"))
        and not bool(packet.get("workerDirectEditsAllowed"))
        and not bool(packet.get("gitAddDotAllowed"))
    )
    validation_evidence = {
        "validationStatus": str(validation_summary.get("status", "missing")),
        "validationCommands": as_int(validation_summary.get("commands")),
        "validationPassed": as_int(validation_summary.get("passed")),
        "validationFailed": as_int(validation_summary.get("failed")),
        "validationReportPath": str(validation_fixture.get("runtimeReportPath", "")),
    }
    outcome = {
        "updatedAt": now_iso(),
        "mode": "read_only_next_scoped_coding_packet_outcome",
        "generatedBy": "scripts/a2a/a2a_next_scoped_coding_packet_outcome.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "status": "packet_completed" if ready else "blocked_until_local_evidence_ready",
            "selectedPacketId": str(packet.get("packetId", "")),
            "selectedBacklogId": str(packet.get("selectedBacklogId", "")),
            "selectedTask": str(packet.get("task", "")),
            "validationStatus": validation_evidence["validationStatus"],
            "validationFailed": validation_evidence["validationFailed"],
            "commitEvidence": commit_evidence,
            "providerCallsAllowed": False,
            "workerDirectEditsAllowed": False,
            "gitAddDotAllowed": False,
        },
        "selectedPacket": packet,
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
            "no_public_benchmark_claim_without_local_evidence",
        ],
        "nextSafeActions": [
            "open_next_scoped_coding_packet_from_ready_queue",
            "keep_provider_connector_deploy_push_and_generated_asset_lanes_blocked",
            "store_future_glm52_findings_as_report_only_evidence",
        ],
    }
    runtime_report_path = runtime_root / "next_scoped_coding_packet_outcomes" / "latest.json"
    write_json(runtime_report_path, outcome)
    outcome["runtimeReportPath"] = str(runtime_report_path)
    return outcome


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export A2A2A next scoped coding packet outcome")
    parser.add_argument("--packet-path", default=str(DEFAULT_PACKET_PATH))
    parser.add_argument("--validation-path", default=str(DEFAULT_VALIDATION_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--commit-evidence", default="")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    packet = read_json(Path(os.path.expanduser(args.packet_path)).resolve())
    validation = read_json(Path(os.path.expanduser(args.validation_path)).resolve())
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    commit_evidence = args.commit_evidence.strip() or git_oneline(REPO_ROOT)
    fixture = build_outcome(packet, validation, runtime_root, commit_evidence)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {Path(os.path.expanduser(args.fixture_path)).resolve()}")
    return 0 if fixture["summary"]["status"] == "packet_completed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
