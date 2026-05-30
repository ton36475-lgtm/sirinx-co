# [ชื่อ Feature / Bug Fix]
**Job ID:** YYYY-NNN
**วันที่:** YYYY-MM-DD
**สร้างโดย:** planner-agent
**ประเภท:** feature | bugfix | hotfix | refactor
**Priority:** critical | high | medium | low

---

## ที่มาและบริบท

> อธิบาย context — ทำไมจึงต้องทำงานนี้? เกี่ยวข้องกับ business objective อะไร?
> ใครได้รับผลกระทบ? ความถี่ที่ปัญหาเกิด?

---

## ปัญหาที่พบ

> อธิบายปัญหาอย่างชัดเจน:
> - User เจออะไร? (actual behavior)
> - เกิดเมื่อไร? (trigger conditions)
> - ผลกระทบคืออะไร? (impact: users affected, revenue, etc.)

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected:** ...
**Actual:** ...

---

## แนวทางแก้ไข

> อธิบาย solution ที่เลือก และเหตุผล

### วิธีที่เลือก
...

### Trade-offs
| ข้อดี | ข้อเสีย |
|------|--------|
| ... | ... |

### วิธีอื่นที่ไม่เลือก (และเหตุผล)
- **Option B:** ... → ไม่เลือกเพราะ ...

---

## Acceptance Criteria

> ทุก AC ต้อง testable — "ทำงานได้ถูกต้อง" ❌ → "หน้า load ภายใน 2 วินาที" ✅

- [ ] **AC-1:** {criteria testable ข้อ 1}
- [ ] **AC-2:** {criteria testable ข้อ 2}
- [ ] **AC-3:** {criteria testable ข้อ 3}
- [ ] **AC-4 (Edge case):** {กรณีพิเศษ}

---

## นอกเหนือ Scope

> ระบุชัดเจนว่าอะไรที่ **ไม่ทำ** ใน job นี้ — ป้องกัน scope creep

- ไม่รวม: {สิ่งที่ไม่ทำ}
- ไม่รวม: {feature ที่เกี่ยวข้องแต่ทำ job อื่น}
- Defer to: job-{YYYY-NNN} — {เหตุผล}

---

## ความเสี่ยง

| ความเสี่ยง | โอกาสเกิด | ผลกระทบ | มาตรการ |
|-----------|----------|---------|--------|
| {risk 1} | low/medium/high | low/medium/high | {mitigation} |
| {risk 2} | ... | ... | ... |

---

## Assumptions

> สมมติฐานที่ใช้ในการออกแบบ — ถ้า assumption ผิด ต้องกลับมา re-plan

- สมมติว่า: {assumption 1}
- สมมติว่า: {assumption 2}

---

## Dependencies

> อะไรที่งานนี้ต้องการ ก่อนจะเริ่มได้?

- [ ] {dependency 1} — status: done/pending
- [ ] {dependency 2} — status: done/pending

---

## Notes for Codex

> ข้อมูลทางเทคนิคที่ Codex Implementer ควรรู้

- ไฟล์หลักที่ต้องแก้: `src/...`
- Pattern ที่ใช้ใน codebase: {pattern}
- ระวัง: {gotcha หรือ trap}
