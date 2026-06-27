# KOB Project Registry

Status: local KOB project registry snapshot

KOB local project registry file:

`~/.kob-cli/projects.json`

## Registered Project

| Field                 | Value                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| Project name          | `Ghostclaw Autoflow and autocut`                                       |
| Project absolute path | `/Users/sirinx/Documents/Codex/2026-05-28-ai-company-n-n-l7-interface` |
| Added at              | `2026-06-26T19:46:16.252Z`                                             |
| Role                  | Codex sidebar project target for local A2A worker tasks                |

## Canonical GHOSTCLAW Repo

| Field     | Value                                                                    |
| --------- | ------------------------------------------------------------------------ |
| Repo root | `/Users/sirinx/SIRINXDev/sirinx-agent-native-os`                         |
| Role      | Source of A2A docs, scripts, policies, registry, and runtime scaffolding |

## Routing Rule

Use the sidebar project path when operating inside the Codex UI project. Use the
canonical repo root when editing A2A source files, policies, scripts, docs, and
runtime scaffolding.

Do not copy secrets between the two paths. Do not assume either path is a git
remote for the other. Keep all runtime state under:

`/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async`
