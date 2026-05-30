# SIRINX Deep Analysis & Design Blueprint

## สังเคราะห์จาก Deep Research — คู่แข่ง Top 100 โซลาร์ไทย+โลก

---

## 1. SWOT Analysis ขั้นสูง (ผสานข้อมูลคู่แข่ง)

### STRENGTHS (จุดแข็ง)
1. **Multi-page Corporate Structure ครบถ้วน** — 10+ หน้า ครอบคลุมทุกด้านของธุรกิจ Solar
2. **Design System ที่แข็งแกร่ง** — Dual Theme (Light/Dark), CSS Variables, Brand Tokens เป็นระบบ
3. **Solar Assessment Calculator** — เครื่องมือคำนวณ ROI ที่ซับซ้อนเชื่อมกับ Lead Generation
4. **Typography System** — Space Grotesk + IBM Plex Sans Thai คู่ที่ technical แต่อ่านง่าย
5. **Animation System** — Framer Motion ทำงานได้ดี สร้าง micro-interactions
6. **Content ครบ** — Solutions, Industries, Investment, Blog, Projects, Partner
7. **Digital Marketing Toolkit** — 7 Prompt Templates พร้อมใช้เป็น visual strategy content

### WEAKNESSES (จุดอ่อน)
1. **ขาด Video Section** — ไม่มี YouTube embed ที่สะอาดระดับ enterprise
2. **Gallery/Lightbox ยังไม่ premium** — ยังไม่มี smooth carousel สำหรับ infographic
3. **Strategy/Insights เป็น Blog ธรรมดา** — ไม่ได้ใช้ visual strategy content จาก infographic
4. **Conversion Flow ยังไม่ชัด** — CTA กระจายไม่มี visual hierarchy ที่ชัดเจน
5. **Mobile UX สำหรับ Infographic** — ภาพยาวอ่านยากบนมือถือ
6. **ขาด Social Proof ที่แท้จริง** — testimonials ยังเป็น placeholder
7. **ขาด Interactive Elements** — ไม่มี Solar Savings Calculator แบบ inline, ไม่มี comparison tools

### OPPORTUNITIES (โอกาส — จากการศึกษาคู่แข่ง)
1. **Interactive Solar Calculator** — คู่แข่งระดับโลก (SunPower, Tesla) ใช้ calculator เป็น lead magnet หลัก
2. **Video Storytelling** — Enphase, SolarEdge ใช้ video เป็นตัวเล่าเรื่อง brand ได้ดี
3. **Layered Data Presentation** — แสดงข้อมูลซับซ้อนแบบ progressive disclosure
4. **PWA Features** — ทำให้เว็บมีประสบการณ์คล้าย app
5. **SEO/AEO Ready** — โครงสร้าง heading ดีพร้อมขยาย
6. **Digital Strategy Showcase** — ใช้ 7 Prompt Templates เป็น proof of digital expertise
7. **Community Energy Model** — แนวคิด Smart Microgrid/Community Resilience เป็น differentiator

### THREATS (ภัยคุกคาม)
1. **คู่แข่งไทยรายใหญ่** — GPSC, B.Grimm, Banpu มีงบการตลาดสูงกว่า
2. **Content Overload** — ถ้าใส่ทุกอย่างจะรกเกินไป ต้อง curate อย่างดี
3. **Performance** — ภาพเยอะทำให้โหลดช้า ต้อง lazy load + optimize
4. **Legal Claims** — ตัวเลข ROI/Tax/BOI ต้องมี disclaimer ทุกจุด
5. **Mobile Readability** — Infographic ยาวอ่านไม่ออกบนมือถือ ต้องมี lightbox

---

## 2. Competitive Intelligence Summary

### คู่แข่งไทย Top 10
| บริษัท | จุดเด่น UX/UI | สิ่งที่ SIRINX ควรเรียนรู้ |
|--------|---------------|---------------------------|
| GPSC | Dashboard monitoring, corporate credibility | Enterprise-grade data visualization |
| B.Grimm Power | Clean corporate design, investor relations | Professional trust signals |
| Banpu NEXT | Innovation storytelling, ESG integration | Sustainability narrative |
| SCG Cleanergy | Brand ecosystem, cross-selling | Integrated service presentation |
| Gulf Energy | Mega-project showcase, scale communication | Project portfolio presentation |
| Super Energy | Community solar, local engagement | Community-focused messaging |
| Sermsang Power | Floating solar expertise, niche positioning | Specialized solution deep-dives |
| Gunkul Engineering | Technical depth, engineering credibility | Technical documentation quality |
| Thai Solar Energy | Residential focus, calculator tools | Consumer-friendly UX |
| Prime Road Power | Growth story, expansion narrative | Company trajectory storytelling |

### คู่แข่งโลก Top 10
| บริษัท | จุดเด่น UX/UI | สิ่งที่ SIRINX ควรเรียนรู้ |
|--------|---------------|---------------------------|
| SunPower | Interactive configurator, premium feel | Product visualization |
| Tesla Solar | Minimalist design, instant quote | Streamlined conversion |
| Enphase | Monitoring dashboard, app-like experience | Real-time data presentation |
| SolarEdge | Technical depth + accessibility | Balancing tech + usability |
| Canadian Solar | Global scale communication | International credibility |
| JinkoSolar | Manufacturing excellence narrative | Supply chain transparency |
| First Solar | Sustainability leadership, ESG reporting | Environmental impact storytelling |
| LONGi Green | Innovation + R&D showcase | Technology leadership |
| Trina Solar | Smart energy ecosystem | Integrated solution platform |
| Sungrow | Inverter + storage integration | System integration narrative |

---

## 3. Design Blueprint — "Kinetic Infrastructure 2.0"

### Design Philosophy (ยึดตามเดิม + อัพเกรด)
- **Neo-Industrial Futurism** ผสม Swiss Grid ที่ถูก deconstruct
- **Dark-first** (Navy + Cyan + Amber) เป็น default
- **Diagonal energy flow** สร้าง visual momentum
- **Data-as-art** — ตัวเลขแสดงเป็น oversized typography

### สิ่งที่เพิ่มใหม่จาก Research:
1. **Video Integration Layer** — YouTube embed ที่ clean ระดับ enterprise
2. **Strategy Visual Deck** — Carousel สำหรับ infographic + prompt templates
3. **Lightbox System** — Modal ดูภาพเต็มที่ smooth
4. **Progressive Disclosure** — ข้อมูลซับซ้อนเปิดเผยทีละชั้น
5. **Mobile-Optimized Infographic Viewer** — Card preview + ปุ่มดูเต็ม
6. **Enhanced CTA Hierarchy** — Primary/Secondary/Tertiary ชัดเจน
7. **Trust Signal System** — Metrics, testimonials, certifications

### Asset Placement Map

| Asset | หน้า | Section | การแสดงผล |
|-------|------|---------|-----------|
| Hero Solar Image (AI) | Home | Hero | Full-bleed background |
| Aerial Solar Farm (AI) | Projects | Hero | Wide section background |
| Agrivoltaic Image (AI) | Industries | Agriculture | Feature image |
| Smart Infrastructure (AI) | About | Vision | Supporting visual |
| 7 Prompt Templates | Strategy | Toolkit | Carousel + Lightbox |
| YouTube Videos | Home, Projects | Video Section | Clean embed player |
| Project Photos (CDN) | Projects, Home | Gallery | Grid + Lightbox |

### Page Structure Map

**[1] HOME** — 10 sections
1. Hero (AI image + headline + CTA)
2. Business Outcomes (animated counters)
3. Vision Video Section (YouTube embed)
4. Solutions Overview (6 cards)
5. Process Steps (4 steps)
6. Industries Overview (6 cards)
7. Strategic Visual Highlights (carousel)
8. Trust/Proof Section (metrics + testimonial)
9. Site Photos Gallery (horizontal scroll)
10. Final CTA

**[2] ABOUT** — 6 sections
1. Hero (brand positioning)
2. Vision & Mission
3. Core Values
4. Engineering-First Approach
5. Milestones Timeline
6. CTA

**[3] SOLUTIONS** — per solution
1. Hero
2. Solution blocks (6 solutions with images)
3. CTA per solution

**[4] INDUSTRIES** — per industry
1. Hero
2. Industry blocks (6 industries with matched images)
3. CTA

**[5] PROJECTS** — visual portfolio
1. Hero
2. Project Grid (filterable)
3. Photo Gallery (lightbox)
4. Video Section
5. CTA

**[6] STRATEGY/INSIGHTS** — visual strategy content
1. Hero
2. Digital Marketing Toolkit (7 prompt templates carousel)
3. Strategy Visual Deck (infographic carousel)
4. Featured Insights Cards
5. CTA

**[7] CONTACT** — lead generation
1. Hero
2. Contact Channels
3. Quote Request Form
4. CTA
