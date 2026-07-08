import { blogPosts } from "@/lib/blogData";
import { getProvinceBySlug } from "@shared/thaiProvinces";

export type SeoMeta = {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
};

const SITE_URL = "https://www.sirinx.co";
const SITE_NAME = "SIRINX";
const DEFAULT_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/sirinx-og-image-hbNko5JADXArPGo26hmGrN.png";

const metaByPath: Record<string, SeoMeta> = {
  "/": {
    path: "/",
    title:
      "SIRINX | Solar Carport ลดค่าไฟองค์กร พร้อม EV Charger, BESS และ AI Energy",
    description:
      "SIRINX ออกแบบและติดตั้ง Solar Carport, Rooftop Solar, BESS, EV Charger และ AI Energy Management สำหรับโรงงาน อาคาร โรงแรม และธุรกิจไทย",
  },
  "/solar-carport": {
    path: "/solar-carport",
    title: "Solar Carport สำหรับธุรกิจ | เปลี่ยนที่จอดรถเป็นโรงไฟฟ้า | SIRINX",
    description:
      "Solar Carport ผลิตไฟฟ้าจากลานจอดรถ ให้ร่มเงา รองรับ EV Charger และ BESS พร้อมประเมิน ROI จากข้อมูลไซต์จริงโดย SIRINX",
  },
  "/pricing": {
    path: "/pricing",
    title: "แพ็คเกจราคา Solar Carport | Start, Pro, Enterprise | SIRINX",
    description:
      "เปรียบเทียบแพ็คเกจ Solar Carport 10-500+ kWp พร้อม EV Charger, BESS, สิทธิประโยชน์ภาษี และ ROI สำหรับธุรกิจ",
  },
  "/solutions": {
    path: "/solutions",
    title: "โซลูชันพลังงานครบวงจร | Solar, BESS, EV, AI Energy | SIRINX",
    description:
      "รวมโซลูชัน Solar Carport, Rooftop Solar, Floating Solar, BESS, EV Charging, AI Energy Management และ O&M สำหรับองค์กร",
  },
  "/home-solution": {
    path: "/home-solution",
    title:
      "Home Solar Solution บ้านใหญ่และโฮมออฟฟิศ | Rooftop Solar, Carport, BESS, EV | SIRINX",
    description:
      "SIRINX Home Solar Solution สำหรับบ้านขนาดใหญ่ โฮมออฟฟิศ และโครงการหมู่บ้านพรีเมียมที่ใช้ไฟสูง พร้อม Rooftop Solar, Solar Carport, BESS, EV Charger, AI Energy Monitoring และหลักฐาน commissioning",
  },
  "/industries": {
    path: "/industries",
    title: "โซลูชันโซลาร์สำหรับอุตสาหกรรม โรงงาน โรงแรม และอาคาร | SIRINX",
    description:
      "ออกแบบระบบพลังงานสะอาดเฉพาะธุรกิจ โรงงาน เกษตรกรรม โรงแรม สถานศึกษา และอาคารพาณิชย์ พร้อมประเมินผลประหยัดจริง",
  },
  "/investment": {
    path: "/investment",
    title: "การลงทุนพลังงานสะอาดและ ROI Solar Carport | SIRINX",
    description:
      "วิเคราะห์รูปแบบการลงทุน Solar Carport ซื้อขาด ผ่อนชำระ หรือร่วมลงทุน พร้อมผลตอบแทน ภาษี และมูลค่า ESG",
  },
  "/projects": {
    path: "/projects",
    title: "ผลงาน Solar Carport และระบบพลังงานสะอาด | SIRINX",
    description:
      "ดูตัวอย่างโครงการ Solar Carport, BESS, EV Charging และระบบบริหารพลังงานที่ SIRINX ออกแบบและติดตั้งจริง",
  },
  "/strategy": {
    path: "/strategy",
    title: "กลยุทธ์พลังงานดิจิทัลสำหรับธุรกิจ | SIRINX",
    description:
      "แผนกลยุทธ์ Solar Digital Energy สำหรับลดต้นทุนไฟฟ้า เพิ่มข้อมูลพลังงาน และวางระบบพลังงานสะอาดระยะยาว",
  },
  "/blog": {
    path: "/blog",
    title: "บทความ Solar, BESS, EV Charger และ AI Energy | SIRINX",
    description:
      "รวมบทความความรู้ด้าน Solar Carport, Rooftop Solar, BESS, EV Charging, AI Energy, ROI, ภาษี และ ESG สำหรับธุรกิจไทย",
  },
  "/contact": {
    path: "/contact",
    title: "ติดต่อ SIRINX | นัดสำรวจหน้างาน Solar Carport ฟรี",
    description:
      "ติดต่อทีม SIRINX เพื่อขอใบเสนอราคา นัดสำรวจหน้างาน หรือปรึกษา Solar Carport, BESS, EV Charger และระบบลดค่าไฟองค์กร",
  },
  "/line": {
    path: "/line",
    title:
      "ติดต่อ SIRINX ผ่าน LINE Official | Solar Carport, Rooftop Solar, BESS, EV Charger",
    description:
      "เพิ่มเพื่อน LINE Official ของ SIRINX เพื่อส่งบิลค่าไฟ รูปพื้นที่ และขอประเมินระบบ Solar Carport, Rooftop Solar, BESS และ EV Charger เบื้องต้น",
  },
  "/assessment": {
    path: "/assessment",
    title: "ประเมิน Solar และคำนวณลดค่าไฟเบื้องต้น | SIRINX",
    description:
      "ประเมินขนาดระบบ Solar, Solar Carport, BESS และผลประหยัดค่าไฟเบื้องต้นจากข้อมูลธุรกิจของคุณ",
  },
  "/partner": {
    path: "/partner",
    title: "ร่วมเป็นพันธมิตรพลังงานสะอาดกับ SIRINX",
    description:
      "เปิดรับพันธมิตรด้าน EPC, EV Charging, BESS, อสังหาริมทรัพย์ และการลงทุนพลังงานสะอาดกับ SIRINX",
  },
  "/about": {
    path: "/about",
    title: "เกี่ยวกับ SIRINX | Solar Digital Agentic Company",
    description:
      "รู้จัก SIRINX บริษัทออกแบบ ติดตั้ง และบริหารระบบพลังงานสะอาดครบวงจร พร้อม AI Energy Management",
  },
  "/privacy": {
    path: "/privacy",
    title: "นโยบายความเป็นส่วนตัว | SIRINX",
    description:
      "นโยบายการเก็บ ใช้ และคุ้มครองข้อมูลส่วนบุคคลสำหรับผู้ใช้งานเว็บไซต์ SIRINX และผู้สนใจบริการพลังงานสะอาด",
  },
  "/terms": {
    path: "/terms",
    title: "เงื่อนไขการใช้งาน | SIRINX",
    description:
      "เงื่อนไขการใช้งานเว็บไซต์ SIRINX ข้อมูลบริการ ใบเสนอราคา การประเมินระบบ และข้อจำกัดความรับผิดชอบ",
  },
  "/cookies": {
    path: "/cookies",
    title: "Cookie Policy | SIRINX",
    description:
      "นโยบายคุกกี้ของเว็บไซต์ SIRINX สำหรับการวิเคราะห์การใช้งาน การปรับปรุงประสบการณ์ และการวัดผลบริการออนไลน์",
  },
};

function normalizePath(pathname: string) {
  const clean = pathname.split("?")[0].split("#")[0] || "/";
  return clean.length > 1 ? clean.replace(/\/$/, "") : clean;
}

function getProvinceSeoMeta(path: string): SeoMeta | null {
  if (!path.startsWith("/solar-carport/")) return null;

  const province = getProvinceBySlug(path.replace("/solar-carport/", ""));
  if (!province) return null;

  return {
    path,
    title: `ติดตั้ง Solar Carport ${province.nameTh} | โซลาร์ที่จอดรถ EV Charger BESS | SIRINX`,
    description: `SIRINX รับออกแบบและติดตั้ง Solar Carport ${province.nameTh} สำหรับโรงงาน โรงแรม อาคาร และลานจอดรถองค์กร พร้อม EV Charger, BESS, AI Energy, O&M และประเมินลดค่าไฟ 30-100% คืนทุนเฉลี่ย 3-5 ปีตามข้อมูลไซต์จริง`,
  };
}

export function getSeoMeta(pathname: string): SeoMeta {
  const path = normalizePath(pathname);

  const provinceMeta = getProvinceSeoMeta(path);
  if (provinceMeta) return provinceMeta;

  if (path.startsWith("/blog/")) {
    const slug = path.replace("/blog/", "");
    const post = blogPosts.find(item => item.slug === slug);
    if (post) {
      return {
        path,
        title: `${post.title} | SIRINX Blog`,
        description: post.excerpt,
        image: post.image,
      };
    }
  }

  return (
    metaByPath[path] ?? {
      path,
      title: "ไม่พบหน้าที่คุณต้องการ | SIRINX",
      description:
        "หน้านี้อาจถูกย้ายหรือลบไปแล้ว กรุณากลับไปหน้าหลักของ SIRINX",
      noindex: true,
    }
  );
}

export function absoluteUrl(path: string) {
  const cleanPath = path === "/" ? "/" : path.replace(/\/$/, "");
  return cleanPath === "/" ? `${SITE_URL}/` : `${SITE_URL}${cleanPath}/`;
}

export const seoDefaults = {
  siteName: SITE_NAME,
  siteUrl: SITE_URL,
  image: DEFAULT_IMAGE,
};
