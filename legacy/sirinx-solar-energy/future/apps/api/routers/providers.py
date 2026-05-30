"""ProviderConfig CRUD router. Raw API keys are never returned."""
import base64
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.database import get_db
from apps.api.dependencies import get_current_org
from apps.api.models import Org, ProviderConfig
from packages.schemas.provider import (
    ProviderConfigCreate,
    ProviderConfigUpdate,
    ProviderConfigResponse,
)
from packages.schemas.org import PaginatedResponse
from packages.core.utils import build_pagination, mask_secret

logger = logging.getLogger(__name__)

router = APIRouter()


def _encrypt_api_key(api_key: str) -> str:
    """Simple reversible encoding for the API key.

    In production, replace with a proper encryption library such as
    cryptography.fernet.Fernet.  This implementation uses base64 so the key
    is never stored as plaintext while remaining reversible for test calls.
    """
    return base64.b64encode(api_key.encode()).decode()


def _decrypt_api_key(encrypted: str) -> str:
    """Reverse of _encrypt_api_key."""
    try:
        return base64.b64decode(encrypted.encode()).decode()
    except Exception:
        return ""


def _build_response(provider: ProviderConfig) -> ProviderConfigResponse:
    """Build a ProviderConfigResponse with a masked API key."""
    raw_key = _decrypt_api_key(provider.api_key_encrypted)
    masked = mask_secret(raw_key, visible_chars=4) if raw_key else "****"
    return ProviderConfigResponse(
        id=provider.id,
        name=provider.name,
        org_id=provider.org_id,
        models=provider.models or [],
        capabilities=provider.capabilities or [],
        is_active=provider.is_active,
        priority=provider.priority,
        api_key_masked=masked,
        created_at=provider.created_at,
        updated_at=provider.updated_at,
    )


@router.get("", response_model=PaginatedResponse[ProviderConfigResponse])
async def list_providers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """List provider configs for the current org (keys masked)."""
    pagination = build_pagination(page, page_size)

    count_result = await db.execute(
        select(func.count(ProviderConfig.id)).where(
            ProviderConfig.org_id == org.id
        )
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(ProviderConfig)
        .where(ProviderConfig.org_id == org.id)
        .order_by(ProviderConfig.priority.desc(), ProviderConfig.created_at.desc())
        .offset(pagination["offset"])
        .limit(pagination["limit"])
    )
    providers = result.scalars().all()

    return PaginatedResponse(
        total=total,
        page=pagination["page"],
        page_size=pagination["page_size"],
        items=[_build_response(p) for p in providers],
    )


@router.post("", response_model=ProviderConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_provider(
    payload: ProviderConfigCreate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Register a new LLM provider config. The api_key is encrypted at rest."""
    provider = ProviderConfig(
        org_id=org.id,
        name=payload.name.value if hasattr(payload.name, "value") else payload.name,
        api_key_encrypted=_encrypt_api_key(payload.api_key),
        models=payload.models,
        capabilities=[c.value if hasattr(c, "value") else c for c in payload.capabilities],
        is_active=payload.is_active,
        priority=payload.priority,
        extra_config=payload.extra_config,
    )
    db.add(provider)
    await db.flush()
    await db.refresh(provider)
    return _build_response(provider)


@router.get("/{provider_id}", response_model=ProviderConfigResponse)
async def get_provider(
    provider_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Get a provider config (key masked)."""
    result = await db.execute(
        select(ProviderConfig).where(
            and_(
                ProviderConfig.id == provider_id,
                ProviderConfig.org_id == org.id,
            )
        )
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found",
        )
    return _build_response(provider)


@router.put("/{provider_id}", response_model=ProviderConfigResponse)
async def update_provider(
    provider_id: str,
    payload: ProviderConfigUpdate,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Update a provider config. If api_key is provided, it is re-encrypted."""
    result = await db.execute(
        select(ProviderConfig).where(
            and_(
                ProviderConfig.id == provider_id,
                ProviderConfig.org_id == org.id,
            )
        )
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    if "api_key" in update_data:
        provider.api_key_encrypted = _encrypt_api_key(update_data.pop("api_key"))

    if "capabilities" in update_data and update_data["capabilities"] is not None:
        update_data["capabilities"] = [
            c.value if hasattr(c, "value") else c for c in update_data["capabilities"]
        ]

    for field, value in update_data.items():
        if hasattr(value, "value"):
            value = value.value
        setattr(provider, field, value)

    await db.flush()
    await db.refresh(provider)
    return _build_response(provider)


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(
    provider_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Delete a provider config."""
    result = await db.execute(
        select(ProviderConfig).where(
            and_(
                ProviderConfig.id == provider_id,
                ProviderConfig.org_id == org.id,
            )
        )
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found",
        )
    await db.delete(provider)
    await db.flush()


@router.post("/{provider_id}/test")
async def test_provider(
    provider_id: str,
    org: Org = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    """Test provider connectivity by attempting a minimal generation call."""
    result = await db.execute(
        select(ProviderConfig).where(
            and_(
                ProviderConfig.id == provider_id,
                ProviderConfig.org_id == org.id,
            )
        )
    )
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found",
        )

    raw_key = _decrypt_api_key(provider.api_key_encrypted)
    provider_name = provider.name if isinstance(provider.name, str) else provider.name.value

    try:
        if provider_name == "anthropic":
            import anthropic
            client = anthropic.Anthropic(api_key=raw_key)
            msg = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
            )
            return {"status": "ok", "provider": provider_name, "response": msg.content[0].text}

        elif provider_name == "openai":
            from openai import OpenAI
            client = OpenAI(api_key=raw_key)
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
            )
            return {"status": "ok", "provider": provider_name, "response": resp.choices[0].message.content}

        elif provider_name == "google":
            import google.generativeai as genai
            genai.configure(api_key=raw_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            resp = model.generate_content("ping")
            return {"status": "ok", "provider": provider_name, "response": resp.text}

        else:
            return {"status": "skipped", "provider": provider_name, "detail": "No test implementation for this provider"}

    except Exception as exc:
        logger.warning(f"Provider test failed for {provider_id}: {exc}")
        return {
            "status": "error",
            "provider": provider_name,
            "detail": str(exc),
        }
