# Auto Team Brain — Telegram Community Chat Layer

## A. ข้อตกลงความเข้าใจ (Assumptions)

นี่คือ **แผนแม่บท** สำหรับเชื่อมทุกทีมเข้ากับ Telegram Community Chat โดยอาศัย foundation ที่มีจริงใน repo:

| Foundation ใน repo | สถานะ |
|---|---|
| `services/telegram-command-bot :8791` (fixed-destination `/send`, Bearer+idempotency, gate-read) | implemented, dry-run |
| `services/dev-control-api A2A/OmniRoute 16 agents / 16 lanes / 35 routes` | implemented |
| 47 Ronin roster + 6 dept heads + 14 principals | logical roles, read-only by default |
| `docs/TELEGRAM_CONTROL_PLANE.md` gate `telegram_send` hold-by-default + `OPS-TG-…` ticket | documented |
| dwb tunnel 2/4 steps done (`tunnel-client`, `tunnel-profile.yaml`), `tunnel_id` + Runtime API key ยังขาด | external-credential-gated |
| ChatGPT plugin config exists but **connector ที่ chatgpt.com ยังปิด** | human-gated |
| GhostClaw skills 9 ตัว ติดตั้งแล้ว (`ghostclaw-*` in `.claude/skills`) | installed |
| `agenticcodingteam` + `sub-agents team` — **ไม่พบใน repo นี้** | ต้องลงทะเบียนแยก |
## I. ลำดับความสำคัญ (priority blocked by resource floor)

| ลำดับ | งาน | สถานะ |
|---|---|---|
| H1 | ระบุ credential requirements (tunnel_id, Runtime API key, ChatGPT channel) | รอดำเนินการของอีก |
| H2 | Design dispatch table layer 0–5 สำหรับ Telegram community chat | แผนแม่บท |
| H3 | Register agenticcodingteam + sub-agents teams | ต้อง submit register |
| H4 | Connect to GPT Luna / dwb tunnel (ตอนนี้เหลือตัวเดียวต่อ) | ใช้ทำงานฝั่ง plugin (paid) |
| H5 | เปิด ChatGPT connector + RemoteDesktop Commander gateway | ต้องอนุญาต |
| H6 | Stakeholder test (human review) | ต้อง expert check

## J. ข้อควรระวัง (security constraints)

- **ไม่ให้ LLM บน cloud เข้าถึง** `control-api:93 routes`, `Chrome debug 9222`, หรือ `control-api 8791/8790` โดยตรง
- **RemoteDesktop Commander** — grantเฉพาะ `tunnel:read` + `tunnel:use` เท่านั้น
- **Customer content** — ไม่ให้ stack อื่น ๆ เข้าถึง
- **Gateway broadcast** — app ทำให้เฉพาะของที่ access ข้อมูลในทีมของตนเอง
- **PSD 10** — ไม่ให้เข้าถึงระบบของบุคคลที่สามโดยไม่ได้รับอนุญาต

## K. งานเท่าที่ทำได้ตอนนี้ (read-only + docs)

1. ✅ เขียน plan นี้ (docs)
2. ✅ ตรวจสอบ foundation ที่มีอยู่ (telegram bot 8791, A2A 16/16, dispatch table)
3. ✅ ตัดผ่าน dwb transcript + ghostclaw fabric (ตัด assumption ที่ไม่มี)
4. ✅ ระบุ requirement ที่ต้องการ human approve
5. ⏳ ยังไม่ทำ: เปิด ChatGPT connector, ใส่ tunnel_id, register agenticcodingteam, เปิด Telegram community channel

**ถ้ามี credential + อนุญาตให้ทำ** นี่คือขั้นตอนต่อไป:
- เชื่อม ChatGPT plugin → dispatch table → telegram bot
- ลงทะเบียน agenticcodingteam + sub-agents teams
- รัน sub-agents team + ทดสอบ round ครั้งแรกใน telegram community chat

EDIT: 0.2.0-pr-mono-002 ของ user จะเพิ่ม foundation ขึ้น ส่วนนี้เป็นส่วนขยายเพิ่มเติม

## L. วิธีใช้ plan นี้

1. อ่านส่วน B → D (architecture)
2. อ่านส่วน E → H (agent teams + human-approved items)
3. อ่านส่วน G (MIT evidence)
4. เลือก H-return action → request human approval → implement

**stop rules:** ไม่เชื่อมต่อ ChatGPT plugin, ไม่ใส่ tunnel_id, ไม่ลงทะเบียน agenticcodingteam, ไม่ส่งข้อความ Telegram community จนกว่าhuman จะอนุญาต + ให้ credentials แล้ว

## M. กลไกควบคุม (engineering rules)

1. **sender allowlist**: อนุญาตเฉพาะ lead ที่observeได้ (current: `1791407811528_d0y61`)
2. **subject grammar**: `BRAIN:` / `ASSIGN:` / `R??` / `REP:` / `PLAN:` / `AGENT-`
3. **dispatch table**: ทุก item ต้องผ่าน stage 0–5 เหมือนกัน (ห้าม fast-path)
4. **ack policy**: timeout 10′ STALLED → 30′ FREEZE → unclaim, ถ้าไม่ converge อ่าน `team_create_outcome`
5. **fail-closed**: unknown subject = reject, ไม่กำหนดให้ทำงาน
6. **audit**: logging all dispatch tiers และบล็อกช่องทางที่ไม่ได้รับอนุญาต

> ขอบเขต: สิ่งที่ทำได้ตอนนี้ = เอกสาร การออกแบบ routing/dispatch, อ่าน foundation, วาง inventory. สิ่งที่ต้อง ask human (APPROVE_EXTERNAL_LANE_DISPATCH) = เปิด ChatGPT connector, ใส่ `tunnel_id` + Runtime API key, register `agenticcodingteam` + sub-agents team, เปิดห้อง chat ภายนอก, ถ่าย snapshot ระบบเพื่อเชื่อม