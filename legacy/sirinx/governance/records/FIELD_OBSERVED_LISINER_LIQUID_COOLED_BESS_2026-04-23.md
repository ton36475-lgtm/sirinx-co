# Field-Observed Hardware Record: LISINER Liquid-Cooled BESS Cabinet

## Record Status

`Field-Observed Hardware Stack`

This record preserves an observed battery cabinet type for SIRINX engineering and proposal context. It is not a Locked Package Fact, not a universal package standard, and not a guaranteed performance or ROI claim.

## Observed Hardware

```json
{
  "stackName": "LISINER liquid-cooled BESS with integrated chiller system",
  "status": "Field-Observed Hardware Stack",
  "observedAt": "2026-04-23",
  "observedBy": "operator-provided field context",
  "sourceType": "other",
  "sourceEvidence": [
    "pending: attach photo, datasheet, quotation, site note, or service record"
  ],
  "siteContext": {
    "buildingType": "unknown",
    "roofType": "unknown",
    "gridContext": "unknown",
    "monthlyBillRangeThb": "unknown"
  },
  "hardware": {
    "inverter": [],
    "panel": [],
    "bess": [
      "LISINER liquid-cooled BESS cabinet",
      "integrated chiller system"
    ],
    "mounting": [],
    "evCharger": [],
    "monitoringGateway": [],
    "protectionAndMetering": []
  },
  "fieldNotes": [
    "Observed battery cabinet type: LISINER liquid-cooled BESS with integrated chiller system.",
    "Treat as field-observed BESS context until evidence is attached and reviewed.",
    "Can inform BESS shortlist, target model, and case-study hypothesis work."
  ],
  "knownRisks": [
    "No datasheet attached in this record yet.",
    "No warranty, service, thermal performance, PCS compatibility, or installation constraint evidence attached yet.",
    "Do not imply SIRINX package-standard selection until executive approval."
  ],
  "compatibilityNotes": [
    "Requires engineering review for PCS/inverter compatibility, site thermal load, ventilation, installation clearance, fire safety, monitoring integration, and O&M requirements."
  ],
  "serviceNotes": [
    "Integrated chiller system should be reviewed for maintenance interval, spare parts path, warranty terms, ambient-temperature operating limits, and fault handling."
  ],
  "confidence": "medium",
  "allowedUse": "internal_reference | validated_sales_scenario | target_model | case_study_hypothesis | package_candidate",
  "promotionTarget": "none",
  "approvedBy": null,
  "approvedAt": null
}
```

## Allowed Use

- Internal engineering reference.
- BESS option shortlist.
- Validated sales scenario with assumptions visible.
- Target model with sensitivity/range.
- Case-study hypothesis with review marker.
- Pilot/project context linkage after evidence is attached.

## Not Allowed

- Do not present as a global SIRINX package standard.
- Do not present as a guaranteed ROI driver.
- Do not claim superior thermal performance without datasheet or measured evidence.
- Do not imply legal, fire-safety, ESG, BOI, or compliance approval from this observation alone.

## Evidence Needed Before Promotion

- Product datasheet.
- Quotation or supplier confirmation.
- Installation/site photo or project note.
- Warranty and service terms.
- PCS/inverter compatibility note.
- Thermal/chiller maintenance note.
- Safety/compliance review note.

## Rollback Note

If this observation is accidentally used as a package-standard claim, remove the public claim, restore the previous approved package copy, and keep this record as `Field-Observed Hardware Stack` until evidence and executive approval promote it.

## Audit Trail Note

Save evidence attachments, reviewer comments, compatibility notes, and any proposal or public-copy references that use this record.
