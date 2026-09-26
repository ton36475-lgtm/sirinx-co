import { registerPageTranslations, type TranslationDict } from "../index";
import { solarCarportFaqTranslationEntries } from "@shared/solarCarportFaq";

const dict: TranslationDict = {
  // Hero
  "sc.badge": {
    th: "Flagship Solution",
    en: "Flagship Solution",
    cn: "旗舰方案",
  },
  "sc.hero.title1": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "Solar Carport",
  },
  "sc.hero.title2": {
    th: "ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV",
    en: "Generate Power. Provide Shade. EV Ready.",
    cn: "发电 遮阳 支持电动车",
  },
  "sc.hero.desc": {
    th: "เปลี่ยนลานจอดรถเป็นแหล่งผลิตไฟฟ้า ให้ร่มเงา รองรับ EV และวางแผนระบบจากข้อมูลหน้างานจริง",
    en: "Transform your parking lot into a power-generation asset that provides shade and supports EV, planned from real site data.",
    cn: "将停车场转变为发电设施，提供遮阳并支持电动车，根据实际现场数据规划系统。",
  },
  "sc.hero.cta1": {
    th: "ขอใบเสนอราคา Solar Carport",
    en: "Get Solar Carport Quote",
    cn: "获取Solar Carport报价",
  },
  "sc.hero.cta2": {
    th: "ประเมินความคุ้มค่าฟรี",
    en: "Free ROI Assessment",
    cn: "免费ROI评估",
  },
  "sc.hero.stat.bill": { th: "ลดค่าไฟ", en: "Bill Reduction", cn: "电费减少" },
  "sc.hero.stat.roi": { th: "คืนทุน", en: "ROI Period", cn: "回本周期" },
  "sc.hero.stat.life": { th: "อายุระบบ", en: "System Life", cn: "系统寿命" },
  "sc.hero.stat.monitor": { th: "การติดตามระบบ", en: "System monitoring", cn: "系统监控" },
  "sc.hero.stat.billValue": { th: "ประเมินจากข้อมูลหน้างาน", en: "Assessed from site data", cn: "根据现场数据评估" },
  "sc.hero.stat.roiValue": { th: "คำนวณเฉพาะโครงการ", en: "Project-specific calculation", cn: "按项目计算" },
  "sc.hero.stat.lifeValue": { th: "ตามรุ่นอุปกรณ์", en: "Equipment-specific", cn: "以设备型号为准" },
  "sc.hero.stat.monitorValue": { th: "AI / Energy Monitoring", en: "AI / Energy Monitoring", cn: "AI / Energy Monitoring" },

  // Benefits
  "sc.benefits.label": { th: "Benefits", en: "Benefits", cn: "优势" },
  "sc.benefits.title": {
    th: "ทำไมต้อง Solar Carport?",
    en: "Why Solar Carport?",
    cn: "为什么选择Solar Carport？",
  },
  "sc.benefits.desc": {
    th: "ไม่ใช่แค่แผงโซลาร์บนที่จอดรถ — แต่เป็นโครงสร้างพื้นฐานที่สร้างมูลค่าหลายมิติ",
    en: "Not just solar panels on a parking lot — it's multi-dimensional value-creating infrastructure.",
    cn: "不仅仅是停车场上的太阳能板——而是创造多维价值的基础设施。",
  },
  "sc.b1.title": {
    th: "ผลิตไฟฟ้าจากพื้นที่ว่าง",
    en: "Generate Power from Unused Space",
    cn: "利用闲置空间发电",
  },
  "sc.b1.desc": {
    th: "เปลี่ยนลานจอดรถให้เป็นแหล่งผลิตไฟฟ้าโดยไม่ต้องใช้พื้นที่หลังคาอาคาร พร้อมประเมินผลจากข้อมูลหน้างาน",
    en: "Turn parking areas into power-generation space without using building roofs, with outcomes assessed from site data.",
    cn: "将停车区域转化为发电空间，无需占用建筑屋顶，并根据现场数据评估结果。",
  },
  "sc.b2.title": {
    th: "ร่มเงาปกป้องรถยนต์",
    en: "Vehicle Shade Protection",
    cn: "车辆遮阳保护",
  },
  "sc.b2.desc": {
    th: "โครงสร้างหลังคาให้ร่มเงาจากแดดและฝน ลดอุณหภูมิภายในรถ ลดค่าซ่อมบำรุงสีรถจากรังสี UV",
    en: "Roof structure provides shade from sun and rain, reducing interior temperature and UV paint damage.",
    cn: "屋顶结构遮阳挡雨，降低车内温度，减少紫外线对车漆的损害。",
  },
  "sc.b3.title": {
    th: "รองรับ EV Charging",
    en: "EV Charging Ready",
    cn: "支持电动车充电",
  },
  "sc.b3.desc": {
    th: "ติดตั้ง EV Charging Station ได้ทันที ทั้ง AC Type 2 และ DC Fast Charger จ่ายไฟจาก Solar โดยตรง",
    en: "Install EV Charging Stations immediately — both AC Type 2 and DC Fast Charger powered directly by solar.",
    cn: "可立即安装电动车充电站——AC Type 2和DC快充，直接由太阳能供电。",
  },
  "sc.b4.title": {
    th: "BESS กักเก็บพลังงาน",
    en: "BESS Energy Storage",
    cn: "BESS储能系统",
  },
  "sc.b4.desc": {
    th: "เก็บไฟฟ้าส่วนเกินไว้ใช้ช่วง peak หรือเป็นพลังงานสำรอง โดยประเมินผลจาก load profile และข้อกำหนดความปลอดภัย",
    en: "Store excess electricity for peak periods or backup use, with results assessed from the load profile and safety requirements.",
    cn: "将多余电力用于高峰时段或备用，并根据负载曲线和安全要求评估效果。",
  },
  "sc.b5.title": {
    th: "AI Energy Management",
    en: "AI Energy Management",
    cn: "AI能源管理",
  },
  "sc.b5.desc": {
    th: "ระบบ AI วิเคราะห์การใช้พลังงานแบบ real-time ปรับการจ่ายไฟอัตโนมัติเพื่อประสิทธิภาพสูงสุด",
    en: "AI system analyzes energy usage in real-time, automatically optimizing power distribution for maximum efficiency.",
    cn: "AI系统实时分析能源使用，自动优化配电以实现最高效率。",
  },
  "sc.b6.title": {
    th: "ESG & Green Building",
    en: "ESG & Green Building",
    cn: "ESG与绿色建筑",
  },
  "sc.b6.desc": {
    th: "เพิ่มมูลค่าอสังหาริมทรัพย์ ตอบโจทย์ ESG, Green Building Certification และ Carbon Neutrality",
    en: "Increase property value, meet ESG requirements, Green Building Certification, and Carbon Neutrality goals.",
    cn: "提升物业价值，满足ESG要求、绿色建筑认证和碳中和目标。",
  },

  // Integration
  "sc.integration.label": {
    th: "Integration",
    en: "Integration",
    cn: "系统集成",
  },
  "sc.integration.title": {
    th: "ระบบครบวงจร",
    en: "Complete System",
    cn: "完整系统",
  },
  "sc.integration.title2": {
    th: "Solar + BESS + AI + EV",
    en: "Solar + BESS + AI + EV",
    cn: "Solar + BESS + AI + EV",
  },
  "sc.integration.desc": {
    th: "Solar Carport ไม่ได้ทำงานเดี่ยว — ทำงานร่วมกับ BESS กักเก็บพลังงาน, AI Energy Management วิเคราะห์การใช้ไฟแบบ real-time และ EV Charging Station ที่จ่ายไฟจาก Solar โดยตรง",
    en: "Solar Carport doesn't work alone — it integrates with BESS energy storage, AI Energy Management for real-time analysis, and EV Charging Stations powered directly by solar.",
    cn: "Solar Carport不是独立运行——它与BESS储能、AI能源管理实时分析和太阳能直供的电动车充电站集成。",
  },
  "sc.integration.step1": {
    th: "Solar Carport ผลิตไฟฟ้าจากแสงอาทิตย์",
    en: "Solar Carport generates electricity from sunlight",
    cn: "Solar Carport利用阳光发电",
  },
  "sc.integration.step2": {
    th: "BESS กักเก็บส่วนเกิน ใช้ช่วง peak",
    en: "BESS stores excess for peak usage",
    cn: "BESS储存多余电力用于高峰期",
  },
  "sc.integration.step3": {
    th: "AI ปรับการจ่ายไฟอัตโนมัติ real-time",
    en: "AI auto-optimizes power distribution in real-time",
    cn: "AI实时自动优化配电",
  },
  "sc.integration.step4": {
    th: "EV Charger จ่ายไฟจาก Solar โดยตรง",
    en: "EV Charger powered directly by solar",
    cn: "电动车充电器直接由太阳能供电",
  },

  // Mid CTA
  "sc.midCta.title": {
    th: "พร้อมเปลี่ยนที่จอดรถเป็นโรงไฟฟ้า?",
    en: "Ready to turn your parking lot into a power plant?",
    cn: "准备好将停车场变为发电站了吗？",
  },
  "sc.midCta.desc": {
    th: "นัดสำรวจหน้างานฟรี ไม่มีข้อผูกมัด — รับข้อเสนอ Solar Carport พร้อม ROI เฉพาะโครงการ",
    en: "Book a free site survey, no obligation — receive a Solar Carport proposal with project-specific ROI.",
    cn: "预约免费现场勘察，无任何义务——获取含项目专属ROI的Solar Carport方案。",
  },
  "sc.midCta.btn": {
    th: "นัดสำรวจหน้างานฟรี",
    en: "Book Free Site Survey",
    cn: "预约免费现场勘察",
  },

  // Specs
  "sc.specs.label": {
    th: "Specifications",
    en: "Specifications",
    cn: "技术规格",
  },
  "sc.specs.title": {
    th: "สเปคระบบ Solar Carport",
    en: "Solar Carport System Specs",
    cn: "Solar Carport系统规格",
  },
  "sc.spec.capacity.label": { th: "กำลังผลิต", en: "Capacity", cn: "发电容量" },
  "sc.spec.capacity.note": {
    th: "ขึ้นอยู่กับพื้นที่",
    en: "Depends on area",
    cn: "取决于面积",
  },
  "sc.spec.structure.label": { th: "โครงสร้าง", en: "Structure", cn: "结构" },
  "sc.spec.structure.value": {
    th: "เหล็กกล้าชุบสังกะสี",
    en: "Galvanized Steel",
    cn: "镀锌钢",
  },
  "sc.spec.structure.note": {
    th: "ตามสเปกและการรับประกัน",
    en: "By specification and warranty",
    cn: "以规格和质保为准",
  },
  "sc.spec.panel.label": {
    th: "แผงโซลาร์",
    en: "Solar Panels",
    cn: "太阳能板",
  },
  "sc.spec.panel.note": {
    th: "ตามรุ่นอุปกรณ์ที่อนุมัติ",
    en: "By approved equipment model",
    cn: "以批准的设备型号为准",
  },
  "sc.spec.inverter.label": { th: "Inverter", en: "Inverter", cn: "逆变器" },
  "sc.spec.inverter.note": {
    th: "ตามขนาดโครงการ",
    en: "Based on project size",
    cn: "根据项目规模",
  },
  "sc.spec.height.label": { th: "ความสูง", en: "Height", cn: "高度" },
  "sc.spec.height.value": {
    th: "ตามแบบวิศวกรรม",
    en: "By engineering design",
    cn: "以工程设计为准",
  },
  "sc.spec.height.note": {
    th: "รองรับรถตู้/SUV",
    en: "Fits vans/SUVs",
    cn: "适合面包车/SUV",
  },
  "sc.spec.install.label": {
    th: "ระยะเวลาติดตั้ง",
    en: "Installation Time",
    cn: "安装时间",
  },
  "sc.spec.install.value": { th: "ตามแผนงานโครงการ", en: "By project schedule", cn: "按项目计划" },
  "sc.spec.install.note": {
    th: "รวมขออนุญาต",
    en: "Including permits",
    cn: "含许可申请",
  },

  // Industries
  "sc.ind.label": { th: "Industries", en: "Industries", cn: "适用行业" },
  "sc.ind.title": {
    th: "Solar Carport เหมาะกับธุรกิจไหน?",
    en: "Which businesses suit Solar Carport?",
    cn: "Solar Carport适合哪些企业？",
  },
  "sc.ind.factory.title": { th: "โรงงาน", en: "Factories", cn: "工厂" },
  "sc.ind.factory.desc": {
    th: "ลานจอดรถพนักงาน 100+ คัน ลดต้นทุนพลังงานการผลิต",
    en: "100+ employee parking, reduce production energy costs",
    cn: "100+员工停车位，降低生产能源成本",
  },
  "sc.ind.factory.parking": {
    th: "100-500+ คัน",
    en: "100-500+ vehicles",
    cn: "100-500+辆",
  },
  "sc.ind.hotel.title": {
    th: "โรงแรม / รีสอร์ท",
    en: "Hotels / Resorts",
    cn: "酒店/度假村",
  },
  "sc.ind.hotel.desc": {
    th: "EV Charging สำหรับแขก Green Hotel Certification",
    en: "EV Charging for guests, Green Hotel Certification",
    cn: "为客人提供电动车充电，绿色酒店认证",
  },
  "sc.ind.hotel.parking": {
    th: "50-200 คัน",
    en: "50-200 vehicles",
    cn: "50-200辆",
  },
  "sc.ind.commercial.title": {
    th: "อาคารพาณิชย์",
    en: "Commercial Buildings",
    cn: "商业建筑",
  },
  "sc.ind.commercial.desc": {
    th: "เพิ่มมูลค่าอาคาร ลดค่าส่วนกลาง ตอบโจทย์ ESG",
    en: "Increase building value, reduce common fees, meet ESG",
    cn: "提升建筑价值，降低公共费用，满足ESG",
  },
  "sc.ind.commercial.parking": {
    th: "100-300+ คัน",
    en: "100-300+ vehicles",
    cn: "100-300+辆",
  },
  "sc.ind.edu.title": {
    th: "สถานศึกษา",
    en: "Educational Institutions",
    cn: "教育机构",
  },
  "sc.ind.edu.desc": {
    th: "ลดงบค่าไฟ สร้าง Living Lab พลังงานสะอาด",
    en: "Reduce electricity budget, create clean energy Living Lab",
    cn: "减少电费预算，创建清洁能源实验室",
  },
  "sc.ind.edu.parking": {
    th: "50-200 คัน",
    en: "50-200 vehicles",
    cn: "50-200辆",
  },

  // O&M
  "sc.om.label": { th: "After-Sales", en: "After-Sales", cn: "售后服务" },
  "sc.om.title1": {
    th: "ดูแลตามสัญญา O&M",
    en: "Care by O&M contract",
    cn: "按运维合同维护",
  },
  "sc.om.title2": {
    th: "ไม่ใช่แค่ติดตั้งแล้วจบ",
    en: "Not just install and forget",
    cn: "不只是安装完就结束",
  },
  "sc.om.desc": {
    th: "SIRINX มีบริการ O&M ด้วย AI Monitoring, Drone Inspection และทีมวิศวกรตามขอบเขตและเงื่อนไขสัญญา",
    en: "SIRINX provides O&M with AI Monitoring, Drone Inspection, and engineering support by scope and contract terms.",
    cn: "SIRINX按范围和合同条款提供AI监控、无人机巡检和工程支持。",
  },
  "sc.om.monitoring": {
    th: "AI Monitoring",
    en: "AI Monitoring",
    cn: "AI监控",
  },
  "sc.om.monitoring.value": { th: "ตามขอบเขตงาน", en: "By project scope", cn: "按项目范围" },
  "sc.om.response": { th: "ตอบสนอง", en: "Response", cn: "响应时间" },
  "sc.om.response.value": { th: "ตามสัญญา", en: "By contract", cn: "以合同为准" },
  "sc.om.warranty": { th: "รับประกัน", en: "Warranty", cn: "质保" },
  "sc.om.warranty.value": { th: "ตามผู้ผลิตและสัญญา", en: "By manufacturer and contract", cn: "以制造商和合同为准" },

  // Financing
  "sc.fin.label": { th: "Financing", en: "Financing", cn: "融资方案" },
  "sc.fin.title": {
    th: "รูปแบบการลงทุน Solar Carport",
    en: "Solar Carport Investment Options",
    cn: "Solar Carport投资方案",
  },
  "sc.fin.desc": {
    th: "ไม่ต้องจ่ายเต็มวันแรก — เลือกรูปแบบที่เหมาะกับธุรกิจของคุณ",
    en: "No full payment on day one — choose the model that fits your business.",
    cn: "无需首日全额支付——选择适合您企业的方案。",
  },
  "sc.fin.buy.title": {
    th: "ซื้อขาด",
    en: "Outright Purchase",
    cn: "全额购买",
  },
  "sc.fin.buy.desc": {
    th: "ลงทุนครั้งเดียว โดยผลตอบแทนต้องคำนวณจากข้อมูลโครงการและเงื่อนไขการลงทุน",
    en: "One-time investment, with returns calculated from project data and investment terms.",
    cn: "一次性投资，回报根据项目数据和投资条款计算。",
  },
  "sc.fin.buy.highlight": {
    th: "คำนวณผลตอบแทนเฉพาะโครงการ",
    en: "Project-specific return calculation",
    cn: "按项目计算回报",
  },
  "sc.fin.buy.f1": {
    th: "ผลตอบแทนสูงสุด",
    en: "Maximum returns",
    cn: "最高回报",
  },
  "sc.fin.buy.f2": {
    th: "เป็นเจ้าของทันที",
    en: "Immediate ownership",
    cn: "即刻拥有",
  },
  "sc.fin.buy.f3": {
    th: "หักค่าเสื่อม 150%",
    en: "150% depreciation deduction",
    cn: "150%折旧抵扣",
  },
  "sc.fin.installment.title": {
    th: "ผ่อนชำระ",
    en: "Installment Plan",
    cn: "分期付款",
  },
  "sc.fin.installment.desc": {
    th: "ค่างวดต่ำกว่าค่าไฟที่ประหยัดได้ เริ่มประหยัดตั้งแต่เดือนแรก",
    en: "Monthly payments lower than energy savings, start saving from month one.",
    cn: "月供低于节省的电费，从第一个月开始省钱。",
  },
  "sc.fin.installment.highlight": {
    th: "ค่างวด < ค่าไฟที่ลด",
    en: "Payment < Energy Savings",
    cn: "月供 < 节省电费",
  },
  "sc.fin.installment.f1": {
    th: "ไม่ต้องลงทุนสูง",
    en: "Low initial investment",
    cn: "低初始投资",
  },
  "sc.fin.installment.f2": {
    th: "ประหยัดตั้งแต่วันแรก",
    en: "Save from day one",
    cn: "第一天起省钱",
  },
  "sc.fin.installment.f3": {
    th: "ผ่อน 3-7 ปี",
    en: "3-7 year terms",
    cn: "3-7年分期",
  },
  "sc.fin.coinvest.title": {
    th: "Co-investment 50:50",
    en: "Co-investment 50:50",
    cn: "联合投资 50:50",
  },
  "sc.fin.coinvest.desc": {
    th: "SIRINX ร่วมลงทุน 50% แบ่งเบาภาระ แบ่งปันผลตอบแทน",
    en: "SIRINX co-invests 50%, sharing the burden and returns.",
    cn: "SIRINX共同投资50%，分担负担共享回报。",
  },
  "sc.fin.coinvest.highlight": {
    th: "ลงทุนแค่ครึ่ง",
    en: "Invest only half",
    cn: "只需投资一半",
  },
  "sc.fin.coinvest.f1": {
    th: "แบ่งเบาภาระ",
    en: "Shared burden",
    cn: "分担负担",
  },
  "sc.fin.coinvest.f2": { th: "ความเสี่ยงต่ำ", en: "Low risk", cn: "低风险" },
  "sc.fin.coinvest.f3": {
    th: "SIRINX ร่วมดูแล",
    en: "SIRINX co-manages",
    cn: "SIRINX共同管理",
  },
  "sc.fin.moreInfo": {
    th: "ศึกษาข้อมูลการลงทุนเพิ่มเติม",
    en: "Learn more about investment options",
    cn: "了解更多投资方案",
  },

  // Gallery
  "sc.gallery.label": {
    th: "Real Installation",
    en: "Real Installation",
    cn: "实际安装",
  },
  "sc.gallery.title": {
    th: "ภาพผลงานติดตั้งจริง",
    en: "Real Installation Gallery",
    cn: "实际安装图片",
  },
  "sc.gallery.desc": {
    th: "Solar Carport ที่โรงแรมเรือนแพ รอยัลปาร์ค พิษณุโลก — ติดตั้งโดยทีมวิศวกร SIRINX",
    en: "Solar Carport at Ruean Pae Royal Park Hotel, Phitsanulok — installed by SIRINX engineering team.",
    cn: "Solar Carport于Ruean Pae Royal Park酒店（彭世洛）——由SIRINX工程团队安装。",
  },
  "sc.gallery.viewAll": {
    th: "ดูผลงานทั้งหมด",
    en: "View all projects",
    cn: "查看所有项目",
  },
  "sc.gallery.imgAlt": {
    th: "Solar Carport ติดตั้งจริง",
    en: "Solar Carport real installation",
    cn: "Solar Carport实际安装",
  },

  // FAQ
  "sc.faq.label": { th: "FAQ", en: "FAQ", cn: "常见问题" },
  "sc.faq.title": {
    th: "คำถามที่พบบ่อย",
    en: "Frequently Asked Questions",
    cn: "常见问题",
  },
  // FAQ entries are generated from shared/solarCarportFaq.ts so the visible
  // questions and the FAQPage schema can never drift apart.
  ...solarCarportFaqTranslationEntries(),

  // Province planning block. Previously hardcoded Thai, which left English and
  // Chinese province pages showing a Thai section and a broken H1 continuation.
  "sc.hero.titleProvince": {
    th: "เปลี่ยนที่จอดรถเป็นโรงไฟฟ้า",
    en: "Turn your parking lot into a power plant",
    cn: "把停车场变成发电站",
  },
  "sc.province.badge": {
    th: "แนวทางออกแบบ Solar Carport ในจังหวัด",
    en: "Solar Carport planning in this province",
    cn: "本府的太阳能车棚规划",
  },
  "sc.province.title": {
    th: "ออกแบบ Solar Carport สำหรับพื้นที่{province}",
    en: "Solar Carport design for sites in {province}",
    cn: "{province}的太阳能车棚设计",
  },
  "sc.province.body": {
    th: "SIRINX วางแผนระบบ Solar Carport สำหรับโรงงาน โรงแรม อาคารพาณิชย์ ศูนย์กระจายสินค้า สถานศึกษา และองค์กรใน{province} โดยประเมินจากพื้นที่จอดรถ ค่าไฟจริง load profile โครงสร้างหน้างาน EV Charger, BESS และรูปแบบการลงทุน ก่อนสรุปแบบวิศวกรรมและใบเสนอราคา",
    en: "SIRINX plans Solar Carport systems for factories, hotels, commercial buildings, distribution centres, schools, and organisations in {province}. The design starts from the parking area, actual electricity bills and load profile, site structure, EV Charger and BESS needs, and the investment model, before the engineering design and the quotation are finalised.",
    cn: "SIRINX 为{province}的工厂、酒店、商业建筑、配送中心、学校和机构规划太阳能车棚系统。设计从停车场面积、实际电费与负荷曲线、现场结构、EV 充电桩与储能需求以及投资模式出发，然后才确定工程设计与报价。",
  },
  "sc.province.checklistTitle": {
    th: "สิ่งที่ประเมินให้ก่อนติดตั้ง",
    en: "What we assess before installation",
    cn: "安装前的评估内容",
  },
  "sc.province.item1": {
    th: "ศักยภาพพื้นที่จอดรถใน{province}",
    en: "Solar potential of parking areas in {province}",
    cn: "{province}停车场的太阳能潜力",
  },
  "sc.province.item2": {
    th: "ขนาดระบบ kWp ที่เหมาะกับค่าไฟและ load profile",
    en: "System size in kWp matched to electricity cost and load profile",
    cn: "与电费和负荷曲线匹配的系统容量（kWp）",
  },
  "sc.province.item3": {
    th: "EV Charger, BESS และ AI Energy Management ที่ควรใช้",
    en: "Which EV Charger, BESS, and AI Energy Management to use",
    cn: "EV 充电桩、储能与 AI 能源管理方案的选择",
  },
  "sc.province.item4": {
    th: "กรอบผลประหยัดและระยะคืนทุนต้องประเมินจากข้อมูลไซต์จริง",
    en: "Savings and payback range must be assessed from real site data",
    cn: "节省与回收期区间必须基于现场真实数据评估",
  },

  // Province energy facts, rendered only where a sourced record exists.
  "sc.solar.label": {
    th: "ข้อมูลพลังงานแสงอาทิตย์ของจังหวัด",
    en: "Provincial solar resource",
    cn: "本府太阳能资源数据",
  },
  "sc.solar.irradiation": {
    th: "ค่าการแผ่รังสีรวมเฉลี่ย {value} kWh/m² ต่อวัน",
    en: "Average global irradiation {value} kWh/m² per day",
    cn: "平均总辐照量 {value} kWh/m²/天",
  },
  "sc.solar.yield": {
    th: "ค่าการผลิตไฟฟ้าต่อหน่วยกำลัง {value} kWh ต่อ kWp ต่อปี",
    en: "Specific yield {value} kWh per kWp per year",
    cn: "单位发电量 {value} kWh/kWp/年",
  },
  "sc.solar.disclaimer": {
    th: "ค่านี้เป็นค่ากลางทางภูมิอากาศของจังหวัด ไม่ใช่ผลจากการสำรวจหน้างาน และไม่ใช่การรับประกันผลประหยัด ผลจริงขึ้นกับทิศหลังคา เงาบัง ระยะจากต้นข่าย ค่าการสูญเสียระบบ และรูปแบบการใช้ไฟของแต่ละไซต์",
    en: "These are climate normals for the province, not a site survey result and not a savings guarantee. Real output depends on roof orientation, shading, distance to the grid connection, system losses, and each site's actual consumption pattern.",
    cn: "以上数值为该府的气候平均值，并非现场勘察结果，也不构成节省保证。实际发电取决于屋顶朝向、遮挡、与并网点的距离、系统损耗以及每个场地的实际用电情况。",
  },
  "sc.solar.source": {
    th: "ที่มา: {source} · ฐานข้อมูล {database} · ช่วงปี {years} · ดึงข้อมูล {date}",
    en: "Source: {source} · database {database} · years {years} · retrieved {date}",
    cn: "来源：{source} · 数据库 {database} · 年份 {years} · 获取日期 {date}",
  },
  "sc.solar.coords": {
    th: "พิกัดที่ใช้คำนวณ: {lat}, {lon}",
    en: "Lookup coordinates: {lat}, {lon}",
    cn: "计算坐标：{lat}, {lon}",
  },

  "sc.solar.chartTitle": {
    th: "โครงสร้างแสงอาทิตย์รายเดือนของจังหวัด",
    en: "Monthly solar profile of the province",
    cn: "本府的逐月太阳能曲线",
  },
  "sc.solar.chartRef": {
    th: "ค่าเฉลี่ยของ 77 จังหวัด",
    en: "Mean across the 77 provinces",
    cn: "77 个府的均值",
  },
  "sc.solar.chartCaption": {
    th: "ความสูงแท่งคือค่าการแผ่รังสีเฉลี่ยของเดือนนั้น เส้นประคือค่าเฉลี่ยของทั้งประเทศ เพื่อให้เห็นว่าจังหวัดนี้สูงกว่าหรือต่ำกว่าค่ากลางอย่างไร",
    en: "Bar height is that month's average irradiation. The dashed line is the national mean, so you can see whether this province sits above or below it.",
    cn: "柱高为该月的平均辐照量，虚线为全国均值，便于判断本省高于还是低于平均水平。",
  },

  // 3D viewer, product page only. Lazy loaded so Three.js never enters the
  // province page bundle.
  "sc.viewer.title": {
    th: "ดูโครงสร้าง Solar Carport แบบสามมิติ",
    en: "See the Solar Carport structure in 3D",
    cn: "以三维方式查看太阳能车棚结构",
  },
  "sc.viewer.intro": {
    th: "ลากเพื่อหมุนมุมมอง และเลื่อนเดือนหรือมุมเอียงแผงเพื่อดูผลกับ{province} ตัวเลขคำนวณจากค่าแสงอาทิตย์จริงของจังหวัดนี้",
    en: "Drag to orbit, and move the month or panel tilt to see the effect for {province}. The figures come from this province's own solar resource data.",
    cn: "拖动可旋转视角，调节月份或组件倾角可查看在{province}的效果。数值来自本府的太阳能资源数据。",
  },
  "sc.viewer.month": { th: "เดือน", en: "Month", cn: "月份" },
  "sc.viewer.tilt": { th: "มุมเอียงแผง", en: "Panel tilt", cn: "组件倾角" },
  "sc.viewer.poa": { th: "รัศมีบนแผง", en: "Irradiance on panel", cn: "组件表面辐照量" },
  "sc.viewer.energy": { th: "พลังงานต่อวัน", en: "Energy per day", cn: "日发电量" },
  "sc.viewer.sun": { th: "มุมดวงอาทิตย์", en: "Sun elevation", cn: "太阳高度角" },
  "sc.viewer.noWebgl": {
    th: "เบราว์เซอร์นี้ไม่รองรับ WebGL จึงแสดงเฉพาะตัวเลข ตัวโครงสร้างและการจัดวางอ้างอิงจากหน้า Solar Carport",
    en: "This browser does not support WebGL, so only the figures are shown. See the Solar Carport page for the structure and layout.",
    cn: "此浏览器不支持 WebGL，因此仅显示数值。结构与布局请见太阳能车棚页面。",
  },
  "sc.viewer.start": {
    th: "เปิดดูโครงสร้างสามมิติ",
    en: "Open the 3D structure",
    cn: "打开三维结构",
  },
  "sc.viewer.startHint": {
    th: "โหลด Three.js เมื่อกดเท่านั้น ใช้เมาส์หรือนิ้วลากเพื่อหมุนมุมมอง",
    en: "Loads Three.js only when clicked. Drag with the mouse or a finger to orbit.",
    cn: "仅在点击后加载 Three.js。可拖动旋转视角。",
  },
  "sc.viewer.loading": {
    th: "กำลังเตรียมภาพสามมิติ",
    en: "Preparing the 3D view",
    cn: "正在准备三维视图",
  },

  // Province index cross-links
  "sc.provinces.link": {
    th: "ดู Solar Carport ทุกจังหวัด",
    en: "See Solar Carport in all provinces",
    cn: "查看所有省市的太阳能车棚",
  },
  "sc.provinces.all": {
    th: "กลับไปหน้า Solar Carport",
    en: "Back to Solar Carport",
    cn: "返回太阳能车棚页面",
  },

  // Sticky CTA
  "sc.sticky.label": {
    th: "ประเมินผลประหยัดและคืนทุนจากไซต์จริง",
    en: "Assess savings and ROI from real site data",
    cn: "根据现场数据评估节省和ROI",
  },
  "sc.sticky.btn": { th: "ขอใบเสนอราคา", en: "Get Quote", cn: "获取报价" },

  // Final CTA
  "sc.finalCta.title": {
    th: "พร้อมเปลี่ยนที่จอดรถเป็นโรงไฟฟ้า?",
    en: "Ready to turn your parking lot into a power plant?",
    cn: "准备好将停车场变为发电站了吗？",
  },
  "sc.finalCta.desc": {
    th: "นัดสำรวจหน้างานฟรี ไม่มีข้อผูกมัด รับข้อเสนอ Solar Carport ที่ออกแบบเฉพาะสำหรับธุรกิจของคุณ",
    en: "Book a free site survey, no obligation. Receive a Solar Carport proposal designed specifically for your business.",
    cn: "预约免费现场勘察，无任何义务。获取专为您企业设计的Solar Carport方案。",
  },
  "sc.finalCta.btn1": {
    th: "ขอใบเสนอราคา Solar Carport",
    en: "Get Solar Carport Quote",
    cn: "获取Solar Carport报价",
  },
  "sc.finalCta.btn2": {
    th: "ประเมินความคุ้มค่าฟรี",
    en: "Free ROI Assessment",
    cn: "免费ROI评估",
  },
};

registerPageTranslations("solarCarport", dict);
export default dict;
