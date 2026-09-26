/**
 * Prerender coverage — real pages must exist as files so deep links never fall
 * into a soft-404, while noindex pages stay out of the sitemap.
 *
 * See docs/seo/TECHNICAL_SEO_FIX_PACK_20260926.md §4.
 */
import { describe, it, expect } from "vitest";
import {
  getPageMeta,
  getSitemapRoutes,
  getStaticSeoRoutes,
} from "./ogTags";
import {
  getAllProjectDetailSlugs,
  getIndexableProjectSlugs,
} from "../shared/publicProjectContent";
import { blogPosts } from "../client/src/lib/blogData";

describe("prerender coverage — no soft-404 for real pages", () => {
  it("prerenders every project detail page", () => {
    const routes = getStaticSeoRoutes();
    const slugs = getAllProjectDetailSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      expect(routes).toContain(`/projects/${slug}`);
    }
  });

  it("prerenders every blog post", () => {
    const routes = getStaticSeoRoutes();
    expect(blogPosts.length).toBeGreaterThan(0);
    for (const post of blogPosts) {
      expect(routes).toContain(`/blog/${post.slug}`);
    }
  });

  it("keeps non-indexable project pages prerendered but out of the sitemap", () => {
    const sitemap = getSitemapRoutes(getStaticSeoRoutes());
    const indexable = getIndexableProjectSlugs();
    for (const slug of getAllProjectDetailSlugs()) {
      const route = `/projects/${slug}`;
      if (indexable.includes(slug)) {
        expect(sitemap).toContain(route);
      } else {
        expect(sitemap).not.toContain(route);
        expect(getPageMeta(route).noindex).toBe(true);
      }
    }
  });

  it("lists every blog post in the sitemap", () => {
    const sitemap = getSitemapRoutes(getStaticSeoRoutes());
    for (const post of blogPosts) {
      expect(sitemap).toContain(`/blog/${post.slug}`);
    }
  });

  it("never lists a noindex route in the sitemap", () => {
    for (const route of getSitemapRoutes(getStaticSeoRoutes())) {
      expect(getPageMeta(route).noindex).toBeFalsy();
    }
  });
});
