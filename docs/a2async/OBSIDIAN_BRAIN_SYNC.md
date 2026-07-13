# Obsidian Brain Sync for KOB and Codex

Status: local-first canonical memory policy

The SIRINX Obsidian Brain stores concise, durable work pulses. Detailed logs,
receipts, and implementation artifacts stay in repo or runtime folders.

## Canonical Paths

| Field | Path |
| --- | --- |
| Vault | `/Users/sirinx/Documents/Obsidian Vault/SIRINX` |
| Digest | `/Users/sirinx/Documents/Obsidian Vault/SIRINX/AI HQ Knowledge Digest.md` |
| Codex config | `/Users/sirinx/.codex/obsidian-brain-sync.json` |
| KOB config | `/Users/sirinx/.kob-cli/obsidian-brain-sync.json` |
| Runtime JSONL | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/memory/obsidian_sync.jsonl` |

## Worker Contract

- KOB plans, routes, compresses context, and may preview a proposed pulse.
- Codex executes local repo work and may append a validated pulse.
- Never include secrets, `.env` values, tokens, cookies, private keys, or raw
  logs.
- Preserve source/evidence paths and one next safe action.
- Do not rewrite frontmatter or existing notes.

## Canonical Script

Validate configuration without writing:

```bash
python3 scripts/a2a/a2a_obsidian_sync.py --check
```

Preview a pulse without filesystem mutation:

```bash
python3 scripts/a2a/a2a_obsidian_sync.py \
  --title "Short title" \
  --summary "What changed" \
  --source "/path/to/evidence" \
  --next-action "Next safe action" \
  --dry-run
```

Remove `--dry-run` only after the work is verified. A successful write appends
the digest, appends a JSONL event, and atomically refreshes
`obsidian_sync_last.json`. Concurrent appends use an exclusive file lock.

Use `--config /path/to/config.json` or `SIRINX_OBSIDIAN_SYNC_CONFIG` only for
an explicitly selected local worker profile. A profile with
`may_write_digest=false` can preview but cannot write.
