---
name: agent-team-orchestration
description: Launch a Claude Code team for larger SIRINX OS Hermes dashboard projects. Use manually when the user explicitly asks for a team or parallel agents.
disable-model-invocation: true
---

> **Repo scope note (added 2026-07-20, B10 skill hygiene audit):** this skill's routes/files/architecture (Next.js `apps/sirinx-web`, OpenClaw, `/warroom`-style routes, etc.) describe the sibling **`sirinx-solar-energy`** repo, not this repo (`sirinx-co`, a Rust-crate monorepo). Treat file paths and route names below as reference material for that other codebase, not as claims about what exists here. For `sirinx-co`'s actual architecture, see `SYSTEM_ARCHITECTURE.md`, `docs/RONIN_ROSTER.md`, and `.claude/skills/ghostclaw-manager/SKILL.md`.

# Agent Team Orchestration

Use only when the user explicitly asks for a team or parallel work.

Recommended prompt:

```text
Create an agent team for the SIRINX OS Hermes dashboard.
Use these teammate roles:
- planner using hermes-project-planner
- frontend using hermes-frontend-builder
- backend using hermes-backend-integrator
- browser using hermes-browser-automator
- devops using hermes-devops-runner
- reviewer using hermes-code-reviewer

First inspect AGENTS.md, CLAUDE.md, package.json, apps/dev-dashboard, services/dev-control-api, and tests/browser.
Create a shared task list.
Require plan approval before implementation.
Keep each teammate in a separate ownership area.
Verify with pnpm verify and pnpm dashboard:e2e.
Do not deploy, push, mutate cloud resources, send customer messages, or touch real secrets.
```
