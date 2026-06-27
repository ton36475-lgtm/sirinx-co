# A2A KOB Codex Sync v2

Status: scaffolding, local-first, dry-run by default

This module defines the local A2A-compatible bridge between KOB CLI planners
and Codex repo workers. It uses A2A concepts such as Agent Card, Task, Message,
Artifact, TaskStatus, and task lifecycle states, but it does not expose a
network service in this phase.

Manus is also supported as an artifact-producing peer. Manus can create visual
specs, interactive HTML, slides, websites, or videos, then hand off metadata to
the A2A local queue for Codex review. Manus does not mutate the repo directly.

## Roles

- KOB CLI Opus profile: senior planner, architect, context compressor, and
  multi-repo integration strategist.
- KOB CLI Fable profile: fast summarizer, router, task slicer, and daily sync
  worker.
- Codex local profile: repo executor, patch writer, test runner, docs/script
  implementer, and integration worker. For this task, do not route repo
  execution through KOB-hosted Codex models.
- OpenCode profile: scoped coding/review executor. It requires an executor
  lease and lane lock before any repo mutation.
- AGY Antigravity 2 profile: scoped fast scaffold/refactor executor. It
  requires an executor lease and lane lock before any repo mutation.
- Ponytail: code minimalism and over-engineering review gate.
- GLM-5.2: long-context fallback for large repo or research synthesis tasks.
- Manus: visual/spec artifact producer; Codex must review exported artifacts
  before any repo import.

## Transport

The first transport is a local file queue under:

`~/SIRINXDev/.ghostclaw_runtime/a2async/`

No public A2A server, public port, webhook endpoint, tunnel, or connector
activation is part of this phase.

## Default Flow

1. KOB writes or proposes a planning task.
2. `a2a_new_task.py` creates a local JSON task manifest in `inbox/`.
3. `a2a_dispatch.py` checks the kill switch and policy.
4. The task moves through `running/`, `completed/`, `skipped/`, `failed/`, or
   `quarantined/`.
5. Adapter scripts create dry-run command plans and artifacts.
6. `a2a_daily_summary.py` writes a local summary for PROJECT_STATE, Obsidian,
   or future Hermes memory writeback.

## Hard Boundaries

- Do not print secrets.
- Do not read `.env` values.
- Do not force push.
- Do not expose ports.
- Do not clone unverified repos.
- Do not run Docker, install dependencies, deploy, publish, or call APIs in
  the scaffolding phase.
- Runtime state stays outside git.

## Current Known Tool State

KOB CLI is treated as an external planner interface. The bridge must discover
real commands at runtime because `kob models`, `kob profiles`, and `kob a2a`
support may vary by installed CLI version. If direct A2A commands do not exist,
the bridge falls back to local file-queue artifacts and dry-run command plans.

OpenCode and AGY are discovered as local CLIs, but provider/model readiness is
not assumed. Their adapters default to dry-run command plans and report version
checks only.
