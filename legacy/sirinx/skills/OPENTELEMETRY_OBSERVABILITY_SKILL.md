# OpenTelemetry Observability Skill

## Purpose

Define structured event boundaries, correlation IDs, trace paths, queue visibility, and audit events for SIRINX.

## When To Use

- patching observability docs
- adding event schemas
- preparing internal monitoring or telemetry handoff

## Inputs

- `governance/OBSERVABILITY_CONTRACT.md`
- `schemas/audit_event.schema.json`
- telemetry docs

## Outputs

- observability policy updates
- event schema updates
- trace path guidance

## Hard Constraints

- no secrets in logs
- no unrestricted PII
- telemetry remains internal and redacted by default

## Validation Checklist

- observability contract exists
- trace path is documented
- queue backlog and DLQ visibility are documented

## May Touch

- `governance/OBSERVABILITY_CONTRACT.md`
- `schemas/audit_event.schema.json`
- `knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md`

## Must Not Touch

- live collectors
- production secrets
