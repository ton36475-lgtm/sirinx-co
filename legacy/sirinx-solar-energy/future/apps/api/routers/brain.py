"""Company Brain (knowledge base) CRUD router."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.dependencies import get_current_org
from apps.api.models import Org, BrainEntry
from packages.schemas.brain import (
    BrainEntryCreate,
    BrainEntryUpdate,
    BrainEntryResponse,
    BrainSearchRequest,
    BrainSearchResponse,
)
from packages.schemas.org import PaginatedResponse
from packages.core.utils import build_pagination

router = APIRouter()


def _brain_response(entry: BrainEntry) -> BrainEntryResponse:
    """Build BrainEntryResponse, mapping metadata_ ORM field."""
    return BrainEntryResponse(
        id=entry.id,
        org_id=entry.org_id,
        entry_type=entry.entry_type,
        title=entry.title,
        content=entry.content,
        tags=entry.tags or [],
        metadata=entry.metadata_ or {},
        source=entry.source,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )


@router.get("", response_model=PaginatedResponse[BrainEntryResponse])
async def list_brain_entries(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    entry_type: str = Query(None),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List brain entries for the current org, optionally filtered by type."""
    pagination = build_pagination(page, page_size)

    filters = [BrainEntry.org_id == org.id]
    if entry_type:
        filters.append(BrainEntry.entry_type == entry_type)

    count_result = await db.execute(
        select(func.count(BrainEntry.id)).where(and_(*filters))
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(BrainEntry)
        .where(and_(*filters))
        .order_by(BrainEntry.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    entries = result.scalars().all()

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=[_brain_response(e) for e in entries],
    )


@router.post("", response_model=BrainEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_brain_entry(
    payload: BrainEntryCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new brain entry."""
    entry = BrainEntry(
        org_id=org.id,
        entry_type=payload.entry_type.value if hasattr(payload.entry_type, "value") else payload.entry_type,
        title=payload.title,
        content=payload.content,
        tags=payload.tags or [],
        metadata_=payload.metadata or {},
        source=payload.source,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return _brain_response(entry)


@router.get("/{entry_id}", response_model=BrainEntryResponse)
async def get_brain_entry(
    entry_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a brain entry by ID."""
    result = await db.execute(
        select(BrainEntry).where(
            and_(BrainEntry.id == entry_id, BrainEntry.org_id == org.id)
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain entry '{entry_id}' not found",
        )
    return _brain_response(entry)


@router.put("/{entry_id}", response_model=BrainEntryResponse)
async def update_brain_entry(
    entry_id: str,
    payload: BrainEntryUpdate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Update a brain entry."""
    result = await db.execute(
        select(BrainEntry).where(
            and_(BrainEntry.id == entry_id, BrainEntry.org_id == org.id)
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain entry '{entry_id}' not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        # Map metadata schema field to metadata_ ORM field
        if field == "metadata":
            entry.metadata_ = value
        else:
            setattr(entry, field, value)

    await db.flush()
    await db.refresh(entry)
    return _brain_response(entry)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brain_entry(
    entry_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Delete a brain entry."""
    result = await db.execute(
        select(BrainEntry).where(
            and_(BrainEntry.id == entry_id, BrainEntry.org_id == org.id)
        )
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brain entry '{entry_id}' not found",
        )
    await db.delete(entry)
    await db.flush()


@router.post("/search", response_model=BrainSearchResponse)
async def search_brain(
    payload: BrainSearchRequest,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Search brain entries by query text (title + content substring match).

    For production, replace with vector similarity search (pgvector / Qdrant).
    """
    query_lower = f"%{payload.query.lower()}%"

    filters = [
        BrainEntry.org_id == org.id,
        or_(
            func.lower(BrainEntry.title).like(query_lower),
            func.lower(BrainEntry.content).like(query_lower),
        ),
    ]
    if payload.entry_type:
        filters.append(BrainEntry.entry_type == (
            payload.entry_type.value if hasattr(payload.entry_type, "value") else payload.entry_type
        ))

    count_result = await db.execute(
        select(func.count(BrainEntry.id)).where(and_(*filters))
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(BrainEntry)
        .where(and_(*filters))
        .order_by(BrainEntry.updated_at.desc())
        .limit(payload.limit)
    )
    entries = result.scalars().all()

    return BrainSearchResponse(
        entries=[_brain_response(e) for e in entries],
        total=total,
    )
