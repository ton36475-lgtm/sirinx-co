#!/usr/bin/env python3
"""Summarize local A2A tool and Git repo integration readiness."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, parse_registry_entries, runtime_path, write_json, write_text

REPO_ROOT = Path(__file__).resolve().parents[2]
AGENT_DIR = REPO_ROOT / "agents" / "a2a"
BROKER_POLICY_PATH = REPO_ROOT / "policies" / "codex_command_broker.json"
CONNECTOR_FIXTURE_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "toolIntegrationPayloadStatus.json"
)
BROKER_FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "codexCommandBrokerStatus.json"


def read_json_if_exists(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def load_agent_cards() -> list[dict[str, Any]]:
    cards = []
    for path in sorted(AGENT_DIR.glob("*.agent.json")):
        try:
            card = json.loads(path.read_text(encoding="utf-8"))
        except ValueError:
            cards.append({"agent_id": path.stem, "path": str(path), "parse_error": True})
            continue
        card["path"] = str(path)
        cards.append(card)
    return cards


def agent_summary(cards: list[dict[str, Any]], broker_policy: dict[str, Any]) -> dict[str, Any]:
    routes = broker_policy.get("tool_routes", {})
    by_runtime = Counter(str(card.get("runtime", "unknown")) for card in cards)
    broker_routed = []
    missing_broker_route = []
    lease_required = []
    local_only_false = []

    for card in cards:
        agent_id = str(card.get("agent_id", ""))
        if agent_id in routes:
            broker_routed.append(agent_id)
        else:
            missing_broker_route.append(agent_id)
        if card.get("requires_executor_lease") is True:
            lease_required.append(agent_id)
        if card.get("local_only") is not True:
            local_only_false.append(agent_id)

    return {
        "total": len(cards),
        "by_runtime": dict(by_runtime),
        "broker_routed": sorted(broker_routed),
        "missing_broker_route": sorted(missing_broker_route),
        "lease_required": sorted(lease_required),
        "local_only_false": sorted(local_only_false),
    }


def repo_summary() -> dict[str, Any]:
    entries = parse_registry_entries()
    by_clone_policy = Counter(entry.get("clone_policy", "missing") for entry in entries)
    return {
        "total": len(entries),
        "by_clone_policy": dict(by_clone_policy),
        "allow_clone": sorted(entry.get("repo", entry.get("name", "")) for entry in entries if entry.get("clone_policy") == "allow"),
        "skip_clone": sorted(entry.get("repo", entry.get("name", "")) for entry in entries if entry.get("clone_policy") == "skip"),
    }


def connector_summary(fixture: dict[str, Any]) -> dict[str, Any]:
    connectors = fixture.get("connectors", [])
    target_bound = [item.get("key", item.get("name", "")) for item in connectors if item.get("targetBound")]
    target_unbound = [item.get("key", item.get("name", "")) for item in connectors if not item.get("targetBound")]
    return {
        "total": len(connectors),
        "mode": fixture.get("mode", "missing"),
        "external_writes_enabled": fixture.get("policy", {}).get("externalWritesEnabled"),
        "target_bound": sorted(target_bound),
        "target_unbound": sorted(target_unbound),
        "draft_count": sum(int(item.get("draftCount", 0)) for item in connectors),
    }


def broker_summary(policy: dict[str, Any], fixture: dict[str, Any]) -> dict[str, Any]:
    decisions = fixture.get("decisions", [])
    decision_counts = Counter(item.get("decision", "missing") for item in decisions)
    hard_blocks = set(policy.get("hard_blocked_actions", []))
    required_hard_blocks = {
        "jailbreak_policy",
        "bypass_command_policy",
        "disable_policy",
        "unlock_all_security",
        "autonomous_approve_all",
        "disable_security_controls",
        "access_secrets",
        "read_or_export_user_data",
        "modify_authentication",
        "modify_authorization",
        "change_payment_logic",
        "change_security_policy",
        "install_new_dependencies",
        "run_unknown_scripts",
        "database_migration",
        "delete_or_overwrite_files",
        "production_deploy",
        "external_api_write_actions",
        "disable_logging",
        "disable_monitoring",
        "bypass_access_control",
        "bypass_rate_limits",
        "exfiltrate_credentials",
        "approve_all_actions",
        "modify_audit_trail",
        "hide_execution_history",
        "print_secret",
        "force_push",
        "public_endpoint",
        "provider_secret_dump",
    }
    return {
        "tool_route_count": len(policy.get("tool_routes", {})),
        "action_class_count": len(policy.get("action_classes", {})),
        "hard_block_count": len(hard_blocks),
        "required_hard_blocks_present": sorted(required_hard_blocks & hard_blocks),
        "required_hard_blocks_missing": sorted(required_hard_blocks - hard_blocks),
        "fixture_decision_count": len(decisions),
        "fixture_decision_counts": dict(decision_counts),
    }


def derive_status(report: dict[str, Any]) -> tuple[str, list[str]]:
    blockers = []
    warnings = []
    if report["connectors"]["target_unbound"]:
        blockers.append("connector_targets_unbound")
    if report["broker"]["required_hard_blocks_missing"]:
        blockers.append("required_hard_blocks_missing")
    if report["agents"]["local_only_false"]:
        blockers.append("agent_card_not_local_only")
    if report["agents"]["missing_broker_route"]:
        warnings.append("some_agent_cards_are_not_broker_routed")
    if report["repos"]["by_clone_policy"].get("allow", 0) and not blockers:
        warnings.append("clone_allowlist_exists_but_clone_execution_still_requires_separate_phase")
    if blockers:
        return "blocked_for_external_execution", blockers + warnings
    if warnings:
        return "ready_for_local_review_only", warnings
    return "ready_for_local_dry_run"


def build_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# A2A Integration Readiness Matrix",
        "",
        f"- Created: `{report['created_at']}`",
        f"- Overall status: `{report['overall_status']}`",
        f"- Notes: `{', '.join(report['notes']) if report['notes'] else 'none'}`",
        "",
        "## Boundaries",
        "",
    ]
    lines.extend(f"- `{item}`" for item in report["boundaries"])
    lines.extend(
        [
            "",
            "## Agents",
            "",
            f"- Agent cards: `{report['agents']['total']}`",
            f"- Broker-routed agents: `{len(report['agents']['broker_routed'])}`",
            f"- Lease-required executors: `{', '.join(report['agents']['lease_required']) or 'none'}`",
            f"- Missing broker route: `{', '.join(report['agents']['missing_broker_route']) or 'none'}`",
            "",
            "## Git Repo Registry",
            "",
            f"- Registered repos: `{report['repos']['total']}`",
            f"- Clone policy counts: `{json.dumps(report['repos']['by_clone_policy'], sort_keys=True)}`",
            "",
            "## Connectors",
            "",
            f"- Connector drafts: `{report['connectors']['total']}`",
            f"- Draft records: `{report['connectors']['draft_count']}`",
            f"- External writes enabled: `{str(report['connectors']['external_writes_enabled']).lower()}`",
            f"- Target-unbound connectors: `{', '.join(report['connectors']['target_unbound']) or 'none'}`",
            "",
            "## Broker",
            "",
            f"- Tool routes: `{report['broker']['tool_route_count']}`",
            f"- Runtime fixture decisions: `{report['broker']['fixture_decision_count']}`",
            f"- Decision counts: `{json.dumps(report['broker']['fixture_decision_counts'], sort_keys=True)}`",
            f"- Required hard blocks missing: `{', '.join(report['broker']['required_hard_blocks_missing']) or 'none'}`",
            "",
            "## Next Safe Action",
            "",
            "Review target binding requirements for Airtable, Linear, Notion, and GitHub before any connector sync. Keep repo clone, provider calls, public endpoints, push, and deploy in separate gated lanes.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    ensure_runtime()
    broker_policy = read_json_if_exists(BROKER_POLICY_PATH, {})
    connector_fixture = read_json_if_exists(CONNECTOR_FIXTURE_PATH, {})
    broker_fixture = read_json_if_exists(BROKER_FIXTURE_PATH, {})
    report: dict[str, Any] = {
        "created_at": now_iso(),
        "mode": "local_readiness_matrix_only",
        "agents": agent_summary(load_agent_cards(), broker_policy),
        "repos": repo_summary(),
        "connectors": connector_summary(connector_fixture),
        "broker": broker_summary(broker_policy, broker_fixture),
        "boundaries": [
            "no_jailbreak_or_policy_bypass",
            "no_provider_call",
            "no_connector_write",
            "no_clone_execution",
            "no_push",
            "no_deploy",
            "no_public_endpoint",
            "no_secret_read_or_print",
        ],
    }
    status, notes = derive_status(report)
    report["overall_status"] = status
    report["notes"] = notes

    json_path = runtime_path("logs", "a2a_integration_readiness_matrix.json")
    markdown_path = runtime_path("logs", "a2a_integration_readiness_matrix.md")
    write_json(json_path, report)
    write_text(markdown_path, build_markdown(report))
    print(
        json.dumps(
            {
                "overall_status": report["overall_status"],
                "agent_cards": report["agents"]["total"],
                "registered_repos": report["repos"]["total"],
                "connectors": report["connectors"]["total"],
                "target_unbound": report["connectors"]["target_unbound"],
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
