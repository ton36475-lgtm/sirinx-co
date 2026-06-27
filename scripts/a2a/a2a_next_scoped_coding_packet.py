#!/usr/bin/env python3
"""Create the next concrete scoped Codex coding packet from the team start packet."""

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
DEFAULT_START_PATH = FIXTURE_DIR / "a2a2aTeamCodingStartPacket.json"
DEFAULT_COMPLETED_OUTCOME_PATH = FIXTURE_DIR / "a2a2aNextScopedCodingPacketOutcome.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aNextScopedCodingPacket.json"
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


def select_priority_item(start_fixture: dict[str, Any], selected_id: str) -> dict[str, Any]:
    for item in start_fixture.get("priorityQueue", []):
        if isinstance(item, dict) and item.get("id") == selected_id:
            return item
    return {}


def completed_backlog_ids(completed_outcomes: list[dict[str, Any]] | None) -> set[str]:
    ids: set[str] = set()
    for outcome in completed_outcomes or []:
        summary = outcome.get("summary") if isinstance(outcome.get("summary"), dict) else {}
        if summary.get("status") != "packet_completed":
            continue
        backlog_id = safe_str(summary.get("selectedBacklogId"))
        if backlog_id:
            ids.add(backlog_id)
    return ids


def select_next_coding_item(start_fixture: dict[str, Any], completed_ids: set[str]) -> dict[str, Any]:
    codex_items = [
        item
        for item in start_fixture.get("priorityQueue", [])
        if isinstance(item, dict) and item.get("owner") == "codex" and item.get("id") not in completed_ids
    ]
    for item in codex_items:
        task = safe_str(item.get("task")).lower()
        if "screenshot" not in task and not task.startswith("capture "):
            return item
    return codex_items[0] if codex_items else {}


def planned_files_for_backlog(backlog_id: str) -> list[str]:
    if backlog_id == "BACKLOG-092":
        return [
            "scripts/model_eval/glm52_ui_review_benchmark.py",
            "tests/model_eval/test_glm52_ui_review_benchmark.py",
            "apps/mission-control/src/fixtures/glm52UiBenchmarkStatus.json",
            "apps/mission-control/src/App.tsx",
            "docs/model-evals/GLM52_UI_REVIEW_BENCHMARK.md",
            "PROJECT_STATE.md",
            "NEXT_ACTIONS.md",
        ]
    if backlog_id == "BACKLOG-096":
        return [
            "scripts/a2a/a2a_campaign_pack_browser_status.py",
            "tests/ghostclaw_runner/test_runner_status_fixture.py",
            "apps/mission-control/src/fixtures/campaignPackBrowserStatus.json",
            "apps/mission-control/src/App.tsx",
            "docs/marketing_automation/FACEBOOK_AI_CONTENT_FACTORY_WORKFLOW.md",
            "PROJECT_STATE.md",
            "NEXT_ACTIONS.md",
        ]
    return [
        "scripts/a2a/a2a_next_scoped_coding_packet.py",
        "apps/mission-control/src/fixtures/a2a2aNextScopedCodingPacket.json",
        "apps/mission-control/src/App.tsx",
        "docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md",
        "PROJECT_STATE.md",
        "NEXT_ACTIONS.md",
    ]


def allowed_paths_for_backlog(backlog_id: str) -> list[str]:
    if backlog_id == "BACKLOG-092":
        return [
            "scripts/model_eval/",
            "tests/model_eval/",
            "apps/mission-control/src/fixtures/",
            "apps/mission-control/src/App.tsx",
            "docs/model-evals/",
            "PROJECT_STATE.md",
            "NEXT_ACTIONS.md",
        ]
    if backlog_id == "BACKLOG-096":
        return [
            "scripts/a2a/",
            "tests/ghostclaw_runner/",
            "apps/mission-control/src/fixtures/",
            "apps/mission-control/src/App.tsx",
            "docs/marketing_automation/",
            "PROJECT_STATE.md",
            "NEXT_ACTIONS.md",
        ]
    return [
        "scripts/a2a/",
        "apps/mission-control/src/fixtures/",
        "apps/mission-control/src/App.tsx",
        "docs/a2async/",
        "PROJECT_STATE.md",
        "NEXT_ACTIONS.md",
    ]


def validation_commands_for_backlog(backlog_id: str) -> list[str]:
    if backlog_id == "BACKLOG-096":
        return [
            "python3 -m py_compile scripts/a2a/a2a_campaign_pack_browser_status.py tests/ghostclaw_runner/test_runner_status_fixture.py",
            "python3 -m unittest tests.ghostclaw_runner.test_runner_status_fixture.A2A2ARunnerStatusFixtureTest.test_campaign_pack_browser_status_builds_read_only_fixture",
            "pnpm --filter @sirinx/mission-control exec tsc --noEmit",
            "pnpm exec prettier --check apps/mission-control/src/App.tsx apps/mission-control/src/fixtures/campaignPackBrowserStatus.json docs/marketing_automation/FACEBOOK_AI_CONTENT_FACTORY_WORKFLOW.md PROJECT_STATE.md NEXT_ACTIONS.md",
            "git diff --check -- scripts/a2a/a2a_campaign_pack_browser_status.py tests/ghostclaw_runner/test_runner_status_fixture.py apps/mission-control/src/fixtures/campaignPackBrowserStatus.json apps/mission-control/src/App.tsx docs/marketing_automation/FACEBOOK_AI_CONTENT_FACTORY_WORKFLOW.md PROJECT_STATE.md NEXT_ACTIONS.md",
        ]
    return [
        "python3 -m py_compile scripts/model_eval/glm52_ui_review_benchmark.py tests/model_eval/test_glm52_ui_review_benchmark.py",
        "python3 -m unittest tests.model_eval.test_glm52_ui_review_benchmark",
        "pnpm --filter @sirinx/mission-control exec tsc --noEmit",
        "pnpm exec prettier --check apps/mission-control/src/App.tsx docs/model-evals/GLM52_UI_REVIEW_BENCHMARK.md PROJECT_STATE.md NEXT_ACTIONS.md",
        "git diff --check -- scripts/model_eval tests/model_eval apps/mission-control/src/fixtures apps/mission-control/src/App.tsx docs/model-evals PROJECT_STATE.md NEXT_ACTIONS.md",
    ]


def build_packet(
    start_fixture: dict[str, Any],
    runtime_root: Path,
    completed_outcomes: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    summary = start_fixture.get("summary") if isinstance(start_fixture.get("summary"), dict) else {}
    start_packet = (
        start_fixture.get("codexStartPacket") if isinstance(start_fixture.get("codexStartPacket"), dict) else {}
    )
    completed_ids = completed_backlog_ids(completed_outcomes)
    requested_backlog_id = safe_str(start_packet.get("selectedBacklogId"))
    selected_backlog_id = requested_backlog_id
    selected_item = select_priority_item(start_fixture, selected_backlog_id)
    if selected_backlog_id in completed_ids:
        selected_item = select_next_coding_item(start_fixture, completed_ids)
        selected_backlog_id = safe_str(selected_item.get("id"))
    ready = (
        summary.get("status") == "ready_for_team_coding"
        and start_packet.get("status") == "ready_for_scoped_packet_creation"
        and safe_str(selected_item.get("owner") or start_packet.get("selectedBacklogOwner")) == "codex"
        and not bool(summary.get("providerCallsAllowed"))
        and not bool(summary.get("workerDirectEditsAllowed"))
        and not bool(summary.get("gitAddDotAllowed"))
        and bool(selected_item)
    )
    planned_files = planned_files_for_backlog(selected_backlog_id)
    validation_commands = validation_commands_for_backlog(selected_backlog_id)
    packet_id = f"SCOPED-CODING-{sha256_text(selected_backlog_id + '|' + safe_str(start_packet.get('packetId')))[:10]}"
    packet = {
        "packetId": packet_id,
        "sourceStartPacketId": safe_str(start_packet.get("packetId")),
        "selectedBacklogId": selected_backlog_id,
        "createdAt": now_iso(),
        "status": "ready_for_scoped_coding" if ready else "blocked_until_team_coding_start_ready",
        "owner": "codex",
        "ownerMode": "scoped_repo_edit",
        "executionAllowed": bool(ready),
        "providerCallsAllowed": False,
        "workerDirectEditsAllowed": False,
        "gitAddDotAllowed": False,
        "businessLogicEditsAllowed": False,
        "task": safe_str(selected_item.get("task")) or "create_next_scoped_codex_packet",
        "why": safe_str(selected_item.get("nextAction"))
        or "Codex must turn the selected queue item into scoped local edits.",
        "acceptance": "Implement only the planned local files, run validation, and stage only this packet scope.",
        "allowedActions": [
            "inspect_selected_backlog_item",
            "edit_planned_files_only",
            "run_scoped_validation",
            "stage_packet_files_after_validation",
        ],
        "allowedPaths": allowed_paths_for_backlog(selected_backlog_id),
        "blockedActions": [
            "provider_call_without_command_broker_lease",
            "connector_sync",
            "deploy",
            "push",
            "secret_read_or_print",
            "git_add_dot",
            "worker_direct_commit",
            "generated_web_sirinx_asset_mutation",
            "public_benchmark_claim_without_local_evidence",
        ],
        "plannedFiles": planned_files,
        "validationCommands": validation_commands,
        "workerInputs": [
            {
                "role": "glm52",
                "mode": "report_only_until_provider_lease",
                "task": "Review frontend/UI benchmark criteria after Codex creates local fixture.",
            },
            {
                "role": "agy",
                "mode": "report_only_until_provider_lease",
                "task": "Review Mission Control panel clarity after Codex creates local fixture.",
            },
            {
                "role": "kob",
                "mode": "validate_only",
                "task": "Validate proposed local commands through Command Broker policy.",
            },
        ],
    }
    fixture = {
        "updatedAt": now_iso(),
        "mode": "read_only_next_scoped_coding_packet",
        "generatedBy": "scripts/a2a/a2a_next_scoped_coding_packet.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "status": "ready_for_scoped_coding_packet" if ready else "blocked_until_team_coding_start_ready",
            "selectedBacklogId": selected_backlog_id,
            "plannedFiles": len(planned_files),
            "validationCommands": len(validation_commands),
            "workerInputs": len(packet["workerInputs"]),
            "providerCallsAllowed": False,
            "workerDirectEditsAllowed": False,
            "gitAddDotAllowed": False,
            "businessLogicEditsAllowed": False,
            "executionAllowed": bool(ready),
        },
        "selectedBacklogItem": selected_item,
        "requestedBacklogId": requested_backlog_id,
        "completedBacklogIds": sorted(completed_ids),
        "packet": packet,
        "policyBoundary": [
            "read_only_scoped_coding_packet",
            "codex_git_owner",
            "workers_report_only_until_provider_lease",
            "kob_validate_only",
            "mission_control_read_only",
            "provider_calls_require_command_broker_lease",
            "no_connector_sync",
            "no_deploy",
            "no_push",
            "no_secret_read_or_print",
            "no_git_add_dot",
            "no_generated_web_sirinx_asset_mutation",
        ],
        "nextSafeActions": [
            "Codex implements only the planned files for this scoped packet.",
            "Run packet validation before staging.",
            "Stage only the packet-listed files after validation passes.",
        ],
    }
    runtime_report_path = runtime_root / "next_scoped_coding_packets" / "latest.json"
    write_json(runtime_report_path, fixture)
    fixture["runtimeReportPath"] = str(runtime_report_path)
    return fixture


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export A2A2A next scoped Codex coding packet")
    parser.add_argument("--start-path", default=str(DEFAULT_START_PATH))
    parser.add_argument("--completed-outcome-path", default=str(DEFAULT_COMPLETED_OUTCOME_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    start = read_json(Path(os.path.expanduser(args.start_path)).resolve())
    completed_outcome = read_json(Path(os.path.expanduser(args.completed_outcome_path)).resolve())
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture = build_packet(start, runtime_root, completed_outcomes=[completed_outcome])
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {Path(os.path.expanduser(args.fixture_path)).resolve()}")
    return 0 if fixture["summary"]["status"] == "ready_for_scoped_coding_packet" else 1


if __name__ == "__main__":
    raise SystemExit(main())
