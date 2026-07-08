# All-Project Autoloop Preview Implementation Plan

> **For agentic workers:** Use this plan only for local control-plane work. It does not authorize push, deploy, provider calls, webhook activation, analytics mutation, CRM/customer storage, live sends, or secret reads.

**Goal:** Add a dry-run preview command that converts the all-project goal autoloop into an operator-readable queue without mutating repo, runtime, cloud, customer, or provider state.

**Architecture:** Add a zero-dependency Node ESM script that reads the governance ledger, execution backlog, source discovery, and goal autoloop. It prints a JSON preview to stdout and exits non-zero only when the local control-plane artifacts are structurally inconsistent.

## Task 1: Add Preview Script

Files:

- Create `scripts/preview-all-project-goal-autoloop.mjs`

Requirements:

- Read only local governance artifacts.
- Print `LOCAL_ONLY_GOAL_AUTOLOOP_PREVIEW`.
- Include every project from the autoloop.
- Include ledger state, source state, next local action, next backlog task, next safe gate, hard stops, and exact-gate actions.
- Mark broad approval aliases as non-gates.
- Perform no writes, network calls, provider calls, process dispatch, browser automation, or runtime mutation.

## Task 2: Add Package Script

Files:

- Modify `package.json`

Requirements:

- Add `preview:all-project-autoloop`.
- Add `node --check scripts/preview-all-project-goal-autoloop.mjs` to root `check`.

## Task 3: Verify

Run:

```bash
npm run preview:all-project-autoloop
npm run verify:all-project-autoloop
npm run check
git diff --check
```

## Stop Conditions

- Stop before push unless an exact `git push ...` command is provided.
- Stop before PR/merge/deploy/webhook/analytics/CRM/provider/live-send/secret work unless exact gates are provided.
