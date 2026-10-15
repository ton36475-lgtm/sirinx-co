# Motion Architecture Decision — SIRINX.CO (2026-09-28)

Status: PROPOSAL_FOR_COMMANDER · Round: R28b · Package: PKG-1 (Motion Architecture)
Context: `/Users/sirinx/SIRINXDev/sirinx-co/docs/media/ORDINER_SIRINX_CO_ILLUSTRATION_20260928.md`

## 1. ที่มาและปัญหาปัจจุบัน (Root Cause)

ในปัจจุบัน เว็บไซต์ `www.sirinx.co` มีความไม่สม่ำเสมอของ Motion Architecture:
- **13 หน้าย่อย** (เช่น `/solar-carport/:slug`, `/solutions`, `/pricing`, `/about`): import ตรงจาก `framer-motion` มี animation, spring interactions, scroll triggers เต็มรูปแบบ
- **4 ไฟล์หลัก** (`Home.tsx`, `Layout.tsx`, `HeroSlideshow.tsx`, `FloatingChatWidget.tsx`): import จาก `@/lib/static-motion.tsx`
- **ปัญหาของ `static-motion.tsx`**: ทำหน้าที่เป็น **SHIM** ที่ทำการ strip ค่า `initial`, `animate`, `exit`, `variants`, `whileInView`, `whileHover` ออกหมด แล้ว render เป็น `<div>` หรือแท็กเปล่าธรรมดา ทำให้หน้าแรก (Home) ซึ่งเป็นหน้าด่านสำคัญที่สุดในการนำเสนอแบรนด์ไม่มี motion เลยแม้แต่น้อย

---

## 2. การเปรียบเทียบ 2 แนวทาง (Path A vs Path B)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MOTION STRATEGY COMPARISON TABLE                                                      │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ มิติเปรียบเทียบ          │ ทาง A: คง static-motion     │ ทาง B: เปิด Bounded Motion    │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Bundle Size (Home Entry) │ ประหยัด ~41.6 kB (gzip)     │ เพิ่ม ~41.6 kB (gzip framer)  │
│ LCP (Largest Contentful) │ สูงสุด (~0.9s - 1.2s)       │ ควบคุมได้ (~1.1s - 1.4s)      │
│ Visual Engagement        │ นิ่ง แข็ง ขาดความมีชีวิตชีวา│ มีชีวิตชีวา ลื่นไหล พรีเมียม  │
│ Conversion Intent        │ อ่านข้อมูลเชิงสถิติได้เร็ว  │ ดึงดูดสายตาตามเส้นทางสายตา    │
│ prefers-reduced-motion   │ 100% compliant โดยปริยาย    │ ต้อง wrap ด้วย token/hook     │
│ ความเสี่ยงทางเทคนิค      │ ศูนย์                       │ เสี่ยงกระตุกถ้า animation ซ้อน│
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### ทาง A: คง `static-motion` ไว้เหมือนเดิม
- **ข้อดี:** 
  - LCP ดีเลิศ (ไม่มี JS runtime animation มารบกวน main thread ช่วง critical render)
  - รองรับเครื่องสเปกต่ำและเครือข่ายมือถือ 3G/4G ได้สูงสุด
- **ข้อเสีย:** 
  - หน้าแรกดูแห้ง แข็งกระด้าง ไม่สะท้อนภาพลักษณ์ Clean-Tech AI Energy ชั้นนำ
  - ขาด Micro-interactions บนปุ่ม CTA และ Floating Widget

### ทาง B: เปิด Motion บน Home + Layout คุมด้วย `shared/motionTokens.ts` + LCP Guard
- **ข้อดี:**
  - ได้ประสบการณ์ระดับ World-Class Motion Graphic ตามมาตรฐาน Art Engineering
  - ใช้ `shared/motionTokens.ts` ควบคุมความเร็วให้อยู่ในกรอบปลอดภัย (Micro: 150-250ms, Hero: <= 1.2s)
  - สอดคล้องกับอีก 13 หน้าที่เปิดใช้งาน `framer-motion` อยู่แล้ว
- **เงื่อนไขความปลอดภัย (Strict Invariants for Path B):**
  1. *LCP Guard:* ห้ามใส่ `initial={{ opacity: 0 }}` บนข้อความ Headline H1 หรือ Hero Image หลัก เพื่อป้องกัน LCP Delay
  2. *Accessibility First:* เช็ค `window.matchMedia('(prefers-reduced-motion: reduce)')` เสมอ หากผู้ใช้เปิดไว้ให้ bypass เป็น static render ทันที
  3. *Main Thread Budget:* ใช้เฉพาะ transform (translate, scale) และ opacity เท่านั้น ห้าม animate layout properties (width, height, top, left)

---

## 3. คำเตือนด้านธุรกิจ (Commercial Warning)

> **หน้า Home (`/`) คือเส้นทางแปลงเงินหลัก (Primary Conversion Funnel)** ของ SIRINX
> การเปลี่ยนแปลงใด ๆ บนหน้านี้ส่งผลต่อยอดส่งฟอร์ม Lead และการติดต่อผ่าน LINE OA
> ตามคำสั่งของ ORDINER: **ยังไม่มีการแตะต้องหรือแก้ไข `static-motion.tsx` ในรอบนี้**
> การตัดสินใจเลือกทาง A หรือ ทาง B ขึ้นอยู่กับ Human Commander พิจารณาอนุมัติ

---

## 4. สิ่งที่ส่งมอบในรอบนี้ (Delivered in PKG-1)
1. `apps/public-web/shared/motionTokens.ts` — Token ความเร็ว (Duration), Cubic Bezier (Easing), และ Spring Dynamics
2. `apps/public-web/shared/motionTokens.test.ts` — Unit test 8 ข้อ ผ่าน 100% ทดสอบขอบเขตความปลอดภัยของ animation timing
3. เอกสารฉบับนี้ (`docs/3d/MOTION_DECISION_20260928.md`) สำหรับเสนอ Commander
