# Hardware Context Governance

## Purpose

Prevent vendor or equipment information from overwriting SIRINX Locked Package Facts before executive confirmation. This allows LISINER, Solis, and future hardware references to be useful in sales engineering without becoming global package truth too early.

## Status Taxonomy

| Status | Meaning | Can Appear In Public Package Copy? | Approval Required |
| --- | --- | --- | --- |
| `Candidate Vendor Context` | Unverified supplier, inverter, panel, BESS, accessory, or installer option | No, except internal notes | Source evidence before promotion |
| `Field-Validated Hardware Context` | Hardware observed in real field work, vendor conversations, prior installed systems, or operational references | Only with `Review Required` label | Executive approval before package-standard use |
| `Track-Record Hardware Profile` | Hardware with collected reliability, service, warranty, performance, compatibility, and installation feedback | Only with `Review Required` label unless approved | Executive approval before package-standard use |
| `Locked Package Fact` | Approved package truth that may define a standard SIRINX package | Yes | Approval packet and executive confirmation |

## Hardware Context Record

Every hardware context entry must keep these fields:

```json
{
  "name": "Solis",
  "category": "inverter | panel | bess | mounting | ev_charger | accessory | supplier | installer",
  "status": "Candidate Vendor Context | Field-Validated Hardware Context | Track-Record Hardware Profile | Locked Package Fact",
  "sourceEvidence": ["datasheet | quotation | field reference | install record | service note | supplier approval | signed package scope"],
  "fieldNotes": "string",
  "knownRisks": "string",
  "packageImpact": "none | scenario-only | package-candidate | package-standard",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

## Field-Observed Hardware Stack

Use `governance/FIELD_OBSERVED_HARDWARE_STACK.md` when the information is not just one vendor or device, but a stack observed in field work. A stack can include inverter, panel, BESS, mounting, monitoring, protection, metering, and site constraints.

Field-observed stacks may support validated sales scenarios, target models, and case-study hypotheses, but they do not become global package truth until promoted through executive approval and an approval packet.

When a hardware stack is tied to a pilot project, link the stack record to `governance/PILOT_PROJECT_STATUS.md` and keep the pilot status separate from hardware package truth.

Preserved example:

- `governance/records/FIELD_OBSERVED_LISINER_LIQUID_COOLED_BESS_2026-04-23.md`: LISINER liquid-cooled BESS cabinet with integrated chiller system. This remains field-observed context until evidence and approval promote it.
- `governance/records/FIELD_OBSERVED_SOLIS_EMS_INVERTER_INTERFACE_2026-04-23.md`: Solis EMS / Solis industrial inverter interface. This remains field-observed inverter and EMS context until evidence and approval promote it.

## Hardware Integration Provenance Rule

Hardware integration knowledge must be stored with provenance notes. Use `governance/records/HARDWARE_INTEGRATION_PROVENANCE_GUARDRAIL_2026-04-23.md` for Solis EMS mappings, LISINER BESS/chiller signals, PCS/BMS/EMS boundaries, meter/CT mapping, protection settings, telemetry exports, alarms, O&M notes, and remote-access assumptions.

Integration notes may support internal engineering, telemetry mapping, proposal assumptions, pilot planning, and service runbook drafts. They do not override package facts, approve remote control, prove ROI, or authorize public claims.

## Promotion Rule

1. Start as `Candidate Vendor Context`.
2. Promote to `Field-Validated Hardware Context` only when field, supplier, or operational evidence exists.
3. Record full stack observations as `Field-Observed Hardware Stack` when multiple hardware components and site constraints are involved.
4. Promote to `Track-Record Hardware Profile` only when service, warranty, performance, compatibility, and installation feedback is collected.
5. Promote to `Locked Package Fact` only through executive confirmation and an approval packet.

## Non-Override Rule

LISINER, Solis, and any future supplier or equipment name must not overwrite:

- SIRINX identity
- core offer
- package scope
- pricing source of truth
- compliance boundaries
- public deployment lane

## Package Truth Promotion Guardrail

Treat hardware, project, and track-record context as governed context unless governance explicitly upgrades it to global package truth. Use `governance/records/PACKAGE_TRUTH_PROMOTION_GUARDRAIL_2026-04-23.md`.

Hardware context, field-observed stacks, pilot context, and track-record hardware profiles may inform engineering and proposal work, but they do not become global package truth unless an approval packet explicitly promotes them to `Locked Package Fact`.

## Rollback Note

If a vendor is accidentally promoted into Locked Package Facts, revert the package copy and data contract to the last approved package state, then move the vendor back to `Field-Validated Hardware Context` or `Track-Record Hardware Profile`.

## Audit Trail Note

Save:

- source evidence path
- field-observed stack record when applicable
- status before and after promotion
- approver
- affected public copy or calculator output
- validation command output
- rollback target

## Current Decision

LISINER and Solis may be documented as field-validated or track-record hardware context when evidence exists, but they are not global SIRINX package truth until executive approval promotes them.
