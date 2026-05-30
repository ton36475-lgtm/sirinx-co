# ROI Scenario Model: 250,000 THB Toward 50,000-70,000 THB Monthly Electricity Cost

## Record Status

`Target Model`

This record preserves a target business case scenario for executive planning. It is not a verified result, not a guaranteed savings claim, not a customer case study, and not legal, tax, BOI, ESG, or financial advice.

## Scenario Summary

```json
{
  "modelId": "roi-target-250k-to-50k-70k-2026-04-23",
  "modelVersion": "v1",
  "modelStatus": "Target Model",
  "inputs": {
    "currentMonthlyBillThb": 250000,
    "currentMonthlyBillBasis": "approximate operator-provided target business case input",
    "targetMonthlyBillThbRange": {
      "low": 50000,
      "high": 70000
    },
    "targetMonthlyBillBasis": "target planning range, not guaranteed",
    "tariffBasis": "unknown; must be verified from actual bill and tariff class",
    "loadProfile": "unknown; must be verified from interval data, operating schedule, or site survey",
    "operatingHours": "unknown",
    "siteType": "unknown",
    "systemSizeKw": null,
    "estimatedAnnualGenerationKwh": null,
    "selfConsumptionRatio": null,
    "exportImportPolicy": "unknown",
    "batteryScope": "unknown",
    "financeMode": "unknown",
    "capexThb": null,
    "opexAnnualThb": null,
    "incentiveAssumptions": [
      "No tax, BOI, ESG, carbon credit, or legal incentive is verified in this record."
    ],
    "hardwareStackRefs": [
      "governance/records/FIELD_OBSERVED_LISINER_LIQUID_COOLED_BESS_2026-04-23.md",
      "governance/records/FIELD_OBSERVED_SOLIS_EMS_INVERTER_INTERFACE_2026-04-23.md"
    ],
    "pilotRefs": [
      "governance/records/PILOT_PROJECT_COMPLETION_ESTIMATE_2026-04-23.md"
    ],
    "evidenceLinks": [
      "pending: attach current electricity bill",
      "pending: attach load profile or operating schedule",
      "pending: attach proposed system size and production model",
      "pending: attach tariff assumptions",
      "pending: attach battery/PPA/CapEx/Opex scope if used",
      "pending: attach telemetry or monitored generation if available"
    ],
    "limitations": [
      "The target residual bill range is a planning target, not a guaranteed post-install bill.",
      "No actual before/after bills are attached in this record.",
      "No measured generation, self-consumption, tariff class, demand charge, or export/import data is attached in this record.",
      "Hardware references remain field-observed context and do not become package truth from this model.",
      "The pilot completion estimate remains estimate-only and does not verify ROI."
    ]
  },
  "outputs": {
    "targetResidualMonthlyBillRangeThb": {
      "low": 50000,
      "high": 70000
    },
    "monthlySavingsRangeThb": {
      "low": 180000,
      "base": 190000,
      "high": 200000
    },
    "annualSavingsRangeThb": {
      "low": 2160000,
      "base": 2280000,
      "high": 2400000
    },
    "billReductionPercentRange": {
      "low": 72,
      "high": 80
    },
    "paybackYearsRange": {
      "low": null,
      "base": null,
      "high": null
    },
    "lcoeRangeThbPerKwh": {
      "low": null,
      "base": null,
      "high": null
    },
    "scope2ReductionEstimateTonsCo2e": null,
    "claimStatus": "Target Model",
    "reviewRequired": true
  },
  "reviewedBy": null,
  "reviewedAt": null,
  "approvedBy": null,
  "approvedAt": null
}
```

## Allowed Wording

- "Target business case scenario: current monthly electricity cost around 250,000 THB, with a target model toward 50,000-70,000 THB under verified site assumptions."
- "ROI model input: current monthly electricity cost around 250,000 THB and target residual bill objective of 50,000-70,000 THB for scenario planning."
- "Case-study objective: evaluate whether the site can move from approximately 250,000 THB/month toward a 50,000-70,000 THB/month target range under verified assumptions."
- "ตัวเลขนี้เป็น Target Model เพื่อประกอบการพิจารณา ต้องตรวจสอบด้วยบิลจริง โหลดโปรไฟล์ ขนาดระบบ และสมมติฐานหน้างานก่อนใช้ในข้อเสนอ"
- "ให้ใช้ช่วง 250,000 -> 50,000-70,000 เป็น target scenario, ROI model input, หรือ case-study objective เท่านั้น ไม่ใช่ผลลัพธ์จริงหรือการรับประกัน"
- "Estimated target range, not a guaranteed result and not a guaranteed universal outcome."

## Not Allowed

- Do not write "ลดจาก 250,000 เหลือ 50,000-70,000 แน่นอน".
- Do not write "ลดได้ 72-80% ทุกเคส".
- Do not present it as a guaranteed universal outcome.
- Do not present this as `Verified`.
- Do not present this as a final case study or customer result.
- Do not describe the range as achieved savings, delivered result, accepted handover, or verified track record.
- Do not imply tax, BOI, ESG, grid, utility, or carbon-credit approval from this target model.

## Evidence Needed Before Promotion

- Current electricity bill and tariff class.
- Demand charge and TOU details if applicable.
- Load profile, operating schedule, or interval meter data.
- Site survey and usable area.
- Proposed system size and generation simulation.
- Self-consumption and export/import assumptions.
- Battery, PPA, CapEx, Opex, degradation, and maintenance assumptions if used.
- Pilot telemetry or measured generation if the scenario is pilot-calibrated.
- Reviewer and approver signoff.

## Rollback Note

If this target model is accidentally published as a guaranteed saving, verified case study, or package-ready claim, remove the public copy, restore the last approved version, and mark the scenario as `Review Required` until assumptions and evidence are reviewed.

## Audit Trail Note

Save the calculation input, bill evidence, assumptions, hardware refs, pilot refs, reviewer comments, approved copy, validation output, and rollback target.
