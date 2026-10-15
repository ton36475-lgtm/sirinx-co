import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  "sg.tag": {
    th: "พลังงานแบตเตอรี่ (BESS)",
    en: "Battery Energy Storage (BESS)",
    cn: "电池储能 (BESS)",
  },
  "sg.title": {
    th: "ระบบกักเก็บพลังงานด้วยแบตเตอรี่ สำหรับบ้านและโรงงาน",
    en: "Battery energy storage for homes and factories",
    cn: "住宅与工厂电池储能系统",
  },
  "sg.lede": {
    th: "ข้อมูลระบบ BESS ที่ทุกตัวเลขมีแหล่งที่มาและสถานะระบุชัด — ค่าที่ยังขัดแย้งกันแสดงเป็นข้อขัดแย้ง ไม่มีการเลือกข้าง",
    en: "BESS data where every figure carries its source and status — conflicting values are shown as conflicts, never picked",
    cn: "BESS 数据均注明来源与状态 — 冲突数值以冲突形式呈现",
  },
  "sg.demoNote": {
    th: "หน้านี้เป็นต้นแบบ ข้อมูลไม่บันทึก ไม่ส่งออก และไม่มีระบบภายนอกเชื่อมอยู่",
    en: "This page is a prototype: nothing is saved, sent, or connected to any external system.",
    cn: "本页面为原型：不保存、不发送、无外部连接。",
  },
  "sg.productTitle": {
    th: "ข้อมูลผลิตภัณฑ์ (รายงานโดยผู้ผลิต)",
    en: "Product data (manufacturer-reported)",
    cn: "产品数据（厂商报告）",
  },
  "sg.conflictTitle": {
    th: "ค่าที่ยังขัดแย้งกัน",
    en: "Conflicting values on record",
    cn: "冲突数值",
  },
  "sg.knowledgeTitle": {
    th: "ความรู้พื้นฐาน",
    en: "Basics",
    cn: "基础知识",
  },
  "sg.state": {
    th: "สถานะหลักฐาน",
    en: "Evidence state",
    cn: "证据状态",
  },
  "sg.pendingTitle": {
    th: "รอหลักฐานก่อนอ้างอิง",
    en: "Pending evidence before any claim",
    cn: "待确认证据",
  },
  "sg.reviewedAt": {
    th: "วันตรวจ",
    en: "Reviewed",
    cn: "审查日期",
  },
};

registerPageTranslations("bess", dict);
