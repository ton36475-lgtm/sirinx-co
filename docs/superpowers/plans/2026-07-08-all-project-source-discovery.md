# All-Project Source Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local-only source-discovery inventory and verifier so each SIRINX/GHOSTCLAW project has candidate source paths before per-project implementation starts.

**Architecture:** Store candidate source paths in a deterministic JSON artifact under `docs/roadmaps`, validate it with a zero-dependency Node script, and expose the validator through the root package scripts. The artifact records discovery evidence only; it does not confirm ownership, push, deploy, webhook, analytics, CRM, or customer-data actions.

**Tech Stack:** JSON, Node.js ESM, npm scripts, existing root verification chain.

---

### Task 1: Create Source Discovery Inventory

**Files:**
- Create: `docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json`

- [ ] **Step 1: Add inventory shell**

Use:

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-07-08T12:25:00+07:00",
  "mode": "LOCAL_ONLY_DISCOVERY",
  "scanPolicy": {
    "secretRead": false,
    "externalWrite": false,
    "providerCall": false,
    "push": false,
    "deploy": false
  },
  "projects": []
}
```

- [ ] **Step 2: Add all seven project IDs**

Each project must include:

```json
{
  "id": "SIRINX_SOLAR",
  "status": "candidate_source_found",
  "candidatePaths": [
    {
      "path": "/Users/sirinx/SIRINXDev/sirinx-agent-native-os/apps/public-web",
      "kind": "current_public_web_app",
      "evidence": "package.json and public-web verification scripts exist"
    }
  ],
  "nextSafeAction": "human_confirm_authoritative_source_before_implementation"
}
```

### Task 2: Add Source Discovery Verifier

**Files:**
- Create: `scripts/verify-all-project-source-discovery.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write verifier**

The verifier must read:

```text
docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json
docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json
```

It must fail if:

- source discovery mode is not `LOCAL_ONLY_DISCOVERY`
- any project from the ledger is absent
- a project has no candidate path
- a candidate path does not exist
- any scan policy field is `true`

- [ ] **Step 2: Add package script**

Add:

```json
"verify:all-project-source-discovery": "node scripts/verify-all-project-source-discovery.mjs"
```

Add syntax and runtime execution to root `check` after `verify-all-project-spec-packs.mjs`.

### Task 3: Verify And Commit

**Files:**
- Verify: `docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json`
- Verify: `scripts/verify-all-project-source-discovery.mjs`
- Verify: `package.json`

- [ ] **Step 1: Run checks**

Run:

```bash
npm run verify:all-project-source-discovery
npm run verify:all-project-specs
npm run verify:all-project-governance
npm run check
git diff --check
```

Expected:

```text
All-project source discovery verification passed.
All-project spec pack verification passed.
All-project governance ledger verification passed.
```

- [ ] **Step 2: Commit scoped files**

Run:

```bash
git add -- package.json scripts/verify-all-project-source-discovery.mjs docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json docs/superpowers/plans/2026-07-08-all-project-source-discovery.md
git commit -m "docs(governance): add all-project source discovery"
```

### Self-Review

- Spec coverage: covers all seven project IDs from the ledger and records source candidates without marking them authoritative.
- Placeholder scan: no unspecified step remains.
- Type consistency: project IDs match the governance ledger.
