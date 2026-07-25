from __future__ import annotations

import json
import shutil
import tempfile
from collections.abc import Iterator
from pathlib import Path

import pytest

from sirinx_graph_memory.paths import GRAPH_MEMORY_ROOT, RUNTIME_ENV


@pytest.fixture
def isolated_runtime(monkeypatch: pytest.MonkeyPatch) -> Iterator[Path]:
    root = Path(tempfile.mkdtemp(prefix=".runtime-test-", dir=GRAPH_MEMORY_ROOT))
    monkeypatch.setenv(RUNTIME_ENV, str(root))
    yield root
    shutil.rmtree(root, ignore_errors=True)


@pytest.fixture
def sample_graph(isolated_runtime: Path) -> Path:
    path = isolated_runtime / "graphify-out" / "graph.json"
    path.parent.mkdir(parents=True)
    path.write_text(
        json.dumps(
            {
                "directed": True,
                "multigraph": False,
                "graph": {},
                "nodes": [
                    {
                        "id": "src/a.py::alpha",
                        "label": "alpha",
                        "source_file": "src/a.py",
                        "file_type": "function",
                        "community": 0,
                    },
                    {
                        "id": "src/b.py::beta",
                        "label": "beta",
                        "source_file": "src/b.py",
                        "file_type": "function",
                        "community": 0,
                    },
                ],
                "links": [
                    {
                        "source": "src/a.py::alpha",
                        "target": "src/b.py::beta",
                        "relation": "calls",
                        "confidence": "EXTRACTED",
                    }
                ],
            },
            sort_keys=True,
        ),
        encoding="utf-8",
    )
    return path
