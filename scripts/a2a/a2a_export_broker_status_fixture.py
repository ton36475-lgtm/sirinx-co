#!/usr/bin/env python3
"""Export Codex command broker runtime artifacts to a Mission Control fixture."""

from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, mask_secret_text, now_iso, read_json, runtime_path, write_json

REPO_ROOT = Path(__file__).resolve().parents[2]
FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "codexCommandBrokerStatus.json"


def load_broker_artifacts() -> list[dict[str, Any]]:
    artifacts = []
    for path in sorted(runtime_path("artifacts").glob("BROKER-*.json")):
        try:
            data = read_json(path)
        except (OSError, ValueError):
            continue
        artifacts.append(
            {
                "artifactPath": str(path),
                "createdAt": data.get("created_at", ""),
                "tool": data.get("tool", ""),
                "action": data.get("action", ""),
                "decision": data.get("decision", "blocked"),
                "reason": data.get("reason", ""),
                "requiredGate": data.get("required_gate", ""),
                "nextStep": data.get("next_step", ""),
                "targetRepo": data.get("target_repo", ""),
                "repoName": data.get("repo_entry", {}).get("name", ""),
                "repoRole": data.get("repo_entry", {}).get("role", ""),
                "goalHash": data.get("goal_hash", ""),
                "goalPreview": mask_secret_text(str(data.get("goal", "")))[:140],
            }
        )
    return sorted(artifacts, key=lambda item: (item["createdAt"], item["artifactPath"]), reverse=True)


def main() -> int:
    ensure_runtime()
    broker_artifacts = load_broker_artifacts()
    counts = Counter(item["decision"] for item in broker_artifacts)
    fixture = {
        "updatedAt": now_iso(),
        "mode": "read_only_runtime_fixture",
        "sourceGlob": str(runtime_path("artifacts", "BROKER-*.json")),
        "generatedBy": "scripts/a2a/a2a_export_broker_status_fixture.py",
        "summary": {
            "total": len(broker_artifacts),
            "autoAllowDryRun": counts.get("auto_allow_dry_run", 0),
            "requiresExecutorLease": counts.get("requires_executor_lease", 0),
            "policyControlledRegistryAllow": counts.get("policy_controlled_registry_allow", 0),
            "blockedFirstPhase": counts.get("blocked_first_phase", 0),
            "blocked": counts.get("blocked", 0),
        },
        "policyBoundary": [
            "fixture_only_no_browser_file_access",
            "no_provider_call",
            "no_push",
            "no_deploy",
            "no_clone_execution",
            "no_public_endpoint",
            "no_secret_read_or_print",
            "blocked_decision_does_not_become_bypass",
        ],
        "decisions": broker_artifacts[:12],
    }
    write_json(FIXTURE_PATH, fixture)
    print(f"wrote {FIXTURE_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
