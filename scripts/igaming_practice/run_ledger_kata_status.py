#!/usr/bin/env python3
"""Run the sandbox ledger kata tests and write a local runtime status manifest.

This script is intentionally local-only:
- no live payment provider calls
- no Supabase mutation
- no public endpoint
- no secret reading or printing
- runtime output is written outside git by default
"""

from __future__ import annotations

import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any


SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = SCRIPT_PATH.parents[2]
RUNTIME_ROOT = (
    Path.home()
    / "SIRINXDev"
    / ".ghostclaw_runtime"
    / "igaming_practice"
    / "ledger-kata-status"
)
COMMAND = ["pnpm", "--filter", "@sirinx/ledger-kata", "test"]


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def strip_ansi(value: str) -> str:
    return re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", value)


def parse_vitest_output(output: str, returncode: int) -> dict[str, Any]:
    clean_output = strip_ansi(output)
    tests_match = re.search(r"Tests\s+(\d+)\s+passed\s+\((\d+)\)", clean_output)
    files_match = re.search(
        r"Test Files\s+(\d+)\s+passed\s+\((\d+)\)", clean_output
    )
    failed_match = re.search(r"Tests\s+(\d+)\s+failed", clean_output)

    tests_passed = int(tests_match.group(1)) if tests_match else 0
    tests_total = int(tests_match.group(2)) if tests_match else 0
    files_passed = int(files_match.group(1)) if files_match else 0
    files_total = int(files_match.group(2)) if files_match else 0
    tests_failed = int(failed_match.group(1)) if failed_match else 0

    return {
        "status": "passing" if returncode == 0 and tests_failed == 0 else "failing",
        "tests_passed": tests_passed,
        "tests_total": tests_total,
        "tests_failed": tests_failed,
        "test_files_passed": files_passed,
        "test_files_total": files_total,
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def write_markdown(path: Path, payload: dict[str, Any], command_output: str) -> None:
    status = payload["result"]["status"].upper()
    summary = payload["result"]
    path.write_text(
        "\n".join(
            [
                "# Ledger Kata Runtime Status",
                "",
                f"- Generated at: `{payload['generated_at']}`",
                f"- Mode: `{payload['mode']}`",
                f"- Package: `{payload['package']}`",
                f"- Command: `{' '.join(payload['command'])}`",
                f"- Status: `{status}`",
                f"- Tests: `{summary['tests_passed']}/{summary['tests_total']}`",
                f"- Test files: `{summary['test_files_passed']}/{summary['test_files_total']}`",
                "",
                "## Boundary",
                "",
                "- No real-money gambling flow.",
                "- No live payment provider call.",
                "- No Supabase migration or mutation.",
                "- No service-role key read or printed.",
                "- No public endpoint opened.",
                "",
                "## Output Tail",
                "",
                "```text",
                "\n".join(command_output.strip().splitlines()[-30:]),
                "```",
                "",
            ]
        )
    )


def main() -> int:
    RUNTIME_ROOT.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["NO_COLOR"] = "1"

    completed = subprocess.run(
        COMMAND,
        cwd=REPO_ROOT,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    combined_output = "\n".join(
        part for part in [completed.stdout, completed.stderr] if part.strip()
    )
    clean_output = strip_ansi(combined_output)
    result = parse_vitest_output(clean_output, completed.returncode)
    generated_at = now_iso()

    manifest = {
        "schema_version": 1,
        "generated_at": generated_at,
        "mode": "SANDBOX_ONLY",
        "package": "@sirinx/ledger-kata",
        "command": COMMAND,
        "repo_root": str(REPO_ROOT),
        "runtime_root": str(RUNTIME_ROOT),
        "result": result,
        "artifacts": {
            "json": str(RUNTIME_ROOT / "ledger_test_status.json"),
            "markdown": str(RUNTIME_ROOT / "ledger_test_status.md"),
        },
        "blocked_actions": [
            "real_money_gambling",
            "live_payment_provider",
            "service_role_key_display",
            "public_endpoint",
            "supabase_live_migration",
        ],
    }

    json_path = RUNTIME_ROOT / "ledger_test_status.json"
    markdown_path = RUNTIME_ROOT / "ledger_test_status.md"
    output_path = RUNTIME_ROOT / "ledger_test_output.txt"

    write_json(json_path, manifest)
    write_markdown(markdown_path, manifest, clean_output)
    output_path.write_text(clean_output)

    print(f"ledger_kata_status={result['status']}")
    print(f"json={json_path}")
    print(f"markdown={markdown_path}")
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
