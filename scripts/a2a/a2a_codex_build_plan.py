#!/usr/bin/env python3
"""Create a scoped Codex build plan from the first ready A2A2A queue item."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_READINESS_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aDependencyReadiness.json"
)
DEFAULT_FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aCodexBuildPlan.json"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
SECRET_PATTERNS = [
    re.compile(r"(sk-[A-Za-z0-9_-]{12,})"),
    re.compile(r"(kob_[A-Za-z0-9_-]{8,})"),
    re.compile(r"([A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Za-z0-9_]*=)([^\s]+)", re.I),
    re.compile(r"(Bearer\s+)([A-Za-z0-9._-]+)", re.I),
]


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def mask_secret_text(value: str) -> str:
    masked = value
    for pattern in SECRET_PATTERNS:
        if pattern.groups >= 2:
            masked = pattern.sub(lambda match: f"{match.group(1)}<masked>", masked)
        else:
            masked = pattern.sub("<masked>", masked)
    return masked


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def plan_id_for(queue_id: str) -> str:
    return f"CODEX-PLAN-{sha256_text(queue_id)[:10]}"


def build_plan(readiness: dict[str, Any], runtime_root: Path) -> dict[str, Any]:
    queue = readiness.get("codexBuildQueue", [])
    if not isinstance(queue, list) or not queue:
        return {
            "updatedAt": now_iso(),
            "mode": "read_only_codex_plan_fixture",
            "generatedBy": "scripts/a2a/a2a_codex_build_plan.py",
            "runtimeRoot": str(runtime_root),
            "status": "blocked_no_codex_queue",
            "plan": None,
            "policyBoundary": ["no_queue_item_no_plan", "no_file_edits"],
            "nextSafeActions": ["Run a2a_dependency_readiness.py after an Opus handoff exists."],
        }

    item = queue[0]
    queue_id = str(item.get("queueId", "CODEX-BUILD-UNKNOWN"))
    plan_id = plan_id_for(queue_id)
    source_summary = mask_secret_text(str(item.get("summary", "")))
    plan = {
        "planId": plan_id,
        "lane": "LANE_A2A2A_CODEX_BUILD_PLAN",
        "sourceQueueId": queue_id,
        "sourceTaskId": str(item.get("taskId", "")),
        "sourceResultPath": str(item.get("sourceResultPath", "")),
        "status": "ready_for_codex_review",
        "objective": "Convert the Opus architecture handoff into a scoped Codex build lane.",
        "sourceSummary": source_summary,
        "scope": {
            "allowedPaths": [
                "scripts/a2a/",
                "ghostclaw_runner/",
                "tests/ghostclaw_runner/",
                "apps/mission-control/src/fixtures/",
                "apps/mission-control/src/App.tsx",
                "docs/a2async/",
            ],
            "blockedPaths": [
                ".env",
                ".env.*",
                "apps/web-sirinx/dist/",
                "packages/database/dist/",
                "supabase/.temp/",
                "production credentials",
            ],
        },
        "orderedSteps": [
            {
                "owner": "codex",
                "action": "inspect_queue_item",
                "detail": "Read the source Opus result and dependency fixture before editing files.",
            },
            {
                "owner": "codex",
                "action": "write_scoped_plan",
                "detail": "List exact files, tests, and runtime artifacts for the next implementation lane.",
            },
            {
                "owner": "glm52_or_deepseek",
                "action": "worker_report",
                "detail": "Only dispatch department workers for bounded review notes after the Codex plan exists.",
            },
            {
                "owner": "kob",
                "action": "validate_commands",
                "detail": "Validate proposed local commands through Command Broker policy before execution.",
            },
            {
                "owner": "codex",
                "action": "implement_scoped_lane",
                "detail": "Edit only planned files and preserve dirty lanes outside scope.",
            },
        ],
        "validationCommands": [
            "python3 -m unittest tests.ghostclaw_runner.test_agent_runner tests.ghostclaw_runner.test_runner_status_fixture",
            "pnpm --filter @sirinx/mission-control exec tsc --noEmit",
            "pnpm exec prettier --check apps/mission-control/src/App.tsx docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md",
            "/usr/bin/git diff --check -- <scoped paths>",
        ],
        "workerDispatchRecommendations": [
            {
                "role": "glm52",
                "goal": "Review the scoped Codex build plan for code structure and long-context consistency.",
                "when": "after Codex writes the scoped plan",
            },
            {
                "role": "deepseek",
                "goal": "Review command and data-flow risk for the scoped build plan.",
                "when": "after Codex writes the scoped plan",
            },
            {
                "role": "kob",
                "goal": "Validate local commands proposed by Codex against Command Broker policy.",
                "when": "after validation commands are finalized",
            },
        ],
        "executionAllowed": False,
    }
    plan_path = runtime_root / "codex_plans" / f"{plan_id}.json"
    write_json(plan_path, plan)
    return {
        "updatedAt": now_iso(),
        "mode": "read_only_codex_plan_fixture",
        "generatedBy": "scripts/a2a/a2a_codex_build_plan.py",
        "runtimeRoot": str(runtime_root),
        "status": "ready_for_codex_review",
        "planPath": str(plan_path),
        "plan": plan,
        "policyBoundary": [
            "plan_only_no_file_edits",
            "codex_owns_git_state",
            "workers_report_only",
            "kob_validates_commands_before_execution",
            "no_provider_call_by_default",
            "no_push",
            "no_deploy",
            "no_connector_sync",
            "no_secret_read_or_print",
        ],
        "nextSafeActions": [
            "Codex reviews this plan and opens the next scoped implementation lane.",
            "Dispatch GLM-5.2 or DeepSeek worker reports only after Codex defines the lane.",
            "Dispatch KOB command validation only after Codex proposes validation commands.",
        ],
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a Codex build plan from A2A2A readiness")
    parser.add_argument("--readiness-path", default=str(DEFAULT_READINESS_PATH))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    readiness_path = Path(os.path.expanduser(args.readiness_path)).resolve()
    fixture_path = Path(os.path.expanduser(args.fixture_path)).resolve()
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    readiness = read_json(readiness_path)
    fixture = build_plan(readiness, runtime_root)
    write_json(fixture_path, fixture)
    print(f"wrote {fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
