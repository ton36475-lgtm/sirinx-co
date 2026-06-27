from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "scripts" / "model_eval" / "glm52_ui_review_benchmark.py"
PACKET_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "a2a2aNextScopedCodingPacket.json"


def load_module():
    spec = importlib.util.spec_from_file_location("glm52_ui_review_benchmark", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


class GLM52UiReviewBenchmarkTest(unittest.TestCase):
    def test_builds_local_status_from_scoped_packet_without_provider_call(self) -> None:
        module = load_module()
        packet = json.loads(PACKET_PATH.read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory() as tmp:
            runtime_root = Path(tmp) / "runtime"
            status = module.build_status(packet, runtime_root)

        self.assertEqual(status["summary"]["status"], "ready_for_manual_glm52_ui_review")
        self.assertEqual(status["summary"]["selectedBacklogId"], "BACKLOG-092")
        self.assertEqual(status["summary"]["sourcePacketId"], "SCOPED-CODING-420bddf8b5")
        self.assertFalse(status["summary"]["providerCallPerformed"])
        self.assertFalse(status["summary"]["autoPatchAllowed"])
        self.assertFalse(status["summary"]["publicClaimAllowed"])
        self.assertGreaterEqual(status["summary"]["criteria"], 7)
        self.assertGreaterEqual(status["summary"]["promptSections"], 5)
        self.assertIn("Mission Control", status["benchmark"]["uiExcerpt"]["surface"])
        self.assertIn("no_code", status["benchmark"]["requiredOutput"])
        self.assertIn("provider_calls_require_command_broker_lease", status["policyBoundary"])
        self.assertTrue(Path(status["runtimeReportPath"]).name.endswith(".json"))
        self.assertTrue(Path(status["promptPath"]).name.endswith(".md"))

    def test_writes_runtime_and_fixture_outputs(self) -> None:
        module = load_module()
        packet = json.loads(PACKET_PATH.read_text(encoding="utf-8"))
        with tempfile.TemporaryDirectory() as tmp:
            runtime_root = Path(tmp) / "runtime"
            fixture_path = Path(tmp) / "fixture.json"
            status = module.write_outputs(packet, runtime_root, fixture_path)

            self.assertTrue(fixture_path.exists())
            self.assertTrue(Path(status["runtimeReportPath"]).exists())
            self.assertTrue(Path(status["promptPath"]).exists())
            fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
            report = json.loads(Path(status["runtimeReportPath"]).read_text(encoding="utf-8"))

        self.assertEqual(fixture["summary"]["status"], "ready_for_manual_glm52_ui_review")
        self.assertEqual(report["summary"]["status"], "ready_for_manual_glm52_ui_review")
        self.assertEqual(fixture["benchmark"]["scoring"]["passingThreshold"], 4.0)


if __name__ == "__main__":
    unittest.main()
