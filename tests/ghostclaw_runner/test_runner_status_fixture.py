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
from scripts.a2a import a2a2a_completion_audit
from scripts.a2a import a2a_backlog_priority
from scripts.a2a import a2a_team_assignment_board
from scripts.a2a import a2a_codex_lane_outcome
from scripts.a2a import a2a_implementation_lane_packet
from scripts.a2a import a2a_codex_first_implementation_lane
from scripts.a2a import a2a_scoped_path_guard
from scripts.a2a import a2a_team_work_packets
from scripts.a2a import a2a_team_work_packet_outcome
from scripts.a2a import a2a_team_work_packet_validation
from scripts.a2a import a2a_runner_dispatch_command
from scripts.a2a import a2a_worker_report_digest
from scripts.a2a import a2a_worker_followup_brief
from scripts.a2a import a2a_worker_followup_lane
from scripts.a2a import a2a_handoff_router


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
            self.assertIn("provider_calls_require_command_broker_lease", fixture["policyBoundary"])
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
            self.assertEqual(fixture["codexBuildQueue"][0]["taskPriority"], 50)
            self.assertFalse(fixture["codexBuildQueue"][0]["executionAllowed"])

    def test_dependency_readiness_prioritizes_architecture_handoff_before_smoke(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-readiness-order-") as tmp:
            runtime = Path(tmp) / "runtime"
            outbox = runtime / "outbox" / "opus"
            outbox.mkdir(parents=True)
            for task_id in [
                "A2A2A-RUNNER-SMOKE-001",
                "A2A2A-HERMES-OPUS-NEXT-CODEX-LANE-001",
                "A2A2A-DISPATCH-SMOKE-001",
            ]:
                (outbox / f"{task_id}.result.json").write_text(
                    json.dumps(
                        {
                            "created_at": "2026-06-27T00:00:00+00:00",
                            "status": "dry_run_completed",
                            "provider_call": False,
                            "role": "opus",
                            "task": {
                                "task_id": task_id,
                                "raw_from_agent": "hermes",
                            },
                            "output": {
                                "summary": task_id,
                                "handoff": {"next_owner": "codex", "safe_to_dispatch_locally": True},
                            },
                        }
                    ),
                    encoding="utf-8",
                )
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
            self.assertEqual(
                fixture["summary"]["nextCodexTaskId"],
                "A2A2A-HERMES-OPUS-NEXT-CODEX-LANE-001",
            )
            self.assertEqual(
                fixture["codexBuildQueue"][0]["taskId"],
                "A2A2A-HERMES-OPUS-NEXT-CODEX-LANE-001",
            )
            self.assertEqual(fixture["codexBuildQueue"][0]["taskPriority"], 0)

    def test_handoff_router_registers_codex_queue_and_blocks_provider_results(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-handoff-router-") as tmp:
            runtime = Path(tmp) / "runtime"
            fixture_path = Path(tmp) / "handoffs.json"
            opus_outbox = runtime / "outbox" / "opus"
            kob_outbox = runtime / "outbox" / "kob"
            glm_outbox = runtime / "outbox" / "glm52"
            opus_outbox.mkdir(parents=True)
            kob_outbox.mkdir(parents=True)
            glm_outbox.mkdir(parents=True)
            (opus_outbox / "OPUS.result.json").write_text(
                json.dumps(
                    {
                        "created_at": "2026-06-27T00:00:00+00:00",
                        "status": "dry_run_completed",
                        "provider_call": False,
                        "role": "opus",
                        "task": {
                            "task_id": "OPUS",
                            "goal_preview": "Plan from TOKEN=abc123",
                        },
                        "output": {
                            "summary": "architecture handoff",
                            "handoff": {"next_owner": "codex", "safe_to_dispatch_locally": True},
                        },
                    }
                ),
                encoding="utf-8",
            )
            (kob_outbox / "KOB.result.json").write_text(
                json.dumps(
                    {
                        "created_at": "2026-06-27T00:01:00+00:00",
                        "status": "dry_run_completed",
                        "provider_call": False,
                        "role": "kob",
                        "task": {"task_id": "KOB"},
                        "output": {
                            "summary": "validation handoff",
                            "handoff": {"next_owner": "hermes", "safe_to_dispatch_locally": True},
                        },
                    }
                ),
                encoding="utf-8",
            )
            (glm_outbox / "GLM.result.json").write_text(
                json.dumps(
                    {
                        "created_at": "2026-06-27T00:02:00+00:00",
                        "status": "provider_call_completed",
                        "provider_call": True,
                        "role": "glm52",
                        "task": {"task_id": "GLM"},
                        "output": {
                            "summary": "provider result",
                            "handoff": {"next_owner": "codex", "safe_to_dispatch_locally": True},
                        },
                    }
                ),
                encoding="utf-8",
            )

            exit_code = a2a_handoff_router.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--fixture-path",
                    str(fixture_path),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["summary"]["codexQueueItems"], 1)
            self.assertEqual(fixture["summary"]["nextCodexSourceRole"], "opus")
            self.assertEqual(fixture["summary"]["roleHandoffs"], 1)
            self.assertEqual(fixture["summary"]["blockedHandoffs"], 1)
            self.assertEqual(fixture["summary"]["roleInboxWrites"], 0)
            self.assertFalse(fixture["summary"]["executionAllowed"])
            self.assertTrue(Path(fixture["codexQueue"][0]["queuePath"]).exists())
            self.assertIn("TOKEN=<masked>", fixture["codexQueue"][0]["goalPreview"])
            self.assertEqual(fixture["codexQueue"][0]["queuePriority"], 0)
            self.assertEqual(fixture["codexQueue"][0]["taskPriority"], 50)
            self.assertEqual(fixture["roleHandoffs"][0]["targetOwner"], "hermes")
            self.assertFalse((runtime / "inbox" / "hermes").exists())
            self.assertEqual(
                fixture["blockedHandoffs"][0]["blockedReason"],
                "provider_call_result_requires_review",
            )
            self.assertIn("no_provider_call", fixture["policyBoundary"])

    def test_handoff_router_prioritizes_opus_before_worker_reports_for_codex(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-handoff-order-") as tmp:
            runtime = Path(tmp) / "runtime"
            fixture_path = Path(tmp) / "handoffs.json"
            for role in ["agy", "opus", "glm52"]:
                outbox = runtime / "outbox" / role
                outbox.mkdir(parents=True)
                (outbox / f"{role}.result.json").write_text(
                    json.dumps(
                        {
                            "created_at": "2026-06-27T00:00:00+00:00",
                            "status": "dry_run_completed",
                            "provider_call": False,
                            "role": role,
                            "task": {"task_id": role.upper(), "goal_preview": f"{role} handoff"},
                            "output": {
                                "summary": f"{role} summary",
                                "handoff": {"next_owner": "codex", "safe_to_dispatch_locally": True},
                            },
                        }
                    ),
                    encoding="utf-8",
                )

            exit_code = a2a_handoff_router.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--fixture-path",
                    str(fixture_path),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["summary"]["codexQueueItems"], 3)
            self.assertEqual(fixture["summary"]["nextCodexSourceRole"], "opus")
            self.assertEqual(fixture["codexQueue"][0]["sourceRole"], "opus")
            self.assertEqual([item["sourceRole"] for item in fixture["codexQueue"]], ["opus", "glm52", "agy"])

    def test_handoff_router_prioritizes_opus_architecture_lane_before_smoke(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-handoff-opus-priority-") as tmp:
            runtime = Path(tmp) / "runtime"
            fixture_path = Path(tmp) / "handoffs.json"
            outbox = runtime / "outbox" / "opus"
            outbox.mkdir(parents=True)
            task_ids = [
                "A2A2A-DISPATCH-SMOKE-001",
                "A2A2A-HERMES-OPUS-NEXT-CODEX-LANE-001",
                "A2A2A-RUNNER-SMOKE-001",
            ]
            for task_id in task_ids:
                (outbox / f"{task_id}.result.json").write_text(
                    json.dumps(
                        {
                            "created_at": "2026-06-27T00:00:00+00:00",
                            "status": "dry_run_completed",
                            "provider_call": False,
                            "role": "opus",
                            "task": {"task_id": task_id, "goal_preview": task_id},
                            "output": {
                                "summary": task_id,
                                "handoff": {"next_owner": "codex", "safe_to_dispatch_locally": True},
                            },
                        }
                    ),
                    encoding="utf-8",
                )

            exit_code = a2a_handoff_router.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--fixture-path",
                    str(fixture_path),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(
                fixture["summary"]["nextCodexSourceTaskId"],
                "A2A2A-HERMES-OPUS-NEXT-CODEX-LANE-001",
            )
            self.assertEqual(
                fixture["codexQueue"][0]["sourceTaskId"],
                "A2A2A-HERMES-OPUS-NEXT-CODEX-LANE-001",
            )
            self.assertEqual(fixture["codexQueue"][0]["taskPriority"], 0)

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

    def test_worker_followup_brief_converts_reports_to_codex_lane_input(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-worker-followup-") as tmp:
            runtime = Path(tmp) / "runtime"
            digest_path = Path(tmp) / "digest.json"
            packets_path = Path(tmp) / "packets.json"
            fixture_path = Path(tmp) / "followup.json"
            digest_path.write_text(
                json.dumps(
                    {
                        "summary": {
                            "reports": 4,
                            "workerReports": 3,
                            "kobReports": 1,
                            "providerCalls": 0,
                            "safeReports": 4,
                            "overallStatus": "ready_worker_reports",
                        },
                        "reports": [
                            {
                                "role": "glm52",
                                "taskId": "A2A2A-GLM-REPORT",
                                "status": "dry_run_completed",
                                "nextOwner": "codex",
                                "safeToDispatchLocally": True,
                                "providerCall": False,
                                "summary": "implementation hint",
                                "plannedActions": ["propose patch only"],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )
            packets_path.write_text(
                json.dumps(
                    {
                        "packets": [
                            {
                                "packetId": "WORK-REPORT",
                                "queueId": "LANE-CODEX-LANE-TASK-03",
                                "owner": "glm52_deepseek_agy_kob",
                                "ownerMode": "report_and_validate_only",
                                "status": "ready_for_worker_report",
                                "task": "consume_report_only_feedback",
                                "why": "Worker reports available from: agy, deepseek, glm52, kob.",
                                "acceptance": "No worker commits, provider calls, or command execution are required.",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )

            exit_code = a2a_worker_followup_brief.main(
                [
                    "--runtime-root",
                    str(runtime),
                    "--digest-path",
                    str(digest_path),
                    "--packets-path",
                    str(packets_path),
                    "--fixture-path",
                    str(fixture_path),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["summary"]["status"], "ready_for_codex_followup_brief")
            self.assertTrue(fixture["summary"]["codexMayOpenNextLane"])
            self.assertEqual(fixture["summary"]["providerCalls"], 0)
            self.assertEqual(fixture["sourcePacket"]["task"], "consume_report_only_feedback")
            self.assertEqual(fixture["recommendedCodexFollowup"]["owner"], "codex")
            self.assertIn("scripts/a2a/", fixture["recommendedCodexFollowup"]["allowedPaths"])
            self.assertIn("worker_direct_commit", fixture["recommendedCodexFollowup"]["blockedActions"])
            self.assertIn("worker_reports_are_inputs_not_repo_edits", fixture["policyBoundary"])
            self.assertTrue((runtime / "worker_followup" / "latest.json").exists())

    def test_worker_followup_lane_opens_read_only_codex_lane_from_brief(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-worker-followup-lane-") as tmp:
            runtime = Path(tmp) / "runtime"
            brief_path = Path(tmp) / "brief.json"
            fixture_path = Path(tmp) / "lane.json"
            brief_path.write_text(
                json.dumps(
                    {
                        "summary": {
                            "status": "ready_for_codex_followup_brief",
                            "providerCalls": 0,
                            "codexMayOpenNextLane": True,
                        },
                        "sourcePacket": {
                            "packetId": "WORK-REPORT",
                            "queueId": "LANE-CODEX-LANE-TASK-03",
                        },
                        "recommendedCodexFollowup": {
                            "lane": "LANE_A2A2A_WORKER_FEEDBACK_CONSUMPTION",
                            "task": "consume worker reports and open the next scoped implementation lane",
                            "allowedPaths": ["scripts/a2a/", "apps/mission-control/src/fixtures/"],
                            "blockedActions": ["provider_call_without_command_broker_lease", "git_add_dot"],
                            "validationCommands": ["python3 -m unittest tests.ghostclaw_runner.test_runner_status_fixture"],
                        },
                    }
                ),
                encoding="utf-8",
            )

            exit_code = a2a_worker_followup_lane.main(
                [
                    "--brief-path",
                    str(brief_path),
                    "--runtime-root",
                    str(runtime),
                    "--fixture-path",
                    str(fixture_path),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["summary"]["status"], "open_for_codex_scoped_work")
            self.assertEqual(fixture["summary"]["codexReadyTasks"], 3)
            self.assertFalse(fixture["summary"]["providerCallsAllowed"])
            self.assertFalse(fixture["summary"]["workerDirectEditsAllowed"])
            self.assertFalse(fixture["summary"]["gitAddDotAllowed"])
            self.assertEqual(fixture["lane"]["gitOwner"], "codex")
            self.assertIn("provider_calls_require_command_broker_lease", fixture["policyBoundary"])
            self.assertTrue(Path(fixture["runtimeLanePath"]).exists())

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
                                "role": "agy",
                                "taskId": "AGY",
                                "status": "dry_run_completed",
                                "model": "google/gemini-3.5-flash-high",
                                "providerCall": False,
                                "safeToDispatchLocally": True,
                                "requiresHumanReview": False,
                                "nextOwner": "codex",
                                "summary": "ui scaffold report",
                                "plannedActions": ["return report-only implementation hints"],
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
            self.assertEqual(fixture["summary"]["dependencies"], 6)
            self.assertEqual(fixture["summary"]["workerEvidence"], 4)
            self.assertFalse(fixture["summary"]["executionAllowed"])
            self.assertIn("git_add_dot", fixture["packet"]["blockedActions"])
            self.assertNotIn(".", fixture["packet"]["scopedStageCommand"])
            self.assertTrue(Path(fixture["packetPath"]).exists())

    def test_completion_audit_requires_agy_and_policy_boundaries(self) -> None:
        fixture = {
            "runner": {
                "summary": {"completed": 7, "failed": 0, "providerCalls": 0, "roles": 6},
                "roleCounts": [
                    {"role": "hermes"},
                    {"role": "opus"},
                    {"role": "glm52"},
                    {"role": "deepseek"},
                    {"role": "agy"},
                    {"role": "kob"},
                ],
            },
            "handoff": {
                "summary": {
                    "status": "ready_handoffs_registered",
                    "codexQueueItems": 2,
                    "nextCodexSourceRole": "opus",
                    "nextCodexSourceTaskId": "A2A2A-HERMES-OPUS-NEXT-CODEX-LANE-001",
                    "blockedHandoffs": 0,
                    "providerCalls": 0,
                    "executionAllowed": False,
                }
            },
            "readiness": {
                "summary": {
                    "overallStatus": "ready_for_scoped_codex_plan",
                    "worstDependencyStatus": "ready",
                    "providerCalls": 0,
                }
            },
            "plan": {
                "status": "ready_for_codex_review",
                "plan": {"executionAllowed": False},
            },
            "digest": {
                "summary": {
                    "reports": 4,
                    "workerReports": 3,
                    "kobReports": 1,
                    "safeReports": 4,
                    "providerCalls": 0,
                }
            },
            "packet": {
                "summary": {
                    "status": "ready_for_codex_scoped_implementation_review",
                    "blockedDependencies": 0,
                    "missingDependencies": 0,
                    "executionAllowed": False,
                },
                "packet": {
                    "dependencyGate": [
                        {"id": "agy_worker_report", "status": "ready"},
                    ],
                    "blockedActions": [
                        "git_add_dot",
                        "provider_call",
                        "deploy",
                        "push",
                        "secret_read_or_print",
                    ],
                },
            },
        }

        checks = a2a2a_completion_audit.build_checks(fixture)

        self.assertTrue(all(item["status"] == "pass" for item in checks))
        self.assertIn("agy_dependency", {item["id"] for item in checks})
        self.assertIn("handoff_router", {item["id"] for item in checks})

    def test_first_codex_lane_opens_only_from_ready_packet_and_audit(self) -> None:
        packet_fixture = {
            "summary": {
                "status": "ready_for_codex_scoped_implementation_review",
                "blockedDependencies": 0,
                "missingDependencies": 0,
                "providerCalls": 0,
            },
            "packet": {
                "packetId": "IMPLEMENT-PACKET-TEST",
                "laneId": "LANE-A2A2A-TEST",
                "scope": {
                    "allowedPaths": ["scripts/a2a/"],
                    "blockedPaths": [".env"],
                },
                "priorityWorkItems": [
                    {
                        "priority": 1,
                        "owner": "codex",
                        "task": "inspect_plan_and_worker_digest",
                        "why": "Codex owns git state.",
                        "acceptance": "Scope is explicit.",
                    },
                    {
                        "priority": 2,
                        "owner": "glm52_deepseek_agy_kob",
                        "task": "consume_report_only_feedback",
                        "why": "Workers are inputs only.",
                        "acceptance": "No worker commits.",
                    },
                ],
                "validationCommands": ["python3 -m unittest tests.ghostclaw_runner.test_agent_runner"],
                "scopedStageCommand": ["/usr/bin/git", "add", "scripts/a2a/"],
                "blockedActions": ["git_add_dot", "provider_call"],
                "acceptanceCriteria": ["Mission Control shows lane."],
            },
        }
        audit_fixture = {
            "summary": {
                "overallStatus": "ready_for_first_scoped_codex_lane",
                "failed": 0,
                "providerCalls": 0,
            }
        }
        with tempfile.TemporaryDirectory(prefix="ghostclaw-first-codex-lane-") as tmp:
            runtime = Path(tmp) / "runtime"

            fixture = a2a_codex_first_implementation_lane.build_lane(packet_fixture, audit_fixture, runtime)

            self.assertEqual(fixture["summary"]["status"], "open_for_codex_scoped_work")
            self.assertTrue(fixture["summary"]["codexFileEditsAllowed"])
            self.assertFalse(fixture["summary"]["workerDirectEditsAllowed"])
            self.assertFalse(fixture["summary"]["providerCallsAllowed"])
            self.assertEqual(fixture["summary"]["tasks"], 2)
            self.assertEqual(fixture["summary"]["codexReadyTasks"], 1)
            self.assertIn("no_git_add_dot", fixture["policyBoundary"])
            self.assertTrue(Path(fixture["runtimeLanePath"]).exists())

    def test_backlog_priority_reads_next_actions_without_opening_external_actions(self) -> None:
        with tempfile.TemporaryDirectory(prefix="ghostclaw-backlog-priority-") as tmp:
            next_actions = Path(tmp) / "NEXT_ACTIONS.md"
            runtime = Path(tmp) / "runtime"
            fixture_path = Path(tmp) / "backlog.json"
            next_actions.write_text(
                "\n".join(
                    [
                        "## A2A2A Team Coding Sync",
                        "- [ ] Review the Mission Control implementation packet fixture.",
                        "- [ ] Keep GLM-5.2 workers report-only until provider lane opens.",
                        "## Still Blocked",
                        "- [ ] Deploy / public tunnel / external activation",
                        "## CODEX Execution Pack v1.1",
                        "- [ ] Review TOKEN=abc123 before connector sync.",
                    ]
                )
                + "\n",
                encoding="utf-8",
            )

            exit_code = a2a_backlog_priority.main(
                [
                    "--next-actions",
                    str(next_actions),
                    "--runtime-root",
                    str(runtime),
                    "--fixture-path",
                    str(fixture_path),
                ]
            )

            self.assertEqual(exit_code, 0)
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            self.assertEqual(fixture["summary"]["totalPending"], 4)
            self.assertEqual(fixture["summary"]["p0"], 2)
            self.assertGreaterEqual(fixture["summary"]["blocked"], 2)
            self.assertEqual(fixture["topItems"][0]["owner"], "codex")
            all_text = json.dumps(fixture)
            self.assertIn("TOKEN=<masked>", all_text)
            self.assertNotIn("abc123", all_text)
            self.assertIn("no_provider_call", fixture["policyBoundary"])
            self.assertTrue(Path(fixture["runtimeReportPath"]).exists())

    def test_team_assignment_board_combines_lane_and_backlog_without_execution(self) -> None:
        backlog_fixture = {
            "summary": {"p0": 2, "p1": 1, "blocked": 3},
            "topItems": [
                {
                    "priority": 0,
                    "owner": "codex",
                    "status": "ready_for_review",
                    "line": 10,
                    "section": "A2A2A Team Coding Sync",
                    "task": "Review implementation packet.",
                    "nextAction": "Codex may inspect scoped local edits.",
                },
                {
                    "priority": 1,
                    "owner": "kob",
                    "status": "ready_for_review",
                    "line": 20,
                    "section": "A2A2A Team Coding Sync",
                    "task": "Validate command broker lease boundary.",
                    "nextAction": "KOB remains validate-only.",
                },
            ],
            "blockedGates": [
                {
                    "id": "BLOCKED-001",
                    "priority": 3,
                    "status": "blocked",
                    "owner": "hermes",
                    "line": 30,
                    "section": "Still Blocked",
                    "subsection": "",
                    "task": "Deploy / public tunnel",
                    "blockedReason": "production_or_public_action_blocked",
                    "nextAction": "Keep blocked.",
                }
            ],
        }
        lane_fixture = {
            "summary": {
                "status": "open_for_codex_scoped_work",
                "codexReadyTasks": 2,
                "reportInputTasks": 1,
                "providerCallsAllowed": False,
                "workerDirectEditsAllowed": False,
                "codexFileEditsAllowed": True,
            },
            "lane": {
                "tasks": [
                    {
                        "taskId": "CODEX-LANE-TASK-01",
                        "priority": 1,
                        "owner": "codex",
                        "status": "ready_for_codex",
                        "name": "inspect_plan_and_worker_digest",
                        "why": "Codex owns git state.",
                        "acceptance": "Scope is explicit.",
                    },
                    {
                        "taskId": "CODEX-LANE-TASK-02",
                        "priority": 2,
                        "owner": "glm52_deepseek_agy_kob",
                        "status": "report_input",
                        "name": "consume_report_only_feedback",
                        "why": "Workers are inputs only.",
                        "acceptance": "No worker commits.",
                    },
                    {
                        "taskId": "CODEX-LANE-TASK-03",
                        "priority": 3,
                        "owner": "codex",
                        "status": "ready_for_codex",
                        "name": "implement_only_allowed_paths",
                        "why": "Codex performs scoped repo edits.",
                        "acceptance": "Only listed files change.",
                    },
                ]
            },
        }
        packet_fixture = {
            "summary": {"status": "ready_for_codex_scoped_implementation_review"},
            "packet": {
                "dependencyGate": [
                    {"id": "hermes_commander", "status": "ready", "evidence": "state fixture"},
                    {"id": "agy_worker_report", "status": "ready", "evidence": "report fixture"},
                ]
            },
        }
        with tempfile.TemporaryDirectory(prefix="ghostclaw-team-assignment-") as tmp:
            runtime = Path(tmp) / "runtime"

            fixture = a2a_team_assignment_board.build_assignment(
                backlog_fixture,
                lane_fixture,
                packet_fixture,
                runtime,
            )

            self.assertEqual(fixture["summary"]["status"], "ready_for_codex_assignment")
            self.assertEqual(fixture["nextCodexAction"]["task"], "inspect_plan_and_worker_digest")
            self.assertFalse(fixture["summary"]["providerCallsAllowed"])
            self.assertFalse(fixture["summary"]["workerDirectEditsAllowed"])
            self.assertTrue(fixture["summary"]["codexFileEditsAllowed"])
            self.assertIn("workers_report_only", fixture["policyBoundary"])
            self.assertEqual(len(fixture["roles"]), 8)
            self.assertTrue(Path(fixture["runtimeReportPath"]).exists())

            fixture_after_outcome = a2a_team_assignment_board.build_assignment(
                backlog_fixture,
                lane_fixture,
                packet_fixture,
                runtime,
                {
                    "selectedSlice": {
                        "sourceNextAction": {
                            "task": "inspect_plan_and_worker_digest",
                        }
                    }
                },
            )
            self.assertEqual(fixture_after_outcome["summary"]["completedCodexTasks"], 1)
            self.assertEqual(fixture_after_outcome["nextCodexAction"]["task"], "implement_only_allowed_paths")

    def test_codex_lane_outcome_closes_first_slice_only_when_assignment_ready(self) -> None:
        assignment = {
            "summary": {
                "status": "ready_for_codex_assignment",
                "codexFileEditsAllowed": True,
                "providerCallsAllowed": False,
                "workerDirectEditsAllowed": False,
            },
            "nextCodexAction": {
                "task": "inspect_plan_and_worker_digest",
                "why": "Codex owns repo state.",
                "acceptance": "Scope is explicit.",
            },
        }
        with tempfile.TemporaryDirectory(prefix="ghostclaw-codex-outcome-") as tmp:
            runtime = Path(tmp) / "runtime"

            fixture = a2a_codex_lane_outcome.build_outcome(
                assignment,
                runtime,
                "abc1234 feat(a2a2a): add team assignment board",
            )

            self.assertEqual(fixture["summary"]["status"], "first_codex_slice_completed")
            self.assertEqual(fixture["summary"]["completedChecklistItems"], 7)
            self.assertEqual(fixture["summary"]["providerCalls"], 0)
            self.assertFalse(fixture["summary"]["workerDirectEdits"])
            self.assertIn("workers_report_only", fixture["policyBoundary"])
            self.assertTrue(Path(fixture["runtimeReportPath"]).exists())

    def test_team_work_packets_exports_next_codex_packet_without_provider_calls(self) -> None:
        assignment = {
            "immediateQueue": [
                {
                    "queueId": "LANE-CODEX-LANE-TASK-02",
                    "source": "first_codex_implementation_lane",
                    "priority": 2,
                    "owner": "codex",
                    "status": "ready_for_codex",
                    "task": "implement_only_allowed_paths",
                    "why": "Dirty lanes exist outside A2A2A.",
                    "acceptance": "Scoped git status contains only files listed in the lane packet.",
                },
                {
                    "queueId": "LANE-CODEX-LANE-TASK-03",
                    "source": "first_codex_implementation_lane",
                    "priority": 3,
                    "owner": "glm52_deepseek_agy_kob",
                    "status": "report_input",
                    "task": "consume_report_only_feedback",
                    "why": "Worker reports exist.",
                    "acceptance": "No worker commits, provider calls, or command execution are required.",
                },
            ]
        }
        lane = {
            "lane": {
                "allowedPaths": ["scripts/a2a/", "apps/mission-control/src/fixtures/"],
                "blockedPaths": [".env", "apps/web-sirinx/dist/"],
                "validationCommands": ["python3 -m unittest tests.ghostclaw_runner.test_runner_status_fixture"],
            }
        }
        guard = {
            "plannedFiles": [
                {"path": "scripts/a2a/a2a_team_work_packets.py", "status": "allowed"},
                {"path": "apps/mission-control/src/fixtures/a2a2aTeamWorkPackets.json", "status": "allowed"},
            ]
        }
        with tempfile.TemporaryDirectory(prefix="ghostclaw-team-work-packets-") as tmp:
            runtime = Path(tmp) / "runtime"

            fixture = a2a_team_work_packets.build_packets(assignment, lane, guard, runtime)

            self.assertEqual(fixture["summary"]["status"], "ready_for_team_packets")
            self.assertEqual(fixture["summary"]["nextCodexTask"], "implement_only_allowed_paths")
            self.assertFalse(fixture["summary"]["providerCallsAllowed"])
            self.assertFalse(fixture["summary"]["workerDirectEditsAllowed"])
            self.assertFalse(fixture["summary"]["gitAddDotAllowed"])
            self.assertEqual(fixture["nextCodexPacket"]["ownerMode"], "scoped_repo_edit")
            self.assertTrue(fixture["nextCodexPacket"]["executionAllowed"])
            self.assertIn("scripts/a2a/", fixture["nextCodexPacket"]["allowedPaths"])
            self.assertIn("provider_call", fixture["nextCodexPacket"]["blockedActions"])
            self.assertTrue(fixture["nextCodexPacket"]["validationCommands"])
            self.assertEqual(fixture["packets"][1]["ownerMode"], "report_and_validate_only")
            self.assertFalse(fixture["packets"][1]["workerDirectEditsAllowed"])
            self.assertTrue(Path(fixture["runtimeReportPath"]).exists())

    def test_team_work_packet_outcome_advances_to_next_codex_packet(self) -> None:
        assignment = {
            "immediateQueue": [
                {
                    "queueId": "LANE-CODEX-LANE-TASK-02",
                    "source": "first_codex_implementation_lane",
                    "priority": 2,
                    "owner": "codex",
                    "status": "ready_for_codex",
                    "task": "implement_only_allowed_paths",
                    "why": "Dirty lanes exist outside A2A2A.",
                    "acceptance": "Scoped git status contains only files listed in the lane packet.",
                },
                {
                    "queueId": "LANE-CODEX-LANE-TASK-03",
                    "source": "first_codex_implementation_lane",
                    "priority": 3,
                    "owner": "glm52_deepseek_agy_kob",
                    "status": "report_input",
                    "task": "consume_report_only_feedback",
                    "why": "Worker reports exist.",
                    "acceptance": "No worker commits, provider calls, or command execution are required.",
                },
                {
                    "queueId": "LANE-CODEX-LANE-TASK-04",
                    "source": "first_codex_implementation_lane",
                    "priority": 4,
                    "owner": "codex",
                    "status": "ready_for_codex",
                    "task": "run_validation_commands",
                    "why": "Local validation proves the scoped packet.",
                    "acceptance": "Python, JSON, TypeScript, Prettier, and diff checks pass.",
                },
            ]
        }
        lane = {
            "lane": {
                "allowedPaths": ["scripts/a2a/", "apps/mission-control/src/fixtures/"],
                "blockedPaths": [".env", "apps/web-sirinx/dist/"],
                "validationCommands": ["python3 -m unittest tests.ghostclaw_runner.test_runner_status_fixture"],
            }
        }
        guard = {
            "summary": {
                "status": "ready_with_external_dirty_lanes",
                "plannedFiles": 2,
                "plannedAllowed": 2,
                "plannedBlocked": 0,
                "outOfScopeDirty": 4,
                "providerCalls": 0,
                "gitAddDotAllowed": False,
            },
            "plannedFiles": [
                {"path": "scripts/a2a/a2a_team_work_packets.py", "status": "allowed"},
                {"path": "apps/mission-control/src/fixtures/a2a2aTeamWorkPackets.json", "status": "allowed"},
            ],
        }
        with tempfile.TemporaryDirectory(prefix="ghostclaw-team-work-outcome-") as tmp:
            runtime = Path(tmp) / "runtime"

            first_fixture = a2a_team_work_packets.build_packets(assignment, lane, guard, runtime)
            outcome = a2a_team_work_packet_outcome.build_outcome(
                first_fixture,
                guard,
                {},
                runtime,
                "987cf98 feat(a2a2a): add team work packets",
            )
            fixture_after_outcome = a2a_team_work_packets.build_packets(
                assignment,
                lane,
                guard,
                runtime,
                outcome,
            )

            self.assertEqual(outcome["summary"]["status"], "packet_completed")
            self.assertEqual(outcome["summary"]["selectedTask"], "implement_only_allowed_paths")
            self.assertEqual(outcome["summary"]["plannedBlocked"], 0)
            self.assertFalse(outcome["summary"]["providerCallsAllowed"])
            self.assertIn(first_fixture["nextCodexPacket"]["packetId"], outcome["completedPackets"])
            self.assertEqual(fixture_after_outcome["summary"]["completedPackets"], 1)
            self.assertEqual(fixture_after_outcome["packets"][0]["status"], "completed")
            self.assertFalse(fixture_after_outcome["packets"][0]["executionAllowed"])
            self.assertEqual(fixture_after_outcome["summary"]["nextCodexTask"], "run_validation_commands")
            self.assertEqual(fixture_after_outcome["nextCodexPacket"]["ownerMode"], "scoped_repo_edit")
            self.assertTrue(Path(outcome["runtimeReportPath"]).exists())

    def test_team_work_packet_outcome_requires_validation_for_validation_packet(self) -> None:
        assignment = {
            "immediateQueue": [
                {
                    "queueId": "LANE-CODEX-LANE-TASK-02",
                    "source": "first_codex_implementation_lane",
                    "priority": 2,
                    "owner": "codex",
                    "status": "ready_for_codex",
                    "task": "implement_only_allowed_paths",
                    "why": "Dirty lanes exist outside A2A2A.",
                    "acceptance": "Scoped git status contains only files listed in the lane packet.",
                },
                {
                    "queueId": "LANE-CODEX-LANE-TASK-04",
                    "source": "first_codex_implementation_lane",
                    "priority": 4,
                    "owner": "codex",
                    "status": "ready_for_codex",
                    "task": "run_validation_commands",
                    "why": "Local validation proves the scoped packet.",
                    "acceptance": "Python, JSON, TypeScript, Prettier, and diff checks pass.",
                },
                {
                    "queueId": "LANE-CODEX-LANE-TASK-05",
                    "source": "first_codex_implementation_lane",
                    "priority": 5,
                    "owner": "codex",
                    "status": "ready_for_codex",
                    "task": "stage_and_commit_scoped_lane",
                    "why": "Only a validated scoped lane may be staged.",
                    "acceptance": "No out-of-scope files are staged.",
                },
            ]
        }
        lane = {
            "lane": {
                "allowedPaths": ["scripts/a2a/", "apps/mission-control/src/fixtures/"],
                "blockedPaths": [".env", "apps/web-sirinx/dist/"],
                "validationCommands": ["python3 -m unittest tests.ghostclaw_runner.test_runner_status_fixture"],
            }
        }
        guard = {
            "summary": {
                "status": "ready_with_external_dirty_lanes",
                "plannedFiles": 2,
                "plannedAllowed": 2,
                "plannedBlocked": 0,
                "outOfScopeDirty": 4,
                "providerCalls": 0,
                "gitAddDotAllowed": False,
            },
            "plannedFiles": [
                {"path": "scripts/a2a/a2a_team_work_packets.py", "status": "allowed"},
                {"path": "apps/mission-control/src/fixtures/a2a2aTeamWorkPackets.json", "status": "allowed"},
            ],
        }
        with tempfile.TemporaryDirectory(prefix="ghostclaw-team-work-validation-") as tmp:
            runtime = Path(tmp) / "runtime"
            first_fixture = a2a_team_work_packets.build_packets(assignment, lane, guard, runtime)
            first_outcome = a2a_team_work_packet_outcome.build_outcome(
                first_fixture,
                guard,
                {},
                runtime,
                "c12978a feat(a2a2a): record team work packet outcomes",
            )
            validation_fixture = a2a_team_work_packets.build_packets(
                assignment,
                lane,
                guard,
                runtime,
                first_outcome,
            )

            blocked_outcome = a2a_team_work_packet_outcome.build_outcome(
                validation_fixture,
                guard,
                {},
                runtime,
                "c12978a feat(a2a2a): record team work packet outcomes",
            )
            validation = {
                "summary": {
                    "status": "passed",
                    "packetId": validation_fixture["nextCodexPacket"]["packetId"],
                    "commands": 2,
                    "passed": 2,
                    "failed": 0,
                },
                "runtimeReportPath": str(runtime / "work_packet_validations" / "latest.json"),
            }
            completed_outcome = a2a_team_work_packet_outcome.build_outcome(
                validation_fixture,
                guard,
                validation,
                runtime,
                "c12978a feat(a2a2a): record team work packet outcomes",
            )
            next_fixture = a2a_team_work_packets.build_packets(
                assignment,
                lane,
                guard,
                runtime,
                completed_outcome,
            )

            self.assertEqual(validation_fixture["summary"]["nextCodexTask"], "run_validation_commands")
            self.assertEqual(blocked_outcome["summary"]["status"], "blocked_until_local_evidence_ready")
            self.assertEqual(completed_outcome["summary"]["status"], "packet_completed")
            self.assertEqual(completed_outcome["summary"]["completedPackets"], 2)
            self.assertEqual(completed_outcome["summary"]["validationStatus"], "passed")
            self.assertEqual(next_fixture["summary"]["completedPackets"], 2)
            self.assertEqual(next_fixture["summary"]["nextCodexTask"], "stage_and_commit_scoped_lane")

    def test_team_work_packet_validation_can_dry_run_current_packet(self) -> None:
        packets = {
            "nextCodexPacket": {
                "packetId": "WORK-VALIDATION",
                "queueId": "LANE-CODEX-LANE-TASK-04",
                "task": "run_validation_commands",
            }
        }
        with tempfile.TemporaryDirectory(prefix="ghostclaw-team-work-validation-dry-") as tmp:
            runtime = Path(tmp) / "runtime"

            fixture = a2a_team_work_packet_validation.build_validation(packets, runtime, dry_run=True)

            self.assertEqual(fixture["summary"]["status"], "dry_run")
            self.assertEqual(fixture["summary"]["packetId"], "WORK-VALIDATION")
            self.assertTrue(fixture["summary"]["dryRun"])
            self.assertEqual(fixture["summary"]["commands"], 6)
            self.assertTrue(Path(fixture["runtimeReportPath"]).exists())

    def test_scoped_path_guard_allows_planned_a2a2a_files_only(self) -> None:
        packet = {
            "packet": {
                "packetId": "IMPLEMENT-PACKET-TEST",
                "laneId": "LANE-A2A2A-TEST",
                "scope": {
                    "allowedPaths": [
                        "scripts/a2a/",
                        "apps/mission-control/src/fixtures/",
                        "PROJECT_STATE.md",
                    ],
                    "blockedPaths": [".env", "apps/web-sirinx/dist/"],
                    "plannedFilesForThisPacket": [
                        "scripts/a2a/a2a_scoped_path_guard.py",
                        "apps/mission-control/src/fixtures/a2a2aScopedPathGuard.json",
                        "PROJECT_STATE.md",
                    ],
                },
                "scopedStageCommand": [
                    "/usr/bin/git",
                    "add",
                    "scripts/a2a/a2a_scoped_path_guard.py",
                    "PROJECT_STATE.md",
                ],
            }
        }
        with tempfile.TemporaryDirectory(prefix="ghostclaw-scoped-path-guard-") as tmp:
            runtime = Path(tmp) / "runtime"

            fixture = a2a_scoped_path_guard.build_guard(packet, None, runtime, [])

            self.assertEqual(fixture["summary"]["status"], "ready_clean_scope")
            self.assertEqual(fixture["summary"]["plannedBlocked"], 0)
            self.assertFalse(fixture["summary"]["gitAddDotAllowed"])
            self.assertIn("no_generated_web_sirinx_asset_mutation", fixture["policyBoundary"])
            self.assertTrue(Path(fixture["runtimeReportPath"]).exists())

    def test_scoped_path_guard_blocks_generated_deploy_assets(self) -> None:
        packet = {
            "packet": {
                "packetId": "IMPLEMENT-PACKET-TEST",
                "laneId": "LANE-A2A2A-TEST",
                "scope": {
                    "allowedPaths": ["scripts/a2a/"],
                    "blockedPaths": ["apps/web-sirinx/dist/"],
                    "plannedFilesForThisPacket": [
                        "scripts/a2a/a2a_scoped_path_guard.py",
                        "apps/web-sirinx/dist/public/index.html",
                    ],
                },
                "scopedStageCommand": ["/usr/bin/git", "add", "scripts/a2a/a2a_scoped_path_guard.py"],
            }
        }
        with tempfile.TemporaryDirectory(prefix="ghostclaw-scoped-path-block-") as tmp:
            runtime = Path(tmp) / "runtime"

            fixture = a2a_scoped_path_guard.build_guard(packet, None, runtime, [])

            self.assertEqual(fixture["summary"]["status"], "blocked_by_scoped_path_violation")
            self.assertEqual(fixture["summary"]["plannedBlocked"], 1)
            self.assertEqual(fixture["plannedViolations"][0]["path"], "apps/web-sirinx/dist/public/index.html")
            self.assertEqual(fixture["plannedViolations"][0]["status"], "blocked")


if __name__ == "__main__":
    unittest.main()
