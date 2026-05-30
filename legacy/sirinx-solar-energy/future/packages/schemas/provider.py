"""Pydantic v2 schemas for LLM ProviderConfig resources."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from packages.core.types import ModelCapability, ProviderName
from packages.core.utils import mask_secret


class ProviderConfigCreate(BaseModel):
    """Request body for registering a new LLM provider configuration."""

    name: ProviderName = Field(..., description="LLM provider identifier")
    api_key: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="Provider API key (stored encrypted; never returned in responses)",
    )
    org_id: str = Field(..., description="Owning organisation ID")
    models: list[str] = Field(
        default_factory=list,
        description="Model IDs available through this provider config",
    )
    capabilities: list[ModelCapability] = Field(
        default_factory=list,
        description="Capabilities supported by this provider config",
    )
    is_active: bool = Field(True, description="Whether this provider is available for routing")
    priority: int = Field(
        0,
        ge=0,
        le=100,
        description="Routing priority; higher value = preferred when multiple providers match",
    )
    extra_config: dict = Field(
        default_factory=dict,
        description="Provider-specific extra settings (e.g. base_url for OpenAI-compatible proxies)",
    )

    model_config = {"str_strip_whitespace": True}


class ProviderConfigUpdate(BaseModel):
    """Request body for partial update of a provider configuration."""

    api_key: Optional[str] = Field(None, min_length=10, max_length=500)
    models: Optional[list[str]] = None
    capabilities: Optional[list[ModelCapability]] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0, le=100)

    model_config = {"str_strip_whitespace": True}


class ProviderConfigResponse(BaseModel):
    """Provider configuration returned by the API.

    Note: The raw api_key is NEVER included. Only a masked version is returned
    so callers can confirm the key was registered without exposing the secret.
    """

    id: str
    name: ProviderName
    org_id: str
    models: list[str]
    capabilities: list[ModelCapability]
    is_active: bool
    priority: int
    api_key_masked: str = Field(..., description="Masked API key (e.g. '***...abcd')")
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_mask(cls, obj) -> "ProviderConfigResponse":
        """Construct response from ORM object, masking the API key."""
        data = {
            "id": obj.id,
            "name": obj.name,
            "org_id": obj.org_id,
            "models": obj.models or [],
            "capabilities": obj.capabilities or [],
            "is_active": obj.is_active,
            "priority": obj.priority,
            "api_key_masked": mask_secret(obj.api_key, visible_chars=4),
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
        }
        return cls(**data)
