"""App configuration loaded from environment variables."""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_ENV: str = "development"
    APP_SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    APP_DEBUG: bool = True
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3002"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./future.db"
    DATABASE_ECHO: bool = False

    # LLM Providers
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    ZHIPU_API_KEY: str = ""                                         # Zhipu AI (GLM-5V-Turbo)
    ZHIPU_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4/"  # or z.ai mirror
    OPENROUTER_API_KEY: str = ""                                    # Fallback for GLM via OpenRouter

    # Default Models
    DEFAULT_PLANNING_MODEL: str = "claude-opus-4-6"
    DEFAULT_EXECUTION_MODEL: str = "claude-sonnet-4-6"
    DEFAULT_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Budget defaults
    DEFAULT_MONTHLY_BUDGET: float = 100.0
    DEFAULT_TASK_BUDGET: float = 5.0

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Kairos
    KAIROS_ENABLED: bool = True
    KAIROS_INTERVAL_SECONDS: int = 60

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
