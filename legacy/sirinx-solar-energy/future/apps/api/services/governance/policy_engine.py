"""Policy engine — evaluate policies before any action."""
from __future__ import annotations
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)

class PolicyDecision:
    def __init__(self, allowed: bool, action: str, policy_name: str | None = None, reason: str = ""):
        self.allowed = allowed
        self.action = action
        self.policy_name = policy_name
        self.reason = reason
        self.requires_approval = False
        self.risk_level = "low"

    def __bool__(self):
        return self.allowed

class PolicyEngine:
    """Evaluates all active policies for an org before executing actions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def evaluate(
        self,
        org_id: str,
        action: str,
        context: dict | None = None,
    ) -> PolicyDecision:
        """Check if an action is allowed by all active policies."""
        from apps.api.models.policy import Policy, PolicyRule

        context = context or {}

        # Load all active policies for org
        result = await self.db.execute(
            select(Policy).where(Policy.org_id == org_id, Policy.is_active == True)
        )
        policies = result.scalars().all()

        for policy in policies:
            rules_result = await self.db.execute(
                select(PolicyRule).where(PolicyRule.policy_id == policy.id)
            )
            rules = rules_result.scalars().all()

            for rule in rules:
                decision = self._evaluate_rule(rule, action, context)
                if decision is not None:
                    logger.info(f"Policy '{policy.name}' rule matched action '{action}': {decision}")
                    result_obj = PolicyDecision(
                        allowed=(decision == "allow"),
                        action=action,
                        policy_name=policy.name,
                        reason=f"Policy '{policy.name}' rule: {rule.condition} → {decision}",
                    )
                    result_obj.requires_approval = (decision == "require_approval")
                    result_obj.risk_level = rule.risk_level
                    return result_obj

        # No matching rule → allow by default
        return PolicyDecision(allowed=True, action=action, reason="No matching policy rule — default allow")

    def _evaluate_rule(self, rule, action: str, context: dict) -> str | None:
        """Evaluate a single rule against the action. Returns action string or None if no match."""
        condition = rule.condition.lower()
        action_lower = action.lower()

        # Simple condition matching patterns
        patterns = {
            "execute_command": ["execute_command", "run_command", "shell"],
            "http_request": ["http_request", "external_request", "api_call"],
            "write_file": ["write_file", "file_write", "create_file"],
            "high_cost": ["high_cost", "expensive"],
            "delete": ["delete", "remove", "drop"],
            "admin": ["admin", "owner", "privileged"],
        }

        for pattern_key, keywords in patterns.items():
            if pattern_key in condition:
                if any(kw in action_lower for kw in keywords):
                    return rule.action

        # Direct action match
        if action_lower in condition or condition in action_lower:
            return rule.action

        return None  # No match

    async def check_tool_execution(self, org_id: str, tool_name: str) -> PolicyDecision:
        """Convenience method for checking tool execution policies."""
        return await self.evaluate(
            org_id=org_id,
            action=f"execute_tool:{tool_name}",
            context={"tool": tool_name},
        )
