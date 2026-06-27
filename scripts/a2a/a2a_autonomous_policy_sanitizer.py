#!/usr/bin/env python3
"""Sanitize requested autonomous execution actions through the Codex broker."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, mask_secret_text, now_iso, runtime_path, sha256_text, write_json, write_text
from a2a_command_broker import decide, load_policy, normalize

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "autonomousExecutionPolicyStatus.json"

DEFAULT_REQUESTED_ACTIONS = [
    "read_repository_files",
    "inspect_architecture",
    "run_lint",
    "run_unit_tests",
    "generate_docs",
    "code_review_dry_run",
    "code_review_report",
    "diff_review",
    "security_review_plan",
    "create_non_destructive_patches",
    "propose_refactors",
    "update_markdown",
    "create_test_files",
    "simulate_deploy_plan",
    "access_secrets",
    "read_or_export_user_data",
    "modify_authentication",
    "modify_authorization",
    "change_payment_logic",
    "change_security_policy",
    "install_new_dependencies",
    "run_unknown_scripts",
    "database_migration",
    "delete_or_overwrite_files",
    "production_deploy",
    "external_api_write_actions",
    "disable_logging",
    "disable_monitoring",
    "bypass_access_control",
    "bypass_rate_limits",
    "exfiltrate_credentials",
    "approve_all_actions",
    "modify_audit_trail",
    "hide_execution_history",
]


def action_slug(value: str) -> str:
    value = normalize(value)
    value = value.replace("-", "_").replace(" ", "_")
    value = re.sub(r"[^a-z0-9_]+", "", value)
    return re.sub(r"_+", "_", value).strip("_")


def extract_actions_from_text(text: str) -> list[str]:
    actions: list[str] = []
    for raw in mask_secret_text(text).splitlines():
        line = raw.strip()
        if not line.startswith("- "):
            continue
        candidate = action_slug(line[2:].split("#", 1)[0])
        if candidate and candidate not in actions:
            actions.append(candidate)
    return actions


def load_requested_actions(args: argparse.Namespace) -> list[str]:
    actions: list[str] = []
    for item in args.action or []:
        candidate = action_slug(item)
        if candidate and candidate not in actions:
            actions.append(candidate)

    if args.input:
        path = Path(args.input).expanduser()
        text = path.read_text(encoding="utf-8", errors="replace")
        for candidate in extract_actions_from_text(text):
            if candidate not in actions:
                actions.append(candidate)

    if args.stdin:
        text = sys.stdin.read()
        for candidate in extract_actions_from_text(text):
            if candidate not in actions:
                actions.append(candidate)

    if not actions and args.use_default_sample:
        actions = list(DEFAULT_REQUESTED_ACTIONS)

    return actions


def classify_actions(actions: list[str], tool: str) -> tuple[list[dict[str, Any]], Counter[str]]:
    policy = load_policy()
    rows: list[dict[str, Any]] = []
    counts: Counter[str] = Counter()
    for action in actions:
        result = decide(policy, tool, action, "")
        row = {
            "action": action,
            "tool": tool,
            "decision": result["decision"],
            "reason": result["reason"],
            "requiredGate": result["required_gate"],
            "nextStep": {
                "auto_allow_dry_run": "local_dry_run_only",
                "requires_executor_lease": "executor_lease_and_lane_lock_required",
                "policy_controlled_registry_allow": "registry_preflight_required",
                "blocked_first_phase": "dedicated_adapter_contract_required",
                "blocked": "do_not_execute",
            }.get(result["decision"], "do_not_execute"),
        }
        rows.append(row)
        counts[row["decision"]] += 1
    return rows, counts


def derive_status(counts: Counter[str]) -> str:
    if counts.get("blocked", 0):
        return "sanitized_with_hard_blocks"
    if counts.get("blocked_first_phase", 0):
        return "sanitized_with_first_phase_blocks"
    if counts.get("requires_executor_lease", 0):
        return "sanitized_with_lease_required"
    return "sanitized_local_dry_run_only"


def build_report(actions: list[str], tool: str) -> dict[str, Any]:
    rows, counts = classify_actions(actions, tool)
    return {
        "updatedAt": now_iso(),
        "mode": "local_policy_sanitizer_only",
        "generatedBy": "scripts/a2a/a2a_autonomous_policy_sanitizer.py",
        "inputHash": sha256_text("\n".join(actions)),
        "tool": tool,
        "summary": {
            "requestedActions": len(actions),
            "autoAllowDryRun": counts.get("auto_allow_dry_run", 0),
            "requiresExecutorLease": counts.get("requires_executor_lease", 0),
            "policyControlledRegistryAllow": counts.get("policy_controlled_registry_allow", 0),
            "blockedFirstPhase": counts.get("blocked_first_phase", 0),
            "blocked": counts.get("blocked", 0),
            "status": derive_status(counts),
        },
        "actions": rows,
        "policyBoundary": [
            "no_security_controls_none",
            "no_approve_all",
            "no_secret_access",
            "no_user_data_export",
            "no_auth_payment_security_mutation",
            "no_unknown_scripts_or_migrations",
            "no_destructive_overwrite",
            "no_production_deploy",
            "no_external_api_write",
            "no_logging_monitoring_disable",
            "no_access_control_or_rate_limit_bypass",
            "no_credential_exfiltration",
            "no_audit_tamper_or_hidden_history",
        ],
    }


def build_markdown(report: dict[str, Any]) -> str:
    summary = report["summary"]
    lines = [
        "# Autonomous Execution Policy Sanitizer",
        "",
        f"- Created: `{report['updatedAt']}`",
        f"- Mode: `{report['mode']}`",
        f"- Status: `{summary['status']}`",
        f"- Requested actions: `{summary['requestedActions']}`",
        f"- Dry-run allowed: `{summary['autoAllowDryRun']}`",
        f"- Lease required: `{summary['requiresExecutorLease']}`",
        f"- First-phase blocked: `{summary['blockedFirstPhase']}`",
        f"- Hard blocked: `{summary['blocked']}`",
        "",
        "## Decisions",
        "",
    ]
    for item in report["actions"]:
        lines.append(
            f"- `{item['decision']}` `{item['action']}` - {item['reason']} / gate: `{item['requiredGate']}`"
        )
    lines.extend(["", "## Boundary", ""])
    lines.extend(f"- `{item}`" for item in report["policyBoundary"])
    lines.append("")
    return "\n".join(lines)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Sanitize autonomous execution action requests")
    parser.add_argument("--tool", default="codex-local")
    parser.add_argument("--action", action="append", help="Action name to classify; may be repeated")
    parser.add_argument("--input", help="Optional YAML-like text file containing list items")
    parser.add_argument("--stdin", action="store_true", help="Read YAML-like text from stdin")
    parser.add_argument(
        "--use-default-sample",
        action="store_true",
        help="Use the built-in approve-all request sample when no action/input is provided",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    ensure_runtime()
    actions = load_requested_actions(args)
    if not actions:
        raise SystemExit("blocked: no actions provided")

    report = build_report(actions, normalize(args.tool))
    json_path = runtime_path("logs", "autonomous_execution_policy_sanitizer.json")
    markdown_path = runtime_path("logs", "autonomous_execution_policy_sanitizer.md")
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
                "requested_actions": report["summary"]["requestedActions"],
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
