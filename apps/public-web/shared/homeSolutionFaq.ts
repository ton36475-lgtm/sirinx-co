/**
 * Home Solution FAQ content, shared by the static build and the hydrated page.
 *
 * The page UI keeps its own localized copy in the i18n dictionary. This list is the
 * structured-data source, and it is only marked up when the active language is Thai
 * so the schema never claims a Thai answer for an English or Chinese page.
 */

export type HomeSolutionFaqItem = { question: string; answer: string };

export const homeSolutionFaq: readonly HomeSolutionFaqItem[] = [
  {
    question: "Home Solution ของ SIRINX เหมาะกับบ้านแบบไหน?",
    answer:
      "เหมาะกับบ้านขนาดใหญ่ โฮมออฟฟิศ บ้านพักผู้บริหาร บ้านที่มี EV หลายคัน หรือบ้านที่มีโหลดไฟสูง เช่น แอร์หลายโซน ห้องทำงาน server ห้องประชุม สระว่ายน้ำ และระบบรักษาความปลอดภัย",
  },
  {
    question: "ทำไมไม่ควรซื้อระบบจากราคาต่อกิโลวัตต์อย่างเดียว?",
    answer:
      "เพราะบ้านใหญ่มีข้อจำกัดเฉพาะ เช่น เงาบัง ทิศหลังคา MDB เดิม backup load และ EV charging behavior ระบบที่คุ้มจริงต้องออกแบบจากข้อมูลโหลดและหน้างาน ไม่ใช่ใช้ราคาแผงเป็นตัวตัดสินอย่างเดียว",
  },
  {
    question: "SIRINX ช่วยลดความเสี่ยงเรื่องงานติดตั้งไม่ได้มาตรฐานอย่างไร?",
    answer:
      "ใช้กระบวนการสำรวจ ออกแบบเอกสารวิศวกรรม BOQ ชัดเจน payment milestone commissioning record และ monitoring หลังส่งมอบ เพื่อให้ลูกค้าตรวจสอบได้ทุกช่วง ไม่ใช่รอเชื่อคำขายอย่างเดียว",
  },
  {
    question: "สามารถใช้ร่วมกับ EV Charger และ Battery ได้หรือไม่?",
    answer:
      "ได้ โดยออกแบบเป็นระบบเดียวกันตั้งแต่ต้นเพื่อจัดลำดับการใช้ไฟจาก solar, grid, battery และ EV charger ตามพฤติกรรมของบ้านและข้อจำกัดของอุปกรณ์",
  },
];
