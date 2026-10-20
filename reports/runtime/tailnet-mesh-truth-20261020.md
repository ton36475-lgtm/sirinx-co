# P0 — tailnet mesh truth receipt (2026-10-20, refresh)

Status: `MEASURED / ZERO_ACTIVATION`
Command source: `tailscale status`, `tailscale status --json` run on `macminisirinx` at
2026-10-20 (session clock), plan step P0 of `docs/TAILNET_MESH_WORKFLOW_PLAN_20261020.md`.

## Backend

`BackendState=Running`, self `MacminiSirinx` / `100.90.189.112`, tailnet `tondhm.z99@`, 11 peers.

## Peers

| Node | IP | Online | Last seen (UTC) | Relay |
| --- | --- | --- | --- | --- |
| VM-2-126-ubuntu (**lightvela**) | 100.72.202.12 | **yes** | — | `sin` |
| sirinx-sandbox | 100.122.146.15 | **yes** | 2026-10-20T03:50:00 | `sin` |
| AIAgent (Omarchy) | 100.67.78.88 | no | 2026-10-16T16:26:26 | `sin` |
| cue-53a2d20f8168 | 100.126.14.103 | no | 2026-10-19T16:14:47 | `iad` |
| tailscale-cue-long-sandbox | 100.74.96.31 | no | 2026-10-19T16:11:13 | `sin` |
| tailscale-manus-aiyara | 100.86.82.42 | no | 2026-10-20T01:40:00 | `sin` |
| tailscale-b336462f | 100.96.98.33 | no | 2026-10-17T07:24:21 | `sin` |
| S22 Ultra | 100.80.141.60 | no (offers exit node) | 2026-10-19T08:38:35 | `sin` |
| iphone-12 (`localhost`) | 100.122.18.39 | no | 2026-10-19T19:10:43 | `sin` |
| iphone-12-pro-max (`localhost`) | 100.78.80.55 | no | 2026-10-05T14:39:33 | `sin` |
| Redmi 13C | 100.121.170.83 | no | 2026-10-18T02:07:08 | `sin` |

## Derived truth

- **2 of 11 peers online.** `aiagent`/Omarchy has been offline for 3 days; no `omarchy*` node exists
  in the tailnet at all, so C6 stays the only path to it.
- Every live path is DERP-relayed (`sin`); no direct connection exists, so throughput-heavy
  pipelines remain relay-bound.
- All four mobile approval nodes are offline → no tailnet human-in-the-loop approval is collectable
  right now (P6 stays closed).
- Nothing was enrolled, registered, transferred, sent, or re-routed to produce this receipt.
