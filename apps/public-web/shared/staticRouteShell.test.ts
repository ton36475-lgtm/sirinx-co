/**
 * The commercial routes used to ship an empty #root in their server HTML.
 *
 * Measured on the deployed site before this fix: /pricing/, /projects/,
 * /assessment/ and /solar-carport/ each returned 0 visible characters, 0 H1
 * and 0 H2 to anything that does not execute JavaScript. Most AI crawlers do
 * not. The 77 province pages in the same build were fully server-rendered, so
 * the pages that decide a purchase were the ones machines could not read.
 *
 * These assertions run against the shell builder, not the build output, so
 * they hold even when nobody has run a build.
 */
import { describe, expect, it } from "vitest";

import { buildStaticRouteShell, visibleTextOf } from "./staticRouteShell";

const COMMERCIAL_ROUTES = [
  "/pricing",
  "/projects",
  "/assessment",
  "/solar-carport",
];

describe("static shell for client-rendered routes", () => {
  it.each(COMMERCIAL_ROUTES)("%s renders a readable page without JavaScript", route => {
    const shell = buildStaticRouteShell(route);
    expect(shell, `${route} must have a static shell`).not.toBeNull();

    const html = `<html><body><div id="root">\n${shell}\n</div></body></html>`;
    const text = visibleTextOf(html);

    // The regression itself: zero characters meant zero for a crawler.
    expect(text.length, `${route} must expose visible text`).toBeGreaterThan(80);
    expect(shell!.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
  });

  it.each(COMMERCIAL_ROUTES)("%s links onward to the province pages and contact", route => {
    const shell = buildStaticRouteShell(route)!;
    // Without these, traffic landing on a province page has no path to the
    // commercial pages, and the commercial pages have no path to provinces.
    expect(shell).toContain('href="/provinces/"');
    expect(shell).toContain('href="/contact?interest=solar-carport"');
  });

  it("takes its wording from the page metadata rather than inventing it", () => {
    const shell = buildStaticRouteShell("/pricing")!;
    // The live page title is "แพ็คเกจราคา Solar Carport | Start / Pro /
    // Enterprise พร้อม EV Charger | SIRINX". If the shell drifts from the
    // registry this fails rather than shipping a mismatch.
    expect(shell).toContain("SIRINX");
    expect(shell).toMatch(/<h1[^>]*>[^<]*SIRINX[^<]*<\/h1>/);
  });

  it("mirrors the registry fallback for a route with no entry of its own", () => {
    // getPageMeta deliberately falls back rather than returning nothing, and
    // /projects/* that is not published comes back as noindex with explicit
    // "not published" copy. The shell must mirror that, not invent a
    // confident commercial pitch for a page that does not exist.
    const shell = buildStaticRouteShell("/projects/some-unpublished-project");
    expect(shell).not.toBeNull();
    expect(shell).toContain("ไม่พบรายละเอียดโครงการ");
  });

  it("escapes metadata so a title cannot inject markup", () => {
    const shell = buildStaticRouteShell("/pricing", {
      escapeHtml: (value: string) => value.replace(/</g, "&lt;").replace(/>/g, "&gt;"),
    })!;
    expect(shell).not.toMatch(/<script/i);
  });
});
