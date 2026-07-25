"""LangChain adapter exposing one bounded proposal-only tool."""

# ruff: noqa: E402

from __future__ import annotations

from .offline_policy import enforce_process_offline

enforce_process_offline()

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, ConfigDict, Field

from .workflow import submit_proposal_json


class ProposalToolInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    proposal_json: str = Field(
        min_length=2,
        max_length=65536,
        description="A SIRINX memory proposal JSON object",
    )


def _submit_memory_proposal(proposal_json: str) -> str:
    return submit_proposal_json(proposal_json)


def build_proposal_tool() -> StructuredTool:
    return StructuredTool.from_function(
        func=_submit_memory_proposal,
        name="submit_memory_proposal",
        description=(
            "Validate, redact, and queue a local memory proposal for Hermes review. "
            "This tool cannot approve, delete, or write authoritative memory."
        ),
        args_schema=ProposalToolInput,
    )
