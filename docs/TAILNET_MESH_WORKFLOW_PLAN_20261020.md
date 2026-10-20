# Tailnet mesh workflow plan — all nodes / devices / agents — 2026-10-20

Status: `PLAN_FROM_LIVE_EVIDENCE / PARTIAL_MESH / ZERO_ACTIVATION`
Scope: make every tailnet node, device, and agent usable in one workflow pipeline, including the
Hermes agent on the LightVela VM (`vm-2-126-ubuntu`, `infra/lightvela/hermes_reconfig_lightvela.sh`).
Truth rule: "fully functioning" is not claimed. What is reachable is listed with a receipt; what is
not is listed with the exact blocker.

## 1. Live inventory (measured this session)

| Node | IP | OS / role in repo | Online | Path | Evidence |
| --- | --- | --- | --- | --- | --- |
| macminisirinx | 100.90.189.112 | macOS, control plane | yes | self | `tailscale status`; `a2a :9005` LISTEN (node) |
| vm-2-126-ubuntu (**lightvela**) | 100.72.202.12 | linux, Hermes coding-worker | **yes** | DERP `sin` 51 ms, no direct | `tailscale ping` pong; `tx 25.8M rx 8.0M` |
| sirinx-sandbox | 100.122.146.15 | linux, unassigned | yes (idle) | DERP `sin` 41 ms | `tailscale ping` pong |
| aiagent | 100.67.78.88 | windows/WSL2 **Omarchy** worker | no | — | last seen 2026-10-16T16:26:26Z |
| cue-53a2d20f8168 | 100.126.14.103 | linux, Cue sandbox | no | — | last seen 12h |
| tailscale-cue-long-sandbox | 100.74.96.31 | linux, Cue sandbox | no | — | last seen 13h |
| tailscale-manus-aiyara | 100.86.82.42 | linux, Manus sandbox | no | — | last seen 3h |
| tailscale-b336462f | 100.96.98.33 | linux, ephemeral | no | — | last seen 2d |
| s22-ultra | 100.80.141.60 | android, approval + exit-node offer | no | relay `sin` | last seen 20h |
| iphone-12 / 12-pro-max | .122.18.39 / .78.80.55 | iOS, approval only | no | — | last seen 10h / 14d |
| redmi-13c | 100.121.170.83 | android, approval only | no | — | last seen 2d |

Derived facts:

- **2 of 12 nodes are usable right now** besides the control plane: lightvela and sandbox. Of the seven worker/sandbox nodes, five are offline (aiagent, cue ×2, manus-aiyara, tailscale-b336462f); all four mobile nodes are offline.
- Every live path is **DERP-relayed** (`sin`); no direct connection is established. Throughput-heavy pipelines (firmware, model files, video) will be relay-bound until NAT traversal succeeds.
- `a2a :9005` on the Mac is listening but an HTTP `GET /` did not answer in 4 s → treat as **unverified protocol**, not as a healthy gateway. The lightvela script's own probe (`curl http://100.90.189.112:9005/`) would fail the same way, so its "reachable ✅" branch cannot currently be green.

## 2. Node capability matrix (what each node can actually do)

| Capability | macmini (control) | lightvela VM | sandbox | aiagent/Omarchy | mobiles |
| --- | --- | --- | --- | --- | --- |
| tailnet reachability | yes | yes (DERP) | yes (DERP) | no | no |
| repo + tests (`cargo`, `npm`) | yes | via `npm`/`git` in script | unknown | after join | no |
| Hermes runtime | local only (no admission) | target of `hermes_reconfig_lightvela.sh` | no | planned | no |
| a2a gateway host | :9005 listening, unverified | client | client | client | no |
| REA 6.7.0 (207 tools) | yes (A38) | rebuildable | rebuildable | rebuildable | no |
| Cline / computer-use | yes (archived install) | no | no | no | no |
| ComfyUI/GPU | no | no (WSL box has GPU, offline) | no | yes, gated | no |
| approvals | n/a | n/a | n/a | n/a | yes (offline) |
| exit node | no | no | no | no | s22 offers it |

## 3. Pipelines (each is a gate chain, not a promise)

### P0 — Mesh truth (runs today)
`tailscale status --json` → per-node `tailscale ping` → listener/probe check → receipt in `reports/runtime/`.
Exit gate: every node classified online/offline with timestamp. **This document is P0.**

### P1 — Node join (blocked: host off)
`infra/omarchy/omarchy_tailscale_join.sh` on the Omarchy host (A37), then Mac-side
`tailscale status | grep omarchy` + `tailscale ping`. Owner action C6/C7.

### P2 — LightVela Hermes enrollment (partially ready)
1. On VM: `HERMES_REPO_URL=… bash infra/lightvela/hermes_reconfig_lightvela.sh` (writes `~/.hermes/node.json`, `role=coding-worker`, hub `http://100.90.189.112:9005`).
2. On Mac: register the node in the MCP hub (`[[server]] lightvela`) — this is an admission change, needs a ticket.
3. Health: `curl http://100.90.189.112:9005/` currently fails, so step 3 cannot pass until the gateway speaks HTTP or a correct A2A probe exists.
Blocker: repo URL + admission ticket + a working gateway probe. **No enroll attempted.**

### P3 — Data handoff to Omarchy (package ready, delivery blocked)
`exports/omarchy-handoff/sirinx-ai-evidence-2026-10-20.tar.gz` (23.6 MB, sha256 `0fb749d8…b6fbe1`) →
`tailscale file cp … omarchy-aiagent:` once P1 lands. Falls back to the fusion chat only after a
`sendDocument` path exists (A39).

### P4 — Automation pipelines (design-only)
Workflow → queue → executor requires the durable task/lease state (B10 migration 0007) and spawn
admission (B9). Until then every pipeline stage is `PROPOSAL_ONLY`; `vibe-team-spawn` packets are the
only sanctioned dispatch artifact.

### P5 — Notifications (gated)
Fusion chat notice: text-only (`sendMessage`), dry-run until `telegram_send` opens + token/chat id.
Document upload: not implemented in `services/telegram-command-bot` (A39).

### P6 — Mobile approvals (offline)
Phones are approval/stop nodes only. With all four offline, no human-in-the-loop approval can be
collected over tailnet; approvals must happen on the Mac.

## 4. Wave order

1. P0 receipt refresh (cheap, repeatable).
2. Bring `aiagent` (Omarchy) online → P1 join → P3 handoff.
3. Lightvela: confirm Hermes runtime state, then P2 steps 2–3 with a ticket.
4. Stabilise direct paths (DERP → direct) so bulk pipelines are not relay-bound.
5. Only then P4 queue/spawn admission, then P5 notifications.

## 5. Standing constraints

- No node gets ambient authority: each cross-node action needs its own ticket (A17/A27/A28).
- Mobiles never get FS/shell/backup access; exit-node usage stays an owner decision.
- No secrets travel between nodes; configs carry paths and command names only.
- Receipts, not claims: every P-step closes with a timestamped artifact under `reports/runtime/`.
