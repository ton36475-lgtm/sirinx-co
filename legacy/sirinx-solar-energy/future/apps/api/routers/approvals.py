"""Approval management router."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.dependencies import get_current_org
from apps.api.models import Org, ApprovalRequest, ApprovalDecision
from packages.schemas.approval import (
    ApprovalRequestCreate,
    ApprovalDecisionCreate,
    ApprovalRequestResponse,
    ApprovalDecisionResponse,
)
from packages.schemas.org import PaginatedResponse
from packages.core.utils import build_pagination

router = APIRouter()


@router.get("/pending", response_model=list[ApprovalRequestResponse])
async def list_pending_approvals(
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List all pending approval requests for the current org.

    NOTE: This route must be declared before /{approval_id} to avoid
    FastAPI treating 'pending' as a path parameter.
    """
    result = await db.execute(
        select(ApprovalRequest).where(
            and_(
                ApprovalRequest.org_id == org.id,
                ApprovalRequest.status == "pending",
            )
        ).order_by(ApprovalRequest.created_at.asc())
    )
    requests = result.scalars().all()
    return [ApprovalRequestResponse.model_validate(r) for r in requests]


@router.get("", response_model=PaginatedResponse[ApprovalRequestResponse])
async def list_approvals(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    approval_status: str = Query(None, alias="status"),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List approval requests for the current org, optionally filtered by status."""
    pagination = build_pagination(page, page_size)

    filters = [ApprovalRequest.org_id == org.id]
    if approval_status:
        filters.append(ApprovalRequest.status == approval_status)

    count_result = await db.execute(
        select(func.count(ApprovalRequest.id)).where(and_(*filters))
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(ApprovalRequest)
        .where(and_(*filters))
        .order_by(ApprovalRequest.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    requests = result.scalars().all()

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=[ApprovalRequestResponse.model_validate(r) for r in requests],
    )


@router.post("", response_model=ApprovalRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_approval_request(
    payload: ApprovalRequestCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new approval request."""
    approval = ApprovalRequest(
        org_id=org.id,
        task_run_id=payload.task_run_id,
        action=payload.action,
        risk_level=payload.risk_level.value if hasattr(payload.risk_level, "value") else payload.risk_level,
        context=payload.context or {},
        requested_by=payload.requested_by,
        status="pending",
    )
    db.add(approval)
    await db.flush()
    await db.refresh(approval)
    return ApprovalRequestResponse.model_validate(approval)


@router.get("/{approval_id}", response_model=ApprovalRequestResponse)
async def get_approval_request(
    approval_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get an approval request with its decisions."""
    result = await db.execute(
        select(ApprovalRequest).where(
            and_(
                ApprovalRequest.id == approval_id,
                ApprovalRequest.org_id == org.id,
            )
        )
    )
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request '{approval_id}' not found",
        )
    return ApprovalRequestResponse.model_validate(approval)


@router.post("/{approval_id}/decide", response_model=ApprovalDecisionResponse, status_code=status.HTTP_201_CREATED)
async def decide_approval(
    approval_id: str,
    payload: ApprovalDecisionCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Submit an approval decision (approve or reject).

    Updates the parent ApprovalRequest status to match the decision.
    """
    result = await db.execute(
        select(ApprovalRequest).where(
            and_(
                ApprovalRequest.id == approval_id,
                ApprovalRequest.org_id == org.id,
            )
        )
    )
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request '{approval_id}' not found",
        )

    if approval.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Approval request is already '{approval.status}' and cannot be decided again",
        )

    decision_value = payload.decision.value if hasattr(payload.decision, "value") else payload.decision
    if decision_value not in ("approved", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Decision must be 'approved' or 'rejected'",
        )

    decision = ApprovalDecision(
        approval_id=approval_id,
        decision=decision_value,
        decided_by=payload.decided_by,
        reason=payload.reason,
    )
    db.add(decision)

    # Mirror status onto the request
    approval.status = decision_value

    await db.flush()
    await db.refresh(decision)
    return ApprovalDecisionResponse.model_validate(decision)
