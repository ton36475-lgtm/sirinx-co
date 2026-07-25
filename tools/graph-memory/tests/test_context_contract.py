from __future__ import annotations

import hashlib
import io
import json
import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

from sirinx_graph_memory.cli import main
from sirinx_graph_memory.context_contract import (
    APPROVED_BASE_SHA,
    MAX_CONTEXT_ITEMS,
    MAX_CONTEXT_REQUEST_BYTES,
    MAX_CONTEXT_TEXT_BYTES,
    CodeGraphSourceRefV1,
    ContextBundleV1,
    ContextRetrievalRequestV1,
    ObsidianSourceRefV1,
    build_code_graph_snapshot,
    build_context_bundle,
    build_context_item,
    canonical_bundle_json,
    parse_context_request_json,
    retrieve_context_bundle,
)
from sirinx_graph_memory.errors import GraphMemoryPolicyError
from sirinx_graph_memory.graph_index import fixed_code_graph_snapshot
from sirinx_graph_memory.obsidian_projection import inventory_vault, project_vault
from sirinx_graph_memory.readonly_graph import ReadOnlyCodeGraph

CONTEXT_BUNDLE_SCHEMA = (
    Path(__file__).resolve().parents[1] / "schemas" / "context-bundle.schema.json"
)


def _digest(value: str) -> str:
    return "sha256:" + hashlib.sha256(value.encode("utf-8")).hexdigest()


def _request(**overrides) -> ContextRetrievalRequestV1:
    value = {
        "schema_version": "1.0.0",
        "task_id": "task-context-001",
        "goal_spec_digest": _digest("goal-spec"),
        "repository_id": "sirinx-co",
        "base_sha": APPROVED_BASE_SHA,
        "query": "alpha raw-query-marker",
    }
    value.update(overrides)
    return ContextRetrievalRequestV1.model_validate(value)


def _snapshot():
    return build_code_graph_snapshot(
        base_sha=APPROVED_BASE_SHA,
        graph_sha256=_digest("graph"),
        graph_manifest_sha256=_digest("manifest"),
    )


def _code_item(
    *,
    index: int,
    text: str,
    confidence: str = "EXTRACTED",
    evidence_class: str = "observed",
):
    snapshot = _snapshot()
    source_ref = CodeGraphSourceRefV1(
        repository_id="sirinx-co",
        base_sha=snapshot.base_sha,
        graph_sha256=snapshot.graph_sha256,
        graph_manifest_sha256=snapshot.graph_manifest_sha256,
        node_id=f"node-{index}",
        relative_path=f"src/module_{index}.py",
        source_file_sha256=_digest(f"source-{index}"),
        graph_confidence=confidence,
    )
    return build_context_item(
        source_kind="code_graph",
        source_ref=source_ref,
        snapshot_digest=snapshot.graph_snapshot_digest,
        evidence_class=evidence_class,
        text=text,
    )


def _write_graph_manifest(graph_path: Path) -> Path:
    manifest = graph_path.with_name("manifest.json")
    manifest.write_text(
        json.dumps(
            {
                "src/a.py": {
                    "ast_hash": "a" * 32,
                    "semantic_hash": "b" * 32,
                }
            },
            sort_keys=True,
        ),
        encoding="utf-8",
    )
    return manifest


def _obsidian_item(*, index: int, text: str, snapshot_digest: str):
    source_ref = ObsidianSourceRefV1(
        snapshot_digest=snapshot_digest,
        chunks_sha256=_digest("chunks"),
        chunk_id=f"obsidian-chunk-{index:024x}",
        chunk_sha256=_digest(f"chunk-{index}"),
        path_digest=_digest(f"path-{index}"),
        display_path=f"Note-{index}.md",
    )
    return build_context_item(
        source_kind="obsidian_projection",
        source_ref=source_ref,
        snapshot_digest=snapshot_digest,
        evidence_class="reported",
        text=text,
    )


def test_snapshot_binds_base_graph_and_graphify_manifest(sample_graph: Path):
    manifest = _write_graph_manifest(sample_graph)
    snapshot = fixed_code_graph_snapshot()
    assert snapshot.base_sha == APPROVED_BASE_SHA
    assert snapshot.graph_sha256 == _digest(sample_graph.read_text(encoding="utf-8"))
    assert snapshot.graph_manifest_sha256 == _digest(
        manifest.read_text(encoding="utf-8")
    )
    assert snapshot.graph_snapshot_digest.startswith("sha256:")
    assert snapshot.provider_calls == 0
    assert snapshot.external_calls == 0

    with pytest.raises(ValidationError):
        build_code_graph_snapshot(
            base_sha="a" * 39,
            graph_sha256=_digest("graph"),
            graph_manifest_sha256=_digest("manifest"),
        )


def test_bundle_uses_architecture_field_names_and_never_contains_raw_query():
    request = _request()
    snapshot = _snapshot()
    item = _code_item(index=1, text='{"kind":"node","label":"alpha"}')
    bundle = build_context_bundle(
        request=request,
        graph_snapshot=snapshot,
        candidates=[item],
    )
    encoded = canonical_bundle_json(bundle)
    decoded = json.loads(encoded)
    assert isinstance(ContextBundleV1.model_validate(decoded), ContextBundleV1)
    assert {
        "schema_version",
        "task_id",
        "goal_spec_digest",
        "repository_id",
        "base_sha",
        "graph_snapshot_digest",
        "obsidian_snapshot_digest",
        "query_digest",
        "items",
        "total_text_bytes",
        "provider_calls",
        "external_calls",
        "bundle_digest",
    } == set(decoded)
    assert request.query not in encoded
    assert "query" not in decoded
    assert decoded["provider_calls"] == 0
    assert decoded["external_calls"] == 0
    assert decoded["items"][0]["schema_version"] == "1.0.0"
    assert decoded["items"][0]["authority"] == "context_only"
    assert decoded["items"][0]["source_ref"]["base_sha"] == APPROVED_BASE_SHA
    assert decoded["items"][0]["source_ref"]["graph_sha256"] == _digest("graph")
    assert decoded["items"][0]["content_digest"].startswith("sha256:")
    assert decoded["items"][0]["item_digest"].startswith("sha256:")


def test_typed_human_redaction_never_mutates_digest_fields():
    phone_shaped_digest = "sha256:" + ("a" * 10) + "0087420123" + ("b" * 44)
    snapshot = _snapshot()
    source_ref = CodeGraphSourceRefV1(
        repository_id="sirinx-co",
        base_sha=snapshot.base_sha,
        graph_sha256=snapshot.graph_sha256,
        graph_manifest_sha256=snapshot.graph_manifest_sha256,
        node_id="contact-0087420123",
        relative_path="src/contact.py",
        source_file_sha256=phone_shaped_digest,
        relation="calls-0087420123",
        graph_confidence="EXTRACTED",
    )
    item = build_context_item(
        source_kind="code_graph",
        source_ref=source_ref,
        snapshot_digest=snapshot.graph_snapshot_digest,
        evidence_class="observed",
        text="Call 0087420123 for context.",
    )

    assert isinstance(item.source_ref, CodeGraphSourceRefV1)
    assert item.source_ref.source_file_sha256 == phone_shaped_digest
    assert item.source_ref.node_id == "contact-[REDACTED_PHONE]"
    assert item.source_ref.relation == "calls-[REDACTED_PHONE]"
    assert item.text == "Call [REDACTED_PHONE] for context."
    encoded = json.dumps(item.model_dump(mode="json"), sort_keys=True)
    assert phone_shaped_digest in encoded


def test_published_context_bundle_schema_matches_runtime_contract():
    published = json.loads(CONTEXT_BUNDLE_SCHEMA.read_text(encoding="utf-8"))
    assert published == ContextBundleV1.model_json_schema()


def test_bundle_enforces_item_and_utf8_text_byte_limits():
    snapshot = _snapshot()
    graph_limited = build_context_bundle(
        request=_request(max_items=MAX_CONTEXT_ITEMS),
        graph_snapshot=snapshot,
        candidates=[
            _code_item(index=index, text=f"context-{index}") for index in range(20)
        ],
    )
    assert len(graph_limited.items) == 8

    obsidian_snapshot_digest = _digest("obsidian-snapshot")
    mixed = build_context_bundle(
        request=_request(
            max_items=MAX_CONTEXT_ITEMS,
            obsidian_snapshot_digest=obsidian_snapshot_digest,
        ),
        graph_snapshot=snapshot,
        candidates=[
            *[_code_item(index=index, text=f"code-{index}") for index in range(8)],
            *[
                _obsidian_item(
                    index=index,
                    text=f"reported-{index}",
                    snapshot_digest=obsidian_snapshot_digest,
                )
                for index in range(8)
            ],
        ],
    )
    assert len(mixed.items) == MAX_CONTEXT_ITEMS

    byte_limited = build_context_bundle(
        request=_request(
            max_items=MAX_CONTEXT_ITEMS,
            max_text_bytes=MAX_CONTEXT_TEXT_BYTES,
        ),
        graph_snapshot=snapshot,
        candidates=[_code_item(index=index, text="ก" * 1000) for index in range(16)],
    )
    assert byte_limited.total_text_bytes == MAX_CONTEXT_TEXT_BYTES
    assert len(byte_limited.items) == 8


def test_ambiguous_graph_context_is_excluded_unless_explicitly_requested():
    snapshot = _snapshot()
    ambiguous = _code_item(
        index=1,
        text='{"confidence":"AMBIGUOUS"}',
        confidence="AMBIGUOUS",
        evidence_class="unverified",
    )
    excluded = build_context_bundle(
        request=_request(),
        graph_snapshot=snapshot,
        candidates=[ambiguous],
    )
    assert excluded.items == []

    included = build_context_bundle(
        request=_request(include_ambiguous=True),
        graph_snapshot=snapshot,
        candidates=[ambiguous],
    )
    assert len(included.items) == 1
    assert included.items[0].evidence_class == "unverified"


def test_context_request_is_stdin_only_bounded_and_base_bound():
    raw = _request().model_dump(mode="json")
    parsed = parse_context_request_json(json.dumps(raw))
    assert parsed.base_sha == APPROVED_BASE_SHA

    with pytest.raises(GraphMemoryPolicyError, match="validation failed"):
        parse_context_request_json(json.dumps({**raw, "graph_path": "/tmp/graph"}))
    with pytest.raises(GraphMemoryPolicyError, match="not approved"):
        parse_context_request_json(json.dumps({**raw, "base_sha": "a" * 40}))
    with pytest.raises(GraphMemoryPolicyError, match="64 KiB"):
        parse_context_request_json(" " * (MAX_CONTEXT_REQUEST_BYTES + 1))
    with pytest.raises(GraphMemoryPolicyError) as raised:
        parse_context_request_json(
            json.dumps(
                {
                    **raw,
                    "query": "api_key=sk-proj-123456789012345678901234567890",
                }
            )
        )
    assert "sk-proj-" not in str(raised.value)


def test_retrieve_context_cli_reads_fixed_artifacts_without_persistence(
    isolated_runtime: Path,
    sample_graph: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
):
    _write_graph_manifest(sample_graph)
    request = _request().model_dump(mode="json")
    before = sorted(
        path.relative_to(isolated_runtime).as_posix()
        for path in isolated_runtime.rglob("*")
    )
    monkeypatch.setattr(
        ReadOnlyCodeGraph,
        "_source_file_sha256",
        staticmethod(lambda _relative_path: _digest("synthetic-source")),
    )
    monkeypatch.setattr(sys, "stdin", io.StringIO(json.dumps(request)))
    assert main(["retrieve-context"]) == 0
    output = capsys.readouterr().out
    bundle = json.loads(output)
    after = sorted(
        path.relative_to(isolated_runtime).as_posix()
        for path in isolated_runtime.rglob("*")
    )
    assert before == after
    assert bundle["task_id"] == request["task_id"]
    assert bundle["query_digest"] == _digest(request["query"])
    assert request["query"] not in output
    assert 1 <= len(bundle["items"]) <= request["max_items"]
    assert bundle["provider_calls"] == 0
    assert bundle["external_calls"] == 0
    assert all(
        item["source_ref"]["graph_confidence"] != "AMBIGUOUS"
        for item in bundle["items"]
        if item["source_kind"] == "code_graph"
    )


def test_context_bundle_carries_exact_existing_obsidian_chunk_provenance(
    isolated_runtime: Path,
    sample_graph: Path,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    _write_graph_manifest(sample_graph)
    monkeypatch.setattr(
        ReadOnlyCodeGraph,
        "_source_file_sha256",
        staticmethod(lambda _relative_path: _digest("synthetic-source")),
    )
    vault = tmp_path / "SIRINX"
    vault.mkdir()
    (vault / "Architecture.md").write_text(
        "# Architecture\n\nAlpha registry is reported by Hermes.\n",
        encoding="utf-8",
    )
    inventory = inventory_vault(vault)
    project_vault(
        vault,
        expected_inventory_digest=inventory.snapshot_digest,
    )
    request = _request(
        query="alpha registry",
        max_items=4,
        obsidian_snapshot_digest=inventory.snapshot_digest,
    )
    bundle = retrieve_context_bundle(request)
    obsidian_items = [
        item for item in bundle.items if item.source_kind == "obsidian_projection"
    ]
    assert len(obsidian_items) == 1
    item = obsidian_items[0]
    assert item.evidence_class == "reported"
    assert item.authority == "context_only"
    source_ref = item.source_ref.model_dump(mode="json")
    assert source_ref["snapshot_digest"] == inventory.snapshot_digest
    assert source_ref["chunks_sha256"].startswith("sha256:")
    assert source_ref["chunk_sha256"].startswith("sha256:")
    assert source_ref["path_digest"].startswith("sha256:")
    assert source_ref["display_path"] == "Architecture.md"
