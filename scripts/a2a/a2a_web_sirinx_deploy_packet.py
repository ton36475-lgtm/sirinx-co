#!/usr/bin/env python3
"""Create a pending Cloudflare Pages deploy lane packet for web-sirinx.

This script does not run validation commands, stage files, call Wrangler, or
deploy. It turns the pending deployment into a broker-visible checklist.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, read_json, runtime_path, sha256_text, write_json, write_text
from a2a_command_broker import decide, load_policy

REPO_ROOT = Path(__file__).resolve().parents[2]
WEB_ROOT = REPO_ROOT / "apps" / "web-sirinx"
DIST_ROOT = WEB_ROOT / "dist" / "public"
FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "webSirinxDeployPacketStatus.json"
SOURCE_MANIFEST = runtime_path("logs", "web_sirinx_deploy_lane.json")

VALIDATION_COMMANDS = [
    {
        "id": "web_sirinx_check",
        "label": "web-sirinx check",
        "action": "web_sirinx_build_validation",
        "command": "pnpm --filter @sirinx/web-sirinx check",
        "required": True,
    },
    {
        "id": "web_sirinx_test",
        "label": "web-sirinx test",
        "action": "run_unit_tests",
        "command": "pnpm --filter @sirinx/web-sirinx test",
        "required": True,
    },
    {
        "id": "web_sirinx_build",
        "label": "web-sirinx build",
        "action": "web_sirinx_build_validation",
        "command": "pnpm --filter @sirinx/web-sirinx build",
        "required": True,
    },
    {
        "id": "static_asset_manifest",
        "label": "static asset manifest",
        "action": "web_sirinx_static_asset_check",
        "command": "python3 scripts/a2a/a2a_web_sirinx_deploy_lane.py",
        "required": True,
    },
    {
        "id": "deploy_plan",
        "label": "deploy plan simulation",
        "action": "simulate_deploy_plan",
        "command": "python3 scripts/a2a/a2a_web_sirinx_deploy_packet.py",
        "required": True,
    },
    {
        "id": "cloudflare_pages_deploy",
        "label": "Cloudflare Pages deploy",
        "action": "web_sirinx_pages_deploy",
        "command": "wrangler pages deploy apps/web-sirinx/dist/public --project-name sirinx-co",
        "required": False,
    },
]


def load_manifest() -> dict[str, Any]:
    if not SOURCE_MANIFEST.exists():
        return {}
    try:
        data = read_json(SOURCE_MANIFEST)
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


def command_preview(row: dict[str, Any], policy: dict[str, Any]) -> dict[str, Any]:
    command = str(row["command"])
    broker = decide(policy, "codex-local", str(row["action"]), "canonical_remote_pending")
    risk_notes: list[str] = []
    if "wrangler pages deploy" in command:
        risk_notes.append("cloudflare_deploy_command")
    if "git push" in command:
        risk_notes.append("git_push_command")
    return {
        "id": row["id"],
        "label": row["label"],
        "required": bool(row["required"]),
        "action": row["action"],
        "commandPreview": command,
        "commandSha256": sha256_text(command),
        "brokerDecision": broker.get("decision", "blocked"),
        "brokerReason": broker.get("reason", ""),
        "requiredGate": broker.get("required_gate", ""),
        "riskNotes": risk_notes,
    }


def gate_status(packet: dict[str, Any]) -> str:
    if packet["summary"]["deployCommandBlocked"]:
        return "pending_validation_deploy_blocked"
    if packet["summary"]["missingAssetReferences"] > 0:
        return "pending_asset_fix"
    if packet["summary"]["requiredValidationCommands"] > packet["summary"]["dryRunReadyCommands"]:
        return "pending_executor_lease_or_validation"
    return "ready_for_manual_deploy_review"


def build_packet() -> dict[str, Any]:
    ensure_runtime()
    manifest = load_manifest()
    summary = manifest.get("summary", {}) if isinstance(manifest.get("summary"), dict) else {}
    policy = load_policy()
    commands = [command_preview(row, policy) for row in VALIDATION_COMMANDS]
    decision_counts = dict(Counter(row["brokerDecision"] for row in commands))
    deploy_commands = [row for row in commands if row["action"] == "web_sirinx_pages_deploy"]
    deploy_blocked = any(row["brokerDecision"].startswith("blocked") or row["riskNotes"] for row in deploy_commands)
    packet = {
        "updatedAt": now_iso(),
        "mode": "pending_deploy_lane_no_execution",
        "generatedBy": "scripts/a2a/a2a_web_sirinx_deploy_packet.py",
        "laneId": "LANE_WEB_SIRINX_CLOUDFLARE_PAGES_DEPLOY",
        "project": "web-sirinx",
        "pagesProject": "sirinx-co",
        "distPath": str(DIST_ROOT),
        "sourceManifest": str(SOURCE_MANIFEST),
        "summary": {
            "overallStatus": "pending",
            "distChangedFiles": summary.get("distChangedFiles", 0),
            "sourceChangedFiles": summary.get("sourceChangedFiles", 0),
            "missingAssetReferences": summary.get("missingAssetReferences", 0),
            "requiredValidationCommands": len([row for row in commands if row["required"]]),
            "dryRunReadyCommands": len(
                [
                    row
                    for row in commands
                    if row["brokerDecision"] == "auto_allow_dry_run" and not row["riskNotes"]
                ]
            ),
            "leaseRequiredCommands": decision_counts.get("requires_executor_lease", 0),
            "blockedCommands": decision_counts.get("blocked", 0) + decision_counts.get("blocked_first_phase", 0),
            "deployCommandBlocked": deploy_blocked,
            "decisionCounts": decision_counts,
        },
        "requiredEvidence": [
            "check_passed",
            "test_passed",
            "build_passed",
            "asset_manifest_missing_references_zero",
            "cloudflare_target_verified_without_secret_printing",
            "previous_deploy_or_rollback_reference",
            "post_deploy_healthcheck_plan",
            "scoped_staging_file_list",
        ],
        "commands": commands,
        "policyBoundary": [
            "no_command_execution",
            "no_git_add_dot",
            "no_stage",
            "no_push",
            "no_wrangler_deploy",
            "no_cloudflare_secret_read",
            "no_provider_call",
            "deploy_requires_manual_final_review",
        ],
        "nextSafeActions": [
            "Run web-sirinx check/test/build only through command packets and scoped executor lease where required.",
            "Regenerate web_sirinx_deploy_lane after validation.",
            "Prepare scoped staging list for web-sirinx source and matching generated dist assets.",
            "Keep Cloudflare deploy blocked until target, auth, rollback, and health evidence are ready.",
        ],
    }
    packet["summary"]["overallStatus"] = gate_status(packet)
    return packet


def build_markdown(packet: dict[str, Any]) -> str:
    lines = [
        "# web-sirinx Cloudflare Pages Deploy Lane Packet",
        "",
        f"- Created: `{packet['updatedAt']}`",
        f"- Lane: `{packet['laneId']}`",
        f"- Status: `{packet['summary']['overallStatus']}`",
        f"- Pages project: `{packet['pagesProject']}`",
        f"- Dist path: `{packet['distPath']}`",
        f"- Missing asset references: `{packet['summary']['missingAssetReferences']}`",
        f"- Deploy command blocked: `{packet['summary']['deployCommandBlocked']}`",
        "",
        "## Commands",
        "",
    ]
    for command in packet["commands"]:
        lines.append(
            f"- `{command['brokerDecision']}` **{command['label']}** "
            f"`{command['commandPreview']}` gate=`{command['requiredGate'] or 'none'}`"
        )
    lines.extend(["", "## Required Evidence", ""])
    lines.extend(f"- `{item}`" for item in packet["requiredEvidence"])
    lines.extend(["", "## Boundary", ""])
    lines.extend(f"- `{item}`" for item in packet["policyBoundary"])
    lines.extend(["", "## Next Safe Actions", ""])
    lines.extend(f"- {item}" for item in packet["nextSafeActions"])
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    packet = build_packet()
    json_path = runtime_path("logs", "web_sirinx_deploy_packet.json")
    markdown_path = runtime_path("logs", "web_sirinx_deploy_packet.md")
    write_json(json_path, packet)
    write_text(markdown_path, build_markdown(packet))
    write_json(FIXTURE_PATH, packet)
    print(
        json.dumps(
            {
                "fixture": str(FIXTURE_PATH),
                "json_report": str(json_path),
                "markdown_report": str(markdown_path),
                "overall_status": packet["summary"]["overallStatus"],
                "deploy_command_blocked": packet["summary"]["deployCommandBlocked"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
