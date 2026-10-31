import { registerPageTranslations } from "../index";

const dict: Record<string, { th: string; en: string; cn: string }> = {
  // Hero
  "sol.hero.tag": { th: "Solutions", en: "Solutions", cn: "解决方案" },
  "sol.hero.title1": {
    th: "โซลูชันพลังงาน",
    en: "Complete Energy",
    cn: "全方位能源",
  },
  "sol.hero.title2": { th: "ผลิตไฟถึงชาร์จ EV", en: "Solutions", cn: "发电到充电" },
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
    th: "ประเมินผลจากค่าไฟและ load profile จริง",
    en: "Assess outcomes from actual bills and load profile",
    cn: "根据实际电费和负载曲线评估结果",
  },
  "sol.carport.benefit2": {
    th: "คำนวณผลตอบแทนเฉพาะโครงการ",
    en: "Calculate returns for each project",
    cn: "按项目计算回报",
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
    th: "คำนวณผลตอบแทนเฉพาะโครงการ",
    en: "Calculate returns for each project",
    cn: "按项目计算回报",
  },
  "sol.rooftop.benefit3": {
    th: "เลือกอุปกรณ์ตามสเปกและการรับประกัน",
    en: "Select equipment by specification and warranty",
    cn: "根据规格和质保选择设备",
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
    th: "ประเมินผลต่อการระเหยของน้ำตามพื้นที่และสภาพแวดล้อม",
    en: "Assess evaporation effects from site and environmental conditions",
    cn: "根据场地和环境条件评估蒸发影响",
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
    th: "ประเมินผลต่อ demand charge จาก load profile",
    en: "Assess demand-charge impact from the load profile",
    cn: "根据负载曲线评估需量电费影响",
  },
  "sol.bess.benefit2": {
    th: "สำรองไฟฟ้ายามฉุกเฉิน",
    en: "Emergency power backup",
    cn: "紧急备用电源",
  },
  "sol.bess.benefit3": {
    th: "วางแผนการใช้พลังงานตามช่วงเวลาและความปลอดภัย",
    en: "Plan energy use by time period and safety requirements",
    cn: "根据时段和安全要求规划能源使用",
  },
  "sol.bess.benefit4": {
    th: "เพิ่มความเสถียรของระบบ",
    en: "Increase system stability",
    cn: "提高系统稳定性",
  },

  "sol.bess.factory.title": {
    th: "โรงงานอุตสาหกรรม",
    en: "Industrial Factories",
    cn: "工业工厂",
  },
  "sol.bess.factory.problem": {
    th: "ค่า demand charge สูงจากอุตสาหกรรมกระบวนการผลิตสูง",
    en: "High demand charges from energy-intensive industrial processes",
    cn: "高耗能工业生产过程的高峰电费",
  },
  "sol.bess.factory.solution": {
    th: "BESS ขนาดกลางถึงใหญ่ช่วยลด peak และ smooth load สำหรับโรงงานที่ใช้ไฟมากกว่า 1 MW",
    en: "Mid-to-large BESS reduces peak and smooths load for factories consuming over 1 MW",
    cn: "中大容量BESS对消耗超过1兆瓦的工业进行峰值削平",
  },
  "sol.bess.factory.suitable1": {
    th: "โรงงานอุตสาหกรรม",
    en: "Industrial factories",
    cn: "工业工厂",
  },
  "sol.bess.factory.suitable2": {
    th: "อุตสาหกรรมอาหารและเครื่องจักร",
    en: "Food and machinery industries",
    cn: "食品和机械工业",
  },
  "sol.bess.factory.suitable3": {
    th: "อุตสาหกรรมเคมีและโลหะ",
    en: "Chemical and metal industries",
    cn: "化学和冶金工业",
  },
  "sol.bess.factory.benefit1": {
    th: "ลด demand charge ได้ 10-20%",
    en: "Reduce demand charges by 10-20%",
    cn: "降低10-20%的峰值电费",
  },
  "sol.bess.factory.benefit2": {
    th: "สำรองไฟสำคัญระหว่างไฟดับ",
    en: "Critical power backup during outages",
    cn: "停电期间关键电源备份",
  },
  "sol.bess.factory.benefit3": {
    th: "ปรับใช้พลังงานตามช่วงเวลาค่าไฟ",
    en: "Shift energy use according to tariff periods",
    cn: "根据电价时段调整能源使用",
  },
  "sol.bess.factory.benefit4": {
    th: "เพิ่มความน่าเชื่อถือของการผลิต",
    en: "Increase production reliability",
    cn: "提高生产可靠性",
  },
  "sol.bess.factory.benefit5": {
    th: " ROI ภายใน 3-5 ปี",
    en: "ROI within 3-5 years",
    cn: "3-5年内回本",
  },
  "sol.bess.factory.benefit6": {
    th: "ลดคาร์บอนฟุตพรINT",
    en: "Reduce carbon footprint",
    cn: "降低碳足迹",
  },

  "sol.bess.hotel.title": {
    th: "โรงแรมและรีสอร์ท",
    en: "Hotels and Resorts",
    cn: "酒店和度假村",
  },
  "sol.bess.hotel.problem": {
    th: "ค่าไฟฟ้าช่วงเย็นสูงเนื่องจากแอร์ทำงานหนัก และผู้ใช้ไฟรายย่อยหลากหลาย",
    en: "High evening electricity costs from heavy AC use and diverse guest loads",
    cn: "由于空调使用量大和多样化的guest负载，晚上电费高",
  },
  "sol.bess.hotel.solution": {
    th: "BESS ขนาดเล็กถึงกลางเก็บพลังงานโซลาร์กลางวันเพื่อใช้ตอนเย็น ลดค่า AC peak และให้ไฟสำรองห้องพัก",
    en: "Mid-sized BESS stores daytime solar for evening AC use, reduces peak and provides guest room backup power",
    cn: "中小容量BESS储存白天太阳能供傍晚使用空调，降低峰值并为客房提供备用电源",
  },
  "sol.bess.hotel.suitable1": {
    th: "โรงแรมขนาดกลางใหญ่",
    en: "Mid-to-large hotels",
    cn: "中大型酒店",
  },
  "sol.bess.hotel.suitable2": {
    th: "รีสอร์ทริมชายหรือกลางธรรมชาติ",
    en: "Resorts by the beach or in nature",
    cn: "海滨或度假村",
  },
  "sol.bess.hotel.suitable3": {
    th: "โรงแรมที่มี EV Charger สำหรับผู้เข้าพัก",
    en: "Hotels with EV Chargers for guests",
    cn: "配有客车充电桩的酒店",
  },
  "sol.bess.hotel.benefit1": {
    th: "ลดค่า AC peak ได้ 15-25%",
    en: "Reduce AC peak by 15-25%",
    cn: "降低15-25%的峰值空调电费",
  },
  "sol.bess.hotel.benefit2": {
    th: "ให้ไฟสำรองห้องพัก",
    en: "Guest room backup power",
    cn: "客房备用电源",
  },
  "sol.bess.hotel.benefit3": {
    th: "ใช้พลังงานโซลาร์ได้รอบคืน",
    en: "Use solar energy through the night",
    cn: "整夜使用太阳能",
  },
  "sol.bess.hotel.benefit4": {
    th: "เพิ่มความพึงพอใจของผู้เข้าพัก",
    en: "Increase guest satisfaction",
    cn: "提高客户满意度",
  },
  "sol.bess.hotel.benefit5": {
    th: " ROI ภายใน 4-6 ปี",
    en: "ROI within 4-6 years",
    cn: "4-6年内回本",
  },

  "sol.bess.peak-shaving.title": {
    th: "การตัด Peak Shaving",
    en: "Peak Shaving",
    cn: "削峰",
  },
  "sol.bess.peak-shaving.problem": {
    th: "ค่าใช้จ่ายค่า demand charge สูงในช่วงเวลากำหนดทุกวัน",
    en: "Daily high demand charges during peak hours",
    cn: "每天在峰值时段的高峰电费",
  },
  "sol.bess.peak-shaving.solution": {
    th: "BESS ตอบสนองเร็วช่วยลด peak demand โดยชาร์จเมื่อค่าไฟต่ำและจ่ายเมื่อค่าไฟสูง",
    en: "BESS rapidly responds to shave peak demand by charging when rates are low and discharging when rates are high",
    cn: "当电价低时充电、电价高时放电，BESS快速响应削峰",
  },
  "sol.bess.peak-shaving.suitable1": {
    th: "ธุรกิจที่มี峰ช่วงเวลาชัดเจน",
    en: "Businesses with clear peak periods",
    cn: "明确峰值时段的企业",
  },
  "sol.bess.peak-shaving.suitable2": {
    th: "โรงงานอุตสาหกรรม",
    en: "Factories",
    cn: "工厂",
  },
  "sol.bess.peak-shaving.suitable3": {
    th: "อาคารพาณิชย์ขนาดใหญ่",
    en: "Large commercial buildings",
    cn: "大型商业大楼",
  },
  "sol.bess.peak-shaving.benefit1": {
    th: "ลด demand charge ได้ 30-40%",
    en: "Reduce demand charges by 30-40%",
    cn: "降低30-40%的峰值电费",
  },
  "sol.bess.peak-shaving.benefit2": {
    th: "ควบคุมการใช้งานอัตโนมัติตามตาราง",
    en: "Automated control according to schedule",
    cn: "根据时间表自动控制",
  },
  "sol.bess.peak-shaving.benefit3": {
    th: "คำนวณ ROI ได้ชัดเจน",
    en: "Clear ROI calculation",
    cn: "清晰的ROI计算",
  },
  "sol.bess.peak-shaving.benefit4": {
    th: "ปรับใช้พลังงานได้ตามฤดูกาล",
    en: "Seasonal energy shifting",
    cn: "季节性能源调整",
  },

  "sol.bess.sizing.title": {
    th: "การคำนวณขนาด BESS",
    en: "BESS Sizing",
    cn: "储能系统尺寸",
  },
  "sol.bess.sizing.problem": {
    th: "การเลือกขนาด BESS ที่ไม่ถูกต้องทำให้จ่ายเกินหรือจ่ายไม่เพียงพอ",
    en: "Wrong BESS size leads to over-sizing or under-delivery",
    cn: "错误的BESS尺寸导致过度规模或不足",
  },
  "sol.bess.sizing.solution": {
    th: "วิเคราะห์ load profile 24 ชม. เพื่อคำนวณขนาด kWh/kW ที่เหมาะสมกับงบประมาณและข้อจำกัดหน้างาน",
    en: "Analyze 24-hour load profile to calculate optimal kWh/kW size matching budget and site constraints",
    cn: "分析24小时负载曲线以计算匹配预算和现场限制的最优kWh/kW尺寸",
  },
  "sol.bess.sizing.suitable1": {
    th: "ผู้ที่ต้องการออกแบบระบบให้ถูกต้องครั้งแรก",
    en: "Those who want correct first-time system design",
    cn: "想一次性设计正确的系统",
  },
  "sol.bess.sizing.suitable2": {
    th: "ผู้รับเห้าต้องการประเมินขนาด",
    en: "Contractors needing size assessment",
    cn: "需要尺寸评估的承包商",
  },
  "sol.bess.sizing.suitable3": {
    th: "ผู้บริหารที่ต้องการงบประมาณที่ชัดเจน",
    en: "Executives needing clear budget scoping",
    cn: "需要明确预算规划的高管",
  },
  "sol.bess.sizing.benefit1": {
    th: "หลีกเลี่ยงการจ่ายเงินเกินจริง",
    en: "Avoid over-paying for unneeded capacity",
    cn: "避免为不需要的容量付费",
  },
  "sol.bess.sizing.benefit2": {
    th: "มั่นใจได้ว่าระบบครอบคลุมโหลดสำคัญ",
    en: "Ensure critical loads are covered",
    cn: "确保关键负载得到覆盖",
  },
  "sol.bess.sizing.benefit3": {
    th: "สร้างแบบเสนอราคาเร็วขึ้น",
    en: "Faster proposal generation",
    cn: "更快的报价生成",
  },
  "sol.bess.sizing.benefit4": {
    th: "ปฏิบัติตามข้อกำหนด安全",
    en: "Comply with safety regulations",
    cn: "符合安全规定",
  },

  "sol.bess.safety-cost.title": {
    th: "ความปลอดภัยและค่าใช้จ่าย",
    en: "Safety and Cost",
    cn: "安全和成本",
  },
  "sol.bess.safety-cost.problem": {
    th: "BESS ต้องการการออกแบบตามมาตรฐานความปลอดภัยและการจัดการความเสี่ยง",
    en: "BESS requires safety-standard design and risk management",
    cn: "BESS需要符合安全标准的设计และ风险管理",
  },
  "sol.bess.safety-cost.solution": {
    th: "เลือกเซลล์ LFP ผ่านมาตร IEC 62619 ติดตั้งครบตามมาตร BS EN 62933 และมี BMS จัดการระบบโดยอัตโนมัติ",
    en: "Choose LFP cells passing IEC 62619, install to BS EN 62933 with automatic BMS",
    cn: "选择通过IEC 62619的LFP电池，按照BS EN 62933安装并自动管理BMS",
  },
  "sol.bess.safety-cost.suitable1": {
    th: "ผู้ที่ให้ความสำคัญกับความปลอดภัยเป็นอันดับแรก",
    en: "Those prioritizing safety above all",
    cn: "首要考虑安全的用户",
  },
  "sol.bess.safety-cost.suitable2": {
    th: "บริษัทที่ต้องการตรวจสอบมาตรฐานการติดตั้ง",
    en: "Companies verifying installation standards",
    cn: "需要验证安装标准的公司",
  },
  "sol.bess.safety-cost.benefit1": {
    th: "มั่นใจในความปลอดภัยตามสากล",
    en: "Confidence in international safety standards",
    cn: "符合国际安全标准的信心",
  },
  "sol.bess.safety-cost.benefit2": {
    th: "ลดความเสี่ยงจากการติดตั้งที่ไม่ถูกต้อง",
    en: "Reduce risk from improper installation",
    cn: "降低安装不当的风险",
  },
  "sol.bess.safety-cost.benefit3": {
    th: "ระบบ BMS ติดตามสภาพแบตเตอรี่ตลอดเวลา",
    en: "24/7 BMS battery monitoring",
    cn: "24/7 BMS 电池监控",
  },
  "sol.bess.safety-cost.benefit4": {
    th: "คำนวณ TCO อย่างครบถ้วน",
    en: "Full TCO calculation",
    cn: "完整的总拥有成本计算",
  },
  "sol.bess.safety-cost.benefit5": {
    th: "ป้องกันการ Overcharge/Over-discharge",
    en: "Prevent overcharge/over-discharge",
    cn: "防止过充/过放",
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
    th: "ติดตามจุดใช้พลังงานสิ้นเปลืองเพื่อวางแผนปรับปรุง",
    en: "Track energy waste to plan improvements",
    cn: "追踪能源浪费以规划改进",
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
    th: "ระบบดูแลรักษาด้วย AI + Drone Inspection + ทีมวิศวกร โดยกำหนดขอบเขตบริการตามสัญญาและสภาพหน้างาน",
    en: "AI + Drone Inspection + engineering support, with service scope defined by contract and site conditions.",
    cn: "AI + 无人机巡检 + 工程支持，服务范围根据合同和现场条件确定。",
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
