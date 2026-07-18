# SIRINX MASTER PLAN — แผนงานหลักเดียวของระบบ

The one canonical plan. Every other plan document is an appendix of
this file (see the doc map in `.claude/skills/sirinx-master-plan/`).
Update the status column here in the same commit as the work.

Goal spec: **one Rust monorepo powering www.sirinx.co, operated by an
autonomous-but-gated 47 Ronin agent mesh across Mac/PC/cloud nodes,
with knowledge, work, and routing shared through one backbone.**

## A. DONE (merged to main or on the working branch)

| # | Deliverable | Proof |
| --- | --- | --- |
| A1 | Cargo workspace, 8 crates (core/roi/agents/autoloop/store/a2a/web/control) | 61 Rust tests |
| A2 | Thaimart landing + lead/ROI API, brand-safe guards | `sirinx-web` tests |
| A3 | Supabase persistence: web_leads / web_analytics_events / web_pending_work (+pg_notify), RLS | migrations 0001-0002, live |
| A4 | Hermes Command Center imported + 120 Node tests green from root | `apps/dev-dashboard`, `services/dev-control-api` |
| A5 | Release gates hold-by-default + ticket opening + bearer auth + /metrics | `sirinx-control` |
| A6 | A2A mesh + OmniRoute, capabilities from 50 skills | `sirinx-a2a`, live smoke |
| A7 | Brain @ Edge: D1 schema live (APAC) + brain-sync worker written | `infra/cloudflare/brain-sync-worker` |
| A8 | CI workflow + governance phase advance; Docker deploy path (gated) | `.github/workflows/ci.yml`, `Dockerfile` |
| A9 | Agent team scaffolding: **6 department-head sub-agents** (L1–L5 + Kai) + 50 skills consolidated + MIT license. The 47-slot roster exists as runtime schema/plan — only 4 Ronin have production code so far (see A10); expansion tracked as B4 | `.claude/agents/` (6 files), audit 2026-07-19 |
| A10 | **Ronin lead pipeline live** (4 coded agents: Kuranosuke/Jūnai/Kihei/Gengo): lead POST → L1→L2 ROI scoring→L3 decision→L4 auto-enqueues follow-up work | `sirinx-agents::ronin`, web test |
| A11 | Postman collection "SIRINX Platform API" (all 4 surfaces) | collection `e6b5fcae…` |
| A12 | PR #6 merged to main | GitHub |
| A13 | **B1 done** — durable gates: `web_control_gates` (migration 0003, applied live), decisions persist-first, `ControlState::load` overlays store state | `gate_decisions_survive_restart` test |
| A14 | **B2 done** — self-learning loop: `web_failure_events` + `web_lessons` (live), `RecoveryLoop` records failures, consults lessons for bounded guided retries, proposes new lessons from unknown failures | 4 recovery tests incl. cross-run learning |

## B. QUEUED — engineering (in priority order)

| # | Work item | Definition of done |
| --- | --- | --- |
| B3 | R2-parity: port remaining routes from `automation-system-backend` + `sirinx` api-gateway into `sirinx-web` | route inventory diff = empty |
| B4 | Ronin roster expansion: more L1 scanners (FB group, LINE events) + L2 scorers feeding the same pipeline | each agent tested |
| B5 | Node bridge: register hermes-os A2A (:9000) card into OmniRoute; Obsidian vault sync client script for the Mac node | cards visible via /api/a2a/route; notes flow to D1 |
| B6 | R4 web consolidation (marketing/chokma/dashboard apps onto sirinx-web API) | per-app cutover |
| B7 | GhostClaw implementation (contract-first per INTEGRATION_MAP) — **blocked: rotate+purge committed Android keystore first** | quarantine review passed |
| B8 | R5 long tail: mobile apps on central API, archive legacy repos | REPO_AUDIT map all "done" |
| B9 | Telegram bot reads the durable gate (audit 2026-07-19: `services/telegram-command-bot` hardcodes hold and ignores `web_control_gates`) | bot honors DB gate state; dry-run stays default |
| B10 | Skill hygiene (audit 2026-07-19: of 50 skills — 24 stubs, 3 reference dead paths) | every skill either completed, fixed, or marked stub in SKILLS_REGISTRY |

## C. QUEUED — operator decisions (only the human can do these)

| # | Action | Where |
| --- | --- | --- |
| C1 | Enable GitHub Actions (Settings/Billing) → CI turns green | github.com |
| C2 | Run `scripts/mac-revoke-tcc.sh` on mac-mini-m2; record date | `MAC_TCC_PERMISSIONS.md` |
| C3 | Provision `DATABASE_URL`, `CONTROL_API_TOKEN`, `BRAIN_SYNC_TOKEN` in host secret stores | never in repo |
| C4 | Choose Cloudflare tunnel strategy; rotate ghost-claw-os keystore | `NEXT_ACTIONS.md`, `INTEGRATION_MAP.md` |
| C5 | Open gates with tickets in order: deploy → cloudflare_dns → telegram_send → customer_messaging (adaptive_sync independent) | `GO_LIVE_GATE_CHECKLIST.md` |
| C6 | Rotate the Telegram bot token flagged by the 2026-07-19 audit (outside the repo) | operator secret store |

## D. Standing constraints

Gates hold-by-default · no secrets in repo · one import per phase ·
proposal-only writes to Obsidian sources · consent-safe analytics only ·
brand-safe Thaimart copy · every feature ships with tests · Truth
Protocol on every report · Human ตัดสินใจสุดท้าย.

## E. Cadence

Each work session: pick the top unblocked B-item → run the method in
`.claude/skills/sirinx-master-plan/SKILL.md` → land it → update section
A/B here in the same commit.
