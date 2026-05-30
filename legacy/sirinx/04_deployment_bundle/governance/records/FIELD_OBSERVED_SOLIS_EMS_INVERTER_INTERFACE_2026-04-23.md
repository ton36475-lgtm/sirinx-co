# Field-Observed Hardware Record: Solis EMS / Industrial Inverter Interface

## Record Status

`Field-Observed Hardware Stack`

This record preserves observed inverter and EMS context for SIRINX engineering, proposal, and pilot planning. It is not a Locked Package Fact, not a universal package standard, and not a guaranteed performance or ROI claim.

## Observed Hardware

```json
{
  "stackName": "Solis EMS / Solis industrial inverter interface",
  "status": "Field-Observed Hardware Stack",
  "observedAt": "2026-04-23",
  "observedBy": "operator-provided field context",
  "sourceType": "other",
  "sourceEvidence": [
    "pending: attach photo, datasheet, interface screenshot, quotation, site note, or commissioning record"
  ],
  "siteContext": {
    "buildingType": "unknown",
    "roofType": "unknown",
    "gridContext": "unknown",
    "monthlyBillRangeThb": "unknown"
  },
  "hardware": {
    "inverter": [
      "Solis industrial inverter interface"
    ],
    "panel": [],
    "bess": [],
    "mounting": [],
    "evCharger": [],
    "monitoringGateway": [
      "Solis EMS"
    ],
    "protectionAndMetering": []
  },
  "fieldNotes": [
    "Observed inverter / EMS context: Solis EMS / Solis industrial inverter interface.",
    "Treat as field-observed inverter and EMS context until evidence is attached and reviewed.",
    "Can inform telemetry ingestion mapping, industrial proposal assumptions, pilot planning, and integration checklist work."
  ],
  "knownRisks": [
    "No datasheet, interface screenshot, commissioning record, or telemetry export evidence attached in this record yet.",
    "No confirmed Modbus, API, cloud portal, meter, CT, PCS, or BESS integration boundary attached yet.",
    "Do not imply SIRINX package-standard selection until executive approval."
  ],
  "compatibilityNotes": [
    "Requires engineering review for inverter model, firmware, grid code settings, meter/CT wiring, telemetry export method, EMS control permissions, BESS coordination, and alarm/event mapping.",
    "If used with BESS, preserve clear ownership boundaries between inverter control, EMS control, PCS/BMS control, and customer facility constraints."
  ],
  "serviceNotes": [
    "Solis EMS and inverter interface should be reviewed for commissioning workflow, account ownership, data retention, alert routing, remote access permission, and service escalation path."
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
- Inverter / EMS shortlist.
- Telemetry ingestion mapping and data contract planning.
- Validated sales scenario with assumptions visible.
- Target model with sensitivity/range.
- Case-study hypothesis with review marker.
- Pilot/project context linkage after evidence is attached.

## Not Allowed

- Do not present as a global SIRINX package standard.
- Do not present as a guaranteed ROI or uptime driver.
- Do not claim superior EMS, inverter efficiency, grid support, or monitoring capability without datasheet or measured evidence.
- Do not imply legal, utility, grid-code, ESG, BOI, or compliance approval from this observation alone.
- Do not grant remote-control assumptions unless permission scope and security review are documented.

## Evidence Needed Before Promotion

- Product datasheet and exact model names.
- Interface screenshot or commissioning note.
- Communication protocol note such as Modbus, API, cloud export, meter/CT mapping, or CSV export.
- Quotation or supplier confirmation.
- Warranty and service terms.
- Grid code and protection setting review.
- Telemetry ingestion test sample.
- Security and account ownership review for remote access.

## Rollback Note

If this observation is accidentally used as a package-standard claim, remove the public claim, restore the previous approved package copy, and keep this record as `Field-Observed Hardware Stack` until evidence and executive approval promote it.

## Audit Trail Note

Save evidence attachments, reviewer comments, telemetry mapping notes, compatibility notes, and any proposal or public-copy references that use this record.
