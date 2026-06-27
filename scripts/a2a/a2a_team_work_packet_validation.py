#!/usr/bin/env python3
"""Run the allowlisted validation commands for the current A2A2A work packet."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import subprocess
import time
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_DIR = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures"
DEFAULT_PACKETS_PATH = FIXTURE_DIR / "a2a2aTeamWorkPackets.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aTeamWorkPacketValidation.json"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
SCOPED_DIFF_PATHS = [
    "scripts/a2a/a2a_team_work_packets.py",
    "scripts/a2a/a2a_team_work_packet_outcome.py",
    "scripts/a2a/a2a_team_work_packet_validation.py",
    "tests/ghostclaw_runner/test_runner_status_fixture.py",
    "apps/mission-control/src/App.tsx",
    "apps/mission-control/src/fixtures/a2a2aTeamWorkPackets.json",
    "apps/mission-control/src/fixtures/a2a2aTeamWorkPacketOutcome.json",
    "apps/mission-control/src/fixtures/a2a2aTeamWorkPacketValidation.json",
    "docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md",
    "PROJECT_STATE.md",
    "NEXT_ACTIONS.md",
]


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def tail_text(value: str, limit: int = 2000) -> str:
    if len(value) <= limit:
        return value
    return value[-limit:]


def command_specs() -> list[dict[str, Any]]:
    return [
        {
            "id": "python_runner_fixture_tests",
            "cmd": [
                "python3",
                "-m",
                "unittest",
                "tests.ghostclaw_runner.test_agent_runner",
                "tests.ghostclaw_runner.test_runner_status_fixture",
            ],
        },
        {
            "id": "mission_control_typecheck",
            "cmd": ["pnpm", "--filter", "@sirinx/mission-control", "exec", "tsc", "--noEmit"],
        },
        {
            "id": "prettier_check_scoped_docs_ui",
            "cmd": [
                "pnpm",
                "exec",
                "prettier",
                "--check",
                "apps/mission-control/src/App.tsx",
                "docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md",
                "PROJECT_STATE.md",
                "NEXT_ACTIONS.md",
            ],
        },
        {
            "id": "python_compile_a2a_scripts",
            "cmd": [
                "python3",
                "-m",
                "py_compile",
                "scripts/a2a/a2a_codex_build_plan.py",
                "scripts/a2a/a2a_implementation_lane_packet.py",
                "scripts/a2a/a2a_scoped_path_guard.py",
                "scripts/a2a/a2a_team_work_packets.py",
                "scripts/a2a/a2a_team_work_packet_outcome.py",
                "scripts/a2a/a2a_team_work_packet_validation.py",
                "tests/ghostclaw_runner/test_runner_status_fixture.py",
            ],
        },
        {
            "id": "json_parse_core_fixtures",
            "cmd": [
                "python3",
                "-c",
                (
                    "import json, pathlib; "
                    "files=['apps/mission-control/src/fixtures/a2a2aImplementationLanePacket.json',"
                    "'apps/mission-control/src/fixtures/a2a2aScopedPathGuard.json',"
                    "'apps/mission-control/src/fixtures/a2a2aTeamWorkPackets.json',"
                    "'apps/mission-control/src/fixtures/a2a2aTeamWorkPacketOutcome.json']; "
                    "[json.loads(pathlib.Path(f).read_text()) for f in files]"
                ),
            ],
        },
        {
            "id": "git_diff_check_scoped_paths",
            "cmd": ["/usr/bin/git", "diff", "--check", "--", *SCOPED_DIFF_PATHS],
        },
    ]


def run_command(spec: dict[str, Any]) -> dict[str, Any]:
    started = time.monotonic()
    env = os.environ.copy()
    env.setdefault("PYTHONPYCACHEPREFIX", "/tmp/ghostclaw_pycache")
    proc = subprocess.run(
        spec["cmd"],
        cwd=REPO_ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )
    duration_ms = int((time.monotonic() - started) * 1000)
    return {
        "id": spec["id"],
        "command": " ".join(spec["cmd"]),
        "exitCode": proc.returncode,
        "status": "passed" if proc.returncode == 0 else "failed",
        "durationMs": duration_ms,
        "stdoutTail": tail_text(proc.stdout),
        "stderrTail": tail_text(proc.stderr),
    }


def build_validation(packets: dict[str, Any], runtime_root: Path, dry_run: bool = False) -> dict[str, Any]:
    selected_packet = packets.get("nextCodexPacket", {})
    if not isinstance(selected_packet, dict):
        selected_packet = {}
    specs = command_specs() if selected_packet.get("task") == "run_validation_commands" else []
    results = [
        {
            "id": spec["id"],
            "command": " ".join(spec["cmd"]),
            "exitCode": 0,
            "status": "dry_run",
            "durationMs": 0,
            "stdoutTail": "",
            "stderrTail": "",
        }
        if dry_run
        else run_command(spec)
        for spec in specs
    ]
    failed = [result for result in results if result["status"] != "passed"]
    passed = [result for result in results if result["status"] == "passed"]
    if dry_run and specs:
        status = "dry_run"
    elif specs and not failed:
        status = "passed"
    elif not specs:
        status = "blocked_no_validation_packet"
    else:
        status = "failed"
    validation = {
        "updatedAt": now_iso(),
        "mode": "local_allowlisted_validation",
        "generatedBy": "scripts/a2a/a2a_team_work_packet_validation.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "status": status,
            "packetId": str(selected_packet.get("packetId", "")),
            "queueId": str(selected_packet.get("queueId", "")),
            "task": str(selected_packet.get("task", "")),
            "commands": len(results),
            "passed": len(passed),
            "failed": len(failed),
            "providerCallsAllowed": False,
            "workerDirectEditsAllowed": False,
            "gitAddDotAllowed": False,
            "dryRun": dry_run,
        },
        "selectedPacket": selected_packet,
        "results": results,
        "policyBoundary": [
            "allowlisted_validation_commands_only",
            "no_provider_call",
            "no_connector_sync",
            "no_deploy",
            "no_push",
            "no_secret_read_or_print",
            "no_git_add_dot",
            "no_generated_web_sirinx_asset_mutation",
        ],
    }
    runtime_report_path = runtime_root / "work_packet_validations" / "latest.json"
    write_json(runtime_report_path, validation)
    validation["runtimeReportPath"] = str(runtime_report_path)
    return validation


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run A2A2A team work packet validation")
    parser.add_argument("--packets-path", default=str(DEFAULT_PACKETS_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    packets = read_json(Path(os.path.expanduser(args.packets_path)).resolve())
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture = build_validation(packets, runtime_root, args.dry_run)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {args.fixture_path}")
    return 0 if fixture["summary"]["status"] == "passed" or args.dry_run else 1


if __name__ == "__main__":
    raise SystemExit(main())
