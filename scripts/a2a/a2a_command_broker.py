#!/usr/bin/env python3
"""Classify Codex sidebar tool/repo requests before any executor runs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from _common import (
    ensure_runtime,
    kill_switch_active,
    mask_secret_text,
    now_iso,
    parse_registry_entries,
    runtime_path,
    sha256_text,
    slugify,
    task_id,
    write_json,
)

POLICY_PATH = Path(__file__).resolve().parents[2] / "policies" / "codex_command_broker.json"


def load_policy() -> dict[str, Any]:
    return json.loads(POLICY_PATH.read_text(encoding="utf-8"))


def normalize(value: str) -> str:
    return value.strip().lower()


def registry_match(target: str) -> dict[str, str] | None:
    if not target:
        return None
    wanted = normalize(target)
    for entry in parse_registry_entries():
        if normalize(entry.get("repo", "")) == wanted or normalize(entry.get("name", "")) == wanted:
            return entry
    return None


def action_bucket(policy: dict[str, Any], action: str) -> str:
    for bucket, actions in policy.get("action_classes", {}).items():
        if action in actions:
            return bucket
    return "unknown"


def decide(policy: dict[str, Any], tool: str, action: str, target_repo: str) -> dict[str, Any]:
    tool_routes = policy.get("tool_routes", {})
    tool_policy = tool_routes.get(tool)
    repo_entry = registry_match(target_repo)
    bucket = action_bucket(policy, action)

    decision = {
        "decision": "blocked",
        "reason": "unclassified",
        "required_gate": "none",
        "repo_entry": repo_entry or {},
    }

    if kill_switch_active():
        decision.update(
            {
                "decision": "blocked",
                "reason": "kill_switch_active",
                "required_gate": "operator_clears_runtime_kill_switch",
            }
        )
        return decision

    if action in set(policy.get("hard_blocked_actions", [])):
        decision.update(
            {
                "decision": "blocked",
                "reason": "hard_blocked_action",
                "required_gate": "policy_change_required",
            }
        )
        return decision

    if not tool_policy:
        decision.update(
            {
                "decision": "blocked",
                "reason": "unknown_tool",
                "required_gate": "add_tool_route_to_policy",
            }
        )
        return decision

    if action in set(tool_policy.get("blocked_actions", [])):
        decision.update(
            {
                "decision": "blocked",
                "reason": "tool_policy_block",
                "required_gate": "route_to_different_tool_or_policy_review",
            }
        )
        return decision

    allowed_actions = set(tool_policy.get("allowed_actions", []))
    if action not in allowed_actions and bucket not in {"policy_controlled_registry_allow", "blocked_first_phase"}:
        decision.update(
            {
                "decision": "blocked",
                "reason": "action_not_allowed_for_tool",
                "required_gate": "add_action_to_tool_policy_or_route_elsewhere",
            }
        )
        return decision

    if target_repo and not repo_entry:
        decision.update(
            {
                "decision": "blocked",
                "reason": "target_repo_not_in_registry",
                "required_gate": "register_repo_before_action",
            }
        )
        return decision

    if bucket == "auto_allow_dry_run":
        decision.update(
            {
                "decision": "auto_allow_dry_run",
                "reason": "local_non_mutating_action",
                "required_gate": "none",
            }
        )
        return decision

    if bucket == "requires_executor_lease":
        decision.update(
            {
                "decision": "requires_executor_lease",
                "reason": "repo_affecting_executor_action",
                "required_gate": "executor_lease_and_lane_lock",
            }
        )
        return decision

    if bucket == "policy_controlled_registry_allow":
        clone_policy = (repo_entry or {}).get("clone_policy", "")
        if clone_policy != "allow":
            decision.update(
                {
                    "decision": "blocked",
                    "reason": "repo_clone_policy_not_allow",
                    "required_gate": "repo_policy_review",
                }
            )
            return decision
        decision.update(
            {
                "decision": "policy_controlled_registry_allow",
                "reason": "repo_registry_match_clone_policy_allow",
                "required_gate": "external_repo_clone_adapter_preflight",
            }
        )
        return decision

    if bucket == "blocked_first_phase":
        decision.update(
            {
                "decision": "blocked_first_phase",
                "reason": "live_external_or_production_action_not_enabled",
                "required_gate": "dedicated_adapter_contract_and_runtime_preflight",
            }
        )
        return decision

    decision.update(
        {
            "decision": "blocked",
            "reason": "unknown_action_class",
            "required_gate": "policy_review",
        }
    )
    return decision


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create a Codex command broker decision artifact")
    parser.add_argument("--tool", required=True)
    parser.add_argument("--action", required=True)
    parser.add_argument("--goal", required=True)
    parser.add_argument("--target-repo", default="")
    parser.add_argument("--task-id", default="")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    ensure_runtime()
    policy = load_policy()
    tool = normalize(args.tool)
    action = normalize(args.action)
    target_repo = args.target_repo.strip()
    safe_goal = mask_secret_text(args.goal)
    result = decide(policy, tool, action, target_repo)

    artifact = {
        "created_at": now_iso(),
        "broker": "codex-command-broker",
        "policy_version": policy.get("version", ""),
        "task_id": args.task_id,
        "tool": tool,
        "action": action,
        "target_repo": target_repo,
        "goal": safe_goal,
        "goal_hash": sha256_text(safe_goal),
        "decision": result["decision"],
        "reason": result["reason"],
        "required_gate": result["required_gate"],
        "repo_entry": result.get("repo_entry", {}),
        "blocked_actions_reference": policy.get("hard_blocked_actions", []),
        "next_step": {
            "auto_allow_dry_run": "create_or_review_local_runtime_artifact_only",
            "requires_executor_lease": "create_executor_lease_then_lane_lock_before_adapter_plan",
            "policy_controlled_registry_allow": "run_registry_adapter_preflight_before_real_clone",
            "blocked_first_phase": "do_not_execute_until_adapter_contract_is_opened",
            "blocked": "do_not_execute",
        }.get(result["decision"], "do_not_execute"),
    }

    out = runtime_path(
        "artifacts",
        f"{task_id(policy.get('runtime', {}).get('decision_prefix', 'BROKER'))}-{slugify(tool)}-{slugify(action)}.json",
    )
    write_json(out, artifact)
    print(json.dumps({"artifact": str(out), "decision": artifact["decision"], "reason": artifact["reason"]}, indent=2))
    return 0 if artifact["decision"] in {"auto_allow_dry_run", "requires_executor_lease", "policy_controlled_registry_allow"} else 2


if __name__ == "__main__":
    raise SystemExit(main())
