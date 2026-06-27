#!/usr/bin/env python3
"""Build a read-only A2A2A backlog priority board from NEXT_ACTIONS.md."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_NEXT_ACTIONS = REPO_ROOT / "NEXT_ACTIONS.md"
DEFAULT_FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aBacklogPriority.json"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
CHECKBOX_RE = re.compile(r"^- \[ \] (?P<text>.*)$")
SECRET_RE = re.compile(
    r"(?i)(api[_-]?key|secret|token|password|private[_-]?key|service[_-]?role|bearer)\s*[:=]\s*([^\s`]+)"
)


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def normalize_text(value: str) -> str:
    return " ".join(value.replace("\t", " ").split())


def mask_secret_like(value: str) -> str:
    return SECRET_RE.sub(lambda match: f"{match.group(1)}=<masked>", value)


def extract_pending_tasks(next_actions_path: Path) -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    section = "Uncategorized"
    subsection = ""
    current: dict[str, Any] | None = None

    for line_number, raw_line in enumerate(next_actions_path.read_text(encoding="utf-8").splitlines(), start=1):
        stripped = raw_line.strip()
        if raw_line.startswith("## "):
            section = normalize_text(raw_line[3:])
            subsection = ""
            current = None
            continue
        if raw_line.startswith("### "):
            subsection = normalize_text(raw_line[4:])
            current = None
            continue

        match = CHECKBOX_RE.match(raw_line)
        if match:
            text = mask_secret_like(normalize_text(match.group("text")))
            current = {
                "line": line_number,
                "section": section,
                "subsection": subsection,
                "text": text,
            }
            tasks.append(current)
            continue

        if current and raw_line.startswith("      ") and stripped:
            current["text"] = normalize_text(f"{current['text']} {mask_secret_like(stripped)}")
            continue

        if stripped and not raw_line.startswith(" "):
            current = None

    return tasks


def owner_for(task: dict[str, Any]) -> str:
    haystack = f"{task['section']} {task.get('subsection', '')} {task['text']}".lower()
    if "mission control" in haystack or "fixture" in haystack or "codex" in haystack:
        return "codex"
    if "command broker" in haystack or "kob" in haystack:
        return "kob"
    if "policy" in haystack or "autopilot" in haystack or "approval" in haystack:
        return "hermes"
    if "glm" in haystack or "qwythos" in haystack or "model" in haystack:
        return "glm52_deepseek"
    if "visual rag" in haystack or "research" in haystack or "dataset" in haystack:
        return "research_memory"
    if "ai money" in haystack or "facebook" in haystack or "content automation" in haystack or "ads" in haystack:
        return "marketing_revenue"
    if "igaming" in haystack or "ledger" in haystack:
        return "practice_lab"
    return "hermes"


def blocked_reason(task: dict[str, Any]) -> str:
    text = f"{task['section']} {task.get('subsection', '')} {task['text']}".lower()
    if any(marker in text for marker in ["explicit approval", "after approval", "approve_implementation"]):
        return "requires_separate_explicit_gate"
    if any(marker in text for marker in ["deploy", "push", "public tunnel", "production webhook"]):
        return "production_or_public_action_blocked"
    if any(marker in text for marker in ["provider call", "api key", "secret", "token", "customer data", "oauth login"]):
        return "secret_or_provider_boundary"
    if any(marker in text for marker in ["docker start", "clone", "install", "external repo"]):
        return "external_runtime_boundary"
    if any(marker in text for marker in ["facebook api", "live post", "telegram live send", "paid boost"]):
        return "external_message_or_publish_boundary"
    return ""


def priority_for(task: dict[str, Any], blocked: bool) -> int:
    text = f"{task['section']} {task.get('subsection', '')} {task['text']}".lower()
    if blocked:
        return 3
    if "a2a2a team coding sync" in text:
        return 0
    if "codex execution pack" in text or "connector sync" in text:
        return 1
    if "full auto autopilot" in text or "command broker" in text:
        return 1
    if "mission control" in text or "fixture" in text:
        return 1
    if "current recommended" in text:
        return 2
    if any(marker in text for marker in ["ai money", "content automation", "visual rag", "glm-5.2", "igaming"]):
        return 2
    return 2


def action_for(task: dict[str, Any], blocked: bool) -> str:
    if blocked:
        return "Keep blocked and record the missing gate before revisiting."
    owner = owner_for(task)
    if owner == "codex":
        return "Codex may inspect and prepare scoped local edits after validation."
    if owner == "kob":
        return "KOB remains validate-only until Command Broker issues a lease."
    if owner == "hermes":
        return "Hermes should classify the gate and update policy/state docs first."
    if owner == "glm52_deepseek":
        return "Keep model workers report-only until provider/runtime lane opens."
    if owner == "marketing_revenue":
        return "Prepare local draft artifacts only; no publish or external sends."
    return "Prepare local docs or manifests before any external action."


def classify_tasks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for index, task in enumerate(tasks, start=1):
        block = blocked_reason(task)
        blocked = bool(block)
        priority = priority_for(task, blocked)
        owner = owner_for(task)
        row = {
            "id": f"BACKLOG-{index:03d}",
            "priority": priority,
            "status": "blocked" if blocked else "ready_for_review",
            "owner": owner,
            "line": task["line"],
            "section": task["section"],
            "subsection": task.get("subsection", ""),
            "task": task["text"],
            "blockedReason": block,
            "nextAction": action_for(task, blocked),
        }
        rows.append(row)
    return sorted(rows, key=lambda row: (row["priority"], row["status"] == "blocked", row["line"]))


def build_board(next_actions_path: Path, runtime_root: Path) -> dict[str, Any]:
    items = classify_tasks(extract_pending_tasks(next_actions_path))
    blocked_items = [item for item in items if item["status"] == "blocked"]
    owner_counts: dict[str, int] = {}
    priority_counts: dict[str, int] = {"p0": 0, "p1": 0, "p2": 0, "p3": 0}
    for item in items:
        owner_counts[item["owner"]] = owner_counts.get(item["owner"], 0) + 1
        priority_counts[f"p{item['priority']}"] = priority_counts.get(f"p{item['priority']}", 0) + 1

    board = {
        "updatedAt": now_iso(),
        "mode": "read_only_next_actions_backlog_priority",
        "generatedBy": "scripts/a2a/a2a_backlog_priority.py",
        "sourcePath": str(next_actions_path),
        "runtimeRoot": str(runtime_root),
        "summary": {
            "totalPending": len(items),
            "readyForReview": len(items) - len(blocked_items),
            "blocked": len(blocked_items),
            "p0": priority_counts["p0"],
            "p1": priority_counts["p1"],
            "p2": priority_counts["p2"],
            "p3": priority_counts["p3"],
            "owners": len(owner_counts),
        },
        "ownerCounts": [{"owner": owner, "count": count} for owner, count in sorted(owner_counts.items())],
        "topItems": items[:12],
        "blockedGates": blocked_items[:12],
        "policyBoundary": [
            "read_only_next_actions_source",
            "no_provider_call",
            "no_connector_sync",
            "no_deploy",
            "no_push",
            "no_secret_read_or_print",
            "no_git_add_dot",
            "no_generated_web_sirinx_asset_mutation",
        ],
        "nextSafeActions": [
            "Review P0 A2A2A items first.",
            "Keep blocked gates as blocked until a separate lane opens.",
            "Codex stages only the scoped backlog-priority files after validation.",
        ],
    }
    runtime_report_path = runtime_root / "backlog_priority" / "latest.json"
    write_json(runtime_report_path, board)
    board["runtimeReportPath"] = str(runtime_report_path)
    return board


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export read-only A2A2A backlog priority fixture")
    parser.add_argument("--next-actions", default=str(DEFAULT_NEXT_ACTIONS))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    next_actions_path = Path(os.path.expanduser(args.next_actions)).resolve()
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture_path = Path(os.path.expanduser(args.fixture_path)).resolve()
    board = build_board(next_actions_path, runtime_root)
    write_json(fixture_path, board)
    print(f"wrote {fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
