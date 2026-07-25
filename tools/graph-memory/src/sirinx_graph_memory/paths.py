"""Fixed-root path policy.

No agent-facing command accepts an arbitrary graph, runtime, or repository
path. A test-only environment override is still containment-checked beneath
the project-owned graph-memory directory.
"""

from __future__ import annotations

import os
from pathlib import Path

from .errors import GraphMemoryPolicyError

GRAPH_MEMORY_ROOT = Path(__file__).resolve().parents[2]
PROJECT_ROOT = GRAPH_MEMORY_ROOT.parents[1]
DEFAULT_RUNTIME_ROOT = GRAPH_MEMORY_ROOT / ".runtime"
RUNTIME_ENV = "SIRINX_GRAPH_MEMORY_RUNTIME_DIR"


def _is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def runtime_root() -> Path:
    candidate = Path(os.environ.get(RUNTIME_ENV, DEFAULT_RUNTIME_ROOT))
    resolved = candidate.expanduser().resolve(strict=False)
    root = GRAPH_MEMORY_ROOT.resolve()
    if not _is_relative_to(resolved, root):
        raise GraphMemoryPolicyError(
            "runtime directory must remain inside tools/graph-memory"
        )
    if resolved == root:
        raise GraphMemoryPolicyError("runtime directory cannot be the tool root")
    return resolved


def graph_path() -> Path:
    return runtime_root() / "graphify-out" / "graph.json"


def queue_path() -> Path:
    return runtime_root() / "proposals.jsonl"


def checkpoint_path() -> Path:
    return runtime_root() / "proposal-checkpoints.sqlite"


def isolated_home() -> Path:
    return runtime_root() / "isolated-home"


def assert_fixed_graph_path(candidate: Path) -> Path:
    resolved = candidate.expanduser().resolve(strict=False)
    expected = graph_path().resolve(strict=False)
    if resolved != expected:
        raise GraphMemoryPolicyError("only the fixed project graph is permitted")
    if resolved.suffix != ".json":
        raise GraphMemoryPolicyError("graph path must be a JSON file")
    return resolved


def ensure_runtime_root() -> Path:
    root = runtime_root()
    if root.exists() and root.is_symlink():
        raise GraphMemoryPolicyError("runtime directory cannot be a symlink")
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    root.chmod(0o700)
    return root
