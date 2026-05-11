# Node Topology

Status: PR-MONO-001 planning baseline.

SIRINX OS uses a guarded multi-node topology. This file is architecture authority for PR-MONO-001. It does not activate tunnels, services, deploys, or sync jobs.

## Nodes

| Node | Role | Allowed actions | Blocked actions |
| --- | --- | --- | --- |
| Mac mini M2 | Control Plane | local dev dashboard, release gates, approval queue, local services, Cloudflare Tunnel after approval | direct public exposure, secrets in repo, production DB writes without approval |
| Windows PC | Worker Node | GPU/media jobs, backup worker, MySQL replica planning, dry-run render jobs | direct control of source of truth, public worker ports, production writes without approval |
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
