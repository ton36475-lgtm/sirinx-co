"""Template management for org-specific output templates."""
from __future__ import annotations
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)

DEFAULT_TEMPLATES = {
    "proposal": """# {company_name} Solar Energy Proposal

**Client:** {client_name}
**Date:** {date}
**Prepared by:** {prepared_by}

## Executive Summary
{executive_summary}

## System Design
- Capacity: {capacity_kwp} kWp
- Annual Generation: {annual_kwh} kWh
- Investment: {investment_thb} THB

## Financial Analysis
- Payback Period: {payback_years} years
- NPV (10 years): {npv_thb} THB
- IRR: {irr_pct}%

## Next Steps
{next_steps}
""",
    "report": """# {report_title}

**Period:** {period}
**Generated:** {generated_at}

## Summary
{summary}

## Key Metrics
{metrics}

## Analysis
{analysis}

## Recommendations
{recommendations}
""",
    "email": """Subject: {subject}

Dear {recipient_name},

{body}

Best regards,
{sender_name}
{sender_title}
{company_name}
""",
}

class TemplateManager:
    """Manages org-specific templates stored in Company Brain."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_template(self, org_id: str, template_name: str) -> Optional[str]:
        """Get a template by name — org-specific first, then default."""
        from apps.api.models.brain import BrainEntry

        # Try org-specific template
        result = await self.db.execute(
            select(BrainEntry).where(
                BrainEntry.org_id == org_id,
                BrainEntry.entry_type == "template",
                BrainEntry.title == template_name,
            )
        )
        entry = result.scalar_one_or_none()
        if entry:
            return entry.content

        # Fall back to default
        return DEFAULT_TEMPLATES.get(template_name)

    async def render_template(self, org_id: str, template_name: str, variables: dict) -> str:
        """Get and render a template with the given variables."""
        template = await self.get_template(org_id, template_name)
        if not template:
            raise ValueError(f"Template '{template_name}' not found")
        try:
            return template.format(**variables)
        except KeyError as e:
            raise ValueError(f"Template variable missing: {e}")

    async def list_available_templates(self, org_id: str) -> list[str]:
        """List all available template names (org + defaults)."""
        from apps.api.models.brain import BrainEntry
        result = await self.db.execute(
            select(BrainEntry.title).where(
                BrainEntry.org_id == org_id,
                BrainEntry.entry_type == "template",
            )
        )
        org_templates = [row[0] for row in result.all()]
        all_templates = list(set(list(DEFAULT_TEMPLATES.keys()) + org_templates))
        return sorted(all_templates)

    async def save_template(self, org_id: str, name: str, content: str) -> str:
        """Save or update an org template."""
        from apps.api.models.brain import BrainEntry
        from packages.core.utils import new_uuid

        result = await self.db.execute(
            select(BrainEntry).where(
                BrainEntry.org_id == org_id,
                BrainEntry.entry_type == "template",
                BrainEntry.title == name,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.content = content
            await self.db.flush()
            return existing.id
        else:
            entry = BrainEntry(
                id=new_uuid(),
                org_id=org_id,
                entry_type="template",
                title=name,
                content=content,
                tags=["template"],
                metadata_={},
            )
            self.db.add(entry)
            await self.db.flush()
            return entry.id
