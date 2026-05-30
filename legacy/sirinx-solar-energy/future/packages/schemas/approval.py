"""Pydantic v2 schemas for ApprovalRequest and ApprovalDecision resources."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from packages.core.types import ApprovalStatus, PolicyRiskLevel


class ApprovalRequestCreate(BaseModel):
    """Request body for creating a new human-approval request.

    Typically generated automatically by the policy engine when a
    REQUIRE_APPROVAL rule is triggered during task execution.
    """

    org_id: str = Field(..., description="Owning organisation ID")
    task_run_id: Optional[str] = Field(
        None, description="Task run that triggered this approval request (if any)"
    )
    action: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Human-readable description of the action awaiting approval",
    )
    risk_level: PolicyRiskLevel = Field(
        ..., description="Risk classification used to determine approval routing"
    )
    context: dict = Field(
        default_factory=dict,
        description="Structured context data to help approvers make an informed decision",
    )
    requested_by: str = Field(
        ...,
        max_length=200,
        description="User ID or system identifier that triggered the approval request",
    )

    model_config = {"str_strip_whitespace": True}


class ApprovalDecisionCreate(BaseModel):
    """Request body for submitting an approval decision."""

    approval_id: str = Field(..., description="Approval request being decided")
    decision: ApprovalStatus = Field(
        ...,
        description="Decision outcome; must be APPROVED or REJECTED (not PENDING or EXPIRED)",
    )
    decided_by: str = Field(
        ...,
        max_length=200,
        description="User ID or identifier of the person making the decision",
    )
    reason: Optional[str] = Field(
        None,
        max_length=2000,
        description="Optional explanation for the decision (required when rejecting)",
    )

    model_config = {"str_strip_whitespace": True}


class ApprovalRequestResponse(BaseModel):
    """Approval request resource returned by the API."""

    id: str
    org_id: str
    task_run_id: Optional[str] = None
    action: str
    risk_level: PolicyRiskLevel
    context: dict
    requested_by: str
    status: ApprovalStatus
    created_at: datetime
    expires_at: Optional[datetime] = Field(
        None,
        description="Datetime after which the request is automatically marked EXPIRED",
    )

    model_config = {"from_attributes": True}


class ApprovalDecisionResponse(BaseModel):
    """Approval decision record returned by the API."""

    id: str
    approval_id: str
    decision: ApprovalStatus
    decided_by: str
    reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
