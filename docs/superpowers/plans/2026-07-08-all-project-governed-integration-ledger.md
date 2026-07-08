# All-Project Governed Integration Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only, spec-driven ledger and verifier that tracks every named SIRINX/GHOSTCLAW project, its evidence path, next safe gate, and blocked production actions.

**Architecture:** Store the project control plane as a deterministic JSON ledger under `docs/roadmaps`, validate it with a zero-dependency Node script under `scripts`, and expose it through a root package script. The verifier fails if any project lacks safety gates, evidence, or explicit push/deploy/webhook/analytics/CRM/customer-data blockers.

**Tech Stack:** Node.js ESM, npm scripts, JSON governance artifact, Markdown plan/evidence docs.

---

### Task 1: Create The All-Project Ledger

**Files:**
- Create: `docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json`

- [ ] **Step 1: Create the ledger JSON**

Use this exact project set and keep the mode local-only:

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-07-08T12:12:00+07:00",
  "mode": "LOCAL_ONLY",
  "authority": "SIRINXDev Agent-Native Governed Monorepo",
  "globalBlockedActions": [
    "push_without_exact_gate",
    "deploy_without_exact_command",
    "line_webhook_activation_without_approval",
    "production_analytics_mutation_without_approval",
    "crm_customer_data_storage_without_approval",
    "secret_read_or_print",
    "paid_provider_call_without_approval",
    "customer_or_social_live_send_without_approval"
  ],
  "projects": []
}
```

- [ ] **Step 2: Add seven project records**

Add exactly these project IDs:

```text
SIRINX_SOLAR
POCKET_HATCHERY
AGM_CREATIVE
ADS_ANDROMEDA
PHITSANULOK_NEWS
GHOSTCLAW_OS
SIRINXDEV_AGENT_NATIVE_MONOREPO
```

Each project object must include:

```json
{
  "id": "SIRINX_SOLAR",
  "displayName": "SIRINX Solar / sirinx.co",
  "laneOwner": "Codex Builder local worker",
  "surface": "apps/public-web",
  "currentState": "local_validated_push_blocked_by_github_credential",
  "evidence": [
    "vault/evidence/sirinx-web-line-trust-v1/EVIDENCE.md",
    "docs/receipts/PUBLIC_WEB_PUSH_GATE_BLOCKED_20260708.md"
  ],
  "nextSafeGate": {
    "gate": "repair_github_credential_or_new_exact_remote_auth_gate",
    "allowedLocalActions": [
      "review_committed_diff",
      "rerun_local_verification",
      "browser_uat_local_preview"
    ],
    "requiresApprovalBefore": [
      "push_retry",
      "deploy",
      "line_webhook_activation",
      "production_analytics",
      "crm_customer_data_storage"
    ]
  },
  "blockedActions": [
    "deploy",
    "line_webhook_activation",
    "production_analytics_mutation",
    "crm_customer_data_storage",
    "customer_live_send",
    "paid_provider_call",
    "secret_read_or_print"
  ]
}
```

### Task 2: Add A Verifier

**Files:**
- Create: `scripts/verify-all-project-governance-ledger.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the verifier**

Create a Node script that:

```js
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ledgerPath = "docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json";
const requiredProjects = [
  "SIRINX_SOLAR",
  "POCKET_HATCHERY",
  "AGM_CREATIVE",
  "ADS_ANDROMEDA",
  "PHITSANULOK_NEWS",
  "GHOSTCLAW_OS",
  "SIRINXDEV_AGENT_NATIVE_MONOREPO"
];
```

The script must fail if the ledger is missing, mode is not `LOCAL_ONLY`, any required project is missing, evidence files are missing, or a project lacks `blockedActions` entries for production mutation.

- [ ] **Step 2: Add the npm script**

Modify `package.json`:

```json
"verify:all-project-governance": "node scripts/verify-all-project-governance-ledger.mjs"
```

Also add it to the root `check` chain after `node scripts/verify-next-phase.mjs`.

### Task 3: Verify And Commit

**Files:**
- Verify: `package.json`
- Verify: `docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json`
- Verify: `scripts/verify-all-project-governance-ledger.mjs`

- [ ] **Step 1: Run syntax and governance checks**

Run:

```bash
npm run verify:all-project-governance
npm run check
git diff --check
```

Expected:

```text
All-project governance ledger verification passed.
PR-MONO-001 verification passed.
Next phase AdaptiveSync/Telegram scaffold verification passed.
```

- [ ] **Step 2: Commit only scoped files**

Run:

```bash
git add -- package.json scripts/verify-all-project-governance-ledger.mjs docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json docs/superpowers/plans/2026-07-08-all-project-governed-integration-ledger.md
git commit -m "docs(governance): add all-project integration ledger"
```

### Self-Review

- Spec coverage: covers all seven named projects, local-only mode, explicit evidence paths, next gates, and blocked push/deploy/webhook/analytics/CRM/customer-data actions.
- Placeholder scan: no `TBD`, `TODO`, or undefined implementation steps remain.
- Type consistency: verifier field names match ledger field names: `mode`, `projects`, `id`, `evidence`, `nextSafeGate`, and `blockedActions`.
