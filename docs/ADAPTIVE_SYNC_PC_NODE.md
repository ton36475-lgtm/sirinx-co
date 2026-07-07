# AdaptiveSync PC Node

Status: safe scaffold. No cross-device copy has been executed.

## Goal

Prepare the Windows PC `D:` drive as a worker-node mirror target for the SIRINX OS monorepo while keeping the Mac mini M2 as the control plane and GitHub as the source of truth.

## Current Reality

The Windows `D:` drive is not mounted on this Mac. Current mounted volumes are local installer volumes and OrbStack only. This phase therefore creates:

- dry-run sync planner
- Drive D handoff pack
- PowerShell setup template
- node heartbeat schema
- Telegram dry-run status preview

## Target Layout On Windows

```text
D:\SIRINX_OS\
  sirinx-co\
  mirrors\
  backups\
  logs\
  handoff\
```

## Mac Mount Expectation

When the Windows share is mounted on the Mac, set:

```bash
export SIRINX_WINDOWS_D_MOUNT="/Volumes/Windows-D/SIRINX_OS/sirinx-co"
```

Then run:

```bash
npm run sync:plan
```

This produces a dry-run plan only. Execution requires a later explicit confirmation and a mounted target.

## Exclusions

AdaptiveSync excludes:

- `.env`
- `.env.*`
- `.ssh`
- credentials
- tokens
- cookies
- keychains
- `node_modules`
- build outputs
- caches
- browser profiles
- `.git`

## Guardrail

Drive D sync is never a raw home-directory mirror. It is a curated project mirror for this repo and later approved project units only.
