# SIRINX OS Canonical Monorepo

This repo is being prepared as the canonical `ton36475-lgtm/sirinx-co` monorepo.

Current phase:

```text
PR-MONO-001 - repo inventory and security quarantine
```

No legacy code has been bulk copied. This phase creates governance, migration maps, topology docs, release gates, and safe verification only.

## Local Verify

```bash
npm run check
```

## Public / Private Split

- Public website: `www.sirinx.co`
- Private HQ: `dev.sirinx.co`, protected by Cloudflare Access

## Safety

Internal services must never be public without Access and second gates:

- n8n
- Grafana
- LiteLLM admin
- Dify admin
- Ollama
- vLLM
- MySQL
- Redis
- MCP servers
- worker queues

## Next PR

`PR-MONO-002`: import public website app after this audit is approved.
