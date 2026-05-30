"""Kairos Monitor — watch for events (budget alerts, approval timeouts, task failures)."""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

class KairosMonitor:
    """Background event monitor for the Kairos system."""

    def __init__(self, db_factory):
        self.db_factory = db_factory
        self._running = False
        self._task: Optional[asyncio.Task] = None

    async def start(self, interval_seconds: int = 60) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._monitor_loop(interval_seconds))
        logger.info(f"Kairos Monitor started (interval: {interval_seconds}s)")

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Kairos Monitor stopped")

    async def _monitor_loop(self, interval: int) -> None:
        while self._running:
            try:
                await self._run_checks()
            except Exception as e:
                logger.error(f"Kairos monitor check failed: {e}")
            await asyncio.sleep(interval)

    async def _run_checks(self) -> None:
        async with self.db_factory() as db:
            await self._check_budget_alerts(db)
            await self._check_stale_approvals(db)
            await self._check_stuck_tasks(db)

    async def _check_budget_alerts(self, db) -> None:
        """Check all budgets for alert threshold breaches."""
        from apps.api.models.budget import Budget
        from apps.api.services.governance.budget_engine import BudgetEngine
        from apps.api.services.governance.audit_logger import AuditLogger
        from sqlalchemy import select

        result = await db.execute(select(Budget))
        budgets = result.scalars().all()

        engine = BudgetEngine(db)
        audit = AuditLogger(db)

        for budget in budgets:
            usage = await engine.get_current_month_usage(budget.id)
            if budget.monthly_limit > 0:
                utilization = usage / budget.monthly_limit
                if utilization >= budget.alert_threshold:
                    logger.warning(f"Budget '{budget.name}' at {utilization:.1%}")
                    await audit.log_budget_alert(
                        org_id=budget.org_id,
                        budget_name=budget.name,
                        utilization=utilization,
                    )

        await db.commit()

    async def _check_stale_approvals(self, db) -> None:
        """Expire stale approval requests."""
        from apps.api.models.approval import ApprovalRequest
        from sqlalchemy import select, and_

        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(ApprovalRequest).where(
                and_(
                    ApprovalRequest.status == "pending",
                    ApprovalRequest.expires_at < now,
                )
            )
        )
        stale = result.scalars().all()
        for approval in stale:
            approval.status = "expired"
            logger.info(f"Expired stale approval: {approval.id}")

        if stale:
            await db.commit()

    async def _check_stuck_tasks(self, db) -> None:
        """Detect task runs stuck in non-terminal states for too long."""
        from apps.api.models.task import TaskRun
        from sqlalchemy import select, and_

        cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
        stuck_statuses = ["planning", "executing", "reviewing"]

        result = await db.execute(
            select(TaskRun).where(
                and_(
                    TaskRun.status.in_(stuck_statuses),
                    TaskRun.created_at < cutoff,
                )
            )
        )
        stuck = result.scalars().all()
        for run in stuck:
            logger.warning(f"Stuck task run detected: {run.id} (status: {run.status})")
            run.status = "failed"
            run.error_message = "Task run timed out (detected by Kairos monitor)"
            run.completed_at = datetime.now(timezone.utc)

        if stuck:
            await db.commit()
