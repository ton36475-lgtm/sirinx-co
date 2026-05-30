"""Org, Workspace, OrgUser models."""
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, JSON, ForeignKey, Index, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, TimestampMixin, new_uuid

class Org(TimestampMixin, Base):
    __tablename__ = "orgs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    industry: Mapped[str] = mapped_column(String(50), nullable=False, default="other")
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="th")
    timezone: Mapped[str] = mapped_column(String(50), nullable=False, default="Asia/Bangkok")
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="THB")
    brand_colors: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    workspaces: Mapped[List["Workspace"]] = relationship("Workspace", back_populates="org", cascade="all, delete-orphan")
    users: Mapped[List["OrgUser"]] = relationship("OrgUser", back_populates="org", cascade="all, delete-orphan")

class Workspace(TimestampMixin, Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("orgs.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    org: Mapped["Org"] = relationship("Org", back_populates="workspaces")

    __table_args__ = (
        Index("ix_workspaces_org_id_name", "org_id", "name"),
    )

class OrgUser(TimestampMixin, Base):
    __tablename__ = "org_users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("orgs.id", ondelete="CASCADE"), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    org: Mapped["Org"] = relationship("Org", back_populates="users")

    __table_args__ = (
        Index("ix_org_users_org_email", "org_id", "email", unique=True),
    )
