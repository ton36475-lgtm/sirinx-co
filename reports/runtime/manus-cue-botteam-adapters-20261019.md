# Vibe-team spawn + Cline/Manus adapters — 2026-10-19

Status: `LOCAL_PLAN_AND_ADAPTERS_SHIPPED / ZERO_PROVIDER_CALL`
Method: REA (read-only public sources) → plan → implement → verify → report.
No reference repository was cloned or installed. No provider call, queue write,
message, deploy, or push occurred.

## 1. REA findings (public READMEs and docs only)

| Reference | License | Pattern adopted | Pattern refused |
| --- | --- | --- | --- |
| [CopilotKit/OpenBot](https://github.com/CopilotKit/OpenBot) | MIT (alpha) | AG-UI agent per coworker; every tool call passes one gateway that decides, records, then acts; per-worker computer boundary with human takeover | cloning the template, container supervisor, CopilotKit Intelligence dependency |
| [FoundationAgents/OpenManus](https://github.com/FoundationAgents/OpenManus) | MIT | planner/executor split where only the executor holds the action lease | cloning/installing the Python stack, provider keys in repo, Browser Use MCP activation |
| [CopilotKit/OpenDots](https://github.com/CopilotKit/OpenDots) | MIT (alpha) | per-role tool ceiling plus an explicit approval card before any effect | cloning the template, Composio/connected-app credentials, host command execution |

All three are templates, not services; none ships a governance layer equivalent
to this repo's HOLD-by-default gates, so only their *shapes* were adopted.

## 2. Platform surfaces that were actually read

### Manus API v2

- Base `https://api.manus.ai`, versioned endpoints (`/v2/...`); v1 deprecated.
- Auth: `x-manus-api-key` (full account access) or OAuth2 `Authorization: Bearer`.
- `POST /v2/task.create` body: `message.content[]` (text parts, ~5k token cap),
  optional `connectors`, `enable_skills`, `force_skills`, `task_references`,
  `project_id`, `locale`, `interactive_mode`, `hide_in_task_list`,
  `share_visibility`, `agent_profile`, `title`, `structured_output_schema`.
- `agent_profile` accepts `standard | lite | max | max-medium | max-high |
  max-extra | max-ultra` plus versioned aliases (`2.0-max`, …).
- Response: `{ok, request_id, task_id, task_title, task_url, share_url,
  share_visibility}`. Tasks are asynchronous; progress is polled with
  `task.listMessages`, follow-ups via `task.sendMessage`.
- Sources: <https://open.manus.ai/docs/v2/introduction>,
  <https://open.manus.ai/docs/v2/authentication>,
  <https://open.manus.ai/docs/v2/task.create>.

### Cline CLI

- `cline --json` is headless; `--auto-approve <boolean>` defaults to **true**,
  which is why the adapter always passes `false`; `-p` is plan mode, `--cwd`,
  `--timeout`, `--data-dir`, `-m`, `-P` are supported.
- Built-in tools are `read_files`, `search_codebase`, `run_commands`,
  `fetch_web_content`, `apply_patch`/`editor`, `skills`, `ask_question`.
  There is **no built-in desktop computer-use tool**; computer use arrives via
  MCP (`~/.cline/data/settings/cline_mcp_settings.json`, overridable with
  `CLINE_MCP_SETTINGS_PATH`).
- Sources: <https://docs.cline.bot/usage/cli-overview>,
  <https://docs.cline.bot/tools-reference/all-cline-tools>,
  <https://docs.cline.bot/mcp/mcp-overview>.

### Manus 2.0 / Cue

- Manus 2.0 (2026-09-28) adds Cascade, Cloud Computer, Automations, Studio,
  and **Cue** — a standalone personal-agent app where each agent has its own
  email, phone, wallet, and computer, and several agents share a group goal.
- Cue is invite-gated early access and **no public Cue API is documented**, so
  the plan keeps Cue as a human-operated lane. Source:
  <https://manus.im/blog/introducing-manus-2-0>.

## 3. What shipped

| Artifact | Purpose |
| --- | --- |
| `config/agent-runtime/vibe-team.spawn.v1.json` | closed plan: 3 references, 3 lanes, 3 team shapes, budgets, stop rules, every authority flag `false` |
| `schemas/agent-runtime/vibe-team.spawn.v1.schema.json` | closed Draft 2020-12 schema for the plan |
| `services/dev-control-api/src/vibe-team-spawn.mjs` | plan validator + deterministic `TaskEnvelopeV1`-shaped spawn packets, worker cap 3 |
| `services/dev-control-api/src/manus-cue-adapter.mjs` | Manus `task.create` request builder + gated client (dry-run default) |
| `services/dev-control-api/src/cline-lane-adapter.mjs` | headless Cline argv builder + gated runner (no process primitive in module) |
| `services/dev-control-api/src/*.test.mjs` | 15 focused tests |

### Gate behavior

- Manus live call requires **all** of: `SIRINX_MANUS_LIVE=1`,
  `SIRINX_PROVIDER_CALL_TICKET` matching `^[A-Z0-9][A-Z0-9-]{5,63}$`,
  `MANUS_API_KEY`, and an injected `fetchImpl`. Otherwise the result is
  `DRY_RUN` or `BLOCKED` with `providerCalled: false`.
- Cline live run requires the same flag and ticket plus an injected runner;
  the module contains no `node:child_process` import, so it cannot start a
  process on its own.
- Both adapters refuse packets that are not `PROPOSAL_ONLY`, refuse packets
  whose `effects` are not all `false`, refuse secret-bearing prompts, and pin
  the Manus endpoint to `https://api.manus.ai/v2/task.create`.
- Manus tasks are always `share_visibility: "private"`,
  `hide_in_task_list: true`, `interactive_mode: false`.
- The plan carries no routes and is not wired into `server.mjs`; there is no
  queue or A2A surface behind it.

## 4. Cline install (outside the repo)

Installed at `~/Downloads/cline-bot` on Apple Silicon:

- `cline` 3.0.73, native `@cline/cli-darwin-arm64` (Mach-O arm64).
- `npm install --ignore-scripts` — the package postinstall was not executed.
- Isolated state: `--data-dir ~/Downloads/cline-bot/data`.
- Computer use: `chrome-devtools-mcp` 1.11.0 launched with `--isolated`,
  `--experimentalVision`, `--no-usage-statistics`, `--no-performance-crux`.
- MCP handshake verified: server `chrome_devtools` 1.11.0, 32 tools including
  `click`, `drag`, `fill`, `take_screenshot`; `autoApprove` empty.
- No provider is authenticated yet, so no Cline task has run.

## 5. Verification

| Check | Result |
| --- | --- |
| `vitest run` on the three new test files | 15/15 pass |
| Ajv 8.20.0 + ajv-formats strict compile of the schema against the config | `schema_valid: true` |
| `npm run check` (adds `node --check` for the three modules) | exit 0 |
| MCP `initialize` + `tools/list` handshake | initialized, 32 tools |
| Provider calls / clones / queue writes / sends | 0 |

## 6. Blockers and next steps

1. **Manus live use** needs an API key in a secret store plus an open
   `PROVIDER_CALL` ticket; paid calls are a human decision (C5 order).
2. **Cue** stays manual: no public API, and per-agent wallet/phone authority is
   not admitted. Do not model Cue as an API lane until Manus publishes one.
3. **Cline auth** (`cline auth`) is operator work; the local data dir holds no
   credentials.
4. **Disk** was 7.9 GiB free after the Cline + MCP install, below the repo's
   15 GiB workload floor. Resource recovery (B12) still gates heavier work.
5. **No queue**: `ManusCueBotTeam` currently means a validated spawn plan plus
   adapters; a durable task queue would need B10 managed authority and the
   migration-0007 kernel before it can hold lease/claim state.
