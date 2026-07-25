"""Deterministic, provider-free ContextBundleV1 contracts.

Requests contain no path fields. Retrieval can only bind the fixed
project-local Graphify artifacts and, optionally, one exact existing Obsidian
projection. Raw query text is used in memory and represented in the response
only by ``query_digest``.
"""

from __future__ import annotations

import hashlib
import json
from typing import Annotated, Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    ValidationError,
    field_validator,
    model_validator,
)

from .errors import GraphMemoryPolicyError
from .security import redact_text, secret_kinds, validate_evidence_ref

APPROVED_BASE_SHA = "1f05814c3e9d173e525234d69b3ce7f2d1b01a57"
CONTEXT_BUNDLE_SCHEMA_VERSION = "1.0.0"
MAX_CONTEXT_REQUEST_BYTES = 64 * 1024
MAX_CONTEXT_ITEMS = 16
MAX_CONTEXT_ITEMS_PER_SOURCE = 8
MAX_CONTEXT_TEXT_BYTES = 24_000

BaseSha = Annotated[str, StringConstraints(pattern=r"^[0-9a-f]{40}$")]
Sha256Digest = Annotated[
    str,
    StringConstraints(pattern=r"^sha256:[0-9a-f]{64}$"),
]
EvidenceClass = Literal["observed", "derived", "inferred", "reported", "unverified"]
GraphConfidence = Literal["EXTRACTED", "INFERRED", "AMBIGUOUS"]
SourceKind = Literal["code_graph", "obsidian_projection"]


def _canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def sha256_bytes(value: bytes) -> str:
    return "sha256:" + hashlib.sha256(value).hexdigest()


def _snapshot_digest_payload(
    *,
    base_sha: str,
    graph_sha256: str,
    graph_manifest_sha256: str,
) -> dict[str, str]:
    return {
        "base_sha": base_sha,
        "graph_manifest_sha256": graph_manifest_sha256,
        "graph_sha256": graph_sha256,
        "schema_version": CONTEXT_BUNDLE_SCHEMA_VERSION,
    }


def code_graph_snapshot_digest(
    *,
    base_sha: str,
    graph_sha256: str,
    graph_manifest_sha256: str,
) -> str:
    payload = _snapshot_digest_payload(
        base_sha=base_sha,
        graph_sha256=graph_sha256,
        graph_manifest_sha256=graph_manifest_sha256,
    )
    return sha256_bytes(_canonical_json(payload).encode("utf-8"))


class CodeGraphSnapshotV1(BaseModel):
    """Exact identity of the two fixed Graphify snapshot artifacts."""

    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)

    schema_version: Literal["1.0.0"]
    base_sha: BaseSha
    graph_sha256: Sha256Digest
    graph_manifest_sha256: Sha256Digest
    graph_snapshot_digest: Sha256Digest
    provider_calls: Literal[0]
    external_calls: Literal[0]

    @model_validator(mode="after")
    def validate_graph_snapshot_digest(self) -> CodeGraphSnapshotV1:
        expected = code_graph_snapshot_digest(
            base_sha=self.base_sha,
            graph_sha256=self.graph_sha256,
            graph_manifest_sha256=self.graph_manifest_sha256,
        )
        if self.graph_snapshot_digest != expected:
            raise ValueError("code graph snapshot digest mismatch")
        return self


def build_code_graph_snapshot(
    *,
    base_sha: str,
    graph_sha256: str,
    graph_manifest_sha256: str,
) -> CodeGraphSnapshotV1:
    return CodeGraphSnapshotV1(
        schema_version=CONTEXT_BUNDLE_SCHEMA_VERSION,
        base_sha=base_sha,
        graph_sha256=graph_sha256,
        graph_manifest_sha256=graph_manifest_sha256,
        graph_snapshot_digest=code_graph_snapshot_digest(
            base_sha=base_sha,
            graph_sha256=graph_sha256,
            graph_manifest_sha256=graph_manifest_sha256,
        ),
        provider_calls=0,
        external_calls=0,
    )


class ContextRetrievalRequestV1(BaseModel):
    """Strict stdin request; deliberately contains no arbitrary path."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        str_strip_whitespace=True,
        title="SIRINX Context Retrieval Request V1",
    )

    schema_version: Literal["1.0.0"]
    task_id: str = Field(pattern=r"^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$")
    goal_spec_digest: Sha256Digest
    repository_id: Literal["sirinx-co"]
    base_sha: BaseSha
    query: str = Field(min_length=1, max_length=256)
    max_items: int = Field(default=8, ge=1, le=MAX_CONTEXT_ITEMS)
    max_text_bytes: int = Field(
        default=MAX_CONTEXT_TEXT_BYTES,
        ge=1,
        le=MAX_CONTEXT_TEXT_BYTES,
    )
    obsidian_snapshot_digest: Sha256Digest | None = None
    include_ambiguous: bool = False

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        redact_text(value)
        return value


class CodeGraphSourceRefV1(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)

    repository_id: Literal["sirinx-co"]
    base_sha: BaseSha
    graph_sha256: Sha256Digest
    graph_manifest_sha256: Sha256Digest
    node_id: str = Field(min_length=1, max_length=500)
    relative_path: str = Field(min_length=1, max_length=500)
    source_file_sha256: Sha256Digest
    relation: str | None = Field(default=None, max_length=100)
    graph_confidence: GraphConfidence

    @field_validator("node_id", "relation")
    @classmethod
    def validate_optional_ref(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if any(character in value for character in ("\n", "\r", "\x00")):
            raise ValueError("code graph source reference contains control characters")
        if not value:
            return None
        return value

    @field_validator("relative_path")
    @classmethod
    def validate_path(cls, value: str) -> str:
        return validate_evidence_ref(value)


class ObsidianSourceRefV1(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)

    snapshot_digest: Sha256Digest
    chunks_sha256: Sha256Digest
    chunk_id: str = Field(min_length=1, max_length=200)
    chunk_sha256: Sha256Digest
    path_digest: Sha256Digest
    display_path: str = Field(min_length=1, max_length=500)

    @field_validator("chunk_id", "display_path")
    @classmethod
    def validate_ref(cls, value: str) -> str:
        if any(character in value for character in ("\n", "\r", "\x00")):
            raise ValueError("Obsidian source reference contains control characters")
        return value

    @field_validator("display_path")
    @classmethod
    def validate_display_path(cls, value: str) -> str:
        return validate_evidence_ref(value)


SourceRefV1 = CodeGraphSourceRefV1 | ObsidianSourceRefV1


def _item_digest_payload(
    *,
    item_id: str,
    source_kind: SourceKind,
    source_ref: SourceRefV1,
    snapshot_digest: str,
    content_digest: str,
    evidence_class: EvidenceClass,
    text: str,
) -> dict[str, Any]:
    return {
        "authority": "context_only",
        "content_digest": content_digest,
        "evidence_class": evidence_class,
        "item_id": item_id,
        "schema_version": CONTEXT_BUNDLE_SCHEMA_VERSION,
        "snapshot_digest": snapshot_digest,
        "source_kind": source_kind,
        "source_ref": source_ref.model_dump(mode="json"),
        "text": text,
    }


class ContextItemV1(BaseModel):
    """One source-bound item whose identifier is derived from its digest."""

    model_config = ConfigDict(extra="forbid", frozen=True, str_strip_whitespace=True)

    schema_version: Literal["1.0.0"]
    item_id: str = Field(pattern=r"^context-item-[0-9a-f]{24}$")
    source_kind: SourceKind
    source_ref: SourceRefV1
    snapshot_digest: Sha256Digest
    content_digest: Sha256Digest
    item_digest: Sha256Digest
    evidence_class: EvidenceClass
    authority: Literal["context_only"]
    text: str = Field(min_length=1, max_length=24_000)

    @model_validator(mode="after")
    def validate_item(self) -> ContextItemV1:
        if self.source_kind == "code_graph" and not isinstance(
            self.source_ref, CodeGraphSourceRefV1
        ):
            raise ValueError("code graph item requires a code graph source reference")
        if self.source_kind == "obsidian_projection" and not isinstance(
            self.source_ref, ObsidianSourceRefV1
        ):
            raise ValueError("Obsidian item requires an Obsidian source reference")
        if isinstance(self.source_ref, CodeGraphSourceRefV1):
            expected_evidence = {
                "EXTRACTED": "observed",
                "INFERRED": "inferred",
                "AMBIGUOUS": "unverified",
            }[self.source_ref.graph_confidence]
            if self.evidence_class != expected_evidence:
                raise ValueError("code graph confidence/evidence mismatch")
        else:
            if self.evidence_class != "reported":
                raise ValueError("Obsidian context evidence must be reported")
            if self.source_ref.snapshot_digest != self.snapshot_digest:
                raise ValueError("Obsidian source snapshot mismatch")
        expected_content = sha256_bytes(self.text.encode("utf-8"))
        if self.content_digest != expected_content:
            raise ValueError("context item content digest mismatch")
        identity = {
            "snapshot_digest": self.snapshot_digest,
            "source_kind": self.source_kind,
            "source_ref": self.source_ref.model_dump(mode="json"),
        }
        expected_item_id = (
            "context-item-"
            + sha256_bytes(_canonical_json(identity).encode("utf-8"))[7:31]
        )
        if self.item_id != expected_item_id:
            raise ValueError("context item identifier mismatch")
        payload = _item_digest_payload(
            item_id=self.item_id,
            source_kind=self.source_kind,
            source_ref=self.source_ref,
            snapshot_digest=self.snapshot_digest,
            content_digest=self.content_digest,
            evidence_class=self.evidence_class,
            text=self.text,
        )
        expected_item = sha256_bytes(_canonical_json(payload).encode("utf-8"))
        if self.item_digest != expected_item:
            raise ValueError("context item digest mismatch")
        return self


def build_context_item(
    *,
    source_kind: SourceKind,
    source_ref: SourceRefV1,
    snapshot_digest: str,
    evidence_class: EvidenceClass,
    text: str,
) -> ContextItemV1:
    if isinstance(source_ref, CodeGraphSourceRefV1):
        source_ref = CodeGraphSourceRefV1(
            repository_id=source_ref.repository_id,
            base_sha=source_ref.base_sha,
            graph_sha256=source_ref.graph_sha256,
            graph_manifest_sha256=source_ref.graph_manifest_sha256,
            node_id=redact_text(source_ref.node_id),
            relative_path=redact_text(source_ref.relative_path),
            source_file_sha256=source_ref.source_file_sha256,
            relation=(
                None
                if source_ref.relation is None
                else redact_text(source_ref.relation)
            ),
            graph_confidence=source_ref.graph_confidence,
        )
    else:
        source_ref = ObsidianSourceRefV1(
            snapshot_digest=source_ref.snapshot_digest,
            chunks_sha256=source_ref.chunks_sha256,
            chunk_id=source_ref.chunk_id,
            chunk_sha256=source_ref.chunk_sha256,
            path_digest=source_ref.path_digest,
            display_path=redact_text(source_ref.display_path),
        )
    if secret_kinds(
        {
            "source_ref": source_ref.model_dump(mode="json"),
            "text": text,
        }
    ):
        raise GraphMemoryPolicyError("context source failed secret policy")
    safe_text = redact_text(text)
    content_digest = sha256_bytes(safe_text.encode("utf-8"))
    identity = {
        "snapshot_digest": snapshot_digest,
        "source_kind": source_kind,
        "source_ref": source_ref.model_dump(mode="json"),
    }
    item_id = (
        "context-item-" + sha256_bytes(_canonical_json(identity).encode("utf-8"))[7:31]
    )
    payload = _item_digest_payload(
        item_id=item_id,
        source_kind=source_kind,
        source_ref=source_ref,
        snapshot_digest=snapshot_digest,
        content_digest=content_digest,
        evidence_class=evidence_class,
        text=safe_text,
    )
    item_digest = sha256_bytes(_canonical_json(payload).encode("utf-8"))
    return ContextItemV1(
        schema_version=CONTEXT_BUNDLE_SCHEMA_VERSION,
        item_id=item_id,
        source_kind=source_kind,
        source_ref=source_ref,
        snapshot_digest=snapshot_digest,
        content_digest=content_digest,
        item_digest=item_digest,
        evidence_class=evidence_class,
        authority="context_only",
        text=safe_text,
    )


def _bundle_digest_payload(
    *,
    task_id: str,
    goal_spec_digest: str,
    repository_id: str,
    base_sha: str,
    graph_snapshot_digest: str,
    obsidian_snapshot_digest: str | None,
    query_digest: str,
    items: list[ContextItemV1],
    total_text_bytes: int,
) -> dict[str, Any]:
    return {
        "base_sha": base_sha,
        "external_calls": 0,
        "goal_spec_digest": goal_spec_digest,
        "graph_snapshot_digest": graph_snapshot_digest,
        "items": [item.model_dump(mode="json") for item in items],
        "obsidian_snapshot_digest": obsidian_snapshot_digest,
        "provider_calls": 0,
        "query_digest": query_digest,
        "repository_id": repository_id,
        "schema_version": CONTEXT_BUNDLE_SCHEMA_VERSION,
        "task_id": task_id,
        "total_text_bytes": total_text_bytes,
    }


class ContextBundleV1(BaseModel):
    """Bounded context handoff; never an authority or persistence record."""

    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        json_schema_extra={
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://sirinx.local/schemas/context-bundle.schema.json",
        },
        title="SIRINX Context Bundle V1",
    )

    schema_version: Literal["1.0.0"]
    task_id: str = Field(pattern=r"^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$")
    goal_spec_digest: Sha256Digest
    repository_id: Literal["sirinx-co"]
    base_sha: BaseSha
    graph_snapshot_digest: Sha256Digest
    obsidian_snapshot_digest: Sha256Digest | None = None
    query_digest: Sha256Digest
    items: list[ContextItemV1] = Field(max_length=MAX_CONTEXT_ITEMS)
    total_text_bytes: int = Field(ge=0, le=MAX_CONTEXT_TEXT_BYTES)
    provider_calls: Literal[0]
    external_calls: Literal[0]
    bundle_digest: Sha256Digest

    @model_validator(mode="after")
    def validate_bundle(self) -> ContextBundleV1:
        for source_kind in ("code_graph", "obsidian_projection"):
            if (
                sum(item.source_kind == source_kind for item in self.items)
                > MAX_CONTEXT_ITEMS_PER_SOURCE
            ):
                raise ValueError("context source item count exceeds policy")
        expected_text_bytes = sum(len(item.text.encode("utf-8")) for item in self.items)
        if self.total_text_bytes != expected_text_bytes:
            raise ValueError("context bundle text byte count mismatch")
        if any(
            item.source_kind == "code_graph"
            and item.snapshot_digest != self.graph_snapshot_digest
            for item in self.items
        ):
            raise ValueError("code graph item snapshot mismatch")
        if any(
            item.source_kind == "obsidian_projection"
            and item.snapshot_digest != self.obsidian_snapshot_digest
            for item in self.items
        ):
            raise ValueError("Obsidian item snapshot mismatch")
        for item in self.items:
            if not isinstance(item.source_ref, CodeGraphSourceRefV1):
                continue
            if item.source_ref.repository_id != self.repository_id:
                raise ValueError("code graph item repository mismatch")
            if item.source_ref.base_sha != self.base_sha:
                raise ValueError("code graph item base_sha mismatch")
            expected_snapshot = code_graph_snapshot_digest(
                base_sha=item.source_ref.base_sha,
                graph_sha256=item.source_ref.graph_sha256,
                graph_manifest_sha256=item.source_ref.graph_manifest_sha256,
            )
            if expected_snapshot != self.graph_snapshot_digest:
                raise ValueError("code graph source digest mismatch")
        payload = _bundle_digest_payload(
            task_id=self.task_id,
            goal_spec_digest=self.goal_spec_digest,
            repository_id=self.repository_id,
            base_sha=self.base_sha,
            graph_snapshot_digest=self.graph_snapshot_digest,
            obsidian_snapshot_digest=self.obsidian_snapshot_digest,
            query_digest=self.query_digest,
            items=self.items,
            total_text_bytes=self.total_text_bytes,
        )
        expected = sha256_bytes(_canonical_json(payload).encode("utf-8"))
        if self.bundle_digest != expected:
            raise ValueError("context bundle digest mismatch")
        return self


def _assemble_bundle(
    *,
    request: ContextRetrievalRequestV1,
    graph_snapshot: CodeGraphSnapshotV1,
    query_digest: str,
    items: list[ContextItemV1],
) -> ContextBundleV1:
    total_text_bytes = sum(len(item.text.encode("utf-8")) for item in items)
    payload = _bundle_digest_payload(
        task_id=request.task_id,
        goal_spec_digest=request.goal_spec_digest,
        repository_id=request.repository_id,
        base_sha=request.base_sha,
        graph_snapshot_digest=graph_snapshot.graph_snapshot_digest,
        obsidian_snapshot_digest=request.obsidian_snapshot_digest,
        query_digest=query_digest,
        items=items,
        total_text_bytes=total_text_bytes,
    )
    return ContextBundleV1(
        schema_version=CONTEXT_BUNDLE_SCHEMA_VERSION,
        task_id=request.task_id,
        goal_spec_digest=request.goal_spec_digest,
        repository_id=request.repository_id,
        base_sha=request.base_sha,
        graph_snapshot_digest=graph_snapshot.graph_snapshot_digest,
        obsidian_snapshot_digest=request.obsidian_snapshot_digest,
        query_digest=query_digest,
        items=items,
        total_text_bytes=total_text_bytes,
        provider_calls=0,
        external_calls=0,
        bundle_digest=sha256_bytes(_canonical_json(payload).encode("utf-8")),
    )


def canonical_bundle_json(bundle: ContextBundleV1) -> str:
    return _canonical_json(bundle.model_dump(mode="json"))


def parse_context_request_json(
    payload: str,
    *,
    expected_base_sha: str = APPROVED_BASE_SHA,
) -> ContextRetrievalRequestV1:
    if len(payload.encode("utf-8")) > MAX_CONTEXT_REQUEST_BYTES:
        raise GraphMemoryPolicyError("context request exceeds 64 KiB")
    try:
        raw = json.loads(payload)
    except json.JSONDecodeError:
        raise GraphMemoryPolicyError("context request is invalid JSON") from None
    if not isinstance(raw, dict):
        raise GraphMemoryPolicyError("context request must be one JSON object")
    if secret_kinds(raw):
        raise GraphMemoryPolicyError("context request failed secret policy")
    try:
        request = ContextRetrievalRequestV1.model_validate(raw)
    except ValidationError as exc:
        raise GraphMemoryPolicyError("context request validation failed") from exc
    if request.base_sha != expected_base_sha:
        raise GraphMemoryPolicyError("context request base_sha is not approved")
    return request


def build_context_bundle(
    *,
    request: ContextRetrievalRequestV1,
    graph_snapshot: CodeGraphSnapshotV1,
    candidates: list[ContextItemV1],
) -> ContextBundleV1:
    if request.base_sha != graph_snapshot.base_sha:
        raise GraphMemoryPolicyError("context snapshot base_sha mismatch")
    query_digest = sha256_bytes(request.query.encode("utf-8"))
    selected: list[ContextItemV1] = []
    text_bytes = 0
    source_counts = {
        "code_graph": 0,
        "obsidian_projection": 0,
    }
    for candidate in candidates:
        if len(selected) >= request.max_items:
            break
        if source_counts[candidate.source_kind] >= MAX_CONTEXT_ITEMS_PER_SOURCE:
            continue
        if (
            candidate.source_kind == "code_graph"
            and isinstance(candidate.source_ref, CodeGraphSourceRefV1)
            and candidate.source_ref.graph_confidence == "AMBIGUOUS"
            and not request.include_ambiguous
        ):
            continue
        candidate_bytes = len(candidate.text.encode("utf-8"))
        if text_bytes + candidate_bytes <= request.max_text_bytes:
            selected.append(candidate)
            text_bytes += candidate_bytes
            source_counts[candidate.source_kind] += 1

    bundle = _assemble_bundle(
        request=request,
        graph_snapshot=graph_snapshot,
        query_digest=query_digest,
        items=selected,
    )
    if secret_kinds(bundle.model_dump(mode="json")):
        raise GraphMemoryPolicyError("context bundle failed secret policy")
    return bundle


def retrieve_context_bundle(
    request: ContextRetrievalRequestV1,
) -> ContextBundleV1:
    """Retrieve only from fixed local artifacts and return a bounded bundle."""

    from .graph_index import fixed_code_graph_snapshot
    from .paths import graph_path
    from .readonly_graph import ReadOnlyCodeGraph
    from .readonly_projection import ReadOnlyObsidianProjection

    graph_snapshot = fixed_code_graph_snapshot(base_sha=request.base_sha)
    graph = ReadOnlyCodeGraph(graph_path())
    graph_limit = min(
        MAX_CONTEXT_ITEMS_PER_SOURCE,
        (
            request.max_items
            if request.obsidian_snapshot_digest is None
            else (request.max_items + 1) // 2
        ),
    )
    graph_records = graph.context_candidates(
        {
            "query": request.query,
            "limit": graph_limit,
            "include_ambiguous": request.include_ambiguous,
        }
    )
    if fixed_code_graph_snapshot(base_sha=request.base_sha) != graph_snapshot:
        raise GraphMemoryPolicyError("code graph snapshot changed during retrieval")
    candidates: list[ContextItemV1] = []
    for record in graph_records:
        source_ref = CodeGraphSourceRefV1(
            repository_id=request.repository_id,
            base_sha=graph_snapshot.base_sha,
            graph_sha256=graph_snapshot.graph_sha256,
            graph_manifest_sha256=graph_snapshot.graph_manifest_sha256,
            node_id=record["node_id"],
            relative_path=record["relative_path"],
            source_file_sha256=record["source_file_sha256"],
            relation=record.get("relation"),
            graph_confidence=record["graph_confidence"],
        )
        candidates.append(
            build_context_item(
                source_kind="code_graph",
                source_ref=source_ref,
                snapshot_digest=graph_snapshot.graph_snapshot_digest,
                evidence_class=record["evidence_class"],
                text=record["text"],
            )
        )

    if request.obsidian_snapshot_digest is not None:
        projection = ReadOnlyObsidianProjection()
        remaining = max(1, min(8, request.max_items - len(candidates)))
        raw_projection = projection.query(
            {
                "snapshot_digest": request.obsidian_snapshot_digest,
                "query": request.query,
                "limit": remaining,
                "max_chars": max(2000, min(12_000, request.max_text_bytes)),
            }
        )
        projection_result = json.loads(raw_projection)
        for result in projection_result["results"]:
            source_ref = ObsidianSourceRefV1(
                snapshot_digest=projection_result["snapshot_digest"],
                chunks_sha256=projection_result["chunks_sha256"],
                chunk_id=result["chunk_id"],
                chunk_sha256=result["chunk_sha256"],
                path_digest=result["path_digest"],
                display_path=result["display_path"],
            )
            candidates.append(
                build_context_item(
                    source_kind="obsidian_projection",
                    source_ref=source_ref,
                    snapshot_digest=projection_result["snapshot_digest"],
                    evidence_class="reported",
                    text=result["text"],
                )
            )

    if fixed_code_graph_snapshot(base_sha=request.base_sha) != graph_snapshot:
        raise GraphMemoryPolicyError("code graph snapshot changed during retrieval")
    return build_context_bundle(
        request=request,
        graph_snapshot=graph_snapshot,
        candidates=candidates,
    )
