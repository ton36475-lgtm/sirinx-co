"""Anthropic (Claude) provider adapter."""
from __future__ import annotations
import logging
from typing import Optional
from .base import BaseLLMProvider, LLMResponse, ToolCall
from packages.core.utils import calculate_cost

logger = logging.getLogger(__name__)

class AnthropicProvider(BaseLLMProvider):
    """Claude adapter using the Anthropic SDK."""

    DEFAULT_MODEL = "claude-sonnet-4-6"

    def __init__(self, api_key: str, default_model: str = DEFAULT_MODEL):
        super().__init__(api_key=api_key, default_model=default_model)
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                import anthropic
                self._client = anthropic.AsyncAnthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError("anthropic package not installed: pip install anthropic")
        return self._client

    async def generate(
        self,
        messages: list[dict],
        system: Optional[str] = None,
        model: Optional[str] = None,
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        client = self._get_client()
        model = model or self.default_model

        # Convert tool format if needed
        anthropic_tools = None
        if tools:
            anthropic_tools = [
                {
                    "name": t["name"],
                    "description": t.get("description", ""),
                    "input_schema": t.get("input_schema", t.get("parameters", {"type": "object", "properties": {}})),
                }
                for t in tools
            ]

        kwargs = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": messages,
        }
        if system:
            kwargs["system"] = system
        if anthropic_tools:
            kwargs["tools"] = anthropic_tools

        try:
            response = await client.messages.create(**kwargs)

            # Extract content and tool calls
            content_text = ""
            tool_calls = []
            for block in response.content:
                if block.type == "text":
                    content_text += block.text
                elif block.type == "tool_use":
                    tool_calls.append(ToolCall(
                        id=block.id,
                        name=block.name,
                        input=block.input,
                    ))

            input_tokens = response.usage.input_tokens
            output_tokens = response.usage.output_tokens
            cost = calculate_cost(input_tokens, output_tokens, model)

            return LLMResponse(
                content=content_text,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost_usd=cost,
                tool_calls=tool_calls,
                finish_reason=response.stop_reason or "end_turn",
            )
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise

    async def embed(self, text: str, model: Optional[str] = None) -> list[float]:
        # Anthropic doesn't have a native embedding endpoint; use a simple hash-based fallback
        logger.warning("Anthropic does not support embeddings natively; returning empty vector")
        return []

    async def health_check(self) -> bool:
        try:
            await self.generate(
                messages=[{"role": "user", "content": "Say 'ok'"}],
                max_tokens=10,
                temperature=0,
            )
            return True
        except Exception as e:
            logger.error(f"Anthropic health check failed: {e}")
            return False
