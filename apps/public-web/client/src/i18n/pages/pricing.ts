import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  /* ─── Hero ─── */
  "hero.badge": {
    th: "แพ็คเกจราคา Solar Carport",
    en: "Solar Carport Pricing Packages",
    cn: "太阳能车棚价格套餐",
  },
  "hero.title": {
    th: "เลือกแพ็คเกจที่เหมาะกับธุรกิจ",
    en: "Choose the Right Package for Your Business",
    cn: "选择适合您业务的套餐",
  },
  "hero.title.accent": {
    th: "คุ้มค่าทุกการลงทุน",
    en: "Worth Every Investment",
    cn: "每一笔投资都物有所值",
  },
  "hero.desc": {
    th: "Solar Carport โดย SIRINX — ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV Charger และออกแบบจากข้อมูลหน้างานจริง โดยขอบเขตงานและราคาต้องยืนยันก่อนเสนอ",
    en: "Solar Carport by SIRINX — Generate electricity, provide shade, support EV Chargers, and design from real site data. Scope and pricing are confirmed before quoting.",
    cn: "SIRINX太阳能车棚——发电、遮阳、支持电动车充电，并根据实际现场数据设计。范围和价格在报价前确认。",
  },
  "hero.cta.quote": {
    th: "ขอใบเสนอราคาฟรี",
    en: "Get a Free Quote",
    cn: "获取免费报价",
  },
  "hero.cta.assess": {
    th: "ประเมินความคุ้มค่า",
    en: "Assess ROI",
    cn: "评估投资回报",
  },

  /* ─── Government Policy Section ─── */
  "gov.title": {
    th: "ทำไมต้องลงทุน Solar Carport",
    en: "Why Invest in Solar Carport",
    cn: "为什么要投资太阳能车棚",
  },
  "gov.title.accent": {
    th: "ตอนนี้",
    en: "Now",
    cn: "现在",
  },
  "gov.desc": {
    th: "มาตรการรัฐสนับสนุนทั้งพลังงานสะอาดและรถยนต์ไฟฟ้า — ธุรกิจที่เริ่มก่อนได้เปรียบทั้งต้นทุนและภาพลักษณ์",
    en: "Government policies support both clean energy and EVs — early adopters gain advantages in both cost savings and brand image.",
    cn: "政府政策支持清洁能源和电动车 — 先行者在成本节约和品牌形象方面都占优势。",
  },
  "gov.0.title": {
    th: "ลดหย่อนภาษี Solar Rooftop",
    en: "Solar Rooftop Tax Deduction",
    cn: "太阳能屋顶税收减免",
  },
  "gov.0.desc": {
    th: "เงื่อนไขสิทธิประโยชน์ต้องตรวจสอบกับประกาศล่าสุดและผู้เชี่ยวชาญก่อนนำไปคำนวณโครงการ",
    en: "Eligibility must be checked against the latest policy and a qualified adviser before it is included in project calculations.",
    cn: "在纳入项目计算前，必须根据最新政策并咨询合格顾问确认资格。",
  },
  "gov.0.period": {
    th: "ตรวจสอบประกาศล่าสุด",
    en: "Check the latest announcement",
    cn: "请查阅最新公告",
  },
  "gov.1.title": {
    th: "มาตรการ EV 3.5",
    en: "EV 3.5 Policy",
    cn: "EV 3.5政策",
  },
  "gov.1.desc": {
    th: "มาตรการ EV และเงื่อนไขการสนับสนุนเปลี่ยนแปลงได้ ต้องตรวจสอบกับหน่วยงานที่เกี่ยวข้องก่อนอ้างอิง",
    en: "EV measures and support conditions can change; verify them with the relevant authorities before relying on them.",
    cn: "电动车政策和支持条件可能变化，使用前请向相关机构核实。",
  },
  "gov.1.period": {
    th: "ตรวจสอบประกาศล่าสุด",
    en: "Check the latest announcement",
    cn: "请查阅最新公告",
  },
  "gov.2.title": {
    th: "BOI สนับสนุนพลังงานสะอาด",
    en: "BOI Clean Energy Support",
    cn: "BOI清洁能源支持",
  },
  "gov.2.desc": {
    th: "สิทธิประโยชน์ BOI สำหรับธุรกิจที่ลงทุนพลังงานทดแทน + EV Charger (ประกาศ ป.8/2568)",
    en: "BOI privileges for businesses investing in renewable energy + EV Chargers (Announcement P.8/2025)",
    cn: "BOI为投资可再生能源+电动车充电器的企业提供优惠（公告P.8/2025）",
  },
  "gov.2.period": {
    th: "ดำเนินการต่อเนื่อง",
    en: "Ongoing",
    cn: "持续进行中",
  },
  "gov.3.title": {
    th: "เป้าหมาย Carbon Neutrality",
    en: "Carbon Neutrality Goal",
    cn: "碳中和目标",
  },
  "gov.3.desc": {
    th: "เป้าหมายระดับประเทศเป็นข้อมูลประกอบการวางแผน แต่ผลลัพธ์ของแต่ละธุรกิจต้องวัดจากข้อมูลและมาตรฐานที่เกี่ยวข้อง",
    en: "National targets can inform planning, but each business outcome must be measured from relevant data and standards.",
    cn: "国家目标可作为规划参考，但每个企业的结果必须根据相关数据和标准衡量。",
  },
  "gov.3.period": {
    th: "เป้าหมายระยะยาว",
    en: "Long-term Target",
    cn: "长期目标",
  },

  /* ─── Packages Section ─── */
  "pkg.title": {
    th: "แพ็คเกจ Solar Carport",
    en: "Solar Carport Packages",
    cn: "太阳能车棚套餐",
  },
  "pkg.title.accent": {
    th: "ตามขอบเขตโครงการ",
    en: "By project scope",
    cn: "按项目范围",
  },
  "pkg.desc": {
    th: "แพ็กเกจด้านล่างเป็นกรอบบริการเบื้องต้น ข้อมูลราคา สเปก และเงื่อนไขต้องผ่านการตรวจสอบข้อมูลจริงและยืนยันหลังสำรวจหน้างาน",
    en: "The packages below are service outlines. Pricing, specifications, and terms require evidence review and confirmation after the site survey.",
    cn: "以下套餐是初步服务框架。价格、规格和条款需经过证据审核，并在现场勘查后确认。",
  },
  "pkg.recommended": {
    th: "แนะนำ",
    en: "Recommended",
    cn: "推荐",
  },
  "pkg.idealFor": {
    th: "เหมาะสำหรับ",
    en: "Ideal For",
    cn: "适合",
  },
  "pkg.spec.parking": {
    th: "ที่จอดรถ",
    en: "Parking Spaces",
    cn: "停车位",
  },
  "pkg.spec.savings": {
    th: "ประหยัดค่าไฟ",
    en: "Electricity Savings",
    cn: "电费节省",
  },
  "pkg.spec.payback": {
    th: "คืนทุน",
    en: "Payback Period",
    cn: "回本周期",
  },
  "pkg.spec.lifespan": {
    th: "อายุใช้งาน",
    en: "Lifespan",
    cn: "使用寿命",
  },
  "pkg.warranty": {
    th: "การรับประกัน",
    en: "Warranty",
    cn: "保修",
  },
  "pkg.showDetails": {
    th: "ดูรายละเอียดทั้งหมด",
    en: "View All Details",
    cn: "查看所有详情",
  },
  "pkg.hideDetails": {
    th: "ซ่อนรายละเอียด",
    en: "Hide Details",
    cn: "隐藏详情",
  },
  "pkg.cta": {
    th: "ขอใบเสนอราคา",
    en: "Get Quote for",
    cn: "获取报价",
  },

  /* ─── Package: Start ─── */
  "pkg.start.subtitle": {
    th: "ธุรกิจขนาดเล็ก",
    en: "Small Business",
    cn: "小型企业",
  },
  "pkg.start.price": {
    th: "ขอประเมินเฉพาะโครงการ",
    en: "Project-specific assessment",
    cn: "按项目评估",
  },
  "pkg.start.priceNote": {
    th: "ราคายังไม่เผยแพร่จนกว่าจะยืนยันข้อมูลโครงการ",
    en: "Pricing is withheld until project data is confirmed",
    cn: "确认项目数据前不公开价格",
  },
  "pkg.start.idealFor": {
    th: "ร้านค้า / ร้านอาหาร|ออฟฟิศขนาดเล็ก|คลินิก / สำนักงาน|พื้นที่จอดรถตามจริง",
    en: "Shops / Restaurants|Small Offices|Clinics / Offices|Parking area confirmed on site",
    cn: "商店/餐厅|小型办公室|诊所/办公室|以现场停车区域为准",
  },
  "pkg.start.specs.parking": {
    th: "ตามพื้นที่จริง",
    en: "Site-specific",
    cn: "以现场为准",
  },
  "pkg.start.specs.evCharger": {
    th: "ตามโหลดและขอบเขตงาน",
    en: "By load and scope",
    cn: "按负载和范围",
  },
  "pkg.start.specs.savings": {
    th: "คำนวณจากบิลและ load profile",
    en: "Calculated from bills and load profile",
    cn: "根据电费单和负载曲线计算",
  },
  "pkg.start.specs.payback": { th: "คำนวณเฉพาะโครงการ", en: "Project-specific calculation", cn: "按项目计算" },
  "pkg.start.specs.lifespan": { th: "ตามรุ่นและการรับประกัน", en: "By model and warranty", cn: "以型号和质保为准" },
  "pkg.start.specs.warranty": {
    th: "ตามใบเสนอราคาและผู้ผลิต",
    en: "By quotation and manufacturer",
    cn: "以报价和制造商为准",
  },
  "pkg.start.includes": {
    th: "สำรวจหน้างาน + ออกแบบระบบ|โครงสร้างและอุปกรณ์ตามแบบที่อนุมัติ|ระบบ Monitoring ตามขอบเขตงาน|ติดตั้งโดยทีมงานที่ได้รับมอบหมาย|ดำเนินการเอกสารตามเงื่อนไขโครงการ|เงื่อนไขรับประกันตามสัญญา",
    en: "Site survey + system design|Structure and equipment by approved design|Monitoring by project scope|Installation by the assigned team|Documentation per project requirements|Warranty terms by contract",
    cn: "现场勘察+系统设计|结构和设备以批准设计为准|按范围提供监控|由指定团队安装|根据项目要求办理文件|质保条款以合同为准",
  },
  "pkg.start.evReady": {
    th: "เตรียมระบบสำหรับ EV Charger ตามขอบเขตงาน",
    en: "EV Charger preparation by project scope",
    cn: "按项目范围预留电动车充电系统",
  },

  /* ─── Package: Pro ─── */
  "pkg.pro.subtitle": {
    th: "ธุรกิจขนาดกลาง",
    en: "Medium Business",
    cn: "中型企业",
  },
  "pkg.pro.price": {
    th: "ขอประเมินเฉพาะโครงการ",
    en: "Project-specific assessment",
    cn: "按项目评估",
  },
  "pkg.pro.priceNote": {
    th: "ราคายังไม่เผยแพร่จนกว่าจะยืนยันข้อมูลโครงการ",
    en: "Pricing is withheld until project data is confirmed",
    cn: "确认项目数据前不公开价格",
  },
  "pkg.pro.idealFor": {
    th: "โรงแรม / รีสอร์ท|สถานศึกษา|อาคารพาณิชย์|พื้นที่จอดรถตามจริง",
    en: "Hotels / Resorts|Educational Institutions|Commercial Buildings|Parking area confirmed on site",
    cn: "酒店/度假村|教育机构|商业建筑|以现场停车区域为准",
  },
  "pkg.pro.specs.parking": {
    th: "ตามพื้นที่จริง",
    en: "Site-specific",
    cn: "以现场为准",
  },
  "pkg.pro.specs.evCharger": {
    th: "ตามโหลดและขอบเขตงาน",
    en: "By load and scope",
    cn: "按负载和范围",
  },
  "pkg.pro.specs.savings": {
    th: "คำนวณจากบิลและ load profile",
    en: "Calculated from bills and load profile",
    cn: "根据电费单和负载曲线计算",
  },
  "pkg.pro.specs.payback": {
    th: "คำนวณเฉพาะโครงการ",
    en: "Project-specific calculation",
    cn: "按项目计算",
  },
  "pkg.pro.specs.lifespan": { th: "ตามรุ่นและการรับประกัน", en: "By model and warranty", cn: "以型号和质保为准" },
  "pkg.pro.specs.warranty": {
    th: "ตามใบเสนอราคาและผู้ผลิต",
    en: "By quotation and manufacturer",
    cn: "以报价和制造商为准",
  },
  "pkg.pro.includes": {
    th: "ทุกอย่างใน Start|BESS Option ตามการประเมิน|AI Energy Monitoring Dashboard ตามขอบเขตงาน|EV Charger ตามแบบที่อนุมัติ|รายงานผลตามขอบเขตงาน|O&M ตามสัญญา|ประสานงานเอกสารตามเงื่อนไขโครงการ|เอกสาร ESG/Carbon ตามสิทธิ์และการอนุมัติ",
    en: "Everything in Start|BESS option subject to assessment|AI Energy Monitoring Dashboard by scope|EV Charger by approved design|Reports by scope|O&M by contract|Project-document coordination as applicable|ESG/Carbon documentation subject to eligibility and approval",
    cn: "包含Start全部内容|BESS选项以评估为准|按范围提供AI能源监控仪表板|电动车充电器以批准设计为准|按范围提供报告|运维以合同为准|按项目条件协调文件|ESG/碳文件以资格和批准为准",
  },
  "pkg.pro.evReady": {
    th: "ติดตั้ง EV Charger ตามแบบและขอบเขตงานที่อนุมัติ",
    en: "EV Charger installation by approved design and scope",
    cn: "按批准设计和范围安装电动车充电器",
  },

  /* ─── Package: Enterprise ─── */
  "pkg.enterprise.subtitle": {
    th: "ธุรกิจขนาดใหญ่ / โครงการพิเศษ",
    en: "Large Enterprise / Custom Projects",
    cn: "大型企业/定制项目",
  },
  "pkg.enterprise.price": {
    th: "ขอประเมินเฉพาะโครงการ",
    en: "Project-specific assessment",
    cn: "按项目评估",
  },
  "pkg.enterprise.priceNote": {
    th: "ขอบเขตและราคาต้องยืนยันจากแบบวิศวกรรมและข้อมูลโครงการ",
    en: "Scope and pricing must be confirmed from engineering design and project data",
    cn: "范围和价格必须根据工程设计和项目数据确认",
  },
  "pkg.enterprise.idealFor": {
    th: "โรงงานอุตสาหกรรม|ห้างสรรพสินค้า|คลังสินค้า / โลจิสติกส์|นิคมอุตสาหกรรม|หน่วยงานราชการ|พื้นที่ขนาดใหญ่ตามจริง",
    en: "Industrial Factories|Shopping Malls|Warehouses / Logistics|Industrial Estates|Government Agencies|Large sites confirmed on survey",
    cn: "工业工厂|购物中心|仓库/物流|工业园区|政府机构|以勘查确认的大型场地为准",
  },
  "pkg.enterprise.specs.parking": {
    th: "ตามพื้นที่จริง",
    en: "Site-specific",
    cn: "以现场为准",
  },
  "pkg.enterprise.specs.evCharger": {
    th: "ตามโหลดและขอบเขตงาน",
    en: "By load and scope",
    cn: "按负载和范围",
  },
  "pkg.enterprise.specs.savings": {
    th: "คำนวณจากบิลและ load profile",
    en: "Calculated from bills and load profile",
    cn: "根据电费单和负载曲线计算",
  },
  "pkg.enterprise.specs.payback": {
    th: "คำนวณเฉพาะโครงการ",
    en: "Project-specific calculation",
    cn: "按项目计算",
  },
  "pkg.enterprise.specs.lifespan": {
    th: "ตามรุ่นและการรับประกัน",
    en: "By model and warranty",
    cn: "以型号和质保为准",
  },
  "pkg.enterprise.specs.warranty": {
    th: "ตามใบเสนอราคาและผู้ผลิต",
    en: "By quotation and manufacturer",
    cn: "以报价和制造商为准",
  },
  "pkg.enterprise.includes": {
    th: "ทุกอย่างใน Pro|แผงและอุปกรณ์ตามแบบที่อนุมัติ|BESS ตามการประเมิน|DC Fast Charger ตามขอบเขตงาน|AI Predictive Maintenance ตามระบบที่ติดตั้ง|O&M ตามสัญญา|ที่ปรึกษา ESG / Carbon ตามสิทธิ์และการอนุมัติ|รายงานผลกระทบตามขอบเขตงาน|ออกแบบระบบเฉพาะทาง",
    en: "Everything in Pro|Panels and equipment by approved design|BESS subject to assessment|DC Fast Charger by scope|AI Predictive Maintenance for the installed system|O&M by contract|ESG / Carbon consulting subject to eligibility and approval|Impact reporting by scope|Custom engineering design",
    cn: "包含Pro全部内容|面板和设备以批准设计为准|BESS以评估为准|按范围提供直流快充|为已安装系统提供AI预测维护|运维以合同为准|ESG/碳咨询以资格和批准为准|按范围提供影响报告|定制工程设计",
  },
  "pkg.enterprise.evReady": {
    th: "ติดตั้ง EV Charger ทั้ง AC/DC ตามแบบและขอบเขตงานที่อนุมัติ",
    en: "AC/DC EV Charger installation by approved design and scope",
    cn: "按批准设计和范围安装交流/直流电动车充电器",
  },

  /* ─── Advantages ─── */
  "adv.title": {
    th: "ข้อดีของ Solar Carport",
    en: "Advantages of Solar Carport",
    cn: "太阳能车棚的优势",
  },
  "adv.title.accent": {
    th: "ที่ต้องประเมินจากข้อมูลจริง",
    en: "To assess from real data",
    cn: "需根据真实数据评估",
  },
  "adv.desc": {
    th: "ไม่ใช่แค่ลดค่าไฟ — Solar Carport คือการลงทุนที่สร้างมูลค่าหลายทาง ทั้งรายได้ ภาพลักษณ์ และความพร้อมรับอนาคต",
    en: "Not just electricity savings — Solar Carport is a multi-value investment: revenue, brand image, and future readiness.",
    cn: "不仅仅是节省电费 — 太阳能车棚是多重价值投资：收入、品牌形象和未来准备。",
  },
  "adv.0.title": {
    th: "รองรับ EV ที่เพิ่มขึ้น",
    en: "Growing EV Support",
    cn: "支持不断增长的电动车",
  },
  "adv.0.desc": {
    th: "ยอดจดทะเบียนรถ EV ในไทยเพิ่มขึ้นต่อเนื่องจากมาตรการ EV 3.5 ของรัฐ Solar Carport พร้อม EV Charger ตอบโจทย์ทั้งวันนี้และอนาคต",
    en: "EV registrations in Thailand continue to grow due to the EV 3.5 policy. Solar Carport with EV Charger meets both current and future needs.",
    cn: "由于EV 3.5政策，泰国电动车注册量持续增长。配备电动车充电器的太阳能车棚满足当前和未来需求。",
  },
  "adv.1.title": {
    th: "ผลิตไฟฟ้า + ให้ร่มเงา",
    en: "Generate Power + Provide Shade",
    cn: "发电+遮阳",
  },
  "adv.1.desc": {
    th: "ใช้พื้นที่จอดรถที่มีอยู่แล้วให้เกิดประโยชน์สูงสุด ไม่ต้องใช้พื้นที่เพิ่ม ผลิตไฟฟ้าได้ตลอดทั้งวัน พร้อมปกป้องรถจากแดดและฝน",
    en: "Maximize existing parking space — no extra land needed. Generate electricity all day while protecting vehicles from sun and rain.",
    cn: "最大化利用现有停车空间 — 无需额外土地。全天发电，同时保护车辆免受日晒雨淋。",
  },
  "adv.2.title": {
    th: "เพิ่มมูลค่าอสังหาริมทรัพย์",
    en: "Increase Property Value",
    cn: "提升房产价值",
  },
  "adv.2.desc": {
    th: "อาคารที่มี Solar Carport + EV Charger มีมูลค่าเพิ่มขึ้น 5-15% ดึงดูดผู้เช่าและลูกค้าที่ใส่ใจสิ่งแวดล้อม",
    en: "Buildings with Solar Carport + EV Charger increase in value by 5-15%, attracting eco-conscious tenants and customers.",
    cn: "配备太阳能车棚+电动车充电器的建筑价值提升5-15%，吸引注重环保的租户和客户。",
  },
  "adv.3.title": {
    th: "สิทธิประโยชน์ทางภาษี",
    en: "Tax Benefits",
    cn: "税收优惠",
  },
  "adv.3.desc": {
    th: "ลดหย่อนภาษีสูงสุด 200,000 บาท (บุคคล) หรือหักค่าใช้จ่าย 1.5 เท่า (นิติบุคคล) + สิทธิ BOI สำหรับพลังงานสะอาด",
    en: "Tax deduction up to 200,000 THB (individuals) or 1.5x expense deduction (corporations) + BOI privileges for clean energy.",
    cn: "个人最高减税200,000泰铢或法人1.5倍费用扣除 + BOI清洁能源优惠。",
  },
  "adv.4.title": {
    th: "Carbon Credit & ESG",
    en: "Carbon Credit & ESG",
    cn: "碳信用与ESG",
  },
  "adv.4.desc": {
    th: "สร้างรายได้เพิ่มจาก Carbon Credit ตอบโจทย์ ESG สำหรับบริษัทจดทะเบียน และพันธมิตรทางธุรกิจที่ต้องการ supply chain สีเขียว",
    en: "Generate additional revenue from Carbon Credits, meet ESG requirements for listed companies and partners seeking green supply chains.",
    cn: "通过碳信用产生额外收入，满足上市公司和寻求绿色供应链合作伙伴的ESG要求。",
  },
  "adv.5.title": {
    th: "รายได้จาก EV Charging",
    en: "EV Charging Revenue",
    cn: "电动车充电收入",
  },
  "adv.5.desc": {
    th: "เปิดให้บริการชาร์จ EV สร้างรายได้เพิ่มเติมจากพลังงานที่ผลิตเอง ต้นทุนค่าไฟต่ำกว่าซื้อจากการไฟฟ้า",
    en: "Offer EV charging services for additional revenue from self-generated energy at lower cost than grid electricity.",
    cn: "提供电动车充电服务，利用自产能源以低于电网电价的成本获得额外收入。",
  },

  /* ─── Comparison Table ─── */
  "compare.title": {
    th: "เปรียบเทียบแพ็คเกจ",
    en: "Compare Packages",
    cn: "套餐对比",
  },
  "compare.header.item": { th: "รายการ", en: "Item", cn: "项目" },
  "compare.row.0.label": { th: "กำลังผลิต", en: "Capacity", cn: "发电容量" },
  "compare.row.0.s": { th: "ตามแบบ", en: "By design", cn: "按设计" },
  "compare.row.0.m": { th: "ตามแบบ", en: "By design", cn: "按设计" },
  "compare.row.0.l": {
    th: "ตามแบบ",
    en: "By design",
    cn: "按设计",
  },
  "compare.row.1.label": { th: "ที่จอดรถ", en: "Parking", cn: "停车位" },
  "compare.row.1.s": { th: "5-15 คัน", en: "5-15 vehicles", cn: "5-15辆" },
  "compare.row.1.m": { th: "15-50 คัน", en: "15-50 vehicles", cn: "15-50辆" },
  "compare.row.1.l": {
    th: "50-200+ คัน",
    en: "50-200+ vehicles",
    cn: "50-200+辆",
  },
  "compare.row.2.label": {
    th: "EV Charger",
    en: "EV Charger",
    cn: "电动车充电器",
  },
  "compare.row.2.s": { th: "ตามแบบ", en: "By design", cn: "按设计" },
  "compare.row.2.m": { th: "ตามแบบ", en: "By design", cn: "按设计" },
  "compare.row.2.l": { th: "ตามแบบ", en: "By design", cn: "按设计" },
  "compare.row.3.label": {
    th: "ประหยัดค่าไฟ/เดือน",
    en: "Monthly Savings",
    cn: "月节省",
  },
  "compare.row.3.s": {
    th: "คำนวณจากบิลจริง",
    en: "Calculated from actual bills",
    cn: "根据实际电费单计算",
  },
  "compare.row.3.m": {
    th: "คำนวณจากบิลจริง",
    en: "Calculated from actual bills",
    cn: "根据实际电费单计算",
  },
  "compare.row.3.l": {
    th: "คำนวณจากบิลจริง",
    en: "Calculated from actual bills",
    cn: "根据实际电费单计算",
  },
  "compare.row.4.label": { th: "คืนทุน", en: "Payback", cn: "回本" },
  "compare.row.4.s": { th: "คำนวณเฉพาะโครงการ", en: "Project-specific", cn: "按项目计算" },
  "compare.row.4.m": {
    th: "คำนวณเฉพาะโครงการ",
    en: "Project-specific",
    cn: "按项目计算",
  },
  "compare.row.4.l": {
    th: "คำนวณเฉพาะโครงการ",
    en: "Project-specific",
    cn: "按项目计算",
  },
  "compare.row.5.label": {
    th: "BESS (แบตเตอรี่)",
    en: "BESS (Battery)",
    cn: "BESS（电池）",
  },
  "compare.row.5.s": { th: "—", en: "—", cn: "—" },
  "compare.row.5.m": { th: "Option", en: "Option", cn: "可选" },
  "compare.row.5.l": { th: "รวม", en: "Included", cn: "包含" },
  "compare.row.6.label": {
    th: "AI Monitoring",
    en: "AI Monitoring",
    cn: "AI监控",
  },
  "compare.row.6.s": { th: "แอป", en: "App", cn: "应用" },
  "compare.row.6.m": { th: "Dashboard", en: "Dashboard", cn: "仪表板" },
  "compare.row.6.l": { th: "Predictive AI", en: "Predictive AI", cn: "预测AI" },
  "compare.row.7.label": {
    th: "DC Fast Charge",
    en: "DC Fast Charge",
    cn: "DC快充",
  },
  "compare.row.7.s": { th: "—", en: "—", cn: "—" },
  "compare.row.7.m": { th: "—", en: "—", cn: "—" },
  "compare.row.7.l": {
    th: "Option (CCS2)",
    en: "Option (CCS2)",
    cn: "可选（CCS2）",
  },
  "compare.row.8.label": {
    th: "O&M Contract",
    en: "O&M Contract",
    cn: "运维合同",
  },
  "compare.row.8.s": { th: "ตามสัญญา", en: "By contract", cn: "以合同为准" },
  "compare.row.8.m": { th: "ตามสัญญา", en: "By contract", cn: "以合同为准" },
  "compare.row.8.l": { th: "ตามสัญญา", en: "By contract", cn: "以合同为准" },
  "compare.row.9.label": {
    th: "Carbon Credit",
    en: "Carbon Credit",
    cn: "碳信用",
  },
  "compare.row.9.s": { th: "—", en: "—", cn: "—" },
  "compare.row.9.m": { th: "ใบรับรอง", en: "Certificate", cn: "证书" },
  "compare.row.9.l": {
    th: "ที่ปรึกษา ESG",
    en: "ESG Consulting",
    cn: "ESG咨询",
  },
  "compare.row.10.label": {
    th: "ราคาเริ่มต้น",
    en: "Starting Price",
    cn: "起步价",
  },
  "compare.row.10.s": {
    th: "ขอประเมิน",
    en: "Assess",
    cn: "需评估",
  },
  "compare.row.10.m": {
    th: "ขอประเมิน",
    en: "Assess",
    cn: "需评估",
  },
  "compare.row.10.l": {
    th: "ขอประเมิน",
    en: "Assess",
    cn: "需评估",
  },
  "compare.note": {
    th: "* ราคาเป็นราคาประมาณการ ราคาจริงขึ้นอยู่กับการสำรวจหน้างาน ติดต่อทีมงานเพื่อรับใบเสนอราคาที่แม่นยำ",
    en: "* Prices are estimates. Actual prices depend on site survey. Contact our team for an accurate quote.",
    cn: "* 价格为估算价。实际价格取决于现场勘察。联系我们的团队获取准确报价。",
  },

  /* ─── Solar Carport vs Traditional ─── */
  "vs.title.accent": {
    th: "ที่จอดรถแบบเดิม",
    en: "Traditional Parking",
    cn: "传统停车场",
  },
  "vs.desc": {
    th: "เปรียบเทียบข้อแตกต่างระหว่างที่จอดรถทั่วไปกับ Solar Carport ที่สร้างรายได้และมูลค่าเพิ่มให้ธุรกิจ",
    en: "Compare the differences between traditional parking and Solar Carport that generates revenue and added value for your business.",
    cn: "比较传统停车场与为您的业务创造收入和附加价值的太阳能车棚之间的差异。",
  },
  "vs.header.old": {
    th: "ที่จอดรถแบบเดิม",
    en: "Traditional Parking",
    cn: "传统停车场",
  },
  "vs.row.0.label": {
    th: "รายได้จากพื้นที่",
    en: "Revenue from Space",
    cn: "空间收入",
  },
  "vs.row.0.old": {
    th: "ไม่มี — เป็นต้นทุนอย่างเดียว",
    en: "None — cost only",
    cn: "无 — 仅有成本",
  },
  "vs.row.0.carport": {
    th: "ผลิตไฟฟ้าและลดต้นทุนตามไซต์จริง",
    en: "Generate electricity and reduce costs based on real site data",
    cn: "发电并根据现场数据降低成本",
  },
  "vs.row.1.label": {
    th: "ร่มเงา / ป้องกันแดด-ฝน",
    en: "Shade / Weather Protection",
    cn: "遮阳/防风雨",
  },
  "vs.row.1.old": {
    th: "ไม่มีหลังคา รถโดนแดดและฝนโดยตรง",
    en: "No roof — vehicles exposed to sun and rain",
    cn: "无顶棚 — 车辆暴露在日晒雨淋中",
  },
  "vs.row.1.carport": {
    th: "หลังคาแผงโซลาร์ปกป้องครบวงจร",
    en: "Solar panel roof provides full protection",
    cn: "太阳能板屋顶提供全面保护",
  },
  "vs.row.2.label": {
    th: "รองรับ EV Charger",
    en: "EV Charger Support",
    cn: "电动车充电器支持",
  },
  "vs.row.2.old": {
    th: "ต้องลงทุนเพิ่มเติม ไม่มีไฟฟ้าสำรอง",
    en: "Additional investment needed, no backup power",
    cn: "需要额外投资，无备用电源",
  },
  "vs.row.2.carport": {
    th: "Pre-wired พร้อมใช้งาน ไฟฟ้าจากแสงอาทิตย์",
    en: "Pre-wired and ready, solar-powered electricity",
    cn: "预布线即用，太阳能供电",
  },
  "vs.row.3.label": {
    th: "มูลค่าอสังหาริมทรัพย์",
    en: "Property Value",
    cn: "房产价值",
  },
  "vs.row.3.old": {
    th: "ไม่เพิ่มมูลค่า",
    en: "No value increase",
    cn: "无增值",
  },
  "vs.row.3.carport": {
    th: "เพิ่มมูลค่า 5-15% ดึงดูดผู้เช่า Green",
    en: "5-15% value increase, attracts green tenants",
    cn: "增值5-15%，吸引绿色租户",
  },
  "vs.row.4.label": {
    th: "สิทธิทางภาษี (BOI / ลดหย่อน)",
    en: "Tax Benefits (BOI / Deductions)",
    cn: "税收优惠（BOI/减免）",
  },
  "vs.row.4.old": {
    th: "ไม่มีสิทธิลดหย่อน",
    en: "No tax deductions",
    cn: "无税收减免",
  },
  "vs.row.4.carport": {
    th: "ตรวจสิทธิภาษี + BOI + ค่าเสื่อมเร่ง",
    en: "Tax eligibility review + BOI + accelerated depreciation",
    cn: "税务资格审查 + BOI + 加速折旧",
  },
  "vs.row.5.label": {
    th: "Carbon Credit / ESG",
    en: "Carbon Credit / ESG",
    cn: "碳信用/ESG",
  },
  "vs.row.5.old": { th: "ไม่ได้", en: "Not applicable", cn: "不适用" },
  "vs.row.5.carport": {
    th: "ได้ Carbon Credit + ตอบโจทย์ ESG",
    en: "Earn Carbon Credits + meet ESG goals",
    cn: "获得碳信用 + 满足ESG目标",
  },
  "vs.row.6.label": {
    th: "ค่าดูแลระยะยาว",
    en: "Long-term Maintenance",
    cn: "长期维护",
  },
  "vs.row.6.old": {
    th: "ต้นทุนซ่อมบำรุงตลอดอายุการใช้งาน",
    en: "Maintenance costs throughout lifespan",
    cn: "整个使用寿命的维护成本",
  },
  "vs.row.6.carport": {
    th: "O&M + AI Monitoring ตามสัญญา",
    en: "O&M + AI Monitoring by contract",
    cn: "按合同提供运维和AI监控",
  },
  "vs.row.7.label": {
    th: "รายได้จาก EV Charging",
    en: "EV Charging Revenue",
    cn: "电动车充电收入",
  },
  "vs.row.7.old": { th: "ไม่มี", en: "None", cn: "无" },
  "vs.row.7.carport": {
    th: "เปิดให้บริการชาร์จ EV สร้างรายได้เพิ่ม",
    en: "Offer EV charging services for extra revenue",
    cn: "提供电动车充电服务获取额外收入",
  },

  /* ─── ROI Calculator ─── */
  "roi.label": {
    th: "ROI Calculator",
    en: "ROI Calculator",
    cn: "投资回报计算器",
  },
  "roi.title": {
    th: "คำนวณความคุ้มค่า",
    en: "Calculate Your ROI",
    cn: "计算您的投资回报",
  },
  "roi.title.accent": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "roi.desc": {
    th: "กรอกข้อมูลเพื่อดูการประเมินเบื้องต้นสำหรับใช้คุยกับทีมงาน ไม่ใช่ใบเสนอราคาและไม่ใช่การรับประกันผลประหยัด",
    en: "Enter data for a preliminary discussion with the team. This is not a quote or a guarantee of savings.",
    cn: "输入数据以便与团队进行初步讨论。本工具不是报价，也不保证节省。",
  },
  "roi.label.bill": {
    th: "ค่าไฟฟ้าต่อเดือน (บาท)",
    en: "Monthly Electricity Bill (THB)",
    cn: "月电费（泰铢）",
  },
  "roi.label.parking": {
    th: "จำนวนที่จอดรถ (คัน)",
    en: "Number of Parking Spaces",
    cn: "停车位数量",
  },
  "roi.unit.bahtMonth": { th: "บาท/เดือน", en: "THB/month", cn: "泰铢/月" },
  "roi.unit.vehicles": { th: "คัน", en: "spaces", cn: "个" },
  "roi.result.savingsMonth": {
    th: "ประหยัด/เดือน (บาท)",
    en: "Monthly Savings (THB)",
    cn: "月节省（泰铢）",
  },
  "roi.result.paybackYears": {
    th: "ปีคืนทุน",
    en: "Payback Years",
    cn: "回本年限",
  },
  "roi.result.totalSavings": {
    th: "ผลประเมินสะสมตามสมมติฐาน (บาท)",
    en: "Cumulative estimate under assumptions (THB)",
    cn: "按假设的累计估算（泰铢）",
  },
  "roi.result.co2": {
    th: "ตัน CO2 ลด/ปี",
    en: "Tons CO2 Reduced/Year",
    cn: "年减少CO2吨数",
  },
  "roi.savingsPercent": {
    th: "ผลประเมินจากข้อมูลที่กรอก",
    en: "Estimate from entered data",
    cn: "根据输入数据估算",
  },
  "roi.recommend": {
    th: "แพ็คเกจแนะนำ:",
    en: "Recommended Package:",
    cn: "推荐套餐：",
  },
  "roi.cta": { th: "ขอใบเสนอราคา", en: "Get a Quote", cn: "获取报价" },
  "roi.note": {
    th: "* เป็นการประเมินเบื้องต้น ไม่ใช่ใบเสนอราคา ไม่ใช่การรับประกันผลประหยัดหรือระยะคืนทุน และต้องสำรวจหน้างานก่อนออกแบบระบบจริง",
    en: "* Preliminary assessment only. Not a quote or a guarantee of savings or payback. A site survey is required before final system design.",
    cn: "* 仅为初步评估，不是报价，也不保证节省或回本周期。最终系统设计前必须进行现场勘查。",
  },

  /* ─── FAQ ─── */
  "faq.title": {
    th: "คำถามที่พบบ่อย",
    en: "Frequently Asked Questions",
    cn: "常见问题",
  },
  "faq.0.q": {
    th: "Solar Carport ต่างจาก Solar Rooftop อย่างไร?",
    en: "How is Solar Carport different from Solar Rooftop?",
    cn: "太阳能车棚与太阳能屋顶有什么区别？",
  },
  "faq.0.a": {
    th: "Solar Carport ติดตั้งบนโครงสร้างที่จอดรถ ไม่ต้องใช้พื้นที่หลังคาอาคาร เหมาะกับธุรกิจที่มีพื้นที่จอดรถมาก นอกจากผลิตไฟฟ้าแล้วยังให้ร่มเงาและรองรับ EV Charger ได้ทันที ส่วน Solar Rooftop ติดตั้งบนหลังคาอาคารที่มีอยู่แล้ว ต้นทุนต่ำกว่าเพราะไม่ต้องสร้างโครงสร้างใหม่",
    en: "Solar Carport is installed on parking structure, no building roof needed. Ideal for businesses with large parking areas. Besides generating electricity, it provides shade and supports EV Chargers immediately. Solar Rooftop installs on existing building roofs at lower cost since no new structure is needed.",
    cn: "太阳能车棚安装在停车结构上，无需建筑屋顶。适合拥有大型停车区域的企业。除了发电外，还提供遮阳并立即支持电动车充电器。太阳能屋顶安装在现有建筑屋顶上，成本较低，因为不需要新结构。",
  },
  "faq.1.q": {
    th: "ราคาที่แสดงเป็นราคาสุดท้ายหรือไม่?",
    en: "Are the displayed prices final?",
    cn: "显示的价格是最终价格吗？",
  },
  "faq.1.a": {
    th: "ราคาที่แสดงเป็นราคาเริ่มต้นโดยประมาณ ราคาจริงขึ้นอยู่กับหลายปัจจัย เช่น พื้นที่ติดตั้ง รูปแบบโครงสร้าง ชนิดแผง ระบบ Inverter และอุปกรณ์เสริม ทีมงานจะสำรวจหน้างานและจัดทำใบเสนอราคาที่แม่นยำให้ฟรี",
    en: "Displayed prices are approximate starting prices. Actual prices depend on various factors such as installation area, structural design, panel type, inverter system, and accessories. Our team will survey the site and provide an accurate quote for free.",
    cn: "显示的价格为大约起步价。实际价格取决于安装面积、结构设计、面板类型、逆变器系统和配件等多种因素。我们的团队将免费勘察现场并提供准确报价。",
  },
  "faq.2.q": {
    th: "คืนทุนภายในกี่ปี?",
    en: "How many years to payback?",
    cn: "几年可以回本？",
  },
  "faq.2.a": {
    th: "ระยะคืนทุนต้องคำนวณเฉพาะโครงการจากขนาดระบบ ค่าไฟจริง load profile ชั่วโมงแสงแดด อุปกรณ์ และรูปแบบการลงทุน เว็บไซต์ไม่รับประกันผลประหยัดหรือระยะคืนทุน",
    en: "Payback must be calculated for each project from system size, actual bills, load profile, solar resource, equipment, and investment model. The website does not guarantee savings or payback.",
    cn: "回本周期必须根据系统规模、实际电费、负载曲线、日照资源、设备和投资方式按项目计算。网站不保证节省或回本周期。",
  },
  "faq.3.q": {
    th: "รองรับ EV Charger ได้กี่จุด?",
    en: "How many EV Charger points are supported?",
    cn: "支持多少个电动车充电点？",
  },
  "faq.3.a": {
    th: "จำนวนจุดชาร์จต้องกำหนดจาก load profile ความต้องการใช้งาน ความจุระบบ และแบบวิศวกรรมที่อนุมัติ รองรับ AC/DC ได้เมื่ออยู่ในขอบเขตงานและอุปกรณ์ที่ยืนยันแล้ว",
    en: "Charger count must be defined from the load profile, usage needs, system capacity, and approved engineering design. AC/DC support depends on confirmed scope and equipment.",
    cn: "充电点数量必须根据负载曲线、使用需求、系统容量和批准的工程设计确定。交流/直流支持取决于已确认的范围和设备。",
  },
  "faq.4.q": {
    th: "ต้องขออนุญาตหน่วยงานใดบ้าง?",
    en: "Which agencies require permits?",
    cn: "需要哪些机构的许可？",
  },
  "faq.4.a": {
    th: "ทีมงาน SIRINX ดำเนินการขออนุญาตให้ทั้งหมด ได้แก่ ขออนุญาตเชื่อมต่อ กฟน./กฟภ., ขออนุญาตก่อสร้าง (กรณีโครงสร้างใหม่), และจดทะเบียนผู้ผลิตไฟฟ้า (กรณี Net Metering)",
    en: "SIRINX team handles all permits: MEA/PEA connection permits, construction permits (for new structures), and power producer registration (for Net Metering).",
    cn: "SIRINX团队处理所有许可：MEA/PEA连接许可、建筑许可（新结构）和发电商注册（净计量）。",
  },
  "faq.5.q": {
    th: "มีบริการดูแลหลังติดตั้งไหม?",
    en: "Is there post-installation service?",
    cn: "有安装后服务吗？",
  },
  "faq.5.a": {
    th: "มีบริการ O&M ตามขอบเขตและเงื่อนไขสัญญา โดยรายละเอียดการติดตามระบบ การตรวจสอบ และเวลาตอบสนองต้องระบุในใบเสนอราคาหรือสัญญาที่อนุมัติ",
    en: "O&M is available by scope and contract terms. Monitoring, inspection, and response details must be stated in the approved quotation or contract.",
    cn: "可按范围和合同条款提供运维服务。监控、检查和响应细节必须写入批准的报价或合同。",
  },
  "faq.6.q": {
    th: "โครงการขนาดใหญ่ต้องประเมินอย่างไร?",
    en: "How are large projects assessed?",
    cn: "大型项目如何评估？",
  },
  "faq.6.a": {
    th: "เริ่มจากการเก็บข้อมูลพื้นที่ โครงสร้าง load profile ระบบไฟฟ้า ความต้องการ BESS/EV และข้อกำหนดความปลอดภัย จากนั้นทีมวิศวกรจึงจัดทำแบบและข้อเสนอเฉพาะโครงการ",
    en: "Start with site, structural, load-profile, electrical, BESS/EV, and safety data. The engineering team then prepares a project-specific design and proposal.",
    cn: "先收集场地、结构、负载曲线、电气、BESS/电动车和安全数据，再由工程团队制定项目专属设计和方案。",
  },

  /* ─── Brochure Downloads Section ─── */
  "brochure.badge": {
    th: "ดาวน์โหลดโบรชัวร์",
    en: "Download Brochures",
    cn: "下载宣传册",
  },
  "brochure.title": {
    th: "โบรชัวร์เสนอราคาและวิดีโอ",
    en: "Quotation Brochures & Video",
    cn: "报价宣传册和视频",
  },
  "brochure.title.accent": {
    th: "สำหรับทีมขายและลูกค้า",
    en: "For Sales Team & Customers",
    cn: "面向销售团队和客户",
  },
  "brochure.desc": {
    th: "ดาวน์โหลดโบรชัวร์เสนอราคาแพ็คเกจ Start และ Pro พร้อมสเปคอุปกรณ์ครบถ้วน สำหรับนำเสนอลูกค้าหรือแชร์ผ่าน LINE / Facebook",
    en: "Download quotation brochures for Start and Pro packages with complete equipment specs. Perfect for customer presentations or sharing via LINE / Facebook.",
    cn: "下载Start和Pro套餐的报价宣传册，包含完整设备规格。适合客户演示或通过LINE/Facebook分享。",
  },
  "brochure.start.title": {
    th: "Start Package",
    en: "Start Package",
    cn: "Start套餐",
  },
  "brochure.start.price": {
    th: "125,000 THB",
    en: "125,000 THB",
    cn: "125,000泰铢",
  },
  "brochure.pro.title": { th: "Pro Package", en: "Pro Package", cn: "Pro套餐" },
  "brochure.pro.price": {
    th: "310,500 THB",
    en: "310,500 THB",
    cn: "310,500泰铢",
  },
  "brochure.bilingual.title": {
    th: "ภาษาอังกฤษ-ไทย",
    en: "English-Thai",
    cn: "英泰双语",
  },
  "brochure.engineer.title": {
    th: "ฉบับวิศวกร",
    en: "Engineer Edition",
    cn: "工程师版",
  },
  "brochure.english.title": {
    th: "English Only",
    en: "English Only",
    cn: "纯英文版",
  },
  "brochure.video.title": {
    th: "วิดีโอแนะนำ SIRINX",
    en: "SIRINX Introduction Video",
    cn: "SIRINX介绍视频",
  },
  "brochure.video.desc": {
    th: "วิดีโอ 20 วินาที แนะนำระบบโซลาร์เซลล์ครบวงจร พร้อมเสียงบรรยายภาษาไทย",
    en: "20-second video introducing the complete solar system with Thai narration.",
    cn: "20秒视频介绍完整的太阳能系统，配有泰语旁白。",
  },
  "brochure.download": { th: "ดาวน์โหลด", en: "Download", cn: "下载" },
  "brochure.play": { th: "เล่นวิดีโอ", en: "Play Video", cn: "播放视频" },

  /* ─── Final CTA ─── */
  "cta.title": {
    th: "พร้อมเริ่มต้นลดค่าไฟ?",
    en: "Ready to Start Saving?",
    cn: "准备好开始省电了吗？",
  },
  "cta.desc": {
    th: "ทีมงาน SIRINX พร้อมสำรวจหน้างานและจัดทำใบเสนอราคาให้ฟรี — ไม่มีค่าใช้จ่าย ไม่มีข้อผูกมัด",
    en: "SIRINX team is ready to survey your site and provide a free quote — no cost, no obligation.",
    cn: "SIRINX团队随时准备勘察您的场地并提供免费报价 — 无费用，无义务。",
  },
  "cta.survey": {
    th: "นัดสำรวจหน้างานฟรี",
    en: "Schedule Free Site Survey",
    cn: "预约免费现场勘察",
  },
  "cta.details": {
    th: "ดูรายละเอียด Solar Carport",
    en: "View Solar Carport Details",
    cn: "查看太阳能车棚详情",
  },
};

registerPageTranslations("pricing", dict);
export default dict;
