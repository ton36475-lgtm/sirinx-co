# Ronin 17 — Jūnai: Lead Analysis Head

Status: **coded-rust-runtime-plus-passive-card**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 17
- Card ID: ronin-17-junai-lead-analyst
- Functional role ID: analysis.lead-scorer
- Department: L2 — Analysis
- Codename: Jūnai
- Department head role ID: 17
- Reports to: ronin-26-kihei-decision-lead
- Runtime principal: sirinx-rust-runtime
- Runtime principal boundary: compiled-runtime-only
- Action classes: A

## Mission

Apply the coded lead scoring policy to valid L1 envelopes and publish bounded analysis to L3.

## Responsibilities

- Validate the L1 lead envelope.
- Calculate coded lead temperature and ROI-adjacent analysis.
- Publish only the lead-scored envelope expected by Kihei.

## Allowed inputs

- L1-lead-scanned-envelope
- coded-scoring-policy
- bounded-lead-fields

## Outputs

- lead-scored-envelope
- lead-temperature-analysis

## Required evidence

- input-envelope-digest
- scoring-result
- L2-to-L3-publish-receipt

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- customer-contact
- sales-commitment
- follow-up-execution

## Escalation

- ronin-26-kihei-decision-lead

## Background cadence

Event-driven on each valid L1 lead envelope.

## Source references

- crates/sirinx-agents/src/roster.rs
- services/dev-control-api/src/runtime-agent-cards.mjs
- SYSTEM_ARCHITECTURE.md
- docs/agents/ronin/README.md
- crates/sirinx-agents/src/ronin.rs

## Authority boundary

This card is descriptive only. Rust numeric ranges remain authoritative,
Postgres remains the durable task/lease/approval/receipt authority, the 47
Ronin remain logical roles rather than processes, runtime worker concurrency is
capped at three, and this card enables no external action.
