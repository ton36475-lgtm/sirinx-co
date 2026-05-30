"""Pydantic v2 schemas for Pack (agent configuration packs) and PackVersion."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from packages.core.types import PackStatus


# ---------------------------------------------------------------------------
# PackVersion schemas
# ---------------------------------------------------------------------------


class PackVersionCreate(BaseModel):
    """Request body for creating a new version of a pack."""

    pack_id: str = Field(..., description="Parent pack ID")
    version: str = Field(
        ...,
        min_length=1,
        max_length=30,
        description="Semantic version string (e.g. '1.2.0')",
    )
    config: dict = Field(default_factory=dict, description="Full configuration snapshot for this version")
    changelog: Optional[str] = Field(None, max_length=2000, description="What changed in this version")

    model_config = {"str_strip_whitespace": True}


class PackVersionResponse(BaseModel):
    """PackVersion resource representation returned by the API."""

    id: str
    pack_id: str
    version: str
    config: dict
    changelog: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Pack schemas
# ---------------------------------------------------------------------------


class PackCreate(BaseModel):
    """Request body for creating a new agent configuration pack."""

    name: str = Field(..., min_length=2, max_length=120, description="Pack display name")
    description: Optional[str] = Field(None, max_length=1000)
    version: str = Field("1.0.0", description="Initial semantic version string")
    config: dict = Field(default_factory=dict, description="Initial pack configuration")
    org_id: str = Field(..., description="Owning organisation ID")
    status: PackStatus = Field(PackStatus.DRAFT, description="Initial lifecycle status")

    model_config = {"str_strip_whitespace": True}


class PackUpdate(BaseModel):
    """Request body for partial update of a pack."""

    name: Optional[str] = Field(None, min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[PackStatus] = None

    model_config = {"str_strip_whitespace": True}


class PackResponse(BaseModel):
    """Pack resource representation returned by the API."""

    id: str
    name: str
    description: Optional[str] = None
    status: PackStatus
    org_id: str
    created_at: datetime
    updated_at: datetime
    latest_version: Optional[PackVersionResponse] = None

    model_config = {"from_attributes": True}
