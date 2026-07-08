# All-Project Spec Pack Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only spec foundation and verifier so every project in the all-project ledger has a governed context, gate, evidence, and next-action record before implementation.

**Architecture:** Keep project specs in a single deterministic Markdown pack under `docs/specs/all-projects` and verify it with a zero-dependency Node script. The verifier cross-checks the spec pack against the all-project ledger and fails if a project is missing, if production gates are absent, or if forbidden live actions appear as allowed work.

**Tech Stack:** Markdown, Node.js ESM, npm scripts, existing root verification chain.

---

### Task 1: Create The Spec Foundation Pack

**Files:**
- Create: `docs/specs/all-projects/PROJECT_CONTEXT_PACKS_20260708.md`

- [ ] **Step 1: Add the document header**

Use this exact header:

```markdown
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
```

- [ ] **Step 2: Add one section per project**

Add these exact level-two headings:

```markdown
## SIRINX_SOLAR
## POCKET_HATCHERY
## AGM_CREATIVE
## ADS_ANDROMEDA
## PHITSANULOK_NEWS
## GHOSTCLAW_OS
## SIRINXDEV_AGENT_NATIVE_MONOREPO
```

Each section must include these exact labels:

```markdown
Project intent:
Current evidence:
Allowed local actions:
Blocked actions:
Next safe gate:
```

### Task 2: Add The Spec Pack Verifier

**Files:**
- Create: `scripts/verify-all-project-spec-packs.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create the verifier script**

The script must:

```js
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
```

It must read:

```text
docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json
docs/specs/all-projects/PROJECT_CONTEXT_PACKS_20260708.md
```

It must fail if the spec pack omits a project ID from the ledger, omits any required label, omits any global blocked action, or contains `live_send=true`, `deploy=true`, or `crm_customer_data_storage=true`.

- [ ] **Step 2: Add root package scripts**

Add:

```json
"verify:all-project-specs": "node scripts/verify-all-project-spec-packs.mjs"
```

Add syntax and runtime execution to the root `check` chain after `verify-all-project-governance-ledger.mjs`.

### Task 3: Verify And Commit

**Files:**
- Verify: `docs/specs/all-projects/PROJECT_CONTEXT_PACKS_20260708.md`
- Verify: `scripts/verify-all-project-spec-packs.mjs`
- Verify: `package.json`

- [ ] **Step 1: Run focused checks**

Run:

```bash
npm run verify:all-project-specs
npm run verify:all-project-governance
npm run check
git diff --check
```

Expected:

```text
All-project spec pack verification passed.
All-project governance ledger verification passed.
PR-MONO-001 verification passed.
Next phase AdaptiveSync/Telegram scaffold verification passed.
```

- [ ] **Step 2: Commit scoped files only**

Run:

```bash
git add -- package.json scripts/verify-all-project-spec-packs.mjs docs/specs/all-projects/PROJECT_CONTEXT_PACKS_20260708.md docs/superpowers/plans/2026-07-08-all-project-spec-pack-foundation.md
git commit -m "docs(governance): add all-project spec pack foundation"
```

### Self-Review

- Spec coverage: the plan covers every project in the ledger and adds verifier coverage against missing project sections, missing labels, missing global blocked actions, and forbidden live-action flags.
- Placeholder scan: no unspecified implementation step remains.
- Type consistency: project IDs are identical to the ledger IDs.
