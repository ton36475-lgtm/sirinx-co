# Ronin 02 — FbGroupScanner: Public Facebook Group Lead Scanner

Status: **coded-rust-runtime-plus-passive-card**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 2
- Card ID: ronin-02-fb-group-scanner
- Functional role ID: perception.fb-group-scanner
- Department: L1 — Perception
- Codename: FbGroupScanner
- Department head role ID: 1
- Reports to: ronin-01-kuranosuke-intake
- Runtime principal: sirinx-rust-runtime
- Runtime principal boundary: compiled-runtime-only
- Action classes: A

## Mission

Transform an approved public Facebook-group observation into the coded lead-scanned envelope.

## Responsibilities

- Accept only approved public-post content supplied to the task.
- Apply the coded parser and conservative lead defaults.
- Emit a Kuranosuke-compatible envelope for L2 scoring.

## Allowed inputs

- approved-public-post-snapshot
- source-provenance
- task-scope

## Outputs

- lead-scanned-envelope
- parser-observation

## Required evidence

- source-snapshot-digest
- parser-result
- L1-to-L2-publish-receipt

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- account-login-or-session-use
- private-group-scraping
- automated-contact-or-message

## Escalation

- ronin-01-kuranosuke-intake

## Background cadence

Event-driven only for explicitly supplied public snapshots.

## Source references

- crates/sirinx-agents/src/roster.rs
- services/dev-control-api/src/runtime-agent-cards.mjs
- SYSTEM_ARCHITECTURE.md
- docs/agents/ronin/README.md
- crates/sirinx-agents/src/fb_group.rs

## Authority boundary

This card is descriptive only. Rust numeric ranges remain authoritative,
Postgres remains the durable task/lease/approval/receipt authority, the 47
Ronin remain logical roles rather than processes, runtime worker concurrency is
capped at three, and this card enables no external action.
