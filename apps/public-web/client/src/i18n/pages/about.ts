import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  "about.hero.eyebrow": {
    th: "About Us",
    en: "About Us",
    cn: "关于我们",
  },
  "about.hero.title": {
    th: "วิศวกรรมพลังงาน",
    en: "Energy Engineering",
    cn: "能源工程",
  },
  "about.hero.accent": {
    th: "ที่ขับเคลื่อนด้วยข้อมูล",
    en: "Driven by Data",
    cn: "由数据驱动",
  },
  "about.hero.desc": {
    th: "SIRINX ก่อตั้งขึ้นด้วยความเชื่อว่าพลังงานสะอาดต้องมาพร้อมกับความฉลาดทางดิจิทัล เราสร้างโครงสร้างพื้นฐานพลังงานอัจฉริยะที่เติบโตไปกับธุรกิจของคุณ",
    en: "SIRINX was founded on the belief that clean energy must be paired with digital intelligence. We build smart energy infrastructure that grows with your business.",
    cn: "SIRINX 基于一个信念而创立：清洁能源必须结合数字智能。我们打造可与业务共同成长的智能能源基础设施。",
  },
  "about.hero.imageAlt": {
    th: "ทีม SIRINX และโครงการพลังงานสะอาด",
    en: "SIRINX team and clean energy project",
    cn: "SIRINX 团队与清洁能源项目",
  },
  "about.vision.title": {
    th: "วิสัยทัศน์",
    en: "Vision",
    cn: "愿景",
  },
  "about.vision.desc": {
    th: "เป็นผู้นำด้าน Smart Energy Infrastructure ของประเทศไทย ที่ผสานพลังงานสะอาด เทคโนโลยี AI และระบบอัตโนมัติ เพื่อสร้างอนาคตพลังงานที่ยั่งยืนและคุ้มค่าสำหรับทุกธุรกิจ",
    en: "To lead Thailand's smart energy infrastructure market by combining clean energy, AI technology, and automation for a sustainable and financially sound energy future.",
    cn: "成为泰国智能能源基础设施领域的领先者，将清洁能源、AI 技术与自动化结合，打造可持续且具经济价值的能源未来。",
  },
  "about.mission.title": {
    th: "พันธกิจ",
    en: "Mission",
    cn: "使命",
  },
  "about.mission.desc": {
    th: "ออกแบบ ติดตั้ง และบริหารระบบพลังงานครบวงจรด้วยมาตรฐานวิศวกรรมระดับสูง พร้อมข้อมูลเชิงลึกที่ช่วยให้ธุรกิจตัดสินใจได้อย่างมั่นใจ ตั้งแต่วันแรกจนตลอดอายุการใช้งาน",
    en: "Design, install, and operate complete energy systems with rigorous engineering standards and decision-grade data from day one through the full asset lifecycle.",
    cn: "以严谨工程标准设计、安装并运营完整能源系统，并从第一天到整个资产生命周期提供可支持决策的数据。",
  },
  "about.values.eyebrow": {
    th: "Core Values",
    en: "Core Values",
    cn: "核心价值",
  },
  "about.values.title": {
    th: "หลักการที่เราไม่ประนีประนอม",
    en: "Principles We Do Not Compromise",
    cn: "我们坚持的原则",
  },
  "about.value.engineering.title": {
    th: "Engineering-First",
    en: "Engineering-First",
    cn: "工程优先",
  },
  "about.value.engineering.desc": {
    th: "ทุกโซลูชันเริ่มจากวิศวกรรมที่แม่นยำ ไม่ใช่การขาย",
    en: "Every solution starts with precise engineering, not a sales script.",
    cn: "每个方案都从精准工程出发，而不是销售话术。",
  },
  "about.value.trust.title": {
    th: "ความน่าเชื่อถือ",
    en: "Trust",
    cn: "可信赖",
  },
  "about.value.trust.desc": {
    th: "โปร่งใส ตรงไปตรงมา ไม่สัญญาสิ่งที่ทำไม่ได้",
    en: "Transparent and direct. We do not promise what cannot be delivered.",
    cn: "透明直接，不承诺无法交付的结果。",
  },
  "about.value.result.title": {
    th: "ผลลัพธ์ที่วัดได้",
    en: "Measurable Outcomes",
    cn: "可衡量成果",
  },
  "about.value.result.desc": {
    th: "ทุกโครงการมี KPI ชัดเจน ติดตามผลได้ตลอดอายุระบบ",
    en: "Every project has clear KPIs and performance tracking across the system lifetime.",
    cn: "每个项目都有明确 KPI，并在系统生命周期内持续追踪表现。",
  },
  "about.value.partner.title": {
    th: "พันธมิตรระยะยาว",
    en: "Long-Term Partner",
    cn: "长期伙伴",
  },
  "about.value.partner.desc": {
    th: "ดูแลตลอดอายุการใช้งาน 25+ ปี ไม่ใช่แค่ขายและติดตั้ง",
    en: "We support systems for 25+ years, beyond sales and installation.",
    cn: "我们提供 25 年以上系统支持，不止于销售和安装。",
  },
  "about.process.eyebrow": {
    th: "End-to-End",
    en: "End-to-End",
    cn: "端到端",
  },
  "about.process.title": {
    th: "ครบวงจรตั้งแต่ต้นจนจบ",
    en: "Complete From First Review to Operations",
    cn: "从评估到运营的完整服务",
  },
  "about.process.desc": {
    th: "เราเป็นพันธมิตรด้านพลังงานที่ดูแลทุกขั้นตอน ตั้งแต่การวิเคราะห์ความคุ้มค่า ออกแบบระบบ ติดตั้ง ไปจนถึงการดูแลรักษาตลอดอายุการใช้งาน",
    en: "We support every step: feasibility, system design, procurement, installation, maintenance, and continuous optimization.",
    cn: "我们覆盖每个阶段：可行性分析、系统设计、采购、安装、维护和持续优化。",
  },
  "about.process.step1": { th: "วิเคราะห์", en: "Analyze", cn: "分析" },
  "about.process.step2": { th: "ออกแบบ", en: "Design", cn: "设计" },
  "about.process.step3": { th: "จัดหา", en: "Procure", cn: "采购" },
  "about.process.step4": { th: "ติดตั้ง", en: "Install", cn: "安装" },
  "about.process.step5": { th: "ดูแล", en: "Maintain", cn: "运维" },
  "about.process.step6": { th: "เพิ่มประสิทธิภาพ", en: "Optimize", cn: "优化" },
  "about.milestones.eyebrow": {
    th: "Milestones",
    en: "Milestones",
    cn: "里程碑",
  },
  "about.milestones.title": {
    th: "เส้นทางการเติบโต",
    en: "Growth Timeline",
    cn: "成长路径",
  },
  "about.milestone.2023": {
    th: "ก่อตั้ง SIRINX โดยคุณ Pitoon Yingyosruangrong ด้วยวิสัยทัศน์ Solar Digital Agentic Company",
    en: "SIRINX was founded by Pitoon Yingyosruangrong with the vision of a Solar Digital Agentic Company.",
    cn: "Pitoon Yingyosruangrong 创立 SIRINX，愿景是打造 Solar Digital Agentic Company。",
  },
  "about.milestone.2024": {
    th: "Solar Farm Node 1 - โรงแรมเรือนแพ รอยัลปาร์ค พิษณุโลก ติดตั้งและเปิดใช้งาน",
    en: "Solar Farm Node 1 at Ruenphae Royal Park Hotel, Phitsanulok was installed and commissioned.",
    cn: "Solar Farm Node 1 在彭世洛 Ruenphae Royal Park Hotel 完成安装并投入使用。",
  },
  "about.milestone.2025a": {
    th: "Solar Farm Node 2 - โรงแรมโฮลาเทลริมน่าน เริ่มก่อสร้าง",
    en: "Solar Farm Node 2 at Holatel Rim Nan Hotel entered construction.",
    cn: "Solar Farm Node 2 在 Holatel Rim Nan Hotel 进入施工阶段。",
  },
  "about.milestone.2025b": {
    th: "เปิดตัว Solar Carport เป็น Flagship Solution พร้อม AI Energy Management Platform",
    en: "Solar Carport launched as the flagship solution with an AI Energy Management Platform.",
    cn: "Solar Carport 作为旗舰方案推出，并配套 AI 能源管理平台。",
  },
  "about.milestone.2026": {
    th: "ขยายสู่ Full Automation Corporation System ระดับ World-Wide Enterprise",
    en: "Expanded toward a full automation corporation system for enterprise-scale operations.",
    cn: "向企业级完整自动化公司系统扩展。",
  },
  "about.ceo.imageAlt": {
    th: "คุณ Pitoon Yingyosruangrong ผู้ก่อตั้ง SIRINX",
    en: "Pitoon Yingyosruangrong, founder of SIRINX",
    cn: "SIRINX 创始人 Pitoon Yingyosruangrong",
  },
  "about.ceo.desc": {
    th: "ผู้ก่อตั้งและเจ้าของ SIRINX ผู้มีวิสัยทัศน์ในการปฏิวัติพลังงานอัจฉริยะเพื่ออนาคตที่ยั่งยืน เป็นเจ้าของโรงแรมเรือนแพ รอยัลปาร์ค พิษณุโลก และโรงแรมโฮลาเทลริมน่าน โดยมี Solar Farm 2 Node ที่ดำเนินการอยู่",
    en: "Founder and owner of SIRINX, focused on intelligent energy infrastructure for a sustainable future. He also owns Ruenphae Royal Park Hotel in Phitsanulok and Holatel Rim Nan Hotel, with two solar farm nodes in operation or development.",
    cn: "SIRINX 创始人与所有者，专注于面向可持续未来的智能能源基础设施。他同时拥有彭世洛 Ruenphae Royal Park Hotel 和 Holatel Rim Nan Hotel，并推进两个太阳能节点。",
  },
  "about.project.node1.name": {
    th: "โรงแรมเรือนแพ รอยัลปาร์ค พิษณุโลก",
    en: "Ruenphae Royal Park Hotel, Phitsanulok",
    cn: "彭世洛 Ruenphae Royal Park Hotel",
  },
  "about.project.node1.desc": {
    th: "ติดตั้งและเปิดใช้งานแล้ว - ลดค่าพลังงานให้โรงแรมอย่างมีประสิทธิภาพ",
    en: "Installed and commissioned, reducing hotel energy cost with measurable performance.",
    cn: "已安装并投入使用，以可衡量表现降低酒店能源成本。",
  },
  "about.project.node2.name": {
    th: "โรงแรมโฮลาเทลริมน่าน",
    en: "Holatel Rim Nan Hotel",
    cn: "Holatel Rim Nan Hotel",
  },
  "about.project.node2.desc": {
    th: "กำลังดำเนินการก่อสร้าง พร้อมปรับปรุงโรงแรมใหม่",
    en: "Under construction alongside the hotel improvement program.",
    cn: "正在建设中，并与酒店升级计划同步推进。",
  },
  "about.project.carport.desc": {
    th: "โซลูชันที่เราเชื่อมั่นว่าจะเปลี่ยนวงการพลังงานไทย - ลานจอดรถทุกแห่งคือโรงไฟฟ้า",
    en: "The solution we believe can reshape Thai energy infrastructure: every parking area can become a power plant.",
    cn: "我们相信这一方案可重塑泰国能源基础设施：每个停车场都可以成为发电站。",
  },
  "about.project.carport.cta": {
    th: "ดูรายละเอียด",
    en: "View details",
    cn: "查看详情",
  },
  "about.cta.title": {
    th: "พร้อมเป็นพันธมิตรด้านพลังงาน?",
    en: "Ready to Build an Energy Partnership?",
    cn: "准备建立能源合作关系？",
  },
  "about.cta.desc": {
    th: "พูดคุยกับคุณ Pitoon และทีมวิศวกรของเราเพื่อหาโซลูชันที่เหมาะกับธุรกิจของคุณ",
    en: "Talk with Pitoon and the engineering team to identify the right energy path for your business.",
    cn: "与 Pitoon 和工程团队沟通，为您的业务确定合适的能源方案。",
  },
  "about.cta.contact": {
    th: "ติดต่อเรา",
    en: "Contact Us",
    cn: "联系我们",
  },
  "about.cta.line": {
    th: "เพิ่มเพื่อน LINE Official",
    en: "Add LINE Official",
    cn: "添加 LINE 官方账号",
  },
  "about.cta.lineAria": {
    th: "เพิ่มเพื่อน SIRINX ผ่าน LINE Official",
    en: "Add SIRINX through LINE Official",
    cn: "通过 LINE 官方账号添加 SIRINX",
  },
  "about.cta.phone": {
    th: "โทรหาเราเลย",
    en: "Call Us",
    cn: "致电我们",
  },
};

registerPageTranslations("about", dict);

export default dict;
