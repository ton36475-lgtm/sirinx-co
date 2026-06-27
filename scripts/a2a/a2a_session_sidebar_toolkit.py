#!/usr/bin/env python3
"""Build a read-only Codex session sidebar toolkit manifest.

The toolkit is a local control-surface summary for Codex, KOB, Hermes,
OpenCode, AGY Antigravity 2, Manus, A2A runtime reports, command broker
actions, and registered Git repositories. It does not execute commands.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, parse_registry_entries, read_json, runtime_path, write_json, write_text

REPO_ROOT = Path(__file__).resolve().parents[2]
AGENT_DIR = REPO_ROOT / "agents" / "a2a"
BROKER_POLICY = REPO_ROOT / "policies" / "codex_command_broker.json"
COMMAND_BROKER_PRODUCTION_FIXTURE = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "commandBrokerProductionStatus.json"
)
FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "codexSessionSidebarToolkitStatus.json"

RUNTIME_REPORTS = {
    "goal_coverage": runtime_path("logs", "goal_coverage_audit.json"),
    "goal_plan_board": runtime_path("logs", "codex_goal_plan_board.json"),
    "tool_repo_matrix": runtime_path("logs", "codex_tool_repo_matrix.json"),
    "broker_validation": runtime_path("logs", "broker_status_validation.json"),
    "command_broker_production": runtime_path("logs", "command_broker_production_lane.json"),
    "a2a_readiness": runtime_path("logs", "a2a_integration_readiness_matrix.json"),
    "executor_lease_requests": runtime_path("logs", "executor_lease_requests.json"),
    "deep_research_system": runtime_path("logs", "deep_research_system_design.json"),
}

SIDEBAR_DOCS = [
    "docs/a2async/CODEX_SIDEBAR_CONTROL_PLANE.md",
    "docs/a2async/A2A_CODEX_SIDEBAR_AUTOFLOW_V3.md",
    "docs/a2async/CODEX_COMMAND_BROKER_TOOL_GITREPO_INTEGRATION.md",
    "docs/a2async/A2A_GOAL_COVERAGE_AUDIT.md",
    "docs/a2async/A2A_INTEGRATION_READINESS_MATRIX.md",
    "docs/a2async/A2A_SCOPED_LANE_STAGING_GUARD.md",
    "docs/a2async/A2A_EXECUTOR_LEASE_REQUEST_PACKETS.md",
    "docs/a2async/OPENCODE_AGY_EXECUTOR_CONTRACT.md",
    "docs/a2async/LOCAL_CODEX_KOB_MANUS_A2A_RUNBOOK.md",
]


def load_json_if_exists(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = read_json(path)
    except (OSError, ValueError):
        return {}
    return data if isinstance(data, dict) else {}


def load_agent_cards(policy: dict[str, Any]) -> list[dict[str, Any]]:
    routes = policy.get("tool_routes", {})
    cards: list[dict[str, Any]] = []
    for path in sorted(AGENT_DIR.glob("*.agent.json")):
        card = load_json_if_exists(path)
        agent_id = str(card.get("agent_id") or path.stem.removesuffix(".agent"))
        route = routes.get(agent_id, {})
        cards.append(
            {
                "agentId": agent_id,
                "name": card.get("name", agent_id),
                "role": route.get("role") or card.get("role", ""),
                "runtime": card.get("runtime", "unknown"),
                "localOnly": card.get("local_only") is True,
                "brokerRouted": agent_id in routes,
                "allowedActions": route.get("allowed_actions", []),
                "leaseRequiredActions": route.get("lease_required_actions", []),
                "blockedActions": route.get("blocked_actions", []),
                "path": str(path.relative_to(REPO_ROOT)),
            }
        )
    return cards


def summarize_reports() -> dict[str, Any]:
    reports: dict[str, Any] = {}
    present_count = 0
    for key, path in RUNTIME_REPORTS.items():
        data = load_json_if_exists(path)
        present = bool(data)
        if present:
            present_count += 1
        status = (
            data.get("overall", {}).get("status")
            or data.get("overall_status")
            or data.get("summary", {}).get("overallStatus")
            or data.get("summary", {}).get("status")
            or ("present" if present else "missing")
        )
        reports[key] = {
            "exists": present,
            "path": str(path),
            "status": status,
        }
    return {
        "present": present_count,
        "expected": len(RUNTIME_REPORTS),
        "items": reports,
    }


def summarize_repos() -> dict[str, Any]:
    entries = parse_registry_entries()
    counts = Counter(entry.get("clone_policy", "missing") for entry in entries)
    return {
        "registered": len(entries),
        "clonePolicyCounts": dict(sorted(counts.items())),
        "execution": "registry_only_no_clone",
    }


def summarize_policy(policy: dict[str, Any]) -> dict[str, Any]:
    action_classes = policy.get("action_classes", {})
    return {
        "mode": policy.get("mode", {}),
        "toolRouteCount": len(policy.get("tool_routes", {})),
        "autoAllowDryRun": action_classes.get("auto_allow_dry_run", []),
        "requiresExecutorLease": action_classes.get("requires_executor_lease", []),
        "blockedFirstPhase": action_classes.get("blocked_first_phase", []),
        "hardBlockedActions": policy.get("hard_blocked_actions", []),
    }


def build_workflows() -> list[dict[str, Any]]:
    return [
        {
            "id": "plan_route_execute_local",
            "name": "KOB plans, Codex local executes",
            "steps": [
                "user_goal",
                "kob_plan_or_context_compression",
                "a2a_task_manifest",
                "codex_command_broker_decision",
                "codex_local_patch_or_report",
                "validation",
                "obsidian_pulse",
            ],
            "execution": "dry_run_or_scoped_local_only",
        },
        {
            "id": "hermes_policy_review",
            "name": "Hermes policy review",
            "steps": [
                "route_to_hermes_project_planner",
                "risk_review",
                "policy_review",
                "return_broker_constraints",
            ],
            "execution": "plan_only",
        },
        {
            "id": "manus_artifact_hash_sync",
            "name": "Manus artifact hash sync",
            "steps": [
                "export_artifact_to_mac",
                "hash_and_manifest",
                "codex_review",
                "a2a_artifact_record",
            ],
            "execution": "metadata_and_hash_only",
        },
        {
            "id": "opencode_agy_executor_candidate",
            "name": "OpenCode / AGY executor candidate",
            "steps": [
                "broker_classification",
                "executor_lease",
                "lane_lock",
                "dry_run_command_plan",
                "codex_local_review",
            ],
            "execution": "lease_required_no_direct_shell",
        },
        {
            "id": "git_repo_registry",
            "name": "Git repo registry",
            "steps": [
                "registry_validate",
                "readonly_audit_plan",
                "clone_lane_only_after_policy",
            ],
            "execution": "no_clone_in_toolkit",
        },
    ]


def build_sync_queue(reports: dict[str, Any], repos: dict[str, Any]) -> dict[str, Any]:
    items = [
        {
            "id": "session-toolkit-review",
            "label": "Review Mission Control Session Toolkit panel",
            "owner": "codex-local",
            "route": "codex-local -> mission-control",
            "status": "ready",
            "decision": "auto_allow_dry_run",
            "requiredGate": "local_review_only",
            "source": "apps/mission-control/src/fixtures/codexSessionSidebarToolkitStatus.json",
            "nextAction": "Review the read-only panel and scoped lane report before staging.",
            "blockedActions": ["push", "deploy", "connector_write", "provider_call"],
        },
        {
            "id": "kob-hermes-context-sync",
            "label": "KOB and Hermes planning context sync",
            "owner": "kob-cli-opus + hermes-project-planner",
            "route": "kob/hermes plan -> codex-local executes",
            "status": "ready",
            "decision": "auto_allow_dry_run",
            "requiredGate": "context_summary_only",
            "source": "agents/a2a/kob-cli-opus.agent.json",
            "nextAction": "Keep KOB as planner/router and Codex local as the only repo executor.",
            "blockedActions": ["repo_mutation_from_kob", "provider_secret_dump"],
        },
        {
            "id": "tool-repo-matrix-refresh",
            "label": "Refresh all-tool and all-repo matrix",
            "owner": "codex-local",
            "route": "registry + agent cards -> runtime matrix",
            "status": "ready",
            "decision": "auto_allow_dry_run",
            "requiredGate": "runtime_report_only",
            "source": "scripts/a2a/a2a_codex_tool_repo_matrix.py",
            "nextAction": "Refresh matrix when agent cards, broker routes, or repo registry change.",
            "blockedActions": ["clone_repo", "install_dependency", "start_service"],
        },
        {
            "id": "external-repo-registry-audit",
            "label": "Prepare external Git repo registry audit",
            "owner": "codex-local",
            "route": "registry validate -> audit packet",
            "status": "lease_required",
            "decision": "requires_executor_lease",
            "requiredGate": "repo_audit_lane",
            "source": "registry/external_git_repos.yaml",
            "nextAction": f"Validate {repos['registered']} registered repos before any clone lane.",
            "blockedActions": ["clone_repo", "install_dependency", "docker_start"],
        },
        {
            "id": "manus-artifact-hash-sync",
            "label": "Sync exported Manus artifacts by hash",
            "owner": "manus + codex-local",
            "route": "manus export -> hash manifest -> codex review",
            "status": "ready",
            "decision": "auto_allow_dry_run",
            "requiredGate": "metadata_and_hash_only",
            "source": "docs/a2async/A2A_MANUS_SYNC.md",
            "nextAction": "Hash exported files after they exist on Mac; do not automate Manus UI.",
            "blockedActions": ["direct_repo_mutation", "browser_profile_copy", "provider_call"],
        },
        {
            "id": "connector-target-binding-review",
            "label": "Bind Airtable, Linear, Notion, and GitHub connector targets",
            "owner": "hermes-project-planner",
            "route": "payload review -> target IDs -> scoped connector packet",
            "status": "blocked",
            "decision": "blocked_first_phase",
            "requiredGate": "target_ids_required",
            "source": "policies/tool_integration_targets.yaml",
            "nextAction": "Provide scoped target IDs before connector sync can leave local draft mode.",
            "blockedActions": ["connector_write", "external_api_write_actions"],
        },
        {
            "id": "web-sirinx-generated-assets-lane",
            "label": "Handle generated web-sirinx assets and deploy backlog",
            "owner": "codex-local",
            "route": "dist manifest -> validation -> deploy packet",
            "status": "lease_required",
            "decision": "requires_executor_lease",
            "requiredGate": "generated_assets_lane",
            "source": "docs/a2async/WEB_SIRINX_GENERATED_ASSETS_DEPLOY_LANE.md",
            "nextAction": "Keep generated assets out of this toolkit lane and review separately.",
            "blockedActions": ["deploy", "push", "generated_asset_mutation"],
        },
        {
            "id": "deep-research-fixture-panel",
            "label": "Review Deep Research Mission Control fixture",
            "owner": "codex-local",
            "route": "deep research report -> Mission Control read-only panel",
            "status": "ready",
            "decision": "auto_allow_dry_run",
            "requiredGate": "local_fixture_only",
            "source": str(reports["items"]["deep_research_system"]["path"]),
            "nextAction": "Use the read-only panel, then build the local job-packet factory before retrieval lanes.",
            "blockedActions": ["web_scraping", "provider_call", "gpu_model_loading"],
        },
        {
            "id": "executor-lease-preflight-panel",
            "label": "Create executor lease preflight panel",
            "owner": "codex-local + command-broker",
            "route": "broker decisions -> lease preflight fixture",
            "status": "ready",
            "decision": "auto_allow_dry_run",
            "requiredGate": "preflight_report_only",
            "source": "packages/command-broker/src/index.ts",
            "nextAction": "Expose lease requirements before any OpenCode, AGY, clone, Docker, or deploy executor lane.",
            "blockedActions": ["execute_unknown_command", "modify_audit_trail", "approve_all_without_broker"],
        },
        {
            "id": "obsidian-brain-pulse",
            "label": "Append concise Obsidian brain pulse",
            "owner": "codex-local",
            "route": "runtime evidence -> concise memory pulse",
            "status": "ready",
            "decision": "auto_allow_dry_run",
            "requiredGate": "no_secrets_no_raw_logs",
            "source": "scripts/a2a/a2a_obsidian_sync.py",
            "nextAction": "Write concise pulses only after meaningful local work.",
            "blockedActions": ["secret_printing", "raw_log_dump", "frontmatter_rewrite"],
        },
    ]
    counts = Counter(item["status"] for item in items)
    return {
        "mode": "local_read_only_task_queue",
        "items": items,
        "counts": dict(sorted(counts.items())),
    }


def build_integration_readiness(
    agents: list[dict[str, Any]],
    repos: dict[str, Any],
    reports: dict[str, Any],
    policy_summary: dict[str, Any],
    sync_queue: dict[str, Any],
    executor_preflight: dict[str, Any],
) -> dict[str, Any]:
    """Summarize the local readiness of every visible tool/repo integration lane."""
    by_id = {str(agent["agentId"]): agent for agent in agents}

    def agent_ready(agent_id: str) -> bool:
        agent = by_id.get(agent_id, {})
        return bool(agent.get("brokerRouted") and agent.get("localOnly"))

    rows = [
        {
            "id": "codex-local-executor",
            "surface": "Codex Local",
            "role": "repo executor, patch writer, test runner",
            "status": "ready" if agent_ready("codex-local") else "missing",
            "decision": "auto_allow_dry_run",
            "evidence": "agents/a2a/codex-local.agent.json",
            "nextAction": "Use Codex local for repo edits and validation only.",
            "blockedActions": ["provider_call", "push", "deploy"],
        },
        {
            "id": "kob-planner-router",
            "surface": "KOB CLI",
            "role": "planner, router, context compression",
            "status": "ready" if agent_ready("kob-cli-opus") and agent_ready("kob-cli-fable") else "partial",
            "decision": "auto_allow_dry_run",
            "evidence": "kob-cli-opus + kob-cli-fable agent cards",
            "nextAction": "Keep KOB out of direct repo mutation.",
            "blockedActions": ["repo_mutation", "provider_secret_dump"],
        },
        {
            "id": "hermes-policy-review",
            "surface": "Hermes",
            "role": "policy, risk, and route review",
            "status": "ready" if agent_ready("hermes-project-planner") else "missing",
            "decision": "auto_allow_dry_run",
            "evidence": "agents/a2a/hermes-project-planner.agent.json",
            "nextAction": "Use Hermes as policy reviewer before executor lanes.",
            "blockedActions": ["repo_mutation"],
        },
        {
            "id": "opencode-executor-candidate",
            "surface": "OpenCode",
            "role": "optional scoped executor candidate",
            "status": "lease_required" if agent_ready("opencode") else "missing",
            "decision": "requires_executor_lease",
            "evidence": "agents/a2a/opencode.agent.json",
            "nextAction": "Create executor lease before any OpenCode command leaves plan mode.",
            "blockedActions": ["unknown_shell", "provider_key_capture", "direct_repo_mutation"],
        },
        {
            "id": "agy-antigravity2-executor-candidate",
            "surface": "AGY Antigravity 2",
            "role": "optional scoped scaffold/refactor executor",
            "status": "lease_required" if agent_ready("agy-antigravity2") else "missing",
            "decision": "requires_executor_lease",
            "evidence": "agents/a2a/agy-antigravity2.agent.json",
            "nextAction": "Verify binary and create scoped lease before any execution.",
            "blockedActions": ["install_cli", "unknown_shell", "direct_repo_mutation"],
        },
        {
            "id": "manus-artifact-sync",
            "surface": "Manus",
            "role": "artifact producer, hash-sync only",
            "status": "ready" if agent_ready("manus") else "missing",
            "decision": "auto_allow_dry_run",
            "evidence": "agents/a2a/manus.agent.json",
            "nextAction": "Sync exported files by hash after they are local on Mac.",
            "blockedActions": ["automate_manus_ui", "copy_browser_profile", "direct_repo_mutation"],
        },
        {
            "id": "external-git-repo-registry",
            "surface": "Git Repos",
            "role": "external repo registry and audit planning",
            "status": "lease_required" if repos["registered"] else "missing",
            "decision": "requires_executor_lease",
            "evidence": f"{repos['registered']} registered repos",
            "nextAction": "Run clone/audit only through a dedicated repo lane.",
            "blockedActions": ["clone_repo", "install_dependency", "docker_start"],
        },
        {
            "id": "connector-sync",
            "surface": "Airtable/Linear/Notion/GitHub",
            "role": "scoped connector sync targets",
            "status": "blocked" if sync_queue["counts"].get("blocked", 0) else "ready",
            "decision": "blocked_first_phase",
            "evidence": "target IDs are intentionally unbound",
            "nextAction": "Bind target IDs before any connector write lane.",
            "blockedActions": ["connector_write", "external_api_write_actions"],
        },
        {
            "id": "command-broker",
            "surface": "Command Broker",
            "role": "decision engine and executor lease preflight",
            "status": "ready"
            if executor_preflight["summary"]["registeredCommands"]
            and executor_preflight["summary"]["executionEnabledCommands"] == 0
            else "partial",
            "decision": "broker_locked",
            "evidence": f"{executor_preflight['summary']['registeredCommands']} registered commands; {executor_preflight['summary']['executionEnabledCommands']} execution-enabled",
            "nextAction": "Keep executeByBroker false until scoped lease evidence exists.",
            "blockedActions": ["approve_all_without_broker", "modify_audit_trail"],
        },
        {
            "id": "runtime-report-pack",
            "surface": "A2A Runtime",
            "role": "local reports, fixtures, patch evidence",
            "status": "ready" if reports["present"] == reports["expected"] else "partial",
            "decision": "auto_allow_dry_run",
            "evidence": f"{reports['present']}/{reports['expected']} reports present",
            "nextAction": "Refresh reports after each local control-plane change.",
            "blockedActions": ["raw_log_dump", "secret_printing"],
        },
        {
            "id": "obsidian-brain-sync",
            "surface": "Obsidian Brain",
            "role": "concise memory pulse",
            "status": "ready" if (REPO_ROOT / "scripts" / "a2a" / "a2a_obsidian_sync.py").exists() else "missing",
            "decision": "auto_allow_dry_run",
            "evidence": "scripts/a2a/a2a_obsidian_sync.py",
            "nextAction": "Append concise no-secret pulse after meaningful local work.",
            "blockedActions": ["secret_printing", "frontmatter_rewrite", "raw_log_dump"],
        },
    ]
    counts = Counter(str(row["status"]) for row in rows)
    return {
        "mode": "local_read_only_integration_readiness_matrix",
        "rows": rows,
        "counts": dict(sorted(counts.items())),
        "policy": {
            "autoAllowDryRunActions": len(policy_summary["autoAllowDryRun"]),
            "leaseRequiredActions": len(policy_summary["requiresExecutorLease"]),
            "hardBlockedActions": len(policy_summary["hardBlockedActions"]),
        },
    }


def load_runtime_records(*parts: str) -> list[dict[str, Any]]:
    root = runtime_path(*parts)
    records: list[dict[str, Any]] = []
    if not root.exists():
        return records
    for path in sorted(root.glob("*.json")):
        data = load_json_if_exists(path)
        if data:
            data["path"] = str(path)
            records.append(data)
    return records


def summarize_lease_requests() -> dict[str, Any]:
    report = load_json_if_exists(runtime_path("logs", "executor_lease_requests.json"))
    request_dir = runtime_path("state", "executor_lease_requests")
    if report:
        requests = report.get("requests", [])
        if not isinstance(requests, list):
            requests = []
        return {
            "mode": report.get("mode", "review_only_executor_lease_request_packets"),
            "status": report.get("status", "present"),
            "requestCount": int(report.get("request_count", len(requests))),
            "counts": report.get("counts", {}),
            "requestDir": report.get("request_dir", str(request_dir)),
            "requests": [
                {
                    "requestId": str(item.get("request_id", "")),
                    "sourceRowId": str(item.get("source_row_id", "")),
                    "surface": str(item.get("surface", "")),
                    "requestStatus": str(item.get("request_status", "")),
                    "executor": str(item.get("executor", "")),
                    "lane": str(item.get("lane", "")),
                    "path": str(item.get("path", "")),
                    "nextAction": str(item.get("next_action", "")),
                }
                for item in requests
            ],
        }
    return {
        "mode": "review_only_executor_lease_request_packets",
        "status": "missing",
        "requestCount": 0,
        "counts": {},
        "requestDir": str(request_dir),
        "requests": [],
    }


def build_executor_preflight() -> dict[str, Any]:
    production = load_json_if_exists(COMMAND_BROKER_PRODUCTION_FIXTURE)
    commands = production.get("blockedCommands", [])
    if not isinstance(commands, list):
        commands = []

    leases = load_runtime_records("state", "executor_leases")
    locks = load_runtime_records("state", "lane_locks")
    decision_counts = Counter(str(item.get("brokerDecision", "unknown")) for item in commands)
    tier_counts = Counter(str(item.get("riskTier", "unknown")) for item in commands)
    gate_counts = Counter(str(item.get("requiredGate", "unknown")) for item in commands)
    execution_enabled = [item for item in commands if item.get("executeByBroker") is True]
    requires_lease = [item for item in commands if item.get("brokerDecision") == "requires_executor_lease"]
    blocked_first_phase = [item for item in commands if item.get("brokerDecision") == "blocked_first_phase"]
    denied = [
        item
        for item in commands
        if item.get("brokerDecision") == "blocked" or str(item.get("productionDecision", "")).upper() == "DENY"
    ]

    requirements = [
        {
            "id": "command_hash_required",
            "status": "required",
            "detail": "Every executor command must carry a stable command SHA-256 before execution.",
        },
        {
            "id": "executor_lease_required",
            "status": "required",
            "detail": "T3 and executor actions need a runtime lease before leaving plan mode.",
        },
        {
            "id": "lane_lock_required",
            "status": "required",
            "detail": "Mutation lanes need a lane lock so KOB/OpenCode/AGY/Codex cannot edit the same lane concurrently.",
        },
        {
            "id": "runtime_evidence_required",
            "status": "required",
            "detail": "Each execution-capable command must write a runtime report before any staging decision.",
        },
        {
            "id": "direct_broker_execution_disabled",
            "status": "enforced",
            "detail": "The current broker and Mission Control fixture expose decisions only; they do not run commands.",
        },
    ]

    sample_commands = [
        {
            "id": str(item.get("id", "")),
            "label": str(item.get("label", "")),
            "tool": str(item.get("tool", "")),
            "lane": str(item.get("lane", "")),
            "riskTier": str(item.get("riskTier", "")),
            "brokerDecision": str(item.get("brokerDecision", "")),
            "productionDecision": str(item.get("productionDecision", "")),
            "requiredGate": str(item.get("requiredGate", "")),
            "executeByBroker": bool(item.get("executeByBroker")),
            "commandSha256": str(item.get("commandSha256", "")),
        }
        for item in commands[:12]
    ]

    status = "ready_for_preflight_review"
    warnings: list[str] = []
    if execution_enabled:
        status = "review_required_execution_enabled"
        warnings.append("execution_enabled_commands_present")

    return {
        "mode": "read_only_executor_lease_preflight",
        "status": status,
        "warnings": warnings,
        "source": str(COMMAND_BROKER_PRODUCTION_FIXTURE.relative_to(REPO_ROOT)),
        "summary": {
            "registeredCommands": len(commands),
            "requiresLease": len(requires_lease),
            "blockedFirstPhase": len(blocked_first_phase),
            "denied": len(denied),
            "activeLeases": len(leases),
            "activeLaneLocks": len(locks),
            "executionEnabledCommands": len(execution_enabled),
        },
        "decisionCounts": dict(sorted(decision_counts.items())),
        "riskTierCounts": dict(sorted(tier_counts.items())),
        "requiredGateCounts": dict(sorted(gate_counts.items())),
        "requirements": requirements,
        "sampleCommands": sample_commands,
        "activeLeases": [
            {
                "leaseId": str(item.get("lease_id", "")),
                "executor": str(item.get("executor", "")),
                "lane": str(item.get("lane", "")),
                "allowExecution": bool(item.get("allow_execution")),
                "path": str(item.get("path", "")),
            }
            for item in leases
        ],
        "activeLaneLocks": [
            {
                "lane": str(item.get("lane", "")),
                "executor": str(item.get("executor", "")),
                "leaseId": str(item.get("lease_id", "")),
                "status": str(item.get("status", "")),
                "path": str(item.get("path", "")),
            }
            for item in locks
        ],
        "nextActions": [
            "Create executor leases only through a dedicated scoped lane.",
            "Keep executeByBroker false until lane lock, validation, runtime evidence, and review pass.",
            "Never convert T5 deny commands into runnable commands from this panel.",
        ],
    }


def build_objective_audit(
    agents: list[dict[str, Any]],
    repos: dict[str, Any],
    reports: dict[str, Any],
    policy_summary: dict[str, Any],
    sync_queue: dict[str, Any],
    executor_preflight: dict[str, Any],
    integration_readiness: dict[str, Any],
) -> dict[str, Any]:
    by_id = {str(agent["agentId"]): agent for agent in agents}
    requirements = [
        {
            "id": "brokered_auto_approve_boundary",
            "label": "Auto-approve is brokered, not raw bypass",
            "status": "verified"
            if policy_summary["autoAllowDryRun"] and policy_summary["hardBlockedActions"]
            else "missing",
            "evidence": f"{len(policy_summary['autoAllowDryRun'])} dry-run actions, {len(policy_summary['hardBlockedActions'])} hard blocks",
            "nextAction": "Keep approve-all requests routed through Command Broker decisions.",
        },
        {
            "id": "codex_local_executor_route",
            "label": "Codex local is the repo executor",
            "status": "verified" if by_id.get("codex-local", {}).get("brokerRouted") else "missing",
            "evidence": "agents/a2a/codex-local.agent.json",
            "nextAction": "Use codex-local for repo edits, tests, patches, and validation.",
        },
        {
            "id": "kob_planner_routes",
            "label": "KOB planner/router profiles are registered",
            "status": "verified"
            if by_id.get("kob-cli-opus", {}).get("brokerRouted")
            and by_id.get("kob-cli-fable", {}).get("brokerRouted")
            else "missing",
            "evidence": "kob-cli-opus + kob-cli-fable agent cards",
            "nextAction": "Keep KOB in plan/route/context-compression mode.",
        },
        {
            "id": "hermes_policy_route",
            "label": "Hermes policy reviewer is registered",
            "status": "verified"
            if by_id.get("hermes-project-planner", {}).get("brokerRouted")
            else "missing",
            "evidence": "agents/a2a/hermes-project-planner.agent.json",
            "nextAction": "Use Hermes for policy/risk review before executor lanes.",
        },
        {
            "id": "all_agent_cards_broker_routed",
            "label": "All A2A agent cards are broker-routed",
            "status": "verified" if all(agent["brokerRouted"] for agent in agents) else "partial",
            "evidence": f"{len([agent for agent in agents if agent['brokerRouted']])}/{len(agents)} broker routed",
            "nextAction": "Add broker routes for any future agent cards before display.",
        },
        {
            "id": "external_git_repo_registry",
            "label": "External Git repo registry is visible",
            "status": "verified" if repos["registered"] > 0 else "missing",
            "evidence": f"{repos['registered']} registered repos; {repos['execution']}",
            "nextAction": "Open clone/audit only through a separate repo lane.",
        },
        {
            "id": "a2a_runtime_reports",
            "label": "A2A runtime evidence is present",
            "status": "verified" if reports["present"] == reports["expected"] else "partial",
            "evidence": f"{reports['present']}/{reports['expected']} runtime reports present",
            "nextAction": "Refresh runtime reports when routes or policies change.",
        },
        {
            "id": "session_sync_queue",
            "label": "Session sync queue exists",
            "status": "verified" if sync_queue["items"] else "missing",
            "evidence": f"{len(sync_queue['items'])} queue items",
            "nextAction": "Promote one ready item into a dedicated local fixture lane.",
        },
        {
            "id": "executor_lease_preflight",
            "label": "Executor lease preflight is visible",
            "status": "verified"
            if executor_preflight["status"] == "ready_for_preflight_review"
            and executor_preflight["summary"]["executionEnabledCommands"] == 0
            else "partial",
            "evidence": f"{executor_preflight['summary']['registeredCommands']} commands, {executor_preflight['summary']['executionEnabledCommands']} execution-enabled",
            "nextAction": "Create executor leases only in scoped lanes after review.",
        },
        {
            "id": "all_tool_integration_readiness",
            "label": "All visible tool integrations have a readiness row",
            "status": "verified" if integration_readiness["rows"] else "missing",
            "evidence": f"{len(integration_readiness['rows'])} local readiness rows",
            "nextAction": "Promote one lease-required row into a scoped executor lane only after review.",
        },
        {
            "id": "connector_sync_targets",
            "label": "Connector sync targets are bound",
            "status": "blocked"
            if sync_queue["counts"].get("blocked", 0)
            else "verified",
            "evidence": "connector target binding review remains target-ID gated",
            "nextAction": "Provide Airtable/Linear/Notion/GitHub target IDs before connector write lanes.",
        },
        {
            "id": "real_external_execution",
            "label": "Real external execution is enabled",
            "status": "blocked",
            "evidence": "clone, Docker, provider calls, connector writes, push, and deploy remain outside this toolkit lane",
            "nextAction": "Open separate executor-lease lanes for each real external action.",
        },
    ]
    counts = Counter(str(item["status"]) for item in requirements)
    verified = counts.get("verified", 0)
    total = len(requirements)
    if counts.get("missing", 0):
        overall = "incomplete_missing_routes"
    elif counts.get("blocked", 0):
        overall = "local_control_plane_ready_external_actions_gated"
    elif counts.get("partial", 0):
        overall = "partially_verified"
    else:
        overall = "verified"
    return {
        "mode": "objective_completion_audit_local_only",
        "objective": "auto approve all command and create codex integration to all tool and gitrepo a2a sync codex and hermes and kob in this session sidebar toolkit",
        "overallStatus": overall,
        "verifiedCount": verified,
        "totalCount": total,
        "counts": dict(sorted(counts.items())),
        "requirements": requirements,
    }


def build_toolkit() -> dict[str, Any]:
    ensure_runtime()
    policy = load_json_if_exists(BROKER_POLICY)
    agents = load_agent_cards(policy)
    reports = summarize_reports()
    repos = summarize_repos()
    policy_summary = summarize_policy(policy)
    sync_queue = build_sync_queue(reports, repos)
    executor_preflight = build_executor_preflight()
    lease_requests = summarize_lease_requests()
    integration_readiness = build_integration_readiness(
        agents,
        repos,
        reports,
        policy_summary,
        sync_queue,
        executor_preflight,
    )
    objective_audit = build_objective_audit(
        agents,
        repos,
        reports,
        policy_summary,
        sync_queue,
        executor_preflight,
        integration_readiness,
    )
    agent_route_gaps = [agent["agentId"] for agent in agents if not agent["brokerRouted"]]
    local_only_gaps = [agent["agentId"] for agent in agents if not agent["localOnly"]]
    report_gaps = [key for key, value in reports["items"].items() if not value["exists"]]

    status = "ready_for_local_sidebar_review"
    warnings: list[str] = []
    if agent_route_gaps:
        warnings.append("agent_route_gaps")
    if local_only_gaps:
        warnings.append("agent_local_only_gaps")
    if report_gaps:
        warnings.append("runtime_report_gaps")
    if warnings:
        status = "ready_with_warnings"

    toolkit = {
        "updatedAt": now_iso(),
        "mode": "local_read_only_session_sidebar_toolkit",
        "status": status,
        "warnings": warnings,
        "controlSurface": {
            "name": "Codex local sidebar toolkit",
            "project": "Ghostclaw Autoflow and autocut",
            "repoRoot": str(REPO_ROOT),
            "runtimeRoot": str(runtime_path()),
            "executionRoute": "kob_and_hermes_plan_codex_local_executes",
        },
        "summary": {
            "agentCount": len(agents),
            "brokerRoutedAgents": len([agent for agent in agents if agent["brokerRouted"]]),
            "registeredRepos": repos["registered"],
            "runtimeReportsPresent": reports["present"],
            "runtimeReportsExpected": reports["expected"],
            "autoAllowDryRunActions": len(policy_summary["autoAllowDryRun"]),
            "leaseRequiredActions": len(policy_summary["requiresExecutorLease"]),
            "blockedFirstPhaseActions": len(policy_summary["blockedFirstPhase"]),
            "hardBlockedActions": len(policy_summary["hardBlockedActions"]),
            "syncQueueItems": len(sync_queue["items"]),
            "syncQueueReady": sync_queue["counts"].get("ready", 0),
            "syncQueueLeaseRequired": sync_queue["counts"].get("lease_required", 0),
            "syncQueueBlocked": sync_queue["counts"].get("blocked", 0),
            "executorPreflightCommands": executor_preflight["summary"]["registeredCommands"],
            "executorPreflightRequiresLease": executor_preflight["summary"]["requiresLease"],
            "executorPreflightActiveLeases": executor_preflight["summary"]["activeLeases"],
            "executorPreflightExecutionEnabled": executor_preflight["summary"]["executionEnabledCommands"],
            "integrationRows": len(integration_readiness["rows"]),
            "integrationReady": integration_readiness["counts"].get("ready", 0),
            "integrationLeaseRequired": integration_readiness["counts"].get("lease_required", 0),
            "integrationBlocked": integration_readiness["counts"].get("blocked", 0),
            "integrationPartial": integration_readiness["counts"].get("partial", 0),
            "leaseRequestPackets": lease_requests["requestCount"],
            "leaseRequestReady": lease_requests["counts"].get("ready_for_review", 0),
            "leaseRequestBlocked": lease_requests["counts"].get("blocked_pending_targets", 0),
            "objectiveVerified": objective_audit["verifiedCount"],
            "objectiveTotal": objective_audit["totalCount"],
            "objectiveBlocked": objective_audit["counts"].get("blocked", 0),
        },
        "agents": agents,
        "repos": repos,
        "policy": policy_summary,
        "workflows": build_workflows(),
        "syncQueue": sync_queue,
        "integrationReadiness": integration_readiness,
        "leaseRequests": lease_requests,
        "executorPreflight": executor_preflight,
        "objectiveAudit": objective_audit,
        "reports": reports,
        "docs": [
            {
                "path": item,
                "exists": (REPO_ROOT / item).exists(),
            }
            for item in SIDEBAR_DOCS
        ],
        "allowedNow": [
            "read_repository_files",
            "inspect_architecture",
            "generate_docs",
            "run_lint",
            "run_unit_tests",
            "create_non_destructive_patches_with_lease",
            "update_markdown",
            "create_test_files",
            "simulate_deploy_plan",
            "artifact_hash_sync",
            "obsidian_memory_pulse",
        ],
        "blockedInToolkit": [
            "approve_all_without_broker",
            "jailbreak_or_policy_bypass",
            "secret_read_or_print",
            "connector_write",
            "provider_call",
            "external_repo_clone",
            "docker_start",
            "push",
            "deploy",
            "public_endpoint",
            "generated_asset_mutation",
        ],
    }
    return toolkit


def build_markdown(toolkit: dict[str, Any]) -> str:
    lines = [
        "# Codex Session Sidebar Toolkit",
        "",
        f"- Updated: `{toolkit['updatedAt']}`",
        f"- Status: `{toolkit['status']}`",
        f"- Mode: `{toolkit['mode']}`",
        f"- Route: `{toolkit['controlSurface']['executionRoute']}`",
        "",
        "## Summary",
        "",
        f"- Agents: `{toolkit['summary']['agentCount']}`",
        f"- Broker-routed agents: `{toolkit['summary']['brokerRoutedAgents']}`",
        f"- Registered repos: `{toolkit['summary']['registeredRepos']}`",
        f"- Runtime reports: `{toolkit['summary']['runtimeReportsPresent']}` / `{toolkit['summary']['runtimeReportsExpected']}`",
        f"- Auto-allow dry-run actions: `{toolkit['summary']['autoAllowDryRunActions']}`",
        f"- Lease-required actions: `{toolkit['summary']['leaseRequiredActions']}`",
        f"- Hard-blocked actions: `{toolkit['summary']['hardBlockedActions']}`",
        f"- Sync queue: `{toolkit['summary']['syncQueueItems']}` items (`{toolkit['summary']['syncQueueReady']}` ready / `{toolkit['summary']['syncQueueLeaseRequired']}` lease-required / `{toolkit['summary']['syncQueueBlocked']}` blocked)",
        f"- Executor preflight: `{toolkit['summary']['executorPreflightCommands']}` commands (`{toolkit['summary']['executorPreflightRequiresLease']}` require lease / `{toolkit['summary']['executorPreflightActiveLeases']}` active leases / `{toolkit['summary']['executorPreflightExecutionEnabled']}` execution-enabled)",
        f"- Integration readiness: `{toolkit['summary']['integrationRows']}` rows (`{toolkit['summary']['integrationReady']}` ready / `{toolkit['summary']['integrationLeaseRequired']}` lease-required / `{toolkit['summary']['integrationBlocked']}` blocked / `{toolkit['summary']['integrationPartial']}` partial)",
        f"- Lease request packets: `{toolkit['summary']['leaseRequestPackets']}` (`{toolkit['summary']['leaseRequestReady']}` ready-for-review / `{toolkit['summary']['leaseRequestBlocked']}` blocked-pending-targets)",
        f"- Objective audit: `{toolkit['summary']['objectiveVerified']}` / `{toolkit['summary']['objectiveTotal']}` verified (`{toolkit['summary']['objectiveBlocked']}` blocked)",
        "",
        "## Workflows",
        "",
    ]
    for workflow in toolkit["workflows"]:
        lines.append(f"- `{workflow['id']}` - {workflow['name']} (`{workflow['execution']}`)")
    lines.extend(["", "## Sync Queue", ""])
    for item in toolkit["syncQueue"]["items"]:
        lines.append(
            f"- `{item['status']}` `{item['id']}` - {item['label']} (`{item['decision']}` / `{item['requiredGate']}`)"
        )
    lines.extend(["", "## Integration Readiness", ""])
    for item in toolkit["integrationReadiness"]["rows"]:
        lines.append(
            f"- `{item['status']}` `{item['id']}` - {item['surface']}: {item['role']} (`{item['decision']}`)"
        )
    lines.extend(["", "## Lease Request Packets", ""])
    lines.append(f"- Status: `{toolkit['leaseRequests']['status']}`")
    for item in toolkit["leaseRequests"]["requests"]:
        lines.append(
            f"- `{item['requestStatus']}` `{item['sourceRowId']}` -> `{item['executor']}` / `{item['lane']}`"
        )
    lines.extend(["", "## Executor Lease Preflight", ""])
    lines.append(f"- Status: `{toolkit['executorPreflight']['status']}`")
    for item in toolkit["executorPreflight"]["requirements"]:
        lines.append(f"- `{item['status']}` `{item['id']}` - {item['detail']}")
    lines.extend(["", "## Objective Audit", ""])
    lines.append(f"- Overall: `{toolkit['objectiveAudit']['overallStatus']}`")
    for item in toolkit["objectiveAudit"]["requirements"]:
        lines.append(f"- `{item['status']}` `{item['id']}` - {item['label']} ({item['evidence']})")
    lines.extend(["", "## Allowed Now", ""])
    lines.extend(f"- `{item}`" for item in toolkit["allowedNow"])
    lines.extend(["", "## Blocked In Toolkit", ""])
    lines.extend(f"- `{item}`" for item in toolkit["blockedInToolkit"])
    lines.extend(["", "## Runtime Reports", ""])
    for key, item in toolkit["reports"]["items"].items():
        state = "present" if item["exists"] else "missing"
        lines.append(f"- `{state}` `{key}` - `{item['status']}`")
    lines.extend(
        [
            "",
            "## Next Safe Action",
            "",
            "Use this toolkit as a read-only Mission Control fixture. Open real connector sync, repo clone, Docker start, provider call, push, or deploy work only through a separate brokered lane.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    toolkit = build_toolkit()
    json_path = runtime_path("logs", "codex_session_sidebar_toolkit.json")
    markdown_path = runtime_path("logs", "codex_session_sidebar_toolkit.md")
    write_json(json_path, toolkit)
    write_text(markdown_path, build_markdown(toolkit))
    write_json(FIXTURE_PATH, toolkit)
    print(
        json.dumps(
            {
                "status": toolkit["status"],
                "warnings": toolkit["warnings"],
                "fixture": str(FIXTURE_PATH),
                "json_report": str(json_path),
                "markdown_report": str(markdown_path),
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
