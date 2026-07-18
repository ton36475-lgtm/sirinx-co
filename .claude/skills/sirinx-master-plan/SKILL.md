---
name: sirinx-master-plan
description: SIRINX Master Plan — แผนงานหลักเดียวของทั้งระบบและวิธีทำงานมาตรฐาน ใช้ทุกครั้งที่เริ่มงานใหม่ วางแผน จัดลำดับ backlog ตรวจสถานะระบบ หรือถามว่า "ทำอะไรต่อ" Triggers on master plan, แผนหลัก, แผนงาน, roadmap, next step, ทำอะไรต่อ, สถานะระบบ, backlog
---

# SIRINX Master Plan Skill

The single source of truth for what the system is, how we work on it,
and what comes next. **Read `MASTER_PLAN.md` at the repo root first** —
it is the live plan; this skill is the method.

## Operating method (every task, no exceptions)

1. **ทวนคำสั่ง** — restate the order; check it against the standing
   directives table in `AGENT_TEAM_PLAN.md`.
2. **Context ก่อน Code** — read the governing docs for the area you
   touch (`MASTER_PLAN.md` → linked doc) and the real files on disk.
3. **Plan ก่อน Implement** — pick ONE approach; big work goes through
   an L3 plan with a Validation Gate section.
4. **Implement** — smallest complete increment; match existing style;
   layer discipline (L1→L2→L3→L4; only L4 edits code).
5. **Verify ก่อนเชื่อ** — `cargo fmt --all --check` →
   `cargo clippy --workspace --all-targets -- -D warnings` →
   `cargo test --workspace` → `npm run check` → `npm run control:test`;
   live-smoke anything with a runtime surface.
6. **Report** — outcomes faithfully; failing = failing (Truth Protocol).
7. **Commit Ready** — descriptive commit on the designated branch;
   update `MASTER_PLAN.md` status; push.

## Hard rules

- Side effects behind gates (deploy, cloudflare_dns, telegram_send,
  customer_messaging, adaptive_sync) NEVER execute — dry-run + escalate.
  Human ตัดสินใจสุดท้าย, gate opens only with a ticket.
- No secrets in the repo, ever. No blanket auto-approve anywhere.
- One import per phase; Very-High-risk repos only after quarantine.
- New capability ⇒ new tests; a feature without tests is not done.

## Where things live

| Question | Doc |
| --- | --- |
| What is the plan / what's next? | `MASTER_PLAN.md` |
| Architecture / crate graph / safety layers | `SYSTEM_ARCHITECTURE.md` |
| Data shapes / APIs / env vars | `SYSTEM_SCHEMA.md` |
| Repo→monorepo migration phases | `RUST_MIGRATION_PLAN.md` |
| Team, departments, standing orders | `AGENT_TEAM_PLAN.md` |
| How systems connect (real files) | `INTEGRATION_MAP.md` |
| Go-live per-gate criteria | `GO_LIVE_GATE_CHECKLIST.md` |
| Deploy commands | `DEPLOY_RUST.md` |
| Mac TCC permissions lifecycle | `MAC_TCC_PERMISSIONS.md` |
