"""Pydantic v2 schemas for AuditEvent resources."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from packages.core.types import AuditEventType


class AuditEventResponse(BaseModel):
    """Immutable audit event record returned by the API.

    Audit events are written by the system and are never created or mutated
    through the public API — this schema is read-only.
    """

    id: str
    org_id: str
    event_type: AuditEventType = Field(..., description="Classified event type")
    user_id: Optional[str] = Field(
        None, description="User who triggered the event (None for system-generated events)"
    )
    resource_type: Optional[str] = Field(
        None,
        max_length=80,
        description="Type of the resource affected (e.g. 'task', 'policy', 'budget')",
    )
    resource_id: Optional[str] = Field(
        None,
        max_length=200,
        description="ID of the resource affected",
    )
    action: str = Field(..., description="Human-readable description of what happened")
    details: dict = Field(
        default_factory=dict,
        description="Structured event payload (varies by event_type)",
    )
    ip_address: Optional[str] = Field(
        None,
        max_length=45,
        description="Originating IP address (IPv4 or IPv6)",
    )
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditQueryParams(BaseModel):
    """Query parameters for listing/filtering audit events.

    Intended to be constructed from FastAPI Query() parameters and then
    passed to the audit service for building the database query.
    """

    org_id: str = Field(..., description="Organisation ID to scope the query to")
    event_type: Optional[AuditEventType] = Field(None, description="Filter by event type")
    user_id: Optional[str] = Field(None, description="Filter by the user who triggered events")
    resource_type: Optional[str] = Field(None, max_length=80, description="Filter by resource type")
    from_date: Optional[datetime] = Field(
        None, description="Include only events at or after this datetime (UTC)"
    )
    to_date: Optional[datetime] = Field(
        None, description="Include only events at or before this datetime (UTC)"
    )
    page: int = Field(1, ge=1, description="Page number (1-based)")
    page_size: int = Field(50, ge=1, le=200, description="Number of events per page")

    model_config = {"str_strip_whitespace": True}
