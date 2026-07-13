#!/usr/bin/env python3
"""Append concise, secret-safe work pulses to the SIRINX Obsidian Brain."""

from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import re
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from _common import mask_secret_text, now_iso


DEFAULT_CONFIG = Path(
    os.path.expanduser(
        os.environ.get(
            "SIRINX_OBSIDIAN_SYNC_CONFIG",
            "/Users/sirinx/.codex/obsidian-brain-sync.json",
        )
    )
)

FIELD_LIMITS = {
    "title": 160,
    "summary": 1200,
    "source": 1200,
    "next_action": 1200,
}

SECRET_HINTS = [
    re.compile(r"kob_[A-Za-z0-9_-]{8,}"),
    re.compile(r"sk-[A-Za-z0-9_-]{12,}"),
    re.compile(r"gh[opsu]_[A-Za-z0-9_]{20,}"),
    re.compile(r"hf_[A-Za-z0-9_]{20,}"),
    re.compile(r"Bearer\s+[A-Za-z0-9._-]+", re.I),
    re.compile(r"(api[_-]?key|token|secret|password)\s*[:=]\s*[^\s]+", re.I),
    re.compile(r"(?:postgres(?:ql)?|redis)://[^@\s]+@", re.I),
]


@dataclass(frozen=True)
class SyncConfig:
    config_path: Path
    vault_root: Path
    digest_note: Path
    runtime_jsonl: Path
    may_write_digest: bool
    worker: str
    mode: str


def _require_string(data: dict[str, Any], key: str) -> str:
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise SystemExit(f"blocked: config field {key!r} must be a non-empty string")
    return value.strip()


def load_config(path: Path) -> SyncConfig:
    path = path.expanduser().resolve()
    if not path.is_file():
        raise SystemExit(f"blocked: Obsidian sync config missing: {path}")

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"blocked: invalid Obsidian sync config: {exc}") from exc
    if not isinstance(raw, dict):
        raise SystemExit("blocked: Obsidian sync config must be a JSON object")

    vault_root = Path(_require_string(raw, "vault_root")).expanduser().resolve()
    digest_note = Path(_require_string(raw, "digest_note")).expanduser().resolve()
    runtime_jsonl = Path(_require_string(raw, "runtime_jsonl")).expanduser().resolve()
    worker = str(raw.get("worker", "unknown")).strip() or "unknown"
    mode = str(raw.get("mode", "local-first")).strip() or "local-first"
    may_write_digest = raw.get("may_write_digest") is True

    if not vault_root.is_dir():
        raise SystemExit(f"blocked: vault root missing: {vault_root}")
    if not digest_note.is_file():
        raise SystemExit(f"blocked: digest note missing: {digest_note}")
    try:
        digest_note.relative_to(vault_root)
    except ValueError as exc:
        raise SystemExit("blocked: digest note must resolve inside the configured vault") from exc
    if not runtime_jsonl.is_absolute():
        raise SystemExit("blocked: runtime_jsonl must be an absolute path")
    if mode not in {"local-first", "local_first_brain_sync"}:
        raise SystemExit(f"blocked: unsupported Obsidian sync mode: {mode}")

    return SyncConfig(
        config_path=path,
        vault_root=vault_root,
        digest_note=digest_note,
        runtime_jsonl=runtime_jsonl,
        may_write_digest=may_write_digest,
        worker=worker,
        mode=mode,
    )


def assert_safe(text: str) -> None:
    for pattern in SECRET_HINTS:
        if pattern.search(text):
            raise SystemExit("blocked: secret-like value detected in Obsidian sync input")


def normalize_field(name: str, value: str) -> str:
    assert_safe(value)
    normalized = " ".join(value.strip().split())
    if not normalized:
        raise SystemExit(f"blocked: {name} must not be empty")
    if len(normalized) > FIELD_LIMITS[name]:
        raise SystemExit(
            f"blocked: {name} exceeds the {FIELD_LIMITS[name]} character limit"
        )
    return mask_secret_text(normalized).replace("`", "\\`")


def build_entry(
    title: str,
    summary: str,
    source: str,
    next_action: str,
    *,
    stamp: str,
) -> tuple[str, dict[str, str]]:
    fields = {
        "title": normalize_field("title", title),
        "summary": normalize_field("summary", summary),
        "source": normalize_field("source", source),
        "next_action": normalize_field("next_action", next_action),
    }
    entry = "\n".join(
        [
            "",
            f"## {stamp} - {fields['title']}",
            "",
            f"- Summary: {fields['summary']}",
            f"- Source: `{fields['source']}`",
            f"- Next action: `{fields['next_action']}`",
            "- Policy: local-only Obsidian Brain sync; no secrets, provider calls, clone, deploy, push, or public endpoint.",
            "",
        ]
    )
    return entry, fields


def locked_append(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def write_json_atomic(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(data, indent=2, ensure_ascii=False, sort_keys=True) + "\n"
    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        dir=path.parent,
        prefix=f".{path.name}.",
        delete=False,
    ) as handle:
        temp_path = Path(handle.name)
        handle.write(rendered)
        handle.flush()
        os.fsync(handle.fileno())
    os.chmod(temp_path, 0o600)
    temp_path.replace(path)


def check_payload(config: SyncConfig) -> dict[str, Any]:
    return {
        "status": "ready" if config.may_write_digest else "read_only",
        "config": str(config.config_path),
        "worker": config.worker,
        "mode": config.mode,
        "vault_root": str(config.vault_root),
        "digest_note": str(config.digest_note),
        "runtime_jsonl": str(config.runtime_jsonl),
        "may_write_digest": config.may_write_digest,
        "provider_call": False,
        "secret_access": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Append a safe Obsidian Brain sync pulse")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--title")
    parser.add_argument("--summary")
    parser.add_argument("--source")
    parser.add_argument("--next-action")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    config = load_config(args.config)
    if args.check:
        print(json.dumps(check_payload(config), indent=2, sort_keys=True))
        return 0

    required = {
        "title": args.title,
        "summary": args.summary,
        "source": args.source,
        "next_action": args.next_action,
    }
    missing = [name for name, value in required.items() if value is None]
    if missing:
        parser.error("missing required arguments: " + ", ".join(f"--{x.replace('_', '-')}" for x in missing))

    stamp = now_iso()
    entry, fields = build_entry(stamp=stamp, **required)
    if args.dry_run:
        print(entry)
        return 0
    if not config.may_write_digest:
        raise SystemExit(f"blocked: worker {config.worker!r} may not write the digest")

    event = {
        "schema": "ghostclaw.obsidian-sync-event.v2",
        "created_at": stamp,
        **fields,
        "digest": str(config.digest_note),
        "runtime_jsonl": str(config.runtime_jsonl),
        "entry_sha256": hashlib.sha256(entry.encode("utf-8")).hexdigest(),
        "dry_run": False,
        "provider_call": False,
        "secret_access": False,
    }

    config.runtime_jsonl.parent.mkdir(parents=True, exist_ok=True)
    locked_append(config.digest_note, entry)
    locked_append(
        config.runtime_jsonl,
        json.dumps(event, ensure_ascii=False, sort_keys=True) + "\n",
    )
    write_json_atomic(config.runtime_jsonl.parent / "obsidian_sync_last.json", event)
    print(f"appended {config.digest_note}")
    print(f"wrote {config.runtime_jsonl}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
