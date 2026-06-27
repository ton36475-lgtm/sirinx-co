#!/usr/bin/env python3
"""Register a Manus artifact as a local A2A task for Codex review."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

from _common import ensure_runtime, now_iso, runtime_path, slugify, task_id, write_json


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create a local A2A task from a Manus artifact")
    parser.add_argument("--title", required=True)
    parser.add_argument("--kind", default="visual_spec")
    parser.add_argument("--summary", required=True)
    parser.add_argument("--next-action", required=True)
    parser.add_argument("--source-path", default="")
    parser.add_argument("--project", default="ghostclaw")
    parser.add_argument("--to-agent", default="codex-5-6")
    return parser


def source_metadata(source_path: str) -> dict[str, object]:
    if not source_path:
        return {
            "source_path": "",
            "source_exists": False,
            "source_size_bytes": 0,
            "source_sha256": "",
            "source_note": "No local exported file path was provided.",
        }
    path = Path(source_path).expanduser()
    if not path.exists() or not path.is_file():
        return {
            "source_path": str(path),
            "source_exists": False,
            "source_size_bytes": 0,
            "source_sha256": "",
            "source_note": "Provided source path does not exist or is not a file.",
        }
    return {
        "source_path": str(path.resolve()),
        "source_exists": True,
        "source_size_bytes": path.stat().st_size,
        "source_sha256": sha256_file(path),
        "source_note": "Metadata only; file contents were not embedded in the task manifest.",
    }


def main() -> int:
    args = build_parser().parse_args()
    ensure_runtime()
    tid = task_id()
    artifact_id = f"{tid}-{slugify(args.kind)}-{slugify(args.title)}"
    metadata = {
        "artifact_id": artifact_id,
        "created_at": now_iso(),
        "source_agent": "manus",
        "artifact_title": args.title,
        "artifact_kind": args.kind,
        "summary": args.summary,
        "recommended_next_action": args.next_action,
        **source_metadata(args.source_path),
        "policy": {
            "local_only": True,
            "metadata_only": True,
            "no_provider_call": True,
            "no_ui_automation": True,
            "no_deploy_push_publish": True,
            "codex_review_required_before_import": True,
        },
    }
    artifact_path = runtime_path("artifacts", f"{artifact_id}.json")
    write_json(artifact_path, metadata)

    task = {
        "a2a_version": "ghostclaw-a2async-v2",
        "task_id": tid,
        "project": args.project,
        "from_agent": "manus",
        "to_agent": args.to_agent,
        "task_type": "manus_artifact_review",
        "mode": "full_auto_local_review",
        "repo_path": str(Path(__file__).resolve().parents[2]),
        "goal": args.next_action,
        "model_route": {
            "artifact_producer": "manus",
            "planner": "kob-cli-opus",
            "fast_router": "kob-cli-fable",
            "executor": "codex-local",
            "reviewer": "ponytail",
        },
        "scope": {
            "allowed_paths": [
                "docs/a2async/",
                "agents/a2a/",
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
            "no_provider_call": True,
            "no_ui_automation": True,
            "artifact_metadata_only": True,
            "audit_required": True,
        },
        "messages": [
            {
                "role": "handoff",
                "from": "manus",
                "to": args.to_agent,
                "content": args.summary,
                "created_at": now_iso(),
            }
        ],
        "artifacts": [{"artifact_type": "manus_artifact_metadata", "path": str(artifact_path)}],
        "status": {"state": "queued", "reason": "manus_artifact_registered_for_codex_review"},
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    task_path = runtime_path("inbox", f"{artifact_id}-manus-artifact-review.json")
    write_json(task_path, task)
    print(f"wrote artifact {artifact_path}")
    print(f"created task {task_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
