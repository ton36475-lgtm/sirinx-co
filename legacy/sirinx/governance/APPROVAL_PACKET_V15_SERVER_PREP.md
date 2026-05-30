# Approval Packet: SIRINX V15 Server Preparation

## Change Summary

This packet covers the server-preparation layer for the recovered SIRINX website. It adds Docker, governance, deployment handshake, vault separation, and readiness docs. It does not cut over production traffic.

## Risk Level

Medium. The changes are deployment-facing but are currently non-cutover and do not include production secrets.

## Rollback Note

Rollback for this preparation step is to remove or ignore the newly added deployment/governance artifacts and continue running the recovered local app with the prior process. No database or DNS state is changed by this packet.

## Audit Trail Note

Evidence must include:

- `pnpm run check`
- `pnpm run test`
- `pnpm run build`
- `docker compose config`
- `infra/scripts/deploy-handshake.sh` output when run on the target environment

## Human Approval Required Before

- DNS or reverse proxy cutover.
- Enabling PostgreSQL as live DB.
- Enabling n8n automation profile.
- Adding production secrets.
- Sending public traffic to the new server.

## Current Decision

Prepared for review only. Not approved for live cutover until the checklist in `docs/migration/PRODUCTION_READINESS_CHECKLIST.md` is complete.
