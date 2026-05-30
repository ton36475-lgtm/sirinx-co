"""Audit log router (read-only)."""
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.dependencies import get_current_org
from apps.api.models import Org, AuditEvent
from packages.schemas.audit import AuditEventResponse
from packages.schemas.org import PaginatedResponse
from packages.core.utils import build_pagination

router = APIRouter()


@router.get("/summary")
async def audit_summary(
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Count audit events by type for the current org in the last 30 days.

    NOTE: Declared before /{event_id} to avoid routing ambiguity.
    """
    since = datetime.now(timezone.utc) - timedelta(days=30)

    result = await db.execute(
        select(AuditEvent.event_type, func.count(AuditEvent.id).label("count"))
        .where(
            and_(
                AuditEvent.org_id == org.id,
                AuditEvent.created_at >= since,
            )
        )
        .group_by(AuditEvent.event_type)
        .order_by(func.count(AuditEvent.id).desc())
    )
    rows = result.all()

    return {
        "org_id": org.id,
        "period_days": 30,
        "since": since.isoformat(),
        "event_counts": {row.event_type: row.count for row in rows},
        "total": sum(row.count for row in rows),
    }


@router.get("", response_model=PaginatedResponse[AuditEventResponse])
async def list_audit_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    event_type: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List audit events for the current org with optional filters."""
    pagination = build_pagination(page, page_size)

    filters = [AuditEvent.org_id == org.id]
    if event_type:
        filters.append(AuditEvent.event_type == event_type)
    if user_id:
        filters.append(AuditEvent.user_id == user_id)
    if from_date:
        # Ensure timezone-aware comparison
        if from_date.tzinfo is None:
            from_date = from_date.replace(tzinfo=timezone.utc)
        filters.append(AuditEvent.created_at >= from_date)
    if to_date:
        if to_date.tzinfo is None:
            to_date = to_date.replace(tzinfo=timezone.utc)
        filters.append(AuditEvent.created_at <= to_date)

    count_result = await db.execute(
        select(func.count(AuditEvent.id)).where(and_(*filters))
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(AuditEvent)
        .where(and_(*filters))
        .order_by(AuditEvent.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    events = result.scalars().all()

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=[AuditEventResponse.model_validate(e) for e in events],
    )


@router.get("/{event_id}", response_model=AuditEventResponse)
async def get_audit_event(
    event_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a single audit event by ID."""
    result = await db.execute(
        select(AuditEvent).where(
            and_(
                AuditEvent.id == event_id,
                AuditEvent.org_id == org.id,
            )
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit event '{event_id}' not found",
        )
    return AuditEventResponse.model_validate(event)
