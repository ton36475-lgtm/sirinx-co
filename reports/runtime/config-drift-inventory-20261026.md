# Config drift outside the repo — read-only inventory (2026-10-26)

Status: `INVENTORY / READ-ONLY / 0 CHANGES MADE`

Scope: the configuration that lives **outside** this repository and drives the
Mac mini — `~/.hermes/**` (root + 15 profiles) and the host-facing half of
`infra/`. Nothing here was edited, migrated, restarted or repaired; no `.env`,
`auth.json` or key material was read. Every row is a command's output.

Method: `hermes status --full`, `hermes doctor`, `hermes pm status`,
`launchctl list`, `lsof -iTCP`, `curl` (loopback + public), `stat`, and a
read-only parse of the YAML/JSON with `js-yaml` that prints names, URLs and key
**variable** names only.

## 1. What the surface actually is

| File | mtime | Role | Drift |
| --- | --- | --- | --- |
| `~/.hermes/config.yaml` | 2026-10-24 | live root config (dedicated keys, 12 providers + 2 custom) | `platforms.telegram.enabled: true` while `hermes status` reports Telegram **not configured** |
| `~/.hermes/providers.json` | **2026-09-12** | legacy provider mirror, 15 entries | stale by 6 weeks; 2 duplicate `base_url` pairs (below) |
| `~/.hermes/mcp-configs/mcp-servers.json` | **2026-09-01** | 35 MCP servers under `mcpServers` | disjoint from the 7 servers in `config.yaml:mcp_servers`; 8 weeks stale |
| `~/.hermes/profiles/*/config.yaml` | — | **15 profile configs, 71 provider entries** | 8 legacy `custom_providers` entries live in `solis` only |
| `~/.hermes/{mcp.json,mcp_settings.json}` | — | absent | MCP config exists only in `mcp-configs/mcp-servers.json`; the `mcp.json`/`mcp_settings.json` pair seen on this host belongs to `~/.cline`, a different tool |
| `~/.hermes/profiles/*/state-snapshots/` | 2026-10-24 | 18 snapshot dirs, 15 extra `config.yaml` copies | unbounded copies of the same config |
| `~/.hermes/*.bak*` | — | **38 backup files** at the root | superseded by the date-stamped naming elsewhere |

`~/.hermes` is **16 GB** in total.

## 2. Provider registries disagree with each other

Three sources describe providers; they are not derived from one another.

| Source | Entries | Duplicate `base_url` inside it |
| --- | --- | --- |
| `config.yaml:providers` + `custom_providers` | 12 + 2 | `https://api.maxplus-ai.cc/chinese-model-specials/v1` → `maxplus-codex` **and** `custom_providers[1]` |
| `providers.json` | 15 | `http://127.0.0.1:20128/v1` → `OmniRoute Free Bridge…` + `omniroute-free`; `https://api.maxplus-ai.cc/deepseek/v1` → `MaxPlus Chinese Models` + `maxplus-chinese` |
| 15 profile configs | 71 | expected fan-out: `openrouter.ai`, `aihubmix.com`, `cointh.com`… repeated once per profile; `solis` additionally repeats `127.0.0.1:20128/v1` twice and `glm-officials`/`maxplus-codex` share one host |

Concrete defects, not just duplication:

- `custom_providers[0]` in the root config is `bonsai2-uncensored` with
  `base_url: http://PENDING_MODAL_URL/v1` — a placeholder that can never resolve.
- `model_aliases.deepseek-free` → provider `opencode-zen`, which is defined
  nowhere (`providers` has `opencode-ai`; no `opencode-zen` key exists).
- `providers.json` is a stale mirror of the same vendors with different paths
  (`/deepseek/v1` vs `/chinese-model-specials/v1`), so a reader cannot tell
  which endpoint is live.

## 3. What `hermes doctor` reports (11 issues, verbatim categories)

1. Dead IPv6 route — every IPv6-first connection stalls before IPv4 answers.
2. `GLM_API_KEY` missing in `.env`.
3. Missing API keys overall (`hermes setup`).
4–6. `custom_providers` entries **`cointh`, `maxplus`, `zai-glm-coding-plan`**
   still in the v12 list form; the migration "ran once and does not re-fire", so
   they never move into `providers.<key>.api`. All eight legacy entries sit in
   `~/.hermes/profiles/solis/config.yaml`.
7. `session_reset.mode: idle` no longer applied (needs `hermes-session-reset-policy`).
8–11. Four npm advisories (root, web workspace ×1, ui-tui ×2, WhatsApp bridge ×1).

## 4. MCP: two registries, disjoint

| Registry | Servers |
| --- | --- |
| `config.yaml:mcp_servers` | 7 — `comfy-cloud, figma, linear, unreal-engine, qwen-mm-plugins-core, manus-mcp, rea` |
| `mcp-configs/mcp-servers.json` | 35 — `nexus, ito-compute, jira, github, firecrawl, supabase, ecc-memory-vault, memory, omega-memory, longhand, sequential-thinking, vercel, railway, cloudflare-docs, cloudflare-workers-builds, cloudflare-workers-bindings, cloudflare-observability, clickhouse, exa-web-search, parallel-search, context7, codescene, magic, memxus, filesystem, playwright, fal-ai, browserbase, browser-use, devfleet, token-optimizer, laraplugins, confluence, evalview, squish` |

Overlap: **none**. One of them is dead on arrival: `devfleet` →
`http://localhost:18801/mcp`, and `nc 127.0.0.1 18801` is **closed**.

## 5. Runtime vs config (what is actually up)

| Check | Result |
| --- | --- |
| `api_server` (config: 127.0.0.1:8642) | **listening**, `/health` → 200, `/` → 404 |
| a2a `:9000` | `/health` → 200 |
| MCP hub `:8765` | `/openapi.json` → 200 |
| mlx-local `:8080` | `/v1/models` → 200 (process `mlx_lm.server --model mlx-community/Qwen3-4B-4bit`) |
| launchd (11 jobs with hermes/sirinx/cloudflared names) | every `ProgramArguments[0]` **exists**; `ai.hermes.gateway` pid 14869 (last exit 75), `ai.hermes.dashboard` pid 14857 (last exit −15), `com.sirinx.9router` pid 2705 |
| public ingress | `a2a.sirinx.co/health` **200**, `mcp.sirinx.co/openapi.json` **200**, `omni-route.sirinx.co` **307**, `gateway.sirinx.co` **404**, `hermes.sirinx.co` **400** |

That last row contradicts the repo: `MASTER_PLAN` line 140 and C10 still say
`hermes.sirinx.co` is **502** and describe `gateway.sirinx.co` as either 200 or
502 depending on the line. Both hostnames now reach a real origin.

## 6. `infra/` drift (host-facing half)

| File | Line | Problem |
| --- | --- | --- |
| `infra/lightvela/hermes_reconfig_lightvela.sh` | 40, 53 | hub `http://100.90.189.112:9005` — **:9005 is closed**; the live A2A listener is `:9000` |
| `infra/omarchy/omarchy_bootstrap.sh` | 82, 87 | same dead `:9005` hub, and it waits for an HMAC enrolment that has no listener |
| `infra/lightvela/dsh_setup.sh` | 30–31 | publishes `http://100.72.202.12:3080` — **3080 closed** on the VM |
| `~/.ssh/config` (not repo, same estate) | — | `hermes-tailscale` → `hermes.solis-net.ts.net`, but the tailnet is `tail73d7f2.ts.net`; `oracle-thclaws` still holds `<ORACLE_PUBLIC_IP>` |

Tailnet peers referenced by `infra/`: `100.90.189.112` ×11 (this Mac, online),
`100.87.189.34` ×8 (`omarchy`, **offline 13 h**), `100.72.202.12` ×3 (VM, online),
`100.121.170.83` ×1 (`redmi-13c`, offline).

## 7. What is *not* drift

- Root `config.yaml` has no duplicate provider keys and parses clean under
  `js-yaml` (no duplicate-mapping errors).
- `mlx-local` having no `key_env` is correct — it is the local server.
- Profile-level duplication of the common providers is the designed fan-out, not
  a defect; only `solis` carries the legacy list form that doctor flags.
- All 11 launchd program paths resolve; no service points at a deleted binary.

## 8. Decisions this inventory raises (nothing done about them here)

| # | Decision | Why it cannot be automated read-only |
| --- | --- | --- |
| D1 | Retire `providers.json` or regenerate it from `config.yaml` | one of the two must become the single registry; either choice rewrites provider data |
| D2 | Merge `config.yaml:mcp_servers` (7) into `mcp-configs/mcp-servers.json` (35) or the reverse | changes which tools the agent can call |
| D3 | Migrate the 8 `solis` `custom_providers` into `providers` | writes provider config that the running gateway re-reads |
| D4 | Fix or delete `bonsai2-uncensored` (`PENDING_MODAL_URL`) | needs the real Modal URL (same blocker as the B2 gate) |
| D5 | Fix alias `deepseek-free` → a real provider, or drop it | provider choice is the owner's |
| D6 | Drop `devfleet` MCP or start its server on 18801 | either changes tool surface |
| D7 | Repoint `infra/*` from `:9005` to `:9000`, and delete the `3080` line | the VM-side contract of the Omarchy/LightVela scripts |
| D8 | Update `MASTER_PLAN` line 140 / C10 with the measured 404/400/200 codes | a plan edit that should ride with the next commit, not this read-only pass |
| D9 | Decide whether `platforms.telegram.enabled: true` stays while the platform is unconfigured | cosmetic until a token exists, misleading either way |
| D10 | Prune 38 `.bak` files + 15 snapshot config copies under a 16 GB home | deletion needs the offload decision (C13) first |
