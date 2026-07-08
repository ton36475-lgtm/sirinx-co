# Public Web Preview Deploy Preflight - 2026-07-08 17:00 +0700

Status: `LOCAL_PREFLIGHT_PASSED_DEPLOY_BLOCKED`
Branch: `feat/sirinx-web-line-trust-v1`
Local HEAD: `60e3d2c5c8552cf2ed7675b83391346a61a3ed48`

## Scope

This receipt records local readiness checks for `apps/public-web` after the
preview deploy gate blocker/runbook commit. It does not approve or run deploy,
merge, webhook activation, production analytics, CRM/customer storage, database
migration, or production action.

## Commands

```text
pnpm --config.verify-deps-before-run=false --dir apps/public-web check
pnpm --config.verify-deps-before-run=false --dir apps/public-web test
pnpm --config.verify-deps-before-run=false --dir apps/public-web build
```

## Results

- Typecheck: passed.
- Tests: passed, 8 files, 46 tests.
- Build: passed.
- Static SEO generation: passed.
- Generated SEO routes: 94.
- Province routes: 77.
- Client output path: `apps/public-web/dist/public`.
- Server bundle path: `apps/public-web/dist/index.js`.

## Notes

- `pnpm` emitted a warning that the `pnpm` field in package.json is no longer
  read for `pnpm.overrides`; this did not fail the commands.
- `apps/public-web/dist` is ignored by `.gitignore`, and no tracked build output
  was staged.

## Boundaries Preserved

- Deploy: not run.
- PR creation/merge: not run.
- LINE webhook activation: not run.
- Production analytics mutation: not run.
- CRM/customer data storage: not run.
- Database migration: not run.
- Secret read/print: not run.
- Package install: not run.

## Next Gate

Preview deploy still requires a real provider target and exact executable
command with no `<...>` placeholder. If this receipt should be pushed, provide a
separate exact push command.
