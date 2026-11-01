# Node Topology

Status: PR-MONO-001 planning baseline.

SIRINX OS uses a guarded multi-node topology. This file is architecture authority for PR-MONO-001. It does not activate tunnels, services, deploys, or sync jobs.

The Omarchy row is a settings entry (`infra/omarchy/vibe-coding/`), and the join half is now measured rather than planned: tailnet peer **`omarchy`** (100.87.189.34, linux) is **online** as of 2026-10-23 and advertises three Tailscale SSH host keys. The previous `aiagent` peer (100.67.78.88, formerly a Windows worker node) has been **wiped and reprovisioned as an Omarchy (Arch/Hyprland) node** — it no longer runs Windows and must not be treated as a Windows Worker Node; its old IP/role is retired. **2026-11-01 update: SSH access now works as `root`** (`ssh root@omarchy.tail73d7f2.ts.net`) — the Tailscale SSH policy now accepts the root user, while `sirinx`/`omarchy`/`tondhm`/`ubuntu` are still refused. The node runs Omarchy (kernel 7.2.5-3-omarchy, x86_64) with an NVIDIA RTX 3050 (6 GiB), a desktop user `ghostclaw`, and 411 GiB free. ComfyUI is installing under `ghostclaw` (CUDA 12.6 torch) and DWB MCP Studio config was written to `~/.config/dwb-mcp-studio/` with `desktop-commander` installed at `/usr/sbin/desktop-commander`.

## Nodes

| Node | Role | Allowed actions | Blocked actions |
| --- | --- | --- | --- |
| Mac mini M2 | Control Plane | local dev dashboard, release gates, approval queue, local services, Cloudflare Tunnel after approval | direct public exposure, secrets in repo, production DB writes without approval |
| Windows PC | Worker Node | GPU/media jobs, backup worker, MySQL replica planning, dry-run render jobs | direct control of source of truth, public worker ports, production writes without approval |
| Omarchy workstation (tailnet peer `omarchy`, Arch + Hyprland v4 — version unverified) | Developer node / coding-worker candidate | local edits, `cargo fmt`/`clippy`/`test`, `npm run check`, agent CLI lanes, read-only control-API probes over the tailnet | production writes, public worker ports, control-plane mutation, secrets in the repo, unreviewed deploys |
| Mobile | Command and approval node | view status, approve queued actions, emergency stop, GitHub/Codex trigger intent | raw filesystem access, direct worker shell, production write execution |
| Cloudflare | Edge and Zero Trust | Pages for public site, Tunnel, Access, WAF, R2 after approval | unauthenticated private routes, public MySQL/Redis/AMQP, hidden production mutation |
| GitHub | Source of truth | issues, branches, PR review, CI | push or PR creation without explicit approval in this run |

## Control Flow

```text
Mobile approval
  -> GitHub/Codex/Hermes command
  -> Mac mini Control Plane
  -> Release gates
  -> Worker node or Cloudflare preview
  -> Human approval at external boundary
```

## Authority Order

1. `AGENTS.md`
2. `PROJECT_STATE.md`
3. `RELEASE_GATE.md`
4. `SECURITY_QUARANTINE_REPORT.md`
5. This topology file
6. Legacy repo notes

Legacy repo notes are never authority until imported through an approved PR.
