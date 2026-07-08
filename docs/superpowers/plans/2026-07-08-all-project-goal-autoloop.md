# All-Project Goal Autoloop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or sirinx-spec-first-swarm before changing source behavior. This plan only creates local governance artifacts and verifiers.

**Goal:** Add a machine-checkable all-project goal autoloop that tells Hermes/Codex which work can continue automatically and where the system must stop for an exact gate.

**Architecture:** Store the autoloop state in `docs/roadmaps`, validate it with a zero-dependency Node verifier, and wire the verifier into root `npm run check`. The autoloop is a local control-plane artifact only. It cannot approve deploy, push, PR/merge, webhook activation, production analytics, CRM/customer storage, paid provider calls, secret access, or live sends.

**Sources of truth:**

- `docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json`
- `docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json`
- `docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json`
- `docs/specs/all-projects/PROJECT_CONTEXT_PACKS_20260708.md`
- `docs/specs/all-projects/PER_PROJECT_SPEC_SKELETONS_20260708.md`

## Task 1: Create Goal Autoloop State

Files:

- Create `docs/roadmaps/ALL_PROJECT_GOAL_AUTOLOOP_20260708.json`

Requirements:

- Mode must be `LOCAL_ONLY_GOAL_AUTOLOOP`.
- Include all seven project IDs from the governance ledger.
- Every project must copy the current state and next safe gate from the ledger.
- Every project must define allowed local autoloop actions.
- Every project must define hard stops and exact-gate actions.
- Broad approval aliases such as `approve_all`, `full_auto`, and `godmode` must be explicitly marked as not gates.

## Task 2: Add Verifier

Files:

- Create `scripts/verify-all-project-goal-autoloop.mjs`
- Modify `package.json`

Verifier requirements:

- Fail if any source-of-truth file is missing.
- Fail if the autoloop project set differs from ledger, backlog, or source discovery.
- Fail if any project state or next gate drifts from the ledger.
- Fail if any project uses an action outside the safe local allowlist.
- Fail if any project lacks deploy, push, PR/merge, webhook, analytics, CRM/customer data, provider, live-send, and secret-read exact gates.
- Fail if broad approval aliases are missing.

## Task 3: Verify And Commit Locally

Run:

```bash
npm run verify:all-project-autoloop
npm run check
git diff --check
```

Commit scoped files only after checks pass.

## Stop Conditions

- Do not push without a new exact push command.
- Do not create PR/merge without exact approval.
- Do not deploy without exact target and deploy command.
- Do not activate LINE webhook, production analytics, CRM/customer storage, provider calls, customer/social live sends, or secret reads.
