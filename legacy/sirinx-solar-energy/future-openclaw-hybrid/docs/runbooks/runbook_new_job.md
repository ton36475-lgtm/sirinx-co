# Runbook: เริ่ม Job ใหม่

**เวอร์ชัน:** 1.0
**อัพเดต:** 2026-04-02

## เมื่อไรใช้ Runbook นี้
เมื่อต้องการ implement feature ใหม่, แก้ bug, หรือทำ refactor

---

## Step 1: เตรียม Job Request

สร้างไฟล์ job request หรือส่งข้อความไปยัง Orchestrator:

```yaml
# หรือส่งแบบ text
title: "แก้ไข {ปัญหา} ใน {module}"
description: |
  {อธิบายปัญหา}
  {expected behavior}
  {actual behavior}
job_type: feature|bugfix|hotfix|refactor
priority: high|medium|low
affected_areas: [dashboard, auth, calculator, ...]
```

---

## Step 2: Orchestrator สร้าง Job

```bash
# ผ่าน CLI (ถ้ามี)
openclaw job create --title "..." --type bugfix

# หรือ manual
cp state/template_tasks.yaml state/jobs/2026-XXX/tasks.yaml
# แก้ job_id และรายละเอียด
```

Orchestrator จะ:
1. สร้าง `job_id` (format: YYYY-NNN)
2. สร้าง `state/jobs/{job_id}/job_state.yaml`
3. Classify → route ไปยัง Planner

---

## Step 3: Planner สร้าง Spec

Planner อ่าน job request และสร้าง:
- `docs/specs/active/{job_id}/spec.md`
- `state/jobs/{job_id}/tasks.yaml`

**ตรวจสอบก่อนอนุมัติ:**
- [ ] Acceptance criteria ชัดเจนและ testable
- [ ] Out-of-scope ระบุชัด
- [ ] Lane assignment ถูกต้อง (A/B/both)

---

## Step 4: สร้าง Git Worktree

```bash
# Orchestrator จะทำให้อัตโนมัติ หรือ manual:
git worktree add .worktrees/job-{job_id} -b job/{job_id}/{type}/{slug}

# ตรวจสอบ
git worktree list
```

---

## Step 5: Lane A — Codex Implementation

Orchestrator assign งานให้ Codex Implementer:
```
Input:  spec.md + tasks.yaml + repo_map.yaml
Output: diff (committed) + change_summary.md
```

Monitor ที่: `state/jobs/{job_id}/job_state.yaml`

---

## Step 6: Lane A — Test Engineer

หลัง Implementer เสร็จ, Test Engineer รัน quality checks:
```
Input:  diff + tasks.yaml
Output: test_results.json
```

ถ้า tests fail → Implementer แก้ → Test Engineer รันใหม่

---

## Step 7: Lane B — Claude Computer (ถ้า UI involved)

```bash
# รัน Claude VM (ดู runbook_claude_vm.md สำหรับรายละเอียด)
./tools/runners/run_claude_vm.sh {job_id}
```

Claude Operator:
1. เปิด staging URL
2. ทำตาม test_scenarios.md
3. สร้าง findings.yaml + screenshots

---

## Step 8: Review

Reviewer อ่าน artifacts ทั้งหมดแล้วสร้าง review.yaml

**ถ้า status = changes_requested:**
→ Loop กลับ Step 5

**ถ้า status = approved:**
→ ไป Step 9

---

## Step 9: Release Manager สร้าง Handoff

```
Input:  review.yaml + test_results.json + findings.yaml (ถ้ามี)
Output: handoff.md + merge_checklist.md
```

---

## Step 10: Human Approval (ถ้าต้องการ)

ถ้า approval tier = `human_required`:

1. Tony รับ Telegram notification
2. อ่าน `state/jobs/{job_id}/handoff.md`
3. สร้าง approval:

```bash
cp state/template_approval.yaml state/approvals/{job_id}/approval.yaml
# แก้ไข: approver, action, reason, signature
```

---

## Step 11: Merge

```bash
# ตาม merge_checklist.md
gh pr merge {pr_number} --squash --subject "fix(dashboard): แก้ chart overflow บน mobile"

# ลบ branch
git push origin --delete job/{job_id}/...

# ลบ worktree
git worktree remove .worktrees/job-{job_id}
```

---

## Troubleshooting

| ปัญหา | สาเหตุ | วิธีแก้ |
|------|------|--------|
| Worktree lock ค้าง | Agent crash ระหว่างทำงาน | ลบ `.openclaw.lock` ใน worktree |
| Test fail หลัง implement | Implementation bug หรือ outdated test | ดู test_failures.yaml |
| Claude VM timeout | Staging ช้าหรือ scenario ซับซ้อน | เพิ่ม max_session_minutes ใน vm_policy |
| Artifact missing | Agent ก่อนหน้า crash | ตรวจ state/jobs/{job_id}/ และ re-run step นั้น |
