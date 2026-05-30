"""Policy CRUD router."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.dependencies import get_current_org
from apps.api.models import Org, Policy, PolicyRule
from packages.schemas.policy import (
    PolicyCreate,
    PolicyUpdate,
    PolicyResponse,
    PolicyRuleSchema,
)
from packages.schemas.org import PaginatedResponse
from packages.core.utils import build_pagination, new_uuid

router = APIRouter()


async def _policy_response(policy: Policy, db: AsyncSession) -> PolicyResponse:
    """Build PolicyResponse with rules loaded."""
    rules_result = await db.execute(
        select(PolicyRule).where(PolicyRule.policy_id == policy.id)
    )
    rules = rules_result.scalars().all()

    rule_schemas = [
        PolicyRuleSchema(
            id=r.id,
            condition=r.condition,
            action=r.action,
            risk_level=r.risk_level,
            parameters=r.parameters or {},
        )
        for r in rules
    ]

    resp = PolicyResponse.model_validate(policy)
    resp.rules = rule_schemas
    return resp


@router.get("", response_model=PaginatedResponse[PolicyResponse])
async def list_policies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List policies for the current org."""
    pagination = build_pagination(page, page_size)

    count_result = await db.execute(
        select(func.count(Policy.id)).where(Policy.org_id == org.id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(Policy)
        .where(Policy.org_id == org.id)
        .order_by(Policy.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    policies = result.scalars().all()

    items = []
    for policy in policies:
        items.append(await _policy_response(policy, db))

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=items,
    )


@router.post("", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(
    payload: PolicyCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Create a new policy with its rules."""
    policy = Policy(
        org_id=org.id,
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(policy)
    await db.flush()  # Assign policy.id

    for rule_schema in payload.rules:
        rule = PolicyRule(
            id=rule_schema.id or new_uuid(),
            policy_id=policy.id,
            condition=rule_schema.condition,
            action=rule_schema.action.value if hasattr(rule_schema.action, "value") else rule_schema.action,
            risk_level=rule_schema.risk_level.value if hasattr(rule_schema.risk_level, "value") else rule_schema.risk_level,
            parameters=rule_schema.parameters or {},
        )
        db.add(rule)

    await db.flush()
    await db.refresh(policy)
    return await _policy_response(policy, db)


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a policy with its rules."""
    result = await db.execute(
        select(Policy).where(
            and_(Policy.id == policy_id, Policy.org_id == org.id)
        )
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found",
        )
    return await _policy_response(policy, db)


@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: str,
    payload: PolicyUpdate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Update a policy and optionally replace all its rules."""
    result = await db.execute(
        select(Policy).where(
            and_(Policy.id == policy_id, Policy.org_id == org.id)
        )
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found",
        )

    update_data = payload.model_dump(exclude_unset=True, exclude={"rules"})
    for field, value in update_data.items():
        if hasattr(value, "value"):
            value = value.value
        setattr(policy, field, value)

    # Replace rules if provided
    if payload.rules is not None:
        # Delete existing rules
        existing_rules = await db.execute(
            select(PolicyRule).where(PolicyRule.policy_id == policy_id)
        )
        for rule in existing_rules.scalars().all():
            await db.delete(rule)
        await db.flush()

        for rule_schema in payload.rules:
            rule = PolicyRule(
                id=rule_schema.id or new_uuid(),
                policy_id=policy.id,
                condition=rule_schema.condition,
                action=rule_schema.action.value if hasattr(rule_schema.action, "value") else rule_schema.action,
                risk_level=rule_schema.risk_level.value if hasattr(rule_schema.risk_level, "value") else rule_schema.risk_level,
                parameters=rule_schema.parameters or {},
            )
            db.add(rule)

    await db.flush()
    await db.refresh(policy)
    return await _policy_response(policy, db)


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    policy_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Delete a policy and its rules."""
    result = await db.execute(
        select(Policy).where(
            and_(Policy.id == policy_id, Policy.org_id == org.id)
        )
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found",
        )
    await db.delete(policy)
    await db.flush()


@router.post("/{policy_id}/toggle", response_model=PolicyResponse)
async def toggle_policy(
    policy_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Toggle is_active for a policy."""
    result = await db.execute(
        select(Policy).where(
            and_(Policy.id == policy_id, Policy.org_id == org.id)
        )
    )
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found",
        )
    policy.is_active = not policy.is_active
    await db.flush()
    await db.refresh(policy)
    return await _policy_response(policy, db)
