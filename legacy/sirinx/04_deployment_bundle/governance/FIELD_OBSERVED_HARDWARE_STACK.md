# Field-Observed Hardware Stack

## Purpose

Capture hardware stacks observed from real field work, vendor conversations, prior installed systems, site references, or operational evidence without promoting them into SIRINX Locked Package Facts too early.

This document gives Codex, sales engineering, and operators a governed place to store stack knowledge such as LISINER, Solis, inverter/panel/BESS combinations, mounting patterns, monitoring gateways, and field constraints.

If a stack observation includes broader project context, preserve that context under `governance/FIELD_VALIDATED_PROJECT_CONTEXT.md`.

## Definition

A `Field-Observed Hardware Stack` is a real-world stack observation, not a universal SIRINX package standard.

It can support:

- validated sales scenarios
- target models
- case-study hypotheses
- equipment shortlists
- engineering review
- proposal assumptions

It cannot by itself define:

- global package truth
- guaranteed ROI
- final BOM for all projects
- legal/tax/BOI/ESG compliance claims
- public claims that imply universal superiority

## Stack Record

Every field-observed stack must preserve this structure:

```json
{
  "stackName": "string",
  "status": "Field-Observed Hardware Stack",
  "observedAt": "ISO-8601 | unknown",
  "observedBy": "string | role",
  "sourceType": "site_visit | vendor_conversation | prior_install | quotation | datasheet | service_record | photo_reference | other",
  "sourceEvidence": ["string"],
  "integrationKnowledgeRefs": ["string"],
  "provenanceNotes": {
    "sourceOwner": "customer | supplier | SIRINX | operator | unknown",
    "permissionStatus": "permission_granted | internal_only | needs_permission | unknown",
    "integrationBoundary": "read_only_telemetry | review_required_remote_control | no_control | unknown",
    "capturedBy": "string | role",
    "capturedAt": "ISO-8601 | unknown"
  },
  "siteContext": {
    "buildingType": "factory | commercial | agriculture | residence | other | unknown",
    "roofType": "metal_sheet | concrete | ground_mount | carport | unknown",
    "gridContext": "single_phase | three_phase | unknown",
    "monthlyBillRangeThb": "string | unknown"
  },
  "hardware": {
    "inverter": ["string"],
    "panel": ["string"],
    "bess": ["string"],
    "mounting": ["string"],
    "evCharger": ["string"],
    "monitoringGateway": ["string"],
    "protectionAndMetering": ["string"]
  },
  "fieldNotes": ["string"],
  "knownRisks": ["string"],
  "compatibilityNotes": ["string"],
  "serviceNotes": ["string"],
  "confidence": "low | medium | high",
  "allowedUse": "internal_reference | validated_sales_scenario | target_model | case_study_hypothesis | package_candidate",
  "promotionTarget": "none | Track-Record Hardware Profile | Locked Package Fact",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

## Preserved Field Observations

- `governance/records/FIELD_OBSERVED_LISINER_LIQUID_COOLED_BESS_2026-04-23.md`: LISINER liquid-cooled BESS cabinet with integrated chiller system. Status: field-observed context, not package truth.
- `governance/records/FIELD_OBSERVED_SOLIS_EMS_INVERTER_INTERFACE_2026-04-23.md`: Solis EMS / Solis industrial inverter interface. Status: field-observed inverter and EMS context, not package truth.
- `governance/records/HARDWARE_INTEGRATION_PROVENANCE_GUARDRAIL_2026-04-23.md`: Required provenance rule for Solis EMS mappings, LISINER BESS/chiller signals, telemetry, alarms, and integration boundaries.

## Allowed Use

| Use | Allowed? | Notes |
| --- | --- | --- |
| Internal engineering reference | Yes | Evidence path required |
| Hardware telemetry mapping | Yes | Provenance and integration boundary required |
| Validated sales scenario | Yes | Must show assumptions |
| Target model | Yes | Must show sensitivity/range |
| Case-study hypothesis | Yes | Must remain hypothesis until verified |
| Public package standard | No | Requires promotion through approval packet |
| Guaranteed ROI claim | No | Never permitted from stack observation alone |

## Promotion Rule

1. Record the stack as `Field-Observed Hardware Stack`.
2. Attach evidence such as photos, quotations, datasheets, site notes, install references, or service records.
3. Assign confidence: `low`, `medium`, or `high`.
4. Use it only for internal reference or scenario/model/hypothesis work.
5. Promote to `Track-Record Hardware Profile` only after repeated evidence or reliability/service feedback.
6. Promote to `Locked Package Fact` only after executive package-standard approval and an approval packet.

## Non-Override Rule

Field-observed stacks do not override:

- SIRINX core offer
- package scope
- pricing source of truth
- ROI claim status
- compliance boundaries
- public deployment lane

## Rollback Note

If a field-observed stack is accidentally published as a package standard, remove the public claim, restore the last approved package copy, and move the stack back to `Field-Observed Hardware Stack` or `Track-Record Hardware Profile`.

## Audit Trail Note

Save:

- stack record
- evidence paths
- integration knowledge refs and provenance notes
- confidence level and rationale
- affected public copy or calculator output
- approver if promoted
- validation command output
- rollback target

## Current Decision

Field-observed stacks may inform SIRINX sales engineering and executive target models, but they are not global package truth until promoted through executive approval and an approval packet.
