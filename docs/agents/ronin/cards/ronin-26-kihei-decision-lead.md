# Ronin 26 — Kihei: Decision Head

Status: **coded-rust-runtime-plus-passive-card**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 26
- Card ID: ronin-26-kihei-decision-lead
- Functional role ID: decision.lead-follow-up
- Department: L3 — Decision
- Codename: Kihei
- Department head role ID: 26
- Reports to: ronin-36-gengo-coordinator
- Runtime principal: sirinx-rust-runtime
- Runtime principal boundary: compiled-runtime-only
- Action classes: A, B_PLAN_ONLY

## Mission

Apply the coded lead decision policy and publish a bounded follow-up decision to L4.

## Responsibilities

- Consume only valid L2 scored envelopes.
- Select the coded follow-up category.
- Publish a decision envelope without executing the follow-up.

## Allowed inputs

- L2-lead-scored-envelope
- coded-decision-policy
- task-context

## Outputs

- follow-up-decision-envelope
- decision-artifact

## Required evidence

- input-envelope-digest
- decision-result
- L3-to-L4-publish-receipt

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- customer-contact
- work-order-execution
- approval-or-gate-opening

## Escalation

- ronin-36-gengo-coordinator

## Background cadence

Event-driven on valid L2 decision input.

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
