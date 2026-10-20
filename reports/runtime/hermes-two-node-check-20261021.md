# Hermes on both nodes, checked over Tailscale (2026-10-21)

Status: `NODE_A_RUNNING_LOOPBACK_ONLY / NODE_B_UNVERIFIED_NO_ACCESS / ZERO_ACTIVATION`
Method: read-only inspection over the tailnet. No config change, no enrollment, no
restart, no send, no deploy.
Scope: the two Hermes nodes in `docs/TAILNET_MESH_WORKFLOW_PLAN_20261020.md` —
`macminisirinx` (control plane) and `vm-2-126-ubuntu` / LightVela (Hermes
coding-worker). The other nine peers are offline, so they hold no Hermes state to check.

## 1. Verdict

| | macminisirinx `100.90.189.112` | LightVela `100.72.202.12` |
| --- | --- | --- |
| tailnet reachability | self (control plane) | **online**, `tailscale ping` pong via DERP `sin` 38 ms, no direct path (`curAddr: null`) |
| Hermes process | **running**: `hermes_agents.hub` (PID 4399, up 4d 07 h), `mcp_death_supervisor.py` (98395), `hermes_kernel_runner.py` (75875), omniroute MCP (98397), 2× `mcp-server-filesystem`, `bluezy serve-api` | **unverified** — no access path (see §3) |
| Hermes reachable over tailnet | **no** — every Hermes port (9000–9006) binds `127.0.0.1` only | **no** — 9005/3000/8080/8000 closed/filtered |
| `:9005` owner | `sirinx-sovereign-swarm/servers/a2a-gateway.mjs` (PID 15591) — **not Hermes** | none |
| `~/.hermes/node.json` | **absent** | unknown |
| tags / Tailscale SSH / services | host node | `tags: null`, `sshHostKeys: 0`, `services: 0` |

So: Hermes **runs** on the Mac, but only inside the Mac. Nothing Hermes-related is
reachable across the tailnet from either side, and LightVela's Hermes state was
never created (P2 was never run) rather than being down.

## 2. Node A — the `:9005` gateway is now defined (A40 correction)

A40 recorded that `GET /` on `100.90.189.112:9005` answered nothing in 4 s and
therefore called the gateway probe "unverified". Re-probed today:

| Probe | Result |
| --- | --- |
| `GET /` | **404** — the listener answers HTTP; there is simply no root route |
| `GET /health` | **200** `{"ok":true,"service":"sovereign-swarm","port":9005,"live":false}` |
| `GET /.well-known/agent-card.json` | **200** — `SovereignSwarm` v0.2.0, skills `webhook, event, deploy-gate, governance, queue, dlq, reply-outbox, approval, smoke` |
| `GET /.well-known/agent.json`, `/healthz`, `/status`, `/a2a`, `/metrics` | 404 |

Two defects fall out of that, and both block B15 rather than being cosmetics:

1. **The card advertises the wrong origin.** `url` and `endpoint` are
   `http://127.0.0.1:9005`, while the socket is bound to `100.90.189.112:9005`.
   A remote peer that resolves the card would call *its own* loopback. The
   LightVela reconfig script's probe (`curl http://100.90.189.112:9005/`) would
   also get a 404 even though the hub is healthy, because the route is `/health`.
2. **`live: false`.** The gateway describes itself as not live, so even a correct
   probe is not activation evidence. B15's "passing gateway probe" gate cannot be
   satisfied by this process as it stands.

Also on the Mac: `~/.hermes/node.json` does not exist. The Mac is meant to be the
hub rather than a worker node, so this is not automatically a fault — but it means
there is no Hermes node identity anywhere in the mesh today.

## 3. Node B — why LightVela is `unverified`, not "down"

The node is up and the tailnet path is healthy, but there is no way in from here:

| Attempt | Result |
| --- | --- |
| `tailscale ping 100.72.202.12` | pong, DERP `sin`, 38 ms, direct not established |
| `nc -z` on 22 | open |
| `ssh root@`, `ssh sirinx@`, `ssh ubuntu@`, `ssh ec2-user@` (BatchMode) | `Permission denied (publickey,password)` for all four |
| `tailscale ssh` | falls back to plain SSH; peer has `sshHostKeys: 0`, i.e. Tailscale SSH is not enabled on that machine |
| `~/.ssh/config` | no entry for the node or its IP |
| `nc -z` on 9005 / 3000 / 8080 / 8000 | closed or filtered |

No key was tried, generated, or copied. Host-key checks were **not** disabled to
force a session — that would be an access-control bypass, not a diagnostic.
Consequently I can say nothing about `~/.hermes/node.json`, the process table, or
systemd units on LightVela; the absence of a listening Hermes port is the only
positive fact, and it is consistent with P2 never having run there.

## 4. What this changes in the plan

- **A40 §1 is corrected**: the `:9005` listener *does* speak HTTP; the earlier
  "unverified protocol" line is superseded by §2 above.
- **B15 gains a concrete probe** (`/health`, `/.well-known/agent-card.json`) but
  stays blocked on three separate things: the card's loopback endpoint, the
  gateway's `live:false`, and the missing admission ticket (C7).
- **C7 stays the operator item**: a tailnet SSH key (or `tailscale up --ssh` on the
  VM) is required before anyone can inspect or enroll LightVela from the Mac.

## 5. Limits

- Read-only and bounded: `tailscale status --json`, `tailscale ping`, `nc -z`,
  four `ssh` attempts, and nine HTTP GETs with 3 s timeouts.
- No restart, no `tailscale up`, no ACL/tag change, no key install, no enrollment,
  no MCP hub registration, no message, no deploy.
- Tailnet membership is unchanged: 2 of 12 peers online beyond the control plane
  (`vm-2-126-ubuntu`, and `sirinx-sandbox` has since dropped to offline since A40).
