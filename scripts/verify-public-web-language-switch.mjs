#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_TARGET = "apps/public-web";

function parseArgs(argv) {
  const args = { target: process.env.SIRINX_PUBLIC_WEB_TARGET || DEFAULT_TARGET };
  for (const item of argv) {
    if (item.startsWith("--target=")) args.target = item.slice("--target=".length);
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function readFile(root, relativePath, failures) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

function requireStrings(label, source, checks, failures) {
  for (const check of checks) {
    if (!source.includes(check)) failures.push(`${label} missing: ${check}`);
  }
}

function forbidPattern(label, source, pattern, failures) {
  if (pattern.test(source)) failures.push(`${label} matched forbidden pattern: ${pattern}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(process.cwd(), args.target);
  const failures = [];

  const aboutPage = readFile(root, "client/src/pages/About.tsx", failures);
  const aboutDict = readFile(root, "client/src/i18n/pages/about.ts", failures);
  const legalPage = readFile(root, "client/src/components/LegalPage.tsx", failures);
  const privacyPage = readFile(root, "client/src/pages/Privacy.tsx", failures);
  const termsPage = readFile(root, "client/src/pages/Terms.tsx", failures);
  const cookiesPage = readFile(root, "client/src/pages/Cookies.tsx", failures);
  const legalDict = readFile(root, "client/src/i18n/pages/legal.ts", failures);
  const partnerPage = readFile(root, "client/src/pages/Partner.tsx", failures);
  const partnerDict = readFile(root, "client/src/i18n/pages/partner.ts", failures);
  const assessmentPage = readFile(root, "client/src/pages/SolarAssessment.tsx", failures);
  const assessmentDict = readFile(root, "client/src/i18n/pages/solarAssessment.ts", failures);
  const heroSlideshow = readFile(root, "client/src/components/HeroSlideshow.tsx", failures);
  const heroSlideshowDict = readFile(root, "client/src/i18n/pages/heroSlideshow.ts", failures);
  const layout = readFile(root, "client/src/components/Layout.tsx", failures);
  const notFound = readFile(root, "client/src/pages/NotFound.tsx", failures);
  const languageContext = readFile(root, "client/src/contexts/LanguageContext.tsx", failures);
  const homePage = readFile(root, "client/src/pages/Home.tsx", failures);
  const homeDict = readFile(root, "client/src/i18n/pages/home.ts", failures);
  const projectsPage = readFile(root, "client/src/pages/Projects.tsx", failures);
  const projectsDict = readFile(root, "client/src/i18n/pages/projects.ts", failures);
  const solarCarportPage = readFile(root, "client/src/pages/SolarCarport.tsx", failures);
  const solarCarportDict = readFile(root, "client/src/i18n/pages/solarCarport.ts", failures);
  const blogPage = readFile(root, "client/src/pages/Blog.tsx", failures);
  const blogDict = readFile(root, "client/src/i18n/pages/blog.ts", failures);
  const blogPostPage = readFile(root, "client/src/pages/BlogPost.tsx", failures);
  const blogPostDict = readFile(root, "client/src/i18n/pages/blogPost.ts", failures);
  const blogData = readFile(root, "client/src/lib/blogData.ts", failures);
  const blogArticleContent = readFile(root, "client/src/lib/blogArticleContent.ts", failures);
  const homeSolutionPage = readFile(root, "client/src/pages/HomeSolution.tsx", failures);
  const homeSolutionDict = readFile(root, "client/src/i18n/pages/homeSolution.ts", failures);

  requireStrings(
    "About page",
    aboutPage,
    [
      'usePageTranslation("about")',
      'import "@/i18n/pages/about"',
      "lineOfficialConfig.addFriendUrl",
      't("about.hero.title")',
      't("about.cta.line")',
      't("about.cta.phone")',
    ],
    failures
  );

  forbidPattern("About page", aboutPage, /[ก-๙]/, failures);

  requireStrings(
    "About translation dictionary",
    aboutDict,
    [
      'registerPageTranslations("about", dict)',
      "Energy Engineering",
      "能源工程",
      "Driven by Data",
      "由数据驱动",
      "Add LINE Official",
      "添加 LINE 官方账号",
      "Ruenphae Royal Park Hotel, Phitsanulok",
    ],
    failures
  );

  for (const [label, source, requiredKeys] of [
    [
      "LegalPage component",
      legalPage,
      [
        'usePageTranslation("legal")',
        'import "@/i18n/pages/legal"',
        't("legal.updatedAt")',
        't("legal.contactTitle")',
        't("legal.contactCta")',
      ],
    ],
    [
      "Privacy page",
      privacyPage,
      [
        'usePageTranslation("legal")',
        't("legal.privacy.title")',
        't("legal.privacy.intro")',
        't("legal.privacy.data.body1")',
      ],
    ],
    [
      "Terms page",
      termsPage,
      [
        'usePageTranslation("legal")',
        't("legal.terms.title")',
        't("legal.terms.intro")',
        't("legal.terms.assessment.body1")',
      ],
    ],
    [
      "Cookies page",
      cookiesPage,
      [
        'usePageTranslation("legal")',
        't("legal.cookies.title")',
        't("legal.cookies.intro")',
        't("legal.cookies.essential.body1")',
      ],
    ],
  ]) {
    requireStrings(label, source, requiredKeys, failures);
    forbidPattern(label, source, /[ก-๙]/, failures);
  }

  requireStrings(
    "Legal translation dictionary",
    legalDict,
    [
      'registerPageTranslations("legal", dict)',
      "Privacy Policy",
      "隐私政策",
      "Terms of Use",
      "使用条款",
      "Cookie Policy",
      "Cookie 政策",
      "Contact SIRINX",
      "联系 SIRINX",
      "May 16, 2026",
      "2026年5月16日",
    ],
    failures
  );

  requireStrings(
    "Partner page",
    partnerPage,
    [
      'usePageTranslation("partner")',
      'import "@/i18n/pages/partner"',
      "lineOfficialConfig.addFriendUrl",
      't("partner.hero.title")',
      't("partner.form.submit")',
      't("partner.cta.line")',
      't("partner.sidebar.disclaimer")',
    ],
    failures
  );

  forbidPattern("Partner page", partnerPage, /[ก-๙]/, failures);

  requireStrings(
    "Partner translation dictionary",
    partnerDict,
    [
      'registerPageTranslations("partner", dict)',
      "Grow Together",
      "共同成长",
      "Partnership Inquiry Form",
      "合作咨询表",
      "Add LINE Official",
      "添加 LINE 官方账号",
      "Investment Information",
      "投资信息",
    ],
    failures
  );

  requireStrings(
    "Solar assessment page",
    assessmentPage,
    [
      'usePageTranslation("solarAssessment")',
      'import "../i18n/pages/solarAssessment"',
      'nameKey: "sa.region.central"',
      'suitabilityKey: "sa.roof.suitability.excellent"',
      'noteKey: "sa.orient.note.south"',
      'labelKey: "sa.step.businessType"',
      't("sa.hero.title1")',
      't("sa.s1.modeBill")',
      't("sa.s2.roofArea")',
      'labelKey: "sa.r.tabOverview"',
      't("sa.cta.getQuote")',
      't("sa.final.title")',
    ],
    failures
  );

  forbidPattern("Solar assessment selectable data", assessmentPage, /name:\s*"[ก-๙]/, failures);
  forbidPattern("Solar assessment BESS modes", assessmentPage, /title:\s*"Hybrid \(แนะนำ\)"/, failures);

  requireStrings(
    "Solar assessment translation dictionary",
    assessmentDict,
    [
      'registerPageTranslations("solarAssessment", dict)',
      "Calculate Your Solar System",
      "Enter Bill (THB)",
      "Roof Orientation",
      "Show results tab",
      "Get a Real Quote",
      "Ready to Start Your Solar Project?",
    ],
    failures
  );

  requireStrings(
    "Hero slideshow component",
    heroSlideshow,
    [
      'usePageTranslation("heroSlideshow")',
      'import "@/i18n/pages/heroSlideshow"',
      "slideText = {",
      'badge: t(`hero.${slide.id}.badge`)',
      'headline: t(`hero.${slide.id}.headline`)',
      'highlight: t(`hero.${slide.id}.highlight`)',
      'desc: t(`hero.${slide.id}.desc`)',
      'cta: t(`hero.${slide.id}.cta`)',
      'secondaryCta: t(`hero.${slide.id}.cta2`)',
    ],
    failures
  );

  forbidPattern("Hero slideshow component", heroSlideshow, /[ก-๙]/, failures);
  forbidPattern("Hero slideshow fallback labels", heroSlideshow, /headline:\s*"|description:\s*"|label:\s*"/, failures);

  requireStrings(
    "Hero slideshow translation dictionary",
    heroSlideshowDict,
    [
      'registerPageTranslations("heroSlideshow", dict)',
      "Transform Your Parking",
      "Into a Solar Power Plant",
      "Get Solar Carport Quote",
      "Consult AI System",
      "Large-Scale Solar Carport",
      "Previous Slide",
      "Go to slide",
    ],
    failures
  );

  requireStrings(
    "Shared layout chrome",
    layout,
    [
      't("nav.assessmentDesc")',
      't("footer.certifiedTrusted")',
      'title={t("footer.dbdTitle")}',
      'title={t("footer.boiTitle")}',
      't("footer.privacy")',
      't("footer.terms")',
      't("footer.cookies")',
    ],
    failures
  );

  forbidPattern("Shared layout chrome", layout, /[ก-๙]/, failures);

  requireStrings(
    "NotFound page",
    notFound,
    [
      'useLanguage()',
      't("notFound.title")',
      't("notFound.desc")',
      't("notFound.home")',
    ],
    failures
  );

  forbidPattern("NotFound page", notFound, /[ก-๙]/, failures);

  requireStrings(
    "Global language dictionary",
    languageContext,
    [
      '"nav.assessmentDesc"',
      '"footer.certifiedTrusted"',
      '"footer.dbdTitle"',
      '"footer.boiTitle"',
      '"footer.privacy"',
      '"footer.terms"',
      '"footer.cookies"',
      '"notFound.title"',
      '"notFound.desc"',
      '"notFound.home"',
      "Page Not Found",
      "Back to Home",
      "Privacy Policy",
    ],
    failures
  );

  requireStrings(
    "Home page",
    homePage,
    [
      'usePageTranslation("home")',
      'import "@/i18n/pages/home"',
      't("home.projects.node1.siteSpecific")',
    ],
    failures
  );

  forbidPattern("Home page", homePage, /[ก-๙]/, failures);

  requireStrings(
    "Home translation dictionary",
    homeDict,
    [
      'registerPageTranslations("home", dict)',
      "Site-based",
      "按现场评估",
    ],
    failures
  );

  requireStrings(
    "Projects page",
    projectsPage,
    [
      'usePageTranslation("projects")',
      'import "@/i18n/pages/projects"',
      't("galleryOpenAria")',
      't("lightboxCloseAria")',
      't("lightboxPrevAria")',
      't("lightboxNextAria")',
    ],
    failures
  );

  forbidPattern("Projects page", projectsPage, /[ก-๙]/, failures);

  requireStrings(
    "Projects translation dictionary",
    projectsDict,
    [
      'registerPageTranslations("projects", dict)',
      "Open SIRINX project photo number",
      "Close project photo",
      "Previous project photo",
      "Next project photo",
    ],
    failures
  );

  requireStrings(
    "Solar Carport page",
    solarCarportPage,
    [
      'usePageTranslation("solarCarport")',
      'import "@/i18n/pages/solarCarport"',
      't("sc.province.heroTitle2")',
      't("sc.hero.stat.roiValue")',
      't("sc.province.localLabel")',
      't("sc.province.descPrefix")',
      't("sc.province.item4")',
      't("sc.gallery.closeAria")',
      't("sc.gallery.prevAria")',
      't("sc.gallery.nextAria")',
    ],
    failures
  );

  forbidPattern("Solar Carport page", solarCarportPage, /[ก-๙]/, failures);

  requireStrings(
    "Solar Carport translation dictionary",
    solarCarportDict,
    [
      'registerPageTranslations("solarCarport", dict)',
      "Power-generating parking for business",
      "What we assess before installation",
      "Close Solar Carport gallery",
      "Previous image",
      "Next image",
    ],
    failures
  );

  requireStrings(
    "Blog page",
    blogPage,
    [
      'usePageTranslation("blog")',
      'import "@/i18n/pages/blog"',
      "getLocalizedBlogPosts(lang)",
      'labelKey: "blog.category.all"',
      't("blog.hero.titleLead")',
      't("blog.search.placeholder")',
      't("blog.featured.title")',
      't("blog.newsletter.success")',
    ],
    failures
  );

  forbidPattern("Blog page", blogPage, /[ก-๙]/, failures);

  requireStrings(
    "Blog translation dictionary",
    blogDict,
    [
      'registerPageTranslations("blog", dict)',
      "Blog & Insights",
      "Search articles",
      "Recommended Articles",
      "No spam",
      "博客与洞察",
    ],
    failures
  );

  requireStrings(
    "Blog data",
    blogData,
    [
      "export function getLocalizedBlogPosts",
      "export function getLocalizedBlogPost",
      "Rooftop Solar ROI in 2025",
      "2025 年屋顶太阳能 ROI",
      "SIRINX Engineering Team",
      "SIRINX 工程团队",
    ],
    failures
  );

  requireStrings(
    "BlogPost page",
    blogPostPage,
    [
      'usePageTranslation("blogPost")',
      'import "@/i18n/pages/blogPost"',
      "getLocalizedBlogPost(slug, lang)",
      "getLocalizedBlogPosts(lang)",
      "getLocalizedArticleContent(slug, lang, articleContent[slug])",
      't("blogPost.shareCopied")',
      't("blogPost.articleCta.calculate")',
      't("blogPost.final.assessment")',
    ],
    failures
  );

  requireStrings(
    "BlogPost translation dictionary",
    blogPostDict,
    [
      'registerPageTranslations("blogPost", dict)',
      "Article Not Found",
      "Back to Blog",
      "Key Takeaways",
      "Related Articles",
      "未找到文章",
    ],
    failures
  );

  requireStrings(
    "Blog article content overlays",
    blogArticleContent,
    [
      "export function getLocalizedArticleContent",
      "Why rooftop solar ROI is stronger in 2025",
      "为什么 2025 年屋顶太阳能 ROI 更值得关注",
      "Solar carport plus EV charging",
      "太阳能车棚 + EV 充电",
    ],
    failures
  );

  requireStrings(
    "HomeSolution page",
    homeSolutionPage,
    [
      'usePageTranslation("homeSolution")',
      'import "@/i18n/pages/homeSolution"',
      't("hs.meta.title")',
      't("hs.hero.title1")',
      't("hs.fit.title")',
      't("hs.stack.title")',
      't("hs.proof.title")',
      't("hs.final.primary")',
    ],
    failures
  );

  forbidPattern("HomeSolution page", homeSolutionPage, /[ก-๙]/, failures);

  requireStrings(
    "HomeSolution translation dictionary",
    homeSolutionDict,
    [
      'registerPageTranslations("homeSolution", dict)',
      "Home Solar Solution for Large Homes",
      "大型住宅与家庭办公室太阳能方案",
      "Designed from real load data",
      "基于真实负载设计",
      "View Real Projects",
      "查看真实项目",
    ],
    failures
  );

  if (failures.length > 0) {
    console.error("SIRINX public-web language-switch verification failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("SIRINX public-web language-switch verification passed");
  console.log(`target: ${args.target}`);
  console.log("covered: homepage hero slideshow, shared layout chrome, /404, /, /solar-carport, /projects, /blog, /blog/:slug, /home-solution, /about, /privacy, /terms, /cookies, /partner, /assessment visible copy and trust/legal/partner/blog/home/calculator CTA labels");
}

try {
  main();
} catch (error) {
  console.error(`verification failed: ${error.message}`);
  process.exit(1);
}
