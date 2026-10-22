# Hermes agent + A2A node — repair pass (2026-10-22)

Status: `REPAIRED_LOCAL / A2A_NODE_BACK / ZERO_CLOUD_MUTATION / ZERO_PUSH`

Scope: bring the Hermes agent back — its interrupted source update and the dead
A2A node — and re-measure the state the plan quotes. Follows
`hermes-mesh-status-20261021.md`, `cf-tunnel-hermes-mcp-20261021.md`, and
`hermes-two-node-check-20261021.md`. Every number below was produced on this
host in this session; nothing is copied forward from an earlier report.

The user's decision for the A2A question (asked before acting) was: **enable
Hermes' own A2A platform on :9000 with a bearer token**, and keep the pass to
what is verifiable locally.

## 1. What was actually broken

| # | Symptom | Measured evidence |
| --- | --- | --- |
| 1 | `ai.sirinx.a2a-server` + `ai.sirinx.a2a-stubs` crash-looping | `launchctl list` → both labels `-` (no PID), last exit **78**; `~/project-hermes/` holds only `data/`; `a2a_server/server.py`, `agent_stubs.py`, and the `.venv` the plists point at are all gone |
| 2 | `a2a.sirinx.co` 502 / zero-agent card | `curl -o /dev/null -w '%{http_code}'` → **502**; no listener on :9000 |
| 3 | Hermes source update unfinished | `hermes status` printed `a source update could not be finished automatically (6 attempts); run 'hermes update' from a shell to finish it`; `~/.hermes/installs/7cc908599bf1352a/source-completion-pending` armed, `source-completion-attempts` = **6**; install stamp pinned **cc75e8f** (0.21.5) while HEAD was **1744a19** (0.21.6) |
| 4 | `hermes.sirinx.co` 502 | no origin on :9119 — unchanged, still an operator item (C10) |
| 5 | `hermes pm doctor` tool-store drift | `✗ node: realized bytes do not match recorded digest`, `✗ python: …` |

## 2. Repair 1 — the interrupted source-update tail

Root cause, reproduced by hand: the tail's node-dependency step runs
`scripts/build/node-deps.mjs` → `npm ci` → the root `prepare` script →
`lefthook install`, and lefthook refuses because this host has a **global**
`core.hooksPath` (`/Users/sirinx/.codex/git-hooks`):

```
npm error command sh -c node -e "...spawnSync('lefthook',['install']...)"
│  core.hooksPath is set globally to '/Users/sirinx/.codex/git-hooks'
│  Custom hooks paths are not supported by default.
```

Every retry hit the same wall, which is why the tail stopped self-starting
after 6 attempts. The checkout itself was never damaged: `git status` clean,
HEAD `1744a19e0df568c647e4f3ff9c37f2a284a282fb`.

Fix applied (all local, all reversible):

1. Ran the tail with the global git config hidden **for the child only** —
   `GIT_CONFIG_GLOBAL=/dev/null` — so `npm ci`'s `lefthook install` sees the
   default hooks dir. `npm ci` → **added 555 packages, rc 0**.
2. Re-ran the tail: `python -I -B -u hermes_cli/source_completion.py
   --source ~/.hermes/hermes-agent --finish-update` → **rc 0**, no `⚠`
   follow-up failures, skills/config sync clean.
3. Cleared the stale completion bookkeeping (`source-completion-pending`,
   `source-completion-attempts`), which is exactly what the success path
   (`clear_completion`) does; the stamp now matches HEAD so nothing is owed.

Evidence after: `install-stamp.json` → commit `1744a19e0df5…`, displayVersion
`0.21.6+199.g1744a19`, `dirty: false`, `builtAt 2026-10-22T06:57:44Z`;
`hermes status` no longer prints the update warning; `hermes --version` →
`Hermes Agent v0.21.6+199.g1744a19 (2026.9.24)`.

The `~/.codex/git-hooks` directory was checked after each attempt: it still
holds only its original `pre-commit`/`pre-push` (mtime Aug 1). The hermes
checkout's own `.git/hooks/pre-commit` is the lefthook hook.

## 3. Repair 2 — the A2A node

The deleted `~/project-hermes/a2a_server` cannot be restored from bytes on this
machine (searched `~/project-hermes`, `~/hermes`, `~/SIRINXDev`, `~/sirinx-os`,
`~/sirinx-co`, `~/OpenManus`, `~/Downloads`, `~/Documents`, `~/Desktop`, depth 6;
the only hits are three unrelated `a2a_server/` *fragments* under
`~/Documents/Codex/2026-09-06/…` that contain a commander-query and a
catalog-preview module, no `server.py`). Hermes ships its own A2A platform
(`plugins/platforms/a2a/`: agent card + JSON-RPC, bearer/peer tokens,
localhost-only unless a token is set), so the node is served by Hermes itself
instead of by a re-typed copy of the lost tree.

| Step | Detail |
| --- | --- |
| Env (in `~/.hermes/.env`, values never printed) | `A2A_PORT=9000`, `A2A_AGENT_NAME=mac-mini-m2`, `A2A_PUBLIC_URL=https://a2a.sirinx.co/`, `A2A_BEARER_TOKEN=<64 hex, generated on this host>`; `.env` backed up first to `.env.bak-20261022-hermes-a2a` |
| Dead jobs retired | `launchctl bootout gui/$UID/ai.sirinx.a2a-server` and `…a2a-stubs`; plists renamed `*.plist.disabled-20261022` (content preserved for rollback) |
| Gateway restart | `launchctl kickstart -k gui/$UID/ai.hermes.gateway`; new multiplexer pid **12507** |

Serving evidence (gateway log):

```
A2A: serving Agent Card + JSON-RPC on http://127.0.0.1:9000
     (REMOTE (bearer auth)) as 'mac-mini-m2'; 1 routed agent(s)
```

Bind is loopback-only, and the tunnel (`omni-route`, origin `127.0.0.1:9000`)
is the sole remote ingress — so the node is reachable without a new listener
being exposed on the tailnet.

## 4. Post-repair measurements

| Probe | Result |
| --- | --- |
| `GET http://127.0.0.1:9000/.well-known/agent-card.json` (no auth) | **200** — card `name: mac-mini-m2`, `url: https://a2a.sirinx.co/`, version 1.0.0, skills include `toolset.a2a`, `toolset.browser`, … (the old server answered `agents: []`) |
| `POST http://127.0.0.1:9000/` JSON-RPC, no auth | **401** |
| Same card with the bearer token | **200** |
| `https://a2a.sirinx.co/.well-known/agent-card.json` | **200** — same card as the loopback probe |
| `https://a2a.sirinx.co/` JSON-RPC, no auth | **401** |
| `https://gateway.sirinx.co/health` | **200** (`{"status":"ok","platform":"hermes-agent","version":"0.21.6"}`) — was 502 in A44 |
| `https://mcp.sirinx.co/health` | **401** (hub up, bearer required) |
| `https://mcp.sirinx.co/openapi.json`, `/docs` | **200 / 200** — still unauthenticated (C9 open) |
| `https://hermes.sirinx.co/` | **502** — no origin on :9119 (C10 open) |
| `https://omni-route.sirinx.co/` | **307** |
| listeners | `127.0.0.1:9000` (A2A), `127.0.0.1:8642` (gateway), `127.0.0.1:8765` (MCP hub), `127.0.0.1:8100` (bluezy), `127.0.0.1:20128` (9router), `100.90.189.112:9005` (`sirinx-sovereign-swarm`, still `live: false`) |
| tailnet | self `macminisirinx 100.90.189.112`; `vm-2-126-ubuntu` idle/online via DERP; `aiagent`, `cue-*`, `sirinx-sandbox`, three phones/tailscale-* nodes **offline** (5 d–16 d) |
| disk | **12,847,120 KiB** free on `/System/Volumes/Data` (12.25 GiB) — still under the 15 GiB floor |
| USB target | `/dev/disk6s2` → `/Volumes/SIRINXSCR`, 112 GiB size, **107 GiB avail**, `touch` + `rm` succeeded — the drive answers and is writable again (C12) |

## 5. Repo verification (same session)

| Command | Result |
| --- | --- |
| `npm run check` | exit 0 — `RESULT: PASS (0 errors, 13 warnings)` |
| `npm run control:test` | exit 0 — 51 files, **507 tests passed** |

## 6. Still broken / still operator-owned

| # | Item | Why a local edit cannot close it |
| --- | --- | --- |
| 1 | `hermes.sirinx.co` 502 | no origin on :9119; run or delete the ingress row (C10) |
| 2 | `mcp.sirinx.co` `/docs` + `/openapi.json` public | Cloudflare Access scope or origin restriction (C9) |
| 3 | LightVela Hermes | no credential path to `vm-2-126-ubuntu` (C14); node stays `UNVERIFIED` |
| 4 | `sirinx-sovereign-swarm` `live: false` on :9005 | needs its own admission/heartbeat work, not this pass |
| 5 | Workload floor | 12.25 GiB free vs 15 GiB floor / 20 GiB full chain (C13) |
| 6 | `hermes pm doctor`: `node` + `python` store digests | node store carries an extra global `@wakaru/cli`, python store has runtime `__pycache__` written into it; re-realizing would delete the wakaru install — operator call (C16) |
| 7 | Global `core.hooksPath` breaks `hermes` `npm ci` | needs either a codex-hooks decision or the env workaround on every future `hermes update` (C17) |
| 8 | Telegram/WhatsApp reconnect loop in `gateway.log` | WhatsApp bridge retries every 300 s since before this pass; not repaired here, recorded only |

## 7. What this pass did not do

No Cloudflare, DNS, tunnel, Access, Worker, or Pages mutation. No deploy, no
push, no PR. No model/provider call and no A2A task enqueued (only card reads
and one unauthenticated JSON-RPC probe that was rejected with 401). No secret
value was printed or committed; the token exists only in `~/.hermes/.env`
(never in the repo). No file under `~/project-hermes` was recreated, and no
process of the former A2A server was killed — it was not running.

## 8. Rollback

| Repair | Undo |
| --- | --- |
| A2A node | remove the four `A2A_*` keys (or restore `.env.bak-20261022-hermes-a2a`), `launchctl kickstart -k gui/$UID/ai.hermes.gateway` |
| Retirement of the old jobs | `mv ai.sirinx.a2a-server.plist.disabled-20261022 ai.sirinx.a2a-server.plist` (same for stubs) then `launchctl bootstrap gui/$UID <plist>` — only meaningful if the deleted server source is ever recovered |
| Source-update tail | none needed: the checkout was already clean and the stamp now names the same HEAD it did before (`dirty: false`) |
