#!/usr/bin/env python3
"""Generate review-only executor lease request packets from Session Toolkit rows.

This does not create active executor leases, acquire lane locks, or execute
commands. It prepares local JSON packets that can be reviewed before a
separate scoped lane creates a real lease.
"""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, read_json, runtime_path, sha256_text, slugify, write_json, write_text

REPO_ROOT = Path(__file__).resolve().parents[2]
TOOLKIT_FIXTURE = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "codexSessionSidebarToolkitStatus.json"
)
REQUEST_DIR = runtime_path("state", "executor_lease_requests")
REPORT_JSON = runtime_path("logs", "executor_lease_requests.json")
REPORT_MD = runtime_path("logs", "executor_lease_requests.md")

LEASE_REQUIRED_EXECUTORS = {
    "opencode-executor-candidate": {
        "executor": "opencode",
        "lane": "opencode-scoped-executor-candidate",
        "allowed_paths": [
            "docs/a2async/",
            "apps/mission-control/src/fixtures/",
            "/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/",
        ],
        "validation_commands": [
            "python3 scripts/a2a/a2a_session_sidebar_toolkit.py",
            "pnpm exec tsc -p apps/mission-control/tsconfig.json --noEmit",
            "git diff --check -- docs/a2async apps/mission-control/src/fixtures",
        ],
    },
    "agy-antigravity2-executor-candidate": {
        "executor": "agy-antigravity2",
        "lane": "agy-antigravity2-scoped-executor-candidate",
        "allowed_paths": [
            "docs/a2async/",
            "apps/mission-control/src/fixtures/",
            "/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/",
        ],
        "validation_commands": [
            "python3 scripts/a2a/a2a_session_sidebar_toolkit.py",
            "pnpm exec tsc -p apps/mission-control/tsconfig.json --noEmit",
            "git diff --check -- docs/a2async apps/mission-control/src/fixtures",
        ],
    },
    "external-git-repo-registry": {
        "executor": "codex-local",
        "lane": "external-git-repo-registry-audit",
        "allowed_paths": [
            "registry/",
            "docs/external/",
            "docs/a2async/",
            "/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/repo_audits/",
        ],
        "validation_commands": [
            "python3 scripts/a2a/a2a_repo_registry.py --validate",
            "python3 scripts/a2a/a2a_repo_audit.py --dry-run",
            "git diff --check -- registry docs/external docs/a2async",
        ],
    },
}

BLOCKED_REQUESTS = {
    "connector-sync": {
        "status": "blocked_pending_targets",
        "required_targets": {
            "airtable": ["base_id", "table_id_or_name"],
            "linear": ["workspace", "team_key_or_id"],
            "notion": ["parent_page_or_database_id"],
            "github": ["owner", "repo"],
        },
    }
}


def load_toolkit() -> dict[str, Any]:
    if not TOOLKIT_FIXTURE.exists():
        raise SystemExit(f"missing toolkit fixture: {TOOLKIT_FIXTURE}")
    data = read_json(TOOLKIT_FIXTURE)
    if not isinstance(data, dict):
        raise SystemExit("toolkit fixture must be a JSON object")
    return data


def request_id(row: dict[str, Any]) -> str:
    digest = sha256_text(
        json.dumps(
            {
                "id": row.get("id"),
                "status": row.get("status"),
                "decision": row.get("decision"),
                "evidence": row.get("evidence"),
            },
            sort_keys=True,
        )
    )[:12]
    return f"LEASE-REQ-{slugify(str(row.get('id', 'unknown')))}-{digest}"


def build_request(row: dict[str, Any]) -> dict[str, Any]:
    row_id = str(row.get("id", ""))
    base = {
        "schema_version": 1,
        "request_id": request_id(row),
        "created_at": now_iso(),
        "source": "codex_session_sidebar_toolkit.integrationReadiness",
        "source_row_id": row_id,
        "surface": row.get("surface", ""),
        "role": row.get("role", ""),
        "readiness_status": row.get("status", ""),
        "decision": row.get("decision", ""),
        "evidence": row.get("evidence", ""),
        "next_action": row.get("nextAction", ""),
        "blocked_actions": row.get("blockedActions", []),
        "policy": {
            "review_only": True,
            "create_active_lease": False,
            "acquire_lane_lock": False,
            "execute_commands": False,
            "no_secret_printing": True,
            "no_public_ports": True,
            "no_push": True,
            "no_deploy": True,
        },
    }
    if row_id in LEASE_REQUIRED_EXECUTORS:
        config = LEASE_REQUIRED_EXECUTORS[row_id]
        base.update(
            {
                "request_status": "ready_for_review",
                "executor": config["executor"],
                "lane": config["lane"],
                "allowed_paths": config["allowed_paths"],
                "validation_commands": config["validation_commands"],
                "suggested_create_command": (
                    "python3 scripts/a2a/a2a_executor_lease.py "
                    f"--executor {config['executor']} "
                    f"--lane {config['lane']} "
                    f"--goal {json.dumps(str(row.get('nextAction', 'review scoped lane')))} "
                    + " ".join(f"--allowed-path {json.dumps(path)}" for path in config["allowed_paths"])
                    + " "
                    + " ".join(
                        f"--validation-command {json.dumps(command)}"
                        for command in config["validation_commands"]
                    )
                ),
            }
        )
        return base

    blocked = BLOCKED_REQUESTS.get(row_id, {})
    base.update(
        {
            "request_status": blocked.get("status", "not_a_lease_candidate"),
            "executor": "",
            "lane": "",
            "allowed_paths": [],
            "validation_commands": [],
            "required_targets": blocked.get("required_targets", {}),
            "suggested_create_command": "",
        }
    )
    return base


def build_report(toolkit: dict[str, Any]) -> dict[str, Any]:
    ensure_runtime()
    REQUEST_DIR.mkdir(parents=True, exist_ok=True)
    for stale in REQUEST_DIR.glob("LEASE-REQ-*.json"):
        stale.unlink()
    rows = toolkit.get("integrationReadiness", {}).get("rows", [])
    if not isinstance(rows, list):
        rows = []

    requests = [
        build_request(row)
        for row in rows
        if row.get("status") in {"lease_required", "blocked"}
    ]

    for request in requests:
        path = REQUEST_DIR / f"{request['request_id']}.json"
        write_json(path, request)
        request["path"] = str(path)

    counts = Counter(str(item["request_status"]) for item in requests)
    return {
        "created_at": now_iso(),
        "mode": "review_only_executor_lease_request_packets",
        "status": "ready_for_local_review_only",
        "request_count": len(requests),
        "counts": dict(sorted(counts.items())),
        "request_dir": str(REQUEST_DIR),
        "requests": requests,
        "policy_blocks": [
            "no_active_lease_created",
            "no_lane_lock_acquired",
            "no_command_execution",
            "no_connector_write",
            "no_provider_call",
            "no_repo_clone",
            "no_docker_start",
            "no_push",
            "no_deploy",
            "no_secret_reading",
        ],
    }


def to_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# Executor Lease Request Packets",
        "",
        f"- Created: `{report['created_at']}`",
        f"- Status: `{report['status']}`",
        f"- Mode: `{report['mode']}`",
        f"- Request count: `{report['request_count']}`",
        f"- Request dir: `{report['request_dir']}`",
        "",
        "## Requests",
        "",
    ]
    for item in report["requests"]:
        lines.extend(
            [
                f"- `{item['request_status']}` `{item['source_row_id']}` -> `{item.get('executor', '')}`",
                f"  - lane: `{item.get('lane', '')}`",
                f"  - path: `{item['path']}`",
                f"  - next: {item['next_action']}",
            ]
        )
    lines.extend(["", "## Policy Blocks", ""])
    lines.extend(f"- `{item}`" for item in report["policy_blocks"])
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    toolkit = load_toolkit()
    report = build_report(toolkit)
    write_json(REPORT_JSON, report)
    write_text(REPORT_MD, to_markdown(report))
    print(
        json.dumps(
            {
                "status": report["status"],
                "request_count": report["request_count"],
                "counts": report["counts"],
                "request_dir": report["request_dir"],
                "json_report": str(REPORT_JSON),
                "markdown_report": str(REPORT_MD),
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
