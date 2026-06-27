#!/usr/bin/env python3
"""Validate the Mission Control Codex command broker status fixture."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any

from _common import mask_secret_text, now_iso, read_json, runtime_path, write_json

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_FIXTURE_PATH = (
    REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "codexCommandBrokerStatus.json"
)
ALLOWED_DECISIONS = {
    "auto_allow_dry_run",
    "requires_executor_lease",
    "policy_controlled_registry_allow",
    "blocked_first_phase",
    "blocked",
}
REQUIRED_BOUNDARIES = {
    "fixture_only_no_browser_file_access",
    "no_provider_call",
    "no_push",
    "no_deploy",
    "no_clone_execution",
    "no_public_endpoint",
    "no_secret_read_or_print",
    "blocked_decision_does_not_become_bypass",
}
SUMMARY_KEYS = {
    "auto_allow_dry_run": "autoAllowDryRun",
    "requires_executor_lease": "requiresExecutorLease",
    "policy_controlled_registry_allow": "policyControlledRegistryAllow",
    "blocked_first_phase": "blockedFirstPhase",
    "blocked": "blocked",
}


def load_fixture(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_fixture(path: Path) -> tuple[list[str], list[str], dict[str, Any]]:
    errors: list[str] = []
    warnings: list[str] = []
    fixture = load_fixture(path)
    raw_fixture = path.read_text(encoding="utf-8")
    if mask_secret_text(raw_fixture) != raw_fixture:
        errors.append("fixture_contains_secret_like_text")

    decisions = fixture.get("decisions", [])
    if not isinstance(decisions, list):
        errors.append("decisions_is_not_list")
        decisions = []

    counts = Counter()
    for index, item in enumerate(decisions):
        if not isinstance(item, dict):
            errors.append(f"decision_{index}_is_not_object")
            continue
        decision = str(item.get("decision", ""))
        counts[decision] += 1
        if decision not in ALLOWED_DECISIONS:
            errors.append(f"decision_{index}_unknown_decision:{decision}")
        for key in ["artifactPath", "tool", "action", "reason", "requiredGate", "nextStep", "goalHash"]:
            if not item.get(key):
                errors.append(f"decision_{index}_missing_{key}")

        artifact_path = Path(str(item.get("artifactPath", "")))
        if not artifact_path.exists():
            errors.append(f"decision_{index}_missing_artifact:{artifact_path}")
            continue
        try:
            artifact = read_json(artifact_path)
        except (OSError, ValueError) as exc:
            errors.append(f"decision_{index}_artifact_unreadable:{exc}")
            continue

        expected_pairs = {
            "tool": "tool",
            "action": "action",
            "decision": "decision",
            "reason": "reason",
            "requiredGate": "required_gate",
            "goalHash": "goal_hash",
        }
        for fixture_key, artifact_key in expected_pairs.items():
            if item.get(fixture_key) != artifact.get(artifact_key):
                errors.append(f"decision_{index}_artifact_mismatch_{fixture_key}")

    summary = fixture.get("summary", {})
    if summary.get("total") != len(decisions):
        errors.append("summary_total_mismatch")
    for decision, summary_key in SUMMARY_KEYS.items():
        if summary.get(summary_key) != counts.get(decision, 0):
            errors.append(f"summary_{summary_key}_mismatch")

    boundary = set(fixture.get("policyBoundary", []))
    missing_boundaries = sorted(REQUIRED_BOUNDARIES - boundary)
    if missing_boundaries:
        errors.append(f"missing_policy_boundaries:{','.join(missing_boundaries)}")

    if not decisions:
        warnings.append("no_broker_decisions_in_fixture")
    if counts.get("blocked", 0) == 0:
        warnings.append("no_blocked_decision_sample")
    if counts.get("requires_executor_lease", 0) == 0:
        warnings.append("no_lease_required_decision_sample")

    report = {
        "created_at": now_iso(),
        "fixture_path": str(path),
        "decision_count": len(decisions),
        "errors": errors,
        "warnings": warnings,
        "counts": dict(counts),
    }
    return errors, warnings, report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate Mission Control broker status fixture")
    parser.add_argument("--fixture", default=str(DEFAULT_FIXTURE_PATH))
    parser.add_argument("--strict", action="store_true", help="Fail on warnings as well as errors")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    fixture_path = Path(args.fixture).expanduser()
    errors, warnings, report = validate_fixture(fixture_path)
    out = runtime_path("logs", "broker_status_validation.json")
    write_json(out, report)
    print(
        json.dumps(
            {
                "fixture": str(fixture_path),
                "report": str(out),
                "decision_count": report["decision_count"],
                "errors": len(errors),
                "warnings": len(warnings),
            },
            indent=2,
            sort_keys=True,
        )
    )
    if errors or (args.strict and warnings):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
