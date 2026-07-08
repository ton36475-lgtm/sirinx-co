# All-Project Spec Skeleton Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only spec skeleton matrix so every project has BRD, FRD, data contract, UI flow, test cases, and rollback skeleton sections before implementation.

**Architecture:** Store all skeletons in one deterministic Markdown matrix under `docs/specs/all-projects`, validate it with a Node verifier, and wire the verifier into root `npm run check`. The skeletons are intentionally draft-gated and must not mark source confirmation, push, deploy, webhook, analytics, CRM/customer storage, provider calls, or live sends as approved.

**Tech Stack:** Markdown, Node.js ESM, npm scripts, existing root verification chain.

---

### Task 1: Create Spec Skeleton Matrix

**Files:**
- Create: `docs/specs/all-projects/PER_PROJECT_SPEC_SKELETONS_20260708.md`

- [ ] **Step 1: Add header**

Use:

```markdown
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
```

- [ ] **Step 2: Add project sections**

For each project from the ledger, add:

```markdown
## PROJECT_ID

Source status: `pending_human_confirmation`

### BRD
### FRD
### DATA_CONTRACT
### UI_FLOW
### TEST_CASES
### ROLLBACK_PLAN
```

### Task 2: Add Spec Skeleton Verifier

**Files:**
- Create: `scripts/verify-all-project-spec-skeletons.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create verifier**

The verifier must read:

```text
docs/specs/all-projects/PER_PROJECT_SPEC_SKELETONS_20260708.md
docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json
docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json
```

It must fail if:

- any ledger project section is missing
- any required spec subsection is missing
- global gate policy is missing
- forbidden approval strings appear: `deploy=true`, `push=true`, `live_send=true`, `crm_customer_data_storage=true`, `production_analytics=true`

- [ ] **Step 2: Add package script**

Add:

```json
"verify:all-project-spec-skeletons": "node scripts/verify-all-project-spec-skeletons.mjs"
```

Add syntax and runtime execution to root `check` after execution-backlog verification.

### Task 3: Verify And Commit

**Files:**
- Verify: `docs/specs/all-projects/PER_PROJECT_SPEC_SKELETONS_20260708.md`
- Verify: `scripts/verify-all-project-spec-skeletons.mjs`
- Verify: `package.json`

- [ ] **Step 1: Run checks**

Run:

```bash
npm run verify:all-project-spec-skeletons
npm run verify:all-project-backlog
npm run check
git diff --check
```

Expected:

```text
All-project spec skeleton verification passed.
All-project execution backlog verification passed.
```

- [ ] **Step 2: Commit scoped files**

Run:

```bash
git add -- package.json scripts/verify-all-project-spec-skeletons.mjs docs/specs/all-projects/PER_PROJECT_SPEC_SKELETONS_20260708.md docs/superpowers/plans/2026-07-08-all-project-spec-skeleton-matrix.md
git commit -m "docs(governance): add all-project spec skeleton matrix"
```

### Self-Review

- Spec coverage: every ledger project receives BRD, FRD, DATA_CONTRACT, UI_FLOW, TEST_CASES, and ROLLBACK_PLAN sections.
- Placeholder scan: no unspecified implementation step remains.
- Type consistency: project IDs match the ledger.
