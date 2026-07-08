import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  "blog.hero.eyebrow": {
    th: "Blog & Insights",
    en: "Blog & Insights",
    cn: "博客与洞察",
  },
  "blog.hero.titleLead": {
    th: "บทความ",
    en: "Articles",
    cn: "文章",
  },
  "blog.hero.titleAccent": {
    th: "และข้อมูลเชิงลึก",
    en: " & Insights",
    cn: "与洞察",
  },
  "blog.hero.desc": {
    th: "ความรู้ด้านพลังงานสะอาด เทคโนโลยี กลยุทธ์ทางธุรกิจ และข้อมูลตลาดจากทีมวิศวกรและที่ปรึกษาของ SIRINX",
    en: "Clean energy knowledge, technology updates, business strategy, and market insight from SIRINX engineers and advisors.",
    cn: "来自 SIRINX 工程师与顾问团队的清洁能源知识、技术趋势、商业策略与市场洞察。",
  },
  "blog.search.placeholder": {
    th: "ค้นหาบทความ... เช่น ROI, BESS, ESG",
    en: "Search articles... such as ROI, BESS, ESG",
    cn: "搜索文章... 例如 ROI、BESS、ESG",
  },
  "blog.category.all": { th: "ทั้งหมด", en: "All", cn: "全部" },
  "blog.category.solarTech": {
    th: "เทคโนโลยีโซลาร์",
    en: "Solar Technology",
    cn: "太阳能技术",
  },
  "blog.category.energyMgmt": {
    th: "การจัดการพลังงาน",
    en: "Energy Management",
    cn: "能源管理",
  },
  "blog.category.investment": {
    th: "การลงทุนและภาษี",
    en: "Investment & Tax",
    cn: "投资与税务",
  },
  "blog.category.industry": {
    th: "ข้อมูลอุตสาหกรรม",
    en: "Industry Insights",
    cn: "行业洞察",
  },
  "blog.category.esg": {
    th: "ESG และความยั่งยืน",
    en: "ESG & Sustainability",
    cn: "ESG 与可持续发展",
  },
  "blog.featured.title": {
    th: "บทความแนะนำ",
    en: "Recommended Articles",
    cn: "推荐文章",
  },
  "blog.all.title": {
    th: "บทความทั้งหมด",
    en: "All Articles",
    cn: "全部文章",
  },
  "blog.all.fallback": {
    th: "บทความ",
    en: "Articles",
    cn: "文章",
  },
  "blog.all.countSuffix": {
    th: "บทความ",
    en: "articles",
    cn: "篇文章",
  },
  "blog.empty": {
    th: "ไม่พบบทความที่ตรงกับคำค้นหา",
    en: "No articles matched your search.",
    cn: "未找到符合搜索条件的文章。",
  },
  "blog.calculator.eyebrow": {
    th: "เครื่องมือฟรี",
    en: "Free Tool",
    cn: "免费工具",
  },
  "blog.calculator.title": {
    th: "คำนวณระบบโซลาร์ + BESS ของคุณ",
    en: "Calculate Your Solar + BESS System",
    cn: "计算您的太阳能 + BESS 系统",
  },
  "blog.calculator.desc": {
    th: "ใช้เครื่องมือคำนวณขั้นสูงของ SIRINX ประเมินขนาดระบบ ผลตอบแทน และระยะเวลาคืนทุน ฟรี ไม่ต้องลงทะเบียน",
    en: "Use SIRINX's advanced calculator to estimate system size, return profile, and payback period without registration.",
    cn: "使用 SIRINX 高级计算工具评估系统容量、投资回报与回本周期，无需注册。",
  },
  "blog.calculator.cta": {
    th: "เริ่มคำนวณเลย",
    en: "Start Calculating",
    cn: "开始计算",
  },
  "blog.metric.savings.label": {
    th: "ค่าไฟที่ประหยัดได้",
    en: "Estimated Savings",
    cn: "预计节省电费",
  },
  "blog.metric.savings.value": {
    th: "รายไซต์",
    en: "Site-based",
    cn: "按现场评估",
  },
  "blog.metric.savings.sub": {
    th: "Solar + BESS",
    en: "Solar + BESS",
    cn: "太阳能 + BESS",
  },
  "blog.metric.payback.label": {
    th: "คืนทุนเฉลี่ย",
    en: "Payback Range",
    cn: "回本周期",
  },
  "blog.metric.payback.value": {
    th: "ประเมิน",
    en: "Estimated",
    cn: "评估值",
  },
  "blog.metric.payback.sub": {
    th: "ตามข้อมูลจริง",
    en: "Based on real data",
    cn: "基于真实数据",
  },
  "blog.metric.lifespan.label": {
    th: "อายุระบบ",
    en: "System Lifetime",
    cn: "系统寿命",
  },
  "blog.metric.lifespan.value": {
    th: "25+ ปี",
    en: "25+ years",
    cn: "25年以上",
  },
  "blog.metric.lifespan.sub": {
    th: "รับประกันผลผลิต",
    en: "Performance warranty",
    cn: "发电表现保障",
  },
  "blog.metric.co2.label": {
    th: "ลด CO₂",
    en: "CO₂ Reduction",
    cn: "减少 CO₂",
  },
  "blog.metric.co2.value": {
    th: "40+ ตัน",
    en: "40+ tons",
    cn: "40+ 吨",
  },
  "blog.metric.co2.sub": {
    th: "ต่อ MW ต่อปี",
    en: "per MW per year",
    cn: "每 MW 每年",
  },
  "blog.newsletter.title": {
    th: "รับข้อมูลเชิงลึกด้านพลังงาน",
    en: "Get Energy Insights",
    cn: "获取能源洞察",
  },
  "blog.newsletter.desc": {
    th: "สมัครรับจดหมายข่าวเพื่อรับบทความ ข้อมูลอุตสาหกรรม และข่าวสารจาก SIRINX ทุกสัปดาห์",
    en: "Subscribe for weekly articles, industry intelligence, and SIRINX updates.",
    cn: "订阅每周文章、行业情报与 SIRINX 最新资讯。",
  },
  "blog.newsletter.success": {
    th: "ขอบคุณที่สมัครรับข่าวสาร! ระบบจะเปิดให้บริการเร็ว ๆ นี้",
    en: "Thank you for subscribing. The newsletter service will open soon.",
    cn: "感谢订阅。新闻邮件服务即将开放。",
  },
  "blog.newsletter.error": {
    th: "กรุณากรอกอีเมล",
    en: "Please enter your email.",
    cn: "请输入您的电子邮件。",
  },
  "blog.newsletter.placeholder": {
    th: "อีเมลของคุณ",
    en: "Your email",
    cn: "您的电子邮件",
  },
  "blog.newsletter.submit": {
    th: "สมัครรับข่าว",
    en: "Subscribe",
    cn: "订阅",
  },
  "blog.newsletter.note": {
    th: "ไม่มีสแปม ยกเลิกได้ทุกเมื่อ",
    en: "No spam. Unsubscribe anytime.",
    cn: "无垃圾邮件，可随时取消订阅。",
  },
};

registerPageTranslations("blog", dict);

export default dict;
