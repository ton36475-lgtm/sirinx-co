"""Google (Gemini) provider adapter."""
from __future__ import annotations
import logging
from typing import Optional
from .base import BaseLLMProvider, LLMResponse, ToolCall
from packages.core.utils import calculate_cost

logger = logging.getLogger(__name__)

class GoogleProvider(BaseLLMProvider):
    """Gemini adapter using the google-generativeai SDK."""

    DEFAULT_MODEL = "gemini-1.5-flash"

    def __init__(self, api_key: str, default_model: str = DEFAULT_MODEL):
        super().__init__(api_key=api_key, default_model=default_model)
        self._configured = False

    def _ensure_configured(self):
        if not self._configured:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._configured = True
            except ImportError:
                raise ImportError("google-generativeai not installed: pip install google-generativeai")

    async def generate(
        self,
        messages: list[dict],
        system: Optional[str] = None,
        model: Optional[str] = None,
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        import asyncio
        import google.generativeai as genai
        self._ensure_configured()
        model = model or self.default_model

        gemini_model = genai.GenerativeModel(
            model_name=model,
            system_instruction=system,
        )

        # Convert messages to Gemini format
        history = []
        last_user_msg = ""
        for msg in messages:
            role = msg["role"]
            content = msg["content"] if isinstance(msg["content"], str) else str(msg["content"])
            if role == "user":
                last_user_msg = content
                history.append({"role": "user", "parts": [content]})
            elif role == "assistant":
                history.append({"role": "model", "parts": [content]})

        try:
            chat = gemini_model.start_chat(history=history[:-1] if history else [])
            response = await asyncio.to_thread(
                chat.send_message,
                last_user_msg or "Hello",
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )

            content_text = response.text if hasattr(response, "text") else ""
            input_tokens = 0
            output_tokens = 0
            if hasattr(response, "usage_metadata"):
                input_tokens = getattr(response.usage_metadata, "prompt_token_count", 0) or 0
                output_tokens = getattr(response.usage_metadata, "candidates_token_count", 0) or 0

            cost = calculate_cost(input_tokens, output_tokens, model)

            return LLMResponse(
                content=content_text,
                model=model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost_usd=cost,
                tool_calls=[],
                finish_reason="stop",
            )
        except Exception as e:
            logger.error(f"Google API error: {e}")
            raise

    async def embed(self, text: str, model: Optional[str] = None) -> list[float]:
        import google.generativeai as genai
        import asyncio
        self._ensure_configured()
        model = model or "models/embedding-001"
        try:
            result = await asyncio.to_thread(genai.embed_content, model=model, content=text)
            return result.get("embedding", [])
        except Exception as e:
            logger.error(f"Google embedding error: {e}")
            return []

    async def health_check(self) -> bool:
        try:
            await self.generate(
                messages=[{"role": "user", "content": "Say ok"}],
                max_tokens=5,
                temperature=0,
            )
            return True
        except Exception as e:
            logger.error(f"Google health check failed: {e}")
            return False
