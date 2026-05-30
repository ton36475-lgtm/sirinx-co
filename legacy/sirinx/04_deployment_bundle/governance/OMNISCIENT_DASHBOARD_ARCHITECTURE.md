# Omniscient Dashboard Architecture

## Status

`Internal Control Plane Scaffold - Server-Ready Hold`

The Omniscient Dashboard is the premium internal command center for `ops.sirinx.co`. It visualizes AI workers, queue state, PostgreSQL/pgvector memory activity, Solis EMS telemetry freshness, and LISINER BESS/chiller health signals.

This document does not authorize production deployment, direct hardware control, public ingress, or mobile break-glass operations.

## Product Boundary

| Plane | Role | Ingress |
| --- | --- | --- |
| Public Revenue Plane | `sirinx.co` website and lead capture | Public reverse proxy only |
| Internal Control Plane | `ops.sirinx.co` dashboard, approvals, queue and telemetry visibility | Zero Trust, SSO, MFA |
| Agent Execution Plane | `agents.sirinx.internal` n8n workers, Redis queues, PostgreSQL/pgvector retrieval | No public ingress |

## Visual Direction

The UI must be premium, enterprise-grade, and engineering-first:

- Theme: graphite, black glass, muted gold, restrained cyan for telemetry.
- Layout: dense operational surfaces, readable data hierarchy, no clutter.
- Motion: subtle pulsing only for live state, never arcade-like.
- Imagery: real-world industrial energy visuals only when approved.
- Typography: executive dashboard tone, not entertainment UI.

Rejected aesthetics:

- cartoon
- anime
- gacha
- casino
- lottery
- cheap hype banners
- fake jackpot or betting visuals

## Agent Roster

These names are internal display labels and do not grant runtime permission by themselves.

| Node | Scope | Allowed States | Notes |
| --- | --- | --- | --- |
| Hermes Orchestrator (`Hermes`) | Routing and approval router | `Standby`, `Thinking`, `Executing` | Must enforce governance before action |
| Cyber-Physical Analyst (`Analyst`) | ROI, telemetry, TOU, field hardware context | `Standby`, `Thinking`, `Analyzing Hardware`, `Executing` | Read-only telemetry by default |
| Sovereign Creator (`Creator`) | Executive narrative and handoff copy lane | `Standby`, `Thinking`, `Executing` | Internal creative workflow only |
| Validator Agent (`Validator`) | Schema, path, fact-lock, and bundle validation lane | `Standby`, `Thinking`, `Executing` | Must not create new facts |
| Delivery Agent (`Delivery`) | Bundle assembly and handoff packaging lane | `Standby`, `Thinking`, `Executing` | No completion claim without real files |

## Live State Mapping

Dashboard state comes from WebSocket or Redis pub/sub events emitted by approved services:

```json
{
  "eventId": "uuid",
  "timestamp": "ISO-8601",
  "source": "n8n | telemetry-sync | pgvector-retriever | validator | delivery | manual",
  "node": "Hermes | Analyst | Creator | Validator | Delivery",
  "state": "Standby | Thinking | Analyzing Hardware | Executing",
  "severity": "info | warning | critical",
  "safeContext": {},
  "schemaVersion": "1.0"
}
```

Rules:

- Treat all events as untrusted until schema validation passes.
- Redact secrets, tokens, raw customer PII, and customer bills before display.
- Persist audit-relevant state transitions.
- Do not display raw prompt content unless explicitly approved and redacted.
- Do not expose this event stream on the public revenue plane.

## Activity Feed

The activity feed must show only safe, concise, operational facts:

- queue job accepted / completed / failed
- validation gate passed / failed
- telemetry connector online / stale / offline
- pgvector retrieval collection name and redacted document label
- approval gate waiting state

The feed must not show secrets, private keys, production `.env`, raw tokens, or unredacted customer data.

## Vector Memory View

The pgvector panel must display retrieval metadata, not raw sensitive documents:

| Field | Display Rule |
| --- | --- |
| collection | show |
| chunk label | show if redacted |
| relevance score | show |
| source provenance | show |
| raw text | hide by default |
| restricted fields | hide |

Required collections:

- `brand_truth`
- `package_truth`
- `field_hardware_context`
- `telemetry_protocols`
- `roi_scenario_models`
- `deployment_handoff`

## WebSocket / Redis Hook Shape

Implementation target:

- Redis/BullMQ receives n8n worker status.
- Internal API validates the event envelope against `ORCHESTRATION_SCHEMA.json` and per-agent schemas.
- WebSocket channel broadcasts to authenticated ops clients.
- PostgreSQL stores audit trail.
- pgvector stores redacted knowledge chunks and retrieval metadata.

No external client may write directly to Redis, PostgreSQL, n8n, or hardware connectors.

## Mobile Control Policy

Mobile is read-only by default:

- allowed: live agent dashboard, queue visibility, DLQ visibility, telemetry freshness, service health, approval queue view
- blocked: raw shell, direct database access, n8n admin exposure, hardware control, secret viewing
- break-glass: gated by SSO, MFA, named approval, scope limit, audit trail, rollback note

## Current Scaffold

The local admin UI includes a premium scaffold at:

- `client/src/pages/admin/AgentMonitor.tsx`
- route: `/admin/agent-monitor`

The scaffold uses governed mock state only. Production WebSocket or Redis hooks require a separate implementation and approval packet.

## Rollback Note

If the dashboard leaks sensitive data, disable the `/admin/agent-monitor` route, disable the event bridge, preserve logs for review, and restore the prior approved admin bundle.

## Audit Trail Note

Preserve schema version, event source, redaction status, validator output, approver, deployment ID, contract version, and rollback target for every production activation.
