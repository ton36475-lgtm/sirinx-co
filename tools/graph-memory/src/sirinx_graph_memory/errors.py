"""Fail-closed error types for the graph-memory boundary."""


class GraphMemoryPolicyError(ValueError):
    """An operation violates the fixed local graph-memory policy."""


class SecretDetectedError(GraphMemoryPolicyError):
    """Input contains a secret-shaped value and must not be persisted."""
