# แผนที่ภาพประกอบและ 3D WebGL ทั้งเว็บไซต์ (PKG-4 Coverage Audit)

Status: LOCAL_VERIFIED · Date: 2026-09-28 · Round: R28b
Scope: สำรวจทุก Route จริงจาก `apps/public-web/client/src/App.tsx` เพื่อประเมินสถานะภาพประกอบ, 3D WebGL, Motion, และข้อความ Alt/A11y/AEO

---

## 1. ตารางความครอบคลุมภาพประกอบทุก Route (Master Route Coverage Matrix)

| Route Path | Component | ภาพปัจจุบัน | 3D WebGL Status | Motion State | คุณภาพ Alt / ข้อมูลเชิงลึก | ช่องว่างและข้อเสนอแนะ |
|---|---|---|---|---|---|---|
| `/` | `Home.tsx` | Hero slideshow (6 ภาพ) + Solutions grid | ✅ `SolarHeroScene.tsx` (Lazy WebGL) | Ready for Path B | มี alt ภาษาไทยระบุฟังก์ชันชัดเจน | ควรเสริมภาพ Photorealistic AI Render Hero ใหม่ |
| `/about` | `About.tsx` | ภาพผู้บริหาร / บริษัท / สเกลพลังงาน | ❌ ไม่มี | framer-motion เต็มชุด | ข้อความกำกับชัดเจน | ขาดภาพประกอบทีมวิศวกรโรงงานติดตั้งจริง |
| `/solar-carport` | `SolarCarport.tsx` | ภาพหลังคา Solar Carport, EV Charger | ✅ `SolarCarportViewer` + `ProvinceSolarScene` | framer-motion เต็มชุด | ระบุโมเดลและกำลังวัตต์ | ต้องการ Exploded Diagram แสดงชั้นโครงสร้าง C-Channel |
| `/solar-carport/:province` | `SolarCarport.tsx` | Dynamic Province Map + Solar Chart | ✅ `ProvinceSolarScene` + `YieldChart3D` | framer-motion เต็มชุด | ดึงสถิติจริงจาก PVGIS (kWh/kWp/ปี) | สมบูรณ์แบบที่สุดในเว็บ รองรับ 77 จังหวัด |
| `/provinces` | `Provinces.tsx` | แผนที่ประเทศไทย 77 จังหวัด | ❌ ไม่มี | framer-motion เต็มชุด | มีชื่อจังหวัดภาษาไทย/อังกฤษ | สามารถใส่ 3D Mini Interactive Map เพิ่มได้ |
| `/pricing` | `Pricing.tsx` | ตารางแพ็กเกจ + ไอคอนอุปกรณ์ | ❌ ไม่มี | framer-motion เต็มชุด | มีข้อความกำกับราคาและ ROI | ควรมีภาพ Render อุปกรณ์ชุดมาตรฐาน (Inverter/BESS) |
| `/solutions` | `Solutions.tsx` | การ์ดแยกประเภทโซลูชัน 6 หมวด | ❌ ไม่มี | framer-motion เต็มชุด | มีรูปประกอบทั้ง 6 โซลูชัน | ขาดภาพ BESS Container Render ขนาดใหญ่ |
| `/home-solution` | `HomeSolution.tsx` | ภาพบ้านพักอาศัยติดตั้งแผงโซลาร์ | ❌ ไม่มี | framer-motion เต็มชุด | สื่อถึง Residential ชัดเจน | ภาพประกอบยังเป็น Stock Photo ทั่วไป ควรเป็นภาพแบรนด์ |
| `/industries` | `Industries.tsx` | ภาพโรงงานอุตสาหกรรม, ห้าง, โรงแรม | ❌ ไม่มี | framer-motion เต็มชุด | มีคำบรรยายอุตสาหกรรม | ควรเสริมภาพมุมสูง Drone Shot โรงงานติดตั้ง Solar |
| `/investment` | `InvestmentTaxHub.tsx`| กราฟสิทธิประโยชน์ทางภาษี BOI | ❌ ไม่มี | framer-motion เต็มชุด | มีตัวเลขลดหย่อนภาษี 50-100% | ควรมี Infographic ภาพประกอบโครงสร้างภาษี BOI ชัดเจน |
| `/projects` | `Projects.tsx` | รวมรูปผลงานติดตั้งที่ผ่านมา (Grid) | ❌ ไม่มี | framer-motion เต็มชุด | มีชื่อสถานที่และกำลังการผลิต kWp | มีภาพจริงแล้ว (Holatel, Ruenphae ฯลฯ) |
| `/projects/:slug` | `ProjectDetail.tsx` | แกลเลอรีภาพถ่ายโครงการเฉพาะแห่ง | ❌ ไม่มี | framer-motion เต็มชุด | Alt ตรงตามชื่อโครงการ | สมบูรณ์แบบด้วยภาพถ่ายสถานที่จริง |
| `/strategy` | `Strategy.tsx` | แผนภาพ Energy Intelligence AI | ❌ ไม่มี | framer-motion เต็มชุด | มีคำอธิบาย AI Optimization | ขาดภาพ AI Energy Command Center Hologram (Concept B) |
| `/blog` | `Blog.tsx` | ภาพปกบทความความรู้พลังงาน | ❌ ไม่มี | framer-motion เต็มชุด | มี alt ตามหัวข้อบทความ | ต้องการภาพประกอบสไตล์ Tech Editorial |
| `/blog/:slug` | `BlogPost.tsx` | ภาพประกอบเนื้อหาในบทความ | ❌ ไม่มี | framer-motion เต็มชุด | มีรูปและแคปชันใต้ภาพ | ขาดภาพประกอบแผนภาพพลังงานเชิงลึกในบางบทความ |
| `/contact` | `Contact.tsx` | แผนที่สำนักงาน + ช่องทางติดต่อ | ❌ ไม่มี | framer-motion เต็มชุด | มีข้อมูลที่ตั้งถูกต้อง | เหมาะสมแล้ว ไม่จำเป็นต้องใส่ 3D |
| `/assessment` | `SolarAssessment.tsx`| ฟอร์มคำนวณกำลังไฟและขนาดติดตั้ง | ❌ ไม่มี | framer-motion เต็มชุด | ไอคอนประกอบแต่ละขั้นตอน | ควรมี 3D Roof Tilt Preview จำลองทิศทางหลังคา |
| `/partner` | `Partner.tsx` | ภาพเครือข่ายความร่วมมือ | ❌ ไม่มี | framer-motion เต็มชุด | โลโก้และภาพร่วมมือ | ต้องการภาพถ่ายสัมมนาหรือภาพลงนามความร่วมมือจริง |
| `/line` | `Line.tsx` | QR Code LINE Official | ❌ ไม่มี | framer-motion เต็มชุด | Alt "LINE QR Code SIRINX" | ตรงตามวัตถุประสงค์ (Direct CTA) |

---

## 2. การวิเคราะห์ช่องว่างและความสำคัญ (Gap Priority Analysis)

```
ลำดับความสำคัญในการผลิตภาพประกอบ (Prioritized Asset Roadmap):
┌─────────────────────────┬───────────────────┬────────────────────────────────────────────────────────┐
│ ระดับความสำคัญ          │ หน้าเป้าหมาย      │ ชนิดของสื่อที่ต้องสร้างเพิ่มเติม                        │
├─────────────────────────┼───────────────────┼────────────────────────────────────────────────────────┤
│ Priority 1 (High Impact)│ `/` (Home)        │ Master Hero Photo (Concept A) + 3D SolarHeroScene      │
│ Priority 1 (High Impact)│ `/solar-carport`  │ 3D Exploded Technical Diagram (Concept C)              │
│ Priority 2 (Medium)     │ `/strategy`       │ AI Energy Command Center Hologram (Concept B)          │
│ Priority 2 (Medium)     │ `/solutions`      │ BESS Container Industrial Product Photo (Concept D)    │
│ Priority 3 (Refinement) │ `/assessment`     │ Interactive 3D Roof / Carport Tilt Simulation          │
└─────────────────────────┴───────────────────┴────────────────────────────────────────────────────────┘
```

---

## 3. เกณฑ์มาตรฐานการตั้งค่า Alt Text (A11y & AI Engine Optimization)

1. **ห้ามใช้คำฟุ่มเฟือย**: ไม่ใส่คำว่า "ภาพของ", "รูปภาพ", "image of" ใน alt text
2. **ตัวเลขต้องตรงกับสถิติจริง (No Hallucination)**: ตัวเลขแดด ค่า irradiance (kWh/m²/วัน) และ yield (kWh/kWp/ปี) ใน alt text ต้องดึงจาก `shared/provinceEnergyData.ts` ตรงกัน 100%
3. **โครงสร้างประโยคสมบูรณ์ (Citable Sentence)**: เขียนเป็นประโยคที่ AI Search Engine (Perplexity, ChatGPT, Gemini) สามารถยกไปอ้างอิงเป็นคำตอบได้ทันที เช่น:
   > *"ภาพจำลองสามมิติหลังคาโซลาร์เซลล์ Solar Carport กำลังการผลิต 100 kWp สำหรับลานจอดรถในจังหวัดพิษณุโลก โดยมีค่าความเข้มแสงแดดเฉลี่ย 5.12 kWh/ตร.ม./วัน ออกแบบโดย SIRINX"*
