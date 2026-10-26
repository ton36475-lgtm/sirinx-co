# Hermes / models / dependencies update — 2026-10-26

Status: `JS DEPS DONE / MODEL CATALOG WRITTEN / BOTH APPS ALREADY CURRENT / 5 MCP SERVERS DOWN`

Scope agreed with the owner: update the Hermes agent and Hermes One app, refresh every
provider's model list, and update JS dependencies (npm root + pnpm workspace). Rust and
the Hermes python venv were explicitly left out by that choice.

## 1. Dependencies — npm root + pnpm workspace

`npm-check-updates --workspaces -u --target minor` then `pnpm install --no-frozen-lockfile`.

| Metric | Before | After |
|---|---|---|
| Outdated packages | 76 | 20 (all **major** bumps, deliberately not taken) |
| `pnpm-lock.yaml` | — | +1653 / −1412 lines |
| `apps/public-web/package.json` | — | 79 changed lines |
| `package.json` (root) | — | 5 changed lines (scripts only + 2 bumps) |

Verification after install:

```
npm run check          exit 0   PASS config contract 15/40
npm run control:test   exit 0   51 files / 507 tests
npm run web:check      exit 0   tsc --noEmit
npm run web:build:dual exit 0   77 legacy redirect rules, both dists built
```

Not taken (majors, each needs its own migration): `express 4→5`, `@types/express 4→5`,
`cookie 1→2`, `dotenv 17→18`, `jsdom 24→30`, `framer-motion 12→14`,
`@vitejs/plugin-react 5→6`, `@hookform/resolvers 5→6`, `@types/node 24→26`, plus the
0.x "anything may change" set (`esbuild 0.25→0.28`, `lucide-react 0.453→0.577`,
`drizzle-orm 0.44→0.45`).

## 2. Model catalog — 1,608 entries across 5 providers

Backup: `~/.hermes/config.yaml.bak-20261026-models` (358 lines before, 1,971 after).
Snapshot of what was fetched: `~/.hermes/model-catalog-20261026.json`.

| Provider | Models | Result |
|---|---:|---|
| aihubmix | 671 | discovered, `discover_models: true` |
| openrouter | 466 | discovered |
| omniroute-free-bridge (9router :20128) | 253 | discovered (needs 45 s timeout) |
| orcarouter-free | 215 | discovered |
| custom-lightvela | 3 | discovered |

Unreachable, left untouched (no key, wrong key, or endpoint down):

| Provider | Error | Owner action |
|---|---|---|
| api-stepfun-ai | 401 | `CUSTOM_PROVIDER_API_STEPFUN_AI_KEY` is empty |
| opencode-ai | 403 | `CUSTOM_PROVIDER_OPENCODE_AI_KEY` is empty; also the target of the dead `deepseek-free` alias |
| omniroute-vip-* | 401 | VIP key empty |
| maxplus-codex | 403 / 503 | key present, provider rejects it |
| hermesone | connection refused | `inference.hermesone.org` not answering |
| inferera | no `base_url` | provider entry is a stub |
| mlx-local | empty body from `/v1/models` | server does not implement model listing |

Gateway restarted onto the new config, `/health` 200 v0.22.5, Telegram adapter connected.

## 3. Hermes agent and Hermes One app

| Component | Installed | Upstream | Verdict |
|---|---|---|---|
| Hermes agent CLI | v0.22.5+197 (2026.9.24, git) | stable v0.22.5, `hermes update --check`: "No newer release" | already current; checkout is 197 commits past the tag |
| Hermes One.app | 0.7.7 (2026-09-04) | GitHub `fathah/hermes-desktop` latest release **v0.7.7** | already current — nothing to install |

No app replacement was attempted, because there is no newer release to install.

## 4. Telegram and MCP

**Telegram** — the gateway's adapter is live: startup logs show
`set_my_commands OK` for default/private/group scopes and `60 commands registered`
(214 hidden by Telegram's 60-command limit). `hermes status` still prints
"✗ not configured" because it reads `platforms.telegram` config keys, and that block only
has `enabled: true`; the token, allowed users and home channel live in `~/.hermes/.env`
(`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USERS`, `TELEGRAM_HOME_CHANNEL` — all set).
So: working, with a cosmetic status mismatch. No message was sent (that would be an
outbound send).

Recurring network warning: the adapter flips between sticky IPv4 `149.154.166.110` and
`api.telegram.org` because this host's IPv6 path is dead. `network.force_ipv4: true`
(doctor issue #1) is still unset.

**MCP** — 13 configured, **8 healthy / 364 tools**:

| Server | Tools |
|---|---:|
| rea | 207 |
| omniroute-mcp | 99 |
| slayer-demo | 20 |
| sirinx-files | 14 |
| sirinx-hyperresearch-readonly | 10 |
| dwb-stitch-async | 7 |
| telegram-cc | 4 |
| manus-mcp | 3 |

Down (5): `supabase`, `linear` need an interactive `hermes mcp login <server>` (OAuth, no
cached tokens); `unreal-engine` (`127.0.0.1:8000`), `mongomodel` (`127.0.0.1:3100`) and
`dwb-core` (connection closed) point at nothing. Each of those costs 7–9 s at gateway
startup, which is why a restart takes ~2 minutes.

Tool calling itself is proven: `hermes mcp test` enumerates live schemas per server, and
the 8 healthy servers answer with their tool lists.

## 5. Still open

- 20 major dependency bumps (separate migration).
- 7 providers with no usable model list (keys/endpoints above).
- `network.force_ipv4` not set; IPv6 route still dead.
- 5 MCP servers down; 3 of them could simply be disabled to cut startup latency.
- Rust workspace and the Hermes python venv were not updated (out of the agreed scope).
