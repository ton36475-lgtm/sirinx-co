/**
 * Server-side Open Graph tag injection for social media crawlers.
 * LINE, Facebook, Messenger, Twitter crawlers don't execute JavaScript,
 * so we need to inject route-specific OG tags into the HTML before serving.
 *
 * Content strategy: SEO/AEO-focused promotional copy with high-value keywords.
 */

import {
  getProvinceBySlug,
  thaiProvinces,
  type ThaiProvince,
} from "../shared/thaiProvinces";
import {
  getAllProjectDetailSlugs,
  getPublicProjectDetail,
  isProjectDetailIndexable,
  projectsPageMeta,
} from "../shared/publicProjectContent";
import { blogPosts } from "../client/src/lib/blogData";
import { buildSeoBreadcrumbs, buildSeoGraph } from "../shared/seoGraph";
import { buildSolarCarportFaq } from "../shared/solarCarportFaq";
import { getProvinceLongformEntry } from "../shared/provinceLongformResolver";
import { longformWordCount } from "../shared/provinceLongform";
import { provinceInstallSteps } from "../shared/provinceHowTo";
import { homeSolutionFaq } from "../shared/homeSolutionFaq";

const OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/sirinx-og-image-hbNko5JADXArPGo26hmGrN.png";

const SITE_NAME = "SIRINX";
const PRODUCTION_BASE_URL = "https://www.sirinx.co";
const MOBILE_FIRST_HERO_IMAGE_SIZES = "(max-width: 767px) 80vw, 100vw";
const DEFAULT_TITLE =
  "SIRINX | Solar Carport วางแผนลดค่าไฟองค์กร พร้อม EV Charger, BESS & AI Energy";
const DEFAULT_DESC =
  "SIRINX Solar Carport ผลิตไฟฟ้าจากที่จอดรถ รองรับ EV Charger + BESS + AI Energy พร้อมประเมินผลประหยัดและคืนทุนจากข้อมูลไซต์จริง";

// Route-specific metadata map — SEO/AEO promotional copy
interface PageMeta {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
}

export function getProvinceRoute(province: ThaiProvince): string {
  return `/solar-carport/${province.slug}`;
}

function getProvinceMeta(province: ThaiProvince): PageMeta {
  return {
    title: `ติดตั้ง Solar Carport ${province.nameTh} | โซลาร์ที่จอดรถ EV Charger BESS | SIRINX`,
    description: `SIRINX ออกแบบและติดตั้ง Solar Carport ${province.nameTh} สำหรับโรงงานและลานจอดรถ พร้อม EV Charger และ BESS โดยสำรวจพื้นที่และข้อมูลการใช้ไฟจริงก่อนออกแบบ`,
  };
}

function getProjectDetailMeta(cleanPath: string): PageMeta | null {
  if (!cleanPath.startsWith("/projects/")) return null;

  const slug = cleanPath.replace("/projects/", "");
  const project = getPublicProjectDetail(slug);
  if (!project) return null;

  return {
    title: project.seoTitle,
    description: project.seoDescription,
    noindex: !isProjectDetailIndexable(project),
  };
}

const routeMetaMap: Record<string, PageMeta> = {
  "/": {
    title:
      "SIRINX | Solar Carport วางแผนลดค่าไฟองค์กร พร้อม EV Charger, BESS & AI Energy",
    description:
      "SIRINX Solar Carport ผลิตไฟฟ้าจากที่จอดรถ รองรับ EV Charger + BESS + AI Energy พร้อมประเมินผลประหยัดและคืนทุนจากข้อมูลไซต์จริง",
  },
  "/solar-carport": {
    title:
      "Solar Carport โดย SIRINX | เปลี่ยนที่จอดรถเป็นโรงไฟฟ้า ผลิตไฟฟ้า+ร่มเงา+EV Charger",
    description:
      "Solar Carport ผลิตไฟฟ้าจากที่จอดรถ ให้ร่มเงา รองรับ EV Charging + BESS + AI Energy และประเมินความคุ้มค่าตามข้อมูลไซต์จริง",
  },
  "/provinces": {
    title: "Solar Carport 77 จังหวัด | เลือกจังหวัดที่ต้องการประเมิน | SIRINX",
    description:
      "เลือกจังหวัดเพื่อดูแนวทางออกแบบ Solar Carport, BESS, EV Charger และ AI Energy Management ของ SIRINX ครบทั้ง 77 จังหวัด พร้อมข้อมูลที่ต้องใช้สำรวจหน้างาน",
  },
  "/home-solution": {
    title:
      "Home Solar Solution บ้านใหญ่และโฮมออฟฟิศ | Rooftop Solar, Carport, BESS, EV | SIRINX",
    description:
      "SIRINX Home Solar Solution สำหรับบ้านขนาดใหญ่ โฮมออฟฟิศ และโครงการหมู่บ้านพรีเมียมที่ใช้ไฟสูง พร้อม Rooftop Solar, Solar Carport, BESS, EV Charger, AI Energy Monitoring และหลักฐาน commissioning",
    image: `${PRODUCTION_BASE_URL}/assets/home-solution/home-solution-drone-hero.jpg`,
  },
  "/about": {
    title: "SIRINX คือใคร? บริษัทติดตั้งโซลาร์เซลล์ + AI Energy ครบวงจรของไทย",
    description:
      "SIRINX ออกแบบ ติดตั้ง และดูแลระบบพลังงานสะอาดตามขอบเขตโครงการ พร้อมใช้ข้อมูลหน้างานเพื่อช่วยธุรกิจวางแผนลดต้นทุนพลังงาน",
  },
  "/solutions": {
    title:
      "โซลูชันโซลาร์เซลล์ครบวงจร | Rooftop Solar, Floating Solar, BESS, AI Energy",
    description:
      "เลือกโซลูชันที่เหมาะกับธุรกิจคุณ — โซลาร์หลังคา, โซลาร์ลอยน้ำ, Solar Carport, แบตเตอรี่กักเก็บพลังงาน BESS และ AI วิเคราะห์การใช้ไฟฟ้าแบบ Real-time ลดค่าไฟทันที",
  },
  "/industries": {
    title: "โซลาร์เซลล์สำหรับโรงงาน โรงแรม เกษตร ภาครัฐ | ลดค่าไฟเฉพาะทาง",
    description:
      "โซลูชันโซลาร์เซลล์เฉพาะอุตสาหกรรม — โรงงาน โรงแรม เกษตร สถานศึกษา อาคารพาณิชย์ ภาครัฐ ออกแบบระบบตามรูปแบบการใช้ไฟจริง ลดค่าไฟทันที",
  },
  "/investment": {
    title:
      "ลงทุนโซลาร์เซลล์ คุ้มค่าแค่ไหน? ROI, สิทธิ์ BOI, ค่าเสื่อมเร่ง | SIRINX",
    description:
      "วิเคราะห์ความคุ้มค่าลงทุนโซลาร์เซลล์ — ซื้อขาด PPA Leasing พร้อมตรวจสิทธิ BOI ภาษี ค่าเสื่อม และสมมติฐานคืนทุนตามเงื่อนไขล่าสุด",
  },
  "/projects": projectsPageMeta,
  "/strategy": {
    title: "วางแผนลดค่าไฟระยะยาว | กลยุทธ์ Solar + BESS + AI Energy | SIRINX",
    description:
      "วางกลยุทธ์พลังงานสะอาดสำหรับธุรกิจ — เริ่มจาก Solar Rooftop ต่อยอดด้วย BESS กักเก็บพลังงาน และ AI Energy Management ตามข้อมูลการใช้ไฟและข้อจำกัดของไซต์",
  },
  "/blog": {
    title:
      "บทความโซลาร์เซลล์ & พลังงานสะอาด | ความรู้ ROI, BESS, AI Energy | SIRINX",
    description:
      "อัพเดตความรู้พลังงานสะอาดล่าสุด — วิเคราะห์ ROI โซลาร์เซลล์, เทคโนโลยี BESS แบตเตอรี่, AI Energy Management, แนวโน้มราคาแผงโซลาร์ และสิทธิประโยชน์ทางภาษี",
  },
  "/contact": {
    title: "นัดสำรวจหน้างานฟรี | ขอใบเสนอราคาโซลาร์เซลล์ | SIRINX",
    description:
      "ปรึกษาฟรี! นัดทีมวิศวกร SIRINX สำรวจหน้างาน ประเมินค่าไฟ และออกแบบระบบโซลาร์เซลล์เฉพาะอาคารของคุณตามข้อมูลจริง พร้อมช่องทางขอใบเสนอราคา โทร, LINE หรือกรอกแบบฟอร์ม",
  },
  "/line": {
    title: "ติดต่อ SIRINX ผ่าน LINE Official | Solar Carport, Rooftop Solar, BESS, EV Charger",
    description:
      "เพิ่มเพื่อน LINE Official ของ SIRINX เพื่อส่งบิลค่าไฟ รูปพื้นที่ และขอประเมินระบบ Solar Carport, Rooftop Solar, BESS และ EV Charger เบื้องต้น",
  },
  "/assessment": {
    title:
      "คำนวณค่าไฟที่ประหยัดได้ | ประเมินความคุ้มค่าโซลาร์เซลล์ฟรี | SIRINX",
    description:
      "กรอกข้อมูลค่าไฟรายเดือนเพื่อรับผลประเมินเบื้องต้น — คำนวณสมมติฐาน ROI ระยะเวลาคืนทุน และขนาดระบบ Solar ที่เหมาะกับธุรกิจคุณ",
  },
  "/pricing": {
    title:
      "แพ็คเกจราคา Solar Carport | Start / Pro / Enterprise พร้อม EV Charger | SIRINX",
    description:
      "เปรียบเทียบกรอบบริการ Solar Carport ระดับ Start / Pro / Enterprise — ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV Charger และประเมินความคุ้มค่าตามไซต์จริง",
  },
  "/partner": {
    title: "ร่วมเป็นพันธมิตรพลังงานสะอาดกับ SIRINX",
    description:
      "เปิดรับพันธมิตรด้าน EPC, EV Charging, BESS, อสังหาริมทรัพย์ และการลงทุนพลังงานสะอาดกับ SIRINX",
  },
  "/privacy": {
    title: "นโยบายความเป็นส่วนตัว | SIRINX",
    description:
      "นโยบายการเก็บ ใช้ และคุ้มครองข้อมูลส่วนบุคคลสำหรับผู้ใช้งานเว็บไซต์ SIRINX และผู้สนใจบริการพลังงานสะอาด",
  },
  "/terms": {
    title: "เงื่อนไขการใช้งาน | SIRINX",
    description:
      "เงื่อนไขการใช้งานเว็บไซต์ SIRINX ข้อมูลบริการ ใบเสนอราคา การประเมินระบบ และข้อจำกัดความรับผิดชอบ",
  },
  "/cookies": {
    title: "Cookie Policy | SIRINX",
    description:
      "นโยบายคุกกี้ของเว็บไซต์ SIRINX สำหรับการวิเคราะห์การใช้งาน การปรับปรุงประสบการณ์ และการวัดผลบริการออนไลน์",
  },
};

function getProvinceFromPath(cleanPath: string): ThaiProvince | undefined {
  if (!cleanPath.startsWith("/solar-carport/")) return undefined;
  return getProvinceBySlug(cleanPath.replace("/solar-carport/", ""));
}

/**
 * Get metadata for a given URL path.
 * Supports exact matches and blog slug patterns.
 */
export function getPageMeta(urlPath: string): PageMeta {
  // Clean the path
  const cleanPath =
    urlPath.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";

  // Check exact match first
  if (routeMetaMap[cleanPath]) {
    return routeMetaMap[cleanPath];
  }

  const province = getProvinceFromPath(cleanPath);
  if (province) {
    return getProvinceMeta(province);
  }

  const projectDetail = getProjectDetailMeta(cleanPath);
  if (projectDetail) {
    return projectDetail;
  }

  if (cleanPath.startsWith("/projects/")) {
    return {
      title: "ไม่พบรายละเอียดโครงการ | SIRINX",
      description:
        "รายละเอียดโครงการนี้ยังไม่มีข้อมูลสาธารณะที่ผ่านการตรวจสอบ หรือยังไม่อนุมัติให้เผยแพร่",
      noindex: true,
    };
  }

  // Blog post pattern: /blog/:slug — copy matches the client RouteSeo meta
  // (client/src/lib/seo.ts getSeoMeta) so crawler HTML and hydrated HTML agree.
  if (cleanPath.startsWith("/blog/")) {
    const slug = cleanPath.replace("/blog/", "");
    const post = blogPosts.find(item => item.slug === slug);
    if (post) {
      return {
        title: `${post.title} | SIRINX Blog`,
        description: post.excerpt,
        image: post.image,
      };
    }
    return {
      title: "ไม่พบหน้าที่คุณต้องการ | SIRINX",
      description:
        "หน้านี้อาจถูกย้ายหรือลบไปแล้ว กรุณากลับไปหน้าหลักของ SIRINX",
      noindex: true,
    };
  }

  // Default fallback
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
  };
}

function getBreadcrumbTrail(
  cleanPath: string,
  baseUrl: string,
  title: string,
  province?: ThaiProvince
): Array<{ name: string; item: string }> {
  return buildSeoBreadcrumbs({
    baseUrl,
    path: cleanPath,
    title,
    province: province
      ? { slug: province.slug, nameTh: province.nameTh }
      : null,
  });
}

export function getStructuredData(
  urlPath: string,
  baseUrl: string,
  /**
   * Build timestamp, used for Article.dateModified. The static build passes
   * the same value it writes into the sitemap <lastmod> so a page and its
   * sitemap entry can never disagree.
   */
  dateModified?: string
) {
  const cleanPath =
    urlPath.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  const meta = getPageMeta(cleanPath);
  const province = getProvinceFromPath(cleanPath);
  const isHomeSolution = cleanPath === "/home-solution";
  const isSolarCarport = cleanPath === "/solar-carport" || Boolean(province);
  const areaServed = province
    ? [{ name: province.nameTh }]
    : [{ name: "Thailand" }];

  // The province long-form renders its own visible FAQ (ProvinceLongform), and
  // this graph is allowed exactly one FAQPage node per document — so the
  // long-form questions join the shared solar-carport FAQ for province routes
  // instead of becoming a second FAQPage.
  const longformFaq = province
    ? (getProvinceLongformEntry(province.slug)?.faq ?? []).map(item => ({
        question: item.q,
        answer: item.a,
      }))
    : [];
  const longformEntry = province ? getProvinceLongformEntry(province.slug) : null;

  const faq = isHomeSolution
    ? homeSolutionFaq.map(item => ({
        question: item.question,
        answer: item.answer,
      }))
    : isSolarCarport
      ? [...buildSolarCarportFaq({ lang: "th", province }), ...longformFaq]
      : undefined;

  return buildSeoGraph({
    baseUrl,
    siteName: SITE_NAME,
    path: cleanPath,
    title: meta.title,
    description: meta.description,
    image: OG_IMAGE,
    organizationDescription: DEFAULT_DESC,
    service: {
      id: isHomeSolution
        ? `${baseUrl}/home-solution#service`
        : `${baseUrl}/solar-carport#service`,
      name: isHomeSolution
        ? "SIRINX Home Solar Solution"
        : province
          ? `Solar Carport ${province.nameTh}`
          : "Solar Carport by SIRINX",
      serviceType: isHomeSolution
        ? "Solar rooftop, solar carport, BESS, EV Charger, and AI energy monitoring for large homes and home offices"
        : "Solar Carport design, installation, EV Charger, BESS, AI Energy Management",
    },
    areaServed,
    breadcrumbs: getBreadcrumbTrail(cleanPath, baseUrl, meta.title, province),
    faq,
    // Province pages are long-form articles, so they get Article + HowTo.
    // Both are omitted elsewhere: a service landing page is not an article, and
    // a HowTo without real steps would be decoration. LocalBusiness and a
    // Person author stay absent on purpose — SIRINX has no verified address,
    // phone, or individual author, and the telephone field was deliberately
    // removed from this graph for exactly that reason.
    ...(province && longformEntry
      ? {
          article: {
            headline: `Solar Carport ใน${province.nameTh}`,
            dateModified: dateModified ?? new Date().toISOString(),
            wordCount: longformWordCount(longformEntry),
            section: "Solar Carport",
          },
          howTo: {
            name: `ขั้นตอนติดตั้ง Solar Carport ใน${province.nameTh}`,
            description: `ขั้นตอนติดตั้ง Solar Carport สำหรับอาคารใน${province.nameTh} ตั้งแต่สำรวจหน้างานจนถึงส่งมอบระบบ โดยขั้นตอนการขออนุญาตและการเชื่อมต่อต้องตรวจสอบกับหน่วยงานที่ดูแลพื้นที่อีกครั้ง`,
            steps: provinceInstallSteps(province.nameTh),
          },
        }
      : {}),
  });
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectStructuredData(html: string, data: unknown): string {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  // The static build is the single owner of the route JSON-LD. No data-rh here on
  // purpose: a data-rh tag is treated as client state, so the hydrated app would
  // either duplicate it or strip it. The client manages title, meta, canonical and
  // hreflang only, and never re-emits this graph.
  const script = `    <script type="application/ld+json" data-sirinx-seo="route">${payload}</script>\n`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${script}  </head>`);
  }
  return html;
}

function replaceMetaByName(
  html: string,
  name: string,
  content: string
): string {
  const pattern = new RegExp(`<meta\\s+name="${name}"[\\s\\S]*?\\/>`);
  const tag = `<meta name="${name}" content="${content}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function replaceMetaByProperty(
  html: string,
  property: string,
  content: string
): string {
  const pattern = new RegExp(`<meta\\s+property="${property}"[\\s\\S]*?\\/>`);
  const tag = `<meta property="${property}" content="${content}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function replaceCanonical(html: string, href: string): string {
  const pattern = /<link\s+rel="canonical"[\s\S]*?\/>/;
  const tag = `<link rel="canonical" href="${href}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function buildCanonicalUrl(baseUrl: string, urlPath: string): string {
  const cleanPath =
    urlPath.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  return cleanPath === "/" ? `${baseUrl}/` : `${baseUrl}${cleanPath}/`;
}

function getRouteHeroPreload(urlPath: string) {
  const cleanPath =
    urlPath.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  if (cleanPath === "/") {
    return {
      href: "/assets/projects/ruenphae/20260924/1000076001.jpg",
      type: "image/jpeg",
    };
  }
  if (cleanPath === "/home-solution") {
    return {
      href: "/assets/home-solution/home-solution-drone-hero-960.avif",
      imageSrcSet:
        "/assets/home-solution/home-solution-drone-hero-640.avif 640w, /assets/home-solution/home-solution-drone-hero-960.avif 960w, /assets/home-solution/home-solution-drone-hero-1280.avif 1280w",
      imageSizes: MOBILE_FIRST_HERO_IMAGE_SIZES,
      type: "image/avif",
    };
  }
  // Do not preload remote hero assets until the configured origin is proven
  // reachable from production. A preload for a 403 asset creates an avoidable
  // browser failure before the page can apply its own media fallback.
  return null;
}

function injectRouteHeroPreload(html: string, urlPath: string) {
  const preload = getRouteHeroPreload(urlPath);
  if (!preload) return html;
  const responsiveAttrs =
    "imageSrcSet" in preload
      ? ` imagesrcset="${preload.imageSrcSet}" imagesizes="${preload.imageSizes}"`
      : "";
  const tag = `    <link rel="preload" as="image" href="${preload.href}"${responsiveAttrs} type="${preload.type}" fetchpriority="high" />`;
  if (html.includes('rel="preload" as="image"')) {
    return html.replace(
      /    <link rel="preload" as="image"[\s\S]*?\/>\n/,
      `${tag}\n`
    );
  }
  if (html.includes("    <!-- Fonts -->")) {
    return html.replace("    <!-- Fonts -->", `${tag}\n\n    <!-- Fonts -->`);
  }
  return html.replace("</head>", `${tag}\n  </head>`);
}

function injectNoScriptStaticFallback(html: string, urlPath: string): string {
  const cleanPath =
    urlPath.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  if (
    cleanPath !== "/home-solution" ||
    html.includes("data-sirinx-static-fallback")
  ) {
    return html;
  }

  const fallback = `    <noscript data-sirinx-static-fallback="home-solution">
      <main>
        <h1>Home Solar Solution สำหรับบ้านใหญ่และโฮมออฟฟิศที่ใช้ไฟสูง</h1>
        <p>
          SIRINX ออกแบบระบบโซลาร์บ้านใหญ่ โฮมออฟฟิศ และโครงการหมู่บ้านพรีเมียม
          พร้อม Rooftop Solar, Solar Carport, EV Charger, BESS, AI Energy Monitoring
          และกระบวนการ commissioning ที่ตรวจสอบได้
        </p>
        <ul>
          <li>เหมาะกับบ้านที่มีค่าไฟสูง EV หลายคัน ห้องทำงาน server หรือโหลดสำคัญ</li>
          <li>ออกแบบจากบิลไฟ พฤติกรรมโหลด พื้นที่หลังคา และข้อจำกัดหน้างานจริง</li>
          <li>ตัวเลขประหยัดและคืนทุนเป็น scenario ตามข้อมูลไซต์ ไม่ใช่คำรับประกันเหมารวม</li>
        </ul>
        <p>
          <a href="/contact?interest=home-solution">นัดประเมินบ้านหรือโฮมออฟฟิศ</a>
          หรือ <a href="/assessment">ประเมินค่าไฟเบื้องต้น</a>
        </p>
      </main>
    </noscript>`;

  if (html.includes('<div id="root"></div>')) {
    return html.replace(
      '<div id="root"></div>',
      `<div id="root"></div>\n${fallback}`
    );
  }
  return html.replace("</body>", `${fallback}\n  </body>`);
}

/**
 * Inject OG meta tags into HTML template based on the requested URL.
 * Replaces existing meta tags in the template with route-specific values.
 */
export function injectOgTags(
  html: string,
  urlPath: string,
  baseUrl: string,
  /** Build timestamp forwarded to Article.dateModified; see getStructuredData. */
  dateModified?: string
): string {
  const meta = getPageMeta(urlPath);
  const image = meta.image || OG_IMAGE;
  const fullUrl = buildCanonicalUrl(baseUrl, urlPath);
  const title = escapeHtmlAttribute(meta.title);
  const description = escapeHtmlAttribute(meta.description);
  const imageUrl = escapeHtmlAttribute(image);
  const canonicalUrl = escapeHtmlAttribute(fullUrl);

  // Replace title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  // Replace meta description
  html = replaceMetaByName(html, "description", description);
  html = replaceMetaByName(
    html,
    "robots",
    meta.noindex ? "noindex, nofollow" : "index, follow",
  );

  // Replace OG tags
  html = replaceMetaByProperty(html, "og:title", title);
  html = replaceMetaByProperty(html, "og:description", description);
  html = replaceMetaByProperty(html, "og:image", imageUrl);

  // Add og:url if not present, or replace
  if (html.includes('property="og:url"')) {
    html = html.replace(
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${canonicalUrl}" />`
    );
  } else {
    html = html.replace(
      /<meta property="og:type"/,
      `<meta property="og:url" content="${canonicalUrl}" />\n    <meta property="og:type"`
    );
  }

  // Replace Twitter tags
  html = replaceMetaByName(html, "twitter:title", title);
  html = replaceMetaByName(html, "twitter:description", description);
  html = replaceMetaByName(html, "twitter:image", imageUrl);

  // Replace canonical URL
  html = replaceCanonical(html, canonicalUrl);
  html = injectRouteHeroPreload(html, urlPath);
  html = injectNoScriptStaticFallback(html, urlPath);

  return injectStructuredData(
    html,
    getStructuredData(urlPath, baseUrl, dateModified)
  );
}

/**
 * Every route that gets a prerendered HTML file. Includes project detail and
 * blog post pages even when noindex — the page must exist so deep links work
 * and crawlers see real metadata; whether it is discoverable is decided by
 * getSitemapRoutes() and the per-page robots meta.
 */
export function getStaticSeoRoutes() {
  const coreRoutes = Object.keys(routeMetaMap);
  const provinceRoutes = thaiProvinces.map(getProvinceRoute);
  const projectRoutes = getAllProjectDetailSlugs().map(
    slug => `/projects/${slug}`
  );
  const blogRoutes = blogPosts.map(post => `/blog/${post.slug}`);
  return [...coreRoutes, ...provinceRoutes, ...projectRoutes, ...blogRoutes];
}

/**
 * Sitemap routes = prerendered routes minus noindex ones. A project detail
 * page enters the sitemap automatically the moment its evidence gate passes
 * (isProjectDetailIndexable), without a code change.
 */
export function getSitemapRoutes(routes: string[]) {
  return routes.filter(route => !getPageMeta(route).noindex);
}

export { PRODUCTION_BASE_URL, thaiProvinces };
