import { registerPageTranslations, type TranslationDict } from "../index";

const dict: TranslationDict = {
  "sg.title": {
    th: "Motion Styleguide",
    en: "Motion Styleguide",
    cn: "Motion Styleguide",
  },
  "sg.intro": {
    th: "ทุกพฤติกรรม motion ที่ใช้จริงบนเว็บนี้ ลงทะเบียนและถูกบังคับด้วย tests — ตัวอย่างเคลื่อนไหวเริ่มเมื่อกดปุ่มเท่านั้น",
    en: "Every shipped motion behavior on this site, registered and enforced in tests. Probes are opt-in per click.",
    cn: "Every shipped motion behavior on this site, registered and enforced in tests. Probes are opt-in per click.",
  },
  "sg.runProbe": {
    th: "ทดลองเคลื่อนไหว",
    en: "Run probe",
    cn: "Run probe",
  },
};

registerPageTranslations("styleguide", dict);
