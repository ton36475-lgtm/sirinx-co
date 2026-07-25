"""Read-only Obsidian projection for Hermes.

The live vault is touched only by the two explicit CLI entrypoints at the
bottom of this module. Tests call the same scanner with synthetic vaults.
Projection output is sanitized, content-addressed, and confined to the
project-local runtime directory.
"""

# ruff: noqa: E402

from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, TypedDict

from .offline_policy import enforce_process_offline

enforce_process_offline()

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import END, START, StateGraph

from .errors import GraphMemoryPolicyError
from .paths import ensure_runtime_root
from .security import redact_text_with_count, secret_kinds

CANONICAL_VAULT_ROOT = Path("/Users/sirinx/Documents/Obsidian Vault/SIRINX")
MAX_NOTE_BYTES = 512 * 1024
MAX_PROJECTION_MANIFEST_BYTES = 64 * 1024
MAX_PROJECTION_ARTIFACT_BYTES = 128 * 1024 * 1024
PROJECTION_POLICY_VERSION = "1.0.0"
_DIGEST_PREFIX = "sha256:"


@dataclass(frozen=True)
class NoteSnapshot:
    source_path: Path
    display_path: str
    path_digest: str
    size_bytes: int
    content_sha256: str
    sanitized_text: str
    redaction_count: int

    def inventory_record(self) -> dict[str, Any]:
        return {
            "display_path": self.display_path,
            "path_digest": self.path_digest,
            "size_bytes": self.size_bytes,
            "content_sha256": self.content_sha256,
            "redaction_count": self.redaction_count,
        }


@dataclass(frozen=True)
class VaultInventory:
    manifest: dict[str, Any]
    notes: tuple[NoteSnapshot, ...]

    @property
    def snapshot_digest(self) -> str:
        return str(self.manifest["snapshot_digest"])

    def receipt(self) -> dict[str, Any]:
        counts = self.manifest["counts"]
        return {
            "status": "OBSIDIAN_INVENTORY_READY",
            "vault": "SIRINX_OBSIDIAN",
            "snapshot_digest": self.snapshot_digest,
            "policy_version": PROJECTION_POLICY_VERSION,
            "counts": counts,
            "projection_written": False,
            "vault_write": False,
            "provider_calls": 0,
            "next": "SUPPLY_DIGEST_TO_OBSIDIAN_PROJECT",
        }


def _canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def _sha256_bytes(value: bytes) -> str:
    return _DIGEST_PREFIX + hashlib.sha256(value).hexdigest()


def _sha256_file(path: Path) -> str:
    if path.is_symlink() or not path.is_file():
        raise GraphMemoryPolicyError("existing projection artifact is unavailable")
    if path.stat().st_size > MAX_PROJECTION_ARTIFACT_BYTES:
        raise GraphMemoryPolicyError("existing projection artifact exceeds policy")
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(128 * 1024), b""):
            digest.update(block)
    return _DIGEST_PREFIX + digest.hexdigest()


def _path_digest(relative: str) -> str:
    return _sha256_bytes(relative.encode("utf-8"))


def _is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def _safe_vault_root(vault_root: Path) -> Path:
    try:
        if vault_root.is_symlink():
            raise GraphMemoryPolicyError("vault root cannot be a symlink")
        root = vault_root.expanduser().resolve(strict=True)
    except OSError:
        raise GraphMemoryPolicyError("vault root is unavailable") from None
    if not root.is_dir():
        raise GraphMemoryPolicyError("vault root must be a directory")
    return root


def _new_counts() -> dict[str, int]:
    return {
        "scanned_files": 0,
        "included": 0,
        "excluded": 0,
        "redacted": 0,
        "blocked": 0,
        "redaction_count": 0,
        "excluded_hidden_files": 0,
        "excluded_hidden_dirs": 0,
        "excluded_non_markdown": 0,
        "excluded_symlink": 0,
        "blocked_symlink_escape": 0,
        "blocked_oversized": 0,
        "blocked_secret": 0,
        "blocked_invalid_text": 0,
        "blocked_read_error": 0,
    }


def _ledger_record(
    relative: str,
    *,
    disposition: str,
    size: int = 0,
    mtime_ns: int = 0,
    content_digest: str | None = None,
) -> dict[str, Any]:
    record: dict[str, Any] = {
        "path_digest": _path_digest(relative),
        "disposition": disposition,
        "size_bytes": size,
        "mtime_ns": mtime_ns,
    }
    if content_digest is not None:
        record["content_sha256"] = content_digest
    return record


def inventory_vault(
    vault_root: Path,
    *,
    persist_manifest: bool = True,
) -> VaultInventory:
    enforce_process_offline()
    root = _safe_vault_root(vault_root)
    counts = _new_counts()
    notes: list[NoteSnapshot] = []
    ledger: list[dict[str, Any]] = []

    for current, dir_names, file_names in os.walk(
        root, topdown=True, followlinks=False
    ):
        current_path = Path(current)
        kept_dirs: list[str] = []
        for name in sorted(dir_names):
            directory = current_path / name
            relative = directory.relative_to(root).as_posix()
            if name.startswith("."):
                counts["excluded_hidden_dirs"] += 1
                continue
            if directory.is_symlink():
                resolved = directory.resolve(strict=False)
                if not _is_relative_to(resolved, root):
                    counts["blocked_symlink_escape"] += 1
                    counts["blocked"] += 1
                    ledger.append(
                        _ledger_record(relative, disposition="blocked_symlink_escape")
                    )
                else:
                    counts["excluded_symlink"] += 1
                    counts["excluded"] += 1
                    ledger.append(
                        _ledger_record(relative, disposition="excluded_symlink")
                    )
                continue
            kept_dirs.append(name)
        dir_names[:] = kept_dirs

        for name in sorted(file_names):
            path = current_path / name
            relative = path.relative_to(root).as_posix()
            counts["scanned_files"] += 1

            if name.startswith("."):
                counts["excluded_hidden_files"] += 1
                counts["excluded"] += 1
                ledger.append(_ledger_record(relative, disposition="excluded_hidden"))
                continue

            if path.is_symlink():
                resolved = path.resolve(strict=False)
                if not _is_relative_to(resolved, root):
                    counts["blocked_symlink_escape"] += 1
                    counts["blocked"] += 1
                    disposition = "blocked_symlink_escape"
                else:
                    counts["excluded_symlink"] += 1
                    counts["excluded"] += 1
                    disposition = "excluded_symlink"
                ledger.append(_ledger_record(relative, disposition=disposition))
                continue

            try:
                stat = path.stat()
            except OSError:
                counts["blocked_read_error"] += 1
                counts["blocked"] += 1
                ledger.append(
                    _ledger_record(relative, disposition="blocked_read_error")
                )
                continue

            if path.suffix.lower() != ".md":
                counts["excluded_non_markdown"] += 1
                counts["excluded"] += 1
                ledger.append(
                    _ledger_record(
                        relative,
                        disposition="excluded_non_markdown",
                        size=stat.st_size,
                        mtime_ns=stat.st_mtime_ns,
                    )
                )
                continue

            if stat.st_size > MAX_NOTE_BYTES:
                counts["blocked_oversized"] += 1
                counts["blocked"] += 1
                ledger.append(
                    _ledger_record(
                        relative,
                        disposition="blocked_oversized",
                        size=stat.st_size,
                        mtime_ns=stat.st_mtime_ns,
                    )
                )
                continue

            try:
                raw_bytes = path.read_bytes()
            except OSError:
                counts["blocked_read_error"] += 1
                counts["blocked"] += 1
                ledger.append(
                    _ledger_record(
                        relative,
                        disposition="blocked_read_error",
                        size=stat.st_size,
                        mtime_ns=stat.st_mtime_ns,
                    )
                )
                continue

            content_digest = _sha256_bytes(raw_bytes)
            try:
                text = raw_bytes.decode("utf-8")
                if "\x00" in text:
                    raise UnicodeError("NUL byte")
            except UnicodeError:
                counts["blocked_invalid_text"] += 1
                counts["blocked"] += 1
                ledger.append(
                    _ledger_record(
                        relative,
                        disposition="blocked_invalid_text",
                        size=stat.st_size,
                        mtime_ns=stat.st_mtime_ns,
                        content_digest=content_digest,
                    )
                )
                continue

            detected = secret_kinds({"path": relative, "content": text})
            if detected:
                counts["blocked_secret"] += 1
                counts["blocked"] += 1
                ledger.append(
                    _ledger_record(
                        relative,
                        disposition="blocked_secret",
                        size=stat.st_size,
                        mtime_ns=stat.st_mtime_ns,
                        content_digest=content_digest,
                    )
                )
                continue

            try:
                sanitized, text_redactions = redact_text_with_count(text)
                display_path, path_redactions = redact_text_with_count(relative)
            except GraphMemoryPolicyError:
                counts["blocked_invalid_text"] += 1
                counts["blocked"] += 1
                ledger.append(
                    _ledger_record(
                        relative,
                        disposition="blocked_invalid_text",
                        size=stat.st_size,
                        mtime_ns=stat.st_mtime_ns,
                        content_digest=content_digest,
                    )
                )
                continue

            redactions = text_redactions + path_redactions
            if redactions:
                counts["redacted"] += 1
                counts["redaction_count"] += redactions
            counts["included"] += 1
            note = NoteSnapshot(
                source_path=path,
                display_path=display_path,
                path_digest=_path_digest(relative),
                size_bytes=stat.st_size,
                content_sha256=content_digest,
                sanitized_text=sanitized,
                redaction_count=redactions,
            )
            notes.append(note)
            ledger.append(
                _ledger_record(
                    relative,
                    disposition="included",
                    size=stat.st_size,
                    mtime_ns=stat.st_mtime_ns,
                    content_digest=content_digest,
                )
            )

    notes.sort(key=lambda note: note.path_digest)
    ledger.sort(key=lambda record: (record["path_digest"], record["disposition"]))
    digest_input = {
        "policy_version": PROJECTION_POLICY_VERSION,
        "ledger": ledger,
    }
    snapshot_digest = _sha256_bytes(_canonical_json(digest_input).encode("utf-8"))
    manifest: dict[str, Any] = {
        "schema_version": "1.0.0",
        "policy_version": PROJECTION_POLICY_VERSION,
        "vault": "SIRINX_OBSIDIAN",
        "mode": "READ_ONLY_INVENTORY",
        "generated_at": datetime.now(UTC).isoformat(),
        "snapshot_digest": snapshot_digest,
        "counts": counts,
        "included_notes": [note.inventory_record() for note in notes],
        "content_in_manifest": False,
        "vault_write": False,
        "provider_calls": 0,
    }
    inventory = VaultInventory(manifest=manifest, notes=tuple(notes))
    if persist_manifest:
        _persist_inventory_manifest(manifest)
    return inventory


def _projection_root() -> Path:
    root = ensure_runtime_root() / "obsidian-projection"
    if root.exists() and root.is_symlink():
        raise GraphMemoryPolicyError("projection root cannot be a symlink")
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    root.chmod(0o700)
    return root


def _atomic_write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    payload = (_canonical_json(value) + "\n").encode("utf-8")
    with tempfile.NamedTemporaryFile(
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    ) as handle:
        temporary = Path(handle.name)
        os.chmod(temporary, 0o600)
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)
    path.chmod(0o600)


def _persist_inventory_manifest(manifest: dict[str, Any]) -> None:
    _atomic_write_json(_projection_root() / "inventory.json", manifest)


def _validate_digest(value: str) -> str:
    if (
        not value.startswith(_DIGEST_PREFIX)
        or len(value) != len(_DIGEST_PREFIX) + 64
        or any(ch not in "0123456789abcdef" for ch in value[len(_DIGEST_PREFIX) :])
    ):
        raise GraphMemoryPolicyError("inventory digest must be sha256:<64 hex>")
    return value


class ProjectionState(TypedDict, total=False):
    expected_digest: str
    inventory_digest: str
    notes: list[dict[str, Any]]
    chunks: list[dict[str, Any]]
    counts: dict[str, int]
    receipt: dict[str, Any]


def _verify_projection_digest(state: ProjectionState) -> ProjectionState:
    if state["expected_digest"] != state["inventory_digest"]:
        raise GraphMemoryPolicyError(
            "vault inventory changed; run obsidian-inventory again"
        )
    return state


def _chunk_projection(state: ProjectionState) -> ProjectionState:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=120,
        length_function=len,
        is_separator_regex=False,
        separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""],
    )
    documents = [
        Document(
            page_content=note["sanitized_text"],
            metadata={
                "display_path": note["display_path"],
                "path_digest": note["path_digest"],
                "content_sha256": note["content_sha256"],
                "authority": "obsidian_read_only_projection",
            },
        )
        for note in state["notes"]
    ]
    split = splitter.split_documents(documents)
    chunks: list[dict[str, Any]] = []
    per_note_index: dict[str, int] = {}
    for document in split:
        path_digest = str(document.metadata["path_digest"])
        index = per_note_index.get(path_digest, 0)
        per_note_index[path_digest] = index + 1
        text = document.page_content
        chunk_digest = _sha256_bytes(
            (path_digest + "\0" + str(index) + "\0" + text).encode("utf-8")
        )
        chunks.append(
            {
                "chunk_id": f"obsidian-chunk-{chunk_digest[7:31]}",
                "chunk_sha256": chunk_digest,
                "chunk_index": index,
                "text": text,
                "metadata": document.metadata,
            }
        )
    return {**state, "chunks": chunks}


def _write_jsonl(path: Path, records: list[dict[str, Any]]) -> str:
    digest = hashlib.sha256()
    with path.open("xb") as handle:
        os.chmod(path, 0o600)
        for record in records:
            line = (_canonical_json(record) + "\n").encode("utf-8")
            digest.update(line)
            handle.write(line)
        handle.flush()
        os.fsync(handle.fileno())
    return _DIGEST_PREFIX + digest.hexdigest()


def _persist_projection(state: ProjectionState) -> ProjectionState:
    projection_root = _projection_root()
    digest_hex = state["inventory_digest"][len(_DIGEST_PREFIX) :]
    destination = projection_root / digest_hex
    if destination.exists():
        if destination.is_symlink() or not destination.is_dir():
            raise GraphMemoryPolicyError("existing projection is outside policy")
        manifest_path = destination / "manifest.json"
        if (
            manifest_path.is_symlink()
            or not manifest_path.is_file()
            or manifest_path.stat().st_size > MAX_PROJECTION_MANIFEST_BYTES
        ):
            raise GraphMemoryPolicyError("existing projection is incomplete")
        try:
            existing = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError):
            raise GraphMemoryPolicyError(
                "existing projection manifest is invalid"
            ) from None
        if not isinstance(existing, dict):
            raise GraphMemoryPolicyError("existing projection manifest is invalid")
        if (
            existing.get("snapshot_digest") != state["inventory_digest"]
            or existing.get("policy_version") != PROJECTION_POLICY_VERSION
            or existing.get("authority") != "projection_only"
            or existing.get("vault_write") is not False
            or existing.get("provider_calls") != 0
        ):
            raise GraphMemoryPolicyError("existing projection digest mismatch")
        for name, digest_key in (
            ("notes.jsonl", "notes_sha256"),
            ("chunks.jsonl", "chunks_sha256"),
        ):
            expected = existing.get(digest_key)
            if (
                not isinstance(expected, str)
                or not expected.startswith(_DIGEST_PREFIX)
                or len(expected) != len(_DIGEST_PREFIX) + 64
                or any(
                    char not in "0123456789abcdef"
                    for char in expected[len(_DIGEST_PREFIX) :]
                )
                or _sha256_file(destination / name) != expected
            ):
                raise GraphMemoryPolicyError(
                    "existing projection artifact digest mismatch"
                )
        receipt = {
            "status": "OBSIDIAN_PROJECTION_ALREADY_EXISTS",
            "snapshot_digest": state["inventory_digest"],
            "notes": existing["note_count"],
            "chunks": existing["chunk_count"],
            "notes_sha256": existing["notes_sha256"],
            "chunks_sha256": existing["chunks_sha256"],
            "vault_write": False,
            "provider_calls": 0,
            "authority": "projection_only",
        }
        return {**state, "receipt": receipt}

    temporary = Path(tempfile.mkdtemp(prefix=f".{digest_hex}.", dir=projection_root))
    try:
        temporary.chmod(0o700)
        notes_records = [
            {
                "note_id": f"obsidian-note-{note['content_sha256'][7:31]}",
                "display_path": note["display_path"],
                "path_digest": note["path_digest"],
                "content_sha256": note["content_sha256"],
                "text": note["sanitized_text"],
                "redaction_count": note["redaction_count"],
                "authority": "obsidian_read_only_projection",
            }
            for note in state["notes"]
        ]
        notes_sha = _write_jsonl(temporary / "notes.jsonl", notes_records)
        chunks_sha = _write_jsonl(temporary / "chunks.jsonl", state["chunks"])
        manifest = {
            "schema_version": "1.0.0",
            "policy_version": PROJECTION_POLICY_VERSION,
            "snapshot_digest": state["inventory_digest"],
            "note_count": len(notes_records),
            "chunk_count": len(state["chunks"]),
            "counts": state["counts"],
            "notes_sha256": notes_sha,
            "chunks_sha256": chunks_sha,
            "authority": "projection_only",
            "vault_write": False,
            "provider_calls": 0,
        }
        _atomic_write_json(temporary / "manifest.json", manifest)
        os.rename(temporary, destination)
    except Exception:
        shutil.rmtree(temporary, ignore_errors=True)
        raise

    receipt = {
        "status": "OBSIDIAN_PROJECTION_READY",
        "snapshot_digest": state["inventory_digest"],
        "notes": len(notes_records),
        "chunks": len(state["chunks"]),
        "notes_sha256": notes_sha,
        "chunks_sha256": chunks_sha,
        "vault_write": False,
        "provider_calls": 0,
        "authority": "projection_only",
    }
    return {**state, "receipt": receipt}


def _build_projection_workflow():
    builder = StateGraph(ProjectionState)
    builder.add_node("verify_inventory_digest", _verify_projection_digest)
    builder.add_node("langchain_chunk_projection", _chunk_projection)
    builder.add_node("persist_project_local_projection", _persist_projection)
    builder.add_edge(START, "verify_inventory_digest")
    builder.add_edge("verify_inventory_digest", "langchain_chunk_projection")
    builder.add_edge("langchain_chunk_projection", "persist_project_local_projection")
    builder.add_edge("persist_project_local_projection", END)
    return builder.compile()


def project_vault(
    vault_root: Path,
    *,
    expected_inventory_digest: str,
) -> dict[str, Any]:
    expected = _validate_digest(expected_inventory_digest)
    inventory = inventory_vault(vault_root, persist_manifest=True)
    notes = [
        {
            **note.inventory_record(),
            "sanitized_text": note.sanitized_text,
        }
        for note in inventory.notes
    ]
    workflow = _build_projection_workflow()
    result = workflow.invoke(
        {
            "expected_digest": expected,
            "inventory_digest": inventory.snapshot_digest,
            "notes": notes,
            "counts": inventory.manifest["counts"],
        }
    )
    return result["receipt"]


def inventory_canonical_vault() -> dict[str, Any]:
    return inventory_vault(CANONICAL_VAULT_ROOT, persist_manifest=True).receipt()


def project_canonical_vault(expected_inventory_digest: str) -> dict[str, Any]:
    return project_vault(
        CANONICAL_VAULT_ROOT,
        expected_inventory_digest=expected_inventory_digest,
    )
