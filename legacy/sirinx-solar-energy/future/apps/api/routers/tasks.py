"""Task management router."""
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.dependencies import get_current_org
from apps.api.models import Org, Task, TaskRun, TaskStep, TaskArtifact
from packages.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskRunCreate,
    TaskRunResponse,
    TaskStepResponse,
    TaskArtifactResponse,
)
from packages.schemas.org import PaginatedResponse
from packages.core.utils import build_pagination

logger = logging.getLogger(__name__)

router = APIRouter()


async def _run_response(run: TaskRun, db: AsyncSession) -> TaskRunResponse:
    """Build TaskRunResponse with steps loaded."""
    steps_result = await db.execute(
        select(TaskStep)
        .where(TaskStep.task_run_id == run.id)
        .order_by(TaskStep.step_number)
    )
    steps = steps_result.scalars().all()

    resp = TaskRunResponse.model_validate(run)
    resp.steps = [TaskStepResponse.model_validate(s) for s in steps]
    return resp


@router.get("", response_model=PaginatedResponse[TaskResponse])
async def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    task_status: str = Query(None, alias="status"),
    priority: str = Query(None),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List tasks for the current org, optionally filtered by status and priority."""
    pagination = build_pagination(page, page_size)

    filters = [Task.org_id == org.id]
    if task_status:
        filters.append(Task.status == task_status)
    if priority:
        filters.append(Task.priority == priority)

    count_result = await db.execute(
        select(func.count(Task.id)).where(and_(*filters))
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Task)
        .where(and_(*filters))
        .order_by(Task.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    tasks = result.scalars().all()

    items = []
    for task in tasks:
        run_count_result = await db.execute(
            select(func.count(TaskRun.id)).where(TaskRun.task_id == task.id)
        )
        run_count = run_count_result.scalar_one()
        resp = TaskResponse.model_validate(task)
        resp.run_count = run_count
        items.append(resp)

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=items,
    )


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task definition."""
    task = Task(
        org_id=org.id,
        workspace_id=payload.workspace_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority.value if hasattr(payload.priority, "value") else payload.priority,
        status="pending",
        input_data=payload.input_data,
        max_steps=payload.max_steps,
        budget_limit=payload.budget_limit,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)

    resp = TaskResponse.model_validate(task)
    resp.run_count = 0
    return resp


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a task with its run count."""
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.org_id == org.id)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    run_count_result = await db.execute(
        select(func.count(TaskRun.id)).where(TaskRun.task_id == task_id)
    )
    resp = TaskResponse.model_validate(task)
    resp.run_count = run_count_result.scalar_one()
    return resp


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Update a task definition."""
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.org_id == org.id)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(value, "value"):
            value = value.value
        setattr(task, field, value)

    await db.flush()
    await db.refresh(task)

    run_count_result = await db.execute(
        select(func.count(TaskRun.id)).where(TaskRun.task_id == task_id)
    )
    resp = TaskResponse.model_validate(task)
    resp.run_count = run_count_result.scalar_one()
    return resp


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_task(
    task_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Cancel/delete a task. Sets status to cancelled if it has runs, otherwise deletes."""
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.org_id == org.id)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    # Check if any runs exist
    run_count_result = await db.execute(
        select(func.count(TaskRun.id)).where(TaskRun.task_id == task_id)
    )
    if run_count_result.scalar_one() > 0:
        task.status = "cancelled"
        await db.flush()
    else:
        await db.delete(task)
        await db.flush()


@router.post("/{task_id}/run", response_model=TaskRunResponse, status_code=status.HTTP_201_CREATED)
async def run_task(
    task_id: str,
    payload: TaskRunCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new TaskRun and begin execution. Returns immediately with run record."""
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.org_id == org.id)
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    if task.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot run a cancelled task",
        )

    run = TaskRun(
        task_id=task_id,
        triggered_by=payload.triggered_by,
        status="pending",
        started_at=datetime.now(timezone.utc),
    )
    db.add(run)

    # Transition task status to executing
    task.status = "executing"

    await db.flush()
    await db.refresh(run)

    # Fire-and-forget orchestration placeholder.
    # In production, hand off to a background worker / Celery / Kairos here.
    logger.info(f"TaskRun {run.id} created for task {task_id} — orchestration TBD")

    return await _run_response(run, db)


@router.get("/{task_id}/runs", response_model=PaginatedResponse[TaskRunResponse])
async def list_task_runs(
    task_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List all runs for a task, newest first."""
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.org_id == org.id)
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    pagination = build_pagination(page, page_size)

    count_result = await db.execute(
        select(func.count(TaskRun.id)).where(TaskRun.task_id == task_id)
    )
    total = count_result.scalar_one()

    runs_result = await db.execute(
        select(TaskRun)
        .where(TaskRun.task_id == task_id)
        .order_by(TaskRun.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    runs = runs_result.scalars().all()

    items = []
    for run in runs:
        items.append(await _run_response(run, db))

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=items,
    )


@router.get("/{task_id}/runs/{run_id}", response_model=TaskRunResponse)
async def get_task_run(
    task_id: str,
    run_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific run with all its steps."""
    task_result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.org_id == org.id)
        )
    )
    if not task_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    run_result = await db.execute(
        select(TaskRun).where(
            and_(TaskRun.id == run_id, TaskRun.task_id == task_id)
        )
    )
    run = run_result.scalar_one_or_none()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TaskRun '{run_id}' not found",
        )

    return await _run_response(run, db)


@router.get("/{task_id}/runs/{run_id}/artifacts", response_model=list[TaskArtifactResponse])
async def list_run_artifacts(
    task_id: str,
    run_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List artifacts produced by a task run."""
    task_result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.org_id == org.id)
        )
    )
    if not task_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found",
        )

    run_result = await db.execute(
        select(TaskRun).where(
            and_(TaskRun.id == run_id, TaskRun.task_id == task_id)
        )
    )
    if not run_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TaskRun '{run_id}' not found",
        )

    artifacts_result = await db.execute(
        select(TaskArtifact)
        .where(TaskArtifact.task_run_id == run_id)
        .order_by(TaskArtifact.created_at.asc())
    )
    artifacts = artifacts_result.scalars().all()

    # Map metadata_ ORM field to metadata schema field
    responses = []
    for a in artifacts:
        data = {
            "id": a.id,
            "task_run_id": a.task_run_id,
            "name": a.name,
            "artifact_type": a.artifact_type,
            "content": a.content,
            "metadata": a.metadata_,
            "created_at": a.created_at,
        }
        responses.append(TaskArtifactResponse(**data))
    return responses
