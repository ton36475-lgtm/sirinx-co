# SEO 77 — บันทึกตรวจสอบข้ามเลน และสถานะจริง ณ 2026-09-26

Status: LOCAL_ONLY · ตรวจโดยเลน jcode · ไม่มีการ deploy

เอกสารนี้เป็น**บันทึกการตรวจ** ไม่ใช่แผนงาน เพื่อแก้ปัญหาที่เอกสารของทั้งสองเลนล้าสมัยไปแล้ว
อ้างอิง: `docs/seo/TECHNICAL_SEO_FIX_PACK_20260926.md` (เลน freebuff) และ
`docs/seo/SEO_AEO_GEO_MASTERY_PLAN_20260926.md` (แผนหลัก)

ทุกตัวเลขข้างล่างวัดจาก **ไฟล์ที่ build จริง** (`apps/public-web/dist/public/`) ไม่ใช่จากข้อความในเอกสาร

---

## 1. ผลตรวจข้ออ้างของเลน freebuff — 16 ข้อ

**จริง 12 · บางส่วน 3 · เท็จ 1** · guard test ทั้ง 11 ตัวผ่าน

| ข้ออ้าง | ผล | หลักฐาน |
| --- | --- | --- |
| ตัด soft-404 catch-all ออกจาก `_redirects` | จริง | ไม่มี `/*` rule · `404.html` noindex · source กับ dist ตรงกัน byte เดียว |
| prerender 107 routes | จริง | 19 core + 77 จังหวัด + 2 project + 9 blog |
| sitemap 105 URL | จริง | นับ `<loc>` = 105 ใน `dist/public/sitemap.xml` |
| ไม่มี route `/solar/` ในรีโปนี้ | จริง | `dist/public/solar` = 0 |
| ไม่มี `telephone` ในโค้ด | จริง | 81 จุดที่พบเป็นเอกสารทั้งหมด |
| 77/77 มี province energy record | จริง | เกณฑ์ "ขาด 13 รายการ" **ล้าสมัย** |
| ตาราง §1 บอกว่า `/projects` + `/blog` มี SPA fallback | **เท็จ** | rewrite ถูกลบไปแล้ว · ขัดกับ §4.1 ในเอกสารเอง |
| "22 top-level routes" | **บางส่วน** | จริง ๆ คือ 19 |
| `robots.txt` มี `Disallow: /admin` | **บางส่วน** | ไฟล์ที่ deploy มีจริง แต่**ไม่ได้มาจาก `client/public/robots.txt`** — ถูก build เขียนทับด้วย `buildRobots()` ที่ `server/staticSeoBuild.ts:101` ซึ่งเอกสารไม่พูดถึงเลย |
| ตาราง §1 เขียนว่า admin เป็น "robots-disallowed" | **บางส่วน** | จริงเฉพาะในไฟล์ที่ build สร้าง ไม่ใช่ไฟล์ต้นทาง |

### ไฟล์ที่เอกสารอ้างแต่ไม่มีในรีโปนี้
- `reports/SIRINX_CO_SEO77_REVIEW_AND_JCODE_LANE_AUDIT_20260926.md` — อยู่คนละ checkout
- `generate_77_province_seo.py` — อยู่คนละ checkout

---

## 2. บั๊กจริงที่พบระหว่างตรวจ และแก้แล้ว

ทั้ง 4 ข้อวัดผลได้ ไม่ใช่การเปลี่ยนโค้ดเฉย ๆ

| # | บั๊ก | ก่อน | หลัง |
| --- | --- | --- | --- |
| 1 | หน้าจังหวัดไม่มี `<h1>` เลย | **0 / 77** | **1 / 77** |
| 2 | crawler เดินจากหน้าแรกเข้าถึงหน้าจังหวัดไม่ได้เลย | **0 / 77** | **77 / 77** |
| 2 | คลิกสูงสุดจากหน้าแรกถึงหน้าจังหวัด | **∞** | **2** |
| 2 | ลิงก์ออกต่อหน้าจังหวัด | **1** | **8–10** (เฉลี่ย 9.9) |
| 2 | ลิงก์เข้าต่อหน้าจังหวัด | 1 เท่ากันหมด 77 หน้า | 1–20 (เฉลี่ย 6.9) |
| 3 | breadcrumb ไม่ตรง canonical | ไม่มี trailing slash + ไม่มี hub | ตรงทุกตัว + มี `/provinces/` เป็นชั้นกลาง |
| 6 | รูปแบบตัวเลขไม่ตรงกัน | `1395.64` vs `1,401.4` | `1,395.64` ทั้ง 77 หน้า (ไม่แตะพิกัด) |
| 7 | H2 ที่ไม่มีคำตอบนำ | **762 / 926 (82.3%)** | **0 / 927** |

**คำตอบนำ (answer-first) วัดอย่างไร:** นับอักขระข้อความในบล็อกแรกที่ตามหัวข้อ `h2` ทันที
(ย่อหน้า `p` หรือรายการ `list` ถือว่านับ) แล้วเทียบกับเกณฑ์ 300 ตัวอักษร
เพราะแผนกำหนดคำตอบ 50-100 คำ ≈ 300-500 ตัวอักษรไทย ตัวเลขนี้วัดจาก **HTML ที่ build แล้ว** ทั้ง 77 หน้า

หมายเหตุ: บน HTML ที่ build แล้วยังขึ้น 77 จุด — คือหัวข้อ `จังหวัดอื่นในระบบเดียวกัน` ที่เพิ่งเพิ่ม
เป็นรายการลิงก์ ไม่ใช่หัวข้อเนื้อหา จึงไม่ต้องมีคำตอบนำ เป็นผลลบลวงจากการวัด ไม่ใช่ข้อบกพร่อง

**สาเหตุข้อ 2:** เมนูเว็บทั้งหมดเป็น React component ไม่เคยไปถึง static HTML
หน้าแรกที่ prerender มี `<a>` แค่ 2 อัน และไม่ลิงก์ไป `/provinces/` เลย
นี่คือรูปแบบเดียวกับที่ playbook ตัวเองเตือนเรื่อง doorway abuse

### ข้อผิดพลาด 2 ครั้งที่ต้องบันทึกไว้ เพื่อไม่ให้ซ้ำ
1. **เกือบ "แก้" robots.txt ทั้งที่ไม่ใช่บั๊ก** — อ่านไฟล์ต้นทาง `client/public/robots.txt` แล้วสรุปว่าไม่มี `Disallow: /admin` แต่ไฟล์นั้นถูก build เขียนทับ **บทเรียน: ต้องอ่านไฟล์ใน `dist/` เสมอ ไม่ใช่ไฟล์ต้นทาง**
2. **ใส่ field `siblings` เข้า `getProvinceLongformEntry()` แล้วพังเทสต์** — เทสต์เดิมยืนยันว่า resolver คืน entry ด้วย reference (`toBe`) ย้ายไปเป็น `getProvinceSiblings()` แทน **บทเรียน: ข้อมูลที่ "คำนวณได้" ไม่ควรปนในข้อมูลที่ "เก็บถาวร"**

---

## 3. Schema — สถานะจริงเทียบกับแผน

แผนหลักเขียนว่าต้อง "เติม HowTo/Article/Author" — ตรวจแล้ว **บางส่วนของแผนผิด**

| @type | ตามแผน | ตรวจพบก่อนแก้ | หลังแก้ |
| --- | --- | --- | --- |
| BreadcrumbList | ต้องเติม | **77/77 มีแล้ว** | 77/77 |
| FAQPage | ต้องเติม | **77/77 มีแล้ว** | 77/77 |
| Organization / WebPage / WebSite / Service / areaServed | — | **77/77 มีแล้ว** | 77/77 |
| **Article** | ต้องเติม | **0/77** | **77/77** |
| **HowTo** | ต้องเติม | **0/77** | **77/77** (7 ขั้นตอน) |
| LocalBusiness | ต้องเติม | 0/77 | **ตั้งใจไม่เติม** |
| Person (author) | ต้องเติม | 0/77 | **ตั้งใจไม่เติม** |

**ทำไม LocalBusiness และ Person ถึง "ไม่เติม" แม้แผนจะสั่งให้เติม**
- `LocalBusiness` ต้องมีที่อยู่จริง แต่ SIRINX **ยังไม่มี NAP ที่ยืนยันแล้ว** — `telephone` ถูกถอดออกจาก schema ไปแล้วโดยเลน freebuff เพราะเป็น placeholder การประกาศ `LocalBusiness` ที่ไม่มีที่อยู่คือการเสี่ยงโดนติดป้าย spam
- `Person` ต้องมีผู้เขียนจริง แต่ **ไม่มีบุคคลใดผ่านการยืนยัน** การใส่ byline สมมติคือการกุข้อมูล — ใช้ `author` เป็น `Organization` แทน ซึ่งเป็นความจริง
- `datePublished` **ไม่ใส่** เพราะไม่มีบันทึกวันที่เผยแพร่ครั้งแรกของแต่ละจังหวัด ใส่ `dateModified` จาก timestamp ของ build ชุดเดียวกับ `<lastmod>` ใน sitemap เพื่อไม่ให้ขัดกันเอง

---

## 4. สิ่งที่แผนบอกว่า "ค้าง" แต่จริง ๆ เสร็จแล้ว

| รายการในแผน | สถานะจริง |
| --- | --- |
| ข้อ 8: llms.txt + robots.txt นโยบาย AI bot | **เสร็จแล้ว** — `dist/public/llms.txt` มีอยู่ · robots.txt มีนโยบาย 12 bot · ทั้งหมด generate จาก `buildLlmsTxt()` / `buildRobots()` |
| ข้อ 5: ภาพประกอบรายจังหวัด | inline SVG ครบ 77/77 ฝังใน prerender — ไม่ใช่ data-URI อย่างที่บันทึกไว้ |
| ข้อ 2: prerender / 404 / sitemap / canonical | เสร็จแล้ว ยกเว้น canonical ของ breadcrumb ซึ่งเพิ่งแก้ |
| ข้อ 6: ความซ้ำเนื้อหา | 0.912 → **0.435** เฉลี่ย, สูงสุด **0.516** |

## 5. สิ่งที่ยังทำไม่ได้ และเพราะอะไร

| รายการ | เหตุผล |
| --- | --- |
| hreflang 3 ภาษา | **ทำไม่ได้ในสถานะปัจจุบัน** — เว็บไม่มี URL `/en/` หรือ `/zh/` เลย ภาษาเป็น client state ใน `localStorage` ต้องสร้าง route family ก่อน |
| PEA/MEA รายจังหวัด | เว็บทั้งสองเป็น JS-driven ดึงไม่ได้ · เทสต์ห้ามกล่าวอ้างหน่วยไฟฟ้าโดยไม่ยืนยัน |
| รายชื่ออำเภอ | Wikidata ให้ผิด (สมุทรปราการ 6 แทน 32) · ต้องใช้กรมการปกครอง |
| LocalBusiness / Person schema | ไม่มีข้อมูลที่ยืนยันแล้ว — ดู §3 |

---

## 6. ความเสี่ยงที่ยังเปิดอยู่ — ต้องให้ Commander ตัดสินใจ

### 6.1 🚨 sirinx-os ชน canonical กับเว็บหลัก
เลน freebuff ตัดสิน (Commander-approved) ว่า `/solar-carport/<slug>/` เป็น canonical
และกำกับว่าเซ็ตของ sirinx-os ต้องมี 301 — **ยังไม่มีใครทำ**:

- repo จริงคือ `/Users/sirinx/sirinx-os/apps/public-web` (ไม่ใช่ `SIRINXDev/sirinx-os` ที่นั่นเป็น stub ไฟล์เดียว)
- **ไม่มี 301** และ `_redirects` ยังแมป `/solar/<slug>` → `/provinces/<slug>.html` ด้วย **200**
- ประกาศ `sitemap-provinces.xml` 77 URL บน `https://www.sirinx.co/solar/<slug>/` — แย่งโดเมนกับเว็บหลัก
- 77 หน้ามี `canonical` ชี้ไป `/solar/` ทั้งหมด
- slug ต่างกัน 4 คู่: `chiangmai`/`chiang-mai`, `chiangrai`/`chiang-rai`, `buri-ram`/`buriram`, `ayutthaya`/`phra-nakhon-si-ayutthaya`
- เนื้อหาไม่ซ้ำกัน (5-gram Jaccard 0.00, ขนาดต่างกัน ~8 เท่า) — ปัญหาคือโครงสร้าง ไม่ใช่เนื้อหา
- repo นั้นมี 136 ไฟล์ค้าง uncommitted

**ผมไม่ได้แก้ repo นั้น และตั้งใจไม่แก้** — เหตุผลที่ต้องบันทึกไว้:
1. มี 136 ไฟล์ uncommitted จากอีกเลนหนึ่ง · การแก้ 77 ไฟล์ HTML ที่ generate มีความเสี่ยงทับงานเขา
2. `_redirects` ของที่นั่นยังเสิร์ฟ 3D exhibition ของ Thaimart ด้วย · การเพิ่ม 301 อาจพังเส้นทางของเว็บนั้นเอง
3. `www.sirinx.co` เสิร์ฟจาก build ของ `sirinx-co` ไม่ใช่จาก repo นั้น · ความเสียหายจริงเกิดตอน deploy ไม่ใช่ตอนมีไฟล์อยู่

**แพตช์ที่ต้องใช้ (ยังไม่ได้ทำ)** — ใครเป็นเจ้าของ repo นั้นต้องรันเอง:
```
# 1) ห้ามประกาศโดเมนของเว็บหลัก — เปลี่ยน base ใน sitemap-provinces.xml
#    หรือ ลบ sitemap ออกจากชุด deploy นี้ทั้งหมด
# 2) แก้ canonical 77 หน้า: /solar/<slug>/  ->  /solar-carport/<slug>/
#    และแก้ slug 4 คู่ให้ตรงกับ apex:
#      chiangmai -> chiang-mai, chiangrai -> chiang-rai,
#      buri-ram  -> buriram,     ayutthaya  -> phra-nakhon-si-ayutthaya
# 3) เพิ่ม 301 ใน seo/_redirects (ก่อนบรรทัด /solar/:province ที่ใช้ 200)
/solar/*  /solar-carport/:splat  301
# 4) slug 4 คู่ที่ต่างกันต้องมี 301 สะพานด้วย ไม่งั้นลิงก์เก่าจะ 404
/solar/chiangmai  /solar-carport/chiang-mai  301
/solar/chiangrai  /solar-carport/chiang-rai  301
/solar/buri-ram   /solar-carport/buriram     301
/solar/ayutthaya  /solar-carport/phra-nakhon-si-ayutthaya  301
```

### 6.2 🚨 โค้ดทั้งแอปไม่ได้ถูก commit — แก้แล้ว

**นี่คือข้อค้นพบที่ร้ายแรงที่สุดของรอบนี้** ไม่ใช่แค่ “ไฟล์ค้าง” แต่คือ
`server/staticSeoBuild.ts` (ถูก track) `import` `../shared/siteContentRegistry` ซึ่ง **ไม่ถูก track**
รวมถึง `provinceEnergyData` `provinceSolarMonthly` `publicProjectContent` `publicProjectMedia`
`holatelProjectMedia` `ruenphaeProjectMedia` `sunMath` `provinceEnergyStats` `homeSolutionFaq`
`provinceLongformFigure` และ `client/src` เกือบทั้งหมด รวมถึง `client/public/404.html`
(ไฟล์ที่ทั้งระบบ soft-404 ขึ้นอยู่)

**ผลคือ clone ใหม่แล้วสั่ง `pnpm build` ไม่ผ่านเลย** และ commit 4 รอบก่อนหน้านี้
ส่งเว็บที่ไม่มีใครสร้างซ้ำได้ — ไม่ใช่แค่เนื้อหาที่ตรวจสอบไม่ได้

**แก้แล้วใน commit `1198785`** และพิสูจน์แล้วว่าไม่มีช่องโหว่เหลือ:

| ตรวจ | ผลหลังแก้ |
| --- | --- |
| โมดูลที่ build entry point เข้าถึง | 64 |
| โมดูลที่ import แต่ไม่ถูก commit | **0** |
| เทสต์ | 40 ไฟล์ / 317 เคส ผ่าน |
| branch ห่างจาก main | 18 ข้างหน้า · **0 ข้างหลัง** (merge เป็น fast-forward ได้) |
| secret ในไฟล์ที่ commit | ไม่มี · ที่เจอคำว่า secret/token เป็นชื่อตัวแปร (`maxTokens`, `canReadSecrets: false`) |

**เพิ่มเทสต์คุมไว้แล้ว** — `shared/buildReproducibility.test.ts` เดิน import graph จาก entry point
ของ build แล้ว fail ถ้าพบโมดูลที่ไม่ถูก commit หรือถ้า `404.html` / `_redirects` หายไปจาก git
เทสต์นี้จับปัญหานี้ได้ แต่ก่อนหน้านี้ไม่มีอะไรจับได้ เพราะทุกชุดเทสต์รันกับ working tree เสมอ

**ยังค้าง 38 ไฟล์ ซึ่งเป็นงานของเลนอื่นที่ไม่ใช่ application source:**

| กลุ่ม | หมายเหตุ |
| --- | --- |
| `docs/seo/province-content-briefs/` (78 ไฟล์) · `docs/seo/province-image-render/` | เอกสารทำงาน ไม่กระทบการ build |
| `.claude/skills/` · `.agents/` · `skills-lock.json` | community skills ที่ติดตั้งมา ยังไม่ vet ในรีโป |
| `services/dev-control-api/` · `sites/ghostclaw-hermes-v3-command-center/` | subsystem คนละส่วน ไม่เกี่ยวกับเว็บ |
| `crates/` · `apps/thaimart-seller-guard/` · `docs/` อื่น | งานเลนอื่น |

**ข้อสังเกต:** ก่อนหน้านี้ผมจัดหมวด 120 ไฟล์นี้ว่า “เป็น WIP ของเลนอื่น อย่าแตะ” ซึ่ง**ผิด**
86 ไฟล์ในนั้นคือตัวแอปเอง การไม่ commit คือทำให้เว็บ deploy ไม่ได้ ไม่ใช่เรื่องความสุภาพของ lane

### 6.3 เทสต์ที่เคย fail — แก้แล้ว
เคย fail 2 สูตร (`server/runtimeScripts.test.ts`, `server/_core/agentContracts.test.ts`)
เพราะอ้างไฟล์ `infra/scripts/*.sh` และ `ORCHESTRATION_SCHEMA.json` ที่มีอยู่บน branch
`origin/feat/sirinx-web-line-trust-v1` แต่ **ไม่เคยถูก merge เข้า branch ปัจจุบัน**
กู้คืนมาแล้วทั้ง 8 ไฟล์ (ตรวจ assertion ทุกข้อก่อนกู้ รวมถึง negative assertion ว่าไม่มี `rm -rf "$APP_DIR"`)
**ตอนนี้เขียวทั้งหมด: 39 ไฟล์เทสต์ 315 เคส**

---

## 7. เกณฑ์ที่ใช้วัด และเทสต์ที่คุมไว้

| เกณฑ์ | ค่า | เทสต์คุม |
| --- | --- | --- |
| ความซ้ำข้ามจังหวัด (5-gram Jaccard) | < 0.6 | `provinceLongformQuality.test.ts` |
| ครอบคลุม longform | 77/77 | เทสต์เดียวกัน |
| `<h1>` ต่อหน้า | = 1 | เทสต์เดียวกัน |
| breadcrumb + hub + เพื่อนบ้าน | ทุกหน้า | เทสต์เดียวกัน |
| Article + HowTo | 77/77 | เทสต์เดียวกัน |
| ไม่มี claim ที่ยังไม่ยืนยัน (ค่าไฟ/อำเภอ/หน่วยไฟฟ้า) | 0 | เทสต์เดียวกัน |
| H2 ต้องมีคำตอบนำ ≥ 300 ตัวอักษร | 927 / 927 | เทสต์เดียวกัน |
| ตัวเลขตรงกับ energy record | 77/77 | เทสต์เดียวกัน |
| **reachability จากหน้าแรก (อ่านไฟล์ build จริง)** | **ทุกหน้า ≤ 3 คลิก** | `crawlReachability.test.ts` |
| ลิงก์ออกต่อหน้าจังหวัด | > 1 | `crawlReachability.test.ts` |
| ไม่มี soft-404 catch-all | 0 | `staticDeploySurface.test.ts` |
| **โมดูลที่ build ใช้ต้องถูก commit ครบ** | **0 ขาด** | `buildReproducibility.test.ts` |
| `404.html` + `_redirects` ต้องอยู่ใน git | ครบ | `buildReproducibility.test.ts` |

---

## 8. ข้อจำกัดของเอกสารนี้

- ไม่มี Search Console / GA4 / Ahrefs จึง**ไม่มีตัวเลขอันดับหรือปริมาณค้นหาใด ๆ** ทุกอย่างที่วัดได้เป็นโครงสร้างและคุณภาพเนื้อหาเท่านั้น
- การวัดความซ้ำใช้ 5-gram เชิงคำ — ภาษาไทยไม่มีช่องว่างระหว่างคำ ทำให้การวัดนี้**ตัดความเข้มงวนลง** ไม่ได้ทำให้ตัวเลขดูดีเกินจริง
- Core Web Vitals วัดจาก static analysis เท่านั้น ยืนยัน LCP/CLS จริงต้องวัดบนหน้าที่ deploy แล้ว
