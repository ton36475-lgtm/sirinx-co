# Runbook: Production Hotfix

**เวอร์ชัน:** 1.0
**อัพเดต:** 2026-04-02

## เมื่อไรใช้ Runbook นี้
เมื่อพบ bug ใน production ที่ต้องแก้ด่วน
Hotfix ต้องเร็ว แต่ยังต้องปลอดภัย — ไม่มีขั้นตอนใดที่ skip ได้

---

## ⚠️ Hotfix Rules
1. **ห้าม push โดยไม่ผ่าน test** — แม้จะรีบแค่ไหน
2. **ต้องมี rollback plan** ก่อน merge
3. **ต้องมี human approval** เสมอ (hotfix = human_required tier)
4. **แก้ไม่เกิน 5 ไฟล์** ถ้ามากกว่านั้น → ทำ normal job แทน

---

## Step 1: ประกาศ Hotfix

```bash
# แจ้งทีมทาง Telegram ทันที
# @sirinx_warroom_critical

message: "🚨 HOTFIX: {ปัญหา}
ผลกระทบ: {users/feature ที่ได้รับผล}
เริ่มแก้: {datetime}
ETA: {estimate}"
```

---

## Step 2: สร้าง Hotfix Job

```bash
# Job type = hotfix, priority = critical
openclaw job create \
  --type hotfix \
  --priority critical \
  --title "hotfix: {ปัญหาสั้นๆ}" \
  --target-branch main
```

Job ID format: `YYYY-HF-NNN` (เช่น 2026-HF-001)

---

## Step 3: Planner สร้าง Minimal Spec

Hotfix spec ต้องเล็กมาก:
```markdown
# Hotfix: {job_id}
## ปัญหา: {อธิบายสั้นๆ}
## Root Cause: {สาเหตุ}
## Fix: {วิธีแก้}
## Acceptance Criteria:
- [ ] {ปัญหาที่เจอไม่เกิดขึ้นอีก}
- [ ] ไม่มี regression ใน {related features}
## Rollback:
git revert {commit_hash}
```

---

## Step 4: Repo Cartographer — Fast Mode

```bash
# จำกัด scope — ตามที่รู้แล้วว่าปัญหาอยู่ที่ไหน
openclaw run repo_cartographer --job {job_id} --scope "src/path/to/bug"
```

---

## Step 5: Codex Implementer — แก้ Bug

```bash
# worktree จาก main branch โดยตรง
git worktree add .worktrees/job-{job_id} -b job/{job_id}/hotfix/{slug} origin/main
```

Implement → Commit → ตรวจสอบ

---

## Step 6: Test Engineer — Focused Tests

รัน:
1. Tests ที่เกี่ยวข้องกับ fix โดยตรง
2. Smoke tests ของ affected area
3. ไม่ต้องรัน full test suite (แต่ lint + typecheck ต้องผ่าน)

---

## Step 7: Reviewer — Express Review

Reviewer ทำ focused review:
- Security check: ใช่ไหม?
- Fix ถูกต้องไหม?
- Regression risk?
- Rollback plan มีไหม?

ETA: 15 นาที (ปกติ 30-60 นาที)

---

## Step 8: Human Approval — Required

Tony ต้อง approve เสมอ:

```bash
# Telegram notification อัตโนมัติ
# Tony อ่าน handoff.md แล้วสร้าง approval

openclaw approve --job {job_id} --approver tony \
  --action approved \
  --reason "ตรวจสอบแล้ว fix ถูกต้อง rollback plan ชัดเจน"
```

---

## Step 9: Merge และ Monitor

```bash
# Merge hotfix
gh pr merge {pr_number} --squash

# Monitor อย่างน้อย 30 นาที
watch -n 30 'curl -s https://api.sirinx.com/health | jq .status'
```

---

## Step 10: แจ้งทีม

```
✅ HOTFIX RESOLVED: {job_id}
ปัญหา: {อธิบาย}
Fix: {สั้นๆ}
Deploy: {datetime}
Status: ปกติ
```

---

## Rollback Procedure

```bash
# ถ้าพบปัญหาหลัง deploy hotfix:

# 1. Revert commit
git revert {hotfix_commit_hash} -m "Reverting hotfix {job_id}: {reason}"
git push origin main

# 2. แจ้งทีม
# 3. วิเคราะห์ root cause ใหม่
```
