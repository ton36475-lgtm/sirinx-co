# Local-First Security Policy

Status: active local-only policy.

## Rules

- No deploy, push, publish, or public tunnel without explicit approval.
- No public endpoint or reverse proxy without explicit approval.
- No raw model, database, vector service, queue, or admin port exposure.
- No secret printing.
- Localhost first for dashboards, workspaces, and runtime previews.
- Mobile nodes are monitoring and approval surfaces only.
- Cloudflare mutations require a PRE_APPROVAL_PACKET.
- External APIs require approval, budget awareness, and key handling through
  environment variables or approved local secret slots.

## Blocked By Default

- `APP_BIND=0.0.0.0`.
- `AUTH_ENABLED=false`.
- Provider calls.
- Paid API batches.
- Telegram live sends.
- GitHub mutation APIs.
- Production database writes.
- Public tunnels.
- Browser profile, cookie, token, session, SSH key, cloud config, or password
  store reads.

## Allowed By Default

- Read-only inspection.
- Local documentation updates after approval.
- Local-only schema/template drafting.
- Syntax checks.
- Masked secret-marker scans that print file and line only.

## Required Before External Action

Create and review a PRE_APPROVAL_PACKET with goal, scope, files, commands,
external services, secrets required, risks, rollback, tests, and stop condition.
