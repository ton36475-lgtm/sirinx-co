# Agent Jobs Integration Board — All Agents, One View

Date: 2026-07-21 (Asia/Bangkok) · Compiled by: Claude Cowork review session
Sources: `MASTER_PLAN.md` (A1–A33, B, C), `AGENT_TEAM_PLAN.md`, `CODEX_HANDOFF.md`, `reports/runtime/*` (latest receipts), ronin cards 34/40, cmux observation 2026-07-21 20:06.
Status: `READ_ONLY_DIGEST / NO_ADMISSION / PRODUCTION_HOLD` — this board reports jobs; it grants nothing.

## 1. Runtime agents (cmux + registered surfaces) — current job and state

| Agent | Current job | State / latest receipt | Blocked by |
|---|---|---|---|
| **Codex** (single source writer) | Queue receipts A28–A33: B10 surface inventory, external intake, provenance, cleanup review, A33 migration-0007 semantics | branch `agent/b1-b2-command-center` @ `1f05814`, 5 ahead, dirty | disk floor; PR review; migration 0007 absent |
| **Hermes agent / CLI** | A26/A27 work-report drafts (`DRAFT_ONLY`), Command Center ops | drafts in `reports/runtime/hermes-a2{6,7}-…` | **HTTP 401** — z.ai key expired (renew + `hermes setup`, human) |
| **OpenCode** | ECC `orchestrate-codex-worker.sh` hardening plan (1/25 tests); one bounded write receipt `opencode-handshake-20260720-001` (A17) | awaiting approval for Tier-A edit | canonical location undecided (script lives in vendored `affaan-m__ECC` intake, not sirinx-co) |
| **AGY / Antigravity** | Newly registered 16th sync agent + lane + routes + tmux plan (this session); extended into team-runtime-bridge / ai-team-pairing projections in the same tree | `registered-unverified-runtime`; no execution-principal card yet | needs role/principal decision before any write duty |
| **Claude Cowork** (this session) | Systems review, AGY registration, blocked-goal regex repair, this board | `A2A_LIVESYNC_SYSTEMS_REVIEW_20260721.md`; control suite 356/356 after merge with other writers | sandbox blocked by disk |
| claude-code, copilot-cli, pi, droid, manus, hermes-one, kimi-code, openclaw, telegram-bot, a2a-sync, codex-app, claude-cowork lanes | Configured OmniRoute lanes only | `configured-unverified-runtime` per admission contract | evidence + B11 admission path |

## 2. 47 Ronin sub-agents — how they hold jobs

The 47 roles are **passive specifications** (A18), not processes: L1 Perception (01–16, no writes) → L2 Analysis (17–25) → L3 Decision (26–35, plans only) → L4 Coordination (36–43, writes) → L5 Research (44–47, advisory), Kai = customer drafts only. ห้ามข้ามชั้น. Runtime enforcement lives in `sirinx-agents` (Rust); live today: the lead pipeline A10/A16 (scanners 01–04 → scorers 17–19 → L3 decision → L4 follow-up enqueue).

A2A adaptive-live-sync duties as the roster assigns them:

| Role | Layer | Runtime principal | Job |
|---|---|---|---|
| Ronin 34 — A2A/Telegram Integration Authority | L3 | codex | decide A2A card/auth mapping, Telegram draft/idempotency/approval-link behavior; define SSRF/duplicate/auth negative tests |
| Ronin 40 — A2A/Telegram Adapter Maker | L4 | opencode | build ONE bounded adapter artifact (A2A conformance or Telegram dry-run) under exact lease, maker-checker, no live activation |

So "handshake live sync" flows per the org: **34 specs it → 40 builds one artifact → verify chain → human gate**. No agent may skip that lane.

## 3. Shared integration plane (what connects all jobs)

Shared queue `web_pending_work` (`GET/POST /api/pending-work`) is the ONE work source — currently requires C3 secrets (`DATABASE_URL`) to be live. A2A transport: Rust `/api/a2a/sync` (in-process smoke only, A6) + Node evidence plane (`/api/a2a-sync`, `/api/omniroute*`, 16 agents/16 lanes/25 routes, everything `reported-not-admitted` by design). Telegram lane fail-closed behind the durable OPS-TG gate. Live sync becomes real only through B5 → B10/B11 (authority kernel + one connector canary) after migration 0007.

## 4. Single-file blocker chain (everything queues behind this)

1. **Disk**: A33 read-back 9,938,592 KiB free — *worse* than morning (14.4 GiB); A32 proved no in-repo cleanup candidate alone reaches the 15 GiB floor (`BOOTSTRAP_REVIEW_BLOCKED`) → operator must free space **outside the repo's candidate set** (Downloads, old repos/target dirs elsewhere, Docker, models).
2. **Commit the working tree** via single-writer/PR flow (A34 row prepared in `MASTER_PLAN.md`).
3. **Hermes key**: renew z.ai key, `hermes setup` (human; never in repo).
4. **C1–C5 operator items** (GitHub Actions, TCC revoke, C3 secrets, tunnel choice, gate tickets in order).
5. Then top unblocked B-items: B9/B10 (migration 0007 + refusal surfaces) → B11 canary → B5 Hermes card admission.

## 5. Team working agreement (restated from governance, applies to every agent incl. AGY)

One plan (`MASTER_PLAN.md`), one method (sirinx-master-plan SKILL), one writer (Codex lease) — other agents review, spec, or produce bounded artifacts only. ทวนคำสั่ง → Context → Plan → Implement → Verify → Report → Commit; Truth Protocol; gates dry-run only; Human ตัดสินใจสุดท้าย.
