# P092 Agentloop A2A2A Sync BRD

## Objective

Create a governed local automation loop that can coordinate SIRINX/GHOSTCLAW project work across website, LINE OA validation, CommandHermes, OpenCode/Claude executor lanes, and Codex review lanes without crossing production gates.

## Business Outcomes

- Preserve local-first, spec-driven execution across all active SIRINX project ecosystems.
- Give the operator one auditable packet for P092 decisions, locks, verification, and receipts.
- Prepare LINE OA webhook validation without customer messaging or production activation.
- Keep website trust and contact work aligned with future quote, ROI calculator, CRM, and agentic automation gates.

## In Scope

- Local docs, runbook, packet mirror, and receipt.
- Dry-run LINE webhook endpoint in `apps/public-web`.
- Signature verification helper for synthetic validation.
- Local verifier for P092 governance gates.
- Portfolio mapping for present and planned SIRINX projects.

## Out Of Scope

- Git push, merge, deploy, production webhook activation, customer messages, production analytics, CRM writes, paid provider calls, Cloudflare mutation, database migration, or secret reads.

## Portfolio Coverage

| Project | Current P092 State |
| --- | --- |
| SIRINX public website | Active local implementation in `apps/public-web` |
| SIRINX_SOLAR | Planned domain lane, no production mutation |
| POCKET_HATCHERY | Planned intake lane, no source mutation in this packet |
| AGM_CREATIVE | Planned intake lane, no source mutation in this packet |
| ADS_ANDROMEDA | Planned intake lane, no source mutation in this packet |
| PHITSANULOK_NEWS | Planned intake lane, no source mutation in this packet |
| GhostClaw OS | Control-plane/A2A2A alignment only |
| SIRINXDev monorepo | Governance, verifier, evidence, and receipt |

## Success Criteria

- P092 packet is mirrored into repo docs.
- LINE webhook dry-run code exists and is registered before the JSON body parser.
- Required locks remain `SIRINX_LINE_MODE=dry-run` and `SIRINX_LINE_AUTO_REPLY_APPROVED=false`.
- Local verifier passes.
- Evidence receipt exists and says no push, deploy, external write, or live send occurred.
