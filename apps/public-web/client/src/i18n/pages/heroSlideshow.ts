import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  // Slide 1 — Ruenphae Royal Park, verified installation
  "hero.carport-aerial.badge": {
    th: "ผลงานติดตั้งจริง",
    en: "Real Installation",
    cn: "实际安装",
  },
  "hero.carport-aerial.headline": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "hero.carport-aerial.highlight": {
    th: "โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Ruenphae Royal Park Hotel",
    cn: "Ruenphae Royal Park 酒店",
  },
  "hero.carport-aerial.alt": {
    th: "ภาพมุมสูงของ Solar Carport และพื้นที่จอดรถ โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Elevated view of the real Solar Carport and parking area at Ruenphae Royal Park Hotel",
    cn: "Ruenphae Royal Park 酒店太阳能车棚及停车区的高处实景",
  },
  "hero.carport-aerial.desc": {
    th: "ภาพมุมสูงจาก Solar Carport และพื้นที่จอดรถที่ติดตั้งจริง",
    en: "An elevated view of the real Solar Carport and parking-area installation.",
    cn: "真实太阳能车棚及停车区域的高处实景。",
  },
  "hero.carport-aerial.cta": {
    th: "ดูผลงานติดตั้งจริง",
    en: "View Real Installation",
    cn: "查看实际安装",
  },
  "hero.carport-aerial.cta2": {
    th: "ประเมินโครงการของคุณ",
    en: "Evaluate Your Project",
    cn: "评估您的项目",
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
    th: "ออกแบบเฉพาะทางตามโครงสร้างหน้างานและข้อกำหนดวิศวกรรม",
    en: "Custom-designed from site structure and engineering requirements",
    cn: "根据现场结构和工程要求定制设计",
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

  // Slide 2 — Ruenphae Royal Park, verified rooftop installation
  "hero.rooftop-factory.badge": {
    th: "ผลงานติดตั้งจริง",
    en: "Real Installation",
    cn: "实际安装",
  },
  "hero.rooftop-factory.headline": {
    th: "Rooftop Solar",
    en: "Rooftop Solar",
    cn: "屋顶太阳能",
  },
  "hero.rooftop-factory.highlight": {
    th: "ระบบพลังงานบนอาคารจริง",
    en: "Real Building Energy System",
    cn: "真实建筑能源系统",
  },
  "hero.rooftop-factory.alt": {
    th: "ภาพรวมแผงโซลาร์รอบสระว่ายน้ำ โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Overview of rooftop solar arrays around the pool at Ruenphae Royal Park Hotel",
    cn: "Ruenphae Royal Park 酒店泳池周围屋顶太阳能阵列全景",
  },
  "hero.rooftop-factory.desc": {
    th: "แผงโซลาร์บริเวณสระว่ายน้ำและหลังคาอาคารของโรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Rooftop solar panels beside the pool and across the hotel building at Ruenphae Royal Park.",
    cn: "Ruenphae Royal Park 酒店泳池旁及建筑屋顶的太阳能板。",
  },
  "hero.rooftop-factory.cta": {
    th: "ดูภาพผลงาน",
    en: "View Project Photos",
    cn: "查看项目照片",
  },
  "hero.rooftop-factory.cta2": {
    th: "ขอใบเสนอราคา",
    en: "Get a Quote",
    cn: "获取报价",
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

  // Slide 6 — Holatel installed energy-system photo
  "hero.bess-realistic.badge": {
    th: "ภาพระบบจริง",
    en: "Real Installation",
    cn: "实际安装",
  },
  "hero.bess-realistic.headline": {
    th: "ระบบพลังงานที่ติดตั้งแล้ว",
    en: "Installed Energy System",
    cn: "已安装的能源系统",
  },
  "hero.bess-realistic.highlight": {
    th: "ภาพจากงานติดตั้งจริงที่โรงแรมโฮลาเทล",
    en: "Real Installation Photo at Holatel Hotel",
    cn: "Holatel Hotel 真实施工照片",
  },
  "hero.bess-realistic.alt": {
    th: "ภาพระยะใกล้ของแผงโซลาร์บนหลังคาโรงแรมโฮลาเทล",
    en: "Close view of rooftop solar panels at Holatel Hotel",
    cn: "Holatel Hotel 屋顶太阳能板近景",
  },
  "hero.bess-realistic.desc": {
    th: "ภาพระยะใกล้จากงานติดตั้งจริง โดยไม่แสดงข้อมูลอุปกรณ์ กำลังผลิต หรือผลลัพธ์ที่ยังไม่ผ่านการตรวจหลักฐาน",
    en: "A close view of the real installation, without unverified equipment, capacity, or performance claims.",
    cn: "真实施工近景，不包含未经核实的设备、容量或性能声明。",
  },
  "hero.bess-realistic.cta": {
    th: "ดูรายละเอียดโครงการ",
    en: "View Project Details",
    cn: "查看项目详情",
  },
  "hero.bess-realistic.cta2": {
    th: "ปรึกษาระบบพลังงาน",
    en: "Consult an Energy System",
    cn: "咨询能源系统",
  },

  // Slide 3 — Holatel, owner-confirmed completed installation
  "hero.hotel-resort.badge": {
    th: "ผลงานติดตั้งจริง",
    en: "Real Installation",
    cn: "实际安装",
  },
  "hero.hotel-resort.headline": {
    th: "Solar Rooftop",
    en: "Solar Rooftop",
    cn: "屋顶太阳能",
  },
  "hero.hotel-resort.highlight": {
    th: "โรงแรมโฮลาเทล",
    en: "Holatel Hotel",
    cn: "Holatel Hotel",
  },
  "hero.hotel-resort.alt": {
    th: "ภาพแผงโซลาร์บนหลังคาโรงแรมโฮลาเทล",
    en: "Rooftop solar arrays at Holatel Hotel",
    cn: "Holatel Hotel 屋顶太阳能阵列",
  },
  "hero.hotel-resort.desc": {
    th: "ภาพแผงโซลาร์บนหลังคาที่ติดตั้งแล้ว โดยไม่แสดงตัวเลขหรือผลประหยัดที่ยังไม่ผ่านการตรวจหลักฐาน",
    en: "Installed rooftop solar panels, without publishing unverified capacity or savings claims.",
    cn: "已安装的屋顶太阳能板，不展示尚未核实的容量或节能数据。",
  },
  "hero.hotel-resort.cta": {
    th: "ดูผลงานโรงแรม",
    en: "View Hotel Project",
    cn: "查看酒店项目",
  },
  "hero.hotel-resort.cta2": {
    th: "ปรึกษาโซลูชันโรงแรม",
    en: "Consult Hotel Solution",
    cn: "咨询酒店方案",
  },

  // Slide 4 — Holatel building and parking context
  "hero.carport-realistic.badge": {
    th: "ผลงานติดตั้งจริง",
    en: "Real Installation",
    cn: "实际安装",
  },
  "hero.carport-realistic.headline": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "hero.carport-realistic.highlight": {
    th: "ทางเข้าและพื้นที่จอดรถจริง",
    en: "Real Entrance and Parking Context",
    cn: "真实入口和停车区域",
  },
  "hero.carport-realistic.alt": {
    th: "ภาพ Solar Carport บริเวณทางเข้าโรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Solar Carport near the entrance of Ruenphae Royal Park Hotel",
    cn: "Ruenphae Royal Park 酒店入口附近的太阳能车棚",
  },
  "hero.carport-realistic.desc": {
    th: "ภาพ Solar Carport บริเวณทางเข้าโรงแรมเรือนแพ รอยัลปาร์ค ใช้แสดงรูปแบบระบบจริงโดยไม่อ้างค่ากำลังหรือผลลัพธ์ที่ยังไม่ยืนยัน",
    en: "A real Solar Carport view near the entrance of Ruenphae Royal Park Hotel, shown without unverified capacity or performance claims.",
    cn: "Ruenphae Royal Park 酒店入口处的真实太阳能车棚照片，不包含未经核实的容量或性能声明。",
  },
  "hero.carport-realistic.cta": {
    th: "เปิดชุดภาพโรงแรม",
    en: "Open Hotel Gallery",
    cn: "打开酒店图库",
  },
  "hero.carport-realistic.cta2": {
    th: "นัดสำรวจหน้างาน",
    en: "Book a Site Survey",
    cn: "预约现场勘查",
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
    th: "ตรวจสอบและวิเคราะห์ข้อมูลพลังงานตามอุปกรณ์และขอบเขตการติดตั้ง",
    en: "Monitor and analyze energy data by installed equipment and scope",
    cn: "根据已安装设备和范围监控并分析能源数据",
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
