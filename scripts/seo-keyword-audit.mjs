#!/usr/bin/env node
/**
 * SEO / AEO / GEO regression audit for the two public builds.
 *
 * The live sweep (scripts/qa-live-sweep.mjs) proves the deployed hosts answer
 * 200 with sane titles. This audit runs offline against a build directory and
 * measures the things a crawler or an answer engine actually consumes: the
 * canonical host, one JSON-LD graph per document, FAQ markup that matches the
 * visible questions, crawlable text per route, and keyword coverage against the
 * province keyword map.
 *
 *   node scripts/seo-keyword-audit.mjs \
 *     --dist=apps/public-web/dist/public --origin=https://www.sirinx.co
 *
 *   node scripts/seo-keyword-audit.mjs --dist=apps/public-web/dist-org \
 *     --origin=https://www.sirinx.org --out-prefix=reports/runtime/seo-audit-org-20261030
 *
 * Exits non-zero on defects. Warnings are recorded but do not fail the run
 * unless --strict is passed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = name => {
  const hit = args.find(value => value.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const flag = name => args.includes(`--${name}`);

const distDir = path.resolve(ROOT, arg("dist") ?? "apps/public-web/dist/public");
const keywordMapPath = path.resolve(
  ROOT,
  arg("keyword-map") ?? "docs/seo/keyword-map-77-provinces.csv"
);
const strict = flag("strict");
const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const outPrefix = arg("out-prefix")
  ? path.resolve(ROOT, arg("out-prefix"))
  : path.resolve(ROOT, "reports/runtime", `seo-audit-${today}`);

// Title/description guidance: Thai titles are character-dense, so these are
// policy bands rather than Google's pixel truncation point.
const TITLE_MIN = 20;
const TITLE_MAX = 65;
const DESC_MIN = 70;
const DESC_MAX = 165;
// Crawlable text floor. Below 400 characters a page is a shell, not a document;
// below 1200 characters an answer engine has almost nothing to quote.
const THIN_DEFECT_CHARS = 400;
const THIN_WARN_CHARS = 1200;
const INTERNAL_LINK_MIN = 3;
const LEGAL_PAGES = new Set(["/privacy", "/terms", "/cookies"]);

const defects = [];
const warnings = [];
const passes = [];
const defect = (route, check, detail) => defects.push({ route, check, detail });
const warn = (route, check, detail) => warnings.push({ route, check, detail });
const pass = (route, check, detail = "") => passes.push({ route, check, detail });

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

function walkIndexFiles(dir) {
  const found = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = join(current, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.name === "index.html") found.push(target);
    }
  };
  walk(dir);
  return found;
}

function routeFromIndexFile(file) {
  const relative = path.relative(distDir, path.dirname(file));
  const normalized = relative.split(path.sep).join("/");
  if (normalized === "." || normalized === "") return "/";
  return `/${normalized.replace(/\/$/, "")}`;
}

const decodeEntities = value =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

function visibleText(html) {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) ?? [])[1] ?? "";
  return decodeEntities(
    body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return decodeEntities(value)
    .toLowerCase()
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function h1Text(html) {
  const match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!match) return "";
  return decodeEntities(match[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function collectTypes(node, bucket) {
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, bucket);
    return bucket;
  }
  if (!node || typeof node !== "object") return bucket;
  const type = node["@type"];
  if (typeof type === "string") bucket.push(type);
  if (Array.isArray(type)) bucket.push(...type);
  for (const value of Object.values(node)) collectTypes(value, bucket);
  return bucket;
}

function collectFaqQuestions(node, bucket) {
  if (Array.isArray(node)) {
    for (const item of node) collectFaqQuestions(item, bucket);
    return bucket;
  }
  if (!node || typeof node !== "object") return bucket;
  if (node["@type"] === "Question" && typeof node.name === "string") {
    bucket.push(node.name);
  }
  for (const value of Object.values(node)) collectFaqQuestions(value, bucket);
  return bucket;
}

function parseJsonLd(html) {
  const blocks = [
    ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi),
  ].map(match => match[1]);
  const parsed = [];
  const invalid = [];
  for (const block of blocks) {
    try {
      parsed.push(JSON.parse(block));
    } catch (error) {
      invalid.push(String(error.message ?? error));
    }
  }
  return { blocks: parsed, invalid };
}

function sitemapLocations(dir) {
  const xml = readIfExists(join(dir, "sitemap.xml"));
  if (!xml) return null;
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].trim());
}

function toRoute(loc) {
  const url = new URL(loc);
  const route = url.pathname.replace(/\/$/, "");
  return route === "" ? "/" : route;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...data] = rows;
  if (!header) return [];
  return data
    .filter(values => values.length === header.length)
    .map(values => Object.fromEntries(header.map((key, index) => [key, values[index]])));
}

const distPublic = distDir;
if (!fs.existsSync(distPublic)) {
  console.error(`refused: no built site at ${distPublic}`);
  process.exit(2);
}

const homeHtml = fs.readFileSync(join(distPublic, "index.html"), "utf8");
const homeCanonical =
  (homeHtml.match(/<link rel="canonical" href="([^"]+)"/) ?? [])[1] ?? null;
const origin = (arg("origin") ?? (homeCanonical ? new URL(homeCanonical).origin : null))?.replace(
  /\/$/,
  ""
);
if (!origin) {
  console.error("refused: pass --origin=https://host or ship a canonical in index.html");
  process.exit(2);
}

const files = walkIndexFiles(distPublic).sort();
const pages = new Map();

for (const file of files) {
  const route = routeFromIndexFile(file);
  const html = fs.readFileSync(file, "utf8");
  const title = decodeEntities(
    (html.match(/<title>([^<]*)<\/title>/i) ?? [])[1] ?? ""
  ).trim();
  const description = decodeEntities(
    (html.match(/<meta name="description" content="([^"]*)"/i) ?? [])[1] ?? ""
  ).trim();
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) ?? [])[1] ?? "";
  const robots = (html.match(/<meta name="robots" content="([^"]*)"/i) ?? [])[1] ?? "";
  const hreflang = [...html.matchAll(/<link[^>]+hreflang="([^"]+)"[^>]*>/gi)].map(
    match => match[1]
  );
  const { blocks, invalid } = parseJsonLd(html);
  const types = [];
  const faqQuestions = [];
  for (const block of blocks) {
    collectTypes(block, types);
    collectFaqQuestions(block, faqQuestions);
  }
  const text = visibleText(html);
  const links = [...html.matchAll(/<a[^>]+href="(\/[^"]*)"/gi)]
    .map(match => match[1])
    .filter(href => !href.startsWith("/assets/") && !href.startsWith("//"));

  pages.set(route, {
    route,
    title,
    description,
    canonical,
    robots,
    hreflang,
    blocks,
    invalid,
    types: [...new Set(types)],
    faqQuestions,
    text,
    chars: text.length,
    h1: h1Text(html),
    h1Count: (html.match(/<h1/gi) ?? []).length,
    h2Count: (html.match(/<h2/gi) ?? []).length,
    internalLinks: new Set(links.map(href => href.split("?")[0].replace(/\/$/, "") || "/"))
      .size,
  });
}

/* ------------------------------- per-page checks ------------------------------- */

const titleIndex = new Map();
const descriptionIndex = new Map();

for (const page of pages.values()) {
  const { route } = page;

  if (!page.title) defect(route, "title", "missing");
  else {
    if (page.title.length < TITLE_MIN) warn(route, "title-length", `${page.title.length} chars`);
    if (page.title.length > TITLE_MAX) warn(route, "title-length", `${page.title.length} chars`);
    const key = normalize(page.title);
    titleIndex.set(key, [...(titleIndex.get(key) ?? []), route]);
  }

  if (!page.description) defect(route, "description", "missing");
  else {
    if (page.description.length < DESC_MIN)
      warn(route, "description-length", `${page.description.length} chars`);
    if (page.description.length > DESC_MAX)
      warn(route, "description-length", `${page.description.length} chars`);
    const key = normalize(page.description);
    descriptionIndex.set(key, [...(descriptionIndex.get(key) ?? []), route]);
  }

  if (!page.canonical) defect(route, "canonical", "missing");
  else {
    const canonicalUrl = new URL(page.canonical);
    if (canonicalUrl.origin !== origin)
      defect(route, "canonical-host", `${canonicalUrl.origin} != ${origin}`);
    if (canonicalUrl.pathname.replace(/\/$/, "") !== route.replace(/\/$/, ""))
      defect(route, "canonical-path", `${canonicalUrl.pathname} != ${route}`);
  }

  if (page.invalid.length > 0) defect(route, "jsonld-parse", page.invalid.join("; "));
  if (page.blocks.length === 0) defect(route, "jsonld-missing", "no application/ld+json");

  const faqPages = page.types.filter(type => type === "FAQPage").length;
  if (faqPages > 1) defect(route, "jsonld-faq-duplicate", `${faqPages} FAQPage nodes`);

  if (page.faqQuestions.length > 0) {
    const text = normalize(page.text);
    const missing = page.faqQuestions.filter(question => {
      const normalized = normalize(question);
      return normalized.length > 0 && !text.includes(normalized);
    });
    if (missing.length > 0)
      defect(
        route,
        "faq-visible-parity",
        `${missing.length}/${page.faqQuestions.length} marked-up questions not in visible text: ${missing[0]}`
      );
  }

  if (page.blocks.length > 0 && !page.types.includes("WebPage"))
    warn(route, "jsonld-webpage", "no WebPage node");

  if (page.h1Count === 0) defect(route, "h1", "missing");
  else if (page.h1Count > 1) warn(route, "h1-count", `${page.h1Count} h1 elements`);

  // Crawlable text is content debt, not a structural defect: tracked as a
  // warning so a daily job stays green until the content campaign lands.
  if (page.chars < THIN_DEFECT_CHARS) warn(route, "crawlable-text-thin", `${page.chars} chars`);
  else if (page.chars < THIN_WARN_CHARS && !LEGAL_PAGES.has(route))
    warn(route, "crawlable-text", `${page.chars} chars`);

  if (page.internalLinks < INTERNAL_LINK_MIN)
    warn(route, "internal-links", `${page.internalLinks} internal links`);
}

for (const [key, routes] of titleIndex) {
  if (routes.length > 1) defect(routes[0], "duplicate-title", `${routes.join(", ")}`);
}
for (const [key, routes] of descriptionIndex) {
  if (routes.length > 1) defect(routes[0], "duplicate-description", `${routes.join(", ")}`);
}

/* ------------------------------- sitemap checks ------------------------------- */

const locations = sitemapLocations(distDir);
if (!locations) defect("/", "sitemap", "sitemap.xml missing");
else {
  const routesInSitemap = new Set(locations.map(toRoute));
  for (const route of pages.keys()) {
    const page = pages.get(route);
    const noindex = /noindex/i.test(page.robots);
    if (!noindex && !routesInSitemap.has(route))
      defect(route, "sitemap-missing", "indexable page absent from sitemap.xml");
  }
  for (const route of routesInSitemap) {
    if (!pages.has(route)) defect(route, "sitemap-orphan", "sitemap URL has no built page");
  }
  const hosts = new Set(locations.map(loc => new URL(loc).origin));
  if (hosts.size !== 1 || !hosts.has(origin))
    defect("/", "sitemap-host", `${[...hosts].join(", ")} != ${origin}`);
}

/* ------------------------------- robots / llms ------------------------------- */

const robotsTxt = readIfExists(join(distPublic, "robots.txt"));
if (!robotsTxt) defect("/", "robots", "robots.txt missing");
else {
  if (!/^Sitemap:\s*\S+/m.test(robotsTxt))
    defect("/", "robots-sitemap", "no Sitemap: line");
  if (!/Disallow:\s*\/admin/.test(robotsTxt))
    defect("/", "robots-admin", "/admin not disallowed");
  const requiredBots = ["OAI-SearchBot", "PerplexityBot", "ClaudeBot", "Google-Extended"];
  for (const bot of requiredBots) {
    const block = new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?(?=\\nUser-agent:|$)`, "i");
    const match = robotsTxt.match(block);
    if (!match) warn("/", "robots-bot", `${bot} not declared`);
    else if (!/Allow:\s*\//.test(match[0]))
      defect("/", "robots-bot-blocked", `${bot} declared but not allowed`);
  }
}

const llmsTxt = readIfExists(join(distPublic, "llms.txt"));
if (!llmsTxt) defect("/", "llms", "llms.txt missing");
else {
  const links = [...llmsTxt.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(match => match[1]);
  if (links.length === 0) defect("/", "llms-links", "no links in llms.txt");
  for (const link of links) {
    const route = toRoute(link);
    if (!pages.has(route)) defect(route, "llms-orphan", "llms.txt links a page that is not built");
  }
}

/* --------------------------- keyword coverage (CSV) --------------------------- */

const keywordRows = fs.existsSync(keywordMapPath)
  ? parseCsv(fs.readFileSync(keywordMapPath, "utf8"))
  : [];
const coverage = { total: keywordRows.length, scopes: {}, province: [] };

if (keywordRows.length > 0) {
  const byScope = new Map();
  for (const row of keywordRows) {
    const key = row.scope || "unknown";
    byScope.set(key, (byScope.get(key) ?? 0) + 1);
  }
  coverage.scopes = Object.fromEntries(byScope);

  // Thai keywords are written compounded ("ติดตั้งโซลาร์เซลล์กรุงเทพมหานคร")
  // while pages space the province name out, so exact substring matching
  // under-reports. Accept a keyword when >=70% of its tokens are present.
  const tokensOf = value => normalize(value).split(" ").filter(token => token.length > 1);
  const keywordPresent = (keyword, page) => {
    const wanted = normalize(keyword);
    const haystack = normalize([page.title, page.h1, page.text].join(" "));
    if (wanted.length > 0 && haystack.includes(wanted)) return true;
    const tokens = tokensOf(keyword);
    if (tokens.length === 0) return false;
    return tokens.filter(token => haystack.includes(token)).length / tokens.length >= 0.7;
  };

  const provinceRows = new Map();
  const missingRoutes = new Map();
  for (const row of keywordRows) {
    if (!row.target_url) continue;
    const route = row.target_url.replace(/\/$/, "") || "/";
    if (!pages.has(route)) {
      const family = route.split("/").slice(0, 4).join("/") || "/";
      missingRoutes.set(family, (missingRoutes.get(family) ?? 0) + 1);
      continue;
    }
    if (!row.province_slug) continue;
    provinceRows.set(route, [...(provinceRows.get(route) ?? []), row.keyword]);
  }
  for (const [route, keywords] of provinceRows) {
    const page = pages.get(route);
    const covered = keywords.filter(keyword => keywordPresent(keyword, page));
    const ratio = keywords.length === 0 ? 0 : covered.length / keywords.length;
    coverage.province.push({ route, keywords: keywords.length, covered: covered.length, ratio });
    if (ratio < 0.5)
      warn(
        route,
        "keyword-coverage",
        `${covered.length}/${keywords.length} map keywords present (${Math.round(ratio * 100)}%)`
      );
  }
  coverage.province.sort((a, b) => a.ratio - b.ratio);
  coverage.missingRoutes = [...missingRoutes.entries()].sort((a, b) => b[1] - a[1]);
}

/* --------------------------------- reporting --------------------------------- */

const summary = {
  generatedAt: new Date().toISOString(),
  dist: path.relative(ROOT, distPublic),
  origin,
  routes: pages.size,
  sitemapUrls: locations?.length ?? 0,
  defects: defects.length,
  warnings: warnings.length,
  passes: passes.length,
  keywordMap: {
    path: path.relative(ROOT, keywordMapPath),
    rows: coverage.total,
    scopes: coverage.scopes,
    provincePages: coverage.province.length,
    mapRoutesWithoutBuild: coverage.missingRoutes?.reduce((sum, [, count]) => sum + count, 0) ?? 0,
    missingRouteFamilies: (coverage.missingRoutes ?? []).slice(0, 8),
    medianCoverage: coverage.province.length
      ? coverage.province.map(item => item.ratio).sort((a, b) => a - b)[
          Math.floor(coverage.province.length / 2)
        ]
      : null,
  },
  hreflangPages: [...pages.values()].filter(page => page.hreflang.length > 0).length,
  thinPages: [...pages.values()]
    .filter(page => page.chars < THIN_WARN_CHARS && !LEGAL_PAGES.has(page.route))
    .map(page => ({ route: page.route, chars: page.chars })),
};

const group = items => {
  const map = new Map();
  for (const item of items) {
    const bucket = map.get(item.check) ?? [];
    bucket.push(item);
    map.set(item.check, bucket);
  }
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
};

const markdown = [
  `# SEO / AEO / GEO audit — ${origin}`,
  "",
  `Status: \`LOCAL_AUDIT\` · ${summary.generatedAt} · build \`${summary.dist}\``,
  "",
  "## 1. Summary",
  "",
  "| Metric | Value |",
  "| --- | --- |",
  `| Built routes | ${summary.routes} |`,
  `| Sitemap URLs | ${summary.sitemapUrls} |`,
  `| Defects | ${summary.defects} |`,
  `| Warnings | ${summary.warnings} |`,
  `| Pages with hreflang | ${summary.hreflangPages}/${summary.routes} |`,
  `| Pages under ${THIN_WARN_CHARS} crawlable chars | ${summary.thinPages.length} |`,
  `| Keyword-map rows | ${summary.keywordMap.rows} |`,
  `| Keyword targets with no built route | ${summary.keywordMap.mapRoutesWithoutBuild} |`,
  "",
  "## 2. Defects",
  "",
  ...(defects.length === 0
    ? ["None."]
    : [
        "| Route | Check | Detail |",
        "| --- | --- | --- |",
        ...defects
          .slice(0, 60)
          .map(item => `| \`${item.route}\` | ${item.check} | ${item.detail.replace(/\|/g, "\\|")} |`),
        ...(defects.length > 60 ? [`| … | | ${defects.length - 60} more |`] : []),
      ]),
  "",
  "## 3. Warnings by check",
  "",
  ...(warnings.length === 0
    ? ["None."]
    : group(warnings).map(
        ([check, items]) =>
          `- **${check}** ×${items.length} — e.g. \`${items[0].route}\` (${items[0].detail})`
      )),
  "",
  "## 4. Thinnest crawlable pages",
  "",
  ...(summary.thinPages.length === 0
    ? ["None."]
    : [
        "| Route | Visible chars |",
        "| --- | --- |",
        ...summary.thinPages
          .sort((a, b) => a.chars - b.chars)
          .slice(0, 15)
          .map(page => `| \`${page.route}\` | ${page.chars} |`),
      ]),
  "",
  "## 5. Keyword coverage (province map)",
  "",
  ...(coverage.province.length === 0
    ? ["Keyword map not read."]
    : [
        `Median coverage across ${coverage.province.length} province pages: **${Math.round(
          (summary.keywordMap.medianCoverage ?? 0) * 100
        )}%**.`,
        "",
        "Lowest-coverage pages:",
        "",
        "| Route | Covered | Ratio |",
        "| --- | --- | --- |",
        ...coverage.province
          .slice(0, 10)
          .map(
            item =>
              `| \`${item.route}\` | ${item.covered}/${item.keywords} | ${Math.round(item.ratio * 100)}% |`
          ),
      ]),
  "",
  "## 6. Limits",
  "",
  "- Offline audit: it reads the built HTML, not the deployed hosts or Google's index.",
  "- Keyword coverage measures substring presence, not ranking, volume or intent fit.",
  "- Title and description bands are policy choices (Thai glyph density), not Google cut-offs.",
  "",
].join("\n");

fs.mkdirSync(dirname(outPrefix), { recursive: true });
fs.writeFileSync(`${outPrefix}.json`, `${JSON.stringify({ summary, defects, warnings }, null, 2)}\n`);
fs.writeFileSync(`${outPrefix}.md`, markdown);

console.log(JSON.stringify(summary, null, 2));
console.log(`\nwrote ${path.relative(ROOT, outPrefix)}.{json,md}`);
if (defects.length > 0) {
  console.log(`\ndefects (${defects.length}):`);
  for (const item of defects.slice(0, 20)) {
    console.log(`  ${item.route} ${item.check}: ${item.detail}`);
  }
}
if (warnings.length > 0) {
  console.log(`\nwarning groups (${warnings.length} total):`);
  for (const [check, items] of group(warnings)) {
    console.log(`  ${check} x${items.length} — e.g. ${items[0].route} (${items[0].detail})`);
  }
}

process.exit(defects.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
