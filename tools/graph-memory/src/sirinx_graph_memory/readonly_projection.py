"""Bounded read-only queries over one exact sanitized Obsidian projection."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

from .errors import GraphMemoryPolicyError
from .obsidian_projection import MAX_PROJECTION_MANIFEST_BYTES
from .offline_policy import enforce_process_offline
from .paths import runtime_root
from .security import redact_text_with_count, secret_kinds

_DIGEST_PREFIX = "sha256:"
_MAX_PROJECTION_FILE_BYTES = 128 * 1024 * 1024
_MAX_JSONL_LINE_BYTES = 64 * 1024
_TOKEN_PATTERN = re.compile(r"[^\W_]+", re.UNICODE)


def _validate_digest(value: Any, *, name: str = "snapshot_digest") -> str:
    if not isinstance(value, str):
        raise GraphMemoryPolicyError(f"{name} must be a string")
    if (
        not value.startswith(_DIGEST_PREFIX)
        or len(value) != len(_DIGEST_PREFIX) + 64
        or any(ch not in "0123456789abcdef" for ch in value[len(_DIGEST_PREFIX) :])
    ):
        raise GraphMemoryPolicyError(f"{name} must be sha256:<64 hex>")
    return value


def _is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def _sha256_file(path: Path) -> str:
    if path.is_symlink() or not path.is_file():
        raise GraphMemoryPolicyError("projection artifact is unavailable")
    size = path.stat().st_size
    if size > _MAX_PROJECTION_FILE_BYTES:
        raise GraphMemoryPolicyError("projection artifact exceeds read policy")
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(128 * 1024), b""):
            digest.update(block)
    return _DIGEST_PREFIX + digest.hexdigest()


def _sha256_bytes(value: bytes) -> str:
    return _DIGEST_PREFIX + hashlib.sha256(value).hexdigest()


def _bounded_integer(
    value: Any,
    *,
    name: str,
    default: int,
    minimum: int,
    maximum: int,
) -> int:
    try:
        number = int(default if value is None else value)
    except (TypeError, ValueError) as exc:
        raise GraphMemoryPolicyError(f"{name} must be an integer") from exc
    if number < minimum or number > maximum:
        raise GraphMemoryPolicyError(f"{name} is outside policy")
    return number


class ReadOnlyObsidianProjection:
    """Query a content-addressed projection without arbitrary path input."""

    def __init__(self) -> None:
        enforce_process_offline()

    def _open_snapshot(self, snapshot_digest: Any) -> tuple[Path, dict[str, Any]]:
        digest = _validate_digest(snapshot_digest)
        runtime = runtime_root()
        if runtime.is_symlink() or not runtime.is_dir():
            raise GraphMemoryPolicyError("runtime root is unavailable")
        projection_root = runtime / "obsidian-projection"
        if projection_root.is_symlink():
            raise GraphMemoryPolicyError("projection root cannot be a symlink")
        if not projection_root.is_dir():
            raise GraphMemoryPolicyError("projection root is unavailable")
        try:
            root = projection_root.resolve(strict=True)
        except OSError:
            raise GraphMemoryPolicyError("projection root is unavailable") from None
        candidate = projection_root / digest.removeprefix(_DIGEST_PREFIX)
        if candidate.is_symlink():
            raise GraphMemoryPolicyError("projection snapshot cannot be a symlink")
        try:
            resolved = candidate.resolve(strict=True)
        except OSError:
            raise GraphMemoryPolicyError("projection snapshot is unavailable") from None
        if not resolved.is_dir() or not _is_relative_to(resolved, root):
            raise GraphMemoryPolicyError("projection snapshot is outside policy")

        manifest_path = resolved / "manifest.json"
        if (
            manifest_path.is_symlink()
            or not manifest_path.is_file()
            or manifest_path.stat().st_size > MAX_PROJECTION_MANIFEST_BYTES
        ):
            raise GraphMemoryPolicyError("projection manifest is unavailable")
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError):
            raise GraphMemoryPolicyError("projection manifest is invalid") from None
        if not isinstance(manifest, dict):
            raise GraphMemoryPolicyError("projection manifest is invalid")
        if (
            manifest.get("snapshot_digest") != digest
            or manifest.get("authority") != "projection_only"
            or manifest.get("vault_write") is not False
            or manifest.get("provider_calls") != 0
        ):
            raise GraphMemoryPolicyError("projection manifest failed policy")

        for name, digest_key in (
            ("notes.jsonl", "notes_sha256"),
            ("chunks.jsonl", "chunks_sha256"),
        ):
            expected = _validate_digest(manifest.get(digest_key))
            if _sha256_file(resolved / name) != expected:
                raise GraphMemoryPolicyError("projection artifact digest mismatch")
        return resolved, manifest

    def snapshot_info(self, arguments: dict[str, Any]) -> str:
        _, manifest = self._open_snapshot(arguments.get("snapshot_digest"))
        return json.dumps(
            {
                "status": "OBSIDIAN_PROJECTION_VERIFIED",
                "snapshot_digest": manifest["snapshot_digest"],
                "note_count": manifest["note_count"],
                "chunk_count": manifest["chunk_count"],
                "chunks_sha256": manifest["chunks_sha256"],
                "authority": "projection_only",
                "vault_write": False,
                "provider_calls": 0,
                "external_calls": 0,
            },
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )

    def query(self, arguments: dict[str, Any]) -> str:
        snapshot, manifest = self._open_snapshot(arguments.get("snapshot_digest"))
        query = arguments.get("query")
        if not isinstance(query, str):
            raise GraphMemoryPolicyError("query must be a string")
        query = query.strip()
        if not query or len(query) > 256:
            raise GraphMemoryPolicyError("query length is outside policy")
        if secret_kinds({"query": query}):
            raise GraphMemoryPolicyError("query failed secret policy")
        query, _ = redact_text_with_count(query)
        terms = tuple(
            dict.fromkeys(
                token.lower()
                for token in _TOKEN_PATTERN.findall(query)
                if len(token) >= 2
            )
        )
        if not terms:
            raise GraphMemoryPolicyError("query has no searchable terms")

        limit = _bounded_integer(
            arguments.get("limit"),
            name="limit",
            default=5,
            minimum=1,
            maximum=8,
        )
        max_chars = _bounded_integer(
            arguments.get("max_chars"),
            name="max_chars",
            default=6000,
            minimum=2000,
            maximum=12000,
        )
        matches: list[tuple[int, str, dict[str, Any]]] = []
        chunks_path = snapshot / "chunks.jsonl"
        with chunks_path.open("rb") as handle:
            for raw_line in handle:
                if len(raw_line) > _MAX_JSONL_LINE_BYTES:
                    raise GraphMemoryPolicyError("projection chunk exceeds read policy")
                try:
                    record = json.loads(raw_line.decode("utf-8"))
                except (UnicodeError, json.JSONDecodeError):
                    raise GraphMemoryPolicyError(
                        "projection chunk is invalid"
                    ) from None
                if not isinstance(record, dict):
                    raise GraphMemoryPolicyError("projection chunk is invalid")
                text = record.get("text")
                metadata = record.get("metadata")
                chunk_id = record.get("chunk_id")
                chunk_index = record.get("chunk_index")
                if (
                    not isinstance(text, str)
                    or not isinstance(metadata, dict)
                    or not isinstance(chunk_id, str)
                    or not isinstance(chunk_index, int)
                    or isinstance(chunk_index, bool)
                    or chunk_index < 0
                ):
                    raise GraphMemoryPolicyError("projection chunk is invalid")
                chunk_sha256 = _validate_digest(
                    record.get("chunk_sha256"),
                    name="chunk_sha256",
                )
                path_digest = _validate_digest(
                    metadata.get("path_digest"),
                    name="path_digest",
                )
                content_sha256 = _validate_digest(
                    metadata.get("content_sha256"),
                    name="content_sha256",
                )
                expected_chunk_sha256 = _sha256_bytes(
                    (path_digest + "\0" + str(chunk_index) + "\0" + text).encode(
                        "utf-8"
                    )
                )
                if chunk_sha256 != expected_chunk_sha256:
                    raise GraphMemoryPolicyError("projection chunk digest mismatch")
                if secret_kinds({"content": text, "metadata": metadata}):
                    raise GraphMemoryPolicyError("projection content failed policy")
                haystack = (text + "\n" + str(metadata.get("display_path", ""))).lower()
                score = sum(haystack.count(term) for term in terms)
                if score:
                    matches.append(
                        (
                            score,
                            chunk_id,
                            {
                                **record,
                                "_validated_path_digest": path_digest,
                                "_validated_content_sha256": content_sha256,
                            },
                        )
                    )

        matches.sort(key=lambda item: (-item[0], item[1]))
        selected = matches[:limit]
        text_budget = max(
            64, (max_chars - 512 - (220 * len(selected))) // max(1, len(selected))
        )
        results = [
            {
                "chunk_id": record["chunk_id"],
                "chunk_sha256": record["chunk_sha256"],
                "score": score,
                "display_path": redact_text_with_count(
                    str(record["metadata"].get("display_path", ""))
                )[0],
                "path_digest": record["_validated_path_digest"],
                "content_sha256": record["_validated_content_sha256"],
                "evidence_class": "reported",
                "text": redact_text_with_count(record["text"][:text_budget])[0],
            }
            for score, _, record in selected
        ]
        response = {
            "status": "OBSIDIAN_PROJECTION_QUERY_COMPLETE",
            "snapshot_digest": manifest["snapshot_digest"],
            "chunks_sha256": manifest["chunks_sha256"],
            "result_count": len(results),
            "results": results,
            "authority": "projection_only",
            "provider_calls": 0,
            "external_calls": 0,
        }
        encoded = json.dumps(
            response,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        while len(encoded) > max_chars and results:
            results[-1]["text"] = results[-1]["text"][
                : max(0, len(results[-1]["text"]) - 128)
            ]
            if not results[-1]["text"]:
                results.pop()
                response["result_count"] = len(results)
            encoded = json.dumps(
                response,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            )
        if len(encoded) > max_chars:
            raise GraphMemoryPolicyError("projection response exceeds read policy")
        return encoded
