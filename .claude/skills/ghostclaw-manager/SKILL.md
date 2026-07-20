---
name: ghostclaw-manager
description: >
  GhostClaw Manager — single consolidated entry point across everything
  built in this session: master plan, architecture, model routing,
  Telegram gateway, licensing. ใช้เมื่อต้องการภาพรวมทั้งระบบในที่เดียว
  ก่อนเริ่มงานใหญ่ หรือถามว่า "ระบบตอนนี้เป็นยังไงบ้าง"
  Triggers on: ghostclaw, ghostclaw manager, system overview, ภาพรวมระบบ,
  consolidated skill, manager skill
---

# GhostClaw Manager

**This is the name of a skill, not the platform.** SIRINX is still
SIRINX — the user explicitly declined a company/product rebrand to
"GhostClaw OS" on 2026-07-20. There is a separate `ghost-claw-os` repo
in this GitHub org with its own unrelated, still-blocked backlog item
(B7 — committed Android keystore must be rotated/purged first); do not
conflate the two.

What this skill actually is: one index a human operator or any agent
(Claude, Codex, Kimi K3, Hermes) can read to get oriented across the
whole system without re-deriving it, before picking up any task. It
**cross-references, never duplicates** — every fact here lives in one
canonical doc; if this file and that doc ever disagree, the doc wins
and this file is stale and should be fixed.

## Read `MASTER_PLAN.md` first — it is still the plan

This skill is a map of the map. `.claude/skills/sirinx-master-plan/`
already owns the operating method (ทวนคำสั่ง → Context → Plan →
Implement → Verify → Report → Commit Ready) and the hard rules
(gates never auto-open, no secrets in repo, no blanket auto-approve).
Read that skill for *how* to work. This skill is for *what exists*.

## System map

| Layer | Where | Status |
| --- | --- | --- |
| Plan / backlog | `MASTER_PLAN.md` | A1–A16 done, B3/B7/B10/B11 queued, C1–C3 operator-only |
| Architecture / crate graph | `SYSTEM_ARCHITECTURE.md` | 8 Rust crates, see below |
| Data shapes / APIs / env vars | `SYSTEM_SCHEMA.md` | includes the 5 release gates |
| Repo → monorepo mapping | `RUST_MIGRATION_PLAN.md` | 16 repos tracked |
| Team / departments | `AGENT_TEAM_PLAN.md`, `.claude/agents/` | 6 dept-head sub-agents + 4 coded Ronin |
| Go-live gate criteria | `GO_LIVE_GATE_CHECKLIST.md` | deploy → cloudflare_dns → telegram_send → customer_messaging |
| Model lanes for the 47 Ronin | `ronin-model-routing` skill | sonnet5 default, glm52/cf-workers-ai gated |
| Telegram commander center | `services/telegram-command-bot/`, `infra/cloudflare/telegram-gateway-worker/` | reads live gates (B9); replies queued, never sent (telegram_send holds) |
| Shared work queue | `web_pending_work` (Postgres) | now records real completion timestamps (B12) |
| Brain @ Edge (Obsidian/second-brain sync) | `infra/cloudflare/brain-sync-worker/` | D1-backed, delta sync, live |

## The one governance rule that overrides everything above

Every fact in this file can go stale. This rule cannot:

- `deploy`, `cloudflare_dns`, `telegram_send`, `customer_messaging`,
  `adaptive_sync` start **hold** and only a human opens one, with a
  ticket. No agent, no skill, no "manager" persona overrides this.
- No API key, token, or secret is ever written into this repo. A
  credential pasted into chat is treated as exposed and must be
  rotated at the provider — see `ronin-model-routing` for the live
  example (a GLM-5.2 key exposed 2026-07-19, never persisted, rotation
  still pending operator action).
- Third-party code is read and reviewed before it is trusted, let
  alone "force installed" — see the declined `graphify` fast-track on
  2026-07-20.

## Licensing posture

Repo root `LICENSE` is MIT (see A14 in `MASTER_PLAN.md`). No dependency
in this workspace currently requires Apache-2.0 attribution; if one is
added later, record the NOTICE requirement here **and** in the
dependency's own Cargo.toml/package.json comment in the same commit —
don't let a license obligation live only in this index.

## What is still genuinely blocking full autonomous/live operation

Read straight, not softened — see MASTER_PLAN.md B-section for the
authoritative version of this list:

- **B3** — routes from `automation-system-backend` / `sirinx` api-gateway
  not yet ported; those repos aren't cloned into this session.
- **B7** — GhostClaw (the `ghost-claw-os` repo) blocked on rotating and
  purging a committed Android keystore.
- **B10** — skill hygiene audit (24 of 50 skills were stubs as of
  2026-07-19; this file fixes one of them by existing, but the audit
  itself isn't re-run here).
- **B11** — the GLM-5.2 / Cloudflare Workers AI model lanes need an
  operator-signed approval doc and a rotated key before they're live.
- **SEC-1** — prompt-injection audit of the security-skills-wrapper is
  still unclaimed.
- **No `DATABASE_URL`, real Telegram bot token, or Cloudflare
  credentials are configured in this cloud session** — so Postgres
  writes, Telegram webhooks, and Workers deploys are all built and
  tested against mocks/`MemoryStore` here, not exercised against the
  real production services. Closing that gap needs the operator to
  supply those secrets in an environment that has them (Mac node, or
  this session with env vars set) — not something an agent can
  self-provision.
