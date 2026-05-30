"""Abstract base for all LLM providers."""
from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class LLMMessage:
    role: str  # "user", "assistant", "system"
    content: str

@dataclass
class ToolCall:
    id: str
    name: str
    input: dict

@dataclass
class LLMResponse:
    content: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    tool_calls: list[ToolCall] = field(default_factory=list)
    finish_reason: str = "end_turn"

class BaseLLMProvider(ABC):
    """Abstract base class for all LLM provider adapters."""

    def __init__(self, api_key: str, default_model: str):
        self.api_key = api_key
        self.default_model = default_model

    @abstractmethod
    async def generate(
        self,
        messages: list[dict],
        system: Optional[str] = None,
        model: Optional[str] = None,
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        """Generate a response from the LLM."""
        ...

    @abstractmethod
    async def embed(self, text: str, model: Optional[str] = None) -> list[float]:
        """Generate an embedding vector for text."""
        ...

    async def summarize(self, text: str, max_length: int = 500) -> str:
        """Summarize text using the LLM."""
        response = await self.generate(
            system="You are a concise summarizer. Summarize the input in clear, brief text.",
            messages=[{"role": "user", "content": f"Summarize this (max {max_length} chars):\n\n{text}"}],
            temperature=0.3,
            max_tokens=max_length * 2,
        )
        return response.content[:max_length]

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is reachable and API key is valid."""
        ...

    def provider_name(self) -> str:
        return self.__class__.__name__.replace("Provider", "").lower()
