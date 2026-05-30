"""Pydantic v2 schemas for Org, Workspace, and User resources."""
from datetime import datetime
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, EmailStr, Field, field_validator

from packages.core.types import OrgIndustry, UserRole
from packages.core.utils import slugify

T = TypeVar("T")


# ---------------------------------------------------------------------------
# Generic Paginated Response
# ---------------------------------------------------------------------------


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated list response envelope."""

    total: int = Field(..., description="Total number of items matching the query")
    page: int = Field(..., description="Current page number (1-based)")
    page_size: int = Field(..., description="Number of items per page")
    items: list[T] = Field(default_factory=list, description="Items on this page")

    model_config = {"arbitrary_types_allowed": True}


# ---------------------------------------------------------------------------
# Org schemas
# ---------------------------------------------------------------------------


class OrgCreate(BaseModel):
    """Request body for creating a new organisation."""

    name: str = Field(..., min_length=2, max_length=120, description="Organisation display name")
    slug: Optional[str] = Field(
        None,
        min_length=2,
        max_length=80,
        pattern=r"^[a-z0-9-]+$",
        description="URL-friendly identifier (auto-generated from name if omitted)",
    )
    industry: OrgIndustry = Field(OrgIndustry.OTHER, description="Primary industry vertical")
    language: str = Field("th", min_length=2, max_length=10, description="Default UI language code")
    timezone: str = Field("Asia/Bangkok", description="IANA timezone identifier")
    currency: str = Field("THB", min_length=3, max_length=3, description="ISO 4217 currency code")
    brand_colors: Optional[dict] = Field(
        None, description="Optional brand colour palette (arbitrary key-value pairs)"
    )
    logo_url: Optional[str] = Field(None, max_length=500, description="URL to organisation logo")

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v: Optional[str], info) -> Optional[str]:
        """Auto-generate slug from name if not provided."""
        if v:
            return v.lower().strip()
        # Validator runs before the field is set; name may be in info.data
        name = info.data.get("name")
        if name:
            return slugify(name)
        return v

    model_config = {"str_strip_whitespace": True}


class OrgUpdate(BaseModel):
    """Request body for partial update of an organisation."""

    name: Optional[str] = Field(None, min_length=2, max_length=120)
    industry: Optional[OrgIndustry] = None
    language: Optional[str] = Field(None, min_length=2, max_length=10)
    timezone: Optional[str] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    brand_colors: Optional[dict] = None
    logo_url: Optional[str] = Field(None, max_length=500)

    model_config = {"str_strip_whitespace": True}


class OrgResponse(BaseModel):
    """Organisation resource representation returned by the API."""

    id: str
    name: str
    slug: str
    industry: OrgIndustry
    language: str
    timezone: str
    currency: str
    brand_colors: Optional[dict] = None
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    workspace_count: Optional[int] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Workspace schemas
# ---------------------------------------------------------------------------


class WorkspaceCreate(BaseModel):
    """Request body for creating a workspace within an organisation."""

    name: str = Field(..., min_length=2, max_length=120, description="Workspace display name")
    description: Optional[str] = Field(None, max_length=500)
    org_id: str = Field(..., description="Parent organisation ID")

    model_config = {"str_strip_whitespace": True}


class WorkspaceUpdate(BaseModel):
    """Request body for partial update of a workspace."""

    name: Optional[str] = Field(None, min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=500)

    model_config = {"str_strip_whitespace": True}


class WorkspaceResponse(BaseModel):
    """Workspace resource representation returned by the API."""

    id: str
    name: str
    description: Optional[str] = None
    org_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# User schemas
# ---------------------------------------------------------------------------


class UserCreate(BaseModel):
    """Request body for adding a user to an organisation."""

    email: EmailStr = Field(..., description="User email address (unique per org)")
    full_name: str = Field(..., min_length=2, max_length=200, description="User's full name")
    role: UserRole = Field(UserRole.MEMBER, description="Permission role within the organisation")
    org_id: str = Field(..., description="Organisation the user belongs to")

    model_config = {"str_strip_whitespace": True}


class UserUpdate(BaseModel):
    """Request body for partial update of a user."""

    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    role: Optional[UserRole] = None

    model_config = {"str_strip_whitespace": True}


class UserResponse(BaseModel):
    """User resource representation returned by the API."""

    id: str
    email: str
    full_name: str
    role: UserRole
    org_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
