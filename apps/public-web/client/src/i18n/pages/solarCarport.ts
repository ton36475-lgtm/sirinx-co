import { registerPageTranslations, type TranslationDict } from "../index";

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
    th: "เปลี่ยนลานจอดรถเป็นโรงไฟฟ้าพลังงานแสงอาทิตย์ ลดค่าไฟ 30-100% คืนทุน 3-5 ปีโดยประมาณ พร้อม AI Energy Management และ O&M ตลอด 25 ปี",
    en: "Transform your parking lot into a solar power plant with estimated 30-100% bill reduction, 3-5 year payback, AI Energy Management, and 25-year O&M service.",
    cn: "将停车场变为太阳能发电站，预估降低30-100%电费，3-5年回本，配备AI能源管理和25年运维服务。",
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
  "sc.hero.stat.roiValue": { th: "3-5 ปี", en: "3-5 years", cn: "3-5年" },
  "sc.hero.stat.life": { th: "อายุระบบ", en: "System Life", cn: "系统寿命" },
  "sc.province.heroTitle2": {
    th: "ที่จอดรถผลิตไฟฟ้าสำหรับธุรกิจ",
    en: "Power-generating parking for business",
    cn: "为企业发电的停车空间",
  },
  "sc.province.localLabel": {
    th: "Local Solar Carport Planning",
    en: "Local Solar Carport Planning",
    cn: "本地 Solar Carport 规划",
  },
  "sc.province.titlePrefix": {
    th: "ออกแบบ Solar Carport สำหรับพื้นที่",
    en: "Solar Carport planning for",
    cn: "Solar Carport 规划地区：",
  },
  "sc.province.descPrefix": {
    th: "SIRINX วางแผนระบบ Solar Carport สำหรับโรงงาน โรงแรม อาคารพาณิชย์ ศูนย์กระจายสินค้า สถานศึกษา และองค์กรใน",
    en: "SIRINX plans Solar Carport systems for factories, hotels, commercial buildings, distribution centers, schools, and organizations in",
    cn: "SIRINX 为工厂、酒店、商业建筑、配送中心、学校及机构规划 Solar Carport，覆盖地区：",
  },
  "sc.province.descSuffix": {
    th: "โดยประเมินจากพื้นที่จอดรถ ค่าไฟจริง load profile โครงสร้างหน้างาน EV Charger, BESS และรูปแบบการลงทุน ก่อนสรุปแบบวิศวกรรมและใบเสนอราคา",
    en: "using parking area, real electricity bills, load profile, site structure, EV Charger, BESS, and investment model before finalizing engineering design and quotation.",
    cn: "并根据停车面积、真实电费、负载曲线、现场结构、EV Charger、BESS及投资模式，再形成工程设计与报价。",
  },
  "sc.province.checkTitle": {
    th: "สิ่งที่ประเมินให้ก่อนติดตั้ง",
    en: "What we assess before installation",
    cn: "安装前评估内容",
  },
  "sc.province.item1Prefix": {
    th: "ศักยภาพพื้นที่จอดรถใน",
    en: "Parking-area potential in",
    cn: "停车区域潜力：",
  },
  "sc.province.item2": {
    th: "ขนาดระบบ kWp ที่เหมาะกับค่าไฟและ load profile",
    en: "kWp system size matched to electricity bills and load profile",
    cn: "匹配电费与负载曲线的 kWp 系统规模",
  },
  "sc.province.item3": {
    th: "EV Charger, BESS และ AI Energy Management ที่ควรใช้",
    en: "EV Charger, BESS, and AI Energy Management options to consider",
    cn: "建议配置的 EV Charger、BESS 与 AI Energy Management",
  },
  "sc.province.item4": {
    th: "กรอบผลประหยัด 30-100% และคืนทุนเฉลี่ย 3-5 ปีตามข้อมูลไซต์จริง",
    en: "Estimated 30-100% savings and 3-5 year average payback based on real site data",
    cn: "基于真实现场数据预估节省30-100%，平均3-5年回本",
  },

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
    th: "เปลี่ยนลานจอดรถที่ไม่สร้างรายได้ให้เป็นแหล่งผลิตไฟฟ้า ลดค่าไฟ 30-100% โดยประมาณโดยไม่ต้องแตะหลังคาอาคาร",
    en: "Turn non-revenue parking areas into power generation sources with estimated 30-100% bill reduction without touching building roofs.",
    cn: "将无收益的停车区域变为发电来源，预估降低30-100%电费，无需改动建筑屋顶。",
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
    th: "เก็บไฟฟ้าส่วนเกินไว้ใช้ช่วง peak หรือยามไฟดับ ลดค่า demand charge ได้อีก 15-30%",
    en: "Store excess electricity for peak hours or outages, reducing demand charges by an additional 15-30%.",
    cn: "储存多余电力用于高峰时段或停电，额外减少15-30%的需量电费。",
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
    th: "ทนทาน 25+ ปี",
    en: "Durable 25+ years",
    cn: "耐用25年以上",
  },
  "sc.spec.panel.label": {
    th: "แผงโซลาร์",
    en: "Solar Panels",
    cn: "太阳能板",
  },
  "sc.spec.panel.note": {
    th: "ประสิทธิภาพ 21%+",
    en: "21%+ efficiency",
    cn: "效率21%以上",
  },
  "sc.spec.inverter.label": { th: "Inverter", en: "Inverter", cn: "逆变器" },
  "sc.spec.inverter.note": {
    th: "ตามขนาดโครงการ",
    en: "Based on project size",
    cn: "根据项目规模",
  },
  "sc.spec.height.label": { th: "ความสูง", en: "Height", cn: "高度" },
  "sc.spec.height.value": {
    th: "3.0-4.5 เมตร",
    en: "3.0-4.5 meters",
    cn: "3.0-4.5米",
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
  "sc.spec.install.value": { th: "45-90 วัน", en: "45-90 days", cn: "45-90天" },
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
    th: "ดูแลตลอด 25 ปี",
    en: "25-Year Care",
    cn: "25年全程维护",
  },
  "sc.om.title2": {
    th: "ไม่ใช่แค่ติดตั้งแล้วจบ",
    en: "Not just install and forget",
    cn: "不只是安装完就结束",
  },
  "sc.om.desc": {
    th: "SIRINX มีบริการ O&M ครบวงจร ด้วย AI Monitoring, Drone Inspection และทีมวิศวกรที่พร้อมดูแลระบบตลอดอายุการใช้งาน",
    en: "SIRINX provides comprehensive O&M service with AI Monitoring, Drone Inspection, and engineering team support throughout the system's lifetime.",
    cn: "SIRINX提供全面的运维服务，包括AI监控、无人机巡检和工程团队全生命周期支持。",
  },
  "sc.om.monitoring": {
    th: "AI Monitoring",
    en: "AI Monitoring",
    cn: "AI监控",
  },
  "sc.om.response": { th: "ตอบสนอง", en: "Response", cn: "响应时间" },
  "sc.om.response.value": { th: "24-48 ชม.", en: "24-48 hrs", cn: "24-48小时" },
  "sc.om.warranty": { th: "รับประกัน", en: "Warranty", cn: "质保" },
  "sc.om.warranty.value": { th: "25 ปี", en: "25 years", cn: "25年" },

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
    th: "ลงทุนครั้งเดียว คืนทุนเร็ว ผลตอบแทนสูงสุดตลอดอายุ 25 ปี",
    en: "One-time investment, fast ROI, maximum returns over 25 years.",
    cn: "一次性投资，快速回本，25年最大回报。",
  },
  "sc.fin.buy.highlight": {
    th: "คืนทุนเฉลี่ย 3-5 ปี",
    en: "Average payback in 3-5 years",
    cn: "平均3-5年回本",
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
  "sc.gallery.closeAria": {
    th: "ปิดแกลเลอรี Solar Carport",
    en: "Close Solar Carport gallery",
    cn: "关闭 Solar Carport 图库",
  },
  "sc.gallery.prevAria": {
    th: "รูปก่อนหน้า",
    en: "Previous image",
    cn: "上一张图片",
  },
  "sc.gallery.nextAria": {
    th: "รูปถัดไป",
    en: "Next image",
    cn: "下一张图片",
  },

  // FAQ
  "sc.faq.label": { th: "FAQ", en: "FAQ", cn: "常见问题" },
  "sc.faq.title": {
    th: "คำถามที่พบบ่อย",
    en: "Frequently Asked Questions",
    cn: "常见问题",
  },
  "sc.faq1.q": {
    th: "Solar Carport ต่างจาก Rooftop Solar อย่างไร?",
    en: "How is Solar Carport different from Rooftop Solar?",
    cn: "Solar Carport与屋顶太阳能有什么区别？",
  },
  "sc.faq1.a": {
    th: "Solar Carport ติดตั้งบนโครงสร้างหลังคาที่จอดรถ ไม่ต้องใช้พื้นที่หลังคาอาคาร เหมาะกับธุรกิจที่มีลานจอดรถขนาดใหญ่ นอกจากผลิตไฟฟ้าแล้ว ยังให้ร่มเงาปกป้องรถและรองรับ EV Charger ได้ทันที ในขณะที่ Rooftop Solar ต้องใช้หลังคาอาคารที่มีความแข็งแรงเพียงพอ",
    en: "Solar Carport is installed on parking lot roof structures, not building roofs. It's ideal for businesses with large parking areas. Besides generating electricity, it provides vehicle shade and supports EV Chargers. Rooftop Solar requires structurally sound building roofs.",
    cn: "Solar Carport安装在停车场屋顶结构上，不占用建筑屋顶。适合拥有大型停车场的企业。除发电外，还提供车辆遮阳并支持电动车充电。屋顶太阳能需要结构坚固的建筑屋顶。",
  },
  "sc.faq2.q": {
    th: "ลานจอดรถต้องใหญ่แค่ไหนถึงจะคุ้มค่า?",
    en: "How big does the parking lot need to be?",
    cn: "停车场需要多大才划算？",
  },
  "sc.faq2.a": {
    th: "โดยทั่วไป ลานจอดรถ 50 คันขึ้นไป (ประมาณ 500 ตร.ม.) จะเริ่มคุ้มค่าทางเศรษฐกิจ แต่ SIRINX สามารถออกแบบระบบสำหรับพื้นที่ตั้งแต่ 30 คันขึ้นไปได้ ขึ้นอยู่กับค่าไฟปัจจุบันและรูปแบบการลงทุน",
    en: "Generally, parking lots for 50+ vehicles (approx. 500 sq.m.) become economically viable. SIRINX can design systems for 30+ vehicles depending on current electricity costs and investment model.",
    cn: "通常50辆以上的停车场（约500平方米）开始具有经济可行性。SIRINX可根据当前电费和投资模式为30辆以上的停车场设计系统。",
  },
  "sc.faq3.q": {
    th: "คืนทุนกี่ปี? ผลตอบแทนเท่าไหร่?",
    en: "What's the ROI period and returns?",
    cn: "回本周期和回报率是多少？",
  },
  "sc.faq3.a": {
    th: "คืนทุนเฉลี่ย 3-5 ปี ขึ้นอยู่กับขนาดระบบ ค่าไฟปัจจุบัน load profile พื้นที่ติดตั้ง และรูปแบบการลงทุน ระบบมีอายุการใช้งาน 25+ ปี SIRINX จะประเมิน ROI เฉพาะโครงการก่อนเสนอราคา",
    en: "Average payback is 3-5 years, depending on system size, current electricity costs, load profile, installation area, and investment model. The system lifespan is 25+ years. SIRINX assesses project-specific ROI before quoting.",
    cn: "平均3-5年回本，取决于系统规模、当前电费、负载曲线、安装面积和投资模式。系统寿命25年以上，SIRINX会在报价前进行项目专属ROI评估。",
  },
  "sc.faq4.q": {
    th: "ต้องขออนุญาตอะไรบ้าง?",
    en: "What permits are required?",
    cn: "需要哪些许可证？",
  },
  "sc.faq4.a": {
    th: "SIRINX ดูแลเรื่องการขออนุญาตทั้งหมด ตั้งแต่ใบอนุญาตก่อสร้าง (อ.1) การขออนุญาตผลิตไฟฟ้า (กกพ.) และการเชื่อมต่อกับระบบไฟฟ้า (MEA/PEA) ทั้งหมดรวมอยู่ในบริการของเรา",
    en: "SIRINX handles all permits — construction permits, power generation licenses (ERC), and grid connection (MEA/PEA). Everything is included in our service.",
    cn: "SIRINX处理所有许可——建筑许可、发电许可证（ERC）和电网连接（MEA/PEA）。全部包含在我们的服务中。",
  },
  "sc.faq5.q": {
    th: "มีรูปแบบการลงทุนอะไรบ้าง?",
    en: "What investment models are available?",
    cn: "有哪些投资模式？",
  },
  "sc.faq5.a": {
    th: "SIRINX มี 3 รูปแบบหลัก: (1) ซื้อขาด — คืนทุนเร็ว ผลตอบแทนสูงสุด (2) ผ่อนชำระ — ค่างวดต่ำกว่าค่าไฟที่ประหยัดได้ (3) Co-investment 50:50 — แบ่งเบาภาระลงทุน ทุกรูปแบบสามารถใช้สิทธิหักค่าเสื่อม 150% ได้",
    en: "SIRINX offers 3 main models: (1) Outright Purchase — fast ROI, maximum returns (2) Installment — payments lower than savings (3) Co-investment 50:50 — shared burden. All models qualify for 150% depreciation deduction.",
    cn: "SIRINX提供3种主要模式：(1) 全额购买——快速回本，最高回报 (2) 分期付款——月供低于节省金额 (3) 联合投资50:50——分担负担。所有模式均可享受150%折旧抵扣。",
  },
  "sc.faq6.q": {
    th: "หลังติดตั้งแล้ว SIRINX ดูแลอย่างไร?",
    en: "How does SIRINX maintain the system after installation?",
    cn: "安装后SIRINX如何维护系统？",
  },
  "sc.faq6.a": {
    th: "SIRINX มีบริการ O&M ตลอด 25 ปี ด้วย AI Monitoring 24/7, Drone Inspection รายไตรมาส, ทีมช่างพร้อมออกซ่อมภายใน 24-48 ชม. และรายงานผลผลิตรายเดือน ลูกค้าไม่ต้องกังวลเรื่องการดูแลระบบ",
    en: "SIRINX provides 25-year O&M service with 24/7 AI Monitoring, quarterly Drone Inspection, repair team response within 24-48 hours, and monthly production reports. Customers don't need to worry about system maintenance.",
    cn: "SIRINX提供25年运维服务，包括24/7 AI监控、季度无人机巡检、24-48小时维修响应和月度产量报告。客户无需担心系统维护。",
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
