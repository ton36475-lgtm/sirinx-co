# Runbook: Claude Computer VM Operations

**เวอร์ชัน:** 1.0
**อัพเดต:** 2026-04-02

## เมื่อไรใช้ Runbook นี้
เมื่อต้องรัน Claude Computer Operator สำหรับ UI verification

---

## Prerequisites

- Docker installed และ running
- staging environment accessible ที่ `localhost:3002` หรือ `staging.*`
- `state/jobs/{job_id}/tasks.yaml` มี verify_tasks
- `docs/specs/active/{job_id}/test_scenarios.md` มีอยู่

---

## Step 1: ตรวจสอบ Prerequisites

```bash
# ตรวจ Docker
docker ps

# ตรวจ staging
curl -s http://localhost:3002 | grep -c "html"

# ตรวจ test scenarios
ls docs/specs/active/{job_id}/test_scenarios.md
```

---

## Step 2: รัน Claude VM

```bash
./tools/runners/run_claude_vm.sh {job_id}
```

Script จะ:
1. Build Docker image `claude-computer-isolated`
2. Mount output directories
3. Set staging URL env var
4. Start VM session
5. Pass `test_scenarios.md` เข้า VM
6. Claude Operator เริ่มทำงาน

---

## Step 3: Monitor Session

```bash
# ดู VM logs
docker logs claude-vm-{job_id} -f

# ดู findings ขณะ session ยังรันอยู่
ls -la state/findings/{job_id}/
```

---

## Step 4: Collect Artifacts

เมื่อ VM session เสร็จ (หรือ timeout):

```bash
./tools/runners/collect_artifacts.sh {job_id}
```

ตรวจสอบ:
```bash
ls state/findings/{job_id}/
# ต้องมี: findings.yaml, screenshots/, console_errors.json

# ตรวจ findings
cat state/findings/{job_id}/findings.yaml
```

---

## Step 5: Visual Verifier

Orchestrator จะ trigger Visual Verifier อัตโนมัติ
หรือ manual:

```bash
openclaw run visual_verifier --job {job_id}
```

Output: `state/reviews/{job_id}/visual_review.yaml`

---

## Troubleshooting

### VM ไม่ start
```bash
# ตรวจ Docker daemon
systemctl status docker

# ตรวจ port conflicts
docker ps | grep claude-vm

# Build image ใหม่
docker build -t claude-computer-isolated ./tools/docker/claude-vm/
```

### Screenshots ไม่ออกมา
```bash
# ตรวจ mount permissions
ls -la state/findings/screenshots/

# ตรวจ disk space
df -h state/
```

### VM timeout ก่อนเสร็จ
1. ตรวจว่า staging ช้าหรือเปล่า
2. เพิ่ม `max_session_minutes` ใน `.openclaw/execution/vm_policy.yaml`
3. แยก test_scenarios ออกเป็น 2 batch

### findings.yaml ว่างเปล่า
1. ตรวจ console_errors.json — อาจมี JS error ใน staging
2. ตรวจว่า staging URL accessible จาก VM
3. ดู VM logs สำหรับ error messages

---

## Security Checklist ก่อนรัน VM

- [ ] staging_url ชี้ไปยัง localhost หรือ staging เท่านั้น (ไม่ใช่ production)
- [ ] ไม่มี production credentials ใน environment
- [ ] Docker network isolated
- [ ] Output mounts ชี้ไปยัง `state/findings/` เท่านั้น

---

## Post-Session Cleanup

```bash
# ลบ VM container
docker rm claude-vm-{job_id}

# Archive session log
mv state/audit/vm-sessions/{job_id}.log state/audit/archive/
```
