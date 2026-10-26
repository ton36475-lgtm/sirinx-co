# System audit — every working system, measured — 2026-10-26 20:20 local

Status: `READ-ONLY / NO MUTATION / 9 SYSTEMS PROBED, 6 HEALTHY, 3 DEGRADED`

Method: repo gates executed as-is, launchd/`lsof`/`ps` for local truth, `curl` against
every planned listener and every tunnel hostname, `tailscale status`, `hermes doctor`.
Nothing was restarted, fixed, deployed, or written outside this report. Where a probe
contradicts an older doc, the probe wins and the doc is listed as drift.

## 1. Verdict table

| # | System | Verdict | One-line evidence |
|---|---|---|---|
| 1 | Repo gates (5-command chain) | **PASS** | fmt/clippy/test/check/control:test all exit 0 |
| 2 | Hermes agent runtime (gateway + dashboard + A2A) | **PASS** | `8642/health` 200 `0.22.5`, `9000` card `mac-mini-m2`, `9119` dashboard 200 |
| 3 | A2A mesh (`:9005` swarm) | **PASS** | `/health` + agent card 200, `SovereignSwarm 0.2.0` |
| 4 | MCP hub (`:8765`) | **PASS (thin)** | `/openapi.json` 200, **7 paths** only |
| 5 | Edge ingress (Cloudflare tunnel, 6 hostnames) | **DEGRADED** | 5/6 answer, `hermes.sirinx.co` = **400 host guard** |
| 6 | Model routing (9router `:20128`) | **BROKEN LANE** | listener up, `/v1/models` never answers (12 s timeout, 3×) |
| 7 | Control plane services (`8790` dev-control-api, `8791` telegram bot) | **NOT RUNNING** | both ports closed; no launchd job |
| 8 | Tailnet mesh (13 peers) | **DEGRADED** | 1 remote peer reachable (lightvela), `omarchy` offline 23 h |
| 9 | Host (disk / memory / mounts) | **WATCH** | disk 88 % (24 Gi free), memory free 30 %, `SIRINXSCR` mounted |

## 2. Repo gates — full chain, executed

| Command | Exit | Detail |
|---|---|---|
| `cargo fmt --all --check` | 0 | clean |
| `cargo clippy --workspace --all-targets -- -D warnings` | 0 | warm build 0.59 s, zero warnings |
| `cargo test --workspace` | 0 | 22 test binaries, **227 passed**, 0 failed |
| `npm run check` | 0 | `RESULT: PASS (0 errors, 13 warnings)`; `PASS config contract: 15 config(s), 40 schema(s) = 15 bound + 25 artifact` |
| `npm run control:test` | 0 | **51 files / 507 tests passed** |

The 13 warnings are inside `verify-pr-mono-001.mjs`'s report, not lint output; they do
not fail the gate. Working tree is clean except the untracked drift inventory from the
previous task (`reports/runtime/config-drift-inventory-20261026.md`).

Heads-up for the plan: `cargo test` only proves 227 assertions across 8 crates — the Rust
side is thin compared with `control:test` (507). A green gate here is not coverage.

## 3. Local services — what actually answers

| Port | Owner | Probe | State |
|---|---|---|---|
| 8642 | Hermes gateway (`0.22.5`, pid 14876) | `/health` 200 | healthy, **`/v1/models` lists 0 models** |
| 9000 | same process | `/` 200, agent card `mac-mini-m2` | healthy |
| 9119 | Hermes dashboard (pid 14857) | `/` 200, `/api/health` `auth_required:false` | healthy, but see §5 |
| 9005 | sovereign-swarm a2a gateway (pid 1511, up 2 d 22 h) | `/health` 200, card `SovereignSwarm 0.2.0` | healthy — **contradicts the 10-21 report that called it closed** |
| 9006 | line-secretary a2a (pid 1531) | listening | up |
| 8765 | `hermes_agents.hub` (pid 1537) | `/openapi.json` 200 | up, **7 endpoints** |
| 8080 | `mlx_lm.server` (pid 1529) | `/v1/models` 200 | up |
| 8100 | python (pid 1525) | listening | up |
| 27017 | mongod (pid 1523) | listening | up |
| 20128 | next-server v16 (pid 2921) | `/` 307, `/v1/models` **timeout** | UI redirects, API lane dead |
| 9222 | Chrome DevTools (pid 470) | listening | up |
| 24224 / 24282 | serena dashboard/tray | listening | up (dev tooling) |

**Planned but closed** (`NETWORK_PORT_MAP.md`): 3000, 5177, 8443, 8710, **8711**,
**8790**, **8791**, 15672, 5672, 3306, 6379. The plan is stale in one place regardless:
the dashboard it calls `8710` has been on **9119** for some time.

### launchd

12 jobs loaded. Running: `ai.hermes.dashboard`, `ai.hermes.gateway`,
`com.sirinx.cloudflared-tunnel`, `com.sirinx.a2a-bridge`, `ai.sirinx.sovereign-swarm`,
`ai.sirinx.line-secretary`, `com.sirinx.desktop-commander-remote`, `com.sirinx.9router`.
Loaded but idle: `com.sirinx.sirinxscr-sync` (0), `ai.hermes.whatsapp-bridge` (0),
`local.sirinx.adb-ensure` (last exit **1**).

**Regression vs 2026-10-21:** `ai.sirinx.a2a-stubs` is gone from `launchctl list`, so
**9001–9004 are closed**. A peer discovering the mesh today sees the card but no stubs.

## 4. Edge ingress — tunnel `omni-route`, 6 rules

| Hostname | Origin | Probe | Verdict |
|---|---|---|---|
| `www.sirinx.co` | Pages | 200 (0.07–0.37 s) | OK — one 8 s miss then three fast 200s: transient cold edge, not an outage |
| `www.sirinx.org` | Pages | 200, canonical `https://www.sirinx.org/` | OK |
| `sirinx.co` | Pages | 301 | OK |
| `a2a.sirinx.co` | `:9000` | 200 | OK |
| `mcp.sirinx.co` | `:8765` | 200 | OK — **unauthenticated** `/openapi.json` (C9 still open) |
| `omni-route.sirinx.co` | `:20128` | 307 → `…/login` 200 after 2 hops | OK at the edge, origin API lane dead (§6) |
| `gateway.sirinx.co` | `:8642` | `/` 404, `/health` 200, `/v1/models` **401** | OK by design; docs that claim 200 at `/` are wrong |
| `hermes.sirinx.co` | `:9119` | **400** | broken, see §5 |

## 5. `hermes.sirinx.co` 400 — root cause found

Body: `{"detail":"Invalid Host header. Dashboard requests must use the bound hostname or the configured public hostname."}`

Reproduced locally: `curl 127.0.0.1:9119/` → **200**; the same request with
`-H 'Host: hermes.sirinx.co'` → **400**. So the dashboard's Host allowlist does not
contain the hostname the tunnel routes to it. The origin is healthy; the pair is
misconfigured. Fix is one allowlist entry (needs approval since it touches the running
dashboard config), not a redeploy.

## 6. 9router `:20128`

The process is alive (`next-server v16.3.4`, 2 d 23 h) and the UI answers (`/` 307 →
`/login`). The OpenAI-compatible path does **not**: three probes of `/v1/models` returned
no response inside 12 s. Anything that resolves providers through this lane (the
`opencode-ai` family in `providers.json`, several aliases in `config.yaml`) is therefore
hanging, not failing fast. Related finding from the config audit: `model_aliases.deepseek-free`
points at provider `opencode-zen`, which does not exist.

## 7. Tailnet

13 peers, **1 usable remote node**:

| Peer | State |
|---|---|
| `vm-2-126-ubuntu` (100.72.202.12) | active, relay `sin`, tx 39 MB / rx 9.8 MB — the only working worker |
| `omarchy` (100.87.189.34) | **offline 23 h** (was online 10-23) |
| `s22-ultra` | listed "active" but `offline, tx 14508 rx 0` — contradictory state, treat as offline |
| `aiagent` | offline 9 d, OS now reports `windows` |
| `iphone-12`, `redmi-13c`, `sirinx-sandbox`, `cue×2`, `manus-aiyara`, `tailscale-b336462f` | offline 4 h – 20 d |

No direct paths: everything live is DERP-relayed through `sin`. Approval nodes (all four
phones) are offline, so mobile approval is impossible right now.

## 8. Host

- Disk: `/System/Volumes/Data` **88 % used, 24 Gi free** of 228 Gi.
- Memory: 8 GiB total, **30 % free**, load 2.52/2.47/2.31 after 2 d 23 h uptime.
- `/Volumes/SIRINXSCR` **is mounted** now (exfat, `fskit`). MASTER_PLAN item C12/F
  ("wedge since 2026-10-16, needs re-plug") is unblocked in reality; the plan still
  describes it as blocked.
- `hermes doctor`: **11 issues**, unchanged from the config audit — dead IPv6 route
  (every IPv6-first connect stalls, likely what caused the one 8 s edge miss),
  `GLM_API_KEY` absent, 3 legacy `custom_providers` entries, `session_reset.mode: idle`
  ignored, 5 npm advisories. 18 profiles, of which `antigravity2`, `sirinx-research`,
  `webmcp` report **missing config**.

## 9. Deployed artifacts

`apps/public-web/dist/public` and `dist-org` are dated **2026-10-21 05:23**, and the live
`www.sirinx.org` canonical matches that build. Nothing in the repo since then changes the
site, so this is matching, not stale — but whoever ships next must rebuild both variants
(`npm run web:build:dual`), not one.

## 10. Blockers, ordered by what actually stops work

| # | Blocker | Type | Needs |
|---|---|---|---|
| B1 | `hermes.sirinx.co` 400 — dashboard Host allowlist lacks the public hostname | local config edit | approval (touches running dashboard) |
| B2 | 9router `/v1/*` hangs → provider lane unusable | local service | restart/inspect 9router, or stop routing through it |
| B3 | `a2a-stubs` job gone → 9001–9004 closed | launchd | recreate the job (needs its script path) |
| B4 | `dev-control-api` :8790 and telegram bot :8791 not running | not deployed | decide run-or-remove; token gates already coded |
| B5 | `mcp.sirinx.co/openapi.json` unauthenticated | edge policy | Cloudflare Access rule (C9) |
| B6 | Only 1 of 12 remote peers online; no direct paths | network/owner | bring `omarchy` back, or accept DERP |
| B7 | Disk 88 % — bulk jobs (iCloud staging, exports) will fail | host | offload now that `SIRINXSCR` is mounted |
| B8 | `force_ipv4` unset | config | one key in `config.yaml` |

## 11. Not verified

- LightVela VM functional state (no SSH credential path; nothing new attempted here).
- Whether `:8100`, `:24224/24282`, `:9222`, `:27017` are *needed* — they respond, but no
  doc in the repo claims them, so "unexpected listener" is unproven either way.
- Site behaviour in a browser (no visual pass requested); edge probes are HTTP only.
- Any deploy, restart, or config write — this audit changed nothing.
