import { blogPosts } from "@/lib/blogData";
import { getProvinceBySlug } from "@shared/thaiProvinces";
import {
  getPublicProjectDetail,
  isProjectDetailIndexable,
  projectsPageMeta,
} from "@shared/publicProjectContent";

export type SeoMeta = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  noindex?: boolean;
};

const SITE_URL = "https://www.sirinx.co";
const SITE_NAME = "SIRINX";
// Absolute on purpose: og:image is read by crawlers that may not resolve
// relative URLs, and this string is written straight into the tag by RouteSeo.
const DEFAULT_IMAGE = mediaAbsolute("sirinx-og-image-hbNko5JADXArPGo26hmGrN.png");

const metaByPath: Record<string, SeoMeta> = {
  "/": {
    path: "/",
    title:
      "SIRINX | Solar Carport วางแผนลดค่าไฟองค์กร พร้อม EV Charger, BESS & AI Energy",
    description:
      "SIRINX Solar Carport ผลิตไฟฟ้าจากที่จอดรถ รองรับ EV Charger + BESS + AI Energy พร้อมประเมินผลประหยัดและคืนทุนจากข้อมูลไซต์จริง",
  },
  "/solar-carport": {
    path: "/solar-carport",
    title: "Solar Carport โดย SIRINX | เปลี่ยนที่จอดรถเป็นโรงไฟฟ้า ผลิตไฟฟ้า+ร่มเงา+EV Charger",
    description:
      "Solar Carport ผลิตไฟฟ้าจากที่จอดรถ ให้ร่มเงา รองรับ EV Charging + BESS + AI Energy และประเมินความคุ้มค่าตามข้อมูลไซต์จริง",
  },
  "/provinces": {
    path: "/provinces",
    title: "Solar Carport 77 จังหวัด | เลือกจังหวัดที่ต้องการประเมิน | SIRINX",
    description:
      "เลือกจังหวัดเพื่อดูแนวทางออกแบบ Solar Carport, BESS, EV Charger และ AI Energy Management ของ SIRINX ครบทั้ง 77 จังหวัด พร้อมข้อมูลที่ต้องใช้สำรวจหน้างาน",
  },
  "/pricing": {
    path: "/pricing",
    title:
      "แพ็คเกจราคา Solar Carport | Start / Pro / Enterprise พร้อม EV Charger | SIRINX",
    description:
      "เปรียบเทียบกรอบบริการ Solar Carport ระดับ Start / Pro / Enterprise — ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV Charger และประเมินความคุ้มค่าตามไซต์จริง",
  },
  "/solutions": {
    path: "/solutions",
    title:
      "โซลูชันโซลาร์เซลล์ | Rooftop Solar, Floating Solar, BESS, AI Energy",
    description:
      "เลือกโซลูชันที่เหมาะกับธุรกิจคุณ — โซลาร์หลังคา, โซลาร์ลอยน้ำ, Solar Carport, แบตเตอรี่กักเก็บพลังงาน BESS และ AI วิเคราะห์การใช้ไฟฟ้าแบบ Real-time ลดค่าไฟทันที",
  },
  "/home-solution": {
    path: "/home-solution",
    title:
      "Home Solar Solution บ้านใหญ่และโฮมออฟฟิศ | Rooftop Solar, Carport, BESS, EV | SIRINX",
    description:
      "SIRINX Home Solar Solution สำหรับบ้านขนาดใหญ่ โฮมออฟฟิศ และโครงการหมู่บ้านพรีเมียมที่ใช้ไฟสูง พร้อม Rooftop Solar, Solar Carport, BESS, EV Charger, AI Energy Monitoring และหลักฐาน commissioning",
    image: `${SITE_URL}/assets/home-solution/home-solution-drone-hero.jpg`,
    imageWidth: 1672,
    imageHeight: 941,
  },
  "/industries": {
    path: "/industries",
    title: "โซลาร์เซลล์สำหรับโรงงาน โรงแรม เกษตร ภาครัฐ | ลดค่าไฟเฉพาะทาง",
    description:
      "โซลูชันโซลาร์เซลล์เฉพาะอุตสาหกรรม — โรงงาน โรงแรม เกษตร สถานศึกษา อาคารพาณิชย์ ภาครัฐ ออกแบบระบบตามรูปแบบการใช้ไฟจริง ลดค่าไฟทันที",
  },
  "/investment": {
    path: "/investment",
    title:
      "ลงทุนโซลาร์เซลล์ คุ้มค่าแค่ไหน? ROI, สิทธิ์ BOI, ค่าเสื่อมเร่ง | SIRINX",
    description:
      "วิเคราะห์ความคุ้มค่าลงทุนโซลาร์เซลล์ — ซื้อขาด PPA Leasing พร้อมตรวจสิทธิ BOI ภาษี ค่าเสื่อม และสมมติฐานคืนทุนตามเงื่อนไขล่าสุด",
  },
  "/projects": projectsPageMeta,
  "/strategy": {
    path: "/strategy",
    title: "วางแผนลดค่าไฟระยะยาว | กลยุทธ์ Solar + BESS + AI Energy | SIRINX",
    description:
      "วางกลยุทธ์พลังงานสะอาดสำหรับธุรกิจ — เริ่มจาก Solar Rooftop ต่อยอดด้วย BESS กักเก็บพลังงาน และ AI Energy Management ตามข้อมูลการใช้ไฟและข้อจำกัดของไซต์",
  },
  "/bess": {
    path: "/bess",
    title: "BESS / Battery Energy Storage System | SIRINX",
    description:
      "ระบบกักเก็บพลังงานแบตเตอรี่สำหรับองค์กรและธุรกิจ — ลดค่า demand charge สำรองไฟสำรอง และใช้พลังงานโซลาร์ได้รอบคืน ด้วยการออกแบบจากข้อมูลหน้างานจริง",
  },
  "/bess/factory": {
    path: "/bess/factory",
    title: "BESS สำหรับโรงงานอุตสาหกรรม | ลด demand charge สูงสุด 20%",
    description:
      "BESS ขนาดกลางถึงใหญ่สำหรับโรงงานที่ใช้ไฟมากกว่า 1 MW ช่วยลด peak และ smooth load ตามรูปแบบการใช้ไฟจริง พร้อมตัวเลขผลประหยัดจากข้อมูลจริง",
  },
  "/bess/hotel": {
    path: "/bess/hotel",
    title: "BESS สำหรับโรงแรมและรีสอร์ท | ลด AC peak ได้ 15-25%",
    description:
      "BESS ขนาดเล็กถึงกลางสำหรับโรงแรม ช่วยลดค่า AC peak และให้ไฟฟ้าสำรองห้องพักในช่วงเย็น ด้วยการออกแบบจากข้อมูลหน้างานจริง",
  },
  "/bess/peak-shaving": {
    path: "/bess/peak-shaving",
    title: "BESS Peak Shaving | ลด demand charge ได้ 30-40%",
    description:
      "BESS ตอบสนองเร็วช่วยลด peak demand โดยชาร์จเมื่อค่าไฟต่ำและจ่ายเมื่อค่าไฟสูง ลดได้ 30-40% ของค่าใช้จ่ายด้านพลังงาน",
  },
  "/bess/sizing": {
    path: "/bess/sizing",
    title: "BESS Sizing และการคำนวณขนาด | SIRINX",
    description:
      "การเลือกขนาด BESS ที่ถูกต้องครั้งแรก — วิเคราะห์ load profile 24 ชม. เพื่อคำนวณ kWh/kW ที่เหมาะสมกับงบประมาณและข้อจำกัดหน้างาน รับประกันผลประหยัดและคืนทุนที่ชัดเจน",
  },
  "/bess/safety-cost": {
    path: "/bess/safety-cost",
    title: "BESS ความปลอดภัยและค่าใช้จ่าย | SIRINX",
    description:
      "มาตรการความปลอดภัยครบถ้วน — เลือกเซลล์ LFP ผ่านมาตร IEC 62619 ติดตั้งครบตาม BS EN 62933 และมี BMS จัดการระบบโดยอัตโนมัติ 24/7",
  },
  "/blog": {
    path: "/blog",
    title:
      "บทความโซลาร์เซลล์ & พลังงานสะอาด | ความรู้ ROI, BESS, AI Energy | SIRINX",
    description:
      "อัพเดตความรู้พลังงานสะอาดล่าสุด — วิเคราะห์ ROI โซลาร์เซลล์, เทคโนโลยี BESS แบตเตอรี่, AI Energy Management, แนวโน้มราคาแผงโซลาร์ และสิทธิประโยชน์ทางภาษี",
  },
  "/contact": {
    path: "/contact",
    title: "นัดสำรวจหน้างานฟรี | ขอใบเสนอราคาโซลาร์เซลล์ | SIRINX",
    description:
      "ปรึกษาฟรี! นัดทีมวิศวกร SIRINX สำรวจหน้างาน ประเมินค่าไฟ และออกแบบระบบโซลาร์เซลล์เฉพาะอาคารของคุณตามข้อมูลจริง พร้อมช่องทางขอใบเสนอราคา โทร, LINE หรือกรอกแบบฟอร์ม",
  },
  "/line": {
    path: "/line",
    title: "ติดต่อ SIRINX ผ่าน LINE Official | Solar Carport, Rooftop Solar, BESS, EV Charger",
    description:
      "เพิ่มเพื่อน LINE Official ของ SIRINX เพื่อส่งบิลค่าไฟ รูปพื้นที่ และขอประเมินระบบ Solar Carport, Rooftop Solar, BESS และ EV Charger เบื้องต้น",
  },
  "/assessment": {
    path: "/assessment",
    title:
      "คำนวณค่าไฟที่ประหยัดได้ | ประเมินความคุ้มค่าโซลาร์เซลล์ฟรี | SIRINX",
    description:
      "กรอกข้อมูลค่าไฟรายเดือนเพื่อรับผลประเมินเบื้องต้น — คำนวณสมมติฐาน ROI ระยะเวลาคืนทุน และขนาดระบบ Solar ที่เหมาะกับธุรกิจคุณ",
  },
  "/partner": {
    path: "/partner",
    title: "ร่วมเป็นพันธมิตรพลังงานสะอาดกับ SIRINX",
    description:
      "เปิดรับพันธมิตรด้าน EPC, EV Charging, BESS, อสังหาริมทรัพย์ และการลงทุนพลังงานสะอาดกับ SIRINX",
  },
  "/about": {
    path: "/about",
    title: "SIRINX คือใคร? บริษัทติดตั้งโซลาร์เซลล์ + AI Energy ของไทย",
    description:
      "SIRINX ออกแบบ ติดตั้ง และดูแลระบบพลังงานสะอาดตามขอบเขตโครงการ พร้อมใช้ข้อมูลหน้างานเพื่อช่วยธุรกิจวางแผนลดต้นทุนพลังงาน",
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
    description: `SIRINX ออกแบบและติดตั้ง Solar Carport ${province.nameTh} สำหรับโรงงานและลานจอดรถ พร้อม EV Charger และ BESS โดยสำรวจพื้นที่และข้อมูลการใช้ไฟจริงก่อนออกแบบ`,
    // The same card the prerendered HTML carries, so the hydrated head cannot
    // disagree with what a crawler already read.
    image: `${SITE_URL}/provinces/${province.slug}-og.jpg`,
  };
}

function getProjectDetailSeoMeta(path: string): SeoMeta | null {
  if (!path.startsWith("/projects/")) return null;

  const slug = path.replace("/projects/", "");
  const project = getPublicProjectDetail(slug);
  if (!project) return null;

  return {
    path,
    title: project.seoTitle,
    description: project.seoDescription,
    noindex: !isProjectDetailIndexable(project),
  };
}

export function getSeoMeta(pathname: string): SeoMeta {
  const path = normalizePath(pathname);

  const provinceMeta = getProvinceSeoMeta(path);
  if (provinceMeta) return provinceMeta;

  const projectDetailMeta = getProjectDetailSeoMeta(path);
  if (projectDetailMeta) return projectDetailMeta;

  if (path.startsWith("/blog/")) {
    const slug = path.replace("/blog/", "");
    const post = blogPosts.find(item => item.slug === slug);
    if (post) {
      return {
        path,
        title: `${post.title} | SIRINX Blog`,
        description: post.excerpt,
        image: post.image,
        // blogData images are served by Unsplash at w=600&h=400.
        imageWidth: 600,
        imageHeight: 400,
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
  imageWidth: 1200,
  imageHeight: 630,
};
import { mediaAbsolute } from "@/lib/media";
