# Hermes mesh — node state after the deploy sweep (2026-10-21)

Status: `PARTIAL / ONE NODE REPAIRABLE / ONE NODE UNREACHABLE`

Request: bring every Hermes node back into one working mesh. What follows is
measured; nothing is claimed as "working together" when it is not.

## 1. Mac mini (control plane) — what is actually running

| launchd label | pid | listener | health |
| --- | --- | --- | --- |
| `ai.hermes.gateway` | 4394 | none (`/usr/bin/osascript`, GUI app launcher) | not an HTTP gateway |
| `ai.sirinx.a2a-server` | 4402 | `127.0.0.1:9000` | `/health` 200 `{"ok":true,"service":"a2a-server","tasks":332}` |
| `ai.sirinx.a2a-stubs` | 4393 | `127.0.0.1:9001-9004` | stub agents listening |
| `com.sirinx.a2a-bridge` | 4376 | none | shell job, no listener |
| `hermes_agents.hub` (MCP hub) | 4399 | `127.0.0.1:8765` | 401 without bearer; `/openapi.json` 200 |
| `sirinx-sovereign-swarm` a2a gateway | — | `:9005` **now closed** (000) | was up earlier today |

Public ingress for these is the Cloudflare tunnel (see
`cf-tunnel-hermes-mcp-20261021.md`): `mcp.sirinx.co` → hub, `a2a.sirinx.co` →
a2a-server.

**Blocker A — a2a-server has no source.** Its plist runs
`/Users/sirinx/project-hermes/a2a_server/server.py`, but `~/project-hermes/` now
contains only `data/`; a bounded search across `~/SIRINXDev`, `~/sirinx-os`,
`~/sirinx-co`, `~/OpenManus`, `~/hermes` found no copy of `a2a_server/server.py`.
The process survives from memory, so it cannot be restarted, patched, or
reproduced after a crash or reboot. Because of that, no restart was attempted:
a `launchctl kickstart` would replace a working (if undeployable) service with a
guaranteed crash loop.

**Blocker B — the Agent Card advertises zero agents.** `/.well-known/agent-card.json`
on `:9000` returns `"agents": []` while health reports 332 tasks, so a peer that
discovers the mesh sees no agents even though the stubs are listening on
9001–9004. The registry it reads was part of the deleted tree.

## 2. LightVela VM (`vm-2-126-ubuntu`, 100.72.202.12)

| Check | Result |
| --- | --- |
| tailnet | online; `tailscale ping` pong via DERP `sin` 37–38 ms, **no direct path** |
| TCP 22 | open |
| SSH auth | every keyless login denied earlier this session; peer advertised `sshHostKeys: 0` (Tailscale SSH not enabled) and there is no `~/.ssh/config` entry |
| Hermes ports | none answer (9000/9005/3000/8080/8000) |
| Hermes state | `UNVERIFIED` — not proven absent |

**Blocker C — no credential path.** Repairing or enrolling this node needs one
of: a key in the VM's `authorized_keys`, Tailscale SSH enabled on the VM, or a
console session. None exists from here, and host-key verification was not
disabled to force access.

## 3. Other nodes

`tailscale status`: `aiagent` (Omarchy) offline 4 days, `iphone-12` offline 1 day,
`iphone-12-pro-max` offline 15 days, `redmi-13c` offline 13 hours,
`cue-53a2d20f8168` idle. No worker besides LightVela is online.

## 4. What was fixed today, and what was not

Fixed:

- `www.sirinx.co` and `www.sirinx.org` now serve the current public-web build
  (3D/WebGL stack, real installation portfolio, `.org` canonicals, 77 legacy
  province 301s). See `deploy-sirinx-co-20261021.md` and
  `deploy-sirinx-org-20261021.md`.
- Cloudflare ingress truth for MCP/A2A recorded, including the two 502 hostnames
  and the unauthenticated `/docs` + `/openapi.json`.
- Untracked-work cleanup: `apps/public-web/dist-org/` is now ignored; every
  artifact MASTER_PLAN cites (58 paths) exists in `HEAD`.

Not fixed (each blocked by something outside a local edit):

| # | Item | Blocker |
| --- | --- | --- |
| A | a2a-server restart/repair | source tree deleted; needs the original source restored or the service retired |
| B | empty Agent Card | registry came from the deleted tree |
| C | LightVela Hermes | no SSH credential path; owner must enable Tailscale SSH or install a key |
| D | `hermes.sirinx.co` / `gateway.sirinx.co` 502 | no origin exists on 9119/8642; decide run-or-remove (C10) |
| E | `mcp.sirinx.co` schema exposure | needs Access policy or origin-level restriction (C9) |
| F | Home data offload to USB | `/Volumes/SIRINXSCR` wedged since 2026-10-16; needs a re-plug/reboot (C12) |
| G | Bulk iCloud copy | 6.5 GiB free; iCloud staging uses the same disk (C13) |

## 5. Definition of "mesh working together"

Not met today. The honest gate is: every node reachable with a documented probe,
each peer's Agent Card listing at least one agent, one task round-trip per peer,
and a receipt for each. Today only the Mac satisfies the first condition, and its
card lists zero agents. A, C, and D must land before that gate can be attempted.
