"""Workspace CRUD router."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.dependencies import get_current_org
from apps.api.models import Org, Workspace
from packages.schemas.org import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    PaginatedResponse,
)
from packages.core.utils import build_pagination

router = APIRouter()


@router.get("", response_model=PaginatedResponse[WorkspaceResponse])
async def list_workspaces(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List all active workspaces for the current org."""
    pagination = build_pagination(page, page_size)

    count_result = await db.execute(
        select(func.count(Workspace.id)).where(
            and_(Workspace.org_id == org.id, Workspace.is_active == True)
        )
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Workspace)
        .where(and_(Workspace.org_id == org.id, Workspace.is_active == True))
        .order_by(Workspace.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    workspaces = result.scalars().all()

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=[WorkspaceResponse.model_validate(ws) for ws in workspaces],
    )


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new workspace within the current org."""
    # Check for duplicate name within org
    existing = await db.execute(
        select(Workspace).where(
            and_(
                Workspace.org_id == org.id,
                Workspace.name == payload.name,
                Workspace.is_active == True,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Workspace '{payload.name}' already exists in this organisation",
        )

    workspace = Workspace(
        org_id=org.id,
        name=payload.name,
        description=payload.description,
        is_active=True,
    )
    db.add(workspace)
    await db.flush()
    await db.refresh(workspace)
    return WorkspaceResponse.model_validate(workspace)


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a workspace by ID (must belong to current org)."""
    result = await db.execute(
        select(Workspace).where(
            and_(
                Workspace.id == workspace_id,
                Workspace.org_id == org.id,
                Workspace.is_active == True,
            )
        )
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workspace '{workspace_id}' not found",
        )
    return WorkspaceResponse.model_validate(workspace)


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    payload: WorkspaceUpdate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Partially update a workspace."""
    result = await db.execute(
        select(Workspace).where(
            and_(
                Workspace.id == workspace_id,
                Workspace.org_id == org.id,
                Workspace.is_active == True,
            )
        )
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workspace '{workspace_id}' not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workspace, field, value)

    await db.flush()
    await db.refresh(workspace)
    return WorkspaceResponse.model_validate(workspace)


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a workspace."""
    result = await db.execute(
        select(Workspace).where(
            and_(
                Workspace.id == workspace_id,
                Workspace.org_id == org.id,
                Workspace.is_active == True,
            )
        )
    )
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workspace '{workspace_id}' not found",
        )
    workspace.is_active = False
    await db.flush()
