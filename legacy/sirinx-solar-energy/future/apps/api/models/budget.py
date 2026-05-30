"""Budget and BudgetUsage models."""
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, Float, ForeignKey, Index, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin, new_uuid

class Budget(TimestampMixin, Base):
    __tablename__ = "budgets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("orgs.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    monthly_limit: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    task_limit: Mapped[float] = mapped_column(Float, nullable=False, default=5.0)
    alert_threshold: Mapped[float] = mapped_column(Float, nullable=False, default=0.8)
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="USD")

    usages: Mapped[list] = relationship("BudgetUsage", back_populates="budget", cascade="all, delete-orphan")

class BudgetUsage(Base):
    __tablename__ = "budget_usages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    budget_id: Mapped[str] = mapped_column(String(36), ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False, index=True)
    task_run_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    input_tokens: Mapped[int] = mapped_column(nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(nullable=False, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    budget: Mapped["Budget"] = relationship("Budget", back_populates="usages")

    __table_args__ = (
        Index("ix_budget_usages_budget_created", "budget_id", "created_at"),
    )
