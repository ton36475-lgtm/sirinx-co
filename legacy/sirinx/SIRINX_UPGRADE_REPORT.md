# SIRINX Website Upgrade Report

**Version:** 2.0 — Dual-Theme + Solar Digital Agentic Foundation  
**Date:** 12 เมษายน 2026  
**Prepared by:** Manus AI

---

## 1. สรุปภาพรวมการอัปเกรด

เว็บไซต์ SIRINX ได้รับการปรับปรุงครั้งใหญ่จากเวอร์ชันแรก โดยมุ่งเน้น 3 แกนหลัก ได้แก่ **ความคมชัดของ copy และ CTA** ที่เน้นผลลัพธ์ทางธุรกิจ, **ระบบ dual-theme** (Dark Mode: Navy/Cyan/Amber และ Light Mode: White/Orange) ที่ผู้ใช้สลับได้ทันที, และ **โครงสร้างที่พร้อมขยายต่อ** เป็น Solar Digital Agentic Company ในอนาคต เว็บไซต์ประกอบด้วย 11 หน้าที่ทำงานครบถ้วน พร้อม responsive design สำหรับทุกขนาดหน้าจอ

---

## 2. รายการสิ่งที่แก้ไขและปรับปรุง

### 2.1 ระบบ Design System

| หัวข้อ | รายละเอียด |
|--------|-----------|
| Dual-Theme System | สร้างระบบ CSS variables แบบ semantic tokens ที่รองรับทั้ง Light (White/Orange) และ Dark (Navy/Cyan/Amber) โดยอัตโนมัติ |
| Theme Toggle | เพิ่มปุ่มสลับธีม (Sun/Moon icon) ทั้งบน desktop และ mobile พร้อม localStorage persistence |
| Brand Logo | โลโก้ SIRINX ใช้สี brand (Cyan gradient) คงที่ทั้ง 2 โหมด ไม่เปลี่ยนตามธีม |
| Typography | Space Grotesk (display) + IBM Plex Sans Thai (body) พร้อม font hierarchy ที่ชัดเจน |
| Custom Utilities | สร้าง utility classes เช่น `.text-gradient-accent`, `.glass-card`, `.btn-accent`, `.btn-accent-outline`, `.section-alt`, `.divider-accent` ที่ปรับตามธีมอัตโนมัติ |

### 2.2 หน้า Home — ยกระดับเป็นองค์กรพลังงานอัจฉริยะ

การปรับปรุงหน้า Home มุ่งเน้นให้สื่อถึงความเป็นองค์กรพลังงานระดับอนาคต โดยใช้ภาพ hero แบบ cinematic ของโครงสร้างพื้นฐานโซลาร์ พร้อม gradient overlay ที่ปรับตามธีม Badge "Solar Digital Agentic Company" ถูกวางไว้เด่นชัด ส่วน copy ถูกปรับให้กระชับและเน้นผลลัพธ์ทางธุรกิจมากขึ้น

Section ที่เพิ่มและปรับปรุง ได้แก่ **Business Outcomes** (ตัวเลข 30-70% ลดค่าไฟ, 3-5 ปีคืนทุน, 25+ ปีอายุใช้งาน, 99.5% uptime), **Solutions Overview** แบบ card grid, **Process Clarity** (4 ขั้นตอนการทำงาน), **Industries** overview, **Proof/Trust** section พร้อม testimonial placeholder, **Investment Teaser**, และ **Final CTA** ที่คมชัด

### 2.3 หน้า Solutions — แยกชัดเจนและขายได้มากขึ้น

ทุก solution (7 รายการ) ถูกจัดโครงสร้างใหม่ด้วย framework ที่ชัดเจน ได้แก่ "ปัญหาที่ลูกค้าเจอ", "วิธีแก้ของ SIRINX", "เหมาะกับใคร", และ "ประโยชน์ทางธุรกิจ" แต่ละ solution มี CTA เฉพาะตัว เช่น "ขอคำปรึกษา Rooftop Solar" ที่นำไปหน้า Contact โดยตรง

### 2.4 หน้า Industries — Use Case ที่ชัดเจน

แต่ละอุตสาหกรรม (6 กลุ่ม) มีโครงสร้าง "ความท้าทาย + Use Cases + ผลลัพธ์ที่คาดหวัง" ที่ชัดเจน ครอบคลุมโรงงานอุตสาหกรรม, เกษตรกรรม, โรงแรม, สถานศึกษา, อาคารพาณิชย์, และภาครัฐ แต่ละกลุ่มมี outcome card พร้อม CTA เฉพาะทาง

### 2.5 Investment & Tax Hub — น่าเชื่อถือพร้อม Disclaimer ครบ

หน้านี้ได้รับการปรับปรุงให้มี disclaimer banner ที่เด่นชัดตั้งแต่ต้นหน้า, 4 รูปแบบการลงทุน (ซื้อขาด, ผ่อนชำระ, PPA, Co-investment) แต่ละรูปแบบมีคำอธิบายชัดเจน, สิทธิประโยชน์ทางภาษีที่เป็นไปได้ (พร้อม disclaimer), ตัวอย่าง ROI แบบ placeholder, และ disclaimer section ท้ายหน้าที่ครอบคลุม 5 ข้อสำคัญ

### 2.6 หน้าอื่น ๆ ที่สร้างใหม่/ปรับปรุง

| หน้า | สถานะ | รายละเอียดสำคัญ |
|------|--------|----------------|
| About | ปรับปรุง | Vision/Mission, Core Values, End-to-End approach, Timeline |
| Projects | สร้างใหม่ | 6 case studies placeholder, stats strip, card grid |
| Blog/Insights | สร้างใหม่ | SEO-friendly structure, category chips, featured/all posts, newsletter signup |
| BlogPost | สร้างใหม่ | Dynamic slug-based routing, markdown-like rendering, share button |
| Contact | สร้างใหม่ | Contact info cards, lead form (name/company/email/phone/interest/message) |
| Solar Assessment | สร้างใหม่ | 4-step wizard (ประเภทธุรกิจ → ข้อมูลพลังงาน → พื้นที่ → ผลประเมิน) |
| Partner/Investor | สร้างใหม่ | 3 partner types, benefits list, inquiry form |
| 404 | ปรับปรุง | ใช้ semantic dual-theme colors, ภาษาไทย |

### 2.7 Trust Elements ที่เพิ่ม

เว็บไซต์มี trust elements กระจายอยู่ทั่วระบบ ได้แก่ **Proof Blocks** (150+ โครงการ, 50 MW+ กำลังผลิต, 200+ ลูกค้า, 98% ความพึงพอใจ), **Process Clarity** (4 ขั้นตอนการทำงานที่ชัดเจน), **Testimonial** placeholder, **Disclaimer** ครบถ้วนในหน้า Investment, และ **Placeholder notes** ที่ระบุชัดเจนว่าต้องแทนที่ด้วยข้อมูลจริง

### 2.8 CTA Strategy

| ระดับ | CTA | ตำแหน่ง |
|-------|-----|---------|
| Primary | นัดสำรวจหน้างานฟรี / ขอใบเสนอราคา | Navbar, Hero, Final CTA ทุกหน้า |
| Secondary | ประเมินความคุ้มค่า / ขอคำปรึกษา | Hero, Solutions, Industries |
| Tertiary | อ่านบทความ / ดูผลงาน | Home sections, Blog |

### 2.9 Mobile Responsiveness

ทุกหน้าใช้ responsive grid (grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-3/4) พร้อม mobile menu แบบ slide-down, touch-friendly button sizes (py-3.5+), และ readable font sizes บน mobile

---

## 3. โครงสร้างที่พร้อมสำหรับ Solar Digital Agentic Company

### 3.1 หน้าที่ควรเชื่อมต่อกับ Workflow อัตโนมัติในอนาคต

| หน้า/Component | Workflow ที่ควรเชื่อมต่อ | ลำดับความสำคัญ |
|----------------|------------------------|---------------|
| Contact Form | **Proposal Intake Flow** — ส่งข้อมูลไป CRM อัตโนมัติ, สร้าง lead record, trigger follow-up sequence | สูงมาก |
| Solar Assessment | **Solar Assessment Workflow** — ส่งผลประเมินไปทีมวิศวกร, สร้าง preliminary proposal, schedule site survey | สูงมาก |
| Partner/Investor Form | **Partner/Investor Inquiry Workflow** — route ไป BD team, classify inquiry type, trigger appropriate response | สูง |
| Blog/Insights | **Content Operating System** — auto-publish from CMS, SEO optimization, internal linking | สูง |
| Projects/Case Studies | **Case Study Publishing System** — structured data input, auto-generate cards, link to solutions | ปานกลาง |
| Investment Hub | **Lead Qualification Flow** — track engagement, score leads based on pages visited | ปานกลาง |

### 3.2 Component/Section ที่ควรออกแบบเผื่อ Data-Driven Updates

| Component | Data Source ในอนาคต | การเปลี่ยนแปลงที่ต้องทำ |
|-----------|---------------------|------------------------|
| Home — Business Outcomes (150+, 50 MW+, etc.) | Database / API — อัปเดตตัวเลขจริงอัตโนมัติ | เปลี่ยนจาก static data เป็น API fetch |
| Home — Proof/Trust section | CRM + Project DB — ดึงจำนวนโครงการ/ลูกค้าจริง | Connect to backend API |
| Projects cards | Project Management System — auto-generate จาก project completion | Replace static array with API |
| Blog posts | Headless CMS (Payload/Directus) — publish workflow | Replace static postData with CMS API |
| Industries — outcome metrics | Analytics + Project DB — ผลลัพธ์จริงจากโครงการ | Dynamic metrics per industry |
| Solar Assessment results | Engineering calculation engine — ผลคำนวณที่แม่นยำขึ้น | Connect to backend calculation API |

### 3.3 โครงสร้างเว็บไซต์ที่ขยายต่อได้ง่าย

โครงสร้างปัจจุบันถูกออกแบบด้วยหลักการ **modular architecture** ดังนี้

**Routing Layer** — App.tsx ใช้ React Router (Wouter) ที่เพิ่ม route ใหม่ได้ง่าย เช่น `/portal`, `/dashboard`, `/admin` สำหรับ future customer portal และ asset intelligence dashboard

**Layout System** — Layout.tsx แยก Navbar/Footer เป็น component อิสระ สามารถสร้าง layout variants ได้ เช่น DashboardLayout สำหรับ portal, AdminLayout สำหรับ backend

**Design Token System** — CSS variables ทั้งหมดอยู่ใน index.css ที่เดียว เปลี่ยน theme หรือเพิ่ม theme ใหม่ได้โดยไม่กระทบ component code

**Data Layer** — ข้อมูลทั้งหมด (solutions, industries, projects, blog posts) ถูกแยกเป็น data arrays ที่ด้านบนของแต่ละ file สามารถย้ายไป shared data files หรือ API ได้ง่าย

**Form Architecture** — ทุก form ใช้ controlled state pattern ที่พร้อมเชื่อมต่อ backend API เพียงเปลี่ยน toast handler เป็น API call

---

## 4. Development Roadmap

### Phase 2 — Backend Integration & Content System (แนะนำ: 4-6 สัปดาห์)

Phase นี้มุ่งเน้นการเชื่อมต่อ backend เพื่อให้เว็บไซต์ทำงานได้จริง โดยเริ่มจากการ upgrade เป็น full-stack project ด้วย `webdev_add_feature("web-db-user")` เพื่อเปิดใช้ database, backend API, และ user authentication จากนั้นสร้าง **Content Operating System** ที่ประกอบด้วย Headless CMS สำหรับ blog/insights, case study publishing pipeline, และ editorial workflow พร้อมกันนั้นสร้าง **Lead Management System** ที่เชื่อมต่อ Contact form, Assessment form, และ Partner form เข้ากับ database พร้อม lead scoring logic และ email notification

| Task | Priority | Effort |
|------|----------|--------|
| Upgrade to full-stack (web-db-user) | สูงมาก | 1 วัน |
| Database schema สำหรับ leads, projects, blog posts | สูงมาก | 2-3 วัน |
| API endpoints สำหรับ form submissions | สูงมาก | 2-3 วัน |
| Headless CMS integration สำหรับ blog | สูง | 1 สัปดาห์ |
| Case study publishing system | สูง | 1 สัปดาห์ |
| Email notification system | สูง | 2-3 วัน |
| SEO metadata management | ปานกลาง | 2-3 วัน |
| Analytics integration (beyond Umami) | ปานกลาง | 1-2 วัน |

### Phase 3 — Intelligent Workflows & Portal (แนะนำ: 8-12 สัปดาห์)

Phase นี้เปลี่ยน SIRINX จากเว็บไซต์เป็น **Solar Digital Agentic Platform** โดยสร้าง **Proposal Intake Flow** ที่รับข้อมูลจาก assessment → สร้าง preliminary proposal อัตโนมัติ → ส่งให้ทีมวิศวกร review, **Lead Qualification Flow** ที่ score leads จาก behavior (หน้าที่เข้าชม, form ที่กรอก, เวลาที่ใช้) → route ไปทีมที่เหมาะสม, **Solar Assessment Workflow** ที่เชื่อมต่อ engineering calculation engine → ให้ผลประเมินที่แม่นยำขึ้น → auto-schedule site survey, และ **Customer Portal** (future) สำหรับลูกค้าที่ติดตั้งแล้ว ดูข้อมูลระบบ, รายงานผลผลิต, ค่าไฟที่ประหยัด

| Task | Priority | Effort |
|------|----------|--------|
| Proposal auto-generation engine | สูงมาก | 2-3 สัปดาห์ |
| Lead scoring & routing system | สูง | 1-2 สัปดาห์ |
| Engineering calculation API | สูง | 2-3 สัปดาห์ |
| Customer portal (basic) | ปานกลาง | 3-4 สัปดาห์ |
| Asset intelligence dashboard | ปานกลาง | 3-4 สัปดาห์ |
| Partner/investor portal | ปานกลาง | 2 สัปดาห์ |
| Automated reporting system | ต่ำ | 2 สัปดาห์ |
| Self-improvement analytics | ต่ำ | 1-2 สัปดาห์ |

### Phase 4+ — Self-Improving Agentic System (ระยะยาว)

ในระยะยาว ระบบควรพัฒนาไปสู่ **Executive Command Center** ที่แสดง KPI ทั้งหมดในที่เดียว (leads, conversion rate, project pipeline, revenue forecast), **Asset Intelligence OS** ที่ monitor ระบบโซลาร์ทั้งหมดแบบ real-time พร้อม anomaly detection และ predictive maintenance, **Self-Improvement Protocol** ที่วิเคราะห์ conversion data → แนะนำ copy/CTA improvements → A/B testing อัตโนมัติ, และ **Multi-Agent Orchestration** ที่ใช้ AI agents ทำงานร่วมกันในการ content creation, lead qualification, proposal drafting, และ customer support

---

## 5. จุดที่ต้องดำเนินการก่อนใช้งานจริง

### ข้อมูลที่ต้องแทนที่ Placeholder

| รายการ | หน้า | หมายเหตุ |
|--------|------|---------|
| เบอร์โทรศัพท์จริง | Layout (Footer), Contact | ปัจจุบันใช้ 02-XXX-XXXX |
| อีเมลจริง | Layout (Footer), Contact | ปัจจุบันใช้ info@sirinx.co.th |
| ที่อยู่สำนักงาน | Contact | ปัจจุบันเป็น placeholder |
| ข้อมูลโครงการจริง | Projects | ปัจจุบันใช้ 6 case studies placeholder |
| ตัวเลข business outcomes จริง | Home | 150+ โครงการ, 50 MW+ ฯลฯ ต้องยืนยัน |
| Testimonial จริง | Home | ปัจจุบันเป็น placeholder |
| บทความ blog จริง | Blog, BlogPost | ปัจจุบันใช้ placeholder content |
| Timeline/milestones จริง | About | ปัจจุบันเป็น placeholder |
| ข้อมูลภาษี/สิทธิประโยชน์ | Investment Hub | ต้อง review โดยผู้เชี่ยวชาญก่อนใช้งาน |
| สูตรคำนวณ ROI ที่แม่นยำ | Solar Assessment | ปัจจุบันใช้สูตรประมาณการอย่างง่าย |

### Governance Flags (ต้อง Review ก่อน Publish)

ตามหลัก SIRINX Governance ที่กำหนดไว้ เนื้อหาต่อไปนี้จัดเป็น **Class C** ที่ห้าม auto-publish โดยเด็ดขาด ได้แก่ ตัวเลข ROI และผลตอบแทนทั้งหมดในหน้า Investment Hub, ข้อมูลสิทธิประโยชน์ทางภาษี (BOI, หักค่าเสื่อม, carbon credit), ราคาและเงื่อนไขการลงทุน, ข้อมูลติดต่อและที่อยู่จริง, และ legal disclaimers ทั้งหมด

---

## 6. สถาปัตยกรรมไฟล์ปัจจุบัน

```
client/src/
├── App.tsx                    # Routes + ThemeProvider (switchable, dark default)
├── index.css                  # Dual-theme design tokens (Light/Dark)
├── components/
│   ├── Layout.tsx             # Navbar + Footer + Theme Toggle
│   ├── ErrorBoundary.tsx      # Error handling
│   └── ui/                    # shadcn/ui components
├── contexts/
│   └── ThemeContext.tsx        # Theme state + localStorage persistence
├── pages/
│   ├── Home.tsx               # Hero + Outcomes + Solutions + Process + Industries + Proof + CTA
│   ├── About.tsx              # Vision + Values + End-to-End + Timeline
│   ├── Solutions.tsx          # 7 solutions with problem/solution/suitable/benefits
│   ├── Industries.tsx         # 6 industries with challenge/useCases/outcome
│   ├── InvestmentTaxHub.tsx   # Investment models + Tax benefits + Disclaimers
│   ├── Projects.tsx           # Case studies grid + stats
│   ├── Blog.tsx               # SEO blog index + categories + newsletter
│   ├── BlogPost.tsx           # Dynamic blog post detail
│   ├── Contact.tsx            # Contact info + Lead form
│   ├── SolarAssessment.tsx    # 4-step assessment wizard
│   ├── Partner.tsx            # Partner types + Inquiry form
│   └── NotFound.tsx           # 404 page (dual-theme)
```
