# All-Project Execution Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only, machine-checkable execution backlog that turns the all-project ledger, spec pack, and source discovery into repeatable gated work for every project.

**Architecture:** Store backlog tasks in a deterministic JSON artifact under `docs/roadmaps`, validate it with a zero-dependency Node script, and expose the verifier through root package scripts. The backlog is a local control-plane artifact only; it cannot approve push, deploy, webhook, analytics, CRM/customer storage, paid provider calls, or live sends.

**Tech Stack:** JSON, Node.js ESM, npm scripts, existing root verification chain.

---

### Task 1: Create Execution Backlog

**Files:**
- Create: `docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json`

- [ ] **Step 1: Add backlog shell**

Use:

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-07-08T12:32:00+07:00",
  "mode": "LOCAL_ONLY_BACKLOG",
  "sourceOfTruth": [
    "docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json",
    "docs/specs/all-projects/PROJECT_CONTEXT_PACKS_20260708.md",
    "docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json"
  ],
  "projects": []
}
```

- [ ] **Step 2: Add every project and required task IDs**

Every project must include these task IDs:

```text
source_confirmation
brd
frd
data_contract
ui_flow
test_cases
rollback_plan
local_verification
evidence_packet
exact_gate_review
```

Each task must include:

```json
{
  "id": "source_confirmation",
  "status": "pending_human_confirmation",
  "allowedMode": "local_only",
  "blockedUntil": "human_confirms_authoritative_source",
  "evidenceRequired": "record authoritative source path and owner confirmation"
}
```

### Task 2: Add Backlog Verifier

**Files:**
- Create: `scripts/verify-all-project-execution-backlog.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create verifier script**

The verifier must read:

```text
docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json
docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json
docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json
```

It must fail if:

- mode is not `LOCAL_ONLY_BACKLOG`
- any source-of-truth file is missing
- any project from the ledger is missing
- any project from source discovery is missing
- any required task ID is missing
- any task has `allowedMode` other than `local_only`
- any task lacks `evidenceRequired`

- [ ] **Step 2: Add root script**

Add:

```json
"verify:all-project-backlog": "node scripts/verify-all-project-execution-backlog.mjs"
```

Add syntax and runtime execution to root `check` after source-discovery verification.

### Task 3: Verify And Commit

**Files:**
- Verify: `docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json`
- Verify: `scripts/verify-all-project-execution-backlog.mjs`
- Verify: `package.json`

- [ ] **Step 1: Run checks**

Run:

```bash
npm run verify:all-project-backlog
npm run verify:all-project-source-discovery
npm run verify:all-project-specs
npm run verify:all-project-governance
npm run check
git diff --check
```

Expected:

```text
All-project execution backlog verification passed.
All-project source discovery verification passed.
All-project spec pack verification passed.
All-project governance ledger verification passed.
```

- [ ] **Step 2: Commit scoped files**

Run:

```bash
git add -- package.json scripts/verify-all-project-execution-backlog.mjs docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json docs/superpowers/plans/2026-07-08-all-project-execution-backlog.md
git commit -m "docs(governance): add all-project execution backlog"
```

### Self-Review

- Spec coverage: every project from the ledger and source discovery receives the same gated task set.
- Placeholder scan: no unspecified task remains.
- Type consistency: task IDs and project IDs match between plan and verifier.
