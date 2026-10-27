import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import {
  getPageMeta,
  getStaticSeoRoutes,
  getStructuredData,
  injectOgTags,
  thaiProvinces,
} from "./ogTags";
import { getSeoMeta, seoDefaults } from "../client/src/lib/seo";
import { bessFaq } from "../shared/bessFaq";

const SITE_OG_CARD = "/assets/optimized/sirinx-og-card-1200x630.jpg";
const PUBLIC_DIR = fileURLToPath(new URL("../client/public/", import.meta.url));

describe("getPageMeta", () => {
  it("returns Solar Carport-focused meta for homepage", () => {
    const meta = getPageMeta("/");
    expect(meta.title).toContain("Solar Carport");
    expect(meta.title).toContain("ลดค่าไฟ");
    expect(meta.description).toContain("Solar Carport");
    expect(meta.description).toContain("EV Charger");
  });

  it("returns dedicated meta for /solar-carport", () => {
    const meta = getPageMeta("/solar-carport");
    expect(meta.title).toContain("Solar Carport");
    expect(meta.title).toContain("SIRINX");
    expect(meta.description).toContain("ผลิตไฟฟ้า");
    expect(meta.description).toContain("EV Charging");
  });

  it("returns dedicated meta for /home-solution", () => {
    const meta = getPageMeta("/home-solution");
    expect(meta.title).toContain("Home Solar Solution");
    expect(meta.title).toContain("บ้านใหญ่");
    expect(meta.description).toContain("โฮมออฟฟิศ");
    expect(meta.description).toContain("BESS");
    expect(meta.image).toContain(
      "/assets/home-solution/home-solution-drone-hero.jpg"
    );
  });

  it("returns promotional meta for /contact", () => {
    const meta = getPageMeta("/contact");
    expect(meta.title).toContain("นัดสำรวจหน้างานฟรี");
    expect(meta.description).toContain("ปรึกษาฟรี");
    expect(meta.description).toContain("ใบเสนอราคา");
  });

  it("returns keyword-rich meta for /solutions", () => {
    const meta = getPageMeta("/solutions");
    expect(meta.title).toContain("โซลาร์เซลล์");
    expect(meta.title).toContain("Rooftop Solar");
    expect(meta.description).toContain("ลดค่าไฟ");
  });

  it("returns SEO meta for /blog", () => {
    const meta = getPageMeta("/blog");
    expect(meta.title).toContain("โซลาร์เซลล์");
    expect(meta.description).toContain("ROI");
  });

  it("returns promotional meta for /about", () => {
    const meta = getPageMeta("/about");
    expect(meta.title).toContain("SIRINX");
    expect(meta.description).toContain("ลดต้นทุนพลังงาน");
  });

  it("returns industry-focused meta for /industries", () => {
    const meta = getPageMeta("/industries");
    expect(meta.title).toContain("โรงงาน");
    expect(meta.description).toContain("โรงแรม");
  });

  it("returns investment-focused meta for /investment", () => {
    const meta = getPageMeta("/investment");
    expect(meta.title).toContain("คุ้มค่า");
    expect(meta.description).toContain("BOI");
  });

  it("returns project portfolio meta for /projects", () => {
    const meta = getPageMeta("/projects");
    expect(meta.title).toContain("ผลงานติดตั้ง");
    expect(meta.description).toContain("ภาพผลงานติดตั้งจริง");
    expect(meta.description).toContain("โรงแรมโฮลาเทล");
  });

  it("returns assessment-focused meta for /assessment", () => {
    const meta = getPageMeta("/assessment");
    expect(meta.title).toContain("คำนวณค่าไฟ");
    expect(meta.description).toContain("ROI");
  });

  it("returns strategy meta for /strategy", () => {
    const meta = getPageMeta("/strategy");
    expect(meta.title).toContain("ลดค่าไฟระยะยาว");
  });

  it("matches blog slug meta to the post record (crawler/client parity)", () => {
    const meta = getPageMeta("/blog/rooftop-solar-roi-2025");
    expect(meta.title).toContain("Rooftop Solar ROI");
    expect(meta.title).toContain("SIRINX Blog");
    expect(meta.description).toContain("ผลตอบแทนการลงทุน");
    expect(meta.noindex).toBeUndefined();
  });

  it("marks unknown blog slugs noindex", () => {
    const meta = getPageMeta("/blog/not-a-post");
    expect(meta.noindex).toBe(true);
  });

  it("strips query params and hash", () => {
    const meta = getPageMeta("/contact?ref=line#form");
    expect(meta.title).toContain("นัดสำรวจหน้างานฟรี");
  });

  it("strips trailing slash", () => {
    const meta = getPageMeta("/solutions/");
    expect(meta.title).toContain("โซลาร์เซลล์");
  });

  it("returns default Solar Carport meta for unknown routes", () => {
    const meta = getPageMeta("/unknown-page");
    expect(meta.title).toContain("Solar Carport");
    expect(meta.description).toContain("Solar Carport");
  });

  it("returns province-specific Solar Carport meta for 77 province routes", () => {
    expect(thaiProvinces).toHaveLength(77);
    const routes = getStaticSeoRoutes().filter(route =>
      route.startsWith("/solar-carport/")
    );
    expect(routes).toHaveLength(77);

    const meta = getPageMeta("/solar-carport/phitsanulok");
    expect(meta.title).toContain("พิษณุโลก");
    expect(meta.description).toContain("Solar Carport");
    expect(meta.description).not.toContain("30-100%");
    expect(meta.description).not.toContain("3-5 ปี");
    expect(meta.description).toContain("ข้อมูลการใช้ไฟจริงก่อนออกแบบ");
  });
});

describe("injectOgTags", () => {
  const sampleHtml = `<!doctype html>
<html lang="th">
  <head>
    <title>SIRINX | Solar Carport วางแผนลดค่าไฟองค์กร พร้อม EV Charger, BESS & AI Energy</title>
    <meta name="description" content="default desc" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="default title" />
    <meta property="og:description" content="default desc" />
    <meta property="og:image" content="default.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="default title" />
    <meta name="twitter:description" content="default desc" />
    <meta name="twitter:image" content="default.png" />
    <link rel="canonical" href="https://example.com/" />
  </head>
  <body></body>
</html>`;

  it("injects promotional title for /contact", () => {
    const result = injectOgTags(
      sampleHtml,
      "/contact",
      "https://sirinxsolar-dfabnh7l.manus.space"
    );
    expect(result).toContain("<title>นัดสำรวจหน้างานฟรี");
  });

  it("injects og:title with SEO keywords for /contact", () => {
    const result = injectOgTags(
      sampleHtml,
      "/contact",
      "https://sirinxsolar-dfabnh7l.manus.space"
    );
    expect(result).toContain('og:title" content="นัดสำรวจหน้างานฟรี');
  });

  it("injects og:description with promotional copy for /contact", () => {
    const result = injectOgTags(
      sampleHtml,
      "/contact",
      "https://sirinxsolar-dfabnh7l.manus.space"
    );
    expect(result).toContain('og:description" content="ปรึกษาฟรี');
  });

  it("injects og:url with full URL", () => {
    const result = injectOgTags(
      sampleHtml,
      "/contact",
      "https://sirinxsolar-dfabnh7l.manus.space"
    );
    expect(result).toContain(
      'og:url" content="https://sirinxsolar-dfabnh7l.manus.space/contact/"'
    );
  });

  it("injects og:image from the site, not the dead CloudFront origin", () => {
    // This used to assert the d2xsxph8kpxj0f.cloudfront.net URL. That origin
    // started answering 403 AccessDenied to every crawler, so the assertion kept
    // passing while every link preview on the site rendered blank. The test now
    // pins the property to a path the site actually serves.
    const result = injectOgTags(
      sampleHtml,
      "/",
      "https://sirinxsolar-dfabnh7l.manus.space"
    );
    expect(result).toContain(`og:image" content="https://www.sirinx.co${SITE_OG_CARD}"`);
    expect(result).not.toContain("d2xsxph8kpxj0f.cloudfront.net");
  });

  it("serves the site-wide social card from the same build that writes the tag", () => {
    expect(existsSync(`${PUBLIC_DIR}${SITE_OG_CARD.slice(1)}`)).toBe(true);
  });

  it("does not hand a province card to a non-province page", () => {
    // The fallback used to be the Amnat Charoen card, so every pricing, contact
    // or blog preview named one province instead of SIRINX.
    const result = injectOgTags(sampleHtml, "/pricing", "https://www.sirinx.co");
    expect(result).toContain(`og:image" content="https://www.sirinx.co${SITE_OG_CARD}"`);
    expect(result).not.toMatch(/og:image" content="[^"]*\/provinces\//);
  });

  it("gives each province its own social card", () => {
    const home = injectOgTags(sampleHtml, "/solar-carport/bangkok/", "https://www.sirinx.co");
    const phuket = injectOgTags(sampleHtml, "/solar-carport/phuket/", "https://www.sirinx.co");
    expect(home).toContain("/provinces/bangkok-og.jpg");
    expect(phuket).toContain("/provinces/phuket-og.jpg");
    expect(home).not.toEqual(phuket);
  });

  it("injects twitter:title for /solutions", () => {
    const result = injectOgTags(
      sampleHtml,
      "/solutions",
      "https://sirinxsolar-dfabnh7l.manus.space"
    );
    expect(result).toContain(
      'twitter:title" content="โซลูชันโซลาร์เซลล์'
    );
  });

  it("injects canonical URL", () => {
    const result = injectOgTags(
      sampleHtml,
      "/blog",
      "https://sirinxsolar-dfabnh7l.manus.space"
    );
    expect(result).toContain(
      'canonical" href="https://sirinxsolar-dfabnh7l.manus.space/blog/"'
    );
  });

  it("handles homepage URL with final trailing slash", () => {
    const result = injectOgTags(
      sampleHtml,
      "/",
      "https://sirinxsolar-dfabnh7l.manus.space"
    );
    expect(result).toContain(
      'og:url" content="https://sirinxsolar-dfabnh7l.manus.space/"'
    );
  });

  it("injects province canonical, OG tags, and structured data", () => {
    const result = injectOgTags(
      sampleHtml,
      "/solar-carport/phitsanulok",
      "https://www.sirinx.co"
    );
    expect(result).toContain("Solar Carport พิษณุโลก");
    expect(result).toContain(
      'canonical" href="https://www.sirinx.co/solar-carport/phitsanulok/"'
    );
    expect(result).toContain('data-sirinx-seo="route"');
    expect(result).toContain("AdministrativeArea");
  });

  it("does not preload an unverified remote route hero", () => {
    const result = injectOgTags(
      sampleHtml,
      "/solar-carport",
      "https://www.sirinx.co"
    );
    expect(result).not.toContain('rel="preload" as="image"');
    expect(result).not.toContain("/cdn-cgi/image/width=1280");
    expect(result).not.toContain("carport-wide-1_30e3af4c.jpeg");
  });

  it("uses responsive preload candidates for the homepage hero", () => {
    const result = injectOgTags(sampleHtml, "/", "https://www.sirinx.co");

    expect(result).toContain('rel="preload" as="image"');
    expect(result).toContain(
      'href="/assets/projects/ruenphae/20260924/1000076001.jpg"',
    );
    expect(result).toContain('type="image/jpeg"');
    expect(result).not.toContain("imagesrcset=");
  });

  it("uses responsive preload candidates for the home solution hero", () => {
    const result = injectOgTags(
      sampleHtml,
      "/home-solution",
      "https://www.sirinx.co"
    );

    expect(result).toContain('rel="preload" as="image"');
    expect(result).toContain("imagesrcset=");
    expect(result).toContain("home-solution-drone-hero-640.avif 640w");
    expect(result).toContain('imagesizes="(max-width: 767px) 80vw, 100vw"');
  });

  it("builds AEO service schema for province pages", () => {
    const data = getStructuredData(
      "/solar-carport/phitsanulok",
      "https://www.sirinx.co"
    );
    const encoded = JSON.stringify(data);
    expect(encoded).toContain("Solar Carport พิษณุโลก");
    expect(encoded).toContain("FAQPage");
    expect(encoded).toContain("Service");
    expect(encoded).toContain("พิษณุโลก");
  });

  it("builds a BESS FAQ schema for /solutions from the strings the page renders", () => {
    const data = getStructuredData("/solutions", "https://www.sirinx.co");
    const encoded = JSON.stringify(data);
    expect(encoded).toContain("FAQPage");
    expect(encoded).toContain("/solutions#service");
    expect(encoded).toContain("SIRINX Clean Energy Solutions");
    for (const item of bessFaq) {
      expect(encoded).toContain(item.question);
      expect(encoded).toContain(item.answer);
    }
  });

  it("keeps the BESS answers free of guarantee language and fixed figures", () => {
    for (const item of bessFaq) {
      const text = `${item.question} ${item.answer}`;
      // "ไม่ใช่คำรับประกัน" is the honest disclaimer and may stay; an actual
      // promise (รับประกันผล / รับประกันการ…) or a fixed figure may not.
      expect(text).not.toMatch(/การันตี|รับประกันผล|รับประกันการ|30-100%|3-5 ปี|ฟรีตลอด/);
    }
  });

  it("builds static AEO service and FAQ schema for /home-solution", () => {
    const data = getStructuredData("/home-solution", "https://www.sirinx.co");
    const encoded = JSON.stringify(data);
    expect(encoded).toContain("SIRINX Home Solar Solution");
    expect(encoded).toContain("FAQPage");
    expect(encoded).toContain("บ้านขนาดใหญ่");
    expect(encoded).toContain("EV Charger");
    expect(encoded).toContain("Project-specific quotation");
  });

  it("injects no-JavaScript fallback content for /home-solution", () => {
    const result = injectOgTags(
      sampleHtml,
      "/home-solution",
      "https://www.sirinx.co"
    );
    expect(result).toContain('data-sirinx-static-fallback="home-solution"');
    expect(result).toContain("Home Solar Solution สำหรับบ้านใหญ่");
    expect(result).toContain("ไม่ใช่คำรับประกันเหมารวม");
  });

  it("keeps the prerendered province description free of corrupted Thai", () => {
    // Regression guard: the server description once shipped "โงานแลง" while the
    // client copy was correct, so all 77 province pages' crawler metadata read
    // as a non-word to Thai readers.
    for (const province of thaiProvinces) {
      const meta = getPageMeta(`/solar-carport/${province.slug}`);
      expect(meta.description).not.toMatch(/โงาน|แลงและ/);
      expect(meta.title).not.toMatch(/โงาน|แลงและ/);
    }
  });

  it("does not inject unsupported guaranteed savings or fixed payback claims", () => {
    const publicRoutes = [
      "/",
      "/solar-carport",
      "/home-solution",
      "/investment",
      "/assessment",
      "/pricing",
      "/unknown-page",
    ];

    for (const route of publicRoutes) {
      const meta = getPageMeta(route);
      expect(`${meta.title} ${meta.description}`).not.toContain("30-100%");
      expect(`${meta.title} ${meta.description}`).not.toContain("3-5 ปี");
      expect(`${meta.title} ${meta.description}`).not.toContain(
        "BOI ลดหย่อนภาษี 200%"
      );
    }
  });
});

describe("crawler/hydrated metadata parity", () => {
  // The prerendered HTML is what a non-JS crawler (LINE, Facebook, Slack)
  // reads; RouteSeo rewrites the same tags from client/src/lib/seo.ts after
  // hydration. When the two copies drift, the same page advertises a different
  // title, description or social card to each audience, so parity is a
  // contract here instead of a coincidence.
  const CORE_ROUTES = [
    "/",
    "/solar-carport",
    "/provinces",
    "/home-solution",
    "/about",
    "/solutions",
    "/industries",
    "/investment",
    "/projects",
    "/strategy",
    "/blog",
    "/contact",
    "/line",
    "/assessment",
    "/pricing",
    "/partner",
    "/privacy",
    "/terms",
    "/cookies",
  ];

  it("server meta equals the client RouteSeo meta on every core route", () => {
    for (const route of CORE_ROUTES) {
      const server = getPageMeta(route);
      const client = getSeoMeta(route);
      expect({ route, title: server.title }).toEqual({ route, title: client.title });
      expect({ route, description: server.description }).toEqual({
        route,
        description: client.description,
      });
      expect({ route, noindex: server.noindex ?? false }).toEqual({
        route,
        noindex: client.noindex ?? false,
      });
    }
  });

  it("server meta equals the client meta on all 77 province routes", () => {
    for (const province of thaiProvinces) {
      const route = `/solar-carport/${province.slug}`;
      const server = getPageMeta(route);
      const client = getSeoMeta(route);
      expect({ route, title: server.title }).toEqual({ route, title: client.title });
      expect({ route, description: server.description }).toEqual({
        route,
        description: client.description,
      });
      expect({ route, image: server.image }).toEqual({ route, image: client.image });
    }
  });

  it("the client fallback image is the same site-owned card as the server default", () => {
    expect(seoDefaults.image).toBe(`https://www.sirinx.co${SITE_OG_CARD}`);
  });
});
