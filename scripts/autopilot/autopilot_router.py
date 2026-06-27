#!/usr/bin/env python3
from __future__ import annotations

from _common import AUTOPILOT_ROOT, audit, load_task, parser, print_json, stable_id, write_json
from autopilot_classify import classify
from autopilot_decide import decide
from autopilot_lease import lease


def main() -> int:
    args = parser("Route a goal through Autopilot classify/decide/lease.").parse_args()
    task = load_task(args)
    task = {**task, **classify(str(task.get("goal", "")))}
    decision = decide(task)
    lease_payload = lease(decision)
    manifest_id = stable_id("MANIFEST", str(task.get("goal", "")))
    manifest = {
        "manifest_id": manifest_id,
        "task": task,
        "decision": decision,
        "lease": lease_payload,
    }
    output = args.output or (AUTOPILOT_ROOT / "queue" / f"{manifest_id}.json")
    write_json(output, manifest)
    audit({"event": "autopilot.routed", "manifest_file": str(output), "manifest_id": manifest_id})
    print_json({"manifest_file": str(output), "policy_decision": decision.get("policy_decision"), "lease": lease_payload})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
