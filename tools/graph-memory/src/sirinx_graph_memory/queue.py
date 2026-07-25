"""Append-only, idempotent proposal queue owned by the local Hermes lane."""

from __future__ import annotations

import fcntl
import hashlib
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from .errors import GraphMemoryPolicyError
from .models import MemoryProposal
from .paths import ensure_runtime_root, queue_path

_MAX_QUEUE_BYTES = 32 * 1024 * 1024


def _canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def _ensure_regular_or_missing(path: Path) -> None:
    if path.is_symlink():
        raise GraphMemoryPolicyError("proposal queue cannot be a symlink")
    if path.exists() and not path.is_file():
        raise GraphMemoryPolicyError("proposal queue must be a regular file")
    if path.exists() and path.stat().st_size > _MAX_QUEUE_BYTES:
        raise GraphMemoryPolicyError("proposal queue reached its bounded size")


def append_proposal(proposal: MemoryProposal) -> dict[str, Any]:
    ensure_runtime_root()
    path = queue_path()
    _ensure_regular_or_missing(path)
    lock_path = path.with_suffix(path.suffix + ".lock")
    if lock_path.is_symlink():
        raise GraphMemoryPolicyError("proposal lock cannot be a symlink")

    lock_fd = os.open(lock_path, os.O_CREAT | os.O_RDWR, 0o600)
    try:
        os.chmod(lock_path, 0o600)
        with os.fdopen(lock_fd, "r+", encoding="utf-8", closefd=False) as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            existing = _find_existing(path, proposal.proposal_id)
            if existing is not None:
                return {
                    "status": "ALREADY_QUEUED",
                    "proposal_id": proposal.proposal_id,
                    "content_digest": proposal.content_digest,
                    "record_sha256": existing["record_sha256"],
                    "authority": "proposal_only",
                    "next": "HERMES_REVIEW_REQUIRED",
                }

            record = {
                "queued_at": datetime.now(UTC).isoformat(),
                **proposal.model_dump(mode="json"),
            }
            encoded = (_canonical_json(record) + "\n").encode("utf-8")
            record_sha = hashlib.sha256(encoded.rstrip(b"\n")).hexdigest()
            fd = os.open(path, os.O_CREAT | os.O_APPEND | os.O_WRONLY, 0o600)
            try:
                os.chmod(path, 0o600)
                os.write(fd, encoded)
                os.fsync(fd)
            finally:
                os.close(fd)
            return {
                "status": "QUEUED_FOR_HERMES_REVIEW",
                "proposal_id": proposal.proposal_id,
                "content_digest": proposal.content_digest,
                "record_sha256": f"sha256:{record_sha}",
                "authority": "proposal_only",
                "next": "HERMES_REVIEW_REQUIRED",
            }
    finally:
        try:
            os.close(lock_fd)
        except OSError:
            pass


def _find_existing(path: Path, proposal_id: str) -> dict[str, str] | None:
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError as exc:
                raise GraphMemoryPolicyError("proposal queue is corrupted") from exc
            if record.get("proposal_id") == proposal_id:
                digest = hashlib.sha256(line.rstrip("\n").encode("utf-8")).hexdigest()
                return {"record_sha256": f"sha256:{digest}"}
    return None


def list_proposals(limit: int = 20) -> list[dict[str, Any]]:
    if limit < 1 or limit > 100:
        raise GraphMemoryPolicyError("proposal list limit must be between 1 and 100")
    path = queue_path()
    _ensure_regular_or_missing(path)
    if not path.exists():
        return []
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if line.strip():
                records.append(json.loads(line))
    return records[-limit:]
