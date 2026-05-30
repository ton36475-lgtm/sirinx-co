"""Pydantic v2 schemas for Policy and PolicyRule governance resources."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from packages.core.types import PolicyAction, PolicyRiskLevel


# ---------------------------------------------------------------------------
# PolicyRule (embedded schema, not a top-level resource)
# ---------------------------------------------------------------------------


class PolicyRuleSchema(BaseModel):
    """A single rule within a governance policy.

    Rules are evaluated in order; the first matching rule wins.
    """

    id: Optional[str] = Field(
        None,
        description="Optional rule identifier (auto-assigned if omitted)",
    )
    condition: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description=(
            "Boolean expression or natural-language condition that triggers this rule. "
            "Examples: 'action == \"send_email\"', 'cost_usd > 1.0', 'tool in [\"web_search\"]'"
        ),
    )
    action: PolicyAction = Field(..., description="What to do when the condition matches")
    risk_level: PolicyRiskLevel = Field(
        ..., description="Risk classification used for audit and approval routing"
    )
    parameters: dict = Field(
        default_factory=dict,
        description="Additional rule-specific parameters (e.g. approval_timeout_minutes, notify_channels)",
    )

    model_config = {"str_strip_whitespace": True}


# ---------------------------------------------------------------------------
# Policy schemas
# ---------------------------------------------------------------------------


class PolicyCreate(BaseModel):
    """Request body for creating a new governance policy."""

    name: str = Field(..., min_length=2, max_length=120, description="Human-readable policy name")
    description: Optional[str] = Field(None, max_length=1000)
    org_id: str = Field(..., description="Owning organisation ID")
    is_active: bool = Field(True, description="Whether this policy is enforced immediately")
    rules: list[PolicyRuleSchema] = Field(
        ..., min_length=1, description="Ordered list of policy rules (evaluated top-to-bottom)"
    )

    model_config = {"str_strip_whitespace": True}


class PolicyUpdate(BaseModel):
    """Request body for partial update of a policy."""

    name: Optional[str] = Field(None, min_length=2, max_length=120)
    description: Optional[str] = Field(None, max_length=1000)
    is_active: Optional[bool] = None
    rules: Optional[list[PolicyRuleSchema]] = None

    model_config = {"str_strip_whitespace": True}


class PolicyResponse(BaseModel):
    """Policy resource representation returned by the API."""

    id: str
    name: str
    description: Optional[str] = None
    org_id: str
    is_active: bool
    rules: list[PolicyRuleSchema]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
