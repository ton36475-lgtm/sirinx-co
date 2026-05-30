# Telemetry Ingestion Requirements

## Purpose

Define how SIRINX ingests telemetry from the public site, server runtime, deployment pipeline, pilot projects, hardware stacks, ROI scenario records, and operator workflows without collecting production secrets or unnecessary personal data.

Telemetry supports reliability, auditability, pilot evidence, ROI model review, and deployment safety. Telemetry does not by itself approve claims, promote package facts, or authorize live cutover.

## Allowed Telemetry Classes

| Class | Examples | Allowed Use |
| --- | --- | --- |
| `public_site` | page view, CTA click, form start, form submit status | UX and conversion health |
| `runtime_health` | route smoke, container status, API health, queue backlog | operations and alerts |
| `deployment` | build id, commit, test result, compose config result, smoke result | audit trail and release gate |
| `pilot_project` | pilot status change, measured data reference, review event | pilot evidence and review |
| `project_context` | field-validated context captured, reviewed, redacted, or promoted | project context preservation |
| `hardware_context` | hardware stack observed, evidence added, confidence changed | engineering context |
| `hardware_integration` | Solis EMS metric map, LISINER BESS/chiller signal map, protocol/freshness review | telemetry planning and ops alerts |
| `roi_model` | scenario created, assumption updated, claim status changed | claim governance |
| `security_audit` | wrong-brand detection, secret scan result, approval gate event | governance and incident response |

## Telemetry Event Envelope

All ingested telemetry must use this minimum envelope:

```json
{
  "eventId": "uuid | deterministic idempotency key",
  "timestamp": "ISO-8601",
  "source": "sirinx.co | ops.sirinx.co | agents.sirinx.internal | server | ci | manual",
  "class": "public_site | runtime_health | deployment | pilot_project | hardware_context | hardware_integration | roi_model | security_audit",
  "event": "string",
  "actorType": "public_user | operator | agent | system | unknown",
  "requestId": "string | null",
  "sessionId": "redacted string | null",
  "entityRef": "string | null",
  "safeContext": {},
  "sensitivity": "public | internal | restricted",
  "redactionStatus": "redacted | not_applicable",
  "schemaVersion": "1.0"
}
```

## PII And Secret Handling

Never ingest:

- production secrets
- raw access tokens
- API keys
- unredacted private keys
- passwords
- raw customer bills outside approved secured storage

Restricted fields:

- phone
- email
- customer name
- exact address
- raw bill images
- meter serials

If telemetry references restricted data, store only a redacted pointer or approved evidence reference.

## Source Trust Levels

| Source Trust | Meaning | Handling |
| --- | --- | --- |
| `untrusted_public` | Browser/user-submitted event | Validate and rate-limit |
| `operator_verified` | Human operator action | Keep audit actor |
| `agent_generated` | Codex/agent output | Treat as untrusted until reviewed |
| `system_verified` | CI/server smoke/deployment output | Can support release evidence |
| `evidence_linked` | Event links to approved artifact/evidence | Can support review, not automatic approval |

## Ingestion Controls

- Validate schema before accepting events.
- Require an idempotency key for deployment, pilot, hardware, and ROI events.
- Require provenance notes before accepting hardware integration events from EMS, inverter, BESS, chiller, PCS, BMS, meter, CT, or protection sources.
- Drop or quarantine events with secrets or high-risk PII.
- Store raw public telemetry separately from approved CRM/evidence storage.
- Do not send raw telemetry into model prompts unless redacted.
- Keep wrong-brand, secret-scan, and production-cutover events as restricted audit records.

## Reliability Requirements

Minimum production requirements:

- durable append-only audit log for deployment and approval events
- retry queue for transient ingestion failure
- dead-letter queue or quarantine file for invalid events
- timestamp and build id on deployment events
- request id or correlation id on runtime events
- retention policy documented before production activation

## Telemetry Does Not Approve Claims

Telemetry can support:

- pilot review
- field-validated project context preservation
- hardware stack confidence
- ROI scenario review
- ROI scenario model versioning and audit
- release readiness
- incident response

Hardware telemetry design must also follow `knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md`. Hardware integration telemetry can support operational review, but it cannot approve remote control, package truth, guaranteed savings, or public Track Record claims.

Telemetry cannot by itself approve:

- Locked Package Facts
- guaranteed ROI
- package-standard hardware
- BOI/tax/legal/ESG claims
- DNS/TLS/reverse-proxy cutover

## Rollback Note

If telemetry ingestion leaks secrets, raw PII, or unsupported claims, disable the ingestion route or worker, quarantine the affected log segment, rotate exposed secrets if needed, and restore the last safe telemetry schema.

## Audit Trail Note

Save:

- schema version
- ingestion source
- source provenance and integration boundary
- redaction status
- rejected/quarantined events
- deployment or build id
- retention policy
- operator or agent responsible for schema changes

## Current Decision

Telemetry ingestion is approved as a governed design contract only. Production activation requires implementation review, secret/PII redaction tests, rollback notes, and an approval packet.
