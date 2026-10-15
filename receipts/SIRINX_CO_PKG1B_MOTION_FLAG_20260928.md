# PKG-1b Receipt: Conditional Motion Flag Shim

Status: implemented in working tree, not committed/pushed/deployed.

Shipped flag: `MOTION_HOME_ENABLED = false`; default-off red proof observed, then restored. Static and enabled shim paths were both exercised. The exact requested shared Vitest invocation fails discovery because configured root is `client/`; `--root .` focused tests passed (2 files, 11 tests), `npx tsc --noEmit` exited 0, and `npm test` passed (44 files, 343 tests).

The source report records the command output and limitations. Exact pre-edit DOM capture comparison is unverified. No `client/src/pages/Layout.tsx` exists; actual `client/src/components/Layout.tsx` remains untouched/out of this lane's scope, so keep the flag disabled until Layout motion timing scope and LCP measurement are addressed.

Side effects: network none; provider_calls none; deploy false; secrets_read false.
