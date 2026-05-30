# Deployment And Secrets Policy

## Purpose

Keep SIRINX deployment deterministic, reversible, and free of production secrets in the repository.

## Secrets Rules

- Never commit real `.env` files.
- Use `.env.example` only for names and safe placeholders.
- Store production secrets in the approved server secret manager or deployment mechanism.
- Rotate any secret that appears in logs, artifacts, chat, screenshots, or committed files.
- Do not infer credentials from old Ghost Claw, CHOKMA, Telegram, or Manus packs.

## Deployment Rules

- Local build and smoke must pass before server handoff.
- Docker Compose config must render before server activation.
- Reverse proxy changes require approval.
- DNS/TLS changes require approval.
- Database/Redis must not be exposed publicly.
- n8n queue workers may run only in the internal agent plane after approval.

## Required Evidence

- `git status --short`
- test/check/build output
- Docker Compose config output
- server preflight output
- route smoke output
- secret scan result
- approval packet path

## Rollback Note

For failed deployment before DNS cutover, stop the new container stack and keep the previous origin. For failed deployment after cutover, revert DNS/proxy to the last known good origin, then stop the new stack.

## Audit Trail Note

Save command outputs, timestamps, operator, server hostname, commit hash, bundle hash, and rollback target.
