#!/usr/bin/env python3
"""Dispatch one A2A task through the local file-queue lifecycle."""

from __future__ import annotations

import argparse

from _common import (
    atomic_move,
    ensure_runtime,
    kill_switch_active,
    now_iso,
    read_json,
    runtime_path,
    sha256_text,
    write_json,
)


def next_task() -> object:
    tasks = sorted(runtime_path("inbox").glob("*.json"))
    return tasks[0] if tasks else None


def write_artifact(task: dict, mode: str) -> dict:
    artifact = {
        "created_at": now_iso(),
        "task_id": task.get("task_id"),
        "mode": mode,
        "type": "command_plan",
        "planner": task.get("from_agent"),
        "executor": task.get("to_agent"),
        "goal_hash": sha256_text(task.get("goal", "")),
        "actions": [
            "validate task scope",
            "resolve model route",
            "generate dry-run adapter commands",
            "collect artifacts",
            "write daily summary",
        ],
        "note": "No provider call, clone, deploy, push, Docker start, or public endpoint was executed.",
    }
    out = runtime_path("artifacts", f"{task.get('task_id')}-command-plan.json")
    write_json(out, artifact)
    return {"artifact_type": "command_plan", "path": str(out)}


def main() -> int:
    parser = argparse.ArgumentParser(description="Dispatch one local A2A task")
    parser.add_argument("--once", action="store_true")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--dry-run", action="store_true")
    group.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    ensure_runtime()

    if kill_switch_active():
        report = {"created_at": now_iso(), "status": "blocked", "reason": "kill_switch_active"}
        write_json(runtime_path("logs", "dispatch-blocked.json"), report)
        print("blocked: kill switch active")
        return 2

    task_path = next_task()
    if task_path is None:
        print("no queued tasks")
        return 0

    running_path = atomic_move(task_path, runtime_path("running"))
    task = read_json(running_path)
    task["status"] = {"state": "running", "reason": "dispatch_started"}
    task["updated_at"] = now_iso()
    write_json(running_path, task)

    mode = "execute" if args.execute else "dry_run"
    artifact_ref = write_artifact(task, mode)
    task.setdefault("artifacts", []).append(artifact_ref)
    task["status"] = {"state": "completed", "reason": f"{mode}_artifact_created"}
    task["updated_at"] = now_iso()
    write_json(running_path, task)
    completed = atomic_move(running_path, runtime_path("completed"))
    print(f"completed {completed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
