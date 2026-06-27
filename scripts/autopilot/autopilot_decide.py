#!/usr/bin/env python3
from __future__ import annotations

from _common import adapter_contract_status, audit, detect_hard_block, kill_switch_on, load_task, parser, print_json
from autopilot_classify import classify


def decide(task: dict) -> dict:
    goal = str(task.get("goal", ""))
    if "action_type" not in task:
        task = {**task, **classify(goal)}
    hard_blocks = detect_hard_block(goal)
    if kill_switch_on():
        return {**task, "policy_decision": "auto_block", "reason": "kill_switch_on", "hard_blocks": []}
    if hard_blocks:
        return {**task, "policy_decision": "auto_hard_block", "reason": "hard_safety_block", "hard_blocks": hard_blocks}

    contract_status, missing = adapter_contract_status(task)
    base = {**task, "contract_status": contract_status, "missing_requirements": missing, "hard_blocks": []}
    if contract_status in ("missing", "unknown_action_type"):
        return {**base, "policy_decision": "auto_quarantine", "reason": "adapter_contract_required"}
    if contract_status == "validated":
        return {**base, "policy_decision": "auto_allow_with_limits", "reason": "adapter_contract_validated"}
    return {**base, "policy_decision": "auto_allow_policy_controlled", "reason": "local_action_allowed"}


def main() -> int:
    args = parser("Decide an Autopilot task.").parse_args()
    result = decide(load_task(args))
    audit({"event": "autopilot.decided", "task": result})
    print_json(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
