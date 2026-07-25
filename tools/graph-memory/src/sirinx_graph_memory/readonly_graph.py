"""Read-only query facade over a fixed Graphify graph."""

# ruff: noqa: E402

from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any

import networkx as nx

from .offline_policy import enforce_process_offline

enforce_process_offline()
os.environ["GRAPHIFY_QUERY_LOG_DISABLE"] = "1"

from graphify.analyze import god_nodes as _god_nodes  # noqa: E402
from graphify.build import edge_data  # noqa: E402
from graphify.detect import _is_ignored, _load_graphifyignore  # noqa: E402
from graphify.security import sanitize_label  # noqa: E402
from graphify.serve import (  # noqa: E402
    _communities_from_graph,
    _find_node,
    _load_graph,
    _pick_scored_endpoint,
    _query_graph_text,
    _score_nodes,
)

from .errors import GraphMemoryPolicyError
from .paths import PROJECT_ROOT, assert_fixed_graph_path
from .security import redact_text, secret_kinds, validate_evidence_ref

_TOKEN_PATTERN = re.compile(r"[^\W_]+", re.UNICODE)
_GRAPH_CONFIDENCES = frozenset({"EXTRACTED", "INFERRED", "AMBIGUOUS"})
_EVIDENCE_BY_CONFIDENCE = {
    "EXTRACTED": "observed",
    "INFERRED": "inferred",
    "AMBIGUOUS": "unverified",
}
_MAX_SOURCE_FILE_BYTES = 8 * 1024 * 1024
_MAX_GRAPH_MANIFEST_BYTES = 4 * 1024 * 1024
_MD5_PATTERN = re.compile(r"^[0-9a-f]{32}$")


class ReadOnlyCodeGraph:
    def __init__(self, path: Path):
        self.path = assert_fixed_graph_path(path)
        if not self.path.is_file():
            raise GraphMemoryPolicyError("code graph is missing; run index first")
        try:
            self.graph = _load_graph(str(self.path))
        except SystemExit as exc:
            raise GraphMemoryPolicyError("code graph could not be loaded") from exc
        # The upstream loader can attach an optional work-memory sidecar.
        # This boundary is structural code only, so discard any overlay even if
        # another local process created one beside graph.json.
        self.graph.graph["_learning_overlay"] = {}
        self.communities = _communities_from_graph(self.graph)
        self._source_manifest_cache: dict[str, Any] | None = None
        self._graphifyignore_patterns: list[tuple[Path, str]] | None = None

    @staticmethod
    def _text(value: Any, *, name: str, limit: int = 500) -> str:
        if not isinstance(value, str):
            raise GraphMemoryPolicyError(f"{name} must be a string")
        normalized = value.strip()
        if not normalized or len(normalized) > limit:
            raise GraphMemoryPolicyError(f"{name} length is outside policy")
        return normalized

    @staticmethod
    def _integer(
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

    @staticmethod
    def _safe_human_text(value: Any) -> str:
        return redact_text(sanitize_label(str(value)))

    def query_graph(self, arguments: dict[str, Any]) -> str:
        question = self._text(arguments.get("question"), name="question")
        mode = arguments.get("mode", "bfs")
        if mode not in {"bfs", "dfs"}:
            raise GraphMemoryPolicyError("mode must be bfs or dfs")
        depth = self._integer(
            arguments.get("depth"),
            name="depth",
            default=3,
            minimum=1,
            maximum=6,
        )
        budget = self._integer(
            arguments.get("token_budget"),
            name="token_budget",
            default=2000,
            minimum=100,
            maximum=8000,
        )
        filters = arguments.get("context_filter")
        if filters is not None:
            if not isinstance(filters, list) or len(filters) > 8:
                raise GraphMemoryPolicyError("context_filter is outside policy")
            filters = [
                self._text(value, name="context_filter", limit=64) for value in filters
            ]
        return redact_text(
            _query_graph_text(
                self.graph,
                question,
                mode=mode,
                depth=depth,
                token_budget=budget,
                context_filters=filters,
            )
        )

    def get_node(self, arguments: dict[str, Any]) -> str:
        label = self._text(arguments.get("label"), name="label", limit=256)
        matches = _find_node(self.graph, label.lower())
        if not matches:
            return f"No node matching '{self._safe_human_text(label)}' found."
        node_id = matches[0]
        data = self.graph.nodes[node_id]
        return "\n".join(
            [
                f"Node: {self._safe_human_text(data.get('label', node_id))}",
                f"  ID: {self._safe_human_text(node_id)}",
                f"  Source: {self._safe_human_text(data.get('source_file', ''))}",
                f"  Type: {self._safe_human_text(data.get('file_type', ''))}",
                f"  Community: {self._safe_human_text(data.get('community', ''))}",
                f"  Degree: {self.graph.degree(node_id)}",
            ]
        )

    def get_neighbors(self, arguments: dict[str, Any]) -> str:
        label = self._text(arguments.get("label"), name="label", limit=256)
        relation_filter = arguments.get("relation_filter", "")
        if relation_filter:
            relation_filter = self._text(
                relation_filter, name="relation_filter", limit=64
            ).lower()
        matches = _find_node(self.graph, label.lower())
        if not matches:
            return f"No node matching '{self._safe_human_text(label)}' found."
        node_id = matches[0]
        node_label = self._safe_human_text(
            self.graph.nodes[node_id].get("label", node_id)
        )
        lines = [f"Neighbors of {node_label}:"]
        for neighbor in self.graph.successors(node_id):
            relation = str(edge_data(self.graph, node_id, neighbor).get("relation", ""))
            if relation_filter and relation_filter not in relation.lower():
                continue
            neighbor_label = self._safe_human_text(
                self.graph.nodes[neighbor].get("label", neighbor)
            )
            lines.append(
                f"  --> {neighbor_label} "
                f"[{self._safe_human_text(relation or 'related')}]"
            )
        for neighbor in self.graph.predecessors(node_id):
            relation = str(edge_data(self.graph, neighbor, node_id).get("relation", ""))
            if relation_filter and relation_filter not in relation.lower():
                continue
            neighbor_label = self._safe_human_text(
                self.graph.nodes[neighbor].get("label", neighbor)
            )
            lines.append(
                f"  <-- {neighbor_label} "
                f"[{self._safe_human_text(relation or 'related')}]"
            )
        return "\n".join(lines[:201])

    def get_community(self, arguments: dict[str, Any]) -> str:
        community_id = self._integer(
            arguments.get("community_id"),
            name="community_id",
            default=0,
            minimum=0,
            maximum=100000,
        )
        nodes = self.communities.get(community_id, [])
        if not nodes:
            return f"Community {community_id} not found."
        lines = [f"Community {community_id} ({len(nodes)} nodes):"]
        for node_id in nodes[:500]:
            data = self.graph.nodes[node_id]
            lines.append(
                f"  {self._safe_human_text(data.get('label', node_id))} "
                f"[{self._safe_human_text(data.get('source_file', ''))}]"
            )
        return "\n".join(lines)

    def god_nodes(self, arguments: dict[str, Any]) -> str:
        top_n = self._integer(
            arguments.get("top_n"),
            name="top_n",
            default=10,
            minimum=1,
            maximum=100,
        )
        nodes = _god_nodes(self.graph, top_n=top_n)
        lines = ["God nodes (most connected):"]
        lines.extend(
            f"  {index}. {self._safe_human_text(node['label'])} - "
            f"{node['degree']} edges"
            for index, node in enumerate(nodes, 1)
        )
        return "\n".join(lines)

    def graph_stats(self, _arguments: dict[str, Any]) -> str:
        confidences = [
            data.get("confidence", "EXTRACTED")
            for _, _, data in self.graph.edges(data=True)
        ]
        total = len(confidences) or 1
        return "\n".join(
            [
                f"Nodes: {self.graph.number_of_nodes()}",
                f"Edges: {self.graph.number_of_edges()}",
                f"Communities: {len(self.communities)}",
                f"EXTRACTED: {round(confidences.count('EXTRACTED') / total * 100)}%",
                f"INFERRED: {round(confidences.count('INFERRED') / total * 100)}%",
                f"AMBIGUOUS: {round(confidences.count('AMBIGUOUS') / total * 100)}%",
            ]
        )

    @staticmethod
    def _confidence(value: Any) -> str:
        normalized = str(value or "EXTRACTED").upper()
        if normalized not in _GRAPH_CONFIDENCES:
            return "AMBIGUOUS"
        return normalized

    @staticmethod
    def _source_path(value: Any) -> str | None:
        if value in (None, ""):
            return None
        if not isinstance(value, str):
            raise GraphMemoryPolicyError("graph source path is invalid")
        return validate_evidence_ref(redact_text(value))

    @staticmethod
    def _source_location(value: Any) -> str | None:
        if value in (None, ""):
            return None
        location = redact_text(str(value))
        if len(location) > 100:
            raise GraphMemoryPolicyError("graph source location is outside policy")
        return location

    def _source_manifest(self) -> dict[str, Any]:
        if self._source_manifest_cache is not None:
            return self._source_manifest_cache
        manifest_path = self.path.with_name("manifest.json")
        if manifest_path.is_symlink() or not manifest_path.is_file():
            raise GraphMemoryPolicyError("Graphify source manifest is unavailable")
        before = manifest_path.stat()
        if before.st_size > _MAX_GRAPH_MANIFEST_BYTES:
            raise GraphMemoryPolicyError("Graphify source manifest exceeds read policy")
        try:
            raw = manifest_path.read_bytes()
            manifest = json.loads(raw.decode("utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError):
            raise GraphMemoryPolicyError(
                "Graphify source manifest is invalid"
            ) from None
        after = manifest_path.stat()
        if (
            before.st_dev,
            before.st_ino,
            before.st_size,
            before.st_mtime_ns,
        ) != (
            after.st_dev,
            after.st_ino,
            after.st_size,
            after.st_mtime_ns,
        ):
            raise GraphMemoryPolicyError(
                "Graphify source manifest changed during reading"
            )
        if not isinstance(manifest, dict):
            raise GraphMemoryPolicyError("Graphify source manifest is invalid")
        self._source_manifest_cache = manifest
        return manifest

    def _source_is_graphify_ignored(self, relative_path: str) -> bool:
        if self._graphifyignore_patterns is None:
            self._graphifyignore_patterns = _load_graphifyignore(
                PROJECT_ROOT,
                gitignore=False,
            )
        return _is_ignored(
            PROJECT_ROOT / relative_path,
            PROJECT_ROOT,
            self._graphifyignore_patterns,
        )

    def _source_file_sha256(self, relative_path: str) -> str:
        manifest_entry = self._source_manifest().get(relative_path)
        if not isinstance(manifest_entry, dict):
            raise GraphMemoryPolicyError(
                "indexed source is not bound by the Graphify manifest"
            )
        ast_hash = manifest_entry.get("ast_hash")
        semantic_hash = manifest_entry.get("semantic_hash")
        if (
            not isinstance(ast_hash, str)
            or not isinstance(semantic_hash, str)
            or not _MD5_PATTERN.fullmatch(ast_hash)
            or not _MD5_PATTERN.fullmatch(semantic_hash)
            or ast_hash != semantic_hash
        ):
            raise GraphMemoryPolicyError(
                "indexed source has an invalid Graphify manifest binding"
            )

        root = PROJECT_ROOT.resolve()
        candidate = PROJECT_ROOT / relative_path
        current = PROJECT_ROOT
        for part in Path(relative_path).parts:
            current = current / part
            if current.is_symlink():
                raise GraphMemoryPolicyError("graph source file cannot be a symlink")
        try:
            resolved = candidate.resolve(strict=True)
        except OSError:
            raise GraphMemoryPolicyError("indexed source file is unavailable") from None
        try:
            resolved.relative_to(root)
        except ValueError:
            raise GraphMemoryPolicyError(
                "graph source file is outside policy"
            ) from None
        if not resolved.is_file():
            raise GraphMemoryPolicyError("indexed source file is unavailable")
        before = resolved.stat()
        if before.st_size > _MAX_SOURCE_FILE_BYTES:
            raise GraphMemoryPolicyError("indexed source file exceeds read policy")
        sha256_digest = hashlib.sha256()
        md5_digest = hashlib.md5(usedforsecurity=False)
        with resolved.open("rb") as handle:
            for block in iter(lambda: handle.read(128 * 1024), b""):
                sha256_digest.update(block)
                md5_digest.update(block)
        after = resolved.stat()
        if (
            before.st_dev,
            before.st_ino,
            before.st_size,
            before.st_mtime_ns,
        ) != (
            after.st_dev,
            after.st_ino,
            after.st_size,
            after.st_mtime_ns,
        ):
            raise GraphMemoryPolicyError("graph source file changed during hashing")
        if md5_digest.hexdigest() != ast_hash:
            raise GraphMemoryPolicyError("indexed source content drift detected")
        return "sha256:" + sha256_digest.hexdigest()

    @staticmethod
    def _score(haystack: str, terms: tuple[str, ...]) -> int:
        lowered = haystack.lower()
        return sum(lowered.count(term) for term in terms)

    def context_candidates(self, arguments: dict[str, Any]) -> list[dict[str, Any]]:
        """Return bounded structured candidates without using Graphify query logs."""

        query = self._text(arguments.get("query"), name="query", limit=256)
        if secret_kinds({"query": query}):
            raise GraphMemoryPolicyError("context query failed secret policy")
        query = redact_text(query)
        terms = tuple(
            dict.fromkeys(
                token.lower()
                for token in _TOKEN_PATTERN.findall(query)
                if len(token) >= 2
            )
        )
        if not terms:
            raise GraphMemoryPolicyError("context query has no searchable terms")
        limit = self._integer(
            arguments.get("limit"),
            name="limit",
            default=8,
            minimum=1,
            maximum=16,
        )
        include_ambiguous = arguments.get("include_ambiguous", False)
        if not isinstance(include_ambiguous, bool):
            raise GraphMemoryPolicyError("include_ambiguous must be a boolean")

        scored: list[tuple[int, str, dict[str, Any]]] = []
        source_digests: dict[str, str] = {}

        def source_digest(relative_path: str) -> str:
            digest = source_digests.get(relative_path)
            if digest is None:
                digest = self._source_file_sha256(relative_path)
                source_digests[relative_path] = digest
            return digest

        for node_id, data in self.graph.nodes(data=True):
            confidence = self._confidence(data.get("confidence"))
            if confidence == "AMBIGUOUS" and not include_ambiguous:
                continue
            label = redact_text(str(data.get("label", node_id)))
            source_path = self._source_path(data.get("source_file"))
            if source_path is None:
                continue
            if self._source_is_graphify_ignored(source_path):
                continue
            source_file_sha256 = source_digest(source_path)
            source_location = self._source_location(data.get("source_location"))
            file_type = redact_text(str(data.get("file_type", "")))
            safe_node_id = redact_text(str(node_id))
            record = {
                "graph_confidence": confidence,
                "file_type": file_type,
                "kind": "node",
                "label": label,
                "node_id": safe_node_id,
                "relative_path": source_path,
                "source_file_sha256": source_file_sha256,
                "source_location": source_location,
            }
            if secret_kinds(record):
                raise GraphMemoryPolicyError("graph context failed secret policy")
            score = self._score(
                "\n".join(
                    value
                    for value in (
                        label,
                        safe_node_id,
                        source_path or "",
                        source_location or "",
                        file_type,
                    )
                    if value
                ),
                terms,
            )
            if score:
                text = json.dumps(
                    record,
                    ensure_ascii=False,
                    sort_keys=True,
                    separators=(",", ":"),
                )
                scored.append(
                    (
                        score,
                        f"node:{safe_node_id}",
                        {
                            "graph_confidence": confidence,
                            "evidence_class": _EVIDENCE_BY_CONFIDENCE[confidence],
                            "node_id": safe_node_id,
                            "relative_path": source_path,
                            "source_file_sha256": source_file_sha256,
                            "text": text,
                        },
                    )
                )

        for source_id, target_id, data in self.graph.edges(data=True):
            confidence = self._confidence(data.get("confidence"))
            if confidence == "AMBIGUOUS" and not include_ambiguous:
                continue
            source_node = self.graph.nodes[source_id]
            target_node = self.graph.nodes[target_id]
            safe_source_id = redact_text(str(source_id))
            safe_target_id = redact_text(str(target_id))
            source_label = redact_text(str(source_node.get("label", source_id)))
            target_label = redact_text(str(target_node.get("label", target_id)))
            relation = redact_text(str(data.get("relation", "related")))
            source_path = self._source_path(
                data.get("source_file") or source_node.get("source_file")
            )
            if source_path is None:
                continue
            if self._source_is_graphify_ignored(source_path):
                continue
            source_file_sha256 = source_digest(source_path)
            source_location = self._source_location(
                data.get("source_location") or source_node.get("source_location")
            )
            record = {
                "graph_confidence": confidence,
                "kind": "edge",
                "relative_path": source_path,
                "relation": relation,
                "source_label": source_label,
                "source_file_sha256": source_file_sha256,
                "source_location": source_location,
                "source_node_id": safe_source_id,
                "target_label": target_label,
                "target_node_id": safe_target_id,
            }
            if secret_kinds(record):
                raise GraphMemoryPolicyError("graph context failed secret policy")
            score = self._score(
                "\n".join(
                    value
                    for value in (
                        source_label,
                        target_label,
                        safe_source_id,
                        safe_target_id,
                        relation,
                        source_path or "",
                        source_location or "",
                    )
                    if value
                ),
                terms,
            )
            if score:
                text = json.dumps(
                    record,
                    ensure_ascii=False,
                    sort_keys=True,
                    separators=(",", ":"),
                )
                scored.append(
                    (
                        score,
                        f"edge:{safe_source_id}:{safe_target_id}:{relation}",
                        {
                            "graph_confidence": confidence,
                            "evidence_class": _EVIDENCE_BY_CONFIDENCE[confidence],
                            "node_id": safe_source_id,
                            "relative_path": source_path,
                            "relation": relation,
                            "source_file_sha256": source_file_sha256,
                            "text": text,
                        },
                    )
                )

        scored.sort(key=lambda item: (-item[0], item[1]))
        return [record for _, _, record in scored[:limit]]

    def shortest_path(self, arguments: dict[str, Any]) -> str:
        source = self._text(arguments.get("source"), name="source", limit=256)
        target = self._text(arguments.get("target"), name="target", limit=256)
        max_hops = self._integer(
            arguments.get("max_hops"),
            name="max_hops",
            default=8,
            minimum=1,
            maximum=20,
        )
        source_scored = _score_nodes(
            self.graph, [term.lower() for term in source.split()]
        )
        target_scored = _score_nodes(
            self.graph, [term.lower() for term in target.split()]
        )
        if not source_scored:
            return f"No node matching source '{self._safe_human_text(source)}' found."
        if not target_scored:
            return f"No node matching target '{self._safe_human_text(target)}' found."
        source_id = _pick_scored_endpoint(self.graph, source_scored, source)
        target_id = _pick_scored_endpoint(self.graph, target_scored, target)
        if source_id == target_id:
            return "Source and target resolved to the same node."
        undirected = nx.Graph()
        undirected.add_nodes_from(sorted(self.graph.nodes))
        undirected.add_edges_from(
            sorted(
                (min(left, right), max(left, right)) for left, right in self.graph.edges
            )
        )
        try:
            path = nx.shortest_path(undirected, source_id, target_id)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return "No path found."
        hops = len(path) - 1
        if hops > max_hops:
            return f"Path exceeds max_hops={max_hops} ({hops} hops found)."
        labels = [
            self._safe_human_text(self.graph.nodes[node].get("label", node))
            for node in path
        ]
        return f"Shortest path ({hops} hops):\n  " + " -> ".join(labels)
