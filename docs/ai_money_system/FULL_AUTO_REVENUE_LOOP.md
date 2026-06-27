# Full Auto Revenue Loop

Status: full-auto execution spec.

## Loop

```text
DeerFlow -> research market/hooks/offers
Codex -> docs/templates/scripts/landing scaffold
Ponytail -> review code and complexity
Flowise -> chatbot and lead qualifier
n8n -> route leads and reports
Twenty -> CRM and deals
Chatwoot -> inbox and conversation tracking
Postiz -> owned-channel scheduling
Mautic/listmonk -> opt-in nurture
Metabase -> revenue dashboard
Obsidian/Hermes -> memory and weekly summary
```

## Auto Allowed

- market research
- content drafts
- content calendar
- lead tracker rows from allowed sources
- CRM updates
- case-study drafts
- KPI summaries
- owned-channel publishing within policy
- opt-in follow-up within policy

## Hard Blocked

- secret printing
- spam
- non-opt-in messaging
- disabling auth/security
- destructive delete without backup
- false claims
- spend over budget
- raw public database/model/vector exposure

## Runtime Output

`~/SIRINXDev/.ghostclaw_runtime/ai_money/`

## Visual RAG Revenue Use Cases

Visual RAG supports revenue work by turning screenshots and layout-heavy
documents into evidence-backed audits:

- Local Business: screenshot a shop page and draft a before/after visual audit.
- Ads Andromeda: analyze competitor creative, landing layout, offer banners,
  and CTA placement.
- AGM Academy: create portfolio visual feedback from student examples.
- Phitsanulok United News: audit local media layout and sponsor placement.
- SIRINX: inspect datasheets, tariff tables, PPA/FiT docs, proposal PDFs, and
  competitor solar landing pages.

## A2A Sync Revenue Routing

AI Money tasks that need multi-agent coordination can route through A2A Sync:

```text
Revenue goal -> KOB fast planner -> A2A task -> Codex local artifact generator -> content/lead/KPI artifacts -> KOB summary
```

This is useful for daily content calendars, lead board updates, case-study
drafts, and local revenue summaries. External publishing, customer messaging,
paid provider calls, and CRM connector activation remain controlled by
autopilot policy, opt-in rules, budget caps, rate limits, and kill switch.
