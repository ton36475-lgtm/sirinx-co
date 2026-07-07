#!/usr/bin/env python3
"""Shared helpers for the local A2A file-queue bridge."""

from __future__ import annotations

import datetime as _dt
import hashlib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any

RUNTIME_ROOT = Path(
    os.path.expanduser(os.environ.get("A2A_RUNTIME_ROOT", "~/SIRINXDev/.ghostclaw_runtime/a2async"))
)
EXTERNAL_ROOT = Path(os.path.expanduser(os.environ.get("A2A_EXTERNAL_ROOT", "~/SIRINXDev/_external_repos")))
REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = REPO_ROOT / "registry" / "external_git_repos.yaml"

RUNTIME_DIRS = [
    "inbox",
    "outbox",
    "running",
    "completed",
    "failed",
    "skipped",
    "quarantined",
    "artifacts",
    "repo_audits",
    "state",
    "logs",
    "memory",
    "model_routes",
    "kill_switch",
]

SECRET_PATTERNS = [
    re.compile(r"(sk-[A-Za-z0-9_-]{12,})"),
    re.compile(r"(kob_[A-Za-z0-9_-]{8,})"),
    re.compile(r"(gh[opu]_)[A-Za-z0-9_]{20,}"),
    re.compile(r"(hf_)[A-Za-z0-9_]{20,}"),
    re.compile(r"([A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|API_KEY)[A-Za-z0-9_]*=)([^\s]+)", re.I),
    re.compile(r"(Bearer\s+)([A-Za-z0-9._-]+)", re.I),
    re.compile(r"(postgres(?:ql)?:\/\/)[^@\s]+@"),
    re.compile(r"(redis:\/\/:)[^@\s]+@"),
    re.compile(r"(maxplus|openrouter|supabase)_[A-Za-z0-9_]{16,}", re.I),
]


def now_iso() -> str:
    return _dt.datetime.now(_dt.UTC).replace(microsecond=0).isoformat()


def runtime_path(*parts: str) -> Path:
    return RUNTIME_ROOT.joinpath(*parts)


def ensure_runtime() -> None:
    for name in RUNTIME_DIRS:
        runtime_path(name).mkdir(parents=True, exist_ok=True)


def kill_switch_active() -> bool:
    return runtime_path("kill_switch", "STOP_ALL").exists()


def mask_secret_text(text: str) -> str:
    masked = text
    for pattern in SECRET_PATTERNS:
        if pattern.groups >= 2:
            masked = pattern.sub(lambda m: f"{m.group(1)}<masked>", masked)
        else:
            masked = pattern.sub("<masked>", masked)
    return masked


def safe_run(cmd: list[str], timeout: int = 12) -> dict[str, Any]:
    try:
        proc = subprocess.run(
            cmd,
            text=True,
            capture_output=True,
            timeout=timeout,
            check=False,
        )
        return {
            "cmd": cmd,
            "found": True,
            "returncode": proc.returncode,
            "stdout": mask_secret_text(proc.stdout.strip()),
            "stderr": mask_secret_text(proc.stderr.strip()),
        }
    except FileNotFoundError:
        return {"cmd": cmd, "found": False, "returncode": 127, "stdout": "", "stderr": "not found"}
    except subprocess.TimeoutExpired as exc:
        return {
            "cmd": cmd,
            "found": True,
            "returncode": 124,
            "stdout": mask_secret_text((exc.stdout or "").strip() if isinstance(exc.stdout, str) else ""),
            "stderr": "timeout",
        }


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def slugify(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9_.-]+", "-", value.strip()).strip("-")
    return value.lower() or "task"


def task_id(prefix: str = "A2A") -> str:
    stamp = _dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"{prefix}-{stamp}"


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def which(name: str) -> str | None:
    return shutil.which(name)


def atomic_move(src: Path, target_dir: Path) -> Path:
    target_dir.mkdir(parents=True, exist_ok=True)
    dest = target_dir / src.name
    if dest.exists():
        dest = target_dir / f"{src.stem}-{_dt.datetime.now().strftime('%H%M%S')}{src.suffix}"
    src.replace(dest)
    return dest


def parse_registry_entries(path: Path = REGISTRY_PATH) -> list[dict[str, str]]:
    """Parse the project-owned YAML subset without requiring PyYAML."""
    if not path.exists():
        return []

    entries: list[dict[str, str]] = []
    current: dict[str, str] | None = None
    wanted = {"name", "repo", "role", "clone_path", "clone_policy", "policy", "notes"}

    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("- name:"):
            if current:
                entries.append(current)
            current = {"name": line.split(":", 1)[1].strip()}
            continue
        if current and ":" in line:
            key, value = line.split(":", 1)
            key = key.strip()
            if key in wanted:
                current[key] = value.strip()
    if current:
        entries.append(current)
    return entries


def safe_external_path(path_text: str) -> Path | None:
    if not path_text or path_text in {"none", "detect_from_local_git"}:
        return None
    expanded = Path(os.path.expanduser(path_text)).resolve()
    try:
        expanded.relative_to(EXTERNAL_ROOT.resolve())
    except ValueError:
        return None
    return expanded


def summarize_counts() -> dict[str, int]:
    ensure_runtime()
    return {name: len(list(runtime_path(name).glob("*.json"))) for name in RUNTIME_DIRS if name not in {"kill_switch"}}
