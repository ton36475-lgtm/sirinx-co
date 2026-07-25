"""Secret rejection and conservative PII redaction."""

from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from typing import Any

from .errors import GraphMemoryPolicyError, SecretDetectedError

_SECRET_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("private_key", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("openai_key", re.compile(r"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b")),
    ("anthropic_key", re.compile(r"\bsk-ant-[A-Za-z0-9_-]{16,}\b")),
    ("maxplus_key", re.compile(r"\bccsk-[A-Za-z0-9_-]{16,}\b")),
    ("github_token", re.compile(r"\bgh(?:p|o|u|s|r)_[A-Za-z0-9]{20,}\b")),
    ("aws_access_key", re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b")),
    ("google_api_key", re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b")),
    (
        "glm_share_key",
        re.compile(r"(?i)\bglm-share-[0-9a-f]{32,}\b"),
    ),
    (
        "telegram_bot_token",
        re.compile(r"(?<!\d)\d{6,12}:[A-Za-z0-9_-]{30,}(?![A-Za-z0-9_-])"),
    ),
    (
        "slack_token",
        re.compile(r"\bxox(?:b|p|a|r|s)-[A-Za-z0-9-]{10,}\b"),
    ),
    (
        "jwt",
        re.compile(
            r"\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}"
            r"\.[A-Za-z0-9_-]{8,}\b"
        ),
    ),
    (
        "huggingface_token",
        re.compile(r"\bhf_[A-Za-z0-9]{20,}\b"),
    ),
    (
        "gitlab_token",
        re.compile(r"\bglpat-[A-Za-z0-9_-]{20,}\b"),
    ),
    (
        "authorization_header",
        re.compile(r"(?i)\bauthorization\s*:\s*bearer\s+\S+"),
    ),
    ("x_api_key_header", re.compile(r"(?i)\bx-api-key\s*:\s*\S+")),
    (
        "credential_assignment",
        re.compile(
            r"(?i)\b(?:api[_-]?key|password|passwd|secret|access[_-]?token)"
            r"\s*[:=]\s*[\"']?[^\s\"']{8,}"
        ),
    ),
    (
        "credential_url",
        re.compile(r"(?i)\bhttps?://[^/\s:@]+:[^/\s@]+@"),
    ),
)

_EMAIL_RE = re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b")
_THAI_PHONE_RE = re.compile(r"(?<!\d)(?:\+66|0)\d(?:[\s-]?\d){7,9}(?!\d)")
_MAC_HOME_RE = re.compile(r"/Users/[^/\s]+")
_LINE_USER_ID_RE = re.compile(r"(?<![A-Za-z0-9])U[0-9a-fA-F]{32}(?![A-Za-z0-9])")
_IPV4_RE = re.compile(
    r"(?<![\d.])"
    r"(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}"
    r"(?:25[0-5]|2[0-4]\d|1?\d?\d)"
    r"(?![\d.])"
)
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def _walk_strings(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, Mapping):
        strings: list[str] = []
        for key, item in value.items():
            strings.extend(_walk_strings(key))
            strings.extend(_walk_strings(item))
        return strings
    if isinstance(value, Sequence) and not isinstance(value, (bytes, bytearray)):
        strings = []
        for item in value:
            strings.extend(_walk_strings(item))
        return strings
    return []


def assert_no_secrets(value: Any) -> None:
    kinds = secret_kinds(value)
    if kinds:
        raise SecretDetectedError(
            f"proposal rejected: secret-shaped value detected ({kinds[0]})"
        )


def secret_kinds(value: Any) -> list[str]:
    found: list[str] = []
    for text in _walk_strings(value):
        for kind, pattern in _SECRET_PATTERNS:
            if pattern.search(text) and kind not in found:
                found.append(kind)
    return found


def redact_text(value: str) -> str:
    return redact_text_with_count(value)[0]


def redact_text_with_count(value: str) -> tuple[str, int]:
    if _CONTROL_RE.search(value):
        raise GraphMemoryPolicyError("control characters are not permitted")
    count = 0

    def replace(pattern: re.Pattern[str], marker: str, text: str) -> str:
        nonlocal count
        text, replacements = pattern.subn(marker, text)
        count += replacements
        return text

    redacted = replace(_EMAIL_RE, "[REDACTED_EMAIL]", value)
    redacted = replace(_THAI_PHONE_RE, "[REDACTED_PHONE]", redacted)
    redacted = replace(_MAC_HOME_RE, "/Users/[REDACTED_USER]", redacted)
    redacted = replace(_LINE_USER_ID_RE, "[REDACTED_LINE_USER_ID]", redacted)
    redacted = replace(_IPV4_RE, "[REDACTED_IPV4]", redacted)
    return redacted.strip(), count


def validate_evidence_ref(value: str) -> str:
    ref = value.strip()
    if not ref:
        raise GraphMemoryPolicyError("evidence reference cannot be empty")
    if _CONTROL_RE.search(ref):
        raise GraphMemoryPolicyError("evidence reference contains control characters")
    if "://" in ref or ref.startswith(("/", "~", "\\")):
        raise GraphMemoryPolicyError(
            "evidence references must be project-relative paths"
        )
    normalized = ref.replace("\\", "/")
    if any(part == ".." for part in normalized.split("/")):
        raise GraphMemoryPolicyError("evidence reference cannot escape the project")
    if len(normalized) > 500:
        raise GraphMemoryPolicyError("evidence reference is too long")
    return normalized
