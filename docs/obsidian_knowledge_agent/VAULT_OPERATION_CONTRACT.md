# Vault Operation Contract

Status: local-only contract
Boundary: v0 can create runtime draft packs only; live Vault writes are blocked until a future explicit gate

## Purpose

This contract defines what the Obsidian Knowledge Agent may read, draft, propose, and mutate. Any future script, MCP connector, ChatGPT Agent bridge, or Autopilot adapter that touches the Vault must comply with this contract.

## Default Mode

```yaml
mode: draft_only
live_vault_write_enabled: false
delete_enabled: false
move_enabled: false
publish_enabled: false
cloud_sync_enabled: false
```

Draft artifacts must be written outside the Vault:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/obsidian_knowledge_agent/
```

## Operation Matrix

| Operation | v0 Decision | Requirement |
| --- | --- | --- |
| Read folder map | allow after configured path | path allowlist |
| Read rulebook Markdown | allow after configured path | no secret paths |
| Read operator-provided source | allow | source manifest |
| Create runtime draft note | allow | runtime output only |
| Create runtime concept graph | allow | runtime output only |
| Create runtime Canvas spec | allow | draft JSON/Markdown only |
| Propose Vault path | allow | collision check |
| Write live Vault note | blocked in v0 | future writeback gate |
| Rename or move existing note | blocked in v0 | backup + explicit move policy |
| Delete existing note | hard blocked | not allowed |
| Publish or sync note | hard blocked | not allowed |

## Required Manifest

Every draft pack must include a manifest:

```json
{
  "pack_id": "oka-20260624-001",
  "mode": "draft_only",
  "source_count": 1,
  "generated_notes": [],
  "proposed_vault_paths": [],
  "concept_graphs": [],
  "canvas_specs": [],
  "rule_candidates": [],
  "blocked_actions": [
    "write_live_vault_note",
    "delete_note",
    "publish_note"
  ]
}
```

## Collision Handling

If a proposed note path already exists:

1. do not overwrite;
2. create a runtime draft with suffix `-draft-YYYYMMDD-HHMM`;
3. record the collision in `manifest.json`;
4. propose a merge action instead of writing.

## Secret And Privacy Boundary

The agent must not read or copy:

- `.env`;
- private keys;
- SSH keys;
- browser profiles;
- password stores;
- cloud credentials;
- unrelated personal folders;
- private raw notes outside the configured allowlist.

## Future Live Writeback Gate

Before live Vault writes are enabled, the system needs:

- configured Vault root;
- configured review queue path;
- clean or snapshotted Git state;
- filename collision check;
- rollback or trash policy;
- dry-run manifest;
- operator-visible diff;
- audit log.

## Contract Consumers

| Consumer | Required Behavior |
| --- | --- |
| Codex scripts | create drafts only unless future gate exists |
| ChatGPT Agent MCP bridge | request draft packs, never mutate Vault directly |
| Mission Control | show status and blocked actions |
| Hermes Memory | write high-level summaries only |
| Autopilot adapters | validate operation against this contract before execution |
