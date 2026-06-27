#!/usr/bin/env python3
"""Build a read-only Codex tool and Git repo integration matrix."""

from __future__ import annotations

import json
import os
from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, parse_registry_entries, runtime_path, write_json, write_text
from a2a_command_broker import decide, load_policy

REPO_ROOT = Path(__file__).resolve().parents[2]
AGENT_DIR = REPO_ROOT / "agents" / "a2a"
FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "codexToolRepoMatrixStatus.json"

REPO_ACTIONS = [
    "registry_validate",
    "repo_audit_readonly",
    "clone_whitelisted_external_repo",
    "scoped_repo_edit",
    "push",
    "deploy",
    "approve_all_actions",
]


def read_json_if_exists(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except ValueError:
        return {"parse_error": True}


def load_agent_cards(policy: dict[str, Any]) -> list[dict[str, Any]]:
    routes = policy.get("tool_routes", {})
    cards: list[dict[str, Any]] = []
    for path in sorted(AGENT_DIR.glob("*.agent.json")):
        card = read_json_if_exists(path)
        agent_id = str(card.get("agent_id", path.stem))
        route = routes.get(agent_id, {})
        cards.append(
            {
                "agentId": agent_id,
                "name": card.get("name", agent_id),
                "role": route.get("role") or card.get("role", ""),
                "runtime": card.get("runtime", "unknown"),
                "localOnly": card.get("local_only") is True,
                "brokerRouted": agent_id in routes,
                "allowedActionCount": len(route.get("allowed_actions", [])),
                "leaseRequiredActions": route.get("lease_required_actions", []),
                "blockedActions": route.get("blocked_actions", []),
                "capabilitySample": list(card.get("capabilities", []))[:6],
                "cardPath": str(path),
            }
        )
    return cards


def expanded_path_exists(path_text: str) -> bool:
    if not path_text or path_text in {"none", "detect_from_local_git"}:
        return False
    return Path(os.path.expanduser(path_text)).exists()


def decision_for(policy: dict[str, Any], repo: str, action: str) -> dict[str, str]:
    result = decide(policy, "codex-local", action, repo)
    return {
        "action": action,
        "decision": result.get("decision", "blocked"),
        "reason": result.get("reason", ""),
        "requiredGate": result.get("required_gate", ""),
    }


def build_repo_rows(policy: dict[str, Any]) -> tuple[list[dict[str, Any]], Counter[str]]:
    rows: list[dict[str, Any]] = []
    decision_counts: Counter[str] = Counter()
    for entry in parse_registry_entries():
        repo_id = entry.get("repo") or entry.get("name", "")
        decisions = [decision_for(policy, repo_id, action) for action in REPO_ACTIONS]
        for item in decisions:
            decision_counts[item["decision"]] += 1
        rows.append(
            {
                "name": entry.get("name", ""),
                "repo": repo_id,
                "role": entry.get("role", ""),
                "clonePolicy": entry.get("clone_policy", "missing"),
                "clonePath": entry.get("clone_path", ""),
                "localPathExists": expanded_path_exists(entry.get("clone_path", "")),
                "actions": decisions,
                "summary": dict(Counter(item["decision"] for item in decisions)),
            }
        )
    return rows, decision_counts


def build_report() -> dict[str, Any]:
    ensure_runtime()
    policy = load_policy()
    agents = load_agent_cards(policy)
    repos, decision_counts = build_repo_rows(policy)
    broker_routed = [agent for agent in agents if agent["brokerRouted"]]
    lease_agents = [agent for agent in agents if agent["leaseRequiredActions"]]
    local_only_gaps = [agent for agent in agents if not agent["localOnly"]]
    allow_clone = [repo for repo in repos if repo["clonePolicy"] == "allow"]
    skip_clone = [repo for repo in repos if repo["clonePolicy"] == "skip"]

    report = {
        "updatedAt": now_iso(),
        "mode": "local_read_only_tool_repo_matrix",
        "generatedBy": "scripts/a2a/a2a_codex_tool_repo_matrix.py",
        "summary": {
            "agentCount": len(agents),
            "brokerRoutedAgents": len(broker_routed),
            "leaseRequiredAgents": len(lease_agents),
            "localOnlyGaps": len(local_only_gaps),
            "repoCount": len(repos),
            "cloneAllowCount": len(allow_clone),
            "cloneSkipCount": len(skip_clone),
            "repoActionCount": sum(len(repo["actions"]) for repo in repos),
            "blockedOrGatedActions": sum(
                count
                for key, count in decision_counts.items()
                if key not in {"auto_allow_dry_run"}
            ),
            "overallStatus": "ready_for_local_review_only",
        },
        "actionSummary": dict(sorted(decision_counts.items())),
        "agents": agents,
        "repos": repos,
        "blockedActions": policy.get("hard_blocked_actions", []),
        "policyBoundary": [
            "read_only_fixture",
            "no_jailbreak_or_policy_bypass",
            "no_secret_read_or_print",
            "no_provider_call",
            "no_connector_write",
            "no_clone_execution",
            "no_push",
            "no_deploy",
            "repo_mutation_requires_executor_lease",
        ],
    }
    return report


def build_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Codex Tool and Git Repo Matrix",
        "",
        f"- Created: `{report['updatedAt']}`",
        f"- Mode: `{report['mode']}`",
        f"- Status: `{report['summary']['overallStatus']}`",
        f"- Agents: `{report['summary']['agentCount']}`",
        f"- Registered repos: `{report['summary']['repoCount']}`",
        f"- Repo actions classified: `{report['summary']['repoActionCount']}`",
        f"- Blocked or gated actions: `{report['summary']['blockedOrGatedActions']}`",
        "",
        "## Boundaries",
        "",
    ]
    lines.extend(f"- `{item}`" for item in report["policyBoundary"])
    lines.extend(["", "## Agent Routes", ""])
    for agent in report["agents"]:
        status = "broker-routed" if agent["brokerRouted"] else "missing-route"
        lines.append(
            f"- `{status}` `{agent['agentId']}` - {agent['role'] or agent['name']} "
            f"(allowed: `{agent['allowedActionCount']}`, lease: `{len(agent['leaseRequiredActions'])}`)"
        )
    lines.extend(["", "## Repo Action Matrix", ""])
    for repo in report["repos"]:
        summary = ", ".join(f"{key}={value}" for key, value in sorted(repo["summary"].items()))
        lines.append(f"- `{repo['clonePolicy']}` `{repo['repo']}` - {repo['role']} ({summary})")
    lines.extend(
        [
            "",
            "## Next Safe Action",
            "",
            "Review this matrix in Mission Control. Keep clone, push, deploy, provider calls, connector writes, and repo mutation in separate executor-lease lanes.",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    report = build_report()
    json_path = runtime_path("logs", "codex_tool_repo_matrix.json")
    markdown_path = runtime_path("logs", "codex_tool_repo_matrix.md")
    write_json(json_path, report)
    write_text(markdown_path, build_markdown(report))
    write_json(FIXTURE_PATH, report)
    print(
        json.dumps(
            {
                "fixture": str(FIXTURE_PATH),
                "json_report": str(json_path),
                "markdown_report": str(markdown_path),
                "agents": report["summary"]["agentCount"],
                "repos": report["summary"]["repoCount"],
                "repo_actions": report["summary"]["repoActionCount"],
                "overall_status": report["summary"]["overallStatus"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
