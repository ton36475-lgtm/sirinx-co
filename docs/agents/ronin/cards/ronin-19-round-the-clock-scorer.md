# Ronin 19 — RoundTheClockScorer: 24/7 Operations Scorer

Status: **coded-rust-runtime-plus-passive-card**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 19
- Card ID: ronin-19-round-the-clock-scorer
- Functional role ID: analysis.round-the-clock-scorer
- Department: L2 — Analysis
- Codename: RoundTheClockScorer
- Department head role ID: 17
- Reports to: ronin-17-junai-lead-analyst
- Runtime principal: sirinx-rust-runtime
- Runtime principal boundary: compiled-runtime-only
- Action classes: A

## Mission

Apply the coded 24/7 load profile and emit a Kihei-compatible lead analysis.

## Responsibilities

- Recognize supported continuous-load profiles.
- Apply coded night-load adjustment without changing policy.
- Publish the shared scored-envelope shape.

## Allowed inputs

- L1-lead-envelope
- facility-profile
- coded-24x7-policy

## Outputs

- lead-scored-envelope
- round-the-clock-analysis

## Required evidence

- input-digest
- profile-selection-result
- compatibility-result

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- energy-savings-guarantee
- customer-send
- policy-factor-change

## Escalation

- ronin-17-junai-lead-analyst

## Background cadence

Event-driven for supported 24/7 intake.

## Source references

- crates/sirinx-agents/src/roster.rs
- services/dev-control-api/src/runtime-agent-cards.mjs
- SYSTEM_ARCHITECTURE.md
- docs/agents/ronin/README.md
- crates/sirinx-agents/src/scorer_round_the_clock.rs

## Authority boundary

This card is descriptive only. Rust numeric ranges remain authoritative,
Postgres remains the durable task/lease/approval/receipt authority, the 47
Ronin remain logical roles rather than processes, runtime worker concurrency is
capped at three, and this card enables no external action.
