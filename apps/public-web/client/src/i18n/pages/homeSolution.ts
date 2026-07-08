import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  "hs.meta.title": {
    th: "Home Solar Solution บ้านใหญ่และโฮมออฟฟิศ | SIRINX",
    en: "Home Solar Solution for Large Homes and Home Offices | SIRINX",
    cn: "大型住宅与家庭办公室太阳能方案 | SIRINX",
  },
  "hs.meta.desc": {
    th: "SIRINX Home Solar Solution สำหรับบ้านขนาดใหญ่ โฮมออฟฟิศ และโครงการหมู่บ้านพรีเมียมที่ใช้ไฟสูง พร้อม Rooftop Solar, Solar Carport, BESS, EV Charger และ AI Energy Monitoring",
    en: "SIRINX Home Solar Solution for large homes, home offices, and premium estates with high electricity demand, combining rooftop solar, solar carport, BESS, EV Charger, and AI Energy Monitoring.",
    cn: "SIRINX 大型住宅太阳能方案，面向高用电住宅、家庭办公室与高端社区，整合屋顶太阳能、太阳能车棚、BESS、EV 充电与 AI 能源监测。",
  },
  "hs.meta.ogDesc": {
    th: "ระบบโซลาร์สำหรับบ้านใหญ่ โฮมออฟฟิศ และโครงการพรีเมียมที่ใช้ไฟสูง พร้อมหลักฐาน commissioning, monitoring และ reference site จริง",
    en: "Solar systems for high-load homes, home offices, and premium estates with commissioning evidence, monitoring, and real reference sites.",
    cn: "适用于高用电住宅、家庭办公室与高端项目的太阳能系统，包含调试证据、监测与真实参考案例。",
  },
  "hs.hero.imageAlt": {
    th: "มุมโดรนโครงการบ้านขนาดใหญ่และโฮมออฟฟิศพร้อมระบบโซลาร์ SIRINX",
    en: "Drone view of a large residence and home office with a SIRINX solar system",
    cn: "配备 SIRINX 太阳能系统的大型住宅与家庭办公室无人机视角",
  },
  "hs.hero.eyebrow": {
    th: "Home Solution for high-load residences",
    en: "Home Solution for High-Load Residences",
    cn: "高用电住宅能源方案",
  },
  "hs.hero.title1": {
    th: "Solar สำหรับบ้านใหญ่",
    en: "Solar for Large Homes",
    cn: "大型住宅太阳能",
  },
  "hs.hero.title2": {
    th: "และโฮมออฟฟิศที่ใช้ไฟสูง",
    en: "and High-Load Home Offices",
    cn: "与高用电家庭办公室",
  },
  "hs.hero.mobile1": {
    th: "SIRINX ออกแบบโซลาร์บ้านใหญ่",
    en: "SIRINX designs solar systems",
    cn: "SIRINX 设计大型住宅",
  },
  "hs.hero.mobile2": {
    th: "ครอบคลุมหลังคา คาร์พอร์ต",
    en: "for rooftops, carports,",
    cn: "屋顶、车棚、",
  },
  "hs.hero.mobile3": {
    th: "จุดชาร์จ EV แบตเตอรี่",
    en: "EV chargers, batteries,",
    cn: "EV 充电、电池储能",
  },
  "hs.hero.mobile4": {
    th: "และระบบติดตามพลังงาน",
    en: "and energy monitoring.",
    cn: "与能源监测系统。",
  },
  "hs.hero.mobile5": {
    th: "สำหรับบ้านพรีเมียม โฮมออฟฟิศ",
    en: "Built for premium homes, home offices,",
    cn: "适用于高端住宅、家庭办公室",
  },
  "hs.hero.mobile6": {
    th: "และหมู่บ้านจัดสรรที่ต้องการ",
    en: "and estates that need",
    cn: "与需要可靠系统的",
  },
  "hs.hero.mobile7": {
    th: "ระบบที่ตรวจสอบได้จริง",
    en: "verifiable engineering.",
    cn: "高端社区。",
  },
  "hs.hero.desc1": {
    th: "SIRINX ออกแบบระบบโซลาร์บ้านใหญ่แบบครบวงจร ครอบคลุมหลังคา คาร์พอร์ต จุดชาร์จ EV แบตเตอรี่ และระบบติดตามพลังงาน",
    en: "SIRINX designs complete home solar systems covering rooftop solar, solar carport, EV charging, battery storage, and energy monitoring.",
    cn: "SIRINX 设计完整住宅太阳能系统，覆盖屋顶太阳能、太阳能车棚、EV 充电、电池储能与能源监测。",
  },
  "hs.hero.desc2": {
    th: "เหมาะกับบ้านพักระดับพรีเมียม โฮมออฟฟิศ และโครงการหมู่บ้านจัดสรรที่ต้องการระบบที่ตรวจสอบได้จริง ตั้งแต่แบบวิศวกรรมจนถึงหลังส่งมอบ",
    en: "Designed for premium residences, home offices, and estate projects that need verifiable engineering from system design through handover.",
    cn: "适合高端住宅、家庭办公室与社区项目，从工程设计到交付后都需要可验证证据。",
  },
  "hs.hero.ctaPrimary": {
    th: "นัดประเมินบ้าน / โฮมออฟฟิศ",
    en: "Assess My Home / Home Office",
    cn: "预约住宅 / 家庭办公室评估",
  },
  "hs.hero.ctaSecondary": {
    th: "ประเมินค่าไฟเบื้องต้น",
    en: "Estimate Electricity Savings",
    cn: "初步评估电费节省",
  },
  "hs.stat.highLoad.value": {
    th: "High Load",
    en: "High Load",
    cn: "高用电",
  },
  "hs.stat.highLoad.label": {
    th: "ออกแบบจากการใช้ไฟจริง",
    en: "Designed from real load data",
    cn: "基于真实负载设计",
  },
  "hs.stat.commissioning.value": {
    th: "Commissioning",
    en: "Commissioning",
    cn: "调试交付",
  },
  "hs.stat.commissioning.label": {
    th: "มีหลักฐานส่งมอบระบบ",
    en: "Handover evidence included",
    cn: "包含交付证据",
  },
  "hs.stat.monitoring.value": {
    th: "Monitoring",
    en: "Monitoring",
    cn: "监测",
  },
  "hs.stat.monitoring.label": {
    th: "เห็น production และ alarm",
    en: "Production and alarms visible",
    cn: "可查看发电与告警",
  },
  "hs.fit.eyebrow": { th: "เหมาะกับใคร", en: "Best Fit", cn: "适合对象" },
  "hs.fit.title": {
    th: "บ้านที่ค่าไฟสูงต้องการระบบที่ออกแบบเหมือนงาน commercial",
    en: "High-bill homes need systems designed like commercial energy projects",
    cn: "高电费住宅需要商业级能源系统设计",
  },
  "hs.fit.desc": {
    th: "บ้านใหญ่และโฮมออฟฟิศจำนวนมากมีโหลดไฟซับซ้อนกว่าอาคารขนาดเล็ก: มีทั้งแอร์หลายโซน EV ห้องทำงาน server ระบบน้ำ สระว่ายน้ำ และอุปกรณ์รักษาความปลอดภัย การติดโซลาร์ให้คุ้มจึงต้องเริ่มจาก load profile และแบบไฟฟ้า ไม่ใช่เริ่มจากราคาแผง",
    en: "Large homes and home offices often have complex loads: multi-zone air conditioning, EVs, server/network rooms, pumps, pools, kitchens, and security systems. A valuable solar design must start from load profile and electrical constraints, not panel price alone.",
    cn: "大型住宅与家庭办公室通常负载复杂，包括多区空调、EV、服务器/网络、泵、泳池、厨房与安防系统。真正有价值的太阳能设计必须从负载曲线与电气限制开始，而不是只看组件价格。",
  },
  "hs.signal.bill": {
    th: "ค่าไฟบ้านใหญ่หรือโฮมออฟฟิศระดับ 35,000-250,000+ บาทต่อเดือน",
    en: "Large-home or home-office bills around 35,000-250,000+ THB per month",
    cn: "大型住宅或家庭办公室电费约每月 35,000-250,000+ 泰铢",
  },
  "hs.signal.loads": {
    th: "แอร์หลายโซน, ห้องประชุม, server/network, CCTV, pool pump, kitchen load",
    en: "Multi-zone AC, meeting rooms, server/network, CCTV, pool pumps, and kitchen load",
    cn: "多区空调、会议室、服务器/网络、CCTV、泳池泵与厨房负载",
  },
  "hs.signal.ev": {
    th: "มี EV หรือเตรียมติดตั้ง EV Charger หลายจุด",
    en: "Existing EVs or plans for multiple EV charger points",
    cn: "已有 EV 或计划安装多个 EV 充电点",
  },
  "hs.signal.backup": {
    th: "ต้องการ backup บางโหลดสำคัญด้วย Hybrid Inverter + BESS",
    en: "Critical-load backup requirement using Hybrid Inverter + BESS",
    cn: "需要通过混合逆变器 + BESS 备份部分关键负载",
  },
  "hs.stack.eyebrow": {
    th: "System stack",
    en: "System Stack",
    cn: "系统组合",
  },
  "hs.stack.title": {
    th: "หนึ่งหน้าเดียวครบ: rooftop, carport, battery, EV และ AI monitoring",
    en: "One system view: rooftop, carport, battery, EV, and AI monitoring",
    cn: "一个系统视图：屋顶、车棚、电池、EV 与 AI 监测",
  },
  "hs.stack.desc": {
    th: "หน้า Home Solution นี้ออกแบบเพื่อให้ลูกค้า AEO/search เห็นคำตอบชัดเจนว่า SIRINX ไม่ได้ขายแค่แผงโซลาร์ แต่ทำระบบพลังงานสำหรับบ้านที่มี consumption สูงและต้องการความน่าเชื่อถือแบบโครงการจริง",
    en: "This Home Solution page answers high-intent search and AEO questions clearly: SIRINX does not sell panels alone. We engineer energy systems for high-consumption homes that need project-grade reliability.",
    cn: "本页面面向高意图搜索与 AEO 问题，清楚说明 SIRINX 不只是销售组件，而是为高用电住宅设计具备项目级可靠性的能源系统。",
  },
  "hs.stack.rooftop.title": {
    th: "Rooftop Solar",
    en: "Rooftop Solar",
    cn: "屋顶太阳能",
  },
  "hs.stack.carport.title": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "hs.stack.bess.title": {
    th: "Hybrid + BESS",
    en: "Hybrid + BESS",
    cn: "混合系统 + BESS",
  },
  "hs.stack.ev.title": {
    th: "EV Charging",
    en: "EV Charging",
    cn: "EV 充电",
  },
  "hs.stack.monitor.title": {
    th: "AI Energy Monitor",
    en: "AI Energy Monitor",
    cn: "AI 能源监测",
  },
  "hs.stack.om.title": {
    th: "O&M หลังติดตั้ง",
    en: "O&M Aftercare",
    cn: "安装后运维",
  },
  "hs.stack.rooftop.body": {
    th: "ออกแบบกำลังผลิตตามหลังคาจริง ทิศแดด เงาบัง และ load profile ไม่ใช่ขายจากขนาดแผงอย่างเดียว",
    en: "System size is designed from real roof area, sun direction, shading, and load profile, not panel capacity alone.",
    cn: "容量基于真实屋顶面积、日照方向、遮挡与负载曲线设计，而不是只按组件容量销售。",
  },
  "hs.stack.carport.body": {
    th: "เปลี่ยนพื้นที่จอดรถของบ้านใหญ่หรือ home office เป็นหลังคาผลิตไฟ พร้อมเพิ่มร่มเงาและภาพลักษณ์พรีเมียม",
    en: "Turn parking areas into power-generating roofs with shade and a premium property signal.",
    cn: "把停车区域变成发电屋顶，同时提供遮阳并提升物业形象。",
  },
  "hs.stack.bess.body": {
    th: "วางระบบแบตเตอรี่สำหรับโหลดสำคัญ ช่วง peak หรือ backup เฉพาะส่วน โดยแยกสิ่งที่ควรสำรองกับสิ่งที่ไม่ควรสำรอง",
    en: "Plan battery backup for critical loads, peak support, or selected circuits by separating what should and should not be backed up.",
    cn: "针对关键负载、峰值支持或特定回路规划电池备份，明确哪些负载应备份、哪些不应备份。",
  },
  "hs.stack.ev.body": {
    th: "รองรับ EV Charger พร้อม logic การใช้ไฟจาก solar ก่อน ลดการดึงไฟจาก grid ในช่วงที่ไม่จำเป็น",
    en: "Support EV charging with logic that prioritizes solar energy before unnecessary grid import.",
    cn: "支持 EV 充电，并优先使用太阳能，减少不必要的电网取电。",
  },
  "hs.stack.monitor.body": {
    th: "ติดตาม production, consumption, import/export, alarm และ performance เพื่อให้เจ้าของบ้านเห็นระบบทำงานจริง",
    en: "Track production, consumption, import/export, alarms, and performance so owners can see how the system works.",
    cn: "追踪发电、用电、进出电网、告警与表现，让业主看见系统真实运行。",
  },
  "hs.stack.om.body": {
    th: "มี checklist commissioning, monitoring, cleaning plan, alarm response และเอกสารส่งมอบที่ตรวจสอบย้อนกลับได้",
    en: "Includes commissioning checklists, monitoring, cleaning plans, alarm response, and traceable handover documents.",
    cn: "包含调试清单、监测、清洁计划、告警响应与可追溯交付文件。",
  },
  "hs.gallery.village.alt": {
    th: "มุมโดรนโครงการบ้านจัดสรรระดับพรีเมียมพร้อม rooftop solar หลายหลัง",
    en: "Drone angle of a premium housing estate with multiple rooftop solar homes",
    cn: "多个住宅安装屋顶太阳能的高端社区无人机视角",
  },
  "hs.gallery.village.label": {
    th: "Village-scale solar planning",
    en: "Village-scale solar planning",
    cn: "社区级太阳能规划",
  },
  "hs.gallery.detail.alt": {
    th: "มุมสูงหลังคาบ้านใหญ่พร้อมแผงโซลาร์ carport EV charger และ battery cabinet",
    en: "High-angle view of a large home with rooftop solar, carport, EV charger, and battery cabinet",
    cn: "大型住宅屋顶太阳能、车棚、EV 充电与电池柜高角度视图",
  },
  "hs.gallery.detail.label": {
    th: "Rooftop + carport detail",
    en: "Rooftop + carport detail",
    cn: "屋顶 + 车棚细节",
  },
  "hs.gallery.estate.alt": {
    th: "มุม top-down โครงการหมู่บ้านจัดสรรพร้อมบ้านหลายหลังติดตั้งโซลาร์",
    en: "Top-down view of an estate project with multiple homes using solar",
    cn: "多个住宅安装太阳能的社区项目俯视图",
  },
  "hs.gallery.estate.label": {
    th: "Estate rollout view",
    en: "Estate rollout view",
    cn: "社区部署视图",
  },
  "hs.proof.eyebrow": {
    th: "Proof over promise",
    en: "Proof Over Promise",
    cn: "证据优先于承诺",
  },
  "hs.proof.title": {
    th: "ลดความเสี่ยงงานหลอกลวงด้วยหลักฐานที่ตรวจสอบได้",
    en: "Reduce installation risk with verifiable evidence",
    cn: "用可验证证据降低安装风险",
  },
  "hs.proof.desc": {
    th: "สำหรับบ้านราคาสูงและโฮมออฟฟิศ ลูกค้าไม่ควรต้องวัดใจจากคำพูดขายอย่างเดียว SIRINX วางระบบให้ตรวจสอบได้ตั้งแต่ก่อนติดตั้ง ระหว่างติดตั้ง และหลังเปิดระบบ โดยใช้ reference จากระบบที่ใช้งานจริงในโรงแรมและธุรกิจในเครือเป็นข้อมูลประกอบการออกแบบ",
    en: "Owners of high-value homes and home offices should not rely on sales promises alone. SIRINX structures evidence before installation, during work, and after commissioning, using operating reference systems as design inputs.",
    cn: "高价值住宅与家庭办公室业主不应只依赖销售承诺。SIRINX 在安装前、施工中和调试后都提供可验证证据，并以实际运行系统作为设计参考。",
  },
  "hs.trust.survey": {
    th: "สำรวจหน้างานก่อนเสนอแบบ ไม่ใช้ template เดียวกับทุกบ้าน",
    en: "Site survey before design proposal; no one-template-for-all homes.",
    cn: "先现场勘查再提出方案，不使用同一模板套用所有住宅。",
  },
  "hs.trust.docs": {
    th: "ทำ single-line diagram, BOQ, equipment spec และ payment milestone ให้ตรวจได้",
    en: "Provide single-line diagram, BOQ, equipment specs, and payment milestones for review.",
    cn: "提供单线图、BOQ、设备规格与付款节点供审查。",
  },
  "hs.trust.commissioning": {
    th: "มี commissioning record และภาพถ่ายงานติดตั้งก่อนส่งมอบ",
    en: "Commissioning records and installation photos before handover.",
    cn: "交付前提供调试记录与安装照片。",
  },
  "hs.trust.monitor": {
    th: "ติดตามผลผลิตไฟและ alarm หลังเปิดระบบ ไม่จบแค่ติดตั้งเสร็จ",
    en: "Track energy production and alarms after go-live; the work does not stop at installation.",
    cn: "系统上线后持续追踪发电与告警，不止于安装完成。",
  },
  "hs.trust.reference": {
    th: "ใช้ reference จากระบบที่ใช้งานจริงในโรงแรมและธุรกิจในเครือเป็นหลักฐานประกอบการออกแบบ",
    en: "Use operating hotel and business reference systems as design evidence.",
    cn: "使用实际运行的酒店与企业参考系统作为设计证据。",
  },
  "hs.trust.scenario": {
    th: "ตัวเลขประหยัดและคืนทุนแสดงเป็น scenario ตามข้อมูลหน้างาน ไม่ใช้เป็นคำรับประกันแบบเหมารวม",
    en: "Savings and payback are presented as scenarios from site data, not blanket guarantees.",
    cn: "节省与回本以现场数据情境呈现，不作为统一保证。",
  },
  "hs.proof.note": {
    th: "หมายเหตุ: ตัวเลขผลประหยัดและระยะคืนทุนต้องประเมินจากบิลไฟ พฤติกรรมโหลด พื้นที่ติดตั้ง และเงื่อนไขหน้างานจริง ไม่ใช้เป็นคำรับประกันแบบเดียวกันทุกบ้าน",
    en: "Note: savings and payback must be evaluated from electricity bills, load behavior, installation area, and real site constraints. They are not one-size-fits-all guarantees.",
    cn: "备注：节省与回本必须根据电费单、负载行为、安装面积与真实现场限制评估，不是适用于所有住宅的统一保证。",
  },
  "hs.process.eyebrow": {
    th: "Implementation process",
    en: "Implementation Process",
    cn: "实施流程",
  },
  "hs.process.title": {
    th: "ขั้นตอนที่ทำให้ระบบบ้านใหญ่ใช้งานได้จริง",
    en: "A process that makes high-load home systems work in practice",
    cn: "让大型住宅系统真正可用的流程",
  },
  "hs.step.load.title": {
    th: "1. เก็บข้อมูลโหลดจริง",
    en: "1. Collect real load data",
    cn: "1. 收集真实负载数据",
  },
  "hs.step.load.body": {
    th: "ดูบิลไฟ, TOU, load ช่วงกลางวัน, EV plan, backup need และข้อจำกัดของบ้านหรือโฮมออฟฟิศ",
    en: "Review electricity bills, TOU, daytime load, EV plans, backup needs, and home or home-office constraints.",
    cn: "审查电费单、TOU、白天负载、EV 计划、备份需求以及住宅或家庭办公室限制。",
  },
  "hs.step.survey.title": {
    th: "2. Drone / Roof / Electrical Survey",
    en: "2. Drone / Roof / Electrical Survey",
    cn: "2. 无人机 / 屋顶 / 电气勘查",
  },
  "hs.step.survey.body": {
    th: "สำรวจหลังคา, carport, MDB, inverter location, cable route, safety disconnect และจุดติดตั้ง battery",
    en: "Survey roof, carport, MDB, inverter location, cable route, safety disconnects, and battery location.",
    cn: "勘查屋顶、车棚、MDB、逆变器位置、电缆路径、安全断开点与电池位置。",
  },
  "hs.step.proposal.title": {
    th: "3. Engineering Proposal",
    en: "3. Engineering Proposal",
    cn: "3. 工程方案",
  },
  "hs.step.proposal.body": {
    th: "ส่งแบบระบบ, ขนาด kWp, inverter/BESS, EV Charger, monitoring plan และสมมติฐานประหยัดไฟ",
    en: "Deliver system design, kWp sizing, inverter/BESS plan, EV charger plan, monitoring plan, and savings assumptions.",
    cn: "提交系统设计、kWp 容量、逆变器/BESS、EV 充电、监测计划与节省假设。",
  },
  "hs.step.install.title": {
    th: "4. Install + Commissioning",
    en: "4. Install + Commissioning",
    cn: "4. 安装 + 调试",
  },
  "hs.step.install.body": {
    th: "ติดตั้ง, ทดสอบ, ส่งมอบ evidence และเปิด dashboard ให้ตรวจ production จริงหลังเริ่มใช้งาน",
    en: "Install, test, hand over evidence, and activate dashboards for real production review after go-live.",
    cn: "安装、测试、交付证据，并启用仪表板以便上线后查看真实发电。",
  },
  "hs.faq.eyebrow": { th: "AEO answers", en: "AEO Answers", cn: "AEO 答案" },
  "hs.faq.title": {
    th: "คำตอบที่เจ้าของบ้านและผู้บริหารมักถามก่อนตัดสินใจ",
    en: "Answers owners and executives ask before deciding",
    cn: "业主与管理者决策前常问的问题",
  },
  "hs.faq.desc": {
    th: "เนื้อหาส่วนนี้ออกแบบให้ตอบคำถาม search และ AI answer engine ได้ตรงเจตนา: ใครเหมาะกับระบบนี้ ทำไมต้องสำรวจจริง ลดความเสี่ยงอย่างไร และต่อยอด EV/BESS ได้แค่ไหน",
    en: "This section is structured for search and AI answer engines: who this system fits, why real survey matters, how risk is reduced, and how EV/BESS can be added.",
    cn: "本段面向搜索与 AI answer engine：适合对象、为什么需要真实勘查、如何降低风险，以及如何扩展 EV/BESS。",
  },
  "hs.faq.fit.q": {
    th: "Home Solution ของ SIRINX เหมาะกับบ้านแบบไหน?",
    en: "What type of home fits SIRINX Home Solution?",
    cn: "什么类型的住宅适合 SIRINX Home Solution？",
  },
  "hs.faq.fit.a": {
    th: "เหมาะกับบ้านขนาดใหญ่ โฮมออฟฟิศ บ้านพักผู้บริหาร บ้านที่มี EV หลายคัน หรือบ้านที่มีโหลดไฟสูง เช่น แอร์หลายโซน ห้องทำงาน server ห้องประชุม สระว่ายน้ำ และระบบรักษาความปลอดภัย",
    en: "It fits large homes, home offices, executive residences, homes with multiple EVs, or homes with high loads such as multi-zone AC, server rooms, meeting rooms, pools, and security systems.",
    cn: "适合大型住宅、家庭办公室、管理层住宅、多辆 EV 的家庭，或具备多区空调、服务器房、会议室、泳池与安防系统等高负载住宅。",
  },
  "hs.faq.price.q": {
    th: "ทำไมไม่ควรซื้อระบบจากราคาต่อกิโลวัตต์อย่างเดียว?",
    en: "Why not buy only by price per kilowatt?",
    cn: "为什么不应只按每千瓦价格购买？",
  },
  "hs.faq.price.a": {
    th: "เพราะบ้านใหญ่มีข้อจำกัดเฉพาะ เช่น เงาบัง ทิศหลังคา MDB เดิม backup load และ EV charging behavior ระบบที่คุ้มจริงต้องออกแบบจากข้อมูลโหลดและหน้างาน ไม่ใช่ใช้ราคาแผงเป็นตัวตัดสินอย่างเดียว",
    en: "Large homes have site-specific constraints such as shading, roof direction, existing MDB, backup loads, and EV charging behavior. A valuable system must be designed from load and site data, not panel price alone.",
    cn: "大型住宅有特定限制，例如遮挡、屋顶朝向、既有 MDB、备份负载与 EV 充电行为。真正有价值的系统必须从负载与现场数据设计，而不是只看组件价格。",
  },
  "hs.faq.risk.q": {
    th: "SIRINX ช่วยลดความเสี่ยงเรื่องงานติดตั้งไม่ได้มาตรฐานอย่างไร?",
    en: "How does SIRINX reduce poor-installation risk?",
    cn: "SIRINX 如何降低不合格安装风险？",
  },
  "hs.faq.risk.a": {
    th: "ใช้กระบวนการสำรวจ ออกแบบเอกสารวิศวกรรม BOQ ชัดเจน payment milestone commissioning record และ monitoring หลังส่งมอบ เพื่อให้ลูกค้าตรวจสอบได้ทุกช่วง ไม่ใช่รอเชื่อคำขายอย่างเดียว",
    en: "We use survey, engineering documents, clear BOQ, payment milestones, commissioning records, and post-handover monitoring so clients can review every phase.",
    cn: "我们使用现场勘查、工程文件、清晰 BOQ、付款节点、调试记录与交付后监测，让客户在每个阶段都可审查。",
  },
  "hs.faq.ev.q": {
    th: "สามารถใช้ร่วมกับ EV Charger และ Battery ได้หรือไม่?",
    en: "Can it work with EV Charger and Battery?",
    cn: "是否可与 EV 充电器和电池一起使用？",
  },
  "hs.faq.ev.a": {
    th: "ได้ โดยออกแบบเป็นระบบเดียวกันตั้งแต่ต้นเพื่อจัดลำดับการใช้ไฟจาก solar, grid, battery และ EV charger ตามพฤติกรรมของบ้านและข้อจำกัดของอุปกรณ์",
    en: "Yes. The system should be designed together from the start to coordinate solar, grid, battery, and EV charging based on household behavior and equipment limits.",
    cn: "可以。系统应从一开始整体设计，根据家庭用电行为与设备限制协调太阳能、电网、电池与 EV 充电。",
  },
  "hs.final.eyebrow": {
    th: "Home Office / Private Estate / Premium Village",
    en: "Home Office / Private Estate / Premium Village",
    cn: "家庭办公室 / 私人住宅 / 高端社区",
  },
  "hs.final.title": {
    th: "ส่งบิลไฟและภาพหลังคาให้ทีม SIRINX ประเมินระบบเบื้องต้น",
    en: "Send your bill and roof photos for a preliminary SIRINX system review",
    cn: "发送电费单与屋顶照片，让 SIRINX 进行初步系统评估",
  },
  "hs.final.desc": {
    th: "เริ่มจากข้อมูลจริง: ค่าไฟ 6-12 เดือน, พื้นที่หลังคา, จำนวน EV, โหลดที่อยากสำรอง, และเป้าหมายของบ้านหรือโฮมออฟฟิศ ทีมจะช่วยประเมินว่าควรเริ่มจาก rooftop, carport, battery หรือ EV ก่อน",
    en: "Start with real data: 6-12 months of bills, roof area, EV count, backup-load goals, and the objective of your home or home office. The team will help decide whether to start with rooftop, carport, battery, or EV first.",
    cn: "从真实数据开始：6-12 个月电费单、屋顶面积、EV 数量、需要备份的负载，以及住宅或家庭办公室目标。团队将协助判断应先从屋顶、车棚、电池还是 EV 开始。",
  },
  "hs.final.primary": {
    th: "ขอทีมประเมิน",
    en: "Request Assessment",
    cn: "请求评估",
  },
  "hs.final.projects": {
    th: "ดูผลงานจริง",
    en: "View Real Projects",
    cn: "查看真实项目",
  },
  "hs.breadcrumb.home": { th: "หน้าแรก", en: "Home", cn: "首页" },
};

registerPageTranslations("homeSolution", dict);

export default dict;
