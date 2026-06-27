#!/usr/bin/env python3
"""Record the first Codex-owned A2A2A implementation slice outcome."""

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
DEFAULT_ASSIGNMENT_PATH = FIXTURE_DIR / "a2a2aTeamAssignmentBoard.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aCodexLaneOutcome.json"
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


def build_outcome(assignment: dict[str, Any], runtime_root: Path, commit_evidence: str) -> dict[str, Any]:
    summary = assignment.get("summary", {})
    next_action = assignment.get("nextCodexAction", {})
    ready = (
        summary.get("status") == "ready_for_codex_assignment"
        and bool(summary.get("codexFileEditsAllowed"))
        and not bool(summary.get("providerCallsAllowed"))
        and not bool(summary.get("workerDirectEditsAllowed"))
    )
    completed_checklist = [
        "Review a2a2aImplementationLanePacket.json.",
        "Review a2a2aFirstCodexImplementationLane.json and choose the smallest first implementation slice.",
        "Review a2a2aBacklogPriority.json and confirm P0/P1 ordering.",
        "Review a2a2aTeamAssignmentBoard.json and use nextCodexAction.",
        "Keep GLM-5.2, DeepSeek, AGY, and KOB report-only.",
        "Keep KOB validate-only until Command Broker issues an execution lease.",
        "Keep Mission Control read-only and fixture-backed.",
    ]
    outcome = {
        "updatedAt": now_iso(),
        "mode": "read_only_codex_lane_outcome",
        "generatedBy": "scripts/a2a/a2a_codex_lane_outcome.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "status": "first_codex_slice_completed" if ready else "blocked_until_assignment_ready",
            "selectedSlice": "a2a2a_team_assignment_board",
            "completedChecklistItems": len(completed_checklist) if ready else 0,
            "providerCalls": 0,
            "workerDirectEdits": False,
            "codexOwnedCommit": commit_evidence,
        },
        "completedChecklistItems": completed_checklist if ready else [],
        "selectedSlice": {
            "name": "a2a2a_team_assignment_board",
            "why": "It completes the first Codex inspection step by turning backlog plus lane fixtures into an actionable role/queue handoff.",
            "sourceNextAction": next_action,
            "commitEvidence": commit_evidence,
            "validationEvidence": [
                "python3 -m py_compile scripts/a2a/a2a_team_assignment_board.py scripts/a2a/a2a_backlog_priority.py tests/ghostclaw_runner/test_runner_status_fixture.py",
                "python3 -m unittest tests.ghostclaw_runner.test_agent_runner tests.ghostclaw_runner.test_runner_status_fixture",
                "python3 -m json.tool apps/mission-control/src/fixtures/a2a2aTeamAssignmentBoard.json",
                "pnpm --filter @sirinx/mission-control exec tsc --noEmit",
                "pnpm exec prettier --check apps/mission-control/src/App.tsx docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md PROJECT_STATE.md NEXT_ACTIONS.md",
                "/usr/bin/git diff --cached --check",
            ],
        },
        "remainingQueue": [
            "Open the next scoped Codex implementation slice from assignment board immediateQueue.",
            "Keep provider/model execution lanes closed until explicit runtime policy exists.",
            "Keep connector/deploy/generated-asset lanes separate from A2A2A coding sync.",
        ],
        "policyBoundary": [
            "read_only_outcome_fixture",
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
    }
    runtime_report_path = runtime_root / "codex_lane_outcome" / "latest.json"
    write_json(runtime_report_path, outcome)
    outcome["runtimeReportPath"] = str(runtime_report_path)
    return outcome


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export first Codex A2A2A implementation lane outcome")
    parser.add_argument("--assignment-path", default=str(DEFAULT_ASSIGNMENT_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--commit-evidence", default="")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    assignment = read_json(Path(os.path.expanduser(args.assignment_path)).resolve())
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    commit_evidence = args.commit_evidence.strip() or git_oneline(REPO_ROOT)
    fixture = build_outcome(assignment, runtime_root, commit_evidence)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {args.fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
