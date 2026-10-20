# REA 6.7.0 rollout — machine install + 4 agent lanes (sub-agent split) — 2026-10-20

Status: `INSTALLED / 4 LANES WIRED / HANDOFF VERIFIED`
Workspace: `/Users/sirinx/SIRINXDev/sirinx-co` · Method: MillerDev + `docs/agent-runtime/SPAWN_PLAYBOOK.md`
Entry point: `https://github.com/morluto/rea` (MIT, `rea-agents` on npm)

## 1. Provenance check (before install)

| Field | Value |
| --- | --- |
| package | `rea-agents` |
| version installed | **6.7.0** |
| license | MIT |
| repository | `git+https://github.com/morluto/rea.git` |
| dist.integrity | `sha512-yhIx2ioJYYT1C/tONfYeitC6LhnKmCh+ZwRUOgYuhSc733lGhkkt73zhug9WmLgxoMdKuqIYGCoBfD4fXkOhFw==` |
| engines | `^22.19.0 \|\| ^24.11.0 \|\| >=26.0.0` (host: v22.23.1) |
| unpacked | 28,575,703 B |

Installed with `npm install -g rea-agents@6.7.0` → `~/.local/bin/rea`, `rea --version` = `6.7.0`.

`npm` blocked one transitive install script: `frida@17.23.2` (`install: node scripts/install.js`) because it is not in the user's allow-scripts list. That was **not** overridden. Consequence: frida-based dynamic instrumentation can fail until the owner runs `npm install -g --allow-scripts=frida` deliberately.

## 2. Sub-agent split

Envelope built by the A36 builder (`implementation` shape, `PROPOSAL_ONLY`, 0 cost, `runtime_spawned=false`):
`reports/runtime/rea-rollout-dispatch-20261020.json`

| Role | Duty | Lane | Task | Owned work |
| --- | --- | --- | --- | --- |
| L4-36 | coordinator | manus | `task_106c7553dfda9c17` | lane split, stop conditions, final accounting |
| L4-37 | maker | cline | `task_30c890fcee6f0b90` | the 5 config edits (backup → edit → assert) |
| L4-42 | checker | manus | `task_24dfbccabb35ce32` | re-parse every config, verify pins, confirm binaries |

No lane was activated live (Manus needs a `PROVIDER_CALL` ticket + key; Cline needs `cline auth`);
the roles above were executed as bounded local stages by the orchestrator, each with its own evidence.

## 3. Lanes delivered

| Lane | File | Before | After |
| --- | --- | --- | --- |
| Claude Code | `~/.claude.json` → `mcpServers.rea` | `npx -y rea-agents@6.2.0 mcp` | `npx -y rea-agents@6.7.0 mcp` |
| Codex | `~/.codex/config.toml` → `[mcp_servers.rea]` | `npx -y rea-agents@6.2.0 mcp` | `npx -y rea-agents@6.7.0 mcp` |
| opencode | `~/.config/opencode/opencode.json` → `mcp.rea` | `rea-agents@4.0.1` | `rea-agents@6.7.0` |
| Cline (iCloud) | `…/SIRINX_AI_WORK_20261020/cline-bot/data/settings/cline_mcp_settings.json` | no `rea` | `/Users/sirinx/.local/bin/rea mcp` |
| Repo template | `infra/opencode/opencode.template.json` | `rea-agents@4.0.1` | `rea-agents@6.7.0` |

Cline additionally needed a repair caused by the 2026-10-20 iCloud move: `computer-use-browser`
pointed at the deleted `~/Downloads/cline-bot/node_modules/.bin/chrome-devtools-mcp`. It now
points at the iCloud copy and the target is executable (`test -x` ok).

Backups (pre-edit, `-p` timestamps kept): `~/.sirinx-backups/rea-rollout-20261020/`
(`.claude.json`, `opencode.json`, `config.toml`, `opencode.template.json`, `cline_mcp_settings.json`).

## 4. Verification

| Check | Result |
| --- | --- |
| MCP stdio handshake `rea mcp` → `initialize` | `serverInfo {name: "rea", version: "6.7.0"}` |
| `tools/list` | **207 tools** (native, JS/Electron, .NET, APK, Go/Rust, WASM, EVM, SQLite, firmware, ADB, captures) |
| `.claude.json`, `opencode.json`, `cline_mcp_settings.json` JSON.parse | ok |
| pin sweep `rea-agents@(?!6\.7\.0)` over repo | none |
| binaries | `rea` executable; `chrome-devtools-mcp` executable at new path |
| repo tests referencing the template | none (no test coupled to the pin) |

## 5. Boundaries

- No target was analysed: no binary, APK, firmware, packet capture, or website was opened.
- No Hopper/Ghidra/IDA/JADX/adb/binwalk provider was configured; native/APK/firmware lanes stay unavailable until a provider is installed and approved.
- No repo secrets, keys, or credentials were read or written; configs hold commands and paths only.
- `mcp-connections` registry (`deny-all`) was **not** modified, so REA is present in agent configs but not yet an admitted connection in the repo governance plane.
