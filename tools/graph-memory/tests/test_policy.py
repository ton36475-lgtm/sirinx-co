from __future__ import annotations

import json
from pathlib import Path

import pytest

from sirinx_graph_memory.cli import COMMAND_NAMES
from sirinx_graph_memory.errors import GraphMemoryPolicyError, SecretDetectedError
from sirinx_graph_memory.langchain_adapter import build_proposal_tool
from sirinx_graph_memory.models import MemoryProposalInput, prepare_proposal
from sirinx_graph_memory.paths import GRAPH_MEMORY_ROOT, RUNTIME_ENV, runtime_root
from sirinx_graph_memory.workflow import submit_proposal

MEMORY_PROPOSAL_SCHEMA = (
    Path(__file__).resolve().parents[1] / "schemas" / "memory-proposal.schema.json"
)


def proposal(**overrides):
    value = {
        "schema_version": "1.0.0",
        "agent_id": "codex-maker-a",
        "project": "sirinx-co",
        "summary": "Observed a deterministic local graph boundary.",
        "proposed_memory": "The code graph is read-only for all worker agents.",
        "observations": ["Focused tests passed without provider inference."],
        "evidence_refs": ["tools/graph-memory/tests/test_policy.py"],
        "evidence_class": "observed",
        "tags": ["graph-memory", "local-only"],
    }
    value.update(overrides)
    return value


def test_runtime_must_remain_under_tool_root(monkeypatch, tmp_path):
    monkeypatch.setenv(RUNTIME_ENV, str(tmp_path))
    with pytest.raises(GraphMemoryPolicyError):
        runtime_root()

    contained = GRAPH_MEMORY_ROOT / ".runtime-test-contained"
    monkeypatch.setenv(RUNTIME_ENV, str(contained))
    assert runtime_root() == contained.resolve()


def test_secret_is_rejected_before_persistence(isolated_runtime: Path):
    raw = proposal(proposed_memory="Use api_key=sk-proj-123456789012345678901234567890")
    with pytest.raises(SecretDetectedError):
        submit_proposal(raw)
    assert not (isolated_runtime / "proposals.jsonl").exists()
    assert not (isolated_runtime / "proposal-checkpoints.sqlite").exists()


def test_redaction_and_content_addressing():
    first = prepare_proposal(
        proposal(
            summary="Contact owner@example.com after the deterministic review.",
            proposed_memory=(
                "The owner path is /Users/sirinx/private and phone 081-234-5678."
            ),
        )
    )
    second = prepare_proposal(
        proposal(
            summary="Contact owner@example.com after the deterministic review.",
            proposed_memory=(
                "The owner path is /Users/sirinx/private and phone 081-234-5678."
            ),
        )
    )
    assert first.proposal_id == second.proposal_id
    encoded = json.dumps(first.model_dump(mode="json"))
    assert "owner@example.com" not in encoded
    assert "081-234-5678" not in encoded
    assert "/Users/sirinx" not in encoded
    assert "[REDACTED_EMAIL]" in encoded


def test_evidence_refs_are_project_relative():
    with pytest.raises(GraphMemoryPolicyError):
        prepare_proposal(proposal(evidence_refs=["../../.env"]))
    with pytest.raises(GraphMemoryPolicyError):
        prepare_proposal(proposal(evidence_refs=["https://example.test/log"]))


def test_observations_are_required_and_each_item_is_bounded():
    missing = proposal()
    missing.pop("observations")
    with pytest.raises(GraphMemoryPolicyError):
        prepare_proposal(missing)

    one_character = prepare_proposal(proposal(observations=["x"]))
    one_thousand_characters = prepare_proposal(proposal(observations=["x" * 1000]))
    assert one_character.payload.observations == ["x"]
    assert len(one_thousand_characters.payload.observations[0]) == 1000

    for observation in ("", "x" * 1001):
        with pytest.raises(GraphMemoryPolicyError):
            prepare_proposal(proposal(observations=[observation]))


def test_tags_are_normalized_and_restricted_to_the_ascii_contract():
    normalized = prepare_proposal(
        proposal(tags=["Graph-Memory", "graph-memory", "LOCAL_only"])
    )
    assert normalized.payload.tags == ["graph-memory", "local_only"]

    with pytest.raises(GraphMemoryPolicyError):
        prepare_proposal(proposal(tags=["กราฟ-memory"]))


def test_published_json_schema_matches_the_pydantic_contract():
    published = json.loads(MEMORY_PROPOSAL_SCHEMA.read_text(encoding="utf-8"))
    assert published == MemoryProposalInput.model_json_schema()


def test_proposal_queue_is_idempotent_and_checkpointed(isolated_runtime: Path):
    first = submit_proposal(proposal())
    second = submit_proposal(proposal())
    assert first["status"] == "QUEUED_FOR_HERMES_REVIEW"
    assert second["status"] == "ALREADY_QUEUED"
    queue = isolated_runtime / "proposals.jsonl"
    assert len(queue.read_text(encoding="utf-8").splitlines()) == 1
    assert (isolated_runtime / "proposal-checkpoints.sqlite").is_file()
    persisted = queue.read_text(encoding="utf-8")
    assert '"authority":"proposal_only"' in persisted
    assert "approve" not in first
    assert "delete" not in first


def test_langchain_tool_is_proposal_only(isolated_runtime: Path):
    tool = build_proposal_tool()
    assert tool.name == "submit_memory_proposal"
    result = json.loads(tool.invoke({"proposal_json": json.dumps(proposal())}))
    assert result["authority"] == "proposal_only"
    assert result["next"] == "HERMES_REVIEW_REQUIRED"


def test_cli_has_no_authority_or_admin_commands():
    assert set(COMMAND_NAMES) == {
        "index",
        "serve-readonly",
        "propose",
        "list-proposals",
        "obsidian-inventory",
        "obsidian-project",
        "retrieve-context",
        "policy",
    }
    forbidden = {"approve", "delete", "promote", "admin", "deploy", "push"}
    assert forbidden.isdisjoint(COMMAND_NAMES)
