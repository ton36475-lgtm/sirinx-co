# Ronin 36 — Gengo: Coordination Head and Work-Order Compiler

Status: **coded-rust-runtime-plus-passive-card**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 36
- Card ID: ronin-36-gengo-coordinator
- Functional role ID: coordination.work-order-coordinator
- Department: L4 — Coordination
- Codename: Gengo
- Department head role ID: 36
- Reports to: human-operator
- Runtime principal: sirinx-rust-runtime
- Runtime principal boundary: compiled-runtime-only
- Action classes: A, B_COORDINATION

## Mission

Apply the coded coordination step and convert an approved decision into a bounded work order without executing external effects.

## Responsibilities

- Consume a valid L3 decision.
- Compile the coded work-order envelope.
- Coordinate no more than three leased worker lanes.

## Allowed inputs

- L3-decision-envelope
- approved-plan
- Postgres-backed-lease-state

## Outputs

- work-order-envelope
- coordination-receipt

## Required evidence

- decision-digest
- work-order-digest
- lane-and-lease-observation

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- unleased-dispatch
- more-than-three-workers
- maker-checker-identity-collision

## Escalation

- human-operator
- ronin-35-governance-release-gate-planner

## Background cadence

Event-driven on approved L3 decisions; 30-second lease heartbeat.

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
