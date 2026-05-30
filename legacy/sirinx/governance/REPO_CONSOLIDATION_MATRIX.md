# Repo Consolidation Matrix

## Source Selection

Primary writer source: `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx`

Reason: this path is a valid git repository on branch `main` and already contains the recovered SIRINX website, governance docs, infrastructure scripts, and handoff artifacts. `C:\Users\Ton36\Downloads\sirinx-main` exists but is not itself a git repository; it is treated as a harvest/reference folder only.

Canonical operating map:

- Workspace-level map: `C:\Users\Ton36\OneDrive\เอกสาร\Playground\PROJECT_CONSOLIDATION_MAP.md`
- SIRINX handoff map: `docs/migration/WORKSPACE_PROJECT_CONSOLIDATION_MAP.md`
- SIRINX single control file: `governance/CANONICAL_OPERATING_SYSTEM.md`

## Matrix

| Repo / Folder | Local Path | Proposed Role | Final Decision | Include In Handoff | Reason |
| --- | --- | --- | --- | --- | --- |
| SIRINX canonical repo | `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx` | Writer of record | KEEP/PATCH | Yes | Valid git repo with active recovery and governance |
| downloaded sirinx-main bundle | `C:\Users\Ton36\Downloads\sirinx-main` | Reference / harvest only | MERGE selectively | No, unless harvested | No top-level `.git`; contains related packs |
| automation-dashboard-main | under Downloads bundle if present | Reference only | DEPRECATE for SIRINX public handoff unless specific safe code is needed | No | Avoid mixing unrelated automation planes |
| automation-system-backend-main | under Downloads bundle if present | Reference only | DEPRECATE for public handoff | No | May contain unrelated backend assumptions |
| automation-mobile-app-main | under Downloads bundle if present | Reference only | MERGE only mobile-control policy ideas | No | Mobile policy must be read-only by default |
| automation-documentation-main | under Downloads bundle if present | Reference only | MERGE selectively | No | Documentation may help but must pass governance |
| sirinx-solar-energy-main | under Downloads bundle if present | SIRINX reference | MERGE selectively | No, unless selected files are copied | Useful prior website/business context |
| ghost-claw-os-main | under Downloads bundle if present | Legacy reference | DEPRECATE for SIRINX runtime | No | Ghost Claw runtime ownership conflicts are explicitly avoided |
| automated-marketing-agency-main | under Downloads bundle if present | Unrelated marketing reference | QUARANTINE/DEPRECATE | No | Not part of SIRINX go-live |
| AI-Company | if discovered | Reference only | DEPRECATE unless governance-approved | No | Avoid broad unrelated imports |

## Workspace Apps Boundary

| Folder | Decision | Reason |
| --- | --- | --- |
| `apps/chokma-landing` | KEEP SEPARATE | CHOKMA/gambling-related work is not part of SIRINX recovery or handoff |
| `apps/chokma-retention-hub` | KEEP SEPARATE | Separate app with its own compose files; never include in SIRINX bundle |
| `apps/dashboard` | KEEP SEPARATE | Independent dashboard app; not SIRINX unless future governance approves harvest |
| `apps/trading-board` | KEEP SEPARATE | Independent trading app; excluded from SIRINX |
| top-level `scripts/hybrid_website_control.ps1` | CONTROL PLANE ONLY | Safe recovery controller; not a SIRINX public app runtime |

## Automated Overlap Gate

Run before handoff packaging or server validation:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\overlap-audit.ps1
```

This gate fails if SIRINX runtime paths contain CHOKMA/gambling terms, required canonical docs are missing, `sirinx-public` ownership drifts, or DB/Redis ports are exposed publicly.

## Quarantine Rule

Exclude `node_modules`, `dist`, caches, plaintext secrets, real `.env`, keystores, signing keys, unsafe automation, unrelated experiments, duplicate repos, gambling/CHOKMA assets, stealth tooling, scraping/publishing automation, and proxy or fingerprint evasion.

## Rollback Note

If a harvested file introduces drift, revert only that harvested diff and restore the canonical repo state.

## Audit Trail Note

Save path, decision, reason, included/excluded status, and validation evidence for every harvested artifact.
