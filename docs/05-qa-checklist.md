# QA Checklist

## Verified now

- [x] A23 focused Vitest file passes: 10 tests / 10 passed.
- [x] A23 source and test syntax checks pass.
- [x] A23 plan and four resource-cleanup schema files parse as JSON.
- [x] A23 default result remains `HOLD` with authority, replay, executor,
  approval consumption, execution, and cleanup fields false.
- [x] Independent review returned `VERIFIED` for the static HOLD-only scope.
- [x] No cleanup or other external effect occurred in the A23 slice.
- [x] B12 HOLD-only admission syntax and focused Vitest pass: 9 tests / 9
  passed after false-PASS, executable ancestry, recovery-binding, and timing
  hardening.
- [x] Four B12 cleanup schemas and `.hermes/state.json` parse as JSON.
- [x] Ajv 8.20.0 strict Draft 2020-12 compilation and instance validation pass
  for all four B12 artifacts, their external schema references, malformed
  formats, open top-level and nested objects, forbidden REQUESTING, and
  false-PASS output.
- [x] Npm and pnpm dependency metadata pin Ajv and formats;
  `npm ci --dry-run` accepts the updated lockfile candidate offline without
  installing packages.
- [x] B12 source scan finds no child process, network, filesystem mutation,
  route, `canDispatch=true`, executor, authority, or approval-consumption path.

## Not verified

- [ ] Full Node test suite.
- [ ] Rust format, build, Clippy, or workspace tests for the current dirty tree.
- [ ] Migration 0005-0006 or a proposed 0007 against disposable Postgres.
- [ ] Runtime RLS, replay race, grant consumption, outbox, or receipt tamper tests.
- [ ] Cleanup collector/executor or live action-time filesystem/process evidence.
- [ ] Authenticated browser smoke.
- [ ] GitHub CI, merge, deploy, Cloudflare, Telegram, LINE, provider, or A2A live
  evidence.

## Required B12 negative matrix

- [x] Circuit HOLD and missing authority reject structural admission.
- [ ] Expired, revoked, consumed, replayed, or digest-mismatched grant rejects.
- [ ] Maker/checker/approver/executor overlap rejects.
- [x] Target, repository SHA, plan, scope, action, manifest, process, or free-space
  drift rejects.
- [x] Symlink, selected-Cargo path/content/revision, or owned-ancestor drift
  rejects structurally; real TOCTOU remains unverified.
- [x] Missing action-time device/inode/content/revision identity rejects.
- [x] Unknown or interrupted effect becomes terminal `EFFECT_UNKNOWN` and is not
  retried automatically.
- [x] Receipt shape alone cannot assert that cleanup occurred; a structural PASS
  requires bound pre/post artifacts and remains explicitly non-authoritative.
- [x] Structural post-action measurement gates every later workload; live APFS
  attribution and durable receipts remain unverified.

Overall status: `LOCAL_IMPLEMENTATION_APPROVED / RESOURCE_HOLD / QA_INCOMPLETE /
PRODUCTION_HOLD`.
