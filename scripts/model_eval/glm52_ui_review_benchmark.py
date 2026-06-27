#!/usr/bin/env python3
"""Create a local-only GLM-5.2 UI review benchmark status artifact."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PACKET_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aNextScopedCodingPacket.json"
DEFAULT_FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "glm52UiBenchmarkStatus.json"
DEFAULT_RUNTIME_ROOT = Path(
    os.path.expanduser(
        os.environ.get(
            "GHOSTCLAW_GLM52_UI_BENCHMARK_RUNTIME",
            "~/SIRINXDev/.ghostclaw_runtime/model_evals/glm52_ui_review",
        )
    )
)

SCORING_CRITERIA = [
    "visual_hierarchy",
    "layout_practicality",
    "responsive_constraints",
    "accessibility_risks",
    "implementation_specificity",
    "design_system_consistency",
    "safety_and_scope_control",
]

REQUIRED_OUTPUT = [
    "findings",
    "recommended_ui_changes",
    "responsive_risks",
    "accessibility_risks",
    "implementation_plan",
    "tests_to_run",
    "no_code",
]

PROMPT_SECTIONS = [
    "Role",
    "Product Context",
    "UI Excerpt",
    "Rules",
    "Required Output",
    "Scoring",
]


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=True, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def safe_get(mapping: dict[str, Any], key: str) -> str:
    return str(mapping.get(key) or "")


def prompt_markdown(status: dict[str, Any]) -> str:
    benchmark = status["benchmark"]
    lines = [
        "# GLM-5.2 UI Review Benchmark Prompt",
        "",
        "## Role",
        "You are a report-only frontend/UI reviewer for GHOSTCLAW Mission Control.",
        "",
        "## Product Context",
        benchmark["context"],
        "",
        "## UI Excerpt",
        f"Surface: {benchmark['uiExcerpt']['surface']}",
        "",
        benchmark["uiExcerpt"]["description"],
        "",
        "Elements:",
    ]
    lines.extend(f"- {item}" for item in benchmark["uiExcerpt"]["elements"])
    lines.extend(
        [
            "",
            "## Rules",
            "- Do not write code.",
            "- Do not request provider credentials or secrets.",
            "- Do not suggest deploy, push, connector sync, or public claims.",
            "- Keep recommendations inside the existing Mission Control patterns.",
            "",
            "## Required Output",
        ]
    )
    lines.extend(f"- {item}" for item in benchmark["requiredOutput"])
    lines.extend(["", "## Scoring"])
    lines.extend(f"- {item}" for item in benchmark["scoring"]["criteria"])
    lines.extend(["", "Passing threshold: average score >= 4.0 with no unsafe action suggestion.", ""])
    return "\n".join(lines)


def build_status(packet_fixture: dict[str, Any], runtime_root: Path) -> dict[str, Any]:
    packet = packet_fixture.get("packet") if isinstance(packet_fixture.get("packet"), dict) else {}
    summary = packet_fixture.get("summary") if isinstance(packet_fixture.get("summary"), dict) else {}
    selected_backlog_id = safe_get(packet, "selectedBacklogId")
    source_packet_id = safe_get(packet, "packetId")
    ready = (
        selected_backlog_id == "BACKLOG-092"
        and safe_get(packet, "status") == "ready_for_scoped_coding"
        and bool(packet.get("executionAllowed"))
        and not bool(packet.get("providerCallsAllowed"))
        and not bool(packet.get("workerDirectEditsAllowed"))
        and not bool(summary.get("gitAddDotAllowed"))
    )
    runtime_root = runtime_root.expanduser().resolve()
    runtime_report_path = runtime_root / "reports" / "glm52_ui_review_benchmark_status.json"
    prompt_path = runtime_root / "prompts" / "mission_control_backlog_092_ui_review.md"
    status = {
        "updatedAt": now_iso(),
        "mode": "local_only_glm52_ui_review_benchmark",
        "generatedBy": "scripts/model_eval/glm52_ui_review_benchmark.py",
        "runtimeRoot": str(runtime_root),
        "runtimeReportPath": str(runtime_report_path),
        "promptPath": str(prompt_path),
        "summary": {
            "status": "ready_for_manual_glm52_ui_review" if ready else "blocked_until_scoped_packet_ready",
            "selectedBacklogId": selected_backlog_id,
            "sourcePacketId": source_packet_id,
            "criteria": len(SCORING_CRITERIA),
            "promptSections": len(PROMPT_SECTIONS),
            "providerCallPerformed": False,
            "autoPatchAllowed": False,
            "publicClaimAllowed": False,
            "manualProviderLeaseRequired": True,
        },
        "benchmark": {
            "context": "Mission Control is the read-only observer for local A2A2A task state. The current slice asks GLM-5.2 to review UI clarity without changing source code.",
            "uiExcerpt": {
                "surface": "Mission Control A2A2A Team Coding Start and Next Scoped Packet panels",
                "description": "A dense operational card shows ready queue counts, role map, selected BACKLOG-092 scoped packet, planned files, report-only worker inputs, and blocked action guards.",
                "elements": [
                    "team coding status badge",
                    "ready queue and blocked gate KPI cells",
                    "selected backlog and scoped packet manifest line",
                    "priority queue rows",
                    "role map rows",
                    "next scoped packet rows for task, worker inputs, and blocked actions",
                ],
            },
            "requiredOutput": REQUIRED_OUTPUT,
            "scoring": {
                "scale": "1-5",
                "passingThreshold": 4.0,
                "criteria": SCORING_CRITERIA,
            },
        },
        "policyBoundary": [
            "provider_calls_require_command_broker_lease",
            "manual_playground_or_api_result_must_not_touch_repo",
            "no_secret_read_or_print",
            "no_connector_sync",
            "no_deploy",
            "no_push",
            "no_auto_patch_from_model_output",
            "no_public_benchmark_claim_without_local_evidence",
        ],
        "nextSafeActions": [
            "Optionally run the generated prompt manually through an approved GLM-5.2 route.",
            "Paste only summarized model findings into a future report-only worker artifact.",
            "Codex remains the only repo editor and must validate any local UI change separately.",
        ],
    }
    status["prompt"] = prompt_markdown(status)
    return status


def write_outputs(packet_fixture: dict[str, Any], runtime_root: Path, fixture_path: Path) -> dict[str, Any]:
    status = build_status(packet_fixture, runtime_root)
    write_text(Path(status["promptPath"]), status["prompt"])
    runtime_payload = dict(status)
    runtime_payload.pop("prompt", None)
    write_json(Path(status["runtimeReportPath"]), runtime_payload)
    fixture_payload = dict(status)
    fixture_payload.pop("prompt", None)
    write_json(fixture_path, fixture_payload)
    return fixture_payload


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a local-only GLM-5.2 UI review benchmark artifact.")
    parser.add_argument("--packet-path", default=str(DEFAULT_PACKET_PATH))
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--fixture-path", default=str(DEFAULT_FIXTURE_PATH))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    packet = read_json(Path(os.path.expanduser(args.packet_path)).resolve())
    status = write_outputs(
        packet,
        Path(os.path.expanduser(args.runtime_root)).resolve(),
        Path(os.path.expanduser(args.fixture_path)).resolve(),
    )
    print(f"wrote {Path(os.path.expanduser(args.fixture_path)).resolve()}")
    return 0 if status["summary"]["status"] == "ready_for_manual_glm52_ui_review" else 1


if __name__ == "__main__":
    raise SystemExit(main())
