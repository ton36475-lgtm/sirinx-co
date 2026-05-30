"""Main task orchestrator — Plan → Execute → Review loop."""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)

class TaskOrchestrator:
    """Orchestrates the full task lifecycle: Plan → Execute → Review."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def run_task(self, task_run_id: str) -> dict:
        """Execute a full task run."""
        from apps.api.models.task import TaskRun, TaskStep, Task
        from apps.api.services.providers.registry import get_provider_registry
        from apps.api.services.runtime.planner import TaskPlanner
        from apps.api.services.runtime.executor import StepExecutor
        from apps.api.services.runtime.reviewer import OutputReviewer
        from apps.api.services.runtime.tool_registry import get_tool_registry
        from apps.api.services.governance.policy_engine import PolicyEngine
        from apps.api.services.governance.budget_engine import BudgetEngine
        from apps.api.services.governance.audit_logger import AuditLogger
        from apps.api.services.knowledge.brain_manager import BrainManager
        from packages.core.utils import new_uuid, utcnow

        # Load task run
        result = await self.db.execute(
            select(TaskRun).where(TaskRun.id == task_run_id)
        )
        task_run = result.scalar_one_or_none()
        if not task_run:
            raise ValueError(f"TaskRun {task_run_id} not found")

        # Load task
        result = await self.db.execute(
            select(Task).where(Task.id == task_run.task_id)
        )
        task = result.scalar_one_or_none()
        if not task:
            raise ValueError(f"Task {task_run.task_id} not found")

        audit_logger = AuditLogger(self.db)
        registry = get_tool_registry()

        async def update_run_status(status: str, error: Optional[str] = None):
            task_run.status = status
            if status in ("completed", "failed"):
                task_run.completed_at = utcnow()
            if error:
                task_run.error_message = error
            await self.db.flush()

        async def save_step(step_number: int, name: str, status: str, tool: Optional[str],
                            input_data: dict, output_data: Optional[dict], error: Optional[str],
                            tokens: int, cost: float):
            step = TaskStep(
                id=new_uuid(),
                task_run_id=task_run_id,
                step_number=step_number,
                name=name,
                status=status,
                tool=tool,
                input_data=input_data,
                output_data=output_data,
                error_message=error,
                tokens_used=tokens,
                cost_usd=cost,
                started_at=utcnow(),
                completed_at=utcnow(),
            )
            self.db.add(step)
            await self.db.flush()
            return step

        try:
            # 1. Update status to planning
            await update_run_status("planning")

            # 2. Get provider registry and providers
            provider_registry = get_provider_registry()
            planning_provider = provider_registry.get_provider_for_capability("planning")
            execution_provider = provider_registry.get_provider_for_capability("execution")
            review_provider = provider_registry.get_provider_for_capability("review")

            # 3. Get brain context
            brain_manager = BrainManager(self.db)
            brain_context = await brain_manager.get_context_for_task(
                org_id=task.org_id,
                task_description=task.description or task.title,
            )

            # 4. Plan
            planner = TaskPlanner(provider=planning_provider)
            plan = await planner.plan(
                task_title=task.title,
                task_description=task.description or task.title,
                input_data=task.input_data,
                available_tools=registry.to_llm_tools(),
                brain_context=brain_context,
                max_steps=task.max_steps,
            )

            # 5. Execute steps
            await update_run_status("executing")
            executor = StepExecutor(provider=execution_provider, tool_registry=registry)
            step_results = []
            total_tokens = 0
            total_cost = 0.0

            task_context = f"Task: {task.title}\n{task.description or ''}"

            for planned_step in plan.steps:
                step_result = await executor.execute_step(
                    step_number=planned_step.step_number,
                    step_name=planned_step.name,
                    step_description=planned_step.description,
                    tool=planned_step.tool,
                    input_data=planned_step.input_data,
                    task_context=task_context,
                )
                step_results.append(step_result)
                total_tokens += step_result.tokens_used
                total_cost += step_result.cost_usd

                await save_step(
                    step_number=planned_step.step_number,
                    name=planned_step.name,
                    status=step_result.status,
                    tool=planned_step.tool,
                    input_data=planned_step.input_data,
                    output_data=step_result.output_data,
                    error=step_result.error_message,
                    tokens=step_result.tokens_used,
                    cost=step_result.cost_usd,
                )

                if step_result.status == "failed":
                    logger.warning(f"Step {planned_step.step_number} failed: {step_result.error_message}")

            # 6. Review
            await update_run_status("reviewing")
            reviewer = OutputReviewer(provider=review_provider)
            review = await reviewer.review(
                task_title=task.title,
                task_description=task.description or task.title,
                plan=plan,
                step_results=step_results,
            )

            # 7. Finalize
            task_run.total_tokens = total_tokens
            task_run.total_cost_usd = total_cost
            final_status = "completed" if review.passed else "failed"
            await update_run_status(final_status)

            # 8. Update task status
            task.status = "completed" if review.passed else "failed"
            await self.db.flush()

            await audit_logger.log(
                org_id=task.org_id,
                event_type="task_completed" if review.passed else "task_failed",
                action=f"Task run {task_run_id} {'completed' if review.passed else 'failed'}",
                details={
                    "task_id": task.id,
                    "task_run_id": task_run_id,
                    "total_tokens": total_tokens,
                    "total_cost": total_cost,
                    "review_score": review.score,
                    "steps_executed": len(step_results),
                },
            )

            return {
                "task_run_id": task_run_id,
                "status": final_status,
                "steps_executed": len(step_results),
                "total_tokens": total_tokens,
                "total_cost_usd": total_cost,
                "review_score": review.score,
                "review_summary": review.summary,
            }

        except Exception as e:
            logger.error(f"Orchestrator error for run {task_run_id}: {e}", exc_info=True)
            await update_run_status("failed", str(e))
            raise
