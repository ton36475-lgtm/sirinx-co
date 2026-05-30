"""Custom exceptions for Future Agentic OS."""
from typing import Any, Optional


class FutureBaseError(Exception):
    """Base exception for all Future errors."""

    def __init__(
        self,
        message: str,
        code: str = "FUTURE_ERROR",
        details: Optional[Any] = None,
    ):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(message)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(code={self.code!r}, message={self.message!r})"


class NotFoundError(FutureBaseError):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} with id '{resource_id}' not found",
            code="NOT_FOUND",
            details={"resource": resource, "id": resource_id},
        )


class AlreadyExistsError(FutureBaseError):
    """Raised when a resource with the same unique field already exists."""

    def __init__(self, resource: str, field: str, value: str):
        super().__init__(
            message=f"{resource} with {field}='{value}' already exists",
            code="ALREADY_EXISTS",
            details={"resource": resource, "field": field, "value": value},
        )


class PermissionDeniedError(FutureBaseError):
    """Raised when a user lacks permission for an action."""

    def __init__(self, action: str, resource: str = "resource"):
        super().__init__(
            message=f"Permission denied: cannot {action} {resource}",
            code="PERMISSION_DENIED",
            details={"action": action, "resource": resource},
        )


class PolicyDeniedError(FutureBaseError):
    """Raised when a governance policy blocks an action."""

    def __init__(self, policy_name: str, action: str):
        super().__init__(
            message=f"Policy '{policy_name}' denied action: {action}",
            code="POLICY_DENIED",
            details={"policy": policy_name, "action": action},
        )


class BudgetExceededError(FutureBaseError):
    """Raised when a task or monthly budget would be exceeded."""

    def __init__(self, budget_name: str, requested: float, available: float):
        super().__init__(
            message=(
                f"Budget '{budget_name}' exceeded: "
                f"requested ${requested:.4f}, available ${available:.4f}"
            ),
            code="BUDGET_EXCEEDED",
            details={
                "budget": budget_name,
                "requested": requested,
                "available": available,
            },
        )


class ProviderError(FutureBaseError):
    """Raised when an LLM provider call fails."""

    def __init__(self, provider: str, message: str):
        super().__init__(
            message=f"Provider '{provider}' error: {message}",
            code="PROVIDER_ERROR",
            details={"provider": provider},
        )


class ToolExecutionError(FutureBaseError):
    """Raised when an agent tool fails during execution."""

    def __init__(self, tool_name: str, message: str):
        super().__init__(
            message=f"Tool '{tool_name}' execution failed: {message}",
            code="TOOL_EXECUTION_ERROR",
            details={"tool": tool_name},
        )


class ApprovalRequiredError(FutureBaseError):
    """Raised when an action requires human approval before proceeding."""

    def __init__(self, action: str, approval_id: str):
        super().__init__(
            message=f"Action '{action}' requires approval (request: {approval_id})",
            code="APPROVAL_REQUIRED",
            details={"action": action, "approval_id": approval_id},
        )


class ConfigurationError(FutureBaseError):
    """Raised for invalid or missing configuration."""

    def __init__(self, message: str):
        super().__init__(message=message, code="CONFIGURATION_ERROR")


class ValidationError(FutureBaseError):
    """Raised for domain-level validation failures (distinct from Pydantic validation)."""

    def __init__(self, field: str, message: str):
        super().__init__(
            message=f"Validation error on '{field}': {message}",
            code="VALIDATION_ERROR",
            details={"field": field},
        )
