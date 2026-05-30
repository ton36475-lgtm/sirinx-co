"""Company Brain CRUD and context retrieval."""
from __future__ import annotations
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

logger = logging.getLogger(__name__)

class BrainManager:
    """Manages Company Brain entries and retrieves context for tasks."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_context_for_task(
        self,
        org_id: str,
        task_description: str,
        max_entries: int = 5,
        entry_types: Optional[list[str]] = None,
    ) -> list[str]:
        """Retrieve relevant brain entries as context strings."""
        from apps.api.models.brain import BrainEntry

        query = select(BrainEntry).where(BrainEntry.org_id == org_id)

        if entry_types:
            query = query.where(BrainEntry.entry_type.in_(entry_types))

        # Simple keyword search on title and content
        words = task_description.lower().split()[:5]  # First 5 words
        if words:
            conditions = [
                or_(
                    func.lower(BrainEntry.title).contains(word),
                    func.lower(BrainEntry.content).contains(word),
                )
                for word in words
            ]
            # Get entries matching any word
            query = query.where(or_(*conditions))

        query = query.order_by(BrainEntry.updated_at.desc()).limit(max_entries)
        result = await self.db.execute(query)
        entries = result.scalars().all()

        context_strings = []
        for entry in entries:
            context_strings.append(
                f"[{entry.entry_type.upper()}] {entry.title}:\n{entry.content[:1000]}"
            )

        return context_strings

    async def create_entry(self, org_id: str, entry_type: str, title: str,
                           content: str, tags: list[str] | None = None,
                           source: str | None = None) -> str:
        """Create a new brain entry and return its ID."""
        from apps.api.models.brain import BrainEntry
        from packages.core.utils import new_uuid

        entry = BrainEntry(
            id=new_uuid(),
            org_id=org_id,
            entry_type=entry_type,
            title=title,
            content=content,
            tags=tags or [],
            metadata_={},
            source=source,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry.id

    async def search(self, org_id: str, query: str, entry_type: Optional[str] = None,
                     limit: int = 10) -> list:
        """Search brain entries by text."""
        from apps.api.models.brain import BrainEntry

        stmt = select(BrainEntry).where(
            BrainEntry.org_id == org_id,
            or_(
                func.lower(BrainEntry.title).contains(query.lower()),
                func.lower(BrainEntry.content).contains(query.lower()),
            )
        )
        if entry_type:
            stmt = stmt.where(BrainEntry.entry_type == entry_type)

        stmt = stmt.order_by(BrainEntry.updated_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all()
