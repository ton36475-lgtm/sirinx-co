# Obsidian Brain Sync for KOB and Codex

Status: local-first active memory policy

This document configures KOB CLI and Codex local workers to use the SIRINX
Obsidian Brain as the durable work memory for A2A Sync v2 and related work.

## Canonical Brain

| Field               | Value                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| Vault root          | `/Users/sirinx/Documents/Obsidian Vault/SIRINX`                           |
| Digest note         | `/Users/sirinx/Documents/Obsidian Vault/SIRINX/AI HQ Knowledge Digest.md` |
| Operations log area | `/Users/sirinx/Documents/Obsidian Vault/SIRINX/06_OPERATIONS`             |
| AI memory area      | `/Users/sirinx/Documents/Obsidian Vault/SIRINX/08_AI_MEMORY`              |
| Automation area     | `/Users/sirinx/Documents/Obsidian Vault/SIRINX/09_AUTOMATIONS`            |

## Worker Rules

KOB and Codex must use Obsidian Brain sync for all substantive work:

1. Read project context from repo files first.
2. Use Obsidian Brain as durable memory, not as a secret store.
3. Append concise work pulses to `AI HQ Knowledge Digest.md` after meaningful
   local setup, architecture, runtime, deploy, or recovery work.
4. Never write secrets, API keys, browser cookies, raw tokens, private keys, or
   `.env` values into Obsidian.
5. Preserve source paths and runtime artifact paths so future agents can verify
   claims.
6. Keep large raw logs out of the digest. Link to local evidence instead.
7. If a task fails, record blocker, attempted command family, and next safe
   action without leaking sensitive output.

## KOB Role

KOB may summarize Obsidian-safe context and propose next work. KOB must not
write repo files directly, mutate vault frontmatter, run provider calls for
Codex execution, or copy secret material into memory.

KOB local config pointer:

- `~/.kob-cli/agent.md`
- `~/.kob-cli/obsidian-brain-sync.json`

## Codex Role

Codex may update repo files and append concise memory pulses after validated
work. Codex must keep detailed artifacts in runtime folders and write only a
short index into Obsidian.

Codex local config pointer:

- `~/.codex/AGENTS.md`
- `~/.codex/obsidian-brain-sync.json`

## Runtime Sync Script

Use:

```bash
python3 scripts/a2a/a2a_obsidian_sync.py \
  --title "Short title" \
  --summary "What changed" \
  --source "/path/to/evidence" \
  --next-action "Next safe command"
```

Default output:

- Appends one concise entry to the digest note.
- Writes a matching JSONL event under
  `~/SIRINXDev/.ghostclaw_runtime/a2async/memory/obsidian_sync.jsonl`.

Use `--dry-run` to preview without writing.
