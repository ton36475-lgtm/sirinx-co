"""Exact Graphify code-only launcher with an isolated child environment."""

from __future__ import annotations

import hashlib
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from .context_contract import (
    APPROVED_BASE_SHA,
    CodeGraphSnapshotV1,
    build_code_graph_snapshot,
)
from .errors import GraphMemoryPolicyError
from .offline_policy import PROVIDER_AND_TELEMETRY_KEYS, scrubbed_environment
from .paths import (
    GRAPH_MEMORY_ROOT,
    PROJECT_ROOT,
    ensure_runtime_root,
    graph_path,
    isolated_home,
)

PROVIDER_ENV_KEYS = PROVIDER_AND_TELEMETRY_KEYS
MAX_GRAPH_BYTES = 128 * 1024 * 1024
MAX_GRAPH_MANIFEST_BYTES = 4 * 1024 * 1024


@dataclass(frozen=True)
class GraphifyInvocation:
    command: tuple[str, ...]
    cwd: Path
    env: dict[str, str]


def _sha256_fixed_artifact(path: Path, *, name: str, max_bytes: int) -> str:
    if path.is_symlink() or not path.is_file():
        raise GraphMemoryPolicyError(f"fixed {name} artifact is unavailable")
    before = path.stat()
    if before.st_size > max_bytes:
        raise GraphMemoryPolicyError(f"fixed {name} artifact exceeds read policy")
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(128 * 1024), b""):
            digest.update(block)
    after = path.stat()
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
        raise GraphMemoryPolicyError(f"fixed {name} artifact changed during hashing")
    return "sha256:" + digest.hexdigest()


def fixed_code_graph_snapshot(
    *, base_sha: str = APPROVED_BASE_SHA
) -> CodeGraphSnapshotV1:
    """Hash the two fixed Graphify artifacts and bind them to one base SHA."""

    graph = graph_path()
    manifest = graph.with_name("manifest.json")
    return build_code_graph_snapshot(
        base_sha=base_sha,
        graph_sha256=_sha256_fixed_artifact(
            graph,
            name="code graph",
            max_bytes=MAX_GRAPH_BYTES,
        ),
        graph_manifest_sha256=_sha256_fixed_artifact(
            manifest,
            name="Graphify manifest",
            max_bytes=MAX_GRAPH_MANIFEST_BYTES,
        ),
    )


def build_invocation() -> GraphifyInvocation:
    runtime = ensure_runtime_root()
    home = isolated_home()
    home.mkdir(parents=True, exist_ok=True, mode=0o700)
    (home / "config").mkdir(exist_ok=True, mode=0o700)
    (home / "cache").mkdir(exist_ok=True, mode=0o700)

    guard_dir = GRAPH_MEMORY_ROOT / "runtime_guard"
    command = [
        sys.executable,
        "-m",
        "graphify",
        "extract",
        str(PROJECT_ROOT),
        "--code-only",
        "--no-cluster",
        "--out",
        str(runtime),
        "--max-workers",
        "4",
        "--force",
    ]

    env = scrubbed_environment(
        {
            key: value
            for key, value in os.environ.items()
            if key not in {"PYTHONPATH", "HOME"}
        }
    )
    env.update(
        {
            "HOME": str(home),
            "XDG_CONFIG_HOME": str(home / "config"),
            "XDG_CACHE_HOME": str(home / "cache"),
            "GIT_CONFIG_GLOBAL": os.devnull,
            "GIT_CONFIG_NOSYSTEM": "1",
            "GRAPHIFY_OUT": str(runtime / "graphify-out"),
            "GRAPHIFY_QUERY_LOG_DISABLE": "1",
            "SIRINX_NETWORK_GUARD": "1",
            "PYTHONPATH": str(guard_dir),
        }
    )
    if PROVIDER_ENV_KEYS.intersection(env):
        raise GraphMemoryPolicyError("provider variables escaped environment scrub")
    # Run from the project-owned runtime directory. Some upstream helpers use
    # cwd-relative caches even when --out is absolute; this prevents those
    # helpers from creating PROJECT_ROOT/graphify-out.
    return GraphifyInvocation(tuple(command), runtime, env)


def build_code_graph(*, timeout_seconds: int = 900) -> dict:
    if timeout_seconds < 1 or timeout_seconds > 1800:
        raise GraphMemoryPolicyError("graph build timeout must be 1-1800 seconds")
    invocation = build_invocation()
    try:
        completed = subprocess.run(
            invocation.command,
            cwd=invocation.cwd,
            env=invocation.env,
            check=False,
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
    except subprocess.TimeoutExpired:
        raise GraphMemoryPolicyError("code-only graph build timed out") from None
    except OSError:
        raise GraphMemoryPolicyError("code-only graph build could not start") from None
    if completed.returncode != 0:
        raise GraphMemoryPolicyError(
            f"code-only graph build failed with exit code {completed.returncode}"
        )
    output = graph_path()
    if not output.is_file():
        raise GraphMemoryPolicyError(
            "Graphify completed without the fixed graph output"
        )
    manifest = output.with_name("manifest.json")
    if not manifest.is_file():
        raise GraphMemoryPolicyError(
            "Graphify completed without the fixed manifest output"
        )
    output.chmod(0o600)
    manifest.chmod(0o600)
    snapshot = fixed_code_graph_snapshot()
    return {
        "status": "CODE_GRAPH_READY",
        "base_sha": snapshot.base_sha,
        "graph_sha256": snapshot.graph_sha256,
        "graph_manifest_sha256": snapshot.graph_manifest_sha256,
        "graph_snapshot_digest": snapshot.graph_snapshot_digest,
        "provider_calls": 0,
        "external_calls": 0,
        "transport": "local_file",
        "graph": str(output.relative_to(PROJECT_ROOT)),
        "exit_code": completed.returncode,
        "stdout_bytes": len(completed.stdout.encode("utf-8")),
        "stderr_bytes": len(completed.stderr.encode("utf-8")),
        "stdout_sha256": (
            "sha256:" + hashlib.sha256(completed.stdout.encode("utf-8")).hexdigest()
        ),
        "stderr_sha256": (
            "sha256:" + hashlib.sha256(completed.stderr.encode("utf-8")).hexdigest()
        ),
    }
