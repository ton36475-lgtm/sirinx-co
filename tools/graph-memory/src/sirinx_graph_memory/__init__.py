"""SIRINX project-local, provider-free graph memory tools."""

from .offline_policy import enforce_process_offline

enforce_process_offline()

from .models import MemoryProposal, MemoryProposalInput  # noqa: E402
from .workflow import submit_proposal  # noqa: E402

__all__ = ["MemoryProposal", "MemoryProposalInput", "submit_proposal"]
