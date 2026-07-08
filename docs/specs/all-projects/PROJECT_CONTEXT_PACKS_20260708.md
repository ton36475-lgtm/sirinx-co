# SIRINXDev All-Project Context Packs - 2026-07-08

Status: `LOCAL_ONLY_SPEC_FOUNDATION`
Authority: `SIRINXDev Agent-Native Governed Monorepo`

## Global Rules

- Local-first work only.
- No push without exact push gate.
- No deploy without exact deploy command.
- No LINE webhook activation without exact approval.
- No production analytics mutation without exact approval.
- No CRM/customer data storage without exact approval.
- No customer/social live send without exact approval.
- No secret read or secret print.

## SIRINX_SOLAR

Project intent:
Make `sirinx.co` the public trust, SEO/AEO, LINE Official, quote-readiness, and lead-capture surface for SIRINX solar work.

Current evidence:
- `vault/evidence/sirinx-web-line-trust-v1/EVIDENCE.md`
- `docs/receipts/PUBLIC_WEB_PUSH_GATE_BLOCKED_20260708.md`
- `docs/receipts/PUBLIC_WEB_PUSH_GATE_SUCCEEDED_20260708_1604.md`
- `docs/roadmaps/PUBLIC_WEB_GOAL_DEPENDENCY_LAYOUT_NEXT_GATE_20260708.md`

Allowed local actions:
- Rerun public-web tests, typecheck, build, and verifiers.
- Prepare browser UAT scripts and local screenshots.
- Draft `/quote`, ROI calculator, and CRM specs without storing customer data.

Blocked actions:
- No deploy.
- No LINE webhook activation.
- No production analytics mutation.
- No CRM/customer data storage.
- No customer live send.
- No secret read or secret print.

Next safe gate:
Human/GitHub review of `origin/feat/sirinx-web-line-trust-v1`, then an exact PR, merge, or deploy gate if the review approves the next remote action.

## POCKET_HATCHERY

Project intent:
Prepare a governed context/spec lane for Pocket Hatchery before any app, automation, CRM, or customer-data implementation.

Current evidence:
- `docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json`
- `docs/roadmaps/PUBLIC_WEB_GOAL_DEPENDENCY_LAYOUT_NEXT_GATE_20260708.md`
- `docs/NEXT_PHASE_EXECUTION_PLAN.md`

Allowed local actions:
- Inventory local source paths after owner confirms the active repo.
- Draft BRD/FRD/data contract locally.
- Draft local UAT and rollback plan.

Blocked actions:
- No push.
- No deploy.
- No production analytics mutation.
- No CRM/customer data storage.
- No customer live send.
- No paid provider call.
- No secret read or secret print.

Next safe gate:
Owner confirms active source path and local-only scope for Pocket Hatchery context pack creation.

## AGM_CREATIVE

Project intent:
Prepare AGM Creative as a governed creative/content system without social automation, publishing, paid provider calls, or customer messaging.

Current evidence:
- `docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json`
- `docs/roadmaps/PUBLIC_WEB_GOAL_DEPENDENCY_LAYOUT_NEXT_GATE_20260708.md`
- `docs/NEXT_PHASE_EXECUTION_PLAN.md`

Allowed local actions:
- Inventory local source paths after owner confirms the active repo.
- Draft brand/content workflow specs.
- Draft asset QA checklist and offline approval flow.

Blocked actions:
- No push.
- No deploy.
- No publish.
- No social live send.
- No production analytics mutation.
- No CRM/customer data storage.
- No paid provider call.
- No secret read or secret print.

Next safe gate:
Owner confirms AGM Creative active source path and approves local-only brand/content context pack drafting.

## ADS_ANDROMEDA

Project intent:
Prepare ADS Andromeda as a governed ads strategy and campaign-ops lane without paid provider calls or live campaign mutation.

Current evidence:
- `docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json`
- `docs/roadmaps/PUBLIC_WEB_GOAL_DEPENDENCY_LAYOUT_NEXT_GATE_20260708.md`
- `docs/NEXT_PHASE_EXECUTION_PLAN.md`

Allowed local actions:
- Draft campaign governance policy locally.
- Draft offline copy matrix and approval checklist.
- Draft analytics event taxonomy without production activation.

Blocked actions:
- No push.
- No deploy.
- No paid provider call.
- No ad account mutation.
- No production analytics mutation.
- No CRM/customer data storage.
- No customer/social live send.
- No secret read or secret print.

Next safe gate:
Approve exact paid-provider-free planning scope or provide explicit provider gate for any ad platform action.

## PHITSANULOK_NEWS

Project intent:
Prepare Phitsanulok News as a local editorial/SEO governance lane before any publish, social automation, or analytics mutation.

Current evidence:
- `docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json`
- `docs/roadmaps/PUBLIC_WEB_GOAL_DEPENDENCY_LAYOUT_NEXT_GATE_20260708.md`
- `docs/NEXT_PHASE_EXECUTION_PLAN.md`

Allowed local actions:
- Draft editorial policy and source attribution rules.
- Draft SEO/AEO schema review checklist.
- Draft local publishing rollback and correction workflow.

Blocked actions:
- No push.
- No deploy.
- No publish.
- No social live send.
- No production analytics mutation.
- No CRM/customer data storage.
- No paid provider call.
- No secret read or secret print.

Next safe gate:
Owner confirms active source path and approves editorial governance spec drafting before any publish lane opens.

## GHOSTCLAW_OS

Project intent:
Keep GhostClaw OS as the governed control-plane lane for local verifiers, receipts, dry-run automation, and agent orchestration safety.

Current evidence:
- `docs/NEXT_PHASE_EXECUTION_PLAN.md`
- `docs/PIPELINE_AUDIT_RUNBOOK.md`
- `docs/TELEGRAM_CONTROL_PLANE.md`

Allowed local actions:
- Add local verifier coverage.
- Add dry-run receipts.
- Update governance docs and task dependency maps.

Blocked actions:
- No push.
- No deploy.
- No cloud/runtime mutation.
- No Telegram live send.
- No production analytics mutation.
- No CRM/customer data storage.
- No paid provider call.
- No secret read or secret print.

Next safe gate:
Approve exact local verifier or dry-run receipt scope; keep runtime/cloud mutation blocked until an explicit gate exists.

## SIRINXDEV_AGENT_NATIVE_MONOREPO

Project intent:
Maintain the SIRINXDev monorepo as the canonical governed, spec-driven, local-first work surface for all project lanes.

Current evidence:
- `docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json`
- `docs/NEXT_PHASE_EXECUTION_PLAN.md`
- `docs/VIBECODING_READY_MONOREPO.md`
- `docs/receipts/ROOT_VERIFICATION_REPAIR_20260708.md`

Allowed local actions:
- Add local docs, receipts, verifiers, and plans.
- Run root checks and scoped package verification.
- Commit local changes after verification.

Blocked actions:
- No next push without an exact push gate.
- No deploy.
- No cloud/runtime mutation.
- No production analytics mutation.
- No CRM/customer data storage.
- No paid provider call.
- No secret read or secret print.

Next safe gate:
Keep local verification and evidence current; open only exact next gates for PR, merge, deploy, provider calls, cloud/runtime mutation, production analytics, or secret-handling work.
