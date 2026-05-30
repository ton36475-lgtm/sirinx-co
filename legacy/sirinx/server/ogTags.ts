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

const OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/sirinx-og-image-hbNko5JADXArPGo26hmGrN.png";

const SITE_NAME = "SIRINX";
const PRODUCTION_BASE_URL = "https://www.sirinx.co";
const ASSET_CDN =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv";
const MOBILE_FIRST_HERO_IMAGE_SIZES = "(max-width: 767px) 80vw, 100vw";
const imageResizeBase = `${PRODUCTION_BASE_URL}/cdn-cgi/image/width=1280,quality=76,format=auto,fit=scale-down`;
const DEFAULT_TITLE =
  "SIRINX | Solar Carport วางแผนลดค่าไฟองค์กร พร้อม EV Charger, BESS & AI Energy";
const DEFAULT_DESC =
  "SIRINX Solar Carport ผลิตไฟฟ้าจากที่จอดรถ รองรับ EV Charger + BESS + AI Energy พร้อมประเมินผลประหยัดและคืนทุนจากข้อมูลไซต์จริง";

const homeSolutionFaqs = [
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

// Route-specific metadata map — SEO/AEO promotional copy
interface PageMeta {
  title: string;
  description: string;
  image?: string;
}

export function getProvinceRoute(province: ThaiProvince): string {
  return `/solar-carport/${province.slug}`;
}

function getProvinceMeta(province: ThaiProvince): PageMeta {
  return {
    title: `ติดตั้ง Solar Carport ${province.nameTh} | โซลาร์ที่จอดรถ EV Charger BESS | SIRINX`,
    description: `SIRINX รับออกแบบและติดตั้ง Solar Carport ${province.nameTh} สำหรับโรงงาน โรงแรม อาคาร และลานจอดรถองค์กร พร้อม EV Charger, BESS, AI Energy, O&M และประเมินลดค่าไฟ 30-100% คืนทุนเฉลี่ย 3-5 ปีตามข้อมูลไซต์จริง`,
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
      "SIRINX ผู้เชี่ยวชาญโซลาร์เซลล์ครบวงจร ออกแบบ ติดตั้ง ดูแลระบบด้วย AI ตลอด 25 ปี ช่วยธุรกิจไทยลดต้นทุนพลังงานด้วยเทคโนโลยีสะอาด",
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
  "/projects": {
    title: "ผลงานติดตั้ง Solar Carport & โซลาร์เซลล์จริง | ภาพโครงการ | SIRINX",
    description:
      "ผลงานจริง SIRINX — Solar Carport, Rooftop Solar, Floating Solar, Solar Farm พร้อมภาพถ่ายจริงจากหน้างานและตัวเลขผลประหยัดค่าไฟ",
  },
  "/strategy": {
    title: "วางแผนลดค่าไฟระยะยาว | กลยุทธ์ Solar + BESS + AI Energy | SIRINX",
    description:
      "วางกลยุทธ์พลังงานสะอาดสำหรับธุรกิจ — เริ่มจาก Solar Rooftop ต่อยอดด้วย BESS กักเก็บพลังงาน และ AI Energy Management ลดค่าไฟได้ทุกปีตลอด 25 ปี",
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
      "ปรึกษาฟรี! นัดทีมวิศวกร SIRINX สำรวจหน้างาน ประเมินค่าไฟ ออกแบบระบบโซลาร์เซลล์เฉพาะอาคารของคุณ พร้อมใบเสนอราคาภายใน 3 วัน โทร, LINE หรือกรอกแบบฟอร์ม",
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
      "เปรียบเทียบแพ็คเกจ Solar Carport 3 ระดับ Start / Pro / Enterprise (10-500+ kWp) — ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV Charger และประเมินคืนทุนตามไซต์จริง",
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

  // Blog post pattern: /blog/:slug
  if (cleanPath.startsWith("/blog/")) {
    const slug = cleanPath.replace("/blog/", "");
    const readableSlug = slug.replace(/-/g, " ");
    return {
      title: `${readableSlug.replace(/\b\w/g, c => c.toUpperCase())} | บทความโซลาร์เซลล์ SIRINX`,
      description: `อ่านบทความ "${readableSlug}" — ความรู้เชิงลึกเกี่ยวกับโซลาร์เซลล์ พลังงานสะอาด BESS และ AI Energy Management จากทีมวิศวกร SIRINX`,
    };
  }

  // Default fallback
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
  };
}

function getBreadcrumbItems(urlPath: string, baseUrl: string) {
  const cleanPath =
    urlPath.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  const items = [{ name: "หน้าแรก", item: baseUrl }];

  if (cleanPath.startsWith("/solar-carport")) {
    items.push({ name: "Solar Carport", item: `${baseUrl}/solar-carport` });
    const province = getProvinceFromPath(cleanPath);
    if (province) {
      items.push({
        name: `Solar Carport ${province.nameTh}`,
        item: `${baseUrl}${getProvinceRoute(province)}`,
      });
    }
  } else if (cleanPath !== "/") {
    items.push({
      name: getPageMeta(cleanPath).title.split("|")[0].trim(),
      item: `${baseUrl}${cleanPath}`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

export function getStructuredData(urlPath: string, baseUrl: string) {
  const cleanPath =
    urlPath.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  const meta = getPageMeta(cleanPath);
  const province = getProvinceFromPath(cleanPath);
  const isHomeSolution = cleanPath === "/home-solution";
  const areaServed = province
    ? { "@type": "AdministrativeArea", name: province.nameTh }
    : thaiProvinces.slice(0, 12).map(item => ({
        "@type": "AdministrativeArea",
        name: item.nameTh,
      }));

  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: SITE_NAME,
      url: baseUrl,
      logo: OG_IMAGE,
      description: DEFAULT_DESC,
      areaServed: {
        "@type": "Country",
        name: "Thailand",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        areaServed: "TH",
        availableLanguage: ["th", "en", "zh"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: SITE_NAME,
      url: baseUrl,
      inLanguage: "th-TH",
      publisher: { "@id": `${baseUrl}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${baseUrl}${cleanPath === "/" ? "" : cleanPath}#webpage`,
      url: `${baseUrl}${cleanPath === "/" ? "" : cleanPath}`,
      name: meta.title,
      description: meta.description,
      isPartOf: { "@id": `${baseUrl}/#website` },
      about: {
        "@id": isHomeSolution
          ? `${baseUrl}/home-solution#service`
          : `${baseUrl}/solar-carport#service`,
      },
      inLanguage: "th-TH",
    },
    {
      "@type": "Service",
      "@id": isHomeSolution
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
      provider: { "@id": `${baseUrl}/#organization` },
      areaServed,
      description: meta.description,
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "THB",
          description:
            "Project-specific quotation after site survey and engineering assessment.",
        },
      },
    },
    getBreadcrumbItems(cleanPath, baseUrl),
  ];

  if (isHomeSolution) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: homeSolutionFaqs.map(faq => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  } else if (province) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `SIRINX รับติดตั้ง Solar Carport ที่${province.nameTh}หรือไม่?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `รับวางแผน ออกแบบ และประสานทีมสำรวจสำหรับโครงการ Solar Carport ใน${province.nameTh} โดยประเมินจากพื้นที่จอดรถ ค่าไฟจริง load profile และเงื่อนไขหน้างานก่อนเสนอราคา`,
          },
        },
        {
          "@type": "Question",
          name: `Solar Carport ใน${province.nameTh}เหมาะกับธุรกิจแบบไหน?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: "เหมาะกับโรงงาน โรงแรม อาคารพาณิชย์ ศูนย์กระจายสินค้า สถานศึกษา หน่วยงาน และธุรกิจที่มีลานจอดรถหรือพื้นที่เปิดโล่งและต้องการลดต้นทุนพลังงานพร้อมรองรับ EV Charger",
          },
        },
      ],
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
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
      href: "/assets/optimized/solar-carport-hero-960.avif",
      imageSrcSet:
        "/assets/optimized/solar-carport-hero-640.avif 640w, /assets/optimized/solar-carport-hero-960.avif 960w, /assets/optimized/solar-carport-hero-1280.avif 1280w",
      imageSizes: MOBILE_FIRST_HERO_IMAGE_SIZES,
      type: "image/avif",
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
  if (
    cleanPath === "/solar-carport" ||
    cleanPath.startsWith("/solar-carport/")
  ) {
    return {
      href: `${imageResizeBase}/${ASSET_CDN}/carport-wide-1_30e3af4c.jpeg`,
      type: "image/jpeg",
    };
  }
  const heroByPath: Record<string, { src: string; type: string }> = {
    "/about": {
      src: `${ASSET_CDN}/hero-about-3Trik9L6DrdCwCcjCt2KVz.webp`,
      type: "image/webp",
    },
    "/solutions": {
      src: `${ASSET_CDN}/hero-solutions-AG25WEja6TRJEEzvpx3wZU.webp`,
      type: "image/webp",
    },
    "/industries": {
      src: `${ASSET_CDN}/sirinx-agrivoltaic-b6XSpaadLj5vpaTu52tenb.webp`,
      type: "image/webp",
    },
    "/investment": {
      src: `${ASSET_CDN}/hero-investment-fRtcNVseiLRqovGxudgo83.webp`,
      type: "image/webp",
    },
    "/projects": {
      src: `${ASSET_CDN}/carport-wide-1_30e3af4c.jpeg`,
      type: "image/jpeg",
    },
    "/strategy": {
      src: `${ASSET_CDN}/sirinx-smart-energy-JXCSVMQTKJHxRxSagYajgy.webp`,
      type: "image/webp",
    },
  };
  if (heroByPath[cleanPath]) {
    return {
      href: `${imageResizeBase}/${heroByPath[cleanPath].src}`,
      type: heroByPath[cleanPath].type,
    };
  }
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
  baseUrl: string
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

  return injectStructuredData(html, getStructuredData(urlPath, baseUrl));
}

export function getStaticSeoRoutes() {
  const coreRoutes = Object.keys(routeMetaMap);
  const provinceRoutes = thaiProvinces.map(getProvinceRoute);
  return [...coreRoutes, ...provinceRoutes];
}

export { PRODUCTION_BASE_URL, thaiProvinces };
