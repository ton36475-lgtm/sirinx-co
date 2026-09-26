/**
 * Single source of truth for Solar Carport FAQ content.
 *
 * Both surfaces read from here:
 *   - the static build injects the Thai FAQ into the served HTML (server/ogTags.ts)
 *   - the hydrated page renders and marks up the same items (RouteSeo + SolarCarport page)
 *
 * Content rules: process, method, and data requirements only. No prices, no guarantees,
 * no savings or payback figures, and no claims that are not verifiable per project.
 */

import type { ThaiProvince } from "./thaiProvinces";

export type SeoLanguage = "th" | "en" | "cn";

export type LocalizedText = Record<SeoLanguage, string>;

export type FaqItem = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
};

/**
 * Province-aware questions use the `{province}` placeholder so the same source can
 * produce Thai, English, and Chinese text for any of the 77 provinces.
 */
export type ProvinceFaqTemplate = FaqItem;

export type ResolvedFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const provincePlaceholder = "{province}";

export const solarCarportFaq: readonly FaqItem[] = [
  {
    id: "carport-vs-rooftop",
    question: {
      th: "Solar Carport ต่างจาก Rooftop Solar อย่างไร?",
      en: "How is Solar Carport different from Rooftop Solar?",
      cn: "Solar Carport与屋顶太阳能有什么区别？",
    },
    answer: {
      th: "Solar Carport ติดตั้งบนโครงสร้างหลังคาที่จอดรถ ไม่ต้องใช้พื้นที่หลังคาอาคาร เหมาะกับธุรกิจที่มีลานจอดรถขนาดใหญ่ นอกจากผลิตไฟฟ้าแล้ว ยังให้ร่มเงาปกป้องรถและรองรับ EV Charger ได้ทันที ในขณะที่ Rooftop Solar ต้องใช้หลังคาอาคารที่มีความแข็งแรงเพียงพอ",
      en: "Solar Carport is installed on parking lot roof structures, not building roofs. It's ideal for businesses with large parking areas. Besides generating electricity, it provides vehicle shade and supports EV Chargers. Rooftop Solar requires structurally sound building roofs.",
      cn: "Solar Carport安装在停车场屋顶结构上，不占用建筑屋顶。适合拥有大型停车场的企业。除发电外，还提供车辆遮阳并支持电动车充电。屋顶太阳能需要结构坚固的建筑屋顶。",
    },
  },
  {
    id: "parking-lot-size",
    question: {
      th: "ลานจอดรถต้องใหญ่แค่ไหนถึงจะคุ้มค่า?",
      en: "How big does the parking lot need to be?",
      cn: "停车场需要多大才划算？",
    },
    answer: {
      th: "โดยทั่วไป ลานจอดรถ 50 คันขึ้นไป (ประมาณ 500 ตร.ม.) จะเริ่มคุ้มค่าทางเศรษฐกิจ แต่ SIRINX สามารถออกแบบระบบสำหรับพื้นที่ตั้งแต่ 30 คันขึ้นไปได้ ขึ้นอยู่กับค่าไฟปัจจุบันและรูปแบบการลงทุน",
      en: "Generally, parking lots for 50+ vehicles (approx. 500 sq.m.) become economically viable. SIRINX can design systems for 30+ vehicles depending on current electricity costs and investment model.",
      cn: "通常50辆以上的停车场（约500平方米）开始具有经济可行性。SIRINX可根据当前电费和投资模式为30辆以上的停车场设计系统。",
    },
  },
  {
    id: "payback-and-returns",
    question: {
      th: "คืนทุนกี่ปี? ผลตอบแทนเท่าไหร่?",
      en: "What's the ROI period and returns?",
      cn: "回本周期和回报率是多少？",
    },
    answer: {
      th: "ระยะคืนทุนและผลตอบแทนต้องคำนวณเฉพาะโครงการจากค่าไฟจริง load profile พื้นที่ติดตั้ง รูปแบบการลงทุน และข้อจำกัดหน้างาน ผลลัพธ์บนเว็บไซต์เป็นเพียงการประเมินเบื้องต้น ไม่ใช่ใบเสนอราคาหรือการรับประกันผลประหยัด",
      en: "Payback and returns must be calculated for each project from actual electricity costs, load profile, installation area, investment model, and site constraints. Website results are preliminary assessments, not quotes or guaranteed savings.",
      cn: "回本周期和回报需要根据实际电费、负载曲线、安装面积、投资方式和现场限制按项目计算。网站结果仅为初步评估，不是报价或节省保证。",
    },
  },
  {
    id: "permits",
    question: {
      th: "ต้องขออนุญาตอะไรบ้าง?",
      en: "What permits are required?",
      cn: "需要哪些许可证？",
    },
    answer: {
      th: "SIRINX ดูแลเรื่องการขออนุญาตทั้งหมด ตั้งแต่ใบอนุญาตก่อสร้าง (อ.1) การขออนุญาตผลิตไฟฟ้า (กกพ.) และการเชื่อมต่อกับระบบไฟฟ้า (MEA/PEA) ทั้งหมดรวมอยู่ในบริการของเรา",
      en: "SIRINX handles all permits — construction permits, power generation licenses (ERC), and grid connection (MEA/PEA). Everything is included in our service.",
      cn: "SIRINX处理所有许可——建筑许可、发电许可证（ERC）和电网连接（MEA/PEA）。全部包含在我们的服务中。",
    },
  },
  {
    id: "investment-models",
    question: {
      th: "มีรูปแบบการลงทุนอะไรบ้าง?",
      en: "What investment models are available?",
      cn: "有哪些投资模式？",
    },
    answer: {
      th: "รูปแบบการลงทุนอาจประกอบด้วยซื้อขาด ผ่อนชำระ PPA หรือรูปแบบร่วมลงทุน ทั้งนี้ต้องยืนยันความพร้อม เงื่อนไขการเงิน และสิทธิประโยชน์กับผู้เชี่ยวชาญก่อนเสนอ",
      en: "Investment options may include outright purchase, installment, PPA, or co-investment. Availability, financial terms, and incentives must be confirmed before quoting.",
      cn: "投资方式可能包括全额购买、分期、PPA或联合投资。可用性、财务条款和优惠必须在报价前确认。",
    },
  },
  {
    id: "aftercare",
    question: {
      th: "หลังติดตั้งแล้ว SIRINX ดูแลอย่างไร?",
      en: "How does SIRINX maintain the system after installation?",
      cn: "安装后SIRINX如何维护系统？",
    },
    answer: {
      th: "SIRINX จัดบริการ O&M ตามขอบเขตสัญญา เช่น AI Monitoring การตรวจสอบ และรายงานผล โดยระยะเวลา รอบตรวจ และเวลาตอบสนองต้องระบุในใบเสนอราคาหรือสัญญาที่อนุมัติ",
      en: "SIRINX provides O&M by contract scope, such as AI Monitoring, inspections, and reporting. Duration, inspection cadence, and response terms must be stated in the approved quotation or contract.",
      cn: "SIRINX按合同范围提供运维服务，例如AI监控、检查和报告。期限、检查频率和响应条款必须写入批准的报价或合同。",
    },
  },
];

export const solarCarportProvinceFaq: readonly ProvinceFaqTemplate[] = [
  {
    id: "province-assessment-data",
    question: {
      th: "ประเมิน Solar Carport ใน{province}ต้องใช้ข้อมูลอะไร?",
      en: "What data is needed to assess Solar Carport in {province}?",
      cn: "在{province}评估太阳能车棚需要哪些数据？",
    },
    answer: {
      th: "ใช้บิลค่าไฟย้อนหลัง ช่วงเวลาที่ใช้ไฟจริง (load profile) จำนวนและขนาดช่องจอดรถ โครงสร้างหน้างาน และความต้องการ EV Charger หรือระบบสำรองไฟ เพื่อประเมินขนาดระบบและรูปแบบการลงทุน ตัวเลขผลประหยัดจริงต้องคำนวณจากข้อมูลไซต์จริง ไม่ใช่ค่ากลางของจังหวัด",
      en: "We use past electricity bills, the real usage pattern (load profile), the number and size of parking bays, the site structure, and any EV Charger or backup power requirement. Actual savings must be calculated from real site data, not from a provincial average.",
      cn: "我们使用历史电费账单、实际用电曲线、车位数量与尺寸、现场结构以及电动车充电或备电需求。实际节省必须根据现场真实数据计算，而不是使用全省平均值。",
    },
  },
  {
    id: "province-starting-area",
    question: {
      th: "พื้นที่แบบใดใน{province}ควรเริ่มประเมิน Solar Carport?",
      en: "Which areas in {province} should be assessed first for Solar Carport?",
      cn: "在{province}应优先评估哪些区域的太阳能车棚？",
    },
    answer: {
      th: "ลานจอดรถที่ใช้งานจริงใน{province}ที่มีทิศหลังคาและระยะห่างจากต้นข่ายเหมาะสม โครงสร้างที่รองรับแผงได้ การใช้ไฟในช่วงกลางวัน และความต้องการชาร์จรถของธุรกิจ เป็นข้อมูลตั้งต้นสำหรับการสำรวจหน้างาน ผลออกแบบและขนาดระบบจริงต้องยืนยันหลังสำรวจ",
      en: "Parking areas in {province} that are actually used, with a workable roof orientation and distance to the grid connection point, plus a structure that can carry panels, daytime consumption, and the business's EV charging demand, are the right starting point for a site survey. The final design and system size are confirmed after the survey.",
      cn: "在{province}实际使用中的停车场，如果屋顶朝向和到并网点的距离合适，且结构能够承载组件，配合白天用电情况和充电需求，就是勘察的合适起点。最终设计和系统容量需在勘察后确认。",
    },
  },
];

export function provinceDisplayName(
  province: Pick<ThaiProvince, "nameTh" | "nameEn">,
  lang: SeoLanguage
) {
  return lang === "th" ? province.nameTh : province.nameEn;
}

function pick(text: LocalizedText, lang: SeoLanguage) {
  return text[lang] || text.th;
}

function fill(template: string, provinceName: string) {
  return template.split(provincePlaceholder).join(provinceName);
}

/**
 * Resolve the FAQ for a route. Province-aware items are appended only when a
 * province is supplied, so a province page and its FAQ schema can never drift
 * apart: both the served HTML and the hydrated page call this same function.
 */
export function buildSolarCarportFaq(options: {
  lang: SeoLanguage;
  province?: Pick<ThaiProvince, "nameTh" | "nameEn"> | null;
}): ResolvedFaqItem[] {
  const { lang, province } = options;
  const items: ResolvedFaqItem[] = solarCarportFaq.map(item => ({
    id: item.id,
    question: pick(item.question, lang),
    answer: pick(item.answer, lang),
  }));

  if (province) {
    const name = provinceDisplayName(province, lang);
    for (const template of solarCarportProvinceFaq) {
      items.push({
        id: template.id,
        question: fill(pick(template.question, lang), name),
        answer: fill(pick(template.answer, lang), name),
      });
    }
  }

  return items;
}

/** i18n dictionary entries so the page UI reads from the same source. */
export function solarCarportFaqTranslationEntries(): Record<
  string,
  Record<SeoLanguage, string>
> {
  const entries: Record<string, Record<SeoLanguage, string>> = {};
  solarCarportFaq.forEach((item, index) => {
    entries[`sc.faq${index + 1}.q`] = item.question;
    entries[`sc.faq${index + 1}.a`] = item.answer;
  });
  solarCarportProvinceFaq.forEach((item, index) => {
    entries[`sc.faqProvince${index + 1}.q`] = item.question;
    entries[`sc.faqProvince${index + 1}.a`] = item.answer;
  });
  return entries;
}
