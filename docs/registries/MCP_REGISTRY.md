# MCP Server Registry

Catalog of authorized local Model Context Protocol servers.

## Candidate Servers

| Server     | Status                                               | Scope                   | Activation Gate                                                                                             |
| ---------- | ---------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| TestSprite | `LOCAL_SECRET_SLOT_AND_CONFIG_WRITTEN_NOT_ACTIVATED` | AI validation layer     | `APPROVE_TESTSPRITE_REAL_KEY_INSERTED_VERIFY_LOCAL_ONLY`, `APPROVE_TESTSPRITE_MCP_SERVER_SMOKE_LOCAL_ONLY`  |
| Headroom   | `EVIDENCE_PACKET_WIRING_COMPLETE_NOT_MCP_ACTIVATED`  | context compression     | `APPROVE_HEADROOM_EVIDENCE_WIRING_ADD_TO_STANDARD_QA_LOCAL_ONLY`, `APPROVE_HEADROOM_MCP_DRY_RUN_LOCAL_ONLY` |
| SLayerDemo | `LOCAL_DEMO_CONFIG_WRITTEN_REPO_CLIENT_NOT_STARTED`  | semantic database layer | `APPROVE_SLAYER_MCP_HANDSHAKE_LOCAL_ONLY`, `APPROVE_SLAYER_PRODUCTION_DATASOURCE_APPROVAL_PACKET`           |

## Policy

- Candidate MCP entries are not active servers.
- Do not add API keys to tracked files.
- Do not start MCP servers without exact approval.
- Do not connect cloud testing/provider tools to production URLs without a
  separate production approval.
- Do not connect production database credentials to semantic-layer tooling
  without a separate approval packet.

## 2026-06-07 Local Updates

- TestSprite: ignored local secret slot `.env.testsprite.local` created with
  no key value present; ignored local config `.mcp.local/testsprite-mcp.json`
  written with placeholder only. Evidence:
  `outputs/evidence/testsprite/2026-06-07-api-key-local-secret-setup/` and
  `outputs/evidence/testsprite/2026-06-07-mcp-config-write/`.
- Headroom: local Rust evidence wire created and used to compress a TestSprite
  dry-run evidence file into a derived preview. Evidence:
  `outputs/evidence/headroom/2026-06-07-evidence-packet-wiring/`.

## 2026-06-20 Local Updates

- SLayerDemo: external repo installed at
  `/Users/sirinx/SIRINXDev/_external_repos/slayer` and verified against the
  bundled Jaffle Shop DuckDB demo storage. Ignored local config files are
  `.mcp.local/slayer-mcp.json`, `.mcp.local/slayer-mcp-runbook.md`, and
  `.mcp.json`.
- SLayerDemo has not been started as a persistent MCP service and has not been
  connected to production database credentials.
