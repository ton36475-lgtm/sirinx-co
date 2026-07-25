"""Strict proposal contracts.

Raw input is secret-scanned before Pydantic sees it so validation errors never
echo a secret-shaped value into logs or receipts.
"""

from __future__ import annotations

import hashlib
import json
from typing import Annotated, Any, Literal

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    StringConstraints,
    ValidationError,
    field_validator,
)

from .errors import GraphMemoryPolicyError
from .security import assert_no_secrets, redact_text, validate_evidence_ref

EvidenceClass = Literal["observed", "derived", "inferred", "reported", "unverified"]
Observation = Annotated[str, StringConstraints(min_length=1, max_length=1000)]
EvidenceRef = Annotated[str, StringConstraints(min_length=1, max_length=500)]

_TAG_PATTERN = r"^[a-z0-9][a-z0-9._-]{0,47}$"


def _normalize_tag(value: Any) -> Any:
    if isinstance(value, str):
        return value.strip().lower()
    return value


Tag = Annotated[
    str,
    StringConstraints(pattern=_TAG_PATTERN),
    BeforeValidator(_normalize_tag),
]


class MemoryProposalInput(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        frozen=True,
        json_schema_extra={
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "$id": "https://sirinx.local/schemas/memory-proposal.schema.json",
        },
        str_strip_whitespace=True,
        title="SIRINX Memory Proposal",
    )

    schema_version: Literal["1.0.0"]
    agent_id: str = Field(pattern=r"^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$")
    project: Literal["sirinx-co"]
    summary: str = Field(min_length=8, max_length=500)
    proposed_memory: str = Field(min_length=8, max_length=4000)
    observations: list[Observation] = Field(max_length=20)
    evidence_refs: list[EvidenceRef] = Field(min_length=1, max_length=32)
    evidence_class: EvidenceClass
    tags: list[Tag] = Field(default_factory=list, max_length=16)

    @field_validator("summary", "proposed_memory")
    @classmethod
    def redact_scalar_text(cls, value: str) -> str:
        return redact_text(value)

    @field_validator("observations")
    @classmethod
    def redact_observations(cls, values: list[str]) -> list[str]:
        return [redact_text(value) for value in values]

    @field_validator("evidence_refs")
    @classmethod
    def constrain_evidence_refs(cls, values: list[str]) -> list[str]:
        return [validate_evidence_ref(value) for value in values]

    @field_validator("tags")
    @classmethod
    def constrain_tags(cls, values: list[str]) -> list[str]:
        return sorted(set(values))


class MemoryProposal(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)

    proposal_id: str
    content_digest: str
    authority: Literal["proposal_only"] = "proposal_only"
    review_state: Literal["queued_for_hermes_review"] = "queued_for_hermes_review"
    payload: MemoryProposalInput


def _canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )


def prepare_proposal(raw: dict[str, Any]) -> MemoryProposal:
    assert_no_secrets(raw)
    try:
        validated = MemoryProposalInput.model_validate(raw)
    except ValidationError as exc:
        # Do not forward Pydantic's input echo across the boundary. The raw
        # payload was secret-scanned, but generic errors are still safer and
        # produce deterministic receipts.
        raise GraphMemoryPolicyError("proposal validation failed") from exc
    sanitized = validated.model_dump(mode="json")
    assert_no_secrets(sanitized)
    digest = hashlib.sha256(_canonical_json(sanitized).encode("utf-8")).hexdigest()
    return MemoryProposal(
        proposal_id=f"proposal-{digest[:24]}",
        content_digest=f"sha256:{digest}",
        payload=validated,
    )
