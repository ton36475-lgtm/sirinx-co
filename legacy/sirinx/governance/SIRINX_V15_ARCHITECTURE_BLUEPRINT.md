# SIRINX V15 Architecture Blueprint

## Status

`Historical Reference Only - Not Canonical`

Use `governance/SIRINX_FINAL_ARCHITECTURE_BLUEPRINT.md` for current canonical architecture and `governance/OMNISCIENT_DASHBOARD_ARCHITECTURE.md` for the internal control-plane dashboard.

## Mission

Recover the SIRINX public website and prepare a governed server deployment path without reintroducing legacy Manus lock-in, mixed-brand assets, or uncontrolled runtime ownership.

## Runtime Planes

| Plane | Hostname | Purpose | Exposure |
| --- | --- | --- | --- |
| Public revenue plane | `sirinx.co` | Public website, quote capture, brand proof, SEO-safe content | Public HTTPS |
| Internal control plane | `ops.sirinx.co` | Operator workflows, approvals, n8n dashboards, reports | Private/admin HTTPS |
| Agent execution plane | `agents.sirinx.internal` | Local/remote agent tasks, queues, non-public automations | Private network only |

## Current Baseline

- Application stack: Vite, React, Express, tRPC, Drizzle.
- Current database adapter: MySQL/TiDB via `DATABASE_URL`.
- Target v15 database: PostgreSQL with WAL-backed durability.
- Local recovery state: public SIRINX site responds on port `3000`.
- Production blocker: current public host remains blocked upstream and requires server redeployment or hosting cutover after approval.

## Target Server Shape

- `sirinx-public`: public app container built from this repo.
- `sirinx-redis`: queue/cache backend for internal automation.
- `sirinx-postgres`: target durable DB, enabled only after schema migration review.
- `n8n-main`, `n8n-worker`, `n8n-runner`: optional automation profile for governed operations.
- Secrets: mounted at runtime only; never committed.

## Non-Negotiable Guardrails

- No production cutover without approval packet.
- No production secrets in repo, logs, screenshots, or handoff files.
- No CHOKMA/gambling/casino/lottery assets inside SIRINX runtime.
- No proxy rotation, stealth/fingerprint spoofing, multi-account evasion, or unofficial scraping.
- One owner per runtime role in hybrid Windows + Ubuntu setups.

## Migration Boundary

The repository currently uses Drizzle MySQL dialect. PostgreSQL is represented in `docker-compose.yml` as the v15 durability target but must not become the live `DATABASE_URL` until:

1. Drizzle schema has been migrated to PostgreSQL.
2. Data export/import has been rehearsed on non-production data.
3. Rollback has been proven.
4. Human approval is recorded.

## Server Cutover Sequence

1. Build and smoke-test the container locally.
2. Run `infra/scripts/deploy-handshake.sh`.
3. Render Docker Compose with real server `.env` and secrets mounted out of repo.
4. Start `sirinx-public` behind a staging hostname.
5. Run public content smoke, route smoke, and SIRINX brand smoke.
6. Enable `automation` profile only after public plane is stable.
7. Cut over DNS/proxy after approval packet is signed.

## Rollback Principle

Rollback must restore the last known good public website endpoint and disable any new automation profile. Data migrations require a separate database rollback note before approval.
