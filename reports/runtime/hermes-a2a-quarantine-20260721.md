# Hermes A2A :9000 AgentCard Quarantine — 2026-07-21

Verdict: `PEER_CARD_MISSING_NOT_ADMITTED / ENDPOINT_UNCONFIGURED`

## Scope

Quarantine the hermes-os A2A peer (default `http://127.0.0.1:9000`) as candidate
evidence for B11 connection-evidence admission, per B5.

## Current state

| Field | Value |
|---|---|
| Plan entry | `hermes-a2a-peer` (A2A_PEER) |
| Plan endpoint | `null` — peer-card-missing-not-connected |
| Runtime evidence status | `UNVERIFIED` |
| Config source | Hermes protected config — **not read by policy** |
| Runtime probe URL | `http://127.0.0.1:9000` (OmniRoute `probeHermesRuntime`) |
| Runtime probe paths | `/health`, `/agent-card`, `/knowledge/status` |
| Runtime probe type | Hermes health/agent inventory — **not A2A AgentCard** |

## Evidence validation result

A valid B11 `ConnectionEvidenceV1` packet **cannot be constructed** for the
`hermes-a2a-peer` plan entry because:

1. **Plan endpoint is `null`** — the peer has no configured A2A endpoint URL.
   The B11 schema requires `endpointOrigin` to be a valid HTTPS URL for
   `a2a-https` transport. A null endpoint means the AgentCard has not been
   captured.

2. **A2A AgentCard required** — `validatePlanBindings` rejects
   `agentCard === null` for `A2A_PEER` role (line 349). An AgentCard with
   `peerId`, `endpointOrigin`, `protocolDigest`, `capabilityDigest`,
   `dataClassCeilingDigest`, and sealed `cardDigest` is mandatory. None of
   these fields are known without reading protected Hermes config or
   receiving an authenticated AgentCard handshake.

3. **Runtime probe is not A2A** — the `probeHermesRuntime` function at
   `a2a-omniroute.mjs:536` fetches `/health`, `/agent-card`, and
   `/knowledge/status` from the Hermes HTTP server. These return a general
   Hermes agent inventory (agent IDs, health flags), not an A2A v1
   AgentCard with protocol version, capability digest, or data ceiling.
   The `:9000` runtime probe endpoint is a **different surface** than the
   A2A peer endpoint (which is unconfigured).

## Attempted construction

```
evidence = {
  schemaVersion: "1.0",
  status: "COLLECTED_NOT_ADMITTED",
  connectionId: "hermes-a2a-peer",
  transport: "a2a-https",
  endpointOrigin: null,
  agentCard: null,                     // ← rejected: a2a_agent_card_required
  protocol: { name: "A2A", ... },
  ...
}
```

Error: `a2a_agent_card_required` at `connection-admission.mjs:349`.

## Quarantine blockers

| # | Blocker | Resolution |
|---|---------|------------|
| 1 | `hermes-a2a-peer` endpoint is `null` in plan | Configure the A2A endpoint URL in the plan, or document the actual A2A surface |
| 2 | No A2A AgentCard fields known | Read protected Hermes config, or receive an authenticated AgentCard handshake from `:9000` |
| 3 | `:9000` runtime probe surface ≠ A2A surface | The health/agent-card endpoint returns general Hermes agent inventory, not an A2A AgentCard |
| 4 | Protected Hermes config not read | B5 policy — no config read without explicit ticket |
| 5 | No fresh heartbeat or task-bound lease | B10 blocker — no authority kernel deployed |

## Evidence that was collected (runtime probe surface — not A2A)

From `probeHermesRuntime` at `a2a-omniroute.mjs:536`:

| Probe path | Expected return | Status |
|---|---|---|
| `GET /health` | `{ ok, healthy, status }` | EVIDENCE_REPORTED_NOT_ADMITTED |
| `GET /agent-card` | `[{ id, name, title }]` | EVIDENCE_REPORTED_NOT_ADMITTED |
| `GET /knowledge/status` | `{ dryRun, liveSend }` | EVIDENCE_REPORTED_NOT_ADMITTED |

These are **OmniRoute runtime evidence** (`a2a-omniroute.mjs:399`), not
connection-evidence. The existing OmniRoute pipeline already marks them as
`reportedObserved` but `observed: false` and `admissionStatus:
"EVIDENCE_REPORTED_NOT_ADMITTED"`.

No live probe was made; this is a static analysis of the evidence path only.

## Quarantine conclusion

```
CONNECTION_ID: hermes-a2a-peer
QUARANTINE_STATUS: PEER_CARD_MISSING_NOT_ADMITTED
ENDPOINT: null (unconfigured)
ADMITTED: false
CONNECTION_READY: false
A2A_EGRESS_CAPABLE: false

BLOCKERS:
  - endpoint_unconfigured
  - agent_card_capture_pending
  - protected_config_unread
  - not_an_a2a_endpoint (``:9000`` is Hermes runtime health, not A2A)
```

The Hermes A2A peer cannot pass B11 connection-evidence admission until:
1. The actual A2A endpoint is configured (or discovered from Hermes config)
2. An A2A AgentCard is captured and sealed
3. B10 provides the authority kernel, replay ledger, and clock authority

## Recommended next step for B5

Update the `hermes-a2a-peer` plan entry with either:
- The actual A2A endpoint (if discovered), or
- A documented path to capture it from Hermes protected config

This is a **separate ticket** from the existing quarantine — no config read,
network call, or A2A handshake was performed in this packet.
