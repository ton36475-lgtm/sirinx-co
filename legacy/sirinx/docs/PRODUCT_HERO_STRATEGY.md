# SIRINX Product Hero Strategy & Full System Development Roadmap

**Version:** 1.0  
**Date:** April 14, 2026  
**Author:** Manus AI for SIRINX  

---

## Executive Summary

SIRINX ดำเนินธุรกิจด้านพลังงานสะอาดครบวงจร โดยมีผลิตภัณฑ์หลัก 6 สาย ได้แก่ Solar Carport, Rooftop Solar, Floating Solar, BESS/ESS, AI Energy Management และ Physical AI O&M Service ปัจจุบันเว็บไซต์ให้ความสำคัญกับ Solar Carport เป็นพิเศษ (มีหน้า dedicated page เต็มรูปแบบ) ในขณะที่ผลิตภัณฑ์อื่นอีก 5 สายถูกจัดอยู่เป็นเพียง section ย่อยในหน้า Solutions เท่านั้น

เอกสารฉบับนี้นำเสนอกลยุทธ์ **"Product Hero Elevation"** เพื่อยกระดับทุกผลิตภัณฑ์ให้มีความโดดเด่นเท่าเทียมกัน พร้อม Roadmap การพัฒนาระบบทั้งหมดที่ไม่ขัดแย้งกับสถาปัตยกรรมเดิม

---

## 1. Current State Analysis

### 1.1 Product Visibility Matrix

ตารางด้านล่างแสดงสถานะการนำเสนอผลิตภัณฑ์แต่ละตัวบนเว็บไซต์ปัจจุบัน โดยประเมินจาก 5 มิติ ได้แก่ Dedicated Page, Hero Slideshow, Navigation Prominence, SEO Landing, และ Real Project Gallery

| Product | Dedicated Page | Hero Slides | Nav Prominence | SEO Landing | Gallery | **Hero Score** |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Solar Carport** | /solar-carport (634 lines) | 4 slides | Direct + Dropdown | Strong | 12 real photos | **10/10** |
| **Rooftop Solar** | None | 1 slide | Dropdown only | Weak | AI-generated | **3/10** |
| **Floating Solar** | None | 1 slide | Dropdown only | Weak | AI-generated | **3/10** |
| **BESS / ESS** | None | 1 slide | Dropdown only | Weak | AI-generated | **3/10** |
| **AI Energy Mgmt** | None | 1 slide | Dropdown only | Weak | None | **2/10** |
| **O&M Service** | None | 0 slides | Dropdown only | None | None | **1/10** |
| **Co-investment** | /investment (partial) | 0 slides | Dropdown | Moderate | None | **4/10** |

ช่องว่างชัดเจน: Solar Carport ได้คะแนน 10/10 ในขณะที่ผลิตภัณฑ์อื่นได้เพียง 1-4/10 ซึ่งหมายความว่าลูกค้าที่สนใจ Rooftop Solar หรือ BESS จะไม่พบข้อมูลเชิงลึกเพียงพอบนเว็บไซต์

### 1.2 i18n Coverage Status

| Component | TH | EN | CN | Method |
|-----------|:---:|:---:|:---:|--------|
| Layout (Navbar/Footer) | Done | Done | Done | LanguageContext global t() |
| Home.tsx | Done | Done | Done | usePageTranslation |
| HeroSlideshow | Done | Done | Done | usePageTranslation |
| SolarCarport.tsx | Hardcoded | None | None | Not started |
| Solutions.tsx | Hardcoded | None | None | Not started |
| Industries.tsx | Hardcoded | None | None | Not started |
| Pricing.tsx | Hardcoded | None | None | Not started |
| Projects.tsx | Hardcoded | None | None | Not started |
| Contact.tsx | Hardcoded | None | None | Not started |
| Assessment.tsx | Hardcoded | None | None | Not started |
| About.tsx | Hardcoded | None | None | Not started |
| Blog.tsx | Hardcoded | None | None | Not started |
| InvestmentTaxHub.tsx | Hardcoded | None | None | Not started |
| Strategy.tsx | Hardcoded | None | None | Not started |
| Partner.tsx | Hardcoded | None | None | Not started |

---

## 2. Product Hero Elevation Strategy

### 2.1 Design Principle: "Product Page Factory"

แทนที่จะสร้างหน้าเฉพาะทางสำหรับแต่ละผลิตภัณฑ์แบบ ad-hoc (เหมือนที่ทำกับ SolarCarport.tsx) เราจะใช้แนวคิด **Product Page Factory** ซึ่งเป็นรูปแบบที่ใช้ template component เดียวกัน แต่ขับเคลื่อนด้วยข้อมูลเฉพาะผลิตภัณฑ์ (data-driven) วิธีนี้มีข้อดีหลายประการ:

**ความสม่ำเสมอของ UX** — ลูกค้าจะได้รับประสบการณ์เดียวกันไม่ว่าจะดูผลิตภัณฑ์ใด ทำให้เกิดความน่าเชื่อถือ ทุกหน้าผลิตภัณฑ์จะมีโครงสร้างเดียวกัน: Hero Section, Benefits Grid, Integration/Specs, Industry Fit, Gallery, FAQ, และ CTA

**ประสิทธิภาพในการพัฒนา** — เมื่อ template พร้อม การเพิ่มผลิตภัณฑ์ใหม่ใช้เวลาเพียงสร้าง data file ไม่ต้องเขียน UI ใหม่ทั้งหมด

**i18n Built-in** — Translation keys ถูกฝังในโครงสร้างข้อมูลตั้งแต่ต้น ทำให้ทุกผลิตภัณฑ์ใหม่รองรับ 3 ภาษาทันที

**ไม่ขัดแย้งกับระบบเดิม** — SolarCarport.tsx ที่มีอยู่แล้วจะยังคงทำงานได้ตามปกติ เราจะค่อยๆ migrate เข้าสู่ระบบใหม่ หรือคงไว้เป็น custom page ก็ได้

### 2.2 Product Page Template Structure

```
┌─────────────────────────────────────────┐
│  HERO SECTION                           │
│  - Full-width image/video               │
│  - Product name + tagline               │
│  - Key metrics strip (4 items)          │
│  - 2 CTAs: Quote + Assessment           │
├─────────────────────────────────────────┤
│  BENEFITS GRID (6 cards)                │
│  - Icon + Title + Description           │
│  - Animated on scroll                   │
├─────────────────────────────────────────┤
│  INTEGRATION / HOW IT WORKS             │
│  - Image + Text split layout            │
│  - Step-by-step flow                    │
├─────────────────────────────────────────┤
│  MID-PAGE CTA                           │
├─────────────────────────────────────────┤
│  SPECIFICATIONS TABLE                   │
│  - Technical specs in clean table       │
├─────────────────────────────────────────┤
│  INDUSTRY FIT (4 cards)                 │
│  - Which industries benefit most        │
├─────────────────────────────────────────┤
│  REAL GALLERY (if available)            │
│  - Real photos with lightbox            │
│  - Or "Rendering" badge for concepts    │
├─────────────────────────────────────────┤
│  O&M / AFTER-SALES                      │
│  - Service commitment                   │
├─────────────────────────────────────────┤
│  FINANCING OPTIONS (3 cards)            │
├─────────────────────────────────────────┤
│  FAQ ACCORDION                          │
│  - JSON-LD for Google Rich Results      │
├─────────────────────────────────────────┤
│  FINAL CTA                              │
│  - Strong closing with 2 buttons        │
└─────────────────────────────────────────┘
```

### 2.3 New Product Pages to Create

| Product | Route | Priority | Image Strategy | Est. Effort |
|---------|-------|----------|----------------|-------------|
| Rooftop Solar | /rooftop-solar | **High** | AI-generated realistic | 1 session |
| Floating Solar | /floating-solar | **High** | AI-generated realistic | 1 session |
| BESS / ESS | /bess | **High** | AI-generated realistic | 1 session |
| AI Energy Management | /ai-energy | **Medium** | AI-generated + dashboard mockup | 1 session |
| O&M Service | /om-service | **Medium** | AI-generated + team photos | 1 session |

### 2.4 Navigation Update Plan

เมื่อสร้างหน้าผลิตภัณฑ์ใหม่แล้ว จะต้องอัปเดต Navigation ให้ทุกผลิตภัณฑ์มี direct link:

```
Solutions (Dropdown)
├── Solar Carport      → /solar-carport     (existing)
├── Rooftop Solar      → /rooftop-solar     (NEW)
├── Floating Solar     → /floating-solar    (NEW)
├── BESS / ESS         → /bess              (NEW)
├── AI Energy Mgmt     → /ai-energy         (NEW)
├── O&M Service        → /om-service        (NEW)
└── All Solutions      → /solutions         (existing, becomes overview)
```

---

## 3. Full System Development Roadmap

### Phase A: i18n Completion (Current Priority)

**เป้าหมาย:** ทุกเนื้อหาบนเว็บไซต์เปลี่ยนภาษาตาม TH/EN/CN ที่เลือก

**ขอบเขต:** 11 หน้าที่ยังเป็น hardcoded Thai ต้องแปลงเป็น usePageTranslation ทั้งหมด

**แนวทาง:** สร้าง translation file แยกต่อหน้า (client/src/i18n/pages/*.ts) เพื่อไม่ให้ไฟล์ใหญ่เกินไป และใช้ usePageTranslation hook ที่สร้างไว้แล้ว

**ลำดับการทำ:**
1. SolarCarport → Solutions → Industries (เนื้อหาผลิตภัณฑ์หลัก)
2. Pricing → Projects → Contact (หน้าที่ลูกค้าใช้บ่อย)
3. Assessment → About → Blog → Investment → Strategy → Partner (หน้าเสริม)

### Phase B: Product Page Factory (Next Major Phase)

**เป้าหมาย:** สร้างหน้าผลิตภัณฑ์เฉพาะทางสำหรับทุกผลิตภัณฑ์

**แนวทางที่ไม่ขัดแย้งกับระบบเดิม:**

1. **สร้าง ProductPageTemplate component** — reusable template ที่รับ product data เป็น props
2. **สร้าง product data files** — แต่ละผลิตภัณฑ์มีไฟล์ข้อมูลของตัวเอง (specs, benefits, FAQ, images)
3. **สร้าง route pages** — แต่ละหน้าเป็น thin wrapper ที่ import template + data
4. **อัปเดต Solutions.tsx** — เปลี่ยนจากหน้ารวมเนื้อหาเป็นหน้า overview/comparison ที่ link ไปหน้าเฉพาะ
5. **อัปเดต Navigation** — เพิ่ม direct links สำหรับทุกผลิตภัณฑ์
6. **Generate images** — สร้างภาพสมจริงสำหรับแต่ละผลิตภัณฑ์

**ไม่ต้องแก้ไข:**
- SolarCarport.tsx ยังคงทำงานได้ (เป็น custom page ที่มีรูปจริง)
- Home.tsx ยังคงเหมือนเดิม (HeroSlideshow ทำงานอยู่แล้ว)
- Layout.tsx ไม่ต้องเปลี่ยนโครงสร้าง (เพิ่มแค่ nav items)

### Phase C: Content & SEO Enhancement

**เป้าหมาย:** เพิ่มคุณภาพเนื้อหาและ SEO สำหรับทุกผลิตภัณฑ์

| Feature | Description | Impact |
|---------|-------------|--------|
| Product Comparison Page | ตารางเปรียบเทียบทุกผลิตภัณฑ์ | ช่วยลูกค้าตัดสินใจ |
| Case Study Detail Pages | หน้ารายละเอียดผลงานแต่ละโครงการ | สร้างความน่าเชื่อถือ |
| Per-Product ROI Calculator | เครื่องคำนวณ ROI เฉพาะผลิตภัณฑ์ | เพิ่ม engagement |
| Video Integration | วิดีโอผลงาน/สัมภาษณ์ลูกค้า | เพิ่ม conversion |
| Blog Content Strategy | บทความ SEO สำหรับแต่ละ product keyword | เพิ่ม organic traffic |
| Schema.org Markup | Product, FAQ, Review schema | Google Rich Results |

### Phase D: System Intelligence

**เป้าหมาย:** ใช้ AI และ data เพิ่มประสิทธิภาพระบบ

| Feature | Description | Builds On |
|---------|-------------|-----------|
| AI Chatbot Enhancement | ความรู้ผลิตภัณฑ์ทุกตัว + lead qualification | Existing chatbot |
| Personalization Engine | Homepage ปรับตาม visitor behavior | HeroSlideshow personalization |
| Lead Scoring | คะแนนความสนใจตามผลิตภัณฑ์ | Admin analytics |
| Smart Recommendation | แนะนำผลิตภัณฑ์ตาม industry/need | Product data |
| A/B Testing Framework | ทดสอบ CTA, layout, messaging | Existing analytics |

### Phase E: Multi-Brand / White-Label

**เป้าหมาย:** ระบบพร้อมปรับใช้กับแบรนด์อื่น

| Feature | Description | Status |
|---------|-------------|--------|
| Brand Config System | ไฟล์ config แยกต่อแบรนด์ | Built (brands/sirinx/config.ts) |
| Theme Switching | สี, font, logo ตามแบรนด์ | Architecture ready |
| Content Per Brand | เนื้อหาเฉพาะแบรนด์ | Needs implementation |
| Multi-tenant Admin | Admin panel แยกต่อแบรนด์ | Needs implementation |

---

## 4. Technical Architecture: Product Page Factory

### 4.1 File Structure (Proposed)

```
client/src/
├── products/                          # NEW: Product data & config
│   ├── types.ts                       # ProductData interface
│   ├── solar-carport.ts               # Data file (migrated from SolarCarport.tsx)
│   ├── rooftop-solar.ts               # NEW
│   ├── floating-solar.ts              # NEW
│   ├── bess.ts                        # NEW
│   ├── ai-energy.ts                   # NEW
│   └── om-service.ts                  # NEW
│
├── components/
│   └── ProductPageTemplate.tsx        # NEW: Reusable product page template
│
├── pages/
│   ├── SolarCarport.tsx               # KEEP: Custom page (has real photos)
│   ├── RooftopSolar.tsx               # NEW: Template + rooftop-solar data
│   ├── FloatingSolar.tsx              # NEW: Template + floating-solar data
│   ├── BESS.tsx                       # NEW: Template + bess data
│   ├── AIEnergy.tsx                   # NEW: Template + ai-energy data
│   └── OMService.tsx                  # NEW: Template + om-service data
│
├── i18n/pages/
│   ├── solarCarport.ts               # Translation for SolarCarport
│   ├── rooftopSolar.ts               # NEW
│   ├── floatingSolar.ts              # NEW
│   ├── bess.ts                        # NEW
│   ├── aiEnergy.ts                    # NEW
│   └── omService.ts                   # NEW
```

### 4.2 ProductData Interface

```typescript
interface ProductData {
  id: string;
  slug: string;                        // URL path segment
  heroImage: string;                   // CDN URL
  heroMetrics: Array<{ value: string; labelKey: string }>;
  benefits: Array<{
    icon: LucideIcon;
    titleKey: string;
    descKey: string;
  }>;
  specs: Array<{
    labelKey: string;
    value: string;
    noteKey: string;
  }>;
  industries: Array<{
    icon: LucideIcon;
    titleKey: string;
    descKey: string;
    detailKey?: string;
  }>;
  gallery?: {
    images: string[];                  // CDN URLs
    isReal: boolean;                   // true = real photos, false = AI rendering
    locationKey?: string;
  };
  faqs: Array<{
    questionKey: string;
    answerKey: string;
  }>;
  financingOptions: Array<{
    titleKey: string;
    descKey: string;
    highlightKey: string;
    features: string[];                // translation keys
  }>;
  integration?: {
    image: string;
    titleKey: string;
    descKey: string;
    steps: string[];                   // translation keys
  };
}
```

### 4.3 Migration Strategy (Non-breaking)

การ migrate เข้าสู่ระบบ Product Page Factory จะทำแบบค่อยเป็นค่อยไป โดยไม่ทำลายสิ่งที่มีอยู่:

**Step 1:** สร้าง ProductPageTemplate.tsx และ types.ts (ไม่กระทบไฟล์เดิม)

**Step 2:** สร้างหน้าผลิตภัณฑ์ใหม่ (RooftopSolar, FloatingSolar, BESS, AIEnergy, OMService) โดยใช้ template — เป็นการเพิ่มไฟล์ใหม่ ไม่แก้ไขไฟล์เดิม

**Step 3:** เพิ่ม routes ใน App.tsx (append only, ไม่แก้ route เดิม)

**Step 4:** อัปเดต nav items ใน Layout.tsx (เปลี่ยน dropdown links จาก #hash เป็น dedicated pages)

**Step 5:** อัปเดต Solutions.tsx ให้เป็น overview page ที่ link ไปหน้าเฉพาะ (optional, ทำทีหลังได้)

**Step 6:** (Optional) Migrate SolarCarport.tsx เข้าสู่ template system ถ้าต้องการความสม่ำเสมอ

---

## 5. Priority & Timeline Recommendation

| Phase | Scope | Est. Sessions | Priority |
|-------|-------|:---:|:---:|
| **A** | i18n ทุกหน้า (11 pages) | 2-3 | **Immediate** |
| **B** | Product Page Factory (5 new pages) | 3-4 | **High** |
| **C** | Content & SEO Enhancement | 2-3 | **Medium** |
| **D** | System Intelligence | 3-4 | **Medium** |
| **E** | Multi-Brand / White-Label | 2-3 | **Low** (foundation built) |

**แนะนำ:** ทำ Phase A (i18n) ให้เสร็จก่อน เพราะเป็นงานค้างที่ต้องทำอยู่แล้ว และเมื่อระบบ i18n พร้อม การสร้างหน้าผลิตภัณฑ์ใหม่ใน Phase B จะรองรับ 3 ภาษาทันทีตั้งแต่ต้น

---

## 6. Anti-Copy Protection (Already Implemented)

ระบบป้องกันการคัดลอกโค้ดถูกติดตั้งแล้วใน checkpoint ปัจจุบัน ประกอบด้วย:

| Layer | Technique | Status |
|-------|-----------|--------|
| Client-side | Disable right-click, text selection, keyboard shortcuts | Active |
| Build-time | JavaScript obfuscation (vite-plugin-javascript-obfuscator) | Active (production only) |
| Runtime | DevTools detection + console clearing | Active |
| Legal | Copyright watermark in source | Active |

---

*เอกสารฉบับนี้เป็นแผนพัฒนาเชิงกลยุทธ์ สามารถปรับเปลี่ยนลำดับความสำคัญได้ตามความต้องการทางธุรกิจ*
