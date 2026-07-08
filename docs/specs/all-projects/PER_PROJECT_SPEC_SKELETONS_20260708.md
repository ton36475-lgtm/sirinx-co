# SIRINXDev Per-Project Spec Skeletons - 2026-07-08

Status: `LOCAL_ONLY_DRAFT_PENDING_SOURCE_CONFIRMATION`
Authority: `SIRINXDev Agent-Native Governed Monorepo`
Source map: `docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json`
Backlog: `docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json`

## Global Gate Policy

- No push approval in this skeleton.
- No deploy approval in this skeleton.
- No LINE webhook activation approval in this skeleton.
- No production analytics approval in this skeleton.
- No CRM/customer data storage approval in this skeleton.
- No paid provider approval in this skeleton.
- No customer/social live send approval in this skeleton.
- No secret read or secret print.

## SIRINX_SOLAR

Source status: `pending_human_confirmation`

### BRD

- Business objective: make `sirinx.co` the trusted public surface for solar, LINE Official contact, quote readiness, ROI education, and future gated lead capture.
- Success evidence: local public-web verification, evidence packet, browser UAT, LINE QR manual confirmation, and exact gate receipts.
- Non-goals: no deploy, no live webhook, no production analytics mutation, no CRM/customer data storage.

### FRD

- Required features: language-safe public pages, LINE CTA visibility, existing bot preservation, `/quote` planning, ROI calculator planning, and trust/SEO content governance.
- Required controls: feature work remains behind source confirmation, local verification, evidence packet, and exact push/deploy gate review.
- Non-goals: no production automation or external customer messaging.

### DATA_CONTRACT

- Local-only entities: contact channel metadata, quote-intent draft fields, ROI input draft fields, evidence status, and UAT result references.
- Production storage state: blocked until explicit CRM/customer data storage approval.
- Privacy rule: do not store real customer data in this skeleton.

### UI_FLOW

- Main path: homepage CTA -> LINE/contact path -> quote/ROI education -> local evidence review.
- Secondary path: project proof -> contact/LINE CTA -> human review.
- Mobile path: compact contact flow; existing bot remains preserved.

### TEST_CASES

- Local checks: root check, public-web test, typecheck, build, LINE i18n verifier, language-switch verifier, dependency verifier.
- Manual checks: browser UAT, existing bot open/close, LINE QR scan on real device.
- Gate checks: exact push/deploy text exists before remote action.

### ROLLBACK_PLAN

- Revert website commits before push if rejected.
- Remove LINE/contact additions only through scoped revert.
- Restore previous evidence state from committed receipts.

## POCKET_HATCHERY

Source status: `pending_human_confirmation`

### BRD

- Business objective: prepare Pocket Hatchery as a governed product lane before wallet, contract, creature catalog, or release implementation.
- Success evidence: confirmed source path, product BRD, release boundaries, and local-only verification plan.
- Non-goals: no wallet live action, no chain/customer data mutation, no deploy.

### FRD

- Required features: source confirmation, wallet flow requirements, viewer requirements, contract action boundaries, creature/catalog schema review.
- Required controls: contract/customer actions remain blocked until exact approval.
- Non-goals: no production signer, no live wallet transaction, no customer storage.

### DATA_CONTRACT

- Local-only entities: creature catalog draft, metadata manifest draft, hatch state machine draft, release evidence draft.
- Production storage state: blocked until explicit approval.
- Security rule: no private key, signer secret, wallet secret, or customer data read.

### UI_FLOW

- Draft path: viewer entry -> creature state -> wallet intent review -> release gate evidence.
- Operator path: schema review -> local validation -> rollback review.
- Blocked path: live wallet/chain execution.

### TEST_CASES

- Local checks: schema file presence, metadata manifest validation plan, rollback review checklist.
- Manual checks: owner confirms authoritative source and intended chain/wallet scope.
- Gate checks: exact signer/customer/chain approval before any live action.

### ROLLBACK_PLAN

- Keep all changes local until source is confirmed.
- Revert spec-only commits if project owner rejects the source path.
- Preserve no-live-signer boundary.

## AGM_CREATIVE

Source status: `pending_human_confirmation`

### BRD

- Business objective: prepare AGM Creative for governed creative site, dashboard, and brand workflow operations.
- Success evidence: confirmed source path, brand/context BRD, content workflow gates, and local check/smoke plan.
- Non-goals: no social live send, no publish, no deploy.

### FRD

- Required features: brand context, creative content workflow, dashboard action inventory, asset QA checklist.
- Required controls: human approval before publish or social automation.
- Non-goals: no provider call or social post execution.

### DATA_CONTRACT

- Local-only entities: brand voice, creative brief, asset checklist, approval state, evidence path.
- Production storage state: blocked until explicit approval.
- Privacy rule: no customer or account tokens.

### UI_FLOW

- Creative path: brief -> draft -> QA checklist -> approval packet.
- Dashboard path: local preview -> smoke test -> evidence packet.
- Blocked path: live publish/social automation.

### TEST_CASES

- Local checks: app check/build/smoke script plan for confirmed source.
- Manual checks: brand owner review and approval flow.
- Gate checks: exact publish/social/deploy gate before any external action.

### ROLLBACK_PLAN

- Revert local creative artifacts if brand direction is rejected.
- Keep generated assets and social drafts offline.
- Preserve prior site/dashboard behavior until scoped implementation is approved.

## ADS_ANDROMEDA

Source status: `pending_human_confirmation`

### BRD

- Business objective: prepare Ads Andromeda as a governed ads, prompt, asset, and campaign-planning lane.
- Success evidence: confirmed source path, campaign governance BRD, offline copy matrix, and paid-provider gate policy.
- Non-goals: no paid provider call, no ad account mutation, no analytics production mutation.

### FRD

- Required features: prompt pack inventory, asset registry review, campaign offer structure, offline approval checklist.
- Required controls: exact approval before paid provider, publish, social live send, or production analytics.
- Non-goals: no deploy, no live campaign launch.

### DATA_CONTRACT

- Local-only entities: campaign concept, offer, audience hypothesis, prompt template, asset reference, approval status.
- Production storage state: blocked until explicit approval.
- Provider rule: no paid ad platform API call.

### UI_FLOW

- Planning path: campaign idea -> prompt template -> asset review -> approval packet.
- QA path: text lock review -> brand voice review -> evidence packet.
- Blocked path: live ad publish or spend.

### TEST_CASES

- Local checks: prompt/template artifact presence and text-lock review.
- Manual checks: brand/campaign owner approval.
- Gate checks: exact provider/publish/social/analytics gate.

### ROLLBACK_PLAN

- Revert local prompt or asset registry changes if campaign is rejected.
- Keep paid channels untouched.
- Preserve offline-only campaign state.

## PHITSANULOK_NEWS

Source status: `pending_human_confirmation`

### BRD

- Business objective: prepare Phitsanulok News as a governed editorial, SEO/AEO, and publishing lane.
- Success evidence: confirmed source path, editorial policy, source attribution rules, local app check/build plan.
- Non-goals: no publish, no social live send, no analytics production mutation.

### FRD

- Required features: editorial workflow, article data contract, SEO schema review, correction/rollback process.
- Required controls: human editorial approval before publish.
- Non-goals: no deploy, no automatic news publishing.

### DATA_CONTRACT

- Local-only entities: article draft, source reference, topic category, editorial status, correction note.
- Production storage state: blocked until explicit approval.
- Integrity rule: no fabricated sources, reviews, ratings, or claims.

### UI_FLOW

- Editorial path: draft -> source review -> SEO/AEO review -> approval packet.
- Correction path: issue found -> correction draft -> approval -> rollback/update plan.
- Blocked path: live publish/social send.

### TEST_CASES

- Local checks: app check/build plan, schema validation plan, editorial policy checks.
- Manual checks: source attribution and editor approval.
- Gate checks: exact publish/deploy/social gate.

### ROLLBACK_PLAN

- Revert unpublished local drafts if rejected.
- For future published content, prepare correction/removal plan before deploy.
- Preserve no-live-publish boundary.

## GHOSTCLAW_OS

Source status: `pending_human_confirmation`

### BRD

- Business objective: keep GhostClaw OS as the governed local control plane for verifiers, receipts, dry-run lanes, and agent orchestration safety.
- Success evidence: confirmed source path, local verifier receipts, dry-run policies, and blocked action matrices.
- Non-goals: no cloud/runtime mutation, no Telegram live send, no provider call.

### FRD

- Required features: verifier coverage, dry-run receipts, gate ledgers, file lease policy, and evidence packets.
- Required controls: Hermes controls planning/routing; Codex mutates local files only.
- Non-goals: no deploy, no live runtime activation.

### DATA_CONTRACT

- Local-only entities: receipt, task gate, source map, verifier result, blocked action marker.
- Production storage state: blocked until explicit approval.
- Security rule: no secret read, no token print, no customer data.

### UI_FLOW

- Operator path: packet -> local plan -> scoped patch -> verifier -> receipt -> approval packet.
- Review path: evidence -> read-only audit -> next gate.
- Blocked path: live send/cloud/runtime mutation.

### TEST_CASES

- Local checks: root verifier, governance verifier, dry-run command syntax checks.
- Manual checks: Hermes owner review and exact gate confirmation.
- Gate checks: runtime/cloud/send gate text before external action.

### ROLLBACK_PLAN

- Revert scoped governance commits if rejected.
- Preserve receipts for audit trail.
- Keep runtime and cloud state unchanged.

## SIRINXDEV_AGENT_NATIVE_MONOREPO

Source status: `confirmed_current_workspace`

### BRD

- Business objective: maintain the current monorepo as the canonical local-first governed work surface for SIRINX/GHOSTCLAW projects.
- Success evidence: branch status, root verifiers, governance ledgers, spec packs, source discovery, backlog, and evidence packets.
- Non-goals: no push while GitHub credential is blocked, no deploy, no provider mutation.

### FRD

- Required features: local verifiers, artifact ledgers, evidence receipts, scoped commits, and exact gate tracking.
- Required controls: every new lane must include spec, source/evidence, verification, and rollback.
- Non-goals: no production mutation from broad approval language.

### DATA_CONTRACT

- Local-only entities: ledger project, source candidate, backlog task, spec skeleton, receipt, evidence packet.
- Production storage state: blocked until exact approval.
- Security rule: no `.env`, token, cookie, or private key read.

### UI_FLOW

- Operator path: inspect state -> add spec/artifact -> run verifier -> commit local -> wait for exact push/deploy gate.
- Recovery path: detect blocker -> write receipt -> append Obsidian pulse.
- Blocked path: secret/credential mutation or remote action without exact gate.

### TEST_CASES

- Local checks: `npm run check`, governance verifier, spec verifier, source discovery verifier, backlog verifier.
- Manual checks: owner confirms source paths and push/deploy gates.
- Gate checks: exact command and scope before any remote action.

### ROLLBACK_PLAN

- Revert scoped local commits if rejected.
- Keep generated runtime/cache folders unstaged.
- Preserve evidence receipts for traceability.
