# SIRINX.CO — PKG-1 Motion Tokens & Decision Proposal Report

Status: LOCAL_VERIFIED · Date: 2026-09-28 · Round: R28b
Selected Package: **PKG-1 (Motion Architecture Tokens & Strategy)**
Pair receipt: `receipts/SIRINX_CO_PKG1_MOTION_TOKENS_20260928.md`

## Summary

| Deliverable | Path | Status |
|---|---|---|
| a) Motion Tokens | `apps/public-web/shared/motionTokens.ts` | Complete |
| b) Motion Token Tests | `apps/public-web/shared/motionTokens.test.ts` | Verified (8/8 passed) |
| c) Motion Architecture Decision | `docs/3d/MOTION_DECISION_20260928.md` | Complete |
| d) Preservation of static-motion | `apps/public-web/client/src/lib/static-motion.tsx` | Untouched |

## Verification Results

| Check | Target | Result |
|---|---|---|
| Vitest Unit Tests | `apps/public-web/shared/motionTokens.test.ts` | **8 passed (100%)** |
| TypeScript Check | `apps/public-web` | **0 errors, exit 0** |
| Git Status Boundary | `sirinx-co` | No commit / No push / No deploy |

## Decision Required from Human Commander

โปรดพิจารณาเอกสาร `docs/3d/MOTION_DECISION_20260928.md`:
- **ทาง A:** คง `static-motion.tsx` ต่อไปเพื่อ LCP สูงสุด
- **ทาง B:** เปิดใช้ Framer Motion บน Home + Layout ภายใต้การควบคุมของ `shared/motionTokens.ts` พร้อม LCP Guard และ prefers-reduced-motion fallback
