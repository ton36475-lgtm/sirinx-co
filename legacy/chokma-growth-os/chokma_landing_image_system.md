# CHOKMA Landing Image System

เอกสารนี้กำหนดระบบสร้างภาพสำหรับหน้า Landing ของ **CHOKMA** โดยมีเป้าหมายให้ภาพทุกชิ้นเป็นงานต้นฉบับ ใช้โทน **Deep Blue** และ **Royal Gold** อย่างสม่ำเสมอ และสามารถนำกลับไปสร้างใหม่ได้แบบกึ่งอัตโนมัติในรอบถัดไปโดยไม่ต้องอาศัยบริบทจากแชตเดิม

## วัตถุประสงค์ของระบบ

ระบบภาพนี้ออกแบบมาเพื่อรองรับหน้า Landing ที่เน้น conversion-first เป็นหลัก ภาพทุกชิ้นจึงต้องช่วยให้ผู้ใช้ตัดสินใจเร็วขึ้น ไม่ดึงความสนใจออกจาก CTA และต้องเสริมข้อความข้อเสนอหลักของแบรนด์ ได้แก่ อัตราจ่ายหวย 4 ตัว 7,000 บาท, หวย 3 ตัว 1,200 บาท และระบบแนะนำเพื่อนสูงสุด 3%

## หลักการแบรนด์

| องค์ประกอบ | ข้อกำหนด |
| --- | --- |
| แบรนด์ที่อนุญาต | ใช้เฉพาะ **CHOKMA** |
| โทนสีหลัก | Deep Blue, Royal Gold, White |
| แนวภาพ | คม ชัด สะอาด มูลค่าสูง อ่านง่ายบนมือถือ |
| สิ่งที่ห้าม | โลโก้หรือสัญลักษณ์ของแบรนด์อื่น, การคัดลอกเลย์เอาต์เฉพาะตัวแบบหนึ่งต่อหนึ่ง, ตัวหนังสืออ่านยาก, องค์ประกอบรกเกินไป |
| เป้าหมาย UX | มองแล้วเข้าใจข้อเสนอเร็ว กด CTA ต่อได้ทันที |

## ชุดภาพที่ต้องสร้าง

| Asset ID | ตำแหน่งใช้งาน | บทบาท |
| --- | --- | --- |
| hero-poster | Hero section | เป็นภาพหลักของหน้าที่สร้างแรงดึงดูดทันทีเมื่อเปิดหน้า |
| offer-strip-lottery | Offer support | ใช้สื่อสารอัตราจ่ายหวยแบบสั้นและชัด |
| offer-strip-affiliate | Offer support | ใช้สื่อสารโปรแกรมแนะนำเพื่อน 1% ถึง 3% |
| trust-panel | Trust / support | ใช้เสริมความรู้สึกน่าเชื่อถือและพร้อมสมัคร |

## Prompt Master Template

ให้ใช้แม่แบบนี้เมื่อต้องสร้างภาพใหม่ โดยแทนค่าตาม asset ที่ต้องการ

> Create an original high-conversion landing page visual for the brand CHOKMA. Use a premium deep blue and royal gold palette, modern Thai-market gambling promotion aesthetics, ultra-clean mobile-first composition, bold focal hierarchy, glossy light accents, elegant contrast, and conversion-first spacing. Include only CHOKMA branding cues in abstract form, with no external logos, no copied layouts, and no trademarked elements. The image must feel similar in energy to a fast signup campaign page, but remain original, polished, and production-ready for a landing page hero banner.

## Asset-Specific Prompt Variants

### hero-poster

> Create an original hero visual for CHOKMA landing page. Show a premium deep blue background with royal gold glow accents, abstract lottery-number energy motifs, subtle digital light streaks, luxurious card-like panels, mobile-first composition, and a focal area that leaves safe negative space for headline and CTA on the left. No external brands, no readable third-party logos, no clutter, no copied interface.

### offer-strip-lottery

> Create an original promotional support visual for CHOKMA focused on Thai lottery excitement. Use deep blue and royal gold, elegant numeric motifs, celebratory but clean lighting, and a compact composition suitable for a landing page content block. The visual should feel fast, rewarding, and trustworthy without relying on specific brand references.

### offer-strip-affiliate

> Create an original affiliate-themed support visual for CHOKMA using deep blue and royal gold. Show upward growth cues, connected user nodes, premium referral energy, and a clean campaign aesthetic suitable for mobile landing pages. Keep the scene simple, high-contrast, and conversion-oriented.

### trust-panel

> Create an original support visual for CHOKMA that communicates trust, speed, and premium signup readiness. Use deep blue and royal gold, subtle shield-like geometry, soft highlights, polished surfaces, and clean negative space for overlay copy.

## Quality Gate

ก่อนนำภาพเข้าหน้าเว็บ ให้ตรวจตามตารางนี้

| จุดตรวจ | เกณฑ์ผ่าน |
| --- | --- |
| Brand purity | มีเพียงอัตลักษณ์ CHOKMA และสีที่กำหนด |
| Originality | ไม่เหมือนงานอ้างอิงแบบหนึ่งต่อหนึ่ง |
| CTA compatibility | เมื่อวางคู่กับ headline และปุ่มสมัครแล้วไม่แย่ง focus |
| Mobile readability | ย่อบนมือถือแล้วยังดูชัด ไม่รก |
| Reusability | สามารถนำกลับมาใช้กับบล็อก Landing อื่นได้ |

## Integration Notes

สำหรับรอบนี้ แนะนำให้ใช้ภาพหลักใน Hero ก่อนเป็นลำดับแรก แล้วค่อยเลือกภาพ support เพิ่มอีก 1 ถึง 2 ชิ้นในส่วน trust หรือ offer blocks เพื่อไม่ให้หน้าแน่นเกินไปและยังคงเส้นทาง conversion ที่สั้นตาม requirement ของ CHOKMA

## คู่มือเชิงแนวคิด vs Implementation ที่รันได้จริง

เอกสารฉบับนี้ทำหน้าที่เป็น **คู่มือเชิงแนวคิด** สำหรับการออกแบบ prompt, brand guardrails และ quality gate ของระบบภาพ ส่วน implementation ที่รันซ้ำได้จริงถูกแยกไว้ในไฟล์ `build-chokma-landing-assets.mjs` ซึ่งใช้สร้าง `chokma_generated_assets.md` จากชุด prompt spec และ URL ของ asset ที่ใช้งานจริงบนหน้า Landing

เมื่อมีการ generate ภาพรอบใหม่ ให้ปรับข้อมูล asset ในสคริปต์ดังกล่าว แล้วรันคำสั่ง `node build-chokma-landing-assets.mjs` เพื่ออัปเดต manifest อัตโนมัติ จากนั้นจึงตรวจผ่าน test ของหน้า Landing เพื่อยืนยันว่า URL ที่ใช้งานบนหน้าเว็บยังตรงกับ manifest เวอร์ชันล่าสุด
