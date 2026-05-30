"""Approval engine — create and route approval requests."""
from __future__ import annotations
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)

class ApprovalEngine:
    """Creates and manages approval requests for high-risk actions."""

    DEFAULT_EXPIRY_HOURS = 24

    def __init__(self, db: AsyncSession):
        self.db = db

    async def request_approval(
        self,
        org_id: str,
        action: str,
        risk_level: str,
        context: dict,
        requested_by: str,
        task_run_id: Optional[str] = None,
        expiry_hours: int = DEFAULT_EXPIRY_HOURS,
    ) -> str:
        """Create a new approval request and return its ID."""
        from apps.api.models.approval import ApprovalRequest
        from packages.core.utils import new_uuid

        approval = ApprovalRequest(
            id=new_uuid(),
            org_id=org_id,
            task_run_id=task_run_id,
            action=action,
            risk_level=risk_level,
            context=context,
            requested_by=requested_by,
            status="pending",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=expiry_hours),
        )
        self.db.add(approval)
        await self.db.flush()
        logger.info(f"Created approval request {approval.id} for action '{action}'")
        return approval.id

    async def process_decision(
        self,
        approval_id: str,
        decision: str,  # "approved" or "rejected"
        decided_by: str,
        reason: Optional[str] = None,
    ) -> bool:
        """Record an approval decision. Returns True if approved."""
        from apps.api.models.approval import ApprovalRequest, ApprovalDecision
        from packages.core.utils import new_uuid

        result = await self.db.execute(
            select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
        )
        approval = result.scalar_one_or_none()
        if not approval:
            raise ValueError(f"Approval request {approval_id} not found")

        if approval.status != "pending":
            raise ValueError(f"Approval {approval_id} is already {approval.status}")

        # Check expiry
        if approval.expires_at and datetime.now(timezone.utc) > approval.expires_at:
            approval.status = "expired"
            await self.db.flush()
            raise ValueError(f"Approval {approval_id} has expired")

        # Record decision
        dec = ApprovalDecision(
            id=new_uuid(),
            approval_id=approval_id,
            decision=decision,
            decided_by=decided_by,
            reason=reason,
        )
        self.db.add(dec)
        approval.status = decision
        await self.db.flush()

        logger.info(f"Approval {approval_id} decided: {decision} by {decided_by}")
        return decision == "approved"

    async def is_approved(self, approval_id: str) -> bool:
        """Check if an approval request has been approved."""
        from apps.api.models.approval import ApprovalRequest

        result = await self.db.execute(
            select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
        )
        approval = result.scalar_one_or_none()
        if not approval:
            return False
        return approval.status == "approved"

    async def expire_stale_approvals(self, org_id: str) -> int:
        """Mark expired pending approvals as expired. Returns count."""
        from apps.api.models.approval import ApprovalRequest
        from sqlalchemy import and_

        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(ApprovalRequest).where(
                and_(
                    ApprovalRequest.org_id == org_id,
                    ApprovalRequest.status == "pending",
                    ApprovalRequest.expires_at < now,
                )
            )
        )
        stale = result.scalars().all()
        for approval in stale:
            approval.status = "expired"
        await self.db.flush()
        return len(stale)
