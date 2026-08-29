# Ronin 04 — PartnerReferralScanner: Partner Referral Lead Scanner

Status: **coded-rust-runtime-plus-passive-card**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 4
- Card ID: ronin-04-partner-referral-scanner
- Functional role ID: perception.partner-referral-scanner
- Department: L1 — Perception
- Codename: PartnerReferralScanner
- Department head role ID: 1
- Reports to: ronin-01-kuranosuke-intake
- Runtime principal: sirinx-rust-runtime
- Runtime principal boundary: compiled-runtime-only
- Action classes: A

## Mission

Normalize an approved partner referral into the shared L1 lead envelope with conservative provenance.

## Responsibilities

- Validate referral payload and required source metadata.
- Reject unsupported or ambiguous referral shapes.
- Publish only the lead envelope expected by L2 scorers.

## Allowed inputs

- approved-referral-payload
- partner-source-reference
- consent-metadata

## Outputs

- lead-scanned-envelope
- referral-validation-observation

## Required evidence

- referral-digest
- validation-result
- L1-to-L2-publish-receipt

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- partner-claim-or-endorsement
- external-partner-contact
- commercial-commitment

## Escalation

- ronin-01-kuranosuke-intake

## Background cadence

Event-driven on approved referral intake.

## Source references

- crates/sirinx-agents/src/roster.rs
- services/dev-control-api/src/runtime-agent-cards.mjs
- SYSTEM_ARCHITECTURE.md
- docs/agents/ronin/README.md
- crates/sirinx-agents/src/partner_referral.rs

## Authority boundary

This card is descriptive only. Rust numeric ranges remain authoritative,
Postgres remains the durable task/lease/approval/receipt authority, the 47
Ronin remain logical roles rather than processes, runtime worker concurrency is
capped at three, and this card enables no external action.
