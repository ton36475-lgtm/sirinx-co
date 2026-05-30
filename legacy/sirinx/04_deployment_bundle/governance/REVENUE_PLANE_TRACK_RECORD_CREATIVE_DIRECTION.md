# Revenue-Plane Track Record Creative Direction

## Purpose

Define how SIRINX presents track record sections on the public revenue plane (`sirinx.co`) in a credible, executive-grade, evidence-led way without turning field notes, pilot data, hardware stacks, or ROI models into unsupported claims.

The goal is to make the public website persuasive while preserving technical credibility, privacy, and governance.

When track record content is based on field-validated project context, preserve the source context under `governance/FIELD_VALIDATED_PROJECT_CONTEXT.md` and keep public copy redacted and claim-labeled.

## Creative Principle

Track record sections should feel like:

- executive proof, not hype
- engineering evidence, not ad noise
- calm confidence, not guaranteed promises
- Thai-first, premium, and boardroom-ready
- anonymized unless client permission exists

## Approved Track Record Content Types

| Content Type | Purpose | Required Governance |
| --- | --- | --- |
| `Verified Case` | Show actual project outcome with before/after evidence | Evidence review and approval |
| `Validated Pilot` | Show pilot learning and limited validation | `governance/PILOT_PROJECT_STATUS.md` |
| `Field-Observed Stack` | Show hardware/installation learning from field context | `governance/FIELD_OBSERVED_HARDWARE_STACK.md` |
| `Track-Record Hardware Profile` | Show accumulated hardware reliability/service insight | `governance/HARDWARE_CONTEXT_GOVERNANCE.md` |
| `ROI Target Model` | Show boardroom planning model | `governance/ROI_SCENARIO_MODELING.md` |
| `Case-Study Hypothesis` | Show plausible story awaiting final project/customer verification | `Review Required` |

## Track Record Creative Record

Every public or draft track record item must preserve:

```json
{
  "trackRecordId": "string",
  "title": "string",
  "displayStatus": "Verified Case | Validated Pilot | Field-Observed Stack | Track-Record Hardware Profile | ROI Target Model | Case-Study Hypothesis | Review Required",
  "publicVisibility": "draft | internal_only | public_ready | published",
  "clientIdentityStatus": "anonymous | permission_granted | internal_only",
  "evidenceTier": "none | internal_note | field_observed | pilot_validated | measured_verified",
  "sourceRefs": ["string"],
  "hardwareStackRefs": ["string"],
  "pilotRefs": ["string"],
  "roiModelRefs": ["string"],
  "claimStatus": "Verified | Estimate | Validated Sales Scenario | Target Model | Case-Study Hypothesis | Review Required",
  "redactionStatus": "redacted | not_applicable",
  "publicCopy": "string",
  "visualAssetRefs": ["string"],
  "reviewedBy": "string | null",
  "reviewedAt": "ISO-8601 | null",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

## Section Patterns

Use these patterns for `sirinx.co` track record sections:

- `Evidence Strip`: three to five compact proof blocks, each with status label and evidence type.
- `Pilot Learning Timeline`: proposed, active, under review, validated, promoted evidence.
- `Field Stack Cards`: inverter/panel/BESS/mounting/monitoring stack with field notes and confidence level.
- `ROI Target Model Card`: model assumptions, savings range, payback range, claim status, and review marker.
- `Operations Proof`: monitoring, maintenance, response, telemetry, and audit-readiness.
- `Anonymous Case Study`: sector, site type, challenge, approach, model result, review status.

## Public Copy Patterns

Allowed wording:

- "จากข้อมูลหน้างานและสมมติฐานที่ตรวจทานแล้ว"
- "validated sales scenario สำหรับประกอบการตัดสินใจ"
- "target model ภายใต้เงื่อนไขที่ระบุ"
- "case-study hypothesis ที่รอการยืนยันจากข้อมูลโครงการจริง"
- "field-observed hardware stack ไม่ใช่มาตรฐานแพ็กเกจทุกงาน"
- "ผลลัพธ์จริงขึ้นอยู่กับขนาดระบบ โหลดไฟ และข้อมูลหน้างาน"

Avoid:

- "การันตี"
- "แน่นอน"
- "ดีที่สุดในตลาด"
- "ลดได้ทุกโรงงาน"
- "ลูกค้ารายนี้ยืนยันแล้ว" without permission and evidence
- "ได้รับ BOI แน่นอน"
- "ค่าไฟจาก 250,000 เหลือ 50,000 แน่นอน"

## Visual Direction

- Use dark-blue/graphite base with clean-energy gold and white space.
- Track Record pages must use premium real-world imagery only, governed by `governance/records/EXECUTIVE_UI_TRACK_RECORD_IMAGERY_DIRECTIVE_2026-04-23.md`.
- Prefer real solar carport, smart hotel, BESS, EV charger, EMS, monitoring, or comparable commercial/industrial installation imagery with approved redaction.
- Use status badges: `Verified`, `Pilot`, `Field Observed`, `Target Model`, `Review Required`.
- Use measured-value cards only when the claim status supports them.
- Use anonymized real site visuals unless project photos are explicitly approved.
- Use charts with ranges and assumptions, not single-point certainty.
- Avoid fake customer logos, fake testimonials, stock images presented as real projects, AI-generated site photos presented as real installations, fantasy renders presented as proof, or exact site locations without permission.

## Revenue-Plane Rules

- The public revenue plane can use persuasive layout, hierarchy, and motion, but claims must remain evidence-led.
- Track record content must not mix CHOKMA, gambling, lottery, casino, or unrelated conversion-funnel assets.
- Track record sections must not expose raw customer PII, exact addresses, raw bills, meter serials, or unapproved project photos.
- Track record copy must link back to governed records where applicable.
- Track record visuals must preserve source, permission, redaction status, and linked governance references before public use.
- Track record context stays track-record context unless governance explicitly upgrades it to global package truth through `governance/records/PACKAGE_TRUTH_PROMOTION_GUARDRAIL_2026-04-23.md` and an approval packet.

## Approval Gate

Human review is required before publishing a track record section that includes:

- named customer or logo
- project photos
- before/after bills
- `250,000 -> 50,000` or similar high-impact ROI examples
- vendor/hardware package-standard implications
- BOI, tax, legal, ESG, or carbon-credit claims
- pilot data presented as case-study proof

## Rollback Note

If a track record section publishes unsupported or over-specific claims, remove the section or downgrade it to `Review Required`, restore the last approved copy, and preserve the before/after diff.

## Audit Trail Note

Save:

- track record creative record
- source evidence paths
- visual asset refs
- reviewer and approver
- public copy before/after review
- claim status
- rollback target

## Current Decision

Revenue-plane track record sections may use strong creative direction, but every proof point must remain tied to governed evidence, claim status, redaction status, and approval gates.
