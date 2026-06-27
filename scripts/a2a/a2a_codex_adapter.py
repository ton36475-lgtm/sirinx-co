#!/usr/bin/env python3
"""Codex adapter that writes dry-run handoff plans."""

from __future__ import annotations

import argparse

from _common import ensure_runtime, now_iso, runtime_path, sha256_text, task_id, write_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Create a Codex dry-run handoff plan")
    parser.add_argument("--goal", required=True)
    parser.add_argument("--repo-path", default="~/SIRINXDev/sirinx-agent-native-os")
    parser.add_argument("--model", default="codex-local")
    args = parser.parse_args()
    ensure_runtime()
    plan = {
        "created_at": now_iso(),
        "adapter": "codex",
        "mode": "dry_run",
        "model_profile": args.model,
        "repo_path": args.repo_path,
        "goal": args.goal,
        "command_plan": [
            "inspect repo",
            "apply scoped patch",
            "run requested validation",
            "write diff summary",
        ],
        "command_hash": sha256_text(args.goal + args.repo_path + args.model),
    }
    out = runtime_path("artifacts", f"{task_id('CODEX')}.json")
    write_json(out, plan)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
