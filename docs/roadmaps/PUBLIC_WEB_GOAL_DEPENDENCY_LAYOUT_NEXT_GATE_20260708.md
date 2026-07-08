# Public Web Goal Dependency Layout - Next Gate

Status: `LOCAL_VALIDATED_PUSH_BLOCKED`
Date: 2026-07-08
Owner lane: Codex Builder local worker

## Purpose

This document converts the active broad goal into a governed dependency layout
for the next safe execution gates. It does not change website UI, routes, remote
configuration, webhook state, analytics, CRM, or customer data storage.

## Current Public Web State

| Area | State | Evidence |
| --- | --- | --- |
| `apps/public-web` dependency layout | locally repaired | `docs/receipts/PUBLIC_WEB_DEPENDENCY_LAYOUT_REPAIR_20260708.md` |
| LINE/i18n/trust bundle | locally committed | `c75c9ef7` |
| Competitor SWOT/AEO backlog | locally committed | `4103d3ef` |
| Push gate | blocked by GitHub HTTPS credential | `docs/receipts/PUBLIC_WEB_PUSH_GATE_BLOCKED_20260708.md` |
| Evidence packet | updated to current gate | `vault/evidence/sirinx-web-line-trust-v1/EVIDENCE.md` |

## Dependency Graph

```mermaid
flowchart TD
  A["Local public-web validation"] --> B["GitHub credential repair"]
  B --> C["Exact approved push retry"]
  C --> D["Human diff and evidence review"]
  D --> E["Preview deploy gate with exact command"]
  E --> F["Browser UAT and real-device LINE QR scan"]
  F --> G["Production deploy gate with exact command"]
  G --> H["Post-deploy read-only monitoring"]

  D --> Q["/quote and ROI sprint spec"]
  Q --> R["Local quote/ROI implementation"]
  R --> S["CRM/customer storage gate"]
  S --> T["CRM production wiring"]

  F --> L["LINE rich menu/webhook spec"]
  L --> M["LINE webhook activation gate"]
  M --> N["LINE production automation"]
```

## Required Gate Order

1. Keep the current local branch intact and review the three local commits.
2. Repair GitHub credentials or provide a new exact remote/auth gate.
3. Retry only the approved push command:

```bash
git push origin feat/sirinx-web-line-trust-v1
```

4. Review GitHub branch/PR evidence after the push.
5. Approve preview deploy with a real target and exact command.
6. Run browser UAT and real-device LINE QR scan.
7. Approve production deploy only after preview evidence.
8. Keep webhook, analytics, CRM, and customer storage blocked until separate
   exact gates exist.

## All-Project Rollout Dependency Layout

| Project | Next Safe Local Work | Blocked Until |
| --- | --- | --- |
| SIRINX_SOLAR / sirinx.co | Push blocked local public-web bundle after credential repair; continue browser UAT | GitHub credential and exact push retry |
| POCKET_HATCHERY | Create context/spec pack only; no deploy or data mutation | Project owner confirms active repo/source |
| AGM_CREATIVE | Create context/spec pack only; no social automation | Project owner confirms active repo/source |
| ADS_ANDROMEDA | Create context/spec pack only; no paid provider calls | Paid ad/provider gate |
| PHITSANULOK_NEWS | Create editorial/SEO governance spec only; no publish | Publishing approval |
| GhostClaw OS | Continue local verifier/agent governance docs only | Runtime/cloud mutation gate |
| SIRINXDev Agent-Native Monorepo | Maintain governed receipts, verifiers, and task dependency maps | Exact push/deploy/provider gates |

## Public Web Sprint Backlog After Push

| Backlog Item | Dependency | Verification |
| --- | --- | --- |
| Browser UAT TH/EN/CN across public pages | pushed branch or local preview | screenshot/report packet |
| Existing bot manual confirmation | local preview and human click test | UAT receipt |
| Real-device LINE QR scan | phone scan by human | manual acceptance note |
| `/assessment` dynamic warning i18n | separate scoped refactor | language-switch verifier update |
| `/quote` intake spec | push/review stable | BRD/FRD/UI flow/test cases |
| ROI calculator upgrade | `/quote` spec approved | unit tests and build |
| CRM lead capture | explicit CRM/customer storage approval | data contract/RLS/security review |

## Stop Conditions

Stop and request a narrower gate if any of these occur:

- GitHub auth requires reading or printing secrets.
- Remote URL must be changed.
- Deploy command is a placeholder or missing target.
- Webhook, analytics, or CRM/customer data storage is requested without exact
  approval.
- Browser UAT finds visible regression in language switch, LINE CTA, existing
  bot, or mobile layout.

## Next Safe Action

Resolve GitHub credential outside the repo or provide an exact remote/auth gate,
then retry the already-approved push command. Do not deploy until the push and
review evidence are settled.
