import fs from "node:fs";
import path from "node:path";
import {
  PRODUCTION_BASE_URL,
  getPageMeta,
  getSitemapRoutes,
  getStaticSeoRoutes,
  injectOgTags,
  thaiProvinces,
} from "./ogTags";
import {
  assertSiteContentRegistryIntegrity,
  getStaticProvinceCanaryRecord,
  getStaticProvinceCanaryRoutes,
} from "../shared/siteContentRegistry";
import { buildProvinceLongformHtml } from "../shared/provinceLongformHtml";
import { buildStaticRouteShell } from "../shared/staticRouteShell";

const distPublic = path.resolve(import.meta.dirname, "..", "dist", "public");
const distAssets = path.join(distPublic, "assets");
const indexPath = path.join(distPublic, "index.html");
const now = new Date().toISOString();
const mobileFirstHeroImageSizes = "(max-width: 767px) 80vw, 100vw";
let initialRuntimeAssets = new Set<string>();
const staticProvinceCanaryRoutes = new Set(getStaticProvinceCanaryRoutes());

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

function routeToIndexPath(route: string) {
  if (route === "/") return indexPath;
  return path.join(distPublic, route.replace(/^\//, ""), "index.html");
}

function priorityForRoute(route: string) {
  if (route === "/") return "1.0";
  if (route === "/solar-carport") return "0.95";
  if (route === "/provinces") return "0.80";
  if (route.startsWith("/solar-carport/")) return "0.75";
  if (
    [
      "/assessment",
      "/contact",
      "/pricing",
      "/projects",
      "/home-solution",
    ].includes(route)
  )
    return "0.85";
  return "0.70";
}

function changefreqForRoute(route: string) {
  if (route === "/" || route === "/solar-carport") return "weekly";
  if (route.startsWith("/solar-carport/")) return "monthly";
  return "monthly";
}

function buildSitemap(routes: string[]) {
  const urls = routes
    .map(route => {
      const loc =
        route === "/"
          ? `${PRODUCTION_BASE_URL}/`
          : `${PRODUCTION_BASE_URL}${route.replace(/\/$/, "")}/`;
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${now}</lastmod>`,
        `    <changefreq>${changefreqForRoute(route)}</changefreq>`,
        `    <priority>${priorityForRoute(route)}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/**
 * AI-crawler policy: Commander decision 2026-09-26 — เปิดทุก bot (retrieval AND
 * training crawlers) เพื่อการมองเห็นสูงสุดในคำตอบ AI. /admin ยังห้ามทุก bot.
 * นโยบายอ้างอิง: docs/seo/SEO_AEO_GEO_MASTERY_PLAN_20260926.md §3.4.
 */
const AI_BOTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "Bytespider",
];

/**
 * RSS 2.0 feed — a syndication channel for the pages that matter, built
 * from the same metadata registry as the titles and descriptions so the feed
 * cannot claim anything the pages do not.
 */
function buildFeed(routes: string[]) {
  const esc = (value: string) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const items = routes
    .map(route => {
      const meta = getPageMeta(route);
      if (!meta?.title) return null;
      const url = `${PRODUCTION_BASE_URL}${route === "/" ? "/" : `${route}/`}`;
      return [
        "    <item>",
        `      <title>${esc(meta.title)}</title>`,
        `      <link>${esc(url)}</link>`,
        `      <guid isPermaLink="true">${esc(url)}</guid>`,
        `      <description>${esc(meta.description ?? "")}</description>`,
        "    </item>",
      ].join("\n");
    })
    .filter((item): item is string => Boolean(item))
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    "    <title>SIRINX — Solar Carport, BESS, EV Charger (Thailand)</title>",
    `    <link>${esc(PRODUCTION_BASE_URL)}/</link>`,
    "    <description>ออกแบบและติดตั้ง Solar Carport, BESS และ EV Charger สำหรับองค์กรในประเทศไทย พร้อมข้อมูลรายจังหวัดจากข้อมูลหน้างานจริง</description>",
    "    <language>th</language>",
    `    <lastBuildDate>${now}</lastBuildDate>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

function buildRobots() {
  const lines = ["User-agent: *", "Allow: /", "Disallow: /admin", ""];
  for (const bot of AI_BOTS) {
    lines.push(`User-agent: ${bot}`, "Allow: /", "Disallow: /admin", "");
  }
  lines.push(`Sitemap: ${PRODUCTION_BASE_URL}/sitemap.xml`, "");
  return lines.join("\n");
}

/**
 * llms.txt — สรุปโครงสร้างเว็บแบบ markdown ให้ AI อ่าน (Google ไม่ใช้ไฟล์นี้
 * แต่ ChatGPT/Perplexity/บริการอื่นอาจใช้ — ต้นทุนต่ำ ไม่กระทบ SEO เดิม).
 */
function buildLlmsTxt() {
  return [
    "# SIRINX — Solar Carport, BESS, EV Charger & AI Energy Management (Thailand)",
    "",
    "> SIRINX ออกแบบและติดตั้ง Solar Carport, ระบบกักเก็บพลังงาน (BESS), EV Charging และ AI Energy Management สำหรับองค์กรในประเทศไทย — ประเมินผลจากข้อมูลหน้างานจริง ไม่สัญญาตัวเลขลอย ๆ",
    "",
    "## หน้าหลัก",
    "",
    `- [หน้าแรก](${PRODUCTION_BASE_URL}/): ภาพรวมบริการ Solar Carport + BESS + AI + EV`,
    `- [Solar Carport](${PRODUCTION_BASE_URL}/solar-carport/): รายละเอียดบริการหลัก`,
    `- [บริการรายจังหวัด 77 จังหวัด](${PRODUCTION_BASE_URL}/provinces/): หน้าข้อมูลเฉพาะจังหวัดพร้อมตัวเลขพลังงานแสงอาทิตย์จริง (PVGIS v5.3, 2005–2023)`,
    `- [ราคาและแพ็กเกจ](${PRODUCTION_BASE_URL}/pricing/)`,
    `- [ประเมินความคุ้มค่า](${PRODUCTION_BASE_URL}/assessment/)`,
    `- [ผลงานติดตั้งจริง](${PRODUCTION_BASE_URL}/projects/)`,
    `- [บทความ](${PRODUCTION_BASE_URL}/blog/)`,
    `- [ติดต่อ/นัดสำรวจหน้างาน](${PRODUCTION_BASE_URL}/contact/)`,
    "",
    "## หมายเหตุสำหรับ AI",
    "",
    "- ข้อมูลพลังงานรายจังหวัดมาพร้อมแหล่งอ้างอิง (PVGIS-ERA5) และเป็น climate normals ไม่ใช่คำสัญญาประหยัด",
    "- ตัวเลขผลตอบแทน/คืนทุนต้องประเมินจากข้อมูลหน้างานรายโครงการ",
    "- ข้อมูลติดต่อที่ยืนยันแล้วอยู่ที่หน้า /contact/ เท่านั้น",
    "",
  ].join("\n");
}

const routeChunkPrefixes = new Map<string, string[]>([
  ["/", ["Home-"]],
  ["/about", ["About-"]],
  ["/assessment", ["SolarAssessment-"]],
  ["/blog", ["Blog-"]],
  ["/contact", ["Contact-"]],
  ["/cookies", ["Cookies-"]],
  ["/home-solution", ["HomeSolution-"]],
  ["/industries", ["Industries-"]],
  ["/investment", ["InvestmentTaxHub-"]],
  ["/line", ["Line-"]],
  ["/partner", ["Partner-"]],
  ["/pricing", ["Pricing-"]],
  ["/privacy", ["Privacy-"]],
  ["/projects", ["Projects-"]],
  ["/solar-carport", ["SolarCarport-"]],
  ["/provinces", ["Provinces-"]],
  ["/solutions", ["Solutions-"]],
  ["/strategy", ["Strategy-"]],
  ["/terms", ["Terms-"]],
]);

function getRouteChunkPrefixes(route: string) {
  if (route.startsWith("/solar-carport/"))
    return routeChunkPrefixes.get("/solar-carport") ?? [];
  if (route.startsWith("/blog/")) return ["BlogPost-"];
  return routeChunkPrefixes.get(route) ?? [];
}

function findBuiltAsset(prefix: string) {
  if (!fs.existsSync(distAssets)) return null;

  const match = fs
    .readdirSync(distAssets)
    .find(fileName => fileName.startsWith(prefix) && fileName.endsWith(".js"));

  return match ?? null;
}

function getInitialRuntimeAssets(html: string) {
  const assets = new Set<string>();
  const patterns = [
    /<script[^>]+src="\/assets\/([^"]+\.js)"/g,
    /<link[^>]+rel="modulepreload"[^>]+href="\/assets\/([^"]+\.js)"/g,
  ];

  for (const pattern of patterns) {
    for (const match of Array.from(html.matchAll(pattern))) {
      assets.add(match[1]);
    }
  }

  return assets;
}

function injectRouteModulePreloads(html: string, route: string) {
  const files = getRouteChunkPrefixes(route)
    .map(findBuiltAsset)
    .filter((fileName): fileName is string => Boolean(fileName))
    .filter(
      fileName =>
        !initialRuntimeAssets.has(fileName) &&
        !html.includes(`/assets/${fileName}`)
    );

  if (files.length === 0) return html;

  const tags = files
    .map(
      fileName =>
        `    <link rel="modulepreload" crossorigin href="/assets/${fileName}">`
    )
    .join("\n");

  return html.replace("</head>", `${tags}\n  </head>`);
}

function buildStaticHomeShell() {
  // Province pages were reachable only through /provinces/, putting them two
  // clicks from the homepage. Competitors with location pages sit one click
  // away, so list them here as well.
  const provinceLinks = thaiProvinces
    .map(province => {
      const slug = escapeHtml(province.slug);
      const nameTh = escapeHtml(province.nameTh);
      return `            <li><a href="/solar-carport/${slug}/" class="underline-offset-4 hover:underline">${nameTh}</a></li>`;
    })
    .join("\n");

  return `<main data-sirinx-static-shell="home">
      <nav aria-label="เมนูหลัก" class="border-b border-border bg-background/90 px-4 py-3 sm:px-6">
        <ul class="container mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <li><a href="/" class="underline-offset-4 hover:underline">หน้าแรก</a></li>
          <li><a href="/solar-carport/" class="underline-offset-4 hover:underline">Solar Carport</a></li>
          <li><a href="/provinces/" class="underline-offset-4 hover:underline">บริการ 77 จังหวัด</a></li>
          <li><a href="/projects/" class="underline-offset-4 hover:underline">ผลงาน</a></li>
          <li><a href="/pricing/" class="underline-offset-4 hover:underline">ราคา</a></li>
          <li><a href="/assessment/" class="underline-offset-4 hover:underline">ประเมินความคุ้มค่า</a></li>
          <li><a href="/contact/" class="underline-offset-4 hover:underline">ติดต่อ</a></li>
        </ul>
      </nav>
      <section class="relative min-h-[92vh] flex items-center overflow-hidden bg-background text-foreground">
        <img src="/assets/projects/ruenphae/20260924/1000076001.jpg" alt="Solar rooftop installation at Ruenphae Royal Park Hotel" width="1280" height="721" class="absolute inset-0 h-full w-full object-cover" fetchpriority="high" />
        <div class="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/30"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        <div class="container relative z-10 pt-20">
          <div class="max-w-3xl">
            <span class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-accent-primary bg-accent-glow border border-border-accent rounded-full mb-6">ผลงานติดตั้งจริง</span>
            <h1 class="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.1] mb-2">Solar Carport</h1>
            <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gradient-accent leading-[1.1] mb-6">โรงแรมเรือนแพ รอยัลปาร์ค</h2>
            <p class="text-lg sm:text-xl text-text-secondary leading-relaxed mb-8 max-w-xl">ภาพงานติดตั้งจริงจากระบบพลังงานและ Solar Rooftop โดยไม่อ้างตัวเลขที่ยังไม่ผ่านการตรวจหลักฐาน</p>
            <div class="flex flex-col sm:flex-row gap-4">
              <a href="/projects/ruenphae-royal-park" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg">ดูผลงานติดตั้งจริง</a>
              <a href="/contact?interest=solar-carport" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent-outline rounded-lg">ประเมินโครงการของคุณ</a>
            </div>
          </div>
        </div>
      </section>
      <section class="bg-background px-4 py-16 text-foreground sm:px-6 lg:py-24">
        <div class="container mx-auto max-w-5xl">
          <h2 class="font-display text-2xl font-bold leading-tight sm:text-3xl">บริการ Solar Carport ครบ 77 จังหวัด</h2>
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-text-secondary">เลือกจังหวัดเพื่อดูแนวทางออกแบบและข้อมูลพลังงานแสงอาทิตย์ของพื้นที่นั้น แต่ละจังหวัดคำนวณจากข้อมูลหน้างานจริง ไม่ใช่ค่ากลาง</p>
          <ul class="mt-8 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
${provinceLinks}
          </ul>
          <div class="mt-10 flex flex-wrap gap-4">
            <a href="/provinces/" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline">ดูทั้ง 77 จังหวัด</a>
            <a href="/contact?interest=solar-carport" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent">ส่งข้อมูลโครงการ</a>
          </div>
        </div>
      </section>
    </main>`;
}

function buildStaticHomeSolutionShell() {
  return `<main data-sirinx-static-shell="home-solution">
      <section class="relative min-h-[92vh] overflow-hidden bg-background text-foreground">
        <picture class="absolute inset-0 block h-full w-full">
          <source type="image/avif" srcset="/assets/home-solution/home-solution-drone-hero-640.avif 640w, /assets/home-solution/home-solution-drone-hero-960.avif 960w, /assets/home-solution/home-solution-drone-hero-1280.avif 1280w" sizes="${mobileFirstHeroImageSizes}" />
          <img src="/assets/home-solution/home-solution-drone-hero-960.jpg" srcset="/assets/home-solution/home-solution-drone-hero-640.jpg 640w, /assets/home-solution/home-solution-drone-hero-960.jpg 960w, /assets/home-solution/home-solution-drone-hero-1280.jpg 1280w" sizes="${mobileFirstHeroImageSizes}" alt="มุมโดรนโครงการบ้านขนาดใหญ่และโฮมออฟฟิศพร้อมระบบโซลาร์ SIRINX" width="1280" height="720" class="h-full w-full object-cover" fetchpriority="high" />
        </picture>
        <div class="absolute inset-0 bg-gradient-to-r from-background via-background/78 to-background/20"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        <div class="container relative z-10 flex min-h-[92vh] items-center pt-24 pb-16">
          <div class="max-w-3xl">
            <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-border-accent bg-accent-glow px-3 py-1.5 text-xs font-semibold text-accent-primary">Home Solution for high-load residences</div>
            <h1 class="mb-6 font-display text-3xl font-bold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">Solar สำหรับบ้านใหญ่ <span class="block text-gradient-accent">และโฮมออฟฟิศที่ใช้ไฟสูง</span></h1>
            <p class="mb-8 max-w-2xl text-sm leading-7 text-text-secondary sm:text-lg sm:leading-relaxed">SIRINX ออกแบบโซลาร์บ้านใหญ่ ครอบคลุมหลังคา คาร์พอร์ต จุดชาร์จ EV แบตเตอรี่ และระบบติดตามพลังงาน สำหรับบ้านพรีเมียม โฮมออฟฟิศ และหมู่บ้านจัดสรรที่ต้องการระบบที่ตรวจสอบได้จริง</p>
            <div class="flex flex-col gap-3 sm:flex-row">
              <a href="/contact?interest=home-solution" class="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent">นัดประเมินบ้าน / โฮมออฟฟิศ</a>
              <a href="/assessment" class="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline">ประเมินค่าไฟเบื้องต้น</a>
            </div>
          </div>
        </div>
      </section>
    </main>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function buildStaticProvinceCanaryShell(route: string) {
  if (!staticProvinceCanaryRoutes.has(route)) return null;

  const province = getStaticProvinceCanaryRecord(route);
  if (!province) return null;

  const provinceName = escapeHtml(province.nameTh);
  const provinceNameEn = escapeHtml(province.nameEn);
  const canonicalPath = escapeHtml(province.canonicalPath);
  const contactHref = `/contact?interest=solar-carport&amp;province=${encodeURIComponent(
    province.slug
  )}`;

  return `<main data-sirinx-static-shell="province">
      <section class="bg-background px-4 py-20 text-foreground sm:px-6 lg:py-28">
        <div class="container mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" class="mb-6 text-sm text-text-secondary">
            <a href="/solar-carport" class="underline-offset-4 hover:underline">Solar Carport</a>
            <span aria-hidden="true"> / </span>
            <span>${provinceName}</span>
          </nav>
          <span class="mb-5 inline-flex rounded-full border border-border-accent bg-accent-glow px-3 py-1.5 text-xs font-semibold text-accent-primary">Solar Carport Consultation</span>
          <h1 class="mb-6 font-display text-4xl font-bold leading-tight sm:text-5xl">Solar Carport ใน${provinceName}</h1>
          <p class="max-w-3xl text-lg leading-relaxed text-text-secondary">ข้อมูลเบื้องต้นสำหรับผู้ที่กำลังวางแผน Solar Carport ในจังหวัด${provinceName} (${provinceNameEn}) เพื่อใช้เตรียมข้อมูลหน้างาน การใช้ไฟ พื้นที่ใช้งาน และความต้องการ EV หรือระบบสำรองไฟก่อนปรึกษาวิศวกร</p>
          <div class="mt-10 grid gap-5 sm:grid-cols-3">
            <section class="rounded-xl border border-border bg-card p-5">
              <h2 class="font-display text-lg font-semibold">เริ่มจากข้อมูลไซต์จริง</h2>
              <p class="mt-2 text-sm leading-6 text-text-secondary">ขนาดพื้นที่ โครงสร้างเดิม และการใช้ไฟต้องตรวจสอบตามหน้างานก่อนออกแบบ</p>
            </section>
            <section class="rounded-xl border border-border bg-card p-5">
              <h2 class="font-display text-lg font-semibold">วางแผนการใช้งาน</h2>
              <p class="mt-2 text-sm leading-6 text-text-secondary">ระบุจำนวนที่จอดรถ ช่วงเวลาใช้ไฟ และความต้องการชาร์จ EV เพื่อให้ทีมประเมินทางเลือกได้ครบขึ้น</p>
            </section>
            <section class="rounded-xl border border-border bg-card p-5">
              <h2 class="font-display text-lg font-semibold">นัดประเมินกับทีม</h2>
              <p class="mt-2 text-sm leading-6 text-text-secondary">ผลการออกแบบ ราคา และการติดตั้งขึ้นอยู่กับข้อมูลจริงและการตรวจสอบของทีมวิศวกรรม</p>
            </section>
          </div>
          <div class="mt-10 flex flex-wrap gap-4">
            <a href="${contactHref}" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent">ขอคำปรึกษาเบื้องต้น</a>
            <a href="/solar-carport" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline">ดู Solar Carport</a>
            <a href="/assessment/" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline">ประเมินความคุ้มค่า</a>
            <a href="/pricing/" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline">ดูแพ็กเกจและขอบเขตงาน</a>
            <a href="/projects/" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline">ดูผลงานติดตั้งจริง</a>
          </div>
          <p class="mt-8 text-xs text-text-secondary">Canonical route: ${canonicalPath}</p>
        </div>
      </section>
    </main>`;
}

function buildStaticProvincesShell() {
  const links = thaiProvinces
    .map(province => {
      const slug = escapeHtml(province.slug);
      const nameTh = escapeHtml(province.nameTh);
      const nameEn = escapeHtml(province.nameEn);
      return `          <li><a href="/solar-carport/${slug}/">${nameTh} <span class="text-xs opacity-70">${nameEn}</span></a></li>`;
    })
    .join("\n");

  return `<main data-sirinx-static-shell="provinces">
      <section class="bg-background px-4 py-16 text-foreground sm:px-6 lg:py-24">
        <div class="container mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" class="mb-6 text-sm text-text-secondary">
            <a href="/" class="underline-offset-4 hover:underline">หน้าแรก</a>
            <span aria-hidden="true"> / </span>
            <a href="/solar-carport" class="underline-offset-4 hover:underline">Solar Carport</a>
            <span aria-hidden="true"> / </span>
            <span>77 จังหวัด</span>
          </nav>
          <h1 class="font-display text-3xl font-bold leading-tight sm:text-4xl">Solar Carport และระบบพลังงานสะอาดของ SIRINX ครบทุกจังหวัด</h1>
          <p class="mt-5 max-w-3xl text-base leading-relaxed text-text-secondary">เลือกจังหวัดของคุณเพื่อดูแนวทางออกแบบ Solar Carport, Rooftop Solar, BESS, EV Charger และ AI Energy Management พร้อมข้อมูลที่ต้องเตรียมก่อนนัดสำรวจหน้างาน ผลประเมินแต่ละโครงการคำนวณจากบิลค่าไฟและข้อมูลหน้างานจริง ไม่ใช่ค่ากลางของจังหวัด</p>
          <ul class="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
${links}
          </ul>
          <div class="mt-14 grid gap-6 sm:grid-cols-2">
            <section>
              <h2 class="font-display text-xl font-bold">สิ่งที่ได้ในการประเมินแต่ละจังหวัด</h2>
              <p class="mt-3 text-sm leading-6 text-text-secondary">ตัวเลขพลังงานแสงอาทิตย์จริงจาก PVGIS (ค่าปกติสภาพภูมิอากาศ ไม่ใช่คำสัญญาประหยัด) แนวทางการเชื่อมต่อเข้ากับ MEA หรือ PEA ตามพื้นที่ และประเด็นที่ต้องเตรียมก่อนนัดสำรวจหน้างาน เช่น พื้นที่ใช้งาน โครงสร้างเดิม และความต้องการชาร์จ EV</p>
            </section>
            <section>
              <h2 class="font-display text-xl font-bold">ขั้นตอนเริ่มต้น</h2>
              <p class="mt-3 text-sm leading-6 text-text-secondary">เลือกจังหวัดที่ติดตั้งหรือกำลังหาที่ จากนั้นประเมินความคุ้มค่าเบื้องต้น แล้วส่งข้อมูลเพื่อนัดสำรวจหน้างานโดยทีมวิศวกรรม ผลการออกแบบและราคาอ้างอิงจากข้อมูลจริงของโครงการ ไม่ใช่ค่ากลางของจังหวัด</p>
            </section>
          </div>
          <div class="mt-10 flex flex-wrap gap-4">
            <a href="/contact?interest=solar-carport" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent">ส่งข้อมูลโครงการ</a>
            <a href="/solar-carport" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline">กลับไปหน้า Solar Carport</a>
          </div>
        </div>
      </section>
    </main>`;
}

function injectStaticShell(html: string, route: string) {
  if (
    !html.includes('<div id="root"></div>') ||
    html.includes("data-sirinx-static-shell")
  ) {
    return html;
  }

  if (route === "/") {
    return html.replace(
      '<div id="root"></div>',
      `<div id="root">\n    ${buildStaticHomeShell()}\n    </div>`
    );
  }

  if (route === "/home-solution") {
    return html.replace(
      '<div id="root"></div>',
      `<div id="root">\n    ${buildStaticHomeSolutionShell()}\n    </div>`
    );
  }

  if (route === "/provinces") {
    return html.replace(
      '<div id="root"></div>',
      `<div id="root">\n    ${buildStaticProvincesShell()}\n    </div>`
    );
  }

  // Provinces with hand-written long-form content get the full article in
  // the static HTML — answer-engine crawlers do not execute the lazy chunk.
  const provinceLongformShell = buildProvinceLongformHtml(route);
  if (provinceLongformShell) {
    return html.replace(
      '<div id="root"></div>',
      `<div id="root">\n    ${provinceLongformShell}\n    </div>`
    );
  }

  const provinceCanaryShell = buildStaticProvinceCanaryShell(route);
  if (provinceCanaryShell) {
    return html.replace(
      '<div id="root"></div>',
      `<div id="root">\n    ${provinceCanaryShell}\n    </div>`
    );
  }

  // Anything still empty is a client-rendered route. Give it at least its own
  // title and description as real body text rather than shipping a blank page
  // to every crawler that does not run JavaScript.
  const genericRouteShell = buildStaticRouteShell(route, { escapeHtml });
  if (genericRouteShell) {
    return html.replace(
      '<div id="root"></div>',
      `<div id="root">\n    ${genericRouteShell}\n    </div>`
    );
  }

  return html;
}

if (!fs.existsSync(indexPath)) {
  throw new Error(`Missing build index: ${indexPath}`);
}

assertSiteContentRegistryIntegrity();

const baseHtml = fs.readFileSync(indexPath, "utf-8");
initialRuntimeAssets = getInitialRuntimeAssets(baseHtml);
const routes = Array.from(new Set(getStaticSeoRoutes()));

for (const route of routes) {
  const html = injectStaticShell(
    injectRouteModulePreloads(
      injectOgTags(baseHtml, route, PRODUCTION_BASE_URL, now),
      route
    ),
    route
  );
  writeFile(routeToIndexPath(route), html);
}writeFile(
  path.join(distPublic, "sitemap.xml"),
  buildSitemap(getSitemapRoutes(routes))
);
writeFile(path.join(distPublic, "robots.txt"), buildRobots());
writeFile(path.join(distPublic, "llms.txt"), buildLlmsTxt());
writeFile(path.join(distPublic, "feed.xml"), buildFeed(routes));

console.log(
  JSON.stringify(
    {
      generatedSeoRoutes: routes.length,
      provinceRoutes: thaiProvinces.length,
      staticProvinceCanaryRoutes: Array.from(staticProvinceCanaryRoutes),
      sampleProvinceMeta: getPageMeta("/solar-carport/phitsanulok"),
    },
    null,
    2
  )
);
