#!/usr/bin/env python3
"""Validate the external repo registry using standard library parsing."""

from __future__ import annotations

import argparse

from _common import REGISTRY_PATH, ensure_runtime, now_iso, parse_registry_entries, runtime_path, write_json


def validate(entries: list[dict[str, str]]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    names = set()
    for entry in entries:
        name = entry.get("name", "")
        repo = entry.get("repo", "")
        policy = entry.get("clone_policy", "")
        if not name:
            errors.append("entry without name")
        if name in names:
            errors.append(f"duplicate repo name: {name}")
        names.add(name)
        if not repo:
            errors.append(f"{name}: missing repo")
        if policy not in {"allow", "skip"}:
            warnings.append(f"{name}: clone_policy is {policy or '<missing>'}")
        if repo == "unverified" and policy != "skip":
            errors.append(f"{name}: unverified repo must be skipped")
        if repo == "canonical_remote_pending" and policy != "skip":
            errors.append(f"{name}: pending canonical remote must be skipped")
    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate registry/external_git_repos.yaml")
    parser.add_argument("--validate", action="store_true")
    args = parser.parse_args()
    ensure_runtime()
    entries = parse_registry_entries(REGISTRY_PATH)
    errors, warnings = validate(entries)
    report = {
        "created_at": now_iso(),
        "registry": str(REGISTRY_PATH),
        "entry_count": len(entries),
        "errors": errors,
        "warnings": warnings,
    }
    out = runtime_path("logs", "repo_registry_validation.json")
    write_json(out, report)
    print(f"validated {len(entries)} entries; errors={len(errors)} warnings={len(warnings)}")
    return 1 if errors and args.validate else 0


if __name__ == "__main__":
    raise SystemExit(main())
