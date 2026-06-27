#!/usr/bin/env python3
"""Generate a local-only automated code review workflow manifest."""

from __future__ import annotations

import argparse
import json
import subprocess
from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, mask_secret_text, now_iso, runtime_path, sha256_text, write_json, write_text
from a2a_command_broker import decide, load_policy, normalize

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE_DOC = Path("/Users/sirinx/Downloads/🤖 AUTOMATED CODE REVIEW WORKFLOW.md")
FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "automatedCodeReviewStatus.json"

REVIEW_STAGES = [
    {
        "id": "static_analysis",
        "label": "Static analysis",
        "mode": "plan_only",
        "checks": ["lint", "format", "typecheck", "code smell review"],
    },
    {
        "id": "test_coverage",
        "label": "Test coverage",
        "mode": "plan_only",
        "checks": ["unit tests", "integration tests", "critical path tests"],
    },
    {
        "id": "security_review",
        "label": "Security review",
        "mode": "plan_only",
        "checks": ["dependency audit plan", "secret pattern review", "permission review", "prompt injection surface review"],
    },
    {
        "id": "performance_review",
        "label": "Performance review",
        "mode": "plan_only",
        "checks": ["bundle size plan", "query pattern review", "runtime regression notes"],
    },
    {
        "id": "documentation_review",
        "label": "Documentation review",
        "mode": "plan_only",
        "checks": ["README delta", "API change notes", "operator checklist"],
    },
    {
        "id": "best_practices_review",
        "label": "Best practices review",
        "mode": "plan_only",
        "checks": ["architecture fit", "error handling", "accessibility", "minimalism review"],
    },
]

BROKER_ACTIONS = [
    "read_repository_files",
    "diff_review",
    "code_review_dry_run",
    "code_review_report",
    "security_review_plan",
    "run_lint",
    "run_unit_tests",
    "create_non_destructive_patches",
    "production_deploy",
    "external_api_write_actions",
]

BLOCKED_WORKFLOW_ACTIONS = [
    "git_add_dot",
    "git_commit_without_scope_review",
    "git_push",
    "deploy",
    "modify_files_from_browser",
    "apply_patch_without_executor_lease",
    "secret_export",
    "provider_call",
    "connector_write",
]


def run_git_status() -> list[dict[str, str]]:
    proc = subprocess.run(
        ["git", "status", "--porcelain=v1"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        return []

    rows: list[dict[str, str]] = []
    for line in proc.stdout.splitlines():
        if not line:
            continue
        rows.append({"status": line[:2].strip() or "M", "path": line[3:]})
    return rows


def source_snapshot(source_doc: Path) -> dict[str, Any]:
    if not source_doc.exists():
        return {
            "path": str(source_doc),
            "exists": False,
            "bytes": 0,
            "lines": 0,
            "sha256": "",
            "title": "",
        }
    text = mask_secret_text(source_doc.read_text(encoding="utf-8", errors="replace"))
    title = next((line.strip("# ").strip() for line in text.splitlines() if line.strip().startswith("#")), "")
    return {
        "path": str(source_doc),
        "exists": True,
        "bytes": source_doc.stat().st_size,
        "lines": len(text.splitlines()),
        "sha256": sha256_text(text),
        "title": title[:120],
    }


def classify_broker_actions(tool: str) -> tuple[list[dict[str, str]], Counter[str]]:
    policy = load_policy()
    rows: list[dict[str, str]] = []
    counts: Counter[str] = Counter()
    for action in BROKER_ACTIONS:
        result = decide(policy, tool, action, "")
        row = {
            "tool": tool,
            "action": action,
            "decision": result["decision"],
            "reason": result["reason"],
            "requiredGate": result["required_gate"],
        }
        rows.append(row)
        counts[row["decision"]] += 1
    return rows, counts


def build_report(source_doc: Path, tool: str) -> dict[str, Any]:
    ensure_runtime()
    changed_files = run_git_status()
    decisions, counts = classify_broker_actions(tool)
    return {
        "updatedAt": now_iso(),
        "mode": "local_review_plan_only",
        "generatedBy": "scripts/a2a/a2a_code_review_workflow.py",
        "sourceDocument": source_snapshot(source_doc),
        "summary": {
            "plannedStages": len(REVIEW_STAGES),
            "changedFilesVisible": len(changed_files),
            "autoAllowDryRun": counts.get("auto_allow_dry_run", 0),
            "requiresExecutorLease": counts.get("requires_executor_lease", 0),
            "blockedFirstPhase": counts.get("blocked_first_phase", 0),
            "blocked": counts.get("blocked", 0),
            "status": "ready_for_local_review_only",
        },
        "stages": REVIEW_STAGES,
        "brokerDecisions": decisions,
        "changedFileSamples": changed_files[:20],
        "blockedWorkflowActions": BLOCKED_WORKFLOW_ACTIONS,
        "policyBoundary": [
            "report_only_no_code_mutation",
            "no_git_add_dot",
            "no_commit_push_or_deploy",
            "no_secret_read_or_export",
            "no_provider_or_connector_write",
            "patch_suggestions_require_executor_lease",
            "browser_ui_reads_fixture_only",
        ],
    }


def build_markdown(report: dict[str, Any]) -> str:
    summary = report["summary"]
    source = report["sourceDocument"]
    lines = [
        "# Automated Code Review Workflow Integration",
        "",
        f"- Created: `{report['updatedAt']}`",
        f"- Mode: `{report['mode']}`",
        f"- Status: `{summary['status']}`",
        f"- Source: `{source['path']}`",
        f"- Source exists: `{str(source['exists']).lower()}`",
        f"- Source SHA-256: `{source['sha256'] or 'missing'}`",
        f"- Changed files visible: `{summary['changedFilesVisible']}`",
        "",
        "## Planned Review Stages",
        "",
    ]
    for stage in report["stages"]:
        checks = ", ".join(stage["checks"])
        lines.append(f"- `{stage['mode']}` **{stage['label']}** - {checks}")
    lines.extend(["", "## Broker Decisions", ""])
    for decision in report["brokerDecisions"]:
        lines.append(
            f"- `{decision['decision']}` `{decision['tool']}/{decision['action']}` - {decision['reason']} / gate: `{decision['requiredGate']}`"
        )
    lines.extend(["", "## Blocked Workflow Actions", ""])
    lines.extend(f"- `{item}`" for item in report["blockedWorkflowActions"])
    lines.extend(["", "## Boundary", ""])
    lines.extend(f"- `{item}`" for item in report["policyBoundary"])
    lines.append("")
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build local-only automated code review workflow status")
    parser.add_argument("--source-doc", default=str(DEFAULT_SOURCE_DOC), help="Exported workflow markdown to hash and register")
    parser.add_argument("--tool", default="codex-local", help="Broker tool route for review decisions")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    report = build_report(Path(args.source_doc).expanduser(), normalize(args.tool))
    json_path = runtime_path("logs", "automated_code_review_workflow.json")
    markdown_path = runtime_path("logs", "automated_code_review_workflow.md")
    write_json(json_path, report)
    write_text(markdown_path, build_markdown(report))
    write_json(FIXTURE_PATH, report)
    print(
        json.dumps(
            {
                "fixture": str(FIXTURE_PATH),
                "json_report": str(json_path),
                "markdown_report": str(markdown_path),
                "status": report["summary"]["status"],
                "planned_stages": report["summary"]["plannedStages"],
                "changed_files_visible": report["summary"]["changedFilesVisible"],
                "blocked": report["summary"]["blocked"],
                "lease_required": report["summary"]["requiresExecutorLease"],
                "dry_run_allowed": report["summary"]["autoAllowDryRun"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
