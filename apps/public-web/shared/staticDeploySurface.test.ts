/**
 * Guards the static deploy surface against the soft-404 regression.
 *
 * History: `client/public/_redirects` used to be a single catch-all
 * (`/* /index.html 200`), which made every nonexistent URL on www.sirinx.co
 * answer 200 with the SPA shell. Monitoring and crawlers could not see real
 * breakage, and unknown paths became duplicate content. These tests fail if
 * that catch-all comes back or if the honest 404 page disappears.
 *
 * See docs/seo/TECHNICAL_SEO_FIX_PACK_20260926.md.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const PUBLIC_DIR = fileURLToPath(new URL("../client/public/", import.meta.url));

function readHeaders(): string {
  return readFileSync(PUBLIC_DIR + "_headers", "utf8");
}

type HeaderBlock = { pattern: string; headers: string[] };

/** Parse a Cloudflare Pages _headers file into ordered pattern blocks. */
function headerBlocks(source: string): HeaderBlock[] {
  const blocks: HeaderBlock[] = [];
  let current: HeaderBlock | null = null;
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      current = { pattern: line, headers: [] };
      blocks.push(current);
    } else if (current) {
      current.headers.push(line);
    }
  }
  return blocks;
}

function readRedirects(): string {
  return readFileSync(PUBLIC_DIR + "_redirects", "utf8");
}

/** Non-comment, non-empty redirect rules. */
function rules(redirects: string): string[] {
  return redirects
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

describe("deploy surface — no soft-404 catch-all", () => {
  it("has a _redirects file", () => {
    expect(readRedirects().length).toBeGreaterThan(0);
  });

  it("does not rewrite every unknown path to the SPA shell", () => {
    const catchAll = rules(readRedirects()).filter(
      (line) => line.startsWith("/* ") && line.endsWith("/index.html 200"),
    );
    expect(catchAll).toEqual([]);
  });

  it("keeps SPA fallback only for the client-rendered /admin area", () => {
    // /projects/:slug and /blog/:slug are prerendered (server/ogTags.ts), so
    // no fallback may remain for them — unknown slugs must hit the real 404.
    const lines = rules(readRedirects());
    expect(lines.some((line) => line.startsWith("/admin /index.html 200"))).toBe(
      true,
    );
    expect(
      lines.some((line) => line.startsWith("/admin/* /index.html 200")),
    ).toBe(true);
    expect(lines.filter((line) => line.startsWith("/projects"))).toEqual([]);
    expect(lines.filter((line) => line.startsWith("/blog"))).toEqual([]);
  });
});

describe("deploy surface — honest 404", () => {
  it("ships a 404.html at the output root", () => {
    expect(existsSync(PUBLIC_DIR + "404.html")).toBe(true);
  });

  it("marks the 404 page noindex", () => {
    const html = readFileSync(PUBLIC_DIR + "404.html", "utf8");
    expect(html).toMatch(
      /<meta\s+name="robots"\s+content="noindex[^"]*"\s*\/?>/i,
    );
  });

  it("is Thai, says 404, and links back to the site", () => {
    const html = readFileSync(PUBLIC_DIR + "404.html", "utf8");
    expect(html).toContain('lang="th"');
    expect(html).toContain("ไม่พบหน้าที่คุณต้องการ");
    expect(html).toContain('href="/"');
  });
});

describe("deploy surface — no duplicate Cache-Control directives", () => {
  // Cloudflare Pages concatenates every matching _headers rule into one
  // header value. A specific rule that sets Cache-Control while `/*` also
  // sets it produced `max-age=0, must-revalidate, max-age=31536000, immutable`,
  // which RFC 9111 caches treat as stale. A specific rule must detach first.
  const blocks = headerBlocks(readHeaders());
  const globalSetsCache = blocks
    .filter((block) => block.pattern === "/*")
    .some((block) =>
      block.headers.some((h) => /^cache-control:/i.test(h)),
    );

  it("detaches the inherited Cache-Control before overriding it", () => {
    expect(globalSetsCache).toBe(true);
    const overrides = blocks.filter(
      (block) =>
        block.pattern !== "/*" &&
        block.headers.some((h) => /^cache-control:/i.test(h)),
    );
    expect(overrides.length).toBeGreaterThan(0);
    for (const block of overrides) {
      expect(
        block.headers.some((h) => h === "! Cache-Control"),
        `${block.pattern} must detach Cache-Control`,
      ).toBe(true);
    }
  });

  it("gives hashed assets a year and never combines max-age values", () => {
    const assets = blocks.find((block) => block.pattern === "/assets/*");
    expect(assets).toBeDefined();
    const cache = assets!.headers.filter((h) =>
      /^cache-control:/i.test(h),
    );
    expect(cache).toHaveLength(1);
    expect(cache[0]).toContain("max-age=31536000");
    expect(cache[0].match(/max-age=/g)).toHaveLength(1);
  });
});

describe("deploy surface — fonts are self-hosted", () => {
  it("does not reference a third-party font CDN anywhere in the shell", () => {
    const shell = readFileSync(PUBLIC_DIR + "../index.html", "utf8");
    expect(shell).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    expect(shell).toContain('href="/fonts/fonts.css"');
  });

  it("restricts CSP font-src and style-src to self", () => {
    const csp = readHeaders()
      .split("\n")
      .find((line) => /^\s*Content-Security-Policy:/i.test(line));
    expect(csp).toBeDefined();
    expect(csp!).toContain("font-src 'self';");
    expect(csp!).toContain("style-src 'self' 'unsafe-inline';");
    expect(csp!).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });

  it("ships every font file that fonts.css declares", () => {
    const css = readFileSync(PUBLIC_DIR + "fonts/fonts.css", "utf8");
    const declared = [...css.matchAll(/url\('(\/fonts\/[^']+)'\)/g)].map(
      (match) => match[1],
    );
    expect(declared.length).toBeGreaterThan(0);
    for (const path of new Set(declared)) {
      expect(existsSync(PUBLIC_DIR + path.replace(/^\//, ""))).toBe(true);
    }
  });
});
