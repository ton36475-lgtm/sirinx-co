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
