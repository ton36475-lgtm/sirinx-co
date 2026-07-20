---
name: hermes-project-planning
description: Plan SIRINX OS Hermes dashboard, control API, browser automation, and release-gate work. Use when creating task cards, phases, role splits, or next steps.
---

> **Repo scope note (added 2026-07-20, B10 skill hygiene audit):** this skill's routes/files/architecture (Next.js `apps/sirinx-web`, OpenClaw, `/warroom`-style routes, etc.) describe the sibling **`sirinx-solar-energy`** repo, not this repo (`sirinx-co`, a Rust-crate monorepo). Treat file paths and route names below as reference material for that other codebase, not as claims about what exists here. For `sirinx-co`'s actual architecture, see `SYSTEM_ARCHITECTURE.md`, `docs/RONIN_ROSTER.md`, and `.claude/skills/ghostclaw-manager/SKILL.md`.

# Hermes Project Planning

Use this project workflow:

1. Read `AGENTS.md`, `CLAUDE.md`, `package.json`, and relevant docs.
2. Write or follow a task card with:
   - Goal
   - Constraints
   - File Scope
   - Expected Result
   - Verification
   - Report Format
3. Keep work local and dry-run unless explicit approval exists.
4. Split complex work into:
   - Planner
   - Frontend
   - Backend
   - Browser automation
   - Runtime/DevOps
   - Reviewer
5. Verify with `pnpm verify`, `pnpm dashboard:e2e`, and `pnpm dashboard:status`.
