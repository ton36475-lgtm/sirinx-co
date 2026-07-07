# Codex Test Fix Prompt

## คำสั่ง
รัน quality checks สำหรับ job `{job_id}` และแก้ไข failing tests

## Context ที่มี
- **worktree:** `.worktrees/job-{job_id}`
- **branch:** `job/{job_id}/{type}/{slug}`
- **failed tests:** `state/jobs/{job_id}/test_failures.yaml` (ถ้ามี)

## ขั้นตอน

### 1. รัน Lint
```bash
cd .worktrees/job-{job_id}
npm run lint 2>&1
```
ถ้ามี errors → autofix ก่อน: `npm run lint -- --fix`

### 2. รัน TypeCheck
```bash
npm run typecheck 2>&1
```
ถ้ามี errors → อ่าน error messages และแก้ให้ครบ

### 3. รัน Tests
```bash
npm test -- --coverage 2>&1
```

### 4. วิเคราะห์ Failures
สำหรับแต่ละ failing test:
- อ่าน error message
- ตรวจสอบว่าเป็น test bug หรือ implementation bug
- ถ้าเป็น test bug → แก้ test
- ถ้าเป็น implementation bug → flag ให้ Implementer

### 5. สร้าง test_results.json
บันทึกผลลัพธ์ที่ `state/jobs/{job_id}/test_results.json`

## กฎที่ต้องยึดถือ
- ห้าม skip failing tests
- ห้ามแก้ production code เพียงเพื่อให้ test ผ่านแบบ workaround
- Coverage ต้องไม่ต่ำกว่า 70% สำหรับ changed files
- ต้อง 0 lint errors และ 0 typecheck errors ก่อนรายงาน "passed"

## Output
- แก้ไข test files (committed ใน worktree)
- `state/jobs/{job_id}/test_results.json` — สถานะ final
