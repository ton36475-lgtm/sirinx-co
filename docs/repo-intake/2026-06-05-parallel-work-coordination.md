# Parallel Work Coordination - 2026-06-05

Status: LOCAL ONLY
Source board: `docs/repo-intake/2026-06-05-continuation-execution-board.md`

## Coordination Rule

Run old work in parallel only when lanes do not cross approval boundaries.
Implementation, provider calls, installs, live sends, deploys, and pushes remain
blocked unless separately approved.

## Lane Stack

| Priority | Lane                         | Current State                           | Parallel Action                                      |
| -------- | ---------------------------- | --------------------------------------- | ---------------------------------------------------- |
| P0       | ADS ANDROMEDA batch 02       | copy ready, visuals missing             | prepare visual asset QC inputs                       |
| P0       | Mission Control Git Evidence | implemented locally                     | capture screenshot/evidence when server is running   |
| P1       | Rust/Wasm Evidence Hasher    | spec ready                              | wait for prototype approval                          |
| P1       | Claw-Empire Hermes Adapter   | repo installed, no activation           | draft adapter contract                               |
| P1       | OpenCode DeepSeek            | routing candidate, CLI missing          | wait for install/smoke approval                      |
| P1       | Telegram Wife-to-Codex       | requested, not live                     | draft command contract                               |
| P1       | Oracle/Timeline packages     | docs/schemas exist                      | implement only after package-specific approval       |
| P1       | TestSprite MCP               | local slot/config written, not active   | wait for real key verification and server-smoke gate |
| P1       | Mercury Skills               | first batch vendor snapshot ready       | wait for live import gate if runtime use is needed   |
| P1       | Headroom Evidence Wiring     | local evidence preview wiring complete  | add to standard QA only after separate gate          |
| P2       | Kob AI                       | missing key/model                       | wait for hidden env config                           |
| P2       | thClaws mobile               | pairing/env incomplete                  | keep checklist only                                  |
| P2       | OSMGemma                     | download/runtime not started            | verify resources before install                      |
| P2       | Harness Terminal             | approved previously but not active here | draft hook plan before install/use                   |

## Today's Safe Batch

Completed in this spec lane:

1. Rust/Wasm evidence-hasher product spec.
2. Rust/Wasm evidence-hasher proof model.
3. Evidence hash manifest JSON Schema.
4. Parallel work coordination packet.

Next low-risk old-work lane:

```text
P0-ADS-ANDROMEDA-BATCH02-VISUAL-ASSET-QC
```

Reason: it is closest to revenue and does not require live publishing if kept
local.

## Blocked Gates

```text
APPROVE_RUST_WASM_EVIDENCE_HASHER_PROTOTYPE_LOCAL_ONLY
APPROVE_CLAW_EMPIRE_HERMES_ADAPTER_LOCAL_ONLY
APPROVE_INSTALL_OPENCODE_CLI_LOCAL_ONLY
APPROVE_OPENCODE_DEEPSEEK_FREE_SMOKE_LOCAL_ONLY
APPROVE_LIVE_TELEGRAM_COMMAND_UX_TEST
APPROVE_ADS_ANDROMEDA_FACEBOOK_LIVE_PUBLISH
APPROVE_TESTSPRITE_REAL_KEY_INSERTED_VERIFY_LOCAL_ONLY
APPROVE_TESTSPRITE_MCP_SERVER_SMOKE_LOCAL_ONLY
APPROVE_MERCURY_SKILLS_IMPORT_TO_HERMES_LIVE_LOCAL_ONLY
APPROVE_HEADROOM_EVIDENCE_WIRING_ADD_TO_STANDARD_QA_LOCAL_ONLY
```
