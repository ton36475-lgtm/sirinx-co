"""Kairos Scheduler — run periodic tasks."""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime, timezone
from typing import Callable, Awaitable, Optional

logger = logging.getLogger(__name__)

class ScheduledJob:
    def __init__(self, name: str, func: Callable[[], Awaitable[None]], interval_seconds: int):
        self.name = name
        self.func = func
        self.interval_seconds = interval_seconds
        self.last_run: Optional[datetime] = None
        self.run_count: int = 0
        self.error_count: int = 0

class KairosScheduler:
    """Runs periodic background jobs."""

    def __init__(self, db_factory):
        self.db_factory = db_factory
        self._jobs: list[ScheduledJob] = []
        self._running = False
        self._task: Optional[asyncio.Task] = None

    def add_job(self, name: str, func: Callable[[], Awaitable[None]], interval_seconds: int) -> None:
        self._jobs.append(ScheduledJob(name=name, func=func, interval_seconds=interval_seconds))
        logger.info(f"Scheduled job '{name}' every {interval_seconds}s")

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._register_default_jobs()
        self._task = asyncio.create_task(self._scheduler_loop())
        logger.info(f"Kairos Scheduler started with {len(self._jobs)} jobs")

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Kairos Scheduler stopped")

    async def _scheduler_loop(self) -> None:
        while self._running:
            now = datetime.now(timezone.utc)
            for job in self._jobs:
                if job.last_run is None:
                    due = True
                else:
                    elapsed = (now - job.last_run).total_seconds()
                    due = elapsed >= job.interval_seconds

                if due:
                    try:
                        await job.func()
                        job.last_run = now
                        job.run_count += 1
                        logger.debug(f"Job '{job.name}' completed (run #{job.run_count})")
                    except Exception as e:
                        job.error_count += 1
                        logger.error(f"Job '{job.name}' failed: {e}")

            await asyncio.sleep(10)  # Check every 10 seconds

    def _register_default_jobs(self) -> None:
        """Register built-in periodic jobs."""

        async def daily_brain_condensation():
            """Auto-Dream: condense recent task learnings daily."""
            logger.info("Running daily brain condensation (Auto-Dream)")
            # In full implementation, this would call AutoDream for recent task runs

        async def hourly_budget_check():
            """Check budget utilization across all orgs."""
            logger.info("Running hourly budget check")
            async with self.db_factory() as db:
                from apps.api.models.budget import Budget
                from apps.api.services.governance.budget_engine import BudgetEngine
                from sqlalchemy import select
                result = await db.execute(select(Budget))
                budgets = result.scalars().all()
                engine = BudgetEngine(db)
                for budget in budgets:
                    usage = await engine.get_current_month_usage(budget.id)
                    if budget.monthly_limit > 0:
                        util = usage / budget.monthly_limit
                        if util >= 0.9:
                            logger.warning(f"BUDGET CRITICAL: '{budget.name}' at {util:.1%}")
                await db.commit()

        self.add_job("daily-brain-condensation", daily_brain_condensation, 86400)  # 24 hours
        self.add_job("hourly-budget-check", hourly_budget_check, 3600)  # 1 hour

    def status(self) -> list[dict]:
        return [
            {
                "name": j.name,
                "interval_seconds": j.interval_seconds,
                "last_run": j.last_run.isoformat() if j.last_run else None,
                "run_count": j.run_count,
                "error_count": j.error_count,
            }
            for j in self._jobs
        ]
