# Deploy Runbook — www.sirinx.co (2026-09-27)

Status: LOCAL_ONLY_CONTROL_DOC · แผนงานเท่านั้น — **ยังไม่มีการ commit/push/deploy ใด ๆ จากเลนนี้**
Gate: `push` = deploy trigger (Cloudflare Pages ผ่าน Git integration) → ต้องได้รับ
**named approval** ("push to main") จาก Commander ก่อนเสมอ

## 1. Readiness scorecard (วัดจริง 2026-09-27 01:40 น.)

| เกณฑ์ | สถานะ | หลักฐาน |
| --- | --- | --- |
| Test suite ทั้งหมด | ✅ **317/317 ผ่าน** (รวม 3 fail เดิมที่ถูกแก้แล้ว: infra files กลับเข้า tree) | `npx vitest run --root .` |
| Typecheck | ✅ exit 0 | `npx tsc --noEmit` |
| Build | ✅ exit 0 (vite + staticSeoBuild + esbuild) | `npm run build` |
| Static HTML เนื้อหาครบ | ✅ 77/77 longform shells + FAQPage ×1/เอกสาร + figure ×77 | dist inspection |
| ภาพประกอบ | ✅ 77/77 `.avif` + `.webp` (5.1MB), lazy + decoding=async | `client/public/provinces/` |
| Crawl reachability | ✅ ทุกหน้า ≤3 clicks จาก homepage (jcode: siblings + breadcrumb + h1) | `crawlReachability.test.ts` |
| JS runtime errors | ✅ 0 errors บน 5 เส้นทางหลัก (headless Chrome) | smoke run |
| Security headers / CSP / real-404 | ✅ + มี test คุม (`staticDeploySurface.test.ts`) | `_headers` / `_redirects` |
| project-hermes drift checks | ✅ clean ทั้งสองตัว | offline drift + claim sweep |

## 2. สิ่งที่ยังไม่พร้อม / ต้องตัดสินใจก่อน push

1. **HeroSlideshow (หน้าแรก) — jcode ยังไม่ได้แก้** (ไฟล์ไม่ถูกแตะตั้งแต่ 25 ก.ย.):
   - สไลด์แรกเป็นภาพตั้ง 721×1280 → ถูก upscale ใน hero แนวนอน = LCP เบลอ
   - ทั้ง 5 สไลด์ไม่มี AVIF/srcset (หน้าอื่นใช้ `assets/optimized/*-1280.avif` แล้ว)
   - ตัวเลือก: (ก) แก้ก่อน push — optimize ภาพ + picture element (~1 ชม.) (ข) push เลยแล้วแก้รอบถัดไป
2. **Freeze สองเลน** — working tree นี้ใช้ร่วมกับเลน jcode (jcode commit ต่อเนื่อง) ต้องนัด freeze
   จนกว่าจะ commit ชุดสุดท้ายเสร็จ ไม่งั้นไฟล์หลุดชุด
3. **Content GAP (ไม่ block deploy)**: generated ~2,265 คำ/หน้า (เกณฑ์ 3,200) + anti-dup 0.98
   (เกณฑ์ <0.80) — เป็น roadmap ยกระดับเนื้อหา ไม่ใช่เหตุผลเลื่อน deploy (หน้า live ปัจจุบันแย่กว่ามาก)

## 3. แผน Commit (จัดกลุ่ม — ทำหลัง freeze)

| # | กลุ่ม | ไฟล์ |
| --- | --- | --- |
| C1 | ภาพประกอบ + figure | `client/public/provinces/*` ที่เหลือ (udon-thani, uthai-thani, uttaradit, yala, yasothon), `shared/provinceLongformFigure.ts` + `.test.ts` |
| C2 | render pipeline | `docs/seo/province-image-render/` (scene.mjs, render-page.html, scene.bundle.js), `docs/seo/generate-province-images.mjs` (ถ้ายังไม่ถูก commit) |
| C3 | SEO docs | `docs/seo/province-content-briefs/`, `SEO_AEO_GEO_MASTERY_PLAN` updates, `docs/SEO_AEO_AUDIT_20260925.md`, `docs/SIRINX_SEO_PLAYBOOK_20260926.md`, runbook นี้ |
| C4 | agent skills (ตามที่ Commander อนุมัติ) | `.agents/`, `.claude/skills/{ai-seo,content-strategy,programmatic-seo,seo-audit,site-architecture}`, `skills-lock.json` |
| C5 | งานค้างเลนอื่น/โปรเจกต์อื่น | `MASTER_PLAN.md`, `sites/ghostclaw-*`, `.media-staging/`, `.serena/`, `.hermes/` — **แยกต่างหาก เจ้าของเลน commit เอง** |

Convention: commit message สั้น บอก "why" ตาม style ใน git log (feat/fix/docs/chore(scope): …)

## 4. แผน Push + Deploy (ต้องได้ named approval ก่อน)

1. **Pre-push freeze**: `npm run build` + `npx vitest run --root .` ซ้ำอีกรอบบน tree สุดท้าย (ต้อง 317/317 + build 0)
2. `git push origin main` — **นี่คือ deploy trigger** (Cloudflare Pages ผ่าน Git integration; ไม่มี wrangler config ใน repo)
3. Cloudflare Pages build: คำสั่ง build = `npm run build` (apps/public-web) → output `dist/public`
   — ตรวจว่า Pages project ชี้ workspace นี้ก่อน push ครั้งแรก (งาน Commander/ผู้ดูแลบัญชี)
4. **Post-deploy canary (ทันที)**: 200 ที่ `/`, `/solar-carport/`, `/solar-carport/bangkok/`,
   `/robots.txt`, `/sitemap.xml`; 404 จริงที่ `/no-such-page`; ตรวจหนึ่งหน้าจังหวัดว่ามี
   longform + figure + FAQPage; ตรวจ hero หน้าแรกด้วยตา (slide แรก)
5. **SEO follow-up (Commander)**: Search Console → sitemap resubmit + ดู Generative AI
   performance report; GBP update ตามแผน §5

## 5. Rollback

- Cloudflare Pages: เลือก deployment เก่าใน dashboard → "Rollback" (ไม่ต้อง git revert ทันที)
- ถ้าเป็นโค้ด: `git revert <sha>` แล้ว push (trigger redeploy) — ทุกอย่างใน repo นี้ static + build ซ้ำได้
- ไฟล์ภาพ/ข้อมูลเป็น deterministic artifacts: regenerate ได้จาก generator (`docs/seo/generate-province-*.mjs`)

## 6. คำสั่งที่ต้องรอ approval เท่านั้น

```bash
git push origin main          # = deploy
```
ทุกอย่างอื่นใน runbook นี้เป็น local read/write ทำได้ตามปกติ
