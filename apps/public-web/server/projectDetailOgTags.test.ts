import { describe, expect, it } from "vitest";
import { getPageMeta, injectOgTags } from "./ogTags";

describe("project detail server metadata", () => {
  it("returns detail metadata for a known project without numeric claims", () => {
    const meta = getPageMeta("/projects/holatel-rim-nan");

    expect(meta.title).toContain("โรงแรมโฮลาเทล");
    expect(meta.description).toContain("ผลงานติดตั้ง Solar Rooftop");
    expect(meta.description).not.toContain("ริมน่าน");
    expect(meta.description).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:kWp|kWh|%|ปี)\b/i);
  });

  it("injects the detail canonical URL into crawler HTML", () => {
    const html =
      '<html><head><title>Fixture</title><meta name="description" content="Fixture" /><link rel="canonical" href="https://example.invalid/" /></head><body></body></html>';
    const result = injectOgTags(
      html,
      "/projects/ruenphae-royal-park",
      "https://www.sirinx.co",
    );

    expect(result).toContain("โรงแรมเรือนแพ รอยัลปาร์ค");
    expect(result).toContain(
      'href="https://www.sirinx.co/projects/ruenphae-royal-park/"',
    );
  });

  it("does not create metadata for the withheld private project", () => {
    const meta = getPageMeta("/projects/supalai-private-residential");

    expect(meta.title).not.toContain("ศุภาลัย");
    expect(meta.description).not.toContain("หมู่บ้านศุภาลัย");
    expect(meta.noindex).toBe(true);
  });

  it("keeps unknown project slugs out of crawler indexes", () => {
    const meta = getPageMeta("/projects/not-a-project");

    expect(meta.noindex).toBe(true);
    expect(meta.title).not.toContain("not-a-project");
  });
});
