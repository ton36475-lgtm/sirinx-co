"""Policy and PolicyRule models."""
from typing import Optional, List
from sqlalchemy import String, JSON, ForeignKey, Boolean, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin, new_uuid

class Policy(TimestampMixin, Base):
    __tablename__ = "policies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("orgs.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    rules: Mapped[List["PolicyRule"]] = relationship("PolicyRule", back_populates="policy", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_policies_org_active", "org_id", "is_active"),
    )

class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    policy_id: Mapped[str] = mapped_column(String(36), ForeignKey("policies.id", ondelete="CASCADE"), nullable=False, index=True)
    condition: Mapped[str] = mapped_column(String(500), nullable=False)
    action: Mapped[str] = mapped_column(String(30), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="low")
    parameters: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    policy: Mapped["Policy"] = relationship("Policy", back_populates="rules")
