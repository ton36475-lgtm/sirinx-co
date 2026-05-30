# Handoff: YYYY-NNN — [ชื่อ Job]
**สร้างโดย:** release-manager
**วันที่:** YYYY-MM-DD HH:MM (UTC+7)
**Branch:** job/YYYY-NNN/{type}/{slug}
**Risk Level:** low | medium | high
**Approval Tier:** auto_allowed | reviewer_required | human_required

---

## สรุป Job

> 2-3 ประโยค: ทำอะไร, ทำไม, ผลลัพธ์คืออะไร

---

## การเปลี่ยนแปลง

### ไฟล์ที่แก้ไข

| ไฟล์ | ประเภท | สรุปการเปลี่ยน |
|------|--------|--------------|
| `src/...` | modified | ... |
| `tests/...` | modified | ... |

### สรุปสิ่งที่เปลี่ยน

> อธิบาย implementation สั้นๆ — developer ใหม่อ่านแล้วเข้าใจ

---

## ผลการทดสอบ

| Check | ผลลัพธ์ |
|-------|---------|
| Lint | ✅ 0 errors |
| TypeCheck | ✅ 0 errors |
| Unit Tests | ✅ {passed}/{total} passed |
| Coverage | ✅ {n}% (threshold: 70%) |
| CI Checks | ✅ all green |

---

## สรุป Visual Findings (Lane B)

> กรอกถ้ามี UI verification — ระบุ N/A ถ้าไม่มี

| Metric | ค่า |
|--------|-----|
| Scenarios run | {n} |
| Scenarios passed | {n} |
| Critical findings | 0 |
| High findings | 0 |
| Medium findings | {n} (accepted) |

---

## ความเสี่ยงและมาตรการ

| ความเสี่ยง | ระดับ | มาตรการ | Accepted |
|-----------|------|--------|---------|
| {risk} | low/med/high | {mitigation} | ✅/❌ |

---

## วิธี Merge

```bash
# 1. ตรวจ CI ผ่านทั้งหมด
gh pr checks {pr_number}

# 2. Squash merge
gh pr merge {pr_number} --squash \
  --subject "fix(scope): {brief description in Thai}"

# 3. ลบ branch
git push origin --delete job/YYYY-NNN/{type}/{slug}

# 4. ลบ worktree
git worktree remove .worktrees/job-YYYY-NNN
```

---

## แผน Rollback

ถ้าพบปัญหาหลัง merge:

```bash
# Option 1: Revert commit
git revert {commit_hash}
git push origin main

# Option 2: ถ้า deploy ไปแล้ว (Vercel/platform)
# 1. Instant rollback ใน Vercel dashboard
# 2. หรือ redeploy commit ก่อนหน้า
```

**วิธีตรวจสอบว่า rollback สำเร็จ:**
- เปิด {staging_url} — ตรวจว่า feature หายกลับ
- ตรวจ error monitoring

---

## การตรวจสอบหลัง Merge

- [ ] เปิด {url} — ตรวจ feature ทำงานได้
- [ ] ตรวจ Telegram alerts ไม่มี error
- [ ] Monitor error logs 30 นาทีแรก
- [ ] แจ้ง stakeholders ว่า deploy เสร็จ

---

## ลิงก์ที่เกี่ยวข้อง

- Spec: `docs/specs/active/YYYY-NNN/spec.md`
- Review: `state/reviews/YYYY-NNN/review.yaml`
- Findings: `state/findings/YYYY-NNN/findings.yaml` (ถ้ามี)
- PR: https://github.com/{owner}/{repo}/pull/{number}
