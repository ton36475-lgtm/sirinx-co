#!/usr/bin/env python3
"""Run allowlisted validation for the A2A2A worker follow-up packet."""

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
DEFAULT_PACKET_PATH = FIXTURE_DIR / "a2a2aWorkerFollowupImplementationPacket.json"
DEFAULT_FIXTURE_PATH = FIXTURE_DIR / "a2a2aWorkerFollowupPacketValidation.json"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", "~/SIRINXDev/.ghostclaw_runtime/a2a2a"))
)
SCOPED_PATHS = [
    "scripts/a2a/a2a_worker_followup_brief.py",
    "scripts/a2a/a2a_worker_followup_lane.py",
    "scripts/a2a/a2a_worker_followup_implementation_packet.py",
    "scripts/a2a/a2a_worker_followup_packet_validation.py",
    "tests/ghostclaw_runner/test_agent_runner.py",
    "tests/ghostclaw_runner/test_runner_status_fixture.py",
    "apps/mission-control/src/App.tsx",
    "apps/mission-control/src/fixtures/a2a2aRunnerStatus.json",
    "apps/mission-control/src/fixtures/a2a2aWorkerFollowupBrief.json",
    "apps/mission-control/src/fixtures/a2a2aWorkerFollowupLane.json",
    "apps/mission-control/src/fixtures/a2a2aWorkerFollowupImplementationPacket.json",
    "docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md",
    "ghostclaw_runner/README.md",
    "ghostclaw_runner/agent_runner.py",
    "PROJECT_STATE.md",
    "NEXT_ACTIONS.md",
]


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def tail_text(value: str, limit: int = 1800) -> str:
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
                "apps/mission-control/src/fixtures/a2a2aWorkerFollowupBrief.json",
                "apps/mission-control/src/fixtures/a2a2aWorkerFollowupLane.json",
                "apps/mission-control/src/fixtures/a2a2aWorkerFollowupImplementationPacket.json",
                "docs/a2async/A2A2A_LOCAL_AGENT_RUNNER.md",
                "ghostclaw_runner/README.md",
                "PROJECT_STATE.md",
                "NEXT_ACTIONS.md",
            ],
        },
        {
            "id": "python_compile_followup_scripts",
            "cmd": [
                "python3",
                "-m",
                "py_compile",
                "scripts/a2a/a2a_worker_followup_brief.py",
                "scripts/a2a/a2a_worker_followup_lane.py",
                "scripts/a2a/a2a_worker_followup_implementation_packet.py",
                "scripts/a2a/a2a_worker_followup_packet_validation.py",
                "tests/ghostclaw_runner/test_agent_runner.py",
                "tests/ghostclaw_runner/test_runner_status_fixture.py",
            ],
        },
        {
            "id": "json_parse_followup_fixtures",
            "cmd": [
                "python3",
                "-c",
                (
                    "import json, pathlib; "
                    "files=['apps/mission-control/src/fixtures/a2a2aWorkerFollowupBrief.json',"
                    "'apps/mission-control/src/fixtures/a2a2aWorkerFollowupLane.json',"
                    "'apps/mission-control/src/fixtures/a2a2aWorkerFollowupImplementationPacket.json']; "
                    "[json.loads(pathlib.Path(f).read_text()) for f in files]"
                ),
            ],
        },
        {
            "id": "git_diff_check_scoped_paths",
            "cmd": ["/usr/bin/git", "diff", "--check", "--", *SCOPED_PATHS],
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


def build_validation(packet_fixture: dict[str, Any], runtime_root: Path, dry_run: bool = False) -> dict[str, Any]:
    summary = packet_fixture.get("summary") if isinstance(packet_fixture.get("summary"), dict) else {}
    packet = packet_fixture.get("packet") if isinstance(packet_fixture.get("packet"), dict) else {}
    packet_ready = summary.get("status") == "ready_for_codex_scoped_work"
    specs = command_specs() if packet_ready else []
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
    elif not packet_ready:
        status = "blocked_packet_not_ready"
    elif specs and not failed:
        status = "passed"
    else:
        status = "failed"
    validation = {
        "updatedAt": now_iso(),
        "mode": "local_allowlisted_worker_followup_packet_validation",
        "generatedBy": "scripts/a2a/a2a_worker_followup_packet_validation.py",
        "runtimeRoot": str(runtime_root),
        "summary": {
            "status": status,
            "packetId": str(packet.get("packetId", "")),
            "sourceLaneId": str(packet.get("sourceLaneId", "")),
            "commands": len(results),
            "passed": len(passed),
            "failed": len(failed),
            "providerCallsAllowed": False,
            "workerDirectEditsAllowed": False,
            "gitAddDotAllowed": False,
            "dryRun": dry_run,
        },
        "selectedPacket": packet,
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
    runtime_report_path = runtime_root / "worker_followup_packet_validations" / "latest.json"
    write_json(runtime_report_path, validation)
    validation["runtimeReportPath"] = str(runtime_report_path)
    return validation


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate A2A2A worker follow-up implementation packet")
    parser.add_argument("--packet-path", default=str(DEFAULT_PACKET_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    packet = read_json(Path(os.path.expanduser(args.packet_path)).resolve())
    runtime_root = Path(os.path.expanduser(args.runtime_root)).resolve()
    fixture = build_validation(packet, runtime_root, args.dry_run)
    write_json(Path(os.path.expanduser(args.fixture_path)).resolve(), fixture)
    print(f"wrote {Path(os.path.expanduser(args.fixture_path)).resolve()}")
    return 0 if fixture["summary"]["status"] in {"passed", "dry_run"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
