#!/usr/bin/env python3
"""Generate local Deep Research OS status without running research.

The script validates local examples with lightweight standard-library checks and
writes a runtime report. It does not browse, call providers, scrape, install
models, or publish.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, read_json, runtime_path, write_json, write_text

REPO_ROOT = Path(__file__).resolve().parents[2]
DEEP_RESEARCH_DIR = REPO_ROOT / "docs" / "deep_research"
SCHEMA_DIR = REPO_ROOT / "schemas"
POLICY_PATH = REPO_ROOT / "policies" / "deep_research_os.yaml"
CONTROL_PLANE_DOC = DEEP_RESEARCH_DIR / "DEEP_RESEARCH_CONTROL_PLANE.md"
JOB_PACKET_EXAMPLE = DEEP_RESEARCH_DIR / "examples" / "solar_bess_payback_job_packet.example.json"
EVIDENCE_PACK_EXAMPLE = DEEP_RESEARCH_DIR / "examples" / "solar_bess_evidence_pack.example.json"
REPORT_JSON = runtime_path("logs", "deep_research_system_design.json")
REPORT_MD = runtime_path("logs", "deep_research_system_design.md")
FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "deepResearchStatus.json"

REQUIRED_JOB_KEYS = {
    "schema_version",
    "job_id",
    "project",
    "requested_by",
    "created_at",
    "mode",
    "confidentiality",
    "research_goal",
    "inputs",
    "scope",
    "source_policy",
    "evidence_requirements",
    "output_requirements",
    "verification_gates",
    "hard_stops",
}

REQUIRED_EVIDENCE_PACK_KEYS = {
    "schema_version",
    "job_id",
    "generated_at",
    "evidence_units",
    "source_quality_records",
    "claim_verification_records",
}

AGENT_MESH = [
    "research_governor",
    "input_grounder",
    "evidence_builder",
    "claim_miner",
    "research_planner",
    "academic_agent",
    "regulatory_agent",
    "market_agent",
    "financial_agent",
    "visual_rag_agent",
    "red_team_agent",
    "synthesis_agent",
]

OUTPUT_PACK = [
    "job_packet.json",
    "source_registry.json",
    "claims.json",
    "evidence_units.json",
    "source_quality_table.csv",
    "claim_evidence_matrix.csv",
    "contradiction_log.md",
    "scenario_model.json",
    "research_report.md",
    "executive_summary.md",
    "action_roadmap.md",
    "memory_pulse.md",
    "control_plane_status.json",
]

BLOCKED_ACTIONS = [
    "provider_api_call",
    "web_scraping",
    "browser_session_capture",
    "paid_portal_access",
    "confidential_raw_upload",
    "public_endpoint",
    "model_install",
    "gpu_execution",
    "connector_write",
    "publish_report",
    "push",
    "deploy",
    "secret_read",
]

JOB_CLASSES = [
    {
        "id": "claim_verification",
        "purpose": "Check whether a material claim is supported or contradicted.",
        "firstOutput": "claim_evidence_matrix.csv",
        "gate": "retrieval_lane",
    },
    {
        "id": "market_intelligence",
        "purpose": "Compare competitors, pricing, channels, and offer positioning.",
        "firstOutput": "market_evidence_table.csv",
        "gate": "browser_or_source_capture_lane",
    },
    {
        "id": "technical_due_diligence",
        "purpose": "Audit papers, specs, GitHub repos, datasheets, and standards.",
        "firstOutput": "technical_risk_register.md",
        "gate": "source_retrieval_or_repo_audit_lane",
    },
    {
        "id": "financial_modeling",
        "purpose": "Model ROI, LCOE, NPV, payback, and sensitivity ranges.",
        "firstOutput": "scenario_model.json",
        "gate": "local_modeling_lane",
    },
    {
        "id": "visual_evidence_audit",
        "purpose": "Verify screenshots, charts, PDF pages, tables, and dashboards.",
        "firstOutput": "visual_evidence_manifest.json",
        "gate": "visual_rag_lane",
    },
    {
        "id": "content_research",
        "purpose": "Create evidence-backed article, script, and campaign briefs.",
        "firstOutput": "content_research_brief.md",
        "gate": "publication_qa_lane",
    },
    {
        "id": "tool_feasibility",
        "purpose": "Evaluate open-source tools and automation stack decisions.",
        "firstOutput": "tool_feasibility_scorecard.md",
        "gate": "external_repo_audit_lane",
    },
    {
        "id": "decision_brief",
        "purpose": "Create operator-ready next-decision summaries.",
        "firstOutput": "executive_summary.md",
        "gate": "local_only_if_inputs_are_local",
    },
]

CONTROL_PLANE = {
    "role": "research_job_router_and_evidence_governor",
    "readOnlyMissionControl": True,
    "executionButtonsAllowed": False,
    "firstProductionUsefulJobs": [
        "SIRINX Solar + BESS payback claim verification",
        "Tariff/PPA/FiT PDF table verification",
        "Solar competitor landing-page positioning audit",
        "Marketing automation GitHub repo feasibility scorecard",
        "AI Money local-business content research pack",
        "Weekly operator decision brief from completed packs",
    ],
    "completedBuildSlice": [
        "Generate Mission Control fixture from runtime report",
        "Add read-only Deep Research tab",
        "Create local job-packet factory",
        "Validate source_registry.json",
        "Generate local report pack folders",
    ],
    "nextBuildSlice": [
        "Keep external retrieval behind executor leases",
        "Add source ingestion adapters only after policy allow",
        "Add retrieval/provider runner only after budget and source policy pass",
    ],
}

REQUIRED_SOURCE_RECORD_KEYS = {
    "source_id",
    "source_type",
    "uri",
    "title",
    "confidentiality",
    "status",
    "hash",
    "allowed_use",
    "notes",
}


def missing_keys(payload: dict[str, Any], required: set[str]) -> list[str]:
    return sorted(required.difference(payload.keys()))


def validate_job_packet(payload: dict[str, Any]) -> list[str]:
    errors = [f"missing_job_key:{key}" for key in missing_keys(payload, REQUIRED_JOB_KEYS)]
    if payload.get("mode") not in {"local_first", "offline_only", "web_allowed_after_policy"}:
        errors.append("invalid_job_mode")
    inputs = payload.get("inputs", {})
    if not isinstance(inputs, dict):
        errors.append("inputs_not_object")
    else:
        for bucket in ["videos", "transcripts", "pdfs", "screenshots", "urls", "tables", "notes"]:
            if bucket not in inputs or not isinstance(inputs[bucket], list):
                errors.append(f"invalid_input_bucket:{bucket}")
    return errors


def validate_evidence_pack(payload: dict[str, Any]) -> list[str]:
    errors = [f"missing_evidence_pack_key:{key}" for key in missing_keys(payload, REQUIRED_EVIDENCE_PACK_KEYS)]
    for key in ["evidence_units", "source_quality_records", "claim_verification_records"]:
        if key in payload and not isinstance(payload[key], list):
            errors.append(f"{key}_not_array")
    for item in payload.get("claim_verification_records", []):
        if item.get("status") == "supported" and not item.get("external_evidence_ids"):
            errors.append(f"supported_claim_without_external_evidence:{item.get('claim_id', 'unknown')}")
    return errors


def collect_sources(job_packet: dict[str, Any]) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    inputs = job_packet.get("inputs", {})
    if not isinstance(inputs, dict):
        return sources
    for bucket, items in inputs.items():
        if not isinstance(items, list):
            continue
        for item in items:
            if not isinstance(item, dict):
                continue
            source_id = str(item.get("source_id", f"src_{bucket}_{len(sources) + 1:03d}"))
            sources.append(
                {
                    "source_id": source_id,
                    "source_type": str(item.get("source_type", bucket.rstrip("s") or "source")),
                    "uri": str(item.get("uri", "")),
                    "title": str(item.get("title", source_id)),
                    "confidentiality": str(item.get("confidentiality", job_packet.get("confidentiality", "internal"))),
                    "status": "registered_placeholder",
                    "hash": "sha256:pending",
                    "allowed_use": "local_planning_only",
                    "notes": str(item.get("notes", "Registered from job packet input placeholder.")),
                }
            )
    return sources


def build_source_registry(job_packet: dict[str, Any]) -> dict[str, Any]:
    sources = collect_sources(job_packet)
    return {
        "schema_version": 1,
        "job_id": job_packet["job_id"],
        "generated_at": now_iso(),
        "mode": "local_source_registry_placeholder",
        "source_count": len(sources),
        "sources": sources,
        "blocked_until_policy_lane": [
            "web_retrieval",
            "browser_capture",
            "paid_portal_access",
            "confidential_upload",
            "connector_write",
        ],
    }


def validate_source_registry(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for key in ["schema_version", "job_id", "generated_at", "sources"]:
        if key not in payload:
            errors.append(f"missing_source_registry_key:{key}")
    sources = payload.get("sources", [])
    if not isinstance(sources, list):
        return errors + ["sources_not_array"]
    seen: set[str] = set()
    for idx, source in enumerate(sources):
        if not isinstance(source, dict):
            errors.append(f"source_not_object:{idx}")
            continue
        missing = sorted(REQUIRED_SOURCE_RECORD_KEYS.difference(source.keys()))
        errors.extend(f"source_{idx}_missing:{key}" for key in missing)
        source_id = str(source.get("source_id", ""))
        if not source_id:
            errors.append(f"source_{idx}_empty_id")
        if source_id in seen:
            errors.append(f"duplicate_source_id:{source_id}")
        seen.add(source_id)
        uri = str(source.get("uri", ""))
        if any(marker in uri.lower() for marker in ["token=", "api_key=", "password=", "secret="]):
            errors.append(f"source_{idx}_secret_like_uri")
    return errors


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def build_report_pack(
    job_packet: dict[str, Any],
    evidence_pack: dict[str, Any],
    source_registry: dict[str, Any],
) -> dict[str, Any]:
    job_id = str(job_packet["job_id"])
    pack_dir = runtime_path("deep_research", "report_packs", job_id)
    pack_dir.mkdir(parents=True, exist_ok=True)

    claims = [
        {
            "claim_id": item.get("claim_id", f"claim_{idx + 1:03d}"),
            "claim_text": item.get("claim_text", ""),
            "claim_type": item.get("claim_type", "unclassified"),
            "status": item.get("status", "unverified"),
            "confidence": item.get("confidence", "unverified"),
        }
        for idx, item in enumerate(evidence_pack.get("claim_verification_records", []))
    ]
    evidence_units = evidence_pack.get("evidence_units", [])
    source_quality_records = evidence_pack.get("source_quality_records", [])

    write_json(pack_dir / "job_packet.json", job_packet)
    write_json(pack_dir / "source_registry.json", source_registry)
    write_json(pack_dir / "claims.json", claims)
    write_json(pack_dir / "evidence_units.json", evidence_units)
    write_json(
        pack_dir / "scenario_model.json",
        {
            "job_id": job_id,
            "status": "not_modeled",
            "base_case": "pending local inputs",
            "aggressive_case": "pending local inputs",
            "worst_case": "pending local inputs",
            "external_execution_enabled": False,
        },
    )
    write_json(
        pack_dir / "control_plane_status.json",
        {
            "job_id": job_id,
            "status": "local_report_pack_generated",
            "generated_at": now_iso(),
            "source_registry_valid": not validate_source_registry(source_registry),
            "job_packet_valid": not validate_job_packet(job_packet),
            "evidence_pack_valid": not validate_evidence_pack(evidence_pack),
            "blocked_actions": BLOCKED_ACTIONS,
        },
    )

    write_csv(
        pack_dir / "source_quality_table.csv",
        source_quality_records,
        ["source_id", "title", "url", "publisher", "source_class", "authority_score", "recency_score", "directness_score", "transparency_score", "bias_penalty", "notes"],
    )
    write_csv(
        pack_dir / "claim_evidence_matrix.csv",
        evidence_pack.get("claim_verification_records", []),
        ["claim_id", "claim_text", "claim_type", "status", "confidence", "base_case", "aggressive_case", "worst_case", "recommendation"],
    )

    contradiction_log = "\n".join(
        [
            "# Contradiction Log",
            "",
            f"- Job: `{job_id}`",
            "- Status: `not_started`",
            "- Notes: External evidence retrieval has not run in this lane.",
            "",
        ]
    )
    write_text(pack_dir / "contradiction_log.md", contradiction_log)
    write_text(
        pack_dir / "research_report.md",
        "\n".join(
            [
                "# Research Report Draft",
                "",
                f"Job: `{job_id}`",
                "",
                "This is a local report-pack scaffold. No external retrieval, provider call, scraping, or publication has run.",
                "",
            ]
        ),
    )
    write_text(
        pack_dir / "executive_summary.md",
        "\n".join(
            [
                "# Executive Summary Draft",
                "",
                "Current decision: keep material claims unverified until source retrieval and scenario modeling run in a separate policy-approved lane.",
                "",
            ]
        ),
    )
    write_text(
        pack_dir / "action_roadmap.md",
        "\n".join(
            [
                "# Action Roadmap",
                "",
                "1. Bind local source files or approved URLs in source_registry.json.",
                "2. Run source registry validation.",
                "3. Open retrieval/provider lane only after policy, budget, and source rules pass.",
                "",
            ]
        ),
    )
    write_text(
        pack_dir / "memory_pulse.md",
        "\n".join(
            [
                "# Memory Pulse",
                "",
                f"Deep Research report pack `{job_id}` generated locally with no external execution.",
                "",
            ]
        ),
    )

    artifacts = sorted(str(path.relative_to(pack_dir)) for path in pack_dir.iterdir() if path.is_file())
    manifest = {
        "job_id": job_id,
        "generated_at": now_iso(),
        "pack_dir": str(pack_dir),
        "artifact_count": len(artifacts),
        "artifacts": artifacts,
        "source_registry_errors": validate_source_registry(source_registry),
        "blocked_actions": BLOCKED_ACTIONS,
    }
    write_json(pack_dir / "manifest.json", manifest)
    return manifest


def build_status() -> dict[str, Any]:
    ensure_runtime()
    job_packet = read_json(JOB_PACKET_EXAMPLE)
    evidence_pack = read_json(EVIDENCE_PACK_EXAMPLE)
    source_registry = build_source_registry(job_packet)
    report_pack = build_report_pack(job_packet, evidence_pack, source_registry)
    schema_files = sorted(str(path.relative_to(REPO_ROOT)) for path in SCHEMA_DIR.glob("deep-research-*.schema.json"))
    docs = sorted(str(path.relative_to(REPO_ROOT)) for path in DEEP_RESEARCH_DIR.glob("*.md"))

    validation = {
        "jobPacketErrors": validate_job_packet(job_packet),
        "evidencePackErrors": validate_evidence_pack(evidence_pack),
        "sourceRegistryErrors": validate_source_registry(source_registry),
        "schemaFilesPresent": len(schema_files),
        "policyPresent": POLICY_PATH.exists(),
        "controlPlaneDocPresent": CONTROL_PLANE_DOC.exists(),
        "reportPackArtifacts": report_pack["artifact_count"],
    }

    status = {
        "updatedAt": now_iso(),
        "mode": "deep_research_system_design_local_only",
        "generatedBy": "scripts/a2a/a2a_deep_research_system.py",
        "runtimeRoot": str(runtime_path("deep_research")),
        "summary": {
            "status": "ready_for_local_review_only",
            "docs": len(docs),
            "schemaFiles": len(schema_files),
            "agentRoles": len(AGENT_MESH),
            "jobClasses": len(JOB_CLASSES),
            "outputArtifacts": len(OUTPUT_PACK),
            "blockedActions": len(BLOCKED_ACTIONS),
            "jobPacketValid": not validation["jobPacketErrors"],
            "evidencePackValid": not validation["evidencePackErrors"],
            "sourceRegistryValid": not validation["sourceRegistryErrors"],
            "reportPackArtifacts": report_pack["artifact_count"],
            "externalExecutionEnabled": False,
        },
        "docs": docs,
        "schemas": schema_files,
        "agentMesh": AGENT_MESH,
        "jobClasses": JOB_CLASSES,
        "controlPlane": CONTROL_PLANE,
        "reportPack": report_pack,
        "outputPack": OUTPUT_PACK,
        "blockedActions": BLOCKED_ACTIONS,
        "validation": validation,
        "nextSafeActions": [
            "Review docs/deep_research/DEEP_RESEARCH_SYSTEM_DESIGN.md.",
            "Review docs/deep_research/DEEP_RESEARCH_CONTROL_PLANE.md.",
            "Review the generated local report pack before opening retrieval lanes.",
            "Bind approved local source files or approved URLs in source_registry.json.",
            "Open a separate policy-approved retrieval lane before any web/provider research.",
            "Keep confidential raw inputs local and hash-referenced.",
        ],
    }
    write_json(REPORT_JSON, status)
    write_text(REPORT_MD, to_markdown(status))
    write_json(FIXTURE_PATH, status)
    return status


def to_markdown(status: dict[str, Any]) -> str:
    lines = [
        "# Deep Research System Design Runtime",
        "",
        f"- Updated: `{status['updatedAt']}`",
        f"- Mode: `{status['mode']}`",
        f"- Status: `{status['summary']['status']}`",
        f"- Docs: `{status['summary']['docs']}`",
        f"- Schemas: `{status['summary']['schemaFiles']}`",
        f"- Agent roles: `{status['summary']['agentRoles']}`",
        f"- Job classes: `{status['summary']['jobClasses']}`",
        f"- Output artifacts: `{status['summary']['outputArtifacts']}`",
        f"- Report pack artifacts: `{status['summary']['reportPackArtifacts']}`",
        f"- Source registry valid: `{status['summary']['sourceRegistryValid']}`",
        f"- External execution enabled: `{status['summary']['externalExecutionEnabled']}`",
        "",
        "## Agent Mesh",
        "",
    ]
    lines.extend(f"- `{agent}`" for agent in status["agentMesh"])
    lines.extend(["", "## Job Classes", ""])
    for item in status["jobClasses"]:
        lines.append(f"- `{item['id']}` -> `{item['firstOutput']}` via `{item['gate']}`")
    lines.extend(["", "## Completed Build Slice", ""])
    lines.extend(f"- {item}" for item in status["controlPlane"]["completedBuildSlice"])
    lines.extend(["", "## Control Plane Next Build Slice", ""])
    lines.extend(f"- {item}" for item in status["controlPlane"]["nextBuildSlice"])
    lines.extend(["", "## Local Report Pack", ""])
    lines.append(f"- Directory: `{status['reportPack']['pack_dir']}`")
    lines.append(f"- Artifacts: `{status['reportPack']['artifact_count']}`")
    for item in status["reportPack"]["artifacts"]:
        lines.append(f"- `{item}`")
    lines.extend(["", "## Validation", ""])
    for key, value in status["validation"].items():
        lines.append(f"- `{key}`: `{value}`")
    lines.extend(["", "## Blocked Actions", ""])
    lines.extend(f"- `{item}`" for item in status["blockedActions"])
    lines.extend(["", "## Next Safe Actions", ""])
    lines.extend(f"- {item}" for item in status["nextSafeActions"])
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    status = build_status()
    print(
        json.dumps(
            {
                "json_report": str(REPORT_JSON),
                "markdown_report": str(REPORT_MD),
                "fixture": str(FIXTURE_PATH),
                "status": status["summary"]["status"],
                "job_packet_valid": status["summary"]["jobPacketValid"],
                "evidence_pack_valid": status["summary"]["evidencePackValid"],
                "source_registry_valid": status["summary"]["sourceRegistryValid"],
                "report_pack_artifacts": status["summary"]["reportPackArtifacts"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
