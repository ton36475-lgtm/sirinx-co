import { describe, expect, it } from "vitest";
import { absoluteUrl, getSeoMeta } from "../lib/seo";
import { thaiProvinces } from "@shared/thaiProvinces";

describe("client SEO metadata", () => {
  it("keeps the Home Solution route indexable after client hydration", () => {
    const meta = getSeoMeta("/home-solution/");

    expect(meta.path).toBe("/home-solution");
    expect(meta.title).toContain("Home Solar Solution");
    expect(meta.description).toContain("บ้านขนาดใหญ่");
    expect(meta.noindex).toBeUndefined();
    expect(absoluteUrl(meta.path)).toBe("https://www.sirinx.co/home-solution/");
  });

  it("marks unknown routes as noindex", () => {
    expect(getSeoMeta("/missing-route").noindex).toBe(true);
  });

  it("keeps every province Solar Carport route indexable after client hydration", () => {
    for (const province of thaiProvinces) {
      const meta = getSeoMeta(`/solar-carport/${province.slug}/`);

      expect(meta.path).toBe(`/solar-carport/${province.slug}`);
      expect(meta.title).toContain(province.nameTh);
      expect(meta.description).toContain(province.nameTh);
      expect(meta.noindex).toBeUndefined();
      expect(absoluteUrl(meta.path)).toBe(
        `https://www.sirinx.co/solar-carport/${province.slug}/`
      );
    }
  });

  it("marks unknown province slugs as noindex", () => {
    expect(getSeoMeta("/solar-carport/not-a-province").noindex).toBe(true);
  });
});
