#!/usr/bin/env python3
"""Negative and privacy-boundary checks for the local BESS mock API."""
from __future__ import annotations

import json
import subprocess
import sys
import time
import unittest
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MASTER_PATH = ROOT / "apps/public-web/client/public/prototypes/data/bess-master.json"
SERVER_PATH = ROOT / "mock_api_server.py"
PORT = 8767
BASE_URL = f"http://127.0.0.1:{PORT}"
SERVER_PROCESS: subprocess.Popen[bytes] | None = None
BESS_MASTER: dict[str, object]


def request_json(path: str, method: str = "GET", payload: dict[str, object] | None = None) -> tuple[int, dict[str, object]]:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(BASE_URL + path, data=data, method=method)
    if data is not None:
        request.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(request, timeout=3) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode("utf-8"))


def setUpModule() -> None:
    """Load the BESS master data and start an isolated local mock process."""
    global BESS_MASTER, SERVER_PROCESS

    BESS_MASTER = json.loads(MASTER_PATH.read_text(encoding="utf-8"))
    if not BESS_MASTER.get("knowledgeRecords"):
        raise AssertionError("BESS master specification must contain knowledge records")
    if not SERVER_PATH.is_file():
        raise AssertionError(f"Missing BESS mock API server: {SERVER_PATH}")

    SERVER_PROCESS = subprocess.Popen(
        [sys.executable, str(SERVER_PATH), "--port", str(PORT)],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        try:
            status, _ = request_json("/api/v1/status")
            if status == 200:
                return
        except (OSError, urllib.error.URLError, json.JSONDecodeError):
            time.sleep(0.05)

    tearDownModule()
    raise AssertionError("BESS mock API server did not start on port 8767")


def tearDownModule() -> None:
    """Stop the local mock process even when a test fails."""
    global SERVER_PROCESS
    if SERVER_PROCESS is None:
        return

    SERVER_PROCESS.terminate()
    try:
        SERVER_PROCESS.wait(timeout=3)
    except subprocess.TimeoutExpired:
        SERVER_PROCESS.kill()
        SERVER_PROCESS.wait(timeout=3)
    finally:
        SERVER_PROCESS = None


class BessMockApiNegativeTests(unittest.TestCase):
    def test_assessment_rejects_personal_fields(self) -> None:
        for payload in ({"name": "Synthetic User"}, {"email": "synthetic@example.invalid"}):
            with self.subTest(payload=payload):
                status, response = request_json("/api/v1/assessments", "POST", payload)
                message = str(response.get("message", response.get("error", "")))

                self.assertEqual(status, 400)
                self.assertRegex(message, r"(?i)personal|contact|secret")

    def test_clean_assessment_is_non_persistent(self) -> None:
        status, response = request_json(
            "/api/v1/assessments",
            "POST",
            {"businessType": "hotel", "goal": "cutCosts"},
        )

        self.assertEqual(status, 200)
        self.assertIs(response.get("persisted"), False)

    def test_evidence_records_are_all_unverified(self) -> None:
        status, response = request_json("/api/v1/evidence")
        records = response.get("records")

        self.assertEqual(status, 200)
        self.assertIsInstance(records, list)
        self.assertTrue(records)
        self.assertTrue(all(record.get("verified") is False for record in records))

    def test_unknown_post_route_returns_mock_route_error(self) -> None:
        status, response = request_json("/api/v1/not-a-route", "POST", {})
        message = str(response.get("message", response.get("error", "")))

        self.assertEqual(status, 404)
        self.assertIn("Unknown mock route", message)


if __name__ == "__main__":
    unittest.main()
