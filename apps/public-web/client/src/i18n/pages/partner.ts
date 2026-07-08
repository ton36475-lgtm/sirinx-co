import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  "partner.toast.success": {
    th: "ส่งข้อมูลเรียบร้อยแล้ว ทีมพัฒนาธุรกิจจะติดต่อกลับภายใน 48 ชั่วโมง",
    en: "Submitted. The business development team will contact you within 48 hours.",
    cn: "已提交。业务发展团队将在48小时内与您联系。",
  },
  "partner.toast.error": {
    th: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
    en: "Something went wrong. Please try again.",
    cn: "发生错误，请重试。",
  },
  "partner.form.interestPrefix": {
    th: "พันธมิตร",
    en: "Partner inquiry",
    cn: "合作咨询",
  },
  "partner.form.message.type": { th: "ประเภท", en: "Type", cn: "类型" },
  "partner.form.message.range": { th: "งบลงทุน", en: "Investment range", cn: "投资规模" },

  "partner.success.title": {
    th: "ขอบคุณสำหรับความสนใจ",
    en: "Thank You for Your Interest",
    cn: "感谢您的关注",
  },
  "partner.success.desc": {
    th: "ทีมพัฒนาธุรกิจของ SIRINX จะตรวจสอบข้อมูลและติดต่อกลับภายใน 48 ชั่วโมงทำการ",
    en: "The SIRINX business development team will review your information and respond within 48 business hours.",
    cn: "SIRINX 业务发展团队将审核您的信息，并在48个工作小时内回复。",
  },
  "partner.success.home": { th: "กลับหน้าหลัก", en: "Back to Home", cn: "返回首页" },
  "partner.success.investment": {
    th: "ศึกษาข้อมูลการลงทุน",
    en: "Review Investment Information",
    cn: "查看投资信息",
  },

  "partner.hero.eyebrow": {
    th: "Partners & Investors",
    en: "Partners & Investors",
    cn: "合作伙伴与投资者",
  },
  "partner.hero.title": {
    th: "เติบโตไปด้วยกัน",
    en: "Grow Together",
    cn: "共同成长",
  },
  "partner.hero.accent": {
    th: "ในตลาดพลังงานสะอาด",
    en: "in Clean Energy",
    cn: "在清洁能源市场",
  },
  "partner.hero.desc": {
    th: "ร่วมเป็นส่วนหนึ่งของการเปลี่ยนผ่านพลังงานของประเทศไทย ไม่ว่าจะเป็นนักลงทุน พันธมิตรธุรกิจ หรือ EPC Partner",
    en: "Join Thailand's energy transition as an investor, business partner, or EPC partner.",
    cn: "作为投资者、业务伙伴或 EPC 伙伴，参与泰国能源转型。",
  },

  "partner.market.stat1": {
    th: "เป้าหมายพลังงานหมุนเวียน 2580",
    en: "Renewable energy target by 2037",
    cn: "2037年可再生能源目标",
  },
  "partner.market.stat2": {
    th: "อัตราเติบโตตลาด Solar ไทย/ปี",
    en: "Thailand solar market growth per year",
    cn: "泰国太阳能市场年增长率",
  },
  "partner.market.stat3": {
    th: "มูลค่าตลาดพลังงานสะอาดไทย",
    en: "Thailand clean energy market value",
    cn: "泰国清洁能源市场规模",
  },
  "partner.market.stat4": {
    th: "ผลตอบแทน IRR เฉลี่ยโครงการ",
    en: "Average project IRR range",
    cn: "项目平均 IRR 区间",
  },

  "partner.types.title": {
    th: "รูปแบบความร่วมมือ",
    en: "Partnership Models",
    cn: "合作模式",
  },
  "partner.types.desc": {
    th: "เลือกรูปแบบที่เหมาะกับองค์กรของคุณ",
    en: "Choose the model that fits your organization.",
    cn: "选择适合您组织的合作方式。",
  },
  "partner.types.idealLabel": {
    th: "เหมาะสำหรับ:",
    en: "Ideal for:",
    cn: "适合：",
  },

  "partner.type.investor.title": { th: "นักลงทุน", en: "Investor", cn: "投资者" },
  "partner.type.investor.desc": {
    th: "ร่วมลงทุนในโครงการพลังงานสะอาดที่ให้ผลตอบแทนมั่นคงและยั่งยืน",
    en: "Co-invest in clean energy projects designed for stable, long-term returns.",
    cn: "共同投资旨在带来稳定长期回报的清洁能源项目。",
  },
  "partner.type.investor.benefit1": {
    th: "ผลตอบแทน IRR 8-15% ต่อปี",
    en: "Estimated 8-15% annual IRR",
    cn: "预估年化 IRR 8-15%",
  },
  "partner.type.investor.benefit2": {
    th: "สัญญา PPA ระยะยาว 20-25 ปี",
    en: "Long-term 20-25 year PPA structures",
    cn: "20-25年长期 PPA 架构",
  },
  "partner.type.investor.benefit3": {
    th: "รายงานผลตอบแทนรายเดือน",
    en: "Monthly performance reporting",
    cn: "每月绩效报告",
  },
  "partner.type.investor.benefit4": {
    th: "ทีมบริหารโครงการมืออาชีพ",
    en: "Professional project management",
    cn: "专业项目管理团队",
  },
  "partner.type.investor.benefit5": {
    th: "ความเสี่ยงต่ำจาก revenue certainty",
    en: "Lower risk through revenue visibility",
    cn: "通过收入可见性降低风险",
  },
  "partner.type.investor.ideal": {
    th: "กองทุน, Family Office, นักลงทุนสถาบัน",
    en: "Funds, family offices, institutional investors",
    cn: "基金、家族办公室、机构投资者",
  },

  "partner.type.business.title": {
    th: "พันธมิตรธุรกิจ",
    en: "Business Partner",
    cn: "业务伙伴",
  },
  "partner.type.business.desc": {
    th: "ร่วมเป็นพันธมิตรในการขยายตลาดพลังงานสะอาดทั่วประเทศ",
    en: "Partner with SIRINX to expand clean energy coverage across Thailand.",
    cn: "与 SIRINX 合作，在泰国扩展清洁能源市场。",
  },
  "partner.type.business.benefit1": {
    th: "ส่วนแบ่งรายได้ที่ยุติธรรม",
    en: "Fair revenue-sharing structure",
    cn: "公平的收入分成结构",
  },
  "partner.type.business.benefit2": {
    th: "การสนับสนุนทางเทคนิคเต็มรูปแบบ",
    en: "Full technical support",
    cn: "完整技术支持",
  },
  "partner.type.business.benefit3": {
    th: "การฝึกอบรมทีมงาน",
    en: "Team training and enablement",
    cn: "团队培训与赋能",
  },
  "partner.type.business.benefit4": {
    th: "แบรนด์ร่วมและการตลาด",
    en: "Co-branding and market support",
    cn: "联合品牌与市场支持",
  },
  "partner.type.business.benefit5": {
    th: "เข้าถึงเทคโนโลยี AI Energy",
    en: "Access to AI Energy technology",
    cn: "接入 AI Energy 技术",
  },
  "partner.type.business.ideal": {
    th: "ผู้พัฒนาอสังหาฯ, นิคมอุตสาหกรรม, ตัวแทนจำหน่าย",
    en: "Developers, industrial estates, distributors",
    cn: "开发商、工业园区、经销商",
  },

  "partner.type.epc.title": { th: "EPC Partner", en: "EPC Partner", cn: "EPC 伙伴" },
  "partner.type.epc.desc": {
    th: "ร่วมงานในฐานะผู้รับเหมาติดตั้งหรือซัพพลายเออร์อุปกรณ์",
    en: "Work with SIRINX as an installation contractor or equipment supplier.",
    cn: "作为安装承包商或设备供应商与 SIRINX 合作。",
  },
  "partner.type.epc.benefit1": {
    th: "โครงการต่อเนื่องตลอดปี",
    en: "Year-round project pipeline",
    cn: "全年项目机会",
  },
  "partner.type.epc.benefit2": {
    th: "มาตรฐานการทำงานชัดเจน",
    en: "Clear delivery standards",
    cn: "明确交付标准",
  },
  "partner.type.epc.benefit3": {
    th: "การชำระเงินตรงเวลา",
    en: "On-time payment discipline",
    cn: "按时付款机制",
  },
  "partner.type.epc.benefit4": {
    th: "โอกาสเติบโตร่วมกัน",
    en: "Shared growth opportunities",
    cn: "共同成长机会",
  },
  "partner.type.epc.benefit5": {
    th: "Training & Certification",
    en: "Training and certification",
    cn: "培训与认证",
  },
  "partner.type.epc.ideal": {
    th: "ผู้รับเหมาไฟฟ้า, ซัพพลายเออร์แผงโซลาร์, ผู้ผลิต BESS",
    en: "Electrical contractors, solar suppliers, BESS manufacturers",
    cn: "电气承包商、太阳能供应商、BESS 制造商",
  },

  "partner.form.title": {
    th: "แบบฟอร์มสอบถามความร่วมมือ",
    en: "Partnership Inquiry Form",
    cn: "合作咨询表",
  },
  "partner.form.desc": {
    th: "ทีมพัฒนาธุรกิจจะติดต่อกลับภายใน 48 ชั่วโมงทำการ",
    en: "The business development team will respond within 48 business hours.",
    cn: "业务发展团队将在48个工作小时内回复。",
  },
  "partner.form.name": { th: "ชื่อ-นามสกุล *", en: "Full name *", cn: "姓名 *" },
  "partner.form.namePlaceholder": { th: "ชื่อของคุณ", en: "Your name", cn: "您的姓名" },
  "partner.form.company": {
    th: "บริษัท/องค์กร *",
    en: "Company / Organization *",
    cn: "公司/组织 *",
  },
  "partner.form.companyPlaceholder": {
    th: "ชื่อบริษัท",
    en: "Company name",
    cn: "公司名称",
  },
  "partner.form.email": { th: "อีเมล *", en: "Email *", cn: "电子邮件 *" },
  "partner.form.phone": { th: "เบอร์โทร", en: "Phone", cn: "电话" },
  "partner.form.type": {
    th: "ประเภทความร่วมมือ *",
    en: "Partnership type *",
    cn: "合作类型 *",
  },
  "partner.form.type.empty": { th: "เลือกประเภท", en: "Select type", cn: "选择类型" },
  "partner.form.type.investor": { th: "นักลงทุน", en: "Investor", cn: "投资者" },
  "partner.form.type.business": {
    th: "พันธมิตรธุรกิจ",
    en: "Business partner",
    cn: "业务伙伴",
  },
  "partner.form.type.epc": { th: "EPC Partner", en: "EPC Partner", cn: "EPC 伙伴" },
  "partner.form.type.other": { th: "อื่น ๆ", en: "Other", cn: "其他" },
  "partner.form.range": {
    th: "ขนาดการลงทุน/ร่วมมือ",
    en: "Investment / partnership size",
    cn: "投资/合作规模",
  },
  "partner.form.range.empty": { th: "เลือกขนาด", en: "Select range", cn: "选择规模" },
  "partner.form.range.small": {
    th: "ต่ำกว่า 10 ล้านบาท",
    en: "Under THB 10M",
    cn: "低于1000万泰铢",
  },
  "partner.form.range.medium": {
    th: "10-50 ล้านบาท",
    en: "THB 10-50M",
    cn: "1000万-5000万泰铢",
  },
  "partner.form.range.large": {
    th: "50-200 ล้านบาท",
    en: "THB 50-200M",
    cn: "5000万-2亿泰铢",
  },
  "partner.form.range.xlarge": {
    th: "มากกว่า 200 ล้านบาท",
    en: "Over THB 200M",
    cn: "超过2亿泰铢",
  },
  "partner.form.message": { th: "ข้อความ", en: "Message", cn: "留言" },
  "partner.form.messagePlaceholder": {
    th: "รายละเอียดเกี่ยวกับความร่วมมือที่สนใจ",
    en: "Share details about the partnership you are considering",
    cn: "请说明您感兴趣的合作详情",
  },
  "partner.form.submit": { th: "ส่งข้อมูล", en: "Submit Inquiry", cn: "提交信息" },
  "partner.form.privacy": {
    th: "ข้อมูลของคุณจะถูกเก็บเป็นความลับ ใช้เพื่อการติดต่อกลับเท่านั้น",
    en: "Your information is kept confidential and used only for follow-up.",
    cn: "您的信息将被保密，仅用于后续联系。",
  },

  "partner.sidebar.whyTitle": {
    th: "ทำไมร่วมงานกับ SIRINX",
    en: "Why Work With SIRINX",
    cn: "为什么选择 SIRINX",
  },
  "partner.sidebar.trust1": {
    th: "ผลงาน 150+ โครงการทั่วประเทศ",
    en: "150+ project references nationwide",
    cn: "全国150+项目经验",
  },
  "partner.sidebar.trust2": {
    th: "เทคโนโลยี AI Energy ล้ำสมัย",
    en: "Advanced AI Energy technology",
    cn: "先进 AI Energy 技术",
  },
  "partner.sidebar.trust3": {
    th: "ทีมวิศวกรมืออาชีพ 50+ คน",
    en: "50+ professional engineering team members",
    cn: "50+专业工程团队成员",
  },
  "partner.sidebar.trust4": {
    th: "ดูแลระบบตลอดอายุ 25 ปี",
    en: "25-year lifecycle support",
    cn: "25年生命周期支持",
  },
  "partner.sidebar.processTitle": {
    th: "ขั้นตอนการพิจารณา",
    en: "Review Process",
    cn: "评估流程",
  },
  "partner.sidebar.step1.title": {
    th: "ส่งข้อมูลเบื้องต้น",
    en: "Submit initial information",
    cn: "提交初步信息",
  },
  "partner.sidebar.step1.time": { th: "วันนี้", en: "Today", cn: "今天" },
  "partner.sidebar.step2.title": {
    th: "ทีม BD ติดต่อกลับ",
    en: "BD team follow-up",
    cn: "业务团队联系",
  },
  "partner.sidebar.step2.time": {
    th: "ภายใน 48 ชม.",
    en: "Within 48 hrs",
    cn: "48小时内",
  },
  "partner.sidebar.step3.title": {
    th: "ประชุมนำเสนอโอกาส",
    en: "Opportunity review meeting",
    cn: "机会评估会议",
  },
  "partner.sidebar.step3.time": {
    th: "ภายใน 1 สัปดาห์",
    en: "Within 1 week",
    cn: "1周内",
  },
  "partner.sidebar.step4.title": {
    th: "Due Diligence & MOU",
    en: "Due Diligence & MOU",
    cn: "尽调与 MOU",
  },
  "partner.sidebar.step4.time": {
    th: "ตามข้อตกลง",
    en: "By agreement",
    cn: "按协议",
  },
  "partner.sidebar.disclaimerLabel": {
    th: "Disclaimer",
    en: "Disclaimer",
    cn: "免责声明",
  },
  "partner.sidebar.disclaimer": {
    th: "ตัวเลขผลตอบแทนที่แสดงเป็นค่าประมาณการจากโครงการในอดีต ผลตอบแทนจริงอาจแตกต่างขึ้นอยู่กับเงื่อนไขเฉพาะของแต่ละโครงการ การลงทุนมีความเสี่ยง ผู้ลงทุนควรศึกษาข้อมูลก่อนตัดสินใจ",
    en: "Displayed return figures are estimates based on past projects. Actual returns may vary by project conditions. Investment involves risk and should be reviewed carefully before making a decision.",
    cn: "显示的回报数据基于过往项目估算。实际回报可能因项目条件而异。投资存在风险，决策前应仔细审阅资料。",
  },

  "partner.cta.title": {
    th: "ต้องการข้อมูลเพิ่มเติม?",
    en: "Need More Information?",
    cn: "需要更多信息？",
  },
  "partner.cta.desc": {
    th: "ศึกษารูปแบบการลงทุนและผลงานของเราเพิ่มเติม",
    en: "Review our investment models and project references.",
    cn: "了解我们的投资模式和项目案例。",
  },
  "partner.cta.investment": {
    th: "ข้อมูลการลงทุน",
    en: "Investment Information",
    cn: "投资信息",
  },
  "partner.cta.projects": { th: "ดูผลงาน", en: "View Projects", cn: "查看项目" },
  "partner.cta.line": {
    th: "เพิ่มเพื่อน LINE Official",
    en: "Add LINE Official",
    cn: "添加 LINE 官方账号",
  },
  "partner.cta.lineAria": {
    th: "เพิ่มเพื่อน SIRINX ผ่าน LINE Official",
    en: "Add SIRINX through LINE Official",
    cn: "通过 LINE 官方账号添加 SIRINX",
  },
};

registerPageTranslations("partner", dict);

export default dict;
