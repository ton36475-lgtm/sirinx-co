"""Shared enums and types for Future Agentic OS."""
from enum import Enum


class OrgIndustry(str, Enum):
    SOLAR_ENERGY = "solar_energy"
    MANUFACTURING = "manufacturing"
    RETAIL = "retail"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    EDUCATION = "education"
    REAL_ESTATE = "real_estate"
    LOGISTICS = "logistics"
    OTHER = "other"


class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class PackStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


class PolicyAction(str, Enum):
    ALLOW = "allow"
    DENY = "deny"
    REQUIRE_APPROVAL = "require_approval"
    LOG_ONLY = "log_only"


class PolicyRiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ProviderName(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GOOGLE = "google"
    LOCAL = "local"


class ModelCapability(str, Enum):
    PLANNING = "planning"
    EXECUTION = "execution"
    REVIEW = "review"
    EMBEDDING = "embedding"
    SUMMARIZATION = "summarization"


class TaskStatus(str, Enum):
    PENDING = "pending"
    PLANNING = "planning"
    EXECUTING = "executing"
    REVIEWING = "reviewing"
    AWAITING_APPROVAL = "awaiting_approval"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class StepStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class ArtifactType(str, Enum):
    FILE = "file"
    REPORT = "report"
    DATA = "data"
    CODE = "code"
    IMAGE = "image"


class BrainEntryType(str, Enum):
    DOCTRINE = "doctrine"
    TEMPLATE = "template"
    KNOWLEDGE = "knowledge"
    RESEARCH_STANDARD = "research_standard"
    MEMORY = "memory"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"


class AuditEventType(str, Enum):
    ORG_CREATED = "org_created"
    USER_ADDED = "user_added"
    USER_REMOVED = "user_removed"
    TASK_CREATED = "task_created"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    POLICY_TRIGGERED = "policy_triggered"
    APPROVAL_REQUESTED = "approval_requested"
    APPROVAL_DECIDED = "approval_decided"
    BUDGET_ALERT = "budget_alert"
    BUDGET_EXCEEDED = "budget_exceeded"
    PROVIDER_CALLED = "provider_called"
    BRAIN_UPDATED = "brain_updated"
    TOOL_EXECUTED = "tool_executed"
