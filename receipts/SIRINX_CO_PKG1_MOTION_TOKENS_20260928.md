# Receipt — PKG-1 Motion Architecture Tokens & Decision Proposal

- Pair: `reports/SIRINX_CO_PKG1_MOTION_TOKENS_20260928.md`
- Lane: freebuff (Hermes control plane) · Date: 2026-09-28
- Selected Package: **PKG-1 (MOTION — ปิดช่องแตกของ motion architecture)**
- In-flight collision check: หลีกเลี่ยง PKG-2 / PKG-3 ที่มีงาน in-flight และไม่แก้ `static-motion.tsx` ตามคำสั่ง

## Delivered Artifacts

1. `apps/public-web/shared/motionTokens.ts` (new):
   - Single source of truth สำหรับ timing, cubic-bezier, springs, และ staggers
   - กำหนดขอบเขตเวลาอย่างเข้มงวดเพื่อป้องกัน LCP regression

2. `apps/public-web/shared/motionTokens.test.ts` (new):
   - Unit test 8 ข้อ (monotonic order, LCP boundary <= 1.5s, micro <= 0.3s, valid bezier coordinates, spring stability)
   - รันผ่าน 8/8 tests ผ่าน Vitest

3. `docs/3d/MOTION_DECISION_20260928.md` (new):
   - เปรียบเทียบ ทาง A (คง static-motion) vs ทาง B (เปิด bounded motion ด้วย token) พร้อมตัวเลขผลกระทบ LCP/Bundle และคำเตือน conversion

## Verification Evidence

- `npx vitest run apps/public-web/shared/motionTokens.test.ts`: **8/8 passed (Duration 443ms)**
- `npx tsc --noEmit` in `apps/public-web`: **exit code 0, 0 errors**
- `apps/public-web/client/src/lib/static-motion.tsx`: **ไม่ได้แก้ไข (Unmodified per instruction)**

## Non-Transitive Safety Boundary

- deploy: false
- push: false
- commit: false
- secrets_read: false
- provider_calls: 0
