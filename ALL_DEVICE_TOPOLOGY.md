# All Device Topology

Status: planned.

## Topology

```text
Mobile Command Node
  -> GitHub / Codex / Hermes request
  -> Mac mini M2 Control Plane
  -> Release gates and approval queue
  -> Windows Worker Node for heavy jobs
  -> Cloudflare Edge for public/private routing
```

## Device Roles

- Mac mini M2: source of operations and local control plane.
- Windows PC: worker node and replica/backup lane.
- Mobile: command and approval node.
- Cloudflare: edge, zero trust, public website, protected private routes.
- GitHub: source of truth and PR workflow.

## Sync Policy

- Source code syncs through GitHub.
- Project mirrors are dry-run until approved.
- Mobile receives dashboard/Telegram/GitHub views, not raw project mirrors.
- Secrets never sync through repo, Obsidian, screenshots, or chat.
