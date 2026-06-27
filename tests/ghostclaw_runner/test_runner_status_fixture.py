#!/usr/bin/env python3
"""Tests for exporting A2A2A runner status to Mission Control."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.a2a import a2a_export_runner_status_fixture
from scripts.a2a import a2a_dependency_readiness
from scripts.a2a import a2a_runner_dispatch_command


class A2A2ARunnerStatusFixtureTest(unittest.TestCase):
    def test_exporter_summarizes_outbox_without_provider_calls(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-runner-fixture-") as tmp:
            runtime = Path(tmp) / "runtime"
            outbox = runtime / "outbox" / "opus"
            outbox.mkdir(parents=True)
            result = {
                "created_at": "2026-06-27T00:00:00+00:00",
                "status": "dry_run_completed",
                "provider_call": False,
                "role": "opus",
                "model": "anthropic/claude-opus-4.8",
                "prompt_source": "ghostclaw_runner/prompts/opus.md",
                "task": {"task_id": "A2A2A-TEST"},
                "output": {
                    "summary": "local handoff",
                    "handoff": {"next_owner": "codex", "safe_to_dispatch_locally": True},
                },
            }
            (outbox / "A2A2A-TEST.result.json").write_text(json.dumps(result), encoding="utf-8")
            fixture_path = Path(tmp) / "fixture.json"

            exit_code = a2a_export_runner_status_fixture.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--fixture-path",
                    str(fixture_path),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["summary"]["outbox"], 1)
            self.assertEqual(fixture["summary"]["providerCalls"], 0)
            self.assertEqual(fixture["summary"]["overallStatus"], "ready_local_runner")
            self.assertEqual(fixture["latestResults"][0]["nextOwner"], "codex")
            self.assertIn("no_provider_call_by_default", fixture["policyBoundary"])

    def test_dispatch_command_writes_envelope_and_can_run_once(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-runner-dispatch-") as tmp:
            runtime = Path(tmp) / "runtime"
            fixture_path = Path(tmp) / "fixture.json"

            exit_code = a2a_runner_dispatch_command.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--fixture-path",
                    str(fixture_path),
                    "--role",
                    "kob",
                    "--goal",
                    "Validate the local runner dispatch command.",
                    "--context-ref",
                    "unit-test",
                    "--task-id",
                    "A2A2A-DISPATCH-TEST",
                    "--run-once",
                ]
            )

            self.assertEqual(exit_code, 0)
            self.assertTrue((runtime / "tasks" / "completed" / "kob" / "A2A2A-DISPATCH-TEST.json").exists())
            result_path = runtime / "outbox" / "kob" / "A2A2A-DISPATCH-TEST.result.json"
            self.assertTrue(result_path.exists())
            result = json.loads(result_path.read_text(encoding="utf-8"))
            self.assertFalse(result["provider_call"])
            self.assertTrue(fixture_path.exists())
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["summary"]["completed"], 1)
            self.assertEqual(fixture["summary"]["providerCalls"], 0)

    def test_dependency_readiness_builds_codex_queue_from_opus_handoff(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-readiness-") as tmp:
            runtime = Path(tmp) / "runtime"
            outbox = runtime / "outbox" / "opus"
            outbox.mkdir(parents=True)
            result = {
                "created_at": "2026-06-27T00:00:00+00:00",
                "status": "dry_run_completed",
                "provider_call": False,
                "role": "opus",
                "task": {
                    "task_id": "A2A2A-OPUS-HANDOFF",
                    "raw_from_agent": "hermes",
                },
                "output": {
                    "summary": "architecture handoff ready",
                    "handoff": {"next_owner": "codex", "safe_to_dispatch_locally": True},
                },
            }
            (outbox / "A2A2A-OPUS-HANDOFF.result.json").write_text(json.dumps(result), encoding="utf-8")
            fixture_path = Path(tmp) / "readiness.json"

            exit_code = a2a_dependency_readiness.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--fixture-path",
                    str(fixture_path),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["summary"]["overallStatus"], "ready_for_scoped_codex_plan")
            self.assertEqual(fixture["summary"]["codexQueueItems"], 1)
            self.assertEqual(fixture["codexBuildQueue"][0]["targetOwner"], "codex")
            self.assertFalse(fixture["codexBuildQueue"][0]["executionAllowed"])


if __name__ == "__main__":
    unittest.main()
