"""Org CRUD router."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.models import Org, Workspace
from packages.schemas.org import OrgCreate, OrgUpdate, OrgResponse, PaginatedResponse
from packages.core.utils import slugify, build_pagination

router = APIRouter()


@router.get("", response_model=PaginatedResponse[OrgResponse])
async def list_orgs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """List all active organisations (paginated)."""
    pagination = build_pagination(page, page_size)

    # Count total
    count_result = await db.execute(
        select(func.count(Org.id)).where(Org.is_active == True)
    )
    total = count_result.scalar_one()

    # Fetch page
    result = await db.execute(
        select(Org)
        .where(Org.is_active == True)
        .order_by(Org.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    orgs = result.scalars().all()

    # Attach workspace_count per org
    items = []
    for org in orgs:
        ws_count = await db.execute(
            select(func.count(Workspace.id)).where(
                and_(Workspace.org_id == org.id, Workspace.is_active == True)
            )
        )
        count = ws_count.scalar_one()
        resp = OrgResponse.model_validate(org)
        resp.workspace_count = count
        items.append(resp)

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=items,
    )


@router.post("", response_model=OrgResponse, status_code=status.HTTP_201_CREATED)
async def create_org(
    payload: OrgCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new organisation. Auto-generates slug from name if not provided."""
    # Ensure slug is set
    slug = payload.slug or slugify(payload.name)

    # Check slug uniqueness
    existing = await db.execute(select(Org).where(Org.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Organisation with slug '{slug}' already exists",
        )

    org = Org(
        name=payload.name,
        slug=slug,
        industry=payload.industry.value if hasattr(payload.industry, "value") else payload.industry,
        language=payload.language,
        timezone=payload.timezone,
        currency=payload.currency,
        brand_colors=payload.brand_colors,
        logo_url=payload.logo_url,
        is_active=True,
    )
    db.add(org)
    await db.flush()
    await db.refresh(org)

    resp = OrgResponse.model_validate(org)
    resp.workspace_count = 0
    return resp


@router.get("/{org_id}", response_model=OrgResponse)
async def get_org(
    org_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single organisation by ID."""
    result = await db.execute(
        select(Org).where(Org.id == org_id, Org.is_active == True)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organisation '{org_id}' not found",
        )

    ws_count = await db.execute(
        select(func.count(Workspace.id)).where(
            and_(Workspace.org_id == org.id, Workspace.is_active == True)
        )
    )
    resp = OrgResponse.model_validate(org)
    resp.workspace_count = ws_count.scalar_one()
    return resp


@router.put("/{org_id}", response_model=OrgResponse)
async def update_org(
    org_id: str,
    payload: OrgUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Partially update an organisation."""
    result = await db.execute(
        select(Org).where(Org.id == org_id, Org.is_active == True)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organisation '{org_id}' not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(value, "value"):
            value = value.value
        setattr(org, field, value)

    await db.flush()
    await db.refresh(org)

    ws_count = await db.execute(
        select(func.count(Workspace.id)).where(
            and_(Workspace.org_id == org.id, Workspace.is_active == True)
        )
    )
    resp = OrgResponse.model_validate(org)
    resp.workspace_count = ws_count.scalar_one()
    return resp


@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_org(
    org_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete an organisation by setting is_active=False."""
    result = await db.execute(
        select(Org).where(Org.id == org_id, Org.is_active == True)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organisation '{org_id}' not found",
        )
    org.is_active = False
    await db.flush()
