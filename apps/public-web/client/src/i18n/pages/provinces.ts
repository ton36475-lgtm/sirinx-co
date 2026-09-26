import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  "pv.badge": {
    th: "ครบ 77 จังหวัด",
    en: "All 77 provinces",
    cn: "覆盖全国 77 个府",
  },
  "pv.title": {
    th: "Solar Carport และระบบพลังงานสะอาดของ SIRINX ครบทุกจังหวัด",
    en: "SIRINX Solar Carport and clean energy systems in every province",
    cn: "SIRINX 太阳能车棚与清洁能源系统，覆盖全国每个府",
  },
  "pv.intro": {
    th: "เลือกจังหวัดของคุณเพื่อดูแนวทางออกแบบ Solar Carport, Rooftop Solar, BESS, EV Charger และ AI Energy Management พร้อมข้อมูลที่ต้องเตรียมก่อนนัดสำรวจหน้างาน ผลประเมินแต่ละโครงการคำนวณจากบิลค่าไฟและข้อมูลหน้างานจริง ไม่ใช่ค่ากลางของจังหวัด",
    en: "Choose your province to see how SIRINX approaches Solar Carport, Rooftop Solar, BESS, EV Charger, and AI Energy Management, plus what to prepare before a site survey. Every assessment is calculated from real bills and real site data, not a provincial average.",
    cn: "选择您所在的府，查看 SIRINX 在太阳能车棚、屋顶太阳能、BESS、电动车充电与 AI 能源管理方面的方案方向，以及勘察前需要准备的资料。每个评估都基于真实电费与现场数据计算，而非全省平均值。",
  },
  "pv.search": {
    th: "ค้นหาจังหวัด",
    en: "Search province",
    cn: "搜索省份",
  },
  "pv.noResult": {
    th: "ไม่พบจังหวัดที่ค้นหา ลองชื่อภาษาไทยหรือชื่อภาษาอังกฤษ",
    en: "No province matched. Try the Thai or English name.",
    cn: "未找到匹配的省份，请尝试泰文或英文名称。",
  },
  "pv.count": {
    th: "จังหวัด",
    en: "provinces",
    cn: "个府",
  },
  "pv.visit": {
    th: "ดูแนวทางของจังหวัดนี้",
    en: "View this province",
    cn: "查看该府方案",
  },
  "pv.backCarport": {
    th: "กลับไปหน้า Solar Carport",
    en: "Back to Solar Carport",
    cn: "返回太阳能车棚页面",
  },
  "pv.cta.title": {
    th: "อยู่ในจังหวัดไหน บอกได้",
    en: "Tell us your province",
    cn: "告诉我们您所在的府",
  },
  "pv.cta.desc": {
    th: "นัดสำรวจหน้างานฟรี เราจะขอบิลค่าไฟ รูปพื้นที่จอดรถ และข้อมูลการใช้ไฟก่อนเสนอแบบและราคา",
    en: "Book a free site survey. We ask for your electricity bills, parking area photos, and usage data before proposing a design and a price.",
    cn: "预约免费现场勘察。我们会在提出设计与报价前索取电费账单、停车场照片与用电数据。",
  },
  "pv.cta.btn": {
    th: "ส่งข้อมูลโครงการ",
    en: "Send project details",
    cn: "提交项目资料",
  },
};

registerPageTranslations("provinces", dict);
export default dict;
