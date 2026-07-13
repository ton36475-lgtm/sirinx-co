from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "a2a" / "a2a_obsidian_sync.py"


class ObsidianSyncCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.vault = self.root / "vault"
        self.vault.mkdir()
        self.digest = self.vault / "AI HQ Knowledge Digest.md"
        self.digest.write_text("# Digest\n", encoding="utf-8")
        self.runtime = self.root / "runtime" / "memory" / "obsidian_sync.jsonl"
        self.config = self.root / "obsidian-brain-sync.json"
        self.write_config()

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def write_config(self, **overrides: object) -> None:
        data: dict[str, object] = {
            "version": "ghostclaw-obsidian-brain-sync-v1",
            "worker": "codex",
            "mode": "local-first",
            "vault_root": str(self.vault),
            "digest_note": str(self.digest),
            "runtime_jsonl": str(self.runtime),
            "may_write_digest": True,
        }
        data.update(overrides)
        self.config.write_text(json.dumps(data), encoding="utf-8")

    def run_cli(self, *args: str) -> subprocess.CompletedProcess[str]:
        env = os.environ.copy()
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--config", str(self.config), *args],
            cwd=REPO_ROOT,
            env=env,
            text=True,
            capture_output=True,
            check=False,
        )

    @staticmethod
    def pulse_args() -> list[str]:
        return [
            "--title",
            "Scoped validation",
            "--summary",
            "Focused tests passed.",
            "--source",
            "/tmp/evidence.json",
            "--next-action",
            "Review the scoped diff.",
        ]

    def test_check_reports_ready_without_writes(self) -> None:
        result = self.run_cli("--check")
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["status"], "ready")
        self.assertFalse(payload["provider_call"])
        self.assertFalse(payload["secret_access"])
        self.assertFalse(self.runtime.exists())

    def test_dry_run_has_no_side_effects(self) -> None:
        before = self.digest.read_text(encoding="utf-8")
        result = self.run_cli(*self.pulse_args(), "--dry-run")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Scoped validation", result.stdout)
        self.assertEqual(self.digest.read_text(encoding="utf-8"), before)
        self.assertFalse(self.runtime.exists())

    def test_write_appends_digest_and_receipts(self) -> None:
        result = self.run_cli(*self.pulse_args())
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("appended", result.stdout)
        self.assertIn("Scoped validation", self.digest.read_text(encoding="utf-8"))

        events = self.runtime.read_text(encoding="utf-8").splitlines()
        self.assertEqual(len(events), 1)
        event = json.loads(events[0])
        self.assertEqual(event["schema"], "ghostclaw.obsidian-sync-event.v2")
        self.assertEqual(len(event["entry_sha256"]), 64)
        self.assertFalse(event["provider_call"])
        self.assertFalse(event["secret_access"])

        last = json.loads(
            (self.runtime.parent / "obsidian_sync_last.json").read_text(encoding="utf-8")
        )
        self.assertEqual(last["entry_sha256"], event["entry_sha256"])

    def test_secret_like_input_is_blocked_before_write(self) -> None:
        args = self.pulse_args()
        args[3] = "api_key=sk-example-secret-value"
        result = self.run_cli(*args)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("secret-like value", result.stderr)
        self.assertEqual(self.digest.read_text(encoding="utf-8"), "# Digest\n")
        self.assertFalse(self.runtime.exists())

    def test_read_only_worker_may_preview_but_not_write(self) -> None:
        self.write_config(worker="kob", may_write_digest=False)
        preview = self.run_cli(*self.pulse_args(), "--dry-run")
        self.assertEqual(preview.returncode, 0, preview.stderr)

        write = self.run_cli(*self.pulse_args())
        self.assertNotEqual(write.returncode, 0)
        self.assertIn("may not write", write.stderr)
        self.assertEqual(self.digest.read_text(encoding="utf-8"), "# Digest\n")

    def test_digest_must_resolve_inside_vault(self) -> None:
        outside = self.root / "outside.md"
        outside.write_text("# Outside\n", encoding="utf-8")
        self.write_config(digest_note=str(outside))
        result = self.run_cli("--check")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("inside the configured vault", result.stderr)

    def test_multiline_input_is_normalized(self) -> None:
        args = self.pulse_args()
        args[3] = "Focused tests\npassed without secrets."
        result = self.run_cli(*args, "--dry-run")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Focused tests passed without secrets.", result.stdout)


if __name__ == "__main__":
    unittest.main()
