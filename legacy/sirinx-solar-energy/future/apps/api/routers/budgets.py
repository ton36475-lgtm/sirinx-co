"""Budget CRUD router."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.dependencies import get_current_org
from apps.api.models import Org, Budget, BudgetUsage
from packages.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetUsageResponse,
)
from packages.schemas.org import PaginatedResponse
from packages.core.utils import build_pagination

router = APIRouter()


async def _current_month_usage(budget_id: str, db: AsyncSession) -> float:
    """Compute total cost_usd for the current calendar month."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(func.coalesce(func.sum(BudgetUsage.cost_usd), 0.0)).where(
            and_(
                BudgetUsage.budget_id == budget_id,
                BudgetUsage.created_at >= month_start,
            )
        )
    )
    return float(result.scalar_one())


def _build_response(budget: Budget, current_month_usage: float) -> BudgetResponse:
    """Build a BudgetResponse with computed utilisation fields."""
    monthly_limit = budget.monthly_limit or 0.0
    remaining = max(0.0, monthly_limit - current_month_usage)
    utilization_pct = round((current_month_usage / monthly_limit * 100), 2) if monthly_limit > 0 else 0.0

    return BudgetResponse(
        id=budget.id,
        name=budget.name,
        org_id=budget.org_id,
        monthly_limit=monthly_limit,
        task_limit=budget.task_limit,
        alert_threshold=budget.alert_threshold,
        currency=budget.currency,
        current_month_usage=current_month_usage,
        remaining=remaining,
        utilization_pct=utilization_pct,
        created_at=budget.created_at,
        updated_at=budget.updated_at,
    )


@router.get("", response_model=PaginatedResponse[BudgetResponse])
async def list_budgets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List budgets for the current org with current-month usage computed."""
    pagination = build_pagination(page, page_size)

    count_result = await db.execute(
        select(func.count(Budget.id)).where(Budget.org_id == org.id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Budget)
        .where(Budget.org_id == org.id)
        .order_by(Budget.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    budgets = result.scalars().all()

    items = []
    for budget in budgets:
        usage = await _current_month_usage(budget.id, db)
        items.append(_build_response(budget, usage))

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=items,
    )


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    payload: BudgetCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new budget for the current org."""
    budget = Budget(
        org_id=org.id,
        name=payload.name,
        monthly_limit=payload.monthly_limit,
        task_limit=payload.task_limit,
        alert_threshold=payload.alert_threshold,
        currency=payload.currency,
    )
    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    return _build_response(budget, 0.0)


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a budget with its current-month usage stats."""
    result = await db.execute(
        select(Budget).where(
            and_(Budget.id == budget_id, Budget.org_id == org.id)
        )
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget '{budget_id}' not found",
        )
    usage = await _current_month_usage(budget_id, db)
    return _build_response(budget, usage)


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    payload: BudgetUpdate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Update budget limits."""
    result = await db.execute(
        select(Budget).where(
            and_(Budget.id == budget_id, Budget.org_id == org.id)
        )
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget '{budget_id}' not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)

    await db.flush()
    await db.refresh(budget)
    usage = await _current_month_usage(budget_id, db)
    return _build_response(budget, usage)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Delete a budget and its usage records."""
    result = await db.execute(
        select(Budget).where(
            and_(Budget.id == budget_id, Budget.org_id == org.id)
        )
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget '{budget_id}' not found",
        )
    await db.delete(budget)
    await db.flush()


@router.get("/{budget_id}/usage", response_model=PaginatedResponse[BudgetUsageResponse])
async def list_budget_usage(
    budget_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List usage records for a budget, newest first (paginated)."""
    # Verify budget belongs to org
    budget_result = await db.execute(
        select(Budget).where(
            and_(Budget.id == budget_id, Budget.org_id == org.id)
        )
    )
    if not budget_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget '{budget_id}' not found",
        )

    pagination = build_pagination(page, page_size)

    count_result = await db.execute(
        select(func.count(BudgetUsage.id)).where(BudgetUsage.budget_id == budget_id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(BudgetUsage)
        .where(BudgetUsage.budget_id == budget_id)
        .order_by(BudgetUsage.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    usages = result.scalars().all()

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=[BudgetUsageResponse.model_validate(u) for u in usages],
    )
