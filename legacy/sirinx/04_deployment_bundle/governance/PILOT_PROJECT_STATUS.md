# Pilot Project Status

## Purpose

Track pilot projects without letting pilot outcomes become global SIRINX package truth, guaranteed ROI, or universal performance claims before executive approval.

Pilot projects may validate hardware context, installation workflow, ROI assumptions, service model, and customer-fit patterns. They are evidence inputs, not automatic package standards.

When a pilot produces broader customer/site/business context, preserve it under `governance/FIELD_VALIDATED_PROJECT_CONTEXT.md` and keep the pilot status separate from public claims.

## Status Taxonomy

| Status | Meaning | Public Use | Approval Required |
| --- | --- | --- | --- |
| `Proposed Pilot` | Candidate pilot not yet approved | Internal only | Sales/owner review |
| `Approved Pilot` | Pilot approved to prepare or execute | Internal / controlled proposal | Owner approval |
| `Active Pilot` | Pilot is being installed, monitored, or operated | Internal / controlled case-study draft | Owner approval for external use |
| `Pilot Under Review` | Data is collected and being reviewed | Internal / review-only | Engineering + sales review |
| `Validated Pilot` | Pilot results are reviewed and accepted for limited scenario use | Case-study hypothesis or validated sales scenario | Owner approval before public use |
| `Promoted Package Evidence` | Pilot evidence may support package-standard promotion | Approval packet only | Executive approval |
| `Rejected / Archived Pilot` | Pilot is not suitable for reuse | Internal only | Archive note |

## Pilot Project Record

Every pilot record must preserve this structure:

```json
{
  "pilotId": "string",
  "pilotName": "string",
  "status": "Proposed Pilot | Approved Pilot | Active Pilot | Pilot Under Review | Validated Pilot | Promoted Package Evidence | Rejected / Archived Pilot",
  "customerContext": "redacted string",
  "siteContext": {
    "buildingType": "factory | commercial | agriculture | residence | other | unknown",
    "roofType": "metal_sheet | concrete | ground_mount | carport | unknown",
    "gridContext": "single_phase | three_phase | unknown",
    "monthlyBillRangeThb": "string | unknown"
  },
  "hardwareStackRefs": ["Field-Observed Hardware Stack id or path"],
  "roiScenarioRefs": ["ROI Scenario Record id or path"],
  "measuredDataRefs": ["bill | generation | meter | monitoring | service record | photo evidence"],
  "completionPercentEstimate": {
    "min": "number | null",
    "max": "number | null",
    "basis": "operator_estimate | punch_list | commissioning_checklist | telemetry | customer_acceptance | unknown",
    "claimStatus": "estimate_only | under_review | validated | approved_public_copy"
  },
  "validatedFor": ["internal_reference | validated_sales_scenario | target_model | case_study_hypothesis | package_evidence"],
  "limitations": ["string"],
  "knownRisks": ["string"],
  "reviewedBy": "string | null",
  "reviewedAt": "ISO-8601 | null",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

## Preserved Pilot Records

- `governance/records/PILOT_PROJECT_COMPLETION_ESTIMATE_2026-04-23.md`: operator-provided completion estimate of 85-90 percent. Status: `Pilot Under Review`, estimate-only, not completion proof.

## Use Rules

- A pilot can support a `Validated Sales Scenario`, `Target Model`, or `Case-Study Hypothesis`.
- A pilot cannot by itself guarantee savings, payback, LCOE, tax benefits, BOI eligibility, ESG compliance, or universal hardware suitability.
- A completion estimate cannot by itself prove handover, customer acceptance, ROI, telemetry validity, or package readiness.
- Customer identity and raw bills must be redacted unless approved CRM/storage controls exist.
- Pilot data must reference evidence paths, not chat memory.

## Promotion Rule

1. Start as `Proposed Pilot`.
2. Move to `Approved Pilot` only with owner approval.
3. Move to `Active Pilot` when installation, monitoring, or operation starts.
4. Move to `Pilot Under Review` when evidence is collected.
5. Move to `Validated Pilot` only after engineering/sales review.
6. Move to `Promoted Package Evidence` only when executive approval allows the pilot to support package truth.
7. Promote any package fact through an approval packet, not directly from this file.

## Non-Override Rule

Pilot project status does not override:

- Locked Package Facts
- pricing source of truth
- hardware package standards
- ROI claim status
- legal/tax/BOI/ESG review requirements
- production deployment gates

## Rollback Note

If a pilot result is published as a guaranteed claim or package standard by mistake, remove the public claim, restore the last approved copy, mark the pilot `Pilot Under Review` or `Rejected / Archived Pilot`, and preserve the before/after evidence.

## Audit Trail Note

Save:

- pilot record
- source evidence paths
- measured data refs
- reviewer and approver
- claim copy before/after
- affected package or calculator output
- validation output
- rollback target

## Current Decision

Pilot projects may guide SIRINX sales engineering and case-study hypotheses, but they are not global package truth or guaranteed ROI until reviewed, approved, and promoted through an approval packet.
