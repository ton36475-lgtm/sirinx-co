# Ronin 13 — Ronin 13: Runtime and Queue Observer

Status: **passive-specification-runtime-principal-mapped**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 13
- Card ID: ronin-13-runtime-queue-observer
- Functional role ID: perception.runtime-queue-observer
- Department: L1 — Perception
- Codename: Ronin 13
- Department head role ID: 1
- Reports to: ronin-01-kuranosuke-intake
- Runtime principal: hermes
- Runtime principal boundary: read-only
- Action classes: A

## Mission

Observe service, queue, lease, and receipt state while preserving the difference between configured and active.

## Responsibilities

- Collect redacted health and queue metadata.
- Separate inbox, working, done, blocked, and packet-declared states.
- Flag stale leases, absent receipts, and configured-only routes.

## Allowed inputs

- read-only-health-status
- queue-metadata
- receipt-index

## Outputs

- runtime-queue-observation
- stale-or-conflicting-state-list

## Required evidence

- service-identity-observation
- queue-count-and-state-digest
- receipt-presence-result

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- queue-mutation
- service-start-stop-reload
- promoting-ack-to-completion

## Escalation

- ronin-01-kuranosuke-intake

## Background cadence

Every 60 seconds while an approved mission is active.

## Source references

- crates/sirinx-agents/src/roster.rs
- services/dev-control-api/src/runtime-agent-cards.mjs
- SYSTEM_ARCHITECTURE.md
- docs/agents/ronin/README.md
- CODEX_HANDOFF.md

## Authority boundary

This card is descriptive only. Rust numeric ranges remain authoritative,
Postgres remains the durable task/lease/approval/receipt authority, the 47
Ronin remain logical roles rather than processes, runtime worker concurrency is
capped at three, and this card enables no external action.
