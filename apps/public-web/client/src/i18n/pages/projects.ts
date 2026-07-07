import { registerPageTranslations, type TranslationDict } from "../index";
const dict: TranslationDict = {
  /* ─── Page Header ─── */
  sectionLabel: { th: "Portfolio", en: "Portfolio", cn: "项目案例" },
  pageTitle: { th: "ผลงาน", en: "Proven", cn: "经过" },
  pageTitleAccent: { th: "ที่พิสูจน์ได้", en: "Results", cn: "验证的成果" },
  pageDesc: {
    th: "โครงการจริงที่ SIRINX ออกแบบ ติดตั้ง และดูแลรักษา — พร้อมผลลัพธ์ทางธุรกิจที่วัดได้",
    en: "Real projects designed, installed, and maintained by SIRINX — with measurable business outcomes",
    cn: "SIRINX 设计、安装和维护的真实项目 — 可衡量的商业成果",
  },

  /* ─── Featured Project ─── */
  featuredBadge: {
    th: "Featured Project",
    en: "Featured Project",
    cn: "重点项目",
  },
  featuredTitle: {
    th: "Solar Carport — โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Solar Carport — Ruenphae Royal Park Hotel",
    cn: "太阳能车棚 — Ruenphae Royal Park 酒店",
  },
  featuredLocation: { th: "พิษณุโลก", en: "Phitsanulok", cn: "彭世洛" },
  featuredType: {
    th: "Solar Carport + BESS",
    en: "Solar Carport + BESS",
    cn: "太阳能车棚 + 储能",
  },
  featuredCapacity: {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  featuredSaving: {
    th: "ลดค่าพลังงานได้ประมาณ 30-100%",
    en: "Estimated 30-100% Energy Savings",
    cn: "预估节省能源30-100%",
  },
  featuredYear: { th: "2024", en: "2024", cn: "2024" },
  featuredOwner: {
    th: "คุณ Pitoon Yingyosruangrong",
    en: "Mr. Pitoon Yingyosruangrong",
    cn: "Pitoon Yingyosruangrong 先生",
  },
  featuredDesc: {
    th: "Solar Carport ติดตั้งจริงที่โรงแรมเรือนแพ รอยัลปาร์ค พิษณุโลก พร้อมระบบ BESS กักเก็บพลังงาน โครงสร้างเหล็กมาตรฐานวิศวกรรม Cable Tray และระบบไฟฟ้าครบวงจร พร้อม AI Monitoring 24/7",
    en: "Real Solar Carport installation at Ruenphae Royal Park Hotel, Phitsanulok. Complete with BESS energy storage, engineered steel structure, Cable Tray, and full electrical system with 24/7 AI Monitoring.",
    cn: "在彭世洛 Ruenphae Royal Park 酒店实际安装的太阳能车棚。配备 BESS 储能系统、工程钢结构、电缆桥架和完整电气系统，24/7 AI 监控。",
  },
  featuredHighlight1: {
    th: "ลดค่าพลังงานได้ประมาณ 30-100%",
    en: "Estimated 30-100% Energy Savings",
    cn: "预估节省能源30-100%",
  },
  featuredHighlight2: {
    th: "BESS กักเก็บพลังงาน",
    en: "BESS Energy Storage",
    cn: "BESS 储能系统",
  },
  featuredHighlight3: {
    th: "AI Monitoring 24/7",
    en: "AI Monitoring 24/7",
    cn: "AI 24/7 监控",
  },
  featuredHighlight4: {
    th: "ติดตั้งเสร็จ 2024",
    en: "Completed 2024",
    cn: "2024年完工",
  },

  /* ─── Stats ─── */
  stat1Value: { th: "2", en: "2", cn: "2" },
  stat1Label: {
    th: "Solar Farm Node",
    en: "Solar Farm Nodes",
    cn: "太阳能农场节点",
  },
  stat2Value: { th: "6+", en: "6+", cn: "6+" },
  stat2Label: { th: "ประเภทโซลูชัน", en: "Solution Types", cn: "解决方案类型" },
  stat3Value: { th: "24/7", en: "24/7", cn: "24/7" },
  stat3Label: { th: "AI Monitoring", en: "AI Monitoring", cn: "AI 监控" },
  stat4Value: { th: "25+ ปี", en: "25+ yrs", cn: "25+ 年" },
  stat4Label: { th: "อายุการใช้งาน", en: "System Lifespan", cn: "系统寿命" },

  /* ─── Filter ─── */
  filterAll: { th: "ทั้งหมด", en: "All", cn: "全部" },

  /* ─── Project Cards ─── */
  proj1Title: {
    th: "Solar Farm Node 2 — โรงแรมโฮลาเทลริมน่าน",
    en: "Solar Farm Node 2 — Holatel Rim Nan Hotel",
    cn: "太阳能农场节点2 — Holatel Rim Nan 酒店",
  },
  proj1Location: { th: "น่าน", en: "Nan", cn: "楠府" },
  proj1Saving: { th: "กำลังก่อสร้าง", en: "Under Construction", cn: "建设中" },
  proj1Desc: {
    th: "Solar Farm Node 2 ที่โรงแรมโฮลาเทลริมน่าน กำลังดำเนินการก่อสร้าง พร้อมปรับปรุงโรงแรมใหม่",
    en: "Solar Farm Node 2 at Holatel Rim Nan Hotel, currently under construction with hotel renovation.",
    cn: "位于 Holatel Rim Nan 酒店的太阳能农场节点2，正在施工中并进行酒店翻新。",
  },

  proj2Title: {
    th: "อ่างเก็บน้ำเพื่อการเกษตร",
    en: "Agricultural Reservoir",
    cn: "农业水库",
  },
  proj2Location: { th: "นครราชสีมา", en: "Nakhon Ratchasima", cn: "呵叻" },
  proj2Saving: {
    th: "ลดการระเหยน้ำ 35%",
    en: "35% Water Evaporation Reduction",
    cn: "减少蒸发 35%",
  },
  proj2Desc: {
    th: "Floating Solar บนอ่างเก็บน้ำ ผลิตไฟฟ้าสำหรับระบบสูบน้ำและ Cold Storage",
    en: "Floating Solar on reservoir, generating electricity for water pumping and Cold Storage systems.",
    cn: "水库上的浮动太阳能，为抽水系统和冷库供电。",
  },

  proj3Title: {
    th: "Solar Carport — โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Solar Carport — Ruenphae Royal Park Hotel",
    cn: "太阳能车棚 — Ruenphae Royal Park 酒店",
  },
  proj3Location: { th: "พิษณุโลก", en: "Phitsanulok", cn: "彭世洛" },
  proj3Saving: {
    th: "ลดค่าไฟได้ประมาณ 30-100%",
    en: "Estimated 30-100% Bill Reduction",
    cn: "预估减少电费30-100%",
  },
  proj3Desc: {
    th: "Solar Carport ติดตั้งจริงที่โรงแรมเรือนแพ รอยัลปาร์ค พร้อมระบบ BESS กักเก็บพลังงาน และ Cable Tray มาตรฐานวิศวกรรม",
    en: "Real Solar Carport at Ruenphae Royal Park Hotel with BESS energy storage and engineered Cable Tray system.",
    cn: "在 Ruenphae Royal Park 酒店实际安装的太阳能车棚，配备 BESS 储能和工程电缆桥架系统。",
  },

  proj4Title: {
    th: "รีสอร์ทติดทะเล",
    en: "Beachfront Resort",
    cn: "海滨度假村",
  },
  proj4Location: { th: "ภูเก็ต", en: "Phuket", cn: "普吉" },
  proj4Saving: {
    th: "ลดค่าพลังงาน 42%",
    en: "42% Energy Savings",
    cn: "节省能源 42%",
  },
  proj4Desc: {
    th: "Rooftop Solar + BESS สำหรับรีสอร์ท สำรองไฟฟ้าสำหรับ critical systems",
    en: "Rooftop Solar + BESS for resort, backup power for critical systems.",
    cn: "屋顶太阳能 + BESS 为度假村提供关键系统备用电力。",
  },

  proj5Title: {
    th: "คลังสินค้าและศูนย์กระจายสินค้า",
    en: "Warehouse & Distribution Center",
    cn: "仓库和配送中心",
  },
  proj5Location: { th: "สมุทรปราการ", en: "Samut Prakan", cn: "北榄" },
  proj5Saving: {
    th: "ลดค่าไฟ 55%",
    en: "55% Bill Reduction",
    cn: "减少电费 55%",
  },
  proj5Desc: {
    th: "Rooftop Solar ขนาดใหญ่บนหลังคาคลังสินค้า 5 อาคาร พร้อม AI O&M",
    en: "Large-scale Rooftop Solar across 5 warehouse buildings with AI O&M.",
    cn: "5栋仓库屋顶大型太阳能系统，配备 AI 运维。",
  },

  proj6Title: {
    th: "ฟาร์มเกษตรอัจฉริยะ",
    en: "Smart Agriculture Farm",
    cn: "智慧农业农场",
  },
  proj6Location: { th: "นครปฐม", en: "Nakhon Pathom", cn: "佛统" },
  proj6Saving: {
    th: "ลดค่าไฟ 60%",
    en: "60% Bill Reduction",
    cn: "减少电费 60%",
  },
  proj6Desc: {
    th: "Solar + BESS สำหรับฟาร์ม จ่ายไฟให้ IoT, สูบน้ำ และห้องเย็นตลอด 24 ชม.",
    en: "Solar + BESS for farm, powering IoT, water pumps, and cold storage 24/7.",
    cn: "太阳能 + BESS 为农场供电，24小时为物联网、水泵和冷库供电。",
  },

  /* ─── Badges ─── */
  badgeRendering: { th: "ภาพจำลอง", en: "Rendering", cn: "效果图" },
  badgeReal: { th: "ผลงานจริง", en: "Real Project", cn: "实际项目" },

  /* ─── Mid-page CTA ─── */
  ctaMidTitle: {
    th: "ต้องการ Solar Carport สำหรับธุรกิจของคุณ?",
    en: "Need Solar Carport for your business?",
    cn: "需要太阳能车棚吗？",
  },
  ctaMidDesc: {
    th: "ดูรายละเอียดเพิ่มเติมเกี่ยวกับ Solar Carport — โซลูชันที่ลูกค้าเลือกมากที่สุด",
    en: "Learn more about Solar Carport — the most popular solution among our clients.",
    cn: "了解更多关于太阳能车棚的信息 — 客户最受欢迎的解决方案。",
  },
  ctaMidBtn: {
    th: "ดู Solar Carport",
    en: "View Solar Carport",
    cn: "查看太阳能车棚",
  },

  /* ─── Equipment Section ─── */
  equipLabel: { th: "Equipment", en: "Equipment", cn: "设备" },
  equipTitle: {
    th: "อุปกรณ์ที่ใช้ในโครงการ",
    en: "Equipment Used in This Project",
    cn: "本项目使用的设备",
  },
  equipDesc: {
    th: "เราเลือกใช้อุปกรณ์ระดับ Tier-1 จากผู้ผลิตชั้นนำ เพื่อประสิทธิภาพสูงสุดและความทนทานตลอดอายุการใช้งาน",
    en: "We select Tier-1 equipment from leading manufacturers for maximum efficiency and durability throughout the system lifespan.",
    cn: "我们选择一线制造商的 Tier-1 设备，以确保整个系统寿命期间的最高效率和耐久性。",
  },
  equipPanel: { th: "แผงโซลาร์เซลล์", en: "Solar Panel", cn: "太阳能板" },
  equipPanelModel: {
    th: "AIKO Neostar 1U+ Dual-Glass",
    en: "AIKO Neostar 1U+ Dual-Glass",
    cn: "AIKO Neostar 1U+ 双玻组件",
  },
  equipPanelPower: { th: "680W / แผง", en: "680W / panel", cn: "680W / 块" },
  equipPanelEff: {
    th: "ประสิทธิภาพ 24.3%",
    en: "24.3% Efficiency",
    cn: "效率 24.3%",
  },
  equipPanelType: {
    th: "N-Type ABC Bifacial",
    en: "N-Type ABC Bifacial",
    cn: "N型 ABC 双面",
  },
  equipPanelWarranty: {
    th: "รับประกัน 30 ปี",
    en: "30-year Warranty",
    cn: "30年质保",
  },
  equipPanelAward: {
    th: "Red Dot Winner 2023",
    en: "Red Dot Winner 2023",
    cn: "2023红点奖",
  },
  equipBess: {
    th: "แบตเตอรี่กักเก็บพลังงาน",
    en: "Battery Energy Storage",
    cn: "电池储能",
  },
  equipBessModel: {
    th: "GSL Energy 51.2V 16.08kWh",
    en: "GSL Energy 51.2V 16.08kWh",
    cn: "GSL Energy 51.2V 16.08kWh",
  },
  equipBessChem: {
    th: "LiFePO4 — ปลอดภัยสูง",
    en: "LiFePO4 — High Safety",
    cn: "LiFePO4 — 高安全性",
  },
  equipBessCycle: {
    th: "อายุการใช้งาน 10,000+ รอบ",
    en: "10,000+ Cycle Life",
    cn: "10,000+ 循环寿命",
  },
  equipBessIp: {
    th: "IP65 ติดตั้งกลางแจ้ง",
    en: "IP65 Outdoor Rated",
    cn: "IP65 户外防护",
  },
  equipBessWarranty: {
    th: "รับประกัน 10 ปี",
    en: "10-year Warranty",
    cn: "10年质保",
  },
  equipBessScale: {
    th: "ขยายได้สูงสุด 257kWh",
    en: "Scalable up to 257kWh",
    cn: "可扩展至 257kWh",
  },
  equipDatasheet: {
    th: "ดาวน์โหลด Datasheet",
    en: "Download Datasheet",
    cn: "下载数据表",
  },

  /* ─── Gallery ─── */
  galleryLabel: { th: "Gallery", en: "Gallery", cn: "图库" },
  galleryTitle: {
    th: "ภาพหน้างานจริง",
    en: "Real Project Photos",
    cn: "实际施工照片",
  },
  gallerySubtitle: {
    th: "ภาพถ่ายจากการติดตั้งจริงที่โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Photos from the actual installation at Ruenphae Royal Park Hotel",
    cn: "Ruenphae Royal Park 酒店实际安装照片",
  },

  /* ─── Final CTA ─── */
  ctaFinalTitle: {
    th: "ต้องการผลลัพธ์แบบนี้สำหรับธุรกิจคุณ?",
    en: "Want results like these for your business?",
    cn: "想要为您的企业获得同样的成果？",
  },
  ctaFinalDesc: {
    th: "นัดสำรวจหน้างานฟรี ไม่มีข้อผูกมัด — ทีมวิศวกรของเราพร้อมออกแบบโซลูชันเฉพาะสำหรับธุรกิจของคุณ",
    en: "Book a free site survey with no obligations — our engineers are ready to design a custom solution for your business.",
    cn: "预约免费现场勘察，无任何附加条件 — 我们的工程师随时为您设计定制解决方案。",
  },
  ctaFinalBtn1: {
    th: "นัดสำรวจหน้างานฟรี",
    en: "Book Free Site Survey",
    cn: "预约免费勘察",
  },
  ctaFinalBtn2: {
    th: "ประเมินความคุ้มค่า",
    en: "Assess Your Savings",
    cn: "评估节省潜力",
  },
};
registerPageTranslations("projects", dict);
export default dict;
