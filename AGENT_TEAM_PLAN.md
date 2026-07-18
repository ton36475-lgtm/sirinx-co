# SIRINX Virtual Company — 47 Ronin Sub-Agent Team Plan

The 47 Ronin architecture now exists at three reinforcing levels:

1. **Runtime (Rust)** — `sirinx-agents` enforces layers/budgets/routing
   in code; `sirinx-autoloop` gates side effects; `sirinx-control` holds
   the release gates and the shared pending-work queue.
2. **Sub-agents (Claude Code)** — `.claude/agents/` defines the
   department heads below; any Claude Code session on this repo can
   delegate to them.
3. **Process (this document)** — the company operating procedure.

## Org chart (departments and heads)

| Department | Head (sub-agent) | Ronin | Mandate | Writes? |
| --- | --- | --- | --- | --- |
| L1 Perception | `ronin-l1-perception-lead` (Kuranosuke) | 01–16 | collect/scan | no |
| L2 Analysis | `ronin-l2-analysis-lead` (Jūnai) | 17–25 | score/insight | no |
| L3 Decision | `ronin-l3-decision-lead` (Kihei) | 26–35 | plans/specs | plans only |
| L4 Coordination | `ronin-l4-coordination-lead` (Gengo, COO) | 36–43 | implement/verify | yes |
| L5 Research | `ronin-l5-research-lead` (Mimura) | 44–47 | advisories | no |
| Customer | `kai-customer-liaison` (Kai) | — | drafts to customers | drafts only |

Work flows L1 → L2 → L3 → L4 only (ห้ามข้ามชั้น); L5 advises any
department; Kai never touches operations. Cross-node work is registered
on the shared queue (`POST /api/pending-work` → `web_pending_work`,
Postgres NOTIFY fan-out).

## Standard operating procedure (ทวนคำสั่งก่อนดำเนินการ)

Every engagement starts by restating the order and checking it against
the standing directives below, then: Context → Plan → Implement →
Verify → Review → the human decides anything gated.

## Standing directives — full recap of this migration's orders

| # | Order (as given) | Status |
| --- | --- | --- |
| 1 | Refactor/migrate all repos to Rust, one monorepo, target www.sirinx.co, full auto agentic systems | Phases R1–R3 landed in `sirinx-co`; R-phases tracked in `RUST_MIGRATION_PLAN.md` |
| 2 | Thaimart x SIRINX landing per taste-governed spec (brand-safe, one H1, consent-safe analytics) | served at `/thaimart-sirinx`, guards asserted by tests |
| 3 | Phase R2: Supabase/Postgres instead of in-memory | `sirinx-store`, schema live on project SIRINX, RLS on |
| 4 | Auto-approve requests on Mac mini M2 | blanket auto-click declined; scoped alternatives delivered (settings allowlist, `ApprovalGate::Allowlist`, TCC runbook) |
| 5 | macOS TCC grants temporary — revoke after build window | `MAC_TCC_PERMISSIONS.md`, revoke marked **pending** |
| 6 | All agents run in one mux session | `scripts/agents-mux.sh` (tmux-compatible, MUX_BIN switch) |
| 7 | Sweep all work, intake from every agent incl. Hermes Command Center, run the last migration | `WORK_INTAKE_REPORT.md`; dashboard + control API imported; `sirinx-control` crate |
| 8 | Extend architecture end-to-end (premium full-stack): CI, auth, metrics, shared queue, Docker | this change set (see `DEPLOY_RUST.md`, `.github/workflows/ci.yml`) |
| 9 | 47 Ronin as sub-agent virtual company with department heads, recap all orders before real execution | this document + `.claude/agents/` |

## Permanent guardrails (apply to every department)

- Deploy, Cloudflare DNS, Telegram send, customer messaging, and
  AdaptiveSync stay behind held gates; opening a gate needs a human
  ticket (`sirinx-control`).
- No secrets in the repo, ever.
- Failing checks are reported as failing (Truth Protocol).
- Human ตัดสินใจสุดท้าย.
