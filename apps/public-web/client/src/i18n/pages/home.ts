import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  // Social Proof Strip
  "home.stat.reduceBill": {
    th: "ลดค่าไฟฟ้าโดยประมาณ",
    en: "Estimated Bill Reduction",
    cn: "预估降低电费",
  },
  "home.stat.payback": {
    th: "คืนทุนเฉลี่ย",
    en: "Avg. Payback",
    cn: "平均回本",
  },
  "home.stat.lifespan": {
    th: "อายุการใช้งาน",
    en: "System Lifespan",
    cn: "使用寿命",
  },
  "home.stat.paybackVal": { th: "3-5 ปี", en: "3-5 Years", cn: "3-5年" },
  "home.stat.lifespanVal": { th: "25+ ปี", en: "25+ Years", cn: "25+年" },

  // Solar Carport Spotlight
  "home.flagship.tag": {
    th: "Flagship Product",
    en: "Flagship Product",
    cn: "旗舰产品",
  },
  "home.flagship.title": {
    th: "ทำไม Solar Carport\nถึงเป็นทางเลือกที่ดีที่สุด?",
    en: "Why Solar Carport\nis the Best Choice?",
    cn: "为什么太阳能车棚\n是最佳选择？",
  },
  "home.flagship.desc": {
    th: "ธุรกิจที่มีลานจอดรถ 50+ คัน สามารถเปลี่ยนพื้นที่ว่างเปล่าให้เป็นแหล่งผลิตไฟฟ้า ลดค่าพลังงาน เพิ่มมูลค่าอสังหาริมทรัพย์ และเตรียมพร้อมสำหรับ EV ในคราวเดียว",
    en: "Businesses with 50+ parking spaces can transform unused areas into power generation sources, reduce energy costs, increase property value, and prepare for EV — all at once.",
    cn: "拥有50+停车位的企业可以将闲置空间转化为发电来源，降低能源成本，提升房产价值，同时为电动车做好准备。",
  },
  "home.flagship.benefit1": {
    th: "ผลิตไฟฟ้าจากพื้นที่ที่ไม่ได้ใช้ — ไม่ต้องแตะหลังคาอาคาร",
    en: "Generate electricity from unused space — no need to touch building roofs",
    cn: "利用闲置空间发电 — 无需触碰建筑屋顶",
  },
  "home.flagship.benefit2": {
    th: "ให้ร่มเงาปกป้องรถจากแดดและฝน — ลดค่าซ่อมบำรุง",
    en: "Provide shade to protect cars from sun and rain — reduce maintenance costs",
    cn: "为车辆遮阳挡雨 — 降低维护成本",
  },
  "home.flagship.benefit3": {
    th: "รองรับ EV Charging Station — พร้อมสำหรับอนาคต",
    en: "Support EV Charging Station — future-ready",
    cn: "支持电动车充电站 — 面向未来",
  },
  "home.flagship.benefit4": {
    th: "เพิ่มมูลค่าอสังหาริมทรัพย์ — ตอบโจทย์ ESG & Green Building",
    en: "Increase property value — meet ESG & Green Building standards",
    cn: "提升房产价值 — 满足ESG和绿色建筑标准",
  },
  "home.flagship.cta": {
    th: "ดูรายละเอียด Solar Carport",
    en: "View Solar Carport Details",
    cn: "查看太阳能车棚详情",
  },
  "home.flagship.payback": {
    th: "คืนทุนเฉลี่ย",
    en: "Avg. Payback",
    cn: "平均回本",
  },

  // Integration Ecosystem
  "home.integration.tag": {
    th: "Integration",
    en: "Integration",
    cn: "集成系统",
  },
  "home.integration.title": {
    th: "ระบบนิเวศพลังงานครบวงจร",
    en: "Complete Energy Ecosystem",
    cn: "完整能源生态系统",
  },
  "home.integration.desc": {
    th: "Solar Carport ทำงานร่วมกับ BESS, AI Energy Management และ EV Charging เป็นระบบเดียว",
    en: "Solar Carport works with BESS, AI Energy Management, and EV Charging as one integrated system",
    cn: "太阳能车棚与储能系统、AI能源管理和电动车充电协同工作",
  },
  "home.integration.carport.desc": {
    th: "ผลิตไฟฟ้าจากลานจอดรถ ให้ร่มเงาและพลังงาน",
    en: "Generate electricity from parking lots, providing shade and power",
    cn: "从停车场发电，提供遮阳和电力",
  },
  "home.integration.bess.desc": {
    th: "กักเก็บพลังงานส่วนเกิน ใช้ในช่วง peak ลด demand charge",
    en: "Store excess energy, use during peak hours, reduce demand charges",
    cn: "储存多余能源，高峰期使用，降低需求费用",
  },
  "home.integration.ai.desc": {
    th: "วิเคราะห์และเพิ่มประสิทธิภาพแบบ real-time ด้วย AI",
    en: "Analyze and optimize in real-time with AI",
    cn: "通过AI实时分析和优化",
  },
  "home.integration.ev.desc": {
    th: "สถานีชาร์จ EV จ่ายไฟจาก Solar โดยตรง ลดต้นทุน",
    en: "EV charging stations powered directly by solar, reducing costs",
    cn: "电动车充电站直接由太阳能供电，降低成本",
  },

  // Mid-page CTA
  "home.midCta.title": {
    th: "มีลานจอดรถ 50+ คัน?",
    en: "Have 50+ Parking Spaces?",
    cn: "拥有50+停车位？",
  },
  "home.midCta.desc": {
    th: "ให้ SIRINX ประเมินศักยภาพพื้นที่ของคุณฟรี — รับข้อเสนอ Solar Carport พร้อม ROI เฉพาะโครงการ",
    en: "Let SIRINX evaluate your site potential for free — get a Solar Carport proposal with project-specific ROI",
    cn: "让SIRINX免费评估您的场地潜力 — 获取带有项目ROI的太阳能车棚方案",
  },
  "home.midCta.survey": {
    th: "นัดสำรวจหน้างานฟรี",
    en: "Free Site Survey",
    cn: "免费现场勘查",
  },
  "home.midCta.assess": {
    th: "ประเมินออนไลน์",
    en: "Online Assessment",
    cn: "在线评估",
  },

  // All Solutions
  "home.solutions.tag": { th: "Solutions", en: "Solutions", cn: "解决方案" },
  "home.solutions.title": {
    th: "โซลูชันพลังงานครบวงจร",
    en: "Complete Energy Solutions",
    cn: "完整能源解决方案",
  },
  "home.solutions.desc": {
    th: "Solar Carport เป็นหัวใจของระบบ ทำงานร่วมกับ Rooftop Solar, Floating Solar, BESS และ AI Energy Management",
    en: "Solar Carport is the heart of the system, working with Rooftop Solar, Floating Solar, BESS, and AI Energy Management",
    cn: "太阳能车棚是系统核心，与屋顶太阳能、水上太阳能、储能系统和AI能源管理协同工作",
  },
  "home.sol.carport.desc": {
    th: "เปลี่ยนที่จอดรถเป็นโรงไฟฟ้า รองรับ EV Charging",
    en: "Transform parking into power plant, support EV Charging",
    cn: "将停车场变成发电站，支持电动车充电",
  },
  "home.sol.rooftop.desc": {
    th: "ลดค่าไฟได้ประมาณ 30-100% ด้วยระบบโซลาร์บนหลังคา โดยขึ้นอยู่กับ load profile จริง",
    en: "Estimate 30-100% bill reduction with rooftop solar, depending on the real load profile.",
    cn: "通过屋顶太阳能预估降低30-100%电费，具体取决于实际负载曲线。",
  },
  "home.sol.floating.desc": {
    th: "ใช้พื้นที่ผิวน้ำให้เกิดประโยชน์สูงสุด",
    en: "Maximize water surface utilization",
    cn: "最大化水面利用率",
  },
  "home.sol.bess.desc": {
    th: "กักเก็บพลังงาน ลดค่า demand charge",
    en: "Store energy, reduce demand charges",
    cn: "储存能源，降低需求费用",
  },
  "home.sol.ai.desc": {
    th: "วิเคราะห์และเพิ่มประสิทธิภาพแบบ real-time",
    en: "Analyze and optimize in real-time",
    cn: "实时分析和优化",
  },
  "home.sol.om.title": {
    th: "O&M ดูแลระบบ",
    en: "O&M Maintenance",
    cn: "运维服务",
  },
  "home.sol.om.desc": {
    th: "Predictive maintenance ตลอด 25 ปี",
    en: "Predictive maintenance for 25 years",
    cn: "25年预测性维护",
  },

  // Process
  "home.process.tag": { th: "Process", en: "Process", cn: "流程" },
  "home.process.title": {
    th: "จากสำรวจสู่ติดตั้ง ใน 4 ขั้นตอน",
    en: "From Survey to Installation in 4 Steps",
    cn: "从勘查到安装仅需4步",
  },
  "home.process.step1.title": {
    th: "สำรวจหน้างาน",
    en: "Site Survey",
    cn: "现场勘查",
  },
  "home.process.step1.desc": {
    th: "วิเคราะห์พื้นที่ ค่าไฟ ความต้องการพลังงาน และประเมิน ROI เบื้องต้น",
    en: "Analyze area, electricity costs, energy needs, and preliminary ROI assessment",
    cn: "分析场地、电费、能源需求和初步ROI评估",
  },
  "home.process.step2.title": {
    th: "ออกแบบระบบ",
    en: "System Design",
    cn: "系统设计",
  },
  "home.process.step2.desc": {
    th: "ออกแบบเฉพาะทาง เลือกอุปกรณ์ Tier-1 พร้อมแผนการเงิน",
    en: "Custom design, Tier-1 equipment selection with financial plan",
    cn: "定制设计，选择Tier-1设备并制定财务计划",
  },
  "home.process.step3.title": { th: "ติดตั้ง", en: "Installation", cn: "安装" },
  "home.process.step3.desc": {
    th: "ทีมวิศวกรมืออาชีพ ติดตั้งตามมาตรฐาน 45-90 วัน",
    en: "Professional engineering team, standard installation in 45-90 days",
    cn: "专业工程团队，45-90天标准安装",
  },
  "home.process.step4.title": {
    th: "ดูแลตลอด 25 ปี",
    en: "25-Year Maintenance",
    cn: "25年维护",
  },
  "home.process.step4.desc": {
    th: "AI Monitoring + O&M ดูแลระบบตลอดอายุการใช้งาน",
    en: "AI Monitoring + O&M throughout system lifetime",
    cn: "AI监控+运维贯穿系统全生命周期",
  },

  // Industries
  "home.industries.tag": { th: "Industries", en: "Industries", cn: "行业" },
  "home.industries.title": {
    th: "Solar Carport เหมาะกับธุรกิจไหน?",
    en: "Which Businesses Benefit from Solar Carport?",
    cn: "哪些企业适合太阳能车棚？",
  },
  "home.industries.desc": {
    th: "ทุกธุรกิจที่มีลานจอดรถ สามารถเปลี่ยนพื้นที่ว่างเปล่าเป็นแหล่งรายได้",
    en: "Any business with parking lots can transform unused space into revenue",
    cn: "任何有停车场的企业都可以将闲置空间转化为收入来源",
  },
  "home.ind.factory.title": { th: "โรงงาน", en: "Factory", cn: "工厂" },
  "home.ind.factory.desc": {
    th: "ลานจอดรถพนักงาน + ลดต้นทุนพลังงานการผลิต",
    en: "Employee parking + reduce production energy costs",
    cn: "员工停车场+降低生产能源成本",
  },
  "home.ind.hotel.title": {
    th: "โรงแรม / รีสอร์ท",
    en: "Hotel / Resort",
    cn: "酒店/度假村",
  },
  "home.ind.hotel.desc": {
    th: "EV Charging สำหรับแขก + Green Hotel Certification",
    en: "EV Charging for guests + Green Hotel Certification",
    cn: "为客人提供电动车充电+绿色酒店认证",
  },
  "home.ind.commercial.title": {
    th: "อาคารพาณิชย์",
    en: "Commercial Building",
    cn: "商业建筑",
  },
  "home.ind.commercial.desc": {
    th: "เพิ่มมูลค่าอาคาร + ลดค่าส่วนกลาง + ESG",
    en: "Increase building value + reduce common fees + ESG",
    cn: "提升建筑价值+降低公共费用+ESG",
  },
  "home.ind.education.title": {
    th: "สถานศึกษา",
    en: "Educational Institution",
    cn: "教育机构",
  },
  "home.ind.education.desc": {
    th: "ลดงบค่าไฟ + Living Lab พลังงานสะอาด",
    en: "Reduce electricity budget + Clean Energy Living Lab",
    cn: "降低电费预算+清洁能源实验室",
  },
  "home.industries.viewAll": {
    th: "ดูอุตสาหกรรมทั้งหมด",
    en: "View All Industries",
    cn: "查看所有行业",
  },

  // Real Projects
  "home.projects.tag": {
    th: "Track Record",
    en: "Track Record",
    cn: "项目实绩",
  },
  "home.projects.title": {
    th: "โครงการที่ดำเนินการจริง",
    en: "Completed Projects",
    cn: "已完成项目",
  },
  "home.projects.desc": {
    th: "Solar Farm Node โดย SIRINX — ติดตั้งจริง ดูแลจริง วัดผลได้",
    en: "Solar Farm Nodes by SIRINX — Real installation, real maintenance, measurable results",
    cn: "SIRINX太阳能农场节点 — 真实安装、真实维护、可衡量的成果",
  },
  "home.projects.completed": {
    th: "ดำเนินการแล้ว",
    en: "Completed",
    cn: "已完成",
  },
  "home.projects.underConstruction": {
    th: "กำลังก่อสร้าง",
    en: "Under Construction",
    cn: "建设中",
  },
  "home.projects.node1.name": {
    th: "โรงแรมเรือนแพ รอยัลปาร์ค",
    en: "Rueanpae Royal Park Hotel",
    cn: "Rueanpae Royal Park酒店",
  },
  "home.projects.node1.location": {
    th: "พิษณุโลก — Solar + BESS + AI EMS",
    en: "Phitsanulok — Solar + BESS + AI EMS",
    cn: "彭世洛 — 太阳能+储能+AI能源管理",
  },
  "home.projects.node1.system": {
    th: "ระบบครบวงจร",
    en: "Complete System",
    cn: "完整系统",
  },
  "home.projects.node1.reduceBill": {
    th: "ลดค่าไฟฟ้า",
    en: "Reduce Electricity",
    cn: "降低电费",
  },
  "home.projects.node1.siteSpecific": {
    th: "ตามไซต์",
    en: "Site-based",
    cn: "按现场评估",
  },
  "home.projects.node1.energyMgmt": {
    th: "บริหารพลังงาน",
    en: "Energy Management",
    cn: "能源管理",
  },
  "home.projects.node2.name": {
    th: "โรงแรมโฮลาเทลริมน่าน",
    en: "Holatel Rim Nan Hotel",
    cn: "Holatel Rim Nan酒店",
  },
  "home.projects.node2.location": {
    th: "น่าน — Solar + BESS + Smart Hotel System",
    en: "Nan — Solar + BESS + Smart Hotel System",
    cn: "南府 — 太阳能+储能+智能酒店系统",
  },
  "home.projects.node2.smartHotel": {
    th: "ระบบอัจฉริยะ",
    en: "Smart System",
    cn: "智能系统",
  },
  "home.projects.node2.target": { th: "เป้าหมาย", en: "Target", cn: "目标" },
  "home.projects.node2.opening": {
    th: "เปิดให้บริการ",
    en: "Opening",
    cn: "开业",
  },
  "home.projects.viewAll": {
    th: "ดูโครงการทั้งหมด",
    en: "View All Projects",
    cn: "查看所有项目",
  },

  // O&M Section
  "home.om.tag": { th: "O&M Service", en: "O&M Service", cn: "运维服务" },
  "home.om.title": {
    th: "ดูแลระบบตลอด 25 ปี\nด้วย AI และทีมวิศวกร",
    en: "25-Year System Maintenance\nwith AI and Engineering Team",
    cn: "25年系统维护\nAI与工程团队",
  },
  "home.om.desc": {
    th: "SIRINX ไม่ใช่แค่ติดตั้งแล้วจบ — เราดูแลระบบตลอดอายุการใช้งานด้วย AI Monitoring, Drone Inspection และทีมช่างที่พร้อมออกซ่อมบำรุงภายใน 24-48 ชม.",
    en: "SIRINX doesn't just install and leave — we maintain the system throughout its lifetime with AI Monitoring, Drone Inspection, and a maintenance team ready within 24-48 hours.",
    cn: "SIRINX不只是安装就结束 — 我们通过AI监控、无人机巡检和24-48小时内响应的维护团队，全程维护系统。",
  },
  "home.om.monitoring": {
    th: "AI Monitoring",
    en: "AI Monitoring",
    cn: "AI监控",
  },
  "home.om.response": { th: "ตอบสนอง", en: "Response Time", cn: "响应时间" },
  "home.om.responseVal": { th: "24-48 ชม.", en: "24-48 hrs", cn: "24-48小时" },
  "home.om.drone": {
    th: "Drone Inspection",
    en: "Drone Inspection",
    cn: "无人机巡检",
  },
  "home.om.droneVal": { th: "รายไตรมาส", en: "Quarterly", cn: "每季度" },
  "home.om.report": {
    th: "รายงานผลผลิต",
    en: "Production Report",
    cn: "产量报告",
  },
  "home.om.reportVal": { th: "รายเดือน", en: "Monthly", cn: "每月" },
  "home.om.viewAll": {
    th: "ดูบริการ O&M ทั้งหมด",
    en: "View All O&M Services",
    cn: "查看所有运维服务",
  },

  // Investment Teaser
  "home.invest.tag": { th: "Financing", en: "Financing", cn: "融资方案" },
  "home.invest.title": {
    th: "ลงทุน Solar Carport\nไม่ต้องจ่ายเต็มวันแรก",
    en: "Invest in Solar Carport\nNo Full Payment on Day One",
    cn: "投资太阳能车棚\n无需首日全额付款",
  },
  "home.invest.desc": {
    th: "SIRINX มีรูปแบบการลงทุนที่ยืดหยุ่น — ซื้อขาด ผ่อนชำระ หรือ Co-investment 50:50 ช่วยให้ธุรกิจเข้าถึง Solar Carport ได้ทันที",
    en: "SIRINX offers flexible investment models — outright purchase, installment, or Co-investment 50:50 to help businesses access Solar Carport immediately",
    cn: "SIRINX提供灵活的投资模式 — 买断、分期付款或50:50共同投资，帮助企业立即获得太阳能车棚",
  },
  "home.invest.option1": {
    th: "ซื้อขาด — คืนทุนเร็ว ผลตอบแทนสูงสุด",
    en: "Outright Purchase — Fastest ROI, maximum returns",
    cn: "买断 — 最快回本，最高回报",
  },
  "home.invest.option2": {
    th: "ผ่อนชำระ — ค่างวดต่ำกว่าค่าไฟที่ประหยัดได้",
    en: "Installment — Monthly payments lower than electricity savings",
    cn: "分期付款 — 月供低于节省的电费",
  },
  "home.invest.option3": {
    th: "Co-investment 50:50 — แบ่งเบาภาระลงทุน",
    en: "Co-investment 50:50 — Share the investment burden",
    cn: "50:50共同投资 — 分担投资负担",
  },
  "home.invest.option4": {
    th: "สิทธิประโยชน์ทางภาษี — หักค่าเสื่อม 150%",
    en: "Tax Benefits — 150% depreciation deduction",
    cn: "税收优惠 — 150%折旧扣除",
  },
  "home.invest.viewMore": {
    th: "ศึกษาข้อมูลการลงทุน",
    en: "Learn About Investment",
    cn: "了解投资信息",
  },

  // CEO Testimonial
  "home.ceo.quote": {
    th: "Solar Carport ไม่ใช่แค่แผงโซลาร์บนที่จอดรถ — มันคือโครงสร้างพื้นฐานที่ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV และเพิ่มมูลค่าอสังหาริมทรัพย์ในคราวเดียว SIRINX ผสาน Solar Infrastructure เข้ากับ AI เพื่อสร้างมูลค่าที่ยั่งยืนให้ธุรกิจไทย",
    en: "Solar Carport is not just solar panels on a parking lot — it's infrastructure that generates electricity, provides shade, supports EV, and increases property value all at once. SIRINX integrates Solar Infrastructure with AI to create sustainable value for Thai businesses.",
    cn: "太阳能车棚不仅仅是停车场上的太阳能板 — 它是同时发电、遮阳、支持电动车和提升房产价值的基础设施。SIRINX将太阳能基础设施与AI相结合，为泰国企业创造可持续价值。",
  },

  // FAQ
  "home.faq.tag": { th: "FAQ", en: "FAQ", cn: "常见问题" },
  "home.faq.title": {
    th: "คำถามที่พบบ่อยเกี่ยวกับ Solar Carport",
    en: "Frequently Asked Questions About Solar Carport",
    cn: "关于太阳能车棚的常见问题",
  },
  "home.faq.q1": {
    th: "Solar Carport คืออะไร ต่างจาก Rooftop Solar อย่างไร?",
    en: "What is Solar Carport and how is it different from Rooftop Solar?",
    cn: "什么是太阳能车棚？与屋顶太阳能有何不同？",
  },
  "home.faq.a1": {
    th: "Solar Carport คือโครงสร้างหลังคาที่จอดรถที่ติดตั้งแผงโซลาร์เซลล์ด้านบน ผลิตไฟฟ้าได้เหมือน Rooftop Solar แต่ไม่ต้องใช้พื้นที่หลังคาอาคาร เหมาะกับธุรกิจที่มีลานจอดรถขนาดใหญ่ เช่น โรงงาน ห้างสรรพสินค้า โรงแรม สถานศึกษา และอาคารสำนักงาน นอกจากผลิตไฟฟ้าแล้ว ยังให้ร่มเงาปกป้องรถจากแดดและฝน และรองรับ EV Charger ได้ทันที",
    en: "Solar Carport is a parking roof structure with solar panels installed on top. It generates electricity like Rooftop Solar but doesn't require building roof space. Ideal for businesses with large parking areas such as factories, shopping malls, hotels, schools, and offices. Besides generating electricity, it provides shade to protect vehicles from sun and rain, and supports EV Charger installation.",
    cn: "太阳能车棚是在停车场屋顶结构上安装太阳能板。它像屋顶太阳能一样发电，但不需要建筑屋顶空间。适合拥有大型停车场的企业，如工厂、商场、酒店、学校和办公楼。除了发电外，还为车辆遮阳挡雨，并支持电动车充电桩安装。",
  },
  "home.faq.q2": {
    th: "ติดตั้ง Solar Carport ใช้เวลานานเท่าไหร่?",
    en: "How long does Solar Carport installation take?",
    cn: "太阳能车棚安装需要多长时间？",
  },
  "home.faq.a2": {
    th: "โดยทั่วไปใช้เวลา 45-90 วัน ขึ้นอยู่กับขนาดโครงการ ตั้งแต่การสำรวจหน้างาน ออกแบบโครงสร้าง ขออนุญาต จนถึงติดตั้งและทดสอบระบบ SIRINX มีทีมวิศวกรมืออาชีพดูแลทุกขั้นตอน",
    en: "Typically 45-90 days depending on project size, from site survey, structural design, permits, to installation and system testing. SIRINX has a professional engineering team managing every step.",
    cn: "通常需要45-90天，取决于项目规模，从现场勘查、结构设计、许可证申请到安装和系统测试。SIRINX拥有专业工程团队管理每个环节。",
  },
  "home.faq.q3": {
    th: "Solar Carport คุ้มค่าไหม คืนทุนกี่ปี?",
    en: "Is Solar Carport worth it? What's the payback period?",
    cn: "太阳能车棚值得投资吗？回本期多长？",
  },
  "home.faq.a3": {
    th: "คืนทุนเฉลี่ย 3-5 ปี ขึ้นอยู่กับขนาดระบบ ค่าไฟปัจจุบัน load profile และรูปแบบการลงทุน (ซื้อขาด ผ่อนชำระ หรือ Co-investment) ระบบมีอายุการใช้งาน 25+ ปี สามารถขอประเมิน ROI เฉพาะโครงการได้ฟรี",
    en: "Average payback is 3-5 years depending on system size, current electricity costs, load profile, and investment model (outright purchase, installment, or Co-investment). System lifespan is 25+ years. Free project-specific ROI assessment available.",
    cn: "平均回本期为3-5年，取决于系统规模、当前电费、负载曲线和投资模式（买断、分期或共同投资）。系统寿命25年以上，可免费获取项目专属ROI评估。",
  },
  "home.faq.q4": {
    th: "รองรับ EV Charger ได้เลยไหม?",
    en: "Does it support EV Charger?",
    cn: "是否支持电动车充电桩？",
  },
  "home.faq.a4": {
    th: "ได้ครับ โครงสร้าง Solar Carport ของ SIRINX ออกแบบให้รองรับการติดตั้ง EV Charging Station ได้ทันที ทั้ง AC Type 2 และ DC Fast Charger ระบบไฟฟ้าจาก Solar + BESS สามารถจ่ายไฟให้ EV Charger โดยตรง ลดต้นทุนค่าชาร์จ",
    en: "Yes, SIRINX Solar Carport structure is designed to support EV Charging Station installation immediately, both AC Type 2 and DC Fast Charger. Solar + BESS electricity can power EV Chargers directly, reducing charging costs.",
    cn: "是的，SIRINX太阳能车棚结构设计支持立即安装电动车充电站，包括AC Type 2和DC快充。太阳能+储能电力可直接为充电桩供电，降低充电成本。",
  },
  "home.faq.q5": {
    th: "SIRINX ดูแลหลังติดตั้งอย่างไร?",
    en: "How does SIRINX handle post-installation maintenance?",
    cn: "SIRINX如何处理安装后的维护？",
  },
  "home.faq.a5": {
    th: "SIRINX มีบริการ O&M (Operation & Maintenance) ตลอดอายุระบบ 25 ปี ด้วยระบบ AI Monitoring ตรวจสอบประสิทธิภาพแบบ real-time ทีมช่างพร้อมออกซ่อมบำรุงภายใน 24-48 ชม. และรายงานผลการผลิตไฟฟ้ารายเดือน",
    en: "SIRINX provides O&M (Operation & Maintenance) service throughout the 25-year system life with AI Monitoring for real-time performance tracking, maintenance team ready within 24-48 hours, and monthly electricity production reports.",
    cn: "SIRINX提供贯穿25年系统寿命的运维服务，包括AI监控实时性能追踪、24-48小时内响应的维护团队和月度发电量报告。",
  },

  // Final CTA
  "home.finalCta.title": {
    th: "พร้อมเปลี่ยนที่จอดรถเป็นโรงไฟฟ้า?",
    en: "Ready to Transform Your Parking into a Power Plant?",
    cn: "准备将停车场变成发电站？",
  },
  "home.finalCta.desc": {
    th: "นัดสำรวจหน้างานฟรี ไม่มีข้อผูกมัด รับข้อเสนอ Solar Carport ที่ออกแบบเฉพาะสำหรับธุรกิจของคุณ",
    en: "Free site survey, no obligation. Get a Solar Carport proposal designed specifically for your business.",
    cn: "免费现场勘查，无附加条件。获取专为您的企业设计的太阳能车棚方案。",
  },
  "home.finalCta.quote": {
    th: "ขอใบเสนอราคา Solar Carport",
    en: "Get Solar Carport Quote",
    cn: "获取太阳能车棚报价",
  },
  "home.finalCta.assess": {
    th: "ประเมินความคุ้มค่าฟรี",
    en: "Free Value Assessment",
    cn: "免费价值评估",
  },
};

registerPageTranslations("home", dict);
export default dict;
