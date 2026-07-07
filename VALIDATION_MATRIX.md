# Validation Matrix

Status: PR-MONO-001.

| Area | Command or review | Expected result |
| --- | --- | --- |
| Node syntax | `npm run check` | verifier script syntax and governance checks pass |
| PR verifier | `npm run verify:mono-001` | required docs exist and no forbidden env files are present |
| Git whitespace | `git diff --check` | no whitespace errors |
| Secret scan | path-only `rg` scan | no committed real secret files |
| Public site | later Playwright smoke | no internal leakage |
| Cloudflare | dry-run/readiness only | no mutation before approval |
| Legacy imports | quarantine review | no bulk copy |

## PR-MONO-001 Acceptance

- Repo inventory complete.
- Source-to-target map complete.
- Quarantine report complete.
- Topology docs complete.
- Release gates documented.
- Verification script passes.
- No external writes.
- Local commit prepared, no push.
