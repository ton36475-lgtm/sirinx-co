# Observability Contract

## Purpose

Define the minimum observability and audit behavior for the SIRINX public revenue plane, internal control plane, and agent execution plane while preserving Zero Trust and review-first rollout rules.

## Structured JSON Logging

Every production-facing or ops-facing service must emit structured JSON logs with at least:

- `timestamp`
- `service`
- `environment`
- `level`
- `event`
- `correlationId`
- `traceId`
- `requestId`
- `safeContext`
- `schemaVersion`
- `redactionStatus`

Rules:

- do not log production secrets
- do not log raw access tokens
- redact phone, email, site addresses, meter serials, and customer account identifiers unless a secured CRM path is approved
- logs must remain machine-parseable and safe to forward

## Trace Path

The canonical trace path is:

`Web -> API or Server Action -> n8n Main -> Queue Worker or Runner -> Database`

When enabled, the Omniscient Dashboard may subscribe to redacted event summaries from that path only.

## Correlation And Audit IDs

- every inbound request must generate or adopt a `correlationId`
- every async handoff must preserve that `correlationId`
- every queue execution should add a worker-level `traceId`
- deployment, bundle, and validator actions must create auditable event records

## Health Signals

Required before any approved cutover:

- public HTTP smoke for `/`
- SIRINX brand-content smoke
- API or server-action health
- container and process status
- build identifier and deployment timestamp
- Omniscient Dashboard event bridge health when enabled
- hardware telemetry connector health when enabled
- Solis EMS freshness when enabled
- LISINER BESS and chiller health freshness when enabled

## Queue And Worker Visibility

Required ops signals:

- queue depth
- oldest queued job age
- active worker count
- failed job count
- worker crash-loop detection
- external runner availability when code execution is enabled

## DLQ Visibility

If a dead-letter queue or equivalent quarantine lane is enabled, the control plane must expose:

- item count
- newest failure age
- last error class
- ack or retry policy reference
- reviewer ownership

## Telemetry Freshness

Hardware and ops telemetry must publish:

- source name
- last received timestamp
- freshness window
- quarantine state
- reviewer escalation path

Freshness windows must be documented in `knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md`.

## Alerts

Initial alert classes:

- public site down
- wrong-brand content detected
- lead capture failure
- database unavailable
- queue backlog
- automation worker crash loop
- Omniscient Dashboard event bridge offline
- telemetry ingestion quarantine threshold exceeded
- hardware telemetry stale or offline
- BESS or chiller thermal review required
- secret or restricted PII detected in telemetry

## Audit Trail

Each governed release or handoff must preserve:

- git commit or build source
- build command and result
- validation commands and results
- compose or rendered runtime summary
- approver or approval packet ref
- rollback target
- telemetry schema version when enabled
- hardware integration provenance refs when enabled
- redaction and quarantine summary

## Guardrails

- observability must stop at `SERVER-READY HOLD MODE`
- mobile clients are read-only by default
- observability does not authorize deployment, DNS, TLS, or secret changes
- field hardware context must not overwrite package truth
