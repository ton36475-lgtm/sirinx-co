# Brain DNA Import Rules

Generated: 2026-05-12

## Purpose

Define what SIRINX OS agents may import into long-term memory from project packs and legacy repositories.

## Allowed

- `AGENTS.md`
- `agent.md`
- `README.md`
- `PROJECT_STATE.md`
- `NODE_TOPOLOGY.md`
- `NETWORK_PORT_MAP.md`
- `RELEASE_GATE.md`
- `CLOUDFLARE_EDGE_PLAN.md`
- `PUBLIC_WEBSITE_GO_LIVE_CHECKLIST.md`
- `MAC_HANDOFF_CHECKLIST.md`
- sanitized docs
- KMS/prompts without secrets
- public architecture notes
- security policies
- research summaries

## Forbidden

- `.env`
- `.env.*`
- API keys
- tokens
- passwords
- personal credentials
- customer PII
- raw private chat logs
- unredacted screenshots containing secrets
- browser cookies
- SSH keys
- Cloudflare tokens
- OpenAI keys
- LINE/Telegram tokens
- GitHub tokens

## Memory Metadata

Every memory entry should include:

```json
{
  "source": "file path or repo path",
  "type": "architecture|runbook|policy|prompt|qa|handoff",
  "confidence": "verified|draft|legacy|unverified",
  "sensitivity": "public|internal|restricted",
  "last_updated": "ISO timestamp",
  "allowed_for_agents": true
}
```

## Authority Rule

Memory is not authority. `PROJECT_STATE.md` and release gates override older memory.
