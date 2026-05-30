# Implementation Plan: [ชื่อ Job]
**Job ID:** YYYY-NNN
**วันที่:** YYYY-MM-DD
**สร้างโดย:** planner-agent

---

## Phase Overview

```
Phase 1: Analysis    → Repo Cartographer (30 min)
Phase 2: Implement   → Codex Implementer (Lane A)
Phase 3: Test        → Codex Test Engineer (Lane A)
Phase 4: Verify      → Claude Operator (Lane B) — ถ้า UI
Phase 5: Review      → Reviewer
Phase 6: Release     → Release Manager + Human
```

---

## Task Breakdown

### Phase 2: Implementation Tasks

| Task | Lane | Agent | Complexity | Dependencies |
|------|------|-------|-----------|-------------|
| T01: {task description} | A | implementer | S | - |
| T02: {task description} | A | implementer | M | T01 |
| T03: {task description} | A | test_engineer | S | T02 |

### Phase 4: Verification Tasks (Lane B)

| Task | Lane | Agent | Complexity | Dependencies |
|------|------|-------|-----------|-------------|
| T04: ตรวจสอบ {feature} | B | claude_operator | S | T03 |

---

## Estimated Complexity

| Phase | Estimate | Notes |
|-------|---------|-------|
| Analysis | XS | repo scope ชัดเจน |
| Implement | M | 3-5 files เปลี่ยน |
| Test | S | tests อยู่แล้ว ต้อง update |
| Verify | S | 3 scenarios |
| Review | S | standard review |
| **Total** | **M** | |

Complexity key: XS < 1hr | S 1-2hr | M 2-4hr | L 4-8hr | XL > 1 day

---

## Risk Checkpoints

| Checkpoint | Condition | Action |
|-----------|---------|--------|
| หลัง repo_map | พบ critical files ใน scope | escalate human ทันที |
| หลัง implement | tests fail > 5 | loop: fix → retest |
| หลัง claude_operator | critical findings | block + fix |
| หลัง review | changes_requested | loop: fix → review ใหม่ |

---

## Success Criteria

Job ถือว่าสำเร็จเมื่อ:
1. ✅ ทุก AC ใน spec.md ผ่าน
2. ✅ Tests pass + coverage ≥ 70%
3. ✅ 0 critical visual findings
4. ✅ Review status = approved
5. ✅ Human approval (ถ้า required)
6. ✅ Merged to main
