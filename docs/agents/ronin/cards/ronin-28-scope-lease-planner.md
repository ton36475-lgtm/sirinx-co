# Ronin 28 — Ronin 28: Scope and Lease Planner

Status: **passive-specification-runtime-principal-mapped**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 28
- Card ID: ronin-28-scope-lease-planner
- Functional role ID: decision.scope-lease-planner
- Department: L3 — Decision
- Codename: Ronin 28
- Department head role ID: 26
- Reports to: ronin-26-kihei-decision-lead
- Runtime principal: hermes
- Runtime principal boundary: read-only
- Action classes: A, B_PLAN_ONLY

## Mission

Define exact files, resources, principals, exclusivity, expiry, and compare-and-swap conditions for a future lease.

## Responsibilities

- Translate impact analysis into exact target paths.
- Prevent overlapping writers and maker/checker collision.
- Specify heartbeat, expiry, and stale-lease behavior.

## Allowed inputs

- execution-plan
- ownership-candidate-map
- git-state-observation

## Outputs

- lease-plan
- scope-hash

## Required evidence

- exact-path-list
- principal-and-lane-map
- conflict-check

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- wildcard-or-traversal-scope
- lease-self-issuance
- stale-lease-reuse

## Escalation

- ronin-26-kihei-decision-lead

## Background cadence

For every source-affecting stage or ownership change.

## Source references

- crates/sirinx-agents/src/roster.rs
- services/dev-control-api/src/runtime-agent-cards.mjs
- SYSTEM_ARCHITECTURE.md
- docs/agents/ronin/README.md

## Authority boundary

This card is descriptive only. Rust numeric ranges remain authoritative,
Postgres remains the durable task/lease/approval/receipt authority, the 47
Ronin remain logical roles rather than processes, runtime worker concurrency is
capped at three, and this card enables no external action.
