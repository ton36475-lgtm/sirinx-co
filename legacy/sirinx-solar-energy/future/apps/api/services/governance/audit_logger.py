"""Audit logger — log all significant events."""
from __future__ import annotations
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

class AuditLogger:
    """Logs significant system events to the audit_events table."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        org_id: str,
        event_type: str,
        action: str,
        details: dict | None = None,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> str:
        """Log an audit event and return its ID."""
        from apps.api.models.audit import AuditEvent
        from packages.core.utils import new_uuid

        event = AuditEvent(
            id=new_uuid(),
            org_id=org_id,
            event_type=event_type,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            details=details or {},
            ip_address=ip_address,
        )
        self.db.add(event)
        try:
            await self.db.flush()
        except Exception as e:
            logger.error(f"Failed to flush audit event: {e}")
            # Don't raise — audit failure should not block main flow
        return event.id

    async def log_task_created(self, org_id: str, task_id: str, user_id: Optional[str] = None):
        await self.log(
            org_id=org_id,
            event_type="task_created",
            action="Task created",
            resource_type="task",
            resource_id=task_id,
            user_id=user_id,
            details={"task_id": task_id},
        )

    async def log_user_added(self, org_id: str, user_email: str, role: str, added_by: Optional[str] = None):
        await self.log(
            org_id=org_id,
            event_type="user_added",
            action=f"User '{user_email}' added with role '{role}'",
            user_id=added_by,
            details={"email": user_email, "role": role},
        )

    async def log_policy_triggered(self, org_id: str, policy_name: str, action: str, result: str):
        await self.log(
            org_id=org_id,
            event_type="policy_triggered",
            action=f"Policy '{policy_name}' triggered for action '{action}': {result}",
            details={"policy": policy_name, "action": action, "result": result},
        )

    async def log_budget_alert(self, org_id: str, budget_name: str, utilization: float):
        await self.log(
            org_id=org_id,
            event_type="budget_alert",
            action=f"Budget '{budget_name}' at {utilization:.1%} utilization",
            details={"budget_name": budget_name, "utilization": utilization},
        )
