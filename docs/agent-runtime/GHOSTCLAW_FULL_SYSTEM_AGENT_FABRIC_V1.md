# GHOSTCLAW Full-System Agent Fabric v1

## Scope
This document defines the contract boundary for the Full-System Agent Fabric F0/F1 rounds.

## Roles
- `WRITER`: implementation agent with write lease over approved disjoint path partition.
- `VERIFIER`: read/verification agent with read-only verifier scope.
- `INTEGRATION`: patch application and replay lane.

## Lease Contract
- At most 2 concurrent writers and 1 verifier in a round.
- One-use leases with explicit nonce, issue time, and expiry.
- Any non-overlapping writes; writer path partitions must remain disjoint.

## Evidence and Receipts
- Every writer/ verifier action must emit a receipt using schema in `schemas/agentic-fabric/*`.
- Receipts must include proof references and execution mode.

## Gate Model
- F0 closure must be complete before F1 live execution.
- F1 dry-run canary requires all required files in pathset and a validated command catalog.
- External providers and mutation are denied during contract-only rounds.

## Runtime Artifact Set
- `schemas/agentic-fabric/*.schema.json`
- `proto/ghostclaw/**/*`
- `buf.yaml`
- `docs/agent-runtime/GHOSTCLAW_FULL_SYSTEM_AGENT_FABRIC_V1.md`

