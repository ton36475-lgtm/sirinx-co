# SIRINX Executive ROI Standard - 2026-04-23

## Purpose

Allow the executive-facing SIRINX version to use strong ROI and business-value framing without breaking the package, overclaiming legal/tax outcomes, or turning assumptions into guaranteed facts.

## Package Stability Rule

Executive content must be content/config driven where possible. Do not introduce new runtime dependencies, package manager changes, or framework rewrites only to adjust executive messaging.

Vendor, inverter, panel, BESS, and supplier names must not overwrite Locked Package Facts. LISINER, Solis, or any future supplier names are allowed only as `Candidate Vendor Context`, `Field-Validated Hardware Context`, `Field-Observed Hardware Stack`, `Track-Record Hardware Profile`, `Scenario`, or `Review Required` until executive confirmation and an approval packet promote them into package facts.

Before accepting executive-facing ROI changes:

```powershell
corepack pnpm run check
corepack pnpm run test
corepack pnpm run build
docker compose -f docker-compose.yml config
```

If the server bundle, Dockerfile, or deployment scripts change, also run Docker image build and runtime smoke.

## ROI Claim Levels

| Level | Allowed Use | Required Label |
| --- | --- | --- |
| Fact | Verified project data, actual bill data, measured generation, signed proposal values | `Verified` |
| Estimate | Calculator output using user-provided bill, tariff, system size, or irradiance assumptions | `Estimate` |
| Validated sales scenario | Sales or boardroom model supported by real field context, prior proposal logic, or reviewed assumptions, but not guaranteed | `Validated Sales Scenario` |
| Target model | Target-state model for boardroom planning, based on explicit input assumptions and sensitivity ranges | `Target Model` |
| Case-study hypothesis | Case-study style narrative or hypothesis derived from field patterns, awaiting final customer/project verification | `Case-Study Hypothesis` |
| Marketing hook | Short headline derived from a verified or estimated range | `Review Required` |

## Required ROI Wording

Use cautious framing:

- "ประเมินเบื้องต้น"
- "ขึ้นอยู่กับขนาดระบบ ค่าไฟ และรูปแบบการใช้พลังงาน"
- "ควรตรวจสอบกับข้อมูลหน้างานจริงก่อนตัดสินใจลงทุน"
- "ตัวเลขนี้เป็น validated sales scenario / target model สำหรับประกอบการพิจารณา ไม่ใช่การรับประกันผลตอบแทน"

Avoid absolute claims:

- "การันตีคืนทุน"
- "ลดภาษีได้แน่นอน"
- "ลดค่าไฟ 100% ทุกเคส"
- "ได้รับ BOI แน่นอน"
- "ผลตอบแทนดีที่สุดในตลาด"
- "ค่าไฟจาก 250,000 เหลือ 50,000 แน่นอน"
- "ลดค่าไฟได้ 80% ทุกโรงงาน"
- "guaranteed universal outcome"

## Specific High-Risk ROI Example Rule

If using an example such as monthly electricity cost `250,000 -> 50,000` or `250,000 -> 50,000-70,000`, it must be labeled as `Validated Sales Scenario`, `Target Model`, `Case-Study Hypothesis`, or `Review Required`, never `Verified` unless backed by actual project bills and measured post-install data.

The `250,000 -> 50,000-70,000` range may be described only as a target scenario, ROI model input, or case-study objective. Do not describe it as achieved savings, delivered result, accepted handover, verified track record, guaranteed outcome, or guaranteed universal outcome.

Preserved governed target model:

- `governance/records/ROI_TARGET_MODEL_250K_TO_50K_70K_2026-04-23.md`

ROI calculations must follow `governance/ROI_SCENARIO_MODELING.md`.
Governed claim records must follow `governance/ROI_SCENARIO_CLAIM_GOVERNANCE.md` and the ROI Scenario Record in `governance/DATA_CONTRACTS.md`.

If a claim references a pilot project, the pilot must have a governed status in `governance/PILOT_PROJECT_STATUS.md`. `Validated Pilot` can support a validated sales scenario or case-study hypothesis, but it does not create a guaranteed claim.

Required wording:

- "ตัวอย่าง validated sales scenario: หากค่าไฟปัจจุบันประมาณ 250,000 บาท/เดือน ภายใต้สมมติฐานขนาดระบบและรูปแบบการใช้ไฟที่เหมาะสม อาจประเมิน target model ค่าไฟหลังโครงการในกรอบตัวอย่าง เช่น 50,000 บาท/เดือน ทั้งนี้ต้องตรวจสอบด้วยข้อมูลหน้างานจริง"
- "ตัวเลขนี้เป็นแบบจำลองเพื่อประกอบการตัดสินใจ ไม่ใช่การรับประกันผลลัพธ์"

Required assumptions:

- current monthly bill and tariff basis
- load profile or operating hours
- proposed system size
- self-consumption ratio
- export/import policy assumption
- battery/PPA/CapEx/Opex scope if applicable
- seasonal generation and degradation assumptions
- maintenance and downtime assumptions

## Executive Version Content Contract

Every executive ROI asset must include:

- Objective: who the asset is for and what decision it supports.
- ROI model id/version when a model generated the numbers.
- Input assumptions: bill size, tariff, system size, battery scope, PPA/CapEx/Opex mode.
- Output range: savings, payback, LCOE, carbon impact, and risk notes.
- Review marker: tax, BOI, ESG, carbon credit, or legal statements must be marked `REVIEW REQUIRED` unless verified by the responsible professional.
- Evidence link: quote, bill, survey, project record, or calculation sheet.
- Vendor status: `Locked Package Fact`, `Candidate Vendor Context`, `Field-Validated Hardware Context`, `Field-Observed Hardware Stack`, `Track-Record Hardware Profile`, `Validated Sales Scenario`, `Target Model`, `Case-Study Hypothesis`, or `Review Required`.
- High-impact saving example status: if using `250,000 -> 50,000` or similar, mark it `Validated Sales Scenario`, `Target Model`, `Case-Study Hypothesis`, or `Review Required` with assumptions visible.

## Boardroom Metrics Allowed

- LCOE comparison as a validated sales scenario or target model, not a guarantee.
- Payback range such as `3-5 years` only when tied to assumptions.
- Scope 2 emissions reduction estimate with a visible calculation basis.
- Energy resilience framing for BESS/EV charger only when the system scope includes it.
- Carbon/ESG framing only as business positioning unless verified for a specific standard.

## Developer Guardrail

If an executive update asks for stronger ROI language, update copy and docs first. Do not change runtime architecture, package dependencies, auth, database, or Docker unless there is a direct technical requirement.

If an executive update names LISINER, Solis, or another equipment vendor, place it in `Field-Validated Hardware Context`, `Field-Observed Hardware Stack`, or `Track-Record Hardware Profile` first when field evidence exists. Keep it outside Locked Package Facts unless supporting evidence and executive package-standard approval are attached and reviewed.

## Approval Gate

Human review is required before publishing executive ROI content that mentions:

- tax incentives
- BOI
- carbon credits
- guaranteed payback
- legal compliance
- customer-specific savings
- large electricity-bill reduction examples such as `250,000 -> 50,000`

## Future Prevention

Keep ROI logic in calculators, data contracts, or documented assumptions. Keep marketing copy as a presentation layer. This prevents executive-facing language from breaking the package or silently changing business logic.
