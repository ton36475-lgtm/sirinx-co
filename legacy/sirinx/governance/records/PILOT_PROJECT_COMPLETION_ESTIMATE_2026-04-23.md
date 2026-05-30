# Pilot Project Status Record: Completion Estimate 85-90 Percent

## Record Status

`Pilot Under Review`

This record preserves an operator-provided pilot project completion estimate. It is a planning and review checkpoint, not a completion certificate, not a customer acceptance record, not a public case study, and not evidence of package readiness.

## Pilot Status Snapshot

```json
{
  "pilotId": "pilot-context-2026-04-23",
  "pilotName": "Redacted SIRINX pilot project",
  "status": "Pilot Under Review",
  "customerContext": "redacted",
  "sourceType": "other",
  "sourceEvidence": [
    "pending: attach punch list, commissioning checklist, installation photos, monitoring screenshot, telemetry sample, or acceptance note"
  ],
  "completionPercentEstimate": {
    "min": 85,
    "max": 90,
    "basis": "operator-provided estimate",
    "claimStatus": "estimate_only"
  },
  "siteContext": {
    "buildingType": "unknown",
    "roofType": "unknown",
    "gridContext": "unknown",
    "monthlyBillRangeThb": "unknown"
  },
  "hardwareStackRefs": [
    "governance/records/FIELD_OBSERVED_LISINER_LIQUID_COOLED_BESS_2026-04-23.md",
    "governance/records/FIELD_OBSERVED_SOLIS_EMS_INVERTER_INTERFACE_2026-04-23.md"
  ],
  "roiScenarioRefs": [],
  "measuredDataRefs": [],
  "validatedFor": [
    "internal_reference",
    "target_model",
    "case_study_hypothesis"
  ],
  "limitations": [
    "No commissioning checklist attached in this record yet.",
    "No final punch-list closeout attached in this record yet.",
    "No customer acceptance note attached in this record yet.",
    "No measured generation, bill reduction, uptime, or telemetry validation attached in this record yet.",
    "Hardware references remain field-observed context and do not become package truth from this estimate."
  ],
  "knownRisks": [
    "Completion estimate may change after commissioning, safety review, telemetry validation, or customer acceptance.",
    "Do not publish this as 85-90% completed unless approved public wording is prepared.",
    "Do not infer ROI, payback, BOI, ESG, grid approval, or utility approval from this estimate."
  ],
  "reviewedBy": null,
  "reviewedAt": null,
  "approvedBy": null,
  "approvedAt": null
}
```

## Allowed Use

- Internal execution planning.
- Handoff readiness tracking.
- Pilot punch-list planning.
- Telemetry ingestion preparation.
- Case-study hypothesis planning with review marker.
- Target model calibration after evidence is attached.

## Not Allowed

- Do not present as final completion.
- Do not present as customer handover or acceptance.
- Do not present as proof of ROI, savings, uptime, generation, or package readiness.
- Do not present as evidence that LISINER or Solis is a global SIRINX package standard.
- Do not publish named client, site, photo, bill, telemetry, or performance claims without redaction and approval.

## Evidence Needed Before Promotion

- Final punch list and open issue log.
- Commissioning checklist.
- Safety/protection review note.
- Monitoring or telemetry sample.
- Installation photo set with redaction.
- Customer acceptance or internal handover note.
- Measured generation or bill reference if used in ROI modeling.
- Reviewer and approver signoff.

## Rollback Note

If this estimate is accidentally published as a completion, handover, ROI, or package-readiness claim, remove the public claim, restore the last approved copy, and keep the pilot status as `Pilot Under Review` until evidence and approval support promotion.

## Audit Trail Note

Save the estimate source, evidence attachments, punch-list updates, commissioning records, telemetry references, reviewer comments, and any proposal or public-copy references that use this record.
