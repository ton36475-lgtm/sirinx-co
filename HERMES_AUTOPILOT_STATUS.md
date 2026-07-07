# Hermes Autopilot Status

Generated: 2026-05-12

## Pack Inventory

| Pack | SHA256 | Status |
| --- | --- | --- |
| `HERMES_AUTOPILOT_DEPLOY_PACK.zip` | `aad6c38991d0625b9a1cc5e14e5d0868793d76706ba5be262ef7bf25d6345419` | inspected, not enabled |
| `SIRINX_ONE_COMMAND_AGENT_PACK.zip` | `5294c9c809777499e639a918fd1eade1248297ed9c80c1ad242fba903b4d948c` | inspected, not enabled |
| `SIRINX_PROJECT_HELP_PACK.zip` | `3dc58600d8d70b9a979baaf1636ecc6c4265cf39f3358199fdf81cbe51aaecd5` | inspected, not enabled |

## Autopilot Boundary

Hermes/Codex may work automatically inside the repo through C5:

- inspect
- plan
- create docs
- create mock adapters
- update `.env.example`
- run local checks
- prepare PR-ready branch

Hermes/Codex must stop before:

- real secret creation or storage
- GitHub push
- Cloudflare mutation
- production deploy
- customer message
- paid API
- production database write
- public internal service exposure

## Disabled Assets

The GitHub Actions auto-deploy template from the pack is not installed under `.github/workflows`. It remains a reviewed reference only.

## Active Authority

`AGENTS.md`, `PROJECT_STATE.md`, `RELEASE_GATE.md`, and `SECURITY_QUARANTINE_REPORT.md` override any older autopilot prompt or legacy repo instruction.
