#!/usr/bin/env python3
"""Export a read-only scoped path guard for the active A2A2A Codex lane."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_DIR = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures"
DEFAULT_PACKET_PATH = FIXTURE_DIR / "a2a2aImplementationLanePacket.json"
DEFAULT_LANE_PATH = FIXTURE_DIR / "a2a2aFirstCodexImplementationLane.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aScopedPathGuard.json"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def unique_strings(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result = []
    for value in values:
        normalized = normalize_path(value)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


def normalize_path(value: str) -> str:
    path = str(value).strip()
    if not path:
        return ""
    if path.startswith(str(REPO_ROOT)):
        path = os.path.relpath(path, REPO_ROOT)
    path = path.replace("\\", "/")
    while path.startswith("./"):
        path = path[2:]
    return path


def prefix_match(path: str, pattern: str) -> bool:
    path = normalize_path(path)
    pattern = normalize_path(pattern)
    if not path or not pattern:
        return False
    if pattern.endswith("/"):
        return path.startswith(pattern)
    return path == pattern


def blocked_by(path: str, blocked_paths: list[str]) -> str:
    for pattern in blocked_paths:
        normalized = normalize_path(pattern)
        if "/" not in normalized and "." not in normalized:
            continue
        if prefix_match(path, normalized):
            return normalized
    return ""


def allowed_by(path: str, allowed_paths: list[str]) -> str:
    for pattern in allowed_paths:
        if prefix_match(path, pattern):
            return normalize_path(pattern)
    return ""


def parse_stage_files(command: list[str]) -> list[str]:
    if not command:
        return []
    return [normalize_path(part) for part in command[2:] if normalize_path(part) and normalize_path(part) != "."]


def git_dirty_paths() -> list[str]:
    try:
        output = subprocess.check_output(
            ["/usr/bin/git", "-C", str(REPO_ROOT), "status", "--porcelain", "--untracked-files=all"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except (OSError, subprocess.CalledProcessError):
        return []
    paths = []
    for line in output.splitlines():
        if len(line) < 4:
            continue
        path = line[3:]
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        paths.append(normalize_path(path))
    return unique_strings(paths)


def scope_rows(paths: list[str], allowed_paths: list[str], blocked_paths: list[str]) -> list[dict[str, str]]:
    rows = []
    for path in paths:
        blocked_pattern = blocked_by(path, blocked_paths)
        allowed_pattern = allowed_by(path, allowed_paths)
        if blocked_pattern:
            status = "blocked"
            matched = blocked_pattern
        elif allowed_pattern:
            status = "allowed"
            matched = allowed_pattern
        else:
            status = "out_of_scope"
            matched = ""
        rows.append(
            {
                "path": path,
                "status": status,
                "matchedRule": matched,
            }
        )
    return rows


def build_guard(
    packet_fixture: dict[str, Any],
    lane_fixture: dict[str, Any] | None,
    runtime_root: Path,
    dirty_paths: list[str] | None = None,
) -> dict[str, Any]:
    packet = packet_fixture.get("packet", {}) if isinstance(packet_fixture.get("packet"), dict) else {}
    scope = packet.get("scope", {}) if isinstance(packet.get("scope"), dict) else {}
    lane = lane_fixture.get("lane", {}) if lane_fixture and isinstance(lane_fixture.get("lane"), dict) else {}
    allowed_paths = unique_strings(
        [str(item) for item in scope.get("allowedPaths", [])]
        + [str(item) for item in lane.get("allowedPaths", [])]
    )
    blocked_paths = unique_strings(
        [str(item) for item in scope.get("blockedPaths", [])]
        + [str(item) for item in lane.get("blockedPaths", [])]
    )
    planned_files = unique_strings(
        [str(item) for item in scope.get("plannedFilesForThisPacket", [])]
        + parse_stage_files([str(item) for item in packet.get("scopedStageCommand", [])])
        + parse_stage_files([str(item) for item in lane.get("scopedStageCommand", [])])
    )
    planned_rows = scope_rows(planned_files, allowed_paths, blocked_paths)
    dirty_rows = scope_rows(dirty_paths if dirty_paths is not None else git_dirty_paths(), allowed_paths, blocked_paths)
    planned_blocked = [row for row in planned_rows if row["status"] != "allowed"]
    out_of_scope_dirty = [row for row in dirty_rows if row["status"] != "allowed"]
    blocked_dirty = [row for row in dirty_rows if row["status"] == "blocked"]
    status = "ready_clean_scope"
    if planned_blocked:
        status = "blocked_by_scoped_path_violation"
    elif out_of_scope_dirty:
        status = "ready_with_external_dirty_lanes"
    report = {
        "updatedAt": now_iso(),
        "mode": "read_only_scoped_path_guard",
        "generatedBy": "scripts/a2a/a2a_scoped_path_guard.py",
        "runtimeRoot": str(runtime_root),
        "sourcePacketId": str(packet.get("packetId", "")),
        "sourceLaneId": str(packet.get("laneId", "")),
        "summary": {
            "status": status,
            "allowedPaths": len(allowed_paths),
            "blockedPaths": len(blocked_paths),
            "plannedFiles": len(planned_rows),
            "plannedAllowed": sum(1 for row in planned_rows if row["status"] == "allowed"),
            "plannedBlocked": len(planned_blocked),
            "dirtyPaths": len(dirty_rows),
            "outOfScopeDirty": len(out_of_scope_dirty),
            "blockedDirty": len(blocked_dirty),
            "gitAddDotAllowed": False,
            "providerCalls": 0,
        },
        "allowedPaths": allowed_paths,
        "blockedPaths": blocked_paths,
        "plannedFiles": planned_rows,
        "plannedViolations": planned_blocked,
        "dirtyPathSamples": dirty_rows[:24],
        "outOfScopeDirtySamples": out_of_scope_dirty[:24],
        "blockedDirtySamples": blocked_dirty[:24],
        "policyBoundary": [
            "codex_git_owner",
            "planned_files_must_match_allowed_paths",
            "dirty_lanes_reported_not_mutated",
            "no_git_add_dot",
            "no_generated_web_sirinx_asset_mutation",
            "no_provider_call",
            "no_push",
            "no_deploy",
            "no_connector_sync",
            "no_secret_read_or_print",
        ],
        "nextSafeActions": [
            "If plannedBlocked is zero, Codex may validate and stage only planned files.",
            "Do not clean or stage out-of-scope dirty lanes from this A2A2A guard lane.",
            "Regenerate this guard after each scoped implementation packet update.",
        ],
    }
    runtime_report_path = runtime_root / "scoped_path_guard" / "latest.json"
    write_json(runtime_report_path, report)
    report["runtimeReportPath"] = str(runtime_report_path)
    return report


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export A2A2A scoped path guard fixture")
    parser.add_argument("--packet-path", default=str(DEFAULT_PACKET_PATH))
    parser.add_argument("--lane-path", default=str(DEFAULT_LANE_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--candidate-path", action="append", default=[])
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    packet = read_json(Path(os.path.expanduser(args.packet_path)).resolve())
    lane_path = Path(os.path.expanduser(args.lane_path)).resolve()
    lane = read_json(lane_path) if lane_path.exists() else None
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    dirty_paths = [str(item) for item in args.candidate_path] if args.candidate_path else None
    fixture = build_guard(packet, lane, runtime_root, dirty_paths)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {args.fixture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
