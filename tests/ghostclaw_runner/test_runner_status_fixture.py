#!/usr/bin/env python3
"""Tests for exporting A2A2A runner status to Mission Control."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.a2a import a2a_export_runner_status_fixture
from scripts.a2a import a2a_dependency_readiness
from scripts.a2a import a2a_codex_build_plan
from scripts.a2a import a2a_implementation_lane_packet
from scripts.a2a import a2a_runner_dispatch_command
from scripts.a2a import a2a_worker_report_digest


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
            (runtime / "logs").mkdir(parents=True)
            (runtime / "logs" / "runner-summary.json").write_text(
                json.dumps(
                    {
                        "created_at": "2026-06-27T00:01:00+00:00",
                        "mode": "dry-run",
                        "watch": True,
                        "cycles": 2,
                        "processed": 1,
                        "provider_call_allowed": False,
                        "roles_checked": ["opus"],
                    }
                ),
                encoding="utf-8",
            )
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
            self.assertTrue(fixture["lastRunnerSummary"]["watch"])
            self.assertEqual(fixture["lastRunnerSummary"]["cycles"], 2)

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

    def test_codex_build_plan_consumes_first_ready_queue_item(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-codex-plan-") as tmp:
            runtime = Path(tmp) / "runtime"
            readiness_path = Path(tmp) / "readiness.json"
            fixture_path = Path(tmp) / "codex-plan.json"
            readiness_path.write_text(
                json.dumps(
                    {
                        "codexBuildQueue": [
                            {
                                "queueId": "CODEX-BUILD-A2A2A-TEST",
                                "taskId": "A2A2A-TEST",
                                "sourceResultPath": "/tmp/source.result.json",
                                "summary": "safe handoff",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            exit_code = a2a_codex_build_plan.main(
                [
                    "--readiness-path",
                    str(readiness_path),
                    "--fixture-path",
                    str(fixture_path),
                    "--runtime-root",
                    str(runtime),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["status"], "ready_for_codex_review")
            self.assertFalse(fixture["plan"]["executionAllowed"])
            self.assertEqual(fixture["plan"]["sourceQueueId"], "CODEX-BUILD-A2A2A-TEST")
            self.assertTrue(Path(fixture["planPath"]).exists())

    def test_worker_report_digest_summarizes_report_only_results(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-worker-digest-") as tmp:
            runtime = Path(tmp) / "runtime"
            outbox = runtime / "outbox" / "glm52"
            outbox.mkdir(parents=True)
            result = {
                "created_at": "2026-06-27T00:00:00+00:00",
                "status": "dry_run_completed",
                "provider_call": False,
                "role": "glm52",
                "model": "zai/glm-5.2",
                "prompt_sha256": "abc123",
                "task": {
                    "task_id": "A2A2A-WORKER-REPORT",
                    "goal_preview": "Review without reading SECRET_TOKEN=abc123",
                    "context_refs": ["/tmp/codex-plan.json"],
                },
                "output": {
                    "summary": "report ready",
                    "planned_actions": ["return patch proposal only"],
                    "handoff": {
                        "next_owner": "codex",
                        "safe_to_dispatch_locally": True,
                        "requires_human_review": False,
                    },
                },
            }
            (outbox / "A2A2A-WORKER-REPORT.result.json").write_text(json.dumps(result), encoding="utf-8")
            fixture_path = Path(tmp) / "worker-digest.json"

            exit_code = a2a_worker_report_digest.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--fixture-path",
                    str(fixture_path),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["summary"]["reports"], 1)
            self.assertEqual(fixture["summary"]["workerReports"], 1)
            self.assertEqual(fixture["summary"]["providerCalls"], 0)
            self.assertEqual(fixture["summary"]["overallStatus"], "ready_worker_reports")
            self.assertIn("no_command_execution", fixture["policyBoundary"])
            self.assertIn("SECRET_TOKEN=<masked>", fixture["reports"][0]["goalPreview"])
            self.assertEqual(fixture["reports"][0]["nextOwner"], "codex")

    def test_implementation_lane_packet_requires_plan_and_worker_reports(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-implementation-packet-") as tmp:
            runtime = Path(tmp) / "runtime"
            plan_path = Path(tmp) / "plan.json"
            digest_path = Path(tmp) / "digest.json"
            fixture_path = Path(tmp) / "implementation-packet.json"
            plan_path.write_text(
                json.dumps(
                    {
                        "plan": {
                            "planId": "CODEX-PLAN-TEST",
                            "sourceTaskId": "A2A2A-OPUS-TEST",
                            "objective": "Implement a scoped A2A2A lane.",
                            "scope": {
                                "allowedPaths": ["scripts/a2a/", "apps/mission-control/src/App.tsx"],
                                "blockedPaths": [".env", "apps/web-sirinx/dist/"],
                            },
                            "validationCommands": ["python3 -m unittest tests.ghostclaw_runner.test_agent_runner"],
                        }
                    }
                ),
                encoding="utf-8",
            )
            digest_path.write_text(
                json.dumps(
                    {
                        "summary": {"providerCalls": 0},
                        "reports": [
                            {
                                "role": "glm52",
                                "taskId": "GLM",
                                "status": "dry_run_completed",
                                "model": "zai/glm-5.2",
                                "providerCall": False,
                                "safeToDispatchLocally": True,
                                "requiresHumanReview": False,
                                "nextOwner": "codex",
                                "summary": "structure report",
                                "plannedActions": ["return patch proposal only"],
                            },
                            {
                                "role": "deepseek",
                                "taskId": "DEEPSEEK",
                                "status": "dry_run_completed",
                                "model": "deepseek/deepseek-v4-pro",
                                "providerCall": False,
                                "safeToDispatchLocally": True,
                                "requiresHumanReview": False,
                                "nextOwner": "codex",
                                "summary": "risk report",
                                "plannedActions": ["return worker report only"],
                            },
                            {
                                "role": "kob",
                                "taskId": "KOB",
                                "status": "dry_run_completed",
                                "model": "kob/local-validator",
                                "providerCall": False,
                                "safeToDispatchLocally": True,
                                "requiresHumanReview": False,
                                "nextOwner": "hermes",
                                "summary": "validation report",
                                "plannedActions": ["return no-execution audit record"],
                            },
                        ],
                    }
                ),
                encoding="utf-8",
            )

            exit_code = a2a_implementation_lane_packet.main(
                [
                    "--build-plan-path",
                    str(plan_path),
                    "--worker-digest-path",
                    str(digest_path),
                    "--fixture-path",
                    str(fixture_path),
                    "--runtime-root",
                    str(runtime),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["summary"]["status"], "ready_for_codex_scoped_implementation_review")
            self.assertEqual(fixture["summary"]["workerEvidence"], 3)
            self.assertFalse(fixture["summary"]["executionAllowed"])
            self.assertIn("git_add_dot", fixture["packet"]["blockedActions"])
            self.assertNotIn(".", fixture["packet"]["scopedStageCommand"])
            self.assertTrue(Path(fixture["packetPath"]).exists())


if __name__ == "__main__":
    unittest.main()
