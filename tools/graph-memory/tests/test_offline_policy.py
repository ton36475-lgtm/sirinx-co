from __future__ import annotations

import os

from sirinx_graph_memory.offline_policy import (
    PROVIDER_AND_TELEMETRY_KEYS,
    enforce_process_offline,
    scrubbed_environment,
)


def test_scrubbed_environment_removes_provider_and_tracing_keys():
    source = {
        "PATH": "/usr/bin",
        "OPENAI_API_KEY": "canary",
        "ANTHROPIC_API_KEY": "canary",
        "LANGSMITH_API_KEY": "canary",
        "LANGSMITH_TRACING": "true",
        "LANGCHAIN_TRACING_V2": "true",
    }
    scrubbed = scrubbed_environment(source)
    assert PROVIDER_AND_TELEMETRY_KEYS.isdisjoint(scrubbed)
    assert scrubbed["PATH"] == "/usr/bin"
    assert scrubbed["LANGSMITH_TRACING"] == "false"
    assert scrubbed["LANGCHAIN_TRACING_V2"] == "false"


def test_process_policy_forces_tracing_off(monkeypatch):
    monkeypatch.setenv("LANGSMITH_API_KEY", "canary")
    monkeypatch.setenv("LANGSMITH_TRACING", "true")
    enforce_process_offline()
    assert "LANGSMITH_API_KEY" not in os.environ
    assert os.environ["LANGSMITH_TRACING"] == "false"
