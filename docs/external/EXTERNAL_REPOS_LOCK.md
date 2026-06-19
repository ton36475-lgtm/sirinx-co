# External Repositories Lock

Status: cloned externally on 2026-06-19 for local audit only.

External repositories must live outside this monorepo under:

`/Users/sirinx/SIRINXDev/_external_repos`

## Registry

| Repository | Clone Path | Branch | Commit Hash | License | Notes |
|---|---|---|---|---|---|
| DietrichGebert/ponytail | `/Users/sirinx/SIRINXDev/_external_repos/ponytail` | main | `0403c4dd50ee6d0db2c3ec70b2be6655f9cb65a9` | MIT | Codex/Claude/Gemini/Antigravity code gate. Inspect lifecycle hooks before trust. No plugin trust or hook activation performed. |
| pewdiepie-archdaemon/odysseus | `/Users/sirinx/SIRINXDev/_external_repos/odysseus` | main | `d9ebdd6fbba31b5f3c2cbae90f650f183958660e` | AGPL-3.0-or-later | Private localhost-only AI workspace. Do not vendor source into this monorepo. No Docker start performed. |
| zai-org/GLM-5 | `/Users/sirinx/SIRINXDev/_external_repos/GLM-5` | main | `4b224ff298300c9d3d3e60442087da232b32c49d` | Apache-2.0 | Reference only unless approved. Use GLM-5.2 API-first strategy. No model download or API call performed. |

## Clone Evidence

Generated clone report:

`/Users/sirinx/SIRINXDev/_external_repos/_reports/external-repos-20260619_210427.txt`

## Rules

- Do not copy external source into this monorepo.
- Do not install dependencies automatically.
- Do not start services automatically.
- Record branch, commit hash, license, install risk, and integration notes after
  approved clone/audit.
