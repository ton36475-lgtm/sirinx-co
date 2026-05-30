"""Pydantic v2 schemas for Task, TaskRun, TaskStep, and TaskArtifact resources."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from packages.core.types import ArtifactType, StepStatus, TaskPriority, TaskStatus


# ---------------------------------------------------------------------------
# TaskStep schemas
# ---------------------------------------------------------------------------


class TaskStepCreate(BaseModel):
    """Request body for recording a new execution step within a task run."""

    task_run_id: str = Field(..., description="Parent task run ID")
    step_number: int = Field(..., ge=1, description="1-based step sequence number")
    name: str = Field(..., min_length=1, max_length=200, description="Step display name")
    description: Optional[str] = Field(None, max_length=1000)
    tool: Optional[str] = Field(None, max_length=120, description="Tool invoked in this step (if any)")
    input_data: dict = Field(default_factory=dict, description="Inputs passed to this step")

    model_config = {"str_strip_whitespace": True}


class TaskStepUpdate(BaseModel):
    """Request body for updating a task step's outcome."""

    status: StepStatus = Field(..., description="Terminal or intermediate step status")
    output_data: Optional[dict] = Field(None, description="Structured output from this step")
    error_message: Optional[str] = Field(None, max_length=2000)
    tokens_used: int = Field(0, ge=0, description="Total tokens consumed by this step")
    cost_usd: float = Field(0.0, ge=0.0, description="Estimated cost in USD for this step")

    model_config = {"str_strip_whitespace": True}


class TaskStepResponse(BaseModel):
    """Task step resource returned by the API."""

    id: str
    task_run_id: str
    step_number: int
    name: str
    status: StepStatus
    tool: Optional[str] = None
    input_data: dict
    output_data: Optional[dict] = None
    error_message: Optional[str] = None
    tokens_used: int
    cost_usd: float
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# TaskArtifact schemas
# ---------------------------------------------------------------------------


class TaskArtifactCreate(BaseModel):
    """Request body for saving an artifact produced during a task run."""

    task_run_id: str = Field(..., description="Task run that produced this artifact")
    name: str = Field(..., min_length=1, max_length=200, description="Artifact display name")
    artifact_type: ArtifactType = Field(..., description="Artifact classification")
    content: str = Field(..., description="Artifact content (text, JSON, base64, etc.)")
    metadata: dict = Field(default_factory=dict, description="Arbitrary metadata (mime_type, size, etc.)")

    model_config = {"str_strip_whitespace": True}


class TaskArtifactResponse(BaseModel):
    """Task artifact resource returned by the API."""

    id: str
    task_run_id: str
    name: str
    artifact_type: ArtifactType
    content: str
    metadata: dict
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# TaskRun schemas
# ---------------------------------------------------------------------------


class TaskRunCreate(BaseModel):
    """Request body for triggering a new execution run of a task."""

    task_id: str = Field(..., description="Task to run")
    triggered_by: Optional[str] = Field(
        None,
        max_length=200,
        description="Who/what triggered this run (user ID, scheduler name, webhook, etc.)",
    )

    model_config = {"str_strip_whitespace": True}


class TaskRunResponse(BaseModel):
    """Task run resource returned by the API."""

    id: str
    task_id: str
    status: TaskStatus
    triggered_by: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_tokens: int = 0
    total_cost_usd: float = 0.0
    error_message: Optional[str] = None
    steps: list[TaskStepResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Task schemas
# ---------------------------------------------------------------------------


class TaskCreate(BaseModel):
    """Request body for creating a new task definition."""

    title: str = Field(..., min_length=2, max_length=200, description="Task display title")
    description: Optional[str] = Field(None, max_length=4000)
    org_id: str = Field(..., description="Owning organisation ID")
    workspace_id: Optional[str] = Field(None, description="Optional workspace scoping")
    priority: TaskPriority = Field(TaskPriority.NORMAL, description="Scheduling priority")
    input_data: dict = Field(
        default_factory=dict,
        description="Structured input data passed to the task at execution time",
    )
    max_steps: int = Field(
        20,
        ge=1,
        le=200,
        description="Maximum number of steps the runtime may execute before aborting",
    )
    budget_limit: Optional[float] = Field(
        None,
        gt=0,
        description="Per-run USD cost cap; overrides the org-level task_limit if set",
    )

    model_config = {"str_strip_whitespace": True}


class TaskUpdate(BaseModel):
    """Request body for partial update of a task definition."""

    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=4000)
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None

    model_config = {"str_strip_whitespace": True}


class TaskResponse(BaseModel):
    """Task definition resource returned by the API."""

    id: str
    title: str
    description: Optional[str] = None
    org_id: str
    workspace_id: Optional[str] = None
    priority: TaskPriority
    status: TaskStatus
    input_data: dict
    max_steps: int
    budget_limit: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    run_count: int = 0

    model_config = {"from_attributes": True}
