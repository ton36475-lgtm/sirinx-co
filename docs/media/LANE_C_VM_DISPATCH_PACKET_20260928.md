# Lane C — VM server dispatch packet (ready, not sent)

**Status: prepared, NOT dispatched.** Nothing has been sent to `vm-2-126-ubuntu`.
Dispatch requires `APPROVE_EXTERNAL_LANE_DISPATCH`, because reaching it means an SSH
session off this machine, which is an external action.

The user asked for three lanes. Two ran. This file exists so the third is one approval
away rather than one approval plus a planning session.

## The target, as verified on 2026-09-28

```
tailscale status
  100.72.202.12  vm-2-126-ubuntu  tondhm.z99@  linux  idle, tx 2222696 rx 491200
```

- Online on the tailnet, and has moved ~2.2 MB / 491 KB, so it has been doing work.
- Reachable at `100.72.202.12` directly. **The `~/.ssh/config` aliases are both broken**:
  `hermes-tailscale` points at `hermes.solis-net.ts.net` but the real tailnet is
  `tail73d7f2.ts.net`, and `oracle-thclaws` still holds an unfilled `<ORACLE_PUBLIC_IP>`
  placeholder. Use the IP, not an alias.
- The VM is not in the A2A registry and has never been admitted. That registry is also not
  a working dispatch channel for anything (`A2A-QUEUE-ONE-WAY` is `AWAITING_APPROVAL` with
  92 tasks and no consumer, and 0/15 model bindings verify). Registering it as an A2A node
  would be a separate gate, `APPROVE_NODE_REGISTRATION_VM_SERVER`, and is **not** needed for
  this packet.

## What Lane C would be given

Nothing to write. Lane C is deliberately **read-only**, and the reason is specific rather
than cautious: measuring WebGL performance is the one job that is distorted by running the
measurer on the same machine that renders the page. An independent host gives a second
opinion on the numbers in `docs/media/WEBGL_PERF_BUDGET_20260928.md` — LCP, frame pacing,
and whether the context-loss recovery holds on a machine that is not also running the dev
server.

It would run the existing harness against production, from a different machine:

```bash
# on vm-2-126-ubuntu, after APPROVE_EXTERNAL_LANE_DISPATCH
# 1. confirm the host is the one intended, before anything else
hostname && tailscale status --json | head -20

# 2. fetch the two probe scripts from this checkout (read-only, no secrets)
#    measure_webgl_perf.py, probe_pass5.py, probe_pass6.py

# 3. run them against https://www.sirinx.co
#    requires playwright + a chromium on the VM — that is an INSTALL on that host
```

Step 3 is the reason this needs a real decision rather than a rubber stamp: it requires
installing a browser stack on a machine that is not this one. Even though it is not *this*
machine, installing on the VM is an install, and the estate rules require asking.

## The honest argument for not opening it

PKG-5 was blocked all morning as "cannot measure without the VM". That turned out to be
wrong — the local Playwright plus installed Chrome unblocked it in about a minute, with no
install and no gate. The local measurements are complete and are the ones recorded.

So the remaining value of Lane C is a **second opinion**, not unblocking. That is worth
something — the mobile-GPU and non-Chrome cases are genuinely uncovered, and one machine's
numbers are one machine's numbers — but it is a smaller prize than it was at 08:30, and it
costs an install on a remote host.

**Recommendation:** decide it on that basis, not on the original framing. If the goal is
closing the R29 work, Lane C is optional. If the goal is confidence in the WebGL numbers
across real hardware, it is the only way to get there.

## Commands, ready to run on approval

```bash
# read-only reachability check first
tailscale ping --c 3 vm-2-126-ubuntu

# then, only after the gate
ssh -o BatchMode=yes <user>@100.72.202.12 'hostname; uptime; free -h; ls -la ~/'
```

`BatchMode=yes` is deliberate: it fails fast instead of blocking on an interactive password
prompt, and it guarantees no credential is ever typed or logged.

## What must not happen

- No writes into the `sirinx-co` repository from the VM. It has no ownership in the matrix.
- No secret transfer in either direction.
- No `git clean`, `git checkout --`, `git stash` or `git reset` anywhere.
- No blanket approval interpreted as this approval.

## Side effects of preparing this packet

`network: tailscale status query only` · `no SSH connection made` ·
`no install on the VM` · `no secrets read` · `deploy: false` · `gates consumed: none`
