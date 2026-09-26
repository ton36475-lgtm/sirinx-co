/**
 * Crawl reachability from the homepage, measured on the BUILT output.
 *
 * The prerendered site has no site-wide nav in its static HTML (the nav is a
 * React component), so a crawler that does not execute JavaScript saw a
 * homepage with two links and could not reach a single province page. This
 * walks the real <a href> graph in dist/public and fails if any province page
 * is more than 3 clicks from the homepage.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const DIST_PUBLIC = new URL("../dist/public/", import.meta.url).pathname;
const MAX_CLICKS = 3;

function htmlFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "assets") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(path, out);
    else if (entry.name.endsWith(".html")) out.push(path);
  }
  return out;
}

/** Internal page paths that exist as a real file on disk. */
function crawlTargets(file: string): string[] {
  const html = readFileSync(file, "utf8");
  const targets = new Set<string>();
  for (const match of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const href = match[1].split("#")[0].split("?")[0];
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const path = href.replace(/\/$/, "") || "/";
    const candidate = href.endsWith("/")
      ? join(DIST_PUBLIC, href, "index.html")
      : join(DIST_PUBLIC, href);
    if (existsSync(candidate)) targets.add(path);
  }
  return [...targets];
}

describe("crawl reachability from the homepage", () => {
  it("reaches every province page within 3 clicks", () => {
    const files = htmlFiles(DIST_PUBLIC);
    const start = join(DIST_PUBLIC, "index.html");
    expect(existsSync(start)).toBe(true);

    const depth = new Map<string, number>([["/", 0]]);
    const queue = ["/"];
    while (queue.length) {
      const current = queue.shift()!;
      const file = current === "/" ? start : join(DIST_PUBLIC, current, "index.html");
      if (!existsSync(file)) continue;
      for (const next of crawlTargets(file)) {
        if (depth.has(next)) continue;
        depth.set(next, (depth.get(current) ?? 0) + 1);
        queue.push(next);
      }
    }

    const provinceSlugs = readdirSync(join(DIST_PUBLIC, "solar-carport"), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `/solar-carport/${entry.name}`);

    expect(provinceSlugs.length).toBe(77);

    const unreachable = provinceSlugs.filter((slug) => {
      const clicks = depth.get(slug);
      return clicks === undefined || clicks > MAX_CLICKS;
    });
    expect(
      unreachable,
      `not within ${MAX_CLICKS} clicks: ${unreachable.slice(0, 8).join(", ")}`,
    ).toEqual([]);

    // The homepage must at least expose the hub, or nothing below it is linked.
    expect(depth.get("/provinces")).toBeLessThanOrEqual(2);
  });

  it("gives every province page more than one outbound link", () => {
    const thin: string[] = [];
    for (const slug of readdirSync(join(DIST_PUBLIC, "solar-carport"), {
      withFileTypes: true,
    })) {
      if (!slug.isDirectory()) continue;
      const file = join(DIST_PUBLIC, "solar-carport", slug.name, "index.html");
      if (!existsSync(file)) continue;
      if (crawlTargets(file).length <= 1) thin.push(slug.name);
    }
    expect(thin, `pages with <=1 internal link: ${thin.join(", ")}`).toEqual([]);
  });
});
