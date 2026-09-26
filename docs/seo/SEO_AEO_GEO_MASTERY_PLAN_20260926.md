# SEO / AEO / GEO — คลังความรู้ขั้นสูง + แผนปรับใช้กับ www.sirinx.co

Status: LOCAL_ONLY · 2026-09-26 · Hermes control plane · แหล่งอ้างอิงท้ายเอกสาร
Gate consumed: ไม่มี · ทุกข้อ = แผนงาน ไม่ใช่สัญญาอันดับ

> **สถานะจริง ณ 2026-09-26 อยู่ใน `SEO77_VERIFICATION_AND_STATUS_20260926.md`** — ตรวจแผนนี้เทียบกับไฟล์ build จริงแล้ว
> ข้อที่ผิด: §5 ข้อ 8 (llms.txt + robots AI bot) **เสร็จไปแล้ว** · §5 ข้อ 5 ภาพเป็น inline `<svg>` ไม่ใช่ data-URI ·
> §7 ข้อ 2 ความซ้ำลดเหลือ 0.435/0.516 แล้ว · §7 ข้อ 3 format ตัวเลขแก้แล้ว · §5 ข้อ 4 answer-first ยังค้าง
> ที่เพิ่งแก้และแผนนี้ไม่มี: หน้า 77 จังหวัดไม่มี `<h1>` เลย (0/77) และ crawler เข้าถึงหน้าจังหวัดจากหน้าแรกไม่ได้เลย (0/77)
> ส่วน LocalBusiness / Person schema **ตั้งใจไม่เติม** เพราะไม่มี NAP และผู้เขียนที่ยืนยันแล้ว — ดู §3 ในไฟล์บันทึก

## 0. หลักการแม่ (จาก Google ทางการ — ยึดอันนี้ก่อนข่าวลือทั้งหมด)

Google Search Central (2026) ระบุชัด: **AI Overviews / AI Mode ทำงานบน RAG จากดัชนี Search เดิม
+ query fan-out** — แปลว่า "SEO เดิมคือ GEO" การทำ GEO/AEO ที่ถูกต้องคือการขยายคุณภาพ SEO
ไม่ใช่เทคนิคใหม่ที่ต่างหาก และ Google หักล้างความเชื่อผิดยอดนิยม:

| ความเชื่อผิด | ข้อเท็จจริงจาก Google |
| --- | --- |
| ต้องทำ llms.txt ถึงจะติด AI | Google **ไม่ใช้** — ไม่ช่วยไม่เสียสำหรับ Google (แต่มีประโยชน์กับ AI บริการอื่น) |
| ต้อง chunk เนื้อหาเป็นชิ้นเล็ก ๆ | ไม่ต้อง — ระบบเข้าใจหน้ายาว/สั้นได้ ทำตามผู้อ่าน |
| ต้องเขียนใหม่ "เพื่อ AI" | ไม่ต้อง — เข้าใจ synonym/บริบทแล้ว |
| หา mention ปลอม ๆ ทั่วเว็บ | ไม่คุ้ม — ระบบจัดการ spam ทำงานอยู่ |
| Structured data คือหัวใจ | ไม่จำเป็นสำหรับ AI search แต่ยังดีกับ rich results เดิม |
| สร้างหน้าเยอะ ๆ ครอบทุก query | เสี่ยง **scaled content abuse** — คุณภาพสำคัญกว่าปริมาณ |

**และสำคัญที่สุด:** เนื้อหา non-commodity ที่มีมุมมองเฉพาะตัว/ข้อมูลต้นฉบับ คือปัจจัยที่มี
อิทธิพลต่อการถูกอ้างอิงใน AI search มากกว่าเทคนิคใด ๆ — ตรงกับงานต้านเนื้อหาซ้ำ 98% ที่เราทำอยู่

## 1. SEO ขั้นสูง (ชั้นฐาน)

1. **Search Essentials + snippet eligibility** — หน้าต้อง index ได้ + มี snippet จึงมีสิทธิ์เข้า AI features
   (เราทำแล้ว: prerender ทุกหน้า + 404 จริง + sitemap กรอง noindex)
2. **Search Console** — ยืนยันสิทธิ์ + เปิดใช้ generative AI features + ดูรายงาน *Generative AI
   performance report* (ตัววัดผลยุค AI ที่ต้องติดตาม)
3. **JavaScript SEO** — หน้า prerender ของเรามี meta ใน HTML แล้ว (crawler/client parity ผ่าน test)
4. **Page experience / Core Web Vitals** — LCP/INP/CLS ของหน้าจังหวัด (hero image ขนาดใหญ่ = จุดเสี่ยง)
5. **ลด duplicate content** — ตรง ๆ กับปัญหา 98% ของเรา (Google ระบุว่าเป็นทั้ง UX และ crawl waste)
6. **Internal linking graph** — hub → 77 จังหวัด → หน้าอุตสาหกรรม + breadcrumb (มีแล้ว เสริมความหนาแน่น)
7. **Image SEO** — ภาพคุณภาพสูง + alt เฉพาะถิ่น (เชื่อมกับงานภาพประกอบรายจังหวัด) + video ถ้ามี
8. **Multi-location / local SEO** — บทเรียนสำคัญ: หน้า location ที่เป็น template สลับชื่อเมือง
   = เสี่ยง thin/scaled content — **briefs + เกณฑ์ < 0.80 ของเราคือเกราะป้องกันโดยตรง**

## 2. AEO (Answer Engine Optimization)

- **Answer-first structure**: ทุก H2 เริ่มด้วยคำตอบสั้น 50–100 คำ แล้วค่อยขยาย (ทั้งคนและ AI เลือกย่อหน้าแรกไปอ้าง)
- **หนึ่งคำถาม = หนึ่ง intent**, คำตอบ factual ไม่มีภาษาขายของ — ใช้คำถาม P4 จาก keyword map (8 คำ/จังหวัด)
- **Schema ที่ใช้**: FAQPage + HowTo + QAPage + Organization + Author + BreadcrumbList (JSON-LD)
  — จัดเป็น "stacked schema" ต่อหน้า; ระวังข้อ 0: schema ไม่ใช่ยาวิเศษ แต่ช่วย rich results + ความเข้าใจ entity
- **Speakable-style brevity**: ประโยคคำตอบสั้นที่ quote ได้ 1-2 ประโยคต่อหัวข้อ (AI ดึงไปตอบ)
- **แหล่งอ้างอิงในเนื้อหา** — เอกสาร/มาตรฐานที่อ้างได้จริง (การไฟฟ้า, PVGIS, ประกาศ) เพิ่มความน่าเชื่อถือ

## 3. GEO (Generative Engine Optimization) — เหนือ Google

1. **ข้อมูลต้นฉบับคืออาวุธ**: ตาราง PVGIS 77 จังหวัด + อันดับเทียบ + ตัวเลขที่มาชัด = เนื้อหาที่ AI
   ชอบอ้าง (citation bait ตามธรรมชาติ) — เน้นย้ำในทุกหน้า
2. **Entity คงที่**: ชื่อ SIRINX, ที่อยู่, ขอบเขตบริการ ต้องเหมือนกันทุกที่ (site, GBP, social, schema)
3. **llms.txt** (ทางเลือก ต้นทุนต่ำ): ไฟล์ markdown สรุปโครงสร้างเว็บให้ AI อ่าน — Google ไม่สน
   แต่ ChatGPT/Perplexity/บริการอื่นอาจใช้ — สร้างได้จาก sitemap เดิม
4. **นโยบาย AI crawler ใน robots.txt แยกเป็นราย bot**:
   - อนุญาต (ดึงข้อมูลไปตอบ = โอกาสถูกอ้างอิง): `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`,
     `Google-Extended`, `Bingbot`
   - ตัดสินใจเชิงนโยบาย (ฝึกโมเดล): `GPTBot`, `CCBot`, `Google-Extended` — **เป็นการตัดสินใจของ Commander**
   - ห้ามเข้าอยู่แล้ว: `/admin`
5. **Agentic experiences** (แนวทาง Google ใหม่): เว็บที่ AI agent ทำหน้าที่แทนคน (จอง/ขอใบเสนอราคา)
   ควรให้ข้อมูลสินค้า/บริการเป็นระเบียบ machine-readable — flow ขอใบเสนอราคาของเราควรพร้อมในอนาคต

## 4. Local SEO สำหรับ 77 จังหวัด

- **Google Business Profile** ของ SIRINX + ระบุ service area (77 จังหวัด) — ต้องทำนอกเว็บ
  เป็นปัจจัย local ที่แรงที่สุด (งานผู้ใช้ต้องอนุมัติ/ทำเอง — ต้องมีสิทธิ์บัญชีธุรกิจ)
- **NAP consistency** (ชื่อ/ที่อยู่/เบอร์) — เหตุผลเพิ่มเติมที่ต้องปิดปัญหาเบอร์ placeholder (fix-pack §3)
- **รีวิวจริง** — ระบบขอรีวิวหลังติดตั้งเสร็จ (งาน ops)
- **หน้าจังหวัดต้อง unique จริงเท่านั้น** — เกณฑ์ < 0.80 ใน brief ยึดไว้
- **LocalBusiness schema** ข้อมูลจริงเท่านั้น + `areaServed` รายจังหวัด

## 5. แผนลงมือ (จัดลำดับตาม ROI)

| # | งาน | สถานะ | เจ้าของ |
| --- | --- | --- | --- |
| 1 | ต้านเนื้อหาซ้ำ — briefs + เกณฑ์ < 0.80 + เขียนเนื้อหา 12,000+ คำ/หน้า | bangkok 12,001 คำแล้ว; generated 76 จังหวัด ~2,265 คำ/หน้า — **GAP: anti-dup 0.98 เกิน 0.80** (ดู §7) | jcode + เลนนี้ |
| 2 | โครงสร้างเทคนิค — prerender/404/sitemap/canonical | เสร็จยกเว้น §2 canonical | เลนนี้ |
| 3 | Stacked schema ต่อหน้า (FAQPage จาก P4 + LocalBusiness + Breadcrumb + Article) | ทำแล้วบางส่วน (มี FAQPage/Organization) — เติม HowTo/Article/Author | jcode |
| 4 | Answer-first rewrite ทุก H2 (50–100 คำแรก) | ค้าง | เลนเขียนเนื้อหา |
| 5 | ภาพประกอบรายจังหวัด (alt เฉพาะถิ่น + WebP/AVIF + lazy) | ทำแล้ว: SVG data-figure รายจังหวัด 77/77 ฝัง prerender + component (ดู §7) — ขั้นถัดไป WebP/AVIF + lazy | เลนนี้ |
| 6 | Search Console + Generative AI report + rank/citation tracking | ต้องมีสิทธิ์บัญชี | Commander |
| 7 | GBP + NAP + รีวิว | ต้องมีสิทธิ์บัญชีธุรกิจ | Commander |
| 8 | llms.txt + robots.txt นโยบาย AI bot | เล็ก ทำได้เลยหลัง Commander ตัดสินนโยบาย bot | เลนนี้ |
| 9 | hreflang th/en/cn (เว็บ 3 ภาษา — ตรวจว่ามี hreflang ครบไหม) | ค้าง ตรวจ | เลนนี้ |
| 10 | Core Web Vitals tuning (hero image, preload) | ค้าง | jcode |

## 6. เครื่องมือ/ทักษะเสริมศักยภาพเอเจ้นท์ (candidate — ยังไม่ติดตั้ง)

สำรวจจาก skills registry (npx skills find) — ทั้งหมดเป็น **community skills ที่ยังไม่ผ่านการ vet**
(ต้องอนุมัติก่อนติดตั้ง + ผ่านกระบวนการ repo-intake ก่อน runcode):

| candidate | จำนวนติดตั้ง | ใช้ทำอะไร | ความเสี่ยง |
| --- | --- | --- | --- |
| `coreyhaines31/marketingskills@seo-audit` | 214K | checklist audit ทางเทคนิค | ต่ำ-กลาง (อ่านก่อนใช้) |
| `coreyhaines31/marketingskills@content-strategy` | 145K | วางกลยุทธ์เนื้อหา | ต่ำ |
| `coreyhaines31/marketingskills@programmatic-seo` | 136K | ระบบหน้าจังหวัด (ระวัง scaled abuse) | กลาง — ต้องคุมด้วยเกณฑ์ < 0.80 |
| `coreyhaines31/marketingskills@ai-seo` | 131K | เทคนิค AEO/GEO | ต่ำ |
| `coreyhaines31/marketingskills@site-architecture` | 109K | internal linking/architecture | ต่ำ |

หลักการติดตั้ง: `npx skills add <owner/repo> --skill <name> --yes` ลง `.agents/skills/` ของแต่ละเลน;
**อ่าน SKILL.md ก่อนเสมอ** ห้ามรันสคริปต์จาก skill โดยไม่ตรวจ, ห้ามติดตั้งอะไรที่ขอมีสิทธิ์เกินจำเป็น

## 7. บันทึก QA เนื้อหา 2026-09-26 (รอบตรวจ generated longform)

ตรวจเนื้อหาที่เลน jcode สร้าง (`provinceLongformGenerated.ts` 76 จังหวัด) ทีละส่วน พบและแก้แล้ว:

| พบ | ผลกระทบ | สถานะ |
| --- | --- | --- |
| placeholder `${name}` รั่ว 228 จุดใน FAQ list | เนื้อหาเผยแพร่จริงมี placeholder — หน้าเสียความน่าเชื่อถือ | แก้ที่ generator + regenerate = 0 |
| FAQ section แสดงเฉพาะคำถาม ไม่มีคำตอบ (คำตอบค้างใน field ที่ไม่มีใคร render) | AEO เสียหาย — คำตอบไม่ปรากฏใน HTML | แก้ generator ให้ render h3+p จากชุดเดียวกับ schema |
| slug ละตินปน prose ไทย ("สูงสุดคือ phuket") ทุกหน้า | คุณภาพต่ำ + ดูเป็น template | แก้ map slug→ชื่อไทย = 0 |
| typo ซ้ำ ×76: ตู้แฟ→ตู้ไฟ, ต้นข่าย→สายส่ง, ความยาวรอ→ระยะเวลารอ, ยึดยง→ยึดโยง, กำล่ง→กำลัง (มือเขียน bangkok ด้วย 1 จุด) | ทุกตัวอักษรที่เผยแพร่ | แก้แล้ว + regression test กันไม่ให้กลับมา |
| 76 จังหวัดไม่มีเนื้อหาใน static HTML (prerender เข้าถึงเฉพาะมือเขียน) | AI/search crawler ไม่เห็นเนื้อหา 76 หน้า | ต่อผ่าน resolver → static HTML ครบ 77/77 |
| longform FAQ ไม่เข้า FAQPage schema | คำถาม 5 ข้อ/จังหวัด ไม่ถูกประกาศ | รวมเข้า FAQPage node เดียวของเอกสาร (ตาม invariant ของ seoGraph) |

**GAP ที่เหลือ (ต้องปิดในเฟสถัดไป — ไม่อำพราง):**

1. **ความยาว**: generated ~2,265 คำ/หน้า (เกณฑ์ขั้นต่ำ 3,200 / เป้า 12,000) — ตั้ง regression floor ไว้ที่ 2,200 แล้ว
   ยกระดับด้วยมือเขียนตามลำดับ priority จาก keyword-map ทีละจังหวัด (ไม่ใช่ template)
2. **ความซ้ำข้ามหน้า**: Dice ~0.98 หลัง mask ชื่อ+ตัวเลข (เกณฑ์ < 0.80) — เนื้อหา templated 76 หน้า
   เสี่ยง scaled content abuse ตาม §0 ทางตรง วิธีปิดคือเพิ่มข้อมูล/มุมมองเฉพาะถิ่นจริง (ตารางเปรียบเทียบ
   เฉพาะจังหวัด, กรณีศึกษา, ตัวเลขหน้างาน) ไม่ใช่เพิ่มคำจากเทมเพลต — ตั้ง ceiling regression ไว้ที่ 0.99 แล้ว
3. **ตัวเลขใน generated ไม่ format** ("1392.91" ต่างจากมือเขียน "1,401.4") — เก็บเป็นงานขัดเกลา
4. **ภาพยังเป็น SVG data-figure** — ภาพถ่าย/ภาพ render จริงรายจังหวัด (WebP/AVIF + lazy) เป็นขั้นถัดไป

การันตีคุณภาพด้วย test gates (19 tests ใหม่): word floor, anti-dup ceiling, placeholder/typo, slug leak,
FAQ มองเห็นจริง, resolver precedence, prerender parity, figure ครบ 12 เดือน — ทุก gate พิสูจน์แดงได้แล้ว

## 8. แหล่งอ้างอิง

1. Google Search Central — *Optimizing your website for generative AI features* (developers.google.com/search/docs/fundamentals/ai-optimization-guide) — 2026
2. Google Search Central — *Evaluating third-party SEO advice* (อ้างในเอกสารบน)
3. Frase / HubSpot / MO.agency — schema markup for AEO (2025–2026)
4. FT Strategies — *Robots.txt as strategic intent* (นโยบาย publisher ต่อ AI crawler)
5. digitalapplied.com — *AI Crawler Access Control: 2026 Decision Matrix*
6. Local SEO multi-location guides (2026) — ยืนยันความเสี่ยง thin content ของหน้า location template

## 9. ข้อจำกัด

- ไม่มีอะไรในเอกสารนี้รับประกันอันดับ/การถูกอ้างอิง — วัดผลจาก Search Console + citation checks
- งานที่ต้องมีสิทธิ์บัญชี (Search Console, GBP) และนโยบาย AI bot = ต้อง Commander อนุมัติ
- ข้อมูล AI-search พัฒนาเร็ว — ทวนเอกสารนี้ทุกไตรมาส
