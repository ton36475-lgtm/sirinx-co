#!/usr/bin/env python3
"""Tests for the local GHOSTCLAW agent runner."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from ghostclaw_runner import agent_runner


REPO_ROOT = Path(__file__).resolve().parents[2]


class GhostclawAgentRunnerTest(unittest.TestCase):
    def test_runner_processes_opus_task_without_provider_call(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-runner-test-") as tmp:
            runtime = Path(tmp)
            inbox = runtime / "inbox" / "opus"
            inbox.mkdir(parents=True)
            task_path = inbox / "architecture-task.json"
            task_path.write_text(
                json.dumps(
                    {
                        "task_id": "A2A2A-LOCAL-001",
                        "from_agent": "hermes",
                        "to_agent": "opus",
                        "goal": "Plan the runner bridge without provider calls.",
                        "context_refs": ["local-only"],
                    }
                ),
                encoding="utf-8",
            )

            exit_code = agent_runner.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--repo-root",
                    str(REPO_ROOT),
                    "--agent",
                    "opus",
                    "--once",
                    "--dry-run",
                ]
            )

            self.assertEqual(exit_code, 0)
            result_path = runtime / "outbox" / "opus" / "A2A2A-LOCAL-001.result.json"
            self.assertTrue(result_path.exists())
            result = json.loads(result_path.read_text(encoding="utf-8"))
            self.assertEqual(result["status"], "dry_run_completed")
            self.assertFalse(result["provider_call"])
            self.assertEqual(result["role"], "opus")
            self.assertIn("ghostclaw_runner/prompts/opus.md", result["prompt_source"])
            self.assertTrue((runtime / "tasks" / "completed" / "opus" / "architecture-task.json").exists())
            self.assertTrue((runtime / "logs" / "runner-events.jsonl").exists())

    def test_runner_blocks_when_kill_switch_is_active(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-runner-test-") as tmp:
            runtime = Path(tmp)
            (runtime / "kill_switch").mkdir(parents=True)
            (runtime / "kill_switch" / "STOP_ALL").write_text("stop\n", encoding="utf-8")

            exit_code = agent_runner.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--repo-root",
                    str(REPO_ROOT),
                    "--agent",
                    "kob",
                    "--once",
                    "--dry-run",
                ]
            )

            self.assertEqual(exit_code, 2)
            log_path = runtime / "logs" / "runner-events.jsonl"
            self.assertTrue(log_path.exists())
            self.assertIn("kill_switch_active", log_path.read_text(encoding="utf-8"))

    def test_runner_watch_mode_polls_bounded_cycles_without_provider_call(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-runner-watch-") as tmp:
            runtime = Path(tmp)
            inbox = runtime / "inbox" / "deepseek"
            inbox.mkdir(parents=True)
            (inbox / "risk-task.json").write_text(
                json.dumps(
                    {
                        "task_id": "A2A2A-WATCH-001",
                        "from_agent": "codex",
                        "to_agent": "deepseek",
                        "goal": "Review a bounded watch-mode task.",
                    }
                ),
                encoding="utf-8",
            )

            exit_code = agent_runner.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--repo-root",
                    str(REPO_ROOT),
                    "--agent",
                    "deepseek",
                    "--watch",
                    "--max-cycles",
                    "2",
                    "--poll-interval",
                    "0.1",
                    "--dry-run",
                ]
            )

            self.assertEqual(exit_code, 0)
            result_path = runtime / "outbox" / "deepseek" / "A2A2A-WATCH-001.result.json"
            self.assertTrue(result_path.exists())
            result = json.loads(result_path.read_text(encoding="utf-8"))
            self.assertFalse(result["provider_call"])
            summary = json.loads((runtime / "logs" / "runner-summary.json").read_text(encoding="utf-8"))
            self.assertTrue(summary["watch"])
            self.assertEqual(summary["cycles"], 2)
            self.assertEqual(summary["processed"], 1)

    def test_runner_processes_agy_task_as_report_only_worker(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-runner-agy-") as tmp:
            runtime = Path(tmp)
            inbox = runtime / "inbox" / "agy"
            inbox.mkdir(parents=True)
            (inbox / "ui-scaffold-task.json").write_text(
                json.dumps(
                    {
                        "task_id": "A2A2A-AGY-001",
                        "from_agent": "codex",
                        "to_agent": "agy",
                        "goal": "Review UI scaffolding for the A2A2A Mission Control lane.",
                    }
                ),
                encoding="utf-8",
            )

            exit_code = agent_runner.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--repo-root",
                    str(REPO_ROOT),
                    "--agent",
                    "agy",
                    "--once",
                    "--dry-run",
                ]
            )

            self.assertEqual(exit_code, 0)
            result_path = runtime / "outbox" / "agy" / "A2A2A-AGY-001.result.json"
            self.assertTrue(result_path.exists())
            result = json.loads(result_path.read_text(encoding="utf-8"))
            self.assertEqual(result["role"], "agy")
            self.assertFalse(result["provider_call"])
            self.assertEqual(result["output"]["handoff"]["next_owner"], "codex")
            self.assertIn("ghostclaw_runner/prompts/agy.md", result["prompt_source"])

    def test_provider_call_requires_command_broker_lease(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-runner-provider-block-") as tmp:
            runtime = Path(tmp)
            inbox = runtime / "inbox" / "opus"
            inbox.mkdir(parents=True)
            task_path = inbox / "provider-task.json"
            task_path.write_text(
                json.dumps(
                    {
                        "task_id": "A2A2A-PROVIDER-BLOCK",
                        "from_agent": "hermes",
                        "to_agent": "opus",
                        "goal": "This should not call a provider without a Command Broker lease.",
                    }
                ),
                encoding="utf-8",
            )

            exit_code = agent_runner.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--repo-root",
                    str(REPO_ROOT),
                    "--agent",
                    "opus",
                    "--once",
                    "--execute",
                    "--allow-provider-call",
                ]
            )

            self.assertEqual(exit_code, 2)
            self.assertTrue(task_path.exists())
            self.assertFalse((runtime / "outbox" / "opus" / "A2A2A-PROVIDER-BLOCK.result.json").exists())
            log_path = runtime / "logs" / "runner-events.jsonl"
            self.assertTrue(log_path.exists())
            self.assertIn("missing_provider_lease", log_path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
