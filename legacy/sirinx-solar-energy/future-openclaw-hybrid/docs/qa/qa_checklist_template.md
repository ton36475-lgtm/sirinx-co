# QA Checklist Template
**Job ID:** YYYY-NNN
**Date:** YYYY-MM-DD
**QA Reviewer:** {reviewer name / agent}

---

## Pre-Review Checklist

### Artifacts Received
- [ ] spec.md — มีและ complete
- [ ] tasks.yaml — มีและ match spec
- [ ] git diff — committed ใน worktree
- [ ] change_summary.md — มีและ accurate
- [ ] test_results.json — passed: 0 failures
- [ ] findings.yaml — มี (ถ้า UI job)
- [ ] screenshots/ — มี evidence สำหรับทุก finding

---

## Code Quality Checklist

### Correctness
- [ ] Logic ถูกต้อง — ไม่มี obvious bugs
- [ ] Edge cases handled — null, empty, boundary values
- [ ] Error handling ครอบคลุม async operations
- [ ] ไม่มี off-by-one errors

### Code Style
- [ ] Follow existing conventions ของ codebase
- [ ] ชื่อตัวแปร/function สื่อความหมาย
- [ ] ไม่มี dead code หรือ unused imports
- [ ] ไม่มี console.log ใน production code
- [ ] ไม่มี TODO ที่ไม่มี ticket reference

### Security
- [ ] ไม่มี hardcoded credentials/API keys
- [ ] User input ผ่าน validation/sanitization
- [ ] ไม่มี SQL injection risks
- [ ] ไม่มี XSS risks
- [ ] Auth checks ยังทำงานถูกต้อง
- [ ] ไม่มี sensitive data ใน logs

### TypeScript
- [ ] ไม่มี `any` types โดยไม่จำเป็น
- [ ] Props/interfaces ถูก typed
- [ ] Return types ระบุ (สำหรับ functions สำคัญ)

---

## Test Coverage Checklist

### Unit Tests
- [ ] ทุก acceptance criteria มี test อย่างน้อย 1 ตัว
- [ ] Happy path ถูก test
- [ ] Edge cases ถูก test (null, empty, error)
- [ ] Coverage ≥ 70% สำหรับ changed files
- [ ] ไม่มี tests ที่ skip โดยไม่มีเหตุผล

### Integration
- [ ] ไม่มี mock ที่ไม่ reflect ความเป็นจริง
- [ ] External dependencies ถูก mock อย่างเหมาะสม

---

## Visual QA Checklist (สำหรับ UI jobs)

### Desktop (1920x1080)
- [ ] Layout ถูกต้อง ไม่มี overflow
- [ ] Typography อ่านออก
- [ ] Colors ถูกต้องตาม design system
- [ ] Interactive elements ทำงาน (hover, click, focus)

### Mobile (375x812)
- [ ] Responsive layout ไม่แตก
- [ ] Touch targets ขนาดเพียงพอ (min 44px)
- [ ] ไม่มี horizontal scrollbar โดยไม่ตั้งใจ

### Accessibility
- [ ] ปุ่มมี accessible names
- [ ] Form fields มี labels
- [ ] Error messages อ่านออกได้
- [ ] Color contrast adequate

---

## Acceptance Criteria Verification

| AC | Implementation | Test | Visual | Status |
|----|---------------|------|--------|--------|
| AC-1 | ✅/❌ | ✅/❌ | ✅/❌/N/A | ✅/❌ |
| AC-2 | ✅/❌ | ✅/❌ | ✅/❌/N/A | ✅/❌ |
| AC-3 | ✅/❌ | ✅/❌ | ✅/❌/N/A | ✅/❌ |

---

## Issues Found

| # | Severity | Description | Location | Action |
|---|---------|-------------|---------|--------|
| 1 | critical/high/medium/low | ... | file:line | block/fix/waive |

---

## Final Verdict

- [ ] ✅ **APPROVED** — พร้อม merge
- [ ] ⚠️ **APPROVED WITH CONDITIONS** — merge ได้หลังทำ: {conditions}
- [ ] ❌ **CHANGES REQUESTED** — ต้องแก้: {items}
- [ ] 🚫 **BLOCKED** — รอ human decision: {reason}

**QA Sign-off:**
Reviewer: ___________
Date: ___________
