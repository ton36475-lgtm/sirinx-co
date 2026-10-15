# SIRINX — public migration and schema-path catalog

**Snapshot:** 9 October 2026 · **Scope:** read-only inventory of the 24 public repositories returned for `ton36475-lgtm`; default branches only. This is not a database-state audit. A migration file in Git does not prove it has run, is current, or is deployed.

## Executable migration paths found

### `ton36475-lgtm/sirinx-co` — `main`

Six SQL files under `crates/sirinx-store/migrations/`:

1. `0001_web_leads_and_events.sql`
2. `0002_pending_work.sql`
3. `0003_control_gates.sql`
4. `0004_failure_lessons.sql`
5. `0005_agent_runtime_core.sql`
6. `0006_agent_runtime_runtime_access.sql`

The repository also contains `MIGRATION_SEQUENCE.md` and `RUST_MIGRATION_PLAN.md`. These are source-tree plans, not evidence that a database cutover happened. Rollback coverage and the currently deployed schema were not verified.

### `ton36475-lgtm/sirinx-sovereign-swarm` — `main`

Forward Supabase migrations:

1. `infra/supabase/migrations/001_lead_core_minimal.sql`
2. `infra/supabase/migrations/002_lead_core_rls_policies.sql`
3. `infra/supabase/migrations/003_reply_draft_approval_queue.sql`
4. `infra/supabase/migrations/004_reply_outbox_gated_send.sql`
5. `infra/supabase/migrations/005_reply_outbox_channel_gate.sql`
6. `infra/supabase/migrations/006_admin_access_audit.sql`
7. `infra/supabase/migrations/007_webhook_security_audit.sql`

Rollback files present in the public tree:

- `infra/supabase/rollback/002_lead_core_rls_policies.rollback.sql`
- `infra/supabase/rollback/003_reply_draft_approval_queue.rollback.sql`
- `infra/supabase/rollback/004_reply_outbox_gated_send.rollback.sql`
- `infra/supabase/rollback/005_reply_outbox_channel_gate.rollback.sql`
- `infra/supabase/rollback/006_admin_access_audit.rollback.sql`
- `infra/supabase/rollback/007_webhook_security_audit.rollback.sql`

No rollback file for migration `001` appeared in the returned default-branch tree. This is a path observation only, not a statement about recovery procedures elsewhere.

### Portfolio repositories — independent and not assumed to be SIRINX production

The same path pattern appears in each of these public repositories:

- `3d-portfolio-production/migrations/auth/0001_auth.sql`
- `3dcarRealwordportfolio/migrations/auth/0001_auth.sql`
- `driveto3dworld/migrations/auth/0001_auth.sql`
- `new3dport/migrations/auth/0001_auth.sql`

Each also contains `scripts/migration-plan.mjs` and `scripts/migration-plan.test.mjs`. Similar names do not prove shared lineage; do not merge or run them without ownership, schema and environment checks.

## Migration planning/document candidates

- `automated-marketing-agency/PHASE5_MIGRATION.md`
- `automation-documentation/DATABASE-MIGRATION-STRATEGY.md`
- `chokma-growth-os/broadcast_migration_path.md`
- `oz-corp-omega-dual-node/docs/MAC_OLD_WORK_MIGRATION.md`
- `sirinx-os/docs/grid/02-mcp-migration.md`
- `sirinx-co/MIGRATION_SEQUENCE.md`
- `sirinx-co/RUST_MIGRATION_PLAN.md`
- `sirinx-sovereign-swarm/packages/migration-readiness/src/migrationReadinessGate.mjs`
- `sirinx-sovereign-swarm/scripts/migration-readiness-gate.mjs`
- `sirinx-sovereign-swarm/scripts/validate-migrations.mjs`
- `sirinx-sovereign-swarm/tests/db-gate/migration-guardrails.test.mjs`
- `sirinx-sovereign-swarm/tests/migration-readiness/migration-readiness-gate.test.mjs`

Other schema files are indexed in `public/downloads/github-public-repo-file-inventory.json` and `TECH_STACK.md`; they are intentionally not treated as migrations just because a filename contains `schema`.

## Proposal-only migration approach

1. **Identify canonical owners and runtime.** Confirm which repository and service actually backs each current website, API and database. Public Git history alone does not establish production mapping.
2. **Snapshot and classify.** Compare source schemas, live schema, migration history, data owners, retention rules, PII classes and access policies. Do not combine `sirinx-co`, `sirinx-sovereign-swarm`, portfolio and experimental trees by name alone.
3. **Select one bounded target.** Define an additive, versioned API/schema contract and explicit ownership for `.org` evidence, `.co` assessment, engineering records, partner intake and brand-consent records.
4. **Design least-privilege boundaries.** Require RLS/authorization tests, audit records, idempotency, rate limits, retention and deletion paths. Public projections must not expose private lead, staff or engineering data.
5. **Prepare reversible staging migration.** Require backup/restore proof, deterministic fixtures, migration dry-run, rollback plan, observability and an independent reviewer in a non-production environment.
6. **Separate authority from prototype.** A human owner must approve any later repository, database, DNS, Cloudflare or production change. None is authorized or performed in this task.

**Status:** no migration SQL was executed; no database was connected; no repository, branch, schema, production system or secret was changed or queried.
