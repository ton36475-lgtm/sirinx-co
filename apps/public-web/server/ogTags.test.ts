import { describe, it, expect } from "vitest";
import {
  getPageMeta,
  getStaticSeoRoutes,
  getStructuredData,
  injectOgTags,
  thaiProvinces,
} from "./ogTags";

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
    expect(meta.description).toContain("Rooftop Solar");
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

  it("handles blog slug pattern with SEO copy", () => {
    const meta = getPageMeta("/blog/rooftop-solar-roi-2025");
    expect(meta.title).toContain("โซลาร์เซลล์ SIRINX");
    expect(meta.description).toContain("rooftop solar roi 2025");
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
    expect(meta.description).toContain("30-100%");
    expect(meta.description).toContain("3-5 ปี");
    expect(meta.description).toContain("ตามข้อมูลไซต์จริง");
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

  it("injects og:image with CDN URL", () => {
    const result = injectOgTags(
      sampleHtml,
      "/",
      "https://sirinxsolar-dfabnh7l.manus.space"
    );
    expect(result).toContain(
      'og:image" content="https://d2xsxph8kpxj0f.cloudfront.net'
    );
  });

  it("injects twitter:title for /solutions", () => {
    const result = injectOgTags(
      sampleHtml,
      "/solutions",
      "https://sirinxsolar-dfabnh7l.manus.space"
    );
    expect(result).toContain(
      'twitter:title" content="โซลูชันโซลาร์เซลล์ครบวงจร'
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

  it("injects route-specific hero image preload", () => {
    const result = injectOgTags(
      sampleHtml,
      "/solar-carport",
      "https://www.sirinx.co"
    );
    expect(result).toContain('rel="preload" as="image"');
    expect(result).toContain("/cdn-cgi/image/width=1280");
    expect(result).toContain("carport-wide-1_30e3af4c.jpeg");
  });

  it("uses responsive preload candidates for the homepage hero", () => {
    const result = injectOgTags(sampleHtml, "/", "https://www.sirinx.co");

    expect(result).toContain('rel="preload" as="image"');
    expect(result).toContain("imagesrcset=");
    expect(result).toContain("solar-carport-hero-640.avif 640w");
    expect(result).toContain('imagesizes="(max-width: 767px) 80vw, 100vw"');
    expect(result).toContain('type="image/avif"');
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
