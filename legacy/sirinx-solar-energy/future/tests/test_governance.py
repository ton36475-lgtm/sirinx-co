"""Tests for governance: policy, budget, approval, audit services."""
import pytest
from unittest.mock import AsyncMock

pytestmark = pytest.mark.asyncio


async def test_policy_engine_default_allow(db_session):
    """Test that policy engine allows when no policies exist for the org."""
    from apps.api.services.governance.policy_engine import PolicyEngine

    engine = PolicyEngine(db_session)
    decision = await engine.evaluate(
        org_id="nonexistent-org-id-123",
        action="read_file",
        context={},
    )
    assert decision.allowed is True
    assert "default allow" in decision.reason


async def test_policy_engine_deny_rule(db_session, sample_org):
    """Test that a DENY policy rule blocks a matching action."""
    from apps.api.models.policy import Policy, PolicyRule
    from packages.core.utils import new_uuid
    from apps.api.services.governance.policy_engine import PolicyEngine

    policy = Policy(
        id=new_uuid(),
        org_id=sample_org["id"],
        name="Block Commands",
        is_active=True,
    )
    rule = PolicyRule(
        id=new_uuid(),
        policy_id=policy.id,
        condition="execute_command",
        action="deny",
        risk_level="high",
        parameters={},
    )
    db_session.add(policy)
    db_session.add(rule)
    await db_session.commit()

    engine = PolicyEngine(db_session)
    decision = await engine.evaluate(
        org_id=sample_org["id"],
        action="execute_command:rm -rf",
        context={},
    )
    assert decision.allowed is False


async def test_policy_engine_allow_rule(db_session, sample_org):
    """Test that an ALLOW rule explicitly permits a matching action."""
    from apps.api.models.policy import Policy, PolicyRule
    from packages.core.utils import new_uuid
    from apps.api.services.governance.policy_engine import PolicyEngine

    policy = Policy(
        id=new_uuid(),
        org_id=sample_org["id"],
        name="Allow HTTP",
        is_active=True,
    )
    rule = PolicyRule(
        id=new_uuid(),
        policy_id=policy.id,
        condition="http_request",
        action="allow",
        risk_level="low",
        parameters={},
    )
    db_session.add(policy)
    db_session.add(rule)
    await db_session.commit()

    engine = PolicyEngine(db_session)
    decision = await engine.evaluate(
        org_id=sample_org["id"],
        action="http_request",
        context={},
    )
    assert decision.allowed is True


async def test_policy_engine_inactive_policy_ignored(db_session, sample_org):
    """Test that inactive policies do not affect decisions."""
    from apps.api.models.policy import Policy, PolicyRule
    from packages.core.utils import new_uuid
    from apps.api.services.governance.policy_engine import PolicyEngine

    policy = Policy(
        id=new_uuid(),
        org_id=sample_org["id"],
        name="Inactive Block",
        is_active=False,  # Inactive — should be ignored
    )
    rule = PolicyRule(
        id=new_uuid(),
        policy_id=policy.id,
        condition="execute_command",
        action="deny",
        risk_level="critical",
        parameters={},
    )
    db_session.add(policy)
    db_session.add(rule)
    await db_session.commit()

    engine = PolicyEngine(db_session)
    decision = await engine.evaluate(
        org_id=sample_org["id"],
        action="execute_command:ls",
        context={},
    )
    # No active policies → default allow
    assert decision.allowed is True


async def test_budget_engine_no_budget_allows(db_session, sample_org):
    """Test that budget check allows when no budget is configured."""
    from apps.api.services.governance.budget_engine import BudgetEngine

    engine = BudgetEngine(db_session)
    result = await engine.check_budget(
        org_id=sample_org["id"],
        estimated_cost=999.99,
    )
    assert result["allowed"] is True


async def test_budget_engine_records_usage(db_session, sample_org):
    """Test that budget usage is recorded and retrievable."""
    from apps.api.models.budget import Budget
    from packages.core.utils import new_uuid
    from apps.api.services.governance.budget_engine import BudgetEngine

    budget = Budget(
        id=new_uuid(),
        org_id=sample_org["id"],
        name="Test Budget",
        monthly_limit=100.0,
        task_limit=5.0,
        alert_threshold=0.8,
        currency="USD",
    )
    db_session.add(budget)
    await db_session.commit()

    engine = BudgetEngine(db_session)
    usage_id = await engine.record_usage(
        org_id=sample_org["id"],
        model="claude-sonnet-4-6",
        input_tokens=1000,
        output_tokens=500,
        cost_usd=0.05,
    )
    assert usage_id is not None

    month_usage = await engine.get_current_month_usage(budget.id)
    assert month_usage == pytest.approx(0.05, rel=1e-3)


async def test_budget_engine_blocks_over_limit(db_session, sample_org):
    """Test that budget engine blocks when estimated cost exceeds remaining budget."""
    from apps.api.models.budget import Budget, BudgetUsage
    from packages.core.utils import new_uuid
    from apps.api.services.governance.budget_engine import BudgetEngine
    from datetime import datetime, timezone

    budget = Budget(
        id=new_uuid(),
        org_id=sample_org["id"],
        name="Tight Budget",
        monthly_limit=1.0,    # Only $1 limit
        task_limit=0.50,
        alert_threshold=0.8,
        currency="USD",
    )
    db_session.add(budget)
    # Record $0.90 of existing usage
    usage = BudgetUsage(
        id=new_uuid(),
        budget_id=budget.id,
        model="claude-sonnet-4-6",
        input_tokens=10000,
        output_tokens=5000,
        cost_usd=0.90,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(usage)
    await db_session.commit()

    engine = BudgetEngine(db_session)
    # $0.20 estimate but only $0.10 remaining
    result = await engine.check_budget(
        org_id=sample_org["id"],
        estimated_cost=0.20,
    )
    assert result["allowed"] is False


async def test_approval_engine_create_and_approve(db_session, sample_org):
    """Test creating an approval request and approving it."""
    from apps.api.services.governance.approval_engine import ApprovalEngine

    engine = ApprovalEngine(db_session)

    approval_id = await engine.request_approval(
        org_id=sample_org["id"],
        action="delete_database",
        risk_level="critical",
        context={"table": "customers"},
        requested_by="system",
    )
    assert approval_id is not None

    result = await engine.process_decision(
        approval_id=approval_id,
        decision="approved",
        decided_by="admin@test.com",
        reason="Approved for maintenance",
    )
    assert result is True


async def test_approval_engine_reject(db_session, sample_org):
    """Test rejecting an approval request."""
    from apps.api.services.governance.approval_engine import ApprovalEngine

    engine = ApprovalEngine(db_session)
    approval_id = await engine.request_approval(
        org_id=sample_org["id"],
        action="sensitive_action",
        risk_level="high",
        context={},
        requested_by="user",
    )

    result = await engine.process_decision(
        approval_id=approval_id,
        decision="rejected",
        decided_by="admin@test.com",
        reason="Not authorized",
    )
    assert result is False


async def test_approval_engine_is_approved(db_session, sample_org):
    """Test is_approved helper returns correct value."""
    from apps.api.services.governance.approval_engine import ApprovalEngine

    engine = ApprovalEngine(db_session)
    approval_id = await engine.request_approval(
        org_id=sample_org["id"],
        action="some_action",
        risk_level="low",
        context={},
        requested_by="system",
    )

    # Not yet decided → not approved
    assert await engine.is_approved(approval_id) is False

    await engine.process_decision(
        approval_id=approval_id,
        decision="approved",
        decided_by="admin@test.com",
    )
    assert await engine.is_approved(approval_id) is True


async def test_approval_engine_double_decide_raises(db_session, sample_org):
    """Test that deciding on an already-decided approval raises ValueError."""
    from apps.api.services.governance.approval_engine import ApprovalEngine

    engine = ApprovalEngine(db_session)
    approval_id = await engine.request_approval(
        org_id=sample_org["id"],
        action="double_decide_test",
        risk_level="low",
        context={},
        requested_by="system",
    )

    await engine.process_decision(
        approval_id=approval_id,
        decision="approved",
        decided_by="admin@test.com",
    )

    with pytest.raises(ValueError, match="already"):
        await engine.process_decision(
            approval_id=approval_id,
            decision="rejected",
            decided_by="admin@test.com",
        )


async def test_audit_logger_creates_event(db_session, sample_org):
    """Test that audit logger creates a persisted AuditEvent."""
    from apps.api.services.governance.audit_logger import AuditLogger
    from apps.api.models.audit import AuditEvent
    from sqlalchemy import select

    logger_svc = AuditLogger(db_session)
    event_id = await logger_svc.log(
        org_id=sample_org["id"],
        event_type="test_event",
        action="Test action",
        details={"key": "value"},
        user_id="test-user",
    )
    await db_session.commit()

    assert event_id is not None

    result = await db_session.execute(
        select(AuditEvent).where(AuditEvent.id == event_id)
    )
    event = result.scalar_one_or_none()
    assert event is not None
    assert event.event_type == "test_event"
    assert event.org_id == sample_org["id"]
    assert event.details == {"key": "value"}
    assert event.user_id == "test-user"


async def test_audit_logger_task_created_helper(db_session, sample_org):
    """Test the log_task_created convenience method."""
    from apps.api.services.governance.audit_logger import AuditLogger
    from apps.api.models.audit import AuditEvent
    from packages.core.utils import new_uuid
    from sqlalchemy import select

    logger_svc = AuditLogger(db_session)
    task_id = new_uuid()
    await logger_svc.log_task_created(
        org_id=sample_org["id"],
        task_id=task_id,
        user_id="admin",
    )
    await db_session.commit()

    result = await db_session.execute(
        select(AuditEvent).where(AuditEvent.resource_id == task_id)
    )
    event = result.scalar_one_or_none()
    assert event is not None
    assert event.event_type == "task_created"
