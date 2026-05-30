"""BrainEntry model."""
from typing import Optional
from sqlalchemy import String, JSON, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, TimestampMixin, new_uuid

class BrainEntry(TimestampMixin, Base):
    __tablename__ = "brain_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("orgs.id", ondelete="CASCADE"), nullable=False, index=True)
    entry_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        Index("ix_brain_entries_org_type", "org_id", "entry_type"),
    )
