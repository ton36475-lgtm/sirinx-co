/**
 * BESS FAQ content, shared by the static build (FAQPage schema on /solutions)
 * and the visible FAQ block the page renders.
 *
 * Same convention as homeSolutionFaq: the strings exist once, so the marked-up
 * questions and the questions a reader sees cannot disagree, and the schema is
 * only emitted for the Thai page because these answers are Thai.
 *
 * Every answer is written to be quotable by an answer engine and to survive a
 * fact check: no guaranteed savings, no fixed payback, no invented specs.
 */

export type BessFaqItem = { question: string; answer: string };

export const bessFaq: readonly BessFaqItem[] = [
  {
    question: "BESS (Battery Energy Storage System) คืออะไร ทำงานร่วมกับโซลาร์อย่างไร?",
    answer:
      "BESS คือระบบแบตเตอรี่ที่ชาร์จไฟเก็บไว้แล้วจ่ายกลับออกมาเมื่อต้องการ ทำงานร่วมกับโซลาร์โดยเก็บไฟส่วนเกินที่ผลิตได้ตอนกลางวันไว้ใช้ในช่วงเย็นถึงกลางคืน จ่ายไฟช่วยลดกำลังไฟสูงสุดที่ดึงจาก grid และทำหน้าที่เป็นไฟฟ้าสำรองให้โหลดสำคัญเมื่อระบบไฟหลักขัดข้อง",
  },
  {
    question: "BESS ช่วยลดค่าไฟได้ทางไหนบ้าง?",
    answer:
      "หลัก ๆ สามทาง — ใช้ไฟโซลาร์ที่เก็บไว้แทนไฟจาก grid ในช่วงที่ค่าไฟแพง (Time-of-Use), ลดความต้องการไฟสูงสุด (peak / demand charge) และจ่ายไฟสำรองให้โหลดสำคัญโดยไม่ต้องดึงกำลังเพิ่มจาก grid ขนาดของผลประหยัดต้องประเมินจาก load profile และอัตราค่าไฟจริงของผู้ใช้ไฟแต่ละราย ไม่ใช่ค่าคงที่",
  },
  {
    question: "ต้องใช้ข้อมูลอะไรในการออกแบบระบบ BESS?",
    answer:
      "ต้องมีค่าไฟย้อนหลังและรูปแบบการใช้ไฟรายชั่วโมง (load profile), โครงสร้างค่าไฟทั้ง demand charge และ Time-of-Use, ขนาดและรูปแบบการผลิตของโซลาร์ที่มีอยู่หรือจะติดตั้ง, รายการโหลดที่ต้องการให้สำรองไฟ, พื้นที่ติดตั้งและระบบระบายอากาศ รวมถึงข้อกำหนดความปลอดภัยของอาคาร",
  },
  {
    question: "ธุรกิจแบบไหนที่ BESS เหมาะที่สุด?",
    answer:
      "โรงงานและอาคารที่ค่า demand charge สูง ใช้ไฟช่วงหัวค่ำมาก ไฟดับหรือไฟไม่เสถียรบ่อย ต้องการไฟสำรองให้โหลดสำคัญ หรือมี EV Charger ที่ต้องควบคุมกำลังไฟสูงสุดของอาคาร — ระบบที่ออกแบบจากข้อมูลจริงจะได้ประโยชน์ชัดกว่าการซื้อขนาดสำเร็จรูป",
  },
  {
    question: "การติดตั้ง BESS ต้องคำนึงถึงความปลอดภัยอะไรบ้าง?",
    answer:
      "การเลือกเซลล์และตู้ที่ผ่านมาตรฐานความปลอดภัย เช่น IEC 62619 สำหรับเซลล์ลิเธียมอุตสาหกรรม, ระบบจัดการแบตเตอรี่ (BMS), การระบายความร้อนและระบายอากาศ, ระยะห่างและระบบป้องกันอัคคีภัยตามข้อกำหนดอาคาร และการตัดการทำงานที่ปลอดภัยในแบบวิศวกรรม — ทุกข้อต้องระบุในเอกสารก่อนติดตั้ง",
  },
  {
    question: "SIRINX ประเมินความคุ้มค่าของ BESS อย่างไร?",
    answer:
      "เริ่มจาก load profile และบิลค่าไฟจริง เพื่อดูว่า BESS จะแตะ peak และช่วงค่าไฟแพงได้จริงแค่ไหน แล้วประเมินขนาดระบบและรอบการใช้งานที่สอดคล้องกับข้อจำกัดหน้างาน ก่อนจัดทำแบบและข้อเสนอ ตัวเลขผลประหยัดเป็นกรณีศึกษาจากข้อมูลจริงของแต่ละโครงการ ไม่ใช่คำรับประกัน",
  },
];
