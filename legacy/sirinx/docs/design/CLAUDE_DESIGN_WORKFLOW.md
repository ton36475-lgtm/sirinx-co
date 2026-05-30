# SIRINX Claude Design Workflow

## Purpose

Define the governed design-lane flow for exporting premium prototype packets, importing them into the canonical SIRINX repo, and validating them before they can influence runtime code or server handoff.

## Workflow

1. Start from locked SIRINX facts and approved field context.
2. Build a concept packet for a mobile-first, premium clean-tech experience.
3. Prototype a 3D or interactive scroll journey only when it supports comprehension and performance.
4. Export a design ZIP or prompt packet.
5. Normalize the export into canonical repo files under `apps/web/` or `docs/design/`.
6. Patch the real runtime in `client/` only after validation.
7. Route the package through Validator and Delivery before it enters `04_deployment_bundle/`.

## Nate Herk Style Adaptation For SIRINX

- start from a strong hero narrative with one economic promise and one trust anchor
- build page flow around narrative transitions instead of generic cards
- keep motion purposeful and tied to scroll progress
- emphasize premium engineering, real projects, and clean operational clarity
- every section must justify its existence in the conversion path

## 3D And Interactive Scroll Guidance

- use layered depth, parallax, and reveal motion sparingly
- prioritize readability and LCP over decorative effects
- interactive scroll scenes must degrade gracefully on mobile and low-power devices
- do not ship motion that obscures facts, pricing, or trust evidence

## Hero Media Prompt Rules

- hero media must reflect premium clean-energy transformation, not stock-tech cliches
- use real-world solar and energy imagery where available
- avoid speculative visuals that imply unvalidated hardware claims
- never mutate package truth or ROI wording through imagery captions

## Track Record Imagery Rules

- Track Record pages must use premium real-world imagery only
- do not fabricate installation evidence
- do not use anime, gacha, cartoon, casino, or unrelated visual language
- real-world imagery must remain permission-aware and reviewable

## Mobile-First Validation

- validate core layout at narrow mobile widths first
- check sticky actions, hero legibility, section order, and image crop behavior
- preserve fast scroll, low CLS, and readable CTA hierarchy

## Export To Codex Handoff

- export design ZIP or packet into `apps/web/`
- map assets and content decisions back to canonical files
- never serve imported exports directly from `apps/web/`
- Codex patches canonical source in `client/`, `docs/design/`, or `governance/`

## Guardrails

- no locked fact mutation
- no guaranteed ROI claims
- LISINER and Solis remain field context only
- the 250,000 THB to 50,000-70,000 THB scenario remains a model, not a guarantee

