"""User CRUD router."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.dependencies import get_current_org
from apps.api.models import Org, OrgUser
from packages.schemas.org import (
    UserCreate,
    UserUpdate,
    UserResponse,
    PaginatedResponse,
)
from packages.core.utils import build_pagination

router = APIRouter()


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List active users for the current org."""
    pagination = build_pagination(page, page_size)

    count_result = await db.execute(
        select(func.count(OrgUser.id)).where(
            and_(OrgUser.org_id == org.id, OrgUser.is_active == True)
        )
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(OrgUser)
        .where(and_(OrgUser.org_id == org.id, OrgUser.is_active == True))
        .order_by(OrgUser.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    users = result.scalars().all()

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=[UserResponse.model_validate(u) for u in users],
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Add a new user to the current org."""
    # Email must be unique within org
    existing = await db.execute(
        select(OrgUser).where(
            and_(
                OrgUser.org_id == org.id,
                OrgUser.email == str(payload.email).lower(),
                OrgUser.is_active == True,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{payload.email}' already exists in this organisation",
        )

    user = OrgUser(
        org_id=org.id,
        email=str(payload.email).lower(),
        full_name=payload.full_name,
        role=payload.role.value if hasattr(payload.role, "value") else payload.role,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a user by ID."""
    result = await db.execute(
        select(OrgUser).where(
            and_(
                OrgUser.id == user_id,
                OrgUser.org_id == org.id,
                OrgUser.is_active == True,
            )
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found",
        )
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    payload: UserUpdate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role or full_name."""
    result = await db.execute(
        select(OrgUser).where(
            and_(
                OrgUser.id == user_id,
                OrgUser.org_id == org.id,
                OrgUser.is_active == True,
            )
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(value, "value"):
            value = value.value
        setattr(user, field, value)

    await db.flush()
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(
    user_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a user (soft delete)."""
    result = await db.execute(
        select(OrgUser).where(
            and_(
                OrgUser.id == user_id,
                OrgUser.org_id == org.id,
                OrgUser.is_active == True,
            )
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{user_id}' not found",
        )
    user.is_active = False
    await db.flush()
