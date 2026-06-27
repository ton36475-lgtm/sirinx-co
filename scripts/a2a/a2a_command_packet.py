#!/usr/bin/env python3
"""Create a command packet before any local executor command is run.

The packet is an audit and control artifact. It never executes the command.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
from pathlib import Path
from typing import Any

from _common import (
    ensure_runtime,
    mask_secret_text,
    now_iso,
    read_json,
    runtime_path,
    sha256_text,
    slugify,
    task_id,
    write_json,
    write_text,
)
from a2a_command_broker import decide, load_policy, normalize

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "codexCommandPacketStatus.json"

BLOCKING_PATTERNS = [
    (re.compile(r"\.env(?:\.|$|\s|/)"), "references_env_file"),
    (re.compile(r"\bid_rsa\b|\bprivate[_-]?key\b", re.I), "references_private_key"),
    (re.compile(r"\b(browser_profiles?|token_stores?|cookies?)\b", re.I), "references_browser_or_token_store"),
    (re.compile(r"\brm\s+-rf\b"), "destructive_recursive_delete"),
    (re.compile(r"\bgit\s+push\b"), "git_push"),
    (re.compile(r"\bwrangler\s+(?:pages\s+)?deploy\b"), "cloudflare_deploy"),
    (re.compile(r"\bdocker\s+(?:run|compose\s+up)\b"), "docker_start"),
    (re.compile(r"\b(?:npm|pnpm|yarn|pip)\s+install\b"), "dependency_install"),
    (re.compile(r"\b(?:supabase\s+db\s+push|prisma\s+migrate|psql)\b"), "database_migration_or_direct_db"),
    (re.compile(r"\b(?:drop\s+table|delete\s+from|truncate\s+table)\b", re.I), "destructive_sql"),
    (re.compile(r"\bcurl\b.+\|\s*(?:sh|bash)\b"), "curl_pipe_shell"),
    (re.compile(r"\bwget\b.+\|\s*(?:sh|bash)\b"), "wget_pipe_shell"),
    (re.compile(r"\bsudo\b"), "sudo_command"),
    (re.compile(r"\bchmod\s+777\b"), "world_writable_permissions"),
]


def load_lease(path_text: str) -> dict[str, Any]:
    if not path_text:
        return {}
    path = Path(path_text).expanduser()
    if not path.exists():
        return {"status": "missing", "path": str(path)}
    try:
        data = read_json(path)
    except (OSError, ValueError) as exc:
        return {"status": "invalid_json", "path": str(path), "error": str(exc)}
    data["path"] = str(path)
    return data if isinstance(data, dict) else {"status": "invalid_shape", "path": str(path)}


def lease_status(lease: dict[str, Any], lane: str) -> dict[str, Any]:
    if not lease:
        return {"valid": False, "reason": "missing_lease_file"}
    if lease.get("status") in {"missing", "invalid_json", "invalid_shape"}:
        return {"valid": False, "reason": str(lease.get("status"))}

    expected_lane = slugify(lane)
    actual_lane = str(lease.get("lane", ""))
    if expected_lane and actual_lane and actual_lane != expected_lane:
        return {"valid": False, "reason": "lease_lane_mismatch"}

    expires_at = str(lease.get("expires_at", ""))
    try:
        expires = dt.datetime.fromisoformat(expires_at)
    except ValueError:
        return {"valid": False, "reason": "lease_expiry_unparseable"}
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=dt.UTC)
    if expires <= dt.datetime.now(dt.UTC):
        return {"valid": False, "reason": "lease_expired"}

    return {
        "valid": True,
        "reason": "lease_valid",
        "allow_execution": bool(lease.get("allow_execution")),
        "lease_id": lease.get("lease_id", ""),
        "executor": lease.get("executor", ""),
    }


def command_risk_flags(command: str) -> list[dict[str, str]]:
    flags: list[dict[str, str]] = []
    for pattern, label in BLOCKING_PATTERNS:
        if pattern.search(command):
            flags.append({"level": "block", "label": label})
    return flags


def packet_decision(
    broker_decision: str,
    risk_flags: list[dict[str, str]],
    lease_check: dict[str, Any],
) -> tuple[str, str, bool]:
    if risk_flags:
        return "blocked_by_command_packet", "command_matches_blocking_pattern", False
    if broker_decision == "auto_allow_dry_run":
        return "ready_dry_run_packet", "broker_allows_local_non_mutating_command", True
    if broker_decision == "policy_controlled_registry_allow":
        return "preflight_required", "registry_preflight_required_before_execution", False
    if broker_decision == "requires_executor_lease":
        if not lease_check.get("valid"):
            return "blocked_missing_or_invalid_lease", str(lease_check.get("reason", "lease_required")), False
        if not lease_check.get("allow_execution"):
            return "ready_plan_only_lease", "lease_valid_but_execution_flag_false", False
        return "ready_with_executor_lease", "lease_valid_and_execution_allowed", True
    if broker_decision == "blocked_first_phase":
        return "blocked_first_phase", "live_or_production_action_not_enabled", False
    return "blocked_by_broker", "broker_decision_blocks_command", False


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create a local command packet for broker review")
    parser.add_argument("--tool", required=True)
    parser.add_argument("--action", required=True)
    parser.add_argument("--goal", required=True)
    parser.add_argument("--command", required=True)
    parser.add_argument("--target-repo", default="")
    parser.add_argument("--lane", default="")
    parser.add_argument("--task-id", default="")
    parser.add_argument("--lease-file", default="")
    return parser


def build_markdown(packet: dict[str, Any]) -> str:
    lines = [
        "# Codex Command Packet",
        "",
        f"- Created: `{packet['created_at']}`",
        f"- Tool: `{packet['tool']}`",
        f"- Action: `{packet['action']}`",
        f"- Packet decision: `{packet['packet_decision']}`",
        f"- Broker decision: `{packet['broker']['decision']}`",
        f"- Execution allowed by packet: `{packet['execution_allowed_by_packet']}`",
        f"- Command SHA-256: `{packet['command_sha256']}`",
        "",
        "## Command Preview",
        "",
        "```text",
        packet["command_preview"],
        "```",
        "",
        "## Risk Flags",
        "",
    ]
    if packet["risk_flags"]:
        lines.extend(f"- `{item['level']}` `{item['label']}`" for item in packet["risk_flags"])
    else:
        lines.append("- none")
    lines.extend(
        [
            "",
            "## Boundary",
            "",
            "- Packet generation does not execute commands.",
            "- Secrets and token-like strings are masked.",
            "- Push, deploy, provider calls, public endpoints, and policy bypass remain blocked.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    args = build_parser().parse_args()
    ensure_runtime()

    policy = load_policy()
    tool = normalize(args.tool)
    action = normalize(args.action)
    command_preview = mask_secret_text(args.command.strip())
    goal = mask_secret_text(args.goal.strip())
    broker = decide(policy, tool, action, args.target_repo.strip())
    risk_flags = command_risk_flags(command_preview)
    lease = load_lease(args.lease_file)
    lease_check = lease_status(lease, args.lane)
    decision, reason, execution_allowed = packet_decision(broker["decision"], risk_flags, lease_check)

    packet = {
        "created_at": now_iso(),
        "mode": "local_command_packet_no_execution",
        "generated_by": "scripts/a2a/a2a_command_packet.py",
        "task_id": args.task_id,
        "tool": tool,
        "action": action,
        "target_repo": args.target_repo.strip(),
        "lane": slugify(args.lane) if args.lane else "",
        "goal": goal,
        "goal_hash": sha256_text(goal),
        "command_preview": command_preview,
        "command_sha256": sha256_text(command_preview),
        "broker": {
            "decision": broker["decision"],
            "reason": broker["reason"],
            "required_gate": broker["required_gate"],
        },
        "risk_flags": risk_flags,
        "lease": {
            "path": lease.get("path", ""),
            "lease_id": lease.get("lease_id", ""),
            "executor": lease.get("executor", ""),
            "valid": lease_check.get("valid", False),
            "reason": lease_check.get("reason", ""),
            "allow_execution": lease_check.get("allow_execution", False),
        },
        "packet_decision": decision,
        "packet_reason": reason,
        "execution_allowed_by_packet": execution_allowed,
        "policy_boundary": [
            "no_secret_printing",
            "no_jailbreak_or_policy_bypass",
            "no_push",
            "no_deploy",
            "no_provider_call",
            "no_public_endpoint",
            "no_command_execution_from_packet_generator",
        ],
    }

    packet_path = runtime_path("artifacts", f"{task_id('CMDPKT')}-{slugify(tool)}-{slugify(action)}.json")
    markdown_path = runtime_path("logs", "codex_command_packet.md")
    latest_path = runtime_path("logs", "codex_command_packet.json")
    write_json(packet_path, packet)
    write_json(latest_path, packet)
    write_text(markdown_path, build_markdown(packet))
    write_json(FIXTURE_PATH, packet)

    print(
        json.dumps(
            {
                "packet": str(packet_path),
                "fixture": str(FIXTURE_PATH),
                "packet_decision": decision,
                "execution_allowed_by_packet": execution_allowed,
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0 if decision in {"ready_dry_run_packet", "ready_plan_only_lease", "ready_with_executor_lease"} else 2


if __name__ == "__main__":
    raise SystemExit(main())
