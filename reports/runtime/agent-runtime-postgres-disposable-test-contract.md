# Agent-runtime disposable Postgres test contract

Status: **STATIC HARNESS READY / NOT EXECUTED / PRODUCTION HOLD**

This contract covers the P2.1 least-privilege runtime path only. It does not
certify production Postgres, Supabase, migrations, Docker, or the Rust store.
The harness has intentionally not been run because the current machine was
below the repo's 15 GiB implementation/test admission floor when it was
authored.

## Entry point and fixed Rust interface

- Harness: `scripts/test-agent-runtime-postgres.sh`
- Role fixture: `crates/sirinx-store/tests/fixtures/agent_runtime_roles.sql`
- Rust target: `crates/sirinx-store/tests/agent_runtime_rls.rs`
- Ignored test: `agent_runtime_postgres_disposable`
- Required child-process variables:
  - `TEST_AGENT_RUNTIME_MIGRATION_URL`
  - `TEST_AGENT_RUNTIME_DATABASE_URL`
  - `TEST_AGENT_RUNTIME_SCENARIO=empty|prior-state`
- Expected access migration:
  `crates/sirinx-store/migrations/0006_agent_runtime_runtime_access.sql`

The harness supports target/name/migration overrides for controlled branch
drift, but validates that the selected Rust source still requires both URLs,
both scenarios, and an explicit `#[ignore]`. Missing variables must fail the
ignored test; they must never be treated as a skip or pass.

## Admission and isolation rules

The harness exits before Docker or Cargo when free disk is below exactly
15 GiB (`15,728,640 KiB`) or when any required local tool/contract file is
absent. It rejects pre-set test database URLs, so it cannot be pointed at a
shared, staging, Supabase, or production database.

It requires `TEST_AGENT_RUNTIME_POSTGRES_IMAGE` to be either a local immutable
image ID (`sha256:...`) or a digest-qualified reference (`name@sha256:...`). It
checks the image locally and starts Docker with `--pull never`; it never pulls
or installs anything. No default image tag is accepted.

Each invocation generates a unique run ID and creates:

- one container carrying exact `disposable`, `harness`, and `run-id` labels;
- one equally labelled Docker `--internal` network;
- one IPv4-loopback-only random host port;
- two independent databases, one per scenario;
- fixed NOLOGIN/NOBYPASSRLS capability roles
  `sirinx_agent_runtime_owner` and `sirinx_agent_runtime_app`;
- a unique ephemeral migration login that may `SET ROLE` to the owner; and
- a distinct ephemeral runtime login inheriting only the app capability role.

Cargo is run with `CARGO_NET_OFFLINE=true`. The container has no externally
routable Docker network; the host reaches it only through the random
`127.0.0.1` port. The harness never sources `.env`, Hermes auth/config, browser
state, keychains, or any other secret source.

## Scenario obligations

`empty` calls the repository's one-shot migrator on a fresh database and then
connects through the least-privilege runtime path.

`prior-state` applies the real SQL for 0001 and 0002, seeds preservation
sentinels, applies the real 0003 and 0004 SQL, confirms the five gate rows, then
applies 0005 and 0006. It verifies both sentinels survive. This deliberately
does not fabricate `_sqlx_migrations` bookkeeping.

Both scenarios then require runtime admission, a permitted task insert/read,
pool-reuse re-attestation, owner/migrator rejection, and negative probes for
DELETE, TRUNCATE, immutable-column update, append-only event/receipt update,
groundwork-table read, and schema creation. This is the Phase A harness, not
the complete P2 acceptance matrix. Permitted run/lease/receipt flows, broader
negative attestation variants, concurrency, receipt races, and fail-closed
rollback remain required Phase B cases before the database gate can pass.

## Secret and evidence handling

The cluster bootstrap password is generated into a mode-0600 temporary file
and mounted read-only. Migration/runtime passwords are generated in memory and
sent to local Postgres over stdin; none are committed. Database URLs exist only
in the focused Cargo child process environment.

Cargo output is redirected to `/dev/null`, never echoed or retained. The
concise JSON evidence contains the commit SHA, clean/dirty state, a manifest
digest over the complete Rust/migration/test/fixture/harness candidate,
individual migration 0001–0006 digests, image ID, scenario exit codes, cleanup
state, and verdict. The manifest is recomputed after both scenarios so
mid-run source drift fails. It never contains a URL, port, username, or
password. A dirty worktree may produce only
`PASS_LOCAL_FILE_DIGEST_BOUND_DIRTY`; it is not release evidence. Only a clean
candidate can produce `PASS_LOCAL_SHA_BOUND`, and that still proves only the
local disposable gate.

Unless `KEEP=1` is explicitly set, the exit trap removes only the container and
internal network whose three labels exactly match the current run. Label drift
causes a HOLD and refuses broad deletion. There is no prune, wildcard removal,
or cleanup of any other Docker object. `KEEP=1` is a debugging escape hatch;
the retained container is still disposable evidence, never production state.

## Invocation after resource admission

First identify a digest-pinned Postgres image already present locally. Then,
only after the free-disk gate is at least 15 GiB:

```sh
TEST_AGENT_RUNTIME_POSTGRES_IMAGE='<local-postgres-ref>@sha256:<64-hex-digest>' \
  bash scripts/test-agent-runtime-postgres.sh
```

Do not pre-set either test URL. Do not substitute a remote database.

## Static review completed; live blockers

Only static shell/source review is permitted for this artifact at authoring
time. The following remain unverified until an admitted run:

1. the chosen digest-pinned Postgres image exists locally;
2. Docker Desktop supports the internal-network plus loopback-publish shape on
   this Mac mini;
3. PostgreSQL accepts the migration URL's startup `SET ROLE` option exactly as
   SQLx encodes it;
4. migrations 0001–0006 succeed on both empty and prior-state databases;
5. the Rust target compiles and its positive/negative RLS probes pass; and
6. exact labelled cleanup completes.

Therefore this document is a runnable verification contract, not a PASS
receipt and not production-complete evidence.
