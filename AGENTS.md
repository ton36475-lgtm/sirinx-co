# AGENTS.md - SIRINX OS Canonical Monorepo Rules

Status: PR-MONO-001 governance scaffold.

This repo is the canonical target for consolidating SIRINX OS. AGM is excluded.

## MillerDev Pattern

```text
Goal + Constraints + File Scope + Expected Result
Inspect -> Plan -> Implement -> Verify -> Report
```

No agent may skip inspection, fake validation, silently deploy, silently push, or silently mutate cloud resources.

## Autonomy

Allowed without extra approval:

- read-only inspection
- documentation-only updates
- safe local code edits
- local check/test/build
- mock or dry-run integrations
- PR-ready branch work without push

Stop for approval before:

- GitHub push or PR creation
- Cloudflare, DNS, Pages, Workers, R2, or Access mutation
- production deploy
- paid API call
- production database write
- customer message
- public exposure of internal tools

## Forbidden

- `.env` or `.env.*` with real values
- real tokens, passwords, SSH keys, cookies, browser profiles, keychains
- unreviewed legacy deploy scripts
- public exposure of dev dashboard, n8n, Grafana, LiteLLM admin, Dify admin, Ollama, vLLM, MySQL, Redis, MCP servers, or queues
- guaranteed ROI, savings, revenue, no-ban, bypass, fake-proof, or zero-downtime claims

## Source Repos

See `REPO_AUDIT_AND_MERGE_MAP.md`.

## Release Gates

See `RELEASE_GATE.md`.
