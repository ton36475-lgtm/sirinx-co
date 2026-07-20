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
| A15 | **B9 done** — Telegram commander center reads live gate state via `gate-status.mjs` (`GET /api/gates`, bearer auth), fails closed (assumes hold) on any unreachable/error case instead of hardcoding a string | `gate-status.test.mjs` (7 tests) |
| A16 | Model routing skill for the 47 Ronin mesh: `sonnet5` (default) / `glm52` (cointh.com proxy) / `cf-workers-ai` lanes, wired via existing `AgentCard`/OmniRoute capability tags — no new dispatcher, no key ever written to repo, non-default lanes gated on operator-signed approval doc; failover order documented (sonnet5 → opus-4-8 hard-coding → fable-5 QA/reset → approved-only glm52/cf-workers-ai) | `.claude/skills/ronin-model-routing/SKILL.md`, `docs/approvals/MODEL_ROUTING_RONIN_TEAM.md` |
| A17 | **B12 done** — shared work queue records real completion timestamps: `web_pending_work` migration 0004 (`completed_at`/`completed_by`), `Store::complete_pending_work` (server clock, not caller-supplied), `POST /api/pending-work/:id/complete`, completed items drop off the live queue in both backends | 2 `sirinx-store` tests + 2 `sirinx-control` route tests |
| A18 | Cloudflare Telegram gateway worker scaffold: receives Telegram webhooks, live-queries gate state (same fail-closed contract as B9), queues the computed reply into D1 (`telegram_outbox`) — never calls Telegram's sendMessage, `telegram_send` stays hold. Not deployed (no CF credentials in this session; deploy stays gated) | `infra/cloudflare/telegram-gateway-worker/` (10 vitest tests) |
| A19 | `ghostclaw-manager` consolidated index skill — cross-references (does not duplicate) the master plan/architecture/model-routing/telegram-gateway docs above; explicitly notes this is a skill name only, not a company rebrand (declined 2026-07-20) | `.claude/skills/ghostclaw-manager/SKILL.md` |
| A20 | **B15 done** — durable A2A peer registry: `web_agent_cards` (migration 0005), `Store::{load_agent_cards,upsert_agent_card}` (`sirinx-store` now depends on `sirinx-a2a` for `AgentCard`, no cycle), `a2a_sync` persists before updating in-memory OmniRoute, `ControlState::load` hydrates registered peers same as gates. Found by the 2026-07-20 L1–L5 department-head review (Gengo/L4): OmniRoute was in-memory-only, the exact restart-loss bug B1 already fixed for gates | `agent_cards_survive_restart` test |

## B. QUEUED — engineering (in priority order)

| # | Work item | Definition of done |
| --- | --- | --- |
| B3 | R2-parity: port remaining routes from `automation-system-backend` + `sirinx` api-gateway into `sirinx-web` | route inventory diff = empty |
| B4 | Ronin roster expansion: more L1 scanners (FB group, LINE events) + L2 scorers feeding the same pipeline. 2026-07-20 L1 review (Kuranosuke): under-specified as written (no per-scanner contract, no I/O-vs-pure decision); scoped starter identified — implement `Kin'emon` (Ronin #16, codename-only today) as a second pure L1 agent, LINE-webhook-shape → `LeadDraft`, mirroring Kuranosuke's pattern | each agent tested |
| B5 | Node bridge: register hermes-os A2A (:9000) card into OmniRoute; Obsidian vault sync client script for the Mac node. Unblocked by B15 (registry now durable) | cards visible via /api/a2a/route; notes flow to D1 |
| B6 | R4 web consolidation (marketing/chokma/dashboard apps onto sirinx-web API) | per-app cutover |
| B7 | GhostClaw implementation (contract-first per INTEGRATION_MAP) — **blocked: rotate+purge committed Android keystore first** | quarantine review passed |
| B8 | R5 long tail: mobile apps on central API, archive legacy repos | REPO_AUDIT map all "done" |
| B10 | Skill hygiene (audit 2026-07-19: of 50 skills — 24 stubs, 3 reference dead paths). 2026-07-20 L3 review (Kihei): **highest-priority unblocked item** — no external deps, no secrets, no gate | every skill either completed, fixed, or marked stub in SKILLS_REGISTRY |
| B11 | Ronin model-lane rollout: get operator sign-off on `MODEL_ROUTING_RONIN_TEAM.md`, rotate the GLM-5.2 key that was pasted in chat 2026-07-19 before it's used anywhere, then register the first Ronin on a non-default lane | approval block filled + key rotated + one `AgentCard` live on `model:glm52` or `model:cf-workers-ai` |
| B13 | Wire a real Telegram bot token + `wrangler deploy` for `telegram-gateway-worker`, then build the actual send path once `telegram_send` is opened — until then replies only ever land in `telegram_outbox` | webhook registered with Telegram, gate open with ticket, first real send reviewed |
| B14 | Third-party dependency intake checklist (2026-07-20 L3 recommendation): a short doc — license + maintenance activity + problem-it-solves + dependency footprint + secrets/network-access needs — so a future "just install X" request has a fast, safe lane instead of case-by-case refusal. First candidate to run it against: `github.com/Graphify-Labs/graphify` (declined-pending-review since 2026-07-20) | checklist doc exists; Graphify evaluated against it |
| B16 | Lesson-frequency analysis (2026-07-20 L2 recommendation, Jūnai): `web_lessons`/`web_failure_events` currently accumulate with nothing reading them for insight. Add a small pure function (sibling to `sirinx-roi`) ranking lessons by `hits` + recency, surfaced to L3 as a ranked list — advisory only, no auto-action | function + tests, wired to a read-only report, no gate touched |
| B17 | Local open-weight model lane (2026-07-20 L5 recommendation, Mimura): a properly-licensed offline model (not "uncensored") run locally, e.g. via llama.cpp/Ollama on a Mac-side node, for read-only analysis/reverse-engineering tasks — no network egress, no customer data. Scope as a 4th `ronin-model-routing` lane, same governance (no model artifact in repo, license recorded, approval doc before live use) | new lane documented + approved, license recorded, zero network egress verified |
| B13 | Wire a real Telegram bot token + `wrangler deploy` for `telegram-gateway-worker`, then build the actual send path once `telegram_send` is opened — until then replies only ever land in `telegram_outbox` | webhook registered with Telegram, gate open with ticket, first real send reviewed |

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
