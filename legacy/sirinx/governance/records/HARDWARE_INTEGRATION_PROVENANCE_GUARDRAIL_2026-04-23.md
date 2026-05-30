# Hardware Integration Provenance Guardrail

## Record Status

`Governance Guardrail`

This rule governs how SIRINX stores cyber-physical integration knowledge for hardware, EMS, telemetry, alarms, controls, and operations. Hardware integration knowledge must always include provenance notes so it cannot become floating truth, package truth, or public proof without evidence.

## Core Rule

Store every hardware integration note with provenance:

- where the information came from
- who captured it
- when it was captured
- what evidence supports it
- what the integration boundary is
- whether the use is approved, pending, or internal-only
- what confidence level applies

This rule applies to LISINER BESS, Solis EMS/inverter observations, PCS/BMS/EMS mappings, meters, CTs, protection gear, chiller signals, Modbus/API/cloud exports, commissioning notes, O&M notes, alarms, and remote access assumptions.

## Required Provenance Fields

```json
{
  "knowledgeId": "string",
  "integrationTopic": "string",
  "hardwareRefs": ["string"],
  "sourceType": "site_visit | photo_reference | interface_screenshot | datasheet | commissioning_note | telemetry_sample | vendor_conversation | service_record | operator_note | other",
  "sourceEvidence": ["path-or-reference"],
  "capturedBy": "role-or-person",
  "capturedAt": "ISO-8601 | unknown",
  "sourceOwner": "customer | supplier | SIRINX | operator | unknown",
  "permissionStatus": "permission_granted | internal_only | needs_permission | unknown",
  "confidence": "low | medium | high",
  "integrationBoundary": {
    "readOnlyTelemetry": true,
    "remoteControl": "not_allowed | review_required | approved_limited",
    "protocols": ["Modbus TCP | Modbus RTU | API | cloud export | CSV | manual | unknown"],
    "networkBoundary": "local_lan | vendor_cloud | customer_network | isolated_gateway | unknown",
    "dataFreshnessTarget": "string"
  },
  "assumptions": ["string"],
  "knownRisks": ["string"],
  "securityNotes": ["string"],
  "telemetryRefs": ["string"],
  "allowedUse": "internal_engineering | telemetry_mapping | proposal_assumption | pilot_planning | service_runbook_draft",
  "approvalStatus": "draft | review_required | approved_internal | approved_public_reference | rejected",
  "reviewedBy": "string | null",
  "reviewedAt": "ISO-8601 | null",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

## Allowed Use

- Internal engineering review.
- Telemetry mapping and data contract planning.
- Pilot punch-list and commissioning preparation.
- Proposal assumptions with visible review status.
- Service runbook drafts.
- Ops dashboard and alert design before production activation.

## Not Allowed

- Do not treat integration knowledge as a `Locked Package Fact`.
- Do not present integration notes as guaranteed ROI, uptime, savings, safety, grid approval, utility approval, legal approval, BOI eligibility, ESG certification, or universal performance.
- Do not assume remote control is allowed from telemetry visibility.
- Do not publish customer/site-specific integration details without permission, redaction, review, and approval.
- Do not write raw tokens, passwords, cloud credentials, meter serials, private IP layouts, or unredacted screenshots into public docs.

## Evidence Needed Before Promotion

- Equipment datasheet or model confirmation.
- Interface screenshot or telemetry sample with sensitive fields redacted.
- Protocol mapping such as Modbus register map, API field list, cloud export sample, or CSV schema.
- Commissioning or service note.
- Network and permission boundary.
- Security review if any remote control, write command, or vendor-cloud dependency is involved.
- Reviewer and approver signoff.

## Rollback Note

If integration knowledge is published, promoted, or operationalized without provenance, remove the claim or automation path, restore the last approved copy/configuration, and return the item to `review_required` until evidence and approval are attached.

## Audit Trail Note

Save the provenance record, evidence references, redaction status, reviewer comments, approval status, affected dashboards/prompts/runbooks, validation output, and rollback target.
