import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  // Slide 1 — Carport Aerial
  "hero.carport-aerial.badge": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "hero.carport-aerial.headline": {
    th: "เปลี่ยนที่จอดรถ",
    en: "Transform Your Parking",
    cn: "将停车场",
  },
  "hero.carport-aerial.highlight": {
    th: "เป็นโรงไฟฟ้าพลังงานแสงอาทิตย์",
    en: "Into a Solar Power Plant",
    cn: "变成太阳能发电站",
  },
  "hero.carport-aerial.desc": {
    th: "ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV Charger ลดค่าไฟ 30-100% คืนทุน 3-5 ปีโดยประมาณตามข้อมูลไซต์จริง",
    en: "Generate electricity, provide shade, and support EV Charger, with estimated 30-100% bill reduction and 3-5 year payback based on real site data.",
    cn: "发电、遮阳并支持电动车充电，根据现场数据预估降低30-100%电费，3-5年回本。",
  },
  "hero.carport-aerial.cta": {
    th: "ขอใบเสนอราคา Solar Carport",
    en: "Get Solar Carport Quote",
    cn: "获取太阳能车棚报价",
  },
  "hero.carport-aerial.cta2": {
    th: "ดูผลงานจริง",
    en: "View Real Projects",
    cn: "查看实际项目",
  },

  // Slide 2 — Carport Ground
  "hero.carport-ground.badge": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "hero.carport-ground.headline": {
    th: "โครงสร้างเหล็กมาตรฐาน",
    en: "Standard Steel Structure",
    cn: "标准钢结构",
  },
  "hero.carport-ground.highlight": {
    th: "แผงโซลาร์เซลล์คุณภาพ Tier-1",
    en: "Tier-1 Quality Solar Panels",
    cn: "Tier-1品质太阳能板",
  },
  "hero.carport-ground.desc": {
    th: "ออกแบบเฉพาะทาง รับน้ำหนักลม-ฝน ตามมาตรฐานวิศวกรรม อายุใช้งาน 25+ ปี",
    en: "Custom-designed, wind and rain resistant, engineering standard. 25+ year lifespan",
    cn: "定制设计，抗风雨，工程标准。25+年使用寿命",
  },
  "hero.carport-ground.cta": {
    th: "นัดสำรวจหน้างานฟรี",
    en: "Free Site Survey",
    cn: "免费现场勘查",
  },
  "hero.carport-ground.cta2": {
    th: "ดูโซลูชันทั้งหมด",
    en: "View All Solutions",
    cn: "查看所有解决方案",
  },

  // Slide 3 — Rooftop Factory
  "hero.rooftop-factory.badge": {
    th: "Rooftop Solar",
    en: "Rooftop Solar",
    cn: "屋顶太阳能",
  },
  "hero.rooftop-factory.headline": {
    th: "โซลาร์บนหลังคาโรงงาน",
    en: "Factory Rooftop Solar",
    cn: "工厂屋顶太阳能",
  },
  "hero.rooftop-factory.highlight": {
    th: "ลดต้นทุนพลังงานการผลิต",
    en: "Reduce Production Energy Costs",
    cn: "降低生产能源成本",
  },
  "hero.rooftop-factory.desc": {
    th: "ใช้พื้นที่หลังคาให้เกิดประโยชน์สูงสุด ลดค่าไฟ 30-100% โดยประมาณตาม load profile จริง",
    en: "Maximize roof space utilization with estimated 30-100% bill reduction depending on the real load profile.",
    cn: "最大化屋顶空间利用，并根据实际负载曲线预估降低30-100%电费。",
  },
  "hero.rooftop-factory.cta": {
    th: "ขอใบเสนอราคา Rooftop Solar",
    en: "Get Rooftop Solar Quote",
    cn: "获取屋顶太阳能报价",
  },
  "hero.rooftop-factory.cta2": {
    th: "ดูอุตสาหกรรมที่เหมาะ",
    en: "View Suitable Industries",
    cn: "查看适合的行业",
  },

  // Slide 4 — Floating Solar
  "hero.floating-solar.badge": {
    th: "Floating Solar",
    en: "Floating Solar",
    cn: "水上太阳能",
  },
  "hero.floating-solar.headline": {
    th: "โซลาร์ลอยน้ำ",
    en: "Floating Solar",
    cn: "水上太阳能",
  },
  "hero.floating-solar.highlight": {
    th: "ใช้พื้นที่ผิวน้ำให้เกิดประโยชน์",
    en: "Maximize Water Surface Utilization",
    cn: "最大化水面利用",
  },
  "hero.floating-solar.desc": {
    th: "เหมาะกับอ่างเก็บน้ำ บ่อน้ำอุตสาหกรรม ลดการระเหยของน้ำ เพิ่มประสิทธิภาพแผง",
    en: "Ideal for reservoirs, industrial ponds. Reduce water evaporation, increase panel efficiency",
    cn: "适合水库、工业池塘。减少水分蒸发，提高面板效率",
  },
  "hero.floating-solar.cta": {
    th: "ขอใบเสนอราคา Floating Solar",
    en: "Get Floating Solar Quote",
    cn: "获取水上太阳能报价",
  },
  "hero.floating-solar.cta2": {
    th: "ดูผลงานจริง",
    en: "View Real Projects",
    cn: "查看实际项目",
  },

  // Slide 5 — Carport EV
  "hero.carport-ev.badge": {
    th: "Solar Carport + EV Charging",
    en: "Solar Carport + EV Charging",
    cn: "太阳能车棚+电动车充电",
  },
  "hero.carport-ev.headline": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "hero.carport-ev.highlight": {
    th: "พร้อม EV Charging Station",
    en: "with EV Charging Station",
    cn: "配备电动车充电站",
  },
  "hero.carport-ev.desc": {
    th: "รองรับรถยนต์ไฟฟ้าในอนาคต ชาร์จจากพลังงานแสงอาทิตย์โดยตรง ลดต้นทุนพลังงาน",
    en: "Future-ready for EVs, charge directly from solar energy, reduce energy costs",
    cn: "面向未来电动车，直接太阳能充电，降低能源成本",
  },
  "hero.carport-ev.cta": {
    th: "ขอใบเสนอราคา",
    en: "Get Quote",
    cn: "获取报价",
  },
  "hero.carport-ev.cta2": {
    th: "ดูรายละเอียด Solar Carport",
    en: "View Solar Carport Details",
    cn: "查看太阳能车棚详情",
  },

  // Slide 6 — BESS
  "hero.bess-realistic.badge": {
    th: "BESS / ESS",
    en: "BESS / ESS",
    cn: "储能系统",
  },
  "hero.bess-realistic.headline": {
    th: "ระบบกักเก็บพลังงาน",
    en: "Energy Storage System",
    cn: "储能系统",
  },
  "hero.bess-realistic.highlight": {
    th: "ใช้ไฟฟ้าได้แม้ไม่มีแสงแดด",
    en: "Use Electricity Even Without Sunlight",
    cn: "无阳光也能用电",
  },
  "hero.bess-realistic.desc": {
    th: "Battery Energy Storage System ลด demand charge ใช้ไฟในช่วง peak สำรองไฟยามฉุกเฉิน",
    en: "Battery Energy Storage System reduces demand charges, peak usage, emergency backup",
    cn: "电池储能系统降低需求费用，高峰用电，应急备用",
  },
  "hero.bess-realistic.cta": {
    th: "ขอใบเสนอราคา BESS",
    en: "Get BESS Quote",
    cn: "获取储能报价",
  },
  "hero.bess-realistic.cta2": {
    th: "ดูโซลูชันทั้งหมด",
    en: "View All Solutions",
    cn: "查看所有解决方案",
  },

  // Slide 7 — Hotel Resort
  "hero.hotel-resort.badge": {
    th: "โรงแรม & รีสอร์ท",
    en: "Hotel & Resort",
    cn: "酒店与度假村",
  },
  "hero.hotel-resort.headline": {
    th: "พลังงานสะอาด",
    en: "Clean Energy",
    cn: "清洁能源",
  },
  "hero.hotel-resort.highlight": {
    th: "สำหรับธุรกิจโรงแรม",
    en: "for Hotel Business",
    cn: "酒店行业专用",
  },
  "hero.hotel-resort.desc": {
    th: "ลดค่าไฟ เสริมภาพลักษณ์ Green Hotel ดึงดูดนักท่องเที่ยวที่ใส่ใจสิ่งแวดล้อม",
    en: "Reduce electricity costs, enhance Green Hotel image, attract eco-conscious travelers",
    cn: "降低电费，提升绿色酒店形象，吸引环保旅客",
  },
  "hero.hotel-resort.cta": {
    th: "ปรึกษาโซลูชันโรงแรม",
    en: "Consult Hotel Solution",
    cn: "咨询酒店方案",
  },
  "hero.hotel-resort.cta2": {
    th: "ดูอุตสาหกรรมทั้งหมด",
    en: "View All Industries",
    cn: "查看所有行业",
  },

  // Slide 8 — Carport Realistic
  "hero.carport-realistic.badge": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "hero.carport-realistic.headline": {
    th: "ติดตั้งจริง",
    en: "Real Installation",
    cn: "实际安装",
  },
  "hero.carport-realistic.highlight": {
    th: "ผลงาน Solar Carport สำนักงาน",
    en: "Office Solar Carport Project",
    cn: "办公室太阳能车棚项目",
  },
  "hero.carport-realistic.desc": {
    th: "โครงสร้างเหล็กชุบกัลวาไนซ์ แผง Tier-1 ติดตั้งโดยทีมวิศวกรมืออาชีพ",
    en: "Galvanized steel structure, Tier-1 panels, installed by professional engineers",
    cn: "镀锌钢结构，Tier-1面板，专业工程师安装",
  },
  "hero.carport-realistic.cta": {
    th: "ขอใบเสนอราคา",
    en: "Get Quote",
    cn: "获取报价",
  },
  "hero.carport-realistic.cta2": {
    th: "ดูผลงานทั้งหมด",
    en: "View All Projects",
    cn: "查看所有项目",
  },

  // Slide 9 — AI Monitoring
  "hero.ai-monitoring.badge": {
    th: "AI Energy Management",
    en: "AI Energy Management",
    cn: "AI能源管理",
  },
  "hero.ai-monitoring.headline": {
    th: "ระบบ AI",
    en: "AI System",
    cn: "AI系统",
  },
  "hero.ai-monitoring.highlight": {
    th: "บริหารพลังงานอัจฉริยะ",
    en: "Smart Energy Management",
    cn: "智能能源管理",
  },
  "hero.ai-monitoring.desc": {
    th: "ตรวจสอบ วิเคราะห์ และเพิ่มประสิทธิภาพการผลิตไฟฟ้าแบบ real-time ตลอด 24/7",
    en: "Monitor, analyze, and optimize electricity production in real-time 24/7",
    cn: "24/7实时监控、分析和优化发电效率",
  },
  "hero.ai-monitoring.cta": {
    th: "ปรึกษาระบบ AI",
    en: "Consult AI System",
    cn: "咨询AI系统",
  },
  "hero.ai-monitoring.cta2": {
    th: "ดูโซลูชัน AI",
    en: "View AI Solutions",
    cn: "查看AI解决方案",
  },

  // Slide 10 — Carport Mall
  "hero.carport-mall.badge": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "hero.carport-mall.headline": {
    th: "Solar Carport ขนาดใหญ่",
    en: "Large-Scale Solar Carport",
    cn: "大型太阳能车棚",
  },
  "hero.carport-mall.highlight": {
    th: "สำหรับห้างสรรพสินค้า & โรงงาน",
    en: "for Shopping Malls & Factories",
    cn: "商场与工厂专用",
  },
  "hero.carport-mall.desc": {
    th: "รองรับพื้นที่จอดรถขนาดใหญ่ ผลิตไฟฟ้าได้มากกว่า ลดค่าไฟทั้งอาคาร",
    en: "Support large parking areas, generate more electricity, reduce building-wide costs",
    cn: "支持大型停车场，发更多电，降低整栋建筑电费",
  },
  "hero.carport-mall.cta": {
    th: "ขอใบเสนอราคา",
    en: "Get Quote",
    cn: "获取报价",
  },
  "hero.carport-mall.cta2": {
    th: "ดูรายละเอียด Solar Carport",
    en: "View Solar Carport Details",
    cn: "查看太阳能车棚详情",
  },

  // UI labels
  "hero.prev": { th: "สไลด์ก่อนหน้า", en: "Previous Slide", cn: "上一张" },
  "hero.next": { th: "สไลด์ถัดไป", en: "Next Slide", cn: "下一张" },
  "hero.goToSlide": { th: "ไปที่สไลด์", en: "Go to slide", cn: "跳转到幻灯片" },
};

registerPageTranslations("heroSlideshow", dict);
export default dict;
