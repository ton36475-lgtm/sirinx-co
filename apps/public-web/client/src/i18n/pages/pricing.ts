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
    th: "Solar Carport โดย SIRINX — ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV Charger พร้อมสิทธิประโยชน์ทางภาษีจากมาตรการรัฐ เลือกแพ็คเกจที่ตอบโจทย์ หรือให้ทีมงานออกแบบเฉพาะทาง",
    en: "Solar Carport by SIRINX — Generate electricity, provide shade, support EV Chargers with government tax incentives. Choose a package that fits or let our team design a custom solution.",
    cn: "SIRINX太阳能车棚 — 发电、遮阳、支持电动车充电，享受政府税收优惠。选择合适的套餐或让我们的团队定制设计。",
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
    th: "บุคคลธรรมดาลดหย่อนสูงสุด 200,000 บาท / นิติบุคคลหักค่าใช้จ่าย 1.5 เท่า (พ.ร.ฎ. ฉบับที่ 805)",
    en: "Individuals deduct up to 200,000 THB / Corporations deduct 1.5x expenses (Royal Decree No. 805)",
    cn: "个人最高减免200,000泰铢 / 法人1.5倍费用扣除（皇家法令第805号）",
  },
  "gov.0.period": {
    th: "มี.ค. 2569 - ธ.ค. 2571",
    en: "Mar 2026 - Dec 2028",
    cn: "2026年3月 - 2028年12月",
  },
  "gov.1.title": {
    th: "มาตรการ EV 3.5",
    en: "EV 3.5 Policy",
    cn: "EV 3.5政策",
  },
  "gov.1.desc": {
    th: "รัฐอุดหนุนรถ EV สูงสุด 50,000 บาท/คัน + ลดภาษีสรรพสามิตเหลือ 2% เป้าหมาย 30% ZEV ภายในปี 2030",
    en: "Government subsidizes EVs up to 50,000 THB/vehicle + excise tax reduced to 2%. Target: 30% ZEV by 2030",
    cn: "政府补贴电动车每辆最高50,000泰铢 + 消费税降至2%。目标：2030年30% ZEV",
  },
  "gov.1.period": {
    th: "2024 - 2027",
    en: "2024 - 2027",
    cn: "2024 - 2027",
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
    th: "ประเทศไทยตั้งเป้า Carbon Neutrality ปี 2050 / Net Zero ปี 2065 — ธุรกิจที่เริ่มก่อนได้เปรียบ",
    en: "Thailand targets Carbon Neutrality by 2050 / Net Zero by 2065 — early movers gain competitive advantage.",
    cn: "泰国目标2050年碳中和 / 2065年净零排放 — 先行者获得竞争优势。",
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
    th: "3 ระดับ",
    en: "3 Tiers",
    cn: "3个级别",
  },
  "pkg.desc": {
    th: "เลือกแพ็คเกจที่เหมาะกับขนาดธุรกิจและงบประมาณ — ราคาเริ่มต้นโดยประมาณ ทีมงานจะสำรวจและเสนอราคาจริงให้ฟรี",
    en: "Choose the package that fits your business size and budget — starting prices are estimates. Our team will survey and provide an accurate quote for free.",
    cn: "选择适合您企业规模和预算的套餐 — 起步价为估算价。我们的团队将免费勘察并提供准确报价。",
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
    th: "เริ่มต้น ~300,000 บาท",
    en: "Starting from ~300,000 THB",
    cn: "起价约300,000泰铢",
  },
  "pkg.start.priceNote": {
    th: "ราคาขึ้นอยู่กับพื้นที่และรูปแบบโครงสร้าง",
    en: "Price depends on area and structural design",
    cn: "价格取决于面积和结构设计",
  },
  "pkg.start.idealFor": {
    th: "ร้านค้า / ร้านอาหาร|ออฟฟิศขนาดเล็ก|คลินิก / สำนักงาน|ที่จอดรถ 5-15 คัน",
    en: "Shops / Restaurants|Small Offices|Clinics / Offices|5-15 Parking Spaces",
    cn: "商店/餐厅|小型办公室|诊所/办公室|5-15个停车位",
  },
  "pkg.start.specs.parking": {
    th: "5-15 คัน",
    en: "5-15 vehicles",
    cn: "5-15辆",
  },
  "pkg.start.specs.evCharger": {
    th: "1-2 จุดชาร์จ",
    en: "1-2 charging points",
    cn: "1-2个充电点",
  },
  "pkg.start.specs.savings": {
    th: "5,000-15,000 บาท/เดือน",
    en: "5,000-15,000 THB/month",
    cn: "5,000-15,000泰铢/月",
  },
  "pkg.start.specs.payback": { th: "4-6 ปี", en: "4-6 years", cn: "4-6年" },
  "pkg.start.specs.lifespan": { th: "25+ ปี", en: "25+ years", cn: "25年以上" },
  "pkg.start.specs.warranty": {
    th: "แผง 25 ปี / Inverter 10 ปี / โครงสร้าง 5 ปี",
    en: "Panels 25 yrs / Inverter 10 yrs / Structure 5 yrs",
    cn: "面板25年/逆变器10年/结构5年",
  },
  "pkg.start.includes": {
    th: "สำรวจหน้างาน + ออกแบบระบบ|โครงสร้างเหล็กชุบกัลวาไนซ์|แผง Tier-1 Mono PERC 550W+|Inverter Sungrow / Huawei|ระบบ Monitoring ผ่านแอป|ติดตั้งโดยทีมวิศวกร|ขออนุญาต กฟน./กฟภ.|รับประกันผลงาน 1 ปี",
    en: "Site survey + system design|Galvanized steel structure|Tier-1 Mono PERC 550W+ panels|Sungrow / Huawei Inverter|App-based monitoring system|Installation by engineering team|MEA/PEA permit processing|1-year workmanship warranty",
    cn: "现场勘察+系统设计|镀锌钢结构|Tier-1 Mono PERC 550W+面板|Sungrow/华为逆变器|应用监控系统|工程团队安装|MEA/PEA许可办理|1年施工保修",
  },
  "pkg.start.evReady": {
    th: "Pre-wired สำหรับ EV Charger 1-2 จุด",
    en: "Pre-wired for 1-2 EV Charger points",
    cn: "预布线1-2个电动车充电点",
  },

  /* ─── Package: Pro ─── */
  "pkg.pro.subtitle": {
    th: "ธุรกิจขนาดกลาง",
    en: "Medium Business",
    cn: "中型企业",
  },
  "pkg.pro.price": {
    th: "เริ่มต้น ~840,000 บาท",
    en: "Starting from ~840,000 THB",
    cn: "起价约840,000泰铢",
  },
  "pkg.pro.priceNote": {
    th: "ราคาลดลงตามขนาดระบบ (economy of scale)",
    en: "Price decreases with system size (economy of scale)",
    cn: "价格随系统规模降低（规模经济）",
  },
  "pkg.pro.idealFor": {
    th: "โรงแรม / รีสอร์ท|สถานศึกษา|อาคารพาณิชย์|ที่จอดรถ 15-50 คัน",
    en: "Hotels / Resorts|Educational Institutions|Commercial Buildings|15-50 Parking Spaces",
    cn: "酒店/度假村|教育机构|商业建筑|15-50个停车位",
  },
  "pkg.pro.specs.parking": {
    th: "15-50 คัน",
    en: "15-50 vehicles",
    cn: "15-50辆",
  },
  "pkg.pro.specs.evCharger": {
    th: "3-10 จุดชาร์จ",
    en: "3-10 charging points",
    cn: "3-10个充电点",
  },
  "pkg.pro.specs.savings": {
    th: "15,000-50,000 บาท/เดือน",
    en: "15,000-50,000 THB/month",
    cn: "15,000-50,000泰铢/月",
  },
  "pkg.pro.specs.payback": {
    th: "3-5 ปี",
    en: "3-5 years",
    cn: "3-5年",
  },
  "pkg.pro.specs.lifespan": { th: "25+ ปี", en: "25+ years", cn: "25年以上" },
  "pkg.pro.specs.warranty": {
    th: "แผง 25 ปี / Inverter 10 ปี / โครงสร้าง 5 ปี",
    en: "Panels 25 yrs / Inverter 10 yrs / Structure 5 yrs",
    cn: "面板25年/逆变器10年/结构5年",
  },
  "pkg.pro.includes": {
    th: "ทุกอย่างใน Start|BESS Option (กักเก็บพลังงาน)|AI Energy Monitoring Dashboard|EV Charger 3-10 จุด (AC Type 2)|รายงาน ROI รายเดือน|O&M ดูแลรักษา 1 ปี|ประสานงาน BOI / ลดหย่อนภาษี|ใบรับรอง Carbon Credit",
    en: "Everything in Start|BESS Option (energy storage)|AI Energy Monitoring Dashboard|EV Charger 3-10 points (AC Type 2)|Monthly ROI reports|1-year O&M service|BOI / tax deduction coordination|Carbon Credit certificate",
    cn: "Start的所有内容|BESS选项（储能）|AI能源监控仪表板|电动车充电器3-10点（AC Type 2）|月度ROI报告|1年运维服务|BOI/税收减免协调|碳信用证书",
  },
  "pkg.pro.evReady": {
    th: "ติดตั้ง EV Charger พร้อมใช้ 3-10 จุด รองรับ AC Type 2",
    en: "EV Charger installed, 3-10 points ready, AC Type 2 compatible",
    cn: "安装电动车充电器，3-10点就绪，兼容AC Type 2",
  },

  /* ─── Package: Enterprise ─── */
  "pkg.enterprise.subtitle": {
    th: "ธุรกิจขนาดใหญ่ / โครงการพิเศษ",
    en: "Large Enterprise / Custom Projects",
    cn: "大型企业/定制项目",
  },
  "pkg.enterprise.price": {
    th: "เริ่มต้น ~2,500,000 บาท",
    en: "Starting from ~2,500,000 THB",
    cn: "起价约2,500,000泰铢",
  },
  "pkg.enterprise.priceNote": {
    th: "ราคาต่อวัตต์ต่ำสุด ยิ่งใหญ่ยิ่งคุ้ม — รองรับ 500+ kWp",
    en: "Lowest cost per watt — bigger means better value — supports 500+ kWp",
    cn: "每瓦成本最低 — 越大越划算 — 支持500+ kWp",
  },
  "pkg.enterprise.idealFor": {
    th: "โรงงานอุตสาหกรรม|ห้างสรรพสินค้า|คลังสินค้า / โลจิสติกส์|นิคมอุตสาหกรรม|หน่วยงานราชการ|ที่จอดรถ 50-200+ คัน",
    en: "Industrial Factories|Shopping Malls|Warehouses / Logistics|Industrial Estates|Government Agencies|50-200+ Parking Spaces",
    cn: "工业工厂|购物中心|仓库/物流|工业园区|政府机构|50-200+个停车位",
  },
  "pkg.enterprise.specs.parking": {
    th: "50-200+ คัน",
    en: "50-200+ vehicles",
    cn: "50-200+辆",
  },
  "pkg.enterprise.specs.evCharger": {
    th: "10-50 จุดชาร์จ",
    en: "10-50 charging points",
    cn: "10-50个充电点",
  },
  "pkg.enterprise.specs.savings": {
    th: "50,000-250,000+ บาท/เดือน",
    en: "50,000-250,000+ THB/month",
    cn: "50,000-250,000+泰铢/月",
  },
  "pkg.enterprise.specs.payback": {
    th: "3-5 ปี",
    en: "3-5 years",
    cn: "3-5年",
  },
  "pkg.enterprise.specs.lifespan": {
    th: "25+ ปี",
    en: "25+ years",
    cn: "25年以上",
  },
  "pkg.enterprise.specs.warranty": {
    th: "แผง 25 ปี / Inverter 10 ปี / โครงสร้าง 10 ปี",
    en: "Panels 25 yrs / Inverter 10 yrs / Structure 10 yrs",
    cn: "面板25年/逆变器10年/结构10年",
  },
  "pkg.enterprise.includes": {
    th: "ทุกอย่างใน Pro|แผง Bifacial ประสิทธิภาพสูง|BESS ระบบกักเก็บพลังงาน|DC Fast Charger (CCS2) Option|AI Predictive Maintenance|O&M Contract 3-5 ปี|ที่ปรึกษา ESG / Carbon Credit|รายงานผลกระทบสิ่งแวดล้อม|ออกแบบระบบเฉพาะทาง (Custom Engineering)",
    en: "Everything in Pro|High-efficiency Bifacial panels|BESS energy storage system|DC Fast Charger (CCS2) Option|AI Predictive Maintenance|3-5 year O&M Contract|ESG / Carbon Credit consulting|Environmental impact report|Custom engineering design",
    cn: "Pro的所有内容|高效双面面板|BESS储能系统|DC快充（CCS2）选项|AI预测性维护|3-5年运维合同|ESG/碳信用咨询|环境影响报告|定制工程设计",
  },
  "pkg.enterprise.evReady": {
    th: "ติดตั้ง EV Charger ทั้ง AC/DC Fast Charge รองรับ 10-50 จุด",
    en: "EV Charger installed, AC/DC Fast Charge, 10-50 points",
    cn: "安装电动车充电器，AC/DC快充，10-50点",
  },

  /* ─── Advantages ─── */
  "adv.title": {
    th: "ข้อดีของ Solar Carport",
    en: "Advantages of Solar Carport",
    cn: "太阳能车棚的优势",
  },
  "adv.title.accent": {
    th: "ที่ไม่ควรมองข้าม",
    en: "You Shouldn't Overlook",
    cn: "不容忽视",
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
  "compare.row.0.s": { th: "10-30 kWp", en: "10-30 kWp", cn: "10-30 kWp" },
  "compare.row.0.m": { th: "30-100 kWp", en: "30-100 kWp", cn: "30-100 kWp" },
  "compare.row.0.l": {
    th: "100-500+ kWp",
    en: "100-500+ kWp",
    cn: "100-500+ kWp",
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
  "compare.row.2.s": { th: "1-2 จุด", en: "1-2 points", cn: "1-2点" },
  "compare.row.2.m": { th: "3-10 จุด", en: "3-10 points", cn: "3-10点" },
  "compare.row.2.l": { th: "10-50 จุด", en: "10-50 points", cn: "10-50点" },
  "compare.row.3.label": {
    th: "ประหยัดค่าไฟ/เดือน",
    en: "Monthly Savings",
    cn: "月节省",
  },
  "compare.row.3.s": {
    th: "5,000-15,000 บาท",
    en: "5,000-15,000 THB",
    cn: "5,000-15,000泰铢",
  },
  "compare.row.3.m": {
    th: "15,000-50,000 บาท",
    en: "15,000-50,000 THB",
    cn: "15,000-50,000泰铢",
  },
  "compare.row.3.l": {
    th: "50,000-250,000+ บาท",
    en: "50,000-250,000+ THB",
    cn: "50,000-250,000+泰铢",
  },
  "compare.row.4.label": { th: "คืนทุน", en: "Payback", cn: "回本" },
  "compare.row.4.s": { th: "4-6 ปี", en: "4-6 years", cn: "4-6年" },
  "compare.row.4.m": {
    th: "3-5 ปี",
    en: "3-5 years",
    cn: "3-5年",
  },
  "compare.row.4.l": {
    th: "3-5 ปี",
    en: "3-5 years",
    cn: "3-5年",
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
  "compare.row.8.s": { th: "1 ปี", en: "1 year", cn: "1年" },
  "compare.row.8.m": { th: "1 ปี", en: "1 year", cn: "1年" },
  "compare.row.8.l": { th: "3-5 ปี", en: "3-5 years", cn: "3-5年" },
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
    th: "~300,000 บาท",
    en: "~300,000 THB",
    cn: "约300,000泰铢",
  },
  "compare.row.10.m": {
    th: "~840,000 บาท",
    en: "~840,000 THB",
    cn: "约840,000泰铢",
  },
  "compare.row.10.l": {
    th: "~2,500,000 บาท",
    en: "~2,500,000 THB",
    cn: "约2,500,000泰铢",
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
    th: "O&M + AI Monitoring ตลอด 25 ปี",
    en: "O&M + AI Monitoring for 25 years",
    cn: "25年运维+AI监控",
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
    th: "กรอกข้อมูลค่าไฟและจำนวนที่จอดรถ เพื่อดูผลประหยัดและระยะเวลาคืนทุนโดยประมาณ",
    en: "Enter your electricity bill and parking spaces to see estimated savings and payback period.",
    cn: "输入您的电费和停车位数量，查看预估节省和回本周期。",
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
    th: "ประหยัดรวม 25 ปี (บาท)",
    en: "Total Savings 25 Years (THB)",
    cn: "25年总节省（泰铢）",
  },
  "roi.result.co2": {
    th: "ตัน CO2 ลด/ปี",
    en: "Tons CO2 Reduced/Year",
    cn: "年减少CO2吨数",
  },
  "roi.savingsPercent": {
    th: "ลดค่าไฟได้ประมาณ",
    en: "Estimated Electricity Savings",
    cn: "预估电费节省",
  },
  "roi.recommend": {
    th: "แพ็คเกจแนะนำ:",
    en: "Recommended Package:",
    cn: "推荐套餐：",
  },
  "roi.cta": { th: "ขอใบเสนอราคา", en: "Get a Quote", cn: "获取报价" },
  "roi.note": {
    th: "* ผลคำนวณเป็นค่าประมาณการเบื้องต้น ผลลัพธ์จริงขึ้นอยู่กับทิศทางแสงแดด พื้นที่ และรูปแบบการใช้ไฟ",
    en: "* Calculations are preliminary estimates. Actual results depend on sun direction, area, and electricity usage patterns.",
    cn: "* 计算为初步估算。实际结果取决于日照方向、面积和用电模式。",
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
    th: "โดยเฉลี่ย Solar Carport คืนทุนภายใน 3-6 ปี ขึ้นอยู่กับขนาดระบบ ค่าไฟปัจจุบัน และชั่วโมงแสงแดดในพื้นที่ ระบบมีอายุใช้งาน 25+ ปี หมายความว่าหลังคืนทุนแล้วจะได้ไฟฟ้าฟรีอีก 19-22 ปี",
    en: "On average, Solar Carport pays back within 3-6 years depending on system size, current electricity costs, and sunlight hours. The system lasts 25+ years, meaning free electricity for 19-22 years after payback.",
    cn: "平均而言，太阳能车棚在3-6年内回本，取决于系统规模、当前电费和日照时数。系统使用寿命25年以上，意味着回本后还有19-22年的免费电力。",
  },
  "faq.3.q": {
    th: "รองรับ EV Charger ได้กี่จุด?",
    en: "How many EV Charger points are supported?",
    cn: "支持多少个电动车充电点？",
  },
  "faq.3.a": {
    th: "ขึ้นอยู่กับขนาดระบบ — Start รองรับ 1-2 จุด, Pro รองรับ 3-10 จุด, Enterprise รองรับ 10-50 จุด ทั้ง AC Type 2 และ DC Fast Charge (CCS2) สามารถเพิ่มจุดชาร์จในภายหลังได้",
    en: "Depends on system size — Start supports 1-2 points, Pro supports 3-10 points, Enterprise supports 10-50 points. Both AC Type 2 and DC Fast Charge (CCS2). Additional points can be added later.",
    cn: "取决于系统规模 — Start支持1-2点，Pro支持3-10点，Enterprise支持10-50点。支持AC Type 2和DC快充（CCS2）。可以后续增加充电点。",
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
    th: "มีครับ ทุกแพ็คเกจรวมบริการ O&M (Operation & Maintenance) ตั้งแต่ 1-5 ปีตามขนาดระบบ รวมถึง AI Monitoring ตรวจสอบประสิทธิภาพ 24/7 และ Predictive Maintenance ป้องกันปัญหาก่อนเกิด",
    en: "Yes, all packages include O&M (Operation & Maintenance) service from 1-5 years depending on system size, including 24/7 AI Monitoring and Predictive Maintenance to prevent issues before they occur.",
    cn: "是的，所有套餐包含1-5年的运维服务（取决于系统规模），包括24/7 AI监控和预测性维护，在问题发生前预防。",
  },
  "faq.6.q": {
    th: "ขนาดใหญ่กว่า 500 kWp ทำได้ไหม?",
    en: "Can you handle projects larger than 500 kWp?",
    cn: "能做500 kWp以上的项目吗？",
  },
  "faq.6.a": {
    th: "ได้ครับ แพ็คเกจ Enterprise รองรับโครงการขนาดใหญ่ตั้งแต่ 100 kWp ขึ้นไป สำหรับโครงการที่ใหญ่กว่า 500 kWp เราจะจัดทีมวิศวกรเข้าสำรวจหน้างานและออกแบบระบบเฉพาะทาง กรุณาติดต่อทีมงานโดยตรง",
    en: "Yes, the Enterprise package supports large projects from 100 kWp and above. For projects larger than 500 kWp, we assign an engineering team for on-site survey and custom system design. Please contact our team directly.",
    cn: "可以，Enterprise套餐支持100 kWp以上的大型项目。对于500 kWp以上的项目，我们将派工程团队进行现场勘察和定制系统设计。请直接联系我们的团队。",
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
