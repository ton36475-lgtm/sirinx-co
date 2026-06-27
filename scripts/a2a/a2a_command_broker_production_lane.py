#!/usr/bin/env python3
"""Build the production command-broker lane without executing commands.

This generator creates machine-readable registries, policies, schemas, and a
Mission Control fixture for the command broker. It never runs a command from
the registry.
"""

from __future__ import annotations

import json
import os
from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, read_json, runtime_path, sha256_text, write_json, write_text
from a2a_command_broker import load_policy

REPO_ROOT = Path(__file__).resolve().parents[2]
RUNTIME_ROOT = Path(
    os.path.expanduser(
        os.environ.get("COMMAND_BROKER_RUNTIME_ROOT", "~/SIRINXDev/.ghostclaw_runtime/command_broker")
    )
)
FIXTURE_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "commandBrokerProductionStatus.json"
)
CONTRACT_PACKAGE_ROOT = REPO_ROOT / "packages" / "command-broker"
WEB_DEPLOY_PACKET_PATH = runtime_path("logs", "web_sirinx_deploy_packet.json")
REPORT_JSON_PATH = runtime_path("logs", "command_broker_production_lane.json")
REPORT_MD_PATH = runtime_path("logs", "command_broker_production_lane.md")

RUNTIME_DIRS = [
    "registry",
    "policies",
    "requests",
    "results",
    "logs",
    "locks",
    "schemas",
    "state",
]

RISK_TIERS = [
    {
        "id": "T0",
        "label": "Read only",
        "defaultDecision": "ALLOW_READONLY",
        "examples": ["git status", "list files", "read docs", "inspect architecture"],
    },
    {
        "id": "T1",
        "label": "Local validation",
        "defaultDecision": "ALLOW_LOCAL_VALIDATION",
        "examples": ["lint", "unit tests", "typecheck", "static asset scan"],
    },
    {
        "id": "T2",
        "label": "Scoped file generation",
        "defaultDecision": "ALLOW_SCOPED_WRITE",
        "examples": ["generate docs", "create non-destructive patches", "write local runtime artifacts"],
    },
    {
        "id": "T3",
        "label": "Risky local mutation",
        "defaultDecision": "REQUIRE_HUMAN_REVIEW",
        "examples": ["install dependencies", "database migration", "overwrite files"],
    },
    {
        "id": "T4",
        "label": "External or production action",
        "defaultDecision": "REQUIRE_HUMAN_REVIEW",
        "examples": ["deploy", "push", "connector write", "provider call"],
    },
    {
        "id": "T5",
        "label": "Always denied",
        "defaultDecision": "DENY",
        "examples": ["exfiltrate credentials", "disable logging", "bypass access control"],
    },
]

ADAPTER_CONTRACTS = [
    {
        "adapter": "docker_localhost_start",
        "status": "registered_validator_contract",
        "requiredChecks": ["loopback_bind", "auth_required", "rollback_command"],
        "defaultDecision": "REQUIRE_HUMAN_REVIEW",
        "allowedToExecute": False,
    },
    {
        "adapter": "external_repo_clone",
        "status": "registered_validator_contract",
        "requiredChecks": ["repo_allowlist", "path_under_external_repos", "repo_verified"],
        "defaultDecision": "REQUIRE_HUMAN_REVIEW",
        "allowedToExecute": False,
    },
    {
        "adapter": "provider_api_smoke",
        "status": "registered_validator_contract",
        "requiredChecks": ["provider_allowlist", "key_presence_boolean", "budget_cap", "rate_limit_key"],
        "defaultDecision": "REQUIRE_HUMAN_REVIEW",
        "allowedToExecute": False,
    },
    {
        "adapter": "mcp_connector_activation",
        "status": "registered_validator_contract",
        "requiredChecks": ["connector_allowlist", "auth_required", "scope_bound", "no_external_write"],
        "defaultDecision": "REQUIRE_HUMAN_REVIEW",
        "allowedToExecute": False,
    },
]

DENY_ALWAYS = [
    "approve_all_actions",
    "security_controls_none",
    "bypass_access_control",
    "bypass_rate_limits",
    "disable_logging",
    "disable_monitoring",
    "hide_execution_history",
    "modify_audit_trail",
    "exfiltrate_credentials",
    "print_secret",
    "read_private_key",
    "git_add_all",
    "rm_rf_root",
    "production_deploy_without_evidence",
]

DECISION_ORDER = [
    "ALLOW_READONLY",
    "ALLOW_LOCAL_VALIDATION",
    "ALLOW_SCOPED_WRITE",
    "REQUIRE_HUMAN_REVIEW",
    "DENY",
    "ESCALATE_INCIDENT",
]


def broker_runtime_path(*parts: str) -> Path:
    return RUNTIME_ROOT.joinpath(*parts)


def ensure_broker_runtime() -> None:
    for item in RUNTIME_DIRS:
        broker_runtime_path(item).mkdir(parents=True, exist_ok=True)


def write_json_runtime(relative_path: str, payload: Any) -> str:
    path = broker_runtime_path(relative_path)
    write_json(path, payload)
    return str(path)


def write_text_runtime(relative_path: str, payload: str) -> str:
    path = broker_runtime_path(relative_path)
    write_text(path, payload)
    return str(path)


def touch_log(relative_path: str) -> str:
    path = broker_runtime_path(relative_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.touch(exist_ok=True)
    return str(path)


def command_tier(command: dict[str, Any]) -> str:
    action = str(command.get("action", ""))
    decision = str(command.get("brokerDecision", ""))
    if action in {"web_sirinx_pages_deploy", "deploy", "push"} or decision == "blocked_first_phase":
        return "T4"
    if decision == "requires_executor_lease":
        return "T3"
    if decision == "auto_allow_dry_run":
        if action in {"run_unit_tests", "web_sirinx_build_validation"}:
            return "T1"
        return "T0"
    if decision == "blocked":
        return "T5"
    return "T2"


def command_decision(tier: str) -> str:
    for risk in RISK_TIERS:
        if risk["id"] == tier:
            return str(risk["defaultDecision"])
    return "DENY"


def load_web_deploy_commands() -> list[dict[str, Any]]:
    if not WEB_DEPLOY_PACKET_PATH.exists():
        return []
    try:
        packet = read_json(WEB_DEPLOY_PACKET_PATH)
    except (OSError, ValueError):
        return []
    commands = packet.get("commands", [])
    return commands if isinstance(commands, list) else []


def build_command_registry(policy: dict[str, Any]) -> list[dict[str, Any]]:
    commands: list[dict[str, Any]] = []
    for row in load_web_deploy_commands():
        tier = command_tier(row)
        command_preview = str(row.get("commandPreview", ""))
        commands.append(
            {
                "id": row.get("id", ""),
                "lane": "LANE_WEB_SIRINX_CLOUDFLARE_PAGES_DEPLOY",
                "tool": "codex-local",
                "action": row.get("action", ""),
                "label": row.get("label", ""),
                "riskTier": tier,
                "brokerDecision": row.get("brokerDecision", ""),
                "productionDecision": command_decision(tier),
                "requiredGate": row.get("requiredGate", ""),
                "commandSha256": row.get("commandSha256") or sha256_text(command_preview),
                "commandPreview": command_preview,
                "executeByBroker": False,
            }
        )

    for action in policy.get("hard_blocked_actions", []):
        commands.append(
            {
                "id": f"deny_{action}",
                "lane": "GLOBAL_DENY_ALWAYS",
                "tool": "*",
                "action": action,
                "label": action.replace("_", " "),
                "riskTier": "T5",
                "brokerDecision": "blocked",
                "productionDecision": "DENY",
                "requiredGate": "security_policy_change_required",
                "commandSha256": "",
                "commandPreview": "",
                "executeByBroker": False,
            }
        )
    return commands


def build_schemas() -> dict[str, dict[str, Any]]:
    common_string = {"type": "string"}
    return {
        "command-request.schema.json": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "Command Broker Request",
            "type": "object",
            "required": ["requestId", "tool", "action", "riskTier", "goal", "createdAt"],
            "properties": {
                "requestId": common_string,
                "tool": common_string,
                "action": common_string,
                "riskTier": {"enum": [row["id"] for row in RISK_TIERS]},
                "goal": common_string,
                "commandSha256": common_string,
                "createdAt": common_string,
            },
            "additionalProperties": True,
        },
        "command-result.schema.json": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "Command Broker Result",
            "type": "object",
            "required": ["requestId", "decision", "reason", "createdAt"],
            "properties": {
                "requestId": common_string,
                "decision": {"enum": DECISION_ORDER},
                "reason": common_string,
                "auditRef": common_string,
                "createdAt": common_string,
            },
            "additionalProperties": True,
        },
        "command-policy.schema.json": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "Command Broker Policy",
            "type": "object",
            "required": ["version", "riskTiers", "denyAlways"],
            "properties": {
                "version": common_string,
                "riskTiers": {"type": "array"},
                "denyAlways": {"type": "array", "items": common_string},
            },
            "additionalProperties": True,
        },
        "command-audit.schema.json": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "Command Broker Audit Event",
            "type": "object",
            "required": ["eventId", "requestId", "decision", "createdAt"],
            "properties": {
                "eventId": common_string,
                "requestId": common_string,
                "decision": {"enum": DECISION_ORDER},
                "createdAt": common_string,
            },
            "additionalProperties": True,
        },
    }


def build_status() -> dict[str, Any]:
    ensure_runtime()
    ensure_broker_runtime()
    policy = load_policy()
    commands = build_command_registry(policy)
    tier_counts = dict(Counter(row["riskTier"] for row in commands))
    decision_counts = dict(Counter(row["productionDecision"] for row in commands))
    blocked_commands = [row for row in commands if row["productionDecision"] in {"DENY", "REQUIRE_HUMAN_REVIEW"}]

    tool_routes = policy.get("tool_routes", {})
    registries = {
        "registry/commands.json": commands,
        "registry/tools.json": [
            {
                "tool": tool,
                "role": route.get("role", ""),
                "allowedActions": route.get("allowed_actions", []),
                "blockedActions": route.get("blocked_actions", []),
                "leaseRequiredActions": route.get("lease_required_actions", []),
            }
            for tool, route in sorted(tool_routes.items())
        ],
        "registry/adapters.json": ADAPTER_CONTRACTS,
        "registry/capabilities.json": [
            {"capability": "command_visibility", "enabled": True},
            {"capability": "command_execution", "enabled": False},
            {"capability": "secret_viewing", "enabled": False},
            {"capability": "audit_log_editing", "enabled": False},
            {"capability": "deploy_from_broker", "enabled": False},
        ],
    }

    policy_files = {
        "policies/default.policy.json": {
            "version": "ghostclaw-command-broker-default-v1",
            "defaultDecision": "DENY",
            "riskTiers": RISK_TIERS,
            "denyAlways": DENY_ALWAYS,
        },
        "policies/production.policy.json": {
            "version": "ghostclaw-command-broker-production-v1",
            "mode": "brokered_command_visibility",
            "directShellExecution": False,
            "allowApproveAll": False,
            "requireAuditLog": True,
            "requireDiffForRepoWrites": True,
            "requireRollbackForT3T4": True,
            "riskTiers": RISK_TIERS,
        },
        "policies/destructive-actions.policy.json": {
            "version": "ghostclaw-destructive-actions-v1",
            "defaultDecision": "DENY",
            "actions": ["delete_or_overwrite_files", "rm_rf_root", "database_migration", "drop_table"],
        },
        "policies/connector-sync.policy.json": {
            "version": "ghostclaw-connector-sync-v1",
            "defaultDecision": "REQUIRE_HUMAN_REVIEW",
            "requiredTargets": ["airtable_base_table", "linear_workspace_team", "notion_parent", "github_owner_repo"],
            "externalWritesEnabledByDefault": False,
        },
        "policies/secrets.policy.json": {
            "version": "ghostclaw-secrets-v1",
            "defaultDecision": "DENY",
            "forbidden": ["print_secret", "read_private_key", "copy_token_store", "read_browser_profile"],
            "maskingRequired": True,
        },
    }

    runtime_files: list[str] = []
    for relative, payload in registries.items():
        runtime_files.append(write_json_runtime(relative, payload))
    for relative, payload in policy_files.items():
        runtime_files.append(write_json_runtime(relative, payload))
    for relative, payload in build_schemas().items():
        runtime_files.append(write_json_runtime(f"schemas/{relative}", payload))

    runtime_files.extend(
        [
            touch_log("logs/command-audit.jsonl"),
            touch_log("logs/command-denied.jsonl"),
            touch_log("logs/command-execution.jsonl"),
            touch_log("logs/incidents.jsonl"),
            write_json_runtime(
                "locks/NO_ACTIVE_LOCKS.json",
                {
                    "createdAt": now_iso(),
                    "activeLocks": [],
                    "note": "Broker lane generator does not open execution locks.",
                },
            ),
        ]
    )

    status = {
        "updatedAt": now_iso(),
        "mode": "production_command_broker_scaffold_no_execution",
        "generatedBy": "scripts/a2a/a2a_command_broker_production_lane.py",
        "runtimeRoot": str(RUNTIME_ROOT),
        "summary": {
            "registeredCommands": len(commands),
            "registeredTools": len(tool_routes),
            "adapterContracts": len(ADAPTER_CONTRACTS),
            "runtimeFiles": len(runtime_files),
            "contractPackagePresent": CONTRACT_PACKAGE_ROOT.exists(),
            "riskTierCounts": tier_counts,
            "decisionCounts": decision_counts,
            "denyAlwaysCount": len(DENY_ALWAYS),
            "directExecutionEnabled": False,
            "deployCommandAllowed": False,
            "auditLogEditable": False,
            "status": "ready_for_review_no_execution",
        },
        "contractPackage": {
            "name": "@sirinx/command-broker",
            "path": str(CONTRACT_PACKAGE_ROOT),
            "entrypoint": str(CONTRACT_PACKAGE_ROOT / "src" / "index.ts"),
            "testFile": str(CONTRACT_PACKAGE_ROOT / "src" / "index.test.ts"),
            "executionEnabled": False,
        },
        "riskTiers": RISK_TIERS,
        "decisions": DECISION_ORDER,
        "blockedCommands": blocked_commands[:20],
        "runtimeFiles": runtime_files,
        "policyBoundary": [
            "unlock_visibility_not_security_bypass",
            "no_direct_shell_execution",
            "no_approve_all",
            "no_secret_reading",
            "no_git_add_dot",
            "no_stage_commit_push_deploy",
            "no_provider_or_connector_write",
            "audit_every_decision",
            "deny_unknown_commands",
        ],
        "nextSafeActions": [
            "Review Mission Control Command Broker panel.",
            "Run validation commands for this lane only.",
            "Open a separate executor lease if check/test/build should run.",
            "Keep Cloudflare deploy blocked until evidence and rollback are complete.",
        ],
    }
    write_json_runtime("state/status.json", status)
    write_json(REPORT_JSON_PATH, status)
    write_json(FIXTURE_PATH, status)
    write_text(REPORT_MD_PATH, build_markdown(status))
    return status


def build_markdown(status: dict[str, Any]) -> str:
    lines = [
        "# Command Broker Production Lane",
        "",
        f"- Updated: `{status['updatedAt']}`",
        f"- Mode: `{status['mode']}`",
        f"- Runtime root: `{status['runtimeRoot']}`",
        f"- Status: `{status['summary']['status']}`",
        f"- Registered commands: `{status['summary']['registeredCommands']}`",
        f"- Adapter contracts: `{status['summary']['adapterContracts']}`",
        f"- Runtime files: `{status['summary']['runtimeFiles']}`",
        f"- Contract package present: `{status['summary']['contractPackagePresent']}`",
        f"- Direct execution enabled: `{status['summary']['directExecutionEnabled']}`",
        f"- Deploy command allowed: `{status['summary']['deployCommandAllowed']}`",
        "",
        "## Risk Tiers",
        "",
    ]
    for tier in status["riskTiers"]:
        lines.append(f"- `{tier['id']}` {tier['label']} -> `{tier['defaultDecision']}`")
    lines.extend(["", "## Decision Counts", ""])
    for decision, count in status["summary"]["decisionCounts"].items():
        lines.append(f"- `{decision}`: `{count}`")
    lines.extend(["", "## Boundary", ""])
    lines.extend(f"- `{item}`" for item in status["policyBoundary"])
    lines.extend(["", "## Next Safe Actions", ""])
    lines.extend(f"- {item}" for item in status["nextSafeActions"])
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    status = build_status()
    print(
        json.dumps(
            {
                "fixture": str(FIXTURE_PATH),
                "json_report": str(REPORT_JSON_PATH),
                "markdown_report": str(REPORT_MD_PATH),
                "runtime_root": status["runtimeRoot"],
                "status": status["summary"]["status"],
                "registered_commands": status["summary"]["registeredCommands"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
