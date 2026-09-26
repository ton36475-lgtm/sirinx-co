import { registerPageTranslations, type TranslationDict } from "../index";
const dict: TranslationDict = {
  /* ─── Page Header ─── */
  sectionLabel: { th: "Portfolio", en: "Portfolio", cn: "项目案例" },
  pageTitle: { th: "ผลงาน", en: "Proven", cn: "经过" },
  pageTitleAccent: { th: "ที่พิสูจน์ได้", en: "Results", cn: "验证的成果" },
  pageDesc: {
    th: "ภาพผลงานติดตั้งจริงจากโรงแรมเรือนแพ รอยัลปาร์คและโรงแรมโฮลาเทล พร้อมแนวคิดโซลูชันที่ระบุสถานะชัดเจน",
    en: "Real installation photos from Ruenphae Royal Park and Holatel Hotel, plus clearly labelled solution concepts.",
    cn: "Ruenphae Royal Park 与 Holatel Hotel 的真实安装照片，以及明确标注状态的解决方案概念。",
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
    th: "ผลลัพธ์จริงอยู่ระหว่างตรวจหลักฐาน",
    en: "Measured results pending evidence review",
    cn: "实测结果待证据审核",
  },
  featuredYear: { th: "ปีติดตั้งอยู่ระหว่างตรวจหลักฐาน", en: "Installation year under review", cn: "安装年份待证据审核" },
  featuredOwner: {
    th: "ข้อมูลผู้ว่าจ้างไม่เปิดเผย",
    en: "Client identity withheld",
    cn: "客户身份不公开",
  },
  featuredDesc: {
    th: "Solar Carport ติดตั้งจริงที่โรงแรมเรือนแพ รอยัลปาร์ค พิษณุโลก พร้อมองค์ประกอบระบบที่อยู่ระหว่างตรวจสอบกับ Evidence Record ก่อนเผยแพร่รายละเอียดเชิงเทคนิค",
    en: "Real Solar Carport installation at Ruenphae Royal Park Hotel, Phitsanulok. Technical system details remain subject to Evidence Record review before publication.",
    cn: "彭世洛 Ruenphae Royal Park 酒店的太阳能车棚已实际安装。技术系统细节在发布前仍需根据证据记录审核。",
  },
  featuredHighlight1: {
    th: "อยู่ระหว่างตรวจผลลัพธ์จากหน้างาน",
    en: "Site results under evidence review",
    cn: "现场结果待证据审核",
  },
  featuredHighlight2: {
    th: "BESS กักเก็บพลังงาน",
    en: "BESS Energy Storage",
    cn: "BESS 储能系统",
  },
  featuredHighlight3: {
    th: "AI Monitoring ตามขอบเขตงาน",
    en: "AI Monitoring by project scope",
    cn: "按项目范围提供AI监控",
  },
  featuredHighlight4: {
    th: "ปีติดตั้งอยู่ระหว่างตรวจหลักฐาน",
    en: "Installation year under review",
    cn: "安装年份待证据审核",
  },

  /* ─── Stats ─── */
  stat1Value: { th: "2", en: "2", cn: "2" },
  stat1Label: {
    th: "โครงการที่มีสถานะ",
    en: "Status-bound projects",
    cn: "已绑定状态的项目",
  },
  stat2Value: { th: "ตามรายการ", en: "By project list", cn: "按项目列表" },
  stat2Label: { th: "ประเภทระบบ", en: "System types", cn: "系统类型" },
  stat3Value: { th: "ตามขอบเขต", en: "By scope", cn: "按范围" },
  stat3Label: { th: "AI Monitoring", en: "AI Monitoring", cn: "AI 监控" },
  stat4Value: { th: "ตามรุ่นอุปกรณ์", en: "By equipment model", cn: "按设备型号" },
  stat4Label: { th: "อายุการใช้งาน", en: "System lifespan", cn: "系统寿命" },

  /* ─── Filter ─── */
  filterAll: { th: "ทั้งหมด", en: "All", cn: "全部" },

  /* ─── Project Cards ─── */
  proj1Title: {
    th: "Solar Rooftop — โรงแรมโฮลาเทล",
    en: "Solar Rooftop — Holatel Hotel",
    cn: "屋顶太阳能 — Holatel Hotel",
  },
  proj1Location: { th: "สถานที่ติดตั้งไม่เปิดเผย", en: "Installation location withheld", cn: "安装地点不公开" },
  yearUnderReview: { th: "ปีอยู่ระหว่างตรวจสอบ", en: "Year under review", cn: "年份待审核" },
  installationComplete: { th: "ติดตั้งเรียบร้อยแล้ว", en: "Installation completed", cn: "安装已完成" },
  conceptYear: { th: "แนวคิด / ยังไม่ใช่งานส่งมอบ", en: "Concept / not delivered", cn: "概念 / 尚未交付" },
  proj1Saving: { th: "ติดตั้งแล้ว", en: "Installed", cn: "已安装" },
  proj1Desc: {
    th: "ภาพ Solar Rooftop ที่ติดตั้งจริงที่โรงแรมโฮลาเทล โดยไม่เผยแพร่กำลังผลิต ผลประหยัด หรือรุ่นอุปกรณ์ที่ยังไม่ผ่านการตรวจหลักฐาน",
    en: "Real installed rooftop solar photos at Holatel Hotel, without publishing unverified capacity, savings, or equipment models.",
    cn: "Holatel Hotel 真实屋顶太阳能安装照片，不展示未经核实的容量、节能数据或设备型号。",
  },

  proj2Title: {
    th: "อ่างเก็บน้ำเพื่อการเกษตร",
    en: "Agricultural Reservoir",
    cn: "农业水库",
  },
  proj2Location: { th: "นครราชสีมา", en: "Nakhon Ratchasima", cn: "呵叻" },
  proj2Saving: {
    th: "ยังไม่มีผลลัพธ์ยืนยัน",
    en: "No verified result yet",
    cn: "暂无经验证结果",
  },
  proj2Desc: {
    th: "แนวคิด Floating Solar สำหรับอ่างเก็บน้ำและระบบสูบน้ำ — ยังไม่มีหลักฐานโครงการส่งมอบ",
    en: "Floating Solar concept for a reservoir and water-pumping use case; no delivered-project evidence yet.",
    cn: "水库和抽水场景的浮动太阳能概念方案，暂无交付项目证据。",
  },

  proj3Title: {
    th: "Solar Carport — โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Solar Carport — Ruenphae Royal Park Hotel",
    cn: "太阳能车棚 — Ruenphae Royal Park 酒店",
  },
  proj3Location: { th: "พิษณุโลก", en: "Phitsanulok", cn: "彭世洛" },
  proj3Saving: {
    th: "รอตรวจสอบผลลัพธ์จริง",
    en: "Measured result pending review",
    cn: "实测结果待审核",
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
    th: "ภาพจำลอง ยังไม่มีผลลัพธ์ยืนยัน",
    en: "Concept only; no verified result",
    cn: "概念方案，暂无经验证结果",
  },
  proj4Desc: {
    th: "แนวคิด Rooftop Solar + BESS สำหรับรีสอร์ท — ยังไม่มีหลักฐานโครงการส่งมอบ",
    en: "Rooftop Solar + BESS resort concept; no delivered-project evidence yet.",
    cn: "度假村屋顶太阳能 + BESS 概念方案，暂无交付项目证据。",
  },

  proj5Title: {
    th: "คลังสินค้าและศูนย์กระจายสินค้า",
    en: "Warehouse & Distribution Center",
    cn: "仓库和配送中心",
  },
  proj5Location: { th: "สมุทรปราการ", en: "Samut Prakan", cn: "北榄" },
  proj5Saving: {
    th: "ภาพจำลอง ยังไม่มีผลลัพธ์ยืนยัน",
    en: "Concept only; no verified result",
    cn: "概念方案，暂无经验证结果",
  },
  proj5Desc: {
    th: "แนวคิด Rooftop Solar สำหรับคลังสินค้า พร้อมแนวทาง O&M — ยังไม่มีหลักฐานโครงการส่งมอบ",
    en: "Rooftop Solar warehouse concept with an O&M approach; no delivered-project evidence yet.",
    cn: "仓库屋顶太阳能和运维方案概念，暂无交付项目证据。",
  },

  proj6Title: {
    th: "ฟาร์มเกษตรอัจฉริยะ",
    en: "Smart Agriculture Farm",
    cn: "智慧农业农场",
  },
  proj6Location: { th: "นครปฐม", en: "Nakhon Pathom", cn: "佛统" },
  proj6Saving: {
    th: "ภาพจำลอง ยังไม่มีผลลัพธ์ยืนยัน",
    en: "Concept only; no verified result",
    cn: "概念方案，暂无经验证结果",
  },
  proj6Desc: {
    th: "แนวคิด Solar + BESS สำหรับฟาร์มและระบบสูบน้ำ — ยังไม่มีหลักฐานโครงการส่งมอบ",
    en: "Solar + BESS farm concept for pumping and site loads; no delivered-project evidence yet.",
    cn: "农场和抽水负载的太阳能 + BESS 概念方案，暂无交付项目证据。",
  },

  /* ─── Badges ─── */
  badgeVerifiedLive: { th: "ผลงานติดตั้งจริง", en: "Verified Live", cn: "已验证上线项目" },
  badgeUnderConstruction: { th: "อยู่ระหว่างก่อสร้าง", en: "Under Construction", cn: "建设中" },
  badgeConceptSimulation: { th: "ภาพจำลอง / Concept Design", en: "Concept / Simulation", cn: "概念 / 模拟方案" },
  badgePendingEvidence: { th: "รอตรวจสอบหลักฐาน", en: "Evidence Pending", cn: "待核实" },
  imageUnavailable: { th: "ไม่สามารถแสดงภาพโครงการได้", en: "Project image unavailable", cn: "项目图片暂不可用" },

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
    th: "รายละเอียดอุปกรณ์ที่ผ่านการยืนยัน",
    en: "Verified equipment details",
    cn: "已验证的设备详情",
  },
  equipDesc: {
    th: "รุ่นอุปกรณ์ สเปก การรับประกัน และเอกสารผู้ผลิตจะเผยแพร่เมื่อผ่านการตรวจ Evidence Record และสิทธิ์การใช้ข้อมูลแล้ว",
    en: "Equipment models, specifications, warranties, and manufacturer documents will be published only after Evidence Record and usage-rights review.",
    cn: "设备型号、规格、质保和制造商文件只有在证据记录和使用权审核后才会发布。",
  },
  equipPanel: { th: "แผงโซลาร์เซลล์", en: "Solar Panel", cn: "太阳能板" },
  equipPanelModel: { th: "รอตรวจหลักฐาน", en: "Evidence review pending", cn: "待证据审核" },
  equipPanelPower: { th: "รอยืนยันจากเอกสาร", en: "Pending documentation", cn: "待文件确认" },
  equipPanelEff: {
    th: "รอยืนยันจากเอกสาร",
    en: "Pending documentation",
    cn: "待文件确认",
  },
  equipPanelType: {
    th: "รอยืนยันจากเอกสาร",
    en: "Pending documentation",
    cn: "待文件确认",
  },
  equipPanelWarranty: {
    th: "ตามผู้ผลิตและสัญญา",
    en: "By manufacturer and contract",
    cn: "以制造商和合同为准",
  },
  equipPanelAward: {
    th: "รอยืนยันแหล่งที่มา",
    en: "Source verification pending",
    cn: "待来源核实",
  },
  equipBess: {
    th: "แบตเตอรี่กักเก็บพลังงาน",
    en: "Battery Energy Storage",
    cn: "电池储能",
  },
  equipBessModel: { th: "รอตรวจหลักฐาน", en: "Evidence review pending", cn: "待证据审核" },
  equipBessChem: {
    th: "รอยืนยันจากเอกสาร",
    en: "Pending documentation",
    cn: "待文件确认",
  },
  equipBessCycle: {
    th: "รอยืนยันจากเอกสาร",
    en: "Pending documentation",
    cn: "待文件确认",
  },
  equipBessIp: {
    th: "รอยืนยันจากเอกสาร",
    en: "Pending documentation",
    cn: "待文件确认",
  },
  equipBessWarranty: {
    th: "ตามผู้ผลิตและสัญญา",
    en: "By manufacturer and contract",
    cn: "以制造商和合同为准",
  },
  equipBessScale: {
    th: "รอยืนยันจากแบบระบบ",
    en: "Pending system design",
    cn: "待系统设计确认",
  },
  equipDatasheet: {
    th: "เอกสารยังไม่เผยแพร่",
    en: "Documents not published",
    cn: "文件尚未发布",
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
