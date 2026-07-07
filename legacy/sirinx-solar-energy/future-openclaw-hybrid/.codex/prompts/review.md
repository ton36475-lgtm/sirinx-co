# Codex Review Prompt

## คำสั่ง
ทำ preliminary review สำหรับ job `{job_id}` ก่อนส่งให้ reviewer agent

## Context ที่มี
- **worktree:** `.worktrees/job-{job_id}`
- **branch:** `job/{job_id}/{type}/{slug}`
- **spec.md:** `docs/specs/active/{job_id}/spec.md`
- **test_results.json:** `state/jobs/{job_id}/test_results.json`

## ขั้นตอน

### 1. Get Diff
```bash
cd .worktrees/job-{job_id}
git diff main...HEAD --stat
git diff main...HEAD
```

### 2. Quick Automated Checks

**Sensitive files:**
```bash
git diff main...HEAD --name-only | grep -E "\.env|secret|password|migration|production"
```

**Debug code:**
```bash
git diff main...HEAD | grep "^\+" | grep -E "console\.log|debugger"
```

**Scope check:**
```bash
git diff main...HEAD --name-only
# เปรียบกับ repo_map.affected_files
```

### 3. Acceptance Criteria Coverage
อ่าน spec.md → แต่ละ AC ตรวจว่ามี implementation และ test

### 4. สร้าง preliminary_review.md
บันทึกที่ `state/jobs/{job_id}/preliminary_review.md`

## กฎที่ต้องยึดถือ
- ถ้าพบ sensitive files → หยุดทันทีและรายงาน Orchestrator
- ถ้าพบ debug code → flag (ไม่ block แต่ reviewer ต้องรู้)
- ถ้า AC ไม่ครบ → flag เป็น changes_required

## Output
- `state/jobs/{job_id}/preliminary_review.md`
