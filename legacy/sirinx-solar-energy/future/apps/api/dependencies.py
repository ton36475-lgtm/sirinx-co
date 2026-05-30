"""FastAPI dependency injections."""
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .database import get_db
from .models.org import Org


async def get_current_org(
    x_org_id: Optional[str] = Header(None, alias="X-Org-ID"),
    db: AsyncSession = Depends(get_db),
) -> Org:
    """Resolve the current org from the X-Org-ID header."""
    if not x_org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Org-ID header is required",
        )
    result = await db.execute(
        select(Org).where(Org.id == x_org_id, Org.is_active == True)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization '{x_org_id}' not found",
        )
    return org


async def get_optional_org(
    x_org_id: Optional[str] = Header(None, alias="X-Org-ID"),
    db: AsyncSession = Depends(get_db),
) -> Optional[Org]:
    """Optionally resolve the current org."""
    if not x_org_id:
        return None
    result = await db.execute(
        select(Org).where(Org.id == x_org_id, Org.is_active == True)
    )
    return result.scalar_one_or_none()
