# Codex Implement Prompt

## คำสั่ง
คุณได้รับ task จาก OpenClaw Orchestrator สำหรับ job `{job_id}`

## Context ที่มี
- **spec.md:** `docs/specs/active/{job_id}/spec.md`
- **tasks.yaml:** `state/jobs/{job_id}/tasks.yaml`
- **repo_map.yaml:** `state/jobs/{job_id}/repo_map.yaml`
- **worktree:** `.worktrees/job-{job_id}`
- **branch:** `job/{job_id}/{type}/{slug}`

## Task ที่ต้องทำ
Task ID: `{task_id}`
Description: `{task_description}`
Acceptance Criteria:
{acceptance_criteria}

## Affected Files (จาก repo_map)
{affected_files}

## กฎที่ต้องยึดถือ
1. ทำงานใน worktree path: `.worktrees/job-{job_id}` เท่านั้น
2. แก้เฉพาะไฟล์ใน affected_files — ถ้าต้องแก้ไฟล์นอก scope → หยุดและ report
3. ห้าม hardcode secrets ทุกกรณี
4. Commit ทุก logical unit ด้วย conventional commit
5. สร้าง change_summary.md หลังเสร็จ

## เมื่อเสร็จ
ส่ง artifact:
- git diff (committed ใน worktree)
- `state/jobs/{job_id}/change_summary.md`

## เมื่อพบอุปสรรค
ถ้า implementation ทำไม่ได้ตาม spec → อธิบายใน change_summary.md section "Issues ที่พบ"
ห้ามดัดแปลง spec เอง
