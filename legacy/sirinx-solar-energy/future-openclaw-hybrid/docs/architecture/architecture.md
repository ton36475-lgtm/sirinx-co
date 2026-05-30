# OpenClaw Hybrid — Architecture Documentation

**Version:** 1.0
**Company:** Future Multi Agentic
**Last Updated:** 2026-04-02

---

## ภาพรวมระบบ

OpenClaw Hybrid เป็น **Dual-Lane Multi-Agent Architecture** สำหรับ software development ที่ปลอดภัยและมีคุณภาพสูง

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTROL PLANE (OpenClaw)                  │
│  Orchestrator → Planner → Reviewer → Release Manager        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
    ┌──────────▼──────────┐       ┌──────────▼──────────┐
    │   LANE A: Codex      │       │   LANE B: Claude     │
    │   Engineering        │       │   Computer Ops       │
    │                      │       │                      │
    │  ┌─────────────────┐ │       │  ┌─────────────────┐ │
    │  │ Repo Cartograph │ │       │  │ Claude Operator │ │
    │  │ Codex Implement │ │       │  │ (in isolated VM)│ │
    │  │ Codex Test Eng  │ │       │  │ Visual Verifier │ │
    │  └─────────────────┘ │       │  └─────────────────┘ │
    │   VS Code / CLI       │       │   Computer Use API   │
    │   Git Worktree        │       │   Browser + Screenshots│
    └──────────────────────┘       └──────────────────────┘
               │                              │
               └──────────────┬───────────────┘
                    ┌──────────▼──────────┐
                    │  ARTIFACT EXCHANGE   │
                    │  spec.md            │
                    │  tasks.yaml         │
                    │  findings.yaml      │
                    │  review.yaml        │
                    │  approval.yaml      │
                    └──────────────────────┘
```

---

## Core Principles

### 1. One Job = One Branch = One Worktree
ทุก job ได้รับ git branch และ worktree ของตัวเอง ไม่แชร์กับ job อื่น
```
job/2026-001/fix/dashboard-chart → .worktrees/job-2026-001
job/2026-002/feat/solar-roi-v2   → .worktrees/job-2026-002
```

### 2. Single Writer Per Worktree
มีแค่ 1 agent ที่ write ได้ใน worktree หนึ่งชิ้นในเวลาเดียวกัน
ป้องกัน race conditions และ conflicting changes

### 3. Artifact-Based Collaboration
Agents ไม่คุยกันโดยตรง — ส่งข้อมูลผ่าน structured artifacts:
```
Lane A produces → diff, test_results.json, change_summary.md
Lane B produces → findings.yaml, screenshots/, console_errors.json
Control reads → ทั้งหมดเพื่อสร้าง review.yaml, handoff.md
```

### 4. Lane B Isolated VM
Claude Computer ทำงานใน non-persistent, low-privilege VM เสมอ
- ไม่มี secrets access
- ไม่แตะ production
- output เข้าได้เฉพาะ findings + screenshots

### 5. Tiered Approvals
Action ทุกชิ้นมี risk tier:
- **auto_allowed:** docs, comments, low-risk tests
- **reviewer_required:** features, refactors, UI fixes
- **human_required:** production config, auth, payments, migrations, publishing

---

## Job Lifecycle

```
         ┌─────────────────────────────────────────────┐
         │                JOB LIFECYCLE                 │
         └─────────────────────────────────────────────┘

  [Request] ──► pending ──► planning ──► executing ──► reviewing
                                              │              │
                                         [Lane A]       [Lane B]
                                         Implement      Verify UI
                                         Test           Screenshots
                                              │              │
                                              └──────┬───────┘
                                                     │
                                                  reviewing
                                                     │
                                              [approved?]
                                              ┌────┴────┐
                                             Yes       No
                                              │         │
                                          approved   changes_requested
                                              │         │
                                           merged    [loop back]
                                              │
                                          released ✅
```

---

## Agent Roles Summary

| Agent | Lane | Model | Role |
|-------|------|-------|------|
| Orchestrator | Control | claude-opus-4-6 | รับ job, route, track state |
| Planner | Control | claude-opus-4-6 | สร้าง spec.md + tasks.yaml |
| Repo Cartographer | A | codex-1 | Map repo structure + risks |
| Codex Implementer | A | codex-1 | เขียน code ตาม spec |
| Codex Test Engineer | A | codex-1 | เขียน tests + quality checks |
| Claude Operator | B | claude-opus-4-6 | UI verification ใน VM |
| Visual Verifier | B | claude-opus-4-6 | Analyze findings + screenshots |
| Reviewer | Control | claude-opus-4-6 | Final code + findings review |
| Release Manager | Control | claude-opus-4-6 | สร้าง handoff + checklist |

---

## Routing Logic

```
Job Request → Orchestrator → Classify job_type
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
        backend_only          frontend/UI           hybrid_large
              │                     │                     │
         Lane A only          Lane A + B           Lane A + B
         codex_build          cowork_parallel      + human_approval
```

---

## Artifact Flow

```
                    spec.md ──────────────────────────────────┐
                    tasks.yaml ────────────────────────┐      │
                    repo_map.yaml ──────────┐          │      │
                                            │          │      │
                                     Implementer  Test Eng  Operator
                                            │          │      │
                                         diff     results  findings
                                            │          │      │
                                            └──────────┼──────┘
                                                       │
                                                   Reviewer
                                                       │
                                               review.yaml
                                                       │
                                            Release Manager
                                                       │
                                     handoff.md + merge_checklist.md
                                                       │
                                            Human Approval
                                                       │
                                              approval.yaml
                                                       │
                                                   MERGE ✅
```

---

## Security Architecture

### Lane B Isolation
```
┌─────────────────────────────────────────┐
│         ISOLATED VM (Lane B)             │
│                                         │
│  Claude Computer                         │
│  ├── No secrets access                  │
│  ├── No production URLs                 │
│  ├── Allowlist network only             │
│  ├── Low-privilege user (uid 9999)      │
│  ├── Read-only root filesystem          │
│  └── Ephemeral (destroyed after job)   │
│                                         │
│  File Mounts (write-only):              │
│  ├── /output/screenshots/ → host        │
│  └── /output/findings/ → host          │
└─────────────────────────────────────────┘
```

### Network Policy
- **Codex Local:** internet สำหรับ npm/git + local dev servers
- **Codex Cloud:** deny all by default, allowlist สำหรับ package registries
- **Claude Computer:** localhost + staging เท่านั้น, production = BLOCKED

---

## Quality Gates

ทุก job ต้องผ่าน gates เหล่านี้ก่อน merge:

```
1. ✅ Lint: 0 errors
2. ✅ TypeCheck: 0 errors
3. ✅ Unit Tests: all pass + coverage ≥ 70%
4. ✅ Review: status = approved (by reviewer agent)
5. ✅ Findings: critical = 0 (หรือ waived ด้วย reason)
6. ✅ Approval: human sign-off (ถ้า tier = human_required)
```

---

## State Management

Job state เก็บที่ `state/jobs/{job_id}/job_state.yaml`
Audit log เก็บที่ `state/audit.jsonl` (append-only, immutable)

```
state/
├── jobs/{job_id}/
│   ├── job_state.yaml
│   ├── tasks.yaml
│   ├── repo_map.yaml
│   ├── change_summary.md
│   ├── test_results.json
│   ├── handoff.md
│   └── merge_checklist.md
├── findings/{job_id}/
│   ├── findings.yaml
│   └── screenshots/
├── reviews/{job_id}/
│   ├── visual_review.yaml
│   └── review.yaml
├── approvals/{job_id}/
│   └── approval.yaml
├── checkpoints/
└── audit.jsonl
```

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Web App | Next.js 15 + TypeScript + Tailwind |
| Database | Supabase (PostgreSQL) |
| AI Models | Claude Opus 4.6, Codex-1 |
| CI/CD | GitHub Actions |
| Container | Docker (for Claude VM) |
| Notifications | Telegram Bot |
| Runtime | Node.js 20+ |
