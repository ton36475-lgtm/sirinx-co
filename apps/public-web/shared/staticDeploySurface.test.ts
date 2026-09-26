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
