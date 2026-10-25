# All Device Topology

Status: planned. One addition: an Omarchy (Arch/Hyprland v4) developer node has
its settings bundle prepared under `infra/omarchy/vibe-coding/`, and as of
2026-10-23 the tailnet peer `omarchy` (100.87.189.34, linux) is **online** with
Tailscale SSH enabled. It has no authority until `MASTER_PLAN` C6 closes, and no
worker can reach it yet — Tailscale's policy refuses every SSH user tried from
the Mac mini (`tailnet policy does not permit you to SSH as user "sirinx"`).

## Topology

```text
Mobile Command Node
  -> GitHub / Codex / Hermes request
  -> Mac mini M2 Control Plane
  -> Release gates and approval queue
  -> Windows Worker Node for heavy jobs
  -> Omarchy Developer Node (local checks + agent lanes)
  -> Cloudflare Edge for public/private routing
```

## Device Roles

- Mac mini M2: source of operations and local control plane.
- Windows PC: worker node and replica/backup lane.
- Omarchy workstation: developer node; local `cargo`/`npm` checks, agent CLI lanes,
  read-only control-API probes. No production writes, no public ports, no
  control-plane mutation.
- Mobile: command and approval node.
- Cloudflare: edge, zero trust, public website, protected private routes.
- GitHub: source of truth and PR workflow.

## Sync Policy

- Source code syncs through GitHub.
- Project mirrors are dry-run until approved.
- Mobile receives dashboard/Telegram/GitHub views, not raw project mirrors.
- Secrets never sync through repo, Obsidian, screenshots, or chat.
