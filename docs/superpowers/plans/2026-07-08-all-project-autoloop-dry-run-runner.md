# All-Project Autoloop Dry-Run Runner Implementation Plan

> **For agentic workers:** This plan is local-only. It does not authorize push, PR/merge, deploy, webhook activation, production analytics, CRM/customer storage, provider calls, live sends, secret reads, package installs, or runtime/cloud mutation.

**Goal:** Add an end-to-end dry-run command that verifies the all-project goal autoloop, emits the queue preview, and writes a local runtime report for Hermes/Codex review.

**Architecture:** Reuse the existing zero-dependency verifier and preview scripts from a new Node ESM runner. The runner writes generated reports under `.ghostclaw_runtime/all-project-autoloop/`, which is a local runtime evidence path, not a source mutation or remote action.

## Task 1: Add Dry-Run Runner

Files:

- Create `scripts/run-all-project-goal-autoloop-dry-run.mjs`

Requirements:

- Run `scripts/verify-all-project-goal-autoloop.mjs`.
- Run `scripts/preview-all-project-goal-autoloop.mjs`.
- Parse the preview JSON.
- Write a timestamped JSON report and `latest.json` under `.ghostclaw_runtime/all-project-autoloop/`.
- Write a concise `latest.md` report for human review.
- Include git branch, head SHA, remote-tracking SHA, queue summary, blocked exact-gate actions, and safety flags.
- Do not push, deploy, create PRs, call providers, read secrets, send messages, or mutate runtime/cloud services.

## Task 2: Add Package Script

Files:

- Modify `package.json`

Requirements:

- Add `autoloop:dry-run`.
- Add `node --check scripts/run-all-project-goal-autoloop-dry-run.mjs` to root `check`.

## Task 3: Verify

Run:

```bash
npm run autoloop:dry-run
npm run check
git diff --check
```

## Stop Conditions

- Stop before any remote write unless the user gives an exact command.
- Stop before PR/merge/deploy/webhook/analytics/CRM/provider/live-send/secret actions unless the user gives exact gates.
