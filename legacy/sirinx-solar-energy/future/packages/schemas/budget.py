"""Pydantic v2 schemas for Budget and BudgetUsage resources."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, computed_field, model_validator


class BudgetCreate(BaseModel):
    """Request body for creating a spending budget for an organisation."""

    name: str = Field(..., min_length=2, max_length=120, description="Budget display name")
    org_id: str = Field(..., description="Owning organisation ID")
    monthly_limit: float = Field(
        ...,
        gt=0,
        description="Maximum spend allowed per calendar month (USD)",
    )
    task_limit: float = Field(
        5.0,
        gt=0,
        description="Maximum spend allowed per individual task run (USD)",
    )
    alert_threshold: float = Field(
        0.8,
        gt=0,
        le=1.0,
        description="Fraction of monthly_limit at which an alert event is emitted (0.0–1.0)",
    )
    currency: str = Field(
        "USD",
        min_length=3,
        max_length=3,
        description="ISO 4217 currency code; currently only USD is used for cost calculations",
    )

    model_config = {"str_strip_whitespace": True}


class BudgetUpdate(BaseModel):
    """Request body for partial update of a budget."""

    monthly_limit: Optional[float] = Field(None, gt=0)
    task_limit: Optional[float] = Field(None, gt=0)
    alert_threshold: Optional[float] = Field(None, gt=0, le=1.0)

    model_config = {"str_strip_whitespace": True}


class BudgetUsageCreate(BaseModel):
    """Request body for recording a LLM usage event against a budget."""

    budget_id: str = Field(..., description="Budget to charge against")
    task_run_id: Optional[str] = Field(None, description="Associated task run (nullable)")
    model: str = Field(..., min_length=1, max_length=120, description="Model identifier used")
    input_tokens: int = Field(..., ge=0, description="Number of prompt/input tokens consumed")
    output_tokens: int = Field(..., ge=0, description="Number of completion/output tokens generated")
    cost_usd: float = Field(..., ge=0, description="Calculated cost in USD for this call")

    model_config = {"str_strip_whitespace": True}


class BudgetResponse(BaseModel):
    """Budget resource with live utilisation metrics returned by the API."""

    id: str
    name: str
    org_id: str
    monthly_limit: float
    task_limit: float
    alert_threshold: float
    currency: str
    current_month_usage: float = Field(
        0.0, description="Total spend in the current calendar month (USD)"
    )
    remaining: float = Field(..., description="Remaining budget for the current month (USD)")
    utilization_pct: float = Field(
        ..., description="Current month usage as a percentage of monthly_limit (0–100)"
    )
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def compute_derived(cls, values):
        """Compute remaining and utilization_pct if not already set."""
        if isinstance(values, dict):
            monthly_limit = values.get("monthly_limit", 0.0)
            usage = values.get("current_month_usage", 0.0)
            if monthly_limit and monthly_limit > 0:
                values.setdefault("remaining", max(0.0, monthly_limit - usage))
                values.setdefault("utilization_pct", round((usage / monthly_limit) * 100, 2))
            else:
                values.setdefault("remaining", 0.0)
                values.setdefault("utilization_pct", 0.0)
        return values


class BudgetUsageResponse(BaseModel):
    """Individual LLM usage record returned by the API."""

    id: str
    budget_id: str
    task_run_id: Optional[str] = None
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float
    created_at: datetime

    model_config = {"from_attributes": True}
