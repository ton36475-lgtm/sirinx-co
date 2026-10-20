# Omarchy -> tailnet onboarding (sub-agent dispatch) — 2026-10-20

Status: `REACHABILITY_BLOCKED / JOIN_SCRIPT_READY / ZERO_LANES_ACTIVATED`
Workspace: `/Users/sirinx/SIRINXDev/sirinx-co` · Method: MillerDev + `docs/agent-runtime/SPAWN_PLAYBOOK.md`
Truth protocol: every claim below is either a command output captured today or marked as unverified.

## 1. Request

"connect omarchy os with tailscale network โดยใช้ sub agent" — bring the Omarchy host
(Arch/Hyprland; the `aiagent` Windows/WSL2 box per `infra/omarchy/omarchy_bootstrap.sh`)
into the `tondhm.z99@gmail.com` tailnet, dispatched as a sub-agent lane rather than ad hoc.

## 2. Tailnet evidence (macOS side, `tailscale status`)

| Node | IP | OS | State |
| --- | --- | --- | --- |
| macminisirinx | 100.90.189.112 | macOS | self, online (control plane) |
| vm-2-126-ubuntu | 100.72.202.12 | linux | idle, online |
| aiagent | 100.67.78.88 | windows | **offline, last seen 3d ago** |
| sirinx-sandbox | 100.122.146.15 | linux | offline, last seen 8m ago |
| tailscale-manus-aiyara | 100.86.82.42 | linux | offline, last seen 2h ago |
| cue-53a2d20f8168 | 100.126.14.103 | linux | offline, last seen 11h ago |
| s22-ultra | 100.80.141.60 | android | offline, exit-node offer |
| iphone-12 / 12-pro-max / redmi-13c | .18.39 / .80.55 / .170.83 | mobile | offline |

There is **no** `omarchy*` node in the tailnet, and the only host the bootstrap targets
(`aiagent`) has been offline for three days. A WSL2 distro is not a tailnet node until
`tailscaled` runs inside it, so this is a first join, not a re-join.

## 3. Sub-agent dispatch

Packets were built by the validated A36 builder, not hand-written:

```bash
node --input-type=module -e '
import { getVibeTeamPlan, buildVibeTeamPackets } from "./services/dev-control-api/src/vibe-team-spawn.mjs";
const plan = await getVibeTeamPlan();
...
'
```

Output: `reports/runtime/omarchy-tailscale-dispatch-20261020.json`

| Field | Value |
| --- | --- |
| shape | `research` (openbot-coworker) |
| coordinator | `task_954238af53098317` (lane `manus`, `duty=coordinator`) |
| workers | 3 — `L1-08` repository-cartographer (cline), `L2-17` source-analyst (manus), `L5-44` truth-auditor (cline) |
| action_class | `PROPOSAL_ONLY` |
| budgets | 40 steps / 60k tokens / 0 micro-USD / 900 s |
| effects | `provider_call=false, queue_mutation=false, live_send=false, spawn=false` |
| stop point | `SPAWN PLAN BUILT - ZERO LANES ACTIVATED` |

Honest reading: this is a **dispatch envelope, not a live team**. `SPAWN_PLAYBOOK.md`
still holds runtime spawn behind registry parity, durable lease state, resource
admission, and cancellation. The Manus lane additionally needs a `PROVIDER_CALL`
ticket plus `MANUS_API_KEY`, and Cline needs `cline auth`; neither exists. So the
work that actually ran is the deterministic part: evidence capture, the join script,
and the verification contract.

## 4. What was delivered

`infra/omarchy/omarchy_tailscale_join.sh` — idempotent, secret-free:

- refuses to run off-Linux, and refuses when systemd is not PID 1 (the common WSL2 failure),
- installs `tailscale` via `pacman` only if absent, enables `tailscaled`,
- joins with `--hostname`, `--accept-dns=false`, `--accept-routes=false`, `--ssh=false`,
- accepts a key only from `TS_AUTHKEY_FILE` (preferred, `file:` form so it stays out of `argv`); inline `TS_AUTHKEY` is supported with a warning,
- falls back to the interactive login URL when no key is supplied,
- never sets an exit node, never advertises subnet routes, never enables Funnel,
- verifies `BackendState=Running`, prints `tailscale ip -4`, and pings `100.90.189.112`.

`--accept-dns=false` is deliberate: `omarchy_bootstrap.sh` writes `/etc/resolv.conf`
and then `chattr +i`s it, so letting tailscaled manage DNS would fail or fight the
bootstrap. Same reason the script does not touch `/etc/resolv.conf`.

## 5. Owner steps (human, on the Omarchy host)

```bash
# interactive (recommended first time)
bash infra/omarchy/omarchy_tailscale_join.sh

# unattended, after a key file exists on that host (never in this repo)
TS_AUTHKEY_FILE=/run/sirinx/ts.key TS_TAGS=tag:worker bash infra/omarchy/omarchy_tailscale_join.sh
```

Then from the Mac mini:

```bash
tailscale status | grep omarchy
tailscale ping omarchy-aiagent
```

## 6. Blockers and non-goals

- **Blocked:** `aiagent` offline 3d; no SSH path and no tailnet route to the Omarchy
  host from here, so no join could be executed remotely.
- **Not done:** no auth key minted (minting one is an owner decision, C6), no ACL/tag
  grant, no a2a `:9005` enroll, no exit-node or subnet-route change, no macOS
  `diskutil`/volume mutation.
- **Out of scope by design:** provider calls, queue/A2A/Telegram effects, deploys.

## 7. Verification run

| Check | Result |
| --- | --- |
| `bash -n infra/omarchy/omarchy_tailscale_join.sh` | rc 0 |
| `shellcheck -S warning …` | rc 0 |
| packet build against `vibe-team.spawn.v1.json` | valid, `runtime_spawned=false` |
| `tailscale status` | captured above; Omarchy absent |
