# Repo Audit And Merge Map

Generated: 2026-05-12

Mode: read-only inspection. No legacy code copied.

## Target Repo

| Repo | Branch | Commit | Current Contents |
| --- | --- | --- | --- |
| `ton36475-lgtm/sirinx-co` | `main` | `046ad37` | `public/index.html` only |

## Source Repo Inventory

| Source repo | Main commit | Package shape | Clean source files | Env-like files | Risk class | Target location |
| --- | --- | --- | ---: | ---: | --- | --- |
| `automated-marketing-agency` | `50d3054` | Vite + Node server + Drizzle | 162 | 0 | Medium | `apps/web-marketing`, `services/api-marketing`, `docs/growth` |
| `sirinx-solar-energy` | `d3ea5dc` | Multi-app solar/Cloudflare/Telegram | 602 | 4 | High | `apps/web-opal`, `services/api-opal`, `kms/solar`, `infra/cloudflare/solar` |
| `sirinx` | `48a93d3` | Vite + Node + deployment bundle | 520 | 3 | High | `apps/web-sirinx`, `services/api-gateway`, `infra/legacy-sirinx` |
| `ghost-claw-os` | `35d19f2` | Expo/mobile + Node server | 121 | 0 | Medium | `apps/mobile-command`, `services/ghostclaw-api` |
| `automation-mobile-app` | `cd2eecb` | Expo/mobile + Node server | 118 | 0 | Medium | `apps/mobile-automation-legacy` |
| `automation-system-backend` | `2e3dae7` | Backend/frontend split + Docker | 11 | 1 | Medium | `services/automation-api` |
| `automation-documentation` | `8af073a` | Docs only | 6 | 0 | Low | `docs/legacy/automation` |
| `automation-dashboard` | `cedaf00` | Next dashboard | 21 | 1 | Medium | `apps/automation-dashboard` |
| `chokma-growth-os` | `b42e11c` | Vite + Node growth app | 136 | 0 | Medium | `apps/web-chokma`, `kms/chokma` |
| `oz_mobile_app` | `cb43ce4` | Expo/mobile + Cloudflare Worker backend notes | 148 | 0 | Medium | `apps/mobile-command` |
| `oz-corp-omega-dual-node` | `e8dfa8c` | pnpm monorepo, solar dashboard, agents, docker | 8330 | 1 | Very High | `infra/`, `docs/node-topology`, `scripts/ops`, selective app imports |

## Source-To-Target Map

```text
sirinx-co -> canonical root
sirinx -> apps/web-sirinx, services/api-gateway, infra/legacy-sirinx
sirinx-solar-energy -> apps/web-opal, services/api-opal, kms/solar, infra/cloudflare/solar
ghost-claw-os -> apps/mobile-command, services/ghostclaw-api
oz_mobile_app -> apps/mobile-command
oz-corp-omega-dual-node -> infra/, docs/node-topology, scripts/ops
automation-mobile-app -> apps/mobile-automation-legacy
automation-system-backend -> services/automation-api
automation-dashboard -> apps/automation-dashboard
automation-documentation -> docs/legacy/automation
automated-marketing-agency -> apps/web-marketing, services/api-marketing, docs/growth
chokma-growth-os -> apps/web-chokma, services/api-marketing, kms/chokma
```

## PR Sequence

1. `PR-MONO-001`: repo inventory and quarantine
2. `PR-MONO-002`: import public website app
3. `PR-MONO-003`: import dev dashboard / control API
4. `PR-MONO-004`: import mobile command app
5. `PR-MONO-005`: import node topology and scripts
6. `PR-MONO-006`: import solar domain
7. `PR-MONO-007`: import GhostClaw / growth assets
8. `PR-MONO-008`: dedupe dependencies and shared packages
9. `PR-MONO-009`: add CI and security scans
10. `PR-MONO-010`: finalize handoff package

## Import Rule

Do not bulk copy. Import one target app/service per PR after quarantine review.
