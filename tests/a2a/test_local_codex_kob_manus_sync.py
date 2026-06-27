#!/usr/bin/env python3
"""Local smoke tests for KOB planner, Codex local executor, and Manus artifact A2A sync."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


class LocalCodexKobManusA2ATest(unittest.TestCase):
    def run_script(self, runtime_root: Path, *args: str) -> subprocess.CompletedProcess[str]:
        env = os.environ.copy()
        env["A2A_RUNTIME_ROOT"] = str(runtime_root)
        env["PYTHONPATH"] = str(REPO_ROOT / "scripts" / "a2a")
        return subprocess.run(
            [sys.executable, *args],
            cwd=REPO_ROOT,
            env=env,
            text=True,
            capture_output=True,
            check=True,
        )

    def test_local_kob_codex_manus_file_queue(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-a2a-test-") as tmp:
            runtime_root = Path(tmp)
            source_html = runtime_root / "SPEC_DRIVING.html"
            source_html.write_text(
                "<!doctype html><title>Ghostclaw Spec</title><main>local smoke</main>",
                encoding="utf-8",
            )

            self.run_script(runtime_root, "scripts/a2a/a2a_init_runtime.py")
            self.run_script(
                runtime_root,
                "scripts/a2a/a2a_kob_adapter.py",
                "--model",
                "opus-5",
                "--prompt",
                "Plan a local Codex review. Do not call providers.",
            )
            self.run_script(
                runtime_root,
                "scripts/a2a/a2a_codex_adapter.py",
                "--model",
                "codex-local",
                "--goal",
                "Review Manus artifact metadata locally.",
            )
            self.run_script(
                runtime_root,
                "scripts/a2a/a2a_manus_adapter.py",
                "--title",
                "GHOSTCLAW SPEC_DRIVING.html",
                "--kind",
                "interactive_html_spec",
                "--source-path",
                str(source_html),
                "--summary",
                "Manus exported an interactive HTML spec for local Codex review.",
                "--next-action",
                "Codex reviews the hash-backed artifact and prepares scoped docs tasks.",
            )
            self.run_script(runtime_root, "scripts/a2a/a2a_dispatch.py", "--once", "--dry-run")
            self.run_script(runtime_root, "scripts/a2a/a2a_collect_artifacts.py")
            self.run_script(runtime_root, "scripts/a2a/a2a_daily_summary.py")

            completed = sorted((runtime_root / "completed").glob("*manus-artifact-review.json"))
            self.assertEqual(len(completed), 1)
            task = json.loads(completed[0].read_text(encoding="utf-8"))
            self.assertEqual(task["from_agent"], "manus")
            self.assertEqual(task["model_route"]["executor"], "codex-local")
            self.assertEqual(task["status"]["state"], "completed")

            metadata_path = Path(task["artifacts"][0]["path"])
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
            self.assertTrue(metadata["source_exists"])
            self.assertEqual(metadata["source_size_bytes"], source_html.stat().st_size)
            self.assertEqual(len(metadata["source_sha256"]), 64)
            self.assertNotIn("<main>local smoke</main>", completed[0].read_text(encoding="utf-8"))

            artifacts = json.loads((runtime_root / "state" / "artifact_manifest.json").read_text(encoding="utf-8"))
            self.assertGreaterEqual(artifacts["artifact_count"], 3)
            self.assertTrue((runtime_root / "memory" / "daily_summary.md").exists())


if __name__ == "__main__":
    unittest.main()
