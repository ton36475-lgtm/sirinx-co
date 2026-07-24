# Ronin 18 — SmeScorer: SME Segment Scorer

Status: **coded-rust-runtime-plus-passive-card**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 18
- Card ID: ronin-18-sme-scorer
- Functional role ID: analysis.sme-scorer
- Department: L2 — Analysis
- Codename: SmeScorer
- Department head role ID: 17
- Reports to: ronin-17-junai-lead-analyst
- Runtime principal: sirinx-rust-runtime
- Runtime principal boundary: compiled-runtime-only
- Action classes: A

## Mission

Apply the coded SME scoring profile and emit a Junai-compatible analysis envelope.

## Responsibilities

- Recognize supported SME business profiles.
- Apply the coded SME thresholds and usage assumptions.
- Forward a shape-compatible result to L3.

## Allowed inputs

- L1-lead-envelope
- SME-profile-fields
- coded-SME-policy

## Outputs

- lead-scored-envelope
- SME-analysis

## Required evidence

- input-digest
- threshold-result
- compatibility-result

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- pricing-promise
- customer-send
- policy-threshold-change

## Escalation

- ronin-17-junai-lead-analyst

## Background cadence

Event-driven for SME-classified intake.

## Source references

- crates/sirinx-agents/src/roster.rs
- services/dev-control-api/src/runtime-agent-cards.mjs
- SYSTEM_ARCHITECTURE.md
- docs/agents/ronin/README.md
- crates/sirinx-agents/src/scorer_sme.rs

## Authority boundary

This card is descriptive only. Rust numeric ranges remain authoritative,
Postgres remains the durable task/lease/approval/receipt authority, the 47
Ronin remain logical roles rather than processes, runtime worker concurrency is
capped at three, and this card enables no external action.
