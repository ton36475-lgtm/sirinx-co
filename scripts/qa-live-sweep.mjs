#!/usr/bin/env node
/**
 * Live QA sweep for the two public sites (www.sirinx.co / www.sirinx.org).
 *
 * The deploy receipts prove the deploy itself; this measures the surfaces the
 * shared QA plan named — every one of the 77 province pages, the lead form
 * endpoint, SEO/schema integrity, and the mobile surface — on both hosts.
 *
 *   node scripts/qa-live-sweep.mjs                 # sweep both hosts
 *   node scripts/qa-live-sweep.mjs --host www.sirinx.co
 *   node scripts/qa-live-sweep.mjs --json out.json # write the full receipt
 *
 * Exits non-zero when any required check fails. Warnings do not fail the run.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const jsonIndex = args.indexOf("--json");
const jsonPath = jsonIndex >= 0 ? args[jsonIndex + 1] : null;
const hostIndex = args.indexOf("--host");
const HOSTS = hostIndex >= 0 ? [args[hostIndex + 1]] : ["www.sirinx.co", "www.sirinx.org"];

const CONCURRENCY = 8;
const TIMEOUT = 20000;
const SITE_OG_CARD = "/assets/optimized/sirinx-og-card-1200x630.jpg";

// www.sirinx.org is a permanent redirect to the canonical www.sirinx.co host by
// decision (reports/runtime/public-web-design-and-domain-20261030.md). It is no
// longer a standalone site, so the standalone robots/sitemap/canonical/og:image
// checks below do not apply to it. What must hold for a redirect host is the
// 301 itself, on the root and on a sampled deep path.
const REDIRECT_HOSTS = Object.freeze({
  "www.sirinx.org": "https://www.sirinx.co",
});


const defects = [];
const warnings = [];
const checks = [];
function fail(host, url, check, detail) {
  defects.push({ host, url, check, detail });
}
function warn(host, url, check, detail) {
  warnings.push({ host, url, check, detail });
}
function pass(host, url, check, detail) {
  checks.push({ host, url, check, detail });
}

async function fetchText(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
  const text = await res.text();
  return { res, text };
}

// Slugs come from the same file the build reads, so a sweep can never test a
// province list that differs from the one that was deployed.
const provinceSource = readFileSync(
  join(ROOT, "apps/public-web/shared/thaiProvinces.ts"),
  "utf8"
);
const PROVINCE_SLUGS = [...provinceSource.matchAll(/slug:\s*"([a-z-]+)"/g)].map((m) => m[1]);

const CORE_ROUTES = [
  "/",
  "/solar-carport/",
  "/provinces/",
  "/home-solution/",
  "/pricing/",
  "/projects/",
  "/assessment/",
  "/contact/",
  "/solutions/",
  "/industries/",
  "/investment/",
  "/strategy/",
  "/blog/",
  "/about/",
  "/line/",
  "/partner/",
  "/privacy/",
  "/terms/",
  "/cookies/",
];

function metaContent(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => m[1]
  );
}

async function checkPage(host, path, { expectCanonical, requireSchema = false } = {}) {
  const url = `https://${host}${path}`;
  let res;
  let html;
  try {
    ({ res, text: html } = await fetchText(url));
  } catch (err) {
    fail(host, url, "fetch", String(err?.message ?? err));
    return null;
  }
  if (res.status !== 200) {
    fail(host, url, "status", `expected 200, got ${res.status}`);
    return null;
  }

  // Mobile surface: every page must carry a device-width viewport.
  const viewport = metaContent(
    html,
    /<meta name="viewport" content="([^"]+)"/i
  );
  if (!viewport || !viewport.includes("width=device-width")) {
    fail(host, url, "viewport", `viewport meta = ${JSON.stringify(viewport)}`);
  }
  const themeColor = metaContent(html, /<meta name="theme-color" content="([^"]+)"/i);
  if (!themeColor) warn(host, url, "theme-color", "missing");
  const manifest = metaContent(html, /<link rel="manifest" href="([^"]+)"/i);
  if (!manifest) warn(host, url, "manifest-link", "missing");

  // SEO integrity: title, description, canonical host.
  const title = metaContent(html, /<title>([^<]*)<\/title>/i);
  if (!title || title.length < 8) fail(host, url, "title", JSON.stringify(title));
  const description = metaContent(html, /<meta name="description" content="([^"]*)"/i);
  if (!description || description.length < 30) {
    fail(host, url, "description", JSON.stringify(description?.slice(0, 60)));
  }
  // The corrupted-Thai defect class: any Thai string mangled into a
  // non-word should not reach a live page. ("โรงงาน" contains "รงง", so that
  // sequence is legitimate Thai and must not be used as a marker.)
  if (/โงาน|แลงและ/.test(html)) {
    fail(host, url, "thai-corruption", "found a corrupted Thai sequence");
  }
  const canonical = metaContent(html, /<link rel="canonical" href="([^"]+)"/i);
  if (!canonical) {
    fail(host, url, "canonical", "missing");
  } else {
    const want = expectCanonical ?? url;
    if (canonical !== want) fail(host, url, "canonical", `${canonical} (want ${want})`);
  }

  // og:image must be retrievable from the same host.
  const isProvincePage = /^\/solar-carport\/[a-z-]+\/$/.test(path);
  const ogImage = metaContent(html, /<meta property="og:image" content="([^"]+)"/i);
  if (!ogImage) {
    fail(host, url, "og:image", "missing");
  } else if (!ogImage.startsWith(`https://${host}/`)) {
    fail(host, url, "og:image-host", ogImage);
  } else if (isProvincePage) {
    const slug = path.replace("/solar-carport/", "").replace(/\/$/, "");
    if (!ogImage.endsWith(`/provinces/${slug}-og.jpg`)) {
      fail(host, url, "og:image-province-card", `${ogImage} (want /provinces/${slug}-og.jpg)`);
    }
  } else if (/\/provinces\/[a-z-]+-og\.jpg$/.test(ogImage)) {
    // A province card names one province; a non-province page must not use it
    // as its preview image.
    fail(host, url, "og:image-province-card", ogImage);
  }

  // Long-form province pages are the SEO surface for a no-JS crawler, so the
  // funnel must be present in the raw HTML there. Core routes are a JS-rendered
  // shell by design and are not checked for body links.
  if (isProvincePage) {
    for (const href of ["/pricing/", "/projects/", "/assessment/"]) {
      if (!html.includes(`href="${href}"`)) {
        fail(host, url, "funnel-link", `missing ${href} in raw HTML`);
      }
    }
  }

  // JSON-LD must parse; province pages additionally need their article graph.
  const blocks = jsonLdBlocks(html);
  if (blocks.length === 0) {
    fail(host, url, "json-ld", "no ld+json block");
  } else {
    for (const raw of blocks) {
      try {
        JSON.parse(raw);
      } catch (err) {
        fail(host, url, "json-ld-parse", String(err?.message ?? err));
      }
    }
    if (requireSchema) {
      const types = new Set();
      for (const raw of blocks) {
        try {
          const parsed = JSON.parse(raw);
          const graph = parsed["@graph"] ?? [parsed];
          for (const node of graph) types.add(node["@type"]);
        } catch {
          // parse failure already recorded
        }
      }
      for (const needed of ["Article", "HowTo", "FAQPage", "BreadcrumbList", "Service"]) {
        if (!types.has(needed)) fail(host, url, "schema-type", `missing ${needed}`);
      }
    }
  }

  const csp = res.headers.get("content-security-policy") ?? "";
  if (csp.includes("fonts.googleapis.com") || csp.includes("fonts.gstatic.com")) {
    fail(host, url, "csp-fonts", "third-party font hosts still in CSP");
  }
  for (const gone of ["cloudfront.net", "cdn.example.com"]) {
    if (html.includes(gone)) fail(host, url, "dead-host", gone);
  }
  pass(host, url, "page", `title=${title.slice(0, 40)}`);
  return { html, res };
}

async function checkHost(host) {
  console.log(`\n=== ${host} ===`);

  // A redirect-only host is measured by its 301, not by standalone SEO surfaces.
  if (REDIRECT_HOSTS[host]) {
    const target = REDIRECT_HOSTS[host];
    for (const sample of ["/", "/solar-carport/", "/bess/"]) {
      try {
        const res = await fetch(`https://${host}${sample}`, {
          redirect: "manual",
          signal: AbortSignal.timeout(TIMEOUT),
        });
        const location = res.headers.get("location") ?? "";
        const ok = [301, 308].includes(res.status) && location.includes(new URL(target).host);
        if (!ok) {
          fail(host, sample, "redirect-host", `${res.status} -> ${location} (want 301 -> ${target})`);
        } else {
          pass(host, sample, "redirect-host", `${res.status} -> ${location}`);
        }
      } catch (err) {
        fail(host, sample, "redirect-host", String(err?.message ?? err));
      }
    }
    return;
  }

  // 1. Apex redirect must land on this host's www.
  try {
    const res = await fetch(`https://${host.replace(/^www\./, "")}/`, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const location = res.headers.get("location") ?? "";
    if (![301, 302, 308].includes(res.status) || !location.startsWith(`https://${host}/`)) {
      fail(host, `https://${host.replace(/^www\./, "")}/`, "apex-redirect", `${res.status} -> ${location}`);
    } else {
      pass(host, "apex", "apex-redirect", `${res.status} -> ${location}`);
    }
  } catch (err) {
    fail(host, "apex", "apex-redirect", String(err?.message ?? err));
  }

  // 2. robots/sitemap/llms/feed
  const { res: robotsRes, text: robots } = await fetchText(`https://${host}/robots.txt`);
  if (robotsRes.status !== 200 || !robots.includes(`Sitemap: https://${host}/sitemap.xml`)) {
    fail(host, "/robots.txt", "robots", `${robotsRes.status}; sitemap line wrong host`);
  } else {
    pass(host, "/robots.txt", "robots", "ok");
  }
  for (const bot of ["OAI-SearchBot", "GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended"]) {
    if (!robots.includes(bot)) warn(host, "/robots.txt", "robots-bot", `no rule for ${bot}`);
  }

  const { res: sitemapRes, text: sitemap } = await fetchText(`https://${host}/sitemap.xml`);
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (sitemapRes.status !== 200) {
    fail(host, "/sitemap.xml", "sitemap", `status ${sitemapRes.status}`);
  } else {
    const foreign = sitemapUrls.filter((u) => !u.startsWith(`https://${host}/`));
    if (foreign.length) fail(host, "/sitemap.xml", "sitemap-host", `${foreign.length} foreign URLs`);
    const provinceUrls = sitemapUrls.filter((u) => {
      const m = u.match(/\/solar-carport\/([a-z-]+)\/$/);
      return m ? PROVINCE_SLUGS.includes(m[1]) : false;
    });
    if (provinceUrls.length !== PROVINCE_SLUGS.length) {
      fail(host, "/sitemap.xml", "sitemap-provinces", `${provinceUrls.length} province URLs, want ${PROVINCE_SLUGS.length}`);
    }
    pass(host, "/sitemap.xml", "sitemap", `${sitemapUrls.length} URLs`);
  }

  for (const path of ["/llms.txt", "/feed.xml"]) {
    const res = await fetch(`https://${host}${path}`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (res.status !== 200) fail(host, path, "surface", `status ${res.status}`);
    else pass(host, path, "surface", "200");
  }

  // The site-wide social card must exist on the host that hands it to crawlers.
  for (const card of [SITE_OG_CARD, "/assets/home-solution/home-solution-drone-hero.jpg"]) {
    const res = await fetch(`https://${host}${card}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (res.status !== 200) fail(host, card, "social-card", `status ${res.status}`);
    else pass(host, card, "social-card", "200");
  }

  // 3. Forms: the lead endpoint must answer OPTIONS/POST on both hosts.
  for (const method of ["OPTIONS", "POST"]) {
    const init =
      method === "POST"
        ? {
            method,
            headers: { "content-type": "application/json" },
            body: "{}",
          }
        : { method };
    try {
      const res = await fetch(`https://${host}/api/trpc/lead.submit`, {
        ...init,
        signal: AbortSignal.timeout(TIMEOUT),
      });
      const expect = method === "OPTIONS" ? 204 : 400;
      if (res.status !== expect) {
        fail(host, "/api/trpc/lead.submit", `form-${method}`, `got ${res.status}, want ${expect}`);
      } else {
        const type = res.headers.get("content-type") ?? "";
        if (method === "POST" && !type.includes("application/json")) {
          fail(host, "/api/trpc/lead.submit", "form-content-type", type);
        } else {
          pass(host, `/api/trpc/lead.submit ${method}`, "form", `${res.status}`);
        }
      }
    } catch (err) {
      fail(host, "/api/trpc/lead.submit", `form-${method}`, String(err?.message ?? err));
    }
  }

  // 4. Legacy province redirect
  try {
    const res = await fetch(`https://${host}/solar-carport-bangkok/`, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT),
    });
    // The _redirects rule emits a root-relative Location; both forms land on
    // the same host, which is what matters.
    const location = res.headers.get("location") ?? "";
    const target = `/solar-carport/bangkok/`;
    const ok =
      res.status === 301 &&
      (location.startsWith(target) || location.startsWith(`https://${host}${target}`));
    if (!ok) {
      fail(host, "/solar-carport-bangkok/", "legacy-redirect", `${res.status} -> ${location}`);
    } else {
      pass(host, "legacy", "legacy-redirect", location);
    }
  } catch (err) {
    fail(host, "legacy", "legacy-redirect", String(err?.message ?? err));
  }

  // 5. Unknown path: a real 404, not a soft redirect.
  {
    const res = await fetch(`https://${host}/definitely-not-a-page-${Date.now()}/`, {
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (res.status !== 404) fail(host, "unknown-path", "404", `got ${res.status}`);
    else pass(host, "unknown-path", "404", "404");
  }

  // 6. Core routes
  console.log(`  core routes: ${CORE_ROUTES.length}`);
  await pooled(CORE_ROUTES, CONCURRENCY, (path) => checkPage(host, path));

  // 7. All 77 provinces, plus og:image HEAD per province.
  console.log(`  provinces: ${PROVINCE_SLUGS.length}`);
  await pooled(PROVINCE_SLUGS, CONCURRENCY, async (slug) => {
    const path = `/solar-carport/${slug}/`;
    const result = await checkPage(host, path, { requireSchema: true });
    if (!result) return;
    const ogImage = metaContent(result.html, /<meta property="og:image" content="([^"]+)"/i);
    if (!ogImage) return;
    try {
      const head = await fetch(ogImage, { method: "HEAD", signal: AbortSignal.timeout(TIMEOUT) });
      if (head.status !== 200) fail(host, ogImage, "og:image-fetch", `status ${head.status}`);
    } catch (err) {
      fail(host, ogImage, "og:image-fetch", String(err?.message ?? err));
    }
  });
}

async function pooled(items, size, worker) {
  let index = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

for (const host of HOSTS) {
  await checkHost(host);
}

// Manifest + asset cache checks once per host (they are the same on every page).
for (const host of HOSTS) {
  try {
    const res = await fetch(`https://${host}/manifest.json`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (res.status !== 200) {
      fail(host, "/manifest.json", "manifest", `status ${res.status}`);
    } else {
      const manifest = await res.json();
      if (!manifest.name || !manifest.icons?.length) {
        fail(host, "/manifest.json", "manifest-shape", "missing name or icons");
      } else {
        pass(host, "/manifest.json", "manifest", `${manifest.icons.length} icons`);
      }
    }
    const assetRes = await fetch(`https://${host}/fonts/fonts.css`, { signal: AbortSignal.timeout(TIMEOUT) });
    if (assetRes.status !== 200) fail(host, "/fonts/fonts.css", "fonts", `status ${assetRes.status}`);
    const cc = assetRes.headers.get("cache-control") ?? "";
    if (cc.includes("must-revalidate")) fail(host, "/fonts/fonts.css", "cache-control", cc);
  } catch (err) {
    fail(host, "manifest/assets", "fetch", String(err?.message ?? err));
  }
}

console.log("\n=== สรุป ===");
console.log(`checks passed: ${checks.length}`);
console.log(`warnings:      ${warnings.length}`);
console.log(`defects:       ${defects.length}`);
for (const w of warnings) console.log(`  WARN ${w.host}${w.url} [${w.check}] ${w.detail}`);
for (const d of defects) console.log(`  FAIL ${d.host}${d.url} [${d.check}] ${d.detail}`);

if (jsonPath) {
  writeFileSync(
    jsonPath,
    `${JSON.stringify({ hosts: HOSTS, generatedAt: new Date().toISOString(), checks, warnings, defects }, null, 2)}\n`,
    "utf8"
  );
  console.log(`\nreceipt: ${jsonPath}`);
}

process.exit(defects.length ? 1 : 0);
