# Workspace Project Consolidation Map

## Canonical Source

The active SIRINX writer-of-record is:

`C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx`

This repository owns the recovered SIRINX public website, governance documents, deployment bundle, infrastructure scripts, and server handoff records.

## Project Boundaries

| Scope | Path | Decision | Handoff Status |
| --- | --- | --- | --- |
| SIRINX public website and handoff | `sirinx/` | KEEP/PATCH | Include |
| CHOKMA apps | `apps/chokma-landing`, `apps/chokma-retention-hub` | KEEP SEPARATE | Exclude from SIRINX |
| Dashboard and trading apps | `apps/dashboard`, `apps/trading-board` | KEEP SEPARATE | Exclude unless later approved |
| Hybrid recovery controller | `scripts/hybrid_website_control.ps1` | KEEP CONTROL PLANE | Reference only |
| OpenClaw bridge | `openclaw_bridge/` | KEEP CONTROL PLANE | Reference only |
| Hermes/Ghost/Zenith legacy materials | `hermes_bridge/`, downloaded packs, old runtime scripts | DEPRECATE for SIRINX runtime | Exclude |
| Artifacts/logs | `artifacts/` | KEEP AUDIT | Include only selected evidence |

## Consolidation Decision

Do not physically merge CHOKMA or unrelated automation folders into SIRINX. The correct consolidation is source-of-truth consolidation:

- All SIRINX website, governance, handoff, and deployment work belongs inside `sirinx/`.
- Workspace-level control scripts may remain outside `sirinx/` but must not become SIRINX application runtime.
- Reference packs are harvested only through explicit KEEP/PATCH/MERGE decisions.

## Overlap Prevention

The automated prevention check is:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\overlap-audit.ps1
```

This check verifies that SIRINX runtime paths do not contain CHOKMA/gambling terms and that canonical governance files are present.

## Rollback Note

If an excluded project is accidentally included in SIRINX handoff, remove only that inclusion and rerun the overlap audit before packaging.

## Audit Trail Note

This file is part of the server handoff evidence. It documents why related but separate projects are excluded from SIRINX deployment.
