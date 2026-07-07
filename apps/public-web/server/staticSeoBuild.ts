import fs from "node:fs";
import path from "node:path";
import {
  PRODUCTION_BASE_URL,
  getPageMeta,
  getStaticSeoRoutes,
  injectOgTags,
  thaiProvinces,
} from "./ogTags";

const distPublic = path.resolve(import.meta.dirname, "..", "dist", "public");
const distAssets = path.join(distPublic, "assets");
const indexPath = path.join(distPublic, "index.html");
const now = new Date().toISOString();
const mobileFirstHeroImageSizes = "(max-width: 767px) 80vw, 100vw";
let initialRuntimeAssets = new Set<string>();

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

function buildRobots() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "",
    `Sitemap: ${PRODUCTION_BASE_URL}/sitemap.xml`,
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
  ["/partner", ["Partner-"]],
  ["/pricing", ["Pricing-"]],
  ["/privacy", ["Privacy-"]],
  ["/projects", ["Projects-"]],
  ["/solar-carport", ["SolarCarport-"]],
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
  return `<main data-sirinx-static-shell="home">
      <section class="relative min-h-[92vh] flex items-center overflow-hidden bg-background text-foreground">
        <picture class="absolute inset-0 block h-full w-full">
          <source type="image/avif" srcset="/assets/optimized/solar-carport-hero-640.avif 640w, /assets/optimized/solar-carport-hero-960.avif 960w, /assets/optimized/solar-carport-hero-1280.avif 1280w" sizes="${mobileFirstHeroImageSizes}" />
          <img src="/assets/optimized/solar-carport-hero-960.jpg" srcset="/assets/optimized/solar-carport-hero-640.jpg 640w, /assets/optimized/solar-carport-hero-960.jpg 960w, /assets/optimized/solar-carport-hero-1280.jpg 1280w" sizes="${mobileFirstHeroImageSizes}" alt="Solar Carport" width="1280" height="720" class="h-full w-full object-cover" fetchpriority="high" />
        </picture>
        <div class="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/30"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
        <div class="container relative z-10 pt-20">
          <div class="max-w-3xl">
            <span class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-accent-primary bg-accent-glow border border-border-accent rounded-full mb-6">Solar Carport</span>
            <h1 class="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.1] mb-2">เปลี่ยนที่จอดรถ</h1>
            <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gradient-accent leading-[1.1] mb-6">เป็นโรงไฟฟ้าพลังงานแสงอาทิตย์</h2>
            <p class="text-lg sm:text-xl text-text-secondary leading-relaxed mb-8 max-w-xl">ผลิตไฟฟ้า ให้ร่มเงา รองรับ EV Charger ลดค่าไฟ 30-100% คืนทุน 3-5 ปีโดยประมาณตามข้อมูลไซต์จริง</p>
            <div class="flex flex-col sm:flex-row gap-4">
              <a href="/contact?interest=solar-carport" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg">ขอใบเสนอราคา Solar Carport</a>
              <a href="/projects" class="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent-outline rounded-lg">ดูผลงานจริง</a>
            </div>
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

  return html;
}

if (!fs.existsSync(indexPath)) {
  throw new Error(`Missing build index: ${indexPath}`);
}

const baseHtml = fs.readFileSync(indexPath, "utf-8");
initialRuntimeAssets = getInitialRuntimeAssets(baseHtml);
const routes = Array.from(new Set(getStaticSeoRoutes()));

for (const route of routes) {
  const html = injectStaticShell(
    injectRouteModulePreloads(
      injectOgTags(baseHtml, route, PRODUCTION_BASE_URL),
      route
    ),
    route
  );
  writeFile(routeToIndexPath(route), html);
}

writeFile(path.join(distPublic, "sitemap.xml"), buildSitemap(routes));
writeFile(path.join(distPublic, "robots.txt"), buildRobots());

console.log(
  JSON.stringify(
    {
      generatedSeoRoutes: routes.length,
      provinceRoutes: thaiProvinces.length,
      sampleProvinceMeta: getPageMeta("/solar-carport/phitsanulok"),
    },
    null,
    2
  )
);
