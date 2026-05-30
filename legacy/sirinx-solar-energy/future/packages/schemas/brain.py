"""Pydantic v2 schemas for Brain (knowledge base) entries."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from packages.core.types import BrainEntryType


class BrainEntryCreate(BaseModel):
    """Request body for creating a new brain (knowledge base) entry."""

    org_id: str = Field(..., description="Owning organisation ID")
    entry_type: BrainEntryType = Field(..., description="Classification of this knowledge entry")
    title: str = Field(..., min_length=2, max_length=200, description="Entry display title")
    content: str = Field(
        ...,
        min_length=1,
        description="Full content of the entry (Markdown, plain text, or structured data)",
    )
    tags: list[str] = Field(
        default_factory=list,
        description="Free-form tags for filtering and retrieval",
    )
    metadata: dict = Field(
        default_factory=dict,
        description="Arbitrary metadata (author, version, linked_pack_id, etc.)",
    )
    source: Optional[str] = Field(
        None,
        max_length=500,
        description="Origin reference (URL, document name, agent name, etc.)",
    )

    model_config = {"str_strip_whitespace": True}


class BrainEntryUpdate(BaseModel):
    """Request body for partial update of a brain entry."""

    title: Optional[str] = Field(None, min_length=2, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[list[str]] = None
    metadata: Optional[dict] = None

    model_config = {"str_strip_whitespace": True}


class BrainEntryResponse(BaseModel):
    """Brain entry resource returned by the API."""

    id: str
    org_id: str
    entry_type: BrainEntryType
    title: str
    content: str
    tags: list[str]
    metadata: dict
    source: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BrainSearchRequest(BaseModel):
    """Request body for searching brain entries."""

    query: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Free-text search query (keyword or semantic)",
    )
    entry_type: Optional[BrainEntryType] = Field(
        None, description="Filter results to a specific entry type"
    )
    limit: int = Field(
        10,
        ge=1,
        le=100,
        description="Maximum number of results to return",
    )

    model_config = {"str_strip_whitespace": True}


class BrainSearchResponse(BaseModel):
    """Search results from a brain query."""

    entries: list[BrainEntryResponse] = Field(
        default_factory=list, description="Matching brain entries"
    )
    total: int = Field(..., description="Total number of matches found (before limit)")
