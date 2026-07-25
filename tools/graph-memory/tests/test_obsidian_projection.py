from __future__ import annotations

import hashlib
import json
import os
import uuid
from pathlib import Path

import pytest

from sirinx_graph_memory.errors import GraphMemoryPolicyError
from sirinx_graph_memory.obsidian_projection import (
    MAX_NOTE_BYTES,
    MAX_PROJECTION_MANIFEST_BYTES,
    inventory_vault,
    project_vault,
)
from sirinx_graph_memory.paths import GRAPH_MEMORY_ROOT, RUNTIME_ENV
from sirinx_graph_memory.readonly_projection import ReadOnlyObsidianProjection
from sirinx_graph_memory.security import redact_text_with_count, secret_kinds


@pytest.fixture
def synthetic_vault(tmp_path: Path) -> Path:
    vault = tmp_path / "SIRINX"
    vault.mkdir()
    (vault / "Architecture.md").write_text(
        "# Architecture\n\nOwner owner@example.com uses a local-only graph.\n",
        encoding="utf-8",
    )
    (vault / "Runbook.md").write_text(
        "# Runbook\n\n" + ("deterministic stage\n" * 120),
        encoding="utf-8",
    )
    (vault / "Secret.md").write_text(
        "# Secret\n\napi_key=sk-proj-123456789012345678901234567890\n",
        encoding="utf-8",
    )
    (vault / "Too Large.md").write_bytes(b"x" * (MAX_NOTE_BYTES + 1))
    (vault / "attachment.png").write_bytes(b"\x89PNG\r\n\x1a\n")
    hidden = vault / ".obsidian"
    hidden.mkdir()
    (hidden / "workspace.json").write_text('{"private": true}', encoding="utf-8")
    nested_hidden = vault / ".private"
    nested_hidden.mkdir()
    (nested_hidden / "Hidden.md").write_text("# Hidden", encoding="utf-8")
    outside = tmp_path / "outside.md"
    outside.write_text("# Outside", encoding="utf-8")
    os.symlink(outside, vault / "Escape.md")
    os.symlink(vault / "Runbook.md", vault / "Inside Link.md")
    return vault


def _tree_digest(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root).as_posix()
        digest.update(relative.encode("utf-8"))
        if path.is_file() and not path.is_symlink():
            digest.update(path.read_bytes())
        elif path.is_symlink():
            digest.update(os.readlink(path).encode("utf-8"))
    return digest.hexdigest()


def test_inventory_is_read_only_sanitized_and_counted(
    isolated_runtime: Path, synthetic_vault: Path
):
    before = _tree_digest(synthetic_vault)
    inventory = inventory_vault(synthetic_vault)
    after = _tree_digest(synthetic_vault)
    assert before == after

    counts = inventory.manifest["counts"]
    assert counts["included"] == 2
    assert counts["redacted"] == 1
    assert counts["blocked_secret"] == 1
    assert counts["blocked_oversized"] == 1
    assert counts["excluded_non_markdown"] == 1
    assert counts["excluded_hidden_dirs"] == 2
    assert counts["blocked_symlink_escape"] == 1
    assert counts["excluded_symlink"] == 1
    assert counts["blocked"] == 3
    assert counts["excluded"] == 2

    persisted = isolated_runtime / "obsidian-projection" / "inventory.json"
    assert persisted.is_file()
    manifest_text = persisted.read_text(encoding="utf-8")
    assert "owner@example.com" not in manifest_text
    assert "sk-proj-" not in manifest_text
    assert "local-only graph" not in manifest_text
    assert '"content_in_manifest":false' in manifest_text
    receipt_text = json.dumps(inventory.receipt())
    assert "Architecture" not in receipt_text
    assert "Runbook" not in receipt_text


def test_projection_requires_exact_inventory_digest(
    isolated_runtime: Path, synthetic_vault: Path
):
    inventory = inventory_vault(synthetic_vault)
    wrong = "sha256:" + ("0" * 64)
    with pytest.raises(GraphMemoryPolicyError):
        project_vault(synthetic_vault, expected_inventory_digest=wrong)
    digest_dir = (
        isolated_runtime
        / "obsidian-projection"
        / inventory.snapshot_digest.removeprefix("sha256:")
    )
    assert not digest_dir.exists()


def test_projection_is_content_addressed_provider_free_and_vault_read_only(
    isolated_runtime: Path,
    synthetic_vault: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    inventory = inventory_vault(synthetic_vault)
    before = _tree_digest(synthetic_vault)

    def deny_network(*_args, **_kwargs):
        raise AssertionError("projection attempted network access")

    monkeypatch.setattr("socket.create_connection", deny_network)
    receipt = project_vault(
        synthetic_vault,
        expected_inventory_digest=inventory.snapshot_digest,
    )
    after = _tree_digest(synthetic_vault)
    assert before == after
    assert receipt["status"] == "OBSIDIAN_PROJECTION_READY"
    assert receipt["provider_calls"] == 0
    assert receipt["vault_write"] is False
    assert "text" not in receipt
    assert "display_path" not in receipt

    destination = (
        isolated_runtime
        / "obsidian-projection"
        / inventory.snapshot_digest.removeprefix("sha256:")
    )
    manifest = json.loads((destination / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["note_count"] == 2
    assert manifest["chunk_count"] >= 2
    notes = (destination / "notes.jsonl").read_text(encoding="utf-8")
    assert "owner@example.com" not in notes
    assert "[REDACTED_EMAIL]" in notes
    assert "sk-proj-" not in notes

    duplicate = project_vault(
        synthetic_vault,
        expected_inventory_digest=inventory.snapshot_digest,
    )
    assert duplicate["status"] == "OBSIDIAN_PROJECTION_ALREADY_EXISTS"


def test_existing_projection_is_reverified_before_reuse(
    isolated_runtime: Path, synthetic_vault: Path
):
    inventory = inventory_vault(synthetic_vault)
    project_vault(
        synthetic_vault,
        expected_inventory_digest=inventory.snapshot_digest,
    )
    destination = (
        isolated_runtime
        / "obsidian-projection"
        / inventory.snapshot_digest.removeprefix("sha256:")
    )
    with (destination / "chunks.jsonl").open("a", encoding="utf-8") as handle:
        handle.write('{"corrupt":true}\n')
    with pytest.raises(GraphMemoryPolicyError, match="artifact digest mismatch"):
        project_vault(
            synthetic_vault,
            expected_inventory_digest=inventory.snapshot_digest,
        )


def test_existing_projection_reuse_rejects_manifest_reader_would_reject(
    isolated_runtime: Path, synthetic_vault: Path
):
    inventory = inventory_vault(synthetic_vault)
    project_vault(
        synthetic_vault,
        expected_inventory_digest=inventory.snapshot_digest,
    )
    destination = (
        isolated_runtime
        / "obsidian-projection"
        / inventory.snapshot_digest.removeprefix("sha256:")
    )
    (destination / "manifest.json").write_bytes(
        b"{" + (b" " * MAX_PROJECTION_MANIFEST_BYTES) + b"}"
    )
    with pytest.raises(
        GraphMemoryPolicyError, match="existing projection is incomplete"
    ):
        project_vault(
            synthetic_vault,
            expected_inventory_digest=inventory.snapshot_digest,
        )


@pytest.mark.parametrize(
    "secret",
    [
        "glm-share-" + ("a" * 64),
        "123456789:" + ("A" * 35),
        "xox" + "b-" + "FAKE_TEST_TOKEN_NOT_REAL",
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzaXJpbngifQ.signature12345678",
        "hf_" + ("A" * 32),
        "glpat-" + ("A" * 24),
    ],
)
def test_inventory_blocks_broader_secret_corpus(
    isolated_runtime: Path, tmp_path: Path, secret: str
):
    vault = tmp_path / "SIRINX"
    vault.mkdir()
    (vault / "Credential.md").write_text(
        f"# Credential\n\n{secret}\n",
        encoding="utf-8",
    )
    inventory = inventory_vault(vault)
    assert inventory.manifest["counts"]["blocked_secret"] == 1
    assert inventory.manifest["counts"]["included"] == 0
    assert secret not in json.dumps(inventory.manifest)


def test_pii_corpus_is_redacted_without_blocking_safe_note(
    isolated_runtime: Path, tmp_path: Path
):
    line_user_id = "U" + ("a" * 32)
    vault = tmp_path / "SIRINX"
    vault.mkdir()
    (vault / "Contact.md").write_text(
        f"# Contact\n\nLINE {line_user_id} from 192.168.1.100\n",
        encoding="utf-8",
    )
    inventory = inventory_vault(vault)
    assert inventory.manifest["counts"]["included"] == 1
    assert inventory.manifest["counts"]["redacted"] == 1
    receipt = project_vault(
        vault,
        expected_inventory_digest=inventory.snapshot_digest,
    )
    assert receipt["status"] == "OBSIDIAN_PROJECTION_READY"
    destination = (
        isolated_runtime
        / "obsidian-projection"
        / inventory.snapshot_digest.removeprefix("sha256:")
    )
    notes = (destination / "notes.jsonl").read_text(encoding="utf-8")
    assert line_user_id not in notes
    assert "192.168.1.100" not in notes
    assert "[REDACTED_LINE_USER_ID]" in notes
    assert "[REDACTED_IPV4]" in notes


def test_secret_and_pii_detectors_preserve_benign_near_matches():
    benign = (
        "glm-share-plan, xox-FAKE-example, JWT architecture, "
        "LINE user U123, version 1.2.3 and 999.999.999.999"
    )
    assert secret_kinds(benign) == []
    redacted, count = redact_text_with_count(benign)
    assert redacted == benign
    assert count == 0


def test_inventory_digest_changes_with_note_content(
    isolated_runtime: Path, synthetic_vault: Path
):
    first = inventory_vault(synthetic_vault, persist_manifest=False)
    (synthetic_vault / "Runbook.md").write_text(
        "# Runbook\n\nchanged deterministic content\n",
        encoding="utf-8",
    )
    second = inventory_vault(synthetic_vault, persist_manifest=False)
    assert first.snapshot_digest != second.snapshot_digest


def test_readonly_projection_requires_exact_digest_and_bounds_results(
    isolated_runtime: Path, synthetic_vault: Path
):
    inventory = inventory_vault(synthetic_vault)
    project_vault(
        synthetic_vault,
        expected_inventory_digest=inventory.snapshot_digest,
    )
    reader = ReadOnlyObsidianProjection()
    info = json.loads(
        reader.snapshot_info({"snapshot_digest": inventory.snapshot_digest})
    )
    assert info["snapshot_digest"] == inventory.snapshot_digest
    assert info["provider_calls"] == 0
    assert info["vault_write"] is False

    result = json.loads(
        reader.query(
            {
                "snapshot_digest": inventory.snapshot_digest,
                "query": "deterministic stage",
                "limit": 2,
                "max_chars": 2400,
            }
        )
    )
    assert result["snapshot_digest"] == inventory.snapshot_digest
    assert 1 <= result["result_count"] <= 2
    assert result["provider_calls"] == 0
    assert result["external_calls"] == 0
    assert all(
        item["chunk_sha256"].startswith("sha256:")
        and item["evidence_class"] == "reported"
        for item in result["results"]
    )
    assert "source_path" not in json.dumps(result)

    with pytest.raises(GraphMemoryPolicyError):
        reader.query(
            {
                "snapshot_digest": "sha256:" + ("0" * 64),
                "query": "deterministic",
            }
        )


def test_readonly_projection_does_not_create_an_absent_runtime_root(
    monkeypatch: pytest.MonkeyPatch,
):
    absent_runtime = GRAPH_MEMORY_ROOT / f".runtime-test-absent-{uuid.uuid4().hex}"
    assert not absent_runtime.exists()
    monkeypatch.setenv(RUNTIME_ENV, str(absent_runtime))

    with pytest.raises(GraphMemoryPolicyError, match="runtime root is unavailable"):
        ReadOnlyObsidianProjection().snapshot_info(
            {"snapshot_digest": "sha256:" + ("0" * 64)}
        )

    assert not absent_runtime.exists()
