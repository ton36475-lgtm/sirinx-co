# OpenClaw Hybrid — Dual-Lane Multi-Agent Architecture

**บริษัท:** Future Multi Agentic
**เวอร์ชัน:** 1.0
**อัพเดต:** 2026-04-02

---

## ภาพรวม

OpenClaw Hybrid คือ **ระบบ Multi-Agent สำหรับ Software Development** ที่แบ่งเป็น 2 Lane ที่ทำงานร่วมกัน:

| Lane | บทบาท | เครื่องมือ |
|------|--------|---------|
| **Lane A: Codex Engineering** | เขียน code, รัน tests, ตรวจสอบคุณภาพ | VS Code / CLI / Cloud Sandbox |
| **Lane B: Claude Computer Ops** | ตรวจสอบ UI/UX ด้วยสายตา, จับ screenshots | Computer Use API ใน isolated VM |
| **Control Plane (OpenClaw)** | Orchestrator, Approval Gate, Audit Log | Claude Opus 4.6 |

---

## Core Principles

```
1. one job = one branch = one worktree
2. single writer per worktree (ห้าม 2 agents เขียนพร้อมกัน)
3. Claude Computer ต้องรันใน low-privilege VM
4. risky actions ต้องได้ human approval
5. ทุก collaboration ผ่าน artifacts (ไม่ใช่ direct communication)
6. findings จาก Claude ส่งกลับ Codex ผ่าน structured contracts
```

---

## โครงสร้าง Project

```
future-openclaw-hybrid/
├── .openclaw/                    # Control Plane Configuration
│   ├── system.yaml               # Master system config
│   ├── models.yaml               # AI model definitions
│   ├── routing.yaml              # Job routing rules
│   ├── approvals.yaml            # 3-tier approval policy
│   ├── agents/                   # 9 agent definitions
│   │   ├── orchestrator.yaml
│   │   ├── planner.yaml
│   │   ├── repo_cartographer.yaml
│   │   ├── codex_implementer.yaml
│   │   ├── codex_test_engineer.yaml
│   │   ├── claude_operator.yaml
│   │   ├── visual_verifier.yaml
│   │   ├── reviewer.yaml
│   │   └── release_manager.yaml
│   ├── prompts/                  # System prompts (ภาษาไทย)
│   ├── schemas/                  # Artifact schemas
│   └── execution/                # Execution policies
│       ├── worktree_policy.yaml
│       ├── vm_policy.yaml
│       └── network_policy.yaml
│
├── .codex/                       # Codex Configuration
│   ├── config.toml
│   ├── skills/                   # 4 reusable skills
│   └── prompts/                  # Codex task prompts
│
├── docs/
│   ├── architecture/             # System architecture docs
│   ├── runbooks/                 # Operational runbooks
│   ├── specs/active/             # Active job specs
│   └── qa/                       # QA checklists
│
├── state/                        # Job state & artifacts
│   ├── jobs/                     # Per-job state + artifacts
│   ├── findings/                 # Lane B findings + screenshots
│   ├── reviews/                  # Review records
│   ├── approvals/                # Approval records
│   ├── checkpoints/              # Pipeline checkpoints
│   └── template_*.yaml/md        # Templates
│
└── tools/
    ├── runners/                  # Runner scripts
    │   ├── run_codex_job.sh
    │   ├── run_claude_vm.sh
    │   └── collect_artifacts.sh
    ├── validators/               # Validation scripts
    └── reporters/                # Status reports
```

---

## เริ่มต้นใช้งาน

### สร้าง Job ใหม่

```bash
# 1. สร้าง job directory
mkdir -p state/jobs/2026-001

# 2. สร้าง tasks จาก template
cp state/template_tasks.yaml state/jobs/2026-001/tasks.yaml
# แก้ไข job_id, title, tasks

# 3. สร้าง spec จาก template
mkdir -p docs/specs/active/2026-001
cp docs/specs/active/template_spec.md docs/specs/active/2026-001/spec.md
# แก้ไข spec

# 4. รัน Codex job
./tools/runners/run_codex_job.sh 2026-001

# 5. (ถ้ามี UI) รัน Claude VM
./tools/runners/run_claude_vm.sh 2026-001

# 6. Collect artifacts
./tools/runners/collect_artifacts.sh 2026-001

# 7. ตรวจสอบ status
./tools/reporters/job_status_report.sh 2026-001
```

---

## Agents ทั้ง 9 ตัว

| Agent | Lane | บทบาท |
|-------|------|--------|
| Orchestrator | Control | รับ job, route, track state |
| Planner | Control | สร้าง spec.md + tasks.yaml |
| Repo Cartographer | A | Map repo structure + risks |
| Codex Implementer | A | เขียน code ตาม spec |
| Codex Test Engineer | A | เขียน tests + quality checks |
| Claude Operator | B | UI verification ใน VM |
| Visual Verifier | B | วิเคราะห์ findings + screenshots |
| Reviewer | Control | Final code + findings review |
| Release Manager | Control | สร้าง handoff + checklist |

---

## Approval Tiers

| Tier | ตัวอย่าง | ต้องการ |
|------|---------|--------|
| auto_allowed | docs, comments, low-risk tests | ไม่ต้องรอ |
| reviewer_required | features, refactors, UI fixes | Reviewer agent |
| human_required | production config, auth, payments, migrations | Tony sign-off |

---

## Quality Gates

ทุก job ต้องผ่านก่อน merge:
- ✅ Lint: 0 errors
- ✅ TypeCheck: 0 errors
- ✅ Unit Tests: all pass + coverage ≥ 70%
- ✅ Reviewer: status = approved
- ✅ Critical findings: 0
- ✅ Human approval (ถ้า human_required tier)

---

## Shared Contracts (Artifacts)

| Artifact | Producer | Consumers |
|---------|----------|-----------|
| spec.md | Planner | Implementer, Test Eng, Operator, Reviewer |
| tasks.yaml | Planner | Orchestrator, Implementer, Test Eng, Operator |
| repo_map.yaml | Repo Cartographer | Implementer, Planner |
| change_summary.md | Implementer | Reviewer, Release Manager |
| test_results.json | Test Engineer | Reviewer, Orchestrator |
| findings.yaml | Claude Operator | Visual Verifier, Reviewer |
| review.yaml | Reviewer | Orchestrator, Release Manager |
| approval.yaml | Human | Orchestrator, Release Manager |
| handoff.md | Release Manager | Human Approver |

---

## Security Architecture

### Lane B VM Isolation
```
Claude Computer ทำงานใน:
- Non-persistent Docker container
- Low-privilege user (uid 9999, no sudo)
- Read-only root filesystem
- Restricted clipboard
- Allowlist-only network (localhost + staging เท่านั้น)
- Production URLs = BLOCKED
- Secrets = BLOCKED
```

---

## คำสั่งที่ใช้บ่อย

```bash
# ดู status jobs ทั้งหมด
./tools/reporters/job_status_report.sh

# Validate artifacts ก่อน review
./tools/validators/validate_artifacts.sh 2026-001

# รัน Codex job
./tools/runners/run_codex_job.sh 2026-001

# รัน Claude VM
./tools/runners/run_claude_vm.sh 2026-001 http://localhost:3002

# Collect artifacts
./tools/runners/collect_artifacts.sh 2026-001
```

---

## Documents

- [Architecture](docs/architecture/architecture.md)
- [Runbook: New Job](docs/runbooks/runbook_new_job.md)
- [Runbook: Claude VM](docs/runbooks/runbook_claude_vm.md)
- [Runbook: Hotfix](docs/runbooks/runbook_hotfix.md)
- [QA Checklist Template](docs/qa/qa_checklist_template.md)

---

## License

Internal use — Future Multi Agentic
