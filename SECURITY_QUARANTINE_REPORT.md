# Security Quarantine Report

Generated: 2026-05-12

## Summary

No real `.env`, `.pem`, or `.key` files were found in the clean read-only scan. Several repos contain `.env.example`, deploy scripts, Docker/Cloudflare configs, and files that mention token/API-key variables. These must be treated as quarantine inputs before import.

## High-Risk Sources

### `sirinx`

Risk:

- deployment bundles
- duplicate infra scripts
- Docker compose
- `.env.example` / `.env.local.example`
- DB ops scripts

Quarantine before import:

```text
04_deployment_bundle/
infra/scripts/
docker-compose.yml
```

### `sirinx-solar-energy`

Risk:

- Telegram/bot scripts
- Cloudflare wrangler configs
- workflow file
- test key scripts

Quarantine before import:

```text
scripts/*bot*.js
scripts/*telegram*.js
scripts/test-api-keys.mjs
test-keys.js
cloudflare/**/wrangler.toml
.github/workflows/node.js.yml
```

### `oz-corp-omega-dual-node`

Risk:

- very large agent tree
- many install scripts
- Cloudflare `wrangler.toml`
- command center deploy script
- Docker compose

Quarantine before import:

```text
apps/sirinx-app/src/agents/**/scripts/install.sh
apps/solar-dashboard/wrangler.toml
deploy-command-center.sh
services/docker-compose.yml
```

## Medium-Risk Sources

- `automation-mobile-app`: `Dockerfile`, `scripts/build-apk.sh`
- `ghost-claw-os`: `scripts/build-apk.sh`
- `automation-system-backend`: `backend/.env.example`, `infrastructure/docker-compose.yml`
- `automation-dashboard`: `.env.example`

## Token Pattern Scan

Paths with high-risk token/API-key variable patterns were found, but raw secret values were not printed. These files must be reviewed before import:

```text
server/_core/llm.ts in several repos
automation-system-backend/backend/codex-integration-service.js
sirinx-solar-energy scripts and future OpenClaw engine files
oz-corp-omega-dual-node Telegram integration skill files
```

## Quarantine Policy

1. No `.env` imports.
2. No deploy script activation.
3. No Cloudflare write scripts enabled.
4. No bot/customer message scripts enabled.
5. No production DB scripts enabled.
6. Replace secrets with `.env.example` placeholders only.
7. Every legacy script import needs a PR note explaining why it is safe.
