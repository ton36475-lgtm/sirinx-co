# Proposal & Preflight — APPROVE_EXTERNAL_LANE_DISPATCH (2026-09-28)

Status: GATED_PREFLIGHT · Round: R28c
Approval Token Presented: `APPROVE_EXTERNAL_LANE_DISPATCH`
Authority: Human Commander (ORDINER / AGENTS.md §3)

## 1. การตรวจประเมินก่อนกระจายงาน (Preflight Verification)

ตามสัญญาการควบคุมใน `config/hermes_multi_node_admission_queue_20260830.json` และ `docs/media/ORDINER_SIRINX_CO_ILLUSTRATION_20260928.md`:
การกระจายงานออกภายนอกเครื่อง (External Lane Dispatch ข้ามเครือข่าย/SSH) มีข้อกำหนดที่ต้องผ่านการตรวจสอบแบบไม่ข้ามขั้นตอน (Non-transitive):

| โหนดเป้าหมาย | บทบาทที่ขอ | สถานะการรับรอง (Admission State) | สิทธิ์ปัจจุบัน |
|---|---|---|---|
| `macmini-m2` | Reviewer / Creative Runner | Local Edge / Current Checkout Active | `read_only_local` + Local WebGL Workspace |
| `vm-server` / PC | Heavy Media & Compute | `IDENTITY_AND_RECEIVER_BINDING_PENDING` | `BLOCKED_PENDING_ADMISSION` |

---

## 2. สิ่งที่เกทนี้ปลดล็อกและข้อจำกัดความปลอดภัย (Safety Boundaries)

### สิ่งที่ได้รับอนุญาตให้ทำได้:
1. การสร้างและส่งมอบ **Leased Task Envelopes** สำหรับ VM Server (เช่น ส่ง job file สำหรับบีบอัดรูปภาพด้วย Sharp / GLTF Draco)
2. การแลกเปลี่ยนข้อมูลผ่าน Staging Quarantine Directory (`.media-staging/_quarantine/`)
3. การอ่านและบันทึกหลักฐานการกระจายงาน (Dispatch Receipt)

### สิ่งที่ยังคงถูกล็อกอย่างเข้มงวด (Still Forbidden):
- ⛔ **ห้ามเรียก Paid API หรือโมเดลภาพโดยไม่มีเกทเฉพาะเจาะจง**:
  ต้องมี `APPROVE_PAID_IMAGE_PROVIDER_CALL` แยกต่างหากสำหรับ Gemini / ChatGPT DALL-E
- ⛔ **ห้าม Git Commit / Git Push / Direct Cloudflare Deploy**:
  ต้องมี `APPROVE_PUSH_TO_MAIN_SIRINX_CO` แยกต่างหาก
- ⛔ **ห้ามส่งคำสั่งรีโมตเชลล์ที่เป็นอันตรายโดยตรงโดยไม่มี handshake 3 heartbeats**

---

## 3. แผนการแจกจ่ายงาน 2 เลนอย่างเป็นรูปธรรม (External Lane Action Packet)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ DISPATCH ACTION PLAN                                                            │
├─────────────────────────┬───────────────────────────────────────────────────────┤
│ เลน Mac mini M2         │ รับผิดชอบ PKG-1 (Motion Tokens & Path B Implementation)│
│ (Active Local)          │ รับผิดชอบ PKG-2 (Three.js WebGL & Shaders)            │
├─────────────────────────┼───────────────────────────────────────────────────────┤
│ เลน VM Server           │ รับผิดชอบ PKG-3 (Batch Image Generation & Dry-run)    │
│ (External Dispatch)     │ รับผิดชอบ PKG-5 (Headless Chrome LCP/CLS Benchmark)   │
└─────────────────────────┴───────────────────────────────────────────────────────┘
```

1. **Step 1:** ตรวจสอบความพร้อมของปลายทาง SSH/Network socket (Read-only probe)
2. **Step 2:** ถ่ายโอนชุดคำสั่งในรูปแบบ Task Envelope ไปยัง VM Server Staging
3. **Step 3:** บันทึก Receipt ยืนยันการกระจายงานลงใน `receipts/`
