---
name: kimi-k3-swarm
description: รัน Kimi Code CLI (model K3) เป็น swarm worker ของ SIRINX mesh ที่ effort สูงสุด ใช้เมื่อต้อง setup/แก้ Kimi CLI, เพิ่ม K3 lane, หรือให้ Kimi รับงานจากคิวกลาง Triggers on kimi, k3, moonshot, kimi cli, swarm worker
---

# Kimi K3 Swarm Worker

ทำให้ Kimi Code CLI ทำงานเป็น worker เต็มตัวของ mesh — claim งานจากคิว
เดียวกัน ใช้แผนเดียวกัน (`MASTER_PLAN.md`) กติกาเดียวกัน (`CODEX_HANDOFF.md`).

## Prerequisites (fail-closed — ครบทั้งสองข้อก่อน ไม่ครบ = dry-run เท่านั้น)

1. **Approval doc ลงนามแล้ว**: `docs/approvals/MODEL_ROUTING_KIMI_K3.md`
   ต้องมีบรรทัด `APPROVED_BY:` ที่ operator กรอกเอง (governance ของ
   dev-control-api บังคับ approval ก่อน provider call ทุกครั้ง)
2. **Key อยู่นอก repo**: `MOONSHOT_API_KEY` ใน secret store ของเครื่อง
   (Keychain/env) — ห้าม commit, ห้าม paste ในแชท

## Setup บน MacminiSirinx (~/.zshrc)

```bash
# Kimi K3 at max effort — Anthropic-compatible endpoint ของ Moonshot
kimi-k3() {
  ANTHROPIC_BASE_URL="https://api.moonshot.ai/anthropic" \
  ANTHROPIC_AUTH_TOKEN="$MOONSHOT_API_KEY" \
  ANTHROPIC_MODEL="kimi-k3" \
  CLAUDE_CODE_EFFORT_LEVEL="max" \
  command claude "$@"
}
# หรือถ้าใช้ Kimi CLI ตัวจริง: kimi --model k3 --effort max
# (เช็ค model id ที่ใช้ได้จริงด้วย: kimi models list)
```

## เข้า swarm (ทุก session)

1. ลงทะเบียน card:

```bash
curl -s -X POST $CONTROL/api/a2a/sync \
  -H "Authorization: Bearer $CONTROL_API_TOKEN" -H "content-type: application/json" \
  -d '{"node":{"id":"agent:kimi-k3","name":"Kimi K3 worker","capabilities":["coding","long-context-256k","rust-build","node-test"],"endpoint":"","priority":2},"knownWorkIds":[]}'
```

2. Claim งานจาก `GET $CONTROL/api/pending-work` (set `claimed_by:
   agent:kimi-k3` ก่อนเริ่ม) แล้วทำตาม method ใน
   `.claude/skills/sirinx-master-plan/SKILL.md` ทุกขั้น
3. Verification chain เต็มก่อนอ้าง done; รายงาน + อัปเดต `MASTER_PLAN.md`
   ใน commit เดียวกัน

## การใช้ K3 ใน swarm — จุดที่เหมาะ

- งาน long-context (K3 อ่านทั้ง workspace ได้ในรอบเดียว): audit ข้าม repo,
  B10 skill hygiene, migration ไฟล์ใหญ่
- compete-and-pick: ให้ K3 กับ Claude/Codex แข่งทำ diff เดียวกัน แล้วคน
  เลือกตัวที่ชนะ (pattern จาก GitHub landscape research §6)

## ขอบเขต (เหมือน worker ทุกตัว ไม่มีข้อยกเว้นให้ K3)

- Gated actions → dry-run + escalate เสมอ; เปิด gate เป็นเรื่องของมนุษย์
- ทุก provider call มีค่าใช้จ่าย — ต้องมี approval doc (ข้อ 1) ก่อนเสมอ
- ห้าม secrets ใน repo; ทุก feature มี tests; Truth Protocol
