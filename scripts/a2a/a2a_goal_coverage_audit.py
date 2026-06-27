#!/usr/bin/env python3
"""Audit local evidence coverage for the all-tool/all-repo GHOSTCLAW goal.

This is a read-only coverage reporter. It does not execute connector writes,
provider calls, repository clones, Docker starts, pushes, deploys, or shell
commands from generated manifests.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, parse_registry_entries, runtime_path, write_json, write_text

REPO_ROOT = Path(__file__).resolve().parents[2]
AGENT_DIR = REPO_ROOT / "agents" / "a2a"
POLICY_DIR = REPO_ROOT / "policies"
REGISTRY_DIR = REPO_ROOT / "registry"
MISSION_CONTROL_FIXTURES = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures"

COMMAND_BROKER_POLICY = POLICY_DIR / "codex_command_broker.json"
ADAPTER_REGISTRY = POLICY_DIR / "autopilot_adapter_registry.json"
SCOPED_LANES = POLICY_DIR / "a2a_scoped_lanes.json"
TOOL_TARGETS = POLICY_DIR / "tool_integration_targets.yaml"

EXPECTED_AGENT_IDS = {
    "codex-local",
    "kob-cli-opus",
    "kob-cli-fable",
    "opencode",
    "agy-antigravity2",
    "manus",
    "hermes-project-planner",
    "ponytail",
    "deerflow",
    "flowise",
    "odysseus",
    "n8n",
}

EXPECTED_ADAPTERS = {
    "docker_localhost_start",
    "external_repo_clone",
    "provider_api_smoke",
    "mcp_connector_activation",
}

REQUIRED_HARD_BLOCKS = {
    "access_secrets",
    "approve_all_actions",
    "bypass_access_control",
    "bypass_command_policy",
    "bypass_rate_limits",
    "change_payment_logic",
    "change_security_policy",
    "database_migration",
    "delete_or_overwrite_files",
    "disable_logging",
    "disable_monitoring",
    "disable_policy",
    "exfiltrate_credentials",
    "external_api_write_actions",
    "force_push",
    "hide_execution_history",
    "install_new_dependencies",
    "jailbreak_policy",
    "modify_audit_trail",
    "modify_authentication",
    "modify_authorization",
    "print_secret",
    "production_deploy",
    "provider_call",
    "public_endpoint",
    "push",
    "read_private_key",
    "read_or_export_user_data",
    "run_unknown_scripts",
    "unlock_all_commands",
    "unlock_all_security",
}

RUNTIME_REPORTS = {
    "a2a_readiness": "a2a_integration_readiness_matrix.json",
    "broker_validation": "broker_status_validation.json",
    "codex_tool_repo_matrix": "codex_tool_repo_matrix.json",
    "command_broker_production": "command_broker_production_lane.json",
    "deep_research_system_design": "deep_research_system_design.json",
    "goal_plan_board": "codex_goal_plan_board.json",
}


def read_json_if_exists(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except ValueError as exc:
        return {"parse_error": str(exc), "path": str(path)}


def load_agent_cards() -> dict[str, dict[str, Any]]:
    cards: dict[str, dict[str, Any]] = {}
    for path in sorted(AGENT_DIR.glob("*.agent.json")):
        data = read_json_if_exists(path, {})
        agent_id = str(data.get("agent_id") or path.stem.removesuffix(".agent"))
        data["path"] = str(path.relative_to(REPO_ROOT))
        cards[agent_id] = data
    return cards


def summarize_agents(cards: dict[str, dict[str, Any]], broker_policy: dict[str, Any]) -> dict[str, Any]:
    routes = broker_policy.get("tool_routes", {})
    missing_cards = sorted(EXPECTED_AGENT_IDS - set(cards))
    missing_routes = sorted(agent_id for agent_id in EXPECTED_AGENT_IDS if agent_id not in routes)
    not_local_only = sorted(agent_id for agent_id, card in cards.items() if card.get("local_only") is not True)
    runtimes = Counter(str(card.get("runtime", "unknown")) for card in cards.values())
    return {
        "card_count": len(cards),
        "expected_count": len(EXPECTED_AGENT_IDS),
        "runtime_counts": dict(sorted(runtimes.items())),
        "present_expected_agent_ids": sorted(EXPECTED_AGENT_IDS & set(cards)),
        "missing_expected_agent_ids": missing_cards,
        "broker_routed_expected_agent_ids": sorted(agent_id for agent_id in EXPECTED_AGENT_IDS if agent_id in routes),
        "missing_broker_routes": missing_routes,
        "not_local_only": not_local_only,
        "coverage": coverage_score(len(EXPECTED_AGENT_IDS) - len(missing_cards), len(EXPECTED_AGENT_IDS)),
    }


def summarize_repos() -> dict[str, Any]:
    entries = parse_registry_entries()
    clone_policy = Counter(entry.get("clone_policy", "missing") for entry in entries)
    categories = Counter()
    for entry in entries:
        role = entry.get("role", "")
        if "marketing" in role or "crm" in role or "campaign" in role:
            categories["marketing_stack"] += 1
        elif "agent" in role or "runtime" in role or "workspace" in role:
            categories["agent_stack"] += 1
        elif "automation" in role or "workflow" in role:
            categories["automation_stack"] += 1
        else:
            categories["other"] += 1
    return {
        "registered_repo_count": len(entries),
        "clone_policy_counts": dict(sorted(clone_policy.items())),
        "role_bucket_counts": dict(sorted(categories.items())),
        "registry_files": sorted(path.name for path in REGISTRY_DIR.glob("*") if path.is_file()),
        "clone_execution_status": "not_executed_by_this_audit",
        "coverage": coverage_score(len(entries), 24),
    }


def summarize_commands(broker_policy: dict[str, Any]) -> dict[str, Any]:
    action_classes = broker_policy.get("action_classes", {})
    hard_blocks = set(broker_policy.get("hard_blocked_actions", []))
    blocked_first_phase = set(action_classes.get("blocked_first_phase", []))
    protected_actions = hard_blocks | blocked_first_phase
    required_missing = sorted(REQUIRED_HARD_BLOCKS - protected_actions)
    route_count = len(broker_policy.get("tool_routes", {}))
    return {
        "tool_route_count": route_count,
        "action_class_count": len(action_classes),
        "auto_allow_dry_run_count": len(action_classes.get("auto_allow_dry_run", [])),
        "requires_executor_lease_count": len(action_classes.get("requires_executor_lease", [])),
        "blocked_first_phase_count": len(action_classes.get("blocked_first_phase", [])),
        "hard_block_count": len(hard_blocks),
        "required_hard_blocks_missing": required_missing,
        "direct_execution_status": "brokered_or_blocked_only",
        "coverage": coverage_score(route_count, len(EXPECTED_AGENT_IDS)),
    }


def summarize_adapters(adapter_registry: dict[str, Any]) -> dict[str, Any]:
    adapters = adapter_registry.get("adapters", {})
    if isinstance(adapters, list):
        adapter_ids = {str(item.get("adapter_id") or item.get("id") or item.get("name")) for item in adapters}
    elif isinstance(adapters, dict):
        adapter_ids = set(adapters)
    else:
        adapter_ids = set()
    return {
        "adapter_count": len(adapter_ids),
        "expected_adapters_present": sorted(EXPECTED_ADAPTERS & adapter_ids),
        "expected_adapters_missing": sorted(EXPECTED_ADAPTERS - adapter_ids),
        "execution_status": "validator_registry_only",
        "coverage": coverage_score(len(EXPECTED_ADAPTERS & adapter_ids), len(EXPECTED_ADAPTERS)),
    }


def summarize_scoped_lanes(lanes_doc: dict[str, Any]) -> dict[str, Any]:
    lanes = lanes_doc.get("lanes", {})
    lane_ids = set(lanes)
    required = {
        "codex-command-broker-mission-control",
        "command-broker-production-lane",
        "deep-research-system-design-lane",
        "goal-coverage-audit-lane",
    }
    return {
        "lane_count": len(lanes),
        "required_lanes_present": sorted(required & lane_ids),
        "required_lanes_missing": sorted(required - lane_ids),
        "mode_counts": dict(sorted(Counter(str(item.get("mode", "missing")) for item in lanes.values()).items())),
        "coverage": coverage_score(len(required & lane_ids), len(required)),
    }


def summarize_runtime_reports() -> dict[str, Any]:
    reports = {}
    present = 0
    for key, filename in RUNTIME_REPORTS.items():
        path = runtime_path("logs", filename)
        exists = path.exists()
        if exists:
            present += 1
        reports[key] = {
            "exists": exists,
            "path": str(path),
            "bytes": path.stat().st_size if exists else 0,
        }
    return {
        "expected_report_count": len(RUNTIME_REPORTS),
        "present_report_count": present,
        "reports": reports,
        "coverage": coverage_score(present, len(RUNTIME_REPORTS)),
    }


def summarize_tool_targets() -> dict[str, Any]:
    text = TOOL_TARGETS.read_text(encoding="utf-8") if TOOL_TARGETS.exists() else ""
    required_tokens = {
        "airtable",
        "linear",
        "notion",
        "github",
    }
    present = sorted(token for token in required_tokens if token in text.lower())
    return {
        "exists": TOOL_TARGETS.exists(),
        "path": str(TOOL_TARGETS.relative_to(REPO_ROOT)),
        "target_tokens_present": present,
        "target_tokens_missing": sorted(required_tokens - set(present)),
        "external_write_status": "disabled_until_target_binding_review",
        "coverage": coverage_score(len(present), len(required_tokens)),
    }


def coverage_score(done: int, total: int) -> float:
    if total <= 0:
        return 1.0
    return round(min(done / total, 1.0), 4)


def derive_overall(report: dict[str, Any]) -> dict[str, Any]:
    blockers = []
    warnings = []
    if report["commands"]["required_hard_blocks_missing"]:
        blockers.append("required_hard_blocks_missing")
    if report["adapters"]["expected_adapters_missing"]:
        blockers.append("adapter_registry_incomplete")
    if report["scoped_lanes"]["required_lanes_missing"]:
        warnings.append("some_scoped_lanes_not_registered")
    if report["agents"]["missing_expected_agent_ids"]:
        warnings.append("some_expected_agent_cards_missing")
    if report["agents"]["missing_broker_routes"]:
        warnings.append("some_expected_agents_not_broker_routed")
    if report["tool_targets"]["target_tokens_missing"]:
        warnings.append("connector_target_ids_still_required")
    if report["runtime_reports"]["present_report_count"] < report["runtime_reports"]["expected_report_count"]:
        warnings.append("some_runtime_reports_missing")

    if blockers:
        status = "blocked_for_real_execution"
    elif warnings:
        status = "ready_for_local_review_only"
    else:
        status = "ready_for_scoped_dry_run_review"

    return {
        "status": status,
        "blockers": blockers,
        "warnings": warnings,
        "allowed_next_actions": [
            "review_goal_coverage_audit",
            "bind_connector_targets_without_secret_values",
            "run_scoped_lane_status",
            "prepare_scoped_stage_file_list",
        ],
        "blocked_next_actions": [
            "jailbreak_or_policy_bypass",
            "approve_all_without_broker",
            "secret_read_or_print",
            "connector_write",
            "provider_call",
            "repo_clone",
            "docker_start",
            "push",
            "deploy",
        ],
    }


def build_report() -> dict[str, Any]:
    ensure_runtime()
    broker_policy = read_json_if_exists(COMMAND_BROKER_POLICY, {})
    adapter_registry = read_json_if_exists(ADAPTER_REGISTRY, {})
    scoped_lanes = read_json_if_exists(SCOPED_LANES, {})
    agent_cards = load_agent_cards()
    report: dict[str, Any] = {
        "created_at": now_iso(),
        "mode": "local_read_only_goal_coverage_audit",
        "generated_by": "scripts/a2a/a2a_goal_coverage_audit.py",
        "goal": "Codex local sidebar coordinates all approved GHOSTCLAW tools and Git repos through A2A, KOB planning, command broker policy, scoped lanes, and runtime evidence.",
        "boundaries": [
            "no_jailbreak_or_policy_bypass",
            "no_secret_read_or_print",
            "no_provider_call",
            "no_connector_write",
            "no_clone_execution",
            "no_docker_start",
            "no_push",
            "no_deploy",
            "no_generated_asset_mutation",
        ],
        "agents": summarize_agents(agent_cards, broker_policy),
        "repos": summarize_repos(),
        "commands": summarize_commands(broker_policy),
        "adapters": summarize_adapters(adapter_registry),
        "scoped_lanes": summarize_scoped_lanes(scoped_lanes),
        "runtime_reports": summarize_runtime_reports(),
        "tool_targets": summarize_tool_targets(),
    }
    report["overall"] = derive_overall(report)
    components = [
        report["agents"]["coverage"],
        report["repos"]["coverage"],
        report["commands"]["coverage"],
        report["adapters"]["coverage"],
        report["scoped_lanes"]["coverage"],
        report["runtime_reports"]["coverage"],
        report["tool_targets"]["coverage"],
    ]
    report["coverage_score"] = round(sum(components) / len(components), 4)
    return report


def build_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# A2A Goal Coverage Audit",
        "",
        f"- Created: `{report['created_at']}`",
        f"- Status: `{report['overall']['status']}`",
        f"- Coverage score: `{report['coverage_score']}`",
        f"- Generated by: `{report['generated_by']}`",
        "",
        "## Scope",
        "",
        report["goal"],
        "",
        "## Boundaries",
        "",
    ]
    lines.extend(f"- `{item}`" for item in report["boundaries"])
    lines.extend(
        [
            "",
            "## Coverage Summary",
            "",
            f"- Agent cards: `{report['agents']['card_count']}` / expected `{report['agents']['expected_count']}`",
            f"- Broker routes: `{report['commands']['tool_route_count']}`",
            f"- Registered repos: `{report['repos']['registered_repo_count']}`",
            f"- Adapter contracts: `{report['adapters']['adapter_count']}`",
            f"- Scoped lanes: `{report['scoped_lanes']['lane_count']}`",
            f"- Runtime reports present: `{report['runtime_reports']['present_report_count']}` / `{report['runtime_reports']['expected_report_count']}`",
            f"- Connector target token coverage: `{len(report['tool_targets']['target_tokens_present'])}` / `4`",
            "",
            "## Blockers And Warnings",
            "",
            f"- Blockers: `{', '.join(report['overall']['blockers']) or 'none'}`",
            f"- Warnings: `{', '.join(report['overall']['warnings']) or 'none'}`",
            "",
            "## Open Gaps",
            "",
            f"- Missing agent cards: `{', '.join(report['agents']['missing_expected_agent_ids']) or 'none'}`",
            f"- Missing broker routes: `{', '.join(report['agents']['missing_broker_routes']) or 'none'}`",
            f"- Missing adapter contracts: `{', '.join(report['adapters']['expected_adapters_missing']) or 'none'}`",
            f"- Missing scoped lanes: `{', '.join(report['scoped_lanes']['required_lanes_missing']) or 'none'}`",
            f"- Missing connector target tokens: `{', '.join(report['tool_targets']['target_tokens_missing']) or 'none'}`",
            f"- Missing hard blocks: `{', '.join(report['commands']['required_hard_blocks_missing']) or 'none'}`",
            "",
            "## Runtime Evidence",
            "",
        ]
    )
    for key, item in report["runtime_reports"]["reports"].items():
        status = "present" if item["exists"] else "missing"
        lines.append(f"- `{status}` `{key}` - `{item['path']}`")
    lines.extend(
        [
            "",
            "## Next Safe Action",
            "",
            "Use this report to bind missing connector targets, review scoped lane status, and prepare a scoped staging list. Real clone, connector write, provider call, push, deploy, Docker, or public endpoint work remains blocked in separate executor-lease lanes.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    report = build_report()
    json_path = runtime_path("logs", "goal_coverage_audit.json")
    markdown_path = runtime_path("logs", "goal_coverage_audit.md")
    write_json(json_path, report)
    write_text(markdown_path, build_markdown(report))
    print(
        json.dumps(
            {
                "status": report["overall"]["status"],
                "coverage_score": report["coverage_score"],
                "blockers": report["overall"]["blockers"],
                "warnings": report["overall"]["warnings"],
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
