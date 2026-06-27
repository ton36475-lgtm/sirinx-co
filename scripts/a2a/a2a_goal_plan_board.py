#!/usr/bin/env python3
"""Build a read-only Mission Control goal plan board for local Codex work."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, parse_registry_entries, read_json, runtime_path, write_json, write_text

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "codexGoalPlanStatus.json"
OBSIDIAN_DIGEST = Path("/Users/sirinx/Documents/Obsidian Vault/SIRINX/AI HQ Knowledge Digest.md")
BROKER_POLICY_PATH = REPO_ROOT / "policies" / "codex_command_broker.json"

PROJECT_DOCS = [
    REPO_ROOT / "PROJECT_STATE.md",
    REPO_ROOT / "NEXT_ACTIONS.md",
    REPO_ROOT / "AGENTS.md",
    REPO_ROOT / "docs" / "a2async" / "CODEX_COMMAND_BROKER_TOOL_GITREPO_INTEGRATION.md",
    REPO_ROOT / "docs" / "a2async" / "A2A_INTEGRATION_READINESS_MATRIX.md",
    REPO_ROOT / "docs" / "a2async" / "A2A_SCOPED_LANE_STAGING_GUARD.md",
    REPO_ROOT / "docs" / "a2async" / "AUTOMATED_CODE_REVIEW_WORKFLOW_INTEGRATION.md",
]

RUNTIME_REPORTS = {
    "readiness_matrix": runtime_path("logs", "a2a_integration_readiness_matrix.json"),
    "scoped_lane": runtime_path("logs", "scoped_lane_status_codex-command-broker-mission-control.json"),
    "broker_status_validation": runtime_path("logs", "broker_status_validation.json"),
    "command_packet": runtime_path("logs", "codex_command_packet.json"),
    "autonomous_policy_sanitizer": runtime_path("logs", "autonomous_execution_policy_sanitizer.json"),
    "automated_code_review": runtime_path("logs", "automated_code_review_workflow.json"),
    "tool_repo_matrix": runtime_path("logs", "codex_tool_repo_matrix.json"),
    "web_sirinx_deploy_lane": runtime_path("logs", "web_sirinx_deploy_lane.json"),
    "web_sirinx_deploy_packet": runtime_path("logs", "web_sirinx_deploy_packet.json"),
    "command_broker_production": runtime_path("logs", "command_broker_production_lane.json"),
}


def load_json_if_exists(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = read_json(path)
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


def file_snapshot(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"path": str(path), "exists": False, "bytes": 0, "lines": 0, "mtime": ""}
    text = path.read_text(encoding="utf-8", errors="replace")
    return {
        "path": str(path),
        "exists": True,
        "bytes": path.stat().st_size,
        "lines": len(text.splitlines()),
        "mtime": int(path.stat().st_mtime),
    }


def obsidian_snapshot() -> dict[str, Any]:
    snapshot = file_snapshot(OBSIDIAN_DIGEST)
    snapshot["policy"] = "metadata_only_no_raw_note_ingest"
    return snapshot


def registry_summary() -> dict[str, Any]:
    entries = parse_registry_entries()
    allow = [entry for entry in entries if entry.get("clone_policy") == "allow"]
    skip = [entry for entry in entries if entry.get("clone_policy") == "skip"]
    return {
        "total": len(entries),
        "allow_clone_count": len(allow),
        "skip_clone_count": len(skip),
        "allow_clone_repos": sorted(entry.get("repo", entry.get("name", "")) for entry in allow),
    }


def broker_summary() -> dict[str, Any]:
    fixture_path = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "codexCommandBrokerStatus.json"
    fixture = load_json_if_exists(fixture_path)
    return {
        "fixture_path": str(fixture_path),
        "updated_at": fixture.get("updatedAt", ""),
        "summary": fixture.get("summary", {}),
        "latest_decisions": [
            {
                "tool": item.get("tool", ""),
                "action": item.get("action", ""),
                "decision": item.get("decision", ""),
                "reason": item.get("reason", ""),
                "required_gate": item.get("requiredGate", ""),
            }
            for item in fixture.get("decisions", [])[:6]
            if isinstance(item, dict)
        ],
    }


def command_packet_summary() -> dict[str, Any]:
    path = runtime_path("logs", "codex_command_packet.json")
    report = load_json_if_exists(path)
    return {
        "path": str(path),
        "exists": bool(report),
        "status": report.get("packet_decision", "missing"),
        "tool": report.get("tool", ""),
        "action": report.get("action", ""),
        "executionAllowed": report.get("execution_allowed_by_packet", False),
        "riskFlags": len(report.get("risk_flags", [])) if isinstance(report.get("risk_flags"), list) else 0,
        "commandHash": report.get("command_sha256", ""),
    }


def command_broker_production_summary() -> dict[str, Any]:
    path = runtime_path("logs", "command_broker_production_lane.json")
    report = load_json_if_exists(path)
    summary = report.get("summary", {})
    return {
        "path": str(path),
        "exists": bool(report),
        "status": summary.get("status", "missing"),
        "registeredCommands": summary.get("registeredCommands", 0),
        "runtimeFiles": summary.get("runtimeFiles", 0),
        "denyAlwaysCount": summary.get("denyAlwaysCount", 0),
        "directExecutionEnabled": summary.get("directExecutionEnabled", False),
        "deployCommandAllowed": summary.get("deployCommandAllowed", False),
    }


def autonomous_policy_summary() -> dict[str, Any]:
    path = runtime_path("logs", "autonomous_execution_policy_sanitizer.json")
    report = load_json_if_exists(path)
    summary = report.get("summary", {})
    return {
        "path": str(path),
        "exists": bool(report),
        "status": summary.get("status", "missing"),
        "requestedActions": summary.get("requestedActions", 0),
        "autoAllowDryRun": summary.get("autoAllowDryRun", 0),
        "requiresExecutorLease": summary.get("requiresExecutorLease", 0),
        "blockedFirstPhase": summary.get("blockedFirstPhase", 0),
        "blocked": summary.get("blocked", 0),
        "sampleBlockedActions": [
            item.get("action", "")
            for item in report.get("actions", [])
            if isinstance(item, dict) and item.get("decision") == "blocked"
        ][:12],
    }


def code_review_summary() -> dict[str, Any]:
    path = runtime_path("logs", "automated_code_review_workflow.json")
    report = load_json_if_exists(path)
    summary = report.get("summary", {})
    source = report.get("sourceDocument", {})
    return {
        "path": str(path),
        "exists": bool(report),
        "status": summary.get("status", "missing"),
        "plannedStages": summary.get("plannedStages", 0),
        "changedFilesVisible": summary.get("changedFilesVisible", 0),
        "autoAllowDryRun": summary.get("autoAllowDryRun", 0),
        "requiresExecutorLease": summary.get("requiresExecutorLease", 0),
        "blocked": summary.get("blocked", 0),
        "sourcePath": source.get("path", ""),
        "sourceExists": source.get("exists", False),
        "sourceHash": source.get("sha256", ""),
    }


def tool_repo_matrix_summary() -> dict[str, Any]:
    path = runtime_path("logs", "codex_tool_repo_matrix.json")
    report = load_json_if_exists(path)
    summary = report.get("summary", {})
    return {
        "path": str(path),
        "exists": bool(report),
        "status": summary.get("overallStatus", "missing"),
        "agentCount": summary.get("agentCount", 0),
        "repoCount": summary.get("repoCount", 0),
        "repoActionCount": summary.get("repoActionCount", 0),
        "blockedOrGatedActions": summary.get("blockedOrGatedActions", 0),
    }


def web_sirinx_deploy_summary() -> dict[str, Any]:
    path = runtime_path("logs", "web_sirinx_deploy_lane.json")
    report = load_json_if_exists(path)
    summary = report.get("summary", {})
    return {
        "path": str(path),
        "exists": bool(report),
        "status": summary.get("overallStatus", "missing"),
        "distChangedFiles": summary.get("distChangedFiles", 0),
        "sourceChangedFiles": summary.get("sourceChangedFiles", 0),
        "missingAssetReferences": summary.get("missingAssetReferences", 0),
        "deployBlocked": summary.get("deployBlocked", True),
    }


def web_sirinx_deploy_packet_summary() -> dict[str, Any]:
    path = runtime_path("logs", "web_sirinx_deploy_packet.json")
    report = load_json_if_exists(path)
    summary = report.get("summary", {})
    return {
        "path": str(path),
        "exists": bool(report),
        "status": summary.get("overallStatus", "missing"),
        "laneId": report.get("laneId", ""),
        "pagesProject": report.get("pagesProject", ""),
        "requiredValidationCommands": summary.get("requiredValidationCommands", 0),
        "leaseRequiredCommands": summary.get("leaseRequiredCommands", 0),
        "blockedCommands": summary.get("blockedCommands", 0),
        "deployCommandBlocked": summary.get("deployCommandBlocked", True),
    }


def connector_summary() -> dict[str, Any]:
    fixture_path = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "toolIntegrationPayloadStatus.json"
    fixture = load_json_if_exists(fixture_path)
    connectors = fixture.get("connectors", [])
    unbound = [item.get("key", "") for item in connectors if isinstance(item, dict) and not item.get("targetBound")]
    return {
        "fixture_path": str(fixture_path),
        "updated_at": fixture.get("updatedAt", ""),
        "record_count": fixture.get("recordCount", 0),
        "target_unbound": sorted(unbound),
        "external_writes_enabled": fixture.get("policy", {}).get("externalWritesEnabled", False),
    }


def runtime_report_summary() -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for key, path in RUNTIME_REPORTS.items():
        data = load_json_if_exists(path)
        status_value = (
            data.get("overall_status")
            or data.get("ready_for_scoped_stage")
            or ("valid" if data and not data.get("errors") else "missing")
        )
        if isinstance(status_value, bool):
            status_value = "ready_for_scoped_stage" if status_value else "not_ready_for_scoped_stage"
        summary[key] = {
            "path": str(path),
            "exists": bool(data),
            "status": status_value,
            "errors": len(data.get("errors", [])) if isinstance(data.get("errors"), list) else data.get("errors", 0),
            "warnings": len(data.get("warnings", [])) if isinstance(data.get("warnings"), list) else data.get("warnings", 0),
        }
    return summary


def build_work_lanes(
    reports: dict[str, Any],
    connectors: dict[str, Any],
    broker: dict[str, Any],
    code_review: dict[str, Any],
    tool_matrix: dict[str, Any],
    web_deploy: dict[str, Any],
    command_packet: dict[str, Any],
    command_broker_production: dict[str, Any],
    deploy_packet: dict[str, Any],
) -> list[dict[str, str]]:
    blocked_count = int(broker.get("summary", {}).get("blocked", 0) or 0)
    return [
        {
            "id": "codex-command-broker-mission-control",
            "label": "Codex Command Broker + Mission Control",
            "status": "ready",
            "source": reports["scoped_lane"]["path"],
            "nextAction": "Review scoped stage packet; stage only the lane after explicit commit request.",
        },
        {
            "id": "connector-target-binding",
            "label": "Airtable / Linear / Notion / GitHub target binding",
            "status": "blocked",
            "source": connectors["fixture_path"],
            "nextAction": "Wait for scoped target IDs before connector sync.",
        },
        {
            "id": "automated-code-review-workflow",
            "label": "Automated Code Review Workflow",
            "status": "safe" if code_review.get("exists") else "gated",
            "source": code_review["path"],
            "nextAction": "Review generated code-review manifest; keep recommendations report-only until a lease exists.",
        },
        {
            "id": "codex-tool-repo-matrix",
            "label": "Codex Tool + Git Repo Command Matrix",
            "status": "safe" if tool_matrix.get("exists") else "gated",
            "source": tool_matrix["path"],
            "nextAction": "Review command coverage before opening clone, provider, connector, deploy, or mutation lanes.",
        },
        {
            "id": "web-sirinx-generated-assets-deploy-lane",
            "label": "web-sirinx generated assets + deploy backlog",
            "status": "blocked" if web_deploy.get("deployBlocked") else "gated",
            "source": web_deploy["path"],
            "nextAction": "Review generated dist manifest; run scoped validation before staging matching source and assets.",
        },
        {
            "id": "web-sirinx-cloudflare-pages-deploy-packet",
            "label": "web-sirinx Cloudflare Pages pending deploy packet",
            "status": "blocked" if deploy_packet.get("deployCommandBlocked") else "gated",
            "source": deploy_packet["path"],
            "nextAction": "Keep deploy blocked until check/test/build, target, rollback, health, and staging evidence are present.",
        },
        {
            "id": "codex-command-packet-control",
            "label": "Codex Command Packet Control",
            "status": "safe" if command_packet.get("exists") else "gated",
            "source": command_packet["path"],
            "nextAction": "Create/review a command packet before any local executor command leaves planning mode.",
        },
        {
            "id": "command-broker-production-lane",
            "label": "Command Broker Production Lane",
            "status": "safe" if command_broker_production.get("exists") else "gated",
            "source": command_broker_production["path"],
            "nextAction": "Review production broker runtime registry before opening any executor lease.",
        },
        {
            "id": "external-repo-registry",
            "label": "External Git repo registry",
            "status": "gated",
            "source": str(REPO_ROOT / "registry" / "external_git_repos.yaml"),
            "nextAction": "Run registry audit only; clone remains separate gated lane.",
        },
        {
            "id": "obsidian-brain-sync",
            "label": "Obsidian Brain Sync",
            "status": "safe",
            "source": str(OBSIDIAN_DIGEST),
            "nextAction": "Append concise non-secret pulse after meaningful local work.",
        },
        {
            "id": "unlock-security-request",
            "label": "Unlock all security / autonomous approve",
            "status": "blocked",
            "source": broker["fixture_path"],
            "nextAction": f"Keep hard blocks active; {blocked_count} blocked broker decisions are visible for review.",
        },
    ]


def build_board() -> dict[str, Any]:
    ensure_runtime()
    reports = runtime_report_summary()
    connectors = connector_summary()
    broker = broker_summary()
    autonomous_policy = autonomous_policy_summary()
    code_review = code_review_summary()
    tool_matrix = tool_repo_matrix_summary()
    web_deploy = web_sirinx_deploy_summary()
    command_packet = command_packet_summary()
    command_broker_production = command_broker_production_summary()
    deploy_packet = web_sirinx_deploy_packet_summary()
    broker_policy = load_json_if_exists(BROKER_POLICY_PATH)
    docs = [file_snapshot(path) for path in PROJECT_DOCS]
    registry = registry_summary()
    lanes = build_work_lanes(
        reports,
        connectors,
        broker,
        code_review,
        tool_matrix,
        web_deploy,
        command_packet,
        command_broker_production,
        deploy_packet,
    )
    safe_next_actions = [
        "Review Mission Control Goal Plan board locally.",
        "Review the Automated Code Review Workflow panel as report-only evidence.",
        "Review the Tool Matrix panel before opening any new executor or repo action lane.",
        "Review the Web Deploy panel before staging generated web-sirinx assets.",
        "Review the pending Cloudflare Pages deploy packet before any deploy lane is opened.",
        "Create a command packet for every local executor command before running it.",
        "Keep KOB as planner/router and local Codex as executor.",
        "Bind connector target IDs only in a scoped connector lane.",
        "Use scoped lane staging guard before any commit request.",
        "Keep unlock-all-security and autonomous-approve-all hard-blocked.",
    ]
    policy_hard_blocks = list(broker_policy.get("hard_blocked_actions", []))
    board_specific_blocks = [
        "push",
        "deploy",
        "provider_call",
        "connector_write_without_target_binding",
    ]
    blocked_actions = sorted({*policy_hard_blocks, *board_specific_blocks})
    return {
        "updatedAt": now_iso(),
        "mode": "local_read_only_goal_plan_board",
        "generatedBy": "scripts/a2a/a2a_goal_plan_board.py",
        "controlNode": {
            "label": "Mac mini M2 Codex local sidebar",
            "repoRoot": str(REPO_ROOT),
            "runtimeRoot": str(runtime_path()),
            "obsidianDigest": str(OBSIDIAN_DIGEST),
            "executionRoute": "kob-plans-codex-local-executes",
        },
        "summary": {
            "overallStatus": "ready_for_local_review_only",
            "workLaneCount": len(lanes),
            "safeNextActionCount": len(safe_next_actions),
            "blockedActionCount": len(blocked_actions),
            "connectorTargetsUnbound": len(connectors["target_unbound"]),
            "registeredRepos": registry["total"],
            "brokerDecisions": broker.get("summary", {}).get("total", 0),
            "sanitizedRequestedActions": autonomous_policy["requestedActions"],
            "sanitizedBlockedActions": autonomous_policy["blocked"],
            "codeReviewPlannedStages": code_review["plannedStages"],
            "toolMatrixRepoActions": tool_matrix["repoActionCount"],
            "webSirinxDistChanges": web_deploy["distChangedFiles"],
            "webSirinxMissingAssets": web_deploy["missingAssetReferences"],
            "webSirinxDeployBlockedCommands": deploy_packet["blockedCommands"],
            "webSirinxDeployLeaseRequiredCommands": deploy_packet["leaseRequiredCommands"],
            "commandPacketRiskFlags": command_packet["riskFlags"],
            "commandPacketExecutionAllowed": command_packet["executionAllowed"],
            "commandBrokerProductionCommands": command_broker_production["registeredCommands"],
            "commandBrokerRuntimeFiles": command_broker_production["runtimeFiles"],
        },
        "workLanes": lanes,
        "safeNextActions": safe_next_actions,
        "blockedActions": blocked_actions,
        "runtimeReports": reports,
        "registry": registry,
        "connectors": connectors,
        "autonomousPolicy": autonomous_policy,
        "codeReview": code_review,
        "toolMatrix": tool_matrix,
        "webSirinxDeploy": web_deploy,
        "webSirinxDeployPacket": deploy_packet,
        "commandPacket": command_packet,
        "commandBrokerProduction": command_broker_production,
        "broker": broker,
        "projectDocs": docs,
        "obsidian": obsidian_snapshot(),
        "policyBoundary": [
            "fixture_only_no_browser_file_access",
            "no_secret_read_or_print",
            "no_provider_call",
            "no_connector_write",
            "no_clone_execution",
            "no_push",
            "no_deploy",
            "blocked_decision_does_not_become_bypass",
        ],
    }


def build_markdown(board: dict[str, Any]) -> str:
    lines = [
        "# Codex Goal Plan Board",
        "",
        f"- Created: `{board['updatedAt']}`",
        f"- Mode: `{board['mode']}`",
        f"- Overall status: `{board['summary']['overallStatus']}`",
        f"- Control node: `{board['controlNode']['label']}`",
        f"- Execution route: `{board['controlNode']['executionRoute']}`",
        "",
        "## Work Lanes",
        "",
    ]
    for lane in board["workLanes"]:
        lines.append(f"- `{lane['status']}` **{lane['label']}** - {lane['nextAction']}")
        lines.append(f"  - Source: `{lane['source']}`")
    lines.extend(["", "## Safe Next Actions", ""])
    lines.extend(f"- {item}" for item in board["safeNextActions"])
    lines.extend(["", "## Blocked Actions", ""])
    lines.extend(f"- `{item}`" for item in board["blockedActions"])
    lines.extend(["", "## Runtime Reports", ""])
    for key, report in board["runtimeReports"].items():
        lines.append(f"- `{key}`: `{report['status']}` at `{report['path']}`")
    lines.extend(["", "## Code Review", ""])
    lines.append(f"- Status: `{board['codeReview']['status']}`")
    lines.append(f"- Report: `{board['codeReview']['path']}`")
    lines.append(f"- Source: `{board['codeReview']['sourcePath']}`")
    lines.extend(["", "## Boundary", ""])
    lines.extend(f"- `{item}`" for item in board["policyBoundary"])
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    board = build_board()
    json_path = runtime_path("logs", "codex_goal_plan_board.json")
    markdown_path = runtime_path("logs", "codex_goal_plan_board.md")
    write_json(json_path, board)
    write_text(markdown_path, build_markdown(board))
    write_json(FIXTURE_PATH, board)
    print(
        json.dumps(
            {
                "fixture": str(FIXTURE_PATH),
                "json_report": str(json_path),
                "markdown_report": str(markdown_path),
                "work_lanes": board["summary"]["workLaneCount"],
                "blocked_actions": board["summary"]["blockedActionCount"],
                "overall_status": board["summary"]["overallStatus"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
