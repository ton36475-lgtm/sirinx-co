#!/usr/bin/env python3
"""Generate dry-run external tool integration payloads from local A2A state."""

from __future__ import annotations

import json
from pathlib import Path

from _common import ensure_runtime, now_iso, runtime_path, write_json


def load_artifact_records() -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for path in sorted(runtime_path("artifacts").glob("A2A-*-manus_*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        title = data.get("artifact_title", path.stem)
        size = int(data.get("source_size_bytes") or 0)
        sha = str(data.get("source_sha256") or "")
        exists = bool(data.get("source_exists"))
        status = "hash_synced" if exists and sha else "pending_export"
        if exists and size < 128:
            status = "hash_synced_suspect_placeholder"
        records.append(
            {
                "title": title,
                "kind": data.get("artifact_kind", ""),
                "status": status,
                "source_path": data.get("source_path", ""),
                "source_exists": exists,
                "source_size_bytes": size,
                "source_sha256": sha,
                "artifact_manifest_path": str(path),
                "next_action": data.get("recommended_next_action", ""),
            }
        )
    return records


def build_airtable(records: list[dict[str, object]]) -> dict[str, object]:
    return {
        "connector": "airtable",
        "mode": "draft_only",
        "target_required": ["base_id", "table_id_or_name"],
        "table_suggestion": "ghostclaw_artifact_status",
        "records": [
            {
                "Artifact": record["title"],
                "Kind": record["kind"],
                "Status": record["status"],
                "Source Path": record["source_path"],
                "Size Bytes": record["source_size_bytes"],
                "SHA256": record["source_sha256"],
                "Next Action": record["next_action"],
            }
            for record in records
        ],
    }


def build_linear(records: list[dict[str, object]]) -> dict[str, object]:
    blockers = [r for r in records if r["status"] != "hash_synced"]
    return {
        "connector": "linear",
        "mode": "draft_only",
        "target_required": ["workspace", "team_key_or_id"],
        "issues": [
            {
                "title": f"Resolve Manus artifact: {record['title']}",
                "label": "manus-sync",
                "priority": "high" if record["status"] == "pending_export" else "medium",
                "description": (
                    f"Status: {record['status']}\n"
                    f"Source: {record['source_path']}\n"
                    f"SHA256: {record['source_sha256'] or 'missing'}\n"
                    f"Next action: {record['next_action']}"
                ),
            }
            for record in blockers
        ],
    }


def build_notion(records: list[dict[str, object]]) -> dict[str, object]:
    synced = sum(1 for r in records if str(r["status"]).startswith("hash_synced"))
    pending = len(records) - synced
    return {
        "connector": "notion",
        "mode": "draft_only",
        "target_required": ["parent_page_or_database_id"],
        "page": {
            "title": "GHOSTCLAW Manus Artifact Sync Status",
            "summary": (
                f"{len(records)} Manus artifact records inspected. "
                f"{synced} have local hashes; {pending} still require export or completeness review."
            ),
            "decisions": [
                "Do not import placeholder files directly into the repo.",
                "Use hash-backed files only after Codex content review.",
                "Keep external app writes blocked until destinations are bound.",
            ],
            "records": records,
        },
    }


def build_github(records: list[dict[str, object]]) -> dict[str, object]:
    missing_core = [
        record
        for record in records
        if record["title"]
        in {
            "GHOSTCLAW_CREW_REGISTRY_SCHEMA.ts",
            "GHOSTCLAW_INTEGRATION_TESTING.md",
            "server/ghostclaw-orchestrator.ts",
            "AGENT.md",
            "SPEC_DRIVING.html",
        }
        and record["status"] != "hash_synced"
    ]
    return {
        "connector": "github",
        "mode": "draft_only",
        "target_required": ["owner", "repo"],
        "issues": [
            {
                "title": f"Complete Manus export before repo import: {record['title']}",
                "labels": ["a2a", "manus", "blocked"],
                "body": (
                    f"Local source: `{record['source_path']}`\n\n"
                    f"Status: `{record['status']}`\n\n"
                    f"Required next action: {record['next_action']}"
                ),
            }
            for record in missing_core
        ],
    }


def main() -> int:
    ensure_runtime()
    out_dir = runtime_path("tool_integrations")
    out_dir.mkdir(parents=True, exist_ok=True)
    records = load_artifact_records()
    bundle = {
        "created_at": now_iso(),
        "planner": "hermes-project-planner",
        "mode": "dry_run_local_payloads_only",
        "policy": {
            "external_writes_enabled": False,
            "include_file_contents": False,
            "include_hashes": True,
            "no_secret_values": True,
        },
        "record_count": len(records),
        "airtable": build_airtable(records),
        "linear": build_linear(records),
        "notion": build_notion(records),
        "github": build_github(records),
    }
    write_json(out_dir / "all_tool_payloads.json", bundle)
    write_json(out_dir / "airtable_artifact_status_records.json", bundle["airtable"])
    write_json(out_dir / "linear_issue_drafts.json", bundle["linear"])
    write_json(out_dir / "notion_planning_page_draft.json", bundle["notion"])
    write_json(out_dir / "github_issue_drafts.json", bundle["github"])
    print(f"wrote {out_dir / 'all_tool_payloads.json'}")
    print(f"records={len(records)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
