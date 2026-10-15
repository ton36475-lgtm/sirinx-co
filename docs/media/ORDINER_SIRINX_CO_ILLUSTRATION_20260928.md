# ORDINER — SIRINX.CO ILLUSTRATION & MOTION WORK 2026-09-28

> ชุดคำสั่งเดียวกันนี้ ถูกส่งให้ **ทุกเลนเหมือนกันทุกตัวอักษร**
> อ่านจากต้นจนถึงท้ายก่อนลงมือ ถ้าติด gate ให้เขียนเป็น proposal แล้วหยุด

```
═══════════════════════════════════════════════════════════════════
repo: /Users/sirinx/SIRINXDev/sirinx-co        branch: main
issued-by: jcode · 2026-09-28 · gates consumed by issuer: NONE
═══════════════════════════════════════════════════════════════════

MISSION
  สร้างภาพประกอบ + motion + 3D WebGL สำหรับ www.sirinx.co
  ให้สวย เร็ว เข้าถึงง่าย และตัวเลขทุกอันถูกต้องตามข้อมูลจริง

PRE-FLIGHT (ห้ามข้าม)
  1. cd /Users/sirinx/SIRINXDev/sirinx-co && git status
  2. อ่าน AGENTS.md ของ repo
  3. ⛔ ห้าม commit · ห้าม push · ห้าม deploy — หยุดที่ working tree
     (push = deploy เพราะ Pages เป็น direct-upload)
  4. ⛔ ห้ามแก้ไฟล์ที่ไม่อยู่ใน OWNERSHIP ของคุณ
  5. ⛔ ห้ามเรียก paid API / image model — ต้องมี gate ชื่อก่อน
  6. ⛔ ห้ามอ่านหรือพิมพ์ค่า secret ลงไฟล์ ลอก หรือรายงาน
  7. ถ้าติด gate → เขียน proposal + หยุด อย่ารอเอง อย่าเดา

⚠ IN-FLIGHT — มีเลนอื่นกำลังเขียนอยู่ ห้ามทำซ้ำ
  components/three/EnergyFlowShader.ts      (R28a)
  components/three/SolarHeroScene.tsx       (R28a)
  components/HeroSlideshow.tsx              (R28a แก้ไว้)
  docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md (R28a)
  client/src/hero-solar-core/              (ยัง untracked)
  → ถ้าคุณจะทำ PKG-2/PKG-3 ให้ถือว่า "ต่อยอดของเดิม" ห้ามสร้างชื่อซ้ำ
  → PKG-1 / PKG-4 / PKG-5 ไม่ชนกับใคร ทำได้ทันที

───────────────────────────────────────────────────────────────────
PKG-1  MOTION — ปิดช่องแตกของ motion architecture
───────────────────────────────────────────────────────────────────
  ปัญหาที่ต้องแก้:
    Home.tsx / Layout.tsx / HeroSlideshow.tsx / FloatingChatWidget.tsx
      import จาก @/lib/static-motion
    แต่ static-motion.tsx เป็น SHIM ที่ strip animate/initial/
    variants/whileInView ออกทั้งหมด แล้ว render <div> เปล่า
    → หน้าแรก + layout + hero = ไม่มี motion เลย
    ขณะที่ 13 หน้าอื่น import framer-motion ตรง ๆ → มี motion

  ส่งมอบ:
  a) shared/motionTokens.ts — easing / duration / spring tokens จุดเดียว
     ที่ทั้งเว็บอ่านจากที่นี่
  b) shared/motionTokens.test.ts — เทสต์ที่พิสูจน์แดงได้จริง
     (เปลี่ยน token ให้อยู่นอกช่วง → test ต้อง FAIL
      ถ้าทำแล้วยังเขียวอยู่ แปลว่าเทสต์ไม่มีความหมาย)
  c) docs/3d/MOTION_DECISION_20260928.md — เสนอ 2 ทางเป็นตัวเลข
       ทาง A: คง static-motion (LCP ดี, เข้าถึงง่าย, แต่หน้าแรดู้ไม่มีชีวิต)
       ทาง B: เปิด motion บน Home+Layout คุมด้วย token +
             prefers-reduced-motion + LCP guard
     ใส่ตัวเลขคาด/ผลของแต่ละทาง และคำเตือนว่า Home คือเส้นทางแปลงเงิน
  d) ⛔ ห้ามแก้ static-motion.tsx ในรอบนี้ รอ Commander เลือกก่อน

───────────────────────────────────────────────────────────────────
PKG-2  HERO 3D — ทบทวน + เติมสิ่งที่ขาด
───────────────────────────────────────────────────────────────────
  ของเดิมที่ต้องต่อยอด (ไม่ใช่ทำใหม่):
    components/three/SolarHeroScene.tsx  (R28a)
    components/three/EnergyFlowShader.ts (R28a)
    client/src/hero-solar-core/         (ยัง untracked, 404 บน prod)
    ProvinceSolarScene.tsx · ProvinceYieldChart3D.tsx  ← ต้องเป็นมาตรฐาน

  ⛔ ปัญหาที่ต้องแก้ก่อนเรียกว่า "เสร็จ":
    ไม่มีเทสต์ไหน import SolarHeroScene หรือ EnergyFlowShader เลย
    → "82 tests passed" เป็นของเดิม ไม่ได้ครอบงานใหม่
    → เขียวที่ไม่ครอบงาน = ไม่ใช่หลักฐาน

  ส่งมอบ:
  a) เทสต์ที่พิสูจน์แดงได้จริง ครอบ SolarHeroScene + EnergyFlowShader
     อย่างน้อย: mount/unmount คืนทรัพยากร, DPR cap, pause ตอน
     document.hidden, reduced-motion, context lost
  b) ตรวจข้อกำหนดเดียวกับ 2 คอมโพเนนต์เดิม:
     dynamic import + lazy · DPR cap 2 + re-cap on resize ·
     หยุด rAF เมื่อ document.hidden · หยุดเมื่อ canvas ออกนอก viewport ·
     จัดการ webglcontextlost/restored · dispose() idempotent ·
     prefers-reduced-motion → 1 เฟรมนิ่ง · canvas aria-hidden + ข้อความสำรอง
  c) ระบุว่า hero-solar-core/ จะถูก merge เข้า SolarHeroScene หรือทิ้ง
     และลบส่วนที่ทิ้ง — ห้ามมี 2 ชุดที่แข่งกันเอง
  d) ยังไม่ wire หน้าแรกจนกว่า PKG-5 จะวัด LCP จริง

───────────────────────────────────────────────────────────────────
PKG-3  AI IMAGE — ChatGPT Image / Gemini    [⛔ GATED]
───────────────────────────────────────────────────────────────────
  ⛔ ห้ามเรียก provider ใด ๆ จนกว่าจะได้
     APPROVE_PAID_IMAGE_PROVIDER_CALL
     (Commander สั่งใช้เครื่องมือนี้ แต่ยังไม่ได้ตั้งงบ/เพดาน)
  ✅ ทำได้ตอนนี้โดยไม่กินเงิน: เขียน pipeline แบบ DRY-RUN

  ส่งมอบ:
  a) docs/media/generate-illustrations.mjs
       - --dry-run เป็นค่าเริ่มต้น · --execute ต้องมี gate
       - อ่าน key จาก env ตอนรันเท่านั้น ห้าม hardcode ห้าม log ค่า
       - เขียนลง .media-staging/_quarantine/ เท่านั้น
         ⛔ ห้ามเขียนตรงเข้า client/public/
       - manifest ทุกไฟล์: prompt, model, seed, cost, sha256, timestamp
  b) docs/media/prompts/ — prompt ทุกชิ้นผูกกับข้อมูลจริง
       - yield/rank จาก shared/provinceEnergyData.ts
       - ตำแหน่งดวงอาทิตย์จาก shared/sunMath.ts
     ⛔ ห้ามวาดตัวเลขขึ้นเอง · ห้ามอ้างผลติดตั้งที่ไม่มีจริง
     ทุกภาพที่อ้างผลผลิตต้องมี disclaimer ติดมาด้วย
  c) ทบทวน docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md ของ R28a
     ว่าตอนนี้ยังไม่ผูกกับข้อมูลจริง — เติมส่วนที่ขาด

───────────────────────────────────────────────────────────────────
PKG-4  COVERAGE — แผนที่ภาพประกอบทั้งเว็บ
───────────────────────────────────────────────────────────────────
  ส่งมอบ: docs/media/ILLUSTRATION_COVERAGE_20260928.md
  อ่าน route table จริงจากโค้ด อย่าเดา แล้วทำตาราง:
      route | ภาพปัจจุบัน | 3D | motion | alt/คำบรรยาย | ช่องว่าง
  เกณฑ์:
    - alt อ่านออกโดยไม่ต้องเห็นภาพ (WCAG + AEO)
    - ตัวเลขใน alt ตรงกับ shared/provinceEnergyData.ts เป๊ะ
    - ชี้หน้าที่ไม่มีภาพเลย เรียงตามความสำคัญ

───────────────────────────────────────────────────────────────────
PKG-5  PERF/A11Y — วัดจริงในเบราว์เซอร์
───────────────────────────────────────────────────────────────────
  ส่งมอบ: docs/media/WEBGL_PERF_BUDGET_20260928.md
  วัดบน production จริง (read-only) แล้วใส่ตัวเลขจริง:
    - LCP หน้าจังหวัด ก่อน/หลัง 3D โหลด
    - CLS · INP · frame rate ตอน canvas ทำงาน
    - ผลของ prefers-reduced-motion
    - พฤติกรรมเมื่อ disable WebGL / context lost
    - mobile (ARM) ต่างจาก desktop อย่างไร
  ⚠ "zero LCP penalty" เป็นคำกล่าว ไม่ใช่คำวัด
     ถ้าวัดไม่ได้ ให้เขียน "ยังไม่ได้วัด" ⛔ ห้ามเดา

───────────────────────────────────────────────────────────────────
PKG-6  ART ENGINEERING BRIEF
───────────────────────────────────────────────────────────────────
  ส่งมอบ: docs/media/ART_ENGINEERING_BRIEF_20260928.md
  art direction · palette · typographic scale · motion grammar
  (easing/duration/stagger) · 3D camera language · illustration style rules ·
  accessibility rules · asset budget
  ⛔ ทุกข้อต้องชี้ไฟล์จริงในโค้ดเป็นหลักฐาน

───────────────────────────────────────────────────────────────────
DEFINITION OF DONE (ทุก package)
───────────────────────────────────────────────────────────────────
  □ ไม่มี commit / push / deploy
  □ ไม่แตะไฟล์นอก OWNERSHIP
  □ ไม่มี secret ในไฟล์/ลอก/รายงาน
  □ โค้ด → มีเทสต์ และพิสูจน์ว่าเทสต์แดงได้จริง
    (ยืนยันไม่ได้ว่าจะ fail เมื่อโค้ดผิด → เขียนว่า unverified)
  □ report ใน reports/ + receipt ชื่อเดียวกันใน receipts/
  □ .sha256 sidecar ครบทั้งคู่
  □ ระบุ side effects ตามจริง:
     network · provider_calls · deploy:false · secrets_read:false

═══════════════════════════════════════════════════════════════════
GATES — แต่ละข้อต้องมี named approval แยกกัน
═══════════════════════════════════════════════════════════════════
  APPROVE_PAID_IMAGE_PROVIDER_CALL       → PKG-3 execute
  APPROVE_MEDIA_PROMOTE_TO_PUBLIC        → quarantine → public/
  APPROVE_NODE_ADMISSION_MACMINI_M2      → เปิดเลน macmini ใน A2A
  APPROVE_NODE_REGISTRATION_VM_SERVER    → ลงทะเบียน VM เป็นโหนด
  APPROVE_EXTERNAL_LANE_DISPATCH         → ส่งงานออกเครื่อง (SSH)
  APPROVE_PUSH_TO_MAIN_SIRINX_CO         → commit + push (push = deploy)
  APPROVE_LANE_PROMOTION_TEST_COVERAGE   → CL-2 (ค้างอยู่)
  APPROVE_LANE_PROMOTION_REGISTER_TICKET → CL-4 (ค้างอยู่)
  ⚠ การอนุมัติ "ทั้งหมด" ไม่นับเป็นการอนุมัติข้อใดข้อหนึ่ง
═══════════════════════════════════════════════════════════════════
```

═══════════════════════════════════════════════════════════════════
ADDENDUM — COMMANDER DECISION 2026-09-28 06:23
═══════════════════════════════════════════════════════════════════
DECISION: PKG-1 = ทาง B (เปิด motion บน Home + Layout)

แต่มีเงื่อนไข: LCP baseline ยังวัดไม่ได้ (browser bridge รอเปิด extension
ด้วยมือ) → หน้าแรกคือเส้นทางแปลงเงินหลัก จึงห้ามเปิดจริงจนกว่าจะวัดได้

ทำต่อได้เลย (ปลอดภัย):
  B1. เพิ่ม `shared/motionFlags.ts` — flag เดียว `MOTION_HOME_ENABLED`
      default = false พร้อมเหตุผลในคอมเมนต์
  B2. แก้ `client/src/lib/static-motion.tsx` ให้เป็น shim แบบมีเงื่อนไข:
      - MOTION_HOME_ENABLED === false → พฤติกรรมเดิม (strip props) ไม่เปลี่ยน
      - MOTION_HOME_ENABLED === true  → re-export จาก framer-motion จริง
      ค่า default ต้องทำให้ production ที่ยังไม่มี flag เป็น static เหมือนเดิม
  B3. ใส่ wrapper ใน Home.tsx + Layout.tsx เฉพาะส่วนที่จะ animate
      ทุกจุดต้องอ่าน duration จาก shared/motionTokens.ts ห้าม hardcode
  B4. เทสต์ BOTH ทาง (red-proof ต้องพิสูจน์ได้จริง):
      - flag=false → ไม่มี animation props ตกลง DOM
      - flag=true  → props ถูกส่งต่อ
      ถ้าเปลี่ยนแล้วเทสต์ยังเขียว = เทสต์ไม่มีความหมาย
  B5. รายงาน + receipt + sidecar (basename ไม่ต้องใส่ path)

⛔ ห้าม flip flag เป็น true — รอ PKG-5 วัด LCP จริงแล้ว Commander สั่ง
⛔ ห้าม commit / push / deploy
⛔ ห้ามแตะ ProvinceSolarScene / ProvinceYieldChart3D / SolarHeroScene /
        EnergyFlowShader / HeroSlideshow — ของเลนอื่น
═══════════════════════════════════════════════════════════════════
