#!/usr/bin/env python3
"""Resolve A2A task classes to model profile aliases."""

from __future__ import annotations

import argparse
import json

from _common import ensure_runtime, now_iso, runtime_path, write_json

ROUTES = {
    "architecture": {"primary": "opus-5", "fallback": "anthropic/claude-opus-4.8"},
    "deep_planning": {"primary": "opus-5", "fallback": "anthropic/claude-opus-4.8"},
    "multi_repo_integration": {"primary": "opus-5", "fallback": "anthropic/claude-opus-4.8"},
    "fast_summary": {"primary": "fable-5", "fallback": "anthropic/claude-opus-4.8"},
    "route": {"primary": "fable-5", "fallback": "anthropic/claude-opus-4.8"},
    "repo_execution": {"primary": "codex-local", "fallback": "current_codex_session"},
    "code_edit": {"primary": "codex-local", "fallback": "current_codex_session"},
    "opencode_review": {"primary": "opencode", "fallback": "codex-local"},
    "opencode_execution": {"primary": "opencode", "fallback": "codex-local"},
    "agy_scaffold": {"primary": "agy-antigravity2", "fallback": "codex-local"},
    "agy_execution": {"primary": "agy-antigravity2", "fallback": "codex-local"},
    "manus_artifact_review": {"primary": "codex-local", "fallback": "current_codex_session"},
    "long_context": {"primary": "glm-5.2", "fallback": "local_chunking"},
}


def route_for(task_type: str) -> dict[str, str]:
    return ROUTES.get(task_type, {"primary": "fable-5", "fallback": "dry_run_summary"})


def main() -> int:
    parser = argparse.ArgumentParser(description="Resolve model route for an A2A task")
    parser.add_argument("task_type", nargs="?", default="multi_repo_integration")
    args = parser.parse_args()
    ensure_runtime()
    result = {"created_at": now_iso(), "task_type": args.task_type, "route": route_for(args.task_type)}
    out = runtime_path("model_routes", f"{args.task_type}.json")
    write_json(out, result)
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
