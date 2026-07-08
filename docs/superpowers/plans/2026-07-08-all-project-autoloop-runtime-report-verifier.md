# All-Project Autoloop Runtime Report Verifier Implementation Plan

> **For agentic workers:** This plan is local-only. It verifies generated runtime evidence and does not authorize push, PR/merge, deploy, webhook activation, production analytics, CRM/customer storage, provider calls, live sends, secret reads, package installs, or runtime/cloud mutation.

**Goal:** Add a verifier for `.ghostclaw_runtime/all-project-autoloop/latest.json` so Hermes/Codex can detect stale autoloop reports, unsafe production flags, missing exact-gate blockers, or hash drift before using a runtime report as evidence.

**Architecture:** Add a zero-dependency Node ESM verifier that reads the latest runtime JSON/Markdown report created by `npm run autoloop:dry-run`. The verifier checks current branch/HEAD, report hash, dry-run mode, queue coverage, safety flags, and exact-gate blockers. It is exposed as a package script and syntax-checked by root `npm run check`.

## Task 1: Add Runtime Report Verifier

Files:

- Create `scripts/verify-all-project-autoloop-runtime-report.mjs`

Requirements:

- Read `.ghostclaw_runtime/all-project-autoloop/latest.json`.
- Read `.ghostclaw_runtime/all-project-autoloop/latest.md`.
- Fail if the report is not `LOCAL_ONLY_GOAL_AUTOLOOP_DRY_RUN_REPORT`.
- Fail if `dryRunOnly` is not `true`.
- Fail if report `branch` or `head` does not match the current git checkout.
- Fail if the embedded SHA-256 digest no longer matches the JSON payload.
- Fail if any safety flag is not `false`.
- Fail if the queue does not contain all seven project lanes.
- Fail if required exact-gate blockers are missing.

## Task 2: Add Package Scripts

Files:

- Modify `package.json`

Requirements:

- Add `verify:all-project-autoloop-runtime`.
- Add `autoloop:local` as `npm run autoloop:dry-run && npm run verify:all-project-autoloop-runtime`.
- Add `node --check scripts/verify-all-project-autoloop-runtime-report.mjs` to root `check`.

## Task 3: Verify

Run:

```bash
npm run autoloop:local
npm run check
git diff --check
```

## Stop Conditions

- Stop before any remote write unless the user gives an exact command.
- Stop before PR/merge/deploy/webhook/analytics/CRM/provider/live-send/secret actions unless the user gives exact gates.
