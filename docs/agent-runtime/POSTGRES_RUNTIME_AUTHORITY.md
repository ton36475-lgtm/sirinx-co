# Postgres Agent-Runtime Authority Contract

Status: `LOCAL_STATIC_CANDIDATE / LIVE_POSTGRES_UNVERIFIED / PRODUCTION_HOLD`

This document defines the database authority boundary for the first durable
agent-runtime slice. It is a deployment and verification contract, not a
credential-provisioning script and not evidence that a database was changed.

## Decision

The database uses three separate authorities:

1. **Bootstrap authority** creates or rotates environment-specific roles and
   login credentials under an explicit operator ticket.
2. **Migration authority** owns schema evolution and runs embedded migrations
   over a direct administrative connection.
3. **Runtime authority** connects through a dedicated non-owner login that is
   a member of `sirinx_agent_runtime_app` and cannot run migrations.

The runtime identity must never be a superuser, have `BYPASSRLS`, own the
database or runtime tables, inherit the owner role, or use Supabase
`service_role`. Runtime startup fails closed when any attestation is missing or
contradictory.

Migration 0005 remains the immutable schema foundation. Migration 0006 adds a
least-privilege access path without weakening `ENABLE ROW LEVEL SECURITY` or
`FORCE ROW LEVEL SECURITY`.

## Role contract

The following logical roles are prerequisites and are provisioned outside
ordinary SQLx migrations:

| Role | Login | Required attributes | Purpose |
|---|---:|---|---|
| `sirinx_agent_runtime_owner` | no | `NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS` | Own the 13 runtime tables, three identity sequences, policies, and trigger function |
| `sirinx_agent_runtime_app` | no | `NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOREPLICATION NOBYPASSRLS` | Group role receiving only the implemented runtime capabilities |
| environment runtime login | yes | same non-privileged attributes; member of app role only | Secret-store-managed service identity |

The owner and app group roles are members of no other roles. At runtime
admission, the login must have exactly one direct membership (the app role),
and the app role must have exactly that one login member. Credential rotation
must therefore remove the old membership before the replacement connection is
admitted; ambiguous overlapping authority fails closed.

Role creation, membership changes, and password rotation are external database
mutations. They require a scoped bootstrap ticket and must never place a
password, token, connection URL, or raw role secret in this repository or an
evidence report.

## Capability matrix

Only the first implemented vertical slice is exposed:

| Table | `SELECT` | `INSERT` | `UPDATE` | `DELETE`/`TRUNCATE` |
|---|---:|---:|---|---:|
| `agent_runtime_tasks` | yes | yes | `state`, `version`, `updated_at` only | never |
| `agent_runtime_runs` | yes | yes | `state`, `version`, `blocker`, `result_receipt_id`, `updated_at` only | never |
| `agent_runtime_task_events` | yes | yes | never | never |
| `agent_runtime_stage_leases` | yes | yes | `state`, `version`, `heartbeat_due_at`, `expires_at` only | never |
| `agent_runtime_receipts` | yes | yes | never | never |

The runtime role receives no access to action tickets, approvals, outbox,
inbox dedupe, verification runs, model catalog, A2A peers, or artifacts until a
separate store API and verification slice exists for each table. It receives
no schema `CREATE`, table ownership, DDL, `REFERENCES`, or `TRIGGER` authority.

Command-specific permissive RLS policies apply only to
`sirinx_agent_runtime_app`. They currently provide a capability-scoped server
boundary across the five implemented tables. They do not claim tenant or
mutually hostile worker isolation: all authorized runtime workers sharing one
database login can see the same authorized runtime rows. Task-scoped
transaction identity and a narrow cross-task lease-conflict helper are a later
P2.2 hardening item and must not be described as implemented.

## Connection contract

- The legacy `PostgresStore` remains the web/control store, but its constructor
  is connect-only. It cannot run migrations during application startup.
- The agent runtime uses a distinct `AgentRuntimePostgresStore` and a distinct
  host-secret variable such as `AGENT_RUNTIME_DATABASE_URL`.
- Its runtime constructor opens a pool only. It never invokes
  `sqlx::migrate!`, never accepts a migration URL, and never falls back to a
  privileged role.
- Every runtime table reference is schema-qualified as
  `public.agent_runtime_*`; ambient `search_path` is not an authority boundary.
- The pool is admitted only after role, ownership, RLS, policy/grant, and
  forbidden-capability checks pass.

Application startup is not a migration mechanism. Schema migration remains a
separate ticketed release step using a direct migration connection. Supabase
transaction pooling requires a later explicit compatibility test; no pooler
mode is declared production-ready by this contract.

## Startup attestation

The runtime constructor must reject the connection unless all of these are
true:

- the current login is effectively a member of
  `sirinx_agent_runtime_app`;
- it is not privileged and cannot assume
  `sirinx_agent_runtime_owner`;
- it owns neither the current database nor any `agent_runtime_*` relation;
- `row_security` is on and every runtime table has both RLS and forced RLS;
- required table/column/sequence privileges exist for the five implemented
  tables;
- delete, truncate, schema-create, and groundwork-table privileges do not
  exist;
- existing Supabase `anon`, `authenticated`, and `service_role` identities
  have no effective table, column, sequence, or trigger-function privilege on
  the runtime objects;
- the runtime policies target the app role and no public policy grants a
  runtime command path.

An attestation query proves only the connected database state at admission.
The release receipt must additionally bind the database identity, migration
set, candidate SHA, and later read-back to the same ticket.

## Disposable Postgres acceptance matrix

The first static harness encodes the empty/prior migration paths, role
admission, a permitted read, and initial DDL/delete/groundwork denials. That is
Phase A only. The database gate remains unverified until an expanded,
non-production Postgres suite proves every row below without reading
production secrets:

1. Apply migrations 0001 through 0006 to an empty database.
2. Apply 0003 and 0004 from their documented prior states, then 0005 and 0006;
   verify data preservation and idempotent migration bookkeeping.
3. Connect as a distinct non-owner runtime login and pass startup attestation.
4. Prove the permitted task/run/event/lease/receipt flows.
5. Prove all forbidden DDL, ownership, role escalation, delete, truncate,
   groundwork-table, and legacy-table operations fail.
6. Prove append-only event and receipt rows cannot be updated or deleted.
7. Prove missing app-role membership, owner-role membership, superuser,
   `BYPASSRLS`, disabled RLS, missing policy, excessive grant, and wrong table
   ownership each fail startup.
8. Run concurrent lease, stale-heartbeat, receipt-chain, rollback, and
   connection-reuse cases; compare results with `MemoryStore` invariants.
9. Restore from a pre-migration snapshot and prove the rollback remains
   fail-closed.

An optional test that exits successfully when its database fixture is absent
does not satisfy this gate. CI must fail or mark the database job explicitly
skipped; it must never report an unexecuted migration suite as a pass.

## Fail-closed rollback

1. Stop agent-runtime traffic.
2. Revoke the environment login's membership in the app role or make the login
   `NOLOGIN` under a bootstrap ticket.
3. Revoke runtime grants and drop only the 0006 runtime policies.
4. Leave all 13 tables and their data intact with RLS enabled and forced.
5. With zero applicable policies, access returns to deny-by-default.
6. Restore service only through a reviewed forward migration and repeat the
   complete non-owner acceptance matrix.

Rollback must never disable RLS, grant `BYPASSRLS`, switch to `postgres` or
`service_role`, or drop the durable ledger to make startup succeed.
