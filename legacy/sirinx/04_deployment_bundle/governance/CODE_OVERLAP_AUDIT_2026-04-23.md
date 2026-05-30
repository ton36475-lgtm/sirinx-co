# Code Overlap Audit

## Date

2026-04-23

## Scope

Audited the canonical SIRINX repository and workspace boundaries for overlapping runtimes, mixed-brand code, and duplicated deployment ownership.

Canonical repository:

`C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx`

## Summary

| Classification | Finding | Decision |
| --- | --- | --- |
| KEEP | `sirinx/` is the active SIRINX writer-of-record | Continue from this repo |
| KEEP | `docker-compose.yml` exposes only `sirinx-public` on host port `3000` for public website recovery | Approved local public runtime boundary |
| KEEP | `sirinx-redis`, `sirinx-postgres`, and n8n services are on private network/profile boundaries | Preserve private/service gating |
| PATCH | Workspace contains separate CHOKMA apps and unrelated dashboards | Keep separate; document in workspace consolidation map |
| PATCH | Need repeatable overlap prevention before server handoff | Added `infra/scripts/overlap-audit.ps1` |
| DEPRECATE | Legacy Ghost/Zenith/OpenClaw runtime prompts and broad autonomy instructions | Reference only unless reconciled through governance |
| QUARANTINE | Gambling/CHOKMA/stealth/scraping code in SIRINX runtime paths | Not found in runtime paths during this audit; block with automation |

## Runtime Code Findings

- Public web/API owner: `server/_core/index.ts`.
- API router owner: `server/routers.ts`.
- System/integration health owner: `server/_core/systemRouter.ts` and `server/_core/integration-health.ts`.
- Local lead fallback owner: `server/_core/localLeadQueue.ts`.
- Compose owner: `docker-compose.yml`.

No second SIRINX public web server owner was promoted in this pass.

## Forbidden Runtime Term Check

Runtime paths checked:

- `client/`
- `server/`
- `shared/`
- `brands/`

Terms blocked in runtime:

- CHOKMA / chokma
- deejai789
- casino
- gambling
- lottery
- baccarat / บาคาร่า
- พนัน
- หวย

Result before script installation: no runtime hits were found.

## Port / Service Ownership

| Runtime Role | Approved Owner | Notes |
| --- | --- | --- |
| SIRINX public website | `sirinx-public` on port `3000` | Local recovery target |
| Redis | `sirinx-redis` private network | No public ingress |
| PostgreSQL target | `sirinx-postgres` profile `postgres-target` | Migration target only |
| n8n automation | profile `automation` | Disabled by default until approved |
| Windows gateway | OpenClaw / Windows control plane only | Not SIRINX app runtime |
| Ubuntu PM2 legacy swarm | Deprecated for SIRINX public runtime | Must not claim port `3000` |

## Prevention Note

The overlap audit must be run before any handoff package or server deployment attempt:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\overlap-audit.ps1
```

## Rollback Note

If future code introduces forbidden runtime hits or duplicate public service ownership, revert only that patch, rerun the overlap audit, then rerun TypeScript checks and tests before packaging.

## Audit Trail Note

This audit is documentation and validation hardening only. It does not change DNS, TLS, GitHub permissions, production secrets, or live traffic.
