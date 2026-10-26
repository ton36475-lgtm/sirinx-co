# A2A stubs / dashboard ingress / 9router lane — repair receipt — 2026-10-26

Status: `3 OF 3 DONE / 1 KNOWN LATENCY / NOTHING PUSHED`

Three repairs the owner asked for, each with the probe that proves it. Every change is
local (launchd, `~/.hermes`); no cloud, no deploy, no push.

## 1. A2A stubs are back on 9001–9004

The 2026-10-22 disable was correct at the time: the plist ran
`~/project-hermes/a2a_server/agent_stubs.py` and that tree no longer exists. A bounded
search across `~/SIRINXDev`, `~/sirinx-os`, `~/hermes`, `~/sirinx-sovereign-swarm`,
`~/project-hermes` found no copy, so **this is a replacement, not a restoration**.

Added:

| File | Purpose |
|---|---|
| `services/a2a-stubs/server.mjs` | zero-dep Node ESM, one server per port, `A2A_STUB_PORTS=9001,9002,9003,9004` |
| `services/a2a-stubs/server.test.mjs` | 3 tests: cards/health on every port, `message/send` returns a completed stub task, unknown method rejected |
| `infra/macmini/launchd/ai.sirinx.a2a-stubs.plist` | launchd job, logs to `~/Library/Logs/sirinx/` |

Every response carries `"stub": true` and `"reconstructed": true`, and the task artifact
text says "no work performed" — a peer cannot mistake a stub for a worker.

Evidence:

```
launchctl list            → 17963  0  ai.sirinx.a2a-stubs
lsof 9001-9004            → node 17963 listening on all four
/health                   → 200 ×4
/agent-card.json          → stub-research / stub-build / stub-review / stub-qa
kill 17890 → new pid 17963 → 9001 and 9004 still 200   (KeepAlive verified, ThrottleInterval 10)
```

The old `ai.sirinx.a2a-stubs.plist.disabled-20261022` is left in place as provenance.

## 2. `hermes.sirinx.co` no longer answers 400

Root cause was never the tunnel: the dashboard binds `127.0.0.1:9119`, and its Host guard
accepts only the bound host plus whatever `dashboard.public_url` declares. Nothing
declared it, so the proxied `Host: hermes.sirinx.co` was rejected.

Setting `public_url` alone would have broken the dashboard: a non-loopback public hostname
**engages the auth gate**, and the gate fails closed with no registered auth provider.
So auth was configured in the same change, with the owner's chosen password:

| Key (`config.yaml`) | Value |
|---|---|
| `dashboard.public_url` | `https://hermes.sirinx.co` |
| `dashboard.basic_auth.username` | `admin` |
| `dashboard.basic_auth.password_hash` | scrypt hash (plaintext never stored) |
| `dashboard.basic_auth.secret` | 43-char urlsafe token, so sessions survive restarts |

Evidence:

```
local /                        → 302  →  /login?next=%2F      (was 400)
local with Host: hermes.sirinx.co → 302  →  /login            (was 400)
https://hermes.sirinx.co/      → 302  →  /login               (was 400)
/login                          → 200
/api/health                     → auth_required: true
/api/config (no session)        → 401
POST /auth/password-login       → 200 {"ok":true,"next":"/"} + cookie
/api/config (with session)      → 200
POST with wrong password        → 401
```

## 3. 9router — "/v1/models hangs" was two separate faults

**Fault A — the provider lane really was dead.** Hermes routes
`omniroute-free-bridge-250-providers-90-free` to `http://127.0.0.1:20128/v1` with
`key_env: CUSTOM_PROVIDER_OMNIROUTE_FREE_BRIDGE__250_PROVIDERS__90__FREE__KEY`. That
variable was present but **empty (len 0)**, while 9router requires a bearer key
(`401 Missing API key`). 9router's only active key is `hermes-bridge` (35 chars, created
2026-07-26). Fixed by writing that key into the variable:

- backup `~/.hermes/.env.bak-20261026-9router-key` (mode 600, key never printed)
- after write: `value_matches_db_key: True`, `key_env resolves non-empty: len 35`
- gateway restarted at 21:09:55 (after the 21:07:40 edit), `/health` 200, 3 platforms,
  19 profiles on cron; `hermes gateway status` → running, PID 19770

**Fault B — `/v1/models` is slow, not hung.** First probe with a 6 s timeout returned
nothing, which is why it looked dead. With a 75 s allowance it answered in **13.25 s**;
warm runs are **6.9–9.0 s**. It returns **253 models**. `HEAD`, `OPTIONS`, and an
`Accept: text/event-stream` request all behave the same, and a `sample` of the process
during a request shows libuv work inside `getaddrinfo` (per-request provider catalog
work, no cached answer). The route lives in 9router's compiled Next bundle — patching it
means patching `node_modules`, so it was not touched.

Consequence to respect: **any client calling `/v1/models` with a 5–6 s timeout will keep
reporting a hang.** Use ≥ 15 s, or skip the model list and call known model ids.

With the key restored, the lane answers end to end: a `POST /v1/chat/completions` for
`gh/gpt-5.4-mini-free-auto` returned a **provider-level** `400 model_not_supported`
wrapped as 503 in 2.76 s — i.e. auth and proxying work; that particular model id is gone.

## 4. Repo state

- `npm run a2a-stubs:test` → 3/3 pass
- `npm run check` → exit 0 (`PASS config contract: 15 config(s), 40 schema(s)`), and the
  chain now also runs `node --check services/a2a-stubs/server.mjs`
- new repo files are **uncommitted**: `services/a2a-stubs/{server,server.test}.mjs`,
  `infra/macmini/launchd/ai.sirinx.a2a-stubs.plist`, `package.json` (script + check line),
  this report

## 5. Open, not fixed here

- `/v1/models` 6.9–13.3 s latency (third-party code; mitigate in clients).
- `model_aliases.deepseek-free` still points at provider `opencode-zen`, which does not
  exist (found in the 2026-10-26 config inventory) — unrelated to this repair, still live.
- `a2a.sirinx.co` card advertises the Hermes agent, but the stubs are not registered in
  any registry: a peer sees 4 stub cards on 9001–9004 only if it knows those ports.
- Adding `dashboard.public_url` engages the auth gate permanently: anyone who reaches
  `hermes.sirinx.co` must log in, and the password now lives with the owner, not in the repo.
