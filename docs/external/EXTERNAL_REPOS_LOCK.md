# External Repositories Lock

Status: placeholder only. Do not clone until approved.

External repositories must live outside this monorepo under:

`/Users/sirinx/SIRINXDev/_external_repos`

## Registry

| Repository | Clone Path | Branch | Commit Hash | License | Notes |
|---|---|---|---|---|---|
| DietrichGebert/ponytail | `/Users/sirinx/SIRINXDev/_external_repos/ponytail` | pending | pending | MIT reported by plan; verify after clone | Codex/Claude/Gemini/Antigravity code gate. Inspect lifecycle hooks before trust. |
| pewdiepie-archdaemon/odysseus | `/Users/sirinx/SIRINXDev/_external_repos/odysseus` | main unless approved otherwise | pending | AGPL-3.0-or-later reported by plan; verify after clone | Private localhost-only AI workspace. Do not vendor source into this monorepo. |
| zai-org/GLM-5 | `/Users/sirinx/SIRINXDev/_external_repos/GLM-5` | pending | pending | MIT reported by plan; verify after clone | Reference only unless approved. Use GLM-5.2 API-first strategy. |

## Rules

- Do not copy external source into this monorepo.
- Do not install dependencies automatically.
- Do not start services automatically.
- Record branch, commit hash, license, install risk, and integration notes after
  approved clone/audit.
