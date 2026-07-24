# Hermes :9000 A2A AgentCard — Candidate-Evidence Quarantine (B5 step 1)

Status: `QUARANTINE_PROCEDURE_ONLY / NO_CAPTURE_PERFORMED / NOT_ADMITTED / PRODUCTION_HOLD`
Date: 2026-07-21 (Asia/Bangkok) · Prepared by: Claude Cowork review session (docs-only)

Scope: defines how the hermes-os A2A card at loopback `:9000` becomes **candidate evidence** per `MASTER_PLAN.md` B5. This document performs no probe, no capture, no admission, and grants no route authority. It contains no card bytes.

## Quarantine rules (fail-closed)

1. A captured card is **candidate evidence only**. It is never runtime truth, never a handshake, never registration eligibility, and can never expose pending work (B5 hard rule).
2. Capture is loopback-only (`http://127.0.0.1:9000/agent-card`), read-only GET, no auth header, bounded size (≤64 KiB), single attempt per ticket. The existing opt-in probe (`GET /api/omniroute?probeHermes=true`) already enforces loopback + payload reduction; raw-byte capture for quarantine is a separate operator act.
3. The captured bytes are stored under `reports/runtime/quarantine/hermes-agent-card-<UTC-timestamp>.json` with a sidecar record: SHA-256 of exact bytes, capture time, capturer identity, Hermes binary version (`hermes --version`), HTTP status, and content-length. Worktree state (branch/HEAD/dirty) is recorded in the sidecar.
4. Nothing in the capture may be copied into config, registry, lane, or admission files. OmniRoute continues to treat any card-derived IDs as `reported*` only (A26 demotion applies).
5. Secrets: if the card body contains any token-like field, the capture is aborted and the file deleted; report the field name only, never the value.

## B11 admission checklist (all required before the card leaves quarantine)

| # | Requirement | Source of authority |
|---|---|---|
| 1 | Exact Hermes implementation revision + license admitted | B13 / A29–A30 (currently 0/6 — Hermes is dirty editable) |
| 2 | Card fetched over the allowlisted origin with verified interfaces/protocol/binding per A2A spec; HTTPS + signature trust for non-loopback | MCP_A2A_CONNECTION_PLAN §A2A live sync (items 1–2) |
| 3 | Digest bound into a `ConnectionEvidenceV1` packet (peer/principal, endpoint origin, capability digests, collector, freshness) | A26 schema — output can only be `EVIDENCE_VALIDATED_NOT_ADMITTED` |
| 4 | Durable authority present: migration 0007, trusted clock, replay ledger, heartbeat ≤60 s, task/run lease, receipt | B10 / A27 / A33 (0007 absent today) |
| 5 | A2A TCK + SSRF/redirect/input-size/replay/stream-order/cancellation negatives pass | connection plan item 3 |
| 6 | One `CONNECTOR_ACTIVATION` ticket for this single peer; separate single-use `A2A_EGRESS` grant for any outbound call | ticket/circuit matrix — both currently unsupported/held |
| 7 | Registration lands via the authenticated Rust trust adapter (`/api/a2a/route` visibility) — never by editing the Node registry | B5 definition of done |

## Current truth

No capture exists. No quarantine file exists. Items 1, 3, 4, 5, 6 are all unmet by prior receipts (A26–A33). The Hermes CLI additionally has an expired provider key (401), which does not block a card capture but blocks any model-backed behavior behind it.

## Next exact step (operator)

After disk admission and with the control API intentionally running, execute one bounded capture per rule 2–3 and file the sidecar. Everything after that waits on the checklist, in order.
