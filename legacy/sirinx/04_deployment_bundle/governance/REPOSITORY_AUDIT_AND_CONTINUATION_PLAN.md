# Repository Audit And Continuation Plan

## Audit Result

This repo is recoverable and should be continued, not rebuilt from zero.

Observed baseline:

- SIRINX local public website has already been recovered on `127.0.0.1:3000`.
- Existing stack is Vite/React/Express/tRPC with Drizzle configured for MySQL.
- Deployment artifacts were incomplete for a governed server move.
- Existing source has local recovery additions and should not be reverted blindly.

## Continuation Strategy

1. Preserve the recovered SIRINX public app.
2. Add deployment and governance files around the current app.
3. Keep PostgreSQL/n8n/Redis as target server infrastructure, with explicit migration gates.
4. Avoid mixing unrelated marketing stacks, gambling assets, or previous CHOKMA work into SIRINX.
5. Use approval packets before public cutover.

## Immediate Artifacts Added

- Docker build/runtime scaffold.
- Compose topology with app, Redis, PostgreSQL target, and optional n8n automation profile.
- Agent/IDE rules for continuation discipline.
- Server readiness, backup, observability, RBAC, and approval docs.
- Deployment handshake script.
- RBAC isolation e2e scaffold.
- Standard and shadow vault separation.

## Known Gaps Before Production

- PostgreSQL schema migration is not complete.
- Real SOPS configuration is not committed.
- Reverse proxy and TLS termination are server-specific and must be configured on the target host.
- Real monitoring endpoints and alert channels require approved secrets.
- `sirinx.co` remains blocked on the old host until infrastructure cutover is approved.

## Future Prevention Note

Every recovery pack must include a brand-content smoke test that fails if non-SIRINX or gambling content occupies the SIRINX public route.

Production server modules must not statically import development-only tooling such as Vite. Keep Vite imports dynamic inside the development-only setup path so Docker runtime images can start with production dependencies.

Confirmed 2026-04-23 runtime bug: the production server bundle pulled `vite.config.ts` into `dist/index.js`, which made the Docker image require dev-only Vite plugins at startup. Prevention pattern: use dynamic variable imports for dev-only modules and run a container smoke test after every server bundle or Dockerfile change.
