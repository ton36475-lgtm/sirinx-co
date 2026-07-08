import React, { createContext, useContext, useState, useCallback } from "react";

export type Language = "th" | "en" | "cn";

export const LANGUAGE_LABELS: Record<Language, string> = {
  th: "ไทย",
  en: "EN",
  cn: "中文",
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

/* ─── Translation Dictionary ─────────────────────────────────── */
const translations: Record<string, Record<Language, string>> = {
  // Navigation
  "nav.home": { th: "หน้าหลัก", en: "Home", cn: "首页" },
  "nav.solarCarport": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "nav.solutions": { th: "โซลูชัน", en: "Solutions", cn: "解决方案" },
  "nav.homeSolution": { th: "Home Solution", en: "Home Solution", cn: "家庭能源方案" },
  "nav.industries": { th: "อุตสาหกรรม", en: "Industries", cn: "行业" },
  "nav.pricing": { th: "แพ็คเกจราคา", en: "Pricing", cn: "价格方案" },
  "nav.projects": { th: "ผลงาน", en: "Projects", cn: "项目案例" },
  "nav.investment": { th: "การลงทุน", en: "Investment", cn: "投资" },
  "nav.about": { th: "เกี่ยวกับเรา", en: "About Us", cn: "关于我们" },
  "nav.contact": { th: "ติดต่อเรา", en: "Contact", cn: "联系我们" },
  "nav.assessment": {
    th: "ประเมินโซลาร์",
    en: "Solar Assessment",
    cn: "太阳能评估",
  },
  "nav.assessmentDesc": {
    th: "คำนวณค่าไฟที่ประหยัดได้",
    en: "Calculate your savings",
    cn: "计算您的节省",
  },
  "nav.getQuote": { th: "ขอใบเสนอราคา", en: "Get a Quote", cn: "获取报价" },
  "nav.blog": { th: "บทความ", en: "Blog", cn: "博客" },
  "nav.strategy": { th: "กลยุทธ์", en: "Strategy", cn: "战略" },
  "nav.partner": { th: "พันธมิตร", en: "Partners", cn: "合作伙伴" },

  // Solutions dropdown
  "sol.rooftopSolar": {
    th: "Rooftop Solar",
    en: "Rooftop Solar",
    cn: "屋顶太阳能",
  },
  "sol.floatingSolar": {
    th: "Floating Solar",
    en: "Floating Solar",
    cn: "水上太阳能",
  },
  "sol.solarCarport": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "sol.homeSolution": {
    th: "Home Solution บ้านใหญ่",
    en: "Large Home Solution",
    cn: "大型住宅能源方案",
  },
  "sol.bess": { th: "BESS / ESS", en: "BESS / ESS", cn: "储能系统" },
  "sol.aiEnergy": {
    th: "AI Energy Management",
    en: "AI Energy Management",
    cn: "AI能源管理",
  },
  "sol.oAndM": { th: "O&M ดูแลรักษา", en: "O&M Maintenance", cn: "运维服务" },

  // Common CTAs
  "cta.getQuote": { th: "ขอใบเสนอราคา", en: "Get a Quote", cn: "获取报价" },
  "cta.contactUs": { th: "ติดต่อเรา", en: "Contact Us", cn: "联系我们" },
  "cta.learnMore": { th: "ดูรายละเอียด", en: "Learn More", cn: "了解更多" },
  "cta.freeSurvey": {
    th: "นัดสำรวจหน้างานฟรี",
    en: "Free Site Survey",
    cn: "免费现场勘查",
  },
  "cta.solarAssessment": {
    th: "ประเมินความคุ้มค่า",
    en: "Solar Assessment",
    cn: "太阳能评估",
  },
  "cta.viewProjects": {
    th: "ดูผลงานจริง",
    en: "View Projects",
    cn: "查看项目",
  },
  "cta.viewAllSolutions": {
    th: "ดูโซลูชันทั้งหมด",
    en: "View All Solutions",
    cn: "查看所有方案",
  },

  // Footer
  "footer.tagline": {
    th: "Solar Digital Agentic Company — ออกแบบ ติดตั้ง และบริหารระบบพลังงานสะอาดครบวงจร",
    en: "Solar Digital Agentic Company — Design, Install & Manage Complete Clean Energy Systems",
    cn: "太阳能数字智能公司 — 设计、安装和管理完整的清洁能源系统",
  },
  "footer.contact": { th: "ติดต่อเรา", en: "Contact Us", cn: "联系我们" },
  "footer.solutions": { th: "โซลูชัน", en: "Solutions", cn: "解决方案" },
  "footer.industries": { th: "อุตสาหกรรม", en: "Industries", cn: "行业" },
  "footer.company": { th: "บริษัท", en: "Company", cn: "公司" },
  "footer.rights": {
    th: "สงวนลิขสิทธิ์ทุกประการ",
    en: "All rights reserved",
    cn: "版权所有",
  },
  "footer.address": {
    th: "จ.น่าน ประเทศไทย",
    en: "Nan Province, Thailand",
    cn: "泰国南府",
  },
  "footer.lineEyebrow": {
    th: "LINE Official",
    en: "LINE Official",
    cn: "LINE 官方账号",
  },
  "footer.lineTitle": {
    th: "ส่งข้อมูลโครงการผ่าน LINE",
    en: "Send project details via LINE",
    cn: "通过 LINE 发送项目资料",
  },
  "footer.lineDesc": {
    th: "ส่งบิลค่าไฟ รูปพื้นที่ หรือคำถามโครงการผ่าน LINE Official",
    en: "Send electricity bills, site photos, or project questions through LINE Official",
    cn: "通过 LINE 官方账号发送电费账单、现场照片或项目问题",
  },
  "footer.lineActionsAria": {
    th: "ช่องทาง LINE Official",
    en: "LINE Official contact channels",
    cn: "LINE 官方账号联系方式",
  },
  "footer.lineAddAria": {
    th: "เพิ่มเพื่อน LINE Official SIRINX",
    en: "Add SIRINX LINE Official",
    cn: "添加 SIRINX LINE 官方账号",
  },
  "footer.lineAdd": {
    th: "เพิ่มเพื่อน LINE",
    en: "Add LINE",
    cn: "添加 LINE",
  },
  "footer.lineChatAria": {
    th: "แชทกับ SIRINX ผ่าน LINE",
    en: "Chat with SIRINX on LINE",
    cn: "通过 LINE 与 SIRINX 聊天",
  },
  "footer.lineChat": {
    th: "แชท LINE",
    en: "LINE Chat",
    cn: "LINE 聊天",
  },
  "footer.lineQrCaption": {
    th: "สแกน QR เพื่อเพิ่มเพื่อน LINE Official",
    en: "Scan the QR code to add LINE Official",
    cn: "扫描二维码添加 LINE 官方账号",
  },
  "footer.certifiedTrusted": {
    th: "Certified & Trusted",
    en: "Certified & Trusted",
    cn: "认证与信任",
  },
  "footer.dbdTitle": {
    th: "DBD Registered — กรมพัฒนาธุรกิจการค้า",
    en: "DBD Registered — Department of Business Development",
    cn: "DBD 注册 — 泰国商业发展厅",
  },
  "footer.boiTitle": {
    th: "BOI Promoted — สำนักงานคณะกรรมการส่งเสริมการลงทุน",
    en: "BOI Promoted — Thailand Board of Investment",
    cn: "BOI 促进 — 泰国投资促进委员会",
  },
  "footer.privacy": {
    th: "นโยบายความเป็นส่วนตัว",
    en: "Privacy Policy",
    cn: "隐私政策",
  },
  "footer.terms": {
    th: "เงื่อนไขการใช้งาน",
    en: "Terms of Use",
    cn: "使用条款",
  },
  "footer.cookies": {
    th: "นโยบายคุกกี้",
    en: "Cookie Policy",
    cn: "Cookie 政策",
  },
  "notFound.title": {
    th: "ไม่พบหน้าที่คุณต้องการ",
    en: "Page Not Found",
    cn: "未找到页面",
  },
  "notFound.desc": {
    th: "หน้านี้อาจถูกย้ายหรือลบไปแล้ว กรุณากลับไปหน้าหลัก",
    en: "This page may have moved or been removed. Please return to the homepage.",
    cn: "此页面可能已移动或删除。请返回首页。",
  },
  "notFound.home": {
    th: "กลับหน้าหลัก",
    en: "Back to Home",
    cn: "返回首页",
  },
  "floating.lineAria": {
    th: "เปิด LINE Official ของ SIRINX",
    en: "Open SIRINX LINE Official",
    cn: "打开 SIRINX LINE 官方账号",
  },
  "floating.botAria": {
    th: "เปิดแชท SIRINX Solar Assistant",
    en: "Open SIRINX Solar Assistant chat",
    cn: "打开 SIRINX Solar Assistant 聊天",
  },
  "chat.dismissBubbleAria": {
    th: "ปิดข้อความแนะนำ",
    en: "Dismiss suggestion",
    cn: "关闭提示",
  },
  "chat.bubbleTitle": {
    th: "สนใจโซลาร์เซลล์ไหมครับ?",
    en: "Interested in solar?",
    cn: "对太阳能感兴趣吗？",
  },
  "chat.bubbleDesc": {
    th: "พิมพ์ถามได้เลย หรือแอดไลน์คุยกัน",
    en: "Ask here or add LINE to talk with the team.",
    cn: "可直接提问，或添加 LINE 与团队沟通。",
  },
  "chat.statusOnline": {
    th: "ออนไลน์ พร้อมให้บริการ",
    en: "Online and ready to help",
    cn: "在线，可随时协助",
  },
  "chat.closeAria": {
    th: "ปิด SIRINX Assistant",
    en: "Close SIRINX Assistant",
    cn: "关闭 SIRINX Assistant",
  },
  "chat.welcomeTitle": {
    th: "สวัสดีครับ! ยินดีให้บริการ",
    en: "Hello. How can we help?",
    cn: "您好，很高兴为您服务",
  },
  "chat.welcomeDesc": {
    th: "สอบถามเรื่องโซลาร์เซลล์ BESS แบตเตอรี่ หรือนัดสำรวจหน้างานได้เลยครับ",
    en: "Ask about solar, BESS, battery storage, or scheduling a site survey.",
    cn: "可咨询太阳能、BESS、电池储能，或预约现场勘察。",
  },
  "chat.quickQuoteLabel": {
    th: "ขอใบเสนอราคา Solar Carport",
    en: "Request a Solar Carport quote",
    cn: "索取 Solar Carport 报价",
  },
  "chat.quickQuoteMessage": {
    th: "ต้องการขอใบเสนอราคา Solar Carport สำหรับองค์กร",
    en: "I would like a Solar Carport quote for my organization.",
    cn: "我想为机构索取 Solar Carport 报价。",
  },
  "chat.quickSavingsLabel": {
    th: "คำนวณลดค่าไฟเบื้องต้น",
    en: "Estimate electricity savings",
    cn: "初步估算节省电费",
  },
  "chat.quickSavingsMessage": {
    th: "ช่วยประเมินเบื้องต้นว่าระบบโซลาร์จะลดค่าไฟได้อย่างไร",
    en: "Please help estimate how a solar system could reduce electricity costs.",
    cn: "请帮助初步评估太阳能系统如何降低电费。",
  },
  "chat.quickRooftopCarportLabel": {
    th: "Rooftop หรือ Carport ดี",
    en: "Rooftop or Carport?",
    cn: "屋顶光伏还是车棚？",
  },
  "chat.quickRooftopCarportMessage": {
    th: "ควรเลือก Rooftop Solar หรือ Solar Carport สำหรับพื้นที่ของเรา",
    en: "Should we choose Rooftop Solar or Solar Carport for our site?",
    cn: "我们的场地适合屋顶光伏还是 Solar Carport？",
  },
  "chat.quickBessEvLabel": {
    th: "BESS / EV Charger",
    en: "BESS / EV Charger",
    cn: "BESS / EV 充电",
  },
  "chat.quickBessEvMessage": {
    th: "อยากทราบการใช้ BESS และ EV Charger ร่วมกับระบบโซลาร์",
    en: "I want to understand BESS and EV Charger use with solar.",
    cn: "我想了解 BESS 和 EV 充电如何与太阳能配合使用。",
  },
  "chat.quickSurveyLabel": {
    th: "นัดสำรวจหน้างาน",
    en: "Schedule a site survey",
    cn: "预约现场勘察",
  },
  "chat.quickSurveyMessage": {
    th: "ต้องการนัดทีมวิศวกรมาสำรวจหน้างาน",
    en: "I would like to schedule an engineering site survey.",
    cn: "我想预约工程团队现场勘察。",
  },
  "chat.addLine": {
    th: "แอดไลน์ @sirinx",
    en: "Add LINE @sirinx",
    cn: "添加 LINE @sirinx",
  },
  "chat.knownFields": {
    th: "ข้อมูลประเมิน",
    en: "Assessment data",
    cn: "评估资料",
  },
  "chat.transferLineAria": {
    th: "ต่อสายผ่าน LINE",
    en: "Continue via LINE",
    cn: "通过 LINE 继续",
  },
  "chat.transferLine": {
    th: "ต่อสายผ่าน LINE",
    en: "Continue via LINE",
    cn: "通过 LINE 继续",
  },
  "chat.inputAria": {
    th: "พิมพ์ข้อความถึง SIRINX Assistant",
    en: "Type a message to SIRINX Assistant",
    cn: "输入消息给 SIRINX Assistant",
  },
  "chat.inputPlaceholder": {
    th: "พิมพ์ข้อความ...",
    en: "Type a message...",
    cn: "输入消息...",
  },
  "chat.sendAria": {
    th: "ส่งข้อความ",
    en: "Send message",
    cn: "发送消息",
  },
  "chat.aiDisclaimer": {
    th: "AI อาจตอบไม่ถูกต้อง 100% กรุณายืนยันข้อมูลกับทีมงาน",
    en: "AI responses may need confirmation from the SIRINX team.",
    cn: "AI 回复可能需要 SIRINX 团队确认。",
  },

  // Home page
  "home.heroTag": {
    th: "Solar Digital Agentic Company",
    en: "Solar Digital Agentic Company",
    cn: "太阳能数字智能公司",
  },
  "home.heroTitle1": {
    th: "เปลี่ยนที่จอดรถ",
    en: "Transform Your Parking",
    cn: "将停车场",
  },
  "home.heroTitle2": {
    th: "เป็นโรงไฟฟ้าพลังงานแสงอาทิตย์",
    en: "Into a Solar Power Plant",
    cn: "变成太阳能发电站",
  },
  "home.heroDesc": {
    th: "ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV Charger ลดค่าไฟ 30-100% คืนทุน 3-5 ปีโดยประมาณตามข้อมูลไซต์จริง",
    en: "Generate electricity, provide shade, and support EV Charging with estimated 30-100% bill reduction and 3-5 year payback based on real site data.",
    cn: "发电、遮阳并支持电动车充电，根据现场数据预估降低30-100%电费，3-5年回本。",
  },

  // Pricing page
  "pricing.title": {
    th: "เลือกแพ็คเกจที่เหมาะกับธุรกิจ",
    en: "Choose the Right Package for Your Business",
    cn: "选择适合您业务的套餐",
  },
  "pricing.subtitle": {
    th: "คุ้มค่าทุกการลงทุน",
    en: "Every Investment Pays Off",
    cn: "每笔投资都有回报",
  },
  "pricing.desc": {
    th: "Solar Carport โดย SIRINX — ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV Charger พร้อมสิทธิประโยชน์ทางภาษีจากมาตรการรัฐ",
    en: "Solar Carport by SIRINX — Generate electricity, provide shade, support EV Charging with government tax incentives",
    cn: "SIRINX太阳能车棚 — 发电、遮阳、支持电动车充电，享受政府税收优惠",
  },
  "pricing.roiTitle": {
    th: "คำนวณความคุ้มค่า",
    en: "Calculate Your ROI",
    cn: "计算投资回报",
  },
  "pricing.monthlyBill": {
    th: "ค่าไฟฟ้าต่อเดือน (บาท)",
    en: "Monthly Electricity Bill (THB)",
    cn: "月电费（泰铢）",
  },
  "pricing.parkingSpaces": {
    th: "จำนวนที่จอดรถ (คัน)",
    en: "Parking Spaces",
    cn: "停车位数量",
  },
  "pricing.savingsMonth": {
    th: "ประหยัด/เดือน (บาท)",
    en: "Monthly Savings (THB)",
    cn: "月节省（泰铢）",
  },
  "pricing.paybackYears": {
    th: "ปีคืนทุน",
    en: "Payback Years",
    cn: "回本年数",
  },
  "pricing.savings25yr": {
    th: "ประหยัดรวม 25 ปี (บาท)",
    en: "25-Year Total Savings (THB)",
    cn: "25年总节省（泰铢）",
  },
  "pricing.co2Reduction": {
    th: "ตัน CO2 ลด/ปี",
    en: "Tons CO2 Reduced/Year",
    cn: "年减少CO2（吨）",
  },
  "pricing.recommended": {
    th: "แพ็คเกจแนะนำ:",
    en: "Recommended Package:",
    cn: "推荐方案：",
  },
  "pricing.savingsPercent": {
    th: "ลดค่าไฟได้ประมาณ",
    en: "Estimated Electricity Savings",
    cn: "预计节省电费",
  },

  // Contact page
  "contact.title": { th: "ติดต่อเรา", en: "Contact Us", cn: "联系我们" },
  "contact.name": { th: "ชื่อ-นามสกุล", en: "Full Name", cn: "姓名" },
  "contact.company": {
    th: "บริษัท/องค์กร",
    en: "Company/Organization",
    cn: "公司/组织",
  },
  "contact.phone": { th: "เบอร์โทรศัพท์", en: "Phone Number", cn: "电话号码" },
  "contact.email": { th: "อีเมล", en: "Email", cn: "电子邮件" },
  "contact.message": { th: "ข้อความ", en: "Message", cn: "留言" },
  "contact.send": { th: "ส่งข้อความ", en: "Send Message", cn: "发送消息" },

  // Solar Carport page
  "carport.title": {
    th: "Solar Carport",
    en: "Solar Carport",
    cn: "太阳能车棚",
  },
  "carport.subtitle": {
    th: "เปลี่ยนที่จอดรถเป็นโรงไฟฟ้าพลังงานแสงอาทิตย์",
    en: "Transform Your Parking Into a Solar Power Plant",
    cn: "将停车场变成太阳能发电站",
  },

  // Industries
  "ind.manufacturing": { th: "โรงงาน", en: "Manufacturing", cn: "制造业" },
  "ind.agriculture": { th: "เกษตรกรรม", en: "Agriculture", cn: "农业" },
  "ind.hospitality": { th: "โรงแรม", en: "Hospitality", cn: "酒店业" },
  "ind.education": { th: "สถานศึกษา", en: "Education", cn: "教育" },
  "ind.commercial": {
    th: "อาคารพาณิชย์",
    en: "Commercial Buildings",
    cn: "商业建筑",
  },

  // Common
  "common.readMore": { th: "อ่านเพิ่มเติม", en: "Read More", cn: "阅读更多" },
  "common.close": { th: "ปิด", en: "Close", cn: "关闭" },
  "common.loading": { th: "กำลังโหลด...", en: "Loading...", cn: "加载中..." },
  "common.featureComingSoon": {
    th: "ฟีเจอร์นี้กำลังจะมาเร็วๆ นี้",
    en: "Feature coming soon",
    cn: "功能即将推出",
  },
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem("sirinx-lang");
    return (stored as Language) || "th";
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("sirinx-lang", newLang);
    document.documentElement.lang = newLang === "cn" ? "zh" : newLang;
  }, []);

  const t = useCallback(
    (key: string): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] || entry["th"] || key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
