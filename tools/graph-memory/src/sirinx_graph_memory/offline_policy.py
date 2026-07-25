"""Process/environment controls for provider-free, telemetry-free execution."""

from __future__ import annotations

import os
from collections.abc import Mapping

PROVIDER_AND_TELEMETRY_KEYS = frozenset(
    {
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GOOGLE_API_KEY",
        "GEMINI_API_KEY",
        "DEEPSEEK_API_KEY",
        "KIMI_API_KEY",
        "MOONSHOT_API_KEY",
        "ZAI_API_KEY",
        "GLM_API_KEY",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_SESSION_TOKEN",
        "OPENROUTER_API_KEY",
        "LANGSMITH_API_KEY",
        "LANGCHAIN_API_KEY",
    }
)

_OFF_FLAGS = {
    "LANGSMITH_TRACING": "false",
    "LANGCHAIN_TRACING": "false",
    "LANGCHAIN_TRACING_V2": "false",
}


def scrubbed_environment(source: Mapping[str, str] | None = None) -> dict[str, str]:
    source = os.environ if source is None else source
    result = {
        key: value
        for key, value in source.items()
        if key not in PROVIDER_AND_TELEMETRY_KEYS
    }
    result.update(_OFF_FLAGS)
    return result


def enforce_process_offline() -> None:
    for key in PROVIDER_AND_TELEMETRY_KEYS:
        os.environ.pop(key, None)
    os.environ.update(_OFF_FLAGS)
