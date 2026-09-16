---
name: sirinx-unified-os
description: >
  SIRINX Unified Operating System — Master AI OS สำหรับควบคุม 47 Ronin agents ทั้งหมด
  จัดการ workflow, orchestration, session state, และ system-wide commands
  Triggers on: sirinx os, unified os, master os, ระบบหลัก, จัดการ agents, orchestrate
---

> **Repo scope note (added 2026-07-20, B10 skill hygiene audit):** this skill's routes/files/architecture (Next.js `apps/sirinx-web`, OpenClaw, `/warroom`-style routes, etc.) describe the sibling **`sirinx-solar-energy`** repo, not this repo (`sirinx-co`, a Rust-crate monorepo). Treat file paths and route names below as reference material for that other codebase, not as claims about what exists here. For `sirinx-co`'s actual architecture, see `SYSTEM_ARCHITECTURE.md`, `docs/RONIN_ROSTER.md`, and `.claude/skills/ghostclaw-manager/SKILL.md`.

# SIRINX Unified OS — v1.0

**Mission:** Master Operating System สำหรับควบคุมและประสาน 47 Ronin multi-agent system ทั้งหมดบน SIRINX Solar Platform

---

## Core Capabilities

1. **Agent Orchestration** — สั่งงาน agents ข้ามชั้น (L1→L5) ผ่าน orchestrator.ts
2. **Session Management** — จัดการ context, memory, และ state ระหว่าง agents
3. **System Commands** — `/health`, `/status`, `/deploy`, `/rollback`
4. **Cross-Agent Coordination** — Gengo #35 (Orchestrator) ประสานงานทุก layer
5. **Error Recovery** — ตรวจจับและ recover จาก agent failures อัตโนมัติ

## Architecture

```
SIRINX Unified OS
├── Command Router        ← รับคำสั่งจาก WARROOM/CEO
├── Agent Registry        ← 47 agents + Kai chatbot
├── Event Bus             ← publishEvent() system
├── Layer Coordinator     ← L1 Perception → L5 Research
└── State Manager         ← Supabase persistence
```

## Key Commands

| Command | Description |
|---------|-------------|
| `/os status` | แสดงสถานะ agents ทั้งหมด |
| `/os deploy <agent>` | Deploy/restart specific agent |
| `/os health` | Full system health check |
| `/os logs <agent>` | ดู logs ของ agent |
| `/os rollback` | Rollback to last stable state |

## Integration Points

- **OpenClaw Gateway**: `http://localhost:3002/api/openclaw/run`
- **Supabase**: agent_runs, agent_states tables
- **Event Bus**: `src/agents/event-bus.ts`
- **Orchestrator**: `src/agents/layer4-coordination/orchestrator.ts`

## Status

🚧 **Stub** — Core commands defined, ต้องการ full implementation ของ state persistence และ cross-agent messaging
