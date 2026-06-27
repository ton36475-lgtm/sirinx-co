#!/usr/bin/env python3
"""Create a local A2A task manifest."""

from __future__ import annotations

import argparse

from _common import REPO_ROOT, ensure_runtime, now_iso, runtime_path, slugify, task_id, write_json


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create an A2A local task manifest")
    parser.add_argument("--from-agent", required=True)
    parser.add_argument("--to-agent", required=True)
    parser.add_argument("--project", required=True)
    parser.add_argument("--type", dest="task_type", required=True)
    parser.add_argument("--goal", required=True)
    parser.add_argument("--mode", default="full_auto")
    parser.add_argument("--repo-path", default=str(REPO_ROOT))
    return parser


def main() -> int:
    args = build_parser().parse_args()
    ensure_runtime()
    tid = task_id()
    manifest = {
        "a2a_version": "ghostclaw-a2async-v2",
        "task_id": tid,
        "project": args.project,
        "from_agent": args.from_agent,
        "to_agent": args.to_agent,
        "task_type": args.task_type,
        "mode": args.mode,
        "repo_path": args.repo_path,
        "goal": args.goal,
        "model_route": {
            "planner": "kob-cli-opus",
            "fast_router": "kob-cli-fable",
            "executor": "codex-5-6",
            "reviewer": "ponytail",
            "long_context_fallback": "glm-5.2",
        },
        "scope": {
            "allowed_paths": [
                "docs/a2async/",
                "agents/a2a/",
                "registry/",
                "policies/",
                "scripts/a2a/",
                "PROJECT_STATE.md",
                "NEXT_ACTIONS.md",
                "AGENTS.md",
            ],
            "blocked_paths": [".env", ".env.*", "id_rsa", "credentials", "secrets", "private_keys"],
        },
        "policy": {
            "human_approval_required": False,
            "use_autopilot_policy": True,
            "no_secret_printing": True,
            "no_force_push": True,
            "no_public_ports": True,
            "external_repo_clone_allowed_if_whitelisted": True,
            "audit_required": True,
        },
        "messages": [],
        "artifacts": [],
        "status": {"state": "queued", "reason": ""},
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    out = runtime_path("inbox", f"{tid}-{slugify(args.task_type)}.json")
    write_json(out, manifest)
    print(f"created {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
