import { registerPageTranslations } from "../index";

const dict: Record<string, { th: string; en: string; cn: string }> = {
  // Hero
  "sol.hero.tag": { th: "Solutions", en: "Solutions", cn: "解决方案" },
  "sol.hero.title1": {
    th: "โซลูชันพลังงาน",
    en: "Complete Energy",
    cn: "全方位能源",
  },
  "sol.hero.title2": { th: "ครบวงจร", en: "Solutions", cn: "解决方案" },
  "sol.hero.desc": {
    th: "ทุกโซลูชันออกแบบเพื่อผลลัพธ์ทางธุรกิจที่วัดได้ ตั้งแต่การผลิตไฟฟ้า กักเก็บพลังงาน ไปจนถึง AI Energy Management",
    en: "Every solution is designed for measurable business outcomes — from power generation and energy storage to AI Energy Management.",
    cn: "每个解决方案都旨在实现可衡量的商业成果——从发电、储能到AI能源管理。",
  },

  // Solution: Solar Carport
  "sol.carport.tagline": {
    th: "Flagship Solution",
    en: "Flagship Solution",
    cn: "旗舰方案",
  },
  "sol.carport.title": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "sol.carport.problem": {
    th: "ที่จอดรถเป็นพื้นที่ว่างที่ไม่สร้างรายได้ รถร้อนจัดจากแดด ไม่มี EV Charger",
    en: "Parking lots are unused space generating no revenue. Cars overheat in the sun. No EV Charger available.",
    cn: "停车场是不产生收入的闲置空间。车辆在阳光下过热。没有电动车充电桩。",
  },
  "sol.carport.solution": {
    th: "โครงสร้างหลังคาโซลาร์สำหรับที่จอดรถ ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV Charging พร้อม BESS และ AI Energy Management",
    en: "Solar roof structure for parking lots — generates electricity, provides shade, supports EV Charging with BESS and AI Energy Management.",
    cn: "停车场太阳能屋顶结构——发电、遮阳、支持电动车充电，配备BESS和AI能源管理。",
  },
  "sol.carport.suitable1": {
    th: "ห้างสรรพสินค้า / อาคารพาณิชย์",
    en: "Shopping malls / Commercial buildings",
    cn: "购物中心/商业建筑",
  },
  "sol.carport.suitable2": {
    th: "โรงงานที่มีลานจอดรถ 50+ คัน",
    en: "Factories with 50+ vehicle parking",
    cn: "拥有50+车位的工厂",
  },
  "sol.carport.suitable3": {
    th: "โรงแรม / รีสอร์ท",
    en: "Hotels / Resorts",
    cn: "酒店/度假村",
  },
  "sol.carport.suitable4": {
    th: "สถานศึกษา / หน่วยงานราชการ",
    en: "Educational institutions / Government agencies",
    cn: "教育机构/政府机关",
  },
  "sol.carport.benefit1": {
    th: "ลดค่าไฟได้ประมาณ 30-100%",
    en: "Estimated 30-100% bill reduction",
    cn: "预估节省30-100%电费",
  },
  "sol.carport.benefit2": {
    th: "คืนทุนเฉลี่ย 3-5 ปี",
    en: "Average payback in 3-5 years",
    cn: "平均3-5年回本",
  },
  "sol.carport.benefit3": {
    th: "รองรับ EV Charging",
    en: "EV Charging ready",
    cn: "支持电动车充电",
  },
  "sol.carport.benefit4": {
    th: "เพิ่มมูลค่าอสังหาริมทรัพย์",
    en: "Increase property value",
    cn: "提升房产价值",
  },
  "sol.carport.cta": {
    th: "ดูรายละเอียด Solar Carport",
    en: "View Solar Carport Details",
    cn: "查看Solar Carport详情",
  },

  // Solution: Rooftop Solar
  "sol.rooftop.title": {
    th: "Rooftop Solar",
    en: "Rooftop Solar",
    cn: "屋顶太阳能",
  },
  "sol.rooftop.problem": {
    th: "ค่าไฟฟ้าเป็นต้นทุนหลักของธุรกิจ โดยเฉพาะโรงงานและอาคารขนาดใหญ่ที่ใช้ไฟในช่วงกลางวันสูง",
    en: "Electricity is a major business cost, especially for factories and large buildings with high daytime consumption.",
    cn: "电费是企业主要成本，尤其是白天用电量大的工厂和大型建筑。",
  },
  "sol.rooftop.solution": {
    th: "ระบบโซลาร์บนหลังคาที่ออกแบบเฉพาะสำหรับแต่ละอาคาร ใช้แผง Tier-1 Mono PERC ประสิทธิภาพสูง พร้อม monitoring real-time",
    en: "Rooftop solar system custom-designed for each building, using high-efficiency Tier-1 Mono PERC panels with real-time monitoring.",
    cn: "为每栋建筑量身定制的屋顶太阳能系统，采用高效Tier-1 Mono PERC面板，配备实时监控。",
  },
  "sol.rooftop.suitable1": {
    th: "โรงงานที่มีหลังคาขนาดใหญ่",
    en: "Factories with large roofs",
    cn: "拥有大屋顶的工厂",
  },
  "sol.rooftop.suitable2": {
    th: "อาคารพาณิชย์และสำนักงาน",
    en: "Commercial buildings and offices",
    cn: "商业建筑和办公室",
  },
  "sol.rooftop.suitable3": {
    th: "ห้างสรรพสินค้าและคลังสินค้า",
    en: "Shopping malls and warehouses",
    cn: "购物中心和仓库",
  },
  "sol.rooftop.suitable4": {
    th: "โรงแรมและรีสอร์ท",
    en: "Hotels and resorts",
    cn: "酒店和度假村",
  },
  "sol.rooftop.benefit1": {
    th: "ลดต้นทุนตาม load profile",
    en: "Load-profile savings",
    cn: "按负载曲线节省",
  },
  "sol.rooftop.benefit2": {
    th: "คืนทุนเฉลี่ย 3-5 ปี",
    en: "Average payback in 3-5 years",
    cn: "平均3-5年回本",
  },
  "sol.rooftop.benefit3": {
    th: "อายุการใช้งาน 25+ ปี",
    en: "25+ year lifespan",
    cn: "25年以上使用寿命",
  },
  "sol.rooftop.benefit4": {
    th: "เพิ่มมูลค่าอาคาร",
    en: "Increase building value",
    cn: "提升建筑价值",
  },

  // Solution: Floating Solar
  "sol.floating.title": {
    th: "Floating Solar",
    en: "Floating Solar",
    cn: "水上太阳能",
  },
  "sol.floating.problem": {
    th: "ธุรกิจที่มีพื้นที่น้ำแต่ไม่มีหลังคาเพียงพอ หรือต้องการใช้พื้นที่ผิวน้ำให้เกิดประโยชน์",
    en: "Businesses with water areas but insufficient roof space, or wanting to utilize water surface area productively.",
    cn: "拥有水域但屋顶空间不足的企业，或希望有效利用水面面积。",
  },
  "sol.floating.solution": {
    th: "ระบบโซลาร์ลอยน้ำสำหรับอ่างเก็บน้ำ บ่อน้ำอุตสาหกรรม ช่วยลดการระเหยของน้ำและผลิตไฟฟ้าพร้อมกัน",
    en: "Floating solar system for reservoirs and industrial ponds — reduces water evaporation while generating electricity simultaneously.",
    cn: "适用于水库和工业水塘的水上太阳能系统——在发电的同时减少水分蒸发。",
  },
  "sol.floating.suitable1": {
    th: "อ่างเก็บน้ำชลประทาน",
    en: "Irrigation reservoirs",
    cn: "灌溉水库",
  },
  "sol.floating.suitable2": {
    th: "บ่อน้ำในโรงงาน",
    en: "Factory water ponds",
    cn: "工厂水塘",
  },
  "sol.floating.suitable3": {
    th: "ฟาร์มเพาะเลี้ยงสัตว์น้ำ",
    en: "Aquaculture farms",
    cn: "水产养殖场",
  },
  "sol.floating.suitable4": {
    th: "แหล่งน้ำสาธารณะ",
    en: "Public water sources",
    cn: "公共水源",
  },
  "sol.floating.benefit1": {
    th: "ใช้พื้นที่น้ำให้เกิดประโยชน์",
    en: "Utilize water area productively",
    cn: "有效利用水面面积",
  },
  "sol.floating.benefit2": {
    th: "ลดการระเหยของน้ำ 30-50%",
    en: "Reduce water evaporation 30-50%",
    cn: "减少30-50%水分蒸发",
  },
  "sol.floating.benefit3": {
    th: "ประสิทธิภาพสูงกว่า ground-mount",
    en: "Higher efficiency than ground-mount",
    cn: "效率高于地面安装",
  },
  "sol.floating.benefit4": {
    th: "ไม่เสียพื้นที่ดิน",
    en: "No land area required",
    cn: "不占用土地面积",
  },

  // Solution: BESS / ESS
  "sol.bess.title": {
    th: "BESS / ESS",
    en: "BESS / ESS",
    cn: "BESS / ESS储能系统",
  },
  "sol.bess.problem": {
    th: "ค่า demand charge สูง ไฟฟ้าดับบ่อย หรือต้องการใช้พลังงานโซลาร์ในช่วงกลางคืน",
    en: "High demand charges, frequent power outages, or need to use solar energy at night.",
    cn: "需量电费高、频繁停电，或需要在夜间使用太阳能。",
  },
  "sol.bess.solution": {
    th: "ระบบกักเก็บพลังงาน (Battery Energy Storage System) ทำงานร่วมกับโซลาร์ บริหารจัดการพลังงานอย่างชาญฉลาด",
    en: "Battery Energy Storage System works with solar to manage energy intelligently.",
    cn: "电池储能系统与太阳能协同工作，智能管理能源。",
  },
  "sol.bess.suitable1": {
    th: "โรงงานที่มี demand charge สูง",
    en: "Factories with high demand charges",
    cn: "需量电费高的工厂",
  },
  "sol.bess.suitable2": {
    th: "ธุรกิจที่ต้องการ backup power",
    en: "Businesses needing backup power",
    cn: "需要备用电源的企业",
  },
  "sol.bess.suitable3": {
    th: "อาคารที่ต้องการ peak shaving",
    en: "Buildings needing peak shaving",
    cn: "需要削峰的建筑",
  },
  "sol.bess.suitable4": {
    th: "พื้นที่ที่ไฟฟ้าไม่เสถียร",
    en: "Areas with unstable power grid",
    cn: "电网不稳定的地区",
  },
  "sol.bess.benefit1": {
    th: "ลดค่า demand charge 15-30%",
    en: "Reduce demand charges 15-30%",
    cn: "降低15-30%需量电费",
  },
  "sol.bess.benefit2": {
    th: "สำรองไฟฟ้ายามฉุกเฉิน",
    en: "Emergency power backup",
    cn: "紧急备用电源",
  },
  "sol.bess.benefit3": {
    th: "ใช้โซลาร์ได้ตลอด 24 ชม.",
    en: "Use solar power 24/7",
    cn: "24小时使用太阳能",
  },
  "sol.bess.benefit4": {
    th: "เพิ่มความเสถียรของระบบ",
    en: "Increase system stability",
    cn: "提高系统稳定性",
  },

  // Solution: AI Energy Management
  "sol.ai.title": {
    th: "AI Energy Management",
    en: "AI Energy Management",
    cn: "AI能源管理",
  },
  "sol.ai.problem": {
    th: "ไม่สามารถมองเห็นการใช้พลังงานแบบ real-time ทำให้ไม่รู้ว่าจุดไหนสิ้นเปลืองและควรปรับปรุงอย่างไร",
    en: "Unable to see real-time energy usage, making it impossible to identify waste and improvements.",
    cn: "无法实时查看能源使用情况，无法识别浪费和改进点。",
  },
  "sol.ai.solution": {
    th: "แพลตฟอร์ม AI วิเคราะห์ข้อมูลพลังงาน real-time แนะนำการปรับปรุง ควบคุมระบบอัตโนมัติเพื่อประสิทธิภาพสูงสุด",
    en: "AI platform analyzes real-time energy data, recommends improvements, and automates systems for maximum efficiency.",
    cn: "AI平台实时分析能源数据，推荐改进方案，自动化系统以实现最高效率。",
  },
  "sol.ai.suitable1": {
    th: "โรงงานที่ต้องการลดต้นทุนพลังงาน",
    en: "Factories seeking to reduce energy costs",
    cn: "希望降低能源成本的工厂",
  },
  "sol.ai.suitable2": {
    th: "อาคารที่มีระบบพลังงานหลายชนิด",
    en: "Buildings with multiple energy systems",
    cn: "拥有多种能源系统的建筑",
  },
  "sol.ai.suitable3": {
    th: "ธุรกิจที่ต้องการ ESG reporting",
    en: "Businesses needing ESG reporting",
    cn: "需要ESG报告的企业",
  },
  "sol.ai.suitable4": {
    th: "องค์กรที่มีหลายสาขา",
    en: "Organizations with multiple branches",
    cn: "拥有多个分支的组织",
  },
  "sol.ai.benefit1": {
    th: "เห็นข้อมูลพลังงาน real-time",
    en: "Real-time energy data visibility",
    cn: "实时能源数据可视化",
  },
  "sol.ai.benefit2": {
    th: "AI แนะนำการประหยัด",
    en: "AI-powered savings recommendations",
    cn: "AI推荐节能方案",
  },
  "sol.ai.benefit3": {
    th: "รายงาน ESG อัตโนมัติ",
    en: "Automated ESG reporting",
    cn: "自动ESG报告",
  },
  "sol.ai.benefit4": {
    th: "ลดพลังงานสิ้นเปลืองเพิ่ม 10-20%",
    en: "Additional 10-20% energy savings",
    cn: "额外节省10-20%能源",
  },

  // Solution: O&M
  "sol.om.title": {
    th: "O&M ดูแลระบบ",
    en: "O&M System Maintenance",
    cn: "运维系统维护",
  },
  "sol.om.problem": {
    th: "ระบบโซลาร์เสื่อมประสิทธิภาพตามเวลา การตรวจสอบแบบเดิมช้าและมีค่าใช้จ่ายสูง",
    en: "Solar systems degrade over time. Traditional inspection is slow and expensive.",
    cn: "太阳能系统随时间效率下降。传统检查缓慢且昂贵。",
  },
  "sol.om.solution": {
    th: "ระบบดูแลรักษาด้วย AI + Drone Inspection + ทีมวิศวกร ตรวจจับปัญหาก่อนเกิดความเสียหาย ดูแลตลอด 25 ปี",
    en: "AI + Drone Inspection + Engineering team maintenance — detect issues before damage occurs. 25-year service.",
    cn: "AI + 无人机巡检 + 工程师团队维护——在损坏发生前检测问题。25年服务。",
  },
  "sol.om.suitable1": {
    th: "โครงการโซลาร์ทุกขนาด",
    en: "Solar projects of all sizes",
    cn: "各种规模的太阳能项目",
  },
  "sol.om.suitable2": {
    th: "ระบบ BESS ที่ต้องการ monitoring",
    en: "BESS systems requiring monitoring",
    cn: "需要监控的BESS系统",
  },
  "sol.om.suitable3": {
    th: "โรงงานที่มีระบบพลังงานซับซ้อน",
    en: "Factories with complex energy systems",
    cn: "拥有复杂能源系统的工厂",
  },
  "sol.om.suitable4": {
    th: "ฟาร์มโซลาร์ขนาดใหญ่",
    en: "Large-scale solar farms",
    cn: "大型太阳能农场",
  },
  "sol.om.benefit1": {
    th: "Predictive maintenance",
    en: "Predictive maintenance",
    cn: "预测性维护",
  },
  "sol.om.benefit2": {
    th: "ลดเวลา downtime",
    en: "Reduce downtime",
    cn: "减少停机时间",
  },
  "sol.om.benefit3": {
    th: "ยืดอายุอุปกรณ์",
    en: "Extend equipment lifespan",
    cn: "延长设备寿命",
  },
  "sol.om.benefit4": {
    th: "ลดค่าซ่อมบำรุง 30%",
    en: "Reduce maintenance costs 30%",
    cn: "降低30%维护成本",
  },

  // Solution: Co-investment / Financing
  "sol.financing.title": {
    th: "Co-investment / Financing",
    en: "Co-investment / Financing",
    cn: "联合投资/融资",
  },
  "sol.financing.problem": {
    th: "ต้องการติดตั้งโซลาร์แต่ไม่ต้องการลงทุนเงินก้อนใหญ่ตั้งแต่วันแรก",
    en: "Want to install solar but don't want a large upfront investment from day one.",
    cn: "想安装太阳能但不想从第一天起就投入大量资金。",
  },
  "sol.financing.solution": {
    th: "รูปแบบการลงทุนร่วมที่ยืดหยุ่น ทั้งซื้อขาด ผ่อนชำระ และ Co-investment ให้ธุรกิจเข้าถึงพลังงานสะอาดได้ง่ายขึ้น",
    en: "Flexible investment models — outright purchase, installment, and co-investment — making clean energy accessible for businesses.",
    cn: "灵活的投资模式——全额购买、分期付款和联合投资——让企业更容易获得清洁能源。",
  },
  "sol.financing.suitable1": {
    th: "SME ที่งบจำกัด",
    en: "SMEs with limited budgets",
    cn: "预算有限的中小企业",
  },
  "sol.financing.suitable2": {
    th: "ธุรกิจที่ต้องการ cash flow flexibility",
    en: "Businesses needing cash flow flexibility",
    cn: "需要现金流灵活性的企业",
  },
  "sol.financing.suitable3": {
    th: "โครงการขนาดใหญ่",
    en: "Large-scale projects",
    cn: "大型项目",
  },
  "sol.financing.suitable4": {
    th: "องค์กรที่ต้องการ off-balance sheet",
    en: "Organizations wanting off-balance sheet",
    cn: "需要表外处理的组织",
  },
  "sol.financing.benefit1": {
    th: "ไม่ต้องลงทุนสูงตั้งแต่วันแรก",
    en: "No large upfront investment",
    cn: "无需大额前期投资",
  },
  "sol.financing.benefit2": {
    th: "รูปแบบยืดหยุ่น",
    en: "Flexible models",
    cn: "灵活模式",
  },
  "sol.financing.benefit3": {
    th: "ลดค่าไฟตั้งแต่เดือนแรก",
    en: "Save from month one",
    cn: "第一个月起就节省电费",
  },
  "sol.financing.benefit4": {
    th: "ทีมที่ปรึกษาช่วยวิเคราะห์",
    en: "Advisory team analysis",
    cn: "顾问团队分析",
  },

  // Section labels
  "sol.label.problem": {
    th: "ปัญหาที่ลูกค้าเจอ",
    en: "Customer Pain Points",
    cn: "客户痛点",
  },
  "sol.label.solution": {
    th: "วิธีแก้ของ SIRINX",
    en: "SIRINX Solution",
    cn: "SIRINX解决方案",
  },
  "sol.label.suitable": { th: "เหมาะกับใคร", en: "Ideal For", cn: "适合对象" },
  "sol.cta.details": { th: "ดูรายละเอียด", en: "View Details", cn: "查看详情" },
  "sol.cta.consult": {
    th: "ขอคำปรึกษา",
    en: "Get Consultation",
    cn: "获取咨询",
  },

  // Bottom CTA
  "sol.bottomCta.title": {
    th: "ไม่แน่ใจว่าโซลูชันไหนเหมาะ?",
    en: "Not sure which solution fits?",
    cn: "不确定哪种方案适合？",
  },
  "sol.bottomCta.desc": {
    th: "ทีมวิศวกรของเราพร้อมช่วยวิเคราะห์ความต้องการและแนะนำโซลูชันที่เหมาะสมที่สุดสำหรับธุรกิจของคุณ",
    en: "Our engineering team is ready to analyze your needs and recommend the best solution for your business.",
    cn: "我们的工程团队随时准备分析您的需求，为您的企业推荐最佳方案。",
  },
  "sol.bottomCta.btn1": {
    th: "นัดสำรวจหน้างานฟรี",
    en: "Book Free Site Survey",
    cn: "预约免费现场勘察",
  },
  "sol.bottomCta.btn2": {
    th: "ประเมินความคุ้มค่าเบื้องต้น",
    en: "Preliminary ROI Assessment",
    cn: "初步ROI评估",
  },
};

registerPageTranslations("solutions", dict);
export default dict;
