#!/usr/bin/env python3
"""Clone only registry-whitelisted external repos into the external root."""

from __future__ import annotations

import argparse
import subprocess

from _common import EXTERNAL_ROOT, ensure_runtime, now_iso, parse_registry_entries, runtime_path, safe_external_path, write_json


def git_url(repo: str) -> str:
    return f"https://github.com/{repo}.git"


def clone_entry(entry: dict[str, str], execute: bool) -> dict[str, str | int | bool]:
    name = entry.get("name", "")
    repo = entry.get("repo", "")
    policy = entry.get("clone_policy", "")
    path = safe_external_path(entry.get("clone_path", ""))
    result: dict[str, str | int | bool] = {"name": name, "repo": repo, "policy": policy}
    if policy != "allow":
        result.update({"status": "skipped", "reason": "clone_policy_not_allow"})
        return result
    if not path:
        result.update({"status": "skipped", "reason": "unsafe_or_missing_clone_path"})
        return result
    if path.exists():
        result.update({"status": "skipped", "reason": "path_exists", "path": str(path)})
        return result
    result["path"] = str(path)
    if not execute:
        result.update({"status": "planned", "reason": "dry_run"})
        return result
    EXTERNAL_ROOT.mkdir(parents=True, exist_ok=True)
    proc = subprocess.run(["git", "clone", git_url(repo), str(path)], text=True, capture_output=True, timeout=180, check=False)
    result.update({"status": "cloned" if proc.returncode == 0 else "failed", "returncode": proc.returncode})
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Clone whitelisted external repos")
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    ensure_runtime()
    results = [clone_entry(entry, args.execute) for entry in parse_registry_entries()]
    report = {"created_at": now_iso(), "execute": args.execute, "results": results}
    out = runtime_path("logs", "clone_whitelist.json")
    write_json(out, report)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
