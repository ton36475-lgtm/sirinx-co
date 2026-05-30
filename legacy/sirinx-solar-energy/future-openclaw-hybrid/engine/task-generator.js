/**
 * task-generator.js — Auto-generate tasks for idle agents
 * เมื่อ agent idle > threshold จะ auto-generate งานที่เหมาะกับ specialization นั้น
 * ทุก task เชื่อมโยงกับ revenue — ไม่มี agent ที่ไม่สร้างมูลค่า
 */

import { logger } from './config.js';

// ===== Revenue-generating task templates per agent specialization =====
const TASK_TEMPLATES = {

  // L1 — Perception Tasks
  'kuranosuke-01': [
    { task: 'สแกน Facebook Groups "โซลาร์เซลล์ ไทย" หา leads ใหม่ที่แสดงความสนใจในช่วง 24 ชั่วโมงที่ผ่านมา', priority: 'high', estimatedRevenueTHB: 5000 },
    { task: 'ค้นหาโพสต์ที่มีคำว่า "ต้องการ solar", "ติดตั้ง solar", "คำนวณ solar" ใน 5 groups หลัก', priority: 'high', estimatedRevenueTHB: 8000 },
    { task: 'สแกน LINE groups ธุรกิจโรงงาน หาผู้ที่สนใจลดค่าไฟด้วย solar', priority: 'medium', estimatedRevenueTHB: 12000 },
  ],
  'yazama-02': [
    { task: 'ตรวจสอบ 10 Facebook Groups โซลาร์ สรุป trending topics วันนี้', priority: 'medium', estimatedRevenueTHB: 2000 },
    { task: 'จำแนก posts ใน FB groups: inquiry/complaint/education/promotion พร้อม action items', priority: 'high', estimatedRevenueTHB: 3000 },
    { task: 'สรุป top 5 FAQs จาก FB groups สำหรับสัปดาห์นี้ เพื่อสร้าง content ตอบ', priority: 'medium', estimatedRevenueTHB: 1500 },
  ],
  'hara-03': [
    { task: 'เก็บราคา electricity tariff ล่าสุดจาก กฟน./กฟภ. ทุก zone (TOU, flat rate)', priority: 'high', estimatedRevenueTHB: 1000 },
    { task: 'รวบรวมราคาแผง monocrystalline จาก 5 ผู้นำเข้าหลัก อัปเดตตาราง pricing', priority: 'medium', estimatedRevenueTHB: 500 },
    { task: 'ติดตาม solar irradiance data รายวัน 10 จังหวัดอุตสาหกรรมหลัก', priority: 'low', estimatedRevenueTHB: 300 },
  ],
  'muramatsu-04': [
    { task: 'วิเคราะห์แคมเปญโฆษณาล่าสุดของคู่แข่ง top 3 บน Facebook/Google', priority: 'high', estimatedRevenueTHB: 5000 },
    { task: 'เปรียบเทียบ pricing page คู่แข่ง 5 ราย: package, kWp, ราคา, ระยะ warranty', priority: 'medium', estimatedRevenueTHB: 3000 },
    { task: 'สแกน Google Reviews ของคู่แข่ง หา pain points ที่ SIRINX แก้ได้ดีกว่า', priority: 'medium', estimatedRevenueTHB: 2000 },
  ],
  'yoshida-05': [
    { task: 'ดึงราคา solar panels จาก Shopee/Lazada top 50 listings อัปเดตฐานข้อมูล', priority: 'medium', estimatedRevenueTHB: 500 },
    { task: 'วิเคราะห์ราคาเฉลี่ย inverter ยี่ห้อหลัก (Huawei, SMA, Growatt) เทียบกับเดือนที่แล้ว', priority: 'medium', estimatedRevenueTHB: 800 },
    { task: 'ติดตาม best sellers solar accessories 30 วันล่าสุด สรุป trends', priority: 'low', estimatedRevenueTHB: 400 },
  ],
  'kaiga-06': [
    { task: 'สรุปข่าว energy policy ไทย 7 วันล่าสุด: กฎระเบียบ, incentives, grid policy', priority: 'high', estimatedRevenueTHB: 2000 },
    { task: 'ติดตามความเคลื่อนไหว BOI solar incentives: มีโครงการใหม่หรือปรับเงื่อนไขหรือไม่', priority: 'high', estimatedRevenueTHB: 5000 },
    { task: 'วิเคราะห์ข่าว electricity price adjustment ล่าสุด impact ต่อ solar ROI', priority: 'medium', estimatedRevenueTHB: 3000 },
  ],
  'hazama-07': [
    { task: 'สแกน JobsDB/LinkedIn หาโรงงานและโรงแรมที่ประกาศรับสมัครตำแหน่ง facility/maintenance ใน 30 วัน (สัญญาณขยายกิจการ)', priority: 'high', estimatedRevenueTHB: 15000 },
    { task: 'ค้นหา job postings ที่กล่าวถึง "ประหยัดพลังงาน" หรือ "green energy" เพื่อ identify prospects', priority: 'medium', estimatedRevenueTHB: 8000 },
    { task: 'สรุป top 20 บริษัทที่กำลังขยายกำลังการผลิตจาก job postings ในสัปดาห์นี้', priority: 'medium', estimatedRevenueTHB: 10000 },
  ],
  'okuda-08': [
    { task: 'อัปเดตฐานข้อมูลกฎระเบียบ กฟผ./กฟน./กฟภ. เกี่ยวกับ net metering และ feed-in tariff', priority: 'high', estimatedRevenueTHB: 3000 },
    { task: 'ตรวจสอบ ERC announcements ล่าสุด: มีการเปลี่ยนแปลงอัตราค่าไฟหรือนโยบายที่กระทบ ROI หรือไม่', priority: 'high', estimatedRevenueTHB: 5000 },
    { task: 'สรุป BOI privileges สำหรับโครงการ solar ปัจจุบัน: ภาษีที่ได้รับยกเว้น, เงื่อนไข', priority: 'medium', estimatedRevenueTHB: 2000 },
  ],
  'hazama-09': [
    { task: 'รวบรวม solar irradiance data 7 วันล่าสุดจาก 77 จังหวัด คำนวณ peak sun hours เฉลี่ย', priority: 'medium', estimatedRevenueTHB: 500 },
    { task: 'เปรียบเทียบ actual vs predicted solar production ของโครงการที่ติดตั้งแล้ว 5 แห่ง', priority: 'medium', estimatedRevenueTHB: 1000 },
    { task: 'สร้าง solar potential map ทุกจังหวัดสำหรับใช้ใน sales presentations', priority: 'low', estimatedRevenueTHB: 2000 },
  ],
  'tomogoro-10': [
    { task: 'สรุป brand mentions SIRINX บน Twitter/X, Facebook, Pantip ใน 24 ชั่วโมง พร้อม sentiment', priority: 'high', estimatedRevenueTHB: 1000 },
    { task: 'ระบุ negative mentions และส่งต่อให้ customer service ตอบภายใน 2 ชั่วโมง', priority: 'urgent', estimatedRevenueTHB: 5000 },
    { task: 'วิเคราะห์ engagement rate ของ posts ล่าสุด แนะนำ content ที่ควรโปรโมต', priority: 'medium', estimatedRevenueTHB: 1500 },
  ],
  'fuwa-11': [
    { task: 'ดึง Google Trends data keyword "solar cell", "โซลาร์เซลล์" 12 เดือนย้อนหลัง วิเคราะห์ seasonality', priority: 'medium', estimatedRevenueTHB: 1500 },
    { task: 'ค้นหา rising keywords ที่เกี่ยวกับ solar ใน 77 จังหวัด แนะนำ SEO priorities', priority: 'high', estimatedRevenueTHB: 5000 },
    { task: 'เปรียบเทียบ search volume "โซลาร์เซลล์ + [จังหวัด]" ทุกจังหวัด จัดลำดับ market size', priority: 'medium', estimatedRevenueTHB: 3000 },
  ],
  'sayinnosuke-12': [
    { task: 'สแกน Shopee/Lazada: top 100 solar products ยอดขายสูงสุด วิเคราะห์ customer reviews', priority: 'medium', estimatedRevenueTHB: 800 },
    { task: 'ติดตามราคา solar panel brand หลัก สัปดาห์นี้ ดูว่ามีการปรับราคาหรือไม่', priority: 'medium', estimatedRevenueTHB: 500 },
    { task: 'ค้นหา fake/substandard solar products บน e-commerce เพื่อ awareness campaign', priority: 'low', estimatedRevenueTHB: 1000 },
  ],
  'chuzaemon-13': [
    { task: 'สแกนเว็บไซต์รัฐบาล: โครงการ solar ใหม่, เงินกู้ดอกเบี้ยต่ำ, เงินสนับสนุน SME', priority: 'high', estimatedRevenueTHB: 8000 },
    { task: 'ตรวจสอบ EXIM Bank, KBANK, SCB: มี green loan สำหรับ solar ที่ลูกค้าใช้ได้หรือไม่', priority: 'high', estimatedRevenueTHB: 10000 },
    { task: 'สรุป subsidy programs ที่ active อยู่ตอนนี้ อัปเดตหน้า pricing', priority: 'medium', estimatedRevenueTHB: 5000 },
  ],
  'onodera-14': [
    { task: 'วิเคราะห์การเติบโตของ EV ในไทย Q1 2026 vs โอกาส solar+charging station', priority: 'high', estimatedRevenueTHB: 15000 },
    { task: 'ค้นหา hotels และ retail parks ที่กำลังติดตั้ง EV chargers เพื่อ cross-sell solar', priority: 'high', estimatedRevenueTHB: 20000 },
    { task: 'สรุป EV fleet operators ในไทย ที่น่าจะสนใจ solar+storage สำหรับ depot', priority: 'medium', estimatedRevenueTHB: 25000 },
  ],
  'senzaki-15': [
    { task: 'สแกน DDproperty/Hipflat: โรงงาน+โกดัง ขนาดใหญ่ที่เปิดใหม่ใน 30 วัน', priority: 'high', estimatedRevenueTHB: 30000 },
    { task: 'ค้นหา industrial estates ที่กำลังขยาย: Amata, Hemaraj, WHA — prospect list', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'สแกน hotel listings โรงแรม 3-5 ดาว ที่เปิดใหม่ใน 6 เดือน เตรียม outreach', priority: 'medium', estimatedRevenueTHB: 20000 },
  ],
  'kinemon-16': [
    { task: 'ตรวจสอบ Telegram groups ธุรกิจ SME ไทย: มีคนถามเรื่อง solar หรือ ลดค่าไฟหรือไม่', priority: 'high', estimatedRevenueTHB: 5000 },
    { task: 'สแกน LINE OpenChat โรงงาน/โรงแรม: รวบรวม contact ที่แสดงความสนใจ solar', priority: 'high', estimatedRevenueTHB: 8000 },
    { task: 'Monitor @sirinxsolar mentions ใน Telegram ตอบคำถามภายใน 15 นาที', priority: 'urgent', estimatedRevenueTHB: 3000 },
  ],

  // L2 — Analysis Tasks
  'junai-17': [
    { task: 'score leads ใหม่ 50 รายจาก L1 ด้วยเกณฑ์: ค่าไฟ > 50K THB/เดือน, เป็นเจ้าของ roof, อุตสาหกรรมเป้าหมาย', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'วิเคราะห์ lead quality ของแคมเปญ Facebook ล่าสุด: CPL, conversion rate, ICP match %', priority: 'medium', estimatedRevenueTHB: 10000 },
    { task: 're-qualify leads เก่าที่ไม่ตอบสนอง > 30 วัน: ยังคุ้มที่จะ follow up หรือไม่', priority: 'medium', estimatedRevenueTHB: 20000 },
  ],
  'jurozaemon-18': [
    { task: 'คำนวณ ROI/NPV/Payback สำหรับ prospect โรงงาน 500kWp ค่าไฟ 200K/เดือน', priority: 'urgent', estimatedRevenueTHB: 100000 },
    { task: 'สร้าง ROI comparison table: ติดตั้ง cash vs lease vs PPA สำหรับโรงแรม 100kWp', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'อัปเดต ROI calculator ด้วย electricity price ล่าสุด (หลัง กฟผ. ประกาศปรับ)', priority: 'high', estimatedRevenueTHB: 5000 },
  ],
  'tadaoki-19': [
    { task: 'วิเคราะห์ SWOT SIRINX vs คู่แข่ง top 5 อัปเดต Q1 2026', priority: 'medium', estimatedRevenueTHB: 10000 },
    { task: 'เปรียบเทียบ positioning SIRINX กับ Solartron และ TSSC: จุดแข็งอะไรที่ควรเน้น', priority: 'high', estimatedRevenueTHB: 15000 },
    { task: 'วิเคราะห์ win/loss deals ใน Q4 2025: เสีย deal ไปเพราะอะไร', priority: 'high', estimatedRevenueTHB: 20000 },
  ],
  'masakazu-20': [
    { task: 'คำนวณ TAM/SAM/SOM solar B2B ไทย 2026: จำนวนโรงงาน, โรงแรม, ศักยภาพ kWp', priority: 'medium', estimatedRevenueTHB: 10000 },
    { task: 'จัดลำดับ 77 จังหวัดตาม market potential: GDP, จำนวนโรงงาน, ค่าไฟ, irradiance', priority: 'high', estimatedRevenueTHB: 8000 },
    { task: 'วิเคราะห์ growth rate ตลาด solar B2B ไทย 5 ปีข้างหน้า (2026-2030)', priority: 'low', estimatedRevenueTHB: 5000 },
  ],
  'yoshinao-21': [
    { task: 'optimize pricing สำหรับ system 100-500kWp: margin ที่แข่งขันได้แต่ยัง profitable', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'วิเคราะห์ elasticity: ถ้าลดราคา 5% จะเพิ่ม win rate ได้เท่าไร', priority: 'medium', estimatedRevenueTHB: 20000 },
    { task: 'สร้าง tiered pricing model: SME (30-100kWp) vs Enterprise (100kWp+) vs Mega (500kWp+)', priority: 'high', estimatedRevenueTHB: 30000 },
  ],
  'mitsunojo-22': [
    { task: 'วิเคราะห์ performance ของ content 30 ชิ้นล่าสุด: engagement, reach, click, conversion', priority: 'medium', estimatedRevenueTHB: 5000 },
    { task: 'ระบุ top 10 content ที่ generate leads มากที่สุด เพื่อ replicate pattern', priority: 'high', estimatedRevenueTHB: 10000 },
    { task: 'วิเคราะห์ video vs image vs text post: อันไหน ROI ดีที่สุดต่อ THB โฆษณา', priority: 'medium', estimatedRevenueTHB: 8000 },
  ],
  'shozaemon-23': [
    { task: 'ตรวจสอบ ranking keywords "โซลาร์เซลล์ + [top 10 provinces]" บน Google วันนี้', priority: 'high', estimatedRevenueTHB: 5000 },
    { task: 'ค้นหา keyword gaps: คำที่คู่แข่ง rank อยู่ แต่ SIRINX ยังไม่มี content', priority: 'high', estimatedRevenueTHB: 15000 },
    { task: 'audit technical SEO ของ sirinx website: speed, structured data, Core Web Vitals', priority: 'medium', estimatedRevenueTHB: 3000 },
  ],
  'tadashige-24': [
    { task: 'วิเคราะห์ customer journey: touchpoints ก่อน close deal เฉลี่ยกี่ครั้ง กี่วัน', priority: 'medium', estimatedRevenueTHB: 8000 },
    { task: 'ระบุ churn risk ของ O&M customers: ใครที่กำลังจะ cancel contract', priority: 'high', estimatedRevenueTHB: 20000 },
    { task: 'คำนวณ LTV ต่อ customer segment และ recommend upsell opportunities', priority: 'medium', estimatedRevenueTHB: 15000 },
  ],
  'jurozaemon-25': [
    { task: 'สร้าง P&L projection ประจำเดือน April 2026 พร้อม variance analysis', priority: 'urgent', estimatedRevenueTHB: 10000 },
    { task: 'สร้าง cash flow model สำหรับ SIRINX ถ้า close deals 10 ราย รวม 2,000 kWp ใน Q2', priority: 'high', estimatedRevenueTHB: 20000 },
    { task: 'วิเคราะห์ break-even analysis: ต้องมี revenue เท่าไรต่อเดือนถึง cover fixed costs', priority: 'medium', estimatedRevenueTHB: 5000 },
  ],

  // L3 — Decision Tasks
  'kihei-26': [
    { task: 'วางกลยุทธ์ April 2026 marketing campaign: channel, budget, KPIs, creative direction', priority: 'high', estimatedRevenueTHB: 100000 },
    { task: 'ตัดสินใจ: ควรรัน awareness campaign หรือ conversion campaign ใน Q2?', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'วางแผน seasonal campaign: hot season = solar peak performance messaging', priority: 'medium', estimatedRevenueTHB: 30000 },
  ],
  'genemon-27': [
    { task: 'อนุมัติ/ปรับ discount request: โรงงาน 300kWp ขอลด 8% โดยอ้างคู่แข่งราคาต่ำกว่า', priority: 'urgent', estimatedRevenueTHB: 150000 },
    { task: 'สร้าง quote template ใหม่สำหรับ PPA model: fixed rate 3.5 THB/kWh 25 ปี', priority: 'high', estimatedRevenueTHB: 200000 },
    { task: 'ทบทวน pricing เมื่อ material cost เปลี่ยน: ปรับ margin ให้ยัง competitive', priority: 'high', estimatedRevenueTHB: 20000 },
  ],
  'yasohachi-28': [
    { task: 'จัดลำดับ leads ใน pipeline วันนี้: 20 รายตาม urgency × deal size × close probability', priority: 'high', estimatedRevenueTHB: 500000 },
    { task: 'ระบุ deals ที่ต้อง escalate เป็น CEO นำเสนอเองภายในสัปดาห์', priority: 'urgent', estimatedRevenueTHB: 1000000 },
    { task: 'ทบทวน pipeline: ตัด leads ที่ไม่ active > 60 วัน ออก ลด ต้นทุน follow-up', priority: 'medium', estimatedRevenueTHB: 50000 },
  ],
  'kazuemon-29': [
    { task: 'สร้าง content calendar เดือน May 2026: 30 posts Facebook + 8 articles + 4 videos', priority: 'high', estimatedRevenueTHB: 20000 },
    { task: 'วางแผน content สำหรับ peak solar season (March-May): เน้น savings stories', priority: 'high', estimatedRevenueTHB: 30000 },
    { task: 'สร้าง content series: "47 เหตุผลที่ควรติด solar" — 1 เหตุผลต่อวัน', priority: 'medium', estimatedRevenueTHB: 15000 },
  ],
  'yukie-30': [
    { task: 'จัดสรร ad budget April: Facebook 60% / Google 30% / TikTok 10% — optimize per ROI', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'ตัดสินใจ: scale up/down campaigns ตาม performance ของสัปดาห์ที่แล้ว', priority: 'high', estimatedRevenueTHB: 30000 },
    { task: 'วิเคราะห์ ROAS ต่อ province: จังหวัดไหนคุ้มค่า จังหวัดไหนควรหยุด', priority: 'medium', estimatedRevenueTHB: 20000 },
  ],
  'juroemon-31': [
    { task: 'ประเมิน 3 installer candidates ภาคเหนือ: certification, track record, ราคา', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'review proposal จาก panel supplier ใหม่: คุณภาพ/ราคา/delivery เทียบกับ current', priority: 'medium', estimatedRevenueTHB: 20000 },
    { task: 'evaluate channel partner ใน Chiang Mai: ให้ commission deal หรือ direct sales ดีกว่า', priority: 'medium', estimatedRevenueTHB: 100000 },
  ],
  'suganoya-32': [
    { task: 'อัปเดต territory priority map: re-rank 77 จังหวัดตาม Q1 2026 performance', priority: 'high', estimatedRevenueTHB: 30000 },
    { task: 'วางแผน Q2 territory expansion: จังหวัดใหม่ที่ควรเข้าตลาด + resource ที่ต้องการ', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'optimize sales routes ภาคอีสาน: 12 จังหวัด, 2 sales rep, เส้นทางประหยัดสุด', priority: 'medium', estimatedRevenueTHB: 20000 },
  ],
  'magoemon-33': [
    { task: 'configure optimal system สำหรับ prospect โรงแรม 200 ห้อง ค่าไฟ 150K/เดือน', priority: 'urgent', estimatedRevenueTHB: 80000 },
    { task: 'เปรียบเทียบ on-grid vs hybrid system สำหรับ โรงงานที่มี critical load', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'สร้าง standard product bundles: Basic/Pro/Enterprise ที่ขาย off-the-shelf ได้', priority: 'medium', estimatedRevenueTHB: 100000 },
  ],
  'yajiro-34': [
    { task: 'วิเคราะห์ timing ที่ดีที่สุดสำหรับ year-end promotion: ก่อน vs หลัง new year?', priority: 'medium', estimatedRevenueTHB: 30000 },
    { task: 'วางแผน Songkran (April) campaign: ลดค่าไฟร้อนด้วย solar — timing และ message', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'กำหนด optimal promotion duration: 2 สัปดาห์ vs 1 เดือน — ผลต่อ urgency', priority: 'medium', estimatedRevenueTHB: 20000 },
  ],
  'yasoemon-35': [
    { task: 'สร้าง customer personas ใหม่: Factory Owner / Hotel GM / Warehouse Manager', priority: 'high', estimatedRevenueTHB: 15000 },
    { task: 'segment ลูกค้า active ทั้งหมดตาม kWp, industry, region สำหรับ upsell campaign', priority: 'medium', estimatedRevenueTHB: 30000 },
    { task: 'ระบุ segments ที่มี highest NPS เพื่อขอ testimonials และ referrals', priority: 'medium', estimatedRevenueTHB: 20000 },
  ],

  // L4 — Coordination Tasks
  'gengo-36': [
    { task: 'ตรวจสอบสถานะ agents ทั้ง 47 รายงาน: idle agents ที่ควรได้รับ task ด่วน', priority: 'high', estimatedRevenueTHB: 0 },
    { task: 'จัดสรร bandwidth: มี 3 deals urgent + 2 campaigns ใหม่ — allocate agents appropriately', priority: 'urgent', estimatedRevenueTHB: 200000 },
    { task: 'ประชุม virtual ทบทวน Q1 performance สรุป action items สำหรับ Q2', priority: 'high', estimatedRevenueTHB: 50000 },
  ],
  'emonojo-37': [
    { task: 'ตรวจสอบ pipeline: deals ที่ไม่มี activity > 7 วัน ส่ง follow-up sequence', priority: 'high', estimatedRevenueTHB: 100000 },
    { task: 'อัปเดต forecast Q2: ระบุ deals ที่จะ close ใน 30 วัน และ probability', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'ทำ pipeline health check: stage distribution, velocity, bottlenecks', priority: 'medium', estimatedRevenueTHB: 30000 },
  ],
  'yomoshichi-38': [
    { task: 'publish content calendar สัปดาห์นี้: schedule posts บน Facebook, LINE OA', priority: 'high', estimatedRevenueTHB: 10000 },
    { task: 'execute email blast ไปยัง cold leads 500 ราย: subject line ที่ผ่าน A/B test', priority: 'high', estimatedRevenueTHB: 20000 },
    { task: 'รัน retargeting ads สำหรับ website visitors ที่ไม่ convert ใน 14 วัน', priority: 'medium', estimatedRevenueTHB: 15000 },
  ],
  'churozaemon-39': [
    { task: 'schedule installation 3 โครงการสัปดาห์หน้า: จัดทีม, วัสดุ, crane ถ้าต้องการ', priority: 'high', estimatedRevenueTHB: 30000 },
    { task: 'optimize installation routes: 5 sites ใน 3 จังหวัด ลด travel cost และเวลา', priority: 'medium', estimatedRevenueTHB: 10000 },
    { task: 'ตรวจสอบ inventory: มีแผงและ inverter พร้อมสำหรับ projects scheduled ใน 30 วัน', priority: 'high', estimatedRevenueTHB: 0 },
  ],
  'togoro-40': [
    { task: 'onboard ลูกค้าใหม่ 2 ราย: ส่ง welcome kit, สัญญา, timeline, emergency contacts', priority: 'high', estimatedRevenueTHB: 10000 },
    { task: 'ติดตาม document checklist ลูกค้า: ใครที่ยังขาด PEA approval, building permit', priority: 'urgent', estimatedRevenueTHB: 50000 },
    { task: 'สร้าง onboarding guide ภาษาไทยสำหรับ O&M customers ใหม่', priority: 'medium', estimatedRevenueTHB: 5000 },
  ],
  'bunzaemon-41': [
    { task: 'อัปเดต project status ทุกโครงการที่กำลัง implement: % complete, blockers, ETA', priority: 'high', estimatedRevenueTHB: 0 },
    { task: 'identify risks ใน projects ที่กำลังจะ delay: แผนสำรองคืออะไร', priority: 'urgent', estimatedRevenueTHB: 50000 },
    { task: 'ส่ง weekly project update รายงาน CEO: ทุก project, สถานะ, เงินที่จะ invoice', priority: 'high', estimatedRevenueTHB: 0 },
  ],
  'kanzaemon-42': [
    { task: 'สร้าง CEO Dashboard update ประจำวัน: leads, pipeline value, installs, revenue', priority: 'high', estimatedRevenueTHB: 0 },
    { task: 'สร้าง weekly marketing report: campaigns, cost, leads, CPL, top performing content', priority: 'high', estimatedRevenueTHB: 0 },
    { task: 'สร้าง monthly P&L dashboard: revenue, cost, margin, vs target', priority: 'medium', estimatedRevenueTHB: 0 },
  ],
  'yogoro-43': [
    { task: 'QA check content ที่สร้างสัปดาห์นี้ทั้งหมด: ตรงกับ brand voice, ไม่มีข้อมูลผิด', priority: 'high', estimatedRevenueTHB: 5000 },
    { task: 'ตรวจสอบ proposals ที่จะส่งลูกค้าสัปดาห์นี้: accuracy, completeness, professionalism', priority: 'urgent', estimatedRevenueTHB: 100000 },
    { task: 'audit compliance: สัญญาใหม่ครบถ้วน, ถูกต้อง, ผ่าน checklist ทางกฎหมาย', priority: 'high', estimatedRevenueTHB: 20000 },
  ],

  // L5 — R&D Tasks
  'mimura-44': [
    { task: 'benchmark Qwen 2.5 vs Claude Haiku: cost, speed, quality สำหรับ bulk SEO content', priority: 'medium', estimatedRevenueTHB: 50000 },
    { task: 'ทดสอบ Gemini 2.0 Flash สำหรับ lead classification: accuracy vs cost trade-off', priority: 'medium', estimatedRevenueTHB: 30000 },
    { task: 'ประเมิน Claude Opus 4 vs GPT-4o สำหรับ investment proposal generation', priority: 'low', estimatedRevenueTHB: 20000 },
  ],
  'yokogawa-45': [
    { task: 'optimize critique loop prompts: ลด token usage 20% โดยไม่กระทบ quality', priority: 'medium', estimatedRevenueTHB: 10000 },
    { task: 'วิเคราะห์ latency bottlenecks ใน engine: steps ไหนที่ช้าที่สุด แก้ได้อย่างไร', priority: 'medium', estimatedRevenueTHB: 5000 },
    { task: 'A/B test system prompts สำหรับ SEO content: version A vs B เปรียบเทียบ quality score', priority: 'low', estimatedRevenueTHB: 8000 },
  ],
  'kayano-46': [
    { task: 'พัฒนา prototype: auto-generate solar proposal PDF จาก customer data', priority: 'high', estimatedRevenueTHB: 100000 },
    { task: 'สร้าง n8n automation: เมื่อ lead ถูก qualify → auto-send ROI calculation email', priority: 'high', estimatedRevenueTHB: 50000 },
    { task: 'prototype: Telegram bot command /quote [kWp] [monthly_bill] ส่ง estimate ทันที', priority: 'medium', estimatedRevenueTHB: 30000 },
  ],
  'terasaka-47': [
    { task: 'research emerging solar technologies: perovskite, bifacial, agrivoltaic — opportunity for SIRINX', priority: 'low', estimatedRevenueTHB: 20000 },
    { task: 'scout AI tools ใหม่ที่จะช่วย SIRINX: voice AI, computer vision สำหรับ roof assessment', priority: 'medium', estimatedRevenueTHB: 50000 },
    { task: 'วิเคราะห์ trend: AI + solar monitoring — ควร build หรือ buy? ROI analysis', priority: 'medium', estimatedRevenueTHB: 30000 },
  ],

  // Chatbot
  'kai-chatbot': [
    { task: 'ตอบ inquiries ลูกค้าใน Facebook Messenger ที่ค้างอยู่ทั้งหมด', priority: 'urgent', estimatedRevenueTHB: 20000 },
    { task: 'ทบทวนและปรับปรุง FAQ responses: เพิ่ม use cases ใหม่จาก recent conversations', priority: 'medium', estimatedRevenueTHB: 5000 },
    { task: 'สร้าง conversation flows ใหม่สำหรับ EV + solar package inquiry', priority: 'medium', estimatedRevenueTHB: 15000 },
  ],
};

export class TaskGenerator {
  /**
   * สร้าง tasks สำหรับ agent ที่ idle
   * @param {Object} agent — Agent definition จาก AGENTS array
   * @param {Object} [context] — Current context (recent data, priorities)
   * @returns {Array} — Array of task objects sorted by priority
   */
  generateForAgent(agent, context = {}) {
    const templates = TASK_TEMPLATES[agent.id] || this._generateGenericTasks(agent);
    return templates.map((t, i) => ({
      id:                   `task_${agent.id}_${Date.now()}_${i}`,
      agentId:              agent.id,
      task:                 t.task,
      priority:             t.priority || 'medium',
      estimatedRevenueTHB:  t.estimatedRevenueTHB || 0,
      taskType:             agent.taskType,
      model:                agent.model,
      tier:                 agent.tier,
      generatedAt:          new Date().toISOString(),
      status:               'pending',
    }));
  }

  /**
   * Generate tasks สำหรับ agents ที่ idle ทั้งหมด
   * @param {Array} idleAgents — Agents ที่ idle
   * @param {Object} [context]
   * @returns {Map<string, Array>} — agentId → tasks[]
   */
  generateForIdleAgents(idleAgents, context = {}) {
    const taskMap = new Map();
    for (const agent of idleAgents) {
      const tasks = this.generateForAgent(agent, context);
      taskMap.set(agent.id, tasks);
    }
    return taskMap;
  }

  /**
   * สร้าง urgent tasks สำหรับ situation พิเศษ
   * @param {string} situation — 'new_leads', 'campaign_launch', 'competitor_move', etc.
   * @returns {Array}
   */
  generateUrgentTasks(situation) {
    const urgentMap = {
      'new_leads': [
        { agentId: 'junai-17',    task: 'score leads ใหม่ทั้งหมด ด่วน',                      priority: 'urgent' },
        { agentId: 'yasohachi-28', task: 'จัดลำดับ leads ใหม่ ระบุ follow-up ทันที',          priority: 'urgent' },
        { agentId: 'emonojo-37',  task: 'สร้าง follow-up sequence สำหรับ hot leads',           priority: 'urgent' },
      ],
      'competitor_move': [
        { agentId: 'muramatsu-04', task: 'วิเคราะห์การเคลื่อนไหวคู่แข่งทันที',               priority: 'urgent' },
        { agentId: 'tadaoki-19',  task: 'ประเมิน impact ต่อ SIRINX positioning',               priority: 'urgent' },
        { agentId: 'genemon-27',  task: 'ทบทวน pricing — ต้องปรับหรือไม่',                    priority: 'urgent' },
      ],
      'deal_at_risk': [
        { agentId: 'yasohachi-28', task: 'วิเคราะห์ deal ที่เสี่ยง: สาเหตุและทางแก้ไข',      priority: 'urgent' },
        { agentId: 'genemon-27',  task: 'เตรียม counter-offer หรือ special incentive',         priority: 'urgent' },
        { agentId: 'gengo-36',    task: 'ประสาน resources ทุก agent เพื่อ save deal',          priority: 'urgent' },
      ],
    };
    return urgentMap[situation] || [];
  }

  /**
   * Generate generic tasks สำหรับ agents ที่ไม่มี template
   */
  _generateGenericTasks(agent) {
    return [
      { task: `ทำงานตาม specialization: ${agent.specialization} — ตรวจสอบ pending items`, priority: 'medium', estimatedRevenueTHB: 1000 },
      { task: `สรุป findings ล่าสุดจาก ${agent.role} ส่งรายงานให้ L4`, priority: 'low', estimatedRevenueTHB: 500 },
    ];
  }

  /**
   * Sort tasks by priority
   */
  sortByPriority(tasks) {
    const order = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...tasks].sort((a, b) => (order[a.priority] || 99) - (order[b.priority] || 99));
  }
}

export default TaskGenerator;
