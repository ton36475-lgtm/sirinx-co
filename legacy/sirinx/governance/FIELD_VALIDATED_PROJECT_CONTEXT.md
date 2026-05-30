# Field-Validated Project Context

## Purpose

Preserve project context that has been validated through real field exposure, operator review, customer conversation, site evidence, pilot activity, hardware-stack observation, or measured references without turning that context into public claims, guaranteed ROI, or Locked Package Facts.

This is the governed bridge between field knowledge and public-facing SIRINX materials.

## Definition

`Field-Validated Project Context` means project-level knowledge that is more reliable than a generic assumption, but still needs explicit review before it becomes:

- public track record copy
- verified case study
- standard package scope
- ROI guarantee
- legal/tax/BOI/ESG claim

## Context Status Taxonomy

| Status | Meaning | Allowed Use |
| --- | --- | --- |
| `Field Note` | Raw but relevant field observation | Internal only |
| `Field-Validated Context` | Context reviewed against field evidence or trusted operational reference | Internal, proposal prep, scenario modeling |
| `Project Context Under Review` | Context being reviewed for publication or package evidence | Review only |
| `Approved Project Context` | Context approved for limited public or proposal use | Public with redaction and claim labels |
| `Promoted Evidence` | Context may support package, ROI, or track-record promotion | Approval packet only |
| `Archived / Rejected Context` | Context not suitable for reuse | Internal archive |

## Project Context Record

Every preserved context item must keep:

```json
{
  "contextId": "string",
  "contextTitle": "string",
  "status": "Field Note | Field-Validated Context | Project Context Under Review | Approved Project Context | Promoted Evidence | Archived / Rejected Context",
  "sourceType": "site_visit | customer_conversation | vendor_conversation | pilot | prior_install | telemetry | quotation | bill_review | photo_reference | service_record | other",
  "sourceEvidence": ["string"],
  "customerContext": "redacted string",
  "siteContext": {
    "buildingType": "factory | commercial | agriculture | residence | other | unknown",
    "roofType": "metal_sheet | concrete | ground_mount | carport | unknown",
    "gridContext": "single_phase | three_phase | unknown",
    "monthlyBillRangeThb": "string | unknown",
    "operatingPattern": "string | unknown"
  },
  "businessContext": {
    "decisionMaker": "owner | executive | engineering | finance | operations | unknown",
    "painPoints": ["electricity_cost | resilience | ESG | expansion | EV_charging | compliance | other"],
    "decisionStage": "discovery | feasibility | proposal | pilot | implementation | monitoring | unknown"
  },
  "hardwareStackRefs": ["string"],
  "pilotRefs": ["string"],
  "roiModelRefs": ["string"],
  "telemetryRefs": ["string"],
  "trackRecordRefs": ["string"],
  "claimBoundaries": ["string"],
  "redactionStatus": "redacted | needs_redaction | not_applicable",
  "allowedUse": "internal_reference | proposal_prep | validated_sales_scenario | target_model | case_study_hypothesis | track_record_draft | package_evidence",
  "confidence": "low | medium | high",
  "limitations": ["string"],
  "reviewedBy": "string | null",
  "reviewedAt": "ISO-8601 | null",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

## Preservation Rules

- Preserve useful field context even when it is not ready for publication.
- Redact customer identity, raw bills, exact addresses, meter serials, and private photos unless approved storage and permission exist.
- Link to evidence paths rather than relying on chat memory.
- Keep claim boundaries visible beside every context item.
- Do not mix unrelated CHOKMA, gambling, lottery, casino, or lead-scraping assets into SIRINX project context.

## Promotion Rule

1. Start as `Field Note`.
2. Promote to `Field-Validated Context` only when source evidence exists.
3. Move to `Project Context Under Review` before use in public copy, proposal claims, or package evidence.
4. Promote to `Approved Project Context` only after reviewer/approver is recorded.
5. Promote to `Promoted Evidence` only through an approval packet when the context supports package truth, ROI claims, or track-record publication.

## Non-Override Rule

Field-validated project context does not override:

- Locked Package Facts
- package price source of truth
- hardware package standards
- ROI claim status
- pilot project status
- telemetry redaction requirements
- legal/tax/BOI/ESG review requirements
- production deployment gates

## Package Truth Promotion Guardrail

Treat field-validated project context as validated project context or track-record context unless governance explicitly upgrades it to global package truth. Use `governance/records/PACKAGE_TRUTH_PROMOTION_GUARDRAIL_2026-04-23.md`.

Project context can support proposal preparation, case-study hypotheses, target models, and track-record drafts, but it cannot become a standard package scope, package proof, or global package truth without an approval packet that explicitly promotes it.

## Rollback Note

If field-validated context is published as a claim or package standard without approval, remove or downgrade the public copy, restore the last approved version, and move the record back to `Project Context Under Review`.

## Audit Trail Note

Save:

- project context record
- source evidence paths
- linked hardware/pilot/ROI/telemetry/track-record refs
- redaction status
- reviewer and approver
- public copy before/after
- rollback target

## Current Decision

Field-validated project context may be preserved and used for internal learning, proposal preparation, validated sales scenarios, target models, and case-study hypotheses. It is not public proof, package truth, or guaranteed ROI until reviewed and promoted through approval.
