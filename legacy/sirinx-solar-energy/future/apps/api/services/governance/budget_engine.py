"""Budget engine — check and deduct budgets before/after LLM calls."""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

logger = logging.getLogger(__name__)

class BudgetEngine:
    """Tracks and enforces budget limits for LLM usage."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_current_month_usage(self, budget_id: str) -> float:
        """Get total cost for the current calendar month."""
        from apps.api.models.budget import BudgetUsage

        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        result = await self.db.execute(
            select(func.sum(BudgetUsage.cost_usd)).where(
                and_(
                    BudgetUsage.budget_id == budget_id,
                    BudgetUsage.created_at >= month_start,
                )
            )
        )
        total = result.scalar_one_or_none()
        return float(total or 0.0)

    async def check_budget(
        self,
        org_id: str,
        estimated_cost: float,
        task_run_id: Optional[str] = None,
    ) -> dict:
        """Check if there is sufficient budget. Returns status dict."""
        from apps.api.models.budget import Budget

        result = await self.db.execute(
            select(Budget).where(Budget.org_id == org_id)
        )
        budgets = result.scalars().all()

        if not budgets:
            # No budget configured → allow
            return {"allowed": True, "reason": "No budget configured"}

        for budget in budgets:
            current_usage = await self.get_current_month_usage(budget.id)
            remaining = budget.monthly_limit - current_usage

            if estimated_cost > remaining:
                return {
                    "allowed": False,
                    "reason": f"Budget '{budget.name}' exceeded: need ${estimated_cost:.4f}, available ${remaining:.4f}",
                    "budget_id": budget.id,
                }

            # Check alert threshold
            utilization = (current_usage + estimated_cost) / budget.monthly_limit if budget.monthly_limit > 0 else 0
            if utilization > budget.alert_threshold:
                logger.warning(f"Budget '{budget.name}' at {utilization:.1%} utilization")

            # Check per-task limit
            if estimated_cost > budget.task_limit:
                return {
                    "allowed": False,
                    "reason": f"Estimated cost ${estimated_cost:.4f} exceeds task limit ${budget.task_limit:.4f}",
                    "budget_id": budget.id,
                }

        return {"allowed": True, "reason": "Budget available"}

    async def record_usage(
        self,
        org_id: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        cost_usd: float,
        task_run_id: Optional[str] = None,
    ) -> Optional[str]:
        """Record a usage event against the org budget."""
        from apps.api.models.budget import Budget, BudgetUsage
        from packages.core.utils import new_uuid

        result = await self.db.execute(
            select(Budget).where(Budget.org_id == org_id).limit(1)
        )
        budget = result.scalar_one_or_none()
        if not budget:
            return None

        usage = BudgetUsage(
            id=new_uuid(),
            budget_id=budget.id,
            task_run_id=task_run_id,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost_usd,
        )
        self.db.add(usage)
        await self.db.flush()
        return usage.id

    async def get_org_summary(self, org_id: str) -> list[dict]:
        """Get budget summary for all budgets in an org."""
        from apps.api.models.budget import Budget

        result = await self.db.execute(
            select(Budget).where(Budget.org_id == org_id)
        )
        budgets = result.scalars().all()

        summaries = []
        for budget in budgets:
            usage = await self.get_current_month_usage(budget.id)
            remaining = budget.monthly_limit - usage
            utilization = (usage / budget.monthly_limit * 100) if budget.monthly_limit > 0 else 0
            summaries.append({
                "budget_id": budget.id,
                "name": budget.name,
                "monthly_limit": budget.monthly_limit,
                "current_usage": usage,
                "remaining": remaining,
                "utilization_pct": round(utilization, 2),
                "alert_threshold": budget.alert_threshold,
                "at_risk": utilization / 100 >= budget.alert_threshold,
            })
        return summaries
