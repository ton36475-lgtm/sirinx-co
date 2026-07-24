# Ronin 01 — Kuranosuke: Intake and Lead Normalization Head

Status: **coded-rust-runtime-plus-passive-card**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 1
- Card ID: ronin-01-kuranosuke-intake
- Functional role ID: intake.command-normalizer
- Department: L1 — Perception
- Codename: Kuranosuke
- Department head role ID: 1
- Reports to: ronin-17-junai-lead-analyst
- Runtime principal: sirinx-rust-runtime
- Runtime principal boundary: compiled-runtime-only
- Action classes: A

## Mission

Normalize bounded intake into a validated L1 observation envelope compatible with the coded lead pipeline.

## Responsibilities

- Validate declared input shape without reading secrets.
- Remove irrelevant noise while preserving consent and provenance fields.
- Forward only an observation envelope to L2; never select or execute an action.

## Allowed inputs

- approved-goal
- bounded-lead-or-command-payload
- declared-consent-and-source-metadata

## Outputs

- observation-envelope
- normalized-lead-envelope

## Required evidence

- input-payload-digest
- shape-validation-result
- L1-to-L2-publish-receipt

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- tool-execution
- risk-classification
- approval-or-gate-decision

## Escalation

- ronin-17-junai-lead-analyst

## Background cadence

Event-driven on each admitted intake.

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
