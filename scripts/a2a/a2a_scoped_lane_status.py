#!/usr/bin/env python3
"""Create a read-only scoped lane status report before staging decisions."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, runtime_path, write_json, write_text

REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = REPO_ROOT / "policies" / "a2a_scoped_lanes.json"


def run_git(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


def load_policy(path: Path = POLICY_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_porcelain(output: str) -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    for raw in output.splitlines():
        if not raw:
            continue
        status = raw[:2]
        path = raw[3:]
        if " -> " in path:
            old, new = path.split(" -> ", 1)
            entries.append({"status": status, "path": new, "old_path": old})
        else:
            entries.append({"status": status, "path": path})
    return entries


def git_status_for(paths: list[str]) -> list[dict[str, str]]:
    if not paths:
        return []
    proc = run_git(["status", "--porcelain=v1", "--", *paths])
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "git status failed")
    return parse_porcelain(proc.stdout)


def all_dirty_paths() -> list[dict[str, str]]:
    proc = run_git(["status", "--porcelain=v1"])
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "git status failed")
    return parse_porcelain(proc.stdout)


def build_markdown(report: dict[str, Any]) -> str:
    changed = report["changed_files"]
    other_count = report["other_dirty_count"]
    lines = [
        f"# Scoped Lane Status: {report['lane']}",
        "",
        f"- Created: `{report['created_at']}`",
        f"- Label: {report['label']}",
        f"- Ready for scoped stage: `{str(report['ready_for_scoped_stage']).lower()}`",
        f"- Changed files in lane: `{len(changed)}`",
        f"- Other dirty files outside lane: `{other_count}`",
        "",
        "## Boundaries",
        "",
    ]
    lines.extend(f"- `{item}`" for item in report["required_boundaries"])
    lines.extend(["", "## Changed Files In Lane", ""])
    if changed:
        lines.extend(f"- `{item['status'].strip() or 'M'}` `{item['path']}`" for item in changed)
    else:
        lines.append("- none")
    lines.extend(["", "## Suggested Scoped Stage Command", ""])
    lines.append("Review this list first. Do not use `git add .`.")
    lines.append("")
    lines.append("```bash")
    lines.append("git add -- \\")
    for index, path in enumerate(report["allowed_files"]):
        suffix = " \\" if index < len(report["allowed_files"]) - 1 else ""
        lines.append(f"  {path}{suffix}")
    lines.append("```")
    lines.extend(["", "## Validation Commands", ""])
    lines.extend(f"- `{cmd}`" for cmd in report["validation_commands"])
    lines.append("")
    return "\n".join(lines)


def create_report(lane: str, strict: bool) -> tuple[dict[str, Any], int]:
    policy = load_policy()
    lanes = policy.get("lanes", {})
    if lane not in lanes:
        raise KeyError(f"unknown lane: {lane}")

    lane_config = lanes[lane]
    allowed_files = list(lane_config.get("allowed_files", []))
    allowed_set = set(allowed_files)
    changed = git_status_for(allowed_files)
    dirty = all_dirty_paths()
    outside_lane = [entry for entry in dirty if entry["path"] not in allowed_set]
    unexpected_in_lane = [entry for entry in changed if entry["path"] not in allowed_set]

    errors: list[str] = []
    warnings: list[str] = []
    if unexpected_in_lane:
        errors.append("unexpected_changed_path_in_lane")
    if outside_lane:
        warnings.append("worktree_has_other_dirty_lanes")
    if not changed:
        warnings.append("lane_has_no_changed_files")

    ready = not errors
    report = {
        "created_at": now_iso(),
        "lane": lane,
        "label": lane_config.get("label", ""),
        "mode": lane_config.get("mode", "local_review_only"),
        "ready_for_scoped_stage": ready,
        "strict": strict,
        "allowed_files": allowed_files,
        "changed_files": changed,
        "unexpected_in_lane": unexpected_in_lane,
        "other_dirty_count": len(outside_lane),
        "other_dirty_sample": outside_lane[:40],
        "required_boundaries": lane_config.get("required_boundaries", []),
        "validation_commands": lane_config.get("validation_commands", []),
        "errors": errors,
        "warnings": warnings,
        "script_boundary": "read_only_no_stage_no_commit_no_push_no_deploy_no_provider_call",
    }
    return report, 1 if errors or (strict and not ready) else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Write read-only scoped lane status for staging review")
    parser.add_argument("--lane", default="codex-command-broker-mission-control")
    parser.add_argument("--strict", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    ensure_runtime()
    report, code = create_report(args.lane, args.strict)
    json_path = runtime_path("logs", f"scoped_lane_status_{args.lane}.json")
    markdown_path = runtime_path("logs", f"scoped_lane_status_{args.lane}.md")
    write_json(json_path, report)
    write_text(markdown_path, build_markdown(report))
    print(
        json.dumps(
            {
                "lane": report["lane"],
                "ready_for_scoped_stage": report["ready_for_scoped_stage"],
                "changed_files": len(report["changed_files"]),
                "other_dirty_count": report["other_dirty_count"],
                "errors": len(report["errors"]),
                "warnings": len(report["warnings"]),
                "json_report": str(json_path),
                "markdown_report": str(markdown_path),
            },
            indent=2,
            sort_keys=True,
        )
    )
    return code


if __name__ == "__main__":
    raise SystemExit(main())
