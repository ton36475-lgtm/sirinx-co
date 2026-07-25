"""LangGraph proposal-only workflow with local SQLite checkpoints."""

# ruff: noqa: E402

from __future__ import annotations

import json
import os
import sqlite3
from typing import Any, TypedDict

from .offline_policy import enforce_process_offline

enforce_process_offline()

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph

from .errors import GraphMemoryPolicyError
from .models import MemoryProposal, prepare_proposal
from .paths import checkpoint_path, ensure_runtime_root
from .queue import append_proposal


class ProposalState(TypedDict, total=False):
    proposal: dict[str, Any]
    workflow_state: str
    receipt: dict[str, Any]


def _validated_node(state: ProposalState) -> ProposalState:
    return {
        **state,
        "workflow_state": "VALIDATED_PROPOSAL_ONLY",
    }


def _queue_node(state: ProposalState) -> ProposalState:
    proposal = MemoryProposal.model_validate(state["proposal"])
    receipt = append_proposal(proposal)
    return {
        **state,
        "workflow_state": "QUEUED_FOR_HERMES_REVIEW",
        "receipt": receipt,
    }


def _build_workflow(checkpointer: SqliteSaver):
    builder = StateGraph(ProposalState)
    builder.add_node("validate_boundary", _validated_node)
    builder.add_node("append_proposal", _queue_node)
    builder.add_edge(START, "validate_boundary")
    builder.add_edge("validate_boundary", "append_proposal")
    builder.add_edge("append_proposal", END)
    return builder.compile(checkpointer=checkpointer)


def submit_proposal(raw: dict[str, Any]) -> dict[str, Any]:
    enforce_process_offline()
    # Crucial ordering: secret scan, strict validation, and redaction happen
    # before LangGraph sees the state. Rejected raw input never reaches SQLite.
    proposal = prepare_proposal(raw)
    ensure_runtime_root()
    db_path = checkpoint_path()
    if db_path.is_symlink():
        raise GraphMemoryPolicyError("checkpoint database cannot be a symlink")
    connection = sqlite3.connect(db_path, timeout=5.0, check_same_thread=False)
    try:
        connection.execute("PRAGMA busy_timeout=5000")
        saver = SqliteSaver(connection)
        workflow = _build_workflow(saver)
        result = workflow.invoke(
            {
                "proposal": proposal.model_dump(mode="json"),
                "workflow_state": "PREPARED",
            },
            config={
                "configurable": {
                    "thread_id": proposal.proposal_id,
                    "checkpoint_ns": "memory-proposals",
                }
            },
        )
        connection.commit()
    finally:
        connection.close()
    os.chmod(db_path, 0o600)
    return result["receipt"]


def submit_proposal_json(payload: str) -> str:
    if len(payload.encode("utf-8")) > 64 * 1024:
        raise GraphMemoryPolicyError("proposal payload exceeds 64 KiB")
    try:
        raw = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise GraphMemoryPolicyError("proposal must be valid JSON") from exc
    if not isinstance(raw, dict):
        raise GraphMemoryPolicyError("proposal JSON must be an object")
    return json.dumps(
        submit_proposal(raw),
        ensure_ascii=False,
        sort_keys=True,
    )
