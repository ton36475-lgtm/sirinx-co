# ROI Scenario Modeling

## Purpose

Define how SIRINX creates ROI models for executive sales, target planning, case-study hypotheses, pilot review, and proposal preparation without turning modeled outputs into guaranteed claims.

ROI scenario modeling is a decision-support layer. It is not legal, tax, BOI, ESG, or financial advice, and it does not approve public claims by itself.

If a model uses field-validated project context, reference `governance/FIELD_VALIDATED_PROJECT_CONTEXT.md` and keep that context separate from verified claims.

## Model Status Taxonomy

| Model Status | Meaning | Public Claim Status It Can Support |
| --- | --- | --- |
| `Draft Model` | Incomplete or exploratory model | None |
| `Assumption-Based Estimate` | Model using stated user inputs or default assumptions | `Estimate` or `Review Required` |
| `Validated Sales Scenario Model` | Model reviewed against field context, prior proposal logic, or sales-engineering assumptions | `Validated Sales Scenario` |
| `Target Model` | Desired target-state model for boardroom planning and sensitivity review | `Target Model` |
| `Case-Study Hypothesis Model` | Model shaped as a possible case-study narrative awaiting final project/customer verification | `Case-Study Hypothesis` |
| `Pilot-Calibrated Model` | Model calibrated with governed pilot data | `Validated Sales Scenario` or `Case-Study Hypothesis` |
| `Verified Case Model` | Model backed by actual before/after bills and measured post-install data | `Verified` |

## Required Model Inputs

Every ROI scenario model must record:

```json
{
  "modelId": "string",
  "modelVersion": "string",
  "modelStatus": "Draft Model | Assumption-Based Estimate | Validated Sales Scenario Model | Target Model | Case-Study Hypothesis Model | Pilot-Calibrated Model | Verified Case Model",
  "currentMonthlyBillThb": "number | null",
  "targetMonthlyBillThb": "number | null",
  "tariffBasis": "string",
  "loadProfile": "string | unknown",
  "operatingHours": "string | unknown",
  "siteType": "factory | commercial | agriculture | residence | other | unknown",
  "systemSizeKw": "number | null",
  "estimatedAnnualGenerationKwh": "number | null",
  "selfConsumptionRatio": "number | null",
  "exportImportPolicy": "string | unknown",
  "batteryScope": "none | included | optional | unknown",
  "financeMode": "capex | ppa | lease | unknown",
  "capexThb": "number | null",
  "opexAnnualThb": "number | null",
  "incentiveAssumptions": ["string"],
  "hardwareStackRefs": ["string"],
  "pilotRefs": ["string"],
  "evidenceLinks": ["string"],
  "limitations": ["string"]
}
```

## Required Outputs

Every model output must separate the calculated result from the claim status:

```json
{
  "monthlySavingsRangeThb": {"low": "number | null", "base": "number | null", "high": "number | null"},
  "annualSavingsRangeThb": {"low": "number | null", "base": "number | null", "high": "number | null"},
  "paybackYearsRange": {"low": "number | null", "base": "number | null", "high": "number | null"},
  "lcoeRangeThbPerKwh": {"low": "number | null", "base": "number | null", "high": "number | null"},
  "scope2ReductionEstimateTonsCo2e": "number | null",
  "targetResidualBillThb": "number | null",
  "claimStatus": "Estimate | Validated Sales Scenario | Target Model | Case-Study Hypothesis | Review Required | Verified",
  "reviewRequired": true
}
```

## Preserved ROI Models

- `governance/records/ROI_TARGET_MODEL_250K_TO_50K_70K_2026-04-23.md`: target business case scenario reducing approximate monthly electricity cost from 250,000 THB toward 50,000-70,000 THB. Status: `Target Model`, review required, not verified and not guaranteed.

## Modeling Rules

- Use ranges, not single-point certainty, unless verified measured data exists.
- State assumptions beside every high-impact number.
- Keep hardware assumptions linked to governed hardware context records.
- Keep pilot assumptions linked to governed pilot project records.
- Do not use tax, BOI, ESG, carbon credit, or legal assumptions as verified unless responsible professionals have reviewed them.
- Do not infer universal performance from one site, one vendor, one pilot, or one bill.

## Specific Rule For `250,000 -> 50,000`

The examples `250,000 -> 50,000` and `250,000 -> 50,000-70,000` may be described only as:

- target scenario
- ROI model input
- case-study objective

They may be modeled only as:

- `Validated Sales Scenario Model`
- `Target Model`
- `Case-Study Hypothesis Model`
- `Pilot-Calibrated Model`
- `Review Required`

It must include:

- current bill basis
- target bill basis
- tariff basis
- system size assumption
- self-consumption assumption
- export/import assumption
- seasonal generation assumption
- battery/PPA/CapEx/Opex scope
- sensitivity range
- evidence links

It must not be written as:

- "guaranteed"
- "แน่นอน"
- "ทุกโรงงาน"
- "ลดได้ 80% ทุกเคส"
- guaranteed universal outcome
- achieved saving
- delivered result
- accepted handover outcome
- verified track record
- `Verified`, unless actual before/after bills and measured post-install data are attached.

## Validation Checklist

Before a model supports executive copy or proposal copy:

- model inputs are complete enough for the claim level
- high-impact outputs use ranges
- evidence links exist or the model is marked `Review Required`
- hardware stack refs do not override Locked Package Facts
- pilot refs do not imply universal results
- tax/BOI/ESG/legal assumptions are marked `Review Required`
- reviewer and review timestamp are recorded

## Rollback Note

If a model is found to be unsupported, mark it `Draft Model` or `Review Required`, remove any public copy derived from it, restore the last approved copy, and preserve the before/after diff.

## Audit Trail Note

Save:

- model input JSON
- model output JSON
- evidence links
- hardware stack refs
- pilot refs
- reviewer and approver
- public copy derived from model
- rollback target

## Current Decision

ROI scenario modeling is approved as a governed design contract. Publishing ROI claims from a model still requires claim governance, assumptions, evidence, review status, and approval gates.
