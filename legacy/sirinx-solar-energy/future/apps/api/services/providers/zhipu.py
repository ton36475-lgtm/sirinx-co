"""Zhipu AI (GLM-5V-Turbo) provider adapter.

OpenAI-compatible API supporting:
- Vision inputs (base64 images)
- Function calling / tool use
- Long context (~200K tokens)
- Agent workflows

Direct API:  https://open.bigmodel.cn/api/paas/v4/
OpenRouter:  https://openrouter.ai/api/v1  →  z-ai/glm-5v-turbo
Pricing:     $1.20/M input · $4.00/M output
"""
from __future__ import annotations

import base64
import logging
from typing import Optional

from .base import BaseLLMProvider, LLMResponse, ToolCall
from packages.core.utils import calculate_cost

logger = logging.getLogger(__name__)

ZHIPU_BASE_URL      = "https://open.bigmodel.cn/api/paas/v4/"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL_ID = "z-ai/glm-5v-turbo"
DEFAULT_MODEL       = "glm-5v-turbo"


class ZhipuProvider(BaseLLMProvider):
    """GLM-5V-Turbo adapter using the OpenAI-compatible Zhipu AI API.

    Falls back to OpenRouter if ``api_key`` is empty and
    ``openrouter_api_key`` is provided.
    """

    def __init__(
        self,
        api_key: str,
        default_model: str = DEFAULT_MODEL,
        base_url: str = ZHIPU_BASE_URL,
        openrouter_api_key: Optional[str] = None,
    ):
        super().__init__(api_key=api_key, default_model=default_model)
        self.base_url           = base_url
        self.openrouter_api_key = openrouter_api_key
        self._client            = None
        self._use_openrouter    = not bool(api_key) and bool(openrouter_api_key)

    # ──────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────────────────────────────

    def _get_client(self):
        if self._client is None:
            try:
                from openai import AsyncOpenAI  # type: ignore
            except ImportError:
                raise ImportError("openai package not installed: pip install openai")

            if self._use_openrouter:
                self._client = AsyncOpenAI(
                    api_key=self.openrouter_api_key,
                    base_url=OPENROUTER_BASE_URL,
                    default_headers={
                        "HTTP-Referer": "https://sirinx.ai",
                        "X-Title":      "SIRINX Solar AI Platform",
                    },
                )
            else:
                self._client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url,
                )
        return self._client

    def _resolve_model(self, model: Optional[str]) -> str:
        if self._use_openrouter:
            return OPENROUTER_MODEL_ID
        return model or self.default_model

    # ──────────────────────────────────────────────────────────────────────
    # BaseLLMProvider interface
    # ──────────────────────────────────────────────────────────────────────

    async def generate(
        self,
        messages: list[dict],
        system: Optional[str] = None,
        model: Optional[str] = None,
        tools: Optional[list[dict]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        client         = self._get_client()
        resolved_model = self._resolve_model(model)

        # System message first
        openai_messages: list[dict] = []
        if system:
            openai_messages.append({"role": "system", "content": system})
        openai_messages.extend(messages)

        # Convert to OpenAI tool format
        openai_tools = None
        if tools:
            openai_tools = [
                {
                    "type": "function",
                    "function": {
                        "name":        t["name"],
                        "description": t.get("description", ""),
                        "parameters":  t.get(
                            "input_schema",
                            t.get("parameters", {"type": "object", "properties": {}}),
                        ),
                    },
                }
                for t in tools
            ]

        kwargs: dict = {
            "model":       resolved_model,
            "messages":    openai_messages,
            "max_tokens":  max_tokens,
            "temperature": temperature,
        }
        if openai_tools:
            kwargs["tools"] = openai_tools

        try:
            response = await client.chat.completions.create(**kwargs)
            choice   = response.choices[0]
            msg      = choice.message

            content_text = msg.content or ""
            tool_calls: list[ToolCall] = []
            if msg.tool_calls:
                import json
                for tc in msg.tool_calls:
                    try:
                        tc_input = json.loads(tc.function.arguments)
                    except Exception:
                        tc_input = {}
                    tool_calls.append(
                        ToolCall(id=tc.id, name=tc.function.name, input=tc_input)
                    )

            input_tokens  = response.usage.prompt_tokens     if response.usage else 0
            output_tokens = response.usage.completion_tokens if response.usage else 0
            cost          = calculate_cost(input_tokens, output_tokens, resolved_model)

            return LLMResponse(
                content=content_text,
                model=resolved_model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cost_usd=cost,
                tool_calls=tool_calls,
                finish_reason=choice.finish_reason or "stop",
            )
        except Exception as e:
            logger.error(f"Zhipu API error ({resolved_model}): {e}")
            raise

    async def generate_vision(
        self,
        prompt: str,
        image_base64s: list[str],
        system: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        """Send a vision request with base64-encoded images.

        Images are passed as ``image_url`` content parts (data URLs).
        Compatible with GLM-5V-Turbo's multimodal message format.
        """
        content: list[dict] = []
        for b64 in image_base64s:
            data_url = b64 if b64.startswith("data:") else f"data:image/jpeg;base64,{b64}"
            content.append({"type": "image_url", "image_url": {"url": data_url}})
        content.append({"type": "text", "text": prompt})

        messages = [{"role": "user", "content": content}]
        return await self.generate(
            messages=messages,
            system=system,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    async def analyze_roof(
        self,
        image_base64s: list[str],
        building_type: Optional[str] = None,
        location: Optional[str] = None,
    ) -> LLMResponse:
        """Analyze rooftop photos for solar potential (Thai solar context)."""
        context_lines = []
        if building_type:
            context_lines.append(f"ประเภทอาคาร: {building_type}")
        if location:
            context_lines.append(f"ที่ตั้ง: {location}")
        context_str = "\n".join(context_lines)

        prompt = f"""วิเคราะห์หลังคาจากภาพเพื่อประเมิน Solar Potential ตอบเป็น JSON เท่านั้น:

{{
  "roofArea": {{ "total": number, "usable": number, "unit": "sqm" }},
  "orientation": {{ "direction": string, "tiltAngle": number }},
  "obstructions": [{{ "type": string, "impact": "low|medium|high" }}],
  "roofCondition": {{ "material": string, "estimatedAge": number, "strength": "good|fair|poor" }},
  "solarPotential": {{ "estimatedKwp": number, "annualKwh": number, "suitabilityScore": number }},
  "recommendations": [string],
  "notes": string
}}

{context_str}"""

        return await self.generate_vision(
            prompt=prompt,
            image_base64s=image_base64s,
            system="คุณเป็นผู้เชี่ยวชาญด้าน Solar EPC พร้อม Vision AI สำหรับวิเคราะห์หลังคาและประเมิน solar potential",
            temperature=0.2,
            max_tokens=2048,
        )

    async def read_electricity_bill(self, image_base64: str) -> LLMResponse:
        """OCR and parse a Thai MEA/PEA electricity bill from a photo."""
        prompt = """อ่านและสกัดข้อมูลจากใบแจ้งหนี้ค่าไฟฟ้า (MEA/PEA) ตอบเป็น JSON เท่านั้น:

{
  "meterNumber": string | null,
  "customerName": string | null,
  "billingPeriod": { "from": string, "to": string } | null,
  "consumption": {
    "currentKwh": number | null,
    "monthlyHistory": [{ "month": string, "kwh": number }]
  },
  "charges": {
    "energyCharge": number | null,
    "ftCharge": number | null,
    "vatAmount": number | null,
    "totalTHB": number | null
  },
  "avgCostPerKwh": number | null,
  "tariffType": "residential|sme|industrial|tou" | null,
  "utility": "MEA|PEA|other" | null,
  "readConfidence": "high|medium|low"
}

หากอ่านค่าไม่ออกให้ใส่ null"""

        return await self.generate_vision(
            prompt=prompt,
            image_base64s=[image_base64],
            system="คุณเป็น OCR AI ผู้เชี่ยวชาญด้านใบแจ้งหนี้ MEA/PEA ของประเทศไทย",
            temperature=0.1,
            max_tokens=1024,
        )

    async def embed(self, text: str, model: Optional[str] = None) -> list[float]:
        """GLM-5V-Turbo is not an embedding model; returns empty vector."""
        logger.warning("ZhipuProvider.embed() is not supported — returning empty vector")
        return []

    async def health_check(self) -> bool:
        try:
            await self.generate(
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=5,
                temperature=0,
            )
            return True
        except Exception as e:
            logger.error(f"Zhipu health check failed: {e}")
            return False
