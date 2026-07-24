# Ronin 03 — LineEventsScanner: LINE Event Lead Scanner

Status: **coded-rust-runtime-plus-passive-card**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 3
- Card ID: ronin-03-line-events-scanner
- Functional role ID: perception.line-events-scanner
- Department: L1 — Perception
- Codename: LineEventsScanner
- Department head role ID: 1
- Reports to: ronin-01-kuranosuke-intake
- Runtime principal: sirinx-rust-runtime
- Runtime principal boundary: compiled-runtime-only
- Action classes: A

## Mission

Normalize an approved LINE event fixture into the coded lead-scanned envelope without sending a message.

## Responsibilities

- Validate supported event shape.
- Extract bounded text and lead hints conservatively.
- Emit a Junai-compatible observation envelope.

## Allowed inputs

- approved-line-event-fixture
- event-provenance
- task-scope

## Outputs

- lead-scanned-envelope
- unsupported-event-observation

## Required evidence

- event-payload-digest
- shape-validation-result
- no-send-assertion

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- live-webhook-consumption-without-ticket
- LINE-provider-call
- customer-message-send

## Escalation

- ronin-01-kuranosuke-intake

## Background cadence

Event-driven for fixtures or separately approved ingress only.

## Source references

- crates/sirinx-agents/src/roster.rs
- services/dev-control-api/src/runtime-agent-cards.mjs
- SYSTEM_ARCHITECTURE.md
- docs/agents/ronin/README.md
- crates/sirinx-agents/src/line_events.rs

## Authority boundary

This card is descriptive only. Rust numeric ranges remain authoritative,
Postgres remains the durable task/lease/approval/receipt authority, the 47
Ronin remain logical roles rather than processes, runtime worker concurrency is
capped at three, and this card enables no external action.
