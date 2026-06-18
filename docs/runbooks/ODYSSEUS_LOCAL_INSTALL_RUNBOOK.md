# Odysseus Local Install Runbook

Status: planned external localhost-only sandbox.

## External Clone Path

`/Users/sirinx/SIRINXDev/_external_repos/odysseus`

## Branch

Use `main` unless the human explicitly chooses `dev`.

## Localhost Docker Flow

```text
copy .env.example to .env
verify auth remains enabled
verify bind is not public
docker compose up -d --build
open http://localhost:7000 only
read first admin password from docker compose logs odysseus
```

## Security Rules

- Keep auth enabled.
- Do not expose public access.
- Do not bind to `0.0.0.0`.
- Do not expose raw model, database, vector, queue, or admin service ports.
- Use Tailscale or Cloudflare Access only after approval and hardening.
- Do not vendor AGPL source into this monorepo.

## Stop Conditions

Stop before Docker start, public bind, reverse proxy, HTTPS, model endpoint
wiring, or MCP tool activation unless separately approved.
