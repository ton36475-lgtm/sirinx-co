# Cloudflare tunnel plane — Hermes MCP + A2A ingress check (2026-10-21)

Status: `MEASURED / READ_ONLY / NO_CLOUDFLARE_MUTATION`

Scope: continue the two-node Hermes check (`hermes-two-node-check-20261021.md`)
over the **Cloudflare tunnel plane** instead of the tailnet, because the Mac
Hermes/MCP services bind `127.0.0.1` only and therefore have no tailnet path.
Every command below is a bounded read-only probe (`curl`, `lsof`, `ps`,
`cloudflared tunnel info`). No token was read, no MCP tool was called, no A2A
task was enqueued, polled, or acked, and no tunnel/DNS/Access/Worker resource
was created, changed, or deleted.

## 1. Tunnel that actually serves the public names

| Fact | Measured value |
| --- | --- |
| Tunnel | `omni-route`, id `b9ef168c-e8bc-4497-84e8-7ab81c556ca3`, created 2026-07-25 |
| Config | `~/.cloudflared/omni-route.yml` (0600) |
| Supervisor | launchd `com.sirinx.cloudflared-tunnel` → `/opt/homebrew/bin/cloudflared tunnel --config …/omni-route.yml run` |
| Process | pid 7429, elapsed 3 d 23 h |
| Connector | `3e6581b3-a909-4c56-bd97-53d2052c52d6`, arch `darwin_arm64`, version 2026.9.3, edge `1xbkk07, 1xbkk09, 1xsin12, 1xsin15`, origin IP 27.130.173.101 |
| Binary | `cloudflared 2026.8.2` (outdated; CLI warns 2026.10.2 is current) |
| Second tunnel | pid 93132 — quick tunnel `127.0.0.1:20128`, unrelated ephemeral name |

The repo file `infra/cloudflare/dev-router/tunnel.yml` describes a **different**
tunnel (`sirinx-hybrid-tunnel`, `98b951b0…`, `dev.sirinx.co`) and is not the
config in use. That is documentation drift, not a live defect: nothing in the
repo starts the running tunnel.

## 2. Ingress × origin × edge, measured

Origin state from `lsof -nP -iTCP:<port> -sTCP:LISTEN`; edge state from
`https://<host><path>` with an 8 s timeout.

| Hostname | Origin | Origin state | Edge result |
| --- | --- | --- | --- |
| `omni-route.sirinx.co` | `127.0.0.1:20128` | listening | 302 `/dashboard`, HTML app answering |
| `hermes.sirinx.co` | `127.0.0.1:9119` | **nothing listening** | **502** on `/health`, `/`, `/.well-known/agent-card.json`, `/mcp` |
| `a2a.sirinx.co` | `127.0.0.1:9000` | listening (pid 4402) | `/health` **200**, `/.well-known/agent-card.json` **200** |
| `gateway.sirinx.co` | `127.0.0.1:8642` | **nothing listening** | **502** on all probed paths |
| `mcp.sirinx.co` | `127.0.0.1:8765` | listening (pid 4399) | 401 `{"error":"unauthorized"}` on every functional route |

So three of the five declared hostnames are usable, and two — `hermes.sirinx.co`
and `gateway.sirinx.co` — answer 502 because their declared origins do not run.
The tunnel is healthy; the ingress declares origins that are absent. This is the
same class of drift as A40's `:9005` finding: a config file asserting a service
that is not there.

## 3. `mcp.sirinx.co` — the Hermes MCP hub

| Fact | Value |
| --- | --- |
| Process | pid 4399 `python -m hermes_agents.hub --config /Users/sirinx/hermes/hermes-mcp/config/mcp-hub.toml`, up 4 d 08 h |
| CWD | `/Users/sirinx/hermes/hermes-mcp` |
| Server | uvicorn, `openapi 3.1.0`, `hermes-mcp-hub 2.0.5` |
| Declared routes | `GET /health`, `GET,POST /mcp`, `POST /mcp/call`, `POST /a2a/enqueue`, `POST /a2a/poll`, `POST /a2a/ack`, `GET /a2a/status` |
| Auth env present | `MCP_HUB_TOKEN` (and other provider keys) — **name only, value never read** |

Unauthenticated probes:

| Path | Result |
| --- | --- |
| `GET /health` | 401 `{"error":"unauthorized"}` |
| `GET,POST /mcp` | 401 |
| `POST /mcp/call` `{}` | 401 |
| `GET /a2a/status` | 401 |
| `POST /a2a/enqueue` `{}` | 401 |
| `POST /a2a/poll` `{}` | 401 |
| `POST /a2a/ack` `{}` | 401 |
| `GET /openapi.json` | **200, full schema** |
| `GET /docs` | **200, Swagger UI** |

Positive: every route that can read queue state or cause an effect is
fail-closed with the hub's own bearer check, including `/health`, so an
unauthenticated caller cannot even confirm liveness beyond the 401.

Negative F1 (medium): `/openapi.json` and `/docs` bypass that middleware, so
anyone on the public internet can enumerate the hub's complete surface, version,
and request shapes. F2 (medium): the `omni-route.yml` comment states
`mcp.sirinx.co` is "guarded by Cloudflare Access (email OTP) then bluezy-hub own
auth (401)"; from outside, no Access challenge was observed on any probed path
(no redirect to `*.cloudflareaccess.com`, server header `cloudflare`, body is the
origin's own JSON). Either the Access application no longer covers these paths
or it was removed. This cannot be settled from the edge alone — checking it needs
an authenticated Cloudflare API read, which is a `cloudflare_dns`-gated action
and was not performed. Recorded as the measured behavior, not as a verdict on
the dashboard state.

## 4. `a2a.sirinx.co` — live process, deleted source

| Fact | Value |
| --- | --- |
| Process | pid 4402 `python /Users/sirinx/project-hermes/a2a_server/server.py --port 9000`, up 4 d 08 h |
| Source on disk | **absent** — `~/project-hermes/` now contains only `data/`; `a2a_server/` is gone |
| Logs still open | `~/project-hermes/data/a2a_server.launchd.{log,err.log}` |
| `GET /health` | 200 `{"ok":true,"service":"a2a-server","tasks":332}` |
| `GET /.well-known/agent-card.json` | 200, `"agents": []`, `streaming:false`, `pushNotifications:false`, description "consolidates all agent cards" |
| `POST /` JSON-RPC `message/send` | 404 `{"error":"not found"}` |

F3 (high for maintainability): this is a zombie service. The process keeps
running from memory, but its source tree no longer exists, so it cannot be
restarted, reviewed, patched, or reproduced. If it dies the endpoint is gone with
no checkout to restart it from.

F4 (medium): the consolidated agent card advertises **zero agents** while
reporting 332 tasks, so a peer that discovered the mesh through this URL sees an
empty catalog. Whatever registry the card reads was deleted with the source tree.

F5 (low): the card and health endpoint are unauthenticated. They expose task
counts and topology to the public internet; neither is an effect surface, but
neither is intended to be public either.

## 5. What this settles about the tailnet route

- The MCP hub and the A2A server bind `127.0.0.1` only. Tailscale peers
  (LightVela, sandbox) therefore cannot reach them at all; the Cloudflare tunnel
  is the **only** remote ingress that exists today.
- That makes `mcp.sirinx.co` the correct connection target for a remote worker,
  but only with a bearer token: the hub is the single gateway for MCP tools and
  the A2A queue (`enqueue`/`poll`/`ack`). No token is stored in this repo, and
  none was read from the host, so an authenticated MCP handshake remains
  `UNVERIFIED`.
- `a2a.sirinx.co` is reachable but useless as a discovery point until it
  advertises agents and its source exists again. Registering LightVela against
  it (B15) would currently produce an empty peer set.
- `hermes.sirinx.co` / `gateway.sirinx.co` must not be handed to a peer as
  endpoints; they are 502 by measurement.

## 6. Not done, by design

- No Cloudflare Access, DNS, tunnel, Worker, or Pages mutation.
- No tunnel restart or config edit, no `cloudflared` upgrade.
- No read of `MCP_HUB_TOKEN` or any other secret; no authenticated request.
- No MCP tool invocation, no A2A `enqueue`/`poll`/`ack` with a valid body (the
  probes sent `{}` and were rejected with 401 before parsing).
- No repair of `~/project-hermes/a2a_server` — the source is gone, so restoring
  it is a product decision, not an edit.

## 7. Operator decisions opened

| # | Decision | Why it cannot be made here |
| --- | --- | --- |
| C9 | Confirm whether `mcp.sirinx.co` is meant to sit behind Cloudflare Access; if yes, re-scope the Access application to `/mcp*`, `/a2a/*`, `/health`, `/openapi.json`, `/docs`; if no, restrict `/openapi.json` + `/docs` at the origin | Access/DNS change is `cloudflare_dns`-gated; origin change belongs to `hermes-mcp`, outside this repo |
| C10 | Decide the fate of `hermes.sirinx.co` (9119) and `gateway.sirinx.co` (8642): run the origins, or delete the ingress rows | an SSH/tunnel ingress edit is a cloud mutation |
| C11 | Decide whether `a2a.sirinx.co` is restored from a real source tree or retired; either way stop advertising a zero-agent card | source is outside this repo |

Reproduce: `curl -sS -m 8 -o /dev/null -w '%{http_code}\n' https://<host><path>`
for each row in §2, `lsof -nP -iTCP:<port> -sTCP:LISTEN`,
`cloudflared tunnel info omni-route`.
