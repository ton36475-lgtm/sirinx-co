# Hardware Telemetry Protocol

## Purpose

Define the safe internal protocol for ingesting SIRINX hardware telemetry from field-observed Solis EMS / inverter context and LISINER liquid-cooled BESS / chiller context into ops dashboards, alerts, and audit records.

This protocol is internal-only. It does not approve public claims, package truth, ROI claims, remote control, or production cutover.

## Source Provenance

Every telemetry source must link to a provenance record before production activation:

- `governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md`
- `governance/FIELD_OBSERVED_HARDWARE_STACK.md`
- `governance/records/HARDWARE_INTEGRATION_PROVENANCE_GUARDRAIL_2026-04-23.md`
- specific equipment or pilot records under `governance/records/`

## Solis EMS Metrics

Minimum ingestion candidates:

| Metric | Purpose | Freshness Target | Sensitivity |
| --- | --- | --- | --- |
| inverter status | uptime and fault visibility | 1-5 minutes when connected | restricted |
| PV power kW | generation monitoring | 1-5 minutes | internal |
| daily energy kWh | performance trend | hourly/daily | internal |
| grid import/export kW | load and self-consumption review | 1-5 minutes | restricted |
| meter / CT status | data quality check | 5 minutes | restricted |
| alarm code and severity | ops alerting | near-real-time where possible | restricted |
| EMS communication health | integration reliability | 5 minutes | restricted |

Allowed transport examples:

- Modbus TCP/RTU, if register map and permission are documented.
- Vendor API or cloud export, if account ownership and data permissions are documented.
- CSV/manual export for pilot review, if automated access is not approved.

## LISINER BESS / Chiller Health Signals

Minimum ingestion candidates:

| Metric | Purpose | Freshness Target | Sensitivity |
| --- | --- | --- | --- |
| battery state of charge | storage operations visibility | 1-5 minutes | restricted |
| charge/discharge power | energy-flow review | 1-5 minutes | restricted |
| battery temperature range | thermal safety review | 1-5 minutes | restricted |
| chiller run status | thermal-system health | 1-5 minutes | restricted |
| chiller fault / alarm | ops alerting | near-real-time where possible | restricted |
| BMS fault code | service triage | near-real-time where possible | restricted |
| cabinet communication status | integration reliability | 5 minutes | restricted |

Remote write/control commands are blocked by default. Any write command requires a separate security review, approval packet, and rollback plan.

## Data Freshness Notes

- Freshness targets are engineering defaults, not SLA guarantees.
- If telemetry is older than the expected freshness target, mark it stale and alert only as `data_quality`.
- Do not use stale telemetry for ROI proof, customer reporting, or service conclusions without review.
- Store ingestion timestamp and source timestamp separately.

## Routing

Telemetry routes into:

- ops dashboard health cards
- Omniscient Dashboard live agent monitor
- equipment status timeline
- data-quality alerts
- pilot review records
- ROI model evidence references after review
- service triage queue
- deployment audit evidence when used in server handoff

Telemetry must not route raw secrets, raw customer bills, cloud credentials, private keys, passwords, or unredacted PII into prompts, dashboards, logs, or handoff bundles.

## Omniscient Dashboard Feed

The `ops.sirinx.co` Omniscient Dashboard receives read-only telemetry events from approved connectors only. It must never write commands back to Solis EMS, LISINER BMS, chillers, meters, or customer networks.

Minimum dashboard envelope:

```json
{
  "eventId": "uuid",
  "timestamp": "ISO-8601",
  "sourceTimestamp": "ISO-8601 | null",
  "source": "solis_ems | solis_inverter | lisiner_bess | lisiner_chiller | manual_import",
  "equipmentRef": "redacted string",
  "metric": "string",
  "value": "number | string | boolean | null",
  "unit": "string | null",
  "freshnessSeconds": "number",
  "state": "Standby | Analyzing Hardware | Executing",
  "safeContext": {},
  "sensitivity": "internal | restricted",
  "redactionStatus": "redacted | not_applicable",
  "provenanceRefs": ["governance/records/..."],
  "schemaVersion": "1.0"
}
```

Routing rules:

- Publish sanitized state to the dashboard WebSocket or Redis pub/sub channel.
- Store audit-relevant state changes in PostgreSQL.
- Store only redacted retrieval metadata in pgvector.
- Mark stale data as `data_quality_stale` before display.
- Show ROI-related telemetry as evidence candidates only after review.
- Keep field hardware context separate from package truth.

pgvector retrieval labels for dashboard activity:

- `field_hardware_context`
- `hardware_telemetry_protocol`
- `roi_scenario_models`
- `deployment_handoff`
- `brand_and_package_truth`

## Alert Classes

| Alert | Trigger | Default Destination |
| --- | --- | --- |
| `data_quality_stale` | metric age exceeds freshness target | ops dashboard |
| `integration_offline` | EMS/BESS/chiller source unavailable | ops dashboard and operator alert |
| `equipment_alarm` | source-reported alarm or fault | ops triage queue |
| `thermal_review` | BESS/chiller temperature or cooling status requires review | ops triage queue |
| `permission_review` | telemetry source lacks provenance or permission | governance review |

## Approval Gates

Before production telemetry activation:

1. Complete source provenance.
2. Confirm data permission and account ownership.
3. Confirm read-only default.
4. Redact sensitive fields.
5. Validate schema and freshness logic.
6. Document retention policy.
7. Add rollback note and audit trail note.
8. Obtain human approval for production-facing use.

## Rollback Note

If telemetry ingestion misroutes sensitive data or operates without provenance, disable the connector, rotate exposed credentials if any, quarantine affected logs, and restore the previous approved ops dashboard state.

## Audit Trail Note

Save source provenance, schema version, sample payload hash, redaction result, freshness result, alert routing test, reviewer, approver, and rollback target.
