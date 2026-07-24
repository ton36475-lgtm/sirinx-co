# Agent Runtime P2 Durable Local Evidence — 2026-07-20

Verdict: `STATIC_P2_1_VERIFIED / RETEST_BLOCKED_RESOURCE / POSTGRES_LIVE_UNVERIFIED / PRODUCTION_HOLD`

Repository baseline HEAD: `1f05814c3e9d173e525234d69b3ce7f2d1b01a57`
Branch: `agent/b1-b2-command-center`
Evidence scope: dirty local worktree; no candidate commit or remote SHA exists
for this slice

## Implemented local slice

- Typed task, run, task-event, lease, transition, receipt, and terminal
  `EFFECT_UNKNOWN` contracts live in `sirinx-core`.
- Task admission deserializes a closed typed `TaskEnvelopeV1`, rejects missing
  or unknown top-level and nested fields, validates bounded fields, roles,
  actions, budgets, hashes, unique tickets, and RFC3339-shaped time, then binds
  task and idempotency identities to the durable row.
- A separate `AgentRuntimeStore` has deterministic Memory and concrete
  Postgres implementations in `sirinx-store`.
- Task and run transitions use state/version compare-and-swap and append an
  ordered, actor-claimed task event in the same transaction.
- A task or run can enter `LEASED` only with an active exact lease. Postgres
  expiry and heartbeat authority use database time; the Memory store accepts
  injected time for deterministic tests.
- Exact normalized path/resource overlap, active-run uniqueness, and one
  source-mutating writer per repository/worktree fail closed.
- The store generates SHA-256 receipt-chain hashes from canonical
  length-framed bytes, forbids a second receipt for a run and receipt forks,
  restricts PASS authority to maker roles 37–41 and checker role 42, and
  requires a maker PASS to reference a prior hash-valid role-42 PASS from a
  different run, principal, and persisted lease with matching exact digests.
  A checker PASS may finalize its checker run but cannot finalize the task;
  receipt append freezes after the task is `RECEIPTED` or `SUCCEEDED`.
- Source-write leases are allowed only for maker roles 37–41 and only when the
  bound run action class is B or C, consistently in domain, Memory, Postgres,
  and SQL constraints.
- Migration 0005 adds 13 prefixed runtime tables without changing migrations
  0001–0004. It uses restrictive foreign keys, closed state checks, bounded
  fields, composite task/run coherence, closed event states, source-writer role
  bounds, same-task verification FK, append-only row and truncate guards,
  nonce digests rather than raw nonces, and `ENABLE` plus `FORCE RLS` with zero
  public policies.
- Migration 0006 adds the separately provisioned NOLOGIN owner/app path, exact
  column grants and 13 command policies on the five implemented tables,
  ownership/ACL checks for all 13 tables and three identity sequences, and
  effective denial for Supabase `anon`, `authenticated`, and `service_role`.
  The dedicated runtime store never migrates; both legacy and runtime startup
  are connect-only, with `migrate_postgres_once` as the explicit migration
  authority.

Approval, outbox, inbox-dedupe, verification, model, A2A-peer, and artifact
tables are schema groundwork only. The current vertical slice does not claim
their operational store APIs or runtime wiring. The separate
`verification_runs` lifecycle is not wired; the first fail-closed relation is
enforced through receipt and lease provenance.

## Pre-review verification receipts

The following passed before the independent checker findings and later
remediation. They prove the initial implementation baseline only; they are not
evidence that the final files compile or pass.

- `cargo test -p sirinx-core -p sirinx-store --lib --locked --offline`:
  `PASS` — 17 core and 19 store library tests, including 7 core and 14 store
  agent-runtime tests.
- `cargo check -p sirinx-core -p sirinx-store --all-targets --locked --offline`:
  `PASS`.
- `cargo clippy -p sirinx-core -p sirinx-store --all-targets --locked --offline -- -D warnings`:
  `PASS`.
- `cargo fmt --all --check`: `PASS`.
- `git diff --check`: `PASS` for tracked diffs; a separate whitespace scan of
  the new P2 files found no trailing whitespace.
- The static migration contract test verifies all 13 tables, restrictive
  deletion behavior, RLS declarations, append-only guards, writer/run
  uniqueness, nonce-digest-only storage, and receipt fork controls: `PASS`.

The existing optional Postgres integration test returned success only because
it exits early when `TEST_DATABASE_URL` is absent. It is explicitly excluded
from live-database evidence.

## Independent review and remediation

The independent checker returned `BLOCKED` on the initial slice because a
maker could self-issue PASS, only three task-envelope fields were checked, and
zero-policy `FORCE RLS` had no proved least-privilege runtime path. The first
two gaps are closed in the static candidate described above. A follow-up
review found two further inconsistencies: receipts could be appended after
task success, and Memory/domain allowed checker source-write leases that SQL
rejected. Both were patched. That pre-P2.1 static re-review verified
the envelope, maker/checker, receipt-freeze, and source-write gates and returned
`STATIC_CODE_GATES_VERIFIED_WITH_RLS_BLOCKER`.

New negative tests cover incomplete/unknown envelopes, unauthorized/self PASS, checker-only
task finalization, and valid linked maker/checker provenance, but no test or
compile command was run after those edits. Workspace Rust formatting, registry
validation, JSON parsing, tracked-diff, and static whitespace inspection pass.
The original zero-policy RLS code blocker is statically remediated. Independent
P2.1 re-review returned `VERIFIED` for the static candidate after closing
Supabase ACL, exact-membership, startup-migration, three-sequence, and evidence
binding findings. Live SQL execution remains a deployment blocker.

Verifier snapshot SHA-256 digests for the dirty, file-bound candidate:

- migration 0006: `22c17ea3fdca3675630ba0a18c127a63e822852ea0013241445a41a2494bc56b`
- `postgres.rs`: `69e06950aec86c2915ac09d313f28b0fd662dd7138846cdf1b7a652096d8d8ec`
- `agent_runtime.rs`: `b8a7ab1f322ad6c927d832d39a5e608229ced83bbe73858cbe1bb8903473ee77`
- disposable harness: `865a12b7d8eef40ee1bf58cef364bf42ea874defde6eac0fa6b22b0728614381`

These are not commit or release receipts; repository HEAD remains the older
baseline and the relevant files are dirty/untracked.

## Truth and resource boundary

Migrations 0005–0006 have not been parsed or executed by a live Postgres server.
Empty and prior-state migration, rollback/restore, non-owner runtime-role RLS,
concurrent lease/receipt races, stale heartbeats, duplicate/reordered events,
tamper, outbox-delay, and crash-after-effect cases remain
`UNVERIFIED_RESOURCE_GATE`.

Free disk was approximately 3.8 GiB during remediation. It later recovered
externally above 13 GiB, then fell to 12,504,384 KiB (about 11.9 GiB), above
the 5 GiB emergency floor but still below the 15 GiB
implementation/disposable-database threshold.
No install, Docker run, disposable or production database connection, secret
read, provider call, Telegram send, queue mutation, Cloudflare action, commit,
push, merge, or deploy occurred.

The operator also supplied a Claude screen showing PR #9 and claimed commit
`6bf78b5` with another roster/codename implementation. That commit object is
not present in this local checkout, and no fetch, merge, or remote verification
was performed. It must not replace or duplicate the crate-owned registry until
an exact-SHA reconciliation is authorized and evidenced.

## Next safe action

After a separately approved recoverable cleanup restores at least 15 GiB,
compile and run the post-remediation core/store tests and Clippy, then execute
migrations 0001–0006 through the digest-pinned disposable harness from empty
and prior states. Complete the Phase-B run/lease/receipt, negative-attestation,
concurrency, connection-reuse, failure, and restore matrix; then bind the
evidence to an exact clean candidate SHA before any external release gate is
considered.
