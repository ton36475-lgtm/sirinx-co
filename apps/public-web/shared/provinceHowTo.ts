/**
 * The province installation procedure, as structured data.
 *
 * Why this exists: the plan asked for a HowTo node on all 77 province pages
 * and the audit found HowTo on 0/77. The province pages already describe this
 * procedure in prose, so the schema should point at the same steps rather than
 * invent a second, divergent list.
 *
 * Every step is authority-neutral on purpose. PEA/MEA assignment per province is
 * still unverified, and the quality test forbids claiming a grid operator, so
 * the steps say "หน่วยงานที่ดูแลพื้นที่" and the page tells the reader to confirm
 * which agency covers their province. Same reason there is no totalTime: a
 * fabricated duration is worse than none.
 */

export type HowToStep = { name: string; text: string };

export function provinceInstallSteps(nameTh: string): HowToStep[] {
  return [
    {
      name: "สำรวจหน้างานและวิเคราะห์โหลดไฟ",
      text: `สำรวจพื้นที่ลานจอดรถและหลังคาของอาคารใน${nameTh} พร้อมเก็บบิลค่าไฟย้อนหลังอย่างน้อย 3 เดือน เพื่อเห็นโหลดช่วงกลางวัน พร้อมสำรวจเงาบังจากอาคารข้างเคียงและโครงสร้างเดิมของลานจอดรถ`,
    },
    {
      name: "ออกแบบระบบเบื้องต้นและประเมินงบ",
      text: `ออกแบบกำลังผลิต แบบโครงสร้าง แนวเดินสาย และจุดเชื่อมต่อไฟฟ้า โดยกำหนดความสูงใต้คานให้รถที่จอดจริงผ่านได้ แล้วจัดทำรายการงานกับราคาแยกรายการเพื่อให้เทียบข้อเสนอจากผู้รับเหมาได้ในเกณฑ์เดียวกัน`,
    },
    {
      name: "ยื่นขออนุญาตก่อสร้างหรือดัดแปลงโครงสร้าง",
      text: `ยื่นขออนุญาตก่อสร้างหรือดัดแปลงโครงสร้างกับหน่วยงานที่ดูแลพื้นที่ใน${nameTh} ตามขนาดและลักษณะงาน โดยต้องตรวจสอบกับหน่วยงานที่เกี่ยวข้องของพื้นที่ก่อนเริ่มงานเสมอ เพราะเอกสารและขั้นตอนต่างกันตามเขต`,
    },
    {
      name: "ยื่นขอเชื่อมต่อระบบผลิตไฟฟ้า",
      text: `ยื่นขอเชื่อมต่อระบบผลิตไฟฟ้ากับหน่วยงานที่ดูแลพื้นที่ใน${nameTh} พร้อมแบบระบบไฟฟ้าที่จัดทำและรับรองโดยวิศวกรที่มีใบอนุญาต รวมถึงอุปกรณ์ป้องกันการย้อนไฟตามมาตรฐานของหน่วยงาน`,
    },
    {
      name: "ติดตั้งโครงสร้างและระบบไฟฟ้า",
      text: `ติดตั้งโครงสร้างและระบบไฟฟ้าโดยทีมที่มีใบรับรอง พร้อมบันทึกภาพงานทุกขั้นตอน และดำเนินการไม่ให้กีดขวางการใช้พื้นที่ของอาคารระหว่างทำงาน`,
    },
    {
      name: "ทดสอบระบบและตรวจรับ",
      text: `ทดสอบระบบ ตรวจรับโดยวิศวกร และประสานหน่วยงานที่ดูแลพื้นที่เพื่อเปลี่ยนมาตรวัดหรือเปิดใช้งานตามระเบียบ`,
    },
    {
      name: "ส่งมอบระบบและเริ่มบันทึกผลผลิต",
      text: `ส่งมอบแบบ as-built ของระบบไฟฟ้าและโครงสร้าง คู่มือการใช้งานอุปกรณ์ บันทึกการทดสอบ และเงื่อนไขการรับประกัน พร้อมอบรมการใช้งานและเริ่มบันทึกข้อมูลการผลิตไฟเพื่อเทียบกับค่าที่คาดหวังจากข้อมูล PVGIS`,
    },
  ];
}
