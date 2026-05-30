"""Pack CRUD router."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.dependencies import get_current_org
from apps.api.models import Org, Pack, PackVersion
from packages.schemas.pack import (
    PackCreate,
    PackUpdate,
    PackResponse,
    PackVersionCreate,
    PackVersionResponse,
)
from packages.schemas.org import PaginatedResponse
from packages.core.utils import build_pagination

router = APIRouter()


def _latest_version(pack: Pack) -> Optional[PackVersion]:
    """Return the most-recently created version for a Pack ORM object."""
    if not pack.versions:
        return None
    return sorted(pack.versions, key=lambda v: v.created_at, reverse=True)[0]


async def _pack_response(pack: Pack, db: AsyncSession) -> PackResponse:
    """Build a PackResponse, loading versions if needed."""
    # Eagerly load versions if not already loaded
    if not hasattr(pack, "versions") or pack.versions is None:
        result = await db.execute(
            select(PackVersion)
            .where(PackVersion.pack_id == pack.id)
            .order_by(PackVersion.created_at.desc())
        )
        versions = result.scalars().all()
    else:
        versions = pack.versions

    latest = sorted(versions, key=lambda v: v.created_at, reverse=True)[0] if versions else None
    resp = PackResponse.model_validate(pack)
    resp.latest_version = PackVersionResponse.model_validate(latest) if latest else None
    return resp


@router.get("", response_model=PaginatedResponse[PackResponse])
async def list_packs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    pack_status: Optional[str] = Query(None, alias="status"),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List packs for the current org, optionally filtered by status."""
    pagination = build_pagination(page, page_size)

    base_filters = [Pack.org_id == org.id]
    if pack_status:
        base_filters.append(Pack.status == pack_status)

    count_result = await db.execute(
        select(func.count(Pack.id)).where(and_(*base_filters))
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Pack)
        .where(and_(*base_filters))
        .order_by(Pack.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    packs = result.scalars().all()

    items = []
    for pack in packs:
        # Load versions for each pack
        v_result = await db.execute(
            select(PackVersion)
            .where(PackVersion.pack_id == pack.id)
            .order_by(PackVersion.created_at.desc())
        )
        versions = v_result.scalars().all()
        latest = versions[0] if versions else None
        resp = PackResponse.model_validate(pack)
        resp.latest_version = PackVersionResponse.model_validate(latest) if latest else None
        items.append(resp)

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=items,
    )


@router.post("", response_model=PackResponse, status_code=status.HTTP_201_CREATED)
async def create_pack(
    payload: PackCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new pack and its initial PackVersion."""
    pack = Pack(
        org_id=org.id,
        name=payload.name,
        description=payload.description,
        status=payload.status.value if hasattr(payload.status, "value") else payload.status,
    )
    db.add(pack)
    await db.flush()  # Assign pack.id before creating version

    version = PackVersion(
        pack_id=pack.id,
        version=payload.version,
        config=payload.config,
        changelog="Initial version",
    )
    db.add(version)
    await db.flush()
    await db.refresh(pack)
    await db.refresh(version)

    resp = PackResponse.model_validate(pack)
    resp.latest_version = PackVersionResponse.model_validate(version)
    return resp


@router.get("/{pack_id}", response_model=PackResponse)
async def get_pack(
    pack_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a pack with its latest version."""
    result = await db.execute(
        select(Pack).where(and_(Pack.id == pack_id, Pack.org_id == org.id))
    )
    pack = result.scalar_one_or_none()
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pack '{pack_id}' not found",
        )

    v_result = await db.execute(
        select(PackVersion)
        .where(PackVersion.pack_id == pack.id)
        .order_by(PackVersion.created_at.desc())
    )
    versions = v_result.scalars().all()
    latest = versions[0] if versions else None

    resp = PackResponse.model_validate(pack)
    resp.latest_version = PackVersionResponse.model_validate(latest) if latest else None
    return resp


@router.put("/{pack_id}", response_model=PackResponse)
async def update_pack(
    pack_id: str,
    payload: PackUpdate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Update pack metadata (name, description, status)."""
    result = await db.execute(
        select(Pack).where(and_(Pack.id == pack_id, Pack.org_id == org.id))
    )
    pack = result.scalar_one_or_none()
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pack '{pack_id}' not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(value, "value"):
            value = value.value
        setattr(pack, field, value)

    await db.flush()
    await db.refresh(pack)

    v_result = await db.execute(
        select(PackVersion)
        .where(PackVersion.pack_id == pack.id)
        .order_by(PackVersion.created_at.desc())
    )
    versions = v_result.scalars().all()
    latest = versions[0] if versions else None

    resp = PackResponse.model_validate(pack)
    resp.latest_version = PackVersionResponse.model_validate(latest) if latest else None
    return resp


@router.post("/{pack_id}/versions", response_model=PackVersionResponse, status_code=status.HTTP_201_CREATED)
async def create_pack_version(
    pack_id: str,
    payload: PackVersionCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new version for an existing pack."""
    result = await db.execute(
        select(Pack).where(and_(Pack.id == pack_id, Pack.org_id == org.id))
    )
    pack = result.scalar_one_or_none()
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pack '{pack_id}' not found",
        )

    # Check for duplicate version string
    existing_v = await db.execute(
        select(PackVersion).where(
            and_(PackVersion.pack_id == pack_id, PackVersion.version == payload.version)
        )
    )
    if existing_v.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Version '{payload.version}' already exists for this pack",
        )

    version = PackVersion(
        pack_id=pack_id,
        version=payload.version,
        config=payload.config,
        changelog=payload.changelog,
    )
    db.add(version)
    await db.flush()
    await db.refresh(version)
    return PackVersionResponse.model_validate(version)


@router.get("/{pack_id}/versions", response_model=list[PackVersionResponse])
async def list_pack_versions(
    pack_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List all versions for a pack, newest first."""
    result = await db.execute(
        select(Pack).where(and_(Pack.id == pack_id, Pack.org_id == org.id))
    )
    pack = result.scalar_one_or_none()
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pack '{pack_id}' not found",
        )

    v_result = await db.execute(
        select(PackVersion)
        .where(PackVersion.pack_id == pack_id)
        .order_by(PackVersion.created_at.desc())
    )
    versions = v_result.scalars().all()
    return [PackVersionResponse.model_validate(v) for v in versions]
