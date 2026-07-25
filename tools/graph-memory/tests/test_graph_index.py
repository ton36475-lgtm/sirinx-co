from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from sirinx_graph_memory.errors import GraphMemoryPolicyError
from sirinx_graph_memory.graph_index import (
    PROVIDER_ENV_KEYS,
    build_code_graph,
    build_invocation,
)
from sirinx_graph_memory.paths import PROJECT_ROOT
from sirinx_graph_memory.readonly_graph import ReadOnlyCodeGraph


def _write_source_manifest(graph_path: Path, source_root: Path) -> None:
    entries = {}
    for relative_path in ("src/a.py", "src/b.py"):
        source = source_root / relative_path
        content_md5 = hashlib.md5(
            source.read_bytes(), usedforsecurity=False
        ).hexdigest()
        entries[relative_path] = {
            "mtime": source.stat().st_mtime,
            "ast_hash": content_md5,
            "semantic_hash": content_md5,
        }
    graph_path.with_name("manifest.json").write_text(
        json.dumps(entries, sort_keys=True),
        encoding="utf-8",
    )


def test_graphify_invocation_is_exact_code_only_and_scrubbed(
    isolated_runtime, monkeypatch
):
    for key in PROVIDER_ENV_KEYS:
        monkeypatch.setenv(key, "provider-canary-must-not-escape")
    invocation = build_invocation()
    command = list(invocation.command)
    assert command[1:4] == ["-m", "graphify", "extract"]
    assert "--code-only" in command
    assert "--no-cluster" in command
    assert "--force" in command
    assert "--backend" not in command
    assert "install" not in command
    assert PROVIDER_ENV_KEYS.isdisjoint(invocation.env)
    assert invocation.env["GRAPHIFY_QUERY_LOG_DISABLE"] == "1"
    assert invocation.env["SIRINX_NETWORK_GUARD"] == "1"
    assert invocation.env["LANGSMITH_TRACING"] == "false"
    assert invocation.env["LANGCHAIN_TRACING_V2"] == "false"
    assert invocation.env["HOME"].startswith(str(isolated_runtime))
    assert invocation.cwd == isolated_runtime
    assert invocation.env["GRAPHIFY_OUT"] == str(isolated_runtime / "graphify-out")
    assert not (PROJECT_ROOT / "graphify-out").exists()


def test_child_network_guard_denies_socket_connect(isolated_runtime):
    invocation = build_invocation()
    completed = subprocess.run(
        [
            sys.executable,
            "-c",
            ("import socket; socket.create_connection(('127.0.0.1', 9), timeout=0.01)"),
        ],
        env=invocation.env,
        capture_output=True,
        text=True,
        check=False,
    )
    assert completed.returncode != 0
    assert "network disabled by SIRINX code-only policy" in completed.stderr


def test_graph_build_timeout_never_echoes_child_output(isolated_runtime, monkeypatch):
    def timeout(*_args, **_kwargs):
        raise subprocess.TimeoutExpired(
            cmd=["graphify", "extract"],
            timeout=1,
            output="sensitive child output",
            stderr="sensitive child error",
        )

    monkeypatch.setattr(subprocess, "run", timeout)
    with pytest.raises(GraphMemoryPolicyError) as raised:
        build_code_graph(timeout_seconds=1)
    assert str(raised.value) == "code-only graph build timed out"
    assert "sensitive" not in str(raised.value)


def test_structured_context_excludes_ambiguous_edges_by_default(
    sample_graph, monkeypatch
):
    payload = json.loads(sample_graph.read_text(encoding="utf-8"))
    payload["links"].append(
        {
            "source": "src/a.py::alpha",
            "target": "src/b.py::beta",
            "relation": "ambiguous-call",
            "confidence": "AMBIGUOUS",
            "source_file": "src/a.py",
            "source_location": "L9",
        }
    )
    sample_graph.write_text(json.dumps(payload, sort_keys=True), encoding="utf-8")
    sample_graph.with_name("manifest.json").write_text(
        json.dumps(
            {
                "src/a.py": {
                    "ast_hash": "a" * 32,
                    "semantic_hash": "a" * 32,
                },
                "src/b.py": {
                    "ast_hash": "b" * 32,
                    "semantic_hash": "b" * 32,
                },
            },
            sort_keys=True,
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(
        ReadOnlyCodeGraph,
        "_source_file_sha256",
        staticmethod(lambda _relative_path: "sha256:" + ("a" * 64)),
    )
    graph = ReadOnlyCodeGraph(sample_graph)

    assert graph.context_candidates({"query": "ambiguous", "limit": 16}) == []
    included = graph.context_candidates(
        {
            "query": "ambiguous",
            "limit": 16,
            "include_ambiguous": True,
        }
    )
    assert len(included) == 1
    assert included[0]["graph_confidence"] == "AMBIGUOUS"
    assert included[0]["evidence_class"] == "unverified"


def test_structured_context_hashes_the_fixed_project_source_file(
    sample_graph, monkeypatch, tmp_path
):
    source_root = tmp_path / "repo"
    source = source_root / "src" / "a.py"
    source.parent.mkdir(parents=True)
    source.write_text("def alpha():\n    return 'local-only'\n", encoding="utf-8")
    (source_root / "src" / "b.py").write_text(
        "def beta():\n    pass\n", encoding="utf-8"
    )
    _write_source_manifest(sample_graph, source_root)
    monkeypatch.setattr(
        "sirinx_graph_memory.readonly_graph.PROJECT_ROOT",
        source_root,
    )
    graph = ReadOnlyCodeGraph(sample_graph)
    candidates = graph.context_candidates({"query": "alpha", "limit": 16})
    expected = "sha256:" + hashlib.sha256(source.read_bytes()).hexdigest()
    assert candidates
    assert all(candidate["source_file_sha256"] == expected for candidate in candidates)
    assert all(candidate["relative_path"] == "src/a.py" for candidate in candidates)


def test_structured_context_rejects_source_drift_even_when_mtime_is_unchanged(
    sample_graph: Path,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
):
    source_root = tmp_path / "repo"
    source = source_root / "src" / "a.py"
    source.parent.mkdir(parents=True)
    source.write_text("def alpha():\n    return 'one'\n", encoding="utf-8")
    (source_root / "src" / "b.py").write_text(
        "def beta():\n    pass\n", encoding="utf-8"
    )
    _write_source_manifest(sample_graph, source_root)
    monkeypatch.setattr(
        "sirinx_graph_memory.readonly_graph.PROJECT_ROOT",
        source_root,
    )
    graph = ReadOnlyCodeGraph(sample_graph)
    assert graph.context_candidates({"query": "alpha", "limit": 16})

    original = source.stat()
    source.write_text("def alpha():\n    return 'two'\n", encoding="utf-8")
    assert source.stat().st_size == original.st_size
    os.utime(source, ns=(original.st_atime_ns, original.st_mtime_ns))
    assert source.stat().st_mtime_ns == original.st_mtime_ns

    with pytest.raises(
        GraphMemoryPolicyError,
        match="indexed source content drift detected",
    ):
        graph.context_candidates({"query": "alpha", "limit": 16})


def test_structured_context_honors_graphifyignore_receipt_exclusion(
    sample_graph: Path,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
):
    source_root = tmp_path / "repo"
    (source_root / "src").mkdir(parents=True)
    (source_root / "src" / "a.py").write_text("alpha = 1\n", encoding="utf-8")
    (source_root / "src" / "b.py").write_text("beta = 2\n", encoding="utf-8")
    receipt = source_root / "tools" / "graph-memory" / "IMPLEMENTATION_RECEIPT.json"
    receipt.parent.mkdir(parents=True)
    receipt.write_text('{"status":"old"}\n', encoding="utf-8")
    (source_root / ".graphifyignore").write_text(
        "tools/graph-memory/IMPLEMENTATION_RECEIPT.json\n",
        encoding="utf-8",
    )

    graph_payload = json.loads(sample_graph.read_text(encoding="utf-8"))
    graph_payload["nodes"].append(
        {
            "id": "tools/graph-memory/IMPLEMENTATION_RECEIPT.json::status",
            "label": "implementation receipt",
            "source_file": "tools/graph-memory/IMPLEMENTATION_RECEIPT.json",
            "file_type": "json",
            "community": 0,
        }
    )
    sample_graph.write_text(
        json.dumps(graph_payload, sort_keys=True),
        encoding="utf-8",
    )
    _write_source_manifest(sample_graph, source_root)
    manifest_path = sample_graph.with_name("manifest.json")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    receipt_md5 = hashlib.md5(receipt.read_bytes(), usedforsecurity=False).hexdigest()
    manifest["tools/graph-memory/IMPLEMENTATION_RECEIPT.json"] = {
        "mtime": receipt.stat().st_mtime,
        "ast_hash": receipt_md5,
        "semantic_hash": receipt_md5,
    }
    manifest_path.write_text(
        json.dumps(manifest, sort_keys=True),
        encoding="utf-8",
    )
    receipt.write_text('{"status":"changed"}\n', encoding="utf-8")
    monkeypatch.setattr(
        "sirinx_graph_memory.readonly_graph.PROJECT_ROOT",
        source_root,
    )

    graph = ReadOnlyCodeGraph(sample_graph)
    assert (
        graph.context_candidates({"query": "implementation receipt", "limit": 16}) == []
    )
