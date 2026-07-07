#!/usr/bin/env python3
"""Build a local A2A2A handoff queue from runner outbox results.

This is the mail-carrier layer between role reports and Codex work. It reads
completed local runner results, registers Codex handoffs as reviewable queue
artifacts, and reports role-to-role handoffs without executing them by default.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
DEFAULT_FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aHandoffRouter.json"
RUNNER_ROLES = {"hermes", "opus", "glm52", "deepseek", "agy", "kob"}
CODEX_QUEUE_ROLE_PRIORITY = {
    "opus": 0,
    "glm52": 1,
    "deepseek": 2,
    "agy": 3,
    "kob": 4,
    "hermes": 5,
}
CODEX_QUEUE_TASK_PRIORITY = {
    "HERMES-OPUS-NEXT-CODEX-LANE": 0,
    "CODEX-PLAN": 10,
    "PLAN-REVIEW": 20,
    "VALIDATE": 30,
    "SMOKE": 90,
}
SECRET_PATTERNS = [
    re.compile(r"(sk-[A-Za-z0-9_-]{12,})"),
    re.compile(r"(kob_[A-Za-z0-9_-]{8,})"),
    re.compile(r"([A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Za-z0-9_]*=)([^\s]+)", re.I),
    re.compile(r"(Bearer\s+)([A-Za-z0-9._-]+)", re.I),
]


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def mask_secret_text(value: str) -> str:
    masked = value
    for pattern in SECRET_PATTERNS:
        if pattern.groups >= 2:
            masked = pattern.sub(lambda match: f"{match.group(1)}<masked>", masked)
        else:
            masked = pattern.sub("<masked>", masked)
    return masked


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def safe_slug(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip("-") or "handoff"


def read_json(path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def append_jsonl(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(data, sort_keys=True, ensure_ascii=True) + "\n")


def outbox_results(runtime_root: Path) -> list[tuple[Path, dict[str, Any]]]:
    rows: list[tuple[Path, dict[str, Any]]] = []
    for path in sorted((runtime_root / "outbox").glob("*/*.result.json")):
        data = read_json(path)
        if data:
            rows.append((path, data))
    return rows


def result_summary(path: Path, data: dict[str, Any]) -> dict[str, Any]:
    task = data.get("task") if isinstance(data.get("task"), dict) else {}
    output = data.get("output") if isinstance(data.get("output"), dict) else {}
    handoff = output.get("handoff") if isinstance(output.get("handoff"), dict) else {}
    summary = mask_secret_text(str(output.get("summary", "")))[:280]
    task_id = str(task.get("task_id", path.stem.replace(".result", "")))
    source_role = str(data.get("role", path.parent.name))
    next_owner = str(handoff.get("next_owner", ""))
    return {
        "sourcePath": str(path),
        "sourceHash": sha256_text(str(path)),
        "createdAt": str(data.get("created_at", "")),
        "sourceRole": source_role,
        "taskId": task_id,
        "status": str(data.get("status", "unknown")),
        "providerCall": bool(data.get("provider_call", False)),
        "nextOwner": next_owner,
        "safeToDispatchLocally": bool(handoff.get("safe_to_dispatch_locally", False)),
        "requiresHumanReview": bool(handoff.get("requires_human_review", False)),
        "summary": summary,
        "goalPreview": mask_secret_text(str(task.get("goal_preview", task.get("goal", ""))))[:220],
        "contextRefs": [mask_secret_text(str(item)) for item in task.get("context_refs", [])[:6]]
        if isinstance(task.get("context_refs"), list)
        else [],
    }


def queue_id_for(row: dict[str, Any]) -> str:
    return f"HANDOFF-{safe_slug(row['sourceRole'])}-{safe_slug(row['taskId'])}-{row['sourceHash'][:8]}"


def build_codex_queue_item(runtime_root: Path, row: dict[str, Any]) -> dict[str, Any]:
    queue_id = queue_id_for(row)
    queue_path = runtime_root / "handoffs" / "codex_queue" / f"{queue_id}.json"
    queue_priority = CODEX_QUEUE_ROLE_PRIORITY.get(str(row["sourceRole"]), 99)
    task_priority = codex_task_priority(str(row["taskId"]))
    return {
        "queueId": queue_id,
        "createdAt": now_iso(),
        "targetOwner": "codex",
        "sourceRole": row["sourceRole"],
        "sourceTaskId": row["taskId"],
        "sourceResultPath": row["sourcePath"],
        "queuePath": str(queue_path),
        "queuePriority": queue_priority,
        "taskPriority": task_priority,
        "status": "ready_for_codex_review",
        "executionAllowed": False,
        "summary": row["summary"],
        "goalPreview": row["goalPreview"],
        "nextAction": "Codex reviews this handoff and opens a scoped implementation lane if it is still relevant.",
    }


def build_role_handoff(runtime_root: Path, row: dict[str, Any]) -> dict[str, Any]:
    queue_id = queue_id_for(row)
    inbox_path = runtime_root / "inbox" / row["nextOwner"] / f"{queue_id}.json"
    return {
        "queueId": queue_id,
        "targetOwner": row["nextOwner"],
        "sourceRole": row["sourceRole"],
        "sourceTaskId": row["taskId"],
        "sourceResultPath": row["sourcePath"],
        "inboxPath": str(inbox_path),
        "status": "route_ready_but_not_enqueued",
        "executionAllowed": False,
        "summary": row["summary"],
        "nextAction": "Use --route-role-inbox to enqueue this local handoff; runner processing remains separate.",
    }


def write_role_envelope(runtime_root: Path, handoff: dict[str, Any]) -> None:
    envelope = {
        "task_id": handoff["queueId"],
        "created_at": now_iso(),
        "from_agent": handoff["sourceRole"],
        "to_agent": handoff["targetOwner"],
        "priority": "normal",
        "goal": mask_secret_text(handoff.get("summary", "")),
        "context_refs": [mask_secret_text(handoff["sourceResultPath"])],
        "dispatch_mode": "dry_run",
        "runner_contract": {
            "provider_call_allowed": False,
            "git_mutation_allowed": False,
            "external_write_allowed": False,
            "secret_read_allowed": False,
        },
    }
    write_json(Path(handoff["inboxPath"]), envelope)


def codex_task_priority(task_id: str) -> int:
    normalized = task_id.upper()
    for marker, priority in CODEX_QUEUE_TASK_PRIORITY.items():
        if marker in normalized:
            return priority
    return 50


def build_fixture(runtime_root: Path, route_role_inbox: bool) -> dict[str, Any]:
    codex_queue: list[dict[str, Any]] = []
    role_handoffs: list[dict[str, Any]] = []
    blocked: list[dict[str, Any]] = []
    ignored = 0

    for path, data in outbox_results(runtime_root):
        row = result_summary(path, data)
        if row["providerCall"]:
            blocked.append({**row, "blockedReason": "provider_call_result_requires_review"})
            continue
        if not row["safeToDispatchLocally"]:
            blocked.append({**row, "blockedReason": "handoff_not_marked_safe_to_dispatch_locally"})
            continue
        if row["status"] != "dry_run_completed":
            blocked.append({**row, "blockedReason": "result_not_dry_run_completed"})
            continue
        if row["nextOwner"] == "codex":
            item = build_codex_queue_item(runtime_root, row)
            write_json(Path(item["queuePath"]), item)
            codex_queue.append(item)
        elif row["nextOwner"] in RUNNER_ROLES:
            handoff = build_role_handoff(runtime_root, row)
            if route_role_inbox:
                write_role_envelope(runtime_root, handoff)
                handoff["status"] = "enqueued_to_role_inbox"
            role_handoffs.append(handoff)
        else:
            ignored += 1

    codex_queue.sort(
        key=lambda item: (
            int(item["queuePriority"]),
            int(item["taskPriority"]),
            str(item["sourceTaskId"]),
            str(item["queueId"]),
        )
    )
    status = "ready_handoffs_registered"
    if blocked:
        status = "review_blocked_handoffs"
    if not codex_queue and not role_handoffs and not blocked:
        status = "missing_handoff_results"

    fixture = {
        "updatedAt": now_iso(),
        "mode": "read_only_handoff_router_fixture",
        "generatedBy": "scripts/a2a/a2a_handoff_router.py",
        "runtimeRoot": str(runtime_root),
        "runtimeReportPath": str(runtime_root / "handoffs" / "latest.json"),
        "summary": {
            "status": status,
            "codexQueueItems": len(codex_queue),
            "nextCodexQueueId": codex_queue[0]["queueId"] if codex_queue else "",
            "nextCodexSourceRole": codex_queue[0]["sourceRole"] if codex_queue else "",
            "nextCodexSourceTaskId": codex_queue[0]["sourceTaskId"] if codex_queue else "",
            "roleHandoffs": len(role_handoffs),
            "blockedHandoffs": len(blocked),
            "ignoredResults": ignored,
            "roleInboxWrites": sum(1 for item in role_handoffs if item["status"] == "enqueued_to_role_inbox"),
            "providerCalls": sum(1 for item in blocked if item.get("providerCall")),
            "executionAllowed": False,
        },
        "codexQueue": codex_queue,
        "roleHandoffs": role_handoffs,
        "blockedHandoffs": blocked[:12],
        "policyBoundary": [
            "local_artifact_router",
            "codex_queue_is_review_only",
            "role_inbox_routing_requires_explicit_flag",
            "no_provider_call",
            "no_command_execution",
            "no_git_mutation",
            "no_push",
            "no_deploy",
            "no_connector_sync",
            "no_secret_read_or_print",
        ],
        "nextSafeActions": [
            "Codex reviews the first Codex queue item and decides whether to open a new scoped lane.",
            "Regenerate dependency readiness after new runner results are produced.",
            "Keep role inbox routing separate from runner execution to avoid loops.",
        ],
    }
    return fixture


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export A2A2A handoff router fixture")
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument(
        "--route-role-inbox",
        action="store_true",
        help="Also write safe role-to-role handoffs into target role inboxes.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture_path = Path(os.path.expanduser(args.fixture_path)).resolve()
    fixture = build_fixture(runtime_root, route_role_inbox=bool(args.route_role_inbox))
    write_json(Path(fixture["runtimeReportPath"]), fixture)
    write_json(fixture_path, fixture)
    append_jsonl(
        runtime_root / "logs" / "handoff-router-events.jsonl",
        {
            "created_at": now_iso(),
            "event": "handoff_router_fixture_written",
            "fixture_path": str(fixture_path),
            "codex_queue_items": fixture["summary"]["codexQueueItems"],
            "role_handoffs": fixture["summary"]["roleHandoffs"],
            "blocked_handoffs": fixture["summary"]["blockedHandoffs"],
            "role_inbox_writes": fixture["summary"]["roleInboxWrites"],
        },
    )
    print(f"wrote {fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
