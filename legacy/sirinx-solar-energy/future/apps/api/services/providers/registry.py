"""Provider registry — capability-based routing with fallback chains."""
from __future__ import annotations
import logging
from typing import Optional, TYPE_CHECKING
from .base import BaseLLMProvider

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

class ProviderRegistry:
    """Routes LLM calls to the best provider for each capability."""

    CAPABILITY_PREFERENCE = {
        "planning":      ["anthropic", "openai", "google"],
        "execution":     ["anthropic", "openai", "google"],
        "review":        ["anthropic", "openai", "google"],
        "embedding":     ["openai", "google", "anthropic"],
        "summarization": ["anthropic", "openai", "google"],
        # Vision tasks — GLM-5V-Turbo as primary, Gemini as fallback
        "vision":        ["zhipu", "google", "anthropic"],
        "roof_analysis": ["zhipu", "google"],
        "bill_ocr":      ["zhipu", "google"],
        "multimodal":    ["zhipu", "google", "anthropic"],
    }

    def __init__(self):
        self._providers: dict[str, BaseLLMProvider] = {}
        self._initialized = False

    def register(self, name: str, provider: BaseLLMProvider) -> None:
        self._providers[name] = provider
        logger.info(f"Registered provider: {name}")

    def get_provider(self, name: str) -> Optional[BaseLLMProvider]:
        return self._providers.get(name)

    def get_provider_for_capability(self, capability: str) -> BaseLLMProvider:
        """Get the best available provider for a capability."""
        preference = self.CAPABILITY_PREFERENCE.get(capability, ["anthropic", "openai", "google"])
        for provider_name in preference:
            provider = self._providers.get(provider_name)
            if provider:
                return provider
        # Fallback: return any available provider
        if self._providers:
            return next(iter(self._providers.values()))
        # Return a mock provider if none configured
        return MockProvider()

    def initialize_from_settings(self) -> None:
        """Initialize providers from app settings."""
        from apps.api.config import get_settings
        settings = get_settings()

        if settings.ANTHROPIC_API_KEY:
            from .anthropic import AnthropicProvider
            self.register("anthropic", AnthropicProvider(
                api_key=settings.ANTHROPIC_API_KEY,
                default_model=settings.DEFAULT_PLANNING_MODEL,
            ))

        if settings.OPENAI_API_KEY:
            from .openai import OpenAIProvider
            self.register("openai", OpenAIProvider(
                api_key=settings.OPENAI_API_KEY,
                default_model=settings.DEFAULT_EXECUTION_MODEL,
            ))

        if settings.GOOGLE_API_KEY:
            from .google import GoogleProvider
            self.register("google", GoogleProvider(
                api_key=settings.GOOGLE_API_KEY,
            ))

        # Zhipu AI — GLM-5V-Turbo (vision + multimodal)
        if settings.ZHIPU_API_KEY or settings.OPENROUTER_API_KEY:
            from .zhipu import ZhipuProvider
            self.register("zhipu", ZhipuProvider(
                api_key=settings.ZHIPU_API_KEY,
                base_url=settings.ZHIPU_BASE_URL,
                openrouter_api_key=settings.OPENROUTER_API_KEY or None,
            ))

        self._initialized = True
        logger.info(f"Provider registry initialized with: {list(self._providers.keys())}")

    def list_providers(self) -> list[str]:
        return list(self._providers.keys())


class MockProvider(BaseLLMProvider):
    """Mock provider for testing or when no real provider is configured."""

    def __init__(self):
        super().__init__(api_key="mock", default_model="mock-model")

    async def generate(self, messages, system=None, model=None, tools=None,
                       temperature=0.7, max_tokens=4096):
        from .base import LLMResponse
        last_msg = messages[-1]["content"] if messages else "No input"
        return LLMResponse(
            content=f"[Mock Response] Received: {last_msg[:100]}",
            model="mock-model",
            input_tokens=len(last_msg.split()),
            output_tokens=20,
            cost_usd=0.0,
        )

    async def embed(self, text: str, model=None) -> list[float]:
        return [0.0] * 384

    async def health_check(self) -> bool:
        return True


# Global singleton
_registry: Optional[ProviderRegistry] = None

def get_provider_registry() -> ProviderRegistry:
    global _registry
    if _registry is None:
        _registry = ProviderRegistry()
        _registry.initialize_from_settings()
    return _registry
