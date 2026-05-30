"""Utility helpers for Future Agentic OS."""
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Optional


def new_uuid() -> str:
    """Generate a new UUID4 string."""
    return str(uuid.uuid4())


def utcnow() -> datetime:
    """Return current UTC datetime (timezone-aware)."""
    return datetime.now(timezone.utc)


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


def truncate(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to max_length characters."""
    if len(text) <= max_length:
        return text
    return text[: max_length - len(suffix)] + suffix


def deep_merge(base: dict, override: dict) -> dict:
    """Deep merge two dicts, override takes precedence."""
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def safe_json_loads(text: str, default: Any = None) -> Any:
    """Safely parse JSON, returning default on failure."""
    import json

    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return default


def mask_secret(value: str, visible_chars: int = 4) -> str:
    """Mask a secret key, showing only last N chars."""
    if len(value) <= visible_chars:
        return "*" * len(value)
    return "*" * (len(value) - visible_chars) + value[-visible_chars:]


def calculate_cost(input_tokens: int, output_tokens: int, model: str) -> float:
    """Estimate cost in USD for a model call.

    Pricing is approximate per 1M tokens as of mid-2024.
    Update the pricing table as provider rates change.
    """
    # Approximate pricing per 1M tokens (input, output)
    pricing: dict[str, dict[str, float]] = {
        "claude-opus-4-6": {"input": 15.0, "output": 75.0},
        "claude-sonnet-4-6": {"input": 3.0, "output": 15.0},
        "claude-haiku-4-5-20251001": {"input": 0.25, "output": 1.25},
        "gpt-4o": {"input": 5.0, "output": 15.0},
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "gemini-1.5-pro": {"input": 1.25, "output": 5.0},
        "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
        # Zhipu AI — GLM-5V-Turbo (vision + multimodal)
        "glm-5v-turbo": {"input": 1.20, "output": 4.00},
        "z-ai/glm-5v-turbo": {"input": 1.20, "output": 4.00},  # OpenRouter alias
        "glm-4": {"input": 0.86, "output": 0.86},
    }
    rates = pricing.get(model, {"input": 1.0, "output": 3.0})
    return (input_tokens * rates["input"] + output_tokens * rates["output"]) / 1_000_000


def build_pagination(page: int, page_size: int) -> dict:
    """Build pagination offset/limit from page number.

    Returns a dict with keys: offset, limit, page, page_size.
    page is clamped to >= 1; page_size is clamped to 1..100.
    """
    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    return {
        "offset": (page - 1) * page_size,
        "limit": page_size,
        "page": page,
        "page_size": page_size,
    }


def chunk_list(items: list, chunk_size: int) -> list[list]:
    """Split a list into chunks of at most chunk_size elements."""
    return [items[i : i + chunk_size] for i in range(0, len(items), chunk_size)]


def format_duration_seconds(seconds: float) -> str:
    """Format a duration in seconds to a human-readable string."""
    if seconds < 60:
        return f"{seconds:.1f}s"
    minutes = int(seconds // 60)
    remaining = seconds % 60
    if minutes < 60:
        return f"{minutes}m {remaining:.0f}s"
    hours = minutes // 60
    remaining_minutes = minutes % 60
    return f"{hours}h {remaining_minutes}m"


def normalize_model_name(model: str) -> str:
    """Normalize model name to a consistent lowercase format."""
    return model.strip().lower().replace(" ", "-")
