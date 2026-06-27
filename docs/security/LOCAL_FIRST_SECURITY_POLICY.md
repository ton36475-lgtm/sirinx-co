# Local-First Security Policy

Status: active local-first policy for full-auto mode.

## Rules

- No deploy, push, publish, or public tunnel unless policy allows it and
  verification, rollback, budget, and audit requirements pass.
- No public endpoint or reverse proxy unless policy allows it and auth/rate
  limit/access-layer checks pass.
- No raw model, database, vector service, queue, or admin port exposure.
- No secret printing.
- Localhost first for dashboards, workspaces, and runtime previews.
- Mobile nodes are monitoring and kill-switch surfaces only.
- Cloudflare mutations require policy allow, canary/rollback readiness, and
  audit logging.
- External APIs require policy allow, budget cap, rate limit, and key handling
  through environment variables or approved local secret slots.

## Blocked By Default

- `APP_BIND=0.0.0.0`.
- `AUTH_ENABLED=false`.
- Provider calls without budget/rate/policy allow.
- Paid API batches.
- Telegram live sends to non-whitelisted or non-opt-in recipients.
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

Create a job manifest and execution lease with goal, scope, files, commands,
external services, secrets required, risks, rollback, tests, budget cap, rate
limit, policy decision, and stop/quarantine condition.
