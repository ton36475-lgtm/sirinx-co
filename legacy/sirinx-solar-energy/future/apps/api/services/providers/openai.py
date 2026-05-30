"""OpenAI (GPT) provider adapter."""
from __future__ import annotations
import logging
from typing import Optional
from .base import BaseLLMProvider, LLMResponse, ToolCall
from packages.core.utils import calculate_cost

logger = logging.getLogger(__name__)

class OpenAIProvider(BaseLLMProvider):
    """GPT adapter using the OpenAI SDK."""

    DEFAULT_MODEL = "gpt-4o-mini"

    def __init__(self, api_key: str, default_model: str = DEFAULT_MODEL):
        super().__init__(api_key=api_key, default_model=default_model)
        self._client = None

    def _get_client(self):
        if self._client is None:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("openai package not installed: pip install openai")
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

        # Prepend system message if provided
        openai_messages = []
        if system:
            openai_messages.append({"role": "system", "content": system})
        openai_messages.extend(messages)

        # Convert tool format for OpenAI
        openai_tools = None
        if tools:
            openai_tools = [
                {
                    "type": "function",
                    "function": {
                        "name": t["name"],
                        "description": t.get("description", ""),
                        "parameters": t.get("input_schema", t.get("parameters", {"type": "object", "properties": {}})),
                    }
                }
                for t in tools
            ]

        kwargs = {
            "model": model,
            "messages": openai_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if openai_tools:
            kwargs["tools"] = openai_tools

        try:
            response = await client.chat.completions.create(**kwargs)
            choice = response.choices[0]
            msg = choice.message

            content_text = msg.content or ""
            tool_calls = []
            if msg.tool_calls:
                import json
                for tc in msg.tool_calls:
                    try:
                        tc_input = json.loads(tc.function.arguments)
                    except Exception:
                        tc_input = {}
                    tool_calls.append(ToolCall(
                        id=tc.id,
                        name=tc.function.name,
                        input=tc_input,
                    ))

            input_tokens = response.usage.prompt_tokens if response.usage else 0
            output_tokens = response.usage.completion_tokens if response.usage else 0
            cost = calculate_cost(input_tokens, output_tokens, model)

            return LLMResponse(
                content=content_text,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost_usd=cost,
                tool_calls=tool_calls,
                finish_reason=choice.finish_reason or "stop",
            )
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise

    async def embed(self, text: str, model: Optional[str] = None) -> list[float]:
        client = self._get_client()
        model = model or "text-embedding-3-small"
        try:
            response = await client.embeddings.create(input=text, model=model)
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"OpenAI embedding error: {e}")
            return []

    async def health_check(self) -> bool:
        try:
            await self.generate(
                messages=[{"role": "user", "content": "Say 'ok'"}],
                max_tokens=5,
                temperature=0,
            )
            return True
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return False
