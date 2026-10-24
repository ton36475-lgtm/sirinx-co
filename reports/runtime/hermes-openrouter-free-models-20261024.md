# Hermes agent — restored on OpenRouter free models (2026-10-24)

Status: `REPAIRED_LOCAL / OPENROUTER_FREE / GATEWAY_RESTARTED / ZERO_PUSH`

Scope: make the Hermes agent answer again by re-pinning it to OpenRouter
free models that actually exist, after three configured model IDs were
retired upstream. All measurements below were taken on this host in this
session. No credential value is printed, no cloud resource was touched.

## 1. What was broken

The default profile (the one that serves Telegram, the API server and the
CLI) failed every turn:

```
$ hermes -z "Reply with exactly: PONG"
custom didn't answer after 1 attempts — it looks temporarily unavailable.
Provider said: HTTP 404: apodex/apodex-1.1-mini:free is no longer
available on OpenRouter: no provider serves this model anymore.
```

The `solis` profile (active profile, dashboard lane) failed identically.

| # | Defect | Measured evidence |
| --- | --- | --- |
| 1 | `model.provider: orcarouter-free` is not a provider id Hermes can resolve | `hermes -z ... --provider orcarouter-free` → `Unknown provider 'orcarouter-free'`; `PROVIDER_REGISTRY` (80 ids) has no such entry — `resolve_provider()` special-cases only `openrouter` / `custom` / registry ids |
| 2 | With the primary unresolvable, the runtime fell through to the OpenRouter route, whose `default_model` was `apodex/apodex-1.1-mini:free` — retired | `GET /api/v1/models` → 469 models, **20** with zero prompt/completion price; `apodex/apodex-1.1-mini:free` absent |
| 3 | `solis` used `model.provider: openrouter-direct`, also not a registered id (`grep -rn openrouter-direct` in the installed tree → 0 hits) with the same dead model | same 404 through `HERMES_HOME=profiles/solis` |
| 4 | 12 other profiles + provider defaults + `gateway.telegram.model` + `solis agents.hermes` pinned `stealth/space-bunny-alpha` | absent from the live catalog; `grep -rn space-bunny-alpha` across `config.yaml` and `profiles/*/config.yaml` |
| 5 | `model.fallback_providers` pointed at LightVela (`403 insufficient_user_quota`), `nvidia/nemotron-3-super-120b-a12b:free` (`404` upstream), `google/gemma-4-26b-a4b-it:free` (`429`), the OmniRoute bridge (`:20128` refused), and `mlx-local` (a `providers:` entry, which `resolve_provider` cannot name) | per-endpoint probes, §2 |

Not a fault: the OpenRouter key itself. `GET /api/v1/key` → **200**, free
tier `free_model_daily_requests 11 / 1000`, `usage_monthly 0`.

## 2. Model selection — measured, not assumed

Every candidate was called with a real completion; the shortlist was then
driven through Hermes itself with the `terminal` toolset ("run
`echo …` and reply with its output"), because a model that chats but cannot
emit a tool call is useless to this agent.

| Model | Chat probe | Hermes tool call |
| --- | --- | --- |
| `cohere/north-mini-code:free` (256k) | 200 | **200 — `hermes-tool-ok`** |
| `recursive/flint-v1.0:free` (262k) | 200 | **200 — `hermes-tool-ok`** |
| `dots-studio/dots-3-note-preview:free` (512k) | 200 | **200 — `tool-ok`** |
| `nvidia/nemotron-3.5-lightning:free` (1M) | 200 | **200 — `tg-tool-ok`** |
| `poolside/laguna-s-2.1:free` | 200 `PONG` | 429 on the tool run (upstream rate limit) |
| `nvidia/nemotron-3-super-120b-a12b:free` | 404 upstream `Function … not found` | — |
| `google/gemma-4-{26b,31b}-it:free` | 429 upstream rate limit | — |
| `thinkingmachines/inkling:free` | 403 "only available on agentic harnesses" | — |
| `xingchen-agi/xing4.0-29b-a4b:free` | 429 upstream rate limit | — |
| `openrouter/free` | 200, routes to `laguna-xs-2.1` | — |
| `orcarouter/free` (old primary, paid lane) | 200 `PONG` | not needed |

Chosen primary: **`cohere/north-mini-code:free`** — verified tool use,
256k context. Fallbacks: **`recursive/flint-v1.0:free`**, then
**`dots-studio/dots-3-note-preview:free`** — both verified tool use.

## 3. What changed (config only, all outside the repo)

| File | Change |
| --- | --- |
| `~/.hermes/config.yaml` | `model.provider: openrouter`, `model.default: cohere/north-mini-code:free`, `api_key_env: OPENROUTER_API_KEY`, `context_length: 256000`; the stale `base_url: https://token.lightvela.ai/v1` and the dead `key_env`/`api_key_env` pair are gone; `model.fallback_providers` and top-level `fallback_providers` now carry only verified free models; `providers.openrouter.default_model` repointed and its model catalogue (stealth / qwen3.8 / apodex) replaced with the three verified IDs; `gateway.telegram.model` repointed |
| `~/.hermes/profiles/solis/config.yaml` | `model.provider: openrouter` (was the non-existent `openrouter-direct`), `model.default` repointed, `fallback_providers: []` → three verified free models, `providers.openrouter` + `providers.openrouter-direct` defaults repointed, dead catalogue entries removed, `gateway.telegram.model` and `agents.hermes.{model,provider}` repointed |
| 14 other profiles | `model.default` + `providers.openrouter.default_model` repointed from the retired IDs to the verified primary (`agent8c`, `backend`, `data`, `design`, `devops`, `frontend`, `growth`, `maxplus-kimi3`, `planner`, `qa`, `sales`, `scribe`, `shogun`, `sirinx-sec`) |
| `profiles/planner/config.yaml` | `model.planner` repointed (it also pinned `apodex`) |

Every edited file was backed up in place as
`config.yaml.bak-free-model-<timestamp>` (2026-10-24 09:28 local) before
the write, and all 16 configs parse (`yaml.safe_load`) after it.
`antigravity2`, `sirinx-research` and `webmcp` have no `config.yaml` and
inherit the default profile — nothing to repoint.

Left deliberately alone: `xkiro` and other third-party provider catalogues
(their `qwen3.8-27b:free` may exist on *those* providers), the paid
`anthropic/claude-sonnet-5` reviewer pin, and the user's explicit
per-session `/model` choice for the Telegram DM (see §5).

## 4. Live verification

| Probe | Result |
| --- | --- |
| `hermes -z "Reply with exactly: PONG-default"` (default profile) | `PONG-default` |
| `HERMES_HOME=profiles/solis hermes -z …` | `PONG-solis` |
| `HERMES_HOME=profiles/planner` / `profiles/sirinx-sec` | `OK-planner` / `OK-sirinx-sec` |
| final default-profile turn after the last edit | `FINAL-OK` |
| gateway after `hermes -p default gateway restart` | pid **2598**, `gateway_state: running` |
| `gateway_state.json` platforms | `telegram connected`, `api_server connected`, `a2a connected`, `whatsapp retrying (whatsapp_bridge_exited)` |
| `gateway.log` | `Model context warmed: cohere/north-mini-code:free -> 256000 tokens (config)` |
| `POST 127.0.0.1:8642/v1/chat/completions` (`model=hermes-agent`, bearer `API_SERVER_KEY`) | **200** — `LIVE-OK`, then **200** — `GW-FINAL` |
| after the WhatsApp correction (§5): gateway pid **40399** | `Gateway running with 3 platform(s)`, `telegram`/`api_server`/`a2a` connected; live turn **200** — `FIXED-OK`; `Model context warmed: cohere/north-mini-code:free` |

An unauthenticated probe of the same endpoint is correctly rejected
(`401 Invalid gateway API key`), so the API server is not open.

## 5. Two things worth knowing (plus the WhatsApp crash loop, closed)

**WhatsApp was retry-looping every 300 s** (`whatsapp_bridge_exited`, attempt
61 by 14:36, `needs_attention: true`, `retrying_since 02:36`). Root cause was
in `~/.hermes/whatsapp/bridge.log`, not in the model work:

```
🌉 WhatsApp bridge listening on port 3000 (mode: self-chat)
❌ Logged out. Delete session and restart to re-authenticate.
```

The stored session (`whatsapp/session/creds.json`, 2026-06-01) is **logged out
on the phone side**, so every start of the bridge dies with exit 1. Nothing in
`platforms:` asked for it — `WHATSAPP_ENABLED=true` in `~/.hermes/.env` is the
auto-enable flag (`plugins/platforms/whatsapp/gateway_env.py`: *`WHATSAPP_ENABLED=false`
overrides YAML*). Correction applied:

| Step | Detail |
| --- | --- |
| Backup | `.env` → `.env.bak-whatsapp-20261024-144223` |
| Edit | `WHATSAPP_ENABLED=true` → **`false`** (line 431; session directory left intact for a future re-pair) |
| Restart | gateway pid **2598 → 40399**, `Gateway running with 3 platform(s)` (telegram, api_server, a2a) |
| Result | zero `Reconnecting whatsapp` / `Bridge process died` lines after 14:43; the only remaining WhatsApp log lines are the multiplexer notes for the two unpaired profiles (`agent8c`, `maxplus-kimi3`) |

Re-pairing is one command + one QR scan, and stays the operator's call:
`hermes whatsapp` (then set `WHATSAPP_ENABLED=true` again). Deleting the
session is **not** necessary while the flag is false.

One artefact to read correctly: `gateway_state.json` still shows
`whatsapp: retrying` and `homeassistant: retrying`. Both are stamped with a dead
`writer_pid` (2598 / `None`, the latter last touched 2026-05-31), and
`hermes_cli/web_server_gateway.py:_owned_profile_platforms` keeps only entries
whose `(writer_pid, writer_start_time)` match the **live** gateway — so the
dashboard/status views already ignore them. The raw file keeps history across
restarts by design; it is not a live failure.

1. The Telegram DM session has a **persisted `/model` override** —
   `Rehydrated persisted /model override for session=…telegram:dm…:
   model=nvidia/nemotron-3.5-lightning:free provider=openrouter`. That
   model is live (verified with tool calls in §2), so the lane works, and
   it is the user's own choice, so it was not cleared. `gateway.telegram.model`
   was corrected anyway, because the retired ID there would fire for any
   chat without an override.
2. `hermes status` still prints `Telegram ✗ not configured`: that command
   evaluates the **solis** profile, where `platforms.telegram.enabled` is
   `false`. The default-profile gateway is the one that owns the bot. Trust
   `gateway_state.json` / `gateway.log`.

## 6. Still open (not touched)

| # | Item |
| --- | --- |
| 1 | WhatsApp is now **off, not broken**: the stored session is logged out on the phone side and re-pairing needs a QR scan (`hermes whatsapp`). Until then `WHATSAPP_ENABLED=false` keeps the gateway quiet |
| 2 | ~~dashboard `[solis]` pid 1593 runs pre-update code~~ — **relaunched**: pid 1593 replaced by **41157** (`PPID 1`, detached with `setsid`), same arguments (`-p default dashboard --port 9119 --host 127.0.0.1 --open-profile solis --no-open`), `HERMES_DASHBOARD_READY port=9119` and `GET http://127.0.0.1:9119/` → **200**. A first plain `nohup … &` attempt died with the agent shell's process group, which is why the surviving relaunch detaches a session first |
| 3 | ~~Two `providers:` entries carry literal API keys in `key_env`~~ — **retracted**: re-checked every provider block in `config.yaml` and `profiles/solis/config.yaml`, and all 27 `key_env`/`api_key_env` values are environment-variable **names** (`OPENROUTER_API_KEY`, `CUSTOM_PROVIDER_…__KEY`, `OMNIROUTE_API_KEY`, …). No literal key sits in either file |
| 4 | Free-tier capacity is shared: a 429 is always possible. The chain now has two verified-tool-use fallbacks, and `usage` sits at 11/1000 daily requests |

## 7. Rollback

```sh
cd ~/.hermes
cp config.yaml.bak-free-model-20261024-092823 config.yaml
cp profiles/solis/config.yaml.bak-free-model-20261024-092823 profiles/solis/config.yaml
# the 14 swept profiles carry their own config.yaml.bak-free-model-20261024-<time>
hermes -p default gateway restart
```
