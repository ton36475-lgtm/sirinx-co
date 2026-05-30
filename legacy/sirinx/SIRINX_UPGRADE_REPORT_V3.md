# SIRINX Website Upgrade Report — Version 3.0

## Solar Digital Agentic Company Platform

---

## สรุปภาพรวมการอัพเกรด

เว็บไซต์ SIRINX ได้รับการอัพเกรดครั้งใหญ่จากเวอร์ชัน 2.0 สู่ 3.0 โดยเน้นการสร้างเครื่องมือคำนวณระบบโซลาร์ขั้นสูงที่ลูกค้าสามารถมีส่วนร่วมในการคำนวณระบบของตัวเองได้จริง พร้อมระบบ BESS ที่ครอบคลุมการทำงานหน้างาน และการใช้รูปหน้างานติดตั้งจริง 22 รูปจากโครงการจริงของ SIRINX

---

## 1. รายการสิ่งที่แก้ไขและเพิ่มเติม

### 1.1 Solar + BESS Engineering Calculator (1,857 บรรทัด)

เครื่องมือคำนวณระบบโซลาร์ขั้นสูงระดับวิศวกรรมที่ลูกค้าสามารถคำนวณเองได้จริง ประกอบด้วย 5 ขั้นตอนหลัก:

| ขั้นตอน | รายละเอียด | ข้อมูลที่ใช้ |
|---------|-----------|-------------|
| Step 1: ข้อมูลธุรกิจ | ประเภทธุรกิจ, ค่าไฟรายเดือน, ชั่วโมงทำงาน, load profile | อัตราค่าไฟตามประเภท MEA/PEA, TOU rates |
| Step 2: ข้อมูลหลังคา | พื้นที่, ประเภทหลังคา, ทิศทาง, มุมเอียง | Usable ratio, load capacity ตามประเภท |
| Step 3: ภูมิภาค | 6 ภูมิภาคของไทย | PSH, GHI, temperature coefficient เฉพาะภูมิภาค |
| Step 4: BESS | ชั่วโมง backup, peak shaving, night coverage | DoD 90%, round-trip efficiency 92%, cycle life 6,000 |
| Step 5: การเงิน | อัตราเงินเฟ้อค่าไฟ, ส่วนลดภาษี BOI/EEC | 25-year NPV, IRR, LCOE calculation |

**สูตรคำนวณหลักที่ใช้:**

ระบบใช้สูตรวิศวกรรมจริงสำหรับประเทศไทย ได้แก่ การคำนวณ Peak Sun Hours (PSH) ตามภูมิภาค, Performance Ratio ที่คำนึงถึง temperature coefficient, inverter efficiency, soiling loss, และ cable loss รวมถึงการคำนวณ degradation rate 0.5% ต่อปีตลอดอายุ 25 ปี สำหรับ BESS ใช้ Depth of Discharge 90%, round-trip efficiency 92%, และ cycle life 6,000 cycles

**ระบบตรวจสอบความสมเหตุสมผล (Feasibility Checks):**

ระบบจะแจ้งเตือนอัตโนมัติเมื่อพบว่าขนาดระบบไม่สมเหตุสมผล เช่น พื้นที่หลังคาไม่เพียงพอสำหรับขนาดระบบที่ต้องการ, น้ำหนักแผงเกินกว่าโครงสร้างหลังคารับได้, หรือ self-consumption ratio ต่ำเกินไปซึ่งหมายความว่าระบบใหญ่เกินความต้องการ

**ผลลัพธ์ที่แสดง (4 แท็บ):**

แท็บ Overview แสดงตัวเลขสำคัญ ได้แก่ ขนาดระบบ, ค่าไฟที่ประหยัดต่อปี, ระยะเวลาคืนทุน, และ ROI 25 ปี พร้อมกราฟ hourly production profile และ monthly production chart แท็บ Technical แสดงรายละเอียดทางวิศวกรรม ได้แก่ จำนวนแผง, inverter sizing, cable sizing, และ structural load แท็บ Financial แสดง 25-year cash flow projection ปีต่อปี พร้อม cumulative savings และ NPV แท็บ BESS แสดงขนาดแบตเตอรี่, ชั่วโมง backup, peak shaving savings, และ combined ROI

### 1.2 รูปหน้างานจริง 22 รูปอัพโหลดขึ้น CDN

รูปถ่ายจากหน้างานติดตั้งจริงของ SIRINX จำนวน 22 รูป ได้รับการจัดหมวดหมู่และอัพโหลดขึ้น CDN เพื่อใช้ในหน้า Projects/Case Studies, Home gallery, และหน้าอื่น ๆ ที่เกี่ยวข้อง ครอบคลุมภาพ rooftop installation, floating solar, carport, inverter room, และ monitoring system

### 1.3 ปรับปรุงหน้า Contact — Lead Qualification

หน้า Contact ได้รับการอัพเกรดให้รองรับ URL parameter prefill จากผลคำนวณ Solar Assessment โดยอัตโนมัติ เมื่อลูกค้ากดปุ่ม "ขอใบเสนอราคา" จากหน้าคำนวณ ข้อมูลขนาดระบบ, ประเภทธุรกิจ, ค่าไฟปัจจุบัน, และข้อมูล BESS จะถูกส่งต่อมายังแบบฟอร์มโดยอัตโนมัติ เพิ่มฟิลด์ lead qualification ได้แก่ งบประมาณ, ระยะเวลา, และพื้นที่หลังคา

### 1.4 ปรับปรุงหน้า Partner/Investor

เพิ่มข้อมูล market opportunity ของตลาดโซลาร์ไทย, partnership types 3 รูปแบบ (investor, business partner, EPC partner), แบบฟอร์ม lead qualification สำหรับนักลงทุน, และ investment disclaimer

### 1.5 ปรับปรุงหน้า Projects/Case Studies

เพิ่ม case studies เป็น 8 โครงการ โดยใช้รูปหน้างานจริงจาก CDN, เพิ่ม photo gallery 22 รูปพร้อม lightbox, เพิ่ม filter ตามประเภทโซลูชัน, และ summary stats strip

### 1.6 ปรับปรุงหน้า Blog/Insights

เพิ่มบทความ placeholder เป็น 9 บทความที่ครอบคลุม content marketing pillars ทั้ง 5 ได้แก่ Technology, Business, Industry, Investment, และ Sustainability พร้อม category filtering, search, newsletter CTA, และ full article content สำหรับทุก slug

---

## 2. โครงสร้างเว็บไซต์ปัจจุบัน (11 หน้า + 1 Layout)

| หน้า | เส้นทาง | บรรทัด | สถานะ |
|------|---------|--------|-------|
| Home | `/` | 399 | ครบถ้วน |
| About | `/about` | 163 | ครบถ้วน |
| Solutions | `/solutions` | 166 | ครบถ้วน |
| Industries | `/industries` | 168 | ครบถ้วน |
| Investment & Tax Hub | `/investment` | 213 | ครบถ้วน |
| Projects / Case Studies | `/projects` | 329 | ครบถ้วน |
| Blog / Insights | `/blog` | 372 | ครบถ้วน |
| Blog Post | `/blog/:slug` | 383 | ครบถ้วน |
| Contact | `/contact` | 291 | ครบถ้วน |
| Solar Assessment | `/assessment` | 1,857 | ครบถ้วน |
| Partner / Investor | `/partner` | 285 | ครบถ้วน |
| Layout (Navbar + Footer) | — | ~350 | ครบถ้วน |

---

## 3. หน้าที่ควรเชื่อมต่อกับ Workflow อัตโนมัติในอนาคต

| หน้า | Workflow ที่ควรเชื่อมต่อ | ลำดับความสำคัญ |
|------|------------------------|---------------|
| `/assessment` | Solar Assessment Workflow — ส่งผลคำนวณไปยัง CRM, สร้าง proposal อัตโนมัติ | สูงมาก |
| `/contact` | Lead Qualification Flow — auto-scoring, auto-assign ให้ทีมขาย, email notification | สูงมาก |
| `/partner` | Partner/Investor Inquiry Workflow — แยก pipeline, due diligence checklist | สูง |
| `/blog` | Content Operating System — CMS, auto-publish, SEO tracking, social sharing | สูง |
| `/projects` | Case Study Publishing System — template-based, auto-generate from project data | ปานกลาง |
| `/investment` | Investor Portal — real-time portfolio dashboard, document vault | ปานกลาง |

### รายละเอียด Workflow แต่ละระบบ

**Solar Assessment Workflow** ควรเชื่อมต่อกับ CRM เพื่อสร้าง lead อัตโนมัติเมื่อลูกค้ากรอกข้อมูลครบ ส่งผลคำนวณเป็น PDF ไปยังอีเมลลูกค้า และสร้าง proposal draft อัตโนมัติจากข้อมูลที่คำนวณได้ ทีมวิศวกรจะได้รับ notification พร้อมข้อมูลเบื้องต้นเพื่อเตรียมการสำรวจหน้างาน

**Lead Qualification Flow** ควรมีระบบ scoring อัตโนมัติจากข้อมูลที่ลูกค้ากรอก เช่น ขนาดงบประมาณ, ระยะเวลาที่ต้องการ, และประเภทธุรกิจ เพื่อจัดลำดับความสำคัญของ lead และ auto-assign ให้ทีมขายที่เหมาะสม

**Content Operating System** ควรเปลี่ยนจาก static blog posts เป็น CMS-driven content ที่รองรับ scheduling, A/B testing, และ analytics integration เพื่อวัดผล content marketing ได้จริง

---

## 4. Component/Section ที่ควรออกแบบเผื่อ Data-Driven Updates

| Component | ข้อมูลที่ควรเป็น Dynamic | แหล่งข้อมูล |
|-----------|------------------------|-------------|
| Home — Proof Block (150+ โครงการ, 30+ MW) | ดึงจาก project database | Project Management System |
| Home — Site Photos Gallery | ดึงจาก media library | S3 + CMS |
| Projects — Case Studies | ดึงจาก project database | CRM + Project DB |
| Blog — Articles | ดึงจาก CMS | Headless CMS |
| Assessment — Engineering Constants | ดึงจาก config database | Admin Panel |
| Assessment — Pricing (ค่าแผง, inverter, BESS) | ดึงจาก pricing database | Supplier API |
| Investment — Tax Incentives | ดึงจาก regulatory database | BOI/EEC API |
| Industries — Use Cases | ดึงจาก case study database | CRM |

---

## 5. Roadmap การพัฒนาต่อ

### Phase 2: Digital Infrastructure (เดือนที่ 1-3)

Phase 2 มุ่งเน้นการสร้างโครงสร้างพื้นฐานดิจิทัลที่จำเป็นสำหรับการทำงานจริง ประกอบด้วยการ upgrade เป็น full-stack project เพื่อเชื่อมต่อ form submissions กับ database และ email notification, การสร้าง CRM integration สำหรับ lead management, การเพิ่ม PDF export สำหรับผลคำนวณ Solar Assessment, การสร้าง admin panel สำหรับจัดการ content และ projects, และการเพิ่ม Google Analytics / conversion tracking

| งาน | รายละเอียด | ระยะเวลา |
|-----|-----------|----------|
| Full-stack upgrade | Database, API, email notification | 2 สัปดาห์ |
| CRM integration | Lead scoring, auto-assign, pipeline | 2 สัปดาห์ |
| PDF export | Solar Assessment results as PDF | 1 สัปดาห์ |
| Admin panel | Content, projects, pricing management | 3 สัปดาห์ |
| Analytics | GA4, conversion tracking, heatmaps | 1 สัปดาห์ |

### Phase 3: Agentic Platform (เดือนที่ 4-8)

Phase 3 เป็นการยกระดับเป็น Solar Digital Agentic Company เต็มรูปแบบ ประกอบด้วยการสร้าง Customer Portal ที่ลูกค้าสามารถดูสถานะโครงการ, ผลผลิตพลังงาน, และเอกสารต่าง ๆ ได้แบบ real-time, การสร้าง Asset Intelligence Dashboard ที่แสดงข้อมูลจาก IoT sensors ของระบบโซลาร์ทั้งหมด, การสร้าง Proposal Automation ที่สร้างใบเสนอราคาอัตโนมัติจากผลคำนวณ, และการสร้าง AI Chatbot ที่ตอบคำถามเบื้องต้นเกี่ยวกับระบบโซลาร์

| งาน | รายละเอียด | ระยะเวลา |
|-----|-----------|----------|
| Customer Portal | Project status, energy production, documents | 4 สัปดาห์ |
| Asset Intelligence Dashboard | IoT data, predictive maintenance, alerts | 6 สัปดาห์ |
| Proposal Automation | Auto-generate from calculator results | 3 สัปดาห์ |
| AI Chatbot | FAQ, lead qualification, appointment booking | 3 สัปดาห์ |
| Partner Portal | Investment tracking, document vault, reporting | 3 สัปดาห์ |

### Phase 4: Scale & Optimize (เดือนที่ 9-12)

Phase 4 เป็นการขยายและเพิ่มประสิทธิภาพระบบทั้งหมด ประกอบด้วย multi-language support (EN/TH/CN), advanced SEO automation, A/B testing framework, integration กับ LINE OA และ social platforms, และ white-label solution สำหรับ partner network

---

## 6. จุดที่ควรพัฒนาต่อเป็นเฟสถัดไป (Priority List)

**ลำดับความสำคัญสูงมาก (ควรทำทันที):**

การเชื่อมต่อ form submissions กับ backend เป็นสิ่งแรกที่ควรทำ เพราะปัจจุบันทุก form (Contact, Partner, Assessment) ยังเป็น client-side only ไม่ได้ส่งข้อมูลไปที่ใด การ upgrade เป็น full-stack และเพิ่ม database จะทำให้ระบบ lead capture ทำงานได้จริง

การเพิ่ม PDF export สำหรับ Solar Assessment เป็นสิ่งที่ลูกค้าต้องการมากที่สุด เพราะผลคำนวณที่ได้จากเครื่องมือมีรายละเอียดมาก ลูกค้าต้องการบันทึกและแชร์ให้ผู้มีอำนาจตัดสินใจ

**ลำดับความสำคัญสูง:**

การแทนที่ placeholder data ด้วยข้อมูลจริง ได้แก่ เบอร์โทร, อีเมล, ที่อยู่สำนักงาน, ตัวเลข business outcomes (150+ โครงการ, 30+ MW), และ case studies จริง

การสร้าง CMS สำหรับ blog content เพื่อให้ทีม marketing สามารถเพิ่มบทความใหม่ได้โดยไม่ต้องแก้โค้ด

**ลำดับความสำคัญปานกลาง:**

การเพิ่ม Google Maps integration สำหรับแสดงตำแหน่งโครงการ, การเพิ่ม testimonials จากลูกค้าจริง, การสร้าง pricing calculator ที่ดึงราคาอุปกรณ์จริงจาก supplier, และการเพิ่ม multi-language support

---

## 7. Technical Stack Summary

| เทคโนโลยี | เวอร์ชัน | หมายเหตุ |
|-----------|---------|----------|
| React | 19.2.1 | SPA with client-side routing |
| Tailwind CSS | 4.1.14 | Custom design tokens, dual-theme |
| Framer Motion | 12.23.22 | Animations and transitions |
| Wouter | 3.3.5 | Lightweight routing |
| Recharts | 2.15.2 | Charts in Solar Assessment |
| TypeScript | 5.6.3 | Full type safety, 0 errors |
| Vite | 7.1.7 | Build tool and dev server |

---

*รายงานนี้จัดทำเมื่อ 12 เมษายน 2569 — SIRINX Website v3.0*
