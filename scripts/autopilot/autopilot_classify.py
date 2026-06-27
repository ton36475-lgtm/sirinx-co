#!/usr/bin/env python3
from __future__ import annotations

from _common import audit, detect_hard_block, load_task, parser, print_json


def classify(goal: str) -> dict[str, str | list[str]]:
    text = goal.lower()
    if hard := detect_hard_block(goal):
        return {"risk_tier": "HARD_BLOCKED", "action_type": "blocked", "hard_blocks": hard}
    if "docker" in text or "start service" in text or "localhost service" in text or "up -d" in text:
        return {"risk_tier": "A3", "action_type": "docker_localhost_start", "hard_blocks": []}
    if "clone" in text or "external repo" in text:
        return {"risk_tier": "A3", "action_type": "external_repo_clone", "hard_blocks": []}
    if any(word in text for word in ("provider", "api", "glm", "zai", "openai", "openrouter")):
        return {"risk_tier": "A3", "action_type": "provider_api_smoke", "hard_blocks": []}
    if "mcp" in text or "connector activation" in text:
        return {"risk_tier": "A3", "action_type": "mcp_connector_activation", "hard_blocks": []}
    if "n8n" in text or "workflow activation" in text:
        return {"risk_tier": "A3", "action_type": "n8n_workflow_activation", "hard_blocks": []}
    if "publish" in text or "social" in text or "post " in text:
        return {"risk_tier": "A4", "action_type": "social_publish", "hard_blocks": []}
    if "send" in text or "email" in text or "line" in text or "telegram" in text:
        return {"risk_tier": "A4", "action_type": "email_or_line_send", "hard_blocks": []}
    if "deploy" in text or "cloudflare" in text or "wrangler" in text:
        return {"risk_tier": "A5", "action_type": "deploy", "hard_blocks": []}
    if "push" in text or "merge" in text or "rebase" in text:
        return {"risk_tier": "A5", "action_type": "git_remote_mutation", "hard_blocks": []}
    if any(word in text for word in ("create", "generate", "write")):
        return {"risk_tier": "A1", "action_type": "local_artifact", "hard_blocks": []}
    if any(word in text for word in ("edit", "update")):
        return {"risk_tier": "A2", "action_type": "local_modify", "hard_blocks": []}
    return {"risk_tier": "A0", "action_type": "inspect", "hard_blocks": []}


def main() -> int:
    args = parser("Classify an Autopilot task.").parse_args()
    task = load_task(args)
    result = {**task, **classify(str(task.get("goal", "")))}
    audit({"event": "autopilot.classified", "task": result})
    print_json(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
