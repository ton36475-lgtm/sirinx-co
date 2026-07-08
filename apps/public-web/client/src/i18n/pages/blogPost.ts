import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  "blogPost.notFound.title": {
    th: "ไม่พบบทความ",
    en: "Article Not Found",
    cn: "未找到文章",
  },
  "blogPost.notFound.desc": {
    th: "บทความที่คุณค้นหาอาจถูกย้ายหรือลบแล้ว",
    en: "The article you are looking for may have moved or been removed.",
    cn: "您查找的文章可能已移动或被删除。",
  },
  "blogPost.back": {
    th: "กลับไปหน้าบทความ",
    en: "Back to Blog",
    cn: "返回博客",
  },
  "blogPost.share": { th: "แชร์", en: "Share", cn: "分享" },
  "blogPost.shareAria": {
    th: "คัดลอกลิงก์บทความ",
    en: "Copy article link",
    cn: "复制文章链接",
  },
  "blogPost.shareCopied": {
    th: "คัดลอกลิงก์แล้ว",
    en: "Link copied.",
    cn: "链接已复制。",
  },
  "blogPost.draft": {
    th: "เนื้อหาบทความนี้กำลังอยู่ระหว่างการจัดทำ กรุณากลับมาอ่านอีกครั้งในเร็ว ๆ นี้",
    en: "This article is being prepared. Please check back soon.",
    cn: "本文正在准备中，请稍后再查看。",
  },
  "blogPost.articleCta.title": {
    th: "สนใจระบบโซลาร์สำหรับธุรกิจ?",
    en: "Considering Solar for Your Business?",
    cn: "正在为企业评估太阳能系统？",
  },
  "blogPost.articleCta.desc": {
    th: "ใช้เครื่องมือคำนวณของ SIRINX เพื่อประเมินขนาดระบบและผลตอบแทนเบื้องต้น ฟรี",
    en: "Use the SIRINX calculator to estimate system size and preliminary returns at no cost.",
    cn: "使用 SIRINX 计算工具免费评估系统容量与初步投资回报。",
  },
  "blogPost.articleCta.calculate": {
    th: "คำนวณระบบโซลาร์",
    en: "Calculate Solar System",
    cn: "计算太阳能系统",
  },
  "blogPost.articleCta.survey": {
    th: "นัดสำรวจหน้างานฟรี",
    en: "Book Free Site Survey",
    cn: "预约免费现场勘查",
  },
  "blogPost.takeaways": {
    th: "สรุปประเด็นสำคัญ",
    en: "Key Takeaways",
    cn: "重点摘要",
  },
  "blogPost.related": {
    th: "บทความที่เกี่ยวข้อง",
    en: "Related Articles",
    cn: "相关文章",
  },
  "blogPost.final.title": {
    th: "พร้อมเริ่มต้นลดค่าพลังงาน?",
    en: "Ready to Reduce Energy Costs?",
    cn: "准备开始降低能源成本？",
  },
  "blogPost.final.desc": {
    th: "นัดสำรวจหน้างานฟรี ไม่มีข้อผูกมัด รับข้อเสนอที่ออกแบบเฉพาะสำหรับธุรกิจของคุณ",
    en: "Book a free site survey with no obligation and receive a proposal designed around your business data.",
    cn: "预约免费现场勘查，无强制义务，并获得基于您业务数据设计的方案。",
  },
  "blogPost.final.survey": {
    th: "นัดสำรวจหน้างานฟรี",
    en: "Book Free Site Survey",
    cn: "预约免费现场勘查",
  },
  "blogPost.final.assessment": {
    th: "ประเมินความคุ้มค่าเบื้องต้น",
    en: "Estimate Preliminary ROI",
    cn: "评估初步投资回报",
  },
};

registerPageTranslations("blogPost", dict);

export default dict;
