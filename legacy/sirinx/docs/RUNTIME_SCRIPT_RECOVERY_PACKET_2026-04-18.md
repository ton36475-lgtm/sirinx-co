# Runtime Script Recovery Packet — 2026-04-18

## Objective
- Restore local runtime startup for the recovered SIRINX full-stack website on the current Windows-based recovery environment.

## Confirmed Bug
- `pnpm run dev` and `pnpm run start` fail on Windows when `package.json` uses Unix-only env assignment:
  - `NODE_ENV=development ...`
  - `NODE_ENV=production ...`

## Impact
- The codebase may compile and test successfully but still fail to boot locally.
- This blocks real recovery validation, browser QA, and first runnable baseline verification.

## Implemented Change
- Replaced Unix-only env assignment with `cross-env` in `dev` and `start` scripts.
- Added regression coverage to prevent future script drift.
- Updated the repo-level operating rule so cross-platform runtime scripts are now explicit system guidance.

## Validation Status
- Implemented in this repo: yes
- Validated in this repo: not yet
- Validated in the previously recovered baseline: yes
- Production-ready: no

## Rollback Note
- If `cross-env` introduces unexpected startup behavior, revert the `dev` and `start` script changes in `package.json` and remove the `cross-env` dev dependency plus the regression test file.

## Audit Trail Note
- Files changed for this recovery fix:
  - `package.json`
  - `AGENTS.md`
  - `server/runtimeScripts.test.ts`
  - `docs/RUNTIME_SCRIPT_RECOVERY_PACKET_2026-04-18.md`

## Approval Packet
- Objective: restore cross-platform runtime startup for recovery work
- Diff scope: package scripts, one regression test, one system-rule update, one recovery packet
- Risks: low; affects runtime command invocation only
- Rollback: remove `cross-env` change and test if incompatible
- Audit trail: captured in this document

## Future Prevention Note
- Treat package scripts as part of runtime infrastructure, not just developer convenience.
- Any startup script that sets environment variables must be validated on the actual operator OS before marking the repo as working.
