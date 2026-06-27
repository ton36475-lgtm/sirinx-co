#!/usr/bin/env python3
"""Audit cloned external repos without installing dependencies or printing secrets."""

from __future__ import annotations

import argparse
import os
import re
from pathlib import Path

from _common import ensure_runtime, now_iso, parse_registry_entries, runtime_path, safe_external_path, safe_run, write_json

RISK_PATTERNS = [
    re.compile(r"\bsudo\b"),
    re.compile(r"\bcurl\b.+\|\s*(?:sh|bash)"),
    re.compile(r"\beval\s*\("),
    re.compile(r"APP_BIND\s*=\s*0\.0\.0\.0"),
    re.compile(r"AUTH_ENABLED\s*=\s*false", re.I),
    re.compile(r"public\s+tunnel", re.I),
]

IMPORTANT_FILES = [
    "README.md",
    "LICENSE",
    "LICENSE.md",
    "SECURITY.md",
    "package.json",
    "pnpm-lock.yaml",
    "requirements.txt",
    "pyproject.toml",
    "docker-compose.yml",
    "compose.yaml",
    "Makefile",
]


def risk_grep(root: Path) -> list[dict[str, str | int]]:
    hits: list[dict[str, str | int]] = []
    excluded = {".git", "node_modules", "dist", "build", "coverage", "vendor"}
    for current, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in excluded]
        for filename in files:
            path = Path(current) / filename
            if path.stat().st_size > 1_000_000:
                continue
            try:
                lines = path.read_text(encoding="utf-8", errors="ignore").splitlines()
            except OSError:
                continue
            for line_no, line in enumerate(lines, 1):
                if any(pattern.search(line) for pattern in RISK_PATTERNS):
                    hits.append({"file": str(path.relative_to(root)), "line": line_no})
    return hits


def audit_entry(entry: dict[str, str], execute: bool) -> dict:
    path = safe_external_path(entry.get("clone_path", ""))
    result = {"name": entry.get("name", ""), "repo": entry.get("repo", ""), "clone_path": entry.get("clone_path", "")}
    if not path:
        result["status"] = "skipped"
        result["reason"] = "unsafe_or_non_external_path"
        return result
    if not path.exists():
        result["status"] = "skipped"
        result["reason"] = "not_cloned"
        return result
    if not execute:
        result["status"] = "planned"
        result["reason"] = "dry_run"
        return result
    result["status"] = "audited"
    result["git_branch"] = safe_run(["git", "-C", str(path), "branch", "--show-current"], timeout=8)
    result["git_commit"] = safe_run(["git", "-C", str(path), "rev-parse", "--short", "HEAD"], timeout=8)
    result["git_status"] = safe_run(["git", "-C", str(path), "status", "--short"], timeout=8)
    result["important_files"] = {name: (path / name).exists() for name in IMPORTANT_FILES}
    result["risk_hits_file_line_only"] = risk_grep(path)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit whitelisted external repos")
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    execute = args.execute and not args.dry_run
    ensure_runtime()
    reports = [audit_entry(entry, execute) for entry in parse_registry_entries()]
    out = runtime_path("repo_audits", "external_repo_audit.json")
    write_json(out, {"created_at": now_iso(), "execute": execute, "reports": reports})
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
