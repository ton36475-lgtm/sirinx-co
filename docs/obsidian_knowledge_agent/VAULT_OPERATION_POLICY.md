# Obsidian Vault Operation Policy

Status: local-only policy doc

## Default Mode

Default mode is `draft_only`.

Generated notes are written under:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/obsidian_knowledge_agent/
```

No direct Vault mutation is allowed in v0.

## Allowed Reads

Only these are allowed after explicit path configuration:

- folder map
- rulebook Markdown files
- templates
- review queue files created by this system
- operator-provided source files

## Blocked Reads

Never read:

- `.env`
- SSH keys
- browser profiles
- password stores
- cloud credentials
- private keys
- unrelated personal folders

## Allowed Writes In v0

- runtime draft notes
- runtime manifests
- runtime concept graphs
- runtime rule candidates
- runtime review packets

## Blocked Writes In v0

- final Vault folders
- deletion or move of existing notes
- cloud sync trigger
- publishing
- third-party connector mutation

## Future Vault Write Gate

Before writing into an actual Vault review queue, require:

- configured Vault root;
- configured review queue path;
- backup or git clean/snapshot state;
- dry-run manifest;
- path allowlist validation;
- filename collision handling;
- rollback plan.

## Collision Policy

If a target note already exists:

- do not overwrite;
- create a draft with suffix `-draft-YYYYMMDD-HHMM`;
- record collision in manifest;
- ask for review or route to merge tool.

## Audit Manifest

Each draft pack should include:

```json
{
  "pack_id": "oka-20260624-001",
  "mode": "draft_only",
  "source_count": 1,
  "generated_notes": [],
  "proposed_vault_paths": [],
  "rule_candidates": [],
  "blocked_actions": [
    "direct_vault_write",
    "delete_existing_note",
    "cloud_sync",
    "publish"
  ]
}
```
