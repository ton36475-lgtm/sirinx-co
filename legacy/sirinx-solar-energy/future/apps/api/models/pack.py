"""Pack and PackVersion models."""
from typing import Optional, List
from sqlalchemy import String, JSON, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin, new_uuid

class Pack(TimestampMixin, Base):
    __tablename__ = "packs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("orgs.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", index=True)

    versions: Mapped[List["PackVersion"]] = relationship("PackVersion", back_populates="pack", cascade="all, delete-orphan", order_by="PackVersion.created_at.desc()")

    __table_args__ = (
        Index("ix_packs_org_id_status", "org_id", "status"),
    )

class PackVersion(TimestampMixin, Base):
    __tablename__ = "pack_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    pack_id: Mapped[str] = mapped_column(String(36), ForeignKey("packs.id", ondelete="CASCADE"), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    changelog: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    pack: Mapped["Pack"] = relationship("Pack", back_populates="versions")

    __table_args__ = (
        Index("ix_pack_versions_pack_version", "pack_id", "version", unique=True),
    )
