# Ronin 34 — Ronin 34: A2A and Telegram Integration Authority

Status: **passive-specification-runtime-principal-mapped**
Specification mode: **passive-specification**
Executable role definition: **no**

## Identity

- Role ID: 34
- Card ID: ronin-34-a2a-telegram-integration-authority
- Functional role ID: decision.a2a-telegram-integration
- Department: L3 — Decision
- Codename: Ronin 34
- Department head role ID: 26
- Reports to: ronin-26-kihei-decision-lead
- Runtime principal: codex
- Runtime principal boundary: write-with-exact-path-lease-for-l4-only
- Action classes: A, B_PLAN_ONLY

## Mission

Decide A2A task/card/auth mapping and Telegram status, draft, fixed-destination, idempotency, and approval-link behavior.

## Responsibilities

- Separate A2A v1 boundary from private compatibility routes.
- Keep Telegram as reporting and draft surface.
- Define duplicate, ambiguous-effect, SSRF, and authentication tests.

## Allowed inputs

- A2A-observation
- Telegram-readiness-observation
- API-contract-analysis

## Outputs

- A2A-Telegram-decision
- integration-test-plan

## Required evidence

- protocol-mapping
- trust-and-auth-model
- no-live-send-default

## Prohibited actions

- secret-read-or-disclosure
- self-approval-or-risk-downgrade
- unleased-source-or-runtime-mutation
- external-action-without-an-exact-unexpired-task-specific-ticket
- claiming-completion-without-independent-evidence
- peer-activation
- Telegram-provider-call
- raw-chat-approval-as-authority

## Escalation

- ronin-26-kihei-decision-lead

## Background cadence

On protocol, card, bot, route, or gate change.

## Source references

- crates/sirinx-agents/src/roster.rs
- services/dev-control-api/src/runtime-agent-cards.mjs
- SYSTEM_ARCHITECTURE.md
- docs/agents/ronin/README.md
- docs/TELEGRAM_CONTROL_PLANE.md
- crates/sirinx-a2a

## Authority boundary

This card is descriptive only. Rust numeric ranges remain authoritative,
Postgres remains the durable task/lease/approval/receipt authority, the 47
Ronin remain logical roles rather than processes, runtime worker concurrency is
capped at three, and this card enables no external action.
